#pragma once

#include <string>

namespace srp::core {

// Text file bytes normalized for editing. `body` uses "\n" line endings; the
// original BOM and CRLF style are recorded so a save can reproduce the file.
struct DocumentText {
    std::string body;
    bool hasBom = false;
    bool crlf = false;
};

DocumentText decodeDocument(const std::string& bytes);
std::string encodeDocument(const std::string& body, bool hasBom, bool crlf);

} // namespace srp::core
