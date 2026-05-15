<script setup lang="ts">
export interface DocMeta {
  slug: string
  title: string
  desc: string
  category: 'project' | 'config'
}

const projectDocs: DocMeta[] = [
  { slug: 'srpcfg-1', title: '项目说明', desc: 'SrP-CFG 完整功能介绍与项目概览', category: 'project' },
  { slug: 'srpcfg-2', title: '下载地址', desc: '各版本安装包与配置文件下载', category: 'project' },
  { slug: 'srpcfg-3', title: '使用指南', desc: '安装器使用方法与配置说明', category: 'project' },
]

const configDocs: DocMeta[] = [
  { slug: 'autoexec', title: 'autoexec.cfg', desc: '自启动基础设置，包含完整的按键绑定和导航系统', category: 'config' },
  { slug: 'crosshair_view', title: 'crosshair_view.cfg', desc: '准星预设系统与持枪视角配置', category: 'config' },
  { slug: 'practice', title: 'practice.cfg', desc: '个人自建房跑图，包含各地图出生点预设', category: 'config' },
  { slug: 'demo_hlae', title: 'demo_hlae.cfg', desc: '使用 HLAE 观看 demo 的完整控制', category: 'config' },
  { slug: 'knife', title: 'knife.cfg', desc: '匕首模型切换，20+ 种刀具选择', category: 'config' },
  { slug: 'zeus', title: 'zeus.cfg', desc: '电击枪快速切换战术配置', category: 'config' },
  { slug: 'autoview', title: 'autoview.cfg', desc: '武器自适应视角切换', category: 'config' },
  { slug: 'previewmode', title: 'previewmode.cfg', desc: '饰品预览检视工具模式', category: 'config' },
  { slug: 'guidemake', title: 'guidemake.cfg', desc: '地图指南制作模式，支持手雷标记和工坊提交', category: 'config' },
  { slug: 'cs2_video', title: 'cs2_video.txt', desc: '视频设置配置（NVIDIA RTX 4060 优化）', category: 'config' },
]

const sections = [
  { key: 'project', label: '项目文档', docs: projectDocs },
  { key: 'config', label: '配置文档', docs: configDocs },
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

      <section v-for="sec in sections" :key="sec.key" class="doc-section">
        <h2 class="section-group-title">
          <span class="group-accent" :class="sec.key" />
          {{ sec.label }}
        </h2>
        <div class="doc-grid">
          <router-link
            v-for="doc in sec.docs"
            :key="doc.slug"
            :to="`/docs/${doc.slug}`"
            class="doc-card"
          >
            <span class="card-accent" :class="doc.category" />
            <div class="doc-card-body">
              <span class="doc-card-badge" :class="doc.category">
                {{ doc.category === 'project' ? '项目' : '配置' }}
              </span>
              <h3 class="doc-card-title">{{ doc.title }}</h3>
              <p class="doc-card-desc">{{ doc.desc }}</p>
            </div>
            <svg class="doc-card-arrow" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </router-link>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.doc-index {
  padding: 80px 0 120px;
}

.doc-section {
  margin-bottom: 48px;
}
.doc-section:last-child {
  margin-bottom: 0;
}

.section-group-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--f-display);
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 0.02em;
  margin-bottom: 20px;
  color: var(--c-text);
}

.group-accent {
  display: inline-block;
  width: 4px;
  height: 22px;
  border-radius: 2px;
}
.group-accent.project {
  background: var(--c-accent);
}
.group-accent.config {
  background: #3b82f6;
}

.doc-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.doc-card {
  display: flex;
  align-items: stretch;
  gap: 0;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 8px;
  padding: 0;
  transition: all 0.3s ease;
  text-decoration: none;
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.card-accent {
  flex-shrink: 0;
  width: 4px;
  border-radius: 8px 0 0 8px;
  transition: width 0.3s;
}
.card-accent.project {
  background: var(--c-accent);
}
.card-accent.config {
  background: #3b82f6;
}

.doc-card:hover {
  border-color: var(--c-border-hi);
  transform: translateY(-2px);
  box-shadow: var(--shadow);
}
.doc-card:hover .card-accent {
  width: 6px;
}

.doc-card-body {
  flex: 1;
  min-width: 0;
  padding: 24px 20px 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.doc-card-badge {
  display: inline-flex;
  align-self: flex-start;
  font-family: var(--f-mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 4px;
}
.doc-card-badge.project {
  background: var(--c-accent-bg);
  color: var(--c-accent);
}
.doc-card-badge.config {
  background: rgba(59, 130, 246, 0.1);
  color: #60a5fa;
}

.doc-card-title {
  font-family: var(--f-display);
  font-size: 17px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--c-text);
  margin-bottom: 2px;
}

.doc-card-desc {
  font-size: 14px;
  color: var(--c-text-2);
  font-weight: 300;
  line-height: 1.6;
}

.doc-card-arrow {
  flex-shrink: 0;
  align-self: center;
  margin-right: 16px;
  color: var(--c-text-4);
  transition: all 0.3s;
}
.doc-card:hover .doc-card-arrow {
  color: var(--c-accent);
  transform: translateX(4px);
}

@media (max-width: 1024px) {
  .doc-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .doc-grid {
    grid-template-columns: 1fr;
  }
  .doc-card-body {
    padding: 20px 16px 20px 16px;
  }
  .section-group-title {
    font-size: 20px;
  }
}
</style>
