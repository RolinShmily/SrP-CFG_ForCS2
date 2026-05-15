<script setup lang="ts">
</script>

<template>
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
</template>

<style scoped>
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

@media (max-width: 640px) {
  .stats-grid {
    gap: 24px;
  }
  .stat-num {
    font-size: 28px;
  }
}
</style>
