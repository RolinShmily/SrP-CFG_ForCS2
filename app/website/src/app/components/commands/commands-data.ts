/**
 * 指令检索中心共享数据（L3.4）。
 * commands.json（public/data，2785 条）随路由模块打包（gzip 后 ~169KB，任务允许"随包下发"）；
 * 检索增强字段（n_lower/cn_lower/en_lower/value_lower/pinyin）由 enhance() 模块级计算一次。
 * 过滤/拼音逻辑与旧 commands.astro 的 script 一致。
 */
import commandsJson from "../../../../public/data/commands.json";

export interface CommandValueRange {
  min?: string;
  max?: string;
}

export interface CommandValueOption {
  value: string;
  label: string;
}

export interface CommandValueInfo {
  constraint?: CommandValueRange;
  documented_range?: CommandValueRange;
  options?: CommandValueOption[];
  description: string;
}

export interface CommandRecord {
  n: string;
  d?: string;
  f?: string[];
  en?: string;
  t: "cmd" | "var";
  cn?: string;
  c: string;
  value?: CommandValueInfo;
  // 以下为检索增强字段（enhance() 计算）
  n_lower: string;
  cn_lower: string;
  en_lower: string;
  value_lower: string;
  pinyin: string[];
}

export interface CommandCategory {
  id: string;
  label: string;
}

export const categories: CommandCategory[] = [
  { id: "all", label: "全部类别" },
  { id: "network", label: "网络与延迟" },
  { id: "graphics", label: "帧率与画面" },
  { id: "audio", label: "声音与语音" },
  { id: "mouse", label: "鼠标与输入" },
  { id: "gameplay", label: "准星与游戏性" },
  { id: "cheats", label: "作弊指令" },
  { id: "practice", label: "跑图与练习" },
  { id: "system", label: "系统与引擎" },
];

export const categoryKeywords: Record<string, string[]> = {
  network: ["network", "ping", "delay", "interp", "packet", "rate", "网络", "延迟", "丢包", "插值", "网络设置", "上传", "下载"],
  graphics: ["graphics", "fps", "video", "render", "resolution", "画面", "帧率", "渲染", "显卡", "画质", "分辨率"],
  audio: ["audio", "sound", "volume", "voice", "mic", "音频", "声音", "主音量", "麦克风", "语音"],
  mouse: ["mouse", "sensitivity", "input", "raw", "m_", "鼠标", "灵敏度", "输入", "加速度"],
  gameplay: ["gameplay", "crosshair", "viewmodel", "hud", "radar", "cl_", "游戏性", "准星", "持枪", "雷达", "界面", "显示", "准星大小", "血条"],
  cheats: ["cheats", "sv_cheats", "noclip", "god", "give", "作弊", "穿墙", "无敌", "刷武器", "作弊码"],
  practice: ["practice", "grenade", "trajectory", "spawn", "bot", "练习", "投掷物", "弹道", "机器人", "热身", "重生点", "跑图"],
  system: ["system", "engine", "con_", "exec", "bind", "quit", "系统", "引擎", "绑定", "按键", "控制台", "清除"],
};

function enhance(cmd: (typeof commandsJson)[number]): CommandRecord {
  const n_lower = cmd.n.toLowerCase();
  const cn_lower = (cmd.cn || "").toLowerCase();
  const en_lower = (cmd.en || "").toLowerCase();
  const value_lower = [
    cmd.value?.description || "",
    cmd.value?.constraint?.min || "",
    cmd.value?.constraint?.max || "",
    cmd.value?.documented_range?.min || "",
    cmd.value?.documented_range?.max || "",
    ...(cmd.value?.options || []).flatMap((option) => [option.value, option.label]),
  ]
    .join(" ")
    .toLowerCase();
  const pinyin: string[] = [];
  if (cn_lower.includes("准星")) pinyin.push("zx", "zhunxing");
  if (cn_lower.includes("灵敏度")) pinyin.push("lmd", "lingmingdu");
  if (cn_lower.includes("延迟") || cn_lower.includes("网络")) pinyin.push("yc", "wl", "yanci", "wangluo");
  if (cn_lower.includes("声音") || cn_lower.includes("音量")) pinyin.push("sy", "yl", "shengyin", "yinliang");
  if (cn_lower.includes("画面") || cn_lower.includes("帧率")) pinyin.push("hm", "zl", "huamian", "zhenlv", "fps");
  if (cn_lower.includes("投掷") || cn_lower.includes("练习") || cn_lower.includes("跑图"))
    pinyin.push("tz", "lx", "pt", "touzhi", "lianxi", "paotu");
  if (cn_lower.includes("作弊")) pinyin.push("zb", "zuobi");
  if (cn_lower.includes("显示") || cn_lower.includes("持枪")) pinyin.push("xs", "cq", "xianshi", "chiqiang");
  return {
    ...cmd,
    // JSON 导入会把字面量放宽为 string，这里收窄回联合类型
    t: cmd.t as CommandRecord["t"],
    n_lower,
    cn_lower,
    en_lower,
    value_lower,
    pinyin,
  };
}

export const commands = commandsJson.map(enhance);

export interface FilterOptions {
  category: string;
  type: "all" | "cmd" | "var";
  excludeCheats: boolean;
  query: string;
}

export function filterCommands(list: CommandRecord[], options: FilterOptions): CommandRecord[] {
  const { category, type, excludeCheats, query } = options;
  const q = query.trim().toLowerCase();
  return list.filter((cmd) => {
    if (category !== "all" && cmd.c !== category) return false;
    if (type !== "all" && cmd.t !== type) return false;
    if (excludeCheats && cmd.f && cmd.f.includes("cheat")) return false;

    if (q) {
      const nameMatch = cmd.n_lower.includes(q);
      const cnMatch = cmd.cn_lower.includes(q);
      const enMatch = cmd.en_lower.includes(q);
      const valueMatch = cmd.value_lower.includes(q);
      const pyMatch = cmd.pinyin.some((p) => p.includes(q));

      let catKeywordMatch = false;
      if (categoryKeywords[category]) {
        catKeywordMatch = categoryKeywords[category].some((k) => k.includes(q));
      } else {
        for (const key in categoryKeywords) {
          if (cmd.c === key && categoryKeywords[key].some((k) => k.includes(q))) {
            catKeywordMatch = true;
            break;
          }
        }
      }

      if (!nameMatch && !cnMatch && !enMatch && !valueMatch && !pyMatch && !catKeywordMatch) {
        return false;
      }
    }
    return true;
  });
}

/** 初始可见条数（首屏 SEO：构建期预渲染前 50 张卡片进 HTML） */
export const INITIAL_PAGE_SIZE = 50;
