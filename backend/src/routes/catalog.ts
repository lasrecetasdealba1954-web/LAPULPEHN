import { Router, Request, Response } from 'express';
import multer, { Multer } from 'multer';
import { prisma } from '../lib/prisma.js';
import { uploadImage, deleteImage } from '../lib/cloudinary.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { AuthRequest } from '../types.ts';  // Importe el nuevo types.ts

const router = Router();

// Configure multer for image uploads (max 10MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req: Request, file: Express.Multer.File, cb: (error: Error | null, acceptFile: boolean) => void) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'), false);
    }
  },
});

// Get all service catalogs (for discovery)
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { profession, search } = req.query;

  const where: any = {};

  if (profession) {
    where.profession = { contains: profession as string, mode: 'insensitive' };
  }

  if (search) {
    where.OR = [
      { profession: { contains: search as string, mode: 'insensitive' } },
      { description: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  const catalogs = await prisma.serviceCatalog.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, photoUrl: true, phone: true } },
      images: { orderBy: { order: 'asc' }, take: 6 },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(catalogs);
}));

// Get user's catalogs
router.get('/my-catalogs', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const catalogs = await prisma.serviceCatalog.findMany({
    where: { userId: req.user!.id },
    include: {
      images: { orderBy: { order: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(catalogs);
}));

// Get single catalog
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const catalog = await prisma.serviceCatalog.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, photoUrl: true, phone: true, email: true } },
      images: { orderBy: { order: 'asc' } },
    },
  });

  if (!catalog) {
    throw new AppError('Catálogo no encontrado', 404);
  }

  res.json(catalog);
}));

// Get catalogs by user
router.get('/user/:userId', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;

  const catalogs = await prisma.serviceCatalog.findMany({
    where: { userId },
    include: {
      user: { select: { id: true, name: true, photoUrl: true, phone: true } },
      images: { orderBy: { order: 'asc' }, take: 6 },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(catalogs);
}));

// Create catalog
router.post('/', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { profession, description } = req.body;

  if (!profession) {
    throw new AppError('Profesión es requerida', 400);
  }

  // Check if user already has a catalog for this profession
  const existing = await prisma.serviceCatalog.findUnique({
    where: {
      userId_profession: { userId: req.user!.id, profession },
    },
  });

  if (existing) {
    throw new AppError('Ya tienes un catálogo para esta profesión', 400);
  }

  const catalog = await prisma.serviceCatalog.create({
    data: {
      userId: req.user!.id,
      profession,
      description,
    },
  });

  res.status(201).json(catalog);
}));

// Update catalog
router.patch('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { description } = req.body;

  const catalog = await prisma.serviceCatalog.findFirst({
    where: { id, userId: req.user!.id },
  });

  if (!catalog) {
    throw new AppError('Catálogo no encontrado', 404);
  }

  const updated = await prisma.serviceCatalog.update({
    where: { id },
    data: { description },
  });

  res.json(updated);
}));

// Delete catalog
router.delete('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const catalog = await prisma.serviceCatalog.findFirst({
    where: { id, userId: req.user!.id },
    include: { images: true },
  });

  if (!catalog) {
    throw new AppError('Catálogo no encontrado', 404);
  }

  // Delete images from cloudinary
  for (const image of catalog.images) {
    if (image.imagePublicId) {
      await deleteImage(image.imagePublicId);
    }
  }

  await prisma.serviceCatalog.delete({ where: { id } });

  res.json({ success: true, message: 'Catálogo eliminado' });
}));

// Add image to catalog (max 6)
router.post('/:id/images', authenticate, upload.single('image'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { description } = req.body;

  const catalog = await prisma.serviceCatalog.findFirst({
    where: { id, userId: req.user!.id },
    include: { images: true },
  });

  if (!catalog) {
    throw new AppError('Catálogo no encontrado', 404);
  }

  if (catalog.images.length >= 6) {
    throw new AppError('Máximo 6 imágenes por catálogo', 400);
  }

  if (!req.file) {
    throw new AppError('Imagen requerida', 400);
  }

  const result = await uploadImage(req.file.buffer, 'catalogs');

  const image = await prisma.serviceCatalogImage.create({
    data: {
      catalogId: id,
      imageUrl: result.url,
      imagePublicId: result.publicId,
      description,
      order: catalog.images.length,
    },
  });

  res.status(201).json(image);
}));

// Update image order or description
router.patch('/:catalogId/images/:imageId', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { catalogId, imageId } = req.params;
  const { description, order } = req.body;

  const catalog = await prisma.serviceCatalog.findFirst({
    where: { id: catalogId, userId: req.user!.id },
  });

  if (!catalog) {
    throw new AppError('Catálogo no encontrado', 404);
  }

  const image = await prisma.serviceCatalogImage.findFirst({
    where: { id: imageId, catalogId },
  });

  if (!image) {
    throw new AppError('Imagen no encontrada', 404);
  }

  const updated = await prisma.serviceCatalogImage.update({
    where: { id: imageId },
    data: {
      ...(description !== undefined && { description }),
      ...(order !== undefined && { order }),
    },
  });

  res.json(updated);
}));

// Delete image from catalog
router.delete('/:catalogId/images/:imageId', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { catalogId, imageId } = req.params;

  const catalog = await prisma.serviceCatalog.findFirst({
    where: { id: catalogId, userId: req.user!.id },
  });

  if (!catalog) {
    throw new AppError('Catálogo no encontrado', 404);
  }

  const image = await prisma.serviceCatalogImage.findFirst({
    where: { id: imageId, catalogId },
  });

  if (!image) {
    throw new AppError('Imagen no encontrada', 404);
  }

  if (image.imagePublicId) {
    await deleteImage(image.imagePublicId);
  }

  await prisma.serviceCatalogImage.delete({ where: { id: imageId } });

  res.json({ success: true, message: 'Imagen eliminada' });
}));

export default router;
