<script setup lang="ts">
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
</script>

<template>
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
</template>

<style scoped>
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

@media (max-width: 1024px) {
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .features-grid {
    grid-template-columns: 1fr;
  }
}
</style>
