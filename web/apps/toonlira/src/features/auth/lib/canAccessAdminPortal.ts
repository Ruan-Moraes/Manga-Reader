import type { UserRole } from '@entities/user';

export const ADMIN_PORTAL_ROLES: UserRole[] = ['admin', 'poster'];

export const canAccessAdminPortal = (role?: UserRole | null): boolean => role === 'admin' || role === 'poster';
