import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get VAPID public key for push notifications
router.get('/vapid-key', (req, res) => {
  res.json({
    publicKey: process.env.VAPID_PUBLIC_KEY || '',
  });
});

// Subscribe to push notifications
router.post('/subscribe', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const { endpoint, keys } = req.body;

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    throw new AppError('Datos de suscripción inválidos', 400);
  }

  // Upsert subscription
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: {
      p256dh: keys.p256dh,
      auth: keys.auth,
      userId: req.user!.id,
    },
    create: {
      userId: req.user!.id,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
  });

  res.json({ success: true, message: 'Suscripción guardada' });
}));

// Unsubscribe from push notifications
router.post('/unsubscribe', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const { endpoint } = req.body;

  if (!endpoint) {
    throw new AppError('Endpoint requerido', 400);
  }

  await prisma.pushSubscription.deleteMany({
    where: { endpoint, userId: req.user!.id },
  });

  res.json({ success: true, message: 'Suscripción eliminada' });
}));

// Get user's subscriptions
router.get('/subscriptions', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: req.user!.id },
    select: { endpoint: true, createdAt: true },
  });

  res.json(subscriptions);
}));

export default router;
