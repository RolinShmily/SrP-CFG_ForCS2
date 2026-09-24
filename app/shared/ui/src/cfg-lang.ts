/**
 * CS2 cfg 词法规则 —— desktop 编辑器与网站高亮共用这一份，避免两边各写一套漂移。
 *
 * 这里只有纯粹的字符串规则，不依赖 CodeMirror：desktop 把它包成 StreamLanguage，
 * 网站直接用它切词后按 oneDark 色板着色。两边的分词结果因此必然一致。
 *
 * 词法数据（关键字 / 动作键 / 按键名 / 武器名 / convar 前缀）原样搬自
 * desktop 原有的 cs2-cfg-lang.ts。
 */

const KEYWORDS = new Set([
  "alias",
  "bind",
  "bindss",
  "unbind",
  "unbindall",
  "button_info",
  "exec",
  "exec_async",
  "exec_async_wait",
  "execifexists",
  "echo",
  "echoln",
  "clear",
  "clearall",
  "cvarlist",
  "cyclevar",
  "incrementvar",
  "multvar",
  "host_writeconfig",
  "reset_gameconvars",
  "quit",
  "say",
  "say_team",
  "setinfo",
  "sleep",
  "toggle",
  "writekeybindings",
  "play",
  "setpause",
  "unpause",
  "help",
  "find",
  "findflags",
  "game_alias",
  "game_mode",
  "game_type",
]);

const ACTIONS = new Set([
  "attack",
  "attack2",
  "back",
  "duck",
  "forward",
  "jump",
  "left",
  "right",
  "sprint",
  "strafe",
  "lookatweapon",
  "reload",
  "showscores",
  "spray_menu",
  "quickinv",
  "quickbuyradial",
  "quickgearradial",
  "quickgrenaderadial",
  "radialradio",
  "radialradio2",
  "radialradio3",
  "use",
  "zoom",
  "switchhands",
  "switchhandsleft",
  "switchhandsright",
  "drop",
  "buy",
  "autobuy",
  "rebuy",
  "buymenu",
  "open_buymenu",
  "close_buymenu",
  "sellback",
  "sellbackall",
  "lastinv",
  "slot1",
  "slot2",
  "slot3",
  "slot4",
  "slot5",
  "slot6",
  "slot7",
  "slot8",
  "slot9",
  "slot10",
  "slot11",
  "slot12",
  "slot13",
  "spectate",
  "teammenu",
  "callvote",
  "playerchatwheel",
  "playerradio",
  "demorestart",
  "fade",
  "ignoremsg",
  "ignorerad",
  "impulse",
  "joingame",
  "jointeam",
  "listplayers",
  "mute",
  "nextmap",
  "pickup_groundweapon",
  "radio1",
  "radio2",
  "radio3",
  "timeleft",
  "vote",
  "coverme",
  "takepoint",
  "holdpos",
  "regroup",
  "followme",
  "takingfire",
  "fallback",
  "sticktog",
  "cheer",
  "thanks",
  "compliment",
  "roger",
  "enemyspot",
  "needbackup",
  "sectorclear",
  "inposition",
  "reportingin",
  "getout",
  "negative",
  "enemydown",
]);

const KEYS = new Set([
  "MOUSE1",
  "MOUSE2",
  "MOUSE3",
  "MOUSE4",
  "MOUSE5",
  "MWHEELUP",
  "MWHEELDOWN",
  "SPACE",
  "TAB",
  "ENTER",
  "ESCAPE",
  "SHIFT",
  "RSHIFT",
  "CTRL",
  "RCTRL",
  "ALT",
  "RALT",
  "CAPSLOCK",
  "NUMLOCK",
  "SCROLLLOCK",
  "INS",
  "DEL",
  "HOME",
  "END",
  "PGUP",
  "PGDN",
  "PAUSE",
  "UPARROW",
  "LEFTARROW",
  "DOWNARROW",
  "RIGHTARROW",
  "F1",
  "F2",
  "F3",
  "F4",
  "F5",
  "F6",
  "F7",
  "F8",
  "F9",
  "F10",
  "F11",
  "F12",
  "SEMICOLON",
  "BACKSPACE",
  "LWIN",
  "RWIN",
  "KP_0",
  "KP_1",
  "KP_2",
  "KP_3",
  "KP_4",
  "KP_5",
  "KP_6",
  "KP_7",
  "KP_8",
  "KP_9",
  "KP_DIVIDE",
  "KP_MULTIPLY",
  "KP_MINUS",
  "KP_PLUS",
  "KP_ENTER",
  "KP_DEL",
]);

const WEAPONS = new Set([
  "ak47",
  "m4a1",
  "m4a1_silencer",
  "galilar",
  "famas",
  "aug",
  "sg556",
  "ssg08",
  "awp",
  "g3sg1",
  "scar20",
  "glock",
  "hkp2000",
  "usp_silencer",
  "elite",
  "p250",
  "tec9",
  "fiveseven",
  "cz75a",
  "deagle",
  "revolver",
  "nova",
  "xm1014",
  "mag7",
  "sawedoff",
  "m249",
  "negev",
  "mac10",
  "mp9",
  "mp7",
  "mp5sd",
  "ump45",
  "p90",
  "bizon",
  "vest",
  "vesthelm",
  "taser",
  "defuser",
  "flashbang",
  "smokegrenade",
  "hegrenade",
  "molotov",
  "incgrenade",
  "decoy",
]);

const CONVAR_PREFIXES = [
  "cl_",
  "sv_",
  "mp_",
  "snd_",
  "r_",
  "mat_",
  "hud_",
  "fps_",
  "viewmodel_",
  "net_",
  "demo_",
  "bot_",
  "cam_",
  "cc_",
  "con_",
  "cq_",
  "cs_",
  "csgo_",
  "csm_",
  "cv_",
  "d3d_",
  "debug_",
  "dev_",
  "econ_",
  "engine_",
  "ent_",
  "ff_",
  "fog_",
  "func_",
  "g_",
  "game_",
  "gl_",
  "glow_",
  "gpu_",
  "host_",
  "hostage_",
  "joy_",
  "key_",
  "lb_",
  "lobby_",
  "m_",
  "nav_",
  "option_",
  "particle_",
  "phys_",
  "player_",
  "prop_",
  "ragdoll_",
  "rcon_",
  "safezone",
  "save_",
  "scene_",
  "screen_",
  "screenshot_",
  "sensitivity",
  "shatterglass_",
  "sk_",
  "smoke_",
  "smooth_",
  "sound_",
  "speaker_",
  "spec_",
  "stats_",
  "sys_",
  "teleport_",
  "tv_",
  "ui_",
  "v_",
  "vehicle_",
  "video_",
  "videocfg_",
  "view_",
  "violence_",
  "vis_",
  "vm_",
  "voice_",
  "volume",
  "vphys_",
  "vphysics_",
  "vprof_",
  "weapon_",
  "zoom_sensitivity_ratio",
  "rate",
  "crosshair",
];

function isConvar(word: string): boolean {
  const lower = word.toLowerCase();
  for (const prefix of CONVAR_PREFIXES) {
    if (lower.startsWith(prefix) || lower === prefix) {
      return true;
    }
  }
  return false;
}

/** 切词出的 token 类型；null 表示无高亮的普通字符。 */
export type CfgTokenType =
  | "lineComment"
  | "string"
  | "number"
  | "keyword"
  | "atom"
  | "propertyName"
  | "def"
  | "operator"
  | "variableName"
  | null;

export interface CfgToken {
  type: CfgTokenType;
  text: string;
}

function classifyWord(word: string): CfgTokenType {
  const lower = word.toLowerCase();
  if (KEYWORDS.has(lower) || ACTIONS.has(lower)) return "keyword";
  if (KEYS.has(word.toUpperCase())) return "atom";
  if (WEAPONS.has(lower)) return "propertyName";
  if (isConvar(lower)) return "def";
  return "variableName";
}

/**
 * 取光标处（rest 的开头）的下一个 token。规则顺序与原实现严格一致：
 * 注释 → 双引号串 → 单引号串 → 数字 → +动作 → 单词 → 运算符 → 兜底单字符。
 *
 * 空白不在这里处理：desktop 用 stream.eatSpace() 吃掉，网站自己切空白。
 */
export function nextCfgToken(rest: string): CfgToken | null {
  if (!rest) return null;

  if (rest.startsWith("//")) return { type: "lineComment", text: rest };

  let m = rest.match(/^"(?:[^"\\]|\\.)*"/);
  if (m) return { type: "string", text: m[0] };

  m = rest.match(/^'(?:[^'\\]|\\.)*'/);
  if (m) return { type: "string", text: m[0] };

  m = rest.match(/^[+-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/);
  if (m) return { type: "number", text: m[0] };

  m = rest.match(/^[+-][a-zA-Z0-9_]+\b/);
  if (m) return { type: "keyword", text: m[0] };

  m = rest.match(/^[a-zA-Z_][a-zA-Z0-9_.]*/);
  if (m) return { type: classifyWord(m[0]), text: m[0] };

  m = rest.match(/^[;=\/\\]/);
  if (m) return { type: "operator", text: m[0] };

  return { type: null, text: rest[0] };
}

/** 把一段 cfg 切成带类型的 token（含空白 token，type 为 null）。 */
export function tokenizeCfgLine(line: string): CfgToken[] {
  const out: CfgToken[] = [];
  let rest = line;
  while (rest.length > 0) {
    const m = rest.match(/^\s+/);
    if (m) {
      out.push({ type: null, text: m[0] });
      rest = rest.slice(m[0].length);
      continue;
    }
    const tok = nextCfgToken(rest);
    if (!tok || tok.text.length === 0) break;
    out.push(tok);
    rest = rest.slice(tok.text.length);
  }
  return out;
}

/**
 * oneDark (@codemirror/theme-one-dark) 的实际配色，逐一对应到本词法器的 token 类型：
 *   keyword→tags.keyword, string→tags.string, number→tags.number,
 *   atom→tags.atom, propertyName/variableName→tags.name, operator→tags.operator,
 *   lineComment→tags.comment
 *
 * "def" 没有对应色：CodeMirror 里 tags.def 不是合法 tag，desktop 实际渲染为默认前景色，
 * 这里保持一致，不做“修正”以免两边观感不同。
 */
export const CFG_TOKEN_COLOR: Record<Exclude<CfgTokenType, null>, string> = {
  lineComment: "#7d8799",
  string: "#98c379",
  number: "#e5c07b",
  keyword: "#c678dd",
  atom: "#d19a66",
  propertyName: "#e06c75",
  def: "#abb2bf",
  operator: "#56b6c2",
  variableName: "#e06c75",
};

/** oneDark 的正文前景色与编辑区背景色。 */
export const CFG_FG = "#abb2bf";
export const CFG_BG = "#282c34";
export const CFG_GUTTER_FG = "#7d8799";
