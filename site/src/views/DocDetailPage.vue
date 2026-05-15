<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import MarkdownIt from 'markdown-it'

const props = defineProps<{
  slug: string
}>()

const route = useRoute()
const htmlContent = ref('')
const loading = ref(true)
const notFound = ref(false)

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
})

const currentSlug = computed(() => props.slug || (route.params.slug as string))

async function loadDoc(slug: string) {
  loading.value = true
  notFound.value = false
  htmlContent.value = ''

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
  }
  catch {
    notFound.value = true
  }
  finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDoc(currentSlug.value)
})

watch(currentSlug, (newSlug) => {
  loadDoc(newSlug)
})
</script>

<template>
  <div class="doc-detail">
    <div class="container">
      <div class="doc-nav">
        <router-link to="/docs" class="doc-back">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          返回文档列表
        </router-link>
      </div>

      <div v-if="loading" class="doc-loading">
        <span class="loading-spinner" />
        加载中...
      </div>

      <div v-else-if="notFound" class="doc-not-found">
        <h2>文档未找到</h2>
        <p>请求的文档 "{{ currentSlug }}" 不存在。</p>
        <router-link to="/docs" class="btn btn-ghost">返回文档列表</router-link>
      </div>

      <article v-else class="doc-content markdown-body" v-html="htmlContent" />
    </div>
  </div>
</template>

<style scoped>
.doc-detail {
  padding: 48px 0 120px;
}

.doc-nav {
  margin-bottom: 32px;
}

.doc-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--f-display);
  font-size: 14px;
  font-weight: 500;
  color: var(--c-text-3);
  text-decoration: none;
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--c-border);
  transition: all 0.2s;
}
.doc-back:hover {
  color: var(--c-accent);
  border-color: var(--c-border-hi);
}

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

/* ─── Markdown Body Styles ─── */
.markdown-body {
  max-width: 840px;
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
