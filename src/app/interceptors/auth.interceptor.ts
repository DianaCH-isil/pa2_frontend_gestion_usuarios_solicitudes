import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Interceptor funcional que adjunta el header `Authorization: Bearer <token>`
 * a todas las peticiones HTTP salientes, excepto al endpoint de login
 * (no necesita token porque precisamente lo va a obtener).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.token();

  if (!token) {
    return next(req);
  }

  // No adjuntar token a /api/auth/login (el backend lo rechaza si viene)
  if (req.url.includes('/api/auth/login')) {
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(authReq);
};
