const applyConfigBtn = document.getElementById("applyConfigBtn");
const tuningSection = document.getElementById("tuningSection");

const leftMotorDirectionSelect = document.getElementById("leftMotorDirection");
const rightMotorDirectionSelect = document.getElementById("rightMotorDirection");
const blackLevelSelect = document.getElementById("blackLevel");
const whiteLevelDisplay = document.getElementById("whiteLevelDisplay");

const baseSpeedInput = document.getElementById("baseSpeed");
const leftSensorInput = document.getElementById("leftSensor");
const rightSensorInput = document.getElementById("rightSensor");
const kpInput = document.getElementById("kp");
const kdInput = document.getElementById("kd");

const baseSpeedNumberInput = document.getElementById("baseSpeedNumber");
const leftSensorNumberInput = document.getElementById("leftSensorNumber");
const rightSensorNumberInput = document.getElementById("rightSensorNumber");
const kpNumberInput = document.getElementById("kpNumber");
const kdNumberInput = document.getElementById("kdNumber");

const configNameInput = document.getElementById("configNameInput");
const saveConfigBtn = document.getElementById("saveConfigBtn");
const loadConfigBtn = document.getElementById("loadConfigBtn");
const deleteConfigBtn = document.getElementById("deleteConfigBtn");
const savedConfigSelect = document.getElementById("savedConfigSelect");

const compareNameInput = document.getElementById("compareNameInput");
const addCompareBtn = document.getElementById("addCompareBtn");
const clearCompareBtn = document.getElementById("clearCompareBtn");
const compareTableBody = document.getElementById("compareTableBody");
const compareCount = document.getElementById("compareCount");

const errorValue = document.getElementById("errorValue");
const lastErrorValue = document.getElementById("lastErrorValue");
const derivativeValue = document.getElementById("derivativeValue");
const correctionValue = document.getElementById("correctionValue");
const leftMotorValue = document.getElementById("leftMotorValue");
const rightMotorValue = document.getElementById("rightMotorValue");
const directionValue = document.getElementById("directionValue");
const suggestionValue = document.getElementById("suggestionValue");
const warningValue = document.getElementById("warningValue");

const errorBar = document.getElementById("errorBar");
const correctionBar = document.getElementById("correctionBar");
const leftMotorBar = document.getElementById("leftMotorBar");
const rightMotorBar = document.getElementById("rightMotorBar");

const errorBarText = document.getElementById("errorBarText");
const correctionBarText = document.getElementById("correctionBarText");
const leftMotorBarText = document.getElementById("leftMotorBarText");
const rightMotorBarText = document.getElementById("rightMotorBarText");

const resetBtn = document.getElementById("resetBtn");
const car = document.getElementById("car");

let config = {
  leftMotorDirection: 1,
  rightMotorDirection: 1,
  blackLevel: "low"
};

let lastError = 0;
let compareList = [];

function clamp(v, min, max) {
  const n = Number(v);
  if (Number.isNaN(n)) return min;
  return Math.min(Math.max(n, min), max);
}

function limitMotorSpeed(v) {
  return Math.min(Math.max(v, -100), 100);
}

function syncRangeAndNumber(rangeEl, numberEl, min, max) {
  const val = clamp(numberEl.value, min, max);
  rangeEl.value = val;
  numberEl.value = val;
}

function syncNumberFromRange(rangeEl, numberEl) {
  numberEl.value = rangeEl.value;
}

function getSavedConfigs() {
  const raw = localStorage.getItem("lineFollowerConfigs");
  return raw ? JSON.parse(raw) : {};
}

function setSavedConfigs(configs) {
  localStorage.setItem("lineFollowerConfigs", JSON.stringify(configs));
}

function refreshSavedConfigList() {
  const configs = getSavedConfigs();
  savedConfigSelect.innerHTML = '<option value="">請選擇設定</option>';

  Object.keys(configs).forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    savedConfigSelect.appendChild(option);
  });
}

function saveCurrentConfig() {
  const name = configNameInput.value.trim();
  if (!name) {
    alert("請輸入名稱");
    return;
  }

  const configs = getSavedConfigs();

  if (configs[name]) {
    const overwrite = confirm(`設定「${name}」已存在，是否覆蓋？`);
    if (!overwrite) return;
  }

  configs[name] = {
    leftMotorDirection: leftMotorDirectionSelect.value,
    rightMotorDirection: rightMotorDirectionSelect.value,
    blackLevel: blackLevelSelect.value,
    baseSpeed: baseSpeedInput.value,
    leftSensor: leftSensorInput.value,
    rightSensor: rightSensorInput.value,
    kp: kpInput.value,
    kd: kdInput.value
  };

  setSavedConfigs(configs);
  refreshSavedConfigList();
  savedConfigSelect.value = name;
  alert("已儲存：" + name);
}

function loadSelectedConfig() {
  const name = savedConfigSelect.value;
  if (!name) {
    alert("請選擇設定");
    return;
  }

  const configs = getSavedConfigs();
  const data = configs[name];
  if (!data) return;

  applyFullConfig(data, name);
}

function deleteSelectedConfig() {
  const name = savedConfigSelect.value;
  if (!name) {
    alert("請選擇要刪除的設定");
    return;
  }

  const ok = confirm(`確定刪除「${name}」嗎？`);
  if (!ok) return;

  const configs = getSavedConfigs();
  delete configs[name];

  setSavedConfigs(configs);
  refreshSavedConfigList();

  if (configNameInput.value === name) {
    configNameInput.value = "";
  }

  alert("已刪除：" + name);
}

function getCurrentCalculation() {
  const base = Number(baseSpeedInput.value);
  const L = Number(leftSensorInput.value);
  const R = Number(rightSensorInput.value);
  const kp = Number(kpInput.value);
  const kd = Number(kdInput.value);

  const error = config.blackLevel === "low" ? L - R : R - L;
  const derivative = error - lastError;
  const correction = kp * error + kd * derivative;

  const leftRaw = (base + correction) * config.leftMotorDirection;
  const rightRaw = (base - correction) * config.rightMotorDirection;

  const left = limitMotorSpeed(leftRaw);
  const right = limitMotorSpeed(rightRaw);

  let directionText = "置中";
  let directionColor = "green";

  if (config.blackLevel === "low") {
    if (error > 0) {
      directionText = "右側較接近黑線";
      directionColor = "blue";
    } else if (error < 0) {
      directionText = "左側較接近黑線";
      directionColor = "red";
    }
  } else {
    if (error > 0) {
      directionText = "左側較接近黑線";
      directionColor = "red";
    } else if (error < 0) {
      directionText = "右側較接近黑線";
      directionColor = "blue";
    }
  }

  let suggestionText = "維持目前輸出";
  let suggestionColor = "green";

  if (directionText === "右側較接近黑線") {
    suggestionText = "建議提高左輪輸出";
    suggestionColor = "blue";
  } else if (directionText === "左側較接近黑線") {
    suggestionText = "建議提高右輪輸出";
    suggestionColor = "red";
  }

  let warningText = "輸出正常";
  let warningColor = "green";

  if (leftRaw !== left || rightRaw !== right) {
    warningText = "輸出超出安全範圍，已自動限制在 -100 ~ 100";
    warningColor = "red";
  } else if (Math.abs(correction) > 50) {
    warningText = "Correction 偏大，可能造成震盪";
    warningColor = "orange";
  }

  return {
    base,
    L,
    R,
    kp,
    kd,
    error,
    derivative,
    correction,
    left,
    right,
    directionText,
    directionColor,
    suggestionText,
    suggestionColor,
    warningText,
    warningColor
  };
}

function calculateLineFollowing() {
  const result = getCurrentCalculation();

  errorValue.textContent = result.error.toFixed(2);
  lastErrorValue.textContent = lastError.toFixed(2);
  derivativeValue.textContent = result.derivative.toFixed(2);
  correctionValue.textContent = result.correction.toFixed(2);
  leftMotorValue.textContent = result.left.toFixed(2);
  rightMotorValue.textContent = result.right.toFixed(2);

  directionValue.textContent = result.directionText;
  directionValue.style.color = result.directionColor;

  suggestionValue.textContent = result.suggestionText;
  suggestionValue.style.color = result.suggestionColor;

  warningValue.textContent = result.warningText;
  warningValue.style.color = result.warningColor;

  updateCarPosition(result.error);
  updateBars(result.error, result.correction, result.left, result.right);

  lastError = result.error;
}

function updateCarPosition(error) {
  const offset = Math.max(Math.min(error * 2, 80), -80);
  car.style.left = `calc(50% + ${offset}px)`;
}

function updateBars(error, correction, left, right) {
  const setBar = (bar, text, val, color) => {
    bar.style.width = Math.min(Math.abs(val), 100) + "%";
    bar.style.background = color;
    text.textContent = val.toFixed(1);
  };

  setBar(errorBar, errorBarText, error, error >= 0 ? "#2563eb" : "#dc2626");
  setBar(correctionBar, correctionBarText, correction, "#6366f1");
  setBar(leftMotorBar, leftMotorBarText, left, "#16a34a");
  setBar(rightMotorBar, rightMotorBarText, right, "#f59e0b");
}

function applyFullConfig(data, name = "") {
  leftMotorDirectionSelect.value = data.leftMotorDirection;
  rightMotorDirectionSelect.value = data.rightMotorDirection;
  blackLevelSelect.value = data.blackLevel;

  config.leftMotorDirection = Number(data.leftMotorDirection);
  config.rightMotorDirection = Number(data.rightMotorDirection);
  config.blackLevel = data.blackLevel;

  whiteLevelDisplay.value = data.blackLevel === "low" ? "高" : "低";
  tuningSection.style.display = "block";

  baseSpeedInput.value = data.baseSpeed;
  baseSpeedNumberInput.value = data.baseSpeed;

  leftSensorInput.value = data.leftSensor;
  leftSensorNumberInput.value = data.leftSensor;

  rightSensorInput.value = data.rightSensor;
  rightSensorNumberInput.value = data.rightSensor;

  kpInput.value = data.kp;
  kpNumberInput.value = data.kp;

  kdInput.value = data.kd;
  kdNumberInput.value = data.kd;

  if (name) {
    configNameInput.value = name;
  }

  calculateLineFollowing();
}

function addCompareItem() {
  const name = compareNameInput.value.trim() || `比較 ${compareList.length + 1}`;
  const result = getCurrentCalculation();

  const item = {
    id: Date.now(),
    name,
    leftMotorDirection: config.leftMotorDirection,
    rightMotorDirection: config.rightMotorDirection,
    blackLevel: config.blackLevel,
    baseSpeed: result.base,
    leftSensor: result.L,
    rightSensor: result.R,
    kp: result.kp,
    kd: result.kd,
    error: result.error,
    derivative: result.derivative,
    correction: result.correction,
    left: result.left,
    right: result.right,
    directionText: result.directionText,
    suggestionText: result.suggestionText
  };

  compareList.push(item);
  compareNameInput.value = "";
  renderCompareTable();
}

function removeCompareItem(id) {
  compareList = compareList.filter(item => item.id !== id);
  renderCompareTable();
}

function clearCompareList() {
  if (compareList.length === 0) return;
  const ok = confirm("確定要清空全部比較資料嗎？");
  if (!ok) return;
  compareList = [];
  renderCompareTable();
}

function applyCompareItem(id) {
  const item = compareList.find(v => v.id === id);
  if (!item) return;

  applyFullConfig({
    leftMotorDirection: item.leftMotorDirection,
    rightMotorDirection: item.rightMotorDirection,
    blackLevel: item.blackLevel,
    baseSpeed: item.baseSpeed,
    leftSensor: item.leftSensor,
    rightSensor: item.rightSensor,
    kp: item.kp,
    kd: item.kd
  }, item.name);
}

function renderCompareTable() {
  compareCount.textContent = `${compareList.length} 組`;

  if (compareList.length === 0) {
    compareTableBody.innerHTML = `
      <tr>
        <td colspan="14" class="empty-compare">目前尚未加入比較資料</td>
      </tr>
    `;
    return;
  }

  compareTableBody.innerHTML = compareList.map(item => `
    <tr>
      <td><strong>${item.name}</strong></td>
      <td>${item.baseSpeed}</td>
      <td>${item.leftSensor}</td>
      <td>${item.rightSensor}</td>
      <td>${Number(item.kp).toFixed(1)}</td>
      <td>${Number(item.kd).toFixed(1)}</td>
      <td>${Number(item.error).toFixed(2)}</td>
      <td>${Number(item.derivative).toFixed(2)}</td>
      <td>${Number(item.correction).toFixed(2)}</td>
      <td>${Number(item.left).toFixed(2)}</td>
      <td>${Number(item.right).toFixed(2)}</td>
      <td>${item.directionText}</td>
      <td>${item.suggestionText}</td>
      <td>
        <div class="table-action-group">
          <button class="table-action-btn secondary" data-action="apply" data-id="${item.id}">套用</button>
          <button class="table-action-btn danger" data-action="remove" data-id="${item.id}">刪除</button>
        </div>
      </td>
    </tr>
  `).join("");
}

compareTableBody.addEventListener("click", (e) => {
  const target = e.target;
  if (!(target instanceof HTMLButtonElement)) return;

  const id = Number(target.dataset.id);
  const action = target.dataset.action;

  if (action === "apply") {
    applyCompareItem(id);
  } else if (action === "remove") {
    removeCompareItem(id);
  }
});

applyConfigBtn.addEventListener("click", () => {
  config.leftMotorDirection = Number(leftMotorDirectionSelect.value);
  config.rightMotorDirection = Number(rightMotorDirectionSelect.value);
  config.blackLevel = blackLevelSelect.value;

  whiteLevelDisplay.value = config.blackLevel === "low" ? "高" : "低";

  tuningSection.style.display = "block";
  calculateLineFollowing();
});

baseSpeedInput.addEventListener("input", () => {
  syncNumberFromRange(baseSpeedInput, baseSpeedNumberInput);
  calculateLineFollowing();
});

leftSensorInput.addEventListener("input", () => {
  syncNumberFromRange(leftSensorInput, leftSensorNumberInput);
  calculateLineFollowing();
});

rightSensorInput.addEventListener("input", () => {
  syncNumberFromRange(rightSensorInput, rightSensorNumberInput);
  calculateLineFollowing();
});

kpInput.addEventListener("input", () => {
  syncNumberFromRange(kpInput, kpNumberInput);
  calculateLineFollowing();
});

kdInput.addEventListener("input", () => {
  syncNumberFromRange(kdInput, kdNumberInput);
  calculateLineFollowing();
});

baseSpeedNumberInput.addEventListener("input", () => {
  syncRangeAndNumber(baseSpeedInput, baseSpeedNumberInput, 0, 100);
  calculateLineFollowing();
});

leftSensorNumberInput.addEventListener("input", () => {
  syncRangeAndNumber(leftSensorInput, leftSensorNumberInput, 0, 100);
  calculateLineFollowing();
});

rightSensorNumberInput.addEventListener("input", () => {
  syncRangeAndNumber(rightSensorInput, rightSensorNumberInput, 0, 100);
  calculateLineFollowing();
});

kpNumberInput.addEventListener("input", () => {
  syncRangeAndNumber(kpInput, kpNumberInput, 0, 10);
  calculateLineFollowing();
});

kdNumberInput.addEventListener("input", () => {
  syncRangeAndNumber(kdInput, kdNumberInput, 0, 10);
  calculateLineFollowing();
});

function resetFields() {
  baseSpeedInput.value = 50;
  baseSpeedNumberInput.value = 50;

  leftSensorInput.value = 60;
  leftSensorNumberInput.value = 60;

  rightSensorInput.value = 40;
  rightSensorNumberInput.value = 40;

  kpInput.value = 0.5;
  kpNumberInput.value = 0.5;

  kdInput.value = 0.1;
  kdNumberInput.value = 0.1;

  directionValue.textContent = "-";
  suggestionValue.textContent = "-";
  warningValue.textContent = "-";

  directionValue.style.color = "black";
  suggestionValue.style.color = "black";
  warningValue.style.color = "black";

  lastError = 0;
  calculateLineFollowing();
}

resetBtn.addEventListener("click", resetFields);
saveConfigBtn.addEventListener("click", saveCurrentConfig);
loadConfigBtn.addEventListener("click", loadSelectedConfig);
deleteConfigBtn.addEventListener("click", deleteSelectedConfig);
addCompareBtn.addEventListener("click", addCompareItem);
clearCompareBtn.addEventListener("click", clearCompareList);

refreshSavedConfigList();
renderCompareTable();