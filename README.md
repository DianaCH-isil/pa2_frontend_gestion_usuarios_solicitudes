# Plataforma de Gestión de Solicitudes Académicas

**Curso:** Programación Web Avanzada · **Código:** 4060 · **Institución:** ISIL · **Periodo:** 202620
**Evaluación:** PA1 

## Integrantes

| Nombre completo | Rol | Participación |
|---|---|---|
| Diana Carolina Clabel Human | Desarrollo full-stack | Aporte equitativo en las cuatro actividades: tipos, componentes, formulario y consumo de API. |
| Linder Aaron Pereyra Cabrejos | Desarrollo full-stack | Aporte equitativo en las cuatro actividades: tipos, componentes, formulario y consumo de API. |



## Descripción

Aplicación web para radicar, consultar y dar seguimiento a solicitudes
académicas de los estudiantes de ISIL. La interfaz está construida en
**Angular** con tipado estricto en TypeScript y consume una **API REST
propia** implementada en **Node.js + Express + TypeScript**, disponible
en la carpeta `server/` del repositorio.

## Objetivo

Demostrar dominio de JavaScript moderno y TypeScript, arquitectura de
componentes en Angular, formularios reactivos con validaciones y
navegación entre rutas, y consumo de una API REST mediante `HttpClient`,
manteniendo una solución modular con tipado estático riguroso.

## Desarrollo

El proyecto se construyó de manera incremental. Primero se definieron
los tipos e interfaces del dominio (`SolicitudAcademica`, `Estudiante`,
`NuevaSolicitudDTO`, `MetricasSolicitudes`), luego se montó la
arquitectura de componentes standalone con su módulo de routing
tradicional, después el formulario reactivo con sus validaciones
personalizadas y finalmente el consumo de la API REST mediante
`HttpClient` desde un servicio inyectado.

## Solución propuesta

### Actividad 1: Base tipada y modular
**Responsables:** Diana Carolina Clabel Human y Linder Aaron Pereyra Cabrejos

**Cómo lo trabajamos**

- Definimos los modelos en `src/app/models/solicitud.model.ts` y
  `server/src/models/solicitud.model.ts` como **interfaces TypeScript**
  (`SolicitudAcademica`, `Estudiante`, `NuevaSolicitudDTO`,
  `MetricasSolicitudes`) y como **union types** los estados y las
  categorías (`'Aprobada' | 'En Revisión' | 'Pendiente' | 'Rechazada'`).
- Activamos `strict: true`, `strictTemplates`,
  `noImplicitOverride`, `noPropertyAccessFromIndexSignature` y
  `strictInputAccessModifiers` en `tsconfig.json` para que el compilador
  rechace cualquier valor fuera del contrato antes de ejecutar.
- Separamos la lógica en módulos por responsabilidad:
  `models/`, `services/`, `components/`, `directives/` y
  `server/src/{models,data}`.
- Documentamos las decisiones de estructura en
  [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) y los endpoints de la
  API en [`docs/API.md`](docs/API.md).

**Recursos de ES6+ empleados**

Arrow functions, clases, template literals, destructuring, spread/rest,
parámetros por defecto, encadenamiento opcional (`?.`), módulos
`import`/`export` y los métodos funcionales de `Array`
(`map`, `filter`, `reduce`, `find`, `findIndex`).

### Actividad 2: Arquitectura de componentes Angular
**Responsables:** Diana Carolina Clabel Human y Linder Aaron Pereyra Cabrejos

**Cómo lo trabajamos**

- Generamos seis componentes con Angular CLI: `Header`, `Sidebar`,
  `Footer`, `SolicitudesList`, `SolicitudForm` y
  `SolicitudDetalleModal`, todos declarados como **standalone** para
  aprovechar la carga diferida natural de Angular 20.
- Creamos la directiva `StatusBadgeDirective` con `@Input` y
  `Renderer2` para aplicar clases CSS según el estado de la solicitud,
  aislando la lógica visual del componente que muestra los datos.
- Implementamos `SolicitudesService` como `@Injectable({
  providedIn: 'root' })` para tener una única instancia compartida
  (singleton) accesible vía `inject(SolicitudesService)` desde cualquier
  componente.
- Construimos `AppRoutingModule` con `RouterModule.forRoot(routes)`
  para mantener el patrón clásico de routing además de
  `provideRouter(routes)`, que sigue funcionando en paralelo.
- Aplicamos data binding en sus cuatro formas: interpolación
  (`{{ solicitud.codigoRadicado }}`), property binding
  (`[appStatusBadge]="solicitud.estado"`), event binding
  (`(click)="abrirDetalle(solicitud)"`) y directivas estructurales
  (`*ngFor`, `*ngIf`).

**Estructura**

```
src/app/
├── app.ts / app.html / app.scss
├── app.config.ts
├── app.routes.ts
├── app-routing.module.ts
├── components/
│   ├── header/
│   ├── sidebar/
│   ├── footer/
│   ├── solicitudes-list/
│   ├── solicitud-form/
│   └── solicitud-detalle-modal/
├── directives/
│   └── status-badge.directive.ts
├── models/
│   └── solicitud.model.ts
└── services/
    └── solicitudes.service.ts
```

### Actividad 3: Formulario reactivo, validaciones y navegación
**Responsables:** Diana Carolina Clabel Human y Linder Aaron Pereyra Cabrejos

**Cómo lo trabajamos**

- Habilitamos `ReactiveFormsModule` y `FormBuilder` en
  `SolicitudForm` para construir el `FormGroup` con sus validaciones
  declaradas en `ngOnInit`.
- Aplicamos los validadores built-in (`required`, `minLength`,
  `maxLength`, `pattern`, `email`, `requiredTrue`) según el campo y
  agregamos dos **validadores personalizados**:
  - `validadorCorreoInstitucional`: restringe el dominio del correo a
    `@isil.pe` o `@isil.edu.pe`.
  - `validadorSinEspaciosVacios`: rechaza cadenas que contengan sólo
    espacios.
- Configuramos las rutas en `app.routes.ts` y `AppRoutingModule` con
  tres destinos: `''` redirige a `'bandeja'`, `'bandeja'` carga
  `SolicitudesList`, `'nueva-solicitud'` carga `SolicitudForm` y
  `'**'` redirige a `'bandeja'` como catch-all.
- Tras el envío exitoso, `SolicitudForm` redirige a `/bandeja`
  con `router.navigate` para mostrar la solicitud recién creada.
- Implementamos dos botones auxiliares en el formulario
  (`Cargar caso válido` / `Cargar caso inválido`) que demuestran el
  comportamiento de cada regla de validación al ser ejecutados.

**Validaciones del formulario**

| Campo | Reglas |
|---|---|
| `tipoTramite` | requerido |
| `descripcionDetalle` | requerido, 5-100 caracteres, no sólo espacios |
| `estudianteCodigo` | requerido, patrón `ISIL-######` u 8 dígitos, no sólo espacios |
| `estudianteEmail` | requerido, formato de correo, dominio `@isil.pe` o `@isil.edu.pe` |
| `justificacion` | requerido, 20-500 caracteres, no sólo espacios |

### Actividad 4: Consumo de una API REST desde Angular
**Responsables:** Diana Carolina Clabel Human y Linder Aaron Pereyra Cabrejos

**Cómo lo trabajamos**

- Registramos `provideHttpClient(withFetch())` en `app.config.ts` para
  habilitar el cliente HTTP global.
- Centralizamos todas las llamadas en `SolicitudesService` mediante
  `inject(HttpClient)`, exponiendo:
  - `cargarSolicitudes()` → `GET /api/solicitudes`.
  - `crearSolicitud(dto)` → `POST /api/solicitudes`.
  - `actualizarEstado(id, estado)` →
    `PATCH /api/solicitudes/:id/estado`.
- Implementamos la **API REST propia** en `server/src/server.ts` con
  Express y TypeScript. Los endpoints devuelven JSON y validan los
  datos en el servidor (código de respuesta 400 para entradas
  incompletas y 404 cuando el id no existe).
- Persistimos las solicitudes en un repositorio en memoria poblado
  desde `server/src/data/initial-data.ts` (6 solicitudes de ejemplo).
- Incorporamos un **fallback offline** en el servicio: si la API no
  responde, los componentes siguen mostrando los datos locales sin
  romper la navegación.

**Estructura del backend**

```
server/
├── src/
│   ├── server.ts                 # Express + endpoints REST
│   ├── models/solicitud.model.ts # Tipos compartidos
│   └── data/initial-data.ts      # Datos de ejemplo
├── dist/                         # generado por build:server
└── tsconfig.server.json          # target ES2022, strict: true
```

**Endpoints disponibles**

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Estado del servicio |
| GET | `/api/solicitudes` | Listado (acepta filtros) |
| GET | `/api/solicitudes/:id` | Búsqueda por id o radicado |
| POST | `/api/solicitudes` | Registra una solicitud |
| PATCH | `/api/solicitudes/:id/estado` | Actualiza el estado |
| GET | `/api/estudiantes` | Listado de estudiantes |
| GET | `/api/estudiantes/:codigo` | Búsqueda por código |
| GET | `/api/metricas` | Métricas agregadas |

## Cómo ejecutar o revisar

### Requisitos

- Node.js 18.x o superior.
- npm 9.x o superior.

### Instalación

```bash
npm install
```

### Compilar y levantar el backend (API REST)

```bash
npm run build:server   # compila TypeScript → server/dist/
npm run server         
```

### Levantar el frontend Angular

En otra terminal:

```bash
npm start              # abre http://localhost:4200
```



### Verificar la compilación estricta

```bash
npx ng build --configuration development
npx tsc --noEmit -p server/tsconfig.server.json
```

Si no imprime errores, el tipado estático es correcto en ambos
procesos.

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

| Integrante | Desarrollo | Pruebas | Documentación | Exposición | Evidencia de participación |
|---|---|---|---|---|---|
| Diana Carolina Clabel Human | Alta | Alta | Alta | Sí | Commits en el repositorio, capturas adjuntas y exposición del trabajo realizado. |
| Linder Aaron Pereyra Cabrejos | Alta | Alta | Alta | Sí | Commits en el repositorio, capturas adjuntas y exposición del trabajo realizado. |

> La participación de ambos integrantes fue equitativa en las cuatro
> actividades de la evaluación.

## Conclusiones

- **Actividad 1:** Definir los tipos e interfaces antes de construir los
  componentes permitió que TypeScript detectara cualquier inconsistencia
  entre el modelo del frontend y el contrato de la API REST durante la
  compilación, evitando errores en tiempo de ejecución. El modo
  `strict` y los union types garantizan que sólo valores válidos lleguen
  al formulario y a la API.
- **Actividad 2:** La separación entre componentes (presentación) y el
  servicio inyectado (lógica de datos) mantuvo las vistas limpias y
  permitió reutilizar `SolicitudesService` desde cualquier componente
  sin duplicar código. La directiva `StatusBadgeDirective` aisló la
  lógica visual del badge de estado del componente que muestra los
  datos.
- **Actividad 3:** El formulario reactivo con validadores
  personalizados (correo institucional, código de estudiante, longitud
  de justificación) demostró ser más mantenible que las validaciones
  dispersas en el HTML. Las rutas configuradas en `AppRoutingModule`
  organizaron la navegación entre la bandeja y el formulario.
- **Actividad 4:** Consumir la API REST desde `SolicitudesService` con
  `HttpClient` desacopló la vista del origen de los datos. La API
  escrita en TypeScript con Express mantiene el mismo modelo del
  frontend y permite que cualquier cambio en el contrato se detecte al
  compilar.
- **General:** La estructura modular (models, services, components,
  directives) facilitó la lectura del código y la incorporación de
  mejoras visuales sin afectar la lógica de negocio. El equipo pudo
  iterar sobre el estilo (degradando gradualmente a una apariencia más
  sencilla tipo estudiante) sin romper ninguna funcionalidad.

## Video de exposición

**Video público de YouTube:** 
Link del video en youtube: https://youtu.be/Kfo5Ma2AcPE
