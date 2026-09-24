本目录下的 JSON 全部由脚本生成，请勿手改。

它们只被 import 使用（打包器会在构建期内联进 JS chunk），
所以放在 src/ 而不是 public/ —— 放 public/ 会被原样拷进部署产物，
而页面从不按 URL 取它们，那些拷贝是纯冗余（约 1.2MB）。

生成方：

  commands.json   .github/scripts/update_commands.py
                  （每日 update-commands.yml 从 SteamTracking 拉取后自动提交）

  keymaps.json    scripts/extract-keymaps.mjs     ← config/srp-cfg 的按键数据
  crosshair.json  scripts/extract-crosshair.mjs  ← config/srp-cfg 的准星/视角库

后两个由 app/website 的 dev / build 脚本在构建前自动重跑，
CI 的 validate job 再用 --check 校验产物与 config/ 一致（改了 cfg 忘了重新生成会红）。

按文件名搜索引用即可找到全部读取点。
