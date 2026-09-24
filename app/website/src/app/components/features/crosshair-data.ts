/**
 * 准星 / 视角库的数据类型与读取。
 *
 * 数据由 scripts/extract-crosshair.mjs 从 config/srp-cfg 生成（唯一真源），
 * 与 keymaps.json、commands.json 同一套做法：随 bundle 打包，不做运行时 fetch。
 *
 * 图片走目录约定 —— 文件名即预设 id，构建时扫描 public/images/crosshair/ 得到。
 */
import crosshairJson from "../../../data/generated/crosshair.json" with { type: "json" };

export interface ConvarEntry {
  name: string;
  value: string;
}

export interface Preset {
  id: string;
  index: string;
  label: string;
  /** 定义它的 cfg 文件（视角预设定义在 runtime.cfg，不是独立文件） */
  file: string;
  /** 在控制台输入它即可直接应用这个预设 */
  alias: string;
  convars: ConvarEntry[];
  /**
   * 2026-09-22 准星改版后已被 Valve 删除、但仍写在这些预设里的 convar。
   * 当前页面不展示这个结论（按「全部展示，不提交效」的选择），数据保留备用。
   */
  removedConvars: string[];
  /** 截图路径；目录里没有对应文件时为 null，页面显示占位框 */
  image: string | null;
}

export interface ColorEntry {
  alias: string;
  r: number;
  g: number;
  b: number;
  hex: string;
}

export interface ExtraEntry {
  alias: string;
  body: string;
  comment: string;
}

export interface CrosshairData {
  cycles: { crosshair: string | null; viewmodel: string | null };
  crosshairs: Preset[];
  viewmodels: Preset[];
  colors: ColorEntry[];
  extras: ExtraEntry[];
}

export const crosshair = crosshairJson as CrosshairData;

/** 目录约定：图片应放在哪、叫什么名字 —— 占位框里要显示给维护者看。 */
export const imageHint = (id: string) => `public/images/crosshair/${id}.png`;
