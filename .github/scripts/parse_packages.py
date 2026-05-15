#!/usr/bin/env python3
"""
解析 packages.yaml：展开继承关系，输出扁平的 packages.json 供打包脚本使用。
由 CI 的 "Parse packages configuration" 步骤调用。

用法: python3 .github/scripts/parse_packages.py
"""

import yaml
import json


def main():
    with open('.github/packages.yaml', 'r', encoding='utf-8') as f:
        config = yaml.safe_load(f)

    packages = config.get('packages', {})

    package_list = []
    for pkg_name, pkg_config in packages.items():
        # 获取文件列表（处理 base 继承）
        if 'base' in pkg_config:
            base_config = packages.get(pkg_config['base'], {})
            files = base_config.get('files', [])
        else:
            files = pkg_config.get('files', [])

        package_list.append({
            'name': pkg_name,
            'zip_name': pkg_config.get('zip_name', pkg_name),
            'display_name': pkg_config.get('display_name', pkg_name),
            'description': pkg_config.get('description', ''),
            'files': files,
            'overrides': pkg_config.get('overrides', [])
        })

    with open('packages.json', 'w', encoding='utf-8') as f:
        json.dump(package_list, f, ensure_ascii=False, indent=2)

    print(f"✅ Parsed {len(package_list)} packages")


if __name__ == '__main__':
    main()
