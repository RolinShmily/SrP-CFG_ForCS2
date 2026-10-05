import type { I18nDictionary } from "./types";
export const zh: I18nDictionary = {
  nav: { product: "产品", showcase: "APP 演示", assembly: "自由装配", download: "下载", language: "Switch to English", menu: "打开导航", close: "关闭导航", skip: "跳到主要内容" },
  hero: { eyebrow: "为 COUNTER-STRIKE 2 打造", title: "你的配置。", highlight: "你的主场。", description: "从一份 CFG，到一个完整的配置工作台。管理预设、自由组合功能、定制视频设置，让每一次开局都更像你。", download: "获取 SrP-CFG", explore: "看看它如何工作", platform: "Windows 10 / 11 · x64 · 开源", floatingLabel: "真实 APP 界面", scroll: "向下探索" },
  showcase: { eyebrow: "MEET YOUR WORKSPACE", title: "配置有序，操作有据。", description: "一个桌面工作台，连接 Steam、游戏目录与你的个人配置。看看每一页如何配合。", previous: "上一页", next: "下一页", actual: "真实 APP 界面", screens: [
    { id: "overview", title: "从总览开始", short: "总览", description: "识别 Steam 与 CS2 路径，选择当前账号，查看 SrP-CFG 装配状态。", points: ["路径与账号集中管理", "配置包与软件独立更新", "挂载 autoexec 时保留用户内容"] },
    { id: "presets", title: "找到你的配置起点", short: "预设包", description: "加载预设，然后在同一工作台编辑设置、按键和 custom.cfg。", points: ["文件修改与未保存草稿分别标记", "语法高亮、行号与字体缩放", "写入游戏文件前建立备份"] },
    { id: "assembly", title: "组合自己的玩法", short: "自由装配", description: "默认基线、特性、模式入口与个人配置在连续工作区中协作，右侧编辑器始终跟随。", points: ["特性按需附带默认按键", "模式通过指定按键触发", "保留个人配置层与未保存草稿"] },
    { id: "video", title: "画面参数，一目了然", short: "视频设置", description: "表单和文本编辑器共享一份草稿。先保存暂存副本，再应用到当前账号。", points: ["保留本机硬件标识与未知字段", "游戏运行时暂停应用", "恢复当前包默认值不改游戏文件"] },
    { id: "annotations", title: "让跑图有迹可循", short: "地图指南", description: "按地图选择指南，分别装配、查看或卸载，同时保留个人标注。", points: ["多个地图指南可以共存", "操作范围与安装状态分开显示", "新增指南随配置包清单自动发现"] },
  ] },
  features: { eyebrow: "DESIGNED FOR YOUR CONFIG", title: "每次修改，都有掌控感。", description: "把文件、入口和版本交代清楚，留出属于你的定制空间。", items: [
    { title: "原生 CFG，透明可读", description: "基于 CS2 配置文件与入口命令工作。你可以直接查看和编辑实际写入的内容。", tag: "CFG / VCFG / KV3" },
    { title: "先暂存，再应用", description: "原始配置包与工作副本分开保存。包更新保留修改过的副本，不自动部署到游戏。", tag: "独立版本 · 工作副本" },
    { title: "保留修改，也保留退路", description: "未保存草稿受到保护。文件写入前建立 .bak 与历史备份，无变化时不重复备份。", tag: "最多 20 份不同内容历史" },
  ] },
  assembly: { eyebrow: "BUILD YOUR OWN LOADOUT", title: "把功能展开，", highlight: "把选择留给你。", description: "一份 custom.cfg，承载你的配置入口。挑选功能，设置模式启动键，再把个人偏好写在最后。", layers: [
    { title: "Valve 基线", description: "设置与按键分别选择。装配默认基线时取消预设入口，保留个人配置。" },
    { title: "特性模块", description: "AutoView、准星视角、Knife、Zeus 等功能按需组合，可选择附带默认按键。" },
    { title: "模式入口", description: "练习、预览、Demo 等通过绑定入口启动。多个入口可以共存，冲突先确认。" },
    { title: "个人覆盖", description: "user/custom.cfg 放在执行链末尾。你的灵敏度、按键和偏好由你决定。" },
  ], expand: "展开配置层", collapse: "收起配置层", note: "配置结构示意。点击查看每层职责，不执行游戏命令。", codeLabel: "配置入口示例", diagram: "配置层级互动示意", modeHint: "按下绑定键时进入模式" },
  workflow: { title: "三步，进入你的配置节奏。", steps: [
    { title: "下载与准备", description: "选择安装版或便携版。随附离线配置包，启动后识别游戏与账号。" },
    { title: "选择与定制", description: "用预设起步，或自由装配功能。修改工作副本，确认内容，再保存。" },
    { title: "应用与开局", description: "把选定配置部署到对应位置。CFG 入口在下次启动或 srp_reload 后执行。" },
  ] },
  downloads: { eyebrow: "READY WHEN YOU ARE", title: "下一局，从这里开始。", description: "下载桌面软件，或单独获取你需要的配置包。软件与三类配置包独立发布。", app: "SrP-CFG 桌面软件", appNote: "Windows x64 · 随附离线配置包", setup: "Setup 安装版", setupNote: "适合日常使用，由安装器管理程序文件。", portable: "ZIP 便携版", portableNote: "解压后运行，无需安装。", packages: "独立配置包", packageNote: "无需等待软件发版。也可在 APP 中更新暂存包。", source: "软件下载源", mirror: "加速源 · 默认", direct: "GitHub 原生", sourceNote: "加速源：gh.269601.xyz。切换来源会同步更新软件的下载链接。", loading: "正在获取最新发布…", unavailable: "发布信息暂不可用。可切换来源重试，或前往 Releases。", noRelease: "尚未找到带 ZIP / Setup 的正式软件发布，请前往 Releases 查看。", retry: "重新获取", releases: "查看 Releases", download: "下载", latest: "最新版本", size: "大小", hash: "复制 SHA-256", copied: "校验值已复制", copyFailed: "无法复制，请手动选取校验值", packageSource: "配置包来源：本网站 Cloudflare 暂存包仓库，与软件 Release 独立。", srp: "运行时、预设与自由装配模块，保留个人覆盖层。", video: "视频参数模板，应用前检查分辨率与显示模式。", annotations: "按地图组织的标注指南，保留你的个人 mapguide。", instructions: "首次使用？", readme: "阅读项目使用说明", fallback: "查看所有发布文件" },
  footer: { description: "为 CS2 玩家打造的配置工作台。配置清晰，选择自由。", blog: "作者博客", project: "项目源码", docs: "使用说明", releases: "发布记录", stack: "网站技术栈", license: "MIT License", top: "返回顶部" },
};
