<script setup lang="ts">
export interface DocItem {
  slug: string
  title: string
  description: string
}

const docs: DocItem[] = [
  { slug: 'autoexec', title: 'autoexec.cfg', description: '自动执行配置，游戏启动时自动加载的基础配置文件' },
  { slug: 'crosshair_view', title: 'crosshair_view.cfg', description: '准星与视角设置，自定义准星样式和观战视角' },
  { slug: 'practice', title: 'practice.cfg', description: '练习模式配置，提供跑图和战术练习的便捷指令' },
  { slug: 'demo_hlae', title: 'demo_hlae.cfg', description: 'Demo 观看与 HLAE 配置，用于制作精彩集锦' },
  { slug: 'knife', title: 'knife.cfg', description: '刀战模式配置，快速切换至刀战专属设置' },
  { slug: 'zeus', title: 'zeus.cfg', description: '电击枪模式配置，电击枪专属玩法设置' },
  { slug: 'autoview', title: 'autoview.cfg', description: '自动观战配置，自定义自动观战行为' },
  { slug: 'previewmode', title: 'previewmode.cfg', description: '预览模式配置，用于展示和截图的专用模式' },
  { slug: 'guidemake', title: 'guidemake.cfg', description: '地图指南制作配置，辅助创建地图标注和指南' },
  { slug: 'cs2_video', title: 'cs2_video.txt', description: '视频设置文件，控制游戏的画面和显示选项' },
  { slug: 'srpcfg-1', title: 'SrP-CFG 使用指南 (一)', description: '安装器基本介绍与快速上手教程' },
  { slug: 'srpcfg-2', title: 'SrP-CFG 使用指南 (二)', description: '安装器功能详解与配置说明' },
  { slug: 'srpcfg-3', title: 'SrP-CFG 使用指南 (三)', description: '进阶用法与常见问题解答' },
]
</script>

<template>
  <div class="doc-index">
    <div class="container">
      <header class="section-head">
        <span class="section-tag">Documentation</span>
        <h1 class="section-title">项目文档</h1>
        <p class="section-sub">SrP-CFG 所有配置文件的详细说明与使用指南</p>
      </header>

      <div class="doc-grid">
        <router-link
          v-for="doc in docs"
          :key="doc.slug"
          :to="`/docs/${doc.slug}`"
          class="doc-card"
        >
          <div class="doc-card-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <div class="doc-card-body">
            <h3 class="doc-card-title">{{ doc.title }}</h3>
            <p class="doc-card-desc">{{ doc.description }}</p>
          </div>
          <svg class="doc-card-arrow" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.doc-index {
  padding: 80px 0 120px;
}

.doc-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.doc-card {
  display: flex;
  align-items: center;
  gap: 20px;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  padding: 24px 28px;
  transition: all 0.3s ease;
  text-decoration: none;
  position: relative;
  overflow: hidden;
}
.doc-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--c-accent), var(--c-accent-l));
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.35s ease;
}
.doc-card:hover {
  border-color: var(--c-border-hi);
  background: var(--c-bg-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow);
}
.doc-card:hover::before {
  transform: scaleX(1);
}

.doc-card-icon {
  flex-shrink: 0;
  width: 46px;
  height: 46px;
  border-radius: var(--radius-sm);
  background: var(--c-accent-bg);
  border: 1px solid rgba(232, 121, 12, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--c-accent);
  transition: all 0.3s;
}
.doc-card:hover .doc-card-icon {
  background: rgba(232, 121, 12, 0.14);
  border-color: rgba(232, 121, 12, 0.25);
}

.doc-card-body {
  flex: 1;
  min-width: 0;
}

.doc-card-title {
  font-family: var(--f-display);
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.02em;
  margin-bottom: 4px;
  color: var(--c-text);
}

.doc-card-desc {
  font-size: 14px;
  color: var(--c-text-2);
  font-weight: 300;
  line-height: 1.6;
}

.doc-card-arrow {
  flex-shrink: 0;
  color: var(--c-text-4);
  transition: all 0.3s;
}
.doc-card:hover .doc-card-arrow {
  color: var(--c-accent);
  transform: translateX(4px);
}

@media (max-width: 768px) {
  .doc-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .doc-card {
    padding: 20px;
    gap: 14px;
  }
  .doc-card-icon {
    width: 40px;
    height: 40px;
  }
}
</style>
