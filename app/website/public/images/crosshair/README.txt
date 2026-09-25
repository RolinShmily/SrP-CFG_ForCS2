图片放在这个目录，文件名 = 预设 id

  c06.png   → 准星 c06 的截图
  v03.png   → 视角 v03 的截图

支持 png / jpg / jpeg / webp / avif。丢进文件即可，无需改代码；
scripts/extract-crosshair.mjs 构建时会自动扫描本目录。
没放图的预设，页面显示占位框。

当前已就位（2026-09-24 填入，源图只存在用户本机，仓库只存转码后的成品）：

  c00–c07.webp  准星紧裁小图，90x73 PNG 经 Lanczos 放大 3 倍 + 轻锐化
  v00–v07.webp  全屏截图，2559x1439 PNG 压到 1600px 宽

重转参数：准星 `magick <id>.png -filter Lanczos -resize 300% -unsharp 0x0.75+0.75+0.008 -quality 95 <id>.webp`；
视角 `magick <id>.png -filter Lanczos -resize 1600x -quality 80 <id>.webp`。
