<script setup lang="ts">
interface DownloadItem {
  name: string
  desc: string
  url: string
  icon: string
}

const downloads: DownloadItem[] = [
  {
    name: 'MSI 安装器',
    desc: '推荐方式 — Windows 标准安装包，自动创建快捷方式，支持系统级卸载',
    url: 'https://drive.srprolin.top/SrP-CFG/SrP-CFG_Installer.msi',
    icon: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  },
  {
    name: '便携版 EXE',
    desc: '单文件自包含发布，无需安装，下载即可直接运行',
    url: 'https://github.com/RolinShmily/SrP-CFG_ForCS2/releases',
    icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
  },
]
</script>

<template>
  <div class="download-page">
    <div class="container">
      <header class="section-head">
        <span class="section-tag">Download</span>
        <h1 class="section-title">下载 SrP-CFG</h1>
        <p class="section-sub">选择适合你的下载方式，快速获取最新版本的 SrP-CFG 安装器</p>
      </header>

      <div class="download-grid">
        <a
          v-for="(item, i) in downloads"
          :key="i"
          :href="item.url"
          target="_blank"
          rel="noopener"
          class="download-card"
        >
          <div class="download-icon">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="item.icon" />
          </div>
          <h3 class="download-name">{{ item.name }}</h3>
          <p class="download-desc">{{ item.desc }}</p>
          <span class="download-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            立即下载
          </span>
        </a>
      </div>

      <div class="download-info">
        <div class="info-card">
          <div class="info-icon">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <h4>安全无忧</h4>
            <p>所有发布包均通过 GitHub Actions 自动构建，源代码完全公开透明</p>
          </div>
        </div>
        <div class="info-card">
          <div class="info-icon">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          </div>
          <div>
            <h4>保持更新</h4>
            <p>安装器内置自动更新检查，启动时即可获知最新版本发布</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.download-page {
  padding: 80px 0 120px;
}

.download-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 48px;
}

.download-card {
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  padding: 40px 32px;
  text-decoration: none;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  text-align: center;
}
.download-card::before {
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
.download-card:hover {
  border-color: var(--c-border-hi);
  background: var(--c-bg-hover);
  transform: translateY(-3px);
  box-shadow: var(--shadow);
}
.download-card:hover::before {
  transform: scaleX(1);
}

.download-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 24px;
  border-radius: var(--radius);
  background: var(--c-accent-bg);
  border: 1px solid rgba(232, 121, 12, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--c-accent);
  transition: all 0.3s;
}
.download-card:hover .download-icon {
  background: rgba(232, 121, 12, 0.14);
  border-color: rgba(232, 121, 12, 0.25);
  box-shadow: 0 0 24px var(--c-accent-gl);
}

.download-name {
  font-family: var(--f-display);
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0.02em;
  margin-bottom: 10px;
}

.download-desc {
  font-size: 15px;
  color: var(--c-text-2);
  font-weight: 300;
  line-height: 1.7;
  margin-bottom: 28px;
}

.download-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--f-display);
  font-size: 15px;
  font-weight: 600;
  color: var(--c-accent);
  letter-spacing: 0.04em;
  transition: all 0.2s;
}
.download-card:hover .download-btn {
  color: var(--c-accent-l);
}

/* ─── Info Cards ─── */
.download-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.info-card {
  display: flex;
  gap: 16px;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  padding: 24px;
}

.info-icon {
  flex-shrink: 0;
  width: 42px;
  height: 42px;
  border-radius: var(--radius-sm);
  background: var(--c-accent-bg);
  border: 1px solid rgba(232, 121, 12, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--c-accent);
}

.info-card h4 {
  font-family: var(--f-display);
  font-size: 17px;
  font-weight: 600;
  margin-bottom: 4px;
  letter-spacing: 0.02em;
}

.info-card p {
  font-size: 14px;
  color: var(--c-text-2);
  font-weight: 300;
  line-height: 1.7;
}

@media (max-width: 768px) {
  .download-grid {
    grid-template-columns: 1fr;
  }
  .download-info {
    grid-template-columns: 1fr;
  }
}
</style>
