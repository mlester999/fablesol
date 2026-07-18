import type { AdminAuthorizationResult } from './types';

export const ADMIN_ROUTES = {
  login: '/login',
  dashboard: '/dashboard',
  unauthorized: '/unauthorized',
  suspended: '/suspended',
  sessionExpired: '/session-expired',
} as const;

export type AdminRoute = (typeof ADMIN_ROUTES)[keyof typeof ADMIN_ROUTES];

export function destinationForAuthorization(result: AdminAuthorizationResult): AdminRoute {
  switch (result.outcome) {
    case 'authorized':
      return ADMIN_ROUTES.dashboard;
    case 'unauthenticated':
      return ADMIN_ROUTES.login;
    case 'suspended':
      return ADMIN_ROUTES.suspended;
    case 'unauthorized':
      return ADMIN_ROUTES.unauthorized;
  }
}
