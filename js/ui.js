/**
 * ui.js
 * UIの生成、イベント制御、ツールチップ、カスタムドロップダウン
 */

function initializeUI() {
  const container = document.getElementById("sliders-container");

  // カスタムドロップダウンの構築
  buildCustomPaletteDropdown();

  // スライダー生成ヘルパー
  const createSlider = (key, label, min, max, step, callback = null) => {
    let div = document.createElement("div");
    div.className = "control-group slider-container";
    
    // ラベル（タイトルと値表示）
    let labelContainer = document.createElement("div");
    labelContainer.style.display = "flex";
    labelContainer.style.justifyContent = "space-between";
    labelContainer.style.alignItems = "center";
    labelContainer.style.marginBottom = "4px";

    let titleSpan = document.createElement("span");
    titleSpan.innerText = label;
    titleSpan.style.fontSize = "12px";
    titleSpan.style.color = "#ccc";

    let valWrapper = document.createElement("div");
    let valSpan = document.createElement("span");
    valSpan.className = "value-display val";
    valSpan.innerText = params[key];
    
    // 個別のランダム化ボタン
    let randBtn = document.createElement("button");
    randBtn.innerText = "🎲";
    randBtn.className = "small-icon-btn";
    randBtn.title = "このパラメータをランダム化";
    randBtn.onclick = () => {
      // stepに合わせたランダム値を計算
      let range = max - min;
      let steps = Math.floor(range / step);
      let randVal = min + Math.floor(Math.random() * (steps + 1)) * step;
      // 小数点以下の桁数をstepの桁数に合わせる
      if (step < 1) {
        let dec = step.toString().split('.')[1].length;
        randVal = parseFloat(randVal.toFixed(dec));
      }
      
      params[key] = randVal;
      input.value = randVal;
      valSpan.innerText = randVal;
      
      if (key === "cellSize") initGrid();
      saveState();
    };

    valWrapper.appendChild(valSpan);
    valWrapper.appendChild(randBtn);
    
    labelContainer.appendChild(titleSpan);
    labelContainer.appendChild(valWrapper);

    // 入力部分ラッパー（ツールチップのため）
    let inputWrapper = document.createElement("div");
    inputWrapper.className = "input-wrapper";
    
    let input = document.createElement("input");
    input.type = "range";
    input.min = min;
    input.max = max;
    input.step = step;
    input.value = params[key];
    input.className = "hint-cursor";
    
    // ツールチップ
    let tooltip = document.createElement("div");
    tooltip.className = "static-tooltip";
    tooltip.innerText = `${label} の値を調整します`;

    input.oninput = (e) => {
      let val = parseFloat(e.target.value);
      params[key] = val;
      valSpan.innerText = val;
      if (key === "cellSize") initGrid();
      if (callback) callback(val);
    };

    input.onchange = () => {
      saveState();
    };

    inputWrapper.appendChild(input);
    inputWrapper.appendChild(tooltip);

    div.appendChild(labelContainer);
    div.appendChild(inputWrapper);
    container.appendChild(div);

    params[`_ui_${key}`] = { input, labelEl: div };
  };

  const createCheckbox = (key, label, callback = null) => {
    let div = document.createElement("div");
    div.className = "control-group checkbox-container";
    div.style.display = "flex";
    div.style.alignItems = "center";
    div.style.gap = "8px";
    div.style.marginBottom = "8px";

    let checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = params[key];
    checkbox.id = `checkbox-${key}`;

    let labelEl = document.createElement("label");
    labelEl.htmlFor = `checkbox-${key}`;
    labelEl.innerText = label;
    labelEl.style.margin = "0";
    labelEl.style.cursor = "pointer";

    checkbox.onchange = (e) => {
      params[key] = e.target.checked;
      if (callback) callback(e.target.checked);
      saveState();
    };

    div.appendChild(checkbox);
    div.appendChild(labelEl);
    container.appendChild(div);

    params[`_ui_${key}`] = { input: checkbox, labelEl: div };
  };

  createSlider("cellSize", "Cell Size (px)", 1, 20, 1);
  createSlider("threshold", "Threshold (Neighbors)", 1, 8, 1);
  createSlider("range", "Range (Radius)", 1, 10, 0.1);
  createSlider("states", "States (Colors)", 2, 16, 1);
  createCheckbox("useNoise", "Enable Noise");
  createSlider("noise", "Noise (Mutation)", 0, 0.1, 0.001);
  createSlider("speed", "Speed", 0, 20, 1);
  createCheckbox("useGradient", "Gradation Mode", () => {
    updatePaletteModeUI();
    if (params.useGradient) generateGradientPalette();
    else applyPaletteFromSelect();
  });
  createSlider("gradientColorsCount", "Gradient Colors", 2, 7, 1, () => {
    if (params.useGradient) generateGradientPalette();
  });

  updatePaletteModeUI();

  // キー入力イベント
  window.addEventListener("keydown", (e) => {
    if (e.key === "r" || e.key === "R") {
      if (!isRecording) startRecording();
    } else if (e.key === "s" || e.key === "S") {
      if (isRecording) stopRecording();
    }
  });
}

function buildCustomPaletteDropdown() {
  const container = document.getElementById("palette-dropdown-container");
  if (!container) return; 
  
  // 既存のselectは非表示にして、カスタムUIを構築
  const select = document.getElementById("palette-select");
  select.style.display = "none";
  
  // select要素にoptionを追加しておく（他の処理で.valueを参照するため）
  select.innerHTML = "";
  paletteDefinitions.forEach((p, index) => {
    let opt = document.createElement("option");
    opt.value = index;
    opt.text = p.title;
    select.appendChild(opt);
  });
  
  let dropdown = document.createElement("div");
  dropdown.className = "custom-dropdown";
  
  let selectedDisplay = document.createElement("div");
  selectedDisplay.className = "custom-dropdown-selected";
  selectedDisplay.onclick = () => {
    optionsList.classList.toggle("show");
  };
  
  let optionsList = document.createElement("div");
  optionsList.className = "custom-dropdown-options";
  
  const updateSelectedDisplay = (index) => {
    const p = paletteDefinitions[index];
    selectedDisplay.innerHTML = "";
    
    let title = document.createElement("span");
    title.innerText = p.title;
    
    let colorStrip = document.createElement("div");
    colorStrip.className = "color-strip";
    p.colors.forEach(c => {
      let swatch = document.createElement("div");
      swatch.style.backgroundColor = c.hex;
      swatch.className = "swatch";
      colorStrip.appendChild(swatch);
    });
    
    selectedDisplay.appendChild(title);
    selectedDisplay.appendChild(colorStrip);
  };

  paletteDefinitions.forEach((p, index) => {
    let option = document.createElement("div");
    option.className = "custom-dropdown-option";
    
    let title = document.createElement("span");
    title.innerText = p.title;
    
    let colorStrip = document.createElement("div");
    colorStrip.className = "color-strip";
    p.colors.forEach(c => {
      let swatch = document.createElement("div");
      swatch.style.backgroundColor = c.hex;
      swatch.className = "swatch";
      colorStrip.appendChild(swatch);
    });
    
    option.appendChild(title);
    option.appendChild(colorStrip);
    
    option.onclick = () => {
      select.value = index;
      updateSelectedDisplay(index);
      optionsList.classList.remove("show");
      applyPaletteByIndex(index);
      saveState();
    };
    
    optionsList.appendChild(option);
  });
  
  dropdown.appendChild(selectedDisplay);
  dropdown.appendChild(optionsList);
  container.appendChild(dropdown);
  
  // 外側クリックで閉じる
  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target)) {
      optionsList.classList.remove("show");
    }
  });

  // 初期表示
  updateSelectedDisplay(0);
}

function toggleToolWindow() {
  const win = document.getElementById("tool-window");
  isToolWindowVisible = !isToolWindowVisible;
  if (isToolWindowVisible) {
    win.classList.remove("hidden");
  } else {
    win.classList.add("hidden");
  }
}

function toggleDebug() {
  isDebugMode = !isDebugMode;
  document.getElementById("debug-btn").innerText = `デバッグモード: ${isDebugMode ? "ON" : "OFF"}`;
}

function applyPaletteByIndex(index) {
  if (params.useGradient) return;
  const p = paletteDefinitions[index];
  params.currentColorPalette = p.colors.map((c) =>
    color(c.rgb[0], c.rgb[1], c.rgb[2])
  );
  updatePaletteCache();
  
  // UI更新
  document.getElementById("palette-select").value = index;
  // カスタムドロップダウンの表示更新
  const displays = document.querySelectorAll(".custom-dropdown-selected");
  if(displays.length > 0) {
     const selectedDisplay = displays[0];
     selectedDisplay.innerHTML = "";
     let title = document.createElement("span");
     title.innerText = p.title;
     let colorStrip = document.createElement("div");
     colorStrip.className = "color-strip";
     p.colors.forEach(c => {
       let swatch = document.createElement("div");
       swatch.style.backgroundColor = c.hex;
       swatch.className = "swatch";
       colorStrip.appendChild(swatch);
     });
     selectedDisplay.appendChild(title);
     selectedDisplay.appendChild(colorStrip);
  }
  
  updateColorPickers();
}

function updatePaletteModeUI() {
  const dropdownContainer = document.getElementById("palette-dropdown-container");
  const randBtn = document.querySelector("button[onclick='applyRandomPalette()']");
  const gradientSlider = params[`_ui_gradientColorsCount`] ? params[`_ui_gradientColorsCount`].labelEl : null;

  if (params.useGradient) {
    if (dropdownContainer) dropdownContainer.style.display = "none";
    if (randBtn) randBtn.style.display = "none";
    if (gradientSlider) gradientSlider.style.display = "block";
  } else {
    if (dropdownContainer) dropdownContainer.style.display = "block";
    if (randBtn) randBtn.style.display = "block";
    if (gradientSlider) gradientSlider.style.display = "none";
  }
  updateColorPickers();
}

function generateGradientPalette() {
  const c1 = color(params.gradientStartColor);
  const c2 = color(params.gradientEndColor);
  const n = params.gradientColorsCount;
  
  params.currentColorPalette = [];
  for (let i = 0; i < n; i++) {
    let amt = n <= 1 ? 0 : i / (n - 1);
    params.currentColorPalette.push(lerpColor(c1, c2, amt));
  }
  updatePaletteCache();
  updateColorPickers();
}

function applyPaletteFromSelect() {
  const index = document.getElementById("palette-select").value;
  applyPaletteByIndex(parseInt(index));
  saveState();
}

function applyRandomPalette() {
  const index = floor(random(paletteDefinitions.length));
  applyPaletteByIndex(index);
  saveState();
}

function updateColorPickers() {
  const container = document.getElementById("sliders-container");
  
  let pickerContainer = document.getElementById("color-pickers");
  if (!pickerContainer) {
    pickerContainer = document.createElement("div");
    pickerContainer.id = "color-pickers";
    pickerContainer.className = "control-group";
    container.appendChild(pickerContainer);
  }
  
  if (params.useGradient) {
    pickerContainer.innerHTML = '<label>Gradient Colors (Start / End)</label><div style="display:flex; gap:5px;"></div>';
    const flexBox = pickerContainer.querySelector("div");
    
    let inputStart = document.createElement("input");
    inputStart.type = "color";
    inputStart.value = params.gradientStartColor;
    inputStart.oninput = (e) => {
      params.gradientStartColor = e.target.value;
      generateGradientPalette();
    };
    inputStart.onchange = () => saveState();
    flexBox.appendChild(inputStart);
    
    let inputEnd = document.createElement("input");
    inputEnd.type = "color";
    inputEnd.value = params.gradientEndColor;
    inputEnd.oninput = (e) => {
      params.gradientEndColor = e.target.value;
      generateGradientPalette();
    };
    inputEnd.onchange = () => saveState();
    flexBox.appendChild(inputEnd);

  } else {
    pickerContainer.innerHTML = '<label>Palette Colors</label><div style="display:flex; flex-wrap:wrap; gap:5px;"></div>';
    const flexBox = pickerContainer.querySelector("div");

    params.currentColorPalette.forEach((c, i) => {
      let input = document.createElement("input");
      input.type = "color";
      input.value = "#" + hex(red(c), 2) + hex(green(c), 2) + hex(blue(c), 2);
      input.oninput = (e) => {
        let newCol = color(e.target.value);
        params.currentColorPalette[i] = newCol;
        updatePaletteCache(); 
      };
      input.onchange = () => saveState(); 
      flexBox.appendChild(input);
    });
  }
}

function randomizeParams() {
  params.cellSize = floor(random(2, 10));
  params.threshold = floor(random(1, 6));
  params.range = parseFloat(random(1, 5).toFixed(1));
  params.states = floor(random(2, 6));
  params.speed = floor(random(5, 11));

  updateUIFromParams();
  updateColorPickers();
  initGrid();
  saveState();
}

function updateUIFromParams() {
  const keys = ["cellSize", "threshold", "range", "states", "noise", "speed", "useNoise", "useGradient", "gradientColorsCount"];
  keys.forEach((key) => {
    if (params[`_ui_${key}`]) {
      const ui = params[`_ui_${key}`];
      if (ui.input.type === "checkbox") {
        ui.input.checked = params[key];
      } else {
        ui.input.value = params[key];
        const valSpan = ui.labelEl.querySelector(".val");
        if (valSpan) valSpan.innerText = params[key];
      }
    }
  });
}
