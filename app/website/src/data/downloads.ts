import {
  CONFIG_PACKAGE_FILE,
  INSTALLER_MSI,
  INSTALLER_NSIS,
  MAP_GUIDES_FILE,
  VIDEO_SETTINGS_FILE,
  dlDirect as direct,
  dlMirror as mirror,
} from "@srp-cfg/ui";

export const installers = [
  {
    name: "MSI 安装包",
    desc: "推荐方式。通过 Windows 安装向导安装到 Program Files，支持开始菜单和桌面快捷方式",
    file: INSTALLER_MSI,
    mirrorUrl: mirror(INSTALLER_MSI),
    githubUrl: direct(INSTALLER_MSI),
    badge: "推荐",
  },
  {
    name: "Setup 安装程序 (EXE)",
    desc: "NSIS 自包含安装向导，双击运行即可安装，无需额外依赖",
    file: INSTALLER_NSIS,
    mirrorUrl: mirror(INSTALLER_NSIS),
    githubUrl: direct(INSTALLER_NSIS),
    badge: "Setup",
  },
];

export const packages = [
  {
    name: "Runtime Core 核心配置包",
    file: CONFIG_PACKAGE_FILE,
    mirrorUrl: mirror(CONFIG_PACKAGE_FILE),
    githubUrl: direct(CONFIG_PACKAGE_FILE),
    desc: "核心运行时：包含 autoexec.cfg、srp-cfg/ 核心功能、RoL1n / Echo / YSZH / VisionL 预设案例与 user/custom.cfg 用户入口",
    badge: "核心推荐",
    featured: true,
    targetDir: "game/csgo/cfg/",
  },
  {
    name: "Map Guides 跑图道具标点集",
    file: MAP_GUIDES_FILE,
    mirrorUrl: mirror(MAP_GUIDES_FILE),
    githubUrl: direct(MAP_GUIDES_FILE),
    desc: "解耦扩展包：全地图跑位与烟闪道具标点 annotations（包含 Dust2、Mirage、Inferno、Ancient 等单级目录规范标点）",
    badge: "可选扩展",
    featured: false,
    targetDir: "game/csgo/annotations/",
  },
  {
    name: "Video Settings 视频画质配置",
    file: VIDEO_SETTINGS_FILE,
    mirrorUrl: mirror(VIDEO_SETTINGS_FILE),
    githubUrl: direct(VIDEO_SETTINGS_FILE),
    desc: "解耦扩展包：CS2 推荐视频与图形设置模版 cs2_video.txt，兼顾竞技帧率稳定性与画面清晰度",
    badge: "可选扩展",
    featured: false,
    targetDir: "game/csgo/cfg/",
  },
];
