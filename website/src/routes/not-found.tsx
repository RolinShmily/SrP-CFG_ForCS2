import type { MetaFunction } from "react-router";
import { Link } from "react-router";

export const meta: MetaFunction = () => [
  { title: "404 | SrP-CFG" },
  { name: "robots", content: "noindex,follow" },
];

export default function NotFoundRoute() {
  return (
    <main className="error-page">
      <p className="eyebrow">404</p>
      <h1>页面不存在</h1>
      <p>这个地址没有对应的页面，可能是链接过期或输入有误。</p>
      <div className="button-row">
        <Link className="button button-primary" to="/">返回首页</Link>
        <Link className="button button-secondary" to="/console">打开 Console</Link>
      </div>
    </main>
  );
}
