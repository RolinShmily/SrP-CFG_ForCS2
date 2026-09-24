import { StreamLanguage, type StringStream } from "@codemirror/language";
import { nextCfgToken } from "@srp-cfg/ui";

/**
 * CS2 cfg 的 CodeMirror 语言。
 *
 * 词法规则在 @srp-cfg/ui 的 cfg-lang 里，与网站高亮共用同一份；
 * 这里只负责把它接到 CodeMirror 的 StringStream 上。
 */
export const cs2CfgLanguage = StreamLanguage.define({
  name: "cs2cfg",
  token(stream: StringStream) {
    if (stream.eatSpace()) return null;

    const tok = nextCfgToken(stream.string.slice(stream.pos));
    if (!tok) {
      stream.next();
      return null;
    }
    stream.pos += tok.text.length;
    return tok.type;
  },
  languageData: {
    commentTokens: { line: "//" },
  },
});
