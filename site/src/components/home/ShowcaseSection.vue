<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface LogLine {
  type: 'ok' | 'info' | 'warn'
  prefix: string
  text: string
}

const logLines: LogLine[] = [
  { type: 'ok', prefix: '[OK]', text: '检测到 Steam 路径：D:\\Steam' },
  { type: 'ok', prefix: '[OK]', text: '检测到 CS2 游戏目录：D:\\Steam\\steamapps\\common\\Counter-Strike Global Offensive' },
  { type: 'ok', prefix: '[OK]', text: '检测到 Steam 用户：RolinShmily (76561198xxxxxxxxx)' },
  { type: 'info', prefix: '[~]  ', text: '正在创建备份：cfg_backup.zip' },
  { type: 'ok', prefix: '[OK]', text: '备份完成：cfg_backup.zip (2.4 MB)' },
  { type: 'info', prefix: '[~]  ', text: '正在安装全局 CFG 文件 (8 个文件)...' },
  { type: 'ok', prefix: '[OK]', text: 'autoexec.cfg → csgo/cfg/autoexec.cfg' },
  { type: 'ok', prefix: '[OK]', text: 'crosshair_view.cfg → csgo/cfg/crosshair_view.cfg' },
  { type: 'ok', prefix: '[OK]', text: 'practice.cfg → csgo/cfg/practice.cfg' },
  { type: 'ok', prefix: '[OK]', text: 'custom.cfg → csgo/cfg/custom.cfg' },
  { type: 'info', prefix: '[~]  ', text: '正在安装用户视频设置...' },
  { type: 'ok', prefix: '[OK]', text: 'cs2_video.txt → userdata/.../730/local/cfg/cs2_video.txt' },
  { type: 'info', prefix: '[~]  ', text: '正在安装地图指南预设...' },
  { type: 'ok', prefix: '[OK]', text: 'annotations/dust2 → csgo/annotations/local/dust2' },
  { type: 'ok', prefix: '[OK]', text: 'annotations/mirage → csgo/annotations/local/mirage' },
  { type: 'warn', prefix: '[!]  ', text: '发现新版本：v2.6.0 → 前往下载' },
]

const termBody = ref<HTMLElement | null>(null)
const termAnimated = ref(false)
let termObserver: IntersectionObserver | null = null

onMounted(() => {
  if (termBody.value) {
    termObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        termObserver?.disconnect()
        termAnimated.value = true
      },
      { threshold: 0.15 },
    )
    termObserver.observe(termBody.value)
  }
})

onUnmounted(() => {
  termObserver?.disconnect()
})
</script>

<template>
  <section class="showcase">
    <div class="container">
      <header class="section-head">
        <span class="section-tag">In Action</span>
        <h2 class="section-title">实际使用</h2>
        <p class="section-sub">安装器的完整工作流程，从路径检测到文件部署</p>
      </header>

      <div class="terminal">
        <div class="term-bar">
          <span class="term-dot" style="background:#ff5f57" />
          <span class="term-dot" style="background:#febc2e" />
          <span class="term-dot" style="background:#28c840" />
          <span class="term-title">SrP-CFG Installer — 实时日志示例</span>
        </div>
        <div ref="termBody" class="term-body" :class="{ animated: termAnimated }">
          <div
            v-for="(line, i) in logLines"
            :key="i"
            class="log-ln"
            :style="termAnimated ? { animationDelay: `${i * 75}ms` } : undefined"
          >
            <span class="log-p" :class="line.type">{{ line.prefix }}</span>
            <span :class="{ 'log-warn': line.type === 'warn' }">{{ line.text }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.showcase {
  padding: 120px 0;
}

.terminal {
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  overflow: hidden;
  margin-top: 16px;
}

.term-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 22px;
  background: var(--c-bg-raised);
  border-bottom: 1px solid var(--c-border);
}

.term-dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
}

.term-title {
  font-family: var(--f-mono);
  font-size: 12px;
  color: var(--c-text-4);
  margin-left: 12px;
}

.term-body {
  font-family: var(--f-mono);
  font-size: 13px;
  line-height: 2;
  padding: 20px 22px 24px;
  overflow-x: auto;
}

.log-ln {
  display: flex;
  gap: 12px;
  white-space: nowrap;
}

.log-p {
  user-select: none;
  flex-shrink: 0;
}
.log-p.ok { color: var(--c-green); }
.log-p.info { color: var(--c-text-3); }
.log-p.warn { color: var(--c-accent); }
.log-warn { color: var(--c-accent); }

.term-body.animated .log-ln {
  opacity: 0;
  transform: translateX(-8px);
  animation: log-in 0.25s ease forwards;
}

@keyframes log-in {
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@media (max-width: 640px) {
  .term-body {
    font-size: 11px;
  }
}
</style>
