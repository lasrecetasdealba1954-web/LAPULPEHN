import { Router } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import '../lib/firebase.js';

const router = Router();

// Register or login user with Firebase token
router.post('/login', asyncHandler(async (req: AuthRequest, res) => {
  const { idToken, userType } = req.body;

  if (!idToken) {
    throw new AppError('Token requerido', 400);
  }

  // Verify Firebase token
  const decodedToken = await getAuth().verifyIdToken(idToken);

  // Check if user exists
  let user = await prisma.user.findUnique({
    where: { firebaseUid: decodedToken.uid },
    include: { pulperia: true },
  });

  if (!user) {
    // Create new user
    user = await prisma.user.create({
      data: {
        firebaseUid: decodedToken.uid,
        email: decodedToken.email || '',
        name: decodedToken.name || decodedToken.email?.split('@')[0] || 'Usuario',
        photoUrl: decodedToken.picture,
        userType: userType === 'PULPERIA' ? 'PULPERIA' : 'CUSTOMER',
      },
      include: { pulperia: true },
    });
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      photoUrl: user.photoUrl,
      userType: user.userType,
      pulperia: user.pulperia,
    },
  });
}));

// Get current user
router.get('/me', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { pulperia: true },
  });

  if (!user) {
    throw new AppError('Usuario no encontrado', 404);
  }

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    photoUrl: user.photoUrl,
    phone: user.phone,
    userType: user.userType,
    pulperia: user.pulperia,
  });
}));

// Update user profile
router.patch('/me', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const { name, phone } = req.body;

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      ...(name && { name }),
      ...(phone && { phone }),
    },
  });

  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
    },
  });
}));

// Switch user type (customer to pulperia or vice versa)
router.post('/switch-type', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const { userType } = req.body;

  if (!['CUSTOMER', 'PULPERIA'].includes(userType)) {
    throw new AppError('Tipo de usuario inválido', 400);
  }

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: { userType },
    include: { pulperia: true },
  });

  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      userType: user.userType,
      pulperia: user.pulperia,
    },
  });
}));

// Delete account and download data
router.delete('/me', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const { downloadData } = req.query;

  const userId = req.user!.id;

  if (downloadData === 'true') {
    // Get all user data
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        pulperia: {
          include: {
            products: true,
            orders: { include: { items: true } },
            reviews: true,
            jobs: { include: { applications: true } },
          },
        },
        orders: { include: { items: true } },
        reviews: true,
        jobApplications: true,
        serviceCatalogs: { include: { images: true } },
      },
    });

    // Delete user
    await prisma.user.delete({ where: { id: userId } });

    return res.json({
      success: true,
      message: 'Cuenta eliminada',
      data: userData,
    });
  }

  // Just delete without data
  await prisma.user.delete({ where: { id: userId } });

  res.json({
    success: true,
    message: 'Cuenta eliminada',
  });
}));

export default router;
