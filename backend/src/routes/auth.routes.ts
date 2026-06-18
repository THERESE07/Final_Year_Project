// ============================================================
// routes/auth.routes.ts
//
// Extracted from: routes/index.ts
// All /auth/* endpoints in one focused file.
// ============================================================

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { uploadDocuments } from '../middleware/upload';
import { AuthController } from '../controllers/auth.controller';
import { registerSchema, loginSchema, refreshTokenSchema, changePasswordSchema } from '../validation/schemas';

const router = Router();

const parseRegisterBody = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body.crop_types && typeof req.body.crop_types === 'string') {
    try { req.body.crop_types = JSON.parse(req.body.crop_types); } catch { req.body.crop_types = [req.body.crop_types]; }
  }
  if (req.body.farm_size_hectares) req.body.farm_size_hectares = Number(req.body.farm_size_hectares);
  if (req.body.years_of_experience) req.body.years_of_experience = Number(req.body.years_of_experience);
  next();
};

router.get('/cooperatives', AuthController.getRegistrationCooperatives);
router.post(
  '/register',
  uploadDocuments.fields([
    { name: 'national_id_doc', maxCount: 1 },
    { name: 'authorization_letter', maxCount: 1 },
  ]),
  parseRegisterBody,
  validate(registerSchema),
  AuthController.register,
);
router.post('/login',           validate(loginSchema),           AuthController.login);
router.post('/refresh',         validate(refreshTokenSchema),    AuthController.refreshToken);
router.post('/logout',          authenticate, AuthController.logout);
router.get( '/profile',         authenticate, AuthController.getProfile);
router.put( '/change-password', authenticate, validate(changePasswordSchema), AuthController.changePassword);

export default router;
