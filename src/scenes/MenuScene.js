// src/scenes/MenuScene.js
import { addText, addButton, drawPanel } from "../utils/ui.js";
import { cargarDataset } from "../data/datasetAdapter.js";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  async create() {
    drawPanel(
      this,
      "MISIÓN JIIMATZIN · EXPEDICIÓN ESPACIAL",
      "Sobrevive 10 soles gestionando energía, oxígeno y blindaje junto a la IA de la nave."
    );

    addText(this, 480, 185, "🚀 Tres especialistas · Cuatro fases por Sol · Emergencias reales", 17, "#e2e8f0");

    this.add.rectangle(480, 310, 720, 150, 0x16223b, 0.9).setStrokeStyle(2, 0x3b5284);
    addText(this, 480, 265, "1. Mañana: Reparte tus 6 núcleos de energía en la consola de mando.", 14, "#cbd5e1");
    addText(this, 480, 295, "2. Día: Limpia paneles, adapta el filtro de CO₂ y cuida el invernadero.", 14, "#cbd5e1");
    addText(this, 480, 325, "3. Emergencia: Toma decisiones críticas bajo presión antes de que acabe el tiempo.", 14, "#cbd5e1");
    addText(this, 480, 355, "4. Noche: Sobrevive al consumo nocturno (y usa tu linterna si falta batería).", 14, "#cbd5e1");

    // Indicador de carga del dataset real de la NASA
    const statusText = addText(
      this,
      480,
      410,
      "📡 Sincronizando telemetría Curiosity & DONKI...",
      13,
      "#94a3b8"
    );

    // Iniciamos la carga en paralelo mientras el usuario lee el menú
    const datasetPromise = cargarDataset();

    addButton(this, 480, 465, "INICIAR MISIÓN DE 10 SOLES", async () => {
      // Garantiza que los 4 JSON estén listos incluso si el usuario da clic de inmediato
      await datasetPromise;
      this.scene.start("CharacterSelectScene");
    }, 340, 54);

    // Cuando termine la descarga, actualiza el estado visual
    await datasetPromise;
    statusText.setText("✅ Telemetría espacial conectada (10 soles listos)").setColor("#34d399");
  }
}