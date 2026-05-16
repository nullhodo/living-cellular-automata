/**
 * history.js
 * Undo/Redo の状態管理ロジック
 */

function saveState() {
  const state = {
    params: { ...params },
    paletteColors: params.currentColorPalette.map((c) => c.toString()),
  };
  
  Object.keys(state.params).forEach((k) => {
    if (k.startsWith("_ui_")) delete state.params[k];
  });
  delete state.params.currentColorPalette;

  if (undoStack.length > 0) {
    const last = JSON.stringify(undoStack[undoStack.length - 1]);
    if (last === JSON.stringify(state)) return;
  }

  undoStack.push(state);
  if (undoStack.length > MAX_HISTORY) undoStack.shift();
  redoStack = [];
}

function restoreState(state) {
  Object.assign(params, state.params);
  params.currentColorPalette = state.paletteColors.map((s) => color(s));
  updatePaletteCache();

  updateUIFromParams();
  updatePaletteModeUI();
  updateColorPickers();
  initGrid();
}

function undo() {
  if (undoStack.length <= 1) return;
  const current = undoStack.pop();
  redoStack.push(current);
  const prev = undoStack[undoStack.length - 1];
  restoreState(prev);
}

function redo() {
  if (redoStack.length === 0) return;
  const next = redoStack.pop();
  undoStack.push(next);
  restoreState(next);
}
