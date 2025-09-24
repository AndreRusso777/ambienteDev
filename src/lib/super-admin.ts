import User from '@/types/user';
import { SessionUser } from './auth';

/**
 * Verifica se um usuário é super administrador baseado no campo super_admin
 * Esta função é segura para uso no cliente e servidor
 * @param user - Objeto do usuário (User ou SessionUser)
 * @returns boolean - true se for super admin
 */
export function isSuperAdmin(user: User | SessionUser): boolean {
  return Boolean(user.super_admin === 1);
}
