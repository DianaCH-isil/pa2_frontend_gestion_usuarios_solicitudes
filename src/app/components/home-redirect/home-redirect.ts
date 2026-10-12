import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { homeForRole } from '../../guards/role.guard';

/**
 * Componente "fantasma" usado en las rutas comodín (`/` y `**`).
 * Redirige al usuario al home que le corresponde según su rol:
 *   administrador / personal → /bandeja
 *   estudiante               → /mis-solicitudes
 *   sin sesión               → /login
 */
@Component({
  selector: 'app-home-redirect',
  standalone: true,
  template: ''
})
export class HomeRedirect {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  constructor() {
    this.router.navigateByUrl(homeForRole(this.authService.currentUser()?.rol));
  }
}
