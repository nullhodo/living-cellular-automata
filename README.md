# Living Cellular Automata

Living Cellular Automata is a web-based simulation of Cyclic Cellular Automata, built using p5.js. It features a customizable grid where cells change state based on their neighbors, creating dynamic, living patterns.

## Features
- **Real-time Simulation**: Smooth and interactive cellular automata simulation.
- **Customizable Parameters**: Adjust cell size, threshold, neighborhood range, number of states (colors), mutation noise, and simulation speed.
- **Color Palettes**: Choose from a variety of beautifully curated preset palettes or generate random ones.
- **High-Resolution Export**: Capture the current state as a high-resolution image.
- **Video Recording**: Record the simulation as a WebM video directly from the browser.
- **State Management**: Undo/Redo support, and the ability to save/load settings via JSONC files.

## How to Use
1. Open `index.html` in your web browser.
2. Use the **Tool Window** on the right to tweak parameters:
   - **Pre-set Palettes**: Change the visual theme.
   - **Cell Size**: Adjust the resolution of the grid.
   - **Threshold / Range / States**: Modify the rules of the cyclic cellular automaton.
   - **Noise**: Add random mutations to the grid.
   - **Speed**: Control how often the grid updates.
3. Use the **Camera** button to export an image, or the **Record** button to capture a video.
4. Drag and drop a saved `.jsonc` file onto the window to restore previous settings.

## Project Structure
- `index.html`: The main HTML file containing the structure and UI.
- `style.css`: The styling for the UI and canvas.
- `sketch.js`: The p5.js logic for the cellular automata simulation.

## Technologies Used
- HTML5, CSS3, JavaScript
- [p5.js](https://p5js.org/) for canvas rendering and logic.
