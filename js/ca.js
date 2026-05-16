/**
 * ca.js
 * セルオートマトンの初期化・更新・描画ロジック
 */

function initGrid() {
  columns = Math.ceil(width / params.cellSize);
  rows = Math.ceil(height / params.cellSize);

  grid = new Uint8Array(columns * rows);
  nextGrid = new Uint8Array(columns * rows);

  simImage = createImage(columns, rows);

  for (let i = 0; i < grid.length; i++) {
    grid[i] = floor(random(params.states));
  }
}

function updatePaletteCache() {
  paletteCache = params.currentColorPalette.map((c) => [
    red(c),
    green(c),
    blue(c),
    255,
  ]);
}

function updateGrid() {
  let numColors = paletteCache.length;
  let activeStates = Math.min(params.states, numColors);
  let r = params.range;
  let threshold = params.threshold;

  let cols = columns;
  let rw = rows;

  let hasNoise = params.noise > 0;
  let noiseProb = params.noise;

  for (let y = 0; y < rw; y++) {
    for (let x = 0; x < cols; x++) {
      let index = x + y * cols;
      let state = grid[index];
      let nextStateVal = (state + 1) % activeStates;
      let count = 0;

      for (let dy = -r; dy <= r; dy++) {
        let ny = (y + dy + rw) % rw;
        let yOffset = ny * cols;

        for (let dx = -r; dx <= r; dx++) {
          if (dx === 0 && dy === 0) continue;

          let nx = (x + dx + cols) % cols;

          if (grid[nx + yOffset] === nextStateVal) {
            count++;
          }
        }
      }

      if (count >= threshold) {
        nextGrid[index] = nextStateVal;
      } else {
        nextGrid[index] = state;
      }

      if (hasNoise && Math.random() < noiseProb) {
        nextGrid[index] = Math.floor(Math.random() * activeStates);
      }
    }
  }

  let temp = grid;
  grid = nextGrid;
  nextGrid = temp;
}

function renderGridToImage() {
  simImage.loadPixels();
  let numColors = paletteCache.length;

  let px = simImage.pixels;
  let len = grid.length;

  for (let i = 0; i < len; i++) {
    let state = grid[i];
    let colorIdx = state % numColors;
    let c = paletteCache[colorIdx];

    let pxIndex = i * 4;
    px[pxIndex] = c[0]; 
    px[pxIndex + 1] = c[1]; 
    px[pxIndex + 2] = c[2]; 
    px[pxIndex + 3] = 255; 
  }

  simImage.updatePixels();
}
