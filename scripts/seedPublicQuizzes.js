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
    title: "JavaScript Moderno: ES6+ Features",
    difficulty: "medium",
    category_name: "Programación",
    tags: ["javascript", "es6", "frontend", "desarrollo web"],
    source: "Comunidad Text2Quiz",
    summary: "Domina las características modernas de JavaScript ES6+: arrow functions, destructuring, spread operator, async/await y métodos de arrays. Perfecto para desarrolladores que quieren actualizar sus conocimientos de JavaScript.",
    questions: [
      {
        question_text: "¿Cuál es la diferencia principal entre 'let' y 'const' en JavaScript?",
        question_type: "multiple_choice",
        correct_answer: "'const' no permite reasignación, 'let' sí",
        options: ["'const' no permite reasignación, 'let' sí", "No hay diferencia", "'let' es más rápido", "'const' solo funciona con números"],
        explanation: "'const' declara una constante que no puede ser reasignada, mientras que 'let' permite reasignar el valor de la variable."
      },
      {
        question_text: "¿Qué retorna una función arrow sin llaves explícitas?",
        question_type: "multiple_choice",
        correct_answer: "El valor de la expresión implícitamente",
        options: ["undefined", "null", "El valor de la expresión implícitamente", "Un objeto vacío"],
        explanation: "Las arrow functions sin llaves retornan implícitamente el resultado de la expresión."
      },
      {
        question_text: "¿Qué hace el operador spread (...) con arrays?",
        question_type: "multiple_choice",
        correct_answer: "Expande los elementos del array",
        options: ["Duplica el array", "Expande los elementos del array", "Elimina elementos", "Ordena el array"],
        explanation: "El operador spread expande los elementos de un array, permitiendo copiarlos o combinarlos fácilmente."
      },
      {
        question_text: "¿Para qué se usa async/await?",
        question_type: "multiple_choice",
        correct_answer: "Manejar código asíncrono de forma síncrona",
        options: ["Hacer el código más lento", "Manejar código asíncrono de forma síncrona", "Crear loops infinitos", "Declarar constantes"],
        explanation: "async/await permite escribir código asíncrono que se lee como código síncrono, facilitando su comprensión."
      },
      {
        question_text: "¿Qué hace el método .map() en arrays?",
        question_type: "multiple_choice",
        correct_answer: "Transforma cada elemento y retorna un nuevo array",
        options: ["Elimina elementos", "Transforma cada elemento y retorna un nuevo array", "Ordena el array", "Busca un elemento"],
        explanation: ".map() crea un nuevo array con los resultados de aplicar una función a cada elemento del array original."
      }
    ]
  },
  {
    title: "Python para Data Science",
    difficulty: "hard",
    category_name: "Programación",
    tags: ["python", "data science", "pandas", "numpy"],
    source: "Comunidad Text2Quiz",
    summary: "Aprende los fundamentos de Python para análisis de datos: Pandas para manipulación de datos, NumPy para cálculos numéricos y Matplotlib para visualización. Ideal para aspirantes a data scientists.",
    questions: [
      {
        question_text: "¿Qué librería de Python se usa principalmente para manipulación de datos tabulares?",
        question_type: "multiple_choice",
        correct_answer: "Pandas",
        options: ["NumPy", "Pandas", "Matplotlib", "TensorFlow"],
        explanation: "Pandas es la librería principal para trabajar con datos tabulares (DataFrames) en Python."
      },
      {
        question_text: "En NumPy, ¿qué es un ndarray?",
        question_type: "multiple_choice",
        correct_answer: "Un array multidimensional",
        options: ["Una función", "Un array multidimensional", "Un tipo de gráfico", "Un modelo de ML"],
        explanation: "ndarray (N-dimensional array) es la estructura de datos fundamental de NumPy para arrays multidimensionales."
      },
      {
        question_text: "¿Qué hace el método .groupby() en Pandas?",
        question_type: "multiple_choice",
        correct_answer: "Agrupa datos según una o más columnas",
        options: ["Ordena datos", "Agrupa datos según una o más columnas", "Elimina duplicados", "Crea gráficos"],
        explanation: ".groupby() permite agrupar datos por valores de una o más columnas para realizar operaciones agregadas."
      },
      {
        question_text: "¿Cuál es la ventaja principal de usar NumPy sobre listas Python?",
        question_type: "multiple_choice",
        correct_answer: "Mejor rendimiento en operaciones numéricas",
        options: ["Sintaxis más simple", "Mejor rendimiento en operaciones numéricas", "Menos memoria", "Más fácil de aprender"],
        explanation: "NumPy está optimizado en C, proporcionando operaciones vectorizadas muy rápidas sobre arrays numéricos."
      },
      {
        question_text: "¿Qué librería se usa para visualización de datos en Python?",
        question_type: "multiple_choice",
        correct_answer: "Matplotlib",
        options: ["Django", "Matplotlib", "Flask", "Requests"],
        explanation: "Matplotlib es la librería más popular para crear visualizaciones y gráficos en Python."
      }
    ]
  },
  {
    title: "Probabilidad y Estadística Básica",
    difficulty: "medium",
    category_name: "Matemáticas",
    tags: ["estadística", "probabilidad", "matemáticas"],
    source: "Comunidad Text2Quiz",
    summary: "Conceptos fundamentales de probabilidad y estadística: media, mediana, desviación estándar, frecuencias y cálculo de probabilidades. Esencial para análisis de datos y toma de decisiones.",
    questions: [
      {
        question_text: "Si lanzas un dado justo, ¿cuál es la probabilidad de obtener un 4?",
        question_type: "multiple_choice",
        correct_answer: "1/6",
        options: ["1/4", "1/6", "1/2", "1/3"],
        explanation: "Un dado tiene 6 caras y cada una tiene igual probabilidad, por lo tanto P(4) = 1/6."
      },
      {
        question_text: "¿Qué es la media aritmética?",
        question_type: "multiple_choice",
        correct_answer: "La suma de valores dividida por la cantidad",
        options: ["El valor más frecuente", "La suma de valores dividida por la cantidad", "El valor central", "La diferencia entre máximo y mínimo"],
        explanation: "La media es el promedio: suma de todos los valores dividida por la cantidad de valores."
      },
      {
        question_text: "¿Qué mide la desviación estándar?",
        question_type: "multiple_choice",
        correct_answer: "La dispersión de los datos respecto a la media",
        options: ["El valor promedio", "La dispersión de los datos respecto a la media", "El valor máximo", "La cantidad de datos"],
        explanation: "La desviación estándar mide cuánto se alejan los datos de su valor promedio."
      },
      {
        question_text: "En una muestra de 100 personas, 30 prefieren café. ¿Cuál es la frecuencia relativa?",
        question_type: "multiple_choice",
        correct_answer: "0.30",
        options: ["30", "0.30", "70", "0.70"],
        explanation: "La frecuencia relativa es 30/100 = 0.30 o 30%."
      },
      {
        question_text: "¿Qué es la mediana?",
        question_type: "multiple_choice",
        correct_answer: "El valor que divide los datos en dos mitades iguales",
        options: ["El promedio", "El valor más frecuente", "El valor que divide los datos en dos mitades iguales", "La suma de todos los valores"],
        explanation: "La mediana es el valor central cuando los datos están ordenados, dividiendo el conjunto en dos partes iguales."
      }
    ]
  },
  {
    title: "Historia Universal: Siglo XX",
    difficulty: "medium",
    category_name: "Historia",
    tags: ["historia", "siglo XX", "cultura general"],
    source: "Comunidad Text2Quiz",
    summary: "Recorre los eventos más importantes del siglo XX: las Guerras Mundiales, la Guerra Fría, la carrera espacial y la caída del Muro de Berlín. Descubre la historia que moldeó nuestro mundo actual.",
    questions: [
      {
        question_text: "¿En qué año terminó la Segunda Guerra Mundial?",
        question_type: "multiple_choice",
        correct_answer: "1945",
        options: ["1943", "1944", "1945", "1946"],
        explanation: "La Segunda Guerra Mundial terminó en 1945 con la rendición de Japón en septiembre."
      },
      {
        question_text: "¿Quién fue el primer hombre en pisar la Luna?",
        question_type: "multiple_choice",
        correct_answer: "Neil Armstrong",
        options: ["Buzz Aldrin", "Neil Armstrong", "Yuri Gagarin", "John Glenn"],
        explanation: "Neil Armstrong pisó la Luna el 20 de julio de 1969 durante la misión Apolo 11."
      },
      {
        question_text: "¿En qué año cayó el Muro de Berlín?",
        question_type: "multiple_choice",
        correct_answer: "1989",
        options: ["1987", "1988", "1989", "1990"],
        explanation: "El Muro de Berlín cayó el 9 de noviembre de 1989, marcando el fin de la Guerra Fría."
      },
      {
        question_text: "¿Qué evento marcó el inicio de la Primera Guerra Mundial?",
        question_type: "multiple_choice",
        correct_answer: "El asesinato del Archiduque Francisco Fernando",
        options: ["La invasión de Polonia", "El asesinato del Archiduque Francisco Fernando", "La Revolución Rusa", "El hundimiento del Titanic"],
        explanation: "El asesinato del Archiduque Francisco Fernando en Sarajevo en 1914 desencadenó la Primera Guerra Mundial."
      },
      {
        question_text: "¿Quién fue el líder de la Unión Soviética durante la mayor parte de la Guerra Fría?",
        question_type: "multiple_choice",
        correct_answer: "Joseph Stalin",
        options: ["Vladimir Lenin", "Joseph Stalin", "Nikita Kruschev", "Mikhail Gorbachev"],
        explanation: "Joseph Stalin lideró la URSS desde 1924 hasta 1953, durante los años iniciales y cruciales de la Guerra Fría."
      }
    ]
  },
  {
    title: "Geografía Mundial",
    difficulty: "easy",
    category_name: "Geografía",
    tags: ["geografía", "países", "capitales", "cultura general"],
    source: "Comunidad Text2Quiz",
    summary: "Viaja por el mundo aprendiendo sobre capitales, océanos, continentes, ríos y países. Un quiz perfecto para mejorar tu conocimiento geográfico global de forma divertida.",
    questions: [
      {
        question_text: "¿Cuál es la capital de Australia?",
        question_type: "multiple_choice",
        correct_answer: "Canberra",
        options: ["Sydney", "Melbourne", "Canberra", "Brisbane"],
        explanation: "Aunque Sydney es más conocida, la capital de Australia es Canberra."
      },
      {
        question_text: "¿Qué océano es el más grande del mundo?",
        question_type: "multiple_choice",
        correct_answer: "Océano Pacífico",
        options: ["Océano Atlántico", "Océano Pacífico", "Océano Índico", "Océano Ártico"],
        explanation: "El Océano Pacífico es el más grande, cubriendo más del 30% de la superficie terrestre."
      },
      {
        question_text: "¿En qué continente está Egipto?",
        question_type: "multiple_choice",
        correct_answer: "África",
        options: ["Asia", "África", "Europa", "Medio Oriente"],
        explanation: "Egipto está ubicado en el noreste de África, aunque parte del Sinaí está en Asia."
      },
      {
        question_text: "¿Cuál es el río más largo del mundo?",
        question_type: "multiple_choice",
        correct_answer: "Río Nilo",
        options: ["Río Amazonas", "Río Nilo", "Río Yangtsé", "Río Misisipi"],
        explanation: "El Nilo, con aproximadamente 6,650 km, es considerado el río más largo del mundo."
      },
      {
        question_text: "¿Qué país tiene más población en el mundo?",
        question_type: "multiple_choice",
        correct_answer: "India",
        options: ["China", "India", "Estados Unidos", "Indonesia"],
        explanation: "India superó a China en 2023 como el país más poblado del mundo."
      }
    ]
  },
  {
    title: "Inglés: Verbos Irregulares",
    difficulty: "medium",
    category_name: "Idiomas",
    tags: ["inglés", "gramática", "verbos", "idiomas"],
    source: "Comunidad Text2Quiz",
    summary: "Practica los verbos irregulares más comunes del inglés: pasado simple y participio pasado de go, eat, write, break y begin. Mejora tu gramática inglesa con este quiz esencial.",
    questions: [
      {
        question_text: "¿Cuál es el pasado simple de 'go'?",
        question_type: "multiple_choice",
        correct_answer: "went",
        options: ["goed", "went", "gone", "going"],
        explanation: "'Went' es el pasado simple de 'go'. 'Gone' es el participio pasado."
      },
      {
        question_text: "¿Cuál es el participio pasado de 'eat'?",
        question_type: "multiple_choice",
        correct_answer: "eaten",
        options: ["ate", "eated", "eaten", "eating"],
        explanation: "'Eaten' es el participio pasado de 'eat'. 'Ate' es el pasado simple."
      },
      {
        question_text: "¿Cuál es el pasado de 'write'?",
        question_type: "multiple_choice",
        correct_answer: "wrote",
        options: ["writed", "wrote", "written", "writing"],
        explanation: "'Wrote' es el pasado simple de 'write'. 'Written' es el participio pasado."
      },
      {
        question_text: "¿Cuál es el participio de 'break'?",
        question_type: "multiple_choice",
        correct_answer: "broken",
        options: ["breaked", "broke", "broken", "breaking"],
        explanation: "'Broken' es el participio pasado de 'break'. 'Broke' es el pasado simple."
      },
      {
        question_text: "¿Cuál es el pasado de 'begin'?",
        question_type: "multiple_choice",
        correct_answer: "began",
        options: ["beginned", "begun", "began", "beginning"],
        explanation: "'Began' es el pasado simple de 'begin'. 'Begun' es el participio pasado."
      }
    ]
  },
  {
    title: "Biología: Célula y Genética",
    difficulty: "medium",
    category_name: "Ciencias",
    tags: ["biología", "células", "genética", "ciencia"],
    source: "Comunidad Text2Quiz",
    summary: "Explora la biología celular y genética: estructura y función de orgánulos, cromosomas, ADN, fotosíntesis y diferencias entre células eucariotas y procariotas. Ciencia fundamental de la vida.",
    questions: [
      {
        question_text: "¿Qué orgánulo celular produce energía?",
        question_type: "multiple_choice",
        correct_answer: "Mitocondria",
        options: ["Núcleo", "Mitocondria", "Ribosoma", "Lisosoma"],
        explanation: "La mitocondria es conocida como la 'central energética' de la célula, produciendo ATP."
      },
      {
        question_text: "¿Cuántos cromosomas tiene una célula humana normal?",
        question_type: "multiple_choice",
        correct_answer: "46",
        options: ["23", "46", "48", "92"],
        explanation: "Las células humanas tienen 46 cromosomas: 23 pares, uno de cada progenitor."
      },
      {
        question_text: "¿Qué molécula contiene la información genética?",
        question_type: "multiple_choice",
        correct_answer: "ADN",
        options: ["ARN", "ADN", "Proteínas", "Lípidos"],
        explanation: "El ADN (ácido desoxirribonucleico) almacena la información genética de los organismos."
      },
      {
        question_text: "¿Qué proceso permite a las plantas producir su alimento?",
        question_type: "multiple_choice",
        correct_answer: "Fotosíntesis",
        options: ["Respiración", "Fotosíntesis", "Fermentación", "Digestión"],
        explanation: "La fotosíntesis permite a las plantas convertir luz solar, CO2 y agua en glucosa y oxígeno."
      },
      {
        question_text: "¿Qué tipo de célula NO tiene núcleo definido?",
        question_type: "multiple_choice",
        correct_answer: "Procariota",
        options: ["Eucariota", "Procariota", "Animal", "Vegetal"],
        explanation: "Las células procariotas (bacterias) no tienen núcleo definido, su ADN está en el citoplasma."
      }
    ]
  },
  {
    title: "Literatura Universal Clásica",
    difficulty: "medium",
    category_name: "Literatura",
    tags: ["literatura", "libros", "autores", "cultura"],
    source: "Comunidad Text2Quiz",
    summary: "Descubre obras maestras de la literatura universal: desde Cervantes y Shakespeare hasta García Márquez y Orwell. Conoce a los grandes autores que han marcado la historia literaria.",
    questions: [
      {
        question_text: "¿Quién escribió 'Cien años de soledad'?",
        question_type: "multiple_choice",
        correct_answer: "Gabriel García Márquez",
        options: ["Mario Vargas Llosa", "Gabriel García Márquez", "Jorge Luis Borges", "Pablo Neruda"],
        explanation: "Gabriel García Márquez escribió esta obra maestra del realismo mágico en 1967."
      },
      {
        question_text: "¿En qué país nació Miguel de Cervantes?",
        question_type: "multiple_choice",
        correct_answer: "España",
        options: ["México", "España", "Argentina", "Colombia"],
        explanation: "Miguel de Cervantes, autor de Don Quijote, nació en Alcalá de Henares, España, en 1547."
      },
      {
        question_text: "¿Quién escribió 'Romeo y Julieta'?",
        question_type: "multiple_choice",
        correct_answer: "William Shakespeare",
        options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Oscar Wilde"],
        explanation: "William Shakespeare escribió esta famosa tragedia romántica alrededor de 1595."
      },
      {
        question_text: "¿Qué obra comienza con 'En un lugar de la Mancha'?",
        question_type: "multiple_choice",
        correct_answer: "Don Quijote de la Mancha",
        options: ["La Celestina", "Don Quijote de la Mancha", "El Lazarillo de Tormes", "La vida es sueño"],
        explanation: "Don Quijote de la Mancha, de Cervantes, comienza con esta famosa frase."
      },
      {
        question_text: "¿Quién escribió '1984'?",
        question_type: "multiple_choice",
        correct_answer: "George Orwell",
        options: ["Aldous Huxley", "George Orwell", "Ray Bradbury", "H.G. Wells"],
        explanation: "George Orwell escribió esta distopía sobre totalitarismo en 1949."
      }
    ]
  },
  {
    title: "Química Básica",
    difficulty: "easy",
    category_name: "Ciencias",
    tags: ["química", "elementos", "ciencia", "tabla periódica"],
    source: "Comunidad Text2Quiz",
    summary: "Aprende los conceptos básicos de química: elementos, símbolos químicos, fórmulas simples, composición de la atmósfera y pH. Perfecto para iniciarse en el mundo de la química.",
    questions: [
      {
        question_text: "¿Cuál es el símbolo químico del oro?",
        question_type: "multiple_choice",
        correct_answer: "Au",
        options: ["Go", "Au", "Or", "Gd"],
        explanation: "Au viene del latín 'aurum', que significa oro."
      },
      {
        question_text: "¿Qué gas necesitamos para respirar?",
        question_type: "multiple_choice",
        correct_answer: "Oxígeno",
        options: ["Nitrógeno", "Oxígeno", "Dióxido de carbono", "Hidrógeno"],
        explanation: "Necesitamos oxígeno (O2) para la respiración celular."
      },
      {
        question_text: "¿Cuál es la fórmula química del agua?",
        question_type: "multiple_choice",
        correct_answer: "H2O",
        options: ["H2O", "CO2", "O2", "H2O2"],
        explanation: "El agua está formada por dos átomos de hidrógeno y uno de oxígeno: H2O."
      },
      {
        question_text: "¿Qué elemento es el más abundante en la atmósfera?",
        question_type: "multiple_choice",
        correct_answer: "Nitrógeno",
        options: ["Oxígeno", "Nitrógeno", "Dióxido de carbono", "Argón"],
        explanation: "El nitrógeno constituye aproximadamente el 78% de la atmósfera terrestre."
      },
      {
        question_text: "¿Cuál es el pH del agua pura?",
        question_type: "multiple_choice",
        correct_answer: "7",
        options: ["0", "7", "14", "10"],
        explanation: "El agua pura tiene pH 7, siendo neutro (ni ácido ni básico)."
      }
    ]
  },
  {
    title: "Física: Mecánica Básica",
    difficulty: "medium",
    category_name: "Ciencias",
    tags: ["física", "mecánica", "ciencia", "leyes"],
    source: "Comunidad Text2Quiz",
    summary: "Domina los principios de la física clásica: las leyes de Newton, fuerza, energía cinética, velocidad de la luz y unidades de medida. Los fundamentos que explican cómo funciona el universo.",
    questions: [
      {
        question_text: "¿Quién formuló las tres leyes del movimiento?",
        question_type: "multiple_choice",
        correct_answer: "Isaac Newton",
        options: ["Albert Einstein", "Isaac Newton", "Galileo Galilei", "Stephen Hawking"],
        explanation: "Isaac Newton formuló las tres leyes del movimiento en su obra 'Principia Mathematica' en 1687."
      },
      {
        question_text: "¿Qué unidad se usa para medir la fuerza?",
        question_type: "multiple_choice",
        correct_answer: "Newton",
        options: ["Joule", "Newton", "Watt", "Pascal"],
        explanation: "El Newton (N) es la unidad del Sistema Internacional para medir la fuerza."
      },
      {
        question_text: "¿Cuál es la velocidad de la luz en el vacío?",
        question_type: "multiple_choice",
        correct_answer: "300,000 km/s",
        options: ["150,000 km/s", "300,000 km/s", "450,000 km/s", "600,000 km/s"],
        explanation: "La luz viaja a aproximadamente 300,000 km/s (299,792,458 m/s exactamente) en el vacío."
      },
      {
        question_text: "¿Qué dice la primera ley de Newton?",
        question_type: "multiple_choice",
        correct_answer: "Un objeto en reposo permanece en reposo a menos que actúe una fuerza",
        options: ["F = ma", "Un objeto en reposo permanece en reposo a menos que actúe una fuerza", "Acción y reacción son iguales", "La energía no se crea ni se destruye"],
        explanation: "La primera ley de Newton (inercia) establece que un objeto mantiene su estado de movimiento a menos que una fuerza actúe sobre él."
      },
      {
        question_text: "¿Qué es la energía cinética?",
        question_type: "multiple_choice",
        correct_answer: "La energía del movimiento",
        options: ["La energía almacenada", "La energía del movimiento", "La energía térmica", "La energía química"],
        explanation: "La energía cinética es la energía que posee un objeto debido a su movimiento."
      }
    ]
  },
  {
    title: "SQL y Bases de Datos",
    difficulty: "medium",
    category_name: "Programación",
    tags: ["sql", "bases de datos", "backend", "queries"],
    source: "Comunidad Text2Quiz",
    summary: "Aprende SQL y conceptos de bases de datos: comandos SELECT, claves primarias, JOIN, CRUD y cláusulas WHERE. Esencial para cualquier desarrollador backend o data analyst.",
    questions: [
      {
        question_text: "¿Qué comando SQL se usa para obtener datos de una tabla?",
        question_type: "multiple_choice",
        correct_answer: "SELECT",
        options: ["GET", "SELECT", "FETCH", "RETRIEVE"],
        explanation: "SELECT es el comando fundamental para consultar y obtener datos de una base de datos."
      },
      {
        question_text: "¿Qué es una clave primaria (PRIMARY KEY)?",
        question_type: "multiple_choice",
        correct_answer: "Un identificador único para cada registro",
        options: ["Una contraseña de la base de datos", "Un identificador único para cada registro", "El primer campo de una tabla", "Una clave de encriptación"],
        explanation: "Una PRIMARY KEY identifica únicamente cada registro en una tabla, sin duplicados ni valores nulos."
      },
      {
        question_text: "¿Qué hace el comando JOIN?",
        question_type: "multiple_choice",
        correct_answer: "Combina filas de dos o más tablas",
        options: ["Elimina datos duplicados", "Combina filas de dos o más tablas", "Ordena los resultados", "Agrupa datos"],
        explanation: "JOIN permite combinar datos de múltiples tablas basándose en una relación entre ellas."
      },
      {
        question_text: "¿Qué significa CRUD?",
        question_type: "multiple_choice",
        correct_answer: "Create, Read, Update, Delete",
        options: ["Create, Read, Update, Delete", "Copy, Run, Upload, Download", "Connect, Request, Update, Disconnect", "Code, Review, Upload, Deploy"],
        explanation: "CRUD representa las cuatro operaciones básicas en bases de datos: Crear, Leer, Actualizar y Eliminar."
      },
      {
        question_text: "¿Qué hace la cláusula WHERE?",
        question_type: "multiple_choice",
        correct_answer: "Filtra registros según una condición",
        options: ["Ordena los resultados", "Filtra registros según una condición", "Agrupa datos", "Limita la cantidad de resultados"],
        explanation: "WHERE permite filtrar registros que cumplan con una condición específica."
      }
    ]
  },
  {
    title: "Git y Control de Versiones",
    difficulty: "easy",
    category_name: "Programación",
    tags: ["git", "github", "versionado", "desarrollo"],
    source: "Comunidad Text2Quiz",
    summary: "Domina Git, la herramienta esencial de control de versiones: init, commit, push, clone y branches. Aprende a colaborar eficientemente en proyectos de desarrollo de software.",
    questions: [
      {
        question_text: "¿Qué comando crea un nuevo repositorio Git?",
        question_type: "multiple_choice",
        correct_answer: "git init",
        options: ["git start", "git init", "git create", "git new"],
        explanation: "'git init' inicializa un nuevo repositorio Git en el directorio actual."
      },
      {
        question_text: "¿Qué hace 'git commit'?",
        question_type: "multiple_choice",
        correct_answer: "Guarda los cambios en el repositorio local",
        options: ["Sube cambios al servidor", "Guarda los cambios en el repositorio local", "Descarga cambios", "Crea una rama"],
        explanation: "'git commit' guarda los cambios preparados (staged) en el historial del repositorio local."
      },
      {
        question_text: "¿Qué comando sube cambios al repositorio remoto?",
        question_type: "multiple_choice",
        correct_answer: "git push",
        options: ["git upload", "git push", "git send", "git commit"],
        explanation: "'git push' envía los commits locales al repositorio remoto."
      },
      {
        question_text: "¿Qué hace 'git clone'?",
        question_type: "multiple_choice",
        correct_answer: "Copia un repositorio remoto",
        options: ["Duplica un archivo", "Copia un repositorio remoto", "Crea una rama", "Deshace cambios"],
        explanation: "'git clone' descarga una copia completa de un repositorio remoto."
      },
      {
        question_text: "¿Qué es una 'branch' en Git?",
        question_type: "multiple_choice",
        correct_answer: "Una línea independiente de desarrollo",
        options: ["Un error en el código", "Una línea independiente de desarrollo", "Un servidor de Git", "Un tipo de commit"],
        explanation: "Una branch (rama) permite desarrollar características de forma aislada del código principal."
      }
    ]
  },
  {
    title: "Arte: Pintores Famosos",
    difficulty: "easy",
    category_name: "Arte",
    tags: ["arte", "pintura", "artistas", "cultura"],
    source: "Comunidad Text2Quiz",
    summary: "Conoce a los pintores más influyentes de la historia: da Vinci, Van Gogh, Picasso, Monet y Dalí. Aprende sobre sus obras maestras y los movimientos artísticos que revolucionaron.",
    questions: [
      {
        question_text: "¿Quién pintó 'La Mona Lisa'?",
        question_type: "multiple_choice",
        correct_answer: "Leonardo da Vinci",
        options: ["Michelangelo", "Leonardo da Vinci", "Rafael", "Donatello"],
        explanation: "Leonardo da Vinci pintó la Mona Lisa entre 1503 y 1519."
      },
      {
        question_text: "¿Qué artista es famoso por cortar su oreja?",
        question_type: "multiple_choice",
        correct_answer: "Vincent van Gogh",
        options: ["Pablo Picasso", "Vincent van Gogh", "Salvador Dalí", "Claude Monet"],
        explanation: "Vincent van Gogh se cortó parte de su oreja izquierda en 1888 durante una crisis mental."
      },
      {
        question_text: "¿Quién pintó 'El Guernica'?",
        question_type: "multiple_choice",
        correct_answer: "Pablo Picasso",
        options: ["Pablo Picasso", "Joan Miró", "Salvador Dalí", "Francisco Goya"],
        explanation: "Pablo Picasso pintó el Guernica en 1937 como protesta contra el bombardeo de Guernica."
      },
      {
        question_text: "¿Qué movimiento artístico fundó Claude Monet?",
        question_type: "multiple_choice",
        correct_answer: "Impresionismo",
        options: ["Cubismo", "Surrealismo", "Impresionismo", "Expresionismo"],
        explanation: "Claude Monet fue uno de los fundadores del Impresionismo francés."
      },
      {
        question_text: "¿Quién pintó 'La persistencia de la memoria' con relojes derretidos?",
        question_type: "multiple_choice",
        correct_answer: "Salvador Dalí",
        options: ["Pablo Picasso", "Salvador Dalí", "René Magritte", "Joan Miró"],
        explanation: "Salvador Dalí pintó esta icónica obra surrealista en 1931."
      }
    ]
  },
  {
    title: "Astronomía y Espacio",
    difficulty: "medium",
    category_name: "Ciencias",
    tags: ["astronomía", "espacio", "planetas", "universo"],
    source: "Comunidad Text2Quiz",
    summary: "Viaja por el sistema solar y más allá: planetas, estrellas, galaxias y el cosmos. Descubre los misterios del universo desde Júpiter hasta la Vía Láctea.",
    questions: [
      {
        question_text: "¿Cuál es el planeta más grande del sistema solar?",
        question_type: "multiple_choice",
        correct_answer: "Júpiter",
        options: ["Saturno", "Júpiter", "Urano", "Neptuno"],
        explanation: "Júpiter es el planeta más grande, con una masa mayor que la de todos los demás planetas combinados."
      },
      {
        question_text: "¿Cuántos planetas hay en nuestro sistema solar?",
        question_type: "multiple_choice",
        correct_answer: "8",
        options: ["7", "8", "9", "10"],
        explanation: "Hay 8 planetas desde que Plutón fue reclasificado como planeta enano en 2006."
      },
      {
        question_text: "¿Qué es una estrella?",
        question_type: "multiple_choice",
        correct_answer: "Una esfera de plasma que produce luz y calor",
        options: ["Un planeta sin atmósfera", "Una esfera de plasma que produce luz y calor", "Un asteroide brillante", "Un cometa"],
        explanation: "Las estrellas son esferas de plasma que generan energía mediante fusión nuclear."
      },
      {
        question_text: "¿Cuál es la estrella más cercana a la Tierra?",
        question_type: "multiple_choice",
        correct_answer: "El Sol",
        options: ["Alpha Centauri", "Sirius", "El Sol", "Betelgeuse"],
        explanation: "El Sol es nuestra estrella más cercana, a unos 150 millones de kilómetros."
      },
      {
        question_text: "¿Qué es la Vía Láctea?",
        question_type: "multiple_choice",
        correct_answer: "Nuestra galaxia",
        options: ["Un planeta", "Una nebulosa", "Nuestra galaxia", "Un agujero negro"],
        explanation: "La Vía Láctea es la galaxia espiral que contiene nuestro sistema solar."
      }
    ]
  },
  {
    title: "Música: Teoría Básica",
    difficulty: "easy",
    category_name: "Música",
    tags: ["música", "teoría musical", "notas", "arte"],
    source: "Comunidad Text2Quiz",
    summary: "Aprende los fundamentos de la teoría musical: escalas, acordes, instrumentos, notación dinámica y afinación. Perfecto para principiantes que quieren entender la música.",
    questions: [
      {
        question_text: "¿Cuántas notas tiene la escala musical?",
        question_type: "multiple_choice",
        correct_answer: "7",
        options: ["5", "7", "8", "12"],
        explanation: "La escala musical tiene 7 notas: Do, Re, Mi, Fa, Sol, La, Si."
      },
      {
        question_text: "¿Qué es un acorde?",
        question_type: "multiple_choice",
        correct_answer: "Tres o más notas tocadas simultáneamente",
        options: ["Una sola nota", "Dos notas", "Tres o más notas tocadas simultáneamente", "Una secuencia de notas"],
        explanation: "Un acorde es la combinación de tres o más notas diferentes tocadas al mismo tiempo."
      },
      {
        question_text: "¿Qué instrumento tiene 88 teclas?",
        question_type: "multiple_choice",
        correct_answer: "Piano",
        options: ["Órgano", "Piano", "Sintetizador", "Acordeón"],
        explanation: "El piano estándar tiene 88 teclas: 52 blancas y 36 negras."
      },
      {
        question_text: "¿Qué significa 'forte' en música?",
        question_type: "multiple_choice",
        correct_answer: "Tocar fuerte o alto",
        options: ["Tocar rápido", "Tocar fuerte o alto", "Tocar suave", "Tocar lento"],
        explanation: "'Forte' indica que se debe tocar con intensidad fuerte o volumen alto."
      },
      {
        question_text: "¿Cuántas cuerdas tiene una guitarra estándar?",
        question_type: "multiple_choice",
        correct_answer: "6",
        options: ["4", "5", "6", "7"],
        explanation: "Una guitarra estándar tiene 6 cuerdas, afinadas (de grave a agudo): Mi, La, Re, Sol, Si, Mi."
      }
    ]
  },
  {
    title: "Economía Básica",
    difficulty: "medium",
    category_name: "Economía",
    tags: ["economía", "finanzas", "conceptos", "negocios"],
    source: "Comunidad Text2Quiz",
    summary: "Entiende conceptos económicos fundamentales: inflación, PIB, oferta y demanda, desempleo y monopolios. Conocimiento esencial para entender cómo funciona la economía mundial.",
    questions: [
      {
        question_text: "¿Qué es la inflación?",
        question_type: "multiple_choice",
        correct_answer: "El aumento generalizado de precios",
        options: ["La disminución de precios", "El aumento generalizado de precios", "El valor del dinero", "La tasa de interés"],
        explanation: "La inflación es el aumento sostenido y generalizado del nivel de precios en una economía."
      },
      {
        question_text: "¿Qué es el PIB?",
        question_type: "multiple_choice",
        correct_answer: "Producto Interno Bruto",
        options: ["Precio Interno Básico", "Producto Interno Bruto", "Precio Interno Bruto", "Producto Internacional Básico"],
        explanation: "El PIB es el valor total de todos los bienes y servicios producidos en un país durante un periodo."
      },
      {
        question_text: "¿Qué es la oferta y demanda?",
        question_type: "multiple_choice",
        correct_answer: "La relación entre cantidad disponible y deseada de un bien",
        options: ["Un tipo de impuesto", "La relación entre cantidad disponible y deseada de un bien", "Una tasa de interés", "Un indicador bursátil"],
        explanation: "La ley de oferta y demanda determina los precios según la cantidad disponible y la cantidad que los consumidores quieren."
      },
      {
        question_text: "¿Qué es el desempleo?",
        question_type: "multiple_choice",
        correct_answer: "Personas que buscan trabajo pero no lo encuentran",
        options: ["Personas que no quieren trabajar", "Personas que buscan trabajo pero no lo encuentran", "Personas jubiladas", "Personas que estudian"],
        explanation: "El desempleo mide el porcentaje de la población activa que busca empleo pero no lo consigue."
      },
      {
        question_text: "¿Qué es un monopolio?",
        question_type: "multiple_choice",
        correct_answer: "Cuando una empresa controla todo el mercado",
        options: ["Muchas empresas compitiendo", "Cuando una empresa controla todo el mercado", "Un tipo de impuesto", "Una forma de gobierno"],
        explanation: "Un monopolio existe cuando una sola empresa domina completamente un mercado sin competencia."
      }
    ]
  },
  {
    title: "Ciberseguridad Básica",
    difficulty: "medium",
    category_name: "Tecnología",
    tags: ["seguridad", "ciberseguridad", "tecnología", "hacking"],
    source: "Comunidad Text2Quiz",
    summary: "Protégete en el mundo digital: phishing, VPN, firewalls, autenticación de dos factores y ransomware. Aprende a mantener tus datos seguros en internet.",
    questions: [
      {
        question_text: "¿Qué es phishing?",
        question_type: "multiple_choice",
        correct_answer: "Engañar a usuarios para obtener información confidencial",
        options: ["Un tipo de virus", "Engañar a usuarios para obtener información confidencial", "Una técnica de encriptación", "Un firewall"],
        explanation: "Phishing es una técnica donde atacantes se hacen pasar por entidades legítimas para robar datos."
      },
      {
        question_text: "¿Qué es una VPN?",
        question_type: "multiple_choice",
        correct_answer: "Virtual Private Network - red privada virtual",
        options: ["Very Private Network", "Virtual Private Network - red privada virtual", "Virus Protection Network", "Virtual Public Network"],
        explanation: "Una VPN crea una conexión segura y encriptada sobre una red menos segura como Internet."
      },
      {
        question_text: "¿Qué hace un firewall?",
        question_type: "multiple_choice",
        correct_answer: "Controla el tráfico de red entrante y saliente",
        options: ["Elimina virus", "Controla el tráfico de red entrante y saliente", "Encripta archivos", "Hace copias de seguridad"],
        explanation: "Un firewall monitorea y controla el tráfico de red según reglas de seguridad predeterminadas."
      },
      {
        question_text: "¿Qué es la autenticación de dos factores (2FA)?",
        question_type: "multiple_choice",
        correct_answer: "Usar dos métodos para verificar la identidad",
        options: ["Tener dos contraseñas", "Usar dos métodos para verificar la identidad", "Iniciar sesión dos veces", "Usar dos navegadores"],
        explanation: "2FA añade una capa extra de seguridad requiriendo dos formas diferentes de verificación."
      },
      {
        question_text: "¿Qué es ransomware?",
        question_type: "multiple_choice",
        correct_answer: "Malware que encripta archivos y pide rescate",
        options: ["Un programa de seguridad", "Malware que encripta archivos y pide rescate", "Un tipo de firewall", "Una técnica de encriptación"],
        explanation: "Ransomware bloquea el acceso a archivos o sistemas hasta que se pague un rescate."
      }
    ]
  },
  {
    title: "React.js Fundamentals",
    difficulty: "hard",
    category_name: "Programación",
    tags: ["react", "javascript", "frontend", "web"],
    source: "Comunidad Text2Quiz",
    summary: "Domina React, la librería más popular para crear interfaces: JSX, hooks (useState, useEffect), Virtual DOM y componentes. Esencial para desarrolladores frontend modernos.",
    questions: [
      {
        question_text: "¿Qué es JSX en React?",
        question_type: "multiple_choice",
        correct_answer: "Una extensión de sintaxis que permite escribir HTML en JavaScript",
        options: ["Un framework", "Una extensión de sintaxis que permite escribir HTML en JavaScript", "Una librería CSS", "Un compilador"],
        explanation: "JSX es una extensión de sintaxis que permite escribir código similar a HTML dentro de JavaScript."
      },
      {
        question_text: "¿Qué son los hooks en React?",
        question_type: "multiple_choice",
        correct_answer: "Funciones que permiten usar estado y lifecycle en componentes funcionales",
        options: ["Componentes especiales", "Funciones que permiten usar estado y lifecycle en componentes funcionales", "Eventos del DOM", "Librerías externas"],
        explanation: "Los hooks permiten usar características de React como estado y efectos en componentes funcionales."
      },
      {
        question_text: "¿Para qué se usa useEffect?",
        question_type: "multiple_choice",
        correct_answer: "Para manejar efectos secundarios en componentes",
        options: ["Para crear estado", "Para manejar efectos secundarios en componentes", "Para hacer routing", "Para estilizar componentes"],
        explanation: "useEffect permite ejecutar código después del renderizado, como llamadas a APIs o suscripciones."
      },
      {
        question_text: "¿Qué es el Virtual DOM?",
        question_type: "multiple_choice",
        correct_answer: "Una representación en memoria del DOM real",
        options: ["Un servidor virtual", "Una representación en memoria del DOM real", "Un tipo de componente", "Una librería de routing"],
        explanation: "El Virtual DOM es una copia ligera del DOM real que React usa para optimizar actualizaciones."
      },
      {
        question_text: "¿Qué hace useState?",
        question_type: "multiple_choice",
        correct_answer: "Crea y gestiona estado local en un componente",
        options: ["Hace peticiones HTTP", "Crea y gestiona estado local en un componente", "Navega entre rutas", "Valida formularios"],
        explanation: "useState es un hook que permite añadir estado local a componentes funcionales."
      }
    ]
  },
  {
    title: "Deportes: Fútbol Mundial",
    difficulty: "easy",
    category_name: "Deportes",
    tags: ["fútbol", "deportes", "copas del mundo", "cultura"],
    source: "Comunidad Text2Quiz",
    summary: "Demuestra tu conocimiento sobre el deporte rey: Copas del Mundo, leyendas del fútbol, reglas del juego y récords históricos. Perfecto para fanáticos del balompié.",
    questions: [
      {
        question_text: "¿Qué país ha ganado más Copas del Mundo de fútbol?",
        question_type: "multiple_choice",
        correct_answer: "Brasil",
        options: ["Argentina", "Brasil", "Alemania", "Italia"],
        explanation: "Brasil ha ganado 5 Copas del Mundo (1958, 1962, 1970, 1994, 2002)."
      },
      {
        question_text: "¿Cuántos jugadores hay en un equipo de fútbol en el campo?",
        question_type: "multiple_choice",
        correct_answer: "11",
        options: ["10", "11", "12", "9"],
        explanation: "Cada equipo tiene 11 jugadores en el campo, incluyendo al portero."
      },
      {
        question_text: "¿Quién es considerado uno de los mejores futbolistas de todos los tiempos?",
        question_type: "multiple_choice",
        correct_answer: "Pelé",
        options: ["Maradona", "Pelé", "Messi", "Todos los anteriores"],
        explanation: "Pelé, Maradona y Messi son considerados entre los mejores de la historia."
      },
      {
        question_text: "¿Cada cuántos años se celebra la Copa del Mundo?",
        question_type: "multiple_choice",
        correct_answer: "4 años",
        options: ["2 años", "3 años", "4 años", "5 años"],
        explanation: "La Copa del Mundo de la FIFA se celebra cada 4 años."
      },
      {
        question_text: "¿Qué color de tarjeta expulsa a un jugador del partido?",
        question_type: "multiple_choice",
        correct_answer: "Roja",
        options: ["Amarilla", "Roja", "Verde", "Azul"],
        explanation: "Una tarjeta roja significa expulsión inmediata del jugador."
      }
    ]
  },
  {
    title: "Mitología Griega",
    difficulty: "medium",
    category_name: "Historia",
    tags: ["mitología", "grecia", "dioses", "cultura"],
    source: "Comunidad Text2Quiz",
    summary: "Adéntrate en el fascinante mundo de la mitología griega: dioses del Olimpo, héroes legendarios como Hércules y Perseo, y las historias que inspiraron la cultura occidental.",
    questions: [
      {
        question_text: "¿Quién era el dios principal del Olimpo?",
        question_type: "multiple_choice",
        correct_answer: "Zeus",
        options: ["Poseidón", "Zeus", "Hades", "Apolo"],
        explanation: "Zeus era el rey de los dioses olímpicos y dios del cielo y el trueno."
      },
      {
        question_text: "¿Quién era la diosa de la sabiduría?",
        question_type: "multiple_choice",
        correct_answer: "Atenea",
        options: ["Afrodita", "Hera", "Atenea", "Artemisa"],
        explanation: "Atenea era la diosa de la sabiduría, la guerra estratégica y las artes."
      },
      {
        question_text: "¿Qué héroe mató a la Medusa?",
        question_type: "multiple_choice",
        correct_answer: "Perseo",
        options: ["Aquiles", "Perseo", "Hércules", "Teseo"],
        explanation: "Perseo decapitó a Medusa usando un escudo reflectante como espejo."
      },
      {
        question_text: "¿Cuántos trabajos tuvo que completar Hércules?",
        question_type: "multiple_choice",
        correct_answer: "12",
        options: ["7", "10", "12", "15"],
        explanation: "Hércules completó 12 trabajos como penitencia por matar a su familia."
      },
      {
        question_text: "¿Quién era el dios del mar?",
        question_type: "multiple_choice",
        correct_answer: "Poseidón",
        options: ["Zeus", "Poseidón", "Hades", "Ares"],
        explanation: "Poseidón era el dios del mar, los terremotos y los caballos."
      }
    ]
  },
  {
    title: "Cine: Películas Clásicas",
    difficulty: "easy",
    category_name: "Cine",
    tags: ["cine", "películas", "directores", "cultura"],
    source: "Comunidad Text2Quiz",
    summary: "Celebra el séptimo arte: películas icónicas, directores legendarios, actores inolvidables y premios Oscar. Desde Titanic hasta El Padrino, demuestra tu cultura cinematográfica.",
    questions: [
      {
        question_text: "¿Quién dirigió 'Titanic'?",
        question_type: "multiple_choice",
        correct_answer: "James Cameron",
        options: ["Steven Spielberg", "James Cameron", "Martin Scorsese", "Christopher Nolan"],
        explanation: "James Cameron dirigió Titanic en 1997, ganando 11 premios Oscar."
      },
      {
        question_text: "¿En qué año se estrenó la primera película de Star Wars?",
        question_type: "multiple_choice",
        correct_answer: "1977",
        options: ["1975", "1977", "1980", "1983"],
        explanation: "'Star Wars: Una nueva esperanza' se estrenó el 25 de mayo de 1977."
      },
      {
        question_text: "¿Quién interpreta a Jack Sparrow en 'Piratas del Caribe'?",
        question_type: "multiple_choice",
        correct_answer: "Johnny Depp",
        options: ["Orlando Bloom", "Johnny Depp", "Brad Pitt", "Tom Cruise"],
        explanation: "Johnny Depp creó el icónico personaje del Capitán Jack Sparrow."
      },
      {
        question_text: "¿Qué película ganó el Oscar a Mejor Película en 1994?",
        question_type: "multiple_choice",
        correct_answer: "Forrest Gump",
        options: ["Pulp Fiction", "Forrest Gump", "The Shawshank Redemption", "The Lion King"],
        explanation: "Forrest Gump ganó 6 Oscars en 1995, incluyendo Mejor Película."
      },
      {
        question_text: "¿Quién dirigió 'El Padrino'?",
        question_type: "multiple_choice",
        correct_answer: "Francis Ford Coppola",
        options: ["Martin Scorsese", "Francis Ford Coppola", "Quentin Tarantino", "Brian De Palma"],
        explanation: "Francis Ford Coppola dirigió la trilogía de El Padrino (1972, 1974, 1990)."
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
        'Cine': '🎬'
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
