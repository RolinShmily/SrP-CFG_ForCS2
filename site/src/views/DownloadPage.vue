<script setup lang="ts">
interface DownloadItem {
  name: string
  file: string
  desc: string
  note?: string
  url: string
  size: string
  icon: string
}

const downloads: DownloadItem[] = [
  {
    name: 'MSI 安装器',
    file: 'SrP-CFG_Installer_Setup.msi',
    desc: 'Windows 标准安装包，自动创建快捷方式，支持系统级卸载',
    url: 'https://drive.srprolin.top/SrP-CFG/SrP-CFG_Installer.msi',
    size: '~15 MB',
    icon: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  },
  {
    name: '便携版',
    file: 'SrP-CFG_Installer.exe',
    desc: '单文件自包含发布，无需安装，下载即可直接运行',
    url: 'https://github.com/RolinShmily/SrP-CFG_ForCS2/releases',
    size: '~60 MB',
    icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 12 15 15"/>',
  },
  {
    name: '默认配置包',
    file: 'SrP-CFG_Default.zip',
    desc: '官方完整版配置包，包含所有基础配置文件',
    url: 'https://github.com/RolinShmily/SrP-CFG_ForCS2/releases',
    size: '~30 KB',
    icon: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  },
  {
    name: 'Echo 定制版',
    file: 'SrP-CFG_Echo.zip',
    desc: 'Echo 定制配置变体',
    note: '基于默认配置包，自定义 custom.cfg',
    url: 'https://github.com/RolinShmily/SrP-CFG_ForCS2/releases',
    size: '~30 KB',
    icon: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  },
  {
    name: 'yszh 定制版',
    file: 'SrP-CFG_yszh.zip',
    desc: 'yszh 定制配置变体',
    note: '基于默认配置包，自定义 custom.cfg',
    url: 'https://github.com/RolinShmily/SrP-CFG_ForCS2/releases',
    size: '~30 KB',
    icon: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  },
  {
    name: 'VisionL 定制版',
    file: 'SrP-CFG_VisionL.zip',
    desc: 'VisionL 定制配置变体',
    note: '基于默认配置包，自定义 custom.cfg',
    url: 'https://github.com/RolinShmily/SrP-CFG_ForCS2/releases',
    size: '~30 KB',
    icon: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  },
]

const installSteps = [
  { step: '1', text: '下载 MSI 安装器或便携版 EXE' },
  { step: '2', text: '运行安装器，安装至系统' },
  { step: '3', text: '将配置包 ZIP 文件拖入安装器窗口' },
  { step: '4', text: '点击安装，完成部署' },
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

      <!-- Download cards -->
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
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="item.icon" />
          </div>
          <div class="download-info">
            <h3 class="download-name">{{ item.name }}</h3>
            <p class="download-file">{{ item.file }}</p>
            <p class="download-desc">{{ item.desc }}</p>
            <p v-if="item.note" class="download-note">{{ item.note }}</p>
          </div>
          <div class="download-meta">
            <span class="download-size">{{ item.size }}</span>
            <span class="download-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              下载
            </span>
          </div>
        </a>
      </div>

      <!-- System requirements & Install guide -->
      <div class="extra-grid">
        <div class="extra-card">
          <div class="extra-card-header">
            <div class="extra-icon">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <h3 class="extra-title">系统要求</h3>
          </div>
          <ul class="extra-list">
            <li>Windows x64 操作系统</li>
            <li>.NET 8 Desktop Runtime（便携版无需额外安装）</li>
            <li>Steam 与 Counter-Strike 2 已安装</li>
          </ul>
        </div>

        <div class="extra-card">
          <div class="extra-card-header">
            <div class="extra-icon">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 11 12 14 22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
            <h3 class="extra-title">安装指南</h3>
          </div>
          <div class="steps">
            <div v-for="s in installSteps" :key="s.step" class="step">
              <span class="step-num">{{ s.step }}</span>
              <span class="step-text">{{ s.text }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Trust badges -->
      <div class="download-info-row">
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

/* ─── Download Grid ─── */
.download-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 48px;
}

.download-card {
  display: flex;
  align-items: center;
  gap: 20px;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  padding: 24px 24px;
  text-decoration: none;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
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
  transform: translateY(-2px);
  box-shadow: var(--shadow);
}
.download-card:hover::before {
  transform: scaleX(1);
}

.download-icon {
  flex-shrink: 0;
  width: 50px;
  height: 50px;
  border-radius: var(--radius-sm);
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
}

.download-info {
  flex: 1;
  min-width: 0;
}

.download-name {
  font-family: var(--f-display);
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.02em;
  margin-bottom: 2px;
  color: var(--c-text);
}

.download-file {
  font-family: var(--f-mono);
  font-size: 12px;
  color: var(--c-text-3);
  margin-bottom: 6px;
}

.download-desc {
  font-size: 14px;
  color: var(--c-text-2);
  font-weight: 300;
  line-height: 1.5;
  margin-bottom: 0;
}

.download-note {
  font-size: 12px;
  color: var(--c-text-3);
  font-style: italic;
  margin-top: 4px;
  margin-bottom: 0;
}

.download-meta {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.download-size {
  font-family: var(--f-mono);
  font-size: 12px;
  color: var(--c-text-3);
}

.download-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--f-display);
  font-size: 14px;
  font-weight: 600;
  color: var(--c-accent);
  letter-spacing: 0.04em;
  transition: all 0.2s;
}
.download-card:hover .download-btn {
  color: var(--c-accent-l);
}

/* ─── Extra Grid (Requirements + Install Guide) ─── */
.extra-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 48px;
}

.extra-card {
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  padding: 28px;
}

.extra-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.extra-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  background: var(--c-accent-bg);
  border: 1px solid rgba(232, 121, 12, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--c-accent);
}

.extra-title {
  font-family: var(--f-display);
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--c-text);
}

.extra-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.extra-list li {
  position: relative;
  padding-left: 20px;
  margin-bottom: 10px;
  font-size: 14px;
  color: var(--c-text-2);
  line-height: 1.6;
}
.extra-list li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 9px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--c-accent);
  opacity: 0.6;
}
.extra-list li:last-child {
  margin-bottom: 0;
}

.steps {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.step {
  display: flex;
  align-items: center;
  gap: 14px;
}

.step-num {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--c-accent-bg);
  border: 1px solid rgba(232, 121, 12, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--f-display);
  font-size: 13px;
  font-weight: 600;
  color: var(--c-accent);
}

.step-text {
  font-size: 14px;
  color: var(--c-text-2);
  line-height: 1.5;
}

/* ─── Info Cards (Trust badges) ─── */
.download-info-row {
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
  color: var(--c-text);
}

.info-card p {
  font-size: 14px;
  color: var(--c-text-2);
  font-weight: 300;
  line-height: 1.7;
}

/* ─── Responsive ─── */
@media (max-width: 768px) {
  .download-grid {
    grid-template-columns: 1fr;
  }
  .extra-grid {
    grid-template-columns: 1fr;
  }
  .download-info-row {
    grid-template-columns: 1fr;
  }
  .download-card {
    padding: 20px;
  }
}

@media (max-width: 640px) {
  .download-card {
    flex-wrap: wrap;
    gap: 14px;
  }
  .download-meta {
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
