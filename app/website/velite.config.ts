/**
 * Velite 内容管线配置（L3.3）。
 *
 * 「文档中心」已移除：原 16 篇 docs md 迁到仓库根 docs/ 留档，网站不再有 md 内容源，
 * 因此这里不再声明任何集合（空管线可正常构建，velite --clean 只产出空的 index）。
 *
 * 保留本文件与构建脚本里的 velite 阶段，是为了避免牵动依赖锁与第三方许可清单——
 * THIRD_PARTY_LICENSES.md 会被打进桌面安装包，CI 也有 check:licenses 校验，
 * 故 velite / rehype-slug 的依赖清理与许可重算留待依赖审计环节统一处理。
 *
 * 若后续「功能」页需要新的内容源，在此新增 collection 即可。
 */
import { defineConfig } from "velite";

export default defineConfig({
  root: "content",
  output: {
    data: ".velite",
    assets: "public/static",
    base: "/static/",
    name: "index",
    clean: true,
  },
  collections: {},
});
