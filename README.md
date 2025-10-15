# Text2Quiz

> 🎓 **Aprende más rápido con IA**
> Sube documentos PDF o imágenes y genera quizzes personalizados para practicar y dominar cualquier tema.

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Vue](https://img.shields.io/badge/Vue-3.5-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)

## ✨ Características

- 📄 **Sube PDFs e imágenes** - Procesa documentos automáticamente con OCR
- 🤖 **Generación inteligente de quizzes** - Usa OpenAI GPT-4o-mini para crear preguntas relevantes
- 📊 **Dashboard con estadísticas** - Sigue tu progreso y mejora continua
- ✅ **Feedback personalizado** - Explicaciones detalladas de cada respuesta
- 🎯 **Diseño minimalista** - Interfaz limpia y fácil de usar
- 🔒 **Seguridad** - Autenticación y Row Level Security con Supabase

## 🤖 Agentes de IA

El proyecto incluye 3 agentes inteligentes:

1. **Document Processor** - Extrae texto de PDFs con pdf.js e imágenes con Tesseract.js (OCR)
2. **Quiz Generator** - Crea preguntas de múltiple opción y verdadero/falso con OpenAI
3. **Content Analyzer** - Analiza dificultad del contenido y sugiere parámetros óptimos

## 🛠️ Stack Tecnológico

### Frontend
- **Vue 3** - Framework JavaScript progresivo
- **TypeScript** - Tipado estático para mejor DX
- **Vite** - Build tool ultra-rápido
- **Pinia** - State management oficial de Vue
- **Vue Router** - Enrutamiento SPA
- **TailwindCSS** - Utility-first CSS framework

### Backend & Services
- **Supabase** - Backend as a Service
  - PostgreSQL Database
  - Authentication & Authorization
  - Storage para documentos
  - Row Level Security (RLS)
- **OpenAI API** - GPT-4o-mini para generación de quizzes

### Procesamiento de Documentos
- **PDF.js** - Extracción de texto de PDFs
- **Tesseract.js** - OCR para reconocimiento de texto en imágenes

## 🚀 Inicio Rápido

### 1. Clona el repositorio
```bash
git clone https://github.com/MarioFmz/Text2Quiz.git
cd Text2Quiz
```

### 2. Instala las dependencias
```bash
npm install
```

### 3. Configura las variables de entorno

Copia `.env.example` a `.env`:
```bash
cp .env.example .env
```

**IMPORTANTE**: Completa las siguientes variables:
```env
VITE_SUPABASE_URL=tu_supabase_project_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
VITE_OPENAI_API_KEY=tu_openai_api_key
```

### 4. Configura Supabase

1. Ve a tu proyecto de Supabase
2. Abre el **SQL Editor**
3. Ejecuta el script completo de `supabase-schema.sql`

Esto creará todas las tablas, índices, políticas RLS y el bucket de storage.

### 5. Inicia el servidor de desarrollo
```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

## 📖 Documentación Detallada

Para instrucciones completas de configuración y arquitectura, consulta [SETUP.md](./SETUP.md)

## Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Previsualiza la build de producción
- `npm test` - Ejecuta los tests

## Estructura del Proyecto

```
src/
├── agents/          # Agentes de IA
├── components/      # Componentes reutilizables
├── composables/     # Composables de Vue
├── services/        # Servicios (API, Supabase)
├── stores/          # Stores de Pinia
├── types/           # Tipos TypeScript
├── views/           # Páginas/vistas
├── router/          # Configuración de Vue Router
└── assets/          # Recursos estáticos
```

## 📸 Screenshots

*(Agrega screenshots de tu aplicación aquí)*

## 🎯 Flujo de Usuario

1. **Registro/Login** - Crea una cuenta con Supabase Auth
2. **Sube un documento** - PDF o imagen con contenido educativo
3. **Genera un quiz** - La IA procesa el documento y crea preguntas
4. **Responde el quiz** - Interfaz interactiva con progreso visual
5. **Ve tus resultados** - Puntuación, revisión de respuestas y explicaciones
6. **Mejora con estadísticas** - Dashboard con tu progreso

## 🤝 Contribuir

Las contribuciones son bienvenidas! Para contribuir:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Roadmap

- [ ] Edge Functions para mayor seguridad
- [ ] Modo práctica sin guardar resultados
- [ ] Compartir quizzes entre usuarios
- [ ] Gráficos avanzados con Chart.js
- [ ] Dificultad adaptativa según rendimiento
- [ ] Categorización de documentos
- [ ] Exportar estadísticas a PDF/CSV
- [ ] Modo oscuro

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 👨‍💻 Autor

**Mario Fernández**
- GitHub: [@MarioFmz](https://github.com/MarioFmz)

---

⭐ Si este proyecto te resultó útil, considera darle una estrella en GitHub!

**Creado con ❤️ usando Vue.js, TypeScript y OpenAI**
