# Scripts - Text2Quiz

Colección de scripts útiles para administrar y mantener Text2Quiz.

## 📥 importExam.js

Script para importar exámenes oficiales desde PDFs a la base de datos de Text2Quiz.

### Características

- ✅ Extrae preguntas automáticamente desde PDFs
- ✅ Detecta opciones múltiples y respuestas correctas
- ✅ Soporta diferentes formatos de exámenes (OPE Navarra, etc.)
- ✅ Configurable: título, categoría, etiquetas, etc.
- ✅ Importación por lotes para mejor rendimiento
- ✅ Reutilizable para diferentes exámenes y años

### Uso Directo

```bash
node scripts/importExam.js <pdf-path> <user-id> [title] [category] [tags] [source]
```

**Parámetros:**

1. `pdf-path` (requerido): Ruta al archivo PDF del examen
2. `user-id` (requerido): ID del usuario que creará el quiz
3. `title` (opcional): Título del quiz (por defecto: "OPE Navarra TCAE - Examen 12 Abril 2025")
4. `category` (opcional): Categoría del quiz (por defecto: "Oposiciones")
5. `tags` (opcional): Etiquetas separadas por comas (por defecto: "OPE Navarra,TCAE,2025,Examen Oficial")
6. `source` (opcional): Fuente del examen (por defecto: "OPE Navarra - Examen Oficial TCAE 2025")

### Uso con Script Auxiliar (Recomendado)

```bash
chmod +x scripts/import-ope-exam.sh
./scripts/import-ope-exam.sh <pdf-path> <email> [title] [category] [tags] [source]
```

Este script te ayuda a obtener tu user ID automáticamente desde tu email.

### Ejemplos

**Importar examen OPE Navarra TCAE 2025:**
```bash
node scripts/importExam.js \
  tcae-navarra-2025-examen-12-abril.pdf \
  "tu-user-id-aqui" \
  "OPE Navarra TCAE - Examen 12 Abril 2025" \
  "Oposiciones" \
  "OPE Navarra,TCAE,2025,Examen Oficial" \
  "OPE Navarra - Examen Oficial TCAE 2025"
```

**Importar otro examen:**
```bash
node scripts/importExam.js \
  examen-enfermeria-2024.pdf \
  "tu-user-id-aqui" \
  "OPE Enfermería 2024" \
  "Oposiciones" \
  "OPE,Enfermería,2024"
```

**Usando el script auxiliar:**
```bash
./scripts/import-ope-exam.sh \
  tcae-navarra-2025-examen-12-abril.pdf \
  mario@example.com \
  "OPE Navarra TCAE 2025"
```

### Formato de PDF Soportado

El script detecta automáticamente diferentes formatos de exámenes. Funciona mejor con PDFs que tienen:

- Preguntas numeradas (1., 2., 3., etc.)
- Opciones claramente marcadas (a), b), c), d)
- Respuesta correcta indicada (puede ser con marcador, asterisco, o texto "Respuesta correcta: a")

### Parsers Incluidos

1. **parseOPENavarraQuestions**: Optimizado para exámenes OPE de Navarra
2. **parseQuestions**: Parser genérico para otros formatos

Si el parser específico no encuentra suficientes preguntas, automáticamente intenta con el parser genérico.

### Salida

El script mostrará:
- ✅ Número de preguntas encontradas
- 📋 Preview de las primeras 3 preguntas
- ✅ ID del quiz creado
- 📊 Resumen de la importación

### Notas Importantes

- El quiz se crea como **público** por defecto
- Las preguntas se insertan en lotes de 50 para mejor rendimiento
- Se crea automáticamente la categoría si no existe
- El tipo de pregunta es siempre "multiple_choice"

### Troubleshooting

**Error: "No questions found in PDF"**
- Verifica que el PDF tenga texto extraíble (no sea solo imágenes)
- Revisa el formato del PDF para asegurarte que las preguntas estén numeradas
- Puedes modificar los regex patterns en el script para tu formato específico

**Error: "Supabase credentials not found"**
- Asegúrate de que el archivo `.env` existe en la raíz del proyecto
- Verifica que las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` estén configuradas

**Error: "User ID required"**
- Necesitas proporcionar tu user ID de Supabase
- Puedes obtenerlo desde la tabla `auth.users` o usando el script auxiliar con tu email

## 🔧 Desarrollo

Para modificar o extender estos scripts:

1. Los scripts usan ES modules (`import/export`)
2. Requieren Node.js 18+
3. Usan las mismas dependencias que el proyecto principal (pdfjs-dist, @supabase/supabase-js, etc.)

## 📝 Contribuir

Si encuentras bugs o quieres agregar soporte para otros formatos de exámenes:

1. Modifica el parser correspondiente en `importExam.js`
2. Prueba con diferentes PDFs
3. Documenta el nuevo formato en este README
