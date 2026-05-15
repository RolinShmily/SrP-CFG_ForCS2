import type { RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomePage.vue'),
  },
  {
    path: '/docs',
    name: 'docs',
    component: () => import('@/views/DocIndexPage.vue'),
  },
  {
    path: '/docs/:slug',
    name: 'doc-detail',
    component: () => import('@/views/DocDetailPage.vue'),
    props: true,
  },
  {
    path: '/download',
    name: 'download',
    component: () => import('@/views/DownloadPage.vue'),
  },
]
