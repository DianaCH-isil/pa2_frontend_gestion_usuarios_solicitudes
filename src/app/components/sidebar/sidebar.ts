import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface NavLink {
  ruta: string;
  etiqueta: string;
  icono: 'bandeja' | 'nueva' | 'mis' | 'gestion' | 'alumnos';
  visible: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class Sidebar {
  private readonly authService = inject(AuthService);

  /**
   * Lista reactiva de enlaces. Se recalcula cada vez que cambia
   * el rol del usuario, ocultando los enlaces a los que no tiene acceso.
   */
  protected readonly enlaces = computed<NavLink[]>(() => {
    const rol = this.authService.currentUser()?.rol;
    const todos: NavLink[] = [
      {
        ruta: '/bandeja',
        etiqueta: 'Bandeja de Solicitudes',
        icono: 'bandeja',
        visible: rol === 'administrador' || rol === 'personal'
      },
      {
        ruta: '/mis-solicitudes',
        etiqueta: 'Mis Solicitudes',
        icono: 'mis',
        visible: rol === 'estudiante'
      },
      {
        ruta: '/nueva-solicitud',
        etiqueta: 'Nueva Solicitud',
        icono: 'nueva',
        visible: rol === 'estudiante'
      },
      {
        ruta: '/gestion-usuarios',
        etiqueta: 'Gestión de Usuarios',
        icono: 'gestion',
        visible: rol === 'administrador'
      },
      {
        ruta: '/estudiantes-registrados',
        etiqueta: 'Estudiantes registrados',
        icono: 'alumnos',
        visible: rol === 'administrador'
      }
    ];
    return todos.filter((l) => l.visible);
  });
}
