# Route Optimizer

Aplicación web que calcula la ruta óptima entre hasta 15 destinos usando un algoritmo genético. Las distancias reales de conducción se obtienen de la Google Maps Distance Matrix API; el resultado se visualiza en un mapa interactivo de Google Maps.

**Integrantes**
- Ingrid Nina Alessandra Nájera Marakovits — 231088
- Diego Ramírez — 23601
- Jorge Palacios - 231385
- Wilsón Calderón - 22018

---

## Arquitectura

```
Browser (React + Vite)
  │  Login con Firebase Authentication
  │  Ingreso de destinos con Google Places Autocomplete
  │  Visualización de ruta en Google Maps JS API
  │
  └─► Cloud Function (Python — GCP)
        │  Verifica token de Firebase
        │  Valida IP del cliente
        │  Construye matriz de distancias con Distance Matrix API
        └─► Algoritmo genético → retorna orden óptimo y distancia total
```

**Stack**
| Capa | Tecnología |
|---|---|
| Frontend | React 19 + Vite |
| Autenticación | Firebase Authentication |
| Mapa | Google Maps JavaScript API + Places API + Directions API |
| Backend | Python 3.11 + Flask (functions-framework) |
| Cómputo en la nube | Google Cloud Functions Gen 2 |
| Distancias | Google Maps Distance Matrix API |

---

## Estructura de carpetas

```
route-optimizer/
├── README.md
├── .gitignore
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── .env.example          ← copia a .env y completa los valores
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── pages/
│       │   ├── LandingPage.jsx
│       │   ├── LoginPage.jsx
│       │   ├── SignUpPage.jsx
│       │   └── OptimizerPage.jsx
│       ├── components/
│       │   ├── Map.jsx
│       │   ├── DestinationInput.jsx
│       │   └── RouteResult.jsx
│       ├── services/
│       │   ├── firebase.js
│       │   └── cloudFunction.js
│       ├── hooks/
│       │   └── useGoogleMaps.js
│       └── styles/
│           ├── auth.css
│           ├── landing.css
│           └── optimizer.css
│
└── backend/
    ├── pyproject.toml
    ├── requirements.txt
    ├── main.py               ← entry point de la Cloud Function
    ├── genetic_algorithm.py
    ├── distance_matrix.py
    └── .env.example          ← copia a .env y completa los valores
```

---

## Requisitos previos

### Cuentas y proyectos
- Cuenta de Google con acceso a [Google Cloud Console](https://console.cloud.google.com)
- Proyecto en [Firebase Console](https://console.firebase.google.com) con **Authentication** habilitado (Email/Password y Google)
- Proyecto en GCP donde se desplegará la Cloud Function (puede ser el mismo proyecto de Firebase)

### APIs que deben estar habilitadas en GCP
Ir a **APIs y servicios → Biblioteca** en la [Google Cloud Console](https://console.cloud.google.com/apis/library) y habilitar:

| API | Usada por |
|---|---|
| Maps JavaScript API | Frontend — mapa interactivo |
| Places API | Frontend — autocompletado de direcciones |
| Directions API | Frontend — trazar ruta por calles |
| Distance Matrix API | Backend (Cloud Function) — distancias reales |
| Cloud Functions API | Deploy del backend |
| Cloud Build API | Build del backend |
| Artifact Registry API | Almacenamiento del build |

### API Keys
Se necesitan **dos keys** (pueden ser la misma, pero con distintas restricciones):

**Key para el frontend** (restricción: Sitios web)
- Habilitar: Maps JavaScript API, Places API, Directions API
- Restricción de aplicación: **Sitios web** → agregar `localhost:5173/*` para desarrollo y el dominio de producción

**Key para el backend** (sin restricción de aplicación)
- Habilitar: Distance Matrix API
- Restricción de aplicación: **Ninguno** (la Cloud Function llama desde IPs dinámicas de GCP)

### Herramientas locales
- [Node.js](https://nodejs.org) v18 o superior
- [Python](https://python.org) 3.11 o superior
- [uv](https://docs.astral.sh/uv/getting-started/installation/) — gestor de entornos Python
- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) (`gcloud` CLI)

---

## Correr el proyecto desde cero

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd route-optimizer
```

### 2. Configurar el frontend

```bash
cd frontend
cp .env.example .env
```

Editar `frontend/.env` y completar:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_GOOGLE_MAPS_API_KEY=...       # key con Maps JS, Places y Directions habilitadas
VITE_CLOUD_FUNCTION_URL=...        # URL de la Cloud Function (ver paso 4)
```

Instalar dependencias y correr:

```bash
npm install
npm run dev
```

El frontend queda disponible en `http://localhost:5173`.

### 3. Configurar el backend (local para desarrollo)

```bash
cd backend
cp .env.example .env
```

Editar `backend/.env` y completar:

```env
GOOGLE_MAPS_API_KEY=...    # key con Distance Matrix habilitada
ALLOWED_IPS=...            # tu IP pública (ver https://api4.ipify.org)
FIREBASE_PROJECT_ID=...    # project ID del proyecto de Firebase
```

Crear entorno virtual e instalar dependencias con uv:

```bash
uv venv
uv pip install -r requirements.txt
```

Correr localmente con functions-framework:

```bash
uv run functions-framework --target optimize_route --port 8080
```

Actualizar `VITE_CLOUD_FUNCTION_URL=http://localhost:8080` en `frontend/.env` para apuntar al backend local.

### 4. Desplegar la Cloud Function en GCP

Autenticarse y configurar el proyecto:

```bash
gcloud auth login
gcloud config set project <TU_PROJECT_ID>
```

Copiar el archivo de variables de entorno para el deploy:

```bash
cd backend
cp .env.example env.yaml
```

Formato de `env.yaml`:
```yaml
GOOGLE_MAPS_API_KEY: "tu_key"
ALLOWED_IPS: "tu_ipv4,tu_ipv6"
FIREBASE_PROJECT_ID: "tu_firebase_project_id"
```

Deploy:

```bash
gcloud functions deploy optimize_route \
  --gen2 \
  --runtime python311 \
  --region us-central1 \
  --source . \
  --entry-point optimize_route \
  --trigger-http \
  --allow-unauthenticated \
  --env-vars-file env.yaml
```

Al terminar, GCP imprime la URL de la función. Copiarla en `frontend/.env`:

```env
VITE_CLOUD_FUNCTION_URL=https://us-central1-<project-id>.cloudfunctions.net/optimize_route
```

Reiniciar el frontend para que tome el nuevo valor.

---

## Seguridad

- **Credenciales**: ninguna API key ni secreto está en el repositorio. Todos los valores sensibles se manejan con variables de entorno (`.env` en local, `env.yaml` para el deploy — ambos en `.gitignore`).
- **Autenticación**: solo usuarios con sesión activa de Firebase pueden invocar el cálculo. La Cloud Function verifica el token Bearer en cada request.
- **Restricción de IP**: la Cloud Function rechaza requests de IPs no configuradas en `ALLOWED_IPS`.

---

## Algoritmo genético

El algoritmo resuelve una variante del Travelling Salesman Problem (TSP):

- **Cromosoma**: permutación de los índices de los destinos
- **Fitness**: inverso de la distancia total del recorrido (menor distancia = mayor fitness)
- **Selección**: torneo de tamaño configurable
- **Cruce**: Ordered Crossover (OX) — preserva el orden relativo de los genes
- **Mutación**: swap aleatorio de dos posiciones
- **Elitismo**: los mejores N cromosomas pasan directamente a la siguiente generación
- **Criterio de parada**: número fijo de generaciones (configurable)
- **Modos**: ruta cerrada (regresa al origen) y ruta abierta (termina en el último destino)

Parámetros por defecto: 120 individuos, 400 generaciones, tasa de mutación 0.08 
