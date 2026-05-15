<script setup lang="ts">
</script>

<template>
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
</template>

<style scoped>
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

@media (max-width: 640px) {
  .cta-title {
    font-size: 32px;
  }
  .cta-card {
    padding: 56px 24px;
  }
}
</style>
