// src/main.js
import { MenuScene } from "./scenes/MenuScene.js";
import { CharacterSelectScene } from "./scenes/CharacterSelectScene.js";
import { SolLoopScene } from "./scenes/SolLoopScene.js";
import { PanelCleaningScene } from "./scenes/PanelCleaningScene.js";
import { CO2FilterScene } from "./scenes/CO2FilterScene.js";
import { GreenhouseScene } from "./scenes/GreenhouseScene.js";

if (!window.Phaser) {
  document.querySelector("#game-container").innerHTML =
    '<p style="padding:24px;color:#fff">No se encontró Phaser. Revisa vendor/phaser.js.</p>';
  throw new Error("Phaser no está cargado.");
}

const config = {
  type: Phaser.AUTO,
  parent: "game-container",
  width: 1920,
  height: 1200,
  backgroundColor: "#090e1a",
  render: {
    antialias: true,
    roundPixels: true,
    powerPreference: "high-performance",
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    activePointers: 2,
  },
  scene: [
    MenuScene,
    CharacterSelectScene,
    SolLoopScene,
    PanelCleaningScene,
    CO2FilterScene,
    GreenhouseScene,
  ],
};

new Phaser.Game(config);