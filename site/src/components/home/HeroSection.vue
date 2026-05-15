<script setup lang="ts">
</script>

<template>
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
  </section>
</template>

<style scoped>
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
  .hero-actions {
    flex-direction: column;
    align-items: center;
  }
}
</style>
