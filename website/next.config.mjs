/** @type {import('next').NextConfig} */
const isGithubPages = process.env.DEPLOY_TARGET === 'gh-pages';
const defaultRepoPath = '/SrP-CFG_ForCS2';
const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? (isGithubPages ? defaultRepoPath : '');
const basePath = rawBasePath === '/' ? '' : rawBasePath;

const nextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: basePath || undefined,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
