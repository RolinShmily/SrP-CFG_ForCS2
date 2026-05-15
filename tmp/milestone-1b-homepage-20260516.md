# 里程碑记录：Phase 1B — 首页展示页面

**时间**: 2026-05-16
**提交**: `8b56daa` feat(site): 实现首页展示页面

## 完成内容

### 新建组件 (site/src/components/home/)
- `HeroSection.vue` — 标题、徽章、CTA按钮、安装器截图
- `StatsStrip.vue` — 3个统计数据指标
- `FeaturesGrid.vue` — 8个功能卡片（响应式网格）
- `StepsSection.vue` — 四步上手流程
- `ShowcaseSection.vue` — macOS风格终端动画（IntersectionObserver触发）
- `CtaSection.vue` — 行动号召卡片

### 修改
- `HomePage.vue` — 从内联805行精简为19行组件组合

### 技术要点
- 终端动画：16行日志逐行出现，75ms延迟，颜色编码
- 响应式：桌面4列→平板2列→移动1列
- 懒加载：首页所有组件作为独立chunk按需加载
- 构建验证：vite build 1.39s，0错误
