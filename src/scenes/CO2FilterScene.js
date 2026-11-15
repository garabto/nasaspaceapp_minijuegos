// src/scenes/CO2FilterScene.js
import { GameState } from "../state/GameState.js";
import { addText, addButton, drawPanel, createDaylightTracker, showAIMissionBriefing, spawnFloatingText } from "../utils/ui.js";

export class CO2FilterScene extends Phaser.Scene {
  constructor() { super("CO2FilterScene"); }

  create() {
    const params = GameState.getParametrosDificultad();
    this.gameFinished = false;
    this.timeLeft = params.tiempoCO2;
    this.step = 0; // 0: cartón, 1: cinta, 2: manguera

    drawPanel(
      this,
      `SOL ${GameState.sol} · MINIJUEGO 2: EL INVENTO DEL APOLO 13`,
      "Adapta el filtro cuadrado al tubo redondo en orden: 1) Embudo · 2) Sellar fugas · 3) Conectar aire."
    );

    this.progress = addText(this, 310, 136, "🧩 Paso 1 de 3: Forma el embudo", 16, "#f8fafc");
    this.timerText = addText(this, 750, 136, `⏳ Tiempo: ${this.timeLeft} s`, 17, "#fde047");

    // Panel izquierdo: Herramientas y materiales de la cabina
    this.add.rectangle(235, 360, 330, 385, 0x16223b).setStrokeStyle(2, 0x475569);
    addText(this, 235, 190, "MATERIALES EN CABINA", 15, "#93c5fd");

    // Panel derecho: Esquema del Filtro Cuadrado -> Tubo Redondo
    this.add.rectangle(675, 360, 470, 385, 0x16223b).setStrokeStyle(2, 0x475569);
    addText(this, 675, 190, "ACOPLAMIENTO DE AIRE", 15, "#93c5fd");

    // --- Dibujo de la máquina derecha ---
    // 1. Filtro cuadrado de hidróxido de litio (arriba)
    this.add.rectangle(675, 252, 175, 58, 0x475569).setStrokeStyle(3, 0x94a3b8);
    this.add.rectangle(675, 252, 145, 34, 0x1e293b);
    addText(this, 675, 252, "FILTRO CUADRADO", 12, "#e2e8f0");

    // 2. Ducto redondo de la nave
    this.add.circle(675, 448, 36, 0x334155).setStrokeStyle(3, 0x94a3b8);
    this.add.circle(675, 448, 22, 0x0f172a).setStrokeStyle(2, 0x38bdf8);
    addText(this, 675, 495, "DUCTO REDONDO", 11, "#94a3b8");

    // Zona central de montaje (dropZone)
    this.dropZone = this.add.rectangle(675, 348, 210, 115, 0x1e293b, 0.85)
      .setStrokeStyle(2, 0x64748b);
    this.dropZone.setInteractive({ dropZone: true });

    // Barra de instrucciones fija abajo para que las piezas nunca la tapen
    this.add.rectangle(675, 532, 410, 28, 0x0f172a, 0.9).setStrokeStyle(1, 0x334155);
    this.zoneHint = addText(this, 675, 532, "👉 Arrastra al centro: 1. El embudo de cartón", 13, "#fde047");

    // Capas visuales que aparecen al ensamblar cada pieza
    this.visualCardboard = this.add.polygon(675, 330, [0, 0, 165, 0, 125, 62, 40, 62], 0xd99b52)
      .setStrokeStyle(2, 0xfef08a).setVisible(false);
    this.visualTape = this.add.rectangle(675, 302, 174, 14, 0x94a3b8)
      .setStrokeStyle(2, 0xf8fafc).setVisible(false);
    this.visualHose = this.add.rectangle(675, 390, 36, 66, 0x38bdf8)
      .setStrokeStyle(3, 0xe0f2fe).setVisible(false);

    // Humo verde de fuga de CO2 mientras no esté sellado
    this.time.addEvent({
      delay: 350,
      loop: true,
      callback: () => {
        if (this.gameFinished || this.paused || this.step >= 3) return;
        const gas = this.add.circle(675 + Phaser.Math.Between(-50, 50), 330, Phaser.Math.Between(5, 9), 0x4ade80, 0.55);
        this.tweens.add({
          targets: gas,
          x: gas.x + Phaser.Math.Between(-65, 65),
          y: gas.y + Phaser.Math.Between(-45, 45),
          alpha: 0,
          scale: 1.8,
          duration: 750,
          onComplete: () => gas.destroy(),
        });
      },
    });

    // --- 5 Piezas arrastrables (3 útiles + 2 distractores) ---
    const piezas = [
      { id: "cardboard", x: 165, y: 265, nombre: "Cartón de manual",  dibujo: "carton" },
      { id: "wrench",    x: 305, y: 265, nombre: "Llave inglesa",     dibujo: "llave" },
      { id: "tape",      x: 165, y: 365, nombre: "Cinta espacial",    dibujo: "cinta" },
      { id: "wire",      x: 305, y: 365, nombre: "Cable suelto",      dibujo: "cable" },
      { id: "hose",      x: 235, y: 465, nombre: "Manguera flexible", dibujo: "manguera" },
    ];

    piezas.forEach((p) => {
      const container = this.add.container(p.x, p.y).setSize(124, 78);
      const bg = this.add.rectangle(0, 0, 124, 78, 0x243454).setStrokeStyle(2, 0x64748b);
      container.add(bg);

      // Dibujo geométrico centrado de cada pieza
      if (p.dibujo === "carton") {
        container.add(this.add.rectangle(0, -14, 52, 14, 0xd99b52).setStrokeStyle(2, 0xfde68a));
        container.add(this.add.rectangle(0, -2, 36, 14, 0xb47638).setStrokeStyle(2, 0xfde68a));
      } else if (p.dibujo === "cinta") {
        container.add(this.add.circle(0, -8, 16, 0xcbd5e1).setStrokeStyle(3, 0xf8fafc));
        container.add(this.add.circle(0, -8, 7, 0x1e293b));
      } else if (p.dibujo === "manguera") {
        container.add(this.add.rectangle(0, -8, 48, 16, 0x38bdf8).setStrokeStyle(2, 0xe0f2fe));
        container.add(this.add.rectangle(-12, -8, 4, 16, 0x0284c7));
        container.add(this.add.rectangle(0, -8, 4, 16, 0x0284c7));
        container.add(this.add.rectangle(12, -8, 4, 16, 0x0284c7));
      } else if (p.dibujo === "llave") {
        container.add(this.add.rectangle(0, -8, 44, 10, 0x94a3b8));
        container.add(this.add.circle(-20, -8, 9, 0x94a3b8));
        container.add(this.add.circle(20, -8, 9, 0x94a3b8));
      } else if (p.dibujo === "cable") {
        container.add(this.add.rectangle(0, -8, 42, 6, 0xf87171));
        container.add(this.add.rectangle(-22, -8, 8, 8, 0xfacc15));
        container.add(this.add.rectangle(22, -8, 8, 8, 0xfacc15));
      }

      const txt = addText(this, 0, 22, p.nombre, 11, "#f8fafc");
      container.add(txt);

      container.setData("pieceId", p.id);
      container.setData("originX", p.x);
      container.setData("originY", p.y);
      container.setData("bg", bg);
      container.setInteractive({ draggable: true, useHandCursor: true });

      container.on("drag", (pointer, dragX, dragY) => {
        if (this.gameFinished) return;
        container.setDepth(10).setPosition(dragX, dragY);
      });

      container.on("dragend", () => {
        if (container.input?.enabled) {
          container.setDepth(1).setPosition(container.getData("originX"), container.getData("originY"));
        }
      });

      this.input.setDraggable(container);
    });

    // Lógica de ensamblaje paso a paso
    const ordenEsperado = ["cardboard", "tape", "hose"];

    this.input.on("drop", (pointer, gameObject, dropZone) => {
      if (this.gameFinished || dropZone !== this.dropZone) return;
      const pieceId = gameObject.getData("pieceId");
      const esperado = ordenEsperado[this.step];

      if (pieceId === esperado) {
        gameObject.disableInteractive().setVisible(false);
        this.step++;

        if (this.step === 1) {
          this.visualCardboard.setVisible(true);
          this.zoneHint.setText("👉 Siguiente paso: 2. Sella con cinta espacial");
          this.progress.setText("🧩 Paso 2 de 3: Sella con cinta");
          spawnFloatingText(this, 675, 310, "¡Embudo listo!", "#fde047");
        } else if (this.step === 2) {
          this.visualTape.setVisible(true);
          this.zoneHint.setText("👉 Último paso: 3. Conecta la manguera flexible");
          this.progress.setText("🧩 Paso 3 de 3: Conecta el aire");
          spawnFloatingText(this, 675, 310, "¡Unión sellada!", "#7dd3fc");
        } else if (this.step === 3) {
          this.visualHose.setVisible(true);
          this.zoneHint.setText("✅ ¡Fuga sellada! Aire limpio circulando").setColor("#4ade80");
          this.dropZone.setStrokeStyle(3, 0x4ade80);
          this.progress.setText("🧩 ¡Adaptador Mailbox completado!");
          this.time.delayedCall(450, () => this.endGame(true));
        }
      } else {
        this.cameras.main.shake(150, 0.004);
        this.timeLeft = Math.max(1, this.timeLeft - 3);
        this.timerText.setText(`⏳ Tiempo: ${this.timeLeft} s`);
        const msg = ordenEsperado.includes(pieceId)
          ? "⚠️ ¡Primero arma el paso anterior!"
          : "❌ ¡Esa pieza no sella el aire! (-3s)";
        spawnFloatingText(this, 675, 348, msg, "#fca5a5");
      }
    });

    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (this.gameFinished || this.paused) return;
        this.timeLeft--;
        this.timerText.setText(`⏳ Tiempo: ${this.timeLeft} s`);
        this.daylight.update(this.timeLeft);
        if (this.timeLeft <= 0) this.endGame(false);
      },
    });

    this.maxTime = this.timeLeft;
    this.daylight = createDaylightTracker(this, this.maxTime);
    this.paused = true;

    showAIMissionBriefing(this, "co2", () => {
      this.paused = false;
    });
  }

  endGame(success) {
    if (this.gameFinished) return;
    this.gameFinished = true;

    GameState.minijuegosHoy.co2 = success ? "ganado" : "fallido";
    const extraO2 = 15 + GameState.asignacionEnergia.soporteVital * 3 + (GameState.personaje === "atlas" ? 5 : 0);

    if (success) {
      GameState.modificarRecurso("oxigeno", extraO2);
    } else {
      GameState.modificarRecurso("oxigeno", -15);
    }

    this.add.rectangle(480, 300, 960, 600, 0x090d16, 0.85).setDepth(20);
    this.add.rectangle(480, 300, 640, 290, 0x16213e).setStrokeStyle(3, success ? 0x4ade80 : 0xf87171).setDepth(21);
    addText(this, 480, 200, success ? "¡FILTRO SELLADO!" : "FUGA DE CO₂", 22, success ? "#4ade80" : "#f87171").setDepth(22);
    addText(this, 480, 245, success ? `+${extraO2} de Oxígeno` : "-15 de Oxígeno", 18, "#fde047").setDepth(22);
    this.add.text(480, 305, success
      ? "¡Lo lograste! El adaptador quedó súper bien sellado y ya respiramos aire fresco otra vez."
      : `Solo completaste ${this.step} de 3 pasos. Se escapó gas malo en la cabina.`, {
      fontFamily: "Inter, system-ui, sans-serif",
      fontSize: "15px", color: "#ffffff", align: "center", wordWrap: { width: 560 },
      resolution: 2,
    }).setOrigin(0.5).setDepth(22);

    const btn = addButton(this, 480, 395, "VOLVER A LA CONSOLA", () => {
      this.scene.start("SolLoopScene");
    }, 260);
    btn.bg.setDepth(22);
    btn.txt.setDepth(23);
  }
}