import { StreamLanguage, type StringStream } from "@codemirror/language";

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

export const cs2CfgLanguage = StreamLanguage.define({
  name: "cs2cfg",
  token(stream: StringStream) {
    // 1. Whitespace
    if (stream.eatSpace()) return null;

    // 2. Comments: // ...
    if (stream.match("//")) {
      stream.skipToEnd();
      return "lineComment";
    }

    // 3. Double-quoted strings
    if (stream.match(/^"(?:[^"\\]|\\.)*"/)) {
      return "string";
    }

    // 4. Single-quoted strings
    if (stream.match(/^'(?:[^'\\]|\\.)*'/)) {
      return "string";
    }

    // 5. Numbers & Floats
    if (stream.match(/^[+-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/)) {
      return "number";
    }

    // 6. Action +/- keywords (e.g. +attack, -jump, +duck)
    if (stream.match(/^[+-][a-zA-Z0-9_]+\b/)) {
      return "keyword";
    }

    // 7. Word tokens
    if (stream.match(/^[a-zA-Z_][a-zA-Z0-9_.]*/)) {
      const word = stream.current();
      const lower = word.toLowerCase();
      const upper = word.toUpperCase();

      if (KEYWORDS.has(lower)) {
        return "keyword";
      }

      if (ACTIONS.has(lower)) {
        return "keyword";
      }

      if (KEYS.has(upper)) {
        return "atom";
      }

      if (WEAPONS.has(lower)) {
        return "propertyName";
      }

      if (isConvar(lower)) {
        return "def";
      }

      return "variableName";
    }

    // 8. Operators and separators
    if (stream.match(/^[;=\/\\]/)) {
      return "operator";
    }

    stream.next();
    return null;
  },
  languageData: {
    commentTokens: { line: "//" },
  },
});
