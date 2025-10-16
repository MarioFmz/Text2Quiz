import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000'

const quizzes = [
  {
    title: 'Matemáticas Básicas - Álgebra',
    difficulty: 'easy',
    category_slug: 'matematicas',
    combined_content: `
ÁLGEBRA BÁSICA

Introducción al Álgebra
El álgebra es una rama de las matemáticas que utiliza símbolos y letras para representar números y cantidades en fórmulas y ecuaciones. Es fundamental para resolver problemas matemáticos complejos.

Variables y Constantes
• Variable: Un símbolo (generalmente una letra) que representa un valor desconocido o que puede cambiar. Ejemplo: x, y, z
• Constante: Un valor fijo que no cambia. Ejemplo: 2, 5, π

Ecuaciones Lineales
Una ecuación lineal es una ecuación de primer grado que se puede escribir en la forma ax + b = c.

Pasos para resolver ecuaciones lineales:
1. Simplificar ambos lados de la ecuación
2. Aislar la variable en un lado
3. Despejar la variable dividiendo o multiplicando

Ejemplo: 2x + 4 = 10
Paso 1: Restar 4 de ambos lados → 2x = 6
Paso 2: Dividir entre 2 → x = 3

Propiedades Algebraicas
• Propiedad conmutativa: a + b = b + a
• Propiedad asociativa: (a + b) + c = a + (b + c)
• Propiedad distributiva: a(b + c) = ab + ac

Expresiones Algebraicas
Son combinaciones de números, variables y operaciones matemáticas.
Ejemplo: 3x² + 2x - 5

Términos semejantes: Términos que tienen las mismas variables con los mismos exponentes.
Ejemplo: 3x y 5x son términos semejantes, pero 3x y 3x² no lo son.
    `,
    formatted_content: `
ÁLGEBRA BÁSICA

Introducción al Álgebra
El álgebra es una rama de las matemáticas que utiliza símbolos y letras para representar números y cantidades en fórmulas y ecuaciones.

Variables y Constantes
• Variable: símbolo que representa un valor desconocido (x, y, z)
• Constante: valor fijo que no cambia (2, 5, π)

Ecuaciones Lineales
Forma general: ax + b = c

Pasos para resolver:
1. Simplificar ambos lados
2. Aislar la variable
3. Despejar la variable

Propiedades Algebraicas Importantes
• Conmutativa: a + b = b + a
• Asociativa: (a + b) + c = a + (b + c)
• Distributiva: a(b + c) = ab + ac
    `,
    summary: '• El álgebra usa símbolos para representar valores\n• Las ecuaciones lineales se resuelven aislando la variable\n• Las propiedades algebraicas son fundamentales para simplificar expresiones',
    questions: [
      {
        question_text: '¿Qué es una variable en álgebra?',
        question_type: 'multiple_choice',
        correct_answer: 'Un símbolo que representa un valor desconocido',
        options: ['Un número fijo', 'Un símbolo que representa un valor desconocido', 'Una operación matemática', 'Un resultado final'],
        explanation: 'Una variable es un símbolo (como x, y, z) que representa un valor desconocido o que puede cambiar.'
      },
      {
        question_text: 'Si 2x + 4 = 10, ¿cuál es el valor de x?',
        question_type: 'multiple_choice',
        correct_answer: '3',
        options: ['2', '3', '4', '5'],
        explanation: 'Restando 4 de ambos lados: 2x = 6. Dividiendo entre 2: x = 3'
      },
      {
        question_text: '¿Qué propiedad algebraica establece que a + b = b + a?',
        question_type: 'multiple_choice',
        correct_answer: 'Propiedad conmutativa',
        options: ['Propiedad asociativa', 'Propiedad distributiva', 'Propiedad conmutativa', 'Propiedad reflexiva'],
        explanation: 'La propiedad conmutativa establece que el orden de los sumandos no altera el resultado.'
      }
    ]
  },
  {
    title: 'Introducción a Python - Conceptos Básicos',
    difficulty: 'medium',
    category_slug: 'programacion',
    combined_content: `
PYTHON - PROGRAMACIÓN BÁSICA

Introducción a Python
Python es un lenguaje de programación de alto nivel, interpretado y de propósito general. Fue creado por Guido van Rossum y lanzado por primera vez en 1991.

Características principales:
• Sintaxis simple y legible
• Tipado dinámico
• Multiplataforma
• Gran biblioteca estándar
• Amplia comunidad de desarrolladores

Variables y Tipos de Datos
En Python no es necesario declarar el tipo de variable explícitamente.

Tipos básicos:
• int: Números enteros (ejemplo: 42)
• float: Números decimales (ejemplo: 3.14)
• str: Cadenas de texto (ejemplo: "Hola Mundo")
• bool: Valores booleanos (True o False)

Estructuras de Control
Condicionales (if/elif/else):
if edad >= 18:
    print("Eres mayor de edad")
elif edad >= 13:
    print("Eres adolescente")
else:
    print("Eres menor de edad")

Bucles:
• for: Itera sobre una secuencia
• while: Repite mientras una condición sea verdadera

Funciones
Las funciones se definen con la palabra clave 'def':

def saludar(nombre):
    return f"Hola, {nombre}!"

Listas y Diccionarios
• Lista: Colección ordenada y mutable
  mi_lista = [1, 2, 3, 4, 5]

• Diccionario: Colección de pares clave-valor
  mi_dict = {"nombre": "Juan", "edad": 25}

Indentación
Python usa la indentación (espacios o tabulaciones) para definir bloques de código, no llaves como otros lenguajes.
    `,
    formatted_content: `
PYTHON - PROGRAMACIÓN BÁSICA

¿Qué es Python?
Lenguaje de programación de alto nivel, interpretado y de propósito general creado por Guido van Rossum en 1991.

Características Clave
• Sintaxis simple y legible
• Tipado dinámico
• Gran biblioteca estándar
• Amplia comunidad

Tipos de Datos Básicos
• int: enteros (42)
• float: decimales (3.14)
• str: texto ("Hola")
• bool: booleanos (True/False)

Estructuras de Control
Condicionales, bucles for/while

Funciones
Se definen con 'def' y pueden retornar valores

Listas y Diccionarios
Estructuras de datos fundamentales para organizar información
    `,
    summary: '• Python es un lenguaje interpretado y de sintaxis simple\n• Usa tipado dinámico y no requiere declaración de tipos\n• La indentación define bloques de código\n• Tiene estructuras de datos versátiles como listas y diccionarios',
    questions: [
      {
        question_text: '¿Qué tipo de lenguaje de programación es Python?',
        question_type: 'multiple_choice',
        correct_answer: 'Interpretado y de alto nivel',
        options: ['Compilado y de bajo nivel', 'Interpretado y de alto nivel', 'Solo compilado', 'Ensamblador'],
        explanation: 'Python es un lenguaje interpretado (no necesita compilación previa) y de alto nivel (abstrae detalles del hardware).'
      },
      {
        question_text: 'En Python, ¿es necesario declarar el tipo de una variable explícitamente?',
        question_type: 'true_false',
        correct_answer: 'Falso',
        options: ['Verdadero', 'Falso'],
        explanation: 'Python usa tipado dinámico, lo que significa que el tipo se infiere automáticamente al asignar un valor.'
      },
      {
        question_text: '¿Qué define los bloques de código en Python?',
        question_type: 'multiple_choice',
        correct_answer: 'La indentación',
        options: ['Llaves { }', 'La indentación', 'Punto y coma ;', 'Paréntesis ( )'],
        explanation: 'Python usa la indentación (espacios o tabulaciones) para definir bloques de código, a diferencia de otros lenguajes que usan llaves.'
      }
    ]
  },
  {
    title: 'Historia del Cine - Época Dorada de Hollywood',
    difficulty: 'medium',
    category_slug: 'cine',
    combined_content: `
LA ÉPOCA DORADA DE HOLLYWOOD

Introducción
La Época Dorada de Hollywood (1930-1960) fue un período de gran creatividad y éxito comercial en la industria cinematográfica estadounidense.

Contexto Histórico
Durante esta época, cinco grandes estudios dominaban la industria:
• MGM (Metro-Goldwyn-Mayer)
• Paramount Pictures
• Warner Bros.
• 20th Century Fox
• RKO Pictures

El Sistema de Estudios
Los estudios controlaban todos los aspectos de la producción cinematográfica:
• Tenían actores bajo contrato exclusivo
• Controlaban la distribución
• Poseían cadenas de cines

Géneros Populares
• Musicales: Con estrellas como Fred Astaire y Ginger Rogers
• Film Noir: Películas de crimen y suspenso
• Western: Películas del Oeste americano
• Comedias románticas: Con Katherine Hepburn y Cary Grant

Grandes Directores
• Alfred Hitchcock: Maestro del suspenso
• John Ford: Especialista en westerns
• Billy Wilder: Experto en comedias y dramas
• Frank Capra: Películas optimistas sobre el sueño americano

Estrellas Icónicas
Hombres: Humphrey Bogart, Cary Grant, James Stewart, Clark Gable
Mujeres: Bette Davis, Katherine Hepburn, Ingrid Bergman, Marilyn Monroe

Código Hays
Un conjunto de directrices morales que regían el contenido de las películas (1934-1968). Prohibía escenas explícitas de violencia, sexo y lenguaje ofensivo.

Innovaciones Técnicas
• Technicolor: Color vibrante en películas
• Cinemascope: Pantalla panorámica
• Mejoras en el sonido

Películas Emblemáticas
• "Lo que el viento se llevó" (1939)
• "Casablanca" (1942)
• "Cantando bajo la lluvia" (1952)
• "Ben-Hur" (1959)

Declive
La época comenzó a declinar en los años 60 debido a:
• Decisión antimonopolio que obligó a los estudios a vender sus cines
• Aparición de la televisión
• Cambios en los gustos del público
    `,
    formatted_content: `
LA ÉPOCA DORADA DE HOLLYWOOD (1930-1960)

Período de gran creatividad y éxito en el cine estadounidense

Los Cinco Grandes Estudios
• MGM, Paramount, Warner Bros, 20th Century Fox, RKO

Sistema de Estudios
Control total de producción, distribución y exhibición. Actores bajo contrato exclusivo.

Géneros Destacados
• Musicales (Astaire & Rogers)
• Film Noir
• Western
• Comedias románticas

Directores Legendarios
• Alfred Hitchcock (suspenso)
• John Ford (westerns)
• Billy Wilder (comedia/drama)
• Frank Capra (optimismo americano)

Estrellas Icónicas
Bogart, Grant, Stewart, Davis, Hepburn, Bergman, Monroe

Código Hays (1934-1968)
Directrices morales estrictas para el contenido cinematográfico

Innovaciones Técnicas
Technicolor, Cinemascope, mejoras en sonido
    `,
    summary: '• La Época Dorada de Hollywood duró de 1930 a 1960\n• Cinco grandes estudios dominaban la industria con control total\n• El Código Hays regulaba el contenido moral de las películas\n• Surgieron géneros icónicos y grandes estrellas del cine',
    questions: [
      {
        question_text: '¿En qué décadas tuvo lugar la Época Dorada de Hollywood?',
        question_type: 'multiple_choice',
        correct_answer: '1930-1960',
        options: ['1920-1950', '1930-1960', '1940-1970', '1950-1980'],
        explanation: 'La Época Dorada de Hollywood se extendió aproximadamente de 1930 a 1960.'
      },
      {
        question_text: '¿Qué era el Código Hays?',
        question_type: 'multiple_choice',
        correct_answer: 'Un conjunto de directrices morales para películas',
        options: ['Un sistema de clasificación de edad', 'Un conjunto de directrices morales para películas', 'Un método de producción', 'Un tipo de cámara'],
        explanation: 'El Código Hays (1934-1968) era un conjunto de directrices morales que regulaban el contenido de las películas.'
      },
      {
        question_text: '¿Alfred Hitchcock era conocido como el maestro del suspenso?',
        question_type: 'true_false',
        correct_answer: 'Verdadero',
        options: ['Verdadero', 'Falso'],
        explanation: 'Alfred Hitchcock es reconocido mundialmente como el maestro del suspenso cinematográfico.'
      }
    ]
  },
  {
    title: 'Geografía Mundial - Continentes y Océanos',
    difficulty: 'easy',
    category_slug: 'geografia',
    combined_content: `
GEOGRAFÍA MUNDIAL - CONTINENTES Y OCÉANOS

Los Continentes
La Tierra está dividida en 7 continentes:

1. Asia
• El continente más grande (44.5 millones km²)
• Población: ~4.6 mil millones de habitantes
• Países destacados: China, India, Japón, Rusia (parcialmente)

2. África
• Segundo continente más grande (30.3 millones km²)
• Cuna de la humanidad
• 54 países reconocidos
• Hogar del Sahara, el desierto más grande del mundo

3. América del Norte
• Incluye Canadá, Estados Unidos y México
• Superficie: 24.7 millones km²
• Hogar de las Montañas Rocosas y los Grandes Lagos

4. América del Sur
• Superficie: 17.8 millones km²
• Amazonas: el río más caudaloso del mundo
• Cordillera de los Andes: la cadena montañosa más larga

5. Europa
• Superficie: 10.2 millones km²
• 50 países aproximadamente
• Alta densidad de población
• Cuna de la civilización occidental

6. Oceanía
• El continente más pequeño (9 millones km²)
• Incluye Australia, Nueva Zelanda y miles de islas del Pacífico
• Gran Barrera de Coral

7. Antártida
• Continente más frío y seco
• Cubierto casi completamente de hielo
• Sin población permanente, solo estaciones de investigación

Los Océanos
La Tierra tiene 5 océanos principales:

1. Océano Pacífico
• El más grande (165 millones km²)
• Cubre aproximadamente el 46% de la superficie oceánica
• Punto más profundo: Fosa de las Marianas (11,034 metros)

2. Océano Atlántico
• Segundo más grande (106 millones km²)
• Separa América de Europa y África
• Importante para el comercio internacional

3. Océano Índico
• Tercer océano más grande (70 millones km²)
• Ubicado principalmente en el hemisferio sur
• Agua más cálida que otros océanos

4. Océano Ártico
• El más pequeño (14 millones km²)
• Ubicado en el Polo Norte
• Cubierto de hielo gran parte del año

5. Océano Antártico (Austral)
• Rodea la Antártida
• Superficie: 20 millones km²
• Aguas muy frías y ricas en nutrientes

Datos Interesantes
• El 71% de la Tierra está cubierta de agua
• Solo el 29% es tierra firme
• El punto más alto: Monte Everest (8,849 m)
• El punto más bajo en tierra: Mar Muerto (-430 m)
    `,
    formatted_content: `
GEOGRAFÍA MUNDIAL - CONTINENTES Y OCÉANOS

Los 7 Continentes

1. Asia - El más grande (44.5M km²)
   ~4.6 mil millones de habitantes

2. África - Segundo más grande (30.3M km²)
   Cuna de la humanidad, 54 países

3. América del Norte (24.7M km²)
   Canadá, Estados Unidos, México

4. América del Sur (17.8M km²)
   Río Amazonas, Cordillera de los Andes

5. Europa (10.2M km²)
   ~50 países, alta densidad poblacional

6. Oceanía (9M km²)
   Australia, Nueva Zelanda, islas del Pacífico

7. Antártida
   Más frío, cubierto de hielo

Los 5 Océanos

1. Pacífico - El más grande (165M km²)
2. Atlántico - Segundo (106M km²)
3. Índico - Tercero (70M km²)
4. Ártico - El más pequeño (14M km²)
5. Antártico/Austral (20M km²)

Datos Clave
• 71% agua, 29% tierra
• Monte Everest: punto más alto (8,849m)
    `,
    summary: '• La Tierra tiene 7 continentes, siendo Asia el más grande\n• Hay 5 océanos, siendo el Pacífico el más extenso\n• El 71% del planeta está cubierto de agua\n• África es conocida como la cuna de la humanidad',
    questions: [
      {
        question_text: '¿Cuál es el continente más grande del mundo?',
        question_type: 'multiple_choice',
        correct_answer: 'Asia',
        options: ['África', 'América', 'Asia', 'Europa'],
        explanation: 'Asia es el continente más grande con 44.5 millones de km² y aproximadamente 4.6 mil millones de habitantes.'
      },
      {
        question_text: '¿Cuántos océanos principales hay en la Tierra?',
        question_type: 'multiple_choice',
        correct_answer: '5',
        options: ['3', '4', '5', '6'],
        explanation: 'Hay 5 océanos principales: Pacífico, Atlántico, Índico, Ártico y Antártico.'
      },
      {
        question_text: '¿El 71% de la superficie terrestre está cubierta de agua?',
        question_type: 'true_false',
        correct_answer: 'Verdadero',
        options: ['Verdadero', 'Falso'],
        explanation: 'Aproximadamente el 71% de la superficie de la Tierra está cubierta de agua, mientras que solo el 29% es tierra firme.'
      }
    ]
  },
  {
    title: 'Sistema Solar - Planetas y Astronomía',
    difficulty: 'medium',
    category_slug: 'ciencias',
    combined_content: `
EL SISTEMA SOLAR

Introducción
El Sistema Solar es el sistema planetario que incluye al Sol y todos los objetos que orbitan a su alrededor debido a la gravedad.

El Sol
• Estrella de tipo G (enana amarilla)
• Contiene el 99.86% de la masa del sistema solar
• Temperatura superficial: ~5,500°C
• Núcleo: ~15 millones °C
• Fuente de energía: fusión nuclear de hidrógeno

Los Planetas Interiores (Rocosos)

1. Mercurio
• El más cercano al Sol (57.9 millones km)
• El más pequeño (4,879 km diámetro)
• Sin atmósfera significativa
• Temperatura: -173°C a 427°C

2. Venus
• Similar en tamaño a la Tierra
• Atmósfera densa de CO2
• Efecto invernadero extremo
• Planeta más caliente del sistema (462°C)
• Rotación retrógrada

3. Tierra
• Único planeta con vida conocida
• 71% cubierto de agua
• Atmósfera rica en nitrógeno y oxígeno
• Un satélite natural: la Luna

4. Marte
• El "Planeta Rojo" (óxido de hierro)
• Atmósfera delgada de CO2
• Volcán más grande: Monte Olimpo (22 km altura)
• Dos lunas: Fobos y Deimos

Los Planetas Exteriores (Gigantes Gaseosos)

5. Júpiter
• El planeta más grande (139,820 km diámetro)
• Gran Mancha Roja: tormenta gigante
• Al menos 79 lunas conocidas
• Principalmente hidrógeno y helio

6. Saturno
• Famoso por sus anillos espectaculares
• Anillos compuestos de hielo y roca
• Densidad menor que el agua
• 82 lunas conocidas, Titán la más grande

7. Urano
• Gigante de hielo
• Eje de rotación inclinado 98° (rueda de lado)
• Color azul-verde por metano
• 27 lunas conocidas

8. Neptuno
• Planeta más lejano del Sol
• Vientos más rápidos del sistema solar (2,100 km/h)
• Gran Mancha Oscura
• 14 lunas conocidas, Tritón la más grande

Otros Objetos

Planetas Enanos
• Plutón (reclasificado en 2006)
• Eris, Makemake, Haumea, Ceres

Cinturón de Asteroides
• Entre Marte y Júpiter
• Millones de asteroides rocosos

Cinturón de Kuiper
• Más allá de Neptuno
• Objetos helados, incluye Plutón

Nube de Oort
• Límite extremo del sistema solar
• Fuente de cometas de largo período

Datos Interesantes
• El sistema solar tiene 4.6 mil millones de años
• La Tierra orbita el Sol a 107,000 km/h
• Un año en Neptuno equivale a 165 años terrestres
    `,
    formatted_content: `
EL SISTEMA SOLAR

El Sol
• Estrella tipo G, contiene 99.86% de la masa del sistema
• Temperatura superficial: 5,500°C
• Energía: fusión nuclear de hidrógeno

Planetas Interiores (Rocosos)
1. Mercurio - Más cercano y pequeño
2. Venus - Más caliente, efecto invernadero
3. Tierra - Único con vida conocida
4. Marte - Planeta rojo, Monte Olimpo

Planetas Exteriores (Gigantes)
5. Júpiter - Más grande, Gran Mancha Roja
6. Saturno - Anillos espectaculares
7. Urano - Gigante de hielo, rota de lado
8. Neptuno - Más lejano, vientos extremos

Otros Objetos
• Planetas enanos (Plutón, Eris, Ceres)
• Cinturón de Asteroides (Marte-Júpiter)
• Cinturón de Kuiper (más allá de Neptuno)
• Nube de Oort (límite del sistema)
    `,
    summary: '• El Sistema Solar tiene 8 planetas principales orbitando el Sol\n• Se divide en planetas rocosos internos y gigantes gaseosos externos\n• El Sol contiene el 99.86% de la masa del sistema\n• Plutón fue reclasificado como planeta enano en 2006',
    questions: [
      {
        question_text: '¿Cuál es el planeta más grande del Sistema Solar?',
        question_type: 'multiple_choice',
        correct_answer: 'Júpiter',
        options: ['Saturno', 'Júpiter', 'Neptuno', 'Urano'],
        explanation: 'Júpiter es el planeta más grande con un diámetro de 139,820 km y al menos 79 lunas conocidas.'
      },
      {
        question_text: '¿Qué planeta es conocido por sus espectaculares anillos?',
        question_type: 'multiple_choice',
        correct_answer: 'Saturno',
        options: ['Júpiter', 'Urano', 'Saturno', 'Neptuno'],
        explanation: 'Saturno es famoso por sus anillos espectaculares compuestos de hielo y roca.'
      },
      {
        question_text: '¿El Sol contiene aproximadamente el 99.86% de la masa del Sistema Solar?',
        question_type: 'true_false',
        correct_answer: 'Verdadero',
        options: ['Verdadero', 'Falso'],
        explanation: 'El Sol contiene el 99.86% de toda la masa del Sistema Solar, siendo el objeto dominante gravitacionalmente.'
      }
    ]
  },
  {
    title: 'Literatura Clásica - Obras Fundamentales',
    difficulty: 'hard',
    category_slug: 'literatura',
    combined_content: `
LITERATURA CLÁSICA UNIVERSAL

Introducción
La literatura clásica comprende las obras literarias de la antigua Grecia y Roma, así como las obras maestras que han perdurado a través de los siglos.

Literatura Griega Antigua

Homero (siglo VIII a.C.)
• La Ilíada: Narra la Guerra de Troya, enfocándose en la cólera de Aquiles
• La Odisea: Relata el viaje de Odiseo (Ulises) de regreso a Ítaca tras la guerra
• Considerado el padre de la literatura occidental
• Uso de la épica homérica y el hexámetro dactílico

Sófocles (496-406 a.C.)
• Dramaturgo de la antigua Atenas
• "Edipo Rey": Tragedia sobre el destino y la búsqueda de la verdad
• "Antígona": Conflicto entre la ley divina y humana
• Introdujo el tercer actor en el teatro griego

Literatura Romana

Virgilio (70-19 a.C.)
• "La Eneida": Epopeya que narra la fundación de Roma
• Conecta la mitología troyana con la historia romana
• Eneas como héroe fundador

Ovidio (43 a.C.-17 d.C.)
• "Las Metamorfosis": Colección de mitos sobre transformaciones
• Influencia masiva en el arte y literatura occidental
• Estilo narrativo elegante y descriptivo

Literatura del Renacimiento

William Shakespeare (1564-1616)
• El mayor dramaturgo de la lengua inglesa
• Tragedias: Hamlet, Macbeth, Otelo, El Rey Lear
• Comedias: Sueño de una noche de verano, La fierecilla domada
• Sonetos: 154 poemas líricos

Temas shakespearianos:
• Ambición y poder
• Amor y celos
• Traición y venganza
• Apariencia vs realidad

Miguel de Cervantes (1547-1616)
• "Don Quijote de la Mancha" (1605, 1615)
• Considerada la primera novela moderna
• Sátira de las novelas de caballería
• Dualidad Quijote (idealismo) vs Sancho (pragmatismo)

Literatura del Siglo XIX

Jane Austen (1775-1817)
• "Orgullo y Prejuicio": Crítica social y romance
• Ironía y observación aguda de la sociedad
• Personajes femeninos complejos

Fiódor Dostoyevski (1821-1881)
• "Crimen y Castigo": Exploración psicológica profunda
• Temas: culpa, redención, moralidad
• Realismo psicológico

León Tolstói (1828-1910)
• "Guerra y Paz": Épica sobre la invasión napoleónica de Rusia
• "Anna Karenina": Tragedia sobre el amor y la sociedad
• Realismo social y filosófico

Charles Dickens (1812-1870)
• "Oliver Twist", "Grandes Esperanzas"
• Crítica social de la Inglaterra victoriana
• Personajes memorables y tramas complejas

Literatura del Siglo XX

Gabriel García Márquez (1927-2014)
• "Cien años de soledad": Realismo mágico
• Familia Buendía en Macondo
• Premio Nobel de Literatura 1982

Franz Kafka (1883-1924)
• "La Metamorfosis": Gregor Samsa transformado en insecto
• Temas: alienación, burocracia, ansiedad existencial
• Estilo kafkiano: surreal y opresivo

Conceptos Literarios Importantes

Géneros:
• Épica: Narrativa heroica en verso
• Tragedia: Caída de un héroe por error trágico
• Comedia: Final feliz, situaciones humorísticas
• Novela: Narrativa extensa en prosa

Recursos literarios:
• Metáfora: Comparación implícita
• Símil: Comparación explícita (como, cual)
• Ironía: Contraste entre lo dicho y lo significado
• Alegoría: Historia con significado simbólico
    `,
    formatted_content: `
LITERATURA CLÁSICA UNIVERSAL

Literatura Griega
• Homero: La Ilíada, La Odisea
• Sófocles: Edipo Rey, Antígona

Literatura Romana
• Virgilio: La Eneida
• Ovidio: Las Metamorfosis

Renacimiento
• Shakespeare: Hamlet, Macbeth, Otelo
• Cervantes: Don Quijote (primera novela moderna)

Siglo XIX
• Jane Austen: Orgullo y Prejuicio
• Dostoyevski: Crimen y Castigo
• Tolstói: Guerra y Paz, Anna Karenina
• Dickens: Oliver Twist

Siglo XX
• García Márquez: Cien años de soledad (realismo mágico)
• Kafka: La Metamorfosis (alienación)

Géneros Literarios
• Épica, Tragedia, Comedia, Novela

Recursos Literarios
• Metáfora, Símil, Ironía, Alegoría
    `,
    summary: '• La literatura clásica abarca desde Grecia antigua hasta obras maestras modernas\n• Shakespeare y Cervantes son pilares del Renacimiento literario\n• El siglo XIX vio el auge del realismo con Tolstói y Dickens\n• El siglo XX introdujo el realismo mágico y el existencialismo',
    questions: [
      {
        question_text: '¿Quién escribió "Don Quijote de la Mancha"?',
        question_type: 'multiple_choice',
        correct_answer: 'Miguel de Cervantes',
        options: ['William Shakespeare', 'Miguel de Cervantes', 'Lope de Vega', 'Calderón de la Barca'],
        explanation: 'Miguel de Cervantes escribió "Don Quijote de la Mancha", considerada la primera novela moderna.'
      },
      {
        question_text: '¿Qué obra de Shakespeare trata sobre la ambición y el poder en Escocia?',
        question_type: 'multiple_choice',
        correct_answer: 'Macbeth',
        options: ['Hamlet', 'Otelo', 'Macbeth', 'El Rey Lear'],
        explanation: 'Macbeth es una tragedia de Shakespeare que explora temas de ambición, poder y culpa en la Escocia medieval.'
      },
      {
        question_text: '¿Gabriel García Márquez fue pionero del realismo mágico?',
        question_type: 'true_false',
        correct_answer: 'Verdadero',
        options: ['Verdadero', 'Falso'],
        explanation: 'Gabriel García Márquez fue un maestro del realismo mágico, especialmente en "Cien años de soledad".'
      }
    ]
  },
  {
    title: 'Biología Humana - El Cuerpo Humano',
    difficulty: 'medium',
    category_slug: 'ciencias',
    combined_content: `
BIOLOGÍA HUMANA - SISTEMAS DEL CUERPO

Introducción
El cuerpo humano es un sistema complejo formado por billones de células organizadas en tejidos, órganos y sistemas que trabajan coordinadamente.

Sistema Circulatorio
Función: Transportar nutrientes, oxígeno y hormonas; eliminar desechos

Componentes:
• Corazón: Bomba muscular de 4 cámaras (2 aurículas, 2 ventrículos)
• Arterias: Llevan sangre oxigenada del corazón al cuerpo
• Venas: Retornan sangre desoxigenada al corazón
• Capilares: Vasos microscópicos donde ocurre el intercambio

Circulación:
• Sistémica: Corazón → cuerpo → corazón
• Pulmonar: Corazón → pulmones → corazón

Sistema Respiratorio
Función: Intercambio gaseoso (O2 y CO2)

Estructuras principales:
• Nariz y boca: Entrada de aire
• Tráquea: Conducto reforzado con cartílago
• Bronquios y bronquiolos: Ramificaciones en los pulmones
• Alvéolos: Sacos aéreos donde ocurre el intercambio gaseoso
• Diafragma: Músculo principal de la respiración

Proceso respiratorio:
1. Inspiración: El diafragma se contrae, los pulmones se expanden
2. Intercambio: O2 pasa a la sangre, CO2 sale de la sangre
3. Espiración: El diafragma se relaja, los pulmones se contraen

Sistema Digestivo
Función: Descomponer alimentos, absorber nutrientes

Órganos principales:
• Boca: Digestión mecánica (masticación) y química (saliva)
• Esófago: Tubo que conecta boca con estómago
• Estómago: Digestión química con ácido clorhídrico
• Intestino delgado: Absorción principal de nutrientes (6-7 metros)
• Intestino grueso: Absorción de agua y formación de heces
• Hígado: Produce bilis, metaboliza nutrientes
• Páncreas: Produce enzimas digestivas e insulina

Sistema Nervioso
Función: Control y coordinación del cuerpo

División central:
• Cerebro: Centro de procesamiento
  - Cerebro: Pensamiento, memoria, emociones
  - Cerebelo: Coordinación y balance
  - Tronco encefálico: Funciones vitales automáticas
• Médula espinal: Transmite señales

División periférica:
• Nervios somáticos: Control voluntario
• Nervios autónomos: Control involuntario
  - Simpático: "Lucha o huida"
  - Parasimpático: "Descanso y digestión"

Sistema Endocrino
Función: Regulación hormonal

Glándulas principales:
• Hipófisis: "Glándula maestra", controla otras glándulas
• Tiroides: Metabolismo y crecimiento
• Paratiroides: Niveles de calcio
• Suprarrenales: Respuesta al estrés (adrenalina, cortisol)
• Páncreas: Glucosa en sangre (insulina, glucagón)
• Gónadas: Reproducción (testosterona, estrógeno)

Sistema Muscular
Tipos de músculos:
• Esquelético: Voluntario, movimiento del cuerpo
• Liso: Involuntario, órganos internos
• Cardíaco: Involuntario, solo en el corazón

Función: Movimiento, postura, producción de calor

Sistema Óseo (Esquelético)
Funciones:
• Soporte estructural
• Protección de órganos
• Producción de células sanguíneas (médula ósea)
• Almacenamiento de minerales (calcio, fósforo)

Divisiones:
• Esqueleto axial: Cráneo, columna, costillas (80 huesos)
• Esqueleto apendicular: Extremidades (126 huesos)
Total: 206 huesos en adultos

Tipos de articulaciones:
• Fijas: Sin movimiento (cráneo)
• Semimóviles: Movimiento limitado (columna)
• Móviles: Movimiento libre (rodilla, codo)

Sistema Inmunológico
Función: Defensa contra patógenos

Componentes:
• Glóbulos blancos (leucocitos): Células defensoras
• Anticuerpos: Proteínas que identifican invasores
• Órganos linfoides: Timo, bazo, ganglios linfáticos

Líneas de defensa:
1. Piel y mucosas: Barrera física
2. Respuesta inflamatoria: Respuesta inespecífica
3. Respuesta inmune: Específica contra patógenos

Homeostasis
Mantenimiento del equilibrio interno:
• Temperatura corporal: ~37°C
• pH sanguíneo: ~7.4
• Glucosa en sangre: 70-100 mg/dL
• Presión arterial: ~120/80 mmHg

Mecanismos:
• Retroalimentación negativa: Contrarresta cambios
• Retroalimentación positiva: Amplifica cambios (ej: parto)
    `,
    formatted_content: `
BIOLOGÍA HUMANA - SISTEMAS DEL CUERPO

Sistema Circulatorio
Corazón de 4 cámaras, arterias, venas, capilares
Transporta nutrientes, oxígeno y elimina desechos

Sistema Respiratorio
Intercambio gaseoso en alvéolos pulmonares
Tráquea → bronquios → alvéolos

Sistema Digestivo
6-7 metros de intestino delgado
Estómago, hígado, páncreas trabajan en conjunto

Sistema Nervioso
Cerebro, médula espinal, nervios periféricos
Controla funciones voluntarias e involuntarias

Sistema Endocrino
Glándulas producen hormonas
Hipófisis, tiroides, suprarrenales, páncreas

Sistema Muscular
Esquelético (voluntario)
Liso (involuntario)
Cardíaco (corazón)

Sistema Óseo
206 huesos en adultos
Soporte, protección, producción de células sanguíneas

Sistema Inmunológico
Glóbulos blancos, anticuerpos
Tres líneas de defensa

Homeostasis
Equilibrio interno: temperatura, pH, glucosa
    `,
    summary: '• El cuerpo humano tiene múltiples sistemas que trabajan coordinadamente\n• El sistema circulatorio transporta nutrientes y oxígeno\n• El sistema nervioso controla y coordina todas las funciones\n• La homeostasis mantiene el equilibrio interno del organismo',
    questions: [
      {
        question_text: '¿Cuántas cámaras tiene el corazón humano?',
        question_type: 'multiple_choice',
        correct_answer: '4',
        options: ['2', '3', '4', '5'],
        explanation: 'El corazón humano tiene 4 cámaras: 2 aurículas (superiores) y 2 ventrículos (inferiores).'
      },
      {
        question_text: '¿Dónde ocurre el intercambio gaseoso en el sistema respiratorio?',
        question_type: 'multiple_choice',
        correct_answer: 'En los alvéolos',
        options: ['En la tráquea', 'En los bronquios', 'En los alvéolos', 'En el diafragma'],
        explanation: 'El intercambio gaseoso (O2 y CO2) ocurre en los alvéolos pulmonares, pequeños sacos aéreos en los pulmones.'
      },
      {
        question_text: '¿El cuerpo humano adulto tiene 206 huesos?',
        question_type: 'true_false',
        correct_answer: 'Verdadero',
        options: ['Verdadero', 'Falso'],
        explanation: 'Un adulto tiene 206 huesos: 80 en el esqueleto axial y 126 en el apendicular.'
      }
    ]
  },
  {
    title: 'Historia Universal - Segunda Guerra Mundial',
    difficulty: 'hard',
    category_slug: 'historia',
    combined_content: `
LA SEGUNDA GUERRA MUNDIAL (1939-1945)

Introducción
La Segunda Guerra Mundial fue el conflicto bélico más devastador de la historia humana, involucrando a la mayoría de las naciones del mundo.

Causas del Conflicto

Tratado de Versalles (1919):
• Impuso duras condiciones a Alemania tras la Primera Guerra Mundial
• Reparaciones económicas extremas
• Pérdida de territorios
• Limitaciones militares severas
• Creó resentimiento y condiciones para el nazismo

Crisis Económica (1929):
• Gran Depresión global
• Desempleo masivo en Alemania
• Facilitó el ascenso de movimientos extremistas

Expansionismo:
• Hitler en Alemania (nazismo)
• Mussolini en Italia (fascismo)
• Japón en Asia (militarismo)

Los Bandos

Eje (Potencias del Eje):
• Alemania Nazi (Adolf Hitler)
• Italia Fascista (Benito Mussolini)
• Imperio de Japón (Emperador Hirohito)
• Y aliados menores

Aliados:
• Reino Unido (Winston Churchill)
• Francia (Charles de Gaulle)
• Unión Soviética (Joseph Stalin)
• Estados Unidos (Franklin D. Roosevelt, luego Harry Truman)
• China, y muchos otros

Principales Acontecimientos

1939: Inicio de la Guerra
• 1 de septiembre: Alemania invade Polonia
• 3 de septiembre: Reino Unido y Francia declaran la guerra
• Blitzkrieg (guerra relámpago) alemana

1940: Expansión del Eje
• Abril-junio: Alemania conquista Noruega, Dinamarca, Países Bajos, Bélgica, Francia
• Junio: Italia entra en guerra
• Julio-octubre: Batalla de Inglaterra (RAF vs Luftwaffe)
• Septiembre: Pacto Tripartito (Eje formal)

1941: Globalización del Conflicto
• Junio: Operación Barbarroja - Alemania invade la URSS
• Diciembre 7: Japón ataca Pearl Harbor
• Diciembre 8: Estados Unidos entra en la guerra
• Inicio del Holocausto

1942: Punto de Inflexión
• Junio: Batalla de Midway (victoria aliada en el Pacífico)
• Julio-febrero 1943: Batalla de Stalingrado (derrota alemana)
• Octubre-noviembre: Segunda Batalla de El Alamein (África)

1943: Los Aliados Avanzan
• Julio: Invasión aliada de Sicilia e Italia
• Septiembre: Italia se rinde, Mussolini depuesto
• Noviembre: Conferencia de Teherán (Churchill, Roosevelt, Stalin)

1944: Ofensiva Final
• Junio 6: Día D - Desembarco de Normandía
• Agosto: Liberación de París
• Diciembre: Batalla de las Ardenas (última ofensiva alemana)

1945: Final de la Guerra
• Abril 30: Suicidio de Hitler
• Mayo 7-8: Rendición incondicional de Alemania (Día VE)
• Agosto 6: Bomba atómica en Hiroshima
• Agosto 9: Bomba atómica en Nagasaki
• Agosto 15: Rendición de Japón (Día VJ)
• Septiembre 2: Firma formal de rendición japonesa

Frentes de Guerra

Frente Europeo:
• Frente Occidental: Francia, Países Bajos, Alemania
• Frente Oriental: URSS vs Alemania (el más sangriento)
• Frente Mediterráneo: Norte de África, Italia

Frente del Pacífico:
• China, Sudeste Asiático, islas del Pacífico
• Estrategia de "salto de isla en isla" de EE.UU.

El Holocausto
• Genocidio sistemático de 6 millones de judíos
• Campos de concentración y exterminio
• También persecución de gitanos, homosexuales, discapacitados
• Crímenes de guerra nazis

Consecuencias

Humanas:
• 70-85 millones de muertos (estimado)
• URSS: ~27 millones
• China: ~20 millones
• Alemania: ~7 millones
• Polonia: ~6 millones
• Japón: ~3 millones
• Millones de refugiados y desplazados

Políticas:
• Creación de las Naciones Unidas (ONU) en 1945
• División de Alemania (RFA y RDA)
• Inicio de la Guerra Fría (URSS vs EE.UU.)
• Descolonización de Asia y África

Territoriales:
• Pérdida de territorios alemanes
• Expansión soviética en Europa del Este
• División de Corea
• Creación del Estado de Israel (1948)

Tecnológicas:
• Era nuclear
• Avances en aviación, radar, medicina
• Desarrollo de cohetes y computadoras

Económicas:
• Plan Marshall para reconstrucción europea
• Milagro económico alemán y japonés
• EE.UU. como superpotencia económica

Juicios de Núremberg (1945-1946)
• Tribunal internacional contra líderes nazis
• Estableció precedentes de derechos humanos
• Concepto de "crímenes contra la humanidad"

Legado
La Segunda Guerra Mundial redefinió el orden mundial, estableció el sistema de Naciones Unidas, inició la era nuclear y la Guerra Fría, y dejó lecciones sobre los peligros del totalitarismo y el genocidio.
    `,
    formatted_content: `
LA SEGUNDA GUERRA MUNDIAL (1939-1945)

Causas
• Tratado de Versalles (1919)
• Gran Depresión (1929)
• Expansionismo nazi, fascista y militarista

Bandos
Eje: Alemania, Italia, Japón
Aliados: UK, Francia, URSS, EE.UU., China

Cronología Clave
1939: Invasión de Polonia, inicio de guerra
1940: Conquista de Francia, Batalla de Inglaterra
1941: Barbarroja (URSS), Pearl Harbor (EE.UU. entra)
1942: Midway, Stalingrado (punto de inflexión)
1943: Italia se rinde
1944: Día D (Normandía)
1945: Bombas atómicas, rendición del Eje

Frentes
• Europeo: Occidental, Oriental, Mediterráneo
• Pacífico: China, islas del Pacífico

El Holocausto
6 millones de judíos exterminados

Consecuencias
• 70-85 millones de muertos
• Creación de la ONU
• Inicio de Guerra Fría
• Era nuclear
• Juicios de Núremberg
    `,
    summary: '• La Segunda Guerra Mundial (1939-1945) fue el conflicto más devastador de la historia\n• Causada por el Tratado de Versalles, crisis económica y expansionismo totalitario\n• Resultó en 70-85 millones de muertos y el Holocausto\n• Creó las Naciones Unidas e inició la Guerra Fría',
    questions: [
      {
        question_text: '¿En qué año comenzó la Segunda Guerra Mundial?',
        question_type: 'multiple_choice',
        correct_answer: '1939',
        options: ['1937', '1938', '1939', '1940'],
        explanation: 'La Segunda Guerra Mundial comenzó el 1 de septiembre de 1939 con la invasión alemana de Polonia.'
      },
      {
        question_text: '¿Qué operación marcó la invasión alemana de la Unión Soviética?',
        question_type: 'multiple_choice',
        correct_answer: 'Operación Barbarroja',
        options: ['Operación Overlord', 'Operación Barbarroja', 'Operación Market Garden', 'Operación Dragoon'],
        explanation: 'La Operación Barbarroja fue la invasión alemana de la URSS iniciada el 22 de junio de 1941.'
      },
      {
        question_text: '¿El Día D se refiere al desembarco de Normandía en 1944?',
        question_type: 'true_false',
        correct_answer: 'Verdadero',
        options: ['Verdadero', 'Falso'],
        explanation: 'El Día D (6 de junio de 1944) fue el desembarco aliado en las playas de Normandía, Francia, marcando el inicio de la liberación de Europa Occidental.'
      }
    ]
  },
  {
    title: 'Economía Básica - Oferta y Demanda',
    difficulty: 'medium',
    category_slug: 'economia',
    combined_content: `
ECONOMÍA BÁSICA - LEY DE OFERTA Y DEMANDA

Introducción a la Economía
La economía estudia cómo las sociedades gestionan recursos escasos para satisfacer necesidades ilimitadas.

Conceptos Fundamentales:
• Escasez: Recursos limitados vs necesidades ilimitadas
• Elección: Decidir cómo asignar recursos
• Costo de oportunidad: Lo que se renuncia al elegir una opción

La Demanda

Definición:
Cantidad de un bien o servicio que los consumidores están dispuestos y pueden comprar a diferentes precios en un período determinado.

Ley de la Demanda:
Cuando el precio de un bien aumenta, la cantidad demandada disminuye (relación inversa), asumiendo que otros factores permanecen constantes (ceteris paribus).

Curva de Demanda:
• Gráfica con precio en eje Y y cantidad en eje X
• Pendiente negativa (de izquierda arriba a derecha abajo)
• Movimiento a lo largo de la curva: cambio en precio
• Desplazamiento de la curva: cambio en otros factores

Factores que afectan la demanda:
1. Ingreso del consumidor
   - Bienes normales: demanda aumenta con ingreso
   - Bienes inferiores: demanda disminuye con ingreso

2. Precio de bienes relacionados
   - Sustitutos: Si sube el precio del café, aumenta demanda de té
   - Complementarios: Si sube el precio de autos, baja demanda de gasolina

3. Gustos y preferencias
   - Moda, publicidad, tendencias

4. Expectativas futuras
   - Si se espera aumento de precio, aumenta demanda actual

5. Número de compradores
   - Más compradores = mayor demanda

La Oferta

Definición:
Cantidad de un bien o servicio que los productores están dispuestos y pueden vender a diferentes precios en un período determinado.

Ley de la Oferta:
Cuando el precio de un bien aumenta, la cantidad ofrecida aumenta (relación directa), ceteris paribus.

Curva de Oferta:
• Pendiente positiva (de izquierda abajo a derecha arriba)
• Movimiento a lo largo: cambio en precio
• Desplazamiento: cambio en otros factores

Factores que afectan la oferta:
1. Costos de producción
   - Materias primas, salarios, energía
   - Costos altos → menor oferta

2. Tecnología
   - Mejor tecnología → mayor eficiencia → mayor oferta

3. Precio de bienes relacionados en producción
   - Sustitutos: trigo vs maíz (misma tierra)
   - Complementarios: carne y cuero

4. Expectativas futuras
   - Si se espera precio alto futuro, se reduce oferta actual

5. Número de vendedores
   - Más productores = mayor oferta

6. Factores naturales (agricultura)
   - Clima, desastres naturales

Equilibrio de Mercado

Punto de Equilibrio:
Donde la cantidad demandada = cantidad ofrecida
• Precio de equilibrio: precio al que se igualan oferta y demanda
• Cantidad de equilibrio: cantidad intercambiada a ese precio

Exceso de Oferta (Superávit):
• Precio > precio de equilibrio
• Cantidad ofrecida > cantidad demandada
• Presión para bajar precios

Exceso de Demanda (Escasez):
• Precio < precio de equilibrio
• Cantidad demandada > cantidad ofrecida
• Presión para subir precios

Mecanismo de Ajuste:
El mercado tiende al equilibrio automáticamente:
• Superávit → precios bajan → equilibrio
• Escasez → precios suben → equilibrio

Elasticidad

Elasticidad Precio de la Demanda:
Mide la sensibilidad de la cantidad demandada ante cambios en el precio.

• Elástica: Cambio grande en cantidad (productos de lujo)
• Inelástica: Cambio pequeño en cantidad (necesidades básicas)
• Unitaria: Cambio proporcional

Factores de elasticidad:
1. Disponibilidad de sustitutos
2. Proporción del ingreso
3. Necesidad vs lujo
4. Tiempo para ajustarse

Elasticidad Precio de la Oferta:
Mide sensibilidad de cantidad ofrecida ante cambios en precio.

Aplicaciones Prácticas

Impuestos:
• El gobierno puede gravar compradores o vendedores
• La carga fiscal se distribuye según elasticidades
• Bien inelástico: consumidores pagan más del impuesto

Controles de Precios:
• Precio máximo (techo): Puede causar escasez
  Ejemplo: alquileres controlados
• Precio mínimo (piso): Puede causar excedente
  Ejemplo: salario mínimo

Subsidios:
• Ayuda gubernamental a productores o consumidores
• Aumenta oferta o demanda
• Puede distorsionar mercados

Sistemas Económicos

Economía de Mercado:
• Decisiones descentralizadas
• Mecanismo de precios coordina
• Propiedad privada

Economía Planificada:
• Gobierno decide qué, cómo, para quién producir
• Control centralizado

Economía Mixta:
• Combinación de mercado y planificación
• Mayoría de economías modernas

Fallas de Mercado

Situaciones donde el mercado no asigna recursos eficientemente:
1. Monopolio: Un solo vendedor domina
2. Externalidades: Costos/beneficios a terceros
3. Bienes públicos: No excluibles, no rivales
4. Información asimétrica: Una parte sabe más

Conclusión
La ley de oferta y demanda es fundamental para entender cómo funcionan los mercados. Los precios actúan como señales que coordinan las decisiones de millones de compradores y vendedores, asignando recursos escasos de manera eficiente en condiciones competitivas.
    `,
    formatted_content: `
ECONOMÍA BÁSICA - LEY DE OFERTA Y DEMANDA

La Demanda
Cantidad que consumidores quieren y pueden comprar

Ley de la Demanda
Precio ↑ → Cantidad demandada ↓

Factores:
• Ingreso
• Precios de sustitutos/complementarios
• Gustos
• Expectativas
• Número de compradores

La Oferta
Cantidad que productores quieren y pueden vender

Ley de la Oferta
Precio ↑ → Cantidad ofrecida ↑

Factores:
• Costos de producción
• Tecnología
• Expectativas
• Número de vendedores

Equilibrio de Mercado
Cantidad demandada = Cantidad ofrecida

Desequilibrios:
• Superávit: Oferta > Demanda → Precios bajan
• Escasez: Demanda > Oferta → Precios suben

Elasticidad
Mide sensibilidad ante cambios de precio
• Elástica: Cambio grande
• Inelástica: Cambio pequeño

Aplicaciones
• Impuestos
• Controles de precios
• Subsidios
    `,
    summary: '• La ley de demanda: mayor precio, menor cantidad demandada\n• La ley de oferta: mayor precio, mayor cantidad ofrecida\n• El equilibrio ocurre donde oferta y demanda se encuentran\n• La elasticidad mide la sensibilidad ante cambios de precio',
    questions: [
      {
        question_text: '¿Qué establece la ley de la demanda?',
        question_type: 'multiple_choice',
        correct_answer: 'Precio alto → Cantidad demandada baja',
        options: ['Precio alto → Cantidad demandada alta', 'Precio alto → Cantidad demandada baja', 'Precio y demanda no se relacionan', 'Precio bajo → Cantidad demandada baja'],
        explanation: 'La ley de la demanda establece una relación inversa: cuando el precio aumenta, la cantidad demandada disminuye, ceteris paribus.'
      },
      {
        question_text: '¿Qué ocurre en el punto de equilibrio del mercado?',
        question_type: 'multiple_choice',
        correct_answer: 'Cantidad demandada = Cantidad ofrecida',
        options: ['Cantidad demandada > Cantidad ofrecida', 'Cantidad demandada < Cantidad ofrecida', 'Cantidad demandada = Cantidad ofrecida', 'Los precios se fijan arbitrariamente'],
        explanation: 'En el equilibrio de mercado, la cantidad que los consumidores quieren comprar iguala la cantidad que los productores quieren vender.'
      },
      {
        question_text: '¿La demanda de productos de lujo suele ser más elástica que la de necesidades básicas?',
        question_type: 'true_false',
        correct_answer: 'Verdadero',
        options: ['Verdadero', 'Falso'],
        explanation: 'Los productos de lujo tienen demanda elástica (muy sensible al precio), mientras que las necesidades básicas tienen demanda inelástica (poco sensible al precio).'
      }
    ]
  },
  {
    title: 'Música Clásica - Grandes Compositores',
    difficulty: 'medium',
    category_slug: 'arte',
    combined_content: `
MÚSICA CLÁSICA - GRANDES COMPOSITORES

Introducción
La música clásica occidental abarca aproximadamente 1000 años de historia, desde la Edad Media hasta la actualidad, con diversos períodos estilísticos.

Períodos de la Música Clásica

1. Medieval (500-1400)
• Canto gregoriano
• Música sacra predominante

2. Renacimiento (1400-1600)
• Polifonía vocal
• Música coral

3. Barroco (1600-1750)
• Ornamentación elaborada
• Bajo continuo

4. Clásico (1750-1820)
• Claridad, equilibrio, forma
• Desarrollo de la sinfonía

5. Romántico (1820-1900)
• Expresión emocional
• Expansión orquestal

6. Moderno/Contemporáneo (1900-presente)
• Experimentación
• Nuevas técnicas

El Período Barroco

Johann Sebastian Bach (1685-1750)
• Compositor alemán, maestro del contrapunto
• Obras religiosas y seculares

Obras destacadas:
• "El clave bien temperado" (48 preludios y fugas)
• "Conciertos de Brandeburgo" (6 conciertos)
• "La Pasión según San Mateo"
• "Tocata y Fuga en Re menor"

Importancia:
Considerado uno de los más grandes compositores de todos los tiempos. Su dominio del contrapunto (múltiples melodías simultáneas) es insuperable.

Antonio Vivaldi (1678-1741)
• Compositor italiano, violinista
• Sacerdote conocido como "Il Prete Rosso" (el cura rojo)

Obras destacadas:
• "Las Cuatro Estaciones" (4 conciertos para violín)
  - Primavera, Verano, Otoño, Invierno
• Más de 500 conciertos
• Óperas y música sacra

Estilo:
Desarrollo del concierto como forma, virtuosismo instrumental

El Período Clásico

Wolfgang Amadeus Mozart (1756-1791)
• Niño prodigio austriaco
• Compuso desde los 5 años
• Murió a los 35 años

Obras destacadas:
• Óperas: "Las bodas de Fígaro", "Don Giovanni", "La flauta mágica"
• Sinfonías: Sinfonía No. 40, Sinfonía No. 41 "Júpiter"
• Conciertos: 27 conciertos para piano
• "Réquiem" (inacabado)

Catálogo Köchel:
626 obras catalogadas (K. 1 a K. 626)

Ludwig van Beethoven (1770-1827)
• Compositor alemán
• Puente entre clasicismo y romanticismo
• Sordo en sus últimos años

Obras destacadas:
• 9 sinfonías (especialmente la 5ª y 9ª)
• 32 sonatas para piano ("Claro de Luna", "Patética")
• Ópera "Fidelio"
• "Missa Solemnis"

Períodos creativos:
1. Temprano (estilo clásico)
2. Medio (heroico)
3. Tardío (introspectivo, innovador)

Franz Joseph Haydn (1732-1809)
• Compositor austriaco
• "Padre de la sinfonía" y "padre del cuarteto de cuerdas"

Contribuciones:
• 104 sinfonías
• 68 cuartetos de cuerdas
• Estableció la forma de la sinfonía clásica
• "La Creación" (oratorio)

El Período Romántico

Frédéric Chopin (1810-1849)
• Compositor y pianista polaco
• "Poeta del piano"

Obras destacadas:
• Nocturnos (21)
• Estudios (27)
• Polonesas
• Valses
• Baladas

Estilo:
Extremadamente idiomático para piano, lirismo, técnica avanzada

Pyotr Ilyich Tchaikovsky (1840-1893)
• Compositor ruso
• Fusión de tradición occidental y rusa

Obras destacadas:
• Ballets: "El Lago de los Cisnes", "El Cascanueces", "La Bella Durmiente"
• Sinfonías: Sinfonía No. 6 "Patética"
• Concierto para Piano No. 1
• "1812 Overture"

Johannes Brahms (1833-1897)
• Compositor alemán
• Seguidor de la tradición clásica en era romántica

Obras destacadas:
• 4 sinfonías
• Conciertos para piano y violín
• "Réquiem Alemán"
• Música de cámara

Características:
Estructuras clásicas con expresión romántica

Richard Wagner (1813-1883)
• Compositor alemán de óperas
• Innovador revolucionario

Aportaciones:
• Concepto de "obra de arte total" (Gesamtkunstwerk)
• Leitmotiv (temas recurrentes)
• Cromatismo extremo

Obras destacadas:
• "El anillo del nibelungo" (ciclo de 4 óperas)
• "Tristán e Isolda"
• "Parsifal"

El Período Moderno

Igor Stravinsky (1882-1971)
• Compositor ruso-francés-estadounidense
• Revolucionó la música del siglo XX

Obras destacadas:
• "La consagración de la primavera" (ballet, 1913)
  - Causó escándalo en su estreno
• "El pájaro de fuego"
• "Petrushka"

Períodos estilísticos:
Ruso, neoclásico, serial

Claude Debussy (1862-1918)
• Compositor francés
• Fundador del impresionismo musical

Obras destacadas:
• "Preludio a la siesta de un fauno"
• "La Mer"
• "Claro de Luna" (Suite Bergamasque)

Estilo:
Armonías innovadoras, texturas atmosféricas

Formas Musicales

Sinfonía:
Obra para orquesta en 4 movimientos generalmente
1. Allegro (rápido)
2. Adagio/Andante (lento)
3. Minueto/Scherzo (danza)
4. Allegro/Presto (rápido)

Concierto:
Obra para solista y orquesta (3 movimientos)

Sonata:
Obra para uno o dos instrumentos (3-4 movimientos)

Ópera:
Drama musical escenificado

Cuarteto de cuerdas:
Obra para 2 violines, viola, violonchelo

Importancia Cultural
La música clásica ha influenciado profundamente la cultura occidental, estableciendo fundamentos de armonía, forma y orquestación que persisten en la música moderna, desde bandas sonoras hasta música popular.
    `,
    formatted_content: `
MÚSICA CLÁSICA - GRANDES COMPOSITORES

Períodos
Medieval → Renacimiento → Barroco → Clásico → Romántico → Moderno

Barroco (1600-1750)
• Bach: Maestro del contrapunto
  - El clave bien temperado
• Vivaldi: Las Cuatro Estaciones

Clásico (1750-1820)
• Mozart: Niño prodigio, 626 obras
  - Óperas, sinfonías, conciertos
• Beethoven: Puente al romanticismo
  - 9 sinfonías, sordo en últimos años
• Haydn: Padre de la sinfonía

Romántico (1820-1900)
• Chopin: Poeta del piano
• Tchaikovsky: Ballets famosos
• Brahms: Tradición clásica
• Wagner: Ópera revolucionaria

Moderno (1900+)
• Stravinsky: La consagración
• Debussy: Impresionismo musical

Formas Musicales
• Sinfonía: orquesta, 4 movimientos
• Concierto: solista + orquesta
• Sonata: 1-2 instrumentos
• Ópera: drama musical
    `,
    summary: '• La música clásica abarca 1000 años con diversos períodos estilísticos\n• Bach, Mozart y Beethoven son pilares de la música occidental\n• El romanticismo enfatizó la expresión emocional y expansión orquestal\n• La música moderna del siglo XX trajo experimentación y nuevas técnicas',
    questions: [
      {
        question_text: '¿Quién compuso "Las Cuatro Estaciones"?',
        question_type: 'multiple_choice',
        correct_answer: 'Antonio Vivaldi',
        options: ['Johann Sebastian Bach', 'Antonio Vivaldi', 'Wolfgang Amadeus Mozart', 'Franz Joseph Haydn'],
        explanation: 'Antonio Vivaldi compuso "Las Cuatro Estaciones", un conjunto de 4 conciertos para violín del período Barroco.'
      },
      {
        question_text: '¿Cuántas sinfonías compuso Beethoven?',
        question_type: 'multiple_choice',
        correct_answer: '9',
        options: ['7', '8', '9', '10'],
        explanation: 'Ludwig van Beethoven compuso 9 sinfonías, siendo la Novena Sinfonía (con el "Himno a la Alegría") su obra culminante.'
      },
      {
        question_text: '¿Mozart fue un niño prodigio que comenzó a componer desde los 5 años?',
        question_type: 'true_false',
        correct_answer: 'Verdadero',
        options: ['Verdadero', 'Falso'],
        explanation: 'Wolfgang Amadeus Mozart fue un niño prodigio que comenzó a componer desde muy temprana edad y llegó a crear 626 obras catalogadas antes de morir a los 35 años.'
      }
    ]
  }
]

async function createQuizzes() {
  console.log('🚀 Starting to create public test quizzes...\n')

  for (const quizData of quizzes) {
    try {
      console.log(`📝 Creating quiz: "${quizData.title}"`)

      // Get category
      const { data: category } = await supabase
        .from('quiz_categories')
        .select('id')
        .eq('slug', quizData.category_slug)
        .single()

      if (!category) {
        console.log(`❌ Category not found: ${quizData.category_slug}`)
        continue
      }

      // Create quiz
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          user_id: SYSTEM_USER_ID,
          title: quizData.title,
          difficulty: quizData.difficulty,
          total_questions: quizData.questions.length,
          summary: quizData.summary,
          combined_content: quizData.combined_content,
          formatted_content: quizData.formatted_content,
          visibility: 'public',
          category_id: category.id,
          is_verified: true
        })
        .select()
        .single()

      if (quizError) {
        console.log(`❌ Error creating quiz: ${quizError.message}`)
        continue
      }

      console.log(`✅ Quiz created: ${quiz.id}`)

      // Create questions
      const questionsToInsert = quizData.questions.map((q, index) => ({
        quiz_id: quiz.id,
        question_text: q.question_text,
        question_type: q.question_type,
        correct_answer: q.correct_answer,
        options: q.options,
        explanation: q.explanation,
        order: index + 1
      }))

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert)

      if (questionsError) {
        console.log(`❌ Error creating questions: ${questionsError.message}`)
        continue
      }

      console.log(`✅ ${quizData.questions.length} questions created`)

      // Create global challenge
      const shareCode = generateShareCode()
      const shareSlug = generateShareSlug(quizData.title)

      const { data: challenge, error: challengeError } = await supabase
        .from('quiz_challenges')
        .insert({
          quiz_id: quiz.id,
          creator_id: SYSTEM_USER_ID,
          share_code: shareCode,
          share_slug: shareSlug,
          show_creator_score: false,
          has_leaderboard: true,
          is_anonymous: false,
          challenge_type: 'global'
        })
        .select()
        .single()

      if (challengeError) {
        console.log(`❌ Error creating challenge: ${challengeError.message}`)
        continue
      }

      // Update quiz with global_challenge_id
      await supabase
        .from('quizzes')
        .update({ global_challenge_id: challenge.id })
        .eq('id', quiz.id)

      console.log(`✅ Global challenge created: ${shareCode} (${shareSlug})`)
      console.log(`🔗 URL: /challenge/${shareSlug}\n`)

    } catch (error) {
      console.log(`❌ Unexpected error: ${error.message}\n`)
    }
  }

  console.log('🎉 Finished creating all quizzes!')
}

function generateShareCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

function generateShareSlug(title) {
  const slug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  const random = Math.random().toString(36).substring(2, 8)
  return `${slug}-${random}`.substring(0, 50)
}

createQuizzes()
