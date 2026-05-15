#!/usr/bin/env python3
"""
构建发布包：根据 packages.json 将配置文件打包为 zip。
由 CI 的 "Build packages" 步骤调用。

用法: python3 .github/scripts/build_packages.py
"""

import json
import subprocess
import os


def main():
    with open('packages.json', 'r', encoding='utf-8') as f:
        packages = json.load(f)

    tag = os.environ.get('GITHUB_REF_NAME', '')
    zip_files = []

    for pkg in packages:
        pkg_name = pkg['name']
        zip_name = pkg['zip_name']
        files = pkg['files']
        overrides = pkg['overrides']

        # 构建输出文件名
        output_zip = f"{zip_name}_{tag}.zip"
        zip_files.append(output_zip)

        print(f"  📦 Building {pkg_name} -> {output_zip}")

        # 打包基础文件（保留目录结构）
        # 检测公共基础目录（如 "default"），cd 进去后再 zip，
        # 确保 zip 内部结构与源码目录结构解耦
        base_dir = ''
        if files:
            base_dir = os.path.commonpath(files)
            if os.path.isfile(base_dir):
                base_dir = os.path.dirname(base_dir)
            rel_files = [os.path.relpath(f, base_dir) for f in files]
            file_list = ' '.join(rel_files)
            output_zip_abs = os.path.abspath(output_zip)
            subprocess.run(f'zip -r {output_zip_abs} {file_list}', shell=True, check=False, cwd=base_dir)

        # 添加覆盖文件（直接替换 zip 中的同名文件）
        if overrides:
            for override_file in overrides:
                if os.path.exists(override_file):
                    subprocess.run(f'zip -j {output_zip} {override_file}', shell=True, check=False)
                    print(f"    ✓ Added override: {override_file}")
                else:
                    print(f"    ⚠ Override file not found: {override_file}")

        # 添加版本更新说明
        if os.path.exists('版本更新说明.md'):
            subprocess.run(f'zip -j {output_zip} 版本更新说明.md', shell=True, check=False)
            print(f"    ✓ Added: 版本更新说明.md")

        print(f"  ✅ Created {output_zip}")

    # 保存 zip 文件列表
    with open('zip_files.txt', 'w') as f:
        f.write(' '.join(zip_files))

    print(f"\n✅ Built {len(zip_files)} packages")


if __name__ == '__main__':
    main()
