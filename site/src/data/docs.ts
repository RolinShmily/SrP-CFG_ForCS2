export interface DocMeta {
  slug: string
  title: string
  desc: string
  category: 'project' | 'config'
}

export const docs: DocMeta[] = [
  { slug: 'srpcfg-1', title: '项目说明', desc: 'SrP-CFG 完整功能介绍与项目概览', category: 'project' },
  { slug: 'srpcfg-2', title: '下载地址', desc: '各版本安装包与配置文件下载', category: 'project' },
  { slug: 'srpcfg-3', title: '使用指南', desc: '安装器使用方法与配置说明', category: 'project' },
  { slug: 'autoexec', title: 'autoexec.cfg', desc: '自启动基础设置，包含完整的按键绑定和导航系统', category: 'config' },
  { slug: 'crosshair_view', title: 'crosshair_view.cfg', desc: '准星预设系统与持枪视角配置', category: 'config' },
  { slug: 'practice', title: 'practice.cfg', desc: '个人自建房跑图，包含各地图出生点预设', category: 'config' },
  { slug: 'demo_hlae', title: 'demo_hlae.cfg', desc: '使用 HLAE 观看 demo 的完整控制', category: 'config' },
  { slug: 'knife', title: 'knife.cfg', desc: '匕首模型切换，20+ 种刀具选择', category: 'config' },
  { slug: 'zeus', title: 'zeus.cfg', desc: '电击枪快速切换战术配置', category: 'config' },
  { slug: 'autoview', title: 'autoview.cfg', desc: '武器自适应视角切换', category: 'config' },
  { slug: 'previewmode', title: 'previewmode.cfg', desc: '饰品预览检视工具模式', category: 'config' },
  { slug: 'guidemake', title: 'guidemake.cfg', desc: '地图指南制作模式，支持手雷标记和工坊提交', category: 'config' },
  { slug: 'cs2_video', title: 'cs2_video.txt', desc: '视频设置配置（NVIDIA RTX 4060 优化）', category: 'config' },
]

export const projectDocs = docs.filter(d => d.category === 'project')
export const configDocs = docs.filter(d => d.category === 'config')

export const docMap = new Map(docs.map(d => [d.slug, d]))

export function getDocMeta(slug: string): DocMeta | undefined {
  return docMap.get(slug)
}
