import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { authenticate, requirePulperia, AuthRequest } from '../middleware/auth.js';
import { sendPushNotification } from '../lib/webpush.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Generate order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = uuidv4().split('-')[0].toUpperCase();
  return `LP-${timestamp}-${random}`;
};

// Send notification to pulperia owner
const notifyPulperia = async (pulperiaId: string, notification: any) => {
  const pulperia = await prisma.pulperia.findUnique({
    where: { id: pulperiaId },
    include: {
      user: {
        include: {
          pushSubscriptions: true,
        },
      },
    },
  });

  if (pulperia?.user.pushSubscriptions) {
    for (const sub of pulperia.user.pushSubscriptions) {
      await sendPushNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        notification
      );
    }
  }
};

// Send notification to customer
const notifyCustomer = async (customerId: string, notification: any) => {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: customerId },
  });

  for (const sub of subscriptions) {
    await sendPushNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      notification
    );
  }
};

// Get orders for customer
router.get('/my-orders', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const orders = await prisma.order.findMany({
    where: { customerId: req.user!.id },
    include: {
      pulperia: { select: { id: true, name: true, address: true, phone: true } },
      items: { include: { product: { select: { name: true, imageUrl: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(orders);
}));

// Get orders for pulperia
router.get('/pulperia-orders', authenticate, requirePulperia, asyncHandler(async (req: AuthRequest, res) => {
  const pulperia = await prisma.pulperia.findUnique({
    where: { userId: req.user!.id },
  });

  if (!pulperia) {
    throw new AppError('No tienes una pulpería registrada', 400);
  }

  const { status, from, to } = req.query;

  const where: any = { pulperiaId: pulperia.id };

  if (status) {
    where.status = status;
  }

  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from as string);
    if (to) where.createdAt.lte = new Date(to as string);
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      customer: { select: { name: true, phone: true } },
      items: { include: { product: { select: { name: true, imageUrl: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(orders);
}));

// Get single order
router.get('/:id', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      pulperia: { select: { id: true, name: true, address: true, phone: true, whatsapp: true } },
      items: { include: { product: true } },
    },
  });

  if (!order) {
    throw new AppError('Orden no encontrada', 404);
  }

  // Verify access
  const pulperia = await prisma.pulperia.findUnique({
    where: { userId: req.user!.id },
  });

  if (order.customerId !== req.user!.id && pulperia?.id !== order.pulperiaId) {
    throw new AppError('No autorizado', 403);
  }

  res.json(order);
}));

// Create order (can include items from multiple pulperias)
router.post('/', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const { items, customerPhone, customerNote } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new AppError('Items requeridos', 400);
  }

  if (!customerPhone) {
    throw new AppError('Teléfono de contacto requerido', 400);
  }

  // Group items by pulperia
  const productIds = items.map((item: any) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { pulperia: true },
  });

  const productMap = new Map(products.map(p => [p.id, p]));

  // Group by pulperia
  const ordersByPulperia = new Map<string, { pulperiaId: string; items: any[] }>();

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) {
      throw new AppError(`Producto ${item.productId} no encontrado`, 404);
    }
    if (!product.isAvailable) {
      throw new AppError(`Producto ${product.name} no disponible`, 400);
    }
    if (!product.pulperia.isOpen) {
      throw new AppError(`La pulpería ${product.pulperia.name} está cerrada`, 400);
    }

    const pulperiaId = product.pulperiaId;
    if (!ordersByPulperia.has(pulperiaId)) {
      ordersByPulperia.set(pulperiaId, { pulperiaId, items: [] });
    }
    ordersByPulperia.get(pulperiaId)!.items.push({
      productId: product.id,
      quantity: item.quantity,
      price: product.price,
      subtotal: product.price * item.quantity,
    });
  }

  // Create orders for each pulperia
  const createdOrders = [];

  for (const [pulperiaId, orderData] of ordersByPulperia) {
    const totalAmount = orderData.items.reduce((sum, item) => sum + item.subtotal, 0);

    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        customerId: req.user!.id,
        pulperiaId,
        totalAmount,
        customerPhone,
        customerNote,
        items: {
          create: orderData.items,
        },
      },
      include: {
        pulperia: { select: { name: true } },
        items: { include: { product: { select: { name: true } } } },
      },
    });

    createdOrders.push(order);

    // Notify pulperia
    await notifyPulperia(pulperiaId, {
      title: '¡Nueva orden!',
      body: `Tienes una nueva orden #${order.orderNumber} por L${totalAmount.toFixed(2)}`,
      tag: `order-${order.id}`,
      data: { orderId: order.id, type: 'new_order' },
    });
  }

  res.status(201).json({
    success: true,
    orders: createdOrders,
  });
}));

// Accept order
router.post('/:id/accept', authenticate, requirePulperia, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  const pulperia = await prisma.pulperia.findUnique({
    where: { userId: req.user!.id },
  });

  if (!pulperia) {
    throw new AppError('No tienes una pulpería registrada', 400);
  }

  const order = await prisma.order.findFirst({
    where: { id, pulperiaId: pulperia.id, status: 'PENDING' },
  });

  if (!order) {
    throw new AppError('Orden no encontrada o ya procesada', 404);
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { status: 'ACCEPTED', acceptedAt: new Date() },
  });

  // Notify customer
  await notifyCustomer(order.customerId, {
    title: 'Orden aceptada',
    body: `Tu orden #${order.orderNumber} ha sido aceptada y está siendo preparada`,
    tag: `order-${order.id}`,
    data: { orderId: order.id, type: 'order_accepted' },
  });

  res.json(updated);
}));

// Mark order as ready
router.post('/:id/ready', authenticate, requirePulperia, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  const pulperia = await prisma.pulperia.findUnique({
    where: { userId: req.user!.id },
  });

  if (!pulperia) {
    throw new AppError('No tienes una pulpería registrada', 400);
  }

  const order = await prisma.order.findFirst({
    where: { id, pulperiaId: pulperia.id, status: 'ACCEPTED' },
    include: { pulperia: { select: { name: true, address: true } } },
  });

  if (!order) {
    throw new AppError('Orden no encontrada o no está en preparación', 404);
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { status: 'READY', readyAt: new Date() },
  });

  // Notify customer
  await notifyCustomer(order.customerId, {
    title: '¡Tu orden está lista!',
    body: `Tu orden #${order.orderNumber} está lista para recoger en ${order.pulperia.name}`,
    tag: `order-${order.id}`,
    data: { orderId: order.id, type: 'order_ready' },
  });

  res.json(updated);
}));

// Mark order as delivered
router.post('/:id/delivered', authenticate, requirePulperia, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  const pulperia = await prisma.pulperia.findUnique({
    where: { userId: req.user!.id },
  });

  if (!pulperia) {
    throw new AppError('No tienes una pulpería registrada', 400);
  }

  const order = await prisma.order.findFirst({
    where: { id, pulperiaId: pulperia.id, status: 'READY' },
  });

  if (!order) {
    throw new AppError('Orden no encontrada o no está lista', 404);
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { status: 'DELIVERED', deliveredAt: new Date() },
  });

  // Notify customer
  await notifyCustomer(order.customerId, {
    title: 'Orden entregada',
    body: `Tu orden #${order.orderNumber} ha sido entregada. ¡Gracias por tu compra!`,
    tag: `order-${order.id}`,
    data: { orderId: order.id, type: 'order_delivered' },
  });

  res.json(updated);
}));

// Cancel order
router.post('/:id/cancel', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { pulperia: { select: { userId: true, name: true } } },
  });

  if (!order) {
    throw new AppError('Orden no encontrada', 404);
  }

  // Check authorization (customer or pulperia owner can cancel)
  const isPulperiaOwner = order.pulperia.userId === req.user!.id;
  const isCustomer = order.customerId === req.user!.id;

  if (!isPulperiaOwner && !isCustomer) {
    throw new AppError('No autorizado', 403);
  }

  // Can only cancel pending or accepted orders
  if (!['PENDING', 'ACCEPTED'].includes(order.status)) {
    throw new AppError('Esta orden no puede ser cancelada', 400);
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
  });

  // Notify the other party
  if (isPulperiaOwner) {
    await notifyCustomer(order.customerId, {
      title: 'Orden cancelada',
      body: `Tu orden #${order.orderNumber} en ${order.pulperia.name} ha sido cancelada${reason ? `: ${reason}` : ''}`,
      tag: `order-${order.id}`,
      data: { orderId: order.id, type: 'order_cancelled' },
    });
  } else {
    // Get pulperia owner
    const pulperiaOwner = await prisma.user.findUnique({
      where: { id: order.pulperia.userId },
      include: { pushSubscriptions: true },
    });
    if (pulperiaOwner) {
      for (const sub of pulperiaOwner.pushSubscriptions) {
        await sendPushNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          {
            title: 'Orden cancelada',
            body: `La orden #${order.orderNumber} ha sido cancelada por el cliente`,
            tag: `order-${order.id}`,
            data: { orderId: order.id, type: 'order_cancelled' },
          }
        );
      }
    }
  }

  res.json(updated);
}));

export default router;
