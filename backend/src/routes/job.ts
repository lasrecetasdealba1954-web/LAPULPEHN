import { Router } from 'express';
import multer from 'multer';
import { prisma } from '../lib/prisma.js';
import { uploadImage } from '../lib/cloudinary.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { authenticate, requirePulperia, AuthRequest } from '../middleware/auth.js';
import { sendPushNotification } from '../lib/webpush.js';

const router = Router();

// Configure multer for CV uploads (max 5MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten PDF e imágenes'));
    }
  },
});

// Get all active jobs
router.get('/', asyncHandler(async (req, res) => {
  const { search, pulperiaId } = req.query;

  const where: any = { isActive: true };

  if (search) {
    where.OR = [
      { title: { contains: search as string, mode: 'insensitive' } },
      { description: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  if (pulperiaId) {
    where.pulperiaId = pulperiaId;
  }

  const jobs = await prisma.job.findMany({
    where,
    include: {
      pulperia: { select: { id: true, name: true, address: true, imageUrl: true } },
      _count: { select: { applications: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(jobs);
}));

// Get pulperia's jobs
router.get('/my-jobs', authenticate, requirePulperia, asyncHandler(async (req: AuthRequest, res) => {
  const pulperia = await prisma.pulperia.findUnique({
    where: { userId: req.user!.id },
  });

  if (!pulperia) {
    throw new AppError('No tienes una pulpería registrada', 400);
  }

  const jobs = await prisma.job.findMany({
    where: { pulperiaId: pulperia.id },
    include: {
      applications: {
        include: { user: { select: { id: true, name: true, email: true, phone: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(jobs);
}));

// Get user's job applications
router.get('/my-applications', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const applications = await prisma.jobApplication.findMany({
    where: { userId: req.user!.id },
    include: {
      job: {
        include: { pulperia: { select: { id: true, name: true, address: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(applications);
}));

// Get single job
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      pulperia: { select: { id: true, name: true, address: true, phone: true, imageUrl: true } },
    },
  });

  if (!job) {
    throw new AppError('Trabajo no encontrado', 404);
  }

  res.json(job);
}));

// Create job (pulperia only)
router.post('/', authenticate, requirePulperia, asyncHandler(async (req: AuthRequest, res) => {
  const { title, description, salary } = req.body;

  if (!title || !description) {
    throw new AppError('Título y descripción son requeridos', 400);
  }

  const pulperia = await prisma.pulperia.findUnique({
    where: { userId: req.user!.id },
  });

  if (!pulperia) {
    throw new AppError('No tienes una pulpería registrada', 400);
  }

  const job = await prisma.job.create({
    data: {
      pulperiaId: pulperia.id,
      title,
      description,
      salary,
    },
  });

  res.status(201).json(job);
}));

// Update job
router.patch('/:id', authenticate, requirePulperia, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { title, description, salary, isActive } = req.body;

  const pulperia = await prisma.pulperia.findUnique({
    where: { userId: req.user!.id },
  });

  if (!pulperia) {
    throw new AppError('No tienes una pulpería registrada', 400);
  }

  const job = await prisma.job.findFirst({
    where: { id, pulperiaId: pulperia.id },
  });

  if (!job) {
    throw new AppError('Trabajo no encontrado', 404);
  }

  const updated = await prisma.job.update({
    where: { id },
    data: {
      ...(title && { title }),
      ...(description && { description }),
      ...(salary !== undefined && { salary }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  res.json(updated);
}));

// Delete job
router.delete('/:id', authenticate, requirePulperia, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  const pulperia = await prisma.pulperia.findUnique({
    where: { userId: req.user!.id },
  });

  if (!pulperia) {
    throw new AppError('No tienes una pulpería registrada', 400);
  }

  const job = await prisma.job.findFirst({
    where: { id, pulperiaId: pulperia.id },
  });

  if (!job) {
    throw new AppError('Trabajo no encontrado', 404);
  }

  await prisma.job.delete({ where: { id } });

  res.json({ success: true, message: 'Trabajo eliminado' });
}));

// Apply to job
router.post('/:id/apply', authenticate, upload.single('cv'), asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { message } = req.body;

  const job = await prisma.job.findUnique({
    where: { id },
    include: { pulperia: true },
  });

  if (!job || !job.isActive) {
    throw new AppError('Trabajo no encontrado o no activo', 404);
  }

  // Check if already applied
  const existing = await prisma.jobApplication.findUnique({
    where: { jobId_userId: { jobId: id, userId: req.user!.id } },
  });

  if (existing) {
    throw new AppError('Ya aplicaste a este trabajo', 400);
  }

  let cvUrl = null;
  if (req.file) {
    const result = await uploadImage(req.file.buffer, 'cvs');
    cvUrl = result.url;
  }

  const application = await prisma.jobApplication.create({
    data: {
      jobId: id,
      userId: req.user!.id,
      cvUrl,
      message,
    },
    include: { user: { select: { name: true, email: true } } },
  });

  // Notify pulperia owner
  const owner = await prisma.user.findUnique({
    where: { id: job.pulperia.userId },
    include: { pushSubscriptions: true },
  });

  if (owner) {
    for (const sub of owner.pushSubscriptions) {
      await sendPushNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        {
          title: 'Nueva aplicación de trabajo',
          body: `${application.user.name} aplicó para ${job.title}`,
          tag: `job-${job.id}`,
          data: { jobId: job.id, type: 'job_application' },
        }
      );
    }
  }

  res.status(201).json(application);
}));

// Respond to application (accept/reject)
router.post('/applications/:id/respond', authenticate, requirePulperia, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { status, response } = req.body;

  if (!['ACCEPTED', 'REJECTED'].includes(status)) {
    throw new AppError('Estado inválido', 400);
  }

  const pulperia = await prisma.pulperia.findUnique({
    where: { userId: req.user!.id },
  });

  if (!pulperia) {
    throw new AppError('No tienes una pulpería registrada', 400);
  }

  const application = await prisma.jobApplication.findUnique({
    where: { id },
    include: {
      job: { include: { pulperia: true } },
      user: { include: { pushSubscriptions: true } },
    },
  });

  if (!application || application.job.pulperiaId !== pulperia.id) {
    throw new AppError('Aplicación no encontrada', 404);
  }

  const updated = await prisma.jobApplication.update({
    where: { id },
    data: { status, response },
  });

  // Notify applicant
  for (const sub of application.user.pushSubscriptions) {
    const isAccepted = status === 'ACCEPTED';
    await sendPushNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      {
        title: isAccepted ? '¡Felicidades!' : 'Actualización de aplicación',
        body: isAccepted
          ? `Tu aplicación para ${application.job.title} en ${application.job.pulperia.name} fue aceptada. ${response || ''}`
          : `Lo sentimos, tu aplicación para ${application.job.title} no fue seleccionada. Sigue intentando.`,
        tag: `job-${application.job.id}`,
        data: { jobId: application.job.id, type: 'job_response' },
      }
    );
  }

  res.json(updated);
}));

export default router;
