import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the parent directory
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Looking for: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const quizzes = [
  {
    title: "Marketing Digital y Redes Sociales",
    difficulty: "medium",
    category_name: "Marketing",
    tags: ["marketing", "redes sociales", "publicidad", "negocios"],
    source: "Comunidad Text2Quiz",
    summary: "Aprende estrategias de marketing digital: SEO, SEM, redes sociales, métricas y engagement. Esencial para quienes quieren crecer su negocio online o trabajar en marketing.",
    questions: [
      {
        question_text: "¿Qué significa SEO?",
        question_type: "multiple_choice",
        correct_answer: "Search Engine Optimization",
        options: ["Social Engine Optimization", "Search Engine Optimization", "Search Engine Operation", "Social Engagement Online"],
        explanation: "SEO es la optimización para motores de búsqueda, mejorando la visibilidad en resultados orgánicos."
      },
      {
        question_text: "¿Qué métrica mide el porcentaje de personas que hacen clic en un enlace?",
        question_type: "multiple_choice",
        correct_answer: "CTR (Click-Through Rate)",
        options: ["CPC", "CTR (Click-Through Rate)", "ROI", "CPM"],
        explanation: "CTR mide el porcentaje de clics sobre impresiones totales de un anuncio o enlace."
      },
      {
        question_text: "¿Qué red social es mejor para marketing B2B profesional?",
        question_type: "multiple_choice",
        correct_answer: "LinkedIn",
        options: ["Instagram", "TikTok", "LinkedIn", "Snapchat"],
        explanation: "LinkedIn es la plataforma ideal para marketing B2B y networking profesional."
      },
      {
        question_text: "¿Qué es el engagement rate?",
        question_type: "multiple_choice",
        correct_answer: "Medida de interacción de usuarios con el contenido",
        options: ["Número de seguidores", "Medida de interacción de usuarios con el contenido", "Costo por clic", "Tiempo en página"],
        explanation: "El engagement rate mide likes, comentarios, shares y otras interacciones dividido por el alcance."
      },
      {
        question_text: "¿Qué significa SEM?",
        question_type: "multiple_choice",
        correct_answer: "Search Engine Marketing",
        options: ["Social Engine Marketing", "Search Engine Marketing", "Sales Email Marketing", "Social Engagement Metrics"],
        explanation: "SEM es marketing en motores de búsqueda, principalmente a través de publicidad pagada como Google Ads."
      }
    ]
  },
  {
    title: "Filosofía: Grandes Pensadores",
    difficulty: "medium",
    category_name: "Filosofía",
    tags: ["filosofía", "pensamiento", "cultura", "historia"],
    source: "Comunidad Text2Quiz",
    summary: "Explora las ideas de grandes filósofos: desde Sócrates y Platón hasta Nietzsche y Kant. Descubre las preguntas fundamentales sobre existencia, conocimiento y moral.",
    questions: [
      {
        question_text: "¿Quién dijo 'Pienso, luego existo'?",
        question_type: "multiple_choice",
        correct_answer: "René Descartes",
        options: ["Platón", "René Descartes", "Aristóteles", "Kant"],
        explanation: "Descartes formuló esta frase ('Cogito, ergo sum') como fundamento de su filosofía."
      },
      {
        question_text: "¿Qué filósofo griego fue maestro de Aristóteles?",
        question_type: "multiple_choice",
        correct_answer: "Platón",
        options: ["Sócrates", "Platón", "Pitágoras", "Tales"],
        explanation: "Platón fue maestro de Aristóteles y fundó la Academia de Atenas."
      },
      {
        question_text: "¿Quién escribió 'Así habló Zaratustra'?",
        question_type: "multiple_choice",
        correct_answer: "Friedrich Nietzsche",
        options: ["Karl Marx", "Friedrich Nietzsche", "Søren Kierkegaard", "Arthur Schopenhauer"],
        explanation: "Nietzsche escribió esta obra en 1883-1885, introduciendo conceptos como el superhombre."
      },
      {
        question_text: "¿Qué es el 'imperativo categórico' de Kant?",
        question_type: "multiple_choice",
        correct_answer: "Un principio moral universal",
        options: ["Una teoría política", "Un principio moral universal", "Una crítica al conocimiento", "Una teoría estética"],
        explanation: "El imperativo categórico es el principio ético fundamental de Kant: actuar según máximas universalizables."
      },
      {
        question_text: "¿Qué método usaba Sócrates para enseñar?",
        question_type: "multiple_choice",
        correct_answer: "La mayéutica (diálogo mediante preguntas)",
        options: ["Conferencias magistrales", "La mayéutica (diálogo mediante preguntas)", "Experimentos", "Meditación"],
        explanation: "Sócrates usaba preguntas para que sus interlocutores llegaran por sí mismos a conclusiones."
      }
    ]
  },
  {
    title: "Psicología Básica",
    difficulty: "easy",
    category_name: "Psicología",
    tags: ["psicología", "mente", "comportamiento", "ciencia"],
    source: "Comunidad Text2Quiz",
    summary: "Comprende los fundamentos de la psicología: emociones, memoria, aprendizaje, y grandes teorías. Descubre cómo funciona la mente humana y el comportamiento.",
    questions: [
      {
        question_text: "¿Quién es considerado el padre del psicoanálisis?",
        question_type: "multiple_choice",
        correct_answer: "Sigmund Freud",
        options: ["Carl Jung", "Sigmund Freud", "B.F. Skinner", "Ivan Pavlov"],
        explanation: "Freud fundó el psicoanálisis y desarrolló teorías sobre el inconsciente."
      },
      {
        question_text: "¿Qué es la memoria a corto plazo?",
        question_type: "multiple_choice",
        correct_answer: "Almacenamiento temporal de información (segundos a minutos)",
        options: ["Recuerdos de la infancia", "Almacenamiento temporal de información (segundos a minutos)", "Memoria permanente", "Recuerdos emocionales"],
        explanation: "La memoria a corto plazo retiene información brevemente, con capacidad limitada (7±2 elementos)."
      },
      {
        question_text: "¿Qué experimento es famoso por el condicionamiento clásico?",
        question_type: "multiple_choice",
        correct_answer: "Los perros de Pavlov",
        options: ["La caja de Skinner", "Los perros de Pavlov", "El experimento de Stanford", "El muñeco Bobo"],
        explanation: "Pavlov condicionó a perros a salivar ante el sonido de una campana."
      },
      {
        question_text: "¿Qué son las emociones básicas según Ekman?",
        question_type: "multiple_choice",
        correct_answer: "Alegría, tristeza, miedo, ira, sorpresa y asco",
        options: ["Solo felicidad y tristeza", "Alegría, tristeza, miedo, ira, sorpresa y asco", "Amor y odio", "Todas las anteriores"],
        explanation: "Ekman identificó 6 emociones universales reconocibles en todas las culturas."
      },
      {
        question_text: "¿Qué es la cognición?",
        question_type: "multiple_choice",
        correct_answer: "Los procesos mentales del conocimiento",
        options: ["Las emociones", "Los procesos mentales del conocimiento", "Los instintos", "La personalidad"],
        explanation: "La cognición incluye procesos como pensamiento, memoria, atención y percepción."
      }
    ]
  },
  {
    title: "HTML y CSS para Principiantes",
    difficulty: "easy",
    category_name: "Programación",
    tags: ["html", "css", "web", "frontend"],
    source: "Comunidad Text2Quiz",
    summary: "Aprende los fundamentos de HTML y CSS: estructura web, etiquetas básicas, selectores CSS, box model y diseño responsive. El primer paso para crear sitios web.",
    questions: [
      {
        question_text: "¿Qué significa HTML?",
        question_type: "multiple_choice",
        correct_answer: "HyperText Markup Language",
        options: ["High Tech Modern Language", "HyperText Markup Language", "Home Tool Markup Language", "Hyper Transfer Markup Language"],
        explanation: "HTML es el lenguaje de marcado estándar para crear páginas web."
      },
      {
        question_text: "¿Qué etiqueta se usa para crear un enlace en HTML?",
        question_type: "multiple_choice",
        correct_answer: "<a>",
        options: ["<link>", "<a>", "<href>", "<url>"],
        explanation: "La etiqueta <a> (anchor) se usa con el atributo href para crear enlaces."
      },
      {
        question_text: "¿Qué significa CSS?",
        question_type: "multiple_choice",
        correct_answer: "Cascading Style Sheets",
        options: ["Computer Style Sheets", "Cascading Style Sheets", "Creative Style System", "Colorful Style Sheets"],
        explanation: "CSS controla la presentación y diseño de las páginas web."
      },
      {
        question_text: "¿Qué propiedad CSS cambia el color del texto?",
        question_type: "multiple_choice",
        correct_answer: "color",
        options: ["text-color", "color", "font-color", "text-style"],
        explanation: "La propiedad 'color' establece el color del texto en CSS."
      },
      {
        question_text: "¿Qué es el 'box model' en CSS?",
        question_type: "multiple_choice",
        correct_answer: "Content, padding, border y margin",
        options: ["Un tipo de contenedor", "Content, padding, border y margin", "Una plantilla de diseño", "Un framework"],
        explanation: "El box model describe las capas que rodean cada elemento HTML."
      }
    ]
  },
  {
    title: "Excel: Fórmulas y Funciones Básicas",
    difficulty: "medium",
    category_name: "Tecnología",
    tags: ["excel", "hojas de cálculo", "productividad", "oficina"],
    source: "Comunidad Text2Quiz",
    summary: "Domina Excel para trabajo y análisis: fórmulas básicas, SUMA, PROMEDIO, SI, BUSCARV y tablas dinámicas. Herramientas esenciales para cualquier profesional.",
    questions: [
      {
        question_text: "¿Qué función suma un rango de celdas en Excel?",
        question_type: "multiple_choice",
        correct_answer: "=SUMA()",
        options: ["=TOTAL()", "=SUMA()", "=SUMAR()", "=ADD()"],
        explanation: "=SUMA() o =SUM() suma todos los valores de un rango de celdas."
      },
      {
        question_text: "¿Qué hace la función PROMEDIO?",
        question_type: "multiple_choice",
        correct_answer: "Calcula la media aritmética de un rango",
        options: ["Suma valores", "Calcula la media aritmética de un rango", "Cuenta celdas", "Multiplica valores"],
        explanation: "PROMEDIO calcula la media dividiendo la suma entre el número de valores."
      },
      {
        question_text: "¿Cómo se inicia una fórmula en Excel?",
        question_type: "multiple_choice",
        correct_answer: "Con el símbolo =",
        options: ["Con el símbolo #", "Con el símbolo =", "Con el símbolo *", "Con paréntesis ()"],
        explanation: "Todas las fórmulas en Excel comienzan con el signo igual (=)."
      },
      {
        question_text: "¿Qué función se usa para buscar valores en una tabla?",
        question_type: "multiple_choice",
        correct_answer: "BUSCARV",
        options: ["BUSCAR", "BUSCARV", "ENCONTRAR", "CONSULTAR"],
        explanation: "BUSCARV (VLOOKUP) busca un valor en la primera columna y devuelve un valor de otra columna."
      },
      {
        question_text: "¿Qué hace la función SI?",
        question_type: "multiple_choice",
        correct_answer: "Evalúa una condición y retorna valores diferentes",
        options: ["Suma valores", "Evalúa una condición y retorna valores diferentes", "Busca datos", "Cuenta celdas"],
        explanation: "SI (IF) evalúa una condición lógica y retorna un valor si es verdadera, otro si es falsa."
      }
    ]
  },
  {
    title: "Arquitectura Clásica",
    difficulty: "medium",
    category_name: "Arte",
    tags: ["arquitectura", "arte", "historia", "edificios"],
    source: "Comunidad Text2Quiz",
    summary: "Explora la arquitectura a través de los siglos: órdenes clásicos, grandes edificios, estilos arquitectónicos y arquitectos legendarios. El arte de construir espacios.",
    questions: [
      {
        question_text: "¿Cuáles son los tres órdenes clásicos griegos?",
        question_type: "multiple_choice",
        correct_answer: "Dórico, Jónico y Corintio",
        options: ["Gótico, Románico y Barroco", "Dórico, Jónico y Corintio", "Toscano, Compuesto y Moderno", "Bizantino, Gótico y Renacentista"],
        explanation: "Los tres órdenes arquitectónicos griegos se distinguen por sus columnas y capiteles."
      },
      {
        question_text: "¿Quién diseñó la cúpula de la Basílica de San Pedro?",
        question_type: "multiple_choice",
        correct_answer: "Miguel Ángel",
        options: ["Leonardo da Vinci", "Miguel Ángel", "Bernini", "Rafael"],
        explanation: "Miguel Ángel diseñó la icónica cúpula, aunque Giacomo della Porta la completó."
      },
      {
        question_text: "¿Qué estilo arquitectónico caracteriza Notre-Dame de París?",
        question_type: "multiple_choice",
        correct_answer: "Gótico",
        options: ["Románico", "Gótico", "Barroco", "Neoclásico"],
        explanation: "Notre-Dame es un ejemplo emblemático de la arquitectura gótica francesa."
      },
      {
        question_text: "¿Qué arquitecto diseñó la Sagrada Familia en Barcelona?",
        question_type: "multiple_choice",
        correct_answer: "Antoni Gaudí",
        options: ["Le Corbusier", "Antoni Gaudí", "Frank Lloyd Wright", "Oscar Niemeyer"],
        explanation: "Gaudí dedicó más de 40 años a este proyecto modernista aún sin terminar."
      },
      {
        question_text: "¿Qué es un arbotante en arquitectura gótica?",
        question_type: "multiple_choice",
        correct_answer: "Un soporte exterior que transmite el peso del techo",
        options: ["Una ventana decorativa", "Un soporte exterior que transmite el peso del techo", "Un tipo de columna", "Una puerta ornamental"],
        explanation: "Los arbotantes permitieron construir muros más altos y delgados con grandes ventanas."
      }
    ]
  },
  {
    title: "Cocina Internacional",
    difficulty: "easy",
    category_name: "Gastronomía",
    tags: ["cocina", "gastronomía", "comida", "cultura"],
    source: "Comunidad Text2Quiz",
    summary: "Viaja por el mundo a través de la gastronomía: platos típicos, ingredientes característicos, técnicas culinarias y tradiciones. Un festín de conocimiento culinario.",
    questions: [
      {
        question_text: "¿De qué país es originario el sushi?",
        question_type: "multiple_choice",
        correct_answer: "Japón",
        options: ["China", "Japón", "Corea", "Tailandia"],
        explanation: "El sushi es un plato tradicional japonés de arroz con pescado crudo."
      },
      {
        question_text: "¿Qué ingrediente principal tiene la paella valenciana?",
        question_type: "multiple_choice",
        correct_answer: "Arroz",
        options: ["Pasta", "Arroz", "Quinoa", "Trigo"],
        explanation: "La paella es un plato de arroz tradicional de Valencia, España."
      },
      {
        question_text: "¿De dónde es originaria la pizza?",
        question_type: "multiple_choice",
        correct_answer: "Italia",
        options: ["Estados Unidos", "Italia", "Grecia", "Francia"],
        explanation: "La pizza moderna se originó en Nápoles, Italia, en el siglo XVIII."
      },
      {
        question_text: "¿Qué país es famoso por el curry?",
        question_type: "multiple_choice",
        correct_answer: "India",
        options: ["Tailandia", "India", "China", "Japón"],
        explanation: "El curry es una mezcla de especias fundamental en la cocina india."
      },
      {
        question_text: "¿Qué son los tacos?",
        question_type: "multiple_choice",
        correct_answer: "Plato mexicano de tortilla con relleno",
        options: ["Postre español", "Plato mexicano de tortilla con relleno", "Sopa tailandesa", "Pan francés"],
        explanation: "Los tacos son un plato tradicional mexicano de tortilla de maíz o harina con diversos rellenos."
      }
    ]
  },
  {
    title: "Primeros Auxilios Básicos",
    difficulty: "medium",
    category_name: "Salud",
    tags: ["primeros auxilios", "salud", "emergencias", "seguridad"],
    source: "Comunidad Text2Quiz",
    summary: "Aprende técnicas vitales de primeros auxilios: RCP, maniobra de Heimlich, tratamiento de quemaduras y heridas. Conocimiento que puede salvar vidas.",
    questions: [
      {
        question_text: "¿Qué significa RCP?",
        question_type: "multiple_choice",
        correct_answer: "Reanimación Cardiopulmonar",
        options: ["Respiración Cardíaca Profunda", "Reanimación Cardiopulmonar", "Revisión Cardiovascular Periódica", "Respiración Controlada Pulmonar"],
        explanation: "RCP es un procedimiento de emergencia para reanimar a alguien cuyo corazón se ha detenido."
      },
      {
        question_text: "¿Qué hacer primero ante una herida que sangra mucho?",
        question_type: "multiple_choice",
        correct_answer: "Aplicar presión directa con un paño limpio",
        options: ["Aplicar hielo", "Aplicar presión directa con un paño limpio", "Elevar la extremidad solamente", "Aplicar torniquete inmediatamente"],
        explanation: "La presión directa es el primer paso para controlar el sangrado."
      },
      {
        question_text: "¿Qué es la maniobra de Heimlich?",
        question_type: "multiple_choice",
        correct_answer: "Técnica para ayudar a alguien que se está asfixiando",
        options: ["Técnica de respiración", "Técnica para ayudar a alguien que se está asfixiando", "Masaje cardíaco", "Vendaje especial"],
        explanation: "La maniobra de Heimlich expulsa objetos que obstruyen las vías respiratorias mediante presión abdominal."
      },
      {
        question_text: "¿Cómo tratar una quemadura leve?",
        question_type: "multiple_choice",
        correct_answer: "Enfriar con agua fría durante 10-20 minutos",
        options: ["Aplicar mantequilla", "Enfriar con agua fría durante 10-20 minutos", "Reventar las ampollas", "Aplicar hielo directamente"],
        explanation: "El agua fría (no helada) alivia el dolor y previene daños mayores en quemaduras leves."
      },
      {
        question_text: "¿Qué número debes llamar en caso de emergencia en la mayoría de países?",
        question_type: "multiple_choice",
        correct_answer: "112 o 911 según el país",
        options: ["123", "112 o 911 según el país", "999", "000"],
        explanation: "112 es el número europeo, 911 en América, aunque puede variar por país."
      }
    ]
  },
  {
    title: "Fotografía Digital",
    difficulty: "medium",
    category_name: "Fotografía",
    tags: ["fotografía", "cámara", "arte", "técnica"],
    source: "Comunidad Text2Quiz",
    summary: "Domina los conceptos fotográficos: apertura, ISO, velocidad de obturación, composición y regla de tercios. Captura mejores imágenes entendiendo tu cámara.",
    questions: [
      {
        question_text: "¿Qué controla la apertura del diafragma (f-stop)?",
        question_type: "multiple_choice",
        correct_answer: "La cantidad de luz que entra y la profundidad de campo",
        options: ["Solo la velocidad", "La cantidad de luz que entra y la profundidad de campo", "El color de la imagen", "El enfoque automático"],
        explanation: "Una apertura grande (f/1.8) deja entrar más luz y crea menor profundidad de campo."
      },
      {
        question_text: "¿Qué hace el ISO en fotografía?",
        question_type: "multiple_choice",
        correct_answer: "Controla la sensibilidad del sensor a la luz",
        options: ["Cambia el zoom", "Controla la sensibilidad del sensor a la luz", "Ajusta el color", "Modifica la resolución"],
        explanation: "Un ISO alto (3200) es más sensible pero genera más ruido; uno bajo (100) da imágenes más limpias."
      },
      {
        question_text: "¿Qué es la regla de los tercios?",
        question_type: "multiple_choice",
        correct_answer: "Dividir la imagen en 9 partes iguales para mejor composición",
        options: ["Usar tres colores", "Dividir la imagen en 9 partes iguales para mejor composición", "Tomar tres fotos", "Una técnica de iluminación"],
        explanation: "Colocar elementos importantes en las intersecciones de las líneas crea composiciones más interesantes."
      },
      {
        question_text: "¿Qué es la velocidad de obturación?",
        question_type: "multiple_choice",
        correct_answer: "El tiempo que el sensor está expuesto a la luz",
        options: ["La rapidez del enfoque", "El tiempo que el sensor está expuesto a la luz", "La velocidad de disparo continuo", "El tiempo de procesamiento"],
        explanation: "Una velocidad rápida (1/1000s) congela el movimiento; una lenta (1s) crea efecto de movimiento."
      },
      {
        question_text: "¿Qué tipo de lente se usa para retratos profesionales?",
        question_type: "multiple_choice",
        correct_answer: "Teleobjetivo medio (50-85mm)",
        options: ["Gran angular", "Teleobjetivo medio (50-85mm)", "Ojo de pez", "Macro"],
        explanation: "Los teleobjetivos medios (50-85mm) crean una perspectiva favorecedora y desenfoque de fondo."
      }
    ]
  },
  {
    title: "Historia de México",
    difficulty: "medium",
    category_name: "Historia",
    tags: ["méxico", "historia", "cultura", "latinoamérica"],
    source: "Comunidad Text2Quiz",
    summary: "Recorre la historia mexicana: desde las culturas prehispánicas, la conquista española, la independencia hasta la Revolución Mexicana. Un viaje por el México histórico.",
    questions: [
      {
        question_text: "¿Qué cultura construyó las pirámides de Teotihuacán?",
        question_type: "multiple_choice",
        correct_answer: "Teotihuacana",
        options: ["Azteca", "Maya", "Teotihuacana", "Olmeca"],
        explanation: "La cultura teotihuacana construyó esta gran ciudad entre el 100 a.C. y 650 d.C."
      },
      {
        question_text: "¿En qué año se consumó la independencia de México?",
        question_type: "multiple_choice",
        correct_answer: "1821",
        options: ["1810", "1821", "1824", "1836"],
        explanation: "La independencia se consumó el 27 de septiembre de 1821 con la entrada del Ejército Trigarante."
      },
      {
        question_text: "¿Quién fue el líder azteca cuando llegaron los españoles?",
        question_type: "multiple_choice",
        correct_answer: "Moctezuma II",
        options: ["Cuauhtémoc", "Moctezuma II", "Nezahualcóyotl", "Itzcoatl"],
        explanation: "Moctezuma II gobernaba Tenochtitlan cuando Hernán Cortés llegó en 1519."
      },
      {
        question_text: "¿Qué período histórico fue de 1910 a 1920 en México?",
        question_type: "multiple_choice",
        correct_answer: "La Revolución Mexicana",
        options: ["La Reforma", "La Revolución Mexicana", "El Porfiriato", "La Guerra de Independencia"],
        explanation: "La Revolución Mexicana fue un conflicto armado que transformó la estructura política y social."
      },
      {
        question_text: "¿Quiénes fueron dos líderes importantes de la Revolución Mexicana?",
        question_type: "multiple_choice",
        correct_answer: "Emiliano Zapata y Pancho Villa",
        options: ["Benito Juárez y Porfirio Díaz", "Emiliano Zapata y Pancho Villa", "Miguel Hidalgo y José Morelos", "Santa Anna y Maximiliano"],
        explanation: "Zapata lideró el sur con 'Tierra y Libertad', Villa comandó la División del Norte."
      }
    ]
  }
];

async function seedQuizzes() {
  console.log('🌱 Starting to seed public quizzes...\n');

  try {
    // First, get or create categories
    const categoryMap = new Map();
    const uniqueCategories = [...new Set(quizzes.map(q => q.category_name))];

    for (const categoryName of uniqueCategories) {
      const categoryIcons = {
        'Programación': '💻',
        'Matemáticas': '🔢',
        'Historia': '📜',
        'Geografía': '🌍',
        'Idiomas': '🗣️',
        'Ciencias': '🔬',
        'Literatura': '📚',
        'Arte': '🎨',
        'Música': '🎵',
        'Economía': '💰',
        'Tecnología': '⚙️',
        'Deportes': '⚽',
        'Cine': '🎬',
        'Marketing': '📈',
        'Filosofía': '🤔',
        'Psicología': '🧠',
        'Gastronomía': '🍽️',
        'Salud': '❤️',
        'Fotografía': '📸'
      };

      // Generate slug from category name
      const slug = categoryName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const { data: existingCategory } = await supabase
        .from('quiz_categories')
        .select('id')
        .eq('name', categoryName)
        .single();

      if (existingCategory) {
        categoryMap.set(categoryName, existingCategory.id);
        console.log(`✓ Category "${categoryName}" already exists`);
      } else {
        const { data: newCategory, error } = await supabase
          .from('quiz_categories')
          .insert({
            name: categoryName,
            slug: slug,
            icon: categoryIcons[categoryName] || '📝',
            description: `Quizzes sobre ${categoryName}`
          })
          .select()
          .single();

        if (error) throw error;
        categoryMap.set(categoryName, newCategory.id);
        console.log(`✓ Created category "${categoryName}" (${slug})`);
      }
    }

    console.log('\n📝 Creating quizzes...\n');

    // Create quizzes
    for (const quizData of quizzes) {
      try {
        const categoryId = categoryMap.get(quizData.category_name);

        // Create quiz
        const { data: quiz, error: quizError} = await supabase
          .from('quizzes')
          .insert({
            title: quizData.title,
            difficulty: quizData.difficulty,
            total_questions: quizData.questions.length,
            visibility: 'public',
            category_id: categoryId,
            tags: quizData.tags,
            source: quizData.source,
            is_verified: true,
            summary: quizData.summary
          })
          .select()
          .single();

        if (quizError) {
          console.error(`✗ Error creating quiz "${quizData.title}":`, quizError);
          continue;
        }

        // Create questions
        const questions = quizData.questions.map((q, index) => ({
          quiz_id: quiz.id,
          question_text: q.question_text,
          question_type: q.question_type,
          correct_answer: q.correct_answer,
          options: q.options,
          explanation: q.explanation,
          order: index + 1
        }));

        const { error: questionsError } = await supabase
          .from('questions')
          .insert(questions);

        if (questionsError) {
          console.error(`✗ Error creating questions for "${quizData.title}":`, questionsError);
          continue;
        }

        console.log(`✓ Created quiz: "${quizData.title}" (${quizData.difficulty}) - ${quizData.questions.length} questions`);
      } catch (err) {
        console.error(`✗ Error processing quiz "${quizData.title}":`, err);
      }
    }

    console.log('\n✅ Seeding completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   - Categories created/verified: ${uniqueCategories.length}`);
    console.log(`   - Quizzes created: ${quizzes.length}`);
    console.log(`   - Total questions: ${quizzes.reduce((sum, q) => sum + q.questions.length, 0)}`);

  } catch (error) {
    console.error('\n❌ Error seeding quizzes:', error);
    process.exit(1);
  }
}

seedQuizzes();
