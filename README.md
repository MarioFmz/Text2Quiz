# Text2Quiz

Aplicación web que permite a los usuarios subir documentos PDF o imágenes y generar quizzes interactivos usando inteligencia artificial para practicar y aprender.

## Características

- 📄 Subida de documentos PDF e imágenes
- 🤖 Generación automática de quizzes usando IA
- 📊 Dashboard con estadísticas de aprendizaje
- ✅ Sistema de puntuación y feedback inteligente
- 🎯 Diseño minimalista y limpio

## Stack Tecnológico

- **Frontend**: Vue 3 + TypeScript + Vite
- **State Management**: Pinia
- **Styling**: TailwindCSS
- **Backend**: Supabase (Auth, Database, Storage)
- **AI**: Anthropic Claude
- **Document Processing**: PDF.js, Tesseract.js

## Configuración del Proyecto

1. Clona el repositorio:
```bash
git clone https://github.com/MarioFmz/Text2Quiz.git
cd Text2Quiz
```

2. Instala las dependencias:
```bash
npm install
```

3. Copia `.env.example` a `.env` y configura tus variables de entorno:
```bash
cp .env.example .env
```

4. Inicia el servidor de desarrollo:
```bash
npm run dev
```

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

## Licencia

MIT
