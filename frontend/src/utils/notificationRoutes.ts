import { Notification } from '../types';

/** Resolve a deep-link path for a notification based on user role. */
export function getNotificationRoute(role: string | undefined, notification: Notification): string | null {
  const type = (notification.type || '').toLowerCase();
  const relatedType = (notification.related_type || '').toLowerCase();
  const title = (notification.title || '').toLowerCase();

  if (role === 'cooperative') {
    if (
      type === 'input_request'
      || relatedType === 'input_request'
      || title.includes('input request')
    ) {
      return '/cooperative/input-requests';
    }
    if (type === 'allocation' || relatedType === 'cooperative_input_allocation') {
      return '/cooperative/inputs';
    }
    if (type === 'registration') {
      return '/cooperative/pending-farmers';
    }
  }

  if (role === 'admin') {
    if (
      type === 'allocation_request'
      || relatedType === 'cooperative_distribution_request'
      || title.includes('distribution request')
    ) {
      return '/admin/input-distribution';
    }
    if (type === 'registration') {
      return '/admin/user-approval';
    }
  }

  if (role === 'farmer') {
    if (type === 'input_request' || type === 'input') {
      return '/farmer/inputs';
    }
    if (type === 'subsidy') {
      return '/farmer/subsidies';
    }
  }

  return null;
}
