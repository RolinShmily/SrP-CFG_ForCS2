#include "srp/core/text_document.h"
#include <iostream>
#include <stdexcept>

namespace {
void check(bool ok, const char* label) {
    if (!ok) throw std::runtime_error(label);
    std::cout << "PASS: " << label << '\n';
}
}

int main() {
    using srp::core::decodeDocument;
    using srp::core::encodeDocument;
    try {
        auto plain = decodeDocument("bind p srp_practice\n");
        check(!plain.hasBom && !plain.crlf && plain.body == "bind p srp_practice\n", "plain LF document");

        auto crlf = decodeDocument("a\r\nb\r\n");
        check(!crlf.hasBom && crlf.crlf && crlf.body == "a\nb\n", "CRLF detected and normalized");

        auto bom = decodeDocument("\xEF\xBB\xBF" "a\r\nb\r\n");
        check(bom.hasBom && bom.crlf && bom.body == "a\nb\n", "BOM and CRLF recorded");

        auto loneCr = decodeDocument("a\rb");
        check(!loneCr.crlf && loneCr.body == "a\nb", "lone CR normalized to LF");

        check(encodeDocument("a\nb\n", false, false) == "a\nb\n", "LF round trip");
        check(encodeDocument("a\nb\n", true, true) == "\xEF\xBB\xBF" "a\r\nb\r\n", "BOM and CRLF round trip");
        check(encodeDocument("a\r\n", false, true) == "a\r\r\n", "existing CR is preserved, only LF is converted");

        auto empty = decodeDocument("");
        check(!empty.hasBom && !empty.crlf && empty.body.empty(), "empty document");
        check(encodeDocument("", true, true) == "\xEF\xBB\xBF", "empty body keeps BOM");

        std::cout << "ALL TEXT DOCUMENT CHECKS PASSED\n";
        return 0;
    } catch (const std::exception& error) {
        std::cerr << "FAIL: " << error.what() << '\n';
        return 1;
    }
}
