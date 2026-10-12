import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export type RolUsuario = 'estudiante' | 'administrador' | 'personal';

export interface CurrentUser {
  id: string;
  nombre: string;
  correo: string;
  rol: RolUsuario;
}

interface AuthResponse {
  mensaje: string;
  usuario: CurrentUser;
  token: string;
}

interface PersistedSession {
  user: CurrentUser;
  token: string;
  exp: number | null;
}

/**
 * Servicio de autenticación.
 *
 * - POST /api/auth/login guarda el JWT en sessionStorage y expone
 *   al usuario actual como signal.
 * - Al refrescar la página, recupera la sesión si el token no ha expirado.
 * - Expone signals computados para que el sidebar, el header y los
 *   guards decidan qué mostrar en función del rol.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api';
  private readonly storageKey = 'isil_auth';

  private readonly _currentUser = signal<CurrentUser | null>(null);
  private readonly _token = signal<string | null>(null);

  public readonly currentUser = this._currentUser.asReadonly();
  public readonly token = this._token.asReadonly();
  public readonly isAuthenticated = computed(() => this._currentUser() !== null);
  public readonly isAdmin = computed(() => this._currentUser()?.rol === 'administrador');
  public readonly isPersonal = computed(() => this._currentUser()?.rol === 'personal');
  public readonly isEstudiante = computed(() => this._currentUser()?.rol === 'estudiante');

  constructor() {
    this.restoreSession();
  }

  public login(correo: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/login`, { correo, password })
      .pipe(tap((res) => this.saveSession(res)));
  }

  public logout(): void {
    this._currentUser.set(null);
    this._token.set(null);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(this.storageKey);
    }
  }

  private saveSession(res: AuthResponse): void {
    const exp = this.decodeExp(res.token);
    this._currentUser.set(res.usuario);
    this._token.set(res.token);
    if (typeof window !== 'undefined') {
      const payload: PersistedSession = { user: res.usuario, token: res.token, exp };
      sessionStorage.setItem(this.storageKey, JSON.stringify(payload));
    }
  }

  private restoreSession(): void {
    if (typeof window === 'undefined') return;
    const raw = sessionStorage.getItem(this.storageKey);
    if (!raw) return;
    try {
      const data = JSON.parse(raw) as PersistedSession;
      if (typeof data.exp === 'number' && Date.now() >= data.exp * 1000) {
        sessionStorage.removeItem(this.storageKey);
        return;
      }
      this._currentUser.set(data.user);
      this._token.set(data.token);
    } catch {
      sessionStorage.removeItem(this.storageKey);
    }
  }

  private decodeExp(token: string): number | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1])) as { exp?: number };
      return typeof payload.exp === 'number' ? payload.exp : null;
    } catch {
      return null;
    }
  }
}
