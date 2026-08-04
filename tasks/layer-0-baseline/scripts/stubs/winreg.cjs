// winreg stub —— WSL/Linux 无 Windows 注册表。
// detection.ts 的 readRegistryValue 对 `new Winreg(...)` 的构造/读取包了 try/catch，
// 抛错后返回 null → detectSteamPath 走默认路径分支。
// 黄金样本中注册表读取本身属于 Windows 实机验收项（L2.6），此处只保证模块可加载。

"use strict";

module.exports = class Winreg {
  constructor() {
    throw new Error("winreg stub: Windows registry unavailable on WSL/Linux");
  }
  get(_key, cb) {
    cb(new Error("winreg stub"), null);
  }
};
