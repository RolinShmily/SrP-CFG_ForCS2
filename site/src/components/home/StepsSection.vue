<script setup lang="ts">
</script>

<template>
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
</template>

<style scoped>
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

@media (max-width: 1024px) {
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
  .steps-row {
    flex-direction: column;
    align-items: center;
  }
  .step-item {
    max-width: 100%;
  }
}
</style>
