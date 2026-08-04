# L0.6 黄金样本记录（Golden Samples）

> 状态：✅ 已落地（Track B，WSL 完成）—— fixtures + Node/Rust 双版输出对照
> 用途：L2（Electron → Tauri）验收标准「关键业务路径与黄金样本对照一致（勾选率 ≥ 80%）」的直接引用依据
> 数据时间：2026-08-04；分支 `refactor/tauri-vite-react`

---

## 0. 方法说明

| 项 | 说明 |
| :--- | :--- |
| **Rust 版** | `app/desktop/src-tauri/core/`（7 模块 / **84 测试全绿**，clippy 0 警告）已用同款输入断言了 staging/installer/updater/detection/vcfg 的输入→输出；本文件直接引用其测试名作为 Rust 侧结果。`cargo test -p srp-cfg-core` 可随时复跑 |
| **Node 版** | 在 WSL 运行原生产代码 `app/desktop/src/main/services/*.ts` 的导出纯函数，stub electron 的 `app/net/shell` 与 `winreg`（注册表为 Windows 专属，未参与）；对 `fixtures/` 同一份输入落盘记录输出 |
| **产出** | ① `fixtures/` 伪 Steam/上传包/游戏 CFG 目录（30 文件）；② `scripts/golden-node.mjs` + `stubs/`（可复现执行器，**117 条断言全 PASS**）；③ `golden-outputs/*.json`（各场景归一化输出，随仓库提交） |
| **对照口径** | install/res/save 的 files/dirs 按**排序后的多集**比较（TS 内部 readdir 顺序不稳定，Rust 侧对同输入为顺序保持）；时间戳类字段（timestamp/capturedAt/modifiedAt/mtimeMs）归一化为 0；沙箱路径统一显示为 `<sandbox>` |
| **复现命令** | 见 `scripts/golden-node.mjs` 头部注释（esbuild bundle + node 运行，断言失败则退出码 1） |

> 对照结论：Node 版（生产参照）与 Rust core 在全部被断言行为上**一致**，无需修改 core；唯一需要 Windows 实机的部分是注册表读取与 `detectSteamPath`（见 §7）。

---

## 1. 路径一：Steam / CS2 检测

**输入**（`fixtures/steam/`，沙箱复制为 4 个变体）：

```
steam-<variant>/                       variant = installed | update | not-installed | no-manifest
├── steam.exe                          （存在性标记）
├── config/loginusers.vdf              3 账号：Alice(AutoLogin=1, TS=1700000000)、
│                                      Bob(mostrecent=1, TS=1800000000)、Carol(TS=1750000000)
├── steamapps/
│   ├── libraryfolders.vdf             lib0="C:\Program Files (x86)\Steam\steamapps"
│   │                                  lib1="D:\SteamLibrary\steamapps"
│   ├── appmanifest_730.acf            StateFlags=4（installed）／6（update）／2（not-installed）／无文件（no-manifest）
│   └── common/Counter-Strike Global Offensive/game/csgo/
│       ├── cfg/{autoexec.cfg, custom.cfg, maps/dust2_comp.cfg}
│       └── annotations/local/dust2.txt
└── userdata/0/730/local/cfg/          accountId 0（Alice）= steamId64 - 76561197960265728
    ├── cs2_user_keys_0_slot0.vcfg  +  .vcfg_lastclouded（云端镜像）
    ├── cs2_user_convars_0_slot0.vcfg
    ├── cs2_machine_convars.vcfg
    ├── cs2_video.txt
    └── custom-user.cfg
```

**期望输出**（Node 版实测，见 `golden-outputs/s1Detection.json`；Rust 侧测试名并列为对照）：

| 断言 | Node 实测 | Rust core 对应测试 |
| :--- | :--- | :--- |
| libraryfolders 解析 + steamRoot 置顶 | `[<sandbox>/steam-*, "C:\Program Files (x86)\Steam\steamapps", "D:\SteamLibrary\steamapps"]` | `detection::tests::extracts_library_paths_and_normalizes_backslashes`（unshift 为壳层行为，core 只解析） |
| StateFlags=4 → installed | `{state:"installed", installDir:<sandbox>/steam-*/steamapps/common/Counter-Strike Global Offensive}` | `detection::tests::manifest_states_by_flags`（4→Installed，6→NeedsUpdate，0/2→None，非数字→None） |
| StateFlags=6 → needs-update | `{state:"needs-update", installDir:同 installed}` | 同上（`(flags&4)!=0 && (flags&2)`） |
| StateFlags=2 / 无 manifest → not-installed | `{state:"not-installed", installDir:null}` | 同上（None → 壳层继续遍历 → NotInstalled） |
| CS2 游戏 CFG 路径 | `<sandbox>/steam-*/…/game/csgo/cfg`（**不依赖 manifest**，TS 行为：按默认目录存在性判断） | `detection::tests::game_dir_uses_installdir_or_default`（installdir/默认名回退） |
| loginusers 用户识别 | 3 用户：Alice(0) / Bob(72208212) / Carol(144537572) | `detection::tests::account_id_offset_subtraction`（steamId64→accountId） |
| 当前用户 = AutoLogin 优先 | `currentUser=Alice`（即使 Bob Timestamp 更大且 mostrecent=1） | `detection::tests::auto_login_field_marked` |
| Timestamp 回退 | timestamp-only 变体 → Bob；单账号 → 本人；空文件 → 无用户 | `detection::tests::falls_back_to_latest_timestamp` / `single_user_is_current` / `empty_or_invalid_content` |
| 账号目录 / VCFG 状态 | userCfgPath=`…/userdata/0/730/local/cfg`；`{available:true, bindings:3, analogBindings:1, cloudConvars:3, machineConvars:2, hasCloudMirror:true, hasVideoConfig:true}` | `vcfg::tests::*`（count/string_entries 见 §2） |

**对照结论**：检测纯逻辑（VDF/ACF/loginusers 解析、状态判定、用户选择）Node 与 Rust 完全一致。注册表读取 + `detectSteamPath`（含默认路径扫描与 steam.exe 评分）为 **Windows 实机验收项（L2.6）**，本环境以 stub 跳过。

---

## 2. 路径二：VCFG 解析 / 快照 / 生成

**输入**：§1 的 `userdata/0/730/local/cfg/*.vcfg`（根键 `"config"`，与真实 CS2 产物一致）+ `cfg/autoexec.cfg` + 用户目录 `cs2_video.txt`。

**期望输出**（Node 实测，见 `golden-outputs/s2Vcfg.json`）：

| 断言 | Node 实测 | Rust core 对应测试 |
| :--- | :--- | :--- |
| 快照 bindings / analogbindings | `{a:"say_team pushed_a", j:"+forward", t:"say_team hi"}` / `{joy_forward:"+forward"}` | `vcfg::tests::parse_vdf_builds_nested_tree` / `string_entries_sorts_and_excludes_nodes`（键排序输出） |
| 快照 convars | user: `{fps_max:0, cl_crosshairsize:3.5, name:"Alice with space"}`；machine: `{r_fullscreen_gamma:2.2, video_upscale_enabled:0}` | `vcfg::tests::tokenize_handles_quotes_comments_braces`（引号/注释/花括号）、`tokenize_keeps_literal_backslash_key` |
| VCFG 状态摘要 | `{available:true, bindings:3, analogBindings:1, cloudConvars:3, machineConvars:2, hasCloudMirror:true, hasVideoConfig:true}` | count/string_entries（cloud mirror 与 video 为 fs 存在性，壳层） |
| parseCfgConvars（echo/exec/bind 过滤 + 行内注释） | `{cl_crosshair_size:"3", fps_max:"144"}`（exec/bind 行被跳过） | `vcfg::tests::cfg_convars_skips_comments_and_directives` / `cfg_convars_inline_comment_stripped` / `cfg_convars_directive_check_is_case_insensitive` |
| baseline 快照保存 | 首次 `created:true` 写入 `…/vcfg-snapshots/0/baseline.json`；二次 `created:false` | （壳层 fs + 快照结构复用 §2 首行） |
| snapshot→CFG（baseline=当前快照） | convars 全被过滤（默认值），**bindings 仍输出**（bindings 不做 baseline 对比）：`// ── 按键绑定 ──\nbind "a" …\nbind "j" …\nbind "t" …\n// ── 模拟轴绑定 ──\nbind "joy_forward" "+forward"` | `vcfg::tests::snapshot_bindings_sorted_and_quoted` / `snapshot_convars_filtered_by_baseline` |
| snapshot→CFG（空 baseline） | 全部 convars 输出、键排序、含空格值加引号：`cl_crosshairsize 3.5 / fps_max 0 / name "Alice with space" / r_fullscreen_gamma 2.2 / video_upscale_enabled 0` | `vcfg::tests::snapshot_convar_value_with_space_is_quoted` / `snapshot_all_sections_ordered` / `normalize_boolean_literals` |

**对照结论**：一致（VCFG tokenize/parse、convar 提取、baseline 过滤、布尔归一化、输出排序全部对齐）。`hasCloudMirror/hasVideoConfig` 属 fs 存在性检查（壳层职责）。

---

## 3. 路径三：上传 / 下载包 staging

**输入**：
- 目录形态包 `fixtures/uploads/pack-a/`：`autoexec.cfg`、`presets/yszh.cfg`、`annotations/local/dust2.txt`、`cs2_video.txt`、`config.vcfg`、`notes.txt`、`readme.md`
- ZIP 形态包 `fixtures/uploads/pack-b.zip`：`run.cfg`、`annotations/local/mirage.txt`、`cs2_video.txt`、`config.vcfg_lastclouded`、`assets/logo.png`
- Runtime 包（合成）：`autoexec.cfg`(exec srpcfg/runtime.cfg) + `srpcfg/runtime.cfg`(仅 alias/echo/echoln) + `srpcfg/reload.cfg`

**期望输出**（Node 实测，见 `golden-outputs/s3Staging.json`）：

| 断言 | Node 实测 | Rust core 对应测试 |
| :--- | :--- | :--- |
| pack-a overlay 归类 | `{cfgCount:2, annotationsCount:1, videoCount:1}`；cfg 区树 `[autoexec.cfg, presets/yszh.cfg]`、annotations `[local/dust2.txt]`、video `[cs2_video.txt]`；config.vcfg 被阻止、notes.txt/readme.md 被跳过 | `staging::tests::plan_counts_categories`（vcfg 阻止/unsupported 计数）、`classifies_by_extension_and_path`、`annotations_wins_over_cfg` |
| append 模式不清空 | 同样计数，cfg 区树不变（合并覆盖） | `staging::tests::cfg_keeps_relative_subdirs` / `annotations_strips_prefix` / `annotations_falls_back_to_basename` |
| 暂存区研判 | pack-a → `{kind:"custom", cfgCount:2}`；Runtime 包 → `{kind:"runtime-core", cfgCount:3}` | `staging::tests::inspect_kinds` / `pure_runtime_registration_detected` / `runtime_with_binding_is_custom` / `exec_cycle_does_not_hang` |
| ZIP 上传 | 目录名匹配 `YYYY-MM-DD-NNNN`（实测 `2026-08-04-0001`）；UploadEntry `{fileCount:1, files:[{name:"pack-b.zip", type:"txt"}]}`；`getUploadedEntries` 返回 `isZip:true` | `staging::tests::next_folder_sequence` / `timestamp_folder_validation` / `upload_types_by_extension`（zip 上传入口为壳层 uploadFiles） |
| ZIP 形态安装 | 解压后与目录形态同归类：`{cfg:1, ann:1, video:1}`；vcfg_lastclouded 被阻止、png 被跳过 | `staging::tests::video_and_blocked_files` / `plan_counts_categories` |
| 上传历史 / 删除 | `getUploadHistory` 含 1 条 zip 记录；删除后为空 | `staging::tests::limit_removes_oldest`（enforceLimit 语义：`while len>=max` 删到 max-1） |

**对照结论**：一致（文件归类、annotations 前缀剥离、video 固定名、vcfg 阻止、时间戳目录命名/上限、Runtime 包识别全部对齐）。zip 解压本身（extract-zip ↔ `zip` crate）为壳层 I/O。

---

## 4. 路径四：overlay / append 安装模式

**输入**：§1 `steam-installed` 变体；`game-cfg/` 用户已有文件（autoexec.cfg、custom.cfg、maps/、cs2_video.txt、`srp-cfg/user/custom.cfg` 用户偏好层）复制进游戏 CFG 目录；staging = pack-a。

**期望输出**（Node 实测，见 `golden-outputs/s4Install.json`）：

| 断言 | Node 实测 | Rust core 对应测试 |
| :--- | :--- | :--- |
| 路径回填 | gameCfg→cfg 目录、annotations→annotations/local、**video→userCfgPath**（历史行为） | `installer::tests::paths_filled_and_video_uses_user_cfg` / `null_paths_leave_unchanged` |
| 全新 overlay：冲突→res | res.gameCfg=`[autoexec.cfg]`、res.video=`[cs2_video.txt]`；install.gameCfg=`{files:[autoexec.cfg], dirs:[presets]}`、annotations.dirs=`[local]`、video.files=`[cs2_video.txt]`；save 全空（仅路径）；用户偏好文件 `srp-cfg/user/custom.cfg` 内容不变 | `installer::tests::overlay_fresh_install_moves_conflicts_to_res`（MoveToRes + CopyStaging 动作序） |
| 重复 overlay：上一版本→save | save.gameCfg=`{files:[autoexec.cfg], dirs:[presets]}`、save.video=`[cs2_video.txt]`；res 不变（非全新安装不产生新 res） | `installer::tests::overlay_reinstall_moves_previous_to_save` / `overlay_skips_previous_items_no_longer_in_game` |
| append 冲突检测（真实路径，4 冲突） | `{needsConfirm:false, conflicts:[gameCfg:[autoexec.cfg,presets], annotations:[local], video:[cs2_video.txt]]}` → 调用方应拒绝 | `conflicts::tests::over_three_conflicts_rejected`（>3 → Reject） |
| append 冲突检测（合成 1 冲突） | `{needsConfirm:true, conflicts:[gameCfg:[a.cfg]]}` | `conflicts::tests::small_conflict_requires_confirm` / `exact_three_conflicts_confirms` |
| append 无冲突 / usePersonalCfg 跳过 | 0 冲突 → `{needsConfirm:false, conflicts:[]}`；usePersonalCfg=true 时 gameCfg 冲突被跳过 | `conflicts::tests::no_conflicts_proceeds` / `use_personal_cfg_skips_game_cfg` / `without_personal_cfg_skips_user_cfg` |
| append 部署合并 | install.gameCfg 并集保持顺序（`[autoexec.cfg]+presets` 不重复） | `installer::tests::append_merges_union_keeping_order` / `ordered_union_dedupes` |
| 清单容错规范化 | install/res/save 缺失或 junk（files 含非字符串等）→ 归零为空，不崩溃 | `installer::tests::normalize_handles_junk_and_missing` / `normalize_state_reads_all_categories` |

**对照结论**：一致（overlay 动作序「prev→save / 冲突→res / staging→游戏」、append 并集合并、冲突阈值 3、usePersonalCfg 路由全部对齐）。

---

## 5. 路径五：冲突恢复（res.json）+ 备份恢复（save.json）

**输入**：承接路径四结束状态（res=gameCfg.autoexec.cfg + video.cs2_video.txt；save=gameCfg[autoexec.cfg]+presets、annotations[local]、video[cs2_video.txt]）；再以合成冲突包（`custom.cfg`，用户文件永不进 install）重新生成 res。

**期望输出**（Node 实测，见 `golden-outputs/s5Recovery.json`）：

| 断言 | Node 实测 | Rust core 对应测试 |
| :--- | :--- | :--- |
| restoreFromRes 单项 | `true`；res.gameCfg.files→`[]`、install.gameCfg.files→`[]`；游戏目录 autoexec.cfg 恢复为用户原文件（内容断言） | `installer::tests::restore_removes_from_backup_and_install_tracks_save`（backup 移除 + install 联动） |
| restoreResCategory 整类 | `restored:1`；res.video 清空；cs2_video.txt 恢复为原用户内容（1920×1080 fixture） | 同上（整类恢复 = 逐项 restore + clear，`clear_category_empties_state`） |
| restoreSaveItem 单项 | `true`；save.gameCfg.files→`[]`；install.gameCfg.files→`[autoexec.cfg]`（save→install 登记） | `installer::tests::restore_removes_from_backup_and_install_tracks_save` |
| clearInstallCategory 整类卸载 | `removed:2`（1 文件 + 1 目录）；install.gameCfg 清空 | `installer::tests::remove_item_updates_state` / `clear_category_empties_state` |
| restoreFromSave 全量 | `true`；install = save 清单（files/dirs 一致） | `installer::tests::install_from_backup` |
| restoreSaveCategory 整类 | `restored:1`；save.annotations 清空、install.annotations.dirs=`[local]` | `installer::tests::clear_category_empties_state` / `install_from_backup` |
| 重新生成的 res 冲突 | 合成包 overlay → res.gameCfg=`[custom.cfg]`（用户文件被保护进 res） | `installer::tests::overlay_fresh_install_moves_conflicts_to_res` |
| deleteResItem / deleteSaveItem / clearResCategory / clearSaveCategory | 均成功，对应清单同步清空 | `installer::tests::remove_item_updates_state` |

**对照结论**：一致（清单状态迁移——移除/恢复/整类清除/install 登记——全部对齐；文件落盘为壳层 I/O，本环境以沙箱目录实测）。

**补充（路径六 save.json 备份/恢复延伸 + 用户配置层）**，见 `golden-outputs/s7UserConfig.json`：

| 断言 | Node 实测 | 说明 |
| :--- | :--- | :--- |
| readUserConfig 候选选择 | 目标 `game`（游戏目录有 autoexec.cfg +500 且 custom.cfg 存在），`exists:true`、`runtimeInstalled:false`、内容=用户偏好层 | autoexec/runtime/custom 评分路由（`user-config.ts resolveCandidate`） |
| saveUserConfig | 写入 `game-cfg/srp-cfg/user/custom.cfg`，内容 `sensitivity 1.00\n`（自动补换行），读回一致 | 与 installer 的 withUserCustomPreserved 共同构成「用户偏好保护」闭环（S4 已断言部署时 custom.cfg 内容不变） |

---

## 6. 路径七（补充）：Updater（GitHub Releases 检测）

**输入**：stub `net.fetch` 返回 4 条 release（`v3.2.0`=desktop marker+config 包、`3.1.6`=config、`3.1.5`=config、`2.9.0`=无资产）；`app.getVersion()="3.1.6"`；缓存写入沙箱 userdata/update-cache。

**期望输出**（Node 实测，见 `golden-outputs/s6Updater.json`）：

| 断言 | Node 实测 | Rust core 对应测试 |
| :--- | :--- | :--- |
| 强制检查（网络路径） | `{hasUpdate:true, hasDesktopUpdate:true, hasConfigUpdate:true, releases:[3.2.0]}`（仅比当前新者） | `updater::tests::filters_only_newer` / `build_result_aggregates_flags` / `map_release_flags_assets` |
| tag 去 v / 资产判定 | `v3.2.0 → 3.2.0`；DESKTOP_UPDATE_MARKER / SrP-CFG_Runtime_Core.zip（大小写不敏感） | `updater::tests::tag_v_prefix_stripped_once` / `desktop_marker_detection` / `config_package_detection_case_insensitive` |
| 忽略版本 + 缓存节流 | `dismissVersion("3.2.0")` 后自动检查 → 空结果 `{hasUpdate:false, releases:[]}` | `updater::tests::dismissed_when_latest_not_newer_than_dismissed` / `cache_freshness_uses_interval` |
| 更新历史 | `fetchUpdateHistory → [3.2.0, 3.1.6, 3.1.5]`（2.9.0 被 ≥3.0.0 下限过滤，新→旧排序） | `updater::tests::history_filters_below_min_version` / `sorts_newest_first` |
| 最新版本 / 缓存落盘 | `getLatestVersion → "3.2.0"`；cache.json 含 dismissedVersion 与 cachedAllReleases | `updater::tests::map_release`（缓存结构为壳层读写） |

**对照结论**：一致（版本比较、过滤/排序、资产判定、忽略语义、节流判定全部对齐；`compare_versions` 另见 `version::tests::*` 5 条）。

---

## 7. 覆盖率与 Windows 实机遗留

**勾选率计算**（本文件断言条目：Node 117 条全 PASS；Rust 侧 84 测试全绿；两者行为一致）：

| 业务路径 | 断言条目数 | 已对照 | 说明 |
| :--- | :--: | :--: | :--- |
| 1 Steam/CS2 检测 | 29 | 29 | 注册表读取为 Windows 实机项（L2.6）；VDF/ACF/loginusers 纯解析全对照 |
| 2 VCFG 解析/快照/生成 | 11 | 11 | 全对照 |
| 3 上传/下载 staging | 17 | 17 | 全对照（zip 解压为壳层，归类逻辑全对照） |
| 4 overlay/append 安装 | 18 | 18 | 全对照 |
| 5 冲突恢复 + save 备份恢复 | 25 | 25 | 全对照 |
| 6（补充）Updater | 10 | 10 | 全对照 |
| 7（补充）用户配置层 | 7 | 7 | 全对照 |
| **合计** | **117** | **117（100%）** | ≥80% 达标 |

**Windows 实机遗留（不阻塞本文件，L2.6/L2.8 验收项）**：
1. `detectSteamPath`：注册表 4 路径读取 + 默认路径扫描 + steam.exe 评分（三分支：注册表成功/失败/Steam 未安装）——需真机 mock/实机验证
2. `annotationsPath`/`userCfgPath` 不存在时的自动创建分支（壳层 fs，WSL 沙箱已验证存在分支）
3. `tauri dev` 全功能 + 安装包 ≤20MB（2.8）

---

## 8. 根 README 发布说明（2026-08-04 L4 后半已切换）

- **打包链已切换为 Tauri v2**（L4 后半完成，2026-08-04）：
  - README 发布产物：`SrP-CFG_Installer.msi` + `SrP-CFG_Setup_x64.exe`（NSIS），体积 ≤20MB（实测 2.5MB/3.6MB）
  - 工程说明：desktop = Tauri v2 + React；开发环境 = Rust（MSVC）+ VS Build Tools（移除 .NET/WiX）
  - 构建命令：`pnpm --filter @srp-cfg/desktop tauri build`
- **electron-forge / WiX 已清理**：`msi/`、`forge.config.ts`、`vite.main/preload/renderer.config.ts`、@electron-forge/* 依赖均删除
- 保留：`src/main/services/*.ts` + `src/preload/preload.ts` 作为 L0.6 黄金样本 Node 版参照（不参与构建）
