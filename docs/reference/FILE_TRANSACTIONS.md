# 文件事务

本文档描述 SrP-CFG 对配置文件的写入、备份、回滚及边界保证。核心实现位于 `src/core/src/config_backup.cpp`、`src/core/src/actions.cpp`、`src/core/src/packages.cpp` 和 `src/core/src/media_config.cpp`。

## 原子写入与备份

所有关键 CFG 写入共用 `writeConfigWithBackup`：

```cpp
ConfigWriteResult writeConfigWithBackup(
    const std::string& filePath,
    const std::string& content,
    const std::string& reason);
```

流程：
1. **读取现有内容**。若内容相同，直接返回 `success=true, changed=false`，不写文件。
2. **创建临时文件**。在同目录写入 `.filename.<stamp>.tmp`。
3. **生成历史备份**。将原文件复制到 `.backups/<filename>/<stamp>-<reason>.bak`。
4. **更新 `.bak`**。将原文件复制到 `filename.bak`；若已存在 `.bak`，先保留旧 `.bak` 的恢复副本。
5. **原子替换**。Windows 通过 `MoveFileExW(..., MOVEFILE_REPLACE_EXISTING | MOVEFILE_WRITE_THROUGH)` 完成；遇共享冲突时最多重试 50 次（10 ms 间隔），不修改权限或强制删除。
6. **清理旧历史**。按文件独立管理，最多保留 **20 份不同字节内容** 的历史；重复内容仅保留最新快照。
7. **失败回滚**。若替换失败，恢复此前 `.bak`，删除本次历史备份，原文件保持完整。

删除操作使用 `removeConfigWithBackup`，流程类似：先备份再原子替换为空（或直接移除）。

## autoexec 挂载与解挂

安装时非侵入式向 `autoexec.cfg` 插入 SrP 启动块：

```text
// ─── SrP-CFG Launcher Hook (Managed) ───
exec srp-cfg/runtime/init.cfg
exec srp-cfg/user/custom.cfg
// ─── End of SrP-CFG ───
```

- **挂载**：若 `autoexec.cfg` 不存在则新建；若已存在则检测是否含 `srp-cfg/runtime/init.cfg`，避免重复插入。原子写入并保留原有内容与 `.bak`。
- **解挂**：精准剔除挂载块，保留玩家自己的全部指令。若文件不存在视为成功。

失败返回 `pkg.write_failed` 或相关错误键。

## 安装与卸载边界

### installSrp
- 拒绝空 `gameCfgDir` → `feedback.invalid_cfg_dir`
- 源目录无效 → `pkg.no_bundle`
- 源必须包含 `srp-cfg/runtime/init.cfg` → `pkg.invalid_package`
- 目录/复制失败 → `pkg.write_failed`
- `user/custom.cfg` 若已在游戏中存在则保留，不覆盖。
- 非 `.cfg` 文件采用 `.srp-tmp` 阶段文件 + `replaceFileAtomically` 写入。
- 安装后校验 `isSrpInstalled`，失败返回 `pkg.write_failed`。

### uninstallSrp
- 拒绝空 `gameCfgDir` → `feedback.invalid_cfg_dir`
- 备份 `srp-cfg/user/custom.cfg` 到 `custom.cfg.uninstalled.bak`
- 删除 `srp-cfg` 目录失败 → `pkg.write_failed`
- 解挂 autoexec 失败返回对应错误
- 卸载后若仍检测到已安装 → `pkg.write_failed`

## 配置包暂存事务

暂存区结构：

```text
<pkg-root>/
  current.txt              # 指向当前 generation
  .update-lock/            # 进程级文件锁
  generations/<g>/
    original/<pkg>/         # 包原始内容
    work/<pkg>/             # 可编辑副本
    base/<pkg>/             # 副本基准
    base-version/<pkg>/     # 副本基准版本
    digest/<pkg>            # ZIP SHA-256
```

- **初始化**：`initializePackages()` 在无有效暂存区时生成首代；不会因重装软件而最近化已更新的包。
- **切换**：`package-update` 准备新 generation 后，安全写入 `current.txt` 指针；失败保留旧指针和旧配置。
- **锁**：`StoreLock` 使用进程级文件锁防止 CLI/GUI 同时写入同一暂存区。
- **保留旧代**：保留最近两代 generation，旧代自动清理；`.bak` 与历史备份随 generation 迁移。
- **副本策略**：未修改副本随新包刷新；已修改副本保留内容及基准，标记“基于旧版本”；恢复默认时备份工作副本再采用当前原始内容。

## 视频运行中守卫

`applyVideoConfig` 在合并到账号 `cs2_video.txt` 前调用 `isCs2Running()`（扫描 `cs2.exe` 进程）。若游戏正在运行，返回 `video.running` 错误，拒绝修改。

## 路径白名单

配置包在线更新通过 `allowedUrl` 强制限制：
- 仅接受 `https://cfg.srprolin.com/packages/` 前缀
- 禁止查询参数、片段标识符
- 下载使用 `WINHTTP_OPTION_REDIRECT_POLICY_NEVER`，禁止重定向
- 仅接受 HTTPS，状态码须为 200

本地路径校验使用 `safeRelative`：拒绝绝对路径、越界路径 (`..`)、反斜杠、链接、Windows 非法名称及大小写重复。

## 失败模式与用户可见错误键

| 错误键 | 场景 |
|--------|------|
| `feedback.invalid_cfg_dir` | CFG 目录未检测到或参数为空 |
| `pkg.no_bundle` | 未找到随包配置源 |
| `pkg.invalid_package` | 包内容或路径校验失败 |
| `pkg.write_failed` | 文件/目录写入、备份、替换失败 |
| `pkg.network_failed` | 无法下载清单或包 |
| `pkg.invalid_manifest` | 官方清单格式非法 |
| `pkg.hash_failed` | 包大小或 SHA-256 校验失败 |
| `pkg.busy` | 暂存区被其他进程占用 |
| `video.running` | 应用视频设置时 CS2 正在运行 |
| `media.external_conflict` | 暂存文件被外部程序修改 |
| `media.save_first` | 有未保存草稿时禁止装配/应用/切换 |

失败时 `ConfigWriteResult::error` 携带上述键；CLI 通过 `srp::core::tr(error)` 翻译为用户可见文本。
