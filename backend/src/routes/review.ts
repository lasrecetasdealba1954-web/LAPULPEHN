import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get reviews for a pulperia
router.get('/pulperia/:pulperiaId', asyncHandler(async (req, res) => {
  const { pulperiaId } = req.params;
  const { page = '1', limit = '10' } = req.query;

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const take = parseInt(limit as string);

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { pulperiaId },
      include: { user: { select: { name: true, photoUrl: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.review.count({ where: { pulperiaId } }),
  ]);

  res.json({
    reviews,
    pagination: {
      page: parseInt(page as string),
      limit: take,
      total,
      pages: Math.ceil(total / take),
    },
  });
}));

// Create or update review
router.post('/pulperia/:pulperiaId', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const { pulperiaId } = req.params;
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    throw new AppError('Rating debe ser entre 1 y 5', 400);
  }

  // Check pulperia exists
  const pulperia = await prisma.pulperia.findUnique({
    where: { id: pulperiaId },
  });

  if (!pulperia) {
    throw new AppError('Pulpería no encontrada', 404);
  }

  // Can't review own pulperia
  if (pulperia.userId === req.user!.id) {
    throw new AppError('No puedes dejar review en tu propia pulpería', 400);
  }

  // Create or update review
  const review = await prisma.review.upsert({
    where: {
      userId_pulperiaId: {
        userId: req.user!.id,
        pulperiaId,
      },
    },
    update: { rating, comment },
    create: {
      userId: req.user!.id,
      pulperiaId,
      rating,
      comment,
    },
    include: { user: { select: { name: true, photoUrl: true } } },
  });

  // Update pulperia rating
  const stats = await prisma.review.aggregate({
    where: { pulperiaId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.pulperia.update({
    where: { id: pulperiaId },
    data: {
      rating: stats._avg.rating || 0,
      totalReviews: stats._count.rating,
    },
  });

  res.json(review);
}));

// Delete review
router.delete('/:id', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  const review = await prisma.review.findFirst({
    where: { id, userId: req.user!.id },
  });

  if (!review) {
    throw new AppError('Review no encontrado', 404);
  }

  await prisma.review.delete({ where: { id } });

  // Update pulperia rating
  const stats = await prisma.review.aggregate({
    where: { pulperiaId: review.pulperiaId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.pulperia.update({
    where: { id: review.pulperiaId },
    data: {
      rating: stats._avg.rating || 0,
      totalReviews: stats._count.rating,
    },
  });

  res.json({ success: true, message: 'Review eliminado' });
}));

export default router;
