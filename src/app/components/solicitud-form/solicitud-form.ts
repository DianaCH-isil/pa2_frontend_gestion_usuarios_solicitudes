import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SolicitudesService } from '../../services/solicitudes.service';
import { AuthService } from '../../services/auth.service';
import { homeForRole } from '../../guards/role.guard';
import { NuevaSolicitudDTO } from '../../models/solicitud.model';

/**
 * Validador personalizado ES6+: Verifica que el correo pertenezca al dominio institucional (@isil.pe o @isil.edu.pe)
 */
function validadorCorreoInstitucional(control: AbstractControl): ValidationErrors | null {
  const valor = control.value;
  if (!valor || typeof valor !== 'string') return null;
  const valorTrim = valor.trim().toLowerCase();
  if (!valorTrim) return null;

  // Formato de email general
  const esEmailValido = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(valorTrim);
  if (!esEmailValido) {
    return { correoInvalido: true };
  }

  // Dominio institucional ISIL
  const esDominioInstitucional = /^[a-zA-Z0-9._%+-]+@(isil\.pe|isil\.edu\.pe)$/.test(valorTrim);
  if (!esDominioInstitucional) {
    return { dominioNoInstitucional: true };
  }

  return null;
}

/**
 * Validador personalizado ES6+: Verifica que el texto no contenga solo espacios en blanco
 */
function validadorSinEspaciosVacios(control: AbstractControl): ValidationErrors | null {
  const valor = control.value;
  if (valor && typeof valor === 'string' && valor.trim().length === 0) {
    return { soloEspacios: true };
  }
  return null;
}

@Component({
  selector: 'app-solicitud-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './solicitud-form.html',
  styleUrl: './solicitud-form.scss'
})
export class SolicitudForm implements OnInit {
  // Servicios inyectados (todos private; se usan en código TS, no en template)
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  protected readonly solicitudesService = inject(SolicitudesService);

  // Estado del formulario (público para acceso desde el template)
  public solicitudForm!: FormGroup;
  public proximoRadicado = signal<string>('');
  public mensajeExito = signal<string | null>(null);
  public mensajeError = signal<string | null>(null);
  public errorCarga = signal<string | null>(null);
  public guardando = signal<boolean>(false);

  // Opciones de trámites curriculares
  public readonly listaTramites = [
    'Revisión de Calificación Final',
    'Cancelación Extemporánea',
    'Homologación de Créditos',
    'Certificado de Notas con Apostilla',
    'Habilitación Supletoria',
    'Beca de Excelencia e Investigación',
    'Cambio de Turno / Horario',
    'Otros'
  ];

  ngOnInit(): void {
    try {
      this.proximoRadicado.set(this.solicitudesService.generarProximoRadicado());
      this.inicializarFormulario();
    } catch (err) {
      console.error('[SolicitudForm] Error al inicializar:', err);
      this.errorCarga.set('Error al inicializar el formulario: ' + (err as Error).message);
    }
  }

  private inicializarFormulario(): void {
    // Pre-llenar el email con el correo del usuario en sesión.
    // Los estudiantes obtienen su propio correo; admin/personal lo dejan vacío.
    const currentUser = this.authService.currentUser();
    const emailPorDefecto = currentUser?.correo ?? '';

    this.solicitudForm = this.fb.group({
      codigoRadicado: [{ value: this.proximoRadicado(), disabled: true }],
      tipoTramite: ['', [Validators.required]],
      descripcionDetalle: [
        '',
        [
          Validators.required,
          Validators.minLength(5),
          Validators.maxLength(100),
          validadorSinEspaciosVacios
        ]
      ],
      estudianteCodigo: [
        '',
        [
          Validators.required,
          Validators.pattern(/^(ISIL-\d{6}|\d{8})$/),
          validadorSinEspaciosVacios
        ]
      ],
      estudianteEmail: [
        emailPorDefecto,
        [
          Validators.required,
          Validators.email,
          validadorCorreoInstitucional
        ]
      ],
      justificacion: [
        '',
        [
          Validators.required,
          Validators.minLength(20),
          Validators.maxLength(500),
          validadorSinEspaciosVacios
        ]
      ]
    });
  }

  // Getter para facilitar validaciones en la plantilla
  public get f() {
    return this.solicitudForm?.controls ?? {};
  }

  public get conteoCaracteres(): number {
    return this.solicitudForm?.get('justificacion')?.value?.length ?? 0;
  }

  public esInvalido(nombreCampo: string): boolean {
    const control = this.solicitudForm?.get(nombreCampo);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  public esValido(nombreCampo: string): boolean {
    const control = this.solicitudForm?.get(nombreCampo);
    return !!(control && control.valid && (control.dirty || control.touched));
  }

  public cargarCasoValido(): void {
    if (!this.solicitudForm) return;
    this.solicitudForm.patchValue({
      tipoTramite: 'Revisión de Calificación Final',
      descripcionDetalle: 'Corte 3 • Revisión de rúbrica evaluación continua',
      estudianteCodigo: 'ISIL-742910',
      estudianteEmail: 'valeria.restrepo@isil.pe',
      justificacion: 'Solicito formalmente la revisión del entregable final de arquitectura debido a que el porcentaje de despliegue en AWS cumple con todos los criterios exigidos en la rúbrica.'
    });
    this.solicitudForm.markAllAsTouched();
    this.mensajeExito.set(null);
    this.mensajeError.set(null);
  }

  public cargarCasoInvalido(): void {
    if (!this.solicitudForm) return;
    this.solicitudForm.patchValue({
      tipoTramite: '',
      descripcionDetalle: 'Ab',
      estudianteCodigo: 'ABC-12',
      estudianteEmail: 'correo-no-valido',
      justificacion: 'Pocos caracteres'
    });
    this.solicitudForm.markAllAsTouched();
    this.mensajeExito.set(null);
    this.mensajeError.set(null);
  }

  public limpiarFormulario(): void {
    if (!this.solicitudForm) return;
    this.solicitudForm.reset({
      codigoRadicado: this.solicitudesService.generarProximoRadicado(),
      tipoTramite: '',
      descripcionDetalle: '',
      estudianteCodigo: '',
      estudianteEmail: '',
      justificacion: ''
    });
    this.mensajeExito.set(null);
    this.mensajeError.set(null);
  }

  public onSubmit(): void {
    if (!this.solicitudForm || this.solicitudForm.invalid || this.guardando()) {
      this.solicitudForm?.markAllAsTouched();
      return;
    }

    const formValues = this.solicitudForm.getRawValue();
    const dto: NuevaSolicitudDTO = {
      tipoTramite: formValues.tipoTramite,
      descripcionDetalle: formValues.descripcionDetalle,
      estudianteCodigo: formValues.estudianteCodigo,
      estudianteEmail: formValues.estudianteEmail,
      justificacion: formValues.justificacion,
      aceptaTerminos: true
    };

    this.guardando.set(true);
    this.mensajeError.set(null);

    this.solicitudesService.crearSolicitud(dto).subscribe({
      next: (nueva) => {
        this.guardando.set(false);
        this.mensajeExito.set(`¡Solicitud ${nueva.codigoRadicado} radicada con éxito! Redirigiendo a la bandeja...`);
        setTimeout(() => {
          this.router.navigateByUrl(homeForRole(this.authService.currentUser()?.rol));
        }, 1500);
      },
      error: (error) => {
        this.guardando.set(false);
        console.error('Error al registrar la solicitud:', error);
        const mensaje = error?.error?.mensaje || error?.error?.error || error?.message || 'Error desconocido';
        this.mensajeError.set(mensaje);
      }
    });
  }
}
