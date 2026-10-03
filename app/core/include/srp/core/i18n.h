#pragma once

#include <string>
#include <string_view>

namespace srp::core {

enum class Language {
    ZhCN,
    EnUS
};

void setLanguage(Language lang);
Language currentLanguage();

std::string tr(std::string_view key);

} // namespace srp::core
