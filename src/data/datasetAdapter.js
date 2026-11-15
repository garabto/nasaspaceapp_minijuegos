// src/data/datasetAdapter.js

// Ajusta estas rutas según tu carpeta public/ o assets/
const DATASET_PATHS = {
  environment: new URL('./dataset/runtime/mars_environment.json', import.meta.url).href,
  donki: new URL('./dataset/runtime/donki_flr_catalogue.json', import.meta.url).href,
  facts: new URL('./dataset/runtime/facts.json', import.meta.url).href,
  extra: new URL('./dataset/educational/radlab_iss_training_2022-04-01T23-00-00_to_2022-04-02T01-04-40.json', import.meta.url).href
};

// Función para obtener la ficha real de facts.json según la mecánica:
export function getFichaPorMecanica(mechanicId, index = 0) {
  const lista = cache.facts?.facts;
  if (!Array.isArray(lista)) return null;

  const coincidencias = lista.filter(
    (f) => Array.isArray(f.mechanic_ids) && f.mechanic_ids.includes(mechanicId)
  );
  if (coincidencias.length === 0) return null;

  const ficha = coincidencias[index % coincidencias.length];
  return {
    titulo: ficha.title,
    paraNinos: ficha.child_explanation,
    cientifico: ficha.scientific_statement,
    contexto: ficha.mission_context
  };
}

const cache = {
  loaded: false,
  environment: null,
  donki: null,
  facts: null,
  extra: null
};

// Horas LMST objetivo según la fase del turno
const HORA_POR_FASE = {
  MAÑANA: 8,  // 08:00 LMST
  DIA: 14,    // 14:00 LMST
  NOCHE: 2    // 02:00 LMST
};

/**
 * Carga los 4 JSON en paralelo al iniciar MenuScene.
 */
export async function cargarDataset() {
  if (cache.loaded) return cache;

  const keys = Object.keys(DATASET_PATHS);
  const responses = await Promise.all(
    keys.map(async (key) => {
      try {
        const res = await fetch(DATASET_PATHS[key]);
        if (!res.ok) throw new Error(`HTTP ${res.status} en ${DATASET_PATHS[key]}`);
        return await res.json();
      } catch (err) {
        console.warn(`[datasetAdapter] No se pudo cargar ${key}:`, err);
        return null;
      }
    })
  );

  keys.forEach((key, index) => {
    cache[key] = responses[index];
  });

  cache.loaded = true;
  return cache;
}

/**
 * Busca el registro ambiental por mission_day === sol y fase ("MAÑANA", "DIA", "NOCHE").
 * Si la hora objetivo tiene null en temperatura o presión, busca la hora válida más cercana.
 */
export function getClimaMarciano(sol, fase = 'DIA') {
  const raw = cache.environment;
  const perfiles = Array.isArray(raw) ? raw : (raw?.profiles || raw?.sols);

  if (!Array.isArray(perfiles) || perfiles.length === 0) {
    return { valido: false, texto: 'Sensor en calibración' };
  }

  const diaNormalizado = ((sol - 1) % perfiles.length) + 1;
  const registroSol =
    perfiles.find((p) => p.mission_day === sol) ||
    perfiles.find((p) => p.mission_day === diaNormalizado) ||
    perfiles[diaNormalizado - 1];

  const listaHoras =
    registroSol?.hourly ||
    registroSol?.hours ||
    registroSol?.observations ||
    registroSol?.lmst_hours;

  if (!Array.isArray(listaHoras)) {
    return { valido: false, texto: 'Sensor en calibración' };
  }

  const faseKey = String(fase).toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const horaObjetivo = HORA_POR_FASE[faseKey === 'MANANA' ? 'MAÑANA' : faseKey] ?? 14;

  const leerValor = (campo) => {
    if (typeof campo === 'number' && Number.isFinite(campo)) return campo;
    if (campo && typeof campo === 'object') {
      const num = campo.sample_mean ?? campo.mean ?? campo.value ?? campo.val;
      if (typeof num === 'number' && Number.isFinite(num)) return num;
    }
    return null;
  };

  const normalizados = listaHoras
    .map((h) => ({
      hora: h.lmst_hour ?? h.hour ?? h.lmst,
      tempK: leerValor(h.temperature ?? h.air_temp_k ?? h.temp_k ?? h.temp),
      presionPa: leerValor(h.pressure ?? h.pressure_pa ?? h.pres_pa)
    }))
    .filter((h) => typeof h.hora === 'number' && h.tempK !== null && h.presionPa !== null);

  if (normalizados.length === 0) {
    return { valido: false, texto: 'Sensor en calibración' };
  }

  let lectura = normalizados.find((h) => h.hora === horaObjetivo);

  if (!lectura) {
    lectura = normalizados.reduce((mejor, actual) => {
      const distActual = Math.min(Math.abs(actual.hora - horaObjetivo), 24 - Math.abs(actual.hora - horaObjetivo));
      const distMejor = Math.min(Math.abs(mejor.hora - horaObjetivo), 24 - Math.abs(mejor.hora - horaObjetivo));
      return distActual < distMejor ? actual : mejor;
    });
  }

 const solReal = registroSol.source_sol ?? registroSol.sol ?? (diaNormalizado + 9);
  const missionDay = registroSol.mission_day ?? diaNormalizado;
  const tempK = Number(lectura.tempK.toFixed(1));
  const tempC = Number((lectura.tempK - 273.15).toFixed(1));
  const presion = Math.round(lectura.presionPa);
  const horaFmt = `${String(lectura.hora).padStart(2, '0')}:00`;

  const etiquetaClima =
    tempC <= -50 ? '🥶 Totalmente congelado' :
    tempC <= -15 ? '❄️ Muy frío' :
                   '🌤️ Fresco';

  const vecesMenosAire = Math.round(101325 / presion);

  return {
    valido: true,
    solReal,
    missionDay,
    horaLmst: horaFmt,
    tempK,
    tempC,
    presionPa: presion,
    texto: `Día ${missionDay} · Hora ${horaFmt}: La temperatura es ${tempC} °C ${etiquetaClima} · ${vecesMenosAire}x menos aire que en la Tierra`,
    detalleCientifico: `Sensor real NASA Curiosity (Sol ${solReal} · ${horaFmt} LMST): ${tempK} K (${tempC} °C) · Presión: ${presion} Pa`
  };
}

/**
 * Obtiene una llamarada real del catálogo DONKI para enriquecer alertas solares.
 */
export function getEventoSolarReal(sol) {
  const lista = Array.isArray(cache.donki)
    ? cache.donki
    : cache.donki?.events || cache.donki?.flares || [];

  if (!Array.isArray(lista) || lista.length === 0) {
    return {
      clase: 'M1.0',
      inicio: 'Sin registro reciente',
      regionActiva: 'N/A',
      mensaje: 'Actividad geomagnética moderada detectada en órbita.'
    };
  }

  const idx = Math.abs((sol || 1) - 1) % lista.length;
  const evento = lista[idx];

  return {
    id: evento.flrID || evento.id || `DONKI-${idx + 1}`,
    clase: evento.classType || evento.clase || 'M2.4',
    inicio: evento.beginTime || evento.peakTime || evento.fecha || '',
    regionActiva: evento.activeRegionNum || evento.region || 'AR-N/A',
    fuente: evento.sourceLocation || '',
    raw: evento
  };
}

/**
 * Devuelve la ficha científica curada desde facts.json según el mechanicId.
 */
// export function getFichaPorMecanica(mechanicId) {
//   const facts = cache.facts;
//   if (!facts || !mechanicId) return null;

//   // Soporta tanto objeto diccionario { [mechanicId]: {...} } como arreglo [{ id / mechanicId, ... }]
//   if (Array.isArray(facts)) {
//     return facts.find((f) => f.mechanicId === mechanicId || f.id === mechanicId) || null;
//   }

//   return facts[mechanicId] || facts.facts?.[mechanicId] || null;
// }