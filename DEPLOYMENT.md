# Guía de Despliegue en Vercel

Este proyecto Text2Quiz consta de dos partes: Frontend (Vue.js) y Backend (Express.js API).

## Opción 1: Despliegue desde la Web de Vercel (Recomendado)

### 1. Deploy del Frontend

1. Ve a [Vercel](https://vercel.com) y haz login con GitHub
2. Click en "Add New..." → "Project"
3. Selecciona el repositorio `Text2Quiz`
4. Configura:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (dejar por defecto)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. **Variables de Entorno** (Click en "Environment Variables"):
   ```
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu_anon_key
   VITE_API_URL=https://tu-backend.vercel.app
   VITE_OPENAI_API_KEY=sk-...
   ```

6. Click en "Deploy" y espera

### 2. Deploy del Backend

1. En Vercel, click en "Add New..." → "Project"
2. Selecciona el mismo repositorio `Text2Quiz`
3. Click en "Import"
4. Configura:
   - **Framework Preset**: Other
   - **Root Directory**: `server` ⚠️ (importante!)
   - **Build Command**: Dejar vacío
   - **Output Directory**: Dejar vacío
   - **Install Command**: `npm install`

5. **Variables de Entorno**:
   ```
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu_anon_key
   VITE_OPENAI_API_KEY=sk-...
   SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
   NODE_ENV=production
   ```

6. Click en "Deploy"

### 3. Actualizar Variables de Entorno del Frontend

1. Una vez desplegado el backend, copia su URL (ej: `https://tu-backend.vercel.app`)
2. Ve al proyecto del frontend en Vercel
3. Settings → Environment Variables
4. Actualiza `VITE_API_URL` con la URL del backend
5. Ve a Deployments y haz "Redeploy" del último deployment

---

## Opción 2: Despliegue con Vercel CLI

### Instalación

```bash
npm install -g vercel
```

### Deploy del Frontend

```bash
# En la raíz del proyecto
vercel login
vercel

# Sigue las instrucciones:
# - Set up and deploy? Yes
# - Which scope? Tu cuenta
# - Link to existing project? No
# - Project name? text2quiz-frontend
# - In which directory is your code located? ./
```

Añadir variables de entorno:
```bash
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel env add VITE_API_URL production
vercel env add VITE_OPENAI_API_KEY production
```

Deploy a producción:
```bash
vercel --prod
```

### Deploy del Backend

```bash
cd server
vercel

# Sigue las instrucciones:
# - Set up and deploy? Yes
# - Which scope? Tu cuenta
# - Link to existing project? No
# - Project name? text2quiz-backend
# - In which directory is your code located? ./
```

Añadir variables de entorno:
```bash
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel env add VITE_OPENAI_API_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add NODE_ENV production
```

Deploy a producción:
```bash
vercel --prod
```

---

## Variables de Entorno Necesarias

### Frontend
- `VITE_SUPABASE_URL`: URL de tu proyecto Supabase
- `VITE_SUPABASE_ANON_KEY`: Anon key de Supabase
- `VITE_API_URL`: URL del backend desplegado (ej: https://tu-backend.vercel.app)
- `VITE_OPENAI_API_KEY`: API key de OpenAI

### Backend
- `VITE_SUPABASE_URL`: URL de tu proyecto Supabase
- `VITE_SUPABASE_ANON_KEY`: Anon key de Supabase
- `VITE_OPENAI_API_KEY`: API key de OpenAI
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key de Supabase (Admin)
- `NODE_ENV`: production

---

## Verificación del Despliegue

### Frontend
1. Visita la URL de tu frontend
2. Verifica que cargue la página de inicio
3. Intenta hacer login/registro
4. Verifica que las rutas funcionen (Vue Router)

### Backend
1. Visita `https://tu-backend.vercel.app/health`
2. Deberías ver: `{"status":"ok","message":"Text2Quiz API Server"}`
3. Verifica los logs en Vercel Dashboard

---

## Problemas Comunes

### Error: "Module not found"
- Asegúrate de que todas las dependencias estén en `package.json`
- Verifica que `node_modules` NO esté en `.vercelignore`

### Error: "Environment variable not defined"
- Verifica que todas las variables de entorno estén configuradas
- Usa el formato exacto (sin comillas adicionales)

### Frontend no puede conectar con Backend
- Verifica que `VITE_API_URL` apunte al backend correcto
- Asegúrate de que el backend tenga CORS habilitado (ya configurado)

### Cambios no se reflejan
- Verifica que hayas hecho push a GitHub (si usas integración Git)
- Redeploy manualmente desde Vercel Dashboard

---

## GitHub Actions Automático (Opcional)

Para habilitar deploy automático con GitHub Actions, descomenta la sección de Vercel en `.github/workflows/deploy.yml`:

1. Obtén tu Vercel Token: https://vercel.com/account/tokens
2. Añade estos secrets en GitHub:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
3. Descomenta la sección de Vercel en el workflow
4. Push a main → deploy automático

---

## Comandos Útiles

```bash
# Ver logs en tiempo real
vercel logs <deployment-url>

# Listar deployments
vercel list

# Eliminar deployment
vercel remove <deployment-name>

# Ver información del proyecto
vercel inspect <deployment-url>
```
