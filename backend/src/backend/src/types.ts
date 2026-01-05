import { Request } from 'express';

export interface AuthRequest extends Request {
  file?: Express.Multer.File;
  // Agregue 'user' si está definido en middleware/auth.ts, e.g., user?: { id: string; };
}
