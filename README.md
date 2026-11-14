# JIIMATZIN — prototipo de minijuegos

Este proyecto contiene **solo los tres minijuegos**, en escenas independientes de Phaser. Incluye un menú de pruebas para abrirlos sin depender del mapa, la historia ni el ciclo de los diez soles.

## 1. Estructura

```text
JIIMATZIN_minijuegos/
├── index.html
├── styles.css
├── vendor/
│   └── phaser.js              # debes colocar aquí Phaser 4.2.1
└── src/
    ├── main.js                # configura Phaser y registra escenas
    ├── utils/
    │   └── ui.js              # textos, botones y pantalla de resultado
    └── scenes/
        ├── MenuScene.js
        ├── PanelCleaningScene.js
        ├── CO2FilterScene.js
        └── GreenhouseScene.js
```

## 2. Instalar Phaser 4.2.1

El plan del equipo especifica Phaser 4.2.1, JavaScript con módulos ES y sin empaquetador. Para respetarlo:

1. Descarga el archivo `phaser.js` desde la página oficial: https://phaser.io/download/release/v4.2.1
2. Copia el archivo descargado dentro de `vendor/`.
3. Asegúrate de que su nombre sea exactamente `phaser.js`.

No necesitas instalar npm ni usar un CDN. El proyecto carga Phaser localmente.

## 3. Ejecutar

No abras `index.html` directamente con doble clic, porque los módulos ES pueden bloquearse por seguridad del navegador.

En VS Code:
1. Abre la carpeta `JIIMATZIN_minijuegos`.
2. Instala la extensión **Live Server** si todavía no la tienes.
3. Haz clic derecho en `index.html`.
4. Selecciona **Open with Live Server**.

También puedes ejecutar un servidor local desde la terminal, si tienes Python:

```bash
python -m http.server 8000
```

Después abre http://localhost:8000

## 4. Cómo probar cada minijuego

### A. Paneles solares
- Toca o haz clic en los cúmulos de polvo.
- Limpia al menos 20 de los 24 cúmulos antes de que termine el tiempo.
- La vibración se habilita brevemente cuando aparece la luz verde.
- Victoria: 20 o más cúmulos limpios.
- Derrota: se acaba el tiempo antes de llegar a 20.

### B. Filtro de CO₂
- Arrastra CARTÓN, CINTA y MANGUERA a las zonas que corresponden.
- Cada pieza solo encaja en su zona correcta.
- Victoria: colocar las tres piezas antes de 50 segundos.
- Derrota: se acaba el tiempo.

### C. Invernadero
- Selecciona una planta tocando su maceta.
- Pulsa **Regar seleccionada** dos veces por planta.
- Después de regar las tres, pulsa el ventilador para eliminar las gotas flotantes.
- No riegues una planta por tercera vez: genera moho.
- Victoria: las tres plantas con dos gotas, ventilador activado y cero gotas flotantes.
- Derrota: tres errores de exceso de agua o tiempo agotado.

## 5. Resultados de prueba

Al terminar, cada escena guarda un objeto en el registro de Phaser con la clave:

```js
this.registry.get("lastMinigameResult")
```

El objeto contiene:
- `game`: identificador del minijuego.
- `success`: `true` o `false`.
- `reward`: texto ilustrativo de la recompensa o penalización.
- `message`: mensaje final.
- `timestamp`: momento en que terminó.

Los valores `+20` y `-10` son **valores provisionales de prueba**, no están conectados todavía al sistema global de energía u oxígeno.

## 6. Alcance y decisiones provisionales

- Las escenas usan gráficos dibujados con Phaser para que puedas probar la lógica sin esperar los sprites del equipo de arte.
- Los tiempos, cantidades y umbrales son parámetros iniciales para probar dificultad; pueden ajustarse después con el equipo.
- La historia del filtro está inspirada en el episodio del Apolo 13 descrito en el guion. La mecánica usa las tres piezas: cartón, cinta y manguera.
- El invernadero sigue la indicación del guion: regar gotita por gotita y activar ventilación cuando haya gotas flotantes.
- Este prototipo no implementa todavía recursos globales, diez soles, emergencias, cartas, historia Ink, mapa ni guardado de partida.

## 7. Integración posterior

Cuando los minijuegos estén aprobados, el juego principal podrá iniciar una escena por su clave:
- `PanelCleaningScene`
- `CO2FilterScene`
- `GreenhouseScene`

Y leer `lastMinigameResult` para aplicar la recompensa real al recurso correspondiente.
