import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, RolUsuario } from '../services/auth.service';

/**
 * Devuelve la ruta "home" del usuario según su rol.
 *   administrador / personal → /bandeja
 *   estudiante               → /mis-solicitudes
 *   sin sesión               → /login
 */
export function homeForRole(rol: RolUsuario | undefined | null): string {
  switch (rol) {
    case 'administrador':
    case 'personal':
      return '/bandeja';
    case 'estudiante':
      return '/mis-solicitudes';
    default:
      return '/login';
  }
}

/**
 * Fábrica de guards: `roleGuard('administrador', 'personal')` exige que
 * el usuario esté autenticado y que su rol esté en la lista.
 * Si no cumple, lo redirige a su home correspondiente.
 */
export const roleGuard = (...roles: RolUsuario[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      router.navigate(['/login']);
      return false;
    }

    const user = authService.currentUser();
    if (!user || !roles.includes(user.rol)) {
      router.navigate([homeForRole(user?.rol)]);
      return false;
    }

    return true;
  };
};
