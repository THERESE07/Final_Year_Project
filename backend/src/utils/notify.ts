import { Notification, User } from '../models/associations';

export async function notifyUser(
  userId: string,
  title: string,
  message: string,
  type: string,
  relatedId?: string,
  relatedType?: string,
) {
  await Notification.create({
    user_id: userId,
    title,
    message,
    type,
    related_id: relatedId,
    related_type: relatedType,
  } as any);
}

export async function notifyCoopLeader(cooperativeId: string, title: string, message: string, type: string, relatedId?: string, relatedType?: string) {
  const { Cooperative } = await import('../models/associations');
  const coop = await Cooperative.findByPk(cooperativeId);
  if (coop?.manager_id) {
    await notifyUser(coop.manager_id, title, message, type, relatedId, relatedType);
  }
}

export async function notifyAdmins(title: string, message: string, type: string, relatedId?: string, relatedType?: string) {
  const admins = await User.findAll({ where: { role: 'admin', status: 'active' } });
  await Promise.all(admins.map((a) => notifyUser(a.id, title, message, type, relatedId, relatedType)));
}
