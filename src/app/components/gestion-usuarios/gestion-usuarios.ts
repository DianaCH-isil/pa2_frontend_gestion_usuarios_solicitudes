import { Component, HostListener, OnDestroy, OnInit, inject, signal, computed } from '@angular/core';
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

interface UsuarioListado {
  id: string;
  nombre: string;
  correo: string;
  rol: 'estudiante' | 'administrador' | 'personal';
}

interface CrearAlumnoDTO {
  nombre: string;
  correo: string;
  password: string;
  rol: 'estudiante' | 'administrador' | 'personal';
  codigo?: string;
  carrera?: string;
  avatarUrl?: string;
}

@Component({
  selector: 'app-gestion-usuarios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './gestion-usuarios.html',
  styleUrl: './gestion-usuarios.scss'
})
export class GestionUsuarios implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api';
  private readonly duracionMensajeExitoMs = 3500;
  private timeoutMensajeExito: ReturnType<typeof setTimeout> | null = null;

  protected readonly alumnos = signal<Estudiante[]>([]);
  protected readonly usuarios = signal<UsuarioListado[]>([]);
  protected readonly cargandoUsuarios = signal<boolean>(false);
  protected readonly errorListadoUsuarios = signal<string | null>(null);
  protected readonly mensajeExito = signal<string | null>(null);
  protected readonly mensajeError = signal<string | null>(null);
  protected readonly mensajeListaExito = signal<string | null>(null);
  protected readonly mensajeListaError = signal<string | null>(null);

  protected readonly usuarioEnEdicion = signal<UsuarioListado | null>(null);
  protected readonly guardandoUsuario = signal<boolean>(false);
  protected readonly eliminandoUsuarioId = signal<string | null>(null);

  protected readonly editarUsuarioForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    correo: ['', [Validators.required, Validators.email]],
    rol: ['estudiante', [Validators.required]],
    password: ['']
  });

  protected readonly usuarioForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    correo: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(3)]],
    rol: ['estudiante', [Validators.required]],
    // Solo si rol === 'estudiante'
    codigo: [''],
    carrera: ['']
  });

  protected readonly rolSeleccionado = signal<string>('estudiante');

  // Para mostrar/ocultar la sección académica según el rol elegido
  protected readonly esEstudiante = computed(() => this.rolSeleccionado() === 'estudiante');

  get f() {
    return this.usuarioForm.controls;
  }

  esInvalido(campo: string): boolean {
    const c = this.usuarioForm.get(campo);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  esInvalidoEdicion(campo: string): boolean {
    const c = this.editarUsuarioForm.get(campo);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  ngOnDestroy(): void {
    this.limpiarTimeoutExito();
  }

  ngOnInit(): void {
    this.cargarAlumnos();
    this.cargarUsuarios();
    if (this.esEstudiante() && !this.usuarioForm.get('codigo')?.value) {
      this.generarNuevoCodigo();
    }

    this.usuarioForm.get('rol')?.valueChanges.subscribe((rol) => {
      const nuevoRol = rol || 'estudiante';
      this.rolSeleccionado.set(nuevoRol);

      if (nuevoRol === 'estudiante') {
        if (!this.usuarioForm.get('codigo')?.value) {
          this.generarNuevoCodigo();
        }
      } else {
        // Si es administrador o personal, limpiar campos académicos y no generar código
        this.usuarioForm.patchValue({
          codigo: '',
          carrera: ''
        }, { emitEvent: false });
      }
    });
  }

  /**
   * Genera un código institucional con formato ISIL-######
   * asegurando que no colisione con ninguno de los alumnos ya registrados.
   */
  generarCodigoInstitucional(): string {
    const existentes = new Set(this.alumnos().map((a) => a.codigo.toUpperCase().trim()));
    let nuevoCodigo = '';
    let intentos = 0;
    do {
      const num = Math.floor(100000 + Math.random() * 900000);
      nuevoCodigo = `ISIL-${num}`;
      intentos++;
    } while (existentes.has(nuevoCodigo) && intentos < 100);
    return nuevoCodigo;
  }

  /**
   * Asigna un nuevo código institucional al control del formulario.
   */
  generarNuevoCodigo(): void {
    const codigo = this.generarCodigoInstitucional();
    this.usuarioForm.patchValue({ codigo });
    this.usuarioForm.get('codigo')?.markAsDirty();
    this.usuarioForm.get('codigo')?.markAsTouched();
  }

  protected etiquetaRol(rol: UsuarioListado['rol']): string {
    const map: Record<UsuarioListado['rol'], string> = {
      estudiante: 'Estudiante',
      administrador: 'Administrador',
      personal: 'Personal'
    };
    return map[rol] ?? rol;
  }

  abrirEditarUsuario(usuario: UsuarioListado): void {
    this.mensajeListaError.set(null);
    this.usuarioEnEdicion.set(usuario);
    this.editarUsuarioForm.reset({
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol,
      password: ''
    });
  }

  cerrarEditarUsuario(): void {
    if (this.guardandoUsuario()) return;
    this.usuarioEnEdicion.set(null);
  }

  guardarEdicionUsuario(): void {
    const usuario = this.usuarioEnEdicion();
    if (!usuario || this.editarUsuarioForm.invalid || this.guardandoUsuario()) {
      this.editarUsuarioForm.markAllAsTouched();
      return;
    }

    const v = this.editarUsuarioForm.getRawValue();
    const body: Record<string, string> = {
      nombre: v.nombre,
      correo: v.correo,
      rol: v.rol
    };
    if (v.password && String(v.password).trim().length > 0) {
      body['password'] = v.password;
    }

    this.guardandoUsuario.set(true);
    this.mensajeListaError.set(null);

    this.http.put<UsuarioListado>(`${this.apiUrl}/usuarios/${usuario.id}`, body).pipe(
      tap((actualizado) => {
        this.usuarios.update((lista) =>
          lista.map((u) => (u.id === actualizado.id ? actualizado : u))
        );
        this.guardandoUsuario.set(false);
        this.usuarioEnEdicion.set(null);
        this.mostrarMensajeListaExito('Usuario actualizado');
        this.cargarAlumnos();
      }),
      catchError((err) => {
        this.guardandoUsuario.set(false);
        this.mensajeListaError.set(
          err?.error?.mensaje || err?.error?.error || 'No se pudo editar el usuario'
        );
        return of(null);
      })
    ).subscribe();
  }

  eliminarUsuario(usuario: UsuarioListado): void {
    if (this.eliminandoUsuarioId()) return;

    const confirmar = window.confirm(
      `¿Estás seguro que desea eliminar al usuario ${usuario.nombre}?`
    );
    if (!confirmar) return;

    this.mensajeListaError.set(null);
    this.eliminandoUsuarioId.set(usuario.id);

    this.http.delete<{ mensaje: string; id: string }>(`${this.apiUrl}/usuarios/${usuario.id}`).pipe(
      tap(() => {
        this.usuarios.update((lista) => lista.filter((u) => u.id !== usuario.id));
        this.eliminandoUsuarioId.set(null);
        if (this.usuarioEnEdicion()?.id === usuario.id) {
          this.usuarioEnEdicion.set(null);
        }
        this.mostrarMensajeListaExito('Usuario eliminado');
        this.cargarAlumnos();
      }),
      catchError((err) => {
        this.eliminandoUsuarioId.set(null);
        this.mensajeListaError.set(
          err?.error?.mensaje || err?.error?.error || 'No se pudo eliminar el usuario'
        );
        return of(null);
      })
    ).subscribe();
  }

  private mostrarMensajeListaExito(texto: string): void {
    this.mensajeListaExito.set(texto);
    setTimeout(() => this.mensajeListaExito.set(null), 3500);
  }

  private cargarUsuarios(): void {
    this.cargandoUsuarios.set(true);
    this.errorListadoUsuarios.set(null);
    this.http.get<UsuarioListado[]>(`${this.apiUrl}/usuarios`).pipe(
      tap((datos) => {
        this.usuarios.set(datos);
        this.cargandoUsuarios.set(false);
      }),
      catchError((err) => {
        console.error('Error al cargar usuarios:', err);
        this.cargandoUsuarios.set(false);
        this.errorListadoUsuarios.set('No se pudieron cargar los usuarios.');
        return of([]);
      })
    ).subscribe();
  }

  /** Carga códigos existentes para evitar duplicados al generar ISIL-XXXXXX. */
  private cargarAlumnos(): void {
    this.http.get<Estudiante[]>(`${this.apiUrl}/estudiantes`).pipe(
      tap((datos) => this.alumnos.set(datos)),
      catchError((err) => {
        console.error('Error al cargar alumnos:', err);
        return of([]);
      })
    ).subscribe();
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

  private mensajeExitoParaRol(rol: string): string {
    return rol === 'estudiante' ? 'Alumno creado' : 'Usuario creado';
  }

  onSubmit(): void {
    if (this.usuarioForm.invalid) {
      this.usuarioForm.markAllAsTouched();
      return;
    }

    const v = this.usuarioForm.getRawValue();
    const dto: CrearAlumnoDTO = {
      nombre: v.nombre,
      correo: v.correo,
      password: v.password,
      rol: v.rol
    };
    if (v.rol === 'estudiante') {
      dto.codigo = (v.codigo && v.codigo.trim().length > 0) ? v.codigo.trim().toUpperCase() : this.generarCodigoInstitucional();
      dto.carrera = v.carrera;
    }

    this.limpiarTimeoutExito();
    this.mensajeExito.set(null);
    this.mensajeError.set(null);

    const rolEnviado = v.rol;

    this.http.post<{ mensaje: string; usuario: unknown; estudiante: Estudiante | null }>(
      `${this.apiUrl}/admin/alumnos`,
      dto
    ).pipe(
      tap(() => {
        this.mostrarMensajeExito(this.mensajeExitoParaRol(rolEnviado));
        this.usuarioForm.reset({
          nombre: '',
          correo: '',
          password: '',
          rol: 'estudiante',
          codigo: this.generarCodigoInstitucional(),
          carrera: ''
        });
        this.rolSeleccionado.set('estudiante');
        this.cargarAlumnos();
        this.cargarUsuarios();
      }),
      catchError((err) => {
        this.mensajeError.set(
          err?.error?.mensaje || err?.error?.error || 'Error al crear el usuario'
        );
        return of(null);
      })
    ).subscribe();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.usuarioEnEdicion()) {
      this.cerrarEditarUsuario();
    }
  }
}
