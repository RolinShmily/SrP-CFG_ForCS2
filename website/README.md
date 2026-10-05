# SrP-CFG 产品展示网站

Next.js / React / TypeScript / Tailwind CSS / Motion / Radix UI / Lucide，静态导出到 gh-pages。无需应用服务器、Three.js 或新增运行时依赖。

## 本地预览

```bash
cd website
pnpm build
pnpm preview
```

打开终端显示的地址（默认 `http://127.0.0.1:4173/`）。preview 自动识别构建时的 basePath，并在缺少本地 packages.json 时只为预览代理线上配置清单；这不是部署所需的服务器。

```bash
pnpm test
pnpm lint
```

test 使用 Node >=22.18 内置 TypeScript stripping；lint 是严格 TypeScript 检查。沿用仓库已有依赖及锁文件。

## 页面和动效

- 首屏：真实桌面窗口截图，滚动错位视差与 CSS 3D 透视。
- APP 展示：五个页面、中英文真实截图、带图标的手动标签与前后切换、键盘切页。无自动轮播或放大弹窗。
- 配置装配：四个配置职责层的空间展示，展开/收起及层选择。只有装饰面板接受 3D 倾斜，文字和代码保持原生尺寸正向渲染，避免整层缩放引起的模糊。模式以按键触发，不暗示启动时立即执行。
- 下载中心：软件与独立配置包分开展示。
- 顶部三个导航岛在滚动后聚合。手机使用可键盘关闭的菜单。
- 保留既有 Valve CS2 SVG 背景；没有复制参考站的图片或品牌资源。
- 减少动态效果模式禁用视差和空间变换。页脚提供品牌、链接、图标技术栈与明确的 MIT License 链接，不显示备案信息。

软件截图位于 public/app，以 WebP 保存（约 60–105 KB/张）。中文为浅色界面，英文部分包含深色界面。截图为当前 Qt/C++ 应用真实捕获，不是可远程操作的桌面，也不会修改游戏配置。

## i18n

简体中文默认，English 可切换并保存在 localStorage。页面文案、导航、演示说明、下载状态和错误处理均有两种语言；html lang 与页面标题同步，静态初始 HTML 为中文。语言和下载来源读取失败不阻止页面。

## 软件下载

默认加速源：

`https://gh.269601.xyz/https://github.com/RolinShmily/SrP-CFG_ForCS2/releases/...`

可切换 GitHub 原生源并记忆选择。读取最新 release/download/latest.json，失败时尝试 GitHub Releases API（可能受限流影响）。仅启用正式、版本匹配、来自指定仓库的 GUI ZIP / Setup EXE 链接，排除 CLI ZIP 和预发布。

无清单或无匹配资产时显示状态、重试与官方 Releases 入口，不硬编码新版本或虚构制品。SHA-256 与文件大小存在时显示。页面只链接下载，不自动执行校验、安装或升级。

线上 v3.4.0 Release 已提供 latest.json、GUI ZIP 和 Setup EXE。解析测试同时覆盖受控清单与缺失制品的回退行为。

## 独立配置包

读取同源 packages.json，按现有 gh-pages 流程提供 srp-cfg、video、annotations 的独立版本、大小、SHA-256 与 ZIP 下载。软件镜像选择不改配置包来源；配置包不依赖软件 Release。CI 在构建前从 config 打包并生成真实清单。

## 部署

Deploy Website & Config Packages workflow 将 website/out 的内容发布到 gh-pages 根目录，网站默认从 `/` 加载资源。自动 CI 与手动部署均直接使用默认构建配置，不再提供 base_path 输入，也不设置仓库名路径前缀。域名/DNS/CNAME 由托管设置管理。

根路径和仓库子路径均已验证图片、CSS、字体、SVG 背景、图标和清单地址。next.config.mjs 继续使用 output: export / unoptimized images。

## 验证记录

测试下载元数据的仓库边界、版本错配、制品筛选、配置包 SHA/大小和镜像拼接。真实浏览器验证中英文和来源持久化、键盘切页、手动前后切换、导航聚合、层展开/收起、手机菜单、375/390px 无溢出、减少动态效果、API 失败回退与无水合异常。

截图及本地验证脚本在 build-gui/verification-website（忽略目录，不参与部署）。未新增依赖。
