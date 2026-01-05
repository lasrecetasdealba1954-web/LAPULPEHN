import { Router, Request, Response } from 'express';
import multer from 'multer';
import { prisma } from '../lib/prisma.js';
import { uploadImage, deleteImage } from '../lib/cloudinary.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { authenticate, requirePulperia, AuthRequest } from '../middleware/auth.js';
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

// Get products (with optional pulperia filter)
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { pulperiaId, category, search, available } = req.query;

  const where: any = {};

  if (pulperiaId) {
    where.pulperiaId = pulperiaId as string;
  }

  if (category) {
    where.category = { contains: category as string, mode: 'insensitive' };
  }

  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { description: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  if (available !== 'false') {
    where.isAvailable = true;
  }

  const products = await prisma.product.findMany({
    where,
    include: {
      pulperia: { select: { id: true, name: true, isOpen: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(products);
}));

// Get single product
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      pulperia: {
        select: {
          id: true,
          name: true,
          address: true,
          phone: true,
          whatsapp: true,
          isOpen: true,
          rating: true,
        },
      },
    },
  });

  if (!product) {
    throw new AppError('Producto no encontrado', 404);
  }

  res.json(product);
}));

// Create product (pulperia only)
router.post('/', authenticate, requirePulperia, upload.single('image'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, description, price, category, stock } = req.body;

  if (!name || !price) {
    throw new AppError('Nombre y precio son requeridos', 400);
  }

  if (!req.file) {
    throw new AppError('Imagen del producto es requerida', 400);
  }

  // Get user's pulperia
  const pulperia = await prisma.pulperia.findUnique({
    where: { userId: req.user!.id },
  });

  if (!pulperia) {
    throw new AppError('No tienes una pulpería registrada', 400);
  }

  // Upload image to cloudinary
  const imageResult = await uploadImage(req.file.buffer, 'products');

  const product = await prisma.product.create({
    data: {
      pulperiaId: pulperia.id,
      name,
      description,
      price: parseFloat(price),
      category,
      stock: stock ? parseInt(stock) : null,
      imageUrl: imageResult.url,
      imagePublicId: imageResult.publicId,
    },
  });

  res.status(201).json(product);
}));

// Update product
router.patch('/:id', authenticate, requirePulperia, upload.single('image'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, description, price, category, stock, isAvailable } = req.body;

  // Get user's pulperia
  const pulperia = await prisma.pulperia.findUnique({
    where: { userId: req.user!.id },
  });

  if (!pulperia) {
    throw new AppError('No tienes una pulpería registrada', 400);
  }

  // Verify ownership
  const product = await prisma.product.findFirst({
    where: { id, pulperiaId: pulperia.id },
  });

  if (!product) {
    throw new AppError('Producto no encontrado', 404);
  }

  let imageUrl = product.imageUrl;
  let imagePublicId = product.imagePublicId;

  if (req.file) {
    // Delete old image if exists
    if (product.imagePublicId) {
      await deleteImage(product.imagePublicId);
    }
    // Upload new image
    const result = await uploadImage(req.file.buffer, 'products');
    imageUrl = result.url;
    imagePublicId = result.publicId;
  }

  const updated = await prisma.product.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(price && { price: parseFloat(price) }),
      ...(category !== undefined && { category }),
      ...(stock !== undefined && { stock: stock ? parseInt(stock) : null }),
      ...(isAvailable !== undefined && { isAvailable: isAvailable === 'true' || isAvailable === true }),
      imageUrl,
      imagePublicId,
    },
  });

  res.json(updated);
}));

// Delete product
router.delete('/:id', authenticate, requirePulperia, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  // Get user's pulperia
  const pulperia = await prisma.pulperia.findUnique({
    where: { userId: req.user!.id },
  });

  if (!pulperia) {
    throw new AppError('No tienes una pulpería registrada', 400);
  }

  // Verify ownership
  const product = await prisma.product.findFirst({
    where: { id, pulperiaId: pulperia.id },
  });

  if (!product) {
    throw new AppError('Producto no encontrado', 404);
  }

  // Delete image from cloudinary
  if (product.imagePublicId) {
    await deleteImage(product.imagePublicId);
  }

  await prisma.product.delete({ where: { id } });

  res.json({ success: true, message: 'Producto eliminado' });
}));

export default router;
