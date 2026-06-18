import fs from 'fs';
import path from 'path';
import sequelize from '../config/database';
import { User, Farmer, UserDocument, Notification, RefreshToken } from '../models/associations';
import { sendApplicationDecisionEmail } from '../services/email.service';
import logger from './logger';

function resolveUploadPath(filePath: string): string {
  const normalized = filePath.replace(/^\/uploads\//, '');
  return path.resolve('./uploads', normalized);
}

export async function deleteRejectedApplicant(user: User, feedback: string): Promise<void> {
  const snapshot = {
    email: user.email,
    full_name: user.full_name,
    role: user.role,
  };

  await sequelize.transaction(async (t) => {
    const docs = await UserDocument.findAll({ where: { user_id: user.id }, transaction: t });
    for (const doc of docs) {
      try {
        const fullPath = resolveUploadPath(doc.file_path);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      } catch (err: any) {
        logger.warn(`Failed to delete file ${doc.file_path}: ${err.message}`);
      }
      await doc.destroy({ transaction: t });
    }

    await Farmer.destroy({ where: { user_id: user.id }, transaction: t });
    await Notification.destroy({ where: { user_id: user.id }, transaction: t });
    await RefreshToken.destroy({ where: { user_id: user.id }, transaction: t });
    await user.destroy({ transaction: t });
  });

  await sendApplicationDecisionEmail(snapshot.email, snapshot.full_name, 'rejected', feedback);
  logger.info(`Rejected applicant deleted: ${snapshot.email} (${snapshot.role})`);
}

export async function notifyApprovalWithEmail(
  user: User,
  title: string,
  inAppMessage: string,
  feedback: string,
  type = 'registration',
): Promise<void> {
  await Notification.create({
    user_id: user.id,
    title,
    message: feedback,
    type,
  } as any);
  await sendApplicationDecisionEmail(user.email, user.full_name, 'approved', feedback);
}
