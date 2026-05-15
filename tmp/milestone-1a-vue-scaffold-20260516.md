# 里程碑记录：Phase 1A — Vue.js SPA 项目骨架

**时间**: 2026-05-16
**提交**: `814b65d` feat(site): 初始化 Vue.js SPA 项目骨架

## 完成内容

### 项目结构
- Vue 3.5 + TypeScript 5.7 + Vite 6.3
- Vue Router 4.5 懒加载路由
- markdown-it 14.1 文档渲染
- pnpm 10.11 包管理

### 路由
- `/` → HomePage（首页展示）
- `/docs` → DocIndexPage（文档索引，13 篇文档列表）
- `/docs/:slug` → DocDetailPage（单篇文档，markdown-it 渲染）
- `/download` → DownloadPage（下载页面）

### 组件
- NavBar：固定顶部导航，滚动阴影，移动端汉堡菜单
- FooterBar：底部信息栏

### 内容迁移
- 13 篇 markdown 文档从 SrP-DoC 复制到 src/content/
- DocDetailPage 使用 import.meta.glob 动态加载 .md 文件

### 样式
- 全局 CSS 变量（暗色主题，游戏科技风）
- 文档页完整 markdown 样式（表格、代码块、引用等）
- Noise overlay + Ambient glow orbs

### 构建验证
- `vite build` 成功，1.36s
- 代码分割：每个页面/文档独立 chunk
EOF
