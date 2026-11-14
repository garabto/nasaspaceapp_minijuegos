// src/scenes/PanelCleaningScene.js
import { addText, addButton, drawPanel, createDaylightTracker, showAIMissionBriefing } from "../utils/ui.js";
import { GameState } from "../state/GameState.js";

export class PanelCleaningScene extends Phaser.Scene {
  constructor() { super("PanelCleaningScene"); }

  create() {
    const params = GameState.getParametrosDificultad();
    this.gameFinished = false;
    this.totalDust = params.cantidadPolvo;
    this.goalDust = params.metaPolvo;
    this.cleaned = 0;
    this.timeLeft = params.tiempoPaneles;

    drawPanel(
      this,
      `SOL ${GameState.sol} · MINIJUEGO 1: LOS REMOLINOS MÁGICOS DE MARTE`,
      `Retira al menos ${this.goalDust} de ${this.totalDust} cúmulos de polvo antes de que anochezca.`
    );

    // Marco metálico y celdas del panel solar
    this.add.rectangle(480, 330, 716, 316, 0x0f172a).setStrokeStyle(4, 0x94a3b8);
    this.add.rectangle(480, 330, 700, 300, 0x163a63).setStrokeStyle(3, 0x60a5fa);

    const grid = this.add.graphics();
    grid.lineStyle(2, 0x3b82f6, 0.45);
    for (let i = 1; i < 7; i++) {
      const lx = 130 + i * 100;
      grid.lineBetween(lx, 180, lx, 480);
    }
    for (let i = 1; i < 3; i++) {
      const ly = 180 + i * 100;
      grid.lineBetween(130, ly, 830, ly);
    }

    this.statusText = addText(this, 310, 142, `🧹 Polvo retirado: 0 / ${this.goalDust}`, 17, "#f8fafc");
    this.timerText = addText(this, 730, 142, `⏳ Tiempo: ${this.timeLeft} s`, 17, "#fde047");

    // Luz indicadora + botón de vibración
    this.ledLuz = this.add.circle(315, 538, 10, 0xef4444).setStrokeStyle(2, 0xffffff);
    this.vibButton = addButton(this, 500, 538, "Vibración: espera luz verde", () => this.useVibration(), 310);
    this.vibrationReady = false;

    this.dustGroup = this.add.group();
    for (let i = 0; i < this.totalDust; i++) {
      const x = Phaser.Math.Between(160, 800);
      const y = Phaser.Math.Between(205, 455);
      const size = Phaser.Math.Between(13, 21);
      const dust = this.add.circle(x, y, size, Phaser.Utils.Array.GetRandom([0xb86b3d, 0xd18a4d, 0x9f5b3c]), 0.92)
        .setStrokeStyle(2, 0xfdba74)
        .setInteractive({ useHandCursor: true });
      dust.on("pointerdown", () => this.cleanDust(dust));
      this.dustGroup.add(dust);
    }

    // Barra solar + penumbra al anochecer
    this.maxTime = this.timeLeft;
    this.daylight = createDaylightTracker(this, this.maxTime);
    this.paused = true;

    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (this.gameFinished || this.paused) return;
        this.timeLeft--;
        this.timerText.setText(`⏳ Tiempo: ${this.timeLeft} s`);
        this.daylight.update(this.timeLeft);
        if (this.timeLeft <= 0) this.endGame();
      },
    });

    this.time.addEvent({
      delay: 4500,
      loop: true,
      callback: () => {
        if (this.gameFinished || this.paused) return;
        this.vibrationReady = true;
        this.ledLuz.setFillStyle(0x22c55e);
        this.vibButton.bg.setFillStyle(0x15803d);
        this.vibButton.txt.setText("¡LUZ VERDE! Pulsa vibración");
        this.time.delayedCall(1700, () => {
          if (!this.gameFinished && this.vibrationReady) {
            this.vibrationReady = false;
            this.ledLuz.setFillStyle(0xef4444);
            this.vibButton.bg.setFillStyle(0x4f46e5);
            this.vibButton.txt.setText("Vibración: espera luz verde");
          }
        });
      },
    });

    // Tarjeta inicial de la IA (pausa el reloj hasta cerrarla)
    showAIMissionBriefing(this, "paneles", () => {
      this.paused = false;
    });
  }

  cleanDust(dust) {
    if (this.gameFinished || this.paused || !dust.active) return;
    dust.disableInteractive();
    this.tweens.add({
      targets: dust, alpha: 0, scale: 1.8, duration: 180,
      onComplete: () => dust.destroy(),
    });
    this.cleaned++;
    this.statusText.setText(`🧹 Polvo retirado: ${this.cleaned} / ${this.goalDust}`);
    if (this.cleaned >= this.goalDust) this.endGame();
  }

  useVibration() {
    if (this.gameFinished || this.paused) return;
    if (!this.vibrationReady) {
      this.cameras.main.shake(100, 0.002);
      return;
    }

    this.vibrationReady = false;
    this.ledLuz.setFillStyle(0xef4444);
    this.vibButton.bg.setFillStyle(0x4f46e5);
    this.vibButton.txt.setText("Vibración: espera luz verde");

    this.cameras.main.shake(220, 0.006);

    const remaining = this.dustGroup.getChildren().filter((item) => item.active);
    const eliminados = remaining.slice(0, 5);

    eliminados.forEach((item) => {
      item.disableInteractive();
      this.tweens.add({
        targets: item,
        y: item.y + 25,
        alpha: 0,
        scale: 1.5,
        duration: 220,
        onComplete: () => item.destroy(),
      });
      this.cleaned++;
    });

    const aviso = this.add.text(480, 320, `⚡ ¡VIBRACIÓN! -${eliminados.length} cúmulos`, {
      fontFamily: "Inter, system-ui, sans-serif",
      fontSize: "20px",
      color: "#4ade80",
      fontStyle: "bold",
      resolution: 2,
    }).setOrigin(0.5).setDepth(30);

    this.tweens.add({
      targets: aviso,
      y: 270,
      alpha: 0,
      duration: 850,
      onComplete: () => aviso.destroy(),
    });

    this.statusText.setText(`🧹 Polvo retirado: ${this.cleaned} / ${this.goalDust}`);
    if (this.cleaned >= this.goalDust) this.endGame();
  }

  endGame() {
    if (this.gameFinished) return;
    this.gameFinished = true;
    const success = this.cleaned >= this.goalDust;

    GameState.minijuegosHoy.paneles = true;
    let textoResultado = "";

    if (success) {
      const extraEnergia = 15 + GameState.asignacionEnergia.paneles * 4 + (GameState.personaje === "wenceslao" ? 5 : 0);
      GameState.modificarRecurso("energia", extraEnergia);
      textoResultado = `+${extraEnergia} de Energía`;

      if (GameState.mejoras.ladrillosPolvo) {
        GameState.modificarRecurso("blindaje", 15);
        textoResultado += " y +15 de Blindaje (Ladrillos de Polvo)";
      }
    } else {
      GameState.modificarRecurso("energia", -12);
      textoResultado = "-12 de Energía";
    }

    this.mostrarResumenYVolver(
      success,
      textoResultado,
      success
        ? "¡Genial! Los paneles brillan otra vez y la batería está cargando."
        : `Quedó mucho polvo en los paneles (${this.cleaned}/${this.goalDust}). Esta noche tendremos poca batería.`
    );
  }

  mostrarResumenYVolver(success, reward, message) {
    this.add.rectangle(480, 300, 960, 600, 0x090d16, 0.85).setDepth(20);
    this.add.rectangle(480, 300, 640, 290, 0x16213e).setStrokeStyle(3, success ? 0x4ade80 : 0xf87171).setDepth(21);
    addText(this, 480, 200, success ? "¡TAREA COMPLETADA!" : "TAREA INCOMPLETA", 22, success ? "#4ade80" : "#f87171").setDepth(22);
    addText(this, 480, 245, reward, 18, "#fde047").setDepth(22);
    this.add.text(480, 305, message, {
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