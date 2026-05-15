<script setup lang="ts">
import NavBar from './components/NavBar.vue'
import FooterBar from './components/FooterBar.vue'
</script>

<template>
  <div class="app-layout">
    <!-- Noise Overlay -->
    <div class="noise" aria-hidden="true" />

    <!-- Ambient Glow Orbs -->
    <div class="ambient" aria-hidden="true">
      <div class="orb orb-1" />
      <div class="orb orb-2" />
    </div>

    <NavBar />

    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <FooterBar />
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  padding-top: var(--nav-height);
}

.noise {
  position: fixed;
  inset: 0;
  z-index: 9998;
  pointer-events: none;
  opacity: .35;
  background: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.035'/%3E%3C/svg%3E");
}

.ambient {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
}

.orb-1 {
  width: 700px;
  height: 700px;
  top: -15%;
  right: -8%;
  background: radial-gradient(circle, rgba(232,121,12,.12) 0%, transparent 70%);
}

.orb-2 {
  width: 500px;
  height: 500px;
  bottom: 10%;
  left: -5%;
  background: radial-gradient(circle, rgba(45,212,191,.06) 0%, transparent 70%);
}
</style>
