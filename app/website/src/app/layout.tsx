/**
 * 迁移骨架（WIP）—— React Router 7 应用布局（对应原 MainLayout.astro）。
 *
 * Nav + 内容出口 + Footer。各页面通过子路由渲染进 <Outlet/>。
 */
import { Outlet } from "react-router";
import { Nav } from "./components/Nav";
import { Footer } from "./components/Footer";

export default function Component() {
  return (
    <>
      <Nav />
      <main id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
