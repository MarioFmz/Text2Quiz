# 🚀 Guía de Despliegue Automático a Vercel con GitHub Actions

Este proyecto está configurado para desplegarse automáticamente a Vercel cuando haces push a la rama `main`, **pero solo después de que pasen todos los tests de CI**.

## 📋 Flujo de Despliegue

```
Push a main → CI Tests → Deploy Backend → Deploy Frontend
```

1. **CI Tests**: Se ejecutan tests de frontend y backend
2. **Deploy Backend**: Solo si CI pasa ✅
3. **Deploy Frontend**: Solo si CI y Backend pasan ✅

---

## ⚙️ Configuración Inicial (Paso a Paso)

### 1️⃣ Crear Proyectos en Vercel

#### **A) Proyecto Frontend**
1. Ve a [vercel.com](https://vercel.com/dashboard)
2. Click en **"Add New..."** → **"Project"**
3. Selecciona el repositorio `Text2Quiz`
4. Configura:
   - **Project Name**: `text2quiz` (o el que prefieras)
   - **Framework Preset**: Vite
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. **NO configures variables de entorno todavía** (lo haremos en GitHub Secrets)
6. Click **"Deploy"** (este primer deploy puede fallar, está ok)

#### **B) Proyecto Backend**
1. En Vercel, click de nuevo en **"Add New..."** → **"Project"**
2. Selecciona el **mismo repositorio** `Text2Quiz`
3. Configura:
   - **Project Name**: `text2quiz-api` (o el que prefieras)
   - **Framework Preset**: Other
   - **Root Directory**: `server` ⚠️ **MUY IMPORTANTE**
4. Click **"Deploy"**

---

### 2️⃣ Obtener Tokens de Vercel

#### **Vercel Token**
1. Ve a [vercel.com/account/tokens](https://vercel.com/account/tokens)
2. Click **"Create Token"**
3. Nombre: `GitHub Actions Deploy`
4. Scope: **Full Account**
5. Copia el token (solo se muestra una vez)

#### **Organization ID**
1. Ve a [vercel.com/teams](https://vercel.com/teams)
2. Click en **Settings** de tu equipo/cuenta
3. Copia el **Team ID** (o **User ID** si es cuenta personal)

#### **Project IDs**
1. Ve al proyecto **Frontend** en Vercel
2. Click en **Settings** → **General**
3. Copia el **Project ID**
4. Repite para el proyecto **Backend**

---

### 3️⃣ Configurar GitHub Secrets

1. Ve a tu repositorio en GitHub: `https://github.com/MarioFmz/Text2Quiz`
2. Click en **Settings** → **Secrets and variables** → **Actions**
3. Click en **"New repository secret"** y agrega cada uno:

#### **Secrets de Vercel** (Deploy)
```
VERCEL_TOKEN
→ El token que creaste en el paso anterior

VERCEL_ORG_ID
→ Tu Organization/Team ID de Vercel

VERCEL_PROJECT_ID_FRONTEND
→ Project ID del frontend

VERCEL_PROJECT_ID_BACKEND
→ Project ID del backend
```

#### **Secrets de la Aplicación** (Build)
```
VITE_SUPABASE_URL
→ Tu URL de Supabase (ejemplo: https://xxx.supabase.co)

VITE_SUPABASE_ANON_KEY
→ Tu Supabase Anon Key (public key)

SUPABASE_SERVICE_ROLE_KEY
→ Tu Supabase Service Role Key (secret key para backend)

VITE_OPENAI_API_KEY
→ Tu OpenAI API Key

VITE_API_URL
→ La URL de tu backend en Vercel (ejemplo: https://text2quiz-api.vercel.app)
```

---

### 4️⃣ Configurar Variables de Entorno en Vercel

Aunque GitHub Actions hará el deploy, Vercel también necesita las variables para sus propios builds.

#### **Frontend (text2quiz)**
1. Ve al proyecto en Vercel → **Settings** → **Environment Variables**
2. Agrega:
   ```
   VITE_SUPABASE_URL
   VITE_SUPABASE_ANON_KEY
   VITE_OPENAI_API_KEY
   VITE_API_URL
   ```

#### **Backend (text2quiz-api)**
1. Ve al proyecto en Vercel → **Settings** → **Environment Variables**
2. Agrega:
   ```
   SUPABASE_URL (mismo valor que VITE_SUPABASE_URL)
   SUPABASE_SERVICE_ROLE_KEY
   OPENAI_API_KEY (mismo valor que VITE_OPENAI_API_KEY)
   ```

---

## 🎯 ¡Listo para Desplegar!

Una vez configurado todo:

### **Despliegue Automático**
```bash
git add .
git commit -m "feat: nueva funcionalidad"
git push origin main
```

GitHub Actions automáticamente:
1. ✅ Ejecutará los tests
2. ✅ Desplegará el backend a Vercel
3. ✅ Desplegará el frontend a Vercel

### **Monitorear el Despliegue**
1. Ve a tu repositorio en GitHub
2. Click en la pestaña **"Actions"**
3. Verás el workflow **"Deploy to Production"** ejecutándose
4. Si algo falla, el despliegue se detendrá automáticamente

### **Despliegue Manual** (opcional)
Si quieres forzar un despliegue sin hacer push:
1. Ve a **Actions** en GitHub
2. Selecciona **"Deploy to Production"**
3. Click en **"Run workflow"** → **"Run workflow"**

---

## 🔍 Troubleshooting

### ❌ "CI failed"
- Revisa los logs en Actions → Workflow run → Job details
- Verifica que los tests pasen localmente: `npm test`

### ❌ "Vercel deployment failed"
- Verifica que los secrets estén correctamente configurados
- Revisa que los Project IDs sean correctos
- Asegúrate de que el VERCEL_TOKEN tenga permisos completos

### ❌ "Build failed"
- Verifica que todas las variables de entorno estén configuradas
- Revisa los logs del build en GitHub Actions
- Asegúrate de que `npm run build` funcione localmente

### ❌ "Frontend deployed but API not working"
- Verifica que `VITE_API_URL` apunte a la URL correcta del backend
- Asegúrate de que el backend esté desplegado correctamente
- Verifica las variables de entorno del backend en Vercel

---

## 📊 Verificación Post-Deploy

Después del primer despliegue exitoso:

1. ✅ Abre la URL del frontend
2. ✅ Intenta hacer login
3. ✅ Crea un quiz de prueba
4. ✅ Verifica que el backend responde correctamente

---

## 🔄 Actualizar la URL del Backend

Si cambias la URL del backend o lo redesplegas:

1. Actualiza el secret `VITE_API_URL` en GitHub
2. Haz un nuevo push o ejecuta el workflow manualmente
3. El frontend se reconstruirá con la nueva URL

---

## 📚 Recursos Adicionales

- [Vercel CLI Docs](https://vercel.com/docs/cli)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Vercel Action Plugin](https://github.com/amondnet/vercel-action)

---

**¿Dudas?** Revisa los logs de GitHub Actions o los deployment logs en Vercel para más detalles.
