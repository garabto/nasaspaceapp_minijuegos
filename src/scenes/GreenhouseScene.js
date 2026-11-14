// src/scenes/GreenhouseScene.js
import { GameState } from "../state/GameState.js";
import { addText, addButton, drawPanel, createDaylightTracker, showAIMissionBriefing } from "../utils/ui.js";

export class GreenhouseScene extends Phaser.Scene {
  constructor() { super("GreenhouseScene"); }

  create() {
    const params = GameState.getParametrosDificultad();
    this.gameFinished = false;
    this.timeLeft = params.tiempoInvernadero;
    this.selectedPlant = 0;
    this.plants = [
      { name: "Zinnia 1", water: 0, mold: 0 },
      { name: "Zinnia 2", water: 0, mold: 0 },
      { name: "Zinnia 3", water: 0, mold: 0 },
    ];
    this.floatingDrops = 0;
    this.floatingBubbles = [];
    this.fanOn = false;

    drawPanel(
      this,
      `SOL ${GameState.sol} · MINIJUEGO 3: LAS FLORES ESPACIALES`,
      "Cada planta necesita 2 gotas. Si aparecen gotas flotando, enciende el ventilador."
    );

    this.instruction = addText(this, 340, 136, "🌱 Seleccionada: Zinnia 1 · Humedad: seca", 16, "#f8fafc");
    this.timerText = addText(this, 760, 136, `⏳ Tiempo: ${this.timeLeft} s`, 17, "#fde047");

    // Módulo de invernadero
    this.add.rectangle(480, 340, 810, 345, 0x112d2e).setStrokeStyle(3, 0x34d399);
    this.plantViews = [];

    this.plants.forEach((plant, index) => {
      const x = 250 + index * 230;
      const card = this.add.rectangle(x, 325, 190, 260, 0x193f3c).setStrokeStyle(2, 0x6ee7b7);

      // Maceta con borde superior
      this.add.rectangle(x, 392, 92, 48, 0x9a6248).setStrokeStyle(2, 0xd99b66);
      this.add.rectangle(x, 368, 102, 10, 0xb47658).setStrokeStyle(2, 0xd99b66);

      const stem = this.add.rectangle(x, 330, 9, 70, 0x4ade80);
      const flower = this.add.circle(x, 285, 34, [0xf472b6, 0xfacc15, 0xa78bfa][index]);
      this.add.circle(x, 285, 11, 0xfef08a, 0.9); // Centro de la flor
      this.add.ellipse(x - 22, 335, 40, 16, 0x4ade80).setRotation(-0.4);
      this.add.ellipse(x + 22, 342, 40, 16, 0x4ade80).setRotation(0.4);

      card.setInteractive({ useHandCursor: true }).on("pointerdown", () => this.selectPlant(index));

      const label = addText(this, x, 218, plant.name, 16, "#ffffff");
      const meter = addText(this, x, 435, "Humedad: seca", 13, "#a7f3d0");
      this.plantViews.push({ x, flower, stem, label, meter, card });
    });

    this.dropText = addText(this, 480, 486, "💧 Gotas flotando en gravedad cero: 0", 15, "#7dd3fc");

    addButton(this, 330, 552, "💧 Regar seleccionada", () => this.waterPlant(), 240);
    this.fanBtn = addButton(this, 630, 552, "🌀 Ventilador: APAGADO", () => this.toggleFan(), 255);

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
    this.updatePlantUI();

    this.maxTime = this.timeLeft;
    this.daylight = createDaylightTracker(this, this.maxTime);
    this.paused = true;    

    showAIMissionBriefing(this, "invernadero", () => {
      this.paused = false;
    });
  }

  selectPlant(index) {
    if (this.gameFinished) return;
    this.selectedPlant = index;
    this.updatePlantUI();
  }

  // Crea una gota cayendo hacia la maceta + una burbuja flotando en gravedad cero
  animarRiegoYBurbuja(x) {
    // 1. Gota cayendo desde arriba hacia la maceta
    const gotaCaida = this.add.circle(x, 225, 7, 0x38bdf8, 0.95).setStrokeStyle(2, 0xe0f2fe).setDepth(15);
    this.tweens.add({
      targets: gotaCaida,
      y: 365,
      scaleX: 0.8,
      scaleY: 1.3,
      duration: 320,
      ease: "Quad.easeIn",
      onComplete: () => {
        // Salpicadura al tocar la tierra
        const onda = this.add.ellipse(x, 366, 16, 6, 0x7dd3fc, 0.8).setDepth(15);
        this.tweens.add({
          targets: onda,
          scaleX: 2.8,
          alpha: 0,
          duration: 280,
          onComplete: () => onda.destroy(),
        });
        gotaCaida.destroy();
      },
    });

    // 2. Burbuja flotando en gravedad cero dentro del invernadero
    const bx = x + Phaser.Math.Between(-55, 55);
    const by = Phaser.Math.Between(240, 340);
    const burbuja = this.add.circle(bx, by, Phaser.Math.Between(8, 13), 0x38bdf8, 0.55)
      .setStrokeStyle(2, 0xbae6fd)
      .setDepth(14);
    const brillo = this.add.circle(bx - 3, by - 3, 3, 0xffffff, 0.85).setDepth(14);

    const contenedorGota = this.add.container(0, 0, [burbuja, brillo]).setDepth(14);
    this.tweens.add({
      targets: contenedorGota,
      y: Phaser.Math.Between(-24, -12),
      x: Phaser.Math.Between(-14, 14),
      duration: Phaser.Math.Between(1100, 1600),
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.floatingBubbles.push(contenedorGota);
  }

  limpiarBurbujasConViento() {
    // Ráfagas visuales del ventilador
    for (let i = 0; i < 6; i++) {
      const wy = 210 + i * 48;
      const lineaViento = this.add.rectangle(120, wy, 90, 3, 0xbae6fd, 0.65).setDepth(15);
      this.tweens.add({
        targets: lineaViento,
        x: 860,
        alpha: 0,
        duration: 500 + i * 40,
        ease: "Cubic.easeOut",
        onComplete: () => lineaViento.destroy(),
      });
    }

    // Absorbe todas las burbujas flotando
    this.floatingBubbles.forEach((b) => {
      this.tweens.add({
        targets: b,
        x: b.x + 180,
        scale: 0,
        alpha: 0,
        duration: 380,
        onComplete: () => b.destroy(),
      });
    });
    this.floatingBubbles = [];
  }

  waterPlant() {
    if (this.gameFinished) return;
    const plant = this.plants[this.selectedPlant];
    const view = this.plantViews[this.selectedPlant];

    this.animarRiegoYBurbuja(view.x);

    if (plant.water >= 2) {
      plant.mold++;
      this.floatingDrops++;
      this.cameras.main.shake(140, 0.003);
      spawnFloatingText(this, view.x, 250, "¡Exceso de agua! +Moho", "#fca5a5");
    } else {
      plant.water++;
      this.floatingDrops++;
      spawnFloatingText(this, view.x, 250, "+1 Gota 💧", "#7dd3fc");

      // Si hay 4 o más gotas flotando en el aire, la humedad provoca moho
      if (this.floatingDrops >= 4) {
        plant.mold++;
        this.cameras.main.shake(140, 0.003);
        spawnFloatingText(this, view.x, 225, "⚠️ ¡Mucha agua flotando! Usa el ventilador", "#fde047");
      }
    }

    // Si el ventilador estaba encendido, al volver a regar se apaga para que tengas que reactivarlo
    if (this.fanOn) {
      this.fanOn = false;
      this.fanBtn.txt.setText("🌀 Ventilador: APAGADO");
      this.fanBtn.bg.setFillStyle(0x4f46e5);
    }

    this.updatePlantUI();
    this.checkEnd();
  }

  toggleFan() {
    if (this.gameFinished) return;
    this.fanOn = !this.fanOn;
    this.fanBtn.txt.setText(this.fanOn ? "🌀 Ventilador: ENCENDIDO" : "🌀 Ventilador: APAGADO");
    this.fanBtn.bg.setFillStyle(this.fanOn ? 0x0284c7 : 0x4f46e5);

    if (this.fanOn) {
      if (this.floatingDrops > 0) {
        this.limpiarBurbujasConViento();
        spawnFloatingText(this, 480, 260, "¡Gotas despejadas! 🌀", "#bae6fd");
      }
      this.floatingDrops = 0;
      this.plants.forEach((plant) => {
        if (plant.mold > 0) plant.mold = Math.max(0, plant.mold - 1);
      });
    }
    this.updatePlantUI();
    this.checkEnd();
  }

  updatePlantUI() {
    const plant = this.plants[this.selectedPlant];
    const moisture = ["seca", "baja", "correcta", "exceso"][Math.min(plant.water, 3)];
    this.instruction.setText(`🌱 Seleccionada: ${plant.name} · Humedad: ${moisture}`);
    this.dropText.setText(`💧 Gotas flotando en gravedad cero: ${this.floatingDrops}`);

    this.plantViews.forEach((view, index) => {
      const p = this.plants[index];
      const text = p.mold > 0 ? "⚠️ ¡Cuidado: moho!" : `Humedad: ${["seca", "baja", "correcta", "exceso"][Math.min(p.water, 3)]}`;
      view.meter.setText(text);
      view.meter.setColor(p.mold > 0 ? "#fca5a5" : p.water === 2 ? "#4ade80" : "#a7f3d0");
      view.flower.setScale(p.mold > 0 ? 0.82 : 1 + p.water * 0.08);
      view.stem.setScale(1, 1 + p.water * 0.06);
      view.card.setStrokeStyle(index === this.selectedPlant ? 4 : 2, index === this.selectedPlant ? 0xfde047 : 0x6ee7b7);
    });
  }

  checkEnd() {
    const allWatered = this.plants.every((p) => p.water === 2);
    const moldTotal = this.plants.reduce((sum, p) => sum + p.mold, 0);
    if (allWatered && this.floatingDrops === 0 && this.fanOn && moldTotal === 0) {
      this.endGame(true);
    }
    if (moldTotal >= 3) this.endGame(false);
  }

  endGame(success) {
    if (this.gameFinished) return;
    this.gameFinished = true;

    GameState.minijuegosHoy.invernadero = true;
    const extraO2 = 15 + GameState.asignacionEnergia.soporteVital * 3 + (GameState.personaje === "margaret" ? 5 : 0);

    if (success) {
      GameState.modificarRecurso("oxigeno", extraO2);
    } else {
      GameState.modificarRecurso("oxigeno", -12);
    }

    this.add.rectangle(480, 300, 960, 600, 0x090d16, 0.85).setDepth(20);
    this.add.rectangle(480, 300, 640, 290, 0x16213e).setStrokeStyle(3, success ? 0x4ade80 : 0xf87171).setDepth(21);
    addText(this, 480, 200, success ? "¡JARDÍN SALUDABLE!" : "MOHO EN EL INVERNADERO", 22, success ? "#4ade80" : "#f87171").setDepth(22);
    addText(this, 480, 245, success ? `+${extraO2} de Oxígeno` : "-12 de Oxígeno", 18, "#fde047").setDepth(22);
    this.add.text(480, 305, success
      ? "¡Qué bonitas están! Nuestras plantas están sanas y llenando la nave de oxígeno puro."
      : "Cayó demasiada agua y salió moho. Tuvimos que gastar aire extra para limpiar el jardín.", {
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