/**
 * sketch.js
 * メインループとブリッジロジック
 */

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1); 
  noSmooth(); 

  frameRate(60);

  initializeUI();

  applyPaletteByIndex(0);

  initGrid();

  saveState();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initGrid();
}

function draw() {
  background(20);

  let updateFreq = Math.floor(map(params.speed, 1, 10, 10, 1));
  if (frameCount % updateFreq === 0) {
    updateGrid();
  }

  renderGridToImage();

  image(simImage, 0, 0, width, height);

  if (isDebugMode) {
    drawDebugInfo();
  }
}

function drawDebugInfo() {
  fill(0, 0, 0, 150);
  rect(0, height - 100, 250, 100);
  fill(0, 255, 0);
  textSize(14);
  textAlign(LEFT, TOP);
  text(`FPS: ${frameRate().toFixed(1)}`, 10, height - 90);
  text(`Grid: ${columns} x ${rows}`, 10, height - 70);
  text(`Cells: ${columns * rows}`, 10, height - 50);
  text(`Method: Uint8Array + PixelBuffer`, 10, height - 30);
}
