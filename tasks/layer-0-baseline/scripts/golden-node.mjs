// L0.6 黄金样本 —— Node 版执行器（WSL/Linux）
// ------------------------------------------------------------------
// 在 WSL 上运行 app/desktop/src/main/services/*.ts 的纯逻辑（stub electron 的
// app/net/shell 与 winreg），对 tasks/layer-0-baseline/fixtures/ 的同一份输入记录输出，
// 供 golden-samples.md 与 Rust core（84 测试）逐条对照。
//
// 构建/运行：
//   cd tasks/layer-0-baseline
//   ../../node_modules/.bin/esbuild scripts/golden-node.mjs --bundle --format=cjs \
//     --platform=node --outfile=scripts/golden-node.cjs \
//     --alias:electron=./scripts/stubs/electron.cjs --alias:winreg=./scripts/stubs/winreg.cjs
//   SRP_CFG_SANDBOX=$(pwd)/.sandbox node scripts/golden-node.cjs
//
// 输出：
//   - golden-outputs/*.json（各场景归一化后的结果，随仓库提交，供审计）
//   - 控制台 PASS/FAIL 断言（期望值取自 TS 代码语义 + Rust core 测试）
// ------------------------------------------------------------------

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ── 路径 ──────────────────────────────────────────────────────
// bundle 为 CJS 后使用 __dirname（esbuild 注入）；源码形态下回退 import.meta
const DIR = typeof __dirname !== "undefined" ? __dirname : path.dirname(fileURLToPath(import.meta.url));
const BASE = path.resolve(DIR, ".."); // tasks/layer-0-baseline
const FIXTURES = path.join(BASE, "fixtures");
const OUTPUT_DIR = path.join(BASE, "golden-outputs");
const SANDBOX = process.env.SRP_CFG_SANDBOX || path.join(BASE, ".sandbox");
const SANDBOX_RE = new RegExp(SANDBOX.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");

// ── 被测服务（esbuild bundle 时注入 electron/winreg stub）──────
import * as vcfgSvc from "../../../app/desktop/src/main/services/vcfg";
import * as detSvc from "../../../app/desktop/src/main/services/detection";
import * as stagingSvc from "../../../app/desktop/src/main/services/staging";
import * as installerSvc from "../../../app/desktop/src/main/services/installer";
import * as updaterSvc from "../../../app/desktop/src/main/services/updater";
import * as userCfgSvc from "../../../app/desktop/src/main/services/user-config";

// ── 工具 ──────────────────────────────────────────────────────
const rel = (p) => (p == null ? p : String(p).replace(SANDBOX_RE, "<sandbox>"));
const zeroTime = (v) => {
  if (Array.isArray(v)) return v.map(zeroTime);
  if (v && typeof v === "object") {
    const out = {};
    for (const [k, val] of Object.entries(v)) {
      if (["timestamp", "capturedAt", "modifiedAt", "mtimeMs"].includes(k)) out[k] = 0;
      else out[k] = zeroTime(val);
    }
    return out;
  }
  return v;
};
const sortList = (arr) => [...arr].sort();
const readJson = (p) => {
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    return null;
  }
};
const normState = (json) => {
  // install/res/save.json 统一形状：files/dirs 排序，路径相对化
  if (!json) return null;
  const out = {};
  for (const [cat, data] of Object.entries(json)) {
    if (data && typeof data === "object") {
      out[cat] = {
        files: sortList(data.files || []),
        dirs: sortList(data.dirs || []),
        path: rel(data.path),
      };
    }
  }
  return out;
};
const dumpTree = (dir) => {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  const walk = (d, prefix) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(d, e.name);
      const relP = path.relative(dir, full).replace(/\\/g, "/");
      if (e.isDirectory()) walk(full, prefix);
      else out.push(relP);
    }
  };
  walk(dir, "");
  return out;
};

// 断言
let failures = [];
let passed = 0;
const check = (id, actual, expected, note = "") => {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  const ok = a === e;
  if (ok) passed++;
  else {
    failures.push({ id, actual, expected, note });
    console.error(`FAIL  ${id}${note ? `   (${note})` : ""}`);
    console.error(`  actual:   ${a}`);
    console.error(`  expected: ${e}`);
  }
  console.log(`${ok ? "PASS" : "FAIL"}  ${id}${note ? `   (${note})` : ""}`);
  return ok;
};

// 日志收集
const collectLogs = () => {
  const logs = [];
  const log = (entry) =>
    logs.push({
      category: entry.category,
      level: entry.level,
      message: entry.message,
      detail: entry.detail,
    });
  return { logs, log };
};

// ── 沙箱构建 ──────────────────────────────────────────────────
function buildSandbox() {
  fs.rmSync(SANDBOX, { recursive: true, force: true });
  const cp = (src, dst) => fs.cpSync(src, dst, { recursive: true });

  // Steam 变体：installed / update / not-installed / no-manifest
  const variants = [
    { name: "installed", acf: "manifests/installed.acf" },
    { name: "update", acf: "manifests/update.acf" },
    { name: "not-installed", acf: "manifests/not-installed.acf" },
    { name: "no-manifest", acf: null },
  ];
  for (const v of variants) {
    cp(path.join(FIXTURES, "steam"), path.join(SANDBOX, `steam-${v.name}`));
    const acfPath = path.join(SANDBOX, `steam-${v.name}`, "steamapps", "appmanifest_730.acf");
    if (v.acf) fs.copyFileSync(path.join(FIXTURES, v.acf), acfPath);
    else fs.rmSync(acfPath, { force: true });
  }

  // loginusers 变体（当前用户选择逻辑）
  for (const lu of ["auto-login", "timestamp-only", "single-user", "empty"]) {
    cp(path.join(FIXTURES, "steam"), path.join(SANDBOX, `steam-login-${lu}`));
    fs.copyFileSync(
      path.join(FIXTURES, "loginusers", `${lu}.vdf`),
      path.join(SANDBOX, `steam-login-${lu}`, "config", "loginusers.vdf"),
    );
  }

  // 上传包
  cp(path.join(FIXTURES, "uploads"), path.join(SANDBOX, "uploads"));

  // 游戏 CFG 目录（用户已有文件 → 覆盖/追加冲突场景）
  cp(path.join(FIXTURES, "game-cfg"), path.join(SANDBOX, "game-cfg"));

  // 应用数据基目录
  fs.mkdirSync(path.join(SANDBOX, "appdata"), { recursive: true });
  fs.mkdirSync(path.join(SANDBOX, "userdata"), { recursive: true });
}

// ── S1 Steam / CS2 检测 ───────────────────────────────────────
function scenarioS1() {
  const out = {};
  const gameDirRel = "steamapps/common/Counter-Strike Global Offensive/game/csgo";
  const userCfgRel = "userdata/0/730/local/cfg";

  for (const v of ["installed", "update", "not-installed", "no-manifest"]) {
    const { logs, log } = collectLogs();
    const steamRoot = path.join(SANDBOX, `steam-${v}`);
    const libs = detSvc.readLibraryPaths(steamRoot, log);
    const st = detSvc.detectCs2InstallState(steamRoot, libs, log);
    const cfgPath = detSvc.detectCs2CfgPath(libs, log);
    const annPath = detSvc.detectAnnotationsPath(libs, log);
    const usersRes = detSvc.detectSteamUsers(steamRoot, log);
    const userCfgPath = usersRes.currentUser
      ? detSvc.detectUserCfgPath(steamRoot, usersRes.currentUser.accountId, log)
      : null;
    const vcfgState = vcfgSvc.inspectVcfgState(userCfgPath);

    out[v] = {
      libs: libs.map(rel),
      state: st.state,
      installDir: rel(st.installDir),
      cfgPath: rel(cfgPath),
      annotationsPath: rel(annPath),
      users: usersRes.users,
      currentUser: usersRes.currentUser,
      hasAutoLoginUser: usersRes.hasAutoLoginUser,
      userCfgPath: rel(userCfgPath),
      vcfgState: zeroTime(vcfgState),
      logs,
    };

    const expectedLibs = [
      rel(steamRoot),
      "C:\\Program Files (x86)\\Steam\\steamapps",
      "D:\\SteamLibrary\\steamapps",
    ];
    check(`S1:${v}:libraryPaths`, out[v].libs, expectedLibs);

    const stateByVariant = {
      installed: "installed",
      update: "needs-update",
      "not-installed": "not-installed",
      "no-manifest": "not-installed",
    };
    check(`S1:${v}:cs2State`, st.state, stateByVariant[v]);
    if (v === "installed" || v === "update") {
      check(`S1:${v}:installDir`, rel(st.installDir), `<sandbox>/steam-${v}/steamapps/common/Counter-Strike Global Offensive`);
    } else {
      check(`S1:${v}:installDirNull`, st.installDir, null);
    }
    // cfg 路径检测不依赖 manifest（TS 行为：按默认游戏目录存在性判断）
    check(`S1:${v}:cfgPath`, rel(cfgPath), `<sandbox>/steam-${v}/${gameDirRel}/cfg`);

    if (v === "installed") {
      check(
        "S1:users",
        usersRes.users,
        [
          { steamId64: "76561197960265728", accountId: "0", personaName: "Alice" },
          { steamId64: "76561198032473940", accountId: "72208212", personaName: "Bob" },
          { steamId64: "76561198104803300", accountId: "144537572", personaName: "Carol" },
        ],
      );
      // AutoLogin（Alice）优先于 mostrecent（Bob）→ currentUser = Alice
      check("S1:currentUser", usersRes.currentUser?.personaName, "Alice");
      check("S1:hasAutoLogin", usersRes.hasAutoLoginUser, true);
      check("S1:userCfgPath", rel(userCfgPath), `<sandbox>/steam-installed/${userCfgRel}`);
      check(
        "S1:vcfgState",
        zeroTime(vcfgState),
        {
          available: true,
          bindings: 3,
          analogBindings: 1,
          cloudConvars: 3,
          machineConvars: 2,
          hasCloudMirror: true,
          hasVideoConfig: true,
        },
      );
    }
  }

  // loginusers 当前用户选择（对应 Rust parse_login_users 各分支）
  const luCases = {
    "auto-login": { current: "Alice", count: 3 },
    "timestamp-only": { current: "Bob", count: 2 },
    "single-user": { current: "Solo", count: 1 },
    empty: { current: null, count: 0 },
  };
  const luOut = {};
  for (const [lu, expect] of Object.entries(luCases)) {
    const { log } = collectLogs();
    const steamRoot = path.join(SANDBOX, `steam-login-${lu}`);
    const res = detSvc.detectSteamUsers(steamRoot, log);
    luOut[lu] = {
      count: res.users.length,
      current: res.currentUser?.personaName ?? null,
      hasAutoLogin: res.hasAutoLoginUser,
    };
    check(`S1:login:${lu}:count`, res.users.length, expect.count);
    check(`S1:login:${lu}:current`, res.currentUser?.personaName ?? null, expect.current);
  }
  out.loginusers = luOut;
  return out;
}

// ── S2 VCFG 解析 / 快照 / 生成 ────────────────────────────────
function scenarioS2() {
  const out = {};
  const steamRoot = path.join(SANDBOX, "steam-installed");
  const userCfgPath = path.join(steamRoot, "userdata", "0", "730", "local", "cfg");
  const gameCfgPath = path.join(
    steamRoot,
    "steamapps",
    "common",
    "Counter-Strike Global Offensive",
    "game",
    "csgo",
    "cfg",
  );

  // 2a. 快照捕获
  const snapshot = vcfgSvc.captureVcfgSnapshot(userCfgPath);
  out.snapshot = zeroTime(snapshot);
  check("S2:snapshot.bindings", snapshot.bindings, {
    a: "say_team pushed_a",
    j: "+forward",
    t: "say_team hi",
  });
  check("S2:snapshot.analogBindings", snapshot.analogBindings, { joy_forward: "+forward" });
  check("S2:snapshot.userConvars", snapshot.userConvars, {
    fps_max: "0",
    cl_crosshairsize: "3.5",
    name: "Alice with space",
  });
  check("S2:snapshot.machineConvars", snapshot.machineConvars, {
    r_fullscreen_gamma: "2.2",
    video_upscale_enabled: "0",
  });

  // 2b. 状态摘要
  const state = vcfgSvc.inspectVcfgState(userCfgPath);
  out.state = zeroTime(state);
  check(
    "S2:inspectState",
    zeroTime(state),
    {
      available: true,
      bindings: 3,
      analogBindings: 1,
      cloudConvars: 3,
      machineConvars: 2,
      hasCloudMirror: true,
      hasVideoConfig: true,
    },
  );

  // 2c. parseCfgConvars（echo/exec/bind 过滤 + 行内注释）
  const convars = vcfgSvc.parseCfgConvars(path.join(gameCfgPath, "autoexec.cfg"));
  out.convars = convars;
  check("S2:convars", convars, { cl_crosshair_size: "3", fps_max: "144" });

  // 2d. baseline 快照保存（首次创建 / 二次跳过）
  const snapshotRoot = path.join(SANDBOX, "appdata", "srp-cfg", "vcfg-snapshots");
  const b1 = vcfgSvc.saveVcfgBaseline(userCfgPath, snapshotRoot, "0");
  const b2 = vcfgSvc.saveVcfgBaseline(userCfgPath, snapshotRoot, "0");
  out.baseline = { first: { ...b1, path: rel(b1.path) }, second: { ...b2, path: rel(b2.path) } };
  check("S2:baselineCreated", b1.created, true);
  check("S2:baselineReuse", b2.created, false);
  check("S2:baselinePath", rel(b1.path), "<sandbox>/appdata/srp-cfg/vcfg-snapshots/0/baseline.json");

  // 2e. snapshot → CFG（baseline == 当前快照 → convars 全过滤，bindings 仍输出）
  const baseline = readJson(b1.path);
  const mergedBaseline = {
    ...baseline.userConvars,
    ...baseline.machineConvars,
  };
  const cfgAll = vcfgSvc.snapshotToCfg(
    snapshot,
    { bindings: true, analogBindings: true, userConvars: true, machineConvars: true },
    mergedBaseline,
  );
  out.cfgFromSnapshotSelfBaseline = cfgAll;
  check(
    "S2:cfgFromSnapshotSelfBaseline",
    cfgAll,
    [
      "// ── 按键绑定 ──",
      'bind "a" "say_team pushed_a"',
      'bind "j" "+forward"',
      'bind "t" "say_team hi"',
      "// ── 模拟轴绑定 ──",
      'bind "joy_forward" "+forward"',
    ].join("\n"),
  );

  // 2f. snapshot → CFG（空 baseline → convars 全输出，布尔归一化）
  const cfgEmptyBaseline = vcfgSvc.snapshotToCfg(
    snapshot,
    { bindings: false, analogBindings: false, userConvars: true, machineConvars: true },
    {},
  );
  out.cfgFromSnapshotEmptyBaseline = cfgEmptyBaseline;
  check(
    "S2:cfgFromSnapshotEmptyBaseline",
    cfgEmptyBaseline,
    [
      "// ── 个人偏好设置（仅与 Valve 默认值不同的项）──",
      "cl_crosshairsize 3.5",
      "fps_max 0",
      'name "Alice with space"',
      "// ── 机器设置（仅与 Valve 默认值不同的项）──",
      "r_fullscreen_gamma 2.2",
      "video_upscale_enabled 0",
    ].join("\n"),
  );

  return out;
}

// ── S3 上传 / Staging 归类 ────────────────────────────────────
async function scenarioS3() {
  const out = {};
  const { logs, log } = collectLogs();
  stagingSvc.initializeStagingArea(log);

  const packA = path.join(SANDBOX, "uploads", "pack-a");
  const packBZip = path.join(SANDBOX, "uploads", "pack-b.zip");
  const stagingPaths = {
    cfg: stagingSvc.getStagingPath("cfg"),
    annotations: stagingSvc.getStagingPath("annotations"),
    video: stagingSvc.getStagingPath("video"),
  };

  // 3a. 目录形态包 → overlay 归类
  const r1 = stagingSvc.processUploadToStaging(packA, "overlay", log);
  out.overlayPackA = { ...r1, tree: dumpTree(stagingSvc.getStagingPath("cfg")).map(rel) };
  check("S3:overlayPackA:counts", { cfg: r1.cfgCount, ann: r1.annotationsCount, video: r1.videoCount }, { cfg: 2, ann: 1, video: 1 });
  check("S3:overlayPackA:tree", out.overlayPackA.tree, ["autoexec.cfg", "presets/yszh.cfg"]);
  check("S3:overlayPackA:annotations", dumpTree(stagingSvc.getStagingPath("annotations")).map(rel), ["local/dust2.txt"]);
  check("S3:overlayPackA:video", dumpTree(stagingSvc.getStagingPath("video")).map(rel), ["cs2_video.txt"]);

  // 3b. append 模式（不清空，合并覆盖）
  const r2 = stagingSvc.processUploadToStaging(packA, "append", log);
  out.appendPackA = { ...r2, tree: dumpTree(stagingSvc.getStagingPath("cfg")).map(rel) };
  check("S3:appendPackA:counts", { cfg: r2.cfgCount, ann: r2.annotationsCount, video: r2.videoCount }, { cfg: 2, ann: 1, video: 1 });
  check("S3:appendPackA:tree", out.appendPackA.tree, ["autoexec.cfg", "presets/yszh.cfg"]);

  // 3c. 暂存区研判（autoexec 含 exec + 赋值 → custom）
  const impact = stagingSvc.inspectStagedConfig();
  out.impactPackA = impact;
  check("S3:impactPackA", impact, { kind: "custom", cfgCount: 2 });

  // 3d. runtime 包研判（只有 alias/echo/exec → runtime-core）
  const runtimePack = path.join(SANDBOX, "runtime-pack");
  fs.mkdirSync(path.join(runtimePack, "srpcfg"), { recursive: true });
  fs.writeFileSync(path.join(runtimePack, "autoexec.cfg"), "exec srpcfg/runtime.cfg\n// SrP-CFG Runtime\n");
  fs.writeFileSync(path.join(runtimePack, "srpcfg", "runtime.cfg"), 'alias srp_reload exec srpcfg/reload.cfg\necho SrP-CFG loaded\necholn OK\n');
  fs.writeFileSync(path.join(runtimePack, "srpcfg", "reload.cfg"), 'alias srp_reset_valve exec srpcfg/reset.cfg\n');
  stagingSvc.processUploadToStaging(runtimePack, "overlay", log);
  const impactRuntime = stagingSvc.inspectStagedConfig();
  out.impactRuntime = impactRuntime;
  check("S3:impactRuntime", impactRuntime, { kind: "runtime-core", cfgCount: 3 });

  // 3e. ZIP 上传 + 历史 + zip 形态安装
  const up = await stagingSvc.uploadFiles([packBZip], log);
  out.uploadEntry = zeroTime(up);
  check("S3:uploadEntry", zeroTime(up), {
    folderName: up.folderName,
    timestamp: 0,
    fileCount: 1,
    files: [{ name: "pack-b.zip", relativePath: "pack-b.zip", type: "txt", size: fs.statSync(packBZip).size }],
  });
  check("S3:uploadFolderFormat", /^\d{4}-\d{2}-\d{2}-\d{4}$/.test(up.folderName), true);

  const entries = stagingSvc.getUploadedEntries();
  out.uploadedEntries = zeroTime(entries);
  check("S3:uploadedEntries", zeroTime(entries), [
    { folderName: up.folderName, displayName: "pack-b.zip", timestamp: 0, size: entries[0].size, fileCount: 1, isZip: true },
  ]);

  const r3 = await stagingSvc.installFromUpload(up.folderName, "overlay", log);
  out.zipOverlay = { ...r3, tree: dumpTree(stagingSvc.getStagingPath("cfg")).map(rel) };
  check("S3:zipOverlay:counts", { cfg: r3.cfgCount, ann: r3.annotationsCount, video: r3.videoCount }, { cfg: 1, ann: 1, video: 1 });
  check("S3:zipOverlay:tree", out.zipOverlay.tree, ["run.cfg"]);
  check("S3:zipOverlay:annotations", dumpTree(stagingSvc.getStagingPath("annotations")).map(rel), ["local/mirage.txt"]);
  check("S3:zipOverlay:impact", stagingSvc.inspectStagedConfig(), { kind: "custom", cfgCount: 1 });

  const history = stagingSvc.getUploadHistory();
  out.history = zeroTime(history).map((h) => ({ ...h, files: h.files.map((f) => ({ ...f, size: 0 })) }));
  check("S3:history:isZip", history[0]?.files?.[0]?.name, "pack-b.zip");

  // 3f. 删除上传记录
  stagingSvc.deleteUploadEntry(up?.folderName, log);
  out.historyAfterDelete = stagingSvc.getUploadHistory().length;
  check("S3:historyAfterDelete", stagingSvc.getUploadHistory().length, 0);

  out.logs = logs;
  return out;
}

// ── S4 安装：overlay / append / 冲突 ──────────────────────────
function scenarioS4() {
  const out = {};
  const { logs, log } = collectLogs();
  const appdata = path.join(SANDBOX, "appdata", "srp-cfg");
  const steamRoot = path.join(SANDBOX, "steam-installed");
  const csgo = path.join(steamRoot, "steamapps", "common", "Counter-Strike Global Offensive", "game", "csgo");

  // 把"用户已有文件"放入游戏 CFG 目录（覆盖冲突场景）
  fs.cpSync(path.join(SANDBOX, "game-cfg"), path.join(csgo, "cfg"), { recursive: true });

  const gamePaths = {
    gameCfgPath: path.join(csgo, "cfg"),
    userCfgPath: path.join(steamRoot, "userdata", "0", "730", "local", "cfg"),
    annotationsPath: path.join(csgo, "annotations", "local"),
  };
  const stagingPaths = {
    cfg: path.join(appdata, "cfg"),
    annotations: path.join(appdata, "annotations"),
    video: path.join(appdata, "video"),
  };
  const packA = path.join(SANDBOX, "uploads", "pack-a");

  const state = () => ({
    install: normState(readJson(path.join(appdata, "install.json"))?.install),
    res: normState(readJson(path.join(appdata, "res.json"))?.res),
    save: normState(readJson(path.join(appdata, "save.json"))?.save),
  });
  const relTree = (p) => dumpTree(p).map(rel);

  // 4a. 路径回填
  installerSvc.updateInstallPaths(gamePaths);
  const afterPaths = state();
  check("S4:updateInstallPaths:gameCfg", afterPaths.install.gameCfg.path, rel(gamePaths.gameCfgPath));
  check("S4:updateInstallPaths:video=userCfg", afterPaths.install.video.path, rel(gamePaths.userCfgPath));
  check("S4:updateInstallPaths:annotations", afterPaths.install.annotations.path, rel(gamePaths.annotationsPath));

  // 4b. 全新覆盖安装（pack-a）：同名用户文件 → res/
  stagingSvc.processUploadToStaging(packA, "overlay", log);
  const ov1 = installerSvc.deployOverlay(stagingPaths, gamePaths, false, log);
  const s1 = state();
  out.freshOverlay = {
    result: ov1,
    install: s1.install,
    res: s1.res,
    save: s1.save,
    gameCfgTree: relTree(gamePaths.gameCfgPath),
    userCfgTree: relTree(gamePaths.userCfgPath),
  };
  check("S4:freshOverlay:install.gameCfg", s1.install.gameCfg, {
    files: ["autoexec.cfg"],
    dirs: ["presets"],
    path: rel(gamePaths.gameCfgPath),
  });
  check("S4:freshOverlay:install.annotations", s1.install.annotations, {
    files: [],
    dirs: ["local"],
    path: rel(gamePaths.annotationsPath),
  });
  check("S4:freshOverlay:install.video", s1.install.video, {
    files: ["cs2_video.txt"],
    dirs: [],
    path: rel(gamePaths.userCfgPath),
  });
  check("S4:freshOverlay:res.gameCfg", s1.res.gameCfg, {
    files: ["autoexec.cfg"],
    dirs: [],
    path: rel(gamePaths.gameCfgPath),
  });
  check("S4:freshOverlay:res.video", s1.res.video, {
    files: ["cs2_video.txt"],
    dirs: [],
    path: rel(gamePaths.userCfgPath),
  });
  check("S4:freshOverlay:save.empty", s1.save, {
    gameCfg: { files: [], dirs: [], path: rel(gamePaths.gameCfgPath) },
    userCfg: { files: [], dirs: [], path: rel(gamePaths.userCfgPath) },
    annotations: { files: [], dirs: [], path: rel(gamePaths.annotationsPath) },
    video: { files: [], dirs: [], path: rel(gamePaths.userCfgPath) },
  });
  // 用户偏好文件被保留（withUserCustomPreserved）
  check("S4:freshOverlay:userCustomPreserved", fs.readFileSync(path.join(gamePaths.gameCfgPath, "srp-cfg", "user", "custom.cfg"), "utf-8"), "// 用户偏好层（安装器必须保护此文件）\nsensitivity 1.25\n");

  // 4c. 重复覆盖安装：上一版本受管项 → save/
  stagingSvc.processUploadToStaging(packA, "overlay", log);
  const ov2 = installerSvc.deployOverlay(stagingPaths, gamePaths, false, log);
  const s2 = state();
  out.reinstallOverlay = { result: ov2, install: s2.install, res: s2.res, save: s2.save };
  check("S4:reinstall:save.gameCfg", s2.save.gameCfg, {
    files: ["autoexec.cfg"],
    dirs: ["presets"],
    path: rel(gamePaths.gameCfgPath),
  });
  check("S4:reinstall:save.video", s2.save.video, {
    files: ["cs2_video.txt"],
    dirs: [],
    path: rel(gamePaths.userCfgPath),
  });
  check("S4:reinstall:res.unchanged", s2.res.gameCfg.files, ["autoexec.cfg"]);

  // 4d. append 冲突检测（真实路径：4 个冲突 → 调用方应拒绝）
  stagingSvc.processUploadToStaging(packA, "append", log);
  const acReal = installerSvc.checkAppendConflicts(stagingPaths, gamePaths, false);
  out.appendConflictsReal = acReal;
  check("S4:appendConflictsReal:reject", acReal, { needsConfirm: false, conflicts: [
    { category: "gameCfg", names: ["autoexec.cfg", "presets"] },
    { category: "annotations", names: ["local"] },
    { category: "video", names: ["cs2_video.txt"] },
  ] });

  // 4e. 追加部署（覆盖冲突，清单并集）
  const ap1 = installerSvc.deployAppend(stagingPaths, gamePaths, true, false, log);
  const s3 = state();
  out.appendDeploy = { result: ap1, install: s3.install };
  check("S4:appendDeploy:merge", s3.install.gameCfg, {
    files: ["autoexec.cfg"],
    dirs: ["presets"],
    path: rel(gamePaths.gameCfgPath),
  });

  // 4f. 合成冲突决策（0 / 2 / 4 个）
  const synth = (names, gameNames) => {
    const sDir = path.join(SANDBOX, `synth-stage-${names.length}`);
    const gDir = path.join(SANDBOX, `synth-game-${names.length}`);
    fs.rmSync(sDir, { recursive: true, force: true });
    fs.rmSync(gDir, { recursive: true, force: true });
    fs.mkdirSync(sDir, { recursive: true });
    fs.mkdirSync(gDir, { recursive: true });
    for (const n of names) fs.writeFileSync(path.join(sDir, n), "x");
    for (const n of gameNames) fs.writeFileSync(path.join(gDir, n), "x");
    return {
      cfg: sDir,
      annotations: path.join(SANDBOX, `synth-ann-${names.length}`),
      video: path.join(SANDBOX, `synth-vid-${names.length}`),
    };
  };
  fs.mkdirSync(path.join(SANDBOX, "synth-ann-0"), { recursive: true });
  fs.mkdirSync(path.join(SANDBOX, "synth-vid-0"), { recursive: true });
  fs.mkdirSync(path.join(SANDBOX, "synth-ann-2"), { recursive: true });
  fs.mkdirSync(path.join(SANDBOX, "synth-vid-2"), { recursive: true });

  const sp2 = synth(["a.cfg", "b.cfg"], ["a.cfg", "c.cfg", "d.cfg"]);
  const ac2 = installerSvc.checkAppendConflicts(sp2, { ...gamePaths, gameCfgPath: path.join(SANDBOX, "synth-game-2") }, false);
  out.appendConflictsTwo = ac2;
  check("S4:appendConflictsTwo:confirm", ac2, {
    needsConfirm: true,
    conflicts: [{ category: "gameCfg", names: ["a.cfg"] }],
  });

  const sp4 = synth(["a.cfg", "b.cfg", "c.cfg", "d.cfg"], ["a.cfg", "b.cfg", "c.cfg", "d.cfg"]);
  const ac4 = installerSvc.checkAppendConflicts(sp4, { ...gamePaths, gameCfgPath: path.join(SANDBOX, "synth-game-4") }, false);
  out.appendConflictsFour = ac4;
  check("S4:appendConflictsFour:reject", ac4, {
    needsConfirm: false,
    conflicts: [{ category: "gameCfg", names: ["a.cfg", "b.cfg", "c.cfg", "d.cfg"] }],
  });

  // usePersonalCfg 语义：true → 跳过 gameCfg；false → 跳过 userCfg
  const spP = synth(["autoexec.cfg"], ["autoexec.cfg"]);
  const acPers = installerSvc.checkAppendConflicts(spP, { ...gamePaths, gameCfgPath: path.join(SANDBOX, "synth-game-1") }, true);
  out.appendConflictsPersonal = acPers;
  check("S4:appendConflictsPersonal:skipped", acPers, { needsConfirm: false, conflicts: [] });

  out.logs = logs;
  return out;
}

// ── S5 冲突恢复 / 备份恢复 ────────────────────────────────────
function scenarioS5() {
  const out = {};
  const { logs, log } = collectLogs();
  const appdata = path.join(SANDBOX, "appdata", "srp-cfg");
  const steamRoot = path.join(SANDBOX, "steam-installed");
  const csgo = path.join(steamRoot, "steamapps", "common", "Counter-Strike Global Offensive", "game", "csgo");
  const gamePaths = {
    gameCfgPath: path.join(csgo, "cfg"),
    userCfgPath: path.join(steamRoot, "userdata", "0", "730", "local", "cfg"),
    annotationsPath: path.join(csgo, "annotations", "local"),
  };
  const stagingPaths = {
    cfg: path.join(appdata, "cfg"),
    annotations: path.join(appdata, "annotations"),
    video: path.join(appdata, "video"),
  };
  const packA = path.join(SANDBOX, "uploads", "pack-a");
  const state = () => ({
    install: normState(readJson(path.join(appdata, "install.json"))?.install),
    res: normState(readJson(path.join(appdata, "res.json"))?.res),
    save: normState(readJson(path.join(appdata, "save.json"))?.save),
  });

  // ── Phase A：从 S4 结束状态恢复 ──────────────────────────────
  // 前置：res 有 gameCfg.autoexec.cfg + video.cs2_video.txt；save 有 gameCfg[autoexec.cfg,notes.txt]+presets、
  //       annotations[local]、video[cs2_video.txt]；install 与 save 同构（S4 末尾）

  // A1. 单项冲突恢复（res → 游戏目录，并从 install/res 移除）
  const r1 = installerSvc.restoreFromRes("gameCfg", "autoexec.cfg", gamePaths, log);
  const s1 = state();
  out.restoreFromRes = { ok: r1, install: s1.install, res: s1.res };
  check("S5:restoreFromRes:ok", r1, true);
  check("S5:restoreFromRes:res.cleared", s1.res.gameCfg.files, []);
  check("S5:restoreFromRes:install.updated", s1.install.gameCfg.files, []);
  check(
    "S5:restoreFromRes:fileContent",
    fs.readFileSync(path.join(gamePaths.gameCfgPath, "autoexec.cfg"), "utf-8"),
    "// 用户自己的 autoexec（覆盖安装时会被转移到 res/）\nsensitivity 0.85\n",
  );

  // A2. 整类冲突恢复（video → userCfgPath）
  const r2 = installerSvc.restoreResCategory("video", gamePaths, log);
  const s2 = state();
  out.restoreResCategory = { restored: r2, res: s2.res };
  check("S5:restoreResCategory:count", r2, 1);
  check("S5:restoreResCategory:res.cleared", s2.res.video.files, []);
  check(
    "S5:restoreResCategory:fileContent",
    fs.readFileSync(path.join(gamePaths.userCfgPath, "cs2_video.txt"), "utf-8"),
    '"VideoConfig"\n{\n\t"setting.defaultres" "1920"\n\t"setting.defaultresheight" "1080"\n\t"setting.fullscreen" "1"\n}\n',
  );

  // A3. 单项备份恢复（save → 游戏目录，install 登记）
  const r3 = installerSvc.restoreSaveItem("gameCfg", "autoexec.cfg", gamePaths, log);
  const s3 = state();
  out.restoreSaveItem = { ok: r3, save: s3.save, install: s3.install };
  check("S5:restoreSaveItem:ok", r3, true);
  check("S5:restoreSaveItem:save.updated", s3.save.gameCfg.files, []);
  check("S5:restoreSaveItem:install.tracked", s3.install.gameCfg.files, ["autoexec.cfg"]);

  // A4. 整类卸载（clearInstallCategory）
  const r4 = installerSvc.clearInstallCategory("gameCfg", gamePaths, log);
  const s4 = state();
  out.clearInstallCategory = { removed: r4, install: s4.install };
  check("S5:clearInstallCategory:count", r4, 2);
  check("S5:clearInstallCategory:install.empty", s4.install.gameCfg.files, []);

  // A5. 全量备份恢复（restoreFromSave：save/* → 游戏目录，install = save 清单）
  const r5 = installerSvc.restoreFromSave(gamePaths, log);
  const s5 = state();
  out.restoreFromSave = { ok: r5, install: s5.install, save: s5.save };
  check("S5:restoreFromSave:ok", r5, true);
  check("S5:restoreFromSave:install=save", s5.install.gameCfg.files, s5.save.gameCfg.files);

  // A6. 整类备份恢复（restoreSaveCategory → save 清空）
  const r6 = installerSvc.restoreSaveCategory("annotations", gamePaths, log);
  const s6 = state();
  out.restoreSaveCategory = { restored: r6, save: s6.save, install: s6.install };
  check("S5:restoreSaveCategory:count", r6, 1);
  check("S5:restoreSaveCategory:save.cleared", s6.save.annotations.files, []);
  check("S5:restoreSaveCategory:install.updated", s6.install.annotations.dirs, ["local"]);

  // ── Phase B：重新生成 res 后验证单项删除与整类清除 ──────────
  // custom.cfg 是用户文件（永不进 install 清单），用它制造确定性的 res 冲突
  const conflictPack = path.join(SANDBOX, "conflict-pack");
  fs.rmSync(conflictPack, { recursive: true, force: true });
  fs.mkdirSync(conflictPack, { recursive: true });
  fs.writeFileSync(path.join(conflictPack, "custom.cfg"), "// 冲突包：与用户 custom.cfg 同名\ncl_radial_radio 1\n");

  installerSvc.clearInstallCategory("gameCfg", gamePaths, log);
  stagingSvc.processUploadToStaging(conflictPack, "overlay", log);
  installerSvc.deployOverlay(
    { cfg: stagingPaths.cfg, annotations: path.join(SANDBOX, "no-ann"), video: path.join(SANDBOX, "no-vid") },
    gamePaths,
    false,
    log,
  );
  const s7 = state();
  out.regenRes = { res: s7.res, install: s7.install };
  check("S5:regen:res.gameCfg", s7.res.gameCfg.files, ["custom.cfg"]);
  check("S5:regen:install.gameCfg", s7.install.gameCfg.files, ["custom.cfg"]);

  // B1. 删除单项冲突恢复项
  const r7 = installerSvc.deleteResItem("gameCfg", "custom.cfg", log);
  const s8 = state();
  out.deleteResItem = { ok: r7, res: s8.res };
  check("S5:deleteResItem:ok", r7, true);
  check("S5:deleteResItem:res.cleared", s8.res.gameCfg.files, []);

  // B2. 删除单项配置备份项（save.video 仍持有 S4 的 cs2_video.txt）
  const r8 = installerSvc.deleteSaveItem("video", "cs2_video.txt", log);
  const s9 = state();
  out.deleteSaveItem = { ok: r8, save: s9.save };
  check("S5:deleteSaveItem:ok", r8, true);
  check("S5:deleteSaveItem:save.cleared", s9.save.video.files, []);

  // B3. 整类清除
  installerSvc.clearResCategory("video", log);
  installerSvc.clearSaveCategory("gameCfg", log);
  const s10 = state();
  out.clearCategories = { res: s10.res, save: s10.save };
  check("S5:clearResCategory:empty", s10.res.video.files, []);
  check("S5:clearSaveCategory:empty", s10.save.gameCfg.files, []);

  out.logs = logs;
  return out;
}

// ── S6 Updater（GitHub Releases 检测）─────────────────────────
async function scenarioS6() {
  const out = {};
  // 独立沙箱（清空 userdata，保证缓存节流判定确定）
  fs.rmSync(path.join(SANDBOX, "userdata"), { recursive: true, force: true });
  fs.mkdirSync(path.join(SANDBOX, "userdata"), { recursive: true });

  // 6a. 强制检查（网络路径）：当前 3.1.6 → 仅 3.2.0 更新
  const res1 = await updaterSvc.checkForUpdate(true);
  out.checkForce = res1;
  check("S6:checkForce:hasUpdate", res1.hasUpdate, true);
  check("S6:checkForce:hasDesktop", res1.hasDesktopUpdate, true);
  check("S6:checkForce:hasConfig", res1.hasConfigUpdate, true);
  check("S6:checkForce:releases", res1.releases.map((r) => r.tagName), ["3.2.0"]);
  check("S6:checkForce:assetFlags", res1.releases.map((r) => [r.hasDesktopAssets, r.hasConfigAssets]), [[true, true]]);

  // 6b. 忽略版本后自动检查 → 无更新（缓存节流路径 + isDismissed）
  updaterSvc.dismissVersion("3.2.0");
  const res2 = await updaterSvc.checkForUpdate(false);
  out.checkDismissed = res2;
  check("S6:checkDismissed:empty", res2, {
    currentVersion: "3.1.6",
    hasUpdate: false,
    hasDesktopUpdate: false,
    hasConfigUpdate: false,
    releases: [],
  });

  // 6c. 更新历史（>= 3.0.0，2.9.0 被过滤）
  const history = await updaterSvc.fetchUpdateHistory();
  out.history = history;
  check("S6:history", history?.map((r) => r.tagName), ["3.2.0", "3.1.6", "3.1.5"]);

  // 6d. 最新版本（缓存）
  const latest = await updaterSvc.getLatestVersion();
  out.latest = latest;
  check("S6:latest", latest, "3.2.0");

  // 6e. 缓存文件内容
  const cache = readJson(path.join(SANDBOX, "userdata", "update-cache", "cache.json"));
  out.cache = zeroTime({
    dismissedVersion: cache?.dismissedVersion,
    cachedReleases: cache?.cachedReleases?.map((r) => r.tagName),
    cachedAllReleases: cache?.cachedAllReleases?.map((r) => r.tagName),
  });
  check("S6:cache:dismissed", cache?.dismissedVersion, "3.2.0");
  check("S6:cache:allReleases", cache?.cachedAllReleases?.map((r) => r.tagName), ["3.2.0", "3.1.6", "3.1.5"]);

  return out;
}

// ── S7 用户配置层（custom.cfg 保护）───────────────────────────
function scenarioS7() {
  const out = {};
  const steamRoot = path.join(SANDBOX, "steam-installed");
  const csgo = path.join(steamRoot, "steamapps", "common", "Counter-Strike Global Offensive", "game", "csgo");
  const gamePaths = {
    gameCfgPath: path.join(csgo, "cfg"),
    userCfgPath: path.join(steamRoot, "userdata", "0", "730", "local", "cfg"),
    annotationsPath: path.join(csgo, "annotations", "local"),
  };

  const doc1 = userCfgSvc.readUserConfig(gamePaths);
  out.read1 = { ...doc1, path: rel(doc1.path), content: doc1.content, modifiedAt: 0 };
  check("S7:read:target", doc1.target, "game");
  check("S7:read:exists", doc1.exists, true);
  check("S7:read:runtimeInstalled", doc1.runtimeInstalled, false);
  check("S7:read:content", doc1.content, "// 用户偏好层（安装器必须保护此文件）\nsensitivity 1.25\n");

  const saved = userCfgSvc.saveUserConfig(gamePaths, "sensitivity 1.00\n");
  out.saved = { ...saved, path: rel(saved.path), content: saved.content, modifiedAt: 0 };
  check("S7:save:content", saved.content, "sensitivity 1.00\n");
  check("S7:save:written", fs.readFileSync(path.join(gamePaths.gameCfgPath, "srp-cfg", "user", "custom.cfg"), "utf-8"), "sensitivity 1.00\n");

  const doc2 = userCfgSvc.readUserConfig(gamePaths);
  check("S7:readAfterSave", doc2.content, "sensitivity 1.00\n");

  return out;
}

// ── 主流程 ────────────────────────────────────────────────────
async function main() {
  console.log(`== L0.6 golden-node: sandbox=${SANDBOX}`);
  buildSandbox();
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const results = {
    generatedAt: new Date().toISOString(),
    sandbox: rel(SANDBOX),
    s1Detection: scenarioS1(),
    s2Vcfg: scenarioS2(),
    s3Staging: await scenarioS3(),
    s4Install: scenarioS4(),
    s5Recovery: scenarioS5(),
    s7UserConfig: scenarioS7(),
  };
  results.s6Updater = await scenarioS6();

  for (const [name, data] of Object.entries(results)) {
    if (name === "generatedAt" || name === "sandbox") continue;
    // 全量归一化：所有字符串中的沙箱绝对路径 → <sandbox>（保证跨机器可复现）
    const text = JSON.stringify(data, null, 2).replace(SANDBOX_RE, "<sandbox>");
    fs.writeFileSync(path.join(OUTPUT_DIR, `${name}.json`), text, "utf-8");
  }
  fs.writeFileSync(path.join(OUTPUT_DIR, "_runner-notes.json"), JSON.stringify({
    sandbox: rel(SANDBOX),
    generatedAt: results.generatedAt,
    fixtureFileCount: (() => {
      let n = 0;
      const walk = (d) => {
        for (const e of fs.readdirSync(d, { withFileTypes: true })) {
          if (e.isDirectory()) walk(path.join(d, e.name));
          else n++;
        }
      };
      walk(FIXTURES);
      return n;
    })(),
  }, null, 2), "utf-8");

  console.log(`\n== Assertions: ${passed} passed, ${failures.length} failed`);
  if (failures.length > 0) {
    console.log(JSON.stringify(failures, null, 2));
    process.exit(1);
  }
  console.log(`Outputs written to ${rel(OUTPUT_DIR)}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
