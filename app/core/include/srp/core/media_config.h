#pragma once
#include "srp/core/config_backup.h"
#include <string>
#include <vector>
#include <map>
namespace srp::core {
struct VideoOption { std::string key, label; std::vector<std::pair<std::string, std::string>> values; };
struct VideoParseResult { bool success = false; std::map<std::string, std::string> values; std::string error; };
const std::vector<VideoOption>& videoOptions();
VideoParseResult parseVideoConfig(const std::string& text);
ConfigWriteResult changeVideoOption(const std::string& text, const std::string& key, const std::string& value, std::string& changed);
bool isCs2Running();
ConfigWriteResult mergeVideoConfig(const std::string& source, const std::string& current, std::string& merged);
ConfigWriteResult applyVideoConfig(const std::string& text, const std::string& userCfgDir);
struct AnnotationGuide { std::string id, name, directory, map, file; std::string relativeFile() const { return directory + "/" + file; } };
std::vector<AnnotationGuide> annotationGuides(const std::string& packageDirectory = {});
bool validateAnnotation(const std::string& text, const std::string& guideId, const std::string& packageDirectory = {});
ConfigWriteResult deployAnnotation(const std::string& guideId, const std::string& text, const std::string& localDirectory);
ConfigWriteResult removeAnnotation(const std::string& guideId, const std::string& localDirectory);
ConfigWriteResult operateAnnotationGuides(const std::vector<std::string>& ids, const std::string& localDirectory, bool remove);
std::string annotationTarget(const std::string& guideId, const std::string& localDirectory);
}
