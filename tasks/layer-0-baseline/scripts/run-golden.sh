#!/usr/bin/env bash
# L0.6 黄金样本 Node 版执行器（可复现）
# 用法：bash scripts/run-golden.sh
# 前置：仓库根目录已 pnpm install（esbuild 可用）；cargo test -p srp-cfg-core 单独验证 Rust 侧。
set -euo pipefail
cd "$(dirname "$0")/.."

ESBUILD="../../node_modules/.bin/esbuild"
if [ ! -x "$ESBUILD" ]; then
  echo "esbuild 不可用，请先在仓库根执行 pnpm install --registry=https://registry.npmmirror.com" >&2
  exit 1
fi

echo "== 1/2 esbuild bundle（alias electron/winreg → stubs）"
"$ESBUILD" scripts/golden-node.mjs --bundle --format=cjs --platform=node \
  --outfile=scripts/golden-node.cjs \
  --alias:electron=./scripts/stubs/electron.cjs \
  --alias:winreg=./scripts/stubs/winreg.cjs

echo "== 2/2 运行（sandbox=$(pwd)/.sandbox，输出 golden-outputs/*.json）"
SRP_CFG_SANDBOX="$(pwd)/.sandbox" node scripts/golden-node.cjs

echo "== 完成：断言全 PASS；golden-outputs/ 已更新（如与提交版本有差异请核对后提交）"
