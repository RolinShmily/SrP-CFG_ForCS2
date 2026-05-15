#!/usr/bin/env python3
"""
上传文件到阿里云 OSS：根据 oss-upload.yaml 配置匹配文件并上传。
由 CI 的 "Upload to Aliyun OSS" 步骤调用。

用法: python3 .github/scripts/upload_oss.py
"""

import yaml
import json
import os
import subprocess
import re
import glob


def main():
    # 读取配置
    with open('.github/oss-upload.yaml', 'r', encoding='utf-8') as f:
        config = yaml.safe_load(f)

    upload_files = config.get('upload_files', [])
    settings = config.get('settings', {})

    # 过滤启用的文件
    enabled_files = [f for f in upload_files if f.get('enabled', True)]

    oss_prefix = os.environ.get('OSS_PREFIX', '')
    oss_bucket = os.environ.get('OSS_BUCKET', '')
    oss_endpoint = os.environ.get('OSS_ENDPOINT', '')
    tag = os.environ.get('TAG', '')

    print(f"\n📦 Processing {len(enabled_files)} files...\n")

    success_count = 0
    failed_count = 0
    results = []

    for file_config in enabled_files:
        display_name = file_config.get('display_name', 'Unknown')
        source_pattern = file_config.get('source_pattern', '')
        target_name = file_config.get('target_name', '')

        # 查找匹配的文件
        matching_files = glob.glob(source_pattern)

        # 如果配置了 target_name，通过版本号去除后与 target_name 匹配来筛选正确的文件，
        # 避免 glob 通配符匹配到其他包的文件
        if target_name:
            version_pattern = settings.get('version_pattern', '_[vV][0-9]+\\.[0-9]+\\.[0-9]+(-[a-zA-Z0-9.]+)?')
            filtered = []
            for f in matching_files:
                base = os.path.basename(f)
                name_no_ext, ext = os.path.splitext(base)
                derived = re.sub(version_pattern + '$', '', name_no_ext) + ext
                if derived == target_name:
                    filtered.append(f)
            if filtered:
                matching_files = filtered

        # 按修改时间排序，选择最新的文件
        if matching_files:
            matching_files.sort(key=lambda x: os.path.getmtime(x), reverse=True)

        if not matching_files:
            print(f"  ⚠️  {display_name}: No files found matching '{source_pattern}'")
            results.append({
                'display': display_name,
                'source': '-',
                'target': target_name,
                'status': '⚠️ Not Found',
                'success': False,
                'overwritten': False
            })
            continue

        # 使用第一个匹配的文件
        source_file = matching_files[0]

        # 确定目标名称：有 target_name 用配置值，否则用源文件名
        final_target = target_name or os.path.basename(source_file)

        print(f"  📦 {display_name}")
        print(f"     Source: {source_file}")
        print(f"     Target: {final_target}")

        # 复制文件到目标名称
        subprocess.run(['cp', source_file, final_target], check=True)

        # 上传到 OSS
        oss_path = f"{oss_prefix}{final_target}"
        oss_uri = f"oss://{oss_bucket}/{oss_path}"

        # 检查文件是否存在
        check_result = subprocess.run(['ossutil', 'ls', oss_uri], capture_output=True, text=True)
        file_exists = check_result.returncode == 0 and 'ObjectNum' in check_result.stdout

        if file_exists:
            print(f"     🔄 Overwriting existing file...")

        # 执行上传
        result = subprocess.run(['ossutil', 'cp', final_target, oss_uri, '-f', '--update'], capture_output=True, text=True)

        if result.returncode == 0:
            if file_exists:
                print(f"     ✅ Overwritten: {oss_uri}")
            else:
                print(f"     ✅ Uploaded: {oss_uri}")
            success_count += 1

            # 生成访问链接
            if oss_endpoint.startswith('https://'):
                public_url = f"{oss_endpoint}/{oss_bucket}/{oss_path}"
            else:
                public_url = f"https://{oss_bucket}.{oss_endpoint}/{oss_path}"

            results.append({
                'display': display_name,
                'source': os.path.basename(source_file),
                'target': final_target,
                'oss_path': oss_path,
                'public_url': public_url,
                'status': '✅ Success' if not file_exists else '✅ Overwritten',
                'success': True,
                'overwritten': file_exists
            })
        else:
            print(f"     ❌ Upload failed")
            print(f"     Error: {result.stderr}")
            failed_count += 1
            results.append({
                'display': display_name,
                'source': os.path.basename(source_file),
                'target': final_target,
                'status': '❌ Failed',
                'success': False,
                'overwritten': False
            })
            if settings.get('on_error', 'stop') == 'stop':
                print("\n❌ Upload failed, stopping...")
                break

        print()

    # 保存结果
    with open('upload_results.json', 'w', encoding='utf-8') as f:
        json.dump({
            'success': success_count,
            'failed': failed_count,
            'total': success_count + failed_count,
            'results': results
        }, f, ensure_ascii=False, indent=2)

    print(f"✅ Upload completed: {success_count} success, {failed_count} failed")


if __name__ == '__main__':
    main()
