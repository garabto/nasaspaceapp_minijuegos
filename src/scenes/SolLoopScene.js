// src/scenes/SolLoopScene.js
import { addText, addButton, drawPanel } from "../utils/ui.js";
import { GameState } from "../state/GameState.js";
import { EMERGENCIAS, CARTAS_MEJORA } from "../data/missionData.js";

export class SolLoopScene extends Phaser.Scene {
  constructor() {
    super("SolLoopScene");
  }

  create() {
    const estadoFin = GameState.verificarFinJuego();
    if (estadoFin.terminado) {
      this.renderPantallaFinal(estadoFin);
      return;
    }

    const titulosFase = {
      MAÑANA: `SOL ${GameState.sol} / 10 · FASE 1: MAÑANA (CONSOLA DE MANDO)`,
      DIA: `SOL ${GameState.sol} / 10 · FASE 2: DÍA (TAREAS DE MANTENIMIENTO)`,
      EMERGENCIA: `SOL ${GameState.sol} / 10 · FASE 3: ¡ALERTA DE EMERGENCIA!`,
      NOCHE: `SOL ${GameState.sol} / 10 · FASE 4: NOCHE (AHORRO DE ENERGÍA)`,
      MEJORA: `SOL ${GameState.sol} / 10 · RECUERDO DESBLOQUEADO`,
    };

    const subtitulosFase = {
      MAÑANA: "La batería no alcanza para todo. Reparte los 6 núcleos de energía antes de iniciar el día.",
      DIA: "Completa los 3 minijuegos antes de que caiga la noche.",
      EMERGENCIA: "¡Peligro real detectado! Elige una acción antes de que el contador llegue a cero.",
      NOCHE: "Los paneles descansan. Si falta energía, las luces bajarán y usarás tu linterna.",
      MEJORA: "El robotcito IA desbloqueó un recuerdo histórico. Elige una carta de mejora.",
    };

    drawPanel(this, titulosFase[GameState.fase], subtitulosFase[GameState.fase]);
    this.dibujarBarraRecursos();

    switch (GameState.fase) {
      case "MAÑANA":
        this.renderManana();
        break;
      case "DIA":
        this.renderDia();
        break;
      case "EMERGENCIA":
        this.renderEmergencia();
        break;
      case "NOCHE":
        this.renderNoche();
        break;
      case "MEJORA":
        this.renderMejora();
        break;
    }

    this.aplicarEfectoHipoxia();
  }

  dibujarBarraRecursos() {
    const { energia, oxigeno, blindaje } = GameState.recursos;
    const items = [
      { label: `⚡ Energía: ${energia}/${GameState.energiaMaxima}`, val: energia / GameState.energiaMaxima, color: 0xfacc15, x: 210 },
      { label: `🫧 Oxígeno: ${oxigeno}/100`, val: oxigeno / 100, color: 0x38bdf8, x: 480 },
      { label: `🛡️ Blindaje: ${blindaje}/100`, val: blindaje / 100, color: 0x4ade80, x: 750 },
    ];

    items.forEach((item) => {
      this.add.rectangle(item.x, 140, 240, 36, 0x0f172a).setStrokeStyle(2, 0x334155);
      const fillWidth = Math.max(0, Math.min(232, Math.round(232 * item.val)));
      this.add.rectangle(item.x - 116 + fillWidth / 2, 140, fillWidth, 28, item.color, 0.28);
      addText(this, item.x, 140, item.label, 14, "#f8fafc");
    });
  }

  // Efecto visual si falta oxígeno (< 35%) y no tiene la carta "Entrenamiento de Astronauta"
  aplicarEfectoHipoxia() {
    if (GameState.recursos.oxigeno < 35 && !GameState.mejoras.entrenamiento) {
      const neblina = this.add.rectangle(480, 300, 960, 600, 0x94a3b8, 0.28).setDepth(90);
      this.tweens.add({
        targets: neblina,
        alpha: 0.45,
        duration: 1200,
        yoyo: true,
        repeat: -1,
      });
    }
  }

  // FASE 1: MAÑANA (Consola de mando)
  renderManana() {
    const sistemas = [
      { key: "paneles", nombre: "Colectores Solares", desc: "Más tiempo y +Energía al limpiar paneles" },
      { key: "soporteVital", nombre: "Soporte Vital (CO₂ + Jardín)", desc: "Más tiempo y +Oxígeno en filtro e invernadero" },
      { key: "escudos", nombre: "Escudos del Casco", desc: "Evita desgaste del blindaje (0 núcleos = -8 Blindaje)" },
    ];

    const getUsados = () =>
      GameState.asignacionEnergia.paneles +
      GameState.asignacionEnergia.soporteVital +
      GameState.asignacionEnergia.escudos;

    this.nucleosTxt = addText(this, 480, 185, "", 18, "#38bdf8");

    const filas = [];
    sistemas.forEach((sys, i) => {
      const y = 250 + i * 78;
      this.add.rectangle(480, y, 820, 64, 0x1e293b).setStrokeStyle(2, 0x475569);
      addText(this, 230, y - 10, sys.nombre, 16, "#ffffff");
      addText(this, 230, y + 14, sys.desc, 12, "#94a3b8");

      const barra = addText(this, 560, y, "", 18, "#4ade80");
      filas.push({ key: sys.key, barra });

      addButton(this, 710, y, "-", () => {
        if (GameState.asignacionEnergia[sys.key] > 0) {
          GameState.asignacionEnergia[sys.key]--;
          actualizar();
        }
      }, 48);

      addButton(this, 775, y, "+", () => {
        if (getUsados() < GameState.nucleosDisponibles && GameState.asignacionEnergia[sys.key] < 3) {
          GameState.asignacionEnergia[sys.key]++;
          actualizar();
        }
      }, 48);
    });

    const actualizar = () => {
      const libres = GameState.nucleosDisponibles - getUsados();
      this.nucleosTxt.setText(`Núcleos disponibles para repartir: ${libres} de ${GameState.nucleosDisponibles} (Demanda total: 9)`);
      filas.forEach((f) => {
        const val = GameState.asignacionEnergia[f.key];
        f.barra.setText(`${"⚡".repeat(val)}${"·".repeat(3 - val)} (${val}/3)`);
      });
    };
    actualizar();

    addButton(this, 480, 535, "CONFIRMAR ENERGÍA E IR AL DÍA", () => {
      if (GameState.asignacionEnergia.escudos === 0) GameState.modificarRecurso("blindaje", -8);
      if (GameState.asignacionEnergia.soporteVital === 0) GameState.modificarRecurso("oxigeno", -8);
      GameState.fase = "DIA";
      this.scene.restart();
    }, 340);
  }

  // FASE 2: DÍA (Los 3 minijuegos)
  renderDia() {
    const tareas = [
      { key: "paneles", titulo: "1. Limpiar Paneles Solares (Marte)", scene: "PanelCleaningScene" },
      { key: "co2", titulo: "2. Cambiar Filtro de CO₂ (Apolo 13)", scene: "CO2FilterScene" },
      { key: "invernadero", titulo: "3. Regar Invernadero (Flores Zinnia)", scene: "GreenhouseScene" },
    ];

    tareas.forEach((t, i) => {
      const y = 240 + i * 85;
      const listo = GameState.minijuegosHoy[t.key];
      const label = listo ? `✅ ${t.titulo} · COMPLETADO` : `🚀 ${t.titulo}`;

      const btn = addButton(this, 480, y, label, () => {
        if (!listo) this.scene.start(t.scene);
      }, 540);

      if (listo) {
        btn.txt.setColor("#86efac");
      }
    });

    const { paneles, co2, invernadero } = GameState.minijuegosHoy;
    if (paneles && co2 && invernadero) {
      addText(this, 480, 495, "¡Tareas del día terminadas! Preparando sensores de radar...", 16, "#fde047");
      this.time.delayedCall(1200, () => {
        GameState.fase = "EMERGENCIA";
        this.scene.restart();
      });
    }
  }

  // FASE 3: EMERGENCIA (Cuenta atrás y decisión con coste)
  renderEmergencia() {
    const evento = Phaser.Utils.Array.GetRandom(EMERGENCIAS);
    let tiempoRestante = GameState.getParametrosDificultad().tiempoEmergencia;

    this.add.rectangle(480, 340, 840, 340, 0x2b1215).setStrokeStyle(3, 0xef4444);
    addText(this, 480, 205, evento.titulo, 21, "#fca5a5");

    this.add.text(480, 248, evento.recuerdo, {
      fontSize: "13px",
      color: "#cbd5e1",
      align: "center",
      wordWrap: { width: 780 },
      fontFamily: "Inter, system-ui, -apple-system, sans-serif", resolution: 2
    }).setOrigin(0.5);

    addText(this, 480, 292, evento.alerta, 16, "#ffffff");
    const timerTxt = addText(this, 480, 330, `⏳ Tiempo para decidir: ${tiempoRestante} s`, 18, "#fde047");

    const tomarDecision = (opcion) => {
      if (this.decidido) return;
      this.decidido = true;
      timer.remove();
      opcion.aplicar(GameState);
      GameState.fase = "NOCHE";
      this.scene.restart();
    };

    const timer = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        tiempoRestante--;
        timerTxt.setText(`⏳ Tiempo para decidir: ${tiempoRestante} s`);
        if (tiempoRestante <= 0) {
          tomarDecision(evento.opcionB); // Si se acaba el tiempo, sufre el impacto sin escudo
        }
      },
    });

    addButton(this, 480, 395, evento.opcionA.texto, () => tomarDecision(evento.opcionA), 740);
    addButton(this, 480, 465, evento.opcionB.texto, () => tomarDecision(evento.opcionB), 740);
  }

  // FASE 4: NOCHE (Consumo nocturno + Visión limitada con linterna si falta energía)
  renderNoche() {
    let consumo = GameState.getParametrosDificultad().consumoNocturno;
    if (GameState.mejoras.codigoHamilton) {
      consumo = Math.max(4, Math.floor(consumo * 0.6));
    }

    GameState.modificarRecurso("energia", -consumo);
    this.dibujarBarraRecursos();

    const pocaEnergia = GameState.recursos.energia < 40;

    addText(
      this,
      480,
      230,
      `La noche cayó sobre la base. Consumo nocturno de sistemas: -${consumo} de Energía.`,
      17,
      "#93c5fd"
    );

    addText(
      this,
      480,
      275,
      pocaEnergia
        ? "🔦 ¡BATERÍA BAJA! Las luces de cabina se apagaron. Usa tu linterna para encontrar el botón."
        : "💡 La batería mantiene la cabina iluminada con normalidad.",
      15,
      pocaEnergia ? "#fde047" : "#86efac"
    );

    addButton(this, 480, 440, "AMANECER · CONTINUAR", () => {
      const fin = GameState.verificarFinJuego();
      if (fin.terminado) {
        this.scene.restart();
        return;
      }
      GameState.fase = "MEJORA";
      this.scene.restart();
    }, 300);

    // Visión limitada con linterna cuando falta energía (< 40)
    if (pocaEnergia) {
      const radio = GameState.mejoras.codigoHamilton ? 190 : 95;
      const oscuridad = this.add.rectangle(480, 300, 960, 600, 0x000000, 0.96).setDepth(50);

      const foco = this.make.graphics({ x: 480, y: 300, add: false });
      foco.fillStyle(0xffffff);
      foco.fillCircle(0, 0, radio);

      const mascara = foco.createGeometryMask();
      mascara.invertAlpha = true;
      oscuridad.setMask(mascara);

      this.input.on("pointermove", (pointer) => {
        foco.setPosition(pointer.worldX, pointer.worldY);
      });
    }
  }

  // SELECCIÓN DE CARTA DE MEJORA AL TERMINAR EL SOL
  renderMejora() {
    const disponibles = CARTAS_MEJORA.filter((c) => !GameState.mejoras[c.id]);

    const avanzarSiguienteSol = () => {
      GameState.sol++;
      const fin = GameState.verificarFinJuego();
      if (!fin.terminado) {
        GameState.prepararNuevoSol();
      }
      this.scene.restart();
    };

    if (disponibles.length === 0) {
      avanzarSiguienteSol();
      return;
    }

    const opciones = Phaser.Utils.Array.Shuffle([...disponibles]).slice(0, 2);

    opciones.forEach((carta, idx) => {
      const x = opciones.length === 1 ? 480 : 300 + idx * 360;
      this.add.rectangle(x, 325, 320, 230, 0x13382c).setStrokeStyle(3, 0x34d399);
      addText(this, x, 240, `🃏 ${carta.nombre}`, 16, "#6ee7b7");
      addText(this, x, 270, `Área: ${carta.rama}`, 13, "#a7f3d0");

      this.add.text(x, 325, carta.desc, {
        fontSize: "14px",
        color: "#ffffff",
        align: "center",
        wordWrap: { width: 280 },
        fontFamily: "Inter, system-ui, -apple-system, sans-serif", resolution: 2,
      }).setOrigin(0.5);

      addButton(this, x, 405, "EQUIPAR CARTA", () => {
        GameState.mejoras[carta.id] = true;
        avanzarSiguienteSol();
      }, 210);
    });
  }

  // CONDICIONES DE ÉXITO Y FRACASO
  renderPantallaFinal(resultado) {
    const textos = {
      VICTORIA: {
        titulo: "🏆 ¡VICTORIA! COMPLETASTE LOS 10 SOLES",
        cuerpo:
          "«¡Bip-hurra! ¡Lo logramos, equipo! Han pasado 10 soles enteros en este rincón del universo y seguimos aquí. No fue solo suerte: fue su curiosidad, su valentía y sus ganas de aprender lo que nos trajo hasta este amanecer. ¡Porque lo intentaron... lo lograron!»",
        color: "#4ade80",
      },
      ENERGIA: {
        titulo: "🪫 FIN DE LA MISIÓN · SE ACABÓ LA BATERÍA",
        cuerpo:
          "«¡Oh, no! Nos quedamos sin batería y mis circuitos entraron en modo descanso. Pero guardé todo lo que aprendimos en mi caja negra para intentarlo de nuevo. ¡La próxima vez lo lograremos!»",
        color: "#f87171",
      },
      OXIGENO: {
        titulo: "🫧 FIN DE LA MISIÓN · FALTÓ AIRE EN CABINA",
        cuerpo:
          "«El aire de la cabina se agotó y la tripulación tuvo que entrar en sueño espacial de emergencia. ¡Revisa bien los filtros y las plantas en tu siguiente intento!»",
        color: "#f87171",
      },
      BLINDAJE: {
        titulo: "🛡️ FIN DE LA MISIÓN · ESCUDO ROTO",
        cuerpo:
          "«El escudo de la nave recibió demasiados golpes del espacio y debemos regresar a reparar. ¡Ya sabes cómo enfrentar las tormentas espaciales, inténtalo otra vez!»",
        color: "#f87171",
      },
    };

    const info = textos[resultado.motivo];
    drawPanel(this, info.titulo, "Reporte final de la IA de la nave JIIMATZIN");

    this.add.text(480, 310, info.cuerpo, {
      fontSize: "17px",
      color: info.color,
      align: "center",
      wordWrap: { width: 780 },
      lineSpacing: 8,
      fontFamily: "Inter, system-ui, -apple-system, sans-serif", resolution: 2,
    }).setOrigin(0.5);

    addButton(this, 480, 480, "VOLVER A INTENTAR", () => {
      this.scene.start("CharacterSelectScene");
    }, 280);
  }
}