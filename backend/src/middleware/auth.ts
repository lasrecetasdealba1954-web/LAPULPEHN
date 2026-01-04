import { Request, Response, NextFunction } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { prisma } from '../lib/prisma.js';
import { AppError } from './errorHandler.js';
import '../lib/firebase.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    userType: 'CUSTOMER' | 'PULPERIA';
    firebaseUid: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No autorizado', 401);
    }

    const token = authHeader.split(' ')[1];

    // Verify Firebase token
    const decodedToken = await getAuth().verifyIdToken(token);

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { firebaseUid: decodedToken.uid },
      select: {
        id: true,
        email: true,
        name: true,
        userType: true,
        firebaseUid: true,
      },
    });

    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    next(new AppError('Token inválido', 401));
  }
};

export const requirePulperia = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.userType !== 'PULPERIA') {
    return next(new AppError('Solo pulperías pueden acceder a este recurso', 403));
  }
  next();
};

export const requireCustomer = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.userType !== 'CUSTOMER') {
    return next(new AppError('Solo clientes pueden acceder a este recurso', 403));
  }
  next();
};
