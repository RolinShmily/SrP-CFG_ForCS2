#pragma once

#include <string>

namespace srp::core {

// 启动 CS2 游戏 (通过 Steam 协议唤起)
bool launchCs2();

// 在系统资源管理器中打开指定目录（若目录不存在则先创建）
bool openFolderInExplorer(const std::string& folderPath);

// 检测指定游戏 cfg 目录下是否已装配 SrP-CFG 运行环境
bool isSrpInstalled(const std::string& gameCfgDir);

// 获取游戏目录下已安装的 SrP-CFG 版本号 (若未安装则返回空字符串)
std::string getInstalledSrpVersion(const std::string& gameCfgDir);

// 获取随附/内置的源 SrP-CFG 版本号
std::string getSourceSrpVersion();

// 定位随附的源 config 目录路径
std::string findSourceConfigDir();

// 一键装配/部署 SrP-CFG 到游戏 cfg 目录下
bool installSrp(const std::string& gameCfgDir, const std::string& sourceConfigDir = {});

// 安全卸载游戏目录下的 SrP-CFG (保留 custom.cfg 备份)
bool uninstallSrp(const std::string& gameCfgDir);

// 恢复 Valve 默认设置基线 (写入 custom.cfg 并安全清理用户端缓存)
bool resetValveBaseline(const std::string& gameCfgDir, const std::string& userCfgDir = {});

} // namespace srp::core
