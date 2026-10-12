import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import {
  SolicitudAcademica,
  NuevaSolicitudDTO,
  EstadoSolicitud,
  MetricasSolicitudes
} from '../models/solicitud.model';

/**
 * Servicio de solicitudes académicas.
 *
 * Ya NO incluye fallback offline: los datos vienen exclusivamente de la
 * API REST (`http://localhost:3000/api`). Si el backend no responde,
 * el `apiStatus` queda en `'offline'` y la lista permanece vacía.
 */
@Injectable({
  providedIn: 'root'
})
export class SolicitudesService {
  private readonly http = inject(HttpClient);
  public readonly apiUrl = 'http://localhost:3000/api';

  /**
   * Estado de conexión con la API REST
   */
  public readonly apiStatus = signal<'online' | 'offline' | 'loading'>('loading');
  public readonly apiError = signal<string | null>(null);
  public readonly cargando = signal<boolean>(false);

  // Estado reactivo con Signals (Angular moderno) y BehaviorSubject (RxJS)
  private readonly _solicitudesSignal = signal<SolicitudAcademica[]>([]);
  private readonly _solicitudesSubject = new BehaviorSubject<SolicitudAcademica[]>([]);

  // Readonly signal para consumo directo en componentes
  public readonly solicitudes = this._solicitudesSignal.asReadonly();

  // Observable para consumidores basados en RxJS
  public readonly solicitudes$ = this._solicitudesSubject.asObservable();

  // Signal computado para métricas globales (Uso de ES6+ reduce)
  public readonly metricas = computed<MetricasSolicitudes>(() => {
    const lista = this._solicitudesSignal();
    return lista.reduce<MetricasSolicitudes>(
      (acc, { estado }) => {
        acc.total++;
        if (estado === 'Aprobada') acc.aprobadas++;
        else if (estado === 'En Revisión') acc.enRevision++;
        else if (estado === 'Pendiente') acc.pendientes++;
        else if (estado === 'Rechazada') acc.rechazadas++;
        return acc;
      },
      { total: 0, aprobadas: 0, enRevision: 0, pendientes: 0, rechazadas: 0 }
    );
  });

  /**
   * Carga las solicitudes académicas desde la API REST mediante HttpClient.
   * Si la API no responde, el signal queda en [] y `apiStatus` pasa a 'offline'.
   */
  public cargarSolicitudes(): Observable<SolicitudAcademica[]> {
    this.cargando.set(true);
    return this.http.get<SolicitudAcademica[]>(`${this.apiUrl}/solicitudes`).pipe(
      tap((datos) => {
        this._solicitudesSignal.set(datos);
        this._solicitudesSubject.next(datos);
        this.apiStatus.set('online');
        this.apiError.set(null);
        this.cargando.set(false);
      }),
      catchError((error) => {
        console.warn('API REST no disponible en', this.apiUrl, error);
        this.apiStatus.set('offline');
        this.apiError.set(`No se pudo conectar a ${this.apiUrl}`);
        this.cargando.set(false);
        this._solicitudesSignal.set([]);
        this._solicitudesSubject.next([]);
        return of([]);
      })
    );
  }

  /**
   * Carga las solicitudes del estudiante actualmente autenticado.
   * Endpoint: GET /api/solicitudes/mias
   */
  public cargarMisSolicitudes(): Observable<SolicitudAcademica[]> {
    this.cargando.set(true);
    return this.http.get<SolicitudAcademica[]>(`${this.apiUrl}/solicitudes/mias`).pipe(
      tap((datos) => {
        this._solicitudesSignal.set(datos);
        this._solicitudesSubject.next(datos);
        this.apiStatus.set('online');
        this.apiError.set(null);
        this.cargando.set(false);
      }),
      catchError((error) => {
        console.warn('API REST no disponible en', this.apiUrl + '/solicitudes/mias', error);
        this.apiStatus.set('offline');
        this.apiError.set(`No se pudo conectar a ${this.apiUrl}/solicitudes/mias`);
        this.cargando.set(false);
        this._solicitudesSignal.set([]);
        this._solicitudesSubject.next([]);
        return of([]);
      })
    );
  }

  /**
   * Genera un código de radicado tentativo para mostrar en la UI mientras
   * el usuario completa el formulario. El radicado DEFINITIVO lo asigna
   * el backend al momento de crear la solicitud.
   */
  public generarProximoRadicado(): string {
    const total = this._solicitudesSignal().length + 1;
    const year = new Date().getFullYear();
    const numero = String(total).padStart(3, '0');
    return `SOL-${year}-${numero}`;
  }

  /**
   * Registra una nueva solicitud académica vía API REST.
   * Si la API falla, propaga el error (sin fallback local).
   */
  public crearSolicitud(dto: NuevaSolicitudDTO): Observable<SolicitudAcademica> {
    return this.http.post<SolicitudAcademica>(`${this.apiUrl}/solicitudes`, dto).pipe(
      tap((nueva) => {
        const nuevaLista = [nueva, ...this._solicitudesSignal()];
        this._solicitudesSignal.set(nuevaLista);
        this._solicitudesSubject.next(nuevaLista);
        this.apiStatus.set('online');
      }),
      catchError((error) => {
        this.apiStatus.set('offline');
        this.apiError.set(`No se pudo registrar la solicitud en ${this.apiUrl}`);
        throw error;
      })
    );
  }

  /**
   * Actualiza el estado de una solicitud existente vía API REST.
   * Si la API falla, propaga el error (sin fallback local).
   */
  public actualizarEstado(id: string, nuevoEstado: EstadoSolicitud): Observable<SolicitudAcademica> {
    return this.http
      .patch<SolicitudAcademica>(`${this.apiUrl}/solicitudes/${id}/estado`, { estado: nuevoEstado })
      .pipe(
        tap((actualizada) => {
          const lista = this._solicitudesSignal().map((s) => (s.id === id ? actualizada : s));
          this._solicitudesSignal.set(lista);
          this._solicitudesSubject.next(lista);
          this.apiStatus.set('online');
        }),
        catchError((error) => {
          this.apiStatus.set('offline');
          this.apiError.set(`No se pudo actualizar el estado en ${this.apiUrl}`);
          throw error;
        })
      );
  }

  /**
   * Elimina una solicitud (solo administrador en el backend).
   */
  public eliminarSolicitud(id: string): Observable<{ mensaje: string; id: string }> {
    return this.http.delete<{ mensaje: string; id: string }>(`${this.apiUrl}/solicitudes/${id}`).pipe(
      tap(() => {
        const lista = this._solicitudesSignal().filter((s) => s.id !== id);
        this._solicitudesSignal.set(lista);
        this._solicitudesSubject.next(lista);
        this.apiStatus.set('online');
      }),
      catchError((error) => {
        this.apiStatus.set('offline');
        this.apiError.set(`No se pudo eliminar la solicitud en ${this.apiUrl}`);
        throw error;
      })
    );
  }
}
