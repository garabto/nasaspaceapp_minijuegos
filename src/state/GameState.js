// src/state/GameState.js
export const GameState = {
  sol: 1,
  maxSoles: 10,
  fase: "MANANA", // "MANANA" | "DIA" | "EMERGENCIA" | "NOCHE" | "MEJORA"
  personaje: "wenceslao", // "wenceslao" | "margaret" | "atlas"
  nivelDificultad: "normal", // "facil" | "normal" | "dificil"

  recursos: {
    energia: 70,
    oxigeno: 80,
    blindaje: 80,
  },
  energiaMaxima: 100,

  // Presupuesto de la consola de mando: 6 núcleos disponibles vs 9 necesarios (nunca alcanza para todo)
  nucleosDisponibles: 6,
  asignacionEnergia: {
    paneles: 2,
    soporteVital: 2,
    escudos: 2,
  },

  minijuegosHoy: {
    paneles: false,
    co2: false,
    invernadero: false,
  },

  mejoras: {
    codigoHamilton: false, // Batería dura más de noche y linterna ilumina el doble
    ladrillosPolvo: false, // Limpiar paneles repara +15 de Blindaje
    superJardin: false,    // +10 de Oxígeno extra cada mañana
    entrenamiento: false,  // Evita pantalla nublada cuando hay poco oxígeno
  },

  iniciarPartida(personaje = "wenceslao", nivelDificultad = "normal") {
    this.personaje = personaje;
    this.nivelDificultad = nivelDificultad;
    this.sol = 1;
    this.energiaMaxima = 100;

    const base = {
      facil: { energia: 85, oxigeno: 90, blindaje: 90 },
      normal: { energia: 70, oxigeno: 80, blindaje: 80 },
      dificil: { energia: 55, oxigeno: 65, blindaje: 65 },
    }[nivelDificultad] || { energia: 70, oxigeno: 80, blindaje: 80 };

    this.recursos = { ...base };
    this.mejoras = {
      codigoHamilton: false,
      ladrillosPolvo: false,
      superJardin: false,
      entrenamiento: false,
    };
    this.prepararNuevoSol();
  },

  prepararNuevoSol() {
    this.fase = "MAÑANA";
    this.minijuegosHoy = { paneles: false, co2: false, invernadero: false };
    this.asignacionEnergia = { paneles: 0, soporteVital: 0, escudos: 0 };

    // Carta: Súper Jardín Espacial (+10 Oxígeno cada mañana)
    if (this.mejoras.superJardin) {
      this.modificarRecurso("oxigeno", 10);
    }
  },

  // Ajuste de dificultad combinado (selector inicial + progresión del Sol 1 al 10)
  getParametrosDificultad() {
    const factorBase = { facil: 1.2, normal: 1.0, dificil: 0.8 }[this.nivelDificultad] || 1.0;
    const escalaSol = Math.max(0.65, 1 - (this.sol - 1) * 0.035);
    const multTiempo = factorBase * escalaSol;

    return {
      tiempoPaneles: Math.max(18, Math.round(35 * multTiempo + (this.asignacionEnergia.paneles - 1) * 3)),
      cantidadPolvo: Math.min(36, 18 + this.sol * 2),
      metaPolvo: Math.min(30, 14 + this.sol * 2),
      tiempoCO2: Math.max(22, Math.round(50 * multTiempo + (this.asignacionEnergia.soporteVital - 1) * 4)),
      tiempoInvernadero: Math.max(25, Math.round(55 * multTiempo + (this.asignacionEnergia.soporteVital - 1) * 4)),
      consumoNocturno: Math.round((10 + this.sol * 1.4) / factorBase),
      tiempoEmergencia: this.sol >= 6 || this.nivelDificultad === "dificil" ? 15 : 20,
    };
  },

  modificarRecurso(tipo, delta) {
    const tope = tipo === "energia" ? this.energiaMaxima : 100;
    this.recursos[tipo] = Math.max(0, Math.min(tope, Math.round(this.recursos[tipo] + delta)));
  },

  verificarFinJuego() {
    if (this.recursos.energia <= 0) return { terminado: true, victoria: false, motivo: "ENERGIA" };
    if (this.recursos.oxigeno <= 0) return { terminado: true, victoria: false, motivo: "OXIGENO" };
    if (this.recursos.blindaje <= 0) return { terminado: true, victoria: false, motivo: "BLINDAJE" };
    if (this.sol > this.maxSoles) return { terminado: true, victoria: true, motivo: "VICTORIA" };
    return { terminado: false };
  },
};