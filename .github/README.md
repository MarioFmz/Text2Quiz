# GitHub Actions CI/CD

Este directorio contiene los workflows de GitHub Actions para Continuous Integration y Continuous Deployment del proyecto Text2Quiz.

## Workflows Disponibles

### 1. CI (Continuous Integration) - `ci.yml`

Este workflow se ejecuta automáticamente en cada push o pull request a las ramas `main` y `develop`.

**Ejecuta:**
- Tests del frontend (Vitest)
- Tests del backend (Jest)
- Build del frontend (Vue + Vite)
- Genera artefactos de build

**Triggers:**
- Push a `main` o `develop`
- Pull requests hacia `main` o `develop`

### 2. Deploy - `deploy.yml`

Este workflow maneja el despliegue automático a producción.

**Características:**
- Deploy del frontend (preparado para Vercel, Netlify o GitHub Pages)
- Deploy del backend (preparado para Railway, Render, Heroku o VPS)
- Se ejecuta automáticamente en cada push a `main`
- También se puede ejecutar manualmente desde GitHub Actions

**Triggers:**
- Push a `main`
- Ejecución manual (`workflow_dispatch`)

## Configuración de Secrets

Para que los workflows funcionen correctamente, necesitas configurar los siguientes secrets en tu repositorio de GitHub (Settings → Secrets and variables → Actions):

### Secrets Requeridos para el Frontend:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=your_api_url
VITE_OPENAI_API_KEY=your_openai_key (opcional)
```

### Secrets para Deploy (según tu plataforma):

#### Vercel:
```
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id
```

#### Netlify:
```
NETLIFY_AUTH_TOKEN=your_netlify_token
NETLIFY_SITE_ID=your_site_id
```

#### Railway:
```
RAILWAY_TOKEN=your_railway_token
```

#### Render:
```
RENDER_DEPLOY_HOOK_URL=your_deploy_hook_url
```

#### Heroku:
```
HEROKU_API_KEY=your_api_key
HEROKU_EMAIL=your_email
```

#### VPS/EC2:
```
SERVER_HOST=your_server_ip
SERVER_USER=your_username
SERVER_SSH_KEY=your_private_ssh_key
```

## Cómo Activar el Deploy

1. **Descomenta la sección correspondiente** en `deploy.yml` según tu plataforma de hosting
2. **Configura los secrets** necesarios en GitHub
3. **Push a main** y el deploy se ejecutará automáticamente

## Ejecutar Tests Localmente

### Frontend:
```bash
npm test
```

### Backend:
```bash
cd server
npm test
```

## Build Local

### Frontend:
```bash
npm run build
```

El build generado estará en el directorio `dist/`.

## Notas Importantes

- Los tests se ejecutan con `continue-on-error: true` para no bloquear el pipeline si los tests fallan
- Los artefactos de build se guardan por 7 días (CI) o 30 días (producción)
- Puedes ejecutar los workflows manualmente desde la pestaña "Actions" en GitHub
- Asegúrate de que todos los secrets estén configurados antes de hacer deploy

## Próximos Pasos

- [ ] Agregar más tests de integración
- [ ] Configurar code coverage reporting
- [ ] Agregar linting y formateo automático
- [ ] Implementar deploy a staging antes de producción
- [ ] Agregar notificaciones de Slack/Discord para deploys
