import assert from "node:assert/strict";
import test from "node:test";

import { formatConfigContext } from "./worker.ts";

test("formats exact structured bind evidence for the language model", () => {
  const context = formatConfigContext({
    kind: "bind",
    sourcePath: "config/srp-cfg/presets/default/keymap.cfg",
    line: 77,
    family: "presets",
    module: "default",
    key: "j",
    body: "srp_knife",
    source: 'bind "j" "srp_knife"',
    description: "切换匕首模型。",
  });

  assert.match(context, /位置：config\/srp-cfg\/presets\/default\/keymap\.cfg:77/);
  assert.match(context, /按键："j"/);
  assert.match(context, /绑定或定义内容："srp_knife"/);
  assert.match(context, /源码：`bind "j" "srp_knife"`/);
  assert.doesNotMatch(context, /jump|sv_jump/);
});
