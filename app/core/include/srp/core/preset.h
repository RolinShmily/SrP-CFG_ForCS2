#pragma once

#include <string>
#include <vector>

namespace srp::core {

struct PresetInfo {
    std::string id;          // 如 "default", "echo", "visionl", "yszh"
    std::string displayName; // 如 "Default", "Echo", "VisionL", "Yszh"
    std::string command;     // 如 "srp_apply_default"
    std::string descriptionZh, descriptionEn;
    std::vector<std::string> files, tagsZh, tagsEn;
    bool hasDiff = false;    // 是否与官方初始模板存在差异（出厂差异标记 *）
};

// 扫描所有可用预设，并计算它们与官方初始基线是否存在改动差异
std::vector<PresetInfo> scanPresets(const std::string& gameCfgDir, const std::string& sourceConfigDir = {});

// 获取当前 custom.cfg 中激活的预设 ID (若未激活任何预设返回空字符串)
std::string getActivePresetId(const std::string& gameCfgDir, const std::string& sourceConfigDir = {});

// 将指定预设的生效命令写入 custom.cfg 的 Preset Layer 中
bool loadPreset(const std::string& presetId, const std::string& gameCfgDir);

// 从 custom.cfg 中卸载（注释掉）所有 srp_apply_* 预设命令
bool unloadPreset(const std::string& gameCfgDir);

// 获取读取文件的实际路径，供 GUI 监听使用，与读取时的回退规则保持一致。
std::string resolvePresetFilePath(const std::string& presetId, const std::string& fileName,
                                  const std::string& gameCfgDir, const std::string& sourceConfigDir = {});

// 读取指定预设的文件内容（优先从游戏安装目录读取，若未装配则读取源目录）
std::string readPresetFile(const std::string& presetId, const std::string& fileName,
                           const std::string& gameCfgDir, const std::string& sourceConfigDir = {});

// 保存修改后的预设文件（优先保存至游戏安装目录，并自动建立 .bak 安全备份）
bool savePresetFile(const std::string& presetId, const std::string& fileName,
                    const std::string& content, const std::string& gameCfgDir);

// 使用官方出厂初始干净模板恢复指定预设文件
bool resetPresetFileToDefault(const std::string& presetId, const std::string& fileName,
                              const std::string& gameCfgDir, const std::string& sourceConfigDir = {});

// 检测单个预设文件是否与官方出厂模板存在差异
bool isPresetFileModified(const std::string& presetId, const std::string& fileName,
                          const std::string& gameCfgDir, const std::string& sourceConfigDir = {});

} // namespace srp::core
