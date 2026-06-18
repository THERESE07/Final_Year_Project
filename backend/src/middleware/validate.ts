import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { sendError } from '../utils/response';

export const validate =
  (schema: ZodSchema, source: 'body' | 'query' = 'body') =>
  (req: Request, res: Response, next: NextFunction) => {
    const input = source === 'body' ? req.body : req.query;
    const result = schema.safeParse(input);
    if (!result.success) {
      const message = result.error.issues
        .map((i) => `${i.path.join('.') || 'field'}: ${i.message}`)
        .join('; ');
      return sendError(res, message, 400);
    }
    if (source === 'body') req.body = result.data;
    else req.query = result.data as typeof req.query;
    next();
  };
