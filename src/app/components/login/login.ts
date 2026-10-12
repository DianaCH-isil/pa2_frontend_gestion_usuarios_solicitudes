import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly loginForm: FormGroup = this.fb.group({
    correo: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(3)]]
  });

  protected readonly mensajeError = signal<string | null>(null);
  protected readonly cargando = signal<boolean>(false);

  get f() {
    return this.loginForm.controls;
  }

  esInvalido(campo: string): boolean {
    const c = this.loginForm.get(campo);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  onSubmit(): void {
    if (this.loginForm.invalid || this.cargando()) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { correo, password } = this.loginForm.getRawValue();
    this.cargando.set(true);
    this.mensajeError.set(null);

    this.authService.login(correo, password).subscribe({
      next: () => {
        this.cargando.set(false);
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        this.router.navigateByUrl(returnUrl || '/');
      },
      error: (err) => {
        this.cargando.set(false);
        const msg = err?.error?.mensaje || err?.error?.error || 'No se pudo iniciar sesión';
        this.mensajeError.set(msg);
      }
    });
  }
}
