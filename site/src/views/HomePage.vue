<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Feature {
  icon: string
  title: string
  desc: string
}

const features: Feature[] = [
  {
    icon: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    title: '路径自动检测',
    desc: '自动扫描注册表与 Steam 库文件，精准定位游戏全局 CFG 路径和地图指南路径，无需手动翻找',
  },
  {
    icon: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    title: '用户自动识别',
    desc: '自动枚举 Steam 用户列表并识别当前登录用户，多账号环境支持手动切换选择',
  },
  {
    icon: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>',
    title: '智能备份',
    desc: '安装前自动将全局 CFG、用户视频预设、地图指南分别打包为独立 ZIP 备份，随时可回滚',
  },
  {
    icon: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
    title: '拖拽安装',
    desc: '将 ZIP 配置包、CFG 单文件或整个文件夹直接拖入窗口，自动识别类型并完成安装',
  },
  {
    icon: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
    title: '多安装目标',
    desc: '全局 CFG、用户视频设置、地图指南三个独立目标，通过复选框自由组合安装范围',
  },
  {
    icon: '<polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>',
    title: '实时日志',
    desc: '颜色编码的实时日志输出，安装进度清晰可辨：绿色成功、橙色警告、默认信息',
  },
  {
    icon: '<polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>',
    title: '自动更新',
    desc: '启动时后台检查 GitHub Releases 新版本，有更新自动提醒，支持忽略当前版本',
  },
  {
    icon: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    title: '零依赖运行',
    desc: '自包含单文件发布，无需安装 .NET 运行时或任何其他依赖，下载即可直接运行',
  },
]

interface LogLine {
  type: 'ok' | 'info' | 'warn'
  prefix: string
  text: string
  warn?: boolean
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
  { type: 'warn', prefix: '[!]  ', text: '发现新版本：v2.6.0 → 前往下载', warn: true },
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
  <div class="home">
    <!-- Hero -->
    <section class="hero">
      <div class="container hero-grid">
        <div class="hero-content">
          <div class="hero-badge">
            <span class="badge-dot" />
            COUNTER-STRIKE 2 TOOL
          </div>
          <h1 class="hero-title">
            SrP-CFG
            <span class="title-accent">Installer</span>
          </h1>
          <p class="hero-desc">
            一键部署 CS2 配置预设。自动检测路径、智能备份、拖拽安装——<br>
            将繁琐的手动配置流程简化为一次拖放操作。
          </p>
          <div class="hero-actions">
            <a href="https://drive.srprolin.top/SrP-CFG/SrP-CFG_Installer.msi" target="_blank" rel="noopener" class="btn btn-accent">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              下载安装器
            </a>
            <router-link to="/docs" class="btn btn-ghost">
              查看文档
            </router-link>
          </div>
        </div>
        <div class="hero-visual">
          <div class="screenshot-placeholder hero-shot">
            <img src="/img.webp" alt="SrP-CFG 安装器主界面">
          </div>
        </div>
      </div>

      <!-- Stats Strip -->
      <div class="stats-strip">
        <div class="container stats-grid">
          <div class="stat-item">
            <span class="stat-num">3</span>
            <span class="stat-label">独立安装目标</span>
          </div>
          <div class="stat-divider" />
          <div class="stat-item">
            <span class="stat-num">10+</span>
            <span class="stat-label">预设配置文件</span>
          </div>
          <div class="stat-divider" />
          <div class="stat-item">
            <span class="stat-num">0</span>
            <span class="stat-label">运行库依赖</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="features">
      <div class="container">
        <header class="section-head">
          <span class="section-tag">Core Features</span>
          <h2 class="section-title">核心功能</h2>
          <p class="section-sub">覆盖从路径检测到备份恢复的完整安装链路，每一步都自动化处理</p>
        </header>
        <div class="features-grid">
          <article v-for="(feat, i) in features" :key="i" class="feat-card">
            <div class="feat-icon">
              <svg viewBox="0 0 24 24" v-html="feat.icon" />
            </div>
            <h3>{{ feat.title }}</h3>
            <p>{{ feat.desc }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- Steps -->
    <section class="steps">
      <div class="container">
        <header class="section-head">
          <span class="section-tag">Quick Start</span>
          <h2 class="section-title">四步上手</h2>
          <p class="section-sub">从下载到安装完成，全程不超过一分钟</p>
        </header>
        <div class="steps-row">
          <div class="step-item">
            <div class="step-num">01</div>
            <h3>下载</h3>
            <p>从 GitHub Releases<br>获取便携版安装器</p>
          </div>
          <div class="step-arrow">
            <svg width="40" height="16" viewBox="0 0 40 16">
              <path d="M0 8h36M30 2l6 6-6 6" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
          <div class="step-item">
            <div class="step-num">02</div>
            <h3>启动</h3>
            <p>双击运行，自动检测<br>Steam 和 CS2 路径</p>
          </div>
          <div class="step-arrow">
            <svg width="40" height="16" viewBox="0 0 40 16">
              <path d="M0 8h36M30 2l6 6-6 6" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
          <div class="step-item">
            <div class="step-num">03</div>
            <h3>拖入</h3>
            <p>拖入 ZIP 配置包<br>自动备份并安装</p>
          </div>
          <div class="step-arrow">
            <svg width="40" height="16" viewBox="0 0 40 16">
              <path d="M0 8h36M30 2l6 6-6 6" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
          <div class="step-item">
            <div class="step-num">04</div>
            <h3>完成</h3>
            <p>启动游戏即刻生效<br>所有配置已就位</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Showcase -->
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
              <span :class="{ 'log-warn': line.warn }">{{ line.text }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="cta">
      <div class="container">
        <div class="cta-card">
          <span class="section-tag">Get Started</span>
          <h2 class="cta-title">立即开始使用</h2>
          <p class="cta-desc">下载便携版安装器，拖入配置包，即刻体验预设配置带来的竞技优势</p>
          <a href="https://github.com/RolinShmily/SrP-CFG_ForCS2/releases" target="_blank" rel="noopener" class="btn btn-accent btn-lg">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            前往下载
          </a>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* ─── Hero ─── */
.hero {
  padding: 140px 0 0;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

.hero-grid {
  display: grid;
  grid-template-columns: 1fr 1.15fr;
  gap: 64px;
  align-items: center;
  flex: 1;
}

.hero-content {
  padding-bottom: 48px;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-family: var(--f-mono);
  font-size: 13px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--c-teal);
  margin-bottom: 24px;
}

.badge-dot {
  width: 7px;
  height: 7px;
  background: var(--c-teal);
  border-radius: 50%;
  animation: pulse-mark 2.5s ease-in-out infinite;
  box-shadow: 0 0 8px rgba(45, 212, 191, 0.3);
}

@keyframes pulse-mark {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.hero-title {
  font-family: var(--f-display);
  font-size: 64px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.02em;
  margin-bottom: 24px;
}

.title-accent {
  display: block;
  color: var(--c-accent);
  font-size: 72px;
}

.hero-desc {
  font-size: 17px;
  color: var(--c-text-2);
  font-weight: 300;
  line-height: 1.9;
  margin-bottom: 40px;
  max-width: 500px;
}

.hero-actions {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.screenshot-placeholder {
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  position: relative;
  overflow: hidden;
  color: var(--c-text-4);
}

.screenshot-placeholder img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.screenshot-placeholder::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(160deg, rgba(232, 121, 12, 0.04) 0%, transparent 40%);
}

.hero-shot {
  aspect-ratio: 16 / 10;
}

/* ─── Stats ─── */
.stats-strip {
  margin-top: 64px;
  padding: 40px 0;
  border-top: 1px solid var(--c-border);
  border-bottom: 1px solid var(--c-border);
  background: linear-gradient(180deg, rgba(16, 19, 28, 0.6) 0%, transparent 100%);
}

.stats-grid {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 48px;
}

.stat-item {
  text-align: center;
}

.stat-num {
  display: block;
  font-family: var(--f-display);
  font-size: 36px;
  font-weight: 700;
  color: var(--c-accent);
  line-height: 1;
  margin-bottom: 6px;
}

.stat-label {
  font-size: 14px;
  color: var(--c-text-3);
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: var(--c-border);
}

/* ─── Features ─── */
.features {
  padding: 140px 0 120px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.feat-card {
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  padding: 32px 26px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}
.feat-card::before {
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
.feat-card:hover {
  border-color: var(--c-border-hi);
  background: var(--c-bg-hover);
  transform: translateY(-3px);
  box-shadow: var(--shadow);
}
.feat-card:hover::before {
  transform: scaleX(1);
}

.feat-icon {
  width: 46px;
  height: 46px;
  border-radius: var(--radius-sm);
  background: var(--c-accent-bg);
  border: 1px solid rgba(232, 121, 12, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  transition: all 0.3s;
}
.feat-card:hover .feat-icon {
  background: rgba(232, 121, 12, 0.14);
  border-color: rgba(232, 121, 12, 0.25);
}
.feat-icon svg {
  width: 20px;
  height: 20px;
  stroke: var(--c-accent);
  fill: none;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.feat-card h3 {
  font-family: var(--f-display);
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 10px;
  letter-spacing: 0.02em;
}
.feat-card p {
  font-size: 14px;
  color: var(--c-text-2);
  line-height: 1.75;
  font-weight: 300;
}

/* ─── Steps ─── */
.steps {
  padding: 120px 0;
  position: relative;
}
.steps::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  height: 400px;
  background: radial-gradient(ellipse, rgba(45, 212, 191, 0.05) 0%, transparent 70%);
  pointer-events: none;
}

.steps-row {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 0;
}

.step-item {
  text-align: center;
  flex: 1;
  max-width: 220px;
  padding: 0 16px;
}

.step-num {
  width: 72px;
  height: 72px;
  margin: 0 auto 24px;
  border: 2px solid var(--c-border);
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--f-display);
  font-size: 22px;
  font-weight: 700;
  color: var(--c-text-4);
  background: var(--c-bg-card);
  transition: all 0.3s;
}
.step-item:hover .step-num {
  border-color: var(--c-accent);
  color: var(--c-accent);
  box-shadow: 0 0 24px var(--c-accent-gl);
}

.step-item h3 {
  font-family: var(--f-display);
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 10px;
  letter-spacing: 0.02em;
}
.step-item p {
  font-size: 15px;
  color: var(--c-text-2);
  font-weight: 300;
  line-height: 1.7;
}

.step-arrow {
  color: var(--c-text-4);
  padding-top: 26px;
  flex-shrink: 0;
  width: 48px;
  text-align: center;
}

/* ─── Showcase / Terminal ─── */
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

/* ─── CTA ─── */
.cta {
  padding: 120px 0;
  text-align: center;
}

.cta-card {
  padding: 80px 48px;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 16px;
  position: relative;
  overflow: hidden;
}
.cta-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 360px;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--c-accent), transparent);
}
.cta-card::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 360px;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(45, 212, 191, 0.3), transparent);
}

.cta-title {
  font-family: var(--f-display);
  font-size: 40px;
  font-weight: 700;
  letter-spacing: 0.03em;
  margin: 16px 0;
}

.cta-desc {
  font-size: 17px;
  color: var(--c-text-2);
  font-weight: 300;
  max-width: 500px;
  margin: 0 auto 44px;
  line-height: 1.8;
}

/* ─── Responsive ─── */
@media (max-width: 1024px) {
  .hero-grid {
    grid-template-columns: 1fr;
    gap: 40px;
  }
  .hero-visual {
    order: -1;
    max-width: 580px;
    margin: 0 auto;
  }
  .hero-content {
    text-align: center;
  }
  .hero-desc {
    margin-left: auto;
    margin-right: auto;
  }
  .hero-actions {
    justify-content: center;
  }
  .hero-title {
    font-size: 52px;
  }
  .title-accent {
    font-size: 58px;
  }
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .steps-row {
    flex-wrap: wrap;
    gap: 24px;
    justify-content: center;
  }
  .step-arrow {
    display: none;
  }
  .step-item {
    max-width: 200px;
  }
}

@media (max-width: 640px) {
  .hero {
    padding-top: 100px;
  }
  .hero-title {
    font-size: 40px;
  }
  .title-accent {
    font-size: 46px;
  }
  .features-grid {
    grid-template-columns: 1fr;
  }
  .steps-row {
    flex-direction: column;
    align-items: center;
  }
  .step-item {
    max-width: 100%;
  }
  .stats-grid {
    gap: 24px;
  }
  .stat-num {
    font-size: 28px;
  }
  .section-title {
    font-size: 32px;
  }
  .cta-title {
    font-size: 32px;
  }
  .hero-actions {
    flex-direction: column;
    align-items: center;
  }
  .btn {
    width: 100%;
    justify-content: center;
    text-align: center;
  }
  .term-body {
    font-size: 11px;
  }
  .cta-card {
    padding: 56px 24px;
  }
}
</style>
