// src/scenes/CO2FilterScene.js
import { GameState } from "../state/GameState.js";
import { addText, addButton, drawPanel, createDaylightTracker, showAIMissionBriefing } from "../utils/ui.js";

export class CO2FilterScene extends Phaser.Scene {
  constructor() { super("CO2FilterScene"); }

  create() {
    const params = GameState.getParametrosDificultad();
    this.gameFinished = false;
    this.timeLeft = params.tiempoCO2;
    this.placed = new Set();

    drawPanel(
      this,
      `SOL ${GameState.sol} · MINIJUEGO 2: EL INVENTO DEL APOLO 13`,
      "Arrastra cartón, cinta y manguera hasta su zona para adaptar el filtro cuadrado al tubo redondo."
    );

    this.progress = addText(this, 310, 138, "🧩 Piezas colocadas: 0 / 3", 17, "#f8fafc");
    this.timerText = addText(this, 730, 138, `⏳ Tiempo: ${this.timeLeft} s`, 17, "#fde047");

    // Contenedores más altos (360px) con cabeceras internas
    this.add.rectangle(245, 355, 310, 365, 0x16223b).setStrokeStyle(2, 0x475569);
    this.add.rectangle(685, 355, 420, 365, 0x16223b).setStrokeStyle(2, 0x475569);
    addText(this, 245, 198, "PIEZAS DISPONIBLES", 16, "#93c5fd");
    addText(this, 685, 198, "ADAPTADOR DEL FILTRO", 16, "#93c5fd");

    const targets = [
      { id: "cardboard", x: 595, y: 275, label: "1 · CARTÓN (Embudo)" },
      { id: "tape", x: 775, y: 275, label: "2 · CINTA (Sellado)" },
      { id: "hose", x: 685, y: 425, label: "3 · MANGUERA (Tubo)" },
    ];

    targets.forEach((target) => {
      const zone = this.add.rectangle(target.x, target.y, 150, 74, 0x263554, 0.95)
        .setStrokeStyle(2, 0x94a3b8);
      zone.setData("pieceId", target.id);
      zone.setInteractive({ dropZone: true });
      // Etiqueta debajo de la caja sin pisar el borde
      addText(this, target.x, target.y + 52, target.label, 12, "#cbd5e1");
    });

    const pieces = [
      { id: "cardboard", x: 245, y: 265, color: 0xd99b52, label: "CARTÓN" },
      { id: "tape", x: 245, y: 355, color: 0xfde047, label: "CINTA" },
      { id: "hose", x: 245, y: 445, color: 0x38bdf8, label: "MANGUERA" },
    ];

    pieces.forEach((piece) => {
      const block = this.add.rectangle(piece.x, piece.y, 175, 56, piece.color)
        .setStrokeStyle(3, 0xffffff)
        .setInteractive({ draggable: true, useHandCursor: true });
      block.setData("pieceId", piece.id);
      const label = addText(this, piece.x, piece.y, piece.label, 15, "#0f172a");
      block.setData("labelObject", label);

      block.on("drag", (pointer, dragX, dragY) => {
        if (this.gameFinished) return;
        block.setPosition(dragX, dragY);
        label.setPosition(dragX, dragY);
      });
      block.on("dragend", () => {
        if (!this.placed.has(piece.id)) {
          block.setPosition(piece.x, piece.y);
          label.setPosition(piece.x, piece.y);
        }
      });
      this.input.setDraggable(block);
    });

    this.input.on("drop", (pointer, gameObject, dropZone) => {
      if (this.gameFinished) return;
      const pieceId = gameObject.getData("pieceId");
      const targetId = dropZone.getData("pieceId");
      if (pieceId === targetId && !this.placed.has(pieceId)) {
        this.placed.add(pieceId);
        dropZone.setFillStyle(0x15803d).setStrokeStyle(3, 0x4ade80);
        gameObject.disableInteractive();
        gameObject.setScale(0.82);
        gameObject.setPosition(dropZone.x, dropZone.y);
        gameObject.getData("labelObject").setPosition(dropZone.x, dropZone.y);
        this.progress.setText(`🧩 Piezas colocadas: ${this.placed.size} / 3`);
        if (this.placed.size === 3) this.endGame(true);
      } else {
        this.cameras.main.shake(120, 0.003);
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

    GameState.minijuegosHoy.co2 = true;
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
      ? "¡Lo lograste! El filtro quedó súper bien sellado y ya respiramos aire fresco otra vez."
      : `Solo colocaste ${this.placed.size} de 3 piezas. Se escapó gas malo en la cabina.`, {
      fontFamily: "Inter, system-ui, sans-serif",
      fontSize: "15px", color: "#ffffff", align: "center", wordWrap: { width: 560 },
    }).setOrigin(0.5).setDepth(22);

    const btn = addButton(this, 480, 395, "VOLVER A LA CONSOLA", () => {
      this.scene.start("SolLoopScene");
    }, 260);
    btn.bg.setDepth(22);
    btn.txt.setDepth(23);
  }
}