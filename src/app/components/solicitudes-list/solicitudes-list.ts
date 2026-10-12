import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SolicitudesService } from '../../services/solicitudes.service';
import { AuthService } from '../../services/auth.service';
import { EstadoSolicitud, SolicitudAcademica } from '../../models/solicitud.model';
import { StatusBadgeDirective } from '../../directives/status-badge.directive';

@Component({
  selector: 'app-solicitudes-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    StatusBadgeDirective
  ],
  templateUrl: './solicitudes-list.html',
  styleUrl: './solicitudes-list.scss'
})

export class SolicitudesList implements OnInit {
  protected readonly solicitudesService = inject(SolicitudesService);
  protected readonly authService = inject(AuthService);

  // Consumo directo de la lista reactiva de solicitudes
  protected readonly solicitudes = this.solicitudesService.solicitudes;

  // Estado para el modal de detalle
  protected readonly solicitudSeleccionada = signal<SolicitudAcademica | null>(null);
  protected readonly solicitudEnEdicion = signal<SolicitudAcademica | null>(null);
  protected readonly estadoEnEdicion = signal<EstadoSolicitud>('Pendiente');
  protected readonly guardandoEdicion = signal<boolean>(false);
  protected readonly eliminandoId = signal<string | null>(null);
  protected readonly mensajeAccion = signal<string | null>(null);
  protected readonly mensajeAccionError = signal<string | null>(null);

  protected readonly estadosDisponibles: EstadoSolicitud[] = [
    'Pendiente',
    'En Revisión',
    'Aprobada',
    'Rechazada'
  ];

  // Título dinámico: "Bandeja" para admin/personal, "Mis Solicitudes" para estudiante
  protected readonly titulo = computed(() =>
    this.authService.isEstudiante() ? 'Mis Solicitudes' : 'Bandeja de Solicitudes'
  );

  protected readonly puedeGestionarSolicitudes = computed(
    () => this.authService.isAdmin() || this.authService.isPersonal()
  );

  ngOnInit(): void {
    console.log('[SolicitudesList] ngOnInit disparado');
    console.log('[SolicitudesList] isEstudiante:', this.authService.isEstudiante());
    console.log('[SolicitudesList] currentUser:', this.authService.currentUser());
    console.log('[SolicitudesList] tiene token:', !!this.authService.token());

    // Si es estudiante, llama a /api/solicitudes/mias; si no, a /api/solicitudes
    const obs = this.authService.isEstudiante()
      ? this.solicitudesService.cargarMisSolicitudes()
      : this.solicitudesService.cargarSolicitudes();

    obs.subscribe({
      next: (data) => {
        console.log('[SolicitudesList] ✓ Datos recibidos:', data?.length, 'solicitudes');
        console.log('[SolicitudesList] primera:', data?.[0]?.codigoRadicado);
      },
      error: (err) => {
        console.error('[SolicitudesList] ✗ Error al cargar:', err);
      }
    });
  }

  /**
   * Abre el modal con la información detallada del radicado
   */
  abrirDetalle(solicitud: SolicitudAcademica): void {
    this.solicitudSeleccionada.set(solicitud);
  }

  /**
   * Cierra el modal de detalle
   */
  cerrarDetalle(): void {
    this.solicitudSeleccionada.set(null);
  }

  abrirEdicion(solicitud: SolicitudAcademica): void {
    this.mensajeAccion.set(null);
    this.mensajeAccionError.set(null);
    this.solicitudEnEdicion.set(solicitud);
    this.estadoEnEdicion.set(solicitud.estado);
  }

  cerrarEdicion(): void {
    if (this.guardandoEdicion()) return;
    this.solicitudEnEdicion.set(null);
  }

  guardarEdicion(): void {
    const solicitud = this.solicitudEnEdicion();
    if (!solicitud || this.guardandoEdicion()) return;

    this.guardandoEdicion.set(true);
    this.mensajeAccionError.set(null);

    this.solicitudesService.actualizarEstado(solicitud.id, this.estadoEnEdicion()).subscribe({
      next: () => {
        this.guardandoEdicion.set(false);
        this.solicitudEnEdicion.set(null);
        this.mensajeAccion.set('Solicitud actualizada');
        if (this.solicitudSeleccionada()?.id === solicitud.id) {
          this.cerrarDetalle();
        }
      },
      error: (err) => {
        this.guardandoEdicion.set(false);
        this.mensajeAccionError.set(
          err?.error?.mensaje || err?.error?.error || 'No se pudo actualizar la solicitud'
        );
      }
    });
  }

  eliminarSolicitud(solicitud: SolicitudAcademica): void {
    if (!this.authService.isAdmin() || this.eliminandoId()) return;

    const confirmar = window.confirm(
      `¿Eliminar la solicitud ${solicitud.codigoRadicado}? Esta acción no se puede deshacer.`
    );
    if (!confirmar) return;

    this.mensajeAccion.set(null);
    this.mensajeAccionError.set(null);
    this.eliminandoId.set(solicitud.id);

    this.solicitudesService.eliminarSolicitud(solicitud.id).subscribe({
      next: () => {
        this.eliminandoId.set(null);
        this.mensajeAccion.set('Solicitud eliminada');
        if (this.solicitudSeleccionada()?.id === solicitud.id) {
          this.cerrarDetalle();
        }
      },
      error: (err) => {
        this.eliminandoId.set(null);
        this.mensajeAccionError.set(
          err?.error?.mensaje || err?.error?.error || 'No se pudo eliminar la solicitud'
        );
      }
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.solicitudEnEdicion()) {
      this.cerrarEdicion();
      return;
    }
    if (this.solicitudSeleccionada()) {
      this.cerrarDetalle();
    }
  }
}
