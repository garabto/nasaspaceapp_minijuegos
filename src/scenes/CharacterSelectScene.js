// src/scenes/CharacterSelectScene.js
import { addText, addButton, drawPanel } from "../utils/ui.js";
import { PERSONAJES } from "../data/missionData.js";
import { GameState } from "../state/GameState.js";

export class CharacterSelectScene extends Phaser.Scene {
  constructor() {
    super("CharacterSelectScene");
  }

  create() {
    this.selectedChar = "wenceslao";
    this.selectedDiff = "normal";

    drawPanel(
      this,
      "PREPARACIÓN DE LA MISIÓN · 10 SOLES",
      "Elige a tu especialista y el nivel de dificultad para sobrevivir los 10 soles."
    );

    this.charCards = [];
    PERSONAJES.forEach((p, idx) => {
      const x = 210 + idx * 270;
      const card = this.add.rectangle(x, 265, 245, 175, 0x16223b)
        .setStrokeStyle(2, 0x3b5284)
        .setInteractive({ useHandCursor: true });

      card.on("pointerdown", () => {
        this.selectedChar = p.id;
        this.actualizarSeleccion();
      });

      addText(this, x, 205, p.nombre, 16, "#ffffff");
      addText(this, x, 232, p.rol, 12, "#93c5fd");
      this.add.text(x, 288, p.bonusTexto, {
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        fontSize: "13px",
        color: "#cbd5e1",
        align: "center",
        wordWrap: { width: 215 },
        resolution: 2,
      }).setOrigin(0.5);

      this.charCards.push({ id: p.id, card });
    });

    this.saludoIA = this.add.text(480, 392, "", {
      fontFamily: "Inter, system-ui, -apple-system, sans-serif",
      fontSize: "14px",
      color: "#fde047",
      align: "center",
      wordWrap: { width: 820 },
      resolution: 2,
    }).setOrigin(0.5);

    addText(this, 480, 442, "Dificultad de la misión:", 15, "#ffffff");

    const diffs = [
      { id: "facil", label: "Cadete (Fácil)" },
      { id: "normal", label: "Explorador (Normal)" },
      { id: "dificil", label: "Comandante (Difícil)" },
    ];

    this.diffButtons = [];
    diffs.forEach((d, idx) => {
      const x = 250 + idx * 230;
      const btn = addButton(this, x, 482, d.label, () => {
        this.selectedDiff = d.id;
        this.actualizarSeleccion();
      }, 205);
      this.diffButtons.push({ id: d.id, btn });
    });

    addButton(this, 480, 550, "DESPEGAR AL SOL 1", () => {
      GameState.iniciarPartida(this.selectedChar, this.selectedDiff);
      this.scene.start("SolLoopScene");
    }, 280);

    this.actualizarSeleccion();
  }

  actualizarSeleccion() {
    const actual = PERSONAJES.find((p) => p.id === this.selectedChar);
    this.saludoIA.setText(`IA de la Nave: «${actual.saludo}»`);

    this.charCards.forEach((item) => {
      const activo = item.id === this.selectedChar;
      item.card.setStrokeStyle(activo ? 4 : 2, activo ? 0x4ade80 : 0x3b5284);
      item.card.setFillStyle(activo ? 0x1e3356 : 0x16223b);
    });

    this.diffButtons.forEach((item) => {
      const activo = item.id === this.selectedDiff;
      item.btn.txt.setColor(activo ? "#4ade80" : "#ffffff");
    });
  }
}