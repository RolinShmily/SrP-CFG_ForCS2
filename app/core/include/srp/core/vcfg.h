#pragma once

#include "srp/core/types.h"
#include <string>
#include <unordered_set>
#include <unordered_map>

namespace srp::core {

// 解析指定 user_cfg 目录下的 Convars 与按键绑定并返回统计结果
ConvarsSummary inspectConvars(const std::string& userCfgDir);

// 读取所有的 convars 键值对
std::unordered_map<std::string, std::string> readUserConvars(const std::string& userCfgDir);

// 读取所有的按键绑定键值对
std::unordered_map<std::string, std::string> readUserKeybinds(const std::string& userCfgDir);

// 清理指定 user_cfg 下全部的按键绑定
bool cleanAllKeybinds(const std::string& userCfgDir);

// 清理指定 user_cfg 下全部的 convars
bool cleanAllConvars(const std::string& userCfgDir);

} // namespace srp::core
