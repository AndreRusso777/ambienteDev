import { useUser } from '@/context/user';
import { isSuperAdmin } from '@/lib/super-admin';

export function useSuperAdminInfo() {
  const { user } = useUser();
  
  return {
    isSuperAdmin: user ? isSuperAdmin(user) : false,
    user
  };
}