import { Component, HostListener, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { catchError, of, tap } from 'rxjs';

interface Estudiante {
  id: string;
  codigo: string;
  nombre: string;
  carrera: string;
  email: string;
  avatarUrl?: string;
}

@Component({
  selector: 'app-estudiantes-registrados',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './estudiantes-registrados.html',
  styleUrl: './estudiantes-registrados.scss'
})
export class EstudiantesRegistrados implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api';
  private readonly duracionMensajeExitoMs = 3500;
  private timeoutMensajeExito: ReturnType<typeof setTimeout> | null = null;

  protected readonly estudiantes = signal<Estudiante[]>([]);
  protected readonly cargando = signal<boolean>(false);
  protected readonly mensajeError = signal<string | null>(null);
  protected readonly mensajeExito = signal<string | null>(null);
  protected readonly mensajeAccionError = signal<string | null>(null);

  protected readonly estudianteEnEdicion = signal<Estudiante | null>(null);
  protected readonly guardando = signal<boolean>(false);
  protected readonly eliminandoId = signal<string | null>(null);

  protected readonly editarForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    carrera: ['', [Validators.required]]
  });

  ngOnInit(): void {
    this.cargarEstudiantes();
  }

  ngOnDestroy(): void {
    this.limpiarTimeoutExito();
  }

  cargarEstudiantes(): void {
    this.cargando.set(true);
    this.mensajeError.set(null);
    this.http.get<Estudiante[]>(`${this.apiUrl}/estudiantes`).pipe(
      tap((datos) => {
        this.estudiantes.set(datos);
        this.cargando.set(false);
      }),
      catchError((err) => {
        console.error('Error al cargar estudiantes:', err);
        this.cargando.set(false);
        this.mensajeError.set('No se pudieron cargar los estudiantes.');
        return of([]);
      })
    ).subscribe();
  }

  abrirModificar(estudiante: Estudiante): void {
    this.mensajeAccionError.set(null);
    this.estudianteEnEdicion.set(estudiante);
    this.editarForm.reset({
      nombre: estudiante.nombre,
      carrera: estudiante.carrera
    });
  }

  cerrarModificar(): void {
    if (this.guardando()) return;
    this.estudianteEnEdicion.set(null);
  }

  guardarModificacion(): void {
    const estudiante = this.estudianteEnEdicion();
    if (!estudiante || this.editarForm.invalid || this.guardando()) {
      this.editarForm.markAllAsTouched();
      return;
    }

    const { nombre, carrera } = this.editarForm.getRawValue();
    this.guardando.set(true);
    this.mensajeAccionError.set(null);

    this.http
      .put<Estudiante>(`${this.apiUrl}/estudiantes/${estudiante.id}`, { nombre, carrera })
      .pipe(
        tap((actualizado) => {
          this.estudiantes.update((lista) =>
            lista.map((e) => (e.id === actualizado.id ? actualizado : e))
          );
          this.guardando.set(false);
          this.estudianteEnEdicion.set(null);
          this.mostrarMensajeExito('Estudiante actualizado');
        }),
        catchError((err) => {
          this.guardando.set(false);
          this.mensajeAccionError.set(
            err?.error?.mensaje || err?.error?.error || 'No se pudo modificar el estudiante'
          );
          return of(null);
        })
      )
      .subscribe();
  }

  eliminarEstudiante(estudiante: Estudiante): void {
    if (this.eliminandoId()) return;

    const confirmar = window.confirm(
      `¿Estás seguro que desea eliminar al estudiante ${estudiante.nombre}?`
    );
    if (!confirmar) return;

    this.mensajeAccionError.set(null);
    this.eliminandoId.set(estudiante.id);

    this.http
      .delete<{ mensaje: string; id: string }>(`${this.apiUrl}/estudiantes/${estudiante.id}`)
      .pipe(
        tap(() => {
          this.estudiantes.update((lista) => lista.filter((e) => e.id !== estudiante.id));
          this.eliminandoId.set(null);
          if (this.estudianteEnEdicion()?.id === estudiante.id) {
            this.estudianteEnEdicion.set(null);
          }
          this.mostrarMensajeExito('Estudiante eliminado');
        }),
        catchError((err) => {
          this.eliminandoId.set(null);
          this.mensajeAccionError.set(
            err?.error?.mensaje || err?.error?.error || 'No se pudo eliminar el estudiante'
          );
          return of(null);
        })
      )
      .subscribe();
  }

  esInvalido(campo: string): boolean {
    const c = this.editarForm.get(campo);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  private limpiarTimeoutExito(): void {
    if (this.timeoutMensajeExito !== null) {
      clearTimeout(this.timeoutMensajeExito);
      this.timeoutMensajeExito = null;
    }
  }

  private mostrarMensajeExito(texto: string): void {
    this.limpiarTimeoutExito();
    this.mensajeExito.set(texto);
    this.timeoutMensajeExito = setTimeout(() => {
      this.mensajeExito.set(null);
      this.timeoutMensajeExito = null;
    }, this.duracionMensajeExitoMs);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.estudianteEnEdicion()) {
      this.cerrarModificar();
    }
  }
}
