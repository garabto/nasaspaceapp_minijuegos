// src/data/missionData.js
export const PERSONAJES = [
  {
    id: "wenceslao",
    nombre: "Ingeniero Wenceslao",
    rol: "Máquinas, electricidad y defensa",
    bonusTexto: "+5 Energía extra al limpiar paneles y menos daño eléctrico.",
    saludo: "¡Hola, Ingeniero Wenceslao! La energía nunca alcanza para todo, ¡tú decides qué máquinas reciben poder!",
  },
  {
    id: "margaret",
    nombre: "Científica Margaret",
    rol: "Botánica, geología y clima espacial",
    bonusTexto: "+5 Oxígeno extra en invernadero y mejor resistencia ante tormentas.",
    saludo: "¡Lista para explorar, Científica Margaret! Tu amor por la naturaleza mantendrá viva nuestra base.",
  },
  {
    id: "atlas",
    nombre: "Médico Atlas",
    rol: "Anatomía y primeros auxilios",
    bonusTexto: "+5 Oxígeno extra al cambiar el filtro CO₂ y menor fatiga por falta de aire.",
    saludo: "¡Qué bueno tenerte a bordo, Médico Atlas! Vigilarás que toda la tripulación esté fuerte.",
  },
];

export const EMERGENCIAS = [
  {
    id: "tormenta_solar",
    titulo: "¡Tormenta Solar Gigante! (1972)",
    recuerdo: "En 1972, el Sol lanzó una explosión gigante de rayos que afectaba los circuitos de las naves.",
    alerta: "¡Una súper llamarada del Sol viene hacia la nave! ¿Qué hacemos?",
    opcionA: {
      texto: "Opción A · Prender Escudo Magnético (-25 Oxígeno | Salva Blindaje y Energía)",
      aplicar: (state) => state.modificarRecurso("oxigeno", -25),
    },
    opcionB: {
      texto: "Opción B · Dejar el Aire Prendido (-25 Blindaje, -15 Energía | Salva Oxígeno)",
      aplicar: (state) => {
        const reduccion = state.personaje === "margaret" ? 5 : 0;
        state.modificarRecurso("blindaje", -(25 - reduccion));
        state.modificarRecurso("energia", -15);
      },
    },
  },
  {
    id: "parasol_roto",
    titulo: "¡Se rompió el parasol de la nave! (Skylab 1973)",
    recuerdo: "En 1973, el viento espacial arrancó la sombrilla protectora del Skylab y la cabina se volvió un horno.",
    alerta: "¡Se soltó una pieza del techo protector y la cabina se calienta muy rápido!",
    opcionA: {
      texto: "Opción A · Armar Sombrilla Espacial (-20 Blindaje | Enfría al instante)",
      aplicar: (state) => state.modificarRecurso("blindaje", -20),
    },
    opcionB: {
      texto: "Opción B · Aire Acondicionado al Máximo (-30 Energía | Conserva Blindaje)",
      aplicar: (state) => {
        const ahorro = state.personaje === "wenceslao" ? 5 : 0;
        state.modificarRecurso("energia", -(30 - ahorro));
      },
    },
  },
  {
    id: "fuga_enfriador",
    titulo: "¡Fuga de líquido enfriador! (EEI 2013)",
    recuerdo: "En 2013, hubo una fuga en los tubos que enfrían los paneles solares de la Estación Espacial.",
    alerta: "El líquido que enfría nuestros paneles solares se está escapando al espacio.",
    opcionA: {
      texto: "Opción A · Cerrar Tubo desde Computadora (-15% Energía máxima | Sin peligro)",
      aplicar: (state) => {
        state.energiaMaxima = Math.max(55, state.energiaMaxima - 15);
        state.modificarRecurso("energia", 0);
      },
    },
    opcionB: {
      texto: "Opción B · Salir con Traje Espacial (-20 Oxígeno, -10 Blindaje | 100% Energía)",
      aplicar: (state) => {
        const ahorroO2 = state.personaje === "atlas" ? 5 : 0;
        state.modificarRecurso("oxigeno", -(20 - ahorroO2));
        state.modificarRecurso("blindaje", -10);
      },
    },
  },
  {
    id: "choque_meteorito",
    titulo: "¡Choque de meteorito y fuga de aire! (Mir 1997)",
    recuerdo: "En 1997 en la estación Mir, un impacto abrió un agujero y tuvieron que cortar cables para sellar la puerta.",
    alerta: "¡IMPACTO EN EL CASCO! ¡El aire se sale por una grieta! ¡Cierra la compuerta!",
    opcionA: {
      texto: "Opción A · Cortar Cables y Cerrar Puerta Ya (-25 Energía | Salva Oxígeno)",
      aplicar: (state) => {
        const ahorro = state.personaje === "wenceslao" ? 5 : 0;
        state.modificarRecurso("energia", -(25 - ahorro));
      },
    },
    opcionB: {
      texto: "Opción B · Desconectar con Cuidado (-30 Oxígeno, -10 Blindaje | Salva Energía)",
      aplicar: (state) => {
        state.modificarRecurso("oxigeno", -30);
        state.modificarRecurso("blindaje", -10);
      },
    },
  },
];

export const CARTAS_MEJORA = [
  {
    id: "codigoHamilton",
    nombre: "El Código de Margaret Hamilton",
    rama: "Computación",
    desc: "La batería dura más de noche y tu linterna ilumina el doble.",
  },
  {
    id: "ladrillosPolvo",
    nombre: "Ladrillos de Polvo Espacial",
    rama: "Geología",
    desc: "Limpiar los paneles solares repara +15 de Blindaje.",
  },
  {
    id: "superJardin",
    nombre: "Súper Jardín Espacial",
    rama: "Botánica",
    desc: "Mejora las plantas y te regala +10 de Oxígeno extra cada mañana.",
  },
  {
    id: "entrenamiento",
    nombre: "Entrenamiento de Astronauta",
    rama: "Medicina",
    desc: "Evita que se nuble la pantalla cuando hay poco aire en la cabina.",
  },
];

// Agregar al final de src/data/missionData.js
export const MINIJUEGOS_INFO = {
  paneles: {
    archivo: "ARCHIVO DE MEMORIA #01 · Mis primos en el planeta Marte",
    recuerdo:
      "«¡Bip-bup! Me acuerdo de mis primos Spirit y Opportunity en Marte: un polvo rojo se pegaba a sus paneles como imán y los dejaba sin batería, hasta que unos remolinos de viento lo barrían.»",
    mensajeIA:
      "«¡Ojo, explorador! El polvo espacial cubrió nuestros paneles solares y mi batería no está cargando. ¡Límpialos antes de que caiga la noche!»",
    consejos: {
      wenceslao: "Consejo de Wenceslao (Electricidad): «¡Presiona el botón de vibración cuando la luz esté en verde para sacudir el polvo pegado!»",
      margaret: "Consejo de Margaret (Clima y Rocas): «Este polvo tiene electricidad estática por el viento. Límpialo con toques suaves para no rayar los paneles.»",
      atlas: "Consejo de Atlas (Médico): «¡Mantén el ritmo y respira tranquilo! Si logramos buena energía hoy, la cabina estará cálida toda la noche.»",
    },
  },
  co2: {
    archivo: "ARCHIVO DE MEMORIA #02 · El rompecabezas del Apolo 13",
    recuerdo:
      "«¡Bip-biiip! En 1970, los astronautas del Apolo 13 tenían filtros cuadrados para un hueco redondo. Usaron cartón de un manual, cinta y mangueras para inventar un adaptador y salvarse.»",
    mensajeIA:
      "«¡Alerta de aire! El filtro de la cabina se tapó y el repuesto es cuadrado, pero el tubo es redondo. ¡Usa cartón, cinta y mangueras para conectarlo!»",
    consejos: {
      wenceslao: "Consejo de Wenceslao (Ingeniero): «No intentes meterlo a la fuerza. Usa el cartón como embudo y pega muy bien los bordes con la cinta espacial.»",
      atlas: "Consejo de Atlas (Médico): «Si no limpiamos el aire rápido, nos sentiremos mareados y nos costará ver bien. ¡Concéntrate, tú puedes!»",
      margaret: "Consejo de Margaret (Científica): «Observa bien la forma de cada pieza: cada material cumple una función exacta para sellar el aire.»",
    },
  },
  invernadero: {
    archivo: "ARCHIVO DE MEMORIA #03 · El jardín flotante en el espacio",
    recuerdo:
      "«¡Bup-bip! En 2016 en la Estación Espacial, como no hay gravedad, el agua de las flores Zinnia flotaba en bolitas y sacaba moho, hasta que el astronauta Scott Kelly las cuidó gota a gota.»",
    mensajeIA:
      "«¡Hora de cuidar nuestro jardín espacial! Estas plantas producen oxígeno, pero como el agua flota en burbujas, dales solo las gotas exactas.»",
    consejos: {
      margaret: "Consejo de Margaret (Botánica): «Fíjate en el medidor de cada maceta: echa 2 gotas por planta y prende el ventilador si ves gotitas flotando.»",
      atlas: "Consejo de Atlas (Médico): «Si les sale moho a las plantas, el aire de la nave se pondrá sucio. ¡Mantén las hojas limpiecitas!»",
      wenceslao: "Consejo de Wenceslao (Ingeniero): «Usa el ventilador de circulación para despejar las burbujas de agua en gravedad cero.»",
    },
  },
};