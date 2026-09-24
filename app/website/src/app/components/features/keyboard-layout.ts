/**
 * 全尺寸（ANSI 104 键）键盘 + 鼠标画布的布局数据。
 *
 * 设计要点
 * - `id` 一律使用 Source 引擎键名（与 cfg 里 bind 的第一个参数完全一致），高亮时可直接查表，
 *   不做任何名称转换；这样将来 cfg 新增按键，画布无需改动就会亮起来。
 * - 键名用真实 Source 名（如 escape / ins / kp_del / mwheelup），未绑定的键也会渲染，
 *   由 UI 显示「未绑定」——保持键盘形态完整，也让「这个键没用到」本身成为信息。
 * - 纯装饰位（如功能键行与主键区之间的空档）用 id: null。
 */

export interface KeyDef {
  /** Source 键名；null = 装饰空位 */
  id: string | null;
  /** 键帽主标签 */
  label: string;
  /** 键帽副标签（数字键上排符号等） */
  sub?: string;
  /** 宽度，单位 = 标准键宽 */
  w?: number;
}

/** 主键区：6 行，按 ANSI 全尺寸排布。 */
export const MAIN_ROWS: KeyDef[][] = [
  [
    { id: "escape", label: "Esc" },
    { id: "f1", label: "F1" },
    { id: "f2", label: "F2" },
    { id: "f3", label: "F3" },
    { id: "f4", label: "F4" },
    { id: "f5", label: "F5" },
    { id: "f6", label: "F6" },
    { id: "f7", label: "F7" },
    { id: "f8", label: "F8" },
    { id: "f9", label: "F9" },
    { id: "f10", label: "F10" },
    { id: "f11", label: "F11" },
    { id: "f12", label: "F12" },
  ],
  [
    { id: "`", label: "`", sub: "~" },
    { id: "1", label: "1", sub: "!" },
    { id: "2", label: "2", sub: "@" },
    { id: "3", label: "3", sub: "#" },
    { id: "4", label: "4", sub: "$" },
    { id: "5", label: "5", sub: "%" },
    { id: "6", label: "6", sub: "^" },
    { id: "7", label: "7", sub: "&" },
    { id: "8", label: "8", sub: "*" },
    { id: "9", label: "9", sub: "(" },
    { id: "0", label: "0", sub: ")" },
    { id: "-", label: "-", sub: "_" },
    { id: "=", label: "=", sub: "+" },
    { id: "backspace", label: "Backspace", w: 2 },
  ],
  [
    { id: "tab", label: "Tab", w: 1.5 },
    { id: "q", label: "Q" },
    { id: "w", label: "W" },
    { id: "e", label: "E" },
    { id: "r", label: "R" },
    { id: "t", label: "T" },
    { id: "y", label: "Y" },
    { id: "u", label: "U" },
    { id: "i", label: "I" },
    { id: "o", label: "O" },
    { id: "p", label: "P" },
    { id: "[", label: "[", sub: "{" },
    { id: "]", label: "]", sub: "}" },
    { id: "\\", label: "\\", sub: "|", w: 1.5 },
  ],
  [
    { id: "capslock", label: "Caps", w: 1.75 },
    { id: "a", label: "A" },
    { id: "s", label: "S" },
    { id: "d", label: "D" },
    { id: "f", label: "F" },
    { id: "g", label: "G" },
    { id: "h", label: "H" },
    { id: "j", label: "J" },
    { id: "k", label: "K" },
    { id: "l", label: "L" },
    { id: ";", label: ";", sub: ":" },
    { id: "'", label: "'", sub: '"' },
    { id: "enter", label: "Enter", w: 2.25 },
  ],
  [
    { id: "shift", label: "Shift", w: 2.25 },
    { id: "z", label: "Z" },
    { id: "x", label: "X" },
    { id: "c", label: "C" },
    { id: "v", label: "V" },
    { id: "b", label: "B" },
    { id: "n", label: "N" },
    { id: "m", label: "M" },
    { id: ",", label: ",", sub: "<" },
    { id: ".", label: ".", sub: ">" },
    { id: "/", label: "/", sub: "?" },
    { id: "rshift", label: "Shift", w: 2.75 },
  ],
  [
    { id: "ctrl", label: "Ctrl", w: 1.25 },
    { id: null, label: "Win", w: 1.25 },
    { id: "alt", label: "Alt", w: 1.25 },
    { id: "space", label: "Space", w: 6.25 },
    { id: "ralt", label: "Alt", w: 1.25 },
    { id: null, label: "Win", w: 1.25 },
    { id: null, label: "Menu", w: 1.25 },
    { id: "rctrl", label: "Ctrl", w: 1.25 },
  ],
];

/** 编辑区：Ins/Home/PgUp 与 Del/End/PgDn 两行 + 方向键两行。 */
export const NAV_ROWS: KeyDef[][] = [
  [
    { id: "ins", label: "Ins" },
    { id: "home", label: "Home" },
    { id: "pgup", label: "PgUp" },
  ],
  [
    { id: "del", label: "Del" },
    { id: "end", label: "End" },
    { id: "pgdn", label: "PgDn" },
  ],
  [
    { id: null, label: "" },
    { id: "uparrow", label: "↑" },
    { id: null, label: "" },
  ],
  [
    { id: "leftarrow", label: "←" },
    { id: "downarrow", label: "↓" },
    { id: "rightarrow", label: "→" },
  ],
];

