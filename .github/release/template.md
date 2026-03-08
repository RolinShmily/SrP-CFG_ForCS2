# 🎉 SrP-CFG {{VERSION}}

## 📦 下载说明

### 推荐下载
- **`SrP-CFG_Installer.exe`**: 便携版安装器（推荐）⭐
  - 无需任何依赖，一键安装
  - 自动检测 Steam 路径和游戏配置路径
  - 支持自动备份现有配置

### 完整版
- **`Allcfgs_{{VERSION}}.zip`**: 官方完整版
  - 包含所有官方配置文件
  - 包含官方 `autoexec.cfg`
  - 适合大多数用户

### 个人定制版
以下版本使用各自的 `autoexec.cfg`，其他配置与官方版相同：

- **`Allcfgs_echo_{{VERSION}}.zip`**: [Echo 定制版](https://github.com/{{REPO_OWNER}}/{{REPO_NAME}})
  - 使用 echo 的自定义 autoexec.cfg

- **`Allcfgs_yszh_{{VERSION}}.zip`**: [yszh 定制版](https://github.com/{{REPO_OWNER}}/{{REPO_NAME}})
  - 使用 yszh 的自定义 autoexec.cfg

- **`Allcfgs_visionl_{{VERSION}}.zip`**: [visionl 定制版](https://github.com/{{REPO_OWNER}}/{{REPO_NAME}})
  - 使用 visionl 的自定义 autoexec.cfg

## 📋 本次更新内容

{{CHANGELOG}}

## 📐 文件校验和

为确保下载文件的完整性，请验证 SHA256 校验和：

```
{{CHECKSUMS}}
```

**如何验证？**
1. 下载 `checksums.txt`
2. Windows PowerShell: `Get-FileHash 文件名 -Algorithm SHA256`
3. Linux/Mac: `sha256sum 文件名`

## 💡 使用指南

- **安装器使用**: 下载 `SrP-CFG_Installer.exe`，双击运行，拖入 zip 包即可
- **手动安装**: 解压 zip 包到游戏目录的 `cfg/` 文件夹
- **详细文档**: [项目文档](https://doc.srprolin.top/posts/SrP-CFG_CS2/)

## ⚠️ 注意事项

- 安装前会自动备份现有配置
- 个人定制版只替换 `autoexec.cfg`，其他配置保持不变
- 建议安装后查看控制台输出的导航信息

---

**💖 觉得好用请给个 Star 支持一下！** [项目地址](https://github.com/{{REPO_OWNER}}/{{REPO_NAME}})
