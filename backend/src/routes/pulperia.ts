import { Router } from 'express';
import multer from 'multer';
import { prisma } from '../lib/prisma.js';
import { uploadImage, deleteImage } from '../lib/cloudinary.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { authenticate, requirePulperia, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Configure multer for image uploads (max 10MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'));
    }
  },
});

// Get all pulperias (with filters)
router.get('/', asyncHandler(async (req: AuthRequest, res) => {
  const { lat, lng, radius, search } = req.query;

  let where: any = { isActive: true };

  // Filter by location if provided
  if (lat && lng && radius) {
    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);
    const radiusKm = parseFloat(radius as string);

    // Approximate bounding box
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos(latitude * (Math.PI / 180)));

    where = {
      ...where,
      latitude: {
        gte: latitude - latDelta,
        lte: latitude + latDelta,
      },
      longitude: {
        gte: longitude - lngDelta,
        lte: longitude + lngDelta,
      },
    };
  }

  // Search by name
  if (search) {
    where.name = { contains: search as string, mode: 'insensitive' };
  }

  const pulperias = await prisma.pulperia.findMany({
    where,
    include: {
      user: { select: { name: true } },
      _count: { select: { products: true, reviews: true } },
    },
    orderBy: { rating: 'desc' },
  });

  res.json(pulperias);
}));

// Get single pulperia
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const pulperia = await prisma.pulperia.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, photoUrl: true } },
      products: { where: { isAvailable: true }, orderBy: { createdAt: 'desc' } },
      reviews: {
        include: { user: { select: { name: true, photoUrl: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      _count: { select: { products: true, reviews: true, orders: true } },
    },
  });

  if (!pulperia) {
    throw new AppError('Pulpería no encontrada', 404);
  }

  res.json(pulperia);
}));

// Create pulperia (requires auth and customer type switches to pulperia)
router.post('/', authenticate, upload.single('image'), asyncHandler(async (req: AuthRequest, res) => {
  const { name, description, address, latitude, longitude, phone, whatsapp } = req.body;

  if (!name || !address || !latitude || !longitude) {
    throw new AppError('Nombre, dirección y ubicación son requeridos', 400);
  }

  // Check if user already has a pulperia
  const existingPulperia = await prisma.pulperia.findUnique({
    where: { userId: req.user!.id },
  });

  if (existingPulperia) {
    throw new AppError('Ya tienes una pulpería registrada', 400);
  }

  let imageUrl = null;

  if (req.file) {
    const result = await uploadImage(req.file.buffer, 'pulperias');
    imageUrl = result.url;
  }

  // Create pulperia and update user type
  const [pulperia] = await prisma.$transaction([
    prisma.pulperia.create({
      data: {
        userId: req.user!.id,
        name,
        description,
        address,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        phone,
        whatsapp,
        imageUrl,
      },
    }),
    prisma.user.update({
      where: { id: req.user!.id },
      data: { userType: 'PULPERIA' },
    }),
  ]);

  res.status(201).json(pulperia);
}));

// Update pulperia
router.patch('/:id', authenticate, requirePulperia, upload.single('image'), asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { name, description, address, latitude, longitude, phone, whatsapp, isOpen } = req.body;

  // Verify ownership
  const pulperia = await prisma.pulperia.findFirst({
    where: { id, userId: req.user!.id },
  });

  if (!pulperia) {
    throw new AppError('Pulpería no encontrada o no autorizado', 404);
  }

  let imageUrl = pulperia.imageUrl;

  if (req.file) {
    const result = await uploadImage(req.file.buffer, 'pulperias');
    imageUrl = result.url;
  }

  const updated = await prisma.pulperia.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(address && { address }),
      ...(latitude && { latitude: parseFloat(latitude) }),
      ...(longitude && { longitude: parseFloat(longitude) }),
      ...(phone !== undefined && { phone }),
      ...(whatsapp !== undefined && { whatsapp }),
      ...(isOpen !== undefined && { isOpen: isOpen === 'true' || isOpen === true }),
      ...(imageUrl && { imageUrl }),
    },
  });

  res.json(updated);
}));

// Delete pulperia (close business)
router.delete('/:id', authenticate, requirePulperia, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { downloadData } = req.query;

  // Verify ownership
  const pulperia = await prisma.pulperia.findFirst({
    where: { id, userId: req.user!.id },
  });

  if (!pulperia) {
    throw new AppError('Pulpería no encontrada o no autorizado', 404);
  }

  if (downloadData === 'true') {
    // Get all pulperia data
    const data = await prisma.pulperia.findUnique({
      where: { id },
      include: {
        products: true,
        orders: { include: { items: true, customer: { select: { name: true, email: true } } } },
        reviews: { include: { user: { select: { name: true } } } },
        jobs: { include: { applications: true } },
      },
    });

    // Soft delete by setting isActive to false
    await prisma.pulperia.update({
      where: { id },
      data: { isActive: false },
    });

    // Update user type back to customer
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { userType: 'CUSTOMER' },
    });

    return res.json({
      success: true,
      message: 'Pulpería cerrada',
      data,
    });
  }

  // Soft delete without data
  await prisma.pulperia.update({
    where: { id },
    data: { isActive: false },
  });

  await prisma.user.update({
    where: { id: req.user!.id },
    data: { userType: 'CUSTOMER' },
  });

  res.json({
    success: true,
    message: 'Pulpería cerrada',
  });
}));

// Get share link
router.get('/:id/share', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const pulperia = await prisma.pulperia.findUnique({
    where: { id },
    select: { id: true, name: true, description: true },
  });

  if (!pulperia) {
    throw new AppError('Pulpería no encontrada', 404);
  }

  const baseUrl = process.env.FRONTEND_URL || 'https://lapulperiahn.shop';
  const shareUrl = `${baseUrl}/pulperia/${id}`;
  const shareText = `¡Visita ${pulperia.name} en La Pulpería! ${pulperia.description || ''}`;

  res.json({
    url: shareUrl,
    text: shareText,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
  });
}));

export default router;
