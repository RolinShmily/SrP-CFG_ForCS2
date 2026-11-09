#include "srp/core/text_document.h"

namespace srp::core {

DocumentText decodeDocument(const std::string& bytes) {
    DocumentText document;
    const bool hasBom = bytes.size() >= 3 && static_cast<unsigned char>(bytes[0]) == 0xEF
        && static_cast<unsigned char>(bytes[1]) == 0xBB && static_cast<unsigned char>(bytes[2]) == 0xBF;
    document.hasBom = hasBom;
    const size_t start = hasBom ? 3 : 0;

    document.body.reserve(bytes.size() - start);
    for (size_t i = start; i < bytes.size(); ++i) {
        const char c = bytes[i];
        if (c == '\r') {
            if (i + 1 < bytes.size() && bytes[i + 1] == '\n') {
                document.crlf = true;
                ++i;
            }
            document.body += '\n';
        } else {
            document.body += c;
        }
    }
    return document;
}

std::string encodeDocument(const std::string& body, bool hasBom, bool crlf) {
    std::string bytes;
    bytes.reserve(body.size() + (crlf ? body.size() / 8 : 0) + (hasBom ? 3 : 0));
    if (hasBom) bytes.append("\xEF\xBB\xBF", 3);
    for (const char c : body) {
        if (c == '\n' && crlf) bytes += '\r';
        bytes += c;
    }
    return bytes;
}

} // namespace srp::core
