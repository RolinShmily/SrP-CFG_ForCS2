<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const scrolled = ref(false)
const mobileOpen = ref(false)

function onScroll() {
  scrolled.value = window.scrollY > 32
}

function toggleMobile() {
  mobileOpen.value = !mobileOpen.value
}

function closeMobile() {
  mobileOpen.value = false
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <nav class="nav" :class="{ scrolled }">
    <div class="nav-inner container">
      <router-link to="/" class="nav-brand" @click="closeMobile">
        <img src="/favicon.ico" alt="" class="brand-icon">
        <span class="brand-text">SrP-CFG</span>
      </router-link>

      <div class="nav-links">
        <router-link to="/" class="nav-link" :class="{ active: route.path === '/' }">
          首页
        </router-link>
        <router-link to="/docs" class="nav-link" :class="{ active: route.path.startsWith('/docs') }">
          文档
        </router-link>
        <router-link to="/download" class="nav-link" :class="{ active: route.path === '/download' }">
          下载
        </router-link>
        <a
          href="https://github.com/RolinShmily/SrP-CFG_ForCS2"
          target="_blank"
          rel="noopener"
          class="nav-link"
        >
          GitHub
        </a>
      </div>

      <button class="nav-burger" :class="{ open: mobileOpen }" aria-label="打开菜单" @click="toggleMobile">
        <span /><span /><span />
      </button>
    </div>

    <div class="mobile-menu" :class="{ open: mobileOpen }">
      <router-link to="/" @click="closeMobile">首页</router-link>
      <router-link to="/docs" @click="closeMobile">文档</router-link>
      <router-link to="/download" @click="closeMobile">下载</router-link>
      <a href="https://github.com/RolinShmily/SrP-CFG_ForCS2" target="_blank" rel="noopener" @click="closeMobile">GitHub</a>
    </div>
  </nav>
</template>

<style scoped>
.nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 200;
  background: rgba(11, 13, 20, 0.82);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--c-border);
  transition: box-shadow 0.3s;
}

.nav.scrolled {
  box-shadow: 0 2px 30px rgba(0, 0, 0, 0.5);
}

.nav-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--nav-height);
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}

.brand-icon {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

.brand-text {
  font-family: var(--f-display);
  font-size: 20px;
  font-weight: 700;
  color: var(--c-accent);
  letter-spacing: 0.08em;
}

.nav-links {
  display: flex;
  gap: 8px;
  align-items: center;
}

.nav-link {
  font-family: var(--f-display);
  font-size: 15px;
  font-weight: 500;
  color: var(--c-text-3);
  text-decoration: none;
  padding: 6px 16px;
  border-radius: var(--radius-sm);
  transition: all 0.2s;
}
.nav-link:hover {
  color: var(--c-text);
}
.nav-link.active {
  color: var(--c-accent);
  background: var(--c-accent-bg);
}

.nav-burger {
  display: none;
  flex-direction: column;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
}
.nav-burger span {
  width: 22px;
  height: 2px;
  background: var(--c-text-2);
  border-radius: 2px;
  transition: all 0.3s;
}

.nav-burger.open span:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}
.nav-burger.open span:nth-child(2) {
  opacity: 0;
}
.nav-burger.open span:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}

.mobile-menu {
  display: none;
  flex-direction: column;
  padding: 12px 28px 24px;
  background: var(--c-bg-card);
  border-bottom: 1px solid var(--c-border);
}
.mobile-menu.open {
  display: flex;
}
.mobile-menu a {
  font-family: var(--f-display);
  font-size: 17px;
  font-weight: 500;
  color: var(--c-text-2);
  text-decoration: none;
  padding: 14px 0;
  border-bottom: 1px solid var(--c-border);
  transition: color 0.2s;
}
.mobile-menu a:hover {
  color: var(--c-accent);
}

@media (max-width: 768px) {
  .nav-links {
    display: none;
  }
  .nav-burger {
    display: flex;
  }
}
</style>
