// src/utils/ui.js
export function addText(scene, x, y, text, size = 16, color = "#ffffff", align = "center") {
  return scene.add.text(x, y, text, {
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    fontSize: `${size}px`,
    color,
    align,
    resolution: 2,
  }).setOrigin(0.5);
}

export function addButton(scene, x, y, label, onClick, width = 260, height = 46) {
  const bg = scene.add.rectangle(x, y, width, height, 0x4f46e5)
    .setStrokeStyle(2, 0x818cf8)
    .setInteractive({ useHandCursor: true });

  const txt = addText(scene, x, y, label, 15, "#ffffff");

  bg.on("pointerover", () => {
    bg.setFillStyle(0x6366f1);
    bg.setScale(1.02);
    txt.setScale(1.02);
  });

  bg.on("pointerout", () => {
    bg.setFillStyle(0x4f46e5);
    bg.setScale(1);
    txt.setScale(1);
  });

  bg.on("pointerdown", () => {
    bg.setFillStyle(0x3730a3);
    onClick();
  });

  return { bg, txt };
}

export function spawnFloatingText(scene, x, y, message, color = "#4ade80") {
  const txt = addText(scene, x, y, message, 17, color).setDepth(60);
  scene.tweens.add({
    targets: txt,
    y: y - 42,
    alpha: 0,
    duration: 850,
    ease: "Cubic.easeOut",
    onComplete: () => txt.destroy(),
  });
}

export function drawPanel(scene, title, subtitle) {
  // Mantiene tus coordenadas 960x600 intactas sobre el lienzo HD 1920x1200
  scene.cameras.main.setZoom(2);
  scene.cameras.main.centerOn(480, 300);

  // Fondo + estrellas dibujadas en un único objeto Graphics (cero lag)
  const bg = scene.add.graphics();
  bg.fillStyle(0x090e1a, 1);
  bg.fillRect(0, 0, 960, 600);

  for (let i = 0; i < 40; i++) {
    const sx = (i * 197) % 960;
    const sy = (i * 131) % 600;
    const alpha = ((i % 3) + 1) * 0.16;
    bg.fillStyle(0xffffff, alpha);
    bg.fillCircle(sx, sy, (i % 2) + 1);
  }

  // Cabecera superior limpa
  scene.add.rectangle(480, 56, 890, 82, 0x131d33, 0.95)
    .setStrokeStyle(2, 0x334b7a);

  addText(scene, 480, 39, title, 19, "#f8fafc");
  addText(scene, 480, 70, subtitle, 13, "#93c5fd");
}

export function finishGame(scene, data) {
  scene.scene.start("SolLoopScene", data);
}

// Agregar al final de src/utils/ui.js
import { MINIJUEGOS_INFO } from "../data/missionData.js";
import { GameState } from "../state/GameState.js";

export function createDaylightTracker(scene, totalSeconds) {
  // Barra visual de luz solar arriba a la derecha (debajo del reloj)
  scene.add.rectangle(745, 162, 170, 8, 0x1e293b).setStrokeStyle(1, 0x475569);
  const bar = scene.add.rectangle(661, 162, 168, 6, 0xfacc15).setOrigin(0, 0.5);
  const label = addText(scene, 635, 162, "☀️", 12, "#fde047");

  // Capa de penumbra nocturna que aparece conforme cae la noche
  const nightShade = scene.add.rectangle(480, 300, 960, 600, 0x040711, 0).setDepth(12);

  return {
    update(timeLeft) {
      const ratio = Math.max(0, Math.min(1, timeLeft / totalSeconds));
      bar.width = 168 * ratio;

      if (ratio > 0.5) {
        bar.setFillStyle(0xfacc15); // Día soleado
        label.setText("☀️");
        nightShade.setAlpha(0);
      } else if (ratio > 0.25) {
        bar.setFillStyle(0xf97316); // Atardecer naranja
        label.setText("🌇");
        nightShade.setAlpha((0.5 - ratio) * 0.45);
      } else {
        bar.setFillStyle(0x818cf8); // Anocheciendo
        label.setText("🌙");
        nightShade.setAlpha(0.12 + (0.25 - ratio) * 1.1);
      }
    },
  };
}

export function showAIMissionBriefing(scene, minigameKey, onStart) {
  const info = MINIJUEGOS_INFO[minigameKey];
  const consejo = info.consejos[GameState.personaje] || Object.values(info.consejos)[0];

  const overlay = scene.add.rectangle(480, 300, 960, 600, 0x060a14, 0.88).setDepth(40);
  const box = scene.add.rectangle(480, 300, 780, 390, 0x111c33)
    .setStrokeStyle(3, 0x38bdf8)
    .setDepth(41);

  // Espacio reservado a la izquierda para cuando integren el sprite del robotcito IA
  const avatarSlot = scene.add.rectangle(165, 235, 96, 96, 0x0b1324)
    .setStrokeStyle(2, 0x38bdf8)
    .setDepth(42);
  const avatarTxt = addText(scene, 165, 235, "🤖\nIA NAVE", 14, "#7dd3fc").setDepth(43);

  const t1 = addText(scene, 515, 145, info.archivo, 15, "#38bdf8").setDepth(42);

  const t2 = scene.add.text(515, 200, info.recuerdo, {
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    fontSize: "13px",
    color: "#cbd5e1",
    align: "center",
    wordWrap: { width: 550 },
    resolution: 2,
  }).setOrigin(0.5).setDepth(42);

  const t3 = scene.add.text(515, 275, info.mensajeIA, {
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    fontSize: "14px",
    color: "#ffffff",
    align: "center",
    wordWrap: { width: 550 },
    resolution: 2,
  }).setOrigin(0.5).setDepth(42);

  const tipBg = scene.add.rectangle(480, 355, 710, 56, 0x172a46)
    .setStrokeStyle(1, 0x4ade80)
    .setDepth(42);
  const t4 = scene.add.text(480, 355, consejo, {
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    fontSize: "13px",
    color: "#86efac",
    align: "center",
    wordWrap: { width: 680 },
    resolution: 2,
  }).setOrigin(0.5).setDepth(43);

  const elements = [overlay, box, avatarSlot, avatarTxt, t1, t2, t3, tipBg, t4];

  const btn = addButton(scene, 480, 440, "¡ENTENDIDO, EMPEZAR TAREA!", () => {
    elements.forEach((el) => el.destroy());
    btn.bg.destroy();
    btn.txt.destroy();
    onStart();
  }, 300, 46);
  btn.bg.setDepth(42);
  btn.txt.setDepth(43);
}