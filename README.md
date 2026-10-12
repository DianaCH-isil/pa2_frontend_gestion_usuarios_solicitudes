# Plataforma de Gestión de Solicitudes Académicas — Frontend (PA1)

**Curso:** Programación Web II · **Código:** 30690 · **Institución:** ISIL · **Periodo:** 202620
**Evaluación:** PA1 (frontend) + PA2 (backend)

## Integrantes

| Nombre completo | Rol | Participación |
|---|---|---|
| Diana Carolina Clabel Huaman | Desarrollo full-stack | Desarrollo de componentes standalone  gestion-usuarios, estudiantes-registrados y consumo e integración de servicios REST con la API. |

## Descripción

Aplicación web para radicar, consultar y dar seguimiento a solicitudes
académicas de los estudiantes de ISIL. La interfaz está construida en
**Angular 20** con tipado estricto en TypeScript y consume la **API REST
Node.js + Express + MongoDB** del repositorio hermano
`pa2_backend_gestion_usuarios_solicitudes`.

## Objetivo

Demostrar dominio de JavaScript moderno y TypeScript, arquitectura de
componentes en Angular, formularios reactivos con validaciones y
navegación entre rutas, y consumo de una API REST mediante `HttpClient`,
manteniendo una solución modular con tipado estático riguroso.

## Stack

- **Angular 20** (standalone components, Signals + RxJS).
- **TypeScript** en modo `strict`.
- **Reactive Forms** con validaciones built-in y personalizadas.
- **HttpClient** para consumir la API del backend.
- **MongoDB** en el backend (persistencia real desde la PA2).

## Estructura del proyecto

```
pa2_frontend_gestion_usuarios_solicitudes/
├── public/                       # Recursos estáticos
│   ├── favicon.ico
│   ├── logo.png
│   └── user.png
├── src/                          # Frontend Angular
│   ├── index.html
│   ├── main.ts
│   ├── styles.scss
│   └── app/
│       ├── app.ts / app.html / app.scss
│       ├── app.config.ts
│       ├── app.routes.ts
│       ├── app-routing.module.ts
│       ├── components/
│       │   ├── header/
│       │   ├── sidebar/
│       │   ├── footer/
│       │   ├── solicitudes-list/
│       │   ├── solicitud-form/
│       │   └── solicitud-detalle-modal/
│       ├── directives/
│       │   └── status-badge.directive.ts
│       ├── models/
│       │   └── solicitud.model.ts
│       └── services/
│           └── solicitudes.service.ts
├── angular.json
├── package.json
├── package-lock.json
├── tsconfig.json / tsconfig.app.json / tsconfig.spec.json
└── README.md
```

## Desarrollo por actividad

### Actividad 1 — Base tipada y modular
- Modelos en `src/app/models/solicitud.model.ts` con **interfaces**
  TypeScript (`SolicitudAcademica`, `Estudiante`, `NuevaSolicitudDTO`,
  `MetricasSolicitudes`) y **union types** para los estados y categorías.
- `strict: true`, `strictTemplates`, `noImplicitOverride`,
  `noPropertyAccessFromIndexSignature` y
  `strictInputAccessModifiers` activados.
- Separación en módulos: `models/`, `services/`, `components/`,
  `directives/`.

### Actividad 2 — Arquitectura de componentes Angular
- Componentes **standalone**: `Header`, `Sidebar`, `Footer`,
  `SolicitudesList`, `SolicitudForm`, `SolicitudDetalleModal`.
- Directiva `StatusBadgeDirective` con `@Input` y `Renderer2` para
  aplicar clases CSS según el estado de la solicitud.
- `SolicitudesService` como `@Injectable({ providedIn: 'root' })`.
- Routing dual: `AppRoutingModule` (NgModule clásico) y `provideRouter()`
  en `app.config.ts`.
- Data binding: interpolación, property binding, event binding y
  directivas estructurales (`*ngFor`, `*ngIf`).

### Actividad 3 — Formulario reactivo, validaciones y navegación
- `ReactiveFormsModule` + `FormBuilder` en `SolicitudForm`.
- Validadores built-in (`required`, `minLength`, `maxLength`, `pattern`,
  `email`, `requiredTrue`) + dos validadores personalizados:
  - `validadorCorreoInstitucional`: restringe a `@isil.pe` o `@isil.edu.pe`.
  - `validadorSinEspaciosVacios`: rechaza cadenas con sólo espacios.
- Rutas: `''` → `bandeja` (carga `SolicitudesList`), `nueva-solicitud`
  (carga `SolicitudForm`), `**` → `bandeja`.

**Validaciones del formulario**

| Campo | Reglas |
|---|---|
| `tipoTramite` | requerido |
| `descripcionDetalle` | requerido, 5-100 caracteres, no sólo espacios |
| `estudianteCodigo` | requerido, patrón `ISIL-######` u 8 dígitos, no sólo espacios |
| `estudianteEmail` | requerido, formato de correo, dominio `@isil.pe` o `@isil.edu.pe` |
| `justificacion` | requerido, 20-500 caracteres, no sólo espacios |

### Actividad 4 — Consumo de una API REST desde Angular
- `provideHttpClient(withFetch())` en `app.config.ts`.
- Todas las llamadas pasan por `SolicitudesService`:
  - `cargarSolicitudes()` → `GET /api/solicitudes`.
  - `crearSolicitud(dto)` → `POST /api/solicitudes`.
  - `actualizarEstado(id, estado)` → `PATCH /api/solicitudes/:id/estado`.
- **Fallback offline** integrado: si la API no responde, los componentes
  siguen mostrando los datos locales sin romper la navegación.

## Backend 

El backend que consume este frontend vive en su propio repositorio:

- **Ruta:** `pa2_backend_gestion_usuarios_solicitudes`
- **Stack:** Node.js · Express 5 · MongoDB · Mongoose · JWT · bcryptjs · helmet · cors · morgan
- **Persistencia:** MongoDB (no más almacenamiento en memoria).
- **Auth:** JWT con middlewares `verificarToken` y `verificarRol`.
- **Seed automático** al arrancar: 8 usuarios, 4 estudiantes y 6
  solicitudes (todas las contraseñas son `123`).
- **Credenciales del seed:**

  | Rol | Correo | Contraseña |
  |---|---|---|
  | Administrador | `admin@isil.pe` | `123` |
  | Personal | `personal@isil.pe` | `123` |
  | Estudiante (Diana) | `diana@isil.pe` | `123` |
  | Estudiante (Linder) | `linder@isil.pe` | `123` |
  | Estudiante (Valeria) | `valeria@isil.pe` | `123` |
  | Estudiante (Carlos) | `carlos@isil.pe` | `123` |
  | Estudiante (Andrea) | `andrea@isil.pe` | `123` |
  | Estudiante (Mateo) | `mateo@isil.pe` | `123` |

  Estas credenciales son exclusivamente del ambiente de desarrollo del
  seed y **no deben usarse en producción**.

- **URL base esperada:** `http://localhost:3000/api`.
- **Contrato completo:** ver `docs/API.md` de este repositorio y
  `docs/API.md` del backend.

## Cómo ejecutar o revisar

### Requisitos
- Node.js 18.x o superior (recomendado 20 LTS).
- npm 9.x o superior.
- (Para el backend) MongoDB 6.x o superior.

### 1. Instalar dependencias del frontend

```bash
npm install
```

### 2. Levantar el backend

En otra terminal, dentro del repo del backend:

```bash
cd ../pa2_backend_gestion_usuarios_solicitudes
npm install
npm run dev        # o npm start
```

Al arrancar, el backend conecta a MongoDB y, si la BD está vacía, siembra
los datos de ejemplo.

### 3. Levantar el frontend

```bash
npm start
```

Abre `http://localhost:4200`. La app se conecta automáticamente a
`http://localhost:3000/api`. Si el backend no responde, el servicio
aplica el **fallback offline** y muestra los datos locales.

### 4. Verificar la compilación estricta

```bash
npx ng build --configuration development
```

Si no imprime errores, el tipado estático es correcto.

## Configuración de la URL del backend

`SolicitudesService` define la URL base como constante:

```ts
public readonly apiUrl = 'http://localhost:3000/api';
```

Para apuntar a otro entorno (staging, producción, IP de un compañero,
etc.) basta con cambiar esa línea en
`src/app/services/solicitudes.service.ts`. Todas las rutas cuelgan de
`apiUrl`, así que un solo cambio cubre GET/POST/PATCH de solicitudes y
los futuros endpoints autenticados (`/api/auth/login`,
`/api/auth/me`).

## Evidencias

Las capturas de pantalla están guardadas en
[`docs/evidencias/`](docs/evidencias/).

| # | Captura | Descripción |
|---|---|---|
| 1 | `bandeja-inicial.png` | Bandeja de solicitudes con 10 registros y botón **Ver más** en cada fila. |
| 2 | `formulario-valido.png` | Formulario reactivo completado con datos válidos en todos los campos. |
| 3 | `solicitud-hecha.png` | Mensaje **Solicitud hecha!** mostrado al pie del formulario tras el envío. |
| 4 | `bandeja-actualizada.png` | Bandeja actualizada con la nueva solicitud radicada al inicio de la tabla. |

## Matriz de participación

| Integrante | Desarrollo | Pruebas | Documentación | Exposición | Evidencia |
|---|---|---|---|---|---|
| Diana Carolina Clabel Human | Alta | Alta | Alta | Sí | Commits, capturas y exposición. |




## Conclusiones

- **Actividad 1:** Definir los tipos e interfaces antes de construir los
  componentes permitió que TypeScript detectara cualquier inconsistencia
  entre el modelo del frontend y el contrato de la API REST durante la
  compilación.
- **Actividad 2:** La separación entre componentes y el servicio
  inyectado mantuvo las vistas limpias y permitió reutilizar
  `SolicitudesService` desde cualquier componente sin duplicar código.
- **Actividad 3:** El formulario reactivo con validadores personalizados
  demostró ser más mantenible que validaciones dispersas en el HTML.
- **Actividad 4:** Consumir la API REST con `HttpClient` desacopló la
  vista del origen de los datos. **En la PA2** ese origen pasó de ser
  un repositorio en memoria a **MongoDB** real, sin necesidad de
  modificar el frontend (más allá de la URL del servicio).
- **General:** La estructura modular (models, services, components,
  directives) facilitó la lectura del código y la incorporación de
  mejoras sin afectar la lógica de negocio.

## Video de exposición (PA1)

**Video público de YouTube (PA2):** 

> La exposición de la **PA2** (backend) se publica en el README del
> repositorio del backend.

## Repositorios

- **Frontend (este repo):** `pa2_frontend_gestion_usuarios_solicitudes`
- **Backend (repositorio hermano):** `pa2_backend_gestion_usuarios_solicitudes`
