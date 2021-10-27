// src/util/rect.ts
var Rect = class {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
  static fromQRect(qRect) {
    return new Rect(qRect.x, qRect.y, qRect.width, qRect.height);
  }
  get maxX() {
    return this.x + this.width;
  }
  get maxY() {
    return this.y + this.height;
  }
  get center() {
    return [
      this.x + Math.floor(this.width / 2),
      this.y + Math.floor(this.height / 2)
    ];
  }
  clone() {
    return new Rect(this.x, this.y, this.width, this.height);
  }
  equals(other) {
    return this.x === other.x && this.y === other.y && this.width === other.width && this.height === other.height;
  }
  gap(left, right, top, bottom) {
    return new Rect(this.x + left, this.y + top, this.width - (left + right), this.height - (top + bottom));
  }
  gap_mut(left, right, top, bottom) {
    this.x += left;
    this.y += top;
    this.width -= left + right;
    this.height -= top + bottom;
    return this;
  }
  includes(other) {
    return this.x <= other.x && this.y <= other.y && other.maxX < this.maxX && other.maxY < this.maxY;
  }
  includesPoint([x, y]) {
    return this.x <= x && x <= this.maxX && this.y <= y && y <= this.maxY;
  }
  subtract(other) {
    return new Rect(this.x - other.x, this.y - other.y, this.width - other.width, this.height - other.height);
  }
  toQRect() {
    return Qt.rect(this.x, this.y, this.width, this.height);
  }
  toString() {
    return "Rect(" + [this.x, this.y, this.width, this.height].join(", ") + ")";
  }
};
var RectDelta = class {
  constructor(east, west, south, north) {
    this.east = east;
    this.west = west;
    this.south = south;
    this.north = north;
  }
  static fromRects(basis, target) {
    const diff = target.subtract(basis);
    return new RectDelta(diff.width + diff.x, -diff.x, diff.height + diff.y, -diff.y);
  }
  toString() {
    return `WindowResizeDelta(east=${this.east} west=${this.west} north=${this.north} south=${this.south}}`;
  }
};

// src/engine/window.ts
var WindowState;
(function(WindowState2) {
  WindowState2[WindowState2["Unmanaged"] = 0] = "Unmanaged";
  WindowState2[WindowState2["NativeFullscreen"] = 1] = "NativeFullscreen";
  WindowState2[WindowState2["NativeMaximized"] = 2] = "NativeMaximized";
  WindowState2[WindowState2["Floating"] = 3] = "Floating";
  WindowState2[WindowState2["Maximized"] = 4] = "Maximized";
  WindowState2[WindowState2["Tiled"] = 5] = "Tiled";
  WindowState2[WindowState2["TiledAfloat"] = 6] = "TiledAfloat";
  WindowState2[WindowState2["Undecided"] = 7] = "Undecided";
})(WindowState || (WindowState = {}));
var EngineWindowImpl = class {
  constructor(window, config, log) {
    this.log = log;
    this.config = config;
    this.id = window.id;
    this.window = window;
    this.internalStatePreviouslyAskedToChangeTo = 3;
    this.floatGeometry = window.geometry;
    this.geometry = window.geometry;
    this.timestamp = 0;
    this.internalState = 0;
    this.shouldCommitFloat = this.shouldFloat;
    this.weightMap = {};
  }
  static isTileableState(state) {
    return state === 5 || state === 4 || state === 6;
  }
  static isTiledState(state) {
    return state === 5 || state === 4;
  }
  static isFloatingState(state) {
    return state === 3 || state === 6;
  }
  get actualGeometry() {
    return this.window.geometry;
  }
  get shouldFloat() {
    return this.window.shouldFloat;
  }
  get shouldIgnore() {
    return this.window.shouldIgnore;
  }
  get screen() {
    return this.window.screen;
  }
  get minimized() {
    return this.window.minimized;
  }
  set minimized(min) {
    this.window.minimized = min;
  }
  get tileable() {
    return EngineWindowImpl.isTileableState(this.state);
  }
  get tiled() {
    return EngineWindowImpl.isTiledState(this.state);
  }
  get floating() {
    return EngineWindowImpl.isFloatingState(this.state);
  }
  get geometryDelta() {
    return RectDelta.fromRects(this.geometry, this.actualGeometry);
  }
  get shaded() {
    return this.window.shaded;
  }
  get state() {
    if (this.window.fullScreen) {
      return 1;
    }
    if (this.window.maximized) {
      return 2;
    }
    return this.internalState;
  }
  set state(value) {
    const winState = this.state;
    this.internalStatePreviouslyAskedToChangeTo = winState;
    if (winState === value) {
      return;
    }
    if ((winState === 0 || EngineWindowImpl.isTileableState(winState)) && EngineWindowImpl.isFloatingState(value)) {
      this.shouldCommitFloat = true;
    } else if (EngineWindowImpl.isFloatingState(winState) && EngineWindowImpl.isTileableState(value)) {
      this.floatGeometry = this.actualGeometry;
    }
    this.internalState = value;
  }
  get statePreviouslyAskedToChangeTo() {
    return this.internalStatePreviouslyAskedToChangeTo;
  }
  get surface() {
    return this.window.surface;
  }
  set surface(srf) {
    this.window.surface = srf;
  }
  get weight() {
    const srfID = this.window.surface.id;
    const winWeight = this.weightMap[srfID];
    if (winWeight === void 0) {
      this.weightMap[srfID] = 1;
      return 1;
    }
    return winWeight;
  }
  set weight(value) {
    const srfID = this.window.surface.id;
    this.weightMap[srfID] = value;
  }
  get isDialog() {
    return this.window.isDialog;
  }
  commit() {
    const state = this.state;
    this.log.log(["Window#commit", { state: WindowState[state] }]);
    switch (state) {
      case 2:
        this.window.commit(void 0, void 0, false);
        break;
      case 1:
        this.window.commit(void 0, void 0, void 0);
        break;
      case 3:
        if (!this.shouldCommitFloat) {
          break;
        }
        this.window.commit(this.floatGeometry, false, this.config.keepFloatAbove);
        this.shouldCommitFloat = false;
        break;
      case 4:
        this.window.commit(this.geometry, true, false);
        break;
      case 5:
        this.window.commit(this.geometry, this.config.noTileBorder, false);
        break;
      case 6:
        if (!this.shouldCommitFloat) {
          break;
        }
        this.window.commit(this.floatGeometry, false, this.config.keepFloatAbove);
        this.shouldCommitFloat = false;
        break;
    }
  }
  forceSetGeometry(geometry) {
    this.window.commit(geometry);
  }
  visibleOn(srf) {
    return this.window.visibleOn(srf);
  }
  toString() {
    return "Window(" + String(this.window) + ")";
  }
};

// src/controller/action.ts
var ActionImpl = class {
  constructor(engine, key, description, defaultKeybinding, log) {
    this.engine = engine;
    this.key = key;
    this.description = description;
    this.defaultKeybinding = defaultKeybinding;
    this.log = log;
    this.key = `bismuth_${this.key}`;
    this.description = `Bismuth: ${this.description}`;
  }
  execute() {
    this.log.log(`Executing action: ${this.key}`);
    const currentLayout = this.engine.currentLayoutOnCurrentSurface();
    if (currentLayout.executeAction) {
      currentLayout.executeAction(this.engine, this);
    } else {
      this.executeWithoutLayoutOverride();
    }
    this.engine.arrange();
  }
};
var FocusNextWindow = class extends ActionImpl {
  constructor(engine, log) {
    super(engine, "focus_next_window", "Focus Next Window", "", log);
    this.engine = engine;
    this.log = log;
  }
  executeWithoutLayoutOverride() {
    this.engine.focusOrder(1, false);
  }
};
var FocusPreviousWindow = class extends ActionImpl {
  constructor(engine, log) {
    super(engine, "focus_prev_window", "Focus Previous Window", "", log);
    this.engine = engine;
    this.log = log;
  }
  executeWithoutLayoutOverride() {
    this.engine.focusOrder(-1, false);
  }
};
var FocusUpperWindow = class extends ActionImpl {
  constructor(engine, log) {
    super(engine, "focus_upper_window", "Focus Upper Window", "Meta+K", log);
    this.engine = engine;
    this.log = log;
  }
  executeWithoutLayoutOverride() {
    this.engine.focusDir("up");
  }
};
var FocusBottomWindow = class extends ActionImpl {
  constructor(engine, log) {
    super(engine, "focus_bottom_window", "Focus Bottom Window", "Meta+J", log);
    this.engine = engine;
    this.log = log;
  }
  executeWithoutLayoutOverride() {
    this.engine.focusDir("down");
  }
};
var FocusLeftWindow = class extends ActionImpl {
  constructor(engine, log) {
    super(engine, "focus_left_window", "Focus Left Window", "Meta+H", log);
    this.engine = engine;
    this.log = log;
  }
  executeWithoutLayoutOverride() {
    this.engine.focusDir("left");
  }
};
var FocusRightWindow = class extends ActionImpl {
  constructor(engine, log) {
    super(engine, "focus_right_window", "Focus Right Window", "Meta+L", log);
    this.engine = engine;
    this.log = log;
  }
  executeWithoutLayoutOverride() {
    this.engine.focusDir("right");
  }
};
var MoveActiveWindowToNextPosition = class extends ActionImpl {
  constructor(engine, log) {
    super(engine, "move_window_to_next_pos", "Move Window to the Next Position", "", log);
    this.engine = engine;
    this.log = log;
  }
  executeWithoutLayoutOverride() {
    const win = this.engine.currentWindow();
    if (win) {
      this.engine.swapOrder(win, 1);
    }
  }
};
var MoveActiveWindowToPreviousPosition = class extends ActionImpl {
  constructor(engine, log) {
    super(engine, "move_window_to_prev_pos", "Move Window to the Previous Position", "", log);
    this.engine = engine;
    this.log = log;
  }
  executeWithoutLayoutOverride() {
    const win = this.engine.currentWindow();
    if (win) {
      this.engine.swapOrder(win, -1);
    }
  }
};
var MoveActiveWindowUp = class extends ActionImpl {
  constructor(engine, log) {
    super(engine, "move_window_to_upper_pos", "Move Window Up", "Meta+Shift+K", log);
    this.engine = engine;
    this.log = log;
  }
  executeWithoutLayoutOverride() {
    this.engine.swapDirOrMoveFloat("up");
  }
};
var MoveActiveWindowDown = class extends ActionImpl {
  constructor(engine, log) {
    super(engine, "move_window_to_bottom_pos", "Move Window Down", "Meta+Shift+J", log);
    this.engine = engine;
    this.log = log;
  }
  executeWithoutLayoutOverride() {
    this.engine.swapDirOrMoveFloat("down");
  }
};
var MoveActiveWindowLeft = class extends ActionImpl {
  constructor(engine, log) {
    super(engine, "move_window_to_left_pos", "Move Window Left", "Meta+Shift+H", log);
    this.engine = engine;
    this.log = log;
  }
  executeWithoutLayoutOverride() {
    this.engine.swapDirOrMoveFloat("left");
  }
};
var MoveActiveWindowRight = class extends ActionImpl {
  constructor(engine, log) {
    super(engine, "move_window_to_right_pos", "Move Window Right", "Meta+Shift+L", log);
    this.engine = engine;
    this.log = log;
  }
  executeWithoutLayoutOverride() {
    this.engine.swapDirOrMoveFloat("right");
  }
};
var IncreaseActiveWindowWidth = class extends ActionImpl {
  constructor(engine, log) {
    super(engine, "increase_window_width", "Increase Window Width", "Meta+Ctrl+L", log);
    this.engine = engine;
    this.log = log;
  }
  executeWithoutLayoutOverride() {
    const win = this.engine.currentWindow();
    if (win) {
      this.engine.resizeWindow(win, "east", 1);
    }
  }
};
var IncreaseActiveWindowHeight = class extends ActionImpl {
  constructor(engine, log) {
    super(engine, "increase_window_height", "Increase Window Height", "Meta+Ctrl+J", log);
    this.engine = engine;
    this.log = log;
  }
  executeWithoutLayoutOverride() {
    const win = this.engine.currentWindow();
    if (win) {
      this.engine.resizeWindow(win, "south", 1);
    }
  }
};
var DecreaseActiveWindowWidth = class extends ActionImpl {
  constructor(engine, log) {
    super(engine, "decrease_window_width", "Decrease Window Width", "Meta+Ctrl+H", log);
    this.engine = engine;
    this.log = log;
  }
  executeWithoutLayoutOverride() {
    const win = this.engine.currentWindow();
    if (win) {
      this.engine.resizeWindow(win, "east", -1);
    }
  }
};
var DecreaseActiveWindowHeight = class extends ActionImpl {
  constructor(engine, log) {
    super(engine, "decrease_window_height", "Decrease Window Height", "Meta+Ctrl+K", log);
    this.engine = engine;
    this.log = log;
  }
  executeWithoutLayoutOverride() {
    const win = this.engine.currentWindow();
    if (win) {
      this.engine.resizeWindow(win, "south", -1);
    }
  }
};
var IncreaseMasterAreaWindowCount = class extends ActionImpl {
  constructor(engine, log) {
    super(engine, "increase_master_win_count", "Increase Master Area Window Count", "Meta+]", log);
    this.engine = engine;
    this.log = log;
  }
  executeWithoutLayoutOverride() {
    this.engine.showNotification("No Master Area");
  }
};
var DecreaseMasterAreaWindowCount = class extends ActionImpl {
  constructor(engine, log) {
    super(engine, "decrease_master_win_count", "Decrease Master Area Window Count", "Meta+[", log);
    this.engine = engine;
    this.log = log;
  }
  executeWithoutLayoutOverride() {
    this.engine.showNotification("No Master Area");
  }
};
var IncreaseLayoutMasterAreaSize = class extends ActionImpl {
  constructor(engine, log) {
    super(engine, "increase_master_size", "Increase Master Area Size", "", log);
    this.engine = engine;
    this.log = log;
  }
  executeWithoutLayoutOverride() {
    this.engine.showNotification("No Master Area");
  }
};
var DecreaseLayoutMasterAreaSize = class extends ActionImpl {
  constructor(engine, log) {
    super(engine, "decrease_master_size", "Decrease Master Area Size", "", log);
    this.engine = engine;
    this.log = log;
  }
  executeWithoutLayoutOverride() {
    this.engine.showNotification("No Master Area");
  }
};
var ToggleActiveWindowFloating = class extends ActionImpl {
  constructor(engine, log) {
    super(engine, "toggle_window_floating", "Toggle Active Window Floating", "Meta+F", log);
    this.engine = engine;
    this.log = log;
  }
  executeWithoutLayoutOverride() {
    const win = this.engine.currentWindow();
    if (win) {
      this.engine.toggleFloat(win);
    }
  }
};
var PushActiveWindowIntoMasterAreaFront = class extends ActionImpl {
  constructor(engine, log) {
    super(engine, "push_window_to_master", "Push Active Window to Master Area", "Meta+Return", log);
    this.engine = engine;
    this.log = log;
  }
  executeWithoutLayoutOverride() {
    const win = this.engine.currentWindow();
    if (win) {
      this.engine.setMaster(win);
    }
  }
};
var SwitchToNextLayout = class extends ActionImpl {
  constructor(engine, log) {
    super(engine, "next_layout", "Switch to the Next Layout", "Meta+\\", log);
    this.engine = engine;
    this.log = log;
  }
  executeWithoutLayoutOverride() {
    this.engine.cycleLayout(1);
  }
};
var SwitchToPreviousLayout = class extends ActionImpl {
  constructor(engine, log) {
    super(engine, "prev_layout", "Switch to the Previous Layout", "Meta+|", log);
    this.engine = engine;
    this.log = log;
  }
  executeWithoutLayoutOverride() {
    this.engine.cycleLayout(-1);
  }
};
var SetCurrentLayout = class extends ActionImpl {
  constructor(engine, layoutId, key, description, defaultShortcut, log) {
    super(engine, key, description, defaultShortcut, log);
    this.engine = engine;
    this.layoutId = layoutId;
    this.log = log;
  }
  executeWithoutLayoutOverride() {
    this.engine.setLayout(this.layoutId);
  }
};
var SetTileLayout = class extends SetCurrentLayout {
  constructor(engine, log) {
    super(engine, "TileLayout", "toggle_tile_layout", "Toggle Tile Layout", "Meta+T", log);
    this.engine = engine;
    this.log = log;
  }
};
var SetMonocleLayout = class extends SetCurrentLayout {
  constructor(engine, log) {
    super(engine, "MonocleLayout", "toggle_monocle_layout", "Toggle Monocle Layout", "Meta+M", log);
    this.engine = engine;
    this.log = log;
  }
};
var SetThreeColumnLayout = class extends SetCurrentLayout {
  constructor(engine, log) {
    super(engine, "ThreeColumnLayout", "toggle_three_column_layout", "Toggle Three Column Layout", "", log);
    this.engine = engine;
    this.log = log;
  }
};
var SetSpreadLayout = class extends SetCurrentLayout {
  constructor(engine, log) {
    super(engine, "SpreadLayout", "toggle_spread_layout", "Toggle Spread Layout", "", log);
    this.engine = engine;
    this.log = log;
  }
};
var SetStairLayout = class extends SetCurrentLayout {
  constructor(engine, log) {
    super(engine, "StairLayout", "toggle_stair_layout", "Toggle Stair Layout", "", log);
    this.engine = engine;
    this.log = log;
  }
};
var SetFloatingLayout = class extends SetCurrentLayout {
  constructor(engine, log) {
    super(engine, "FloatingLayout ", "toggle_float_layout", "Toggle Floating Layout", "Meta+Shift+F", log);
    this.engine = engine;
    this.log = log;
  }
};
var SetQuarterLayout = class extends SetCurrentLayout {
  constructor(engine, log) {
    super(engine, "QuarterLayout", "toggle_quarter_layout", "Toggle Quarter Layout", "", log);
    this.engine = engine;
    this.log = log;
  }
};
var Rotate = class extends ActionImpl {
  constructor(engine, log) {
    super(engine, "rotate", "Rotate", "Meta+R", log);
    this.engine = engine;
    this.log = log;
  }
  executeWithoutLayoutOverride() {
    this.engine.showNotification("Rotation Not Applicable");
  }
};
var RotatePart = class extends ActionImpl {
  constructor(engine, log) {
    super(engine, "rotate_part", "Rotate Part", "Meta+Shift+R", log);
    this.engine = engine;
    this.log = log;
  }
  executeWithoutLayoutOverride() {
    this.engine.showNotification("Rotation Not Applicable");
  }
};

// src/engine/layout/monocle_layout.ts
var _MonocleLayout = class {
  constructor(config) {
    this.description = "Monocle";
    this.classID = _MonocleLayout.id;
    this.config = config;
  }
  apply(controller, tileables, area) {
    tileables.forEach((tile) => {
      tile.state = this.config.monocleMaximize ? WindowState.Maximized : WindowState.Tiled;
      tile.geometry = area;
    });
  }
  clone() {
    return this;
  }
  executeAction(engine, action) {
    if (action instanceof FocusUpperWindow || action instanceof FocusLeftWindow || action instanceof FocusPreviousWindow) {
      engine.focusOrder(-1, this.config.monocleMinimizeRest);
    } else if (action instanceof FocusBottomWindow || action instanceof FocusRightWindow || action instanceof FocusNextWindow) {
      engine.focusOrder(1, this.config.monocleMinimizeRest);
    } else {
      action.executeWithoutLayoutOverride();
    }
  }
  toString() {
    return "MonocleLayout()";
  }
};
var MonocleLayout = _MonocleLayout;
MonocleLayout.id = "MonocleLayout";

// src/util/func.ts
function clip(value, min, max) {
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
}
function slide(value, step) {
  if (step === 0) {
    return value;
  }
  return Math.floor(value / step + 1.000001) * step;
}
function matchWords(str, words) {
  for (let i = 0; i < words.length; i++) {
    if (str.indexOf(words[i]) >= 0) {
      return i;
    }
  }
  return -1;
}
function wrapIndex(index, length) {
  if (index < 0) {
    return index + length;
  }
  if (index >= length) {
    return index - length;
  }
  return index;
}
function partitionArrayBySizes(array, sizes) {
  let base = 0;
  const chunks = sizes.map((size) => {
    const chunk = array.slice(base, base + size);
    base += size;
    return chunk;
  });
  chunks.push(array.slice(base));
  return chunks;
}
function overlap(min1, max1, min2, max2) {
  const min = Math.min;
  const max = Math.max;
  const dx = max(0, min(max1, max2) - max(min1, min2));
  return dx > 0;
}

// src/engine/layout/layout_utils.ts
var LayoutUtils = class {
  static splitWeighted([begin, length], weights, gap) {
    gap = gap !== void 0 ? gap : 0;
    const n = weights.length;
    const actualLength = length - (n - 1) * gap;
    const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
    let weightAcc = 0;
    return weights.map((weight, i) => {
      const partBegin = actualLength * weightAcc / weightSum + i * gap;
      const partLength = actualLength * weight / weightSum;
      weightAcc += weight;
      return [begin + Math.floor(partBegin), Math.floor(partLength)];
    });
  }
  static splitAreaWeighted(area, weights, gap, horizontal) {
    gap = gap !== void 0 ? gap : 0;
    horizontal = horizontal !== void 0 ? horizontal : false;
    const line = horizontal ? [area.x, area.width] : [area.y, area.height];
    const parts = LayoutUtils.splitWeighted(line, weights, gap);
    return parts.map(([begin, length]) => horizontal ? new Rect(begin, area.y, length, area.height) : new Rect(area.x, begin, area.width, length));
  }
  static splitAreaHalfWeighted(area, weight, gap, horizontal) {
    return LayoutUtils.splitAreaWeighted(area, [weight, 1 - weight], gap, horizontal);
  }
  static adjustWeights([begin, length], weights, gap, target, deltaFw, deltaBw) {
    const minLength = 1;
    const parts = this.splitWeighted([begin, length], weights, gap);
    const [targetBase, targetLength] = parts[target];
    if (target > 0 && deltaBw !== 0) {
      const neighbor = target - 1;
      const [neighborBase, neighborLength] = parts[neighbor];
      const delta = clip(deltaBw, minLength - targetLength, neighborLength - minLength);
      parts[target] = [targetBase - delta, targetLength + delta];
      parts[neighbor] = [neighborBase, neighborLength - delta];
    }
    if (target < parts.length - 1 && deltaFw !== 0) {
      const neighbor = target + 1;
      const [neighborBase, neighborLength] = parts[neighbor];
      const delta = clip(deltaFw, minLength - targetLength, neighborLength - minLength);
      parts[target] = [targetBase, targetLength + delta];
      parts[neighbor] = [neighborBase + delta, neighborLength - delta];
    }
    return LayoutUtils.calculateWeights(parts);
  }
  static adjustAreaWeights(area, weights, gap, target, delta, horizontal) {
    const line = horizontal ? [area.x, area.width] : [area.y, area.height];
    const [deltaFw, deltaBw] = horizontal ? [delta.east, delta.west] : [delta.south, delta.north];
    return LayoutUtils.adjustWeights(line, weights, gap, target, deltaFw, deltaBw);
  }
  static adjustAreaHalfWeights(area, weight, gap, target, delta, horizontal) {
    const weights = [weight, 1 - weight];
    const newWeights = LayoutUtils.adjustAreaWeights(area, weights, gap, target, delta, horizontal);
    return newWeights[0];
  }
  static calculateWeights(parts) {
    const totalLength = parts.reduce((acc, [_base, length]) => acc + length, 0);
    return parts.map(([_base, length]) => length / totalLength);
  }
  static calculateAreaWeights(_area, geometries, gap, horizontal) {
    gap = gap !== void 0 ? gap : 0;
    horizontal = horizontal !== void 0 ? horizontal : false;
    const parts = horizontal ? geometries.map((geometry) => [geometry.x, geometry.width]) : geometries.map((geometry) => [geometry.y, geometry.height]);
    return LayoutUtils.calculateWeights(parts);
  }
};

// src/engine/layout/layout_part.ts
var FillLayoutPart = class {
  adjust(area, tiles, basis, delta) {
    return delta;
  }
  apply(area, tiles) {
    return tiles.map((_tile) => {
      return area;
    });
  }
};
var HalfSplitLayoutPart = class {
  constructor(primary, secondary) {
    this.primary = primary;
    this.secondary = secondary;
    this.angle = 0;
    this.gap = 0;
    this.primarySize = 1;
    this.ratio = 0.5;
  }
  get horizontal() {
    return this.angle === 0 || this.angle === 180;
  }
  get reversed() {
    return this.angle === 180 || this.angle === 270;
  }
  adjust(area, tiles, basis, delta) {
    const basisIndex = tiles.indexOf(basis);
    if (basisIndex < 0) {
      return delta;
    }
    if (tiles.length <= this.primarySize) {
      return this.primary.adjust(area, tiles, basis, delta);
    } else if (this.primarySize === 0) {
      return this.secondary.adjust(area, tiles, basis, delta);
    } else {
      const targetIndex = basisIndex < this.primarySize ? 0 : 1;
      if (targetIndex === 0) {
        delta = this.primary.adjust(area, tiles.slice(0, this.primarySize), basis, delta);
      } else {
        delta = this.secondary.adjust(area, tiles.slice(this.primarySize), basis, delta);
      }
      this.ratio = LayoutUtils.adjustAreaHalfWeights(area, this.reversed ? 1 - this.ratio : this.ratio, this.gap, this.reversed ? 1 - targetIndex : targetIndex, delta, this.horizontal);
      if (this.reversed) {
        this.ratio = 1 - this.ratio;
      }
      switch (this.angle * 10 + targetIndex + 1) {
        case 1:
        case 1802:
          return new RectDelta(0, delta.west, delta.south, delta.north);
        case 2:
        case 1801:
          return new RectDelta(delta.east, 0, delta.south, delta.north);
        case 901:
        case 2702:
          return new RectDelta(delta.east, delta.west, 0, delta.north);
        case 902:
        case 2701:
          return new RectDelta(delta.east, delta.west, delta.south, 0);
      }
      return delta;
    }
  }
  apply(area, tiles) {
    if (tiles.length <= this.primarySize) {
      return this.primary.apply(area, tiles);
    } else if (this.primarySize === 0) {
      return this.secondary.apply(area, tiles);
    } else {
      const reversed = this.reversed;
      const ratio = reversed ? 1 - this.ratio : this.ratio;
      const [area1, area2] = LayoutUtils.splitAreaHalfWeighted(area, ratio, this.gap, this.horizontal);
      const result1 = this.primary.apply(reversed ? area2 : area1, tiles.slice(0, this.primarySize));
      const result2 = this.secondary.apply(reversed ? area1 : area2, tiles.slice(this.primarySize));
      return result1.concat(result2);
    }
  }
};
var StackLayoutPart = class {
  constructor(config) {
    this.config = config;
    this.gap = 0;
  }
  adjust(area, tiles, basis, delta) {
    const weights = LayoutUtils.adjustAreaWeights(area, tiles.map((tile) => tile.weight), this.config.tileLayoutGap, tiles.indexOf(basis), delta, false);
    weights.forEach((weight, i) => {
      tiles[i].weight = weight * tiles.length;
    });
    const idx = tiles.indexOf(basis);
    return new RectDelta(delta.east, delta.west, idx === tiles.length - 1 ? delta.south : 0, idx === 0 ? delta.north : 0);
  }
  apply(area, tiles) {
    const weights = tiles.map((tile) => tile.weight);
    return LayoutUtils.splitAreaWeighted(area, weights, this.gap);
  }
};
var RotateLayoutPart = class {
  constructor(inner, angle = 0) {
    this.inner = inner;
    this.angle = angle;
  }
  adjust(area, tiles, basis, delta) {
    switch (this.angle) {
      case 0:
        break;
      case 90:
        area = new Rect(area.y, area.x, area.height, area.width);
        delta = new RectDelta(delta.south, delta.north, delta.east, delta.west);
        break;
      case 180:
        delta = new RectDelta(delta.west, delta.east, delta.south, delta.north);
        break;
      case 270:
        area = new Rect(area.y, area.x, area.height, area.width);
        delta = new RectDelta(delta.north, delta.south, delta.east, delta.west);
        break;
    }
    delta = this.inner.adjust(area, tiles, basis, delta);
    switch (this.angle) {
      case 0:
        break;
      case 90:
        delta = new RectDelta(delta.south, delta.north, delta.east, delta.west);
        break;
      case 180:
        delta = new RectDelta(delta.west, delta.east, delta.south, delta.north);
        break;
      case 270:
        delta = new RectDelta(delta.north, delta.south, delta.east, delta.west);
        break;
    }
    return delta;
  }
  apply(area, tiles) {
    switch (this.angle) {
      case 0:
        break;
      case 90:
        area = new Rect(area.y, area.x, area.height, area.width);
        break;
      case 180:
        break;
      case 270:
        area = new Rect(area.y, area.x, area.height, area.width);
        break;
    }
    const innerResult = this.inner.apply(area, tiles);
    switch (this.angle) {
      case 0:
        return innerResult;
      case 90:
        return innerResult.map((g) => new Rect(g.y, g.x, g.height, g.width));
      case 180:
        return innerResult.map((g) => {
          const rx = g.x - area.x;
          const newX = area.x + area.width - (rx + g.width);
          return new Rect(newX, g.y, g.width, g.height);
        });
      case 270:
        return innerResult.map((g) => {
          const rx = g.x - area.x;
          const newY = area.x + area.width - (rx + g.width);
          return new Rect(g.y, newY, g.height, g.width);
        });
    }
  }
  rotate(amount) {
    let angle = this.angle + amount;
    if (angle < 0) {
      angle = 270;
    } else if (angle >= 360) {
      angle = 0;
    }
    this.angle = angle;
  }
};

// src/engine/layout/tile_layout.ts
var _TileLayout = class {
  constructor(config) {
    this.classID = _TileLayout.id;
    this.config = config;
    this.parts = new RotateLayoutPart(new HalfSplitLayoutPart(new RotateLayoutPart(new StackLayoutPart(this.config)), new StackLayoutPart(this.config)));
    const masterPart = this.parts.inner;
    masterPart.gap = masterPart.primary.inner.gap = masterPart.secondary.gap = this.config.tileLayoutGap;
  }
  get description() {
    return `Tile [${this.numMaster}]`;
  }
  get numMaster() {
    return this.parts.inner.primarySize;
  }
  set numMaster(value) {
    this.parts.inner.primarySize = value;
  }
  get masterRatio() {
    return this.parts.inner.ratio;
  }
  set masterRatio(value) {
    this.parts.inner.ratio = value;
  }
  adjust(area, tiles, basis, delta) {
    this.parts.adjust(area, tiles, basis, delta);
  }
  apply(_controller, tileables, area) {
    tileables.forEach((tileable) => tileable.state = WindowState.Tiled);
    this.parts.apply(area, tileables).forEach((geometry, i) => {
      tileables[i].geometry = geometry;
    });
  }
  clone() {
    const other = new _TileLayout(this.config);
    other.masterRatio = this.masterRatio;
    other.numMaster = this.numMaster;
    return other;
  }
  executeAction(engine, action) {
    if (action instanceof DecreaseLayoutMasterAreaSize) {
      this.masterRatio = clip(slide(this.masterRatio, -0.05), _TileLayout.MIN_MASTER_RATIO, _TileLayout.MAX_MASTER_RATIO);
    } else if (action instanceof IncreaseLayoutMasterAreaSize) {
      this.masterRatio = clip(slide(this.masterRatio, 0.05), _TileLayout.MIN_MASTER_RATIO, _TileLayout.MAX_MASTER_RATIO);
    } else if (action instanceof IncreaseMasterAreaWindowCount) {
      if (this.numMaster < 10) {
        this.numMaster += 1;
      }
      engine.showNotification(this.description);
    } else if (action instanceof DecreaseMasterAreaWindowCount) {
      if (this.numMaster > 0) {
        this.numMaster -= 1;
      }
      engine.showNotification(this.description);
    } else if (action instanceof Rotate) {
      this.parts.rotate(90);
    } else if (action instanceof RotatePart) {
      this.parts.inner.primary.rotate(90);
    } else {
      action.executeWithoutLayoutOverride();
    }
  }
  toString() {
    return `TileLayout(nmaster=${this.numMaster}, ratio=${this.masterRatio})`;
  }
};
var TileLayout = _TileLayout;
TileLayout.MIN_MASTER_RATIO = 0.2;
TileLayout.MAX_MASTER_RATIO = 0.8;
TileLayout.id = "TileLayout";

// src/engine/layout/three_column_layout.ts
var _ThreeColumnLayout = class {
  constructor(config) {
    this.classID = _ThreeColumnLayout.id;
    this.config = config;
    this.masterRatio = 0.6;
    this.masterSize = 1;
  }
  get description() {
    return `Three-Column [${this.masterSize}]`;
  }
  adjust(area, tiles, basis, delta) {
    const basisIndex = tiles.indexOf(basis);
    if (basisIndex < 0) {
      return;
    }
    if (tiles.length === 0) {
      return;
    } else if (tiles.length <= this.masterSize) {
      LayoutUtils.adjustAreaWeights(area, tiles.map((tile) => tile.weight), this.config.tileLayoutGap, tiles.indexOf(basis), delta).forEach((newWeight, i) => tiles[i].weight = newWeight * tiles.length);
    } else if (tiles.length === this.masterSize + 1) {
      this.masterRatio = LayoutUtils.adjustAreaHalfWeights(area, this.masterRatio, this.config.tileLayoutGap, basisIndex < this.masterSize ? 0 : 1, delta, true);
      if (basisIndex < this.masterSize) {
        const masterTiles = tiles.slice(0, -1);
        LayoutUtils.adjustAreaWeights(area, masterTiles.map((tile) => tile.weight), this.config.tileLayoutGap, basisIndex, delta).forEach((newWeight, i) => masterTiles[i].weight = newWeight * masterTiles.length);
      }
    } else if (tiles.length > this.masterSize + 1) {
      let basisGroup;
      if (basisIndex < this.masterSize) {
        basisGroup = 1;
      } else if (basisIndex < Math.floor((this.masterSize + tiles.length) / 2)) {
        basisGroup = 2;
      } else {
        basisGroup = 0;
      }
      const stackRatio = 1 - this.masterRatio;
      const newRatios = LayoutUtils.adjustAreaWeights(area, [stackRatio, this.masterRatio, stackRatio], this.config.tileLayoutGap, basisGroup, delta, true);
      const newMasterRatio = newRatios[1];
      const newStackRatio = basisGroup === 0 ? newRatios[0] : newRatios[2];
      this.masterRatio = newMasterRatio / (newMasterRatio + newStackRatio);
      const rstackNumTile = Math.floor((tiles.length - this.masterSize) / 2);
      const [masterTiles, rstackTiles, lstackTiles] = partitionArrayBySizes(tiles, [
        this.masterSize,
        rstackNumTile
      ]);
      const groupTiles = [lstackTiles, masterTiles, rstackTiles][basisGroup];
      LayoutUtils.adjustAreaWeights(area, groupTiles.map((tile) => tile.weight), this.config.tileLayoutGap, groupTiles.indexOf(basis), delta).forEach((newWeight, i) => groupTiles[i].weight = newWeight * groupTiles.length);
    }
  }
  apply(_controller, tileables, area) {
    tileables.forEach((tileable) => tileable.state = WindowState.Tiled);
    const tiles = tileables;
    if (tiles.length <= this.masterSize) {
      LayoutUtils.splitAreaWeighted(area, tiles.map((tile) => tile.weight), this.config.tileLayoutGap).forEach((tileArea, i) => tiles[i].geometry = tileArea);
    } else if (tiles.length === this.masterSize + 1) {
      const [masterArea, stackArea] = LayoutUtils.splitAreaHalfWeighted(area, this.masterRatio, this.config.tileLayoutGap, true);
      const masterTiles = tiles.slice(0, this.masterSize);
      LayoutUtils.splitAreaWeighted(masterArea, masterTiles.map((tile) => tile.weight), this.config.tileLayoutGap).forEach((tileArea, i) => masterTiles[i].geometry = tileArea);
      tiles[tiles.length - 1].geometry = stackArea;
    } else if (tiles.length > this.masterSize + 1) {
      const stackRatio = 1 - this.masterRatio;
      const groupAreas = LayoutUtils.splitAreaWeighted(area, [stackRatio, this.masterRatio, stackRatio], this.config.tileLayoutGap, true);
      const rstackSize = Math.floor((tiles.length - this.masterSize) / 2);
      const [masterTiles, rstackTiles, lstackTiles] = partitionArrayBySizes(tiles, [
        this.masterSize,
        rstackSize
      ]);
      [lstackTiles, masterTiles, rstackTiles].forEach((groupTiles, group) => {
        LayoutUtils.splitAreaWeighted(groupAreas[group], groupTiles.map((tile) => tile.weight), this.config.tileLayoutGap).forEach((tileArea, i) => groupTiles[i].geometry = tileArea);
      });
    }
  }
  clone() {
    const other = new _ThreeColumnLayout(this.config);
    other.masterRatio = this.masterRatio;
    other.masterSize = this.masterSize;
    return other;
  }
  executeAction(engine, action) {
    if (action instanceof IncreaseMasterAreaWindowCount) {
      this.resizeMaster(engine, 1);
    } else if (action instanceof DecreaseMasterAreaWindowCount) {
      this.resizeMaster(engine, -1);
    } else if (action instanceof DecreaseLayoutMasterAreaSize) {
      this.masterRatio = clip(slide(this.masterRatio, -0.05), _ThreeColumnLayout.MIN_MASTER_RATIO, _ThreeColumnLayout.MAX_MASTER_RATIO);
    } else if (action instanceof IncreaseLayoutMasterAreaSize) {
      this.masterRatio = clip(slide(this.masterRatio, 0.05), _ThreeColumnLayout.MIN_MASTER_RATIO, _ThreeColumnLayout.MAX_MASTER_RATIO);
    } else {
      action.executeWithoutLayoutOverride();
    }
  }
  toString() {
    return `ThreeColumnLayout(nmaster=${this.masterSize})`;
  }
  resizeMaster(engine, step) {
    this.masterSize = clip(this.masterSize + step, 1, 10);
    engine.showNotification(this.description);
  }
};
var ThreeColumnLayout = _ThreeColumnLayout;
ThreeColumnLayout.MIN_MASTER_RATIO = 0.2;
ThreeColumnLayout.MAX_MASTER_RATIO = 0.75;
ThreeColumnLayout.id = "ThreeColumnLayout";

// src/engine/layout/stair_layout.ts
var _StairLayout = class {
  constructor() {
    this.classID = _StairLayout.id;
    this.description = "Stair";
    this.space = 24;
  }
  apply(_controller, tileables, area) {
    tileables.forEach((tileable) => tileable.state = WindowState.Tiled);
    const tiles = tileables;
    const len = tiles.length;
    const space = this.space;
    for (let i = 0; i < len; i++) {
      const dx = space * (len - i - 1);
      const dy = space * i;
      tiles[i].geometry = new Rect(area.x + dx, area.y + dy, area.width - dx, area.height - dy);
    }
  }
  clone() {
    const other = new _StairLayout();
    other.space = this.space;
    return other;
  }
  executeAction(_engine, action) {
    if (action instanceof DecreaseMasterAreaWindowCount) {
      this.space = Math.max(16, this.space - 8);
    } else if (action instanceof IncreaseMasterAreaWindowCount) {
      this.space = Math.min(160, this.space + 8);
    } else {
      action.executeWithoutLayoutOverride();
    }
  }
  toString() {
    return `StairLayout(${this.space})`;
  }
};
var StairLayout = _StairLayout;
StairLayout.id = "StairLayout";

// src/engine/layout/spiral_layout.ts
var SpiralLayout = class {
  constructor(config) {
    this.description = "Spiral";
    this.config = config;
    this.depth = 1;
    this.parts = new HalfSplitLayoutPart(new FillLayoutPart(), new FillLayoutPart());
    this.parts.angle = 0;
    this.parts.gap = this.config.tileLayoutGap;
  }
  adjust(area, tiles, basis, delta) {
    this.parts.adjust(area, tiles, basis, delta);
  }
  apply(_controller, tileables, area) {
    tileables.forEach((tileable) => tileable.state = WindowState.Tiled);
    this.bore(tileables.length);
    this.parts.apply(area, tileables).forEach((geometry, i) => {
      tileables[i].geometry = geometry;
    });
  }
  toString() {
    return "Spiral()";
  }
  bore(depth) {
    if (this.depth >= depth) {
      return;
    }
    let hpart = this.parts;
    let i;
    for (i = 0; i < this.depth - 1; i++) {
      hpart = hpart.secondary;
    }
    const lastFillPart = hpart.secondary;
    let npart;
    while (i < depth - 1) {
      npart = new HalfSplitLayoutPart(new FillLayoutPart(), lastFillPart);
      npart.gap = this.config.tileLayoutGap;
      switch ((i + 1) % 4) {
        case 0:
          npart.angle = 0;
          break;
        case 1:
          npart.angle = 90;
          break;
        case 2:
          npart.angle = 180;
          break;
        case 3:
          npart.angle = 270;
          break;
      }
      hpart.secondary = npart;
      hpart = npart;
      i++;
    }
    this.depth = depth;
  }
};

// src/engine/layout/spread_layout.ts
var _SpreadLayout = class {
  constructor() {
    this.classID = _SpreadLayout.id;
    this.description = "Spread";
    this.space = 0.07;
  }
  apply(_controller, tileables, area) {
    tileables.forEach((tileable) => tileable.state = WindowState.Tiled);
    const tiles = tileables;
    let numTiles = tiles.length;
    const spaceWidth = Math.floor(area.width * this.space);
    let cardWidth = area.width - spaceWidth * (numTiles - 1);
    const miniumCardWidth = area.width * 0.4;
    while (cardWidth < miniumCardWidth) {
      cardWidth += spaceWidth;
      numTiles -= 1;
    }
    for (let i = 0; i < tiles.length; i++) {
      tiles[i].geometry = new Rect(area.x + (i < numTiles ? spaceWidth * (numTiles - i - 1) : 0), area.y, cardWidth, area.height);
    }
  }
  clone() {
    const other = new _SpreadLayout();
    other.space = this.space;
    return other;
  }
  executeAction(_engine, action) {
    if (action instanceof DecreaseMasterAreaWindowCount) {
      this.space = Math.max(0.04, this.space - 0.01);
    } else if (action instanceof IncreaseMasterAreaWindowCount) {
      this.space = Math.min(0.1, this.space + 0.01);
    } else {
      action.executeWithoutLayoutOverride();
    }
  }
  toString() {
    return `SpreadLayout(${this.space})`;
  }
};
var SpreadLayout = _SpreadLayout;
SpreadLayout.id = "SpreadLayout";

// src/engine/layout/floating_layout.ts
var _FloatingLayout = class {
  constructor() {
    this.classID = _FloatingLayout.id;
    this.description = "Floating";
  }
  apply(_controller, tileables, _area) {
    tileables.forEach((tileable) => tileable.state = WindowState.TiledAfloat);
  }
  clone() {
    return this;
  }
  toString() {
    return "FloatingLayout()";
  }
};
var FloatingLayout = _FloatingLayout;
FloatingLayout.id = "FloatingLayout ";
FloatingLayout.instance = new _FloatingLayout();

// src/engine/layout/quarter_layout.ts
var _QuarterLayout = class {
  constructor(config) {
    this.classID = _QuarterLayout.id;
    this.description = "Quarter";
    this.lhsplit = 0.5;
    this.rhsplit = 0.5;
    this.vsplit = 0.5;
    this.config = config;
  }
  get capacity() {
    return 4;
  }
  adjust(area, tiles, basis, delta) {
    if (tiles.length <= 1 || tiles.length > 4) {
      return;
    }
    const idx = tiles.indexOf(basis);
    if (idx < 0) {
      return;
    }
    if ((idx === 0 || idx === 3) && delta.east !== 0) {
      this.vsplit = (Math.floor(area.width * this.vsplit) + delta.east) / area.width;
    } else if ((idx === 2 || idx === 2) && delta.west !== 0) {
      this.vsplit = (Math.floor(area.width * this.vsplit) - delta.west) / area.width;
    }
    if (tiles.length === 4) {
      if (idx === 0 && delta.south !== 0) {
        this.lhsplit = (Math.floor(area.height * this.lhsplit) + delta.south) / area.height;
      }
      if (idx === 3 && delta.north !== 0) {
        this.lhsplit = (Math.floor(area.height * this.lhsplit) - delta.north) / area.height;
      }
    }
    if (tiles.length >= 3) {
      if (idx === 1 && delta.south !== 0) {
        this.rhsplit = (Math.floor(area.height * this.rhsplit) + delta.south) / area.height;
      }
      if (idx === 2 && delta.north !== 0) {
        this.rhsplit = (Math.floor(area.height * this.rhsplit) - delta.north) / area.height;
      }
    }
    this.vsplit = clip(this.vsplit, 1 - _QuarterLayout.MAX_PROPORTION, _QuarterLayout.MAX_PROPORTION);
    this.lhsplit = clip(this.lhsplit, 1 - _QuarterLayout.MAX_PROPORTION, _QuarterLayout.MAX_PROPORTION);
    this.rhsplit = clip(this.rhsplit, 1 - _QuarterLayout.MAX_PROPORTION, _QuarterLayout.MAX_PROPORTION);
  }
  clone() {
    const other = new _QuarterLayout(this.config);
    other.lhsplit = this.lhsplit;
    other.rhsplit = this.rhsplit;
    other.vsplit = this.vsplit;
    return other;
  }
  apply(_controller, tileables, area) {
    for (let i = 0; i < 4 && i < tileables.length; i++) {
      tileables[i].state = WindowState.Tiled;
    }
    if (tileables.length > 4) {
      tileables.slice(4).forEach((tile) => tile.state = WindowState.TiledAfloat);
    }
    if (tileables.length === 1) {
      tileables[0].geometry = area;
      return;
    }
    const gap1 = Math.floor(this.config.tileLayoutGap / 2);
    const gap2 = this.config.tileLayoutGap - gap1;
    const leftWidth = Math.floor(area.width * this.vsplit);
    const rightWidth = area.width - leftWidth;
    const rightX = area.x + leftWidth;
    if (tileables.length === 2) {
      tileables[0].geometry = new Rect(area.x, area.y, leftWidth, area.height).gap(0, gap1, 0, 0);
      tileables[1].geometry = new Rect(rightX, area.y, rightWidth, area.height).gap(gap2, 0, 0, 0);
      return;
    }
    const rightTopHeight = Math.floor(area.height * this.rhsplit);
    const rightBottomHeight = area.height - rightTopHeight;
    const rightBottomY = area.y + rightTopHeight;
    if (tileables.length === 3) {
      tileables[0].geometry = new Rect(area.x, area.y, leftWidth, area.height).gap(0, gap1, 0, 0);
      tileables[1].geometry = new Rect(rightX, area.y, rightWidth, rightTopHeight).gap(gap2, 0, 0, gap1);
      tileables[2].geometry = new Rect(rightX, rightBottomY, rightWidth, rightBottomHeight).gap(gap2, 0, gap2, 0);
      return;
    }
    const leftTopHeight = Math.floor(area.height * this.lhsplit);
    const leftBottomHeight = area.height - leftTopHeight;
    const leftBottomY = area.y + leftTopHeight;
    if (tileables.length >= 4) {
      tileables[0].geometry = new Rect(area.x, area.y, leftWidth, leftTopHeight).gap(0, gap1, 0, gap1);
      tileables[1].geometry = new Rect(rightX, area.y, rightWidth, rightTopHeight).gap(gap2, 0, 0, gap1);
      tileables[2].geometry = new Rect(rightX, rightBottomY, rightWidth, rightBottomHeight).gap(gap2, 0, gap2, 0);
      tileables[3].geometry = new Rect(area.x, leftBottomY, leftWidth, leftBottomHeight).gap(0, gap2, gap2, 0);
    }
  }
  toString() {
    return "QuarterLayout()";
  }
};
var QuarterLayout = _QuarterLayout;
QuarterLayout.MAX_PROPORTION = 0.8;
QuarterLayout.id = "QuarterLayout";

// src/engine/layout/cascade_layout.ts
var CascadeDirection;
(function(CascadeDirection2) {
  CascadeDirection2[CascadeDirection2["NorthWest"] = 0] = "NorthWest";
  CascadeDirection2[CascadeDirection2["North"] = 1] = "North";
  CascadeDirection2[CascadeDirection2["NorthEast"] = 2] = "NorthEast";
  CascadeDirection2[CascadeDirection2["East"] = 3] = "East";
  CascadeDirection2[CascadeDirection2["SouthEast"] = 4] = "SouthEast";
  CascadeDirection2[CascadeDirection2["South"] = 5] = "South";
  CascadeDirection2[CascadeDirection2["SouthWest"] = 6] = "SouthWest";
  CascadeDirection2[CascadeDirection2["West"] = 7] = "West";
})(CascadeDirection || (CascadeDirection = {}));
var _CascadeLayout = class {
  constructor(dir = 4) {
    this.dir = dir;
    this.classID = _CascadeLayout.id;
  }
  static decomposeDirection(dir) {
    switch (dir) {
      case 0:
        return [-1, -1];
      case 1:
        return [-1, 0];
      case 2:
        return [-1, 1];
      case 3:
        return [0, 1];
      case 4:
        return [1, 1];
      case 5:
        return [1, 0];
      case 6:
        return [1, -1];
      case 7:
        return [0, -1];
    }
  }
  get description() {
    return "Cascade [" + CascadeDirection[this.dir] + "]";
  }
  apply(_controller, tileables, area) {
    const [vertStep, horzStep] = _CascadeLayout.decomposeDirection(this.dir);
    const stepSize = 25;
    const windowWidth = horzStep !== 0 ? area.width - stepSize * (tileables.length - 1) : area.width;
    const windowHeight = vertStep !== 0 ? area.height - stepSize * (tileables.length - 1) : area.height;
    const baseX = horzStep >= 0 ? area.x : area.maxX - windowWidth;
    const baseY = vertStep >= 0 ? area.y : area.maxY - windowHeight;
    let x = baseX, y = baseY;
    tileables.forEach((tile) => {
      tile.state = WindowState.Tiled;
      tile.geometry = new Rect(x, y, windowWidth, windowHeight);
      x += horzStep * stepSize;
      y += vertStep * stepSize;
    });
  }
  clone() {
    return new _CascadeLayout(this.dir);
  }
  executeAction(engine, action) {
    if (action instanceof IncreaseMasterAreaWindowCount) {
      this.dir = (this.dir + 1 + 8) % 8;
      engine.showNotification(this.description);
    } else if (action instanceof DecreaseMasterAreaWindowCount) {
      this.dir = (this.dir - 1 + 8) % 8;
      engine.showNotification(this.description);
    } else {
      action.executeWithoutLayoutOverride();
    }
  }
};
var CascadeLayout = _CascadeLayout;
CascadeLayout.id = "CascadeLayout";

// src/config.ts
var ConfigImpl = class {
  constructor(kwinApi) {
    function commaSeparate(str) {
      if (!str || typeof str !== "string") {
        return [];
      }
      return str.split(",").map((part) => part.trim());
    }
    this.kwinApi = kwinApi;
    this.debugEnabled = this.kwinApi.KWin.readConfig("debug", false);
    this.layoutOrder = [];
    this.layoutFactories = {};
    [
      ["enableTileLayout", true, TileLayout],
      ["enableMonocleLayout", true, MonocleLayout],
      ["enableThreeColumnLayout", true, ThreeColumnLayout],
      ["enableSpreadLayout", true, SpreadLayout],
      ["enableStairLayout", true, StairLayout],
      ["enableSpiralLayout", true, SpiralLayout],
      ["enableQuarterLayout", false, QuarterLayout],
      ["enableFloatingLayout", false, FloatingLayout],
      ["enableCascadeLayout", false, CascadeLayout]
    ].forEach(([configKey, defaultValue, layoutClass]) => {
      if (this.kwinApi.KWin.readConfig(configKey, defaultValue))
        this.layoutOrder.push(layoutClass.id);
      this.layoutFactories[layoutClass.id] = () => new layoutClass(this);
    });
    this.maximizeSoleTile = this.kwinApi.KWin.readConfig("maximizeSoleTile", false);
    this.monocleMaximize = this.kwinApi.KWin.readConfig("monocleMaximize", true);
    this.monocleMinimizeRest = this.kwinApi.KWin.readConfig("monocleMinimizeRest", false);
    this.adjustLayout = this.kwinApi.KWin.readConfig("adjustLayout", true);
    this.adjustLayoutLive = this.kwinApi.KWin.readConfig("adjustLayoutLive", true);
    this.keepFloatAbove = this.kwinApi.KWin.readConfig("keepFloatAbove", true);
    this.noTileBorder = this.kwinApi.KWin.readConfig("noTileBorder", false);
    this.limitTileWidthRatio = 0;
    if (this.kwinApi.KWin.readConfig("limitTileWidth", false)) {
      this.limitTileWidthRatio = this.kwinApi.KWin.readConfig("limitTileWidthRatio", 1.6);
    }
    this.screenGapBottom = this.kwinApi.KWin.readConfig("screenGapBottom", 0);
    this.screenGapLeft = this.kwinApi.KWin.readConfig("screenGapLeft", 0);
    this.screenGapRight = this.kwinApi.KWin.readConfig("screenGapRight", 0);
    this.screenGapTop = this.kwinApi.KWin.readConfig("screenGapTop", 0);
    this.tileLayoutGap = this.kwinApi.KWin.readConfig("tileLayoutGap", 0);
    this.newWindowAsMaster = this.kwinApi.KWin.readConfig("newWindowAsMaster", false);
    this.layoutPerActivity = this.kwinApi.KWin.readConfig("layoutPerActivity", true);
    this.layoutPerDesktop = this.kwinApi.KWin.readConfig("layoutPerDesktop", true);
    this.floatUtility = this.kwinApi.KWin.readConfig("floatUtility", true);
    this.preventMinimize = this.kwinApi.KWin.readConfig("preventMinimize", false);
    this.preventProtrusion = this.kwinApi.KWin.readConfig("preventProtrusion", true);
    this.pollMouseXdotool = this.kwinApi.KWin.readConfig("pollMouseXdotool", false);
    this.floatingClass = commaSeparate(this.kwinApi.KWin.readConfig("floatingClass", ""));
    this.floatingTitle = commaSeparate(this.kwinApi.KWin.readConfig("floatingTitle", ""));
    this.ignoreActivity = commaSeparate(this.kwinApi.KWin.readConfig("ignoreActivity", ""));
    this.ignoreClass = commaSeparate(this.kwinApi.KWin.readConfig("ignoreClass", "yakuake,spectacle,Conky"));
    this.ignoreRole = commaSeparate(this.kwinApi.KWin.readConfig("ignoreRole", "quake"));
    this.ignoreScreen = commaSeparate(this.kwinApi.KWin.readConfig("ignoreScreen", "")).map((str) => parseInt(str, 10));
    this.ignoreTitle = commaSeparate(this.kwinApi.KWin.readConfig("ignoreTitle", ""));
  }
  toString() {
    return "Config(" + JSON.stringify(this, null, 2) + ")";
  }
};

// src/engine/layout_store.ts
var LayoutStoreEntry = class {
  get currentLayout() {
    return this.loadLayout(this.currentID);
  }
  constructor(config) {
    this.config = config;
    this.currentIndex = 0;
    this.currentID = this.config.layoutOrder[0];
    this.layouts = {};
    this.previousID = this.currentID;
    this.loadLayout(this.currentID);
  }
  cycleLayout(step) {
    this.previousID = this.currentID;
    this.currentIndex = this.currentIndex !== null ? wrapIndex(this.currentIndex + step, this.config.layoutOrder.length) : 0;
    this.currentID = this.config.layoutOrder[this.currentIndex];
    return this.loadLayout(this.currentID);
  }
  setLayout(targetID) {
    const targetLayout = this.loadLayout(targetID);
    if (targetLayout instanceof MonocleLayout && this.currentLayout instanceof MonocleLayout) {
      this.currentID = this.previousID;
      this.previousID = targetID;
    } else if (this.currentID !== targetID) {
      this.previousID = this.currentID;
      this.currentID = targetID;
    }
    this.updateCurrentIndex();
    return targetLayout;
  }
  updateCurrentIndex() {
    const idx = this.config.layoutOrder.indexOf(this.currentID);
    this.currentIndex = idx === -1 ? null : idx;
  }
  loadLayout(ID) {
    let layout = this.layouts[ID];
    if (!layout) {
      layout = this.layouts[ID] = this.config.layoutFactories[ID]();
    }
    return layout;
  }
};
var LayoutStore = class {
  constructor(config) {
    this.config = config;
    this.store = {};
  }
  getCurrentLayout(srf) {
    return srf.ignore ? FloatingLayout.instance : this.getEntry(srf.id).currentLayout;
  }
  cycleLayout(srf, step) {
    if (srf.ignore) {
      return null;
    }
    return this.getEntry(srf.id).cycleLayout(step);
  }
  setLayout(srf, layoutClassID) {
    if (srf.ignore) {
      return null;
    }
    return this.getEntry(srf.id).setLayout(layoutClassID);
  }
  getEntry(key) {
    if (!this.store[key]) {
      this.store[key] = new LayoutStoreEntry(this.config);
    }
    return this.store[key];
  }
};

// src/engine/window_store.ts
var WindowStoreImpl = class {
  constructor(list = []) {
    this.list = list;
  }
  move(srcWin, destWin, after) {
    const srcIdx = this.list.indexOf(srcWin);
    const destIdx = this.list.indexOf(destWin);
    if (srcIdx === -1 || destIdx === -1) {
      return;
    }
    this.list.splice(srcIdx, 1);
    this.list.splice(after ? destIdx + 1 : destIdx, 0, srcWin);
  }
  putWindowToMaster(window) {
    const idx = this.list.indexOf(window);
    if (idx === -1) {
      return;
    }
    this.list.splice(idx, 1);
    this.list.splice(0, 0, window);
  }
  swap(alpha, beta) {
    const alphaIndex = this.list.indexOf(alpha);
    const betaIndex = this.list.indexOf(beta);
    if (alphaIndex < 0 || betaIndex < 0) {
      return;
    }
    this.list[alphaIndex] = beta;
    this.list[betaIndex] = alpha;
  }
  get length() {
    return this.list.length;
  }
  at(idx) {
    return this.list[idx];
  }
  indexOf(window) {
    return this.list.indexOf(window);
  }
  push(window) {
    this.list.push(window);
  }
  remove(window) {
    const idx = this.list.indexOf(window);
    if (idx >= 0) {
      this.list.splice(idx, 1);
    }
  }
  unshift(window) {
    this.list.unshift(window);
  }
  visibleWindowsOn(surf) {
    return this.list.filter((win) => win.visibleOn(surf));
  }
  visibleTiledWindowsOn(surf) {
    return this.list.filter((win) => win.tiled && win.visibleOn(surf));
  }
  visibleTileableWindowsOn(surf) {
    return this.list.filter((win) => win.tileable && win.visibleOn(surf));
  }
  tileableWindowsOn(surf) {
    return this.list.filter((win) => win.tileable && win.surface.id === surf.id);
  }
  allWindowsOn(surf) {
    return this.list.filter((win) => win.surface.id === surf.id);
  }
};

// src/engine/index.ts
var EngineImpl = class {
  constructor(controller, config, log) {
    this.controller = controller;
    this.config = config;
    this.log = log;
    this.layouts = new LayoutStore(this.config);
    this.windows = new WindowStoreImpl();
  }
  adjustLayout(basis) {
    const srf = basis.surface;
    const layout = this.layouts.getCurrentLayout(srf);
    if (layout.adjust) {
      const area = srf.workingArea.gap(this.config.screenGapLeft, this.config.screenGapRight, this.config.screenGapTop, this.config.screenGapBottom);
      const tiles = this.windows.visibleTiledWindowsOn(srf);
      layout.adjust(area, tiles, basis, basis.geometryDelta);
    }
  }
  resizeFloat(window, dir, step) {
    const srf = window.surface;
    const hStepSize = srf.workingArea.width * 0.05;
    const vStepSize = srf.workingArea.height * 0.05;
    let hStep, vStep;
    switch (dir) {
      case "east":
        hStep = step, vStep = 0;
        break;
      case "west":
        hStep = -step, vStep = 0;
        break;
      case "south":
        hStep = 0, vStep = step;
        break;
      case "north":
        hStep = 0, vStep = -step;
        break;
    }
    const geometry = window.actualGeometry;
    const width = geometry.width + hStepSize * hStep;
    const height = geometry.height + vStepSize * vStep;
    window.forceSetGeometry(new Rect(geometry.x, geometry.y, width, height));
  }
  resizeTile(basis, dir, step) {
    const srf = basis.surface;
    if (dir === "east") {
      const maxX = basis.geometry.maxX;
      const easternNeighbor = this.windows.visibleTiledWindowsOn(srf).filter((tile) => tile.geometry.x >= maxX);
      if (easternNeighbor.length === 0) {
        dir = "west";
        step *= -1;
      }
    } else if (dir === "south") {
      const maxY = basis.geometry.maxY;
      const southernNeighbor = this.windows.visibleTiledWindowsOn(srf).filter((tile) => tile.geometry.y >= maxY);
      if (southernNeighbor.length === 0) {
        dir = "north";
        step *= -1;
      }
    }
    const hStepSize = srf.workingArea.width * 0.03;
    const vStepSize = srf.workingArea.height * 0.03;
    let delta;
    switch (dir) {
      case "east":
        delta = new RectDelta(hStepSize * step, 0, 0, 0);
        break;
      case "west":
        delta = new RectDelta(0, hStepSize * step, 0, 0);
        break;
      case "south":
        delta = new RectDelta(0, 0, vStepSize * step, 0);
        break;
      case "north":
      default:
        delta = new RectDelta(0, 0, 0, vStepSize * step);
        break;
    }
    const layout = this.layouts.getCurrentLayout(srf);
    if (layout.adjust) {
      const area = srf.workingArea.gap(this.config.screenGapLeft, this.config.screenGapRight, this.config.screenGapTop, this.config.screenGapBottom);
      layout.adjust(area, this.windows.visibleTileableWindowsOn(srf), basis, delta);
    }
  }
  resizeWindow(window, dir, step) {
    const state = window.state;
    if (EngineWindowImpl.isFloatingState(state)) {
      this.resizeFloat(window, dir, step);
    } else if (EngineWindowImpl.isTiledState(state)) {
      this.resizeTile(window, dir, step);
    }
  }
  arrange() {
    this.log.log("arrange");
    this.controller.screens.forEach((driverSurface) => {
      this.arrangeScreen(driverSurface);
    });
  }
  arrangeScreen(screenSurface) {
    const layout = this.layouts.getCurrentLayout(screenSurface);
    const workingArea = screenSurface.workingArea;
    const tilingArea = this.getTilingArea(workingArea, layout);
    const visibleWindows = this.windows.visibleWindowsOn(screenSurface);
    this.log.log([
      "arrangeScreen",
      {
        layout,
        screenSurface,
        visibles: visibleWindows.length
      }
    ]);
    visibleWindows.forEach((win) => {
      if (win.state === WindowState.Undecided) {
        win.state = win.shouldFloat ? WindowState.Floating : WindowState.Tiled;
      }
    });
    const tileableWindows = this.windows.visibleTileableWindowsOn(screenSurface);
    if (this.config.maximizeSoleTile && tileableWindows.length === 1) {
      tileableWindows[0].state = WindowState.Maximized;
      tileableWindows[0].geometry = workingArea;
    } else if (tileableWindows.length > 0) {
      layout.apply(this.controller, tileableWindows, tilingArea);
    }
    if (this.config.limitTileWidthRatio > 0 && !(layout instanceof MonocleLayout)) {
      const maxWidth = Math.floor(workingArea.height * this.config.limitTileWidthRatio);
      tileableWindows.filter((tile) => tile.tiled && tile.geometry.width > maxWidth).forEach((tile) => {
        const g = tile.geometry;
        tile.geometry = new Rect(g.x + Math.floor((g.width - maxWidth) / 2), g.y, maxWidth, g.height);
      });
    }
    visibleWindows.forEach((win) => win.commit());
    this.log.log(["arrangeScreen/finished", { screenSurface }]);
  }
  currentLayoutOnCurrentSurface() {
    return this.layouts.getCurrentLayout(this.controller.currentSurface);
  }
  currentWindow() {
    return this.controller.currentWindow;
  }
  enforceSize(window) {
    if (window.tiled && !window.actualGeometry.equals(window.geometry)) {
      window.commit();
    }
  }
  manage(window) {
    if (!window.shouldIgnore) {
      window.state = WindowState.Undecided;
      if (this.config.newWindowAsMaster) {
        this.windows.unshift(window);
      } else {
        this.windows.push(window);
      }
    }
  }
  unmanage(window) {
    this.windows.remove(window);
  }
  focusOrder(step, includeHidden = false) {
    const window = this.controller.currentWindow;
    let windows;
    if (includeHidden) {
      windows = this.windows.allWindowsOn(this.controller.currentSurface);
    } else {
      windows = this.windows.visibleWindowsOn(this.controller.currentSurface);
    }
    if (windows.length === 0) {
      return;
    }
    if (window === null) {
      this.controller.currentWindow = windows[0];
      return;
    }
    const idx = windows.indexOf(window);
    if (!window || idx < 0) {
      this.controller.currentWindow = windows[0];
      return;
    }
    const num = windows.length;
    const newIndex = (idx + step % num + num) % num;
    this.controller.currentWindow = windows[newIndex];
  }
  focusDir(dir) {
    const window = this.controller.currentWindow;
    if (window === null) {
      const tiles = this.windows.visibleTiledWindowsOn(this.controller.currentSurface);
      if (tiles.length > 1) {
        this.controller.currentWindow = tiles[0];
      }
      return;
    }
    const neighbor = this.getNeighborByDirection(window, dir);
    if (neighbor) {
      this.controller.currentWindow = neighbor;
    }
  }
  swapOrder(window, step) {
    const srf = window.surface;
    const visibles = this.windows.visibleWindowsOn(srf);
    if (visibles.length < 2) {
      return;
    }
    const vsrc = visibles.indexOf(window);
    const vdst = wrapIndex(vsrc + step, visibles.length);
    const dstWin = visibles[vdst];
    this.windows.move(window, dstWin);
  }
  swapDirection(dir) {
    const window = this.controller.currentWindow;
    if (window === null) {
      const tiles = this.windows.visibleTiledWindowsOn(this.controller.currentSurface);
      if (tiles.length > 1) {
        this.controller.currentWindow = tiles[0];
      }
      return;
    }
    const neighbor = this.getNeighborByDirection(window, dir);
    if (neighbor) {
      this.windows.swap(window, neighbor);
    }
  }
  moveFloat(window, dir) {
    const srf = window.surface;
    const hStepSize = srf.workingArea.width * 0.05;
    const vStepSize = srf.workingArea.height * 0.05;
    let hStep, vStep;
    switch (dir) {
      case "up":
        hStep = 0, vStep = -1;
        break;
      case "down":
        hStep = 0, vStep = 1;
        break;
      case "left":
        hStep = -1, vStep = 0;
        break;
      case "right":
        hStep = 1, vStep = 0;
        break;
    }
    const geometry = window.actualGeometry;
    const x = geometry.x + hStepSize * hStep;
    const y = geometry.y + vStepSize * vStep;
    window.forceSetGeometry(new Rect(x, y, geometry.width, geometry.height));
  }
  swapDirOrMoveFloat(dir) {
    const window = this.controller.currentWindow;
    if (!window) {
      return;
    }
    const state = window.state;
    if (EngineWindowImpl.isFloatingState(state)) {
      this.moveFloat(window, dir);
    } else if (EngineWindowImpl.isTiledState(state)) {
      this.swapDirection(dir);
    }
  }
  toggleFloat(window) {
    window.state = !window.tileable ? WindowState.Tiled : WindowState.Floating;
  }
  setMaster(window) {
    this.windows.putWindowToMaster(window);
  }
  cycleLayout(step) {
    const layout = this.layouts.cycleLayout(this.controller.currentSurface, step);
    if (layout) {
      this.controller.showNotification(layout.description);
      if (this.isLayoutMonocleAndMinimizeRest() && this.controller.currentWindow) {
        this.minimizeOthers(this.controller.currentWindow);
      }
    }
  }
  setLayout(layoutClassID) {
    const layout = this.layouts.setLayout(this.controller.currentSurface, layoutClassID);
    if (layout) {
      this.controller.showNotification(layout.description);
      if (this.isLayoutMonocleAndMinimizeRest() && this.controller.currentWindow) {
        this.minimizeOthers(this.controller.currentWindow);
      }
    }
  }
  minimizeOthers(window) {
    for (const tile of this.windows.visibleTiledWindowsOn(window.surface)) {
      if (tile.screen == window.screen && tile.id !== window.id && this.windows.visibleTiledWindowsOn(window.surface).includes(window)) {
        tile.minimized = true;
      } else {
        tile.minimized = false;
      }
    }
  }
  isLayoutMonocleAndMinimizeRest() {
    return this.currentLayoutOnCurrentSurface() instanceof MonocleLayout && this.config.monocleMinimizeRest;
  }
  getNeighborByDirection(basis, dir) {
    let vertical;
    let sign;
    switch (dir) {
      case "up":
        vertical = true;
        sign = -1;
        break;
      case "down":
        vertical = true;
        sign = 1;
        break;
      case "left":
        vertical = false;
        sign = -1;
        break;
      case "right":
        vertical = false;
        sign = 1;
        break;
      default:
        return null;
    }
    const candidates = this.windows.visibleTiledWindowsOn(this.controller.currentSurface).filter(vertical ? (tile) => tile.geometry.y * sign > basis.geometry.y * sign : (tile) => tile.geometry.x * sign > basis.geometry.x * sign).filter(vertical ? (tile) => overlap(basis.geometry.x, basis.geometry.maxX, tile.geometry.x, tile.geometry.maxX) : (tile) => overlap(basis.geometry.y, basis.geometry.maxY, tile.geometry.y, tile.geometry.maxY));
    if (candidates.length === 0) {
      return null;
    }
    const min = sign * candidates.reduce(vertical ? (prevMin, tile) => Math.min(tile.geometry.y * sign, prevMin) : (prevMin, tile) => Math.min(tile.geometry.x * sign, prevMin), Infinity);
    const closest = candidates.filter(vertical ? (tile) => tile.geometry.y === min : (tile) => tile.geometry.x === min);
    return closest.sort((a, b) => b.timestamp - a.timestamp)[0];
  }
  showNotification(text) {
    this.controller.showNotification(text);
  }
  getTilingArea(workingArea, layout) {
    if (this.config.monocleMaximize && layout instanceof MonocleLayout) {
      return workingArea;
    } else {
      return workingArea.gap(this.config.screenGapLeft, this.config.screenGapRight, this.config.screenGapTop, this.config.screenGapBottom);
    }
  }
};

// src/driver/surface.ts
var DriverSurfaceImpl = class {
  constructor(screen, activity, desktop, activityInfo, kwinApi, config) {
    this.screen = screen;
    this.activity = activity;
    this.desktop = desktop;
    this.activityInfo = activityInfo;
    this.kwinApi = kwinApi;
    this.config = config;
    this.id = this.generateId();
    const activityName = activityInfo.activityName(activity);
    this.ignore = this.config.ignoreActivity.indexOf(activityName) >= 0 || this.config.ignoreScreen.indexOf(screen) >= 0;
    this.workingArea = Rect.fromQRect(this.kwinApi.workspace.clientArea(this.kwinApi.KWin.PlacementArea, screen, desktop));
  }
  next() {
    if (this.desktop === this.kwinApi.workspace.desktops) {
      return null;
    }
    return new DriverSurfaceImpl(this.screen, this.activity, this.desktop + 1, this.activityInfo, this.kwinApi, this.config);
  }
  toString() {
    const activityName = this.activityInfo.activityName(this.activity);
    return `DriverSurface(${this.screen}, ${activityName}, ${this.desktop})`;
  }
  generateId() {
    let path = String(this.screen);
    if (this.config.layoutPerActivity) {
      path += `@${this.activity}`;
    }
    if (this.config.layoutPerDesktop) {
      path += `"#${this.desktop}`;
    }
    return path;
  }
};

// src/driver/window.ts
var DriverWindowImpl = class {
  constructor(client, qml, kwinApi, config, log) {
    this.client = client;
    this.qml = qml;
    this.kwinApi = kwinApi;
    this.config = config;
    this.log = log;
    this.id = DriverWindowImpl.generateID(client);
    this.maximized = false;
    this.noBorderManaged = false;
    this.noBorderOriginal = client.noBorder;
  }
  get fullScreen() {
    return this.client.fullScreen;
  }
  get geometry() {
    return Rect.fromQRect(this.client.geometry);
  }
  get active() {
    return this.client.active;
  }
  get shouldIgnore() {
    const resourceClass = String(this.client.resourceClass);
    const resourceName = String(this.client.resourceName);
    const windowRole = String(this.client.windowRole);
    return this.client.specialWindow || resourceClass === "plasmashell" || resourceClass === "ksmserver" || resourceClass === "org.kde.plasmashell" || resourceClass === "krunner" || resourceClass === "kded5" || this.config.ignoreClass.indexOf(resourceClass) >= 0 || this.config.ignoreClass.indexOf(resourceName) >= 0 || matchWords(this.client.caption, this.config.ignoreTitle) >= 0 || this.config.ignoreRole.indexOf(windowRole) >= 0;
  }
  get shouldFloat() {
    const resourceClass = String(this.client.resourceClass);
    const resourceName = String(this.client.resourceName);
    return this.client.modal || !this.client.resizeable || this.config.floatUtility && (this.client.dialog || this.client.splash || this.client.utility) || this.config.floatingClass.indexOf(resourceClass) >= 0 || this.config.floatingClass.indexOf(resourceName) >= 0 || matchWords(this.client.caption, this.config.floatingTitle) >= 0;
  }
  get screen() {
    return this.client.screen;
  }
  get minimized() {
    return this.client.minimized;
  }
  set minimized(min) {
    this.client.minimized = min;
  }
  get shaded() {
    return this.client.shade;
  }
  get surface() {
    let activity;
    if (this.client.activities.length === 0) {
      activity = this.kwinApi.workspace.currentActivity;
    } else if (this.client.activities.indexOf(this.kwinApi.workspace.currentActivity) >= 0) {
      activity = this.kwinApi.workspace.currentActivity;
    } else {
      activity = this.client.activities[0];
    }
    const desktop = this.client.desktop >= 0 ? this.client.desktop : this.kwinApi.workspace.currentDesktop;
    return new DriverSurfaceImpl(this.client.screen, activity, desktop, this.qml.activityInfo, this.kwinApi, this.config);
  }
  set surface(surf) {
    const surfImpl = surf;
    if (this.client.desktop !== surfImpl.desktop) {
      this.client.desktop = surfImpl.desktop;
    }
  }
  static generateID(client) {
    return `${String(client)}/${client.windowId}`;
  }
  commit(geometry, noBorder, keepAbove) {
    this.log.log(`[DriverWindow#commit] Called with params: {
         geometry: ${geometry},
         noBorder: ${noBorder},
         keepAbove: ${keepAbove}
        } for window ${this} on the screen ${this.screen}
      `);
    if (this.client.move || this.client.resize) {
      return;
    }
    if (noBorder !== void 0) {
      if (!this.noBorderManaged && noBorder) {
        this.noBorderOriginal = this.client.noBorder;
      } else if (this.noBorderManaged && !this.client.noBorder) {
        this.noBorderOriginal = false;
      }
      if (noBorder) {
        this.client.noBorder = true;
      } else if (this.noBorderManaged) {
        this.client.noBorder = this.noBorderOriginal;
      }
      this.noBorderManaged = noBorder;
    }
    if (keepAbove !== void 0) {
      this.client.keepAbove = keepAbove;
    }
    if (geometry !== void 0) {
      geometry = this.adjustGeometry(geometry);
      if (this.config.preventProtrusion) {
        const area = Rect.fromQRect(this.kwinApi.workspace.clientArea(this.kwinApi.KWin.PlacementArea, this.client.screen, this.kwinApi.workspace.currentDesktop));
        if (!area.includes(geometry)) {
          const x = geometry.x + Math.min(area.maxX - geometry.maxX, 0);
          const y = geometry.y + Math.min(area.maxY - geometry.maxY, 0);
          geometry = new Rect(x, y, geometry.width, geometry.height);
          geometry = this.adjustGeometry(geometry);
        }
      }
      this.client.geometry = geometry.toQRect();
    }
  }
  toString() {
    return `KWin(${this.client.windowId.toString(16)}.${this.client.resourceClass})`;
  }
  visibleOn(surf) {
    const surfImpl = surf;
    return !this.client.minimized && (this.client.desktop === surfImpl.desktop || this.client.desktop === -1) && (this.client.activities.length === 0 || this.client.activities.indexOf(surfImpl.activity) !== -1) && this.client.screen === surfImpl.screen;
  }
  adjustGeometry(geometry) {
    let width = geometry.width;
    let height = geometry.height;
    if (!this.client.resizeable) {
      width = this.client.geometry.width;
      height = this.client.geometry.height;
    } else {
      width = clip(width, this.client.minSize.width, this.client.maxSize.width);
      height = clip(height, this.client.minSize.height, this.client.maxSize.height);
    }
    return new Rect(geometry.x, geometry.y, width, height);
  }
  get isDialog() {
    return this.client.dialog;
  }
};

// src/driver/index.ts
var DriverImpl = class {
  constructor(qmlObjects, kwinApi, controller, config, log) {
    this.log = log;
    this.config = config;
    if (this.config.preventMinimize && this.config.monocleMinimizeRest) {
      log.log("preventMinimize is disabled because of monocleMinimizeRest");
      this.config.preventMinimize = false;
    }
    this.controller = controller;
    this.windowMap = new WrapperMap((client) => DriverWindowImpl.generateID(client), (client) => new EngineWindowImpl(new DriverWindowImpl(client, this.qml, this.kwinApi, this.config, this.log), this.config, this.log));
    this.entered = false;
    this.qml = qmlObjects;
    this.kwinApi = kwinApi;
  }
  get currentSurface() {
    return new DriverSurfaceImpl(this.kwinApi.workspace.activeClient ? this.kwinApi.workspace.activeClient.screen : 0, this.kwinApi.workspace.currentActivity, this.kwinApi.workspace.currentDesktop, this.qml.activityInfo, this.kwinApi, this.config);
  }
  set currentSurface(value) {
    const kwinSurface = value;
    if (this.kwinApi.workspace.currentDesktop !== kwinSurface.desktop) {
      this.kwinApi.workspace.currentDesktop = kwinSurface.desktop;
    }
  }
  get currentWindow() {
    const client = this.kwinApi.workspace.activeClient;
    return client ? this.windowMap.get(client) : null;
  }
  set currentWindow(window) {
    if (window !== null) {
      this.kwinApi.workspace.activeClient = window.window.client;
    }
  }
  get screens() {
    const screensArr = [];
    for (let screen = 0; screen < this.kwinApi.workspace.numScreens; screen++) {
      screensArr.push(new DriverSurfaceImpl(screen, this.kwinApi.workspace.currentActivity, this.kwinApi.workspace.currentDesktop, this.qml.activityInfo, this.kwinApi, this.config));
    }
    return screensArr;
  }
  bindEvents() {
    const onNumberScreensChanged = (count) => {
      this.controller.onSurfaceUpdate(`screens=${count}`);
    };
    const onScreenResized = (screen) => {
      const srf = new DriverSurfaceImpl(screen, this.kwinApi.workspace.currentActivity, this.kwinApi.workspace.currentDesktop, this.qml.activityInfo, this.kwinApi, this.config);
      this.controller.onSurfaceUpdate("resized " + srf.toString());
    };
    const onCurrentActivityChanged = (_activity) => {
      this.controller.onCurrentSurfaceChanged();
    };
    const onCurrentDesktopChanged = (_desktop, _client) => {
      this.controller.onCurrentSurfaceChanged();
    };
    const onClientAdded = (client) => {
      this.log.log(`Client added: ${client}`);
      const window = this.windowMap.add(client);
      this.controller.onWindowAdded(window);
      if (window.state === WindowState.Unmanaged) {
        this.log.log(`Window becomes unmanaged and gets removed :( The client was ${client}`);
        this.windowMap.remove(client);
      } else {
        this.log.log(`Client is ok, can manage. Bind events now...`);
        this.bindWindowEvents(window, client);
      }
    };
    const onClientRemoved = (client) => {
      const window = this.windowMap.get(client);
      if (window) {
        this.controller.onWindowRemoved(window);
        this.windowMap.remove(client);
      }
    };
    const onClientMaximizeSet = (client, h, v) => {
      const maximized = h === true && v === true;
      const window = this.windowMap.get(client);
      if (window) {
        window.window.maximized = maximized;
        this.controller.onWindowMaximizeChanged(window, maximized);
      }
    };
    const onClientFullScreenSet = (client, fullScreen, user) => {
      this.controller.onWindowChanged(this.windowMap.get(client), `fullscreen=${fullScreen} user=${user}`);
    };
    const onClientMinimized = (client) => {
      if (this.config.preventMinimize) {
        client.minimized = false;
        this.kwinApi.workspace.activeClient = client;
      } else {
        this.controller.onWindowChanged(this.windowMap.get(client), "minimized");
      }
    };
    const onClientUnminimized = (client) => this.controller.onWindowChanged(this.windowMap.get(client), "unminimized");
    this.connect(this.kwinApi.workspace.numberScreensChanged, onNumberScreensChanged);
    this.connect(this.kwinApi.workspace.screenResized, onScreenResized);
    this.connect(this.kwinApi.workspace.currentActivityChanged, onCurrentActivityChanged);
    this.connect(this.kwinApi.workspace.currentDesktopChanged, onCurrentDesktopChanged);
    this.connect(this.kwinApi.workspace.clientAdded, onClientAdded);
    this.connect(this.kwinApi.workspace.clientRemoved, onClientRemoved);
    this.connect(this.kwinApi.workspace.clientMaximizeSet, onClientMaximizeSet);
    this.connect(this.kwinApi.workspace.clientFullScreenSet, onClientFullScreenSet);
    this.connect(this.kwinApi.workspace.clientMinimized, onClientMinimized);
    this.connect(this.kwinApi.workspace.clientUnminimized, onClientUnminimized);
  }
  manageWindows() {
    const clients = this.kwinApi.workspace.clientList();
    for (let i = 0; i < clients.length; i++) {
      this.manageWindow(clients[i]);
    }
  }
  manageWindow(client) {
    const window = this.windowMap.add(client);
    if (window.shouldIgnore) {
      this.windowMap.remove(client);
      return;
    }
    this.bindWindowEvents(window, client);
    this.controller.manageWindow(window);
  }
  showNotification(text) {
    this.qml.popupDialog.show(text);
  }
  bindShortcut(action) {
    this.kwinApi.KWin.registerShortcut(action.key, action.description, action.defaultKeybinding, () => {
      this.enter(() => action.execute());
    });
  }
  connect(signal, handler) {
    const wrapper = (...args) => {
      if (typeof this.kwinApi.workspace === "undefined")
        signal.disconnect(wrapper);
      else
        this.enter(() => handler.apply(this, args));
    };
    signal.connect(wrapper);
    return wrapper;
  }
  enter(callback) {
    if (this.entered) {
      return;
    }
    this.entered = true;
    try {
      callback();
    } catch (e) {
      this.log.log(e);
    } finally {
      this.entered = false;
    }
  }
  bindWindowEvents(window, client) {
    let moving = false;
    let resizing = false;
    this.connect(client.moveResizedChanged, () => {
      this.log.log([
        "moveResizedChanged",
        { window, move: client.move, resize: client.resize }
      ]);
      if (moving !== client.move) {
        moving = client.move;
        if (moving) {
          this.controller.onWindowMoveStart(window);
        } else {
          this.controller.onWindowMoveOver(window);
        }
      }
      if (resizing !== client.resize) {
        resizing = client.resize;
        if (resizing) {
          this.controller.onWindowResizeStart(window);
        } else {
          this.controller.onWindowResizeOver(window);
        }
      }
    });
    this.connect(client.geometryChanged, () => {
      if (moving) {
        this.controller.onWindowMove(window);
      } else if (resizing) {
        this.controller.onWindowResize(window);
      } else {
        if (!window.actualGeometry.equals(window.geometry)) {
          this.controller.onWindowGeometryChanged(window);
        }
      }
    });
    this.connect(client.activeChanged, () => {
      if (client.active) {
        this.controller.onWindowFocused(window);
      }
    });
    this.connect(client.screenChanged, () => this.controller.onWindowChanged(window, `screen=${client.screen}`));
    this.connect(client.activitiesChanged, () => this.controller.onWindowChanged(window, "activity=" + client.activities.join(",")));
    this.connect(client.desktopChanged, () => this.controller.onWindowChanged(window, `desktop=${client.desktop}`));
    this.connect(client.shadeChanged, () => {
      this.controller.onWindowShadeChanged(window);
    });
  }
};
var WrapperMap = class {
  constructor(hasher, wrapper) {
    this.hasher = hasher;
    this.wrapper = wrapper;
    this.items = {};
  }
  add(item) {
    const key = this.hasher(item);
    if (this.items[key] !== void 0) {
      throw "WrapperMap: the key [" + key + "] already exists!";
    }
    const wrapped = this.wrapper(item);
    this.items[key] = wrapped;
    return wrapped;
  }
  get(item) {
    const key = this.hasher(item);
    return this.items[key] || null;
  }
  getByKey(key) {
    return this.items[key] || null;
  }
  remove(item) {
    const key = this.hasher(item);
    return delete this.items[key];
  }
};

// src/controller/index.ts
var ControllerImpl = class {
  constructor(qmlObjects, kwinApi, config, log) {
    this.config = config;
    this.log = log;
    this.engine = new EngineImpl(this, config, log);
    this.driver = new DriverImpl(qmlObjects, kwinApi, this, config, log);
  }
  start() {
    this.log.log("Let's get down to bismuth!");
    this.driver.bindEvents();
    this.bindShortcuts();
    this.driver.manageWindows();
    this.engine.arrange();
  }
  get screens() {
    return this.driver.screens;
  }
  get currentWindow() {
    return this.driver.currentWindow;
  }
  set currentWindow(value) {
    this.driver.currentWindow = value;
  }
  get currentSurface() {
    return this.driver.currentSurface;
  }
  set currentSurface(value) {
    this.driver.currentSurface = value;
  }
  showNotification(text) {
    this.driver.showNotification(text);
  }
  onSurfaceUpdate(comment) {
    this.log.log(["onSurfaceUpdate", { comment }]);
    this.engine.arrange();
  }
  onCurrentSurfaceChanged() {
    this.log.log(["onCurrentSurfaceChanged", { srf: this.currentSurface }]);
    this.engine.arrange();
  }
  onWindowAdded(window) {
    this.log.log(["onWindowAdded", { window }]);
    this.engine.manage(window);
    if (window.tileable) {
      const srf = this.currentSurface;
      const tiles = this.engine.windows.visibleTiledWindowsOn(srf);
      const layoutCapacity = this.engine.layouts.getCurrentLayout(srf).capacity;
      if (layoutCapacity !== void 0 && tiles.length > layoutCapacity) {
        const nextSurface = this.currentSurface.next();
        if (nextSurface) {
          window.surface = nextSurface;
          this.currentSurface = nextSurface;
        }
      }
    }
    this.engine.arrange();
  }
  onWindowRemoved(window) {
    this.log.log(`[Controller#onWindowRemoved] Window removed: ${window}`);
    this.engine.unmanage(window);
    if (this.engine.isLayoutMonocleAndMinimizeRest()) {
      if (!this.currentWindow) {
        this.log.log(`[Controller#onWindowRemoved] Switching to the minimized window`);
        this.engine.focusOrder(1, true);
      }
    }
    this.engine.arrange();
  }
  onWindowMoveStart(_window) {
  }
  onWindowMove(_window) {
  }
  onWindowMoveOver(window) {
    this.log.log(["onWindowMoveOver", { window }]);
    if (window.state === WindowState.Tiled) {
      const tiles = this.engine.windows.visibleTiledWindowsOn(this.currentSurface);
      const windowCenter = window.actualGeometry.center;
      const targets = tiles.filter((tile) => tile !== window && tile.actualGeometry.includesPoint(windowCenter));
      if (targets.length === 1) {
        this.engine.windows.swap(window, targets[0]);
        this.engine.arrange();
        return;
      }
    }
    if (window.state === WindowState.Tiled) {
      const diff = window.actualGeometry.subtract(window.geometry);
      const distance = Math.sqrt(diff.x ** 2 + diff.y ** 2);
      if (distance > 30) {
        window.floatGeometry = window.actualGeometry;
        window.state = WindowState.Floating;
        this.engine.arrange();
        return;
      }
    }
    window.commit();
  }
  onWindowResizeStart(_window) {
  }
  onWindowResize(window) {
    this.log.log(["onWindowResize", { window }]);
    if (this.config.adjustLayout && this.config.adjustLayoutLive) {
      if (window.state === WindowState.Tiled) {
        this.engine.adjustLayout(window);
        this.engine.arrange();
      }
    }
  }
  onWindowResizeOver(window) {
    this.log.log(["onWindowResizeOver", { window }]);
    if (this.config.adjustLayout && window.tiled) {
      this.engine.adjustLayout(window);
      this.engine.arrange();
    } else if (!this.config.adjustLayout) {
      this.engine.enforceSize(window);
    }
  }
  onWindowMaximizeChanged(_window, _maximized) {
    this.engine.arrange();
  }
  onWindowGeometryChanged(window) {
    this.log.log(["onWindowGeometryChanged", { window }]);
    this.engine.enforceSize(window);
  }
  onWindowChanged(window, comment) {
    if (window) {
      this.log.log(["onWindowChanged", { window, comment }]);
      if (comment === "unminimized") {
        this.currentWindow = window;
      }
      this.engine.arrange();
    }
  }
  onWindowFocused(win) {
    win.timestamp = new Date().getTime();
    if (this.engine.isLayoutMonocleAndMinimizeRest()) {
      this.engine.minimizeOthers(win);
    }
  }
  onWindowShadeChanged(win) {
    this.log.log(`onWindowShadeChanged, window: ${win}`);
    if (win.shaded) {
      win.state = WindowState.Floating;
    } else {
      win.state = win.statePreviouslyAskedToChangeTo;
    }
    this.engine.arrange();
  }
  manageWindow(win) {
    this.engine.manage(win);
  }
  bindShortcuts() {
    const allPossibleActions = [
      new FocusNextWindow(this.engine, this.log),
      new FocusPreviousWindow(this.engine, this.log),
      new FocusUpperWindow(this.engine, this.log),
      new FocusBottomWindow(this.engine, this.log),
      new FocusLeftWindow(this.engine, this.log),
      new FocusRightWindow(this.engine, this.log),
      new MoveActiveWindowToNextPosition(this.engine, this.log),
      new MoveActiveWindowToPreviousPosition(this.engine, this.log),
      new MoveActiveWindowUp(this.engine, this.log),
      new MoveActiveWindowDown(this.engine, this.log),
      new MoveActiveWindowLeft(this.engine, this.log),
      new MoveActiveWindowRight(this.engine, this.log),
      new IncreaseActiveWindowWidth(this.engine, this.log),
      new IncreaseActiveWindowHeight(this.engine, this.log),
      new DecreaseActiveWindowWidth(this.engine, this.log),
      new DecreaseActiveWindowHeight(this.engine, this.log),
      new IncreaseMasterAreaWindowCount(this.engine, this.log),
      new DecreaseMasterAreaWindowCount(this.engine, this.log),
      new IncreaseLayoutMasterAreaSize(this.engine, this.log),
      new DecreaseLayoutMasterAreaSize(this.engine, this.log),
      new ToggleActiveWindowFloating(this.engine, this.log),
      new PushActiveWindowIntoMasterAreaFront(this.engine, this.log),
      new SwitchToNextLayout(this.engine, this.log),
      new SwitchToPreviousLayout(this.engine, this.log),
      new SetTileLayout(this.engine, this.log),
      new SetMonocleLayout(this.engine, this.log),
      new SetThreeColumnLayout(this.engine, this.log),
      new SetStairLayout(this.engine, this.log),
      new SetSpreadLayout(this.engine, this.log),
      new SetFloatingLayout(this.engine, this.log),
      new SetQuarterLayout(this.engine, this.log),
      new Rotate(this.engine, this.log),
      new RotatePart(this.engine, this.log)
    ];
    for (const action of allPossibleActions) {
      this.driver.bindShortcut(action);
    }
  }
};

// src/util/log.ts
var LogImpl = class {
  constructor(config) {
    this.enabled = config.debugEnabled;
    this.started = new Date().getTime();
  }
  log(logObj) {
    if (this.enabled) {
      this.doLog(logObj);
    }
  }
  doLog(logObj) {
    if (Object.prototype.toString.call(logObj) === "[object Array]") {
      this.logArray(logObj);
    } else if (typeof logObj == "string") {
      this.logString(logObj);
    } else if (typeof logObj == "object") {
      this.logObject(logObj);
    }
  }
  logObject(obj) {
    const objectName = obj.constructor.name;
    const logQueue = [];
    for (const i in obj) {
      logQueue.push(`${i}: ${obj[i]}`);
    }
    this.logString(`${objectName}: ${logQueue.join(", ")}`);
  }
  logString(str) {
    console.log(`[Bismuth] [${this.now()}] ${str}`);
  }
  logArray(arr) {
    for (const element of arr) {
      this.doLog(element);
    }
  }
  now() {
    return (new Date().getTime() - this.started) / 1e3;
  }
};

// src/index.ts
function init(qmlObjects, kwinScriptingApi) {
  const config = new ConfigImpl(kwinScriptingApi);
  const logger = new LogImpl(config);
  const controller = new ControllerImpl(qmlObjects, kwinScriptingApi, config, logger);
  controller.start();
}
export {
  init
};
