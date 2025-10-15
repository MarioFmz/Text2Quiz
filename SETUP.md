# Text2Quiz - Instrucciones de Configuración

## Pasos finales para completar el setup

### 1. Configurar Base de Datos en Supabase

1. Ve a [https://fgmhpvryyxogjzwvlxxx.supabase.co](https://fgmhpvryyxogjzwvlxxx.supabase.co)
2. Navega a **SQL Editor**
3. Copia y pega el contenido de `supabase-schema.sql`
4. Ejecuta el script completo

Esto creará:
- Todas las tablas (documents, quizzes, questions, user_answers, learning_progress)
- Índices para mejor rendimiento
- Políticas RLS (Row Level Security)
- Bucket de Storage para documentos
- Políticas de Storage

### 2. Verificar Variables de Entorno

El archivo `.env` ya está configurado con:
- ✅ Supabase URL
- ✅ Supabase Anon Key
- ✅ Supabase Service Role Key
- ✅ OpenAI API Key

**IMPORTANTE**: El archivo `.env` NO está en el repositorio (está en .gitignore) por seguridad.

### 3. Instalar Dependencias (si no está hecho)

```bash
npm install
```

### 4. Iniciar el Servidor de Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en: [http://localhost:3000](http://localhost:3000)

## Estructura del Proyecto

```
Text2Quiz/
├── src/
│   ├── agents/              # Agentes de IA
│   │   ├── documentProcessor.ts    # Procesa PDFs e imágenes (OCR)
│   │   ├── quizGenerator.ts        # Genera quizzes con OpenAI
│   │   └── contentAnalyzer.ts      # Analiza contenido
│   │
│   ├── components/          # Componentes reutilizables
│   │   └── AppLayout.vue           # Layout principal
│   │
│   ├── composables/         # Composables de Vue
│   │   └── useAuth.ts              # Hook de autenticación
│   │
│   ├── services/            # Servicios
│   │   ├── supabase.ts             # Cliente Supabase
│   │   ├── documentsService.ts     # CRUD de documentos
│   │   └── quizzesService.ts       # CRUD de quizzes
│   │
│   ├── stores/              # Pinia stores
│   │   └── authStore.ts            # Estado de autenticación
│   │
│   ├── types/               # Tipos TypeScript
│   │   ├── database.types.ts       # Tipos de BD
│   │   └── index.ts                # Tipos generales
│   │
│   ├── views/               # Vistas/Páginas
│   │   ├── HomeView.vue            # Página inicio
│   │   ├── LoginView.vue           # Login
│   │   ├── RegisterView.vue        # Registro
│   │   ├── DashboardView.vue       # Dashboard
│   │   ├── UploadView.vue          # Subir documentos
│   │   ├── DocumentsView.vue       # Lista documentos
│   │   └── QuizView.vue            # Quiz interactivo
│   │
│   ├── router/              # Vue Router
│   │   └── index.ts                # Configuración rutas
│   │
│   └── assets/              # Recursos estáticos
│       └── styles/main.css         # Estilos Tailwind
│
├── supabase-schema.sql      # Esquema de base de datos
├── .env                     # Variables de entorno (NO en repo)
├── .env.example             # Ejemplo de variables
└── package.json             # Dependencias
```

## Flujo de la Aplicación

### 1. Autenticación
- Los usuarios se registran/inician sesión con Supabase Auth
- Las sesiones se gestionan automáticamente
- Row Level Security protege los datos

### 2. Subir Documento
1. Usuario arrastra/selecciona un PDF o imagen
2. El archivo se sube a Supabase Storage
3. **Document Processor Agent** extrae el texto:
   - PDFs: usa `pdf.js`
   - Imágenes: usa Tesseract.js (OCR)
4. El texto extraído se guarda en la base de datos

### 3. Generar Quiz
1. Usuario hace clic en "Generar quiz"
2. **Content Analyzer Agent** analiza el documento:
   - Identifica temas principales
   - Sugiere dificultad y número de preguntas
3. **Quiz Generator Agent** crea preguntas:
   - Usa OpenAI GPT-4o-mini
   - Genera preguntas de múltiple opción y verdadero/falso
   - Incluye explicaciones
4. El quiz se guarda en la base de datos

### 4. Responder Quiz
1. Usuario responde pregunta por pregunta
2. Al finalizar, se calculan los resultados
3. Se guarda el progreso en `learning_progress`
4. Se muestran los resultados y revisión de respuestas

### 5. Dashboard
- Muestra estadísticas del usuario
- Documentos subidos
- Quizzes completados
- Precisión promedio

## Tecnologías Utilizadas

### Frontend
- **Vue 3** - Framework JavaScript
- **TypeScript** - Tipado estático
- **Vite** - Build tool
- **Pinia** - State management
- **Vue Router** - Enrutamiento
- **TailwindCSS** - Estilos

### Backend & Servicios
- **Supabase** - Backend as a Service
  - PostgreSQL Database
  - Authentication
  - Storage
  - Row Level Security
- **OpenAI API** - Generación de quizzes con IA

### Librerías AI
- **pdf.js** - Extracción de texto de PDFs
- **Tesseract.js** - OCR para imágenes
- **OpenAI SDK** - Integración con GPT-4o-mini

## Testing

Para probar la aplicación:

1. **Registrar un usuario**
   - Ve a `/register`
   - Crea una cuenta
   - Confirma el email (revisa tu bandeja)

2. **Subir un documento**
   - Ve a `/upload`
   - Sube un PDF o imagen con contenido educativo
   - Espera el procesamiento

3. **Generar y responder un quiz**
   - Ve a `/documents`
   - Haz clic en "Generar nuevo quiz"
   - Responde las preguntas
   - Ve los resultados

4. **Ver estadísticas**
   - Ve a `/dashboard`
   - Revisa tus estadísticas

## Mejoras Futuras

Posibles funcionalidades a agregar:

1. **Edge Functions**: Mover la generación de quizzes al servidor para mayor seguridad
2. **Modo Práctica**: Repetir quizzes sin guardar resultados
3. **Compartir Quizzes**: Permitir compartir quizzes entre usuarios
4. **Análisis Avanzado**: Gráficos de progreso con Chart.js
5. **Dificultad Adaptativa**: Ajustar dificultad según rendimiento
6. **Categorías**: Organizar documentos por categorías/temas
7. **Exportar Resultados**: Exportar estadísticas a PDF/CSV
8. **Modo Oscuro**: Tema oscuro para la interfaz

## Soporte

Para cualquier problema o duda:
- GitHub Issues: [https://github.com/MarioFmz/Text2Quiz/issues](https://github.com/MarioFmz/Text2Quiz/issues)
- Email: tu-email@ejemplo.com

## Licencia

MIT License - Ver LICENSE file para más detalles

---

**Creado con ❤️ usando Vue.js y AI**
