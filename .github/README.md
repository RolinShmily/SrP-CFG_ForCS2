# .github 目录说明

本目录包含 SrP-CFG 项目的发布配置和工作流。

## 📁 目录结构

```
.github/
├── packages.yaml              # 包配置（唯一配置文件！）
├── release/                   # 发布相关资源
│   └── template.md           # Release Notes 模板
└── workflows/                 # GitHub Actions 工作流
    ├── auto-release.yml      # 自动发布流程
    └── package-validation.yml # 配置验证
```

## 📦 packages.yaml

这是项目的核心配置文件，定义了所有发布包的配置。

### 配置结构

```yaml
packages:
  # 包名称
  allcfgs:
    display_name: "显示名称"
    zip_name: "ZIP文件名前缀"
    description: "包描述"
    files:                    # 要打包的文件列表
      - "autoexec.cfg"
      - "crosshair_library/"
    overrides: []             # 覆盖文件（用户版本使用）

  echo:
    display_name: "Echo 定制版"
    zip_name: "Allcfgs_echo"
    base: "allcfgs"           # 继承基础包
    overrides:               # 覆盖文件（会替换 base 中的同名文件）
      - "echo/autoexec.cfg"
```

### 添加新用户

要添加新的用户定制版本，只需三步：

1. **创建用户目录**
   ```bash
   mkdir newuser
   echo "// 用户自定义配置" > newuser/autoexec.cfg
   ```

2. **添加配置**
   在 `packages.yaml` 中添加：
   ```yaml
   newuser:
     display_name: "新用户定制版"
     zip_name: "Allcfgs_newuser"
     base: "allcfgs"
     overrides:
       - "newuser/autoexec.cfg"
   ```

3. **提交并推送**
   ```bash
   git add .github/packages.yaml newuser/
   git commit -m "feat: 添加新用户定制版"
   git push
   ```

完成！下次打标签发布时会自动包含新用户版本。

### 打包逻辑

- **基础文件**（`files`）：保持原有目录结构打包到 zip
- **覆盖文件**（`overrides`）：提取到 zip 根目录，替换同名文件

**示例：**
```
echo/autoexec.cfg → zip根目录/autoexec.cfg (替换官方版本)
crosshair_library/ → zip根目录/crosshair_library/ (保持结构)
```

## 🚀 workflows/

### auto-release.yml

自动发布工作流，在推送 `v*` 标签时触发。

**功能：**
- ✅ 验证标签格式（语义化版本）
- ✅ 解析 `packages.yaml` 配置
- ✅ 构建 Installer.exe
- ✅ 打包所有配置（保留文件夹结构）
- ✅ 生成 SHA256 校验和
- ✅ 自动生成 Release Notes
- ✅ 创建 GitHub Release

**使用方法：**
```bash
# 打标签并推送
git tag v1.0.0
git push origin v1.0.0

# GitHub Actions 会自动：
# 1. 构建所有包
# 2. 生成 Release Notes
# 3. 创建 Release
# 4. 上传所有文件
```

### package-validation.yml

配置验证工作流，在修改配置文件时自动运行。

**验证内容：**
- YAML 语法检查
- 包配置完整性检查
- 文件存在性验证
- 用户目录检查

## 📝 release/

### template.md

Release Notes 模板，支持变量替换：

- `{{VERSION}}`: 版本号
- `{{REPO_OWNER}}`: 仓库所有者
- `{{REPO_NAME}}`: 仓库名称
- `{{CHANGELOG}}`: 自动生成的变更日志

## 🔄 迁移说明

如果您在 `.github.backup/` 中看到了旧的配置文件，那是备份。

**旧配置（已弃用）：**
```
.github/SrP-pack-paths_allcfgs.txt
.github/echo/pack-paths_echo.txt
.github/echo/custom_pack-paths_echo.txt
.github/yszh/pack-paths_yszh.txt
.github/yszh/custom_pack-paths_yszh.txt
.github/visionl/pack-paths_visionl.txt
.github/visionl/custom_pack-paths_visionl.txt
.github/release.md
```

**新配置（当前使用）：**
```
.github/packages.yaml  # 一个文件替代所有！
```

新的配置文件包含所有旧配置的信息，并且更加灵活和易维护。

## 🎯 设计原则

1. **单一配置源**：所有包配置集中在一个 YAML 文件
2. **继承机制**：用户版本自动继承基础包，减少重复
3. **自动化**：工作流自动发现所有包，无需手动修改
4. **可扩展**：添加新包只需几行配置
5. **可验证**：配置文件自动验证，防止错误

## 📚 相关文档

- [项目 README](../README.md)
- [使用指南](https://doc.srprolin.top/posts/SrP-CFG_CS2/srpcfg-3.html)
- [更新日志](https://doc.srprolin.top/posts/SrP-CFG_CS2/srpcfg-4.html)
