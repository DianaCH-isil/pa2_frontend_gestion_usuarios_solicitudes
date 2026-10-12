import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SolicitudesList } from './components/solicitudes-list/solicitudes-list';
import { SolicitudForm } from './components/solicitud-form/solicitud-form';
import { Login } from './components/login/login';
import { HomeRedirect } from './components/home-redirect/home-redirect';
import { GestionUsuarios } from './components/gestion-usuarios/gestion-usuarios';
import { EstudiantesRegistrados } from './components/estudiantes-registrados/estudiantes-registrados';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: Login,
    title: 'Iniciar Sesión'
  },
  {
    path: '',
    pathMatch: 'full',
    component: HomeRedirect,
    canActivate: [authGuard]
  },
  {
    path: 'bandeja',
    component: SolicitudesList,
    canActivate: [authGuard, roleGuard('administrador', 'personal')],
    title: 'Bandeja de Solicitudes'
  },
  {
    path: 'mis-solicitudes',
    component: SolicitudesList,
    canActivate: [authGuard, roleGuard('estudiante')],
    title: 'Mis Solicitudes'
  },
  {
    path: 'nueva-solicitud',
    component: SolicitudForm,
    canActivate: [authGuard, roleGuard('estudiante')],
    title: 'Nueva Solicitud'
  },
  {
    path: 'gestion-usuarios',
    component: GestionUsuarios,
    canActivate: [authGuard, roleGuard('administrador')],
    title: 'Gestión de Usuarios'
  },
  {
    path: 'estudiantes-registrados',
    component: EstudiantesRegistrados,
    canActivate: [authGuard, roleGuard('administrador')],
    title: 'Estudiantes registrados'
  },
  {
    path: '**',
    component: HomeRedirect,
    canActivate: [authGuard]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
