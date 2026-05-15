<script setup lang="ts">
import { ref, watch, onMounted, computed, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import MarkdownIt from 'markdown-it'

interface DocMeta {
  title: string
  desc: string
  category: 'project' | 'config'
}

const props = defineProps<{
  slug: string
}>()

const route = useRoute()
const htmlContent = ref('')
const loading = ref(true)
const notFound = ref(false)
const showBackTop = ref(false)
const headings = ref<{ id: string; text: string; level: number }[]>([])
const mobileNavOpen = ref(false)

const docMetaMap: Record<string, DocMeta> = {
  'srpcfg-1': { title: '项目说明', desc: 'SrP-CFG 完整功能介绍与项目概览', category: 'project' },
  'srpcfg-2': { title: '下载地址', desc: '各版本安装包与配置文件下载', category: 'project' },
  'srpcfg-3': { title: '使用指南', desc: '安装器使用方法与配置说明', category: 'project' },
  autoexec: { title: 'autoexec.cfg', desc: '自启动基础设置', category: 'config' },
  crosshair_view: { title: 'crosshair_view.cfg', desc: '准星预设系统与持枪视角配置', category: 'config' },
  practice: { title: 'practice.cfg', desc: '个人自建房跑图', category: 'config' },
  demo_hlae: { title: 'demo_hlae.cfg', desc: '使用 HLAE 观看 demo', category: 'config' },
  knife: { title: 'knife.cfg', desc: '匕首模型切换', category: 'config' },
  zeus: { title: 'zeus.cfg', desc: '电击枪快速切换', category: 'config' },
  autoview: { title: 'autoview.cfg', desc: '武器自适应视角切换', category: 'config' },
  previewmode: { title: 'previewmode.cfg', desc: '饰品预览检视工具模式', category: 'config' },
  guidemake: { title: 'guidemake.cfg', desc: '地图指南制作模式', category: 'config' },
  cs2_video: { title: 'cs2_video.txt', desc: '视频设置配置', category: 'config' },
}

const sidebarDocs = {
  project: [
    { slug: 'srpcfg-1', title: '项目说明' },
    { slug: 'srpcfg-2', title: '下载地址' },
    { slug: 'srpcfg-3', title: '使用指南' },
  ],
  config: [
    { slug: 'autoexec', title: 'autoexec.cfg' },
    { slug: 'crosshair_view', title: 'crosshair_view.cfg' },
    { slug: 'practice', title: 'practice.cfg' },
    { slug: 'demo_hlae', title: 'demo_hlae.cfg' },
    { slug: 'knife', title: 'knife.cfg' },
    { slug: 'zeus', title: 'zeus.cfg' },
    { slug: 'autoview', title: 'autoview.cfg' },
    { slug: 'previewmode', title: 'previewmode.cfg' },
    { slug: 'guidemake', title: 'guidemake.cfg' },
    { slug: 'cs2_video', title: 'cs2_video.txt' },
  ],
}

const currentSlug = computed(() => props.slug || (route.params.slug as string))
const currentMeta = computed(() => docMetaMap[currentSlug.value])
const categoryLabel = computed(() => currentMeta.value?.category === 'project' ? '项目文档' : '配置文档')

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
})

function extractHeadings(html: string) {
  const result: { id: string; text: string; level: number }[] = []
  const regex = /<h([23])\s*(?:id="([^"]*)")?>(.*?)<\/h[23]>/gi
  let match: RegExpExecArray | null
  while ((match = regex.exec(html)) !== null) {
    const level = parseInt(match[1])
    const id = match[2] || ''
    const text = match[3].replace(/<[^>]*>/g, '').trim()
    if (text) {
      result.push({ id, text, level })
    }
  }
  return result
}

async function loadDoc(slug: string) {
  loading.value = true
  notFound.value = false
  htmlContent.value = ''
  headings.value = []

  try {
    const modules = import.meta.glob('@/content/*.md', { query: '?raw', import: 'default', eager: false })
    const modKey = Object.keys(modules).find((k) => k.endsWith(`/${slug}.md`))

    if (!modKey) {
      notFound.value = true
      loading.value = false
      return
    }

    const raw = await modules[modKey]() as string
    htmlContent.value = md.render(raw)

    await nextTick()
    headings.value = extractHeadings(htmlContent.value)

    // Assign IDs to headings that don't have them
    await nextTick()
    const article = document.querySelector('.doc-content')
    if (article) {
      const hList = article.querySelectorAll('h2, h3')
      hList.forEach((h, i) => {
        if (!h.id) {
          h.id = `heading-${i}`
          if (i < headings.value.length && !headings.value[i].id) {
            headings.value[i].id = h.id
          }
        }
      })
    }
  }
  catch {
    notFound.value = true
  }
  finally {
    loading.value = false
  }
}

function scrollToHeading(id: string) {
  if (!id) return
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function onScroll() {
  showBackTop.value = window.scrollY > 400
}

function toggleMobileNav() {
  mobileNavOpen.value = !mobileNavOpen.value
}

onMounted(() => {
  loadDoc(currentSlug.value)
  window.addEventListener('scroll', onScroll, { passive: true })
})

watch(currentSlug, (newSlug) => {
  loadDoc(newSlug)
  mobileNavOpen.value = false
})
</script>

<template>
  <div class="doc-detail">
    <div class="container doc-layout">
      <!-- Sidebar (desktop) -->
      <aside class="doc-sidebar">
        <div class="sidebar-section">
          <h4 class="sidebar-group-title">项目文档</h4>
          <router-link
            v-for="doc in sidebarDocs.project"
            :key="doc.slug"
            :to="`/docs/${doc.slug}`"
            class="sidebar-link"
            :class="{ active: currentSlug === doc.slug }"
          >
            {{ doc.title }}
          </router-link>
        </div>
        <div class="sidebar-section">
          <h4 class="sidebar-group-title">配置文档</h4>
          <router-link
            v-for="doc in sidebarDocs.config"
            :key="doc.slug"
            :to="`/docs/${doc.slug}`"
            class="sidebar-link"
            :class="{ active: currentSlug === doc.slug }"
          >
            {{ doc.title }}
          </router-link>
        </div>
      </aside>

      <!-- Main content -->
      <div class="doc-main">
        <!-- Mobile doc selector -->
        <div class="mobile-doc-nav">
          <button class="mobile-nav-toggle" @click="toggleMobileNav">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
            {{ currentMeta?.title || '选择文档' }}
            <svg class="chevron" :class="{ open: mobileNavOpen }" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          <div v-if="mobileNavOpen" class="mobile-nav-dropdown">
            <div class="dropdown-group">
              <span class="dropdown-group-label">项目文档</span>
              <router-link
                v-for="doc in sidebarDocs.project"
                :key="doc.slug"
                :to="`/docs/${doc.slug}`"
                class="dropdown-link"
                :class="{ active: currentSlug === doc.slug }"
              >
                {{ doc.title }}
              </router-link>
            </div>
            <div class="dropdown-group">
              <span class="dropdown-group-label">配置文档</span>
              <router-link
                v-for="doc in sidebarDocs.config"
                :key="doc.slug"
                :to="`/docs/${doc.slug}`"
                class="dropdown-link"
                :class="{ active: currentSlug === doc.slug }"
              >
                {{ doc.title }}
              </router-link>
            </div>
          </div>
        </div>

        <!-- Breadcrumb -->
        <nav v-if="currentMeta" class="doc-breadcrumb">
          <router-link to="/docs">文档</router-link>
          <span class="breadcrumb-sep">/</span>
          <span class="breadcrumb-cat">{{ categoryLabel }}</span>
          <span class="breadcrumb-sep">/</span>
          <span class="breadcrumb-current">{{ currentMeta.title }}</span>
        </nav>

        <div v-if="loading" class="doc-loading">
          <span class="loading-spinner" />
          加载中...
        </div>

        <div v-else-if="notFound" class="doc-not-found">
          <h2>文档未找到</h2>
          <p>请求的文档 "{{ currentSlug }}" 不存在。</p>
          <router-link to="/docs" class="btn btn-ghost">返回文档列表</router-link>
        </div>

        <template v-else>
          <!-- Content + TOC -->
          <div class="doc-content-wrapper">
            <article class="doc-content markdown-body" v-html="htmlContent" />

            <!-- TOC (desktop) -->
            <aside v-if="headings.length > 0" class="doc-toc">
              <h4 class="toc-title">目录</h4>
              <ul class="toc-list">
                <li
                  v-for="(h, i) in headings"
                  :key="i"
                  class="toc-item"
                  :class="{ 'toc-h3': h.level === 3 }"
                >
                  <a class="toc-link" @click.prevent="scrollToHeading(h.id)">{{ h.text }}</a>
                </li>
              </ul>
            </aside>
          </div>
        </template>
      </div>
    </div>

    <!-- Back to top -->
    <transition name="fade">
      <button v-if="showBackTop" class="back-top" @click="scrollToTop" aria-label="回到顶部">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>
    </transition>
  </div>
</template>

<style scoped>
.doc-detail {
  padding: 48px 0 120px;
}

.doc-layout {
  display: flex;
  gap: 0;
  align-items: flex-start;
}

/* ─── Sidebar ─── */
.doc-sidebar {
  flex-shrink: 0;
  width: 240px;
  position: sticky;
  top: calc(var(--nav-height) + 24px);
  max-height: calc(100vh - var(--nav-height) - 48px);
  overflow-y: auto;
  padding-right: 24px;
  border-right: 1px solid var(--c-border);
}

.sidebar-section {
  margin-bottom: 24px;
}
.sidebar-section:last-child {
  margin-bottom: 0;
}

.sidebar-group-title {
  font-family: var(--f-display);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--c-text-3);
  margin-bottom: 8px;
  padding-left: 12px;
}

.sidebar-link {
  display: block;
  font-family: var(--f-body);
  font-size: 14px;
  color: var(--c-text-2);
  text-decoration: none;
  padding: 7px 12px;
  border-radius: var(--radius-sm);
  transition: all 0.2s;
  line-height: 1.4;
}
.sidebar-link:hover {
  color: var(--c-text);
  background: var(--c-bg-hover);
}
.sidebar-link.active {
  color: var(--c-accent);
  background: var(--c-accent-bg);
  font-weight: 500;
}

/* ─── Main content area ─── */
.doc-main {
  flex: 1;
  min-width: 0;
  padding-left: 32px;
}

/* ─── Mobile doc nav ─── */
.mobile-doc-nav {
  display: none;
  position: relative;
  margin-bottom: 16px;
}

.mobile-nav-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-sm);
  padding: 10px 16px;
  font-family: var(--f-display);
  font-size: 14px;
  font-weight: 500;
  color: var(--c-text);
  cursor: pointer;
  transition: border-color 0.2s;
}
.mobile-nav-toggle:hover {
  border-color: var(--c-border-hi);
}
.mobile-nav-toggle .chevron {
  margin-left: auto;
  transition: transform 0.2s;
}
.mobile-nav-toggle .chevron.open {
  transform: rotate(180deg);
}

.mobile-nav-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 50;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-sm);
  margin-top: 4px;
  padding: 8px 0;
  box-shadow: var(--shadow);
  max-height: 320px;
  overflow-y: auto;
}

.dropdown-group {
  padding: 4px 0;
}
.dropdown-group + .dropdown-group {
  border-top: 1px solid var(--c-border);
}

.dropdown-group-label {
  display: block;
  font-family: var(--f-display);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--c-text-3);
  padding: 8px 16px 4px;
}

.dropdown-link {
  display: block;
  font-size: 14px;
  color: var(--c-text-2);
  text-decoration: none;
  padding: 8px 16px;
  transition: all 0.15s;
}
.dropdown-link:hover {
  color: var(--c-text);
  background: var(--c-bg-hover);
}
.dropdown-link.active {
  color: var(--c-accent);
  background: var(--c-accent-bg);
  font-weight: 500;
}

/* ─── Breadcrumb ─── */
.doc-breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--f-display);
  font-size: 13px;
  margin-bottom: 24px;
  color: var(--c-text-3);
}
.doc-breadcrumb a {
  color: var(--c-text-3);
  text-decoration: none;
  transition: color 0.2s;
}
.doc-breadcrumb a:hover {
  color: var(--c-accent);
}
.breadcrumb-sep {
  color: var(--c-text-4);
}
.breadcrumb-cat {
  color: var(--c-text-3);
}
.breadcrumb-current {
  color: var(--c-text-2);
}

/* ─── Content wrapper ─── */
.doc-content-wrapper {
  display: flex;
  gap: 32px;
  align-items: flex-start;
}

.doc-content {
  flex: 1;
  min-width: 0;
  max-width: 840px;
}

/* ─── TOC ─── */
.doc-toc {
  flex-shrink: 0;
  width: 200px;
  position: sticky;
  top: calc(var(--nav-height) + 24px);
  max-height: calc(100vh - var(--nav-height) - 48px);
  overflow-y: auto;
  padding: 16px;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-sm);
}

.toc-title {
  font-family: var(--f-display);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--c-text-3);
  margin-bottom: 12px;
}

.toc-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.toc-item {
  margin-bottom: 4px;
}
.toc-item.toc-h3 {
  padding-left: 12px;
}

.toc-link {
  display: block;
  font-size: 13px;
  color: var(--c-text-3);
  cursor: pointer;
  padding: 3px 0;
  line-height: 1.4;
  transition: color 0.2s;
  text-decoration: none;
}
.toc-link:hover {
  color: var(--c-accent);
}

/* ─── Loading / Not found ─── */
.doc-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 120px 0;
  font-family: var(--f-display);
  font-size: 16px;
  color: var(--c-text-3);
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--c-border);
  border-top-color: var(--c-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.doc-not-found {
  text-align: center;
  padding: 120px 0;
}
.doc-not-found h2 {
  font-family: var(--f-display);
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 12px;
}
.doc-not-found p {
  font-size: 16px;
  color: var(--c-text-2);
  margin-bottom: 32px;
}

/* ─── Back to top ─── */
.back-top {
  position: fixed;
  bottom: 32px;
  right: 32px;
  z-index: 100;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  color: var(--c-text-2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  box-shadow: var(--shadow);
}
.back-top:hover {
  color: var(--c-accent);
  border-color: var(--c-border-hi);
  transform: translateY(-2px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ─── Responsive ─── */
@media (max-width: 1100px) {
  .doc-toc {
    display: none;
  }
}

@media (max-width: 768px) {
  .doc-sidebar {
    display: none;
  }
  .mobile-doc-nav {
    display: block;
  }
  .doc-main {
    padding-left: 0;
  }
  .doc-layout {
    display: block;
  }
}

/* ─── Markdown Body Styles ─── */
.markdown-body {
  color: var(--c-text);
  font-size: 16px;
  line-height: 1.8;
}

.markdown-body :deep(h1) {
  font-family: var(--f-display);
  font-size: 36px;
  font-weight: 700;
  margin: 48px 0 20px;
  letter-spacing: 0.02em;
  color: var(--c-text);
}

.markdown-body :deep(h2) {
  font-family: var(--f-display);
  font-size: 28px;
  font-weight: 700;
  margin: 40px 0 16px;
  letter-spacing: 0.02em;
  color: var(--c-text);
  padding-bottom: 8px;
  border-bottom: 1px solid var(--c-border);
}

.markdown-body :deep(h3) {
  font-family: var(--f-display);
  font-size: 22px;
  font-weight: 600;
  margin: 32px 0 12px;
  letter-spacing: 0.02em;
}

.markdown-body :deep(h4) {
  font-family: var(--f-display);
  font-size: 18px;
  font-weight: 600;
  margin: 24px 0 10px;
}

.markdown-body :deep(p) {
  margin-bottom: 16px;
  color: var(--c-text-2);
}

.markdown-body :deep(a) {
  color: var(--c-accent);
  text-decoration: none;
  transition: color 0.2s;
}
.markdown-body :deep(a:hover) {
  color: var(--c-accent-l);
}

.markdown-body :deep(code) {
  font-family: var(--f-mono);
  font-size: 14px;
  background: var(--c-bg-raised);
  color: var(--c-accent-l);
  padding: 2px 8px;
  border-radius: 4px;
}

.markdown-body :deep(pre) {
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  padding: 20px 24px;
  overflow-x: auto;
  margin: 20px 0;
}

.markdown-body :deep(pre code) {
  background: none;
  padding: 0;
  font-size: 13px;
  color: var(--c-text);
  line-height: 1.8;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin-bottom: 16px;
  padding-left: 24px;
}

.markdown-body :deep(li) {
  margin-bottom: 6px;
  color: var(--c-text-2);
}

.markdown-body :deep(blockquote) {
  border-left: 3px solid var(--c-accent);
  padding: 12px 20px;
  margin: 20px 0;
  background: var(--c-accent-bg);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

.markdown-body :deep(blockquote p) {
  margin-bottom: 0;
  color: var(--c-text-2);
}

.markdown-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  border: 1px solid var(--c-border);
  padding: 10px 16px;
  text-align: left;
}

.markdown-body :deep(th) {
  background: var(--c-bg-card);
  font-family: var(--f-display);
  font-weight: 600;
  font-size: 14px;
  color: var(--c-text);
}

.markdown-body :deep(td) {
  font-size: 14px;
  color: var(--c-text-2);
}

.markdown-body :deep(hr) {
  border: none;
  border-top: 1px solid var(--c-border);
  margin: 40px 0;
}

.markdown-body :deep(img) {
  max-width: 100%;
  border-radius: var(--radius);
  margin: 20px 0;
}

.markdown-body :deep(strong) {
  color: var(--c-text);
  font-weight: 600;
}
</style>
