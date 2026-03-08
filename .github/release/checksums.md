# SHA256 校验和说明

## 什么是校验和？

校验和（Checksum）是用来验证文件完整性的一个字符串。通过对文件内容进行 SHA256 算法计算，可以得到一个唯一的校验和值。

## 为什么需要校验和？

- ✅ 验证文件是否下载完整
- ✅ 确保文件未被篡改
- ✅ 检测文件传输过程中的错误

## 如何使用校验和？

### Windows PowerShell

```powershell
# 计算文件的 SHA256 哈希值
Get-FileHash 文件名 -Algorithm SHA256
```

**示例：**
```powershell
Get-FileHash SrP-CFG_Installer.exe -Algorithm SHA256
# 输出：Algorithm  Hash                           Path
#       SHA256    ABC123...                      SrP-CFG_Installer.exe
```

### Windows CMD (使用 CertUtil)

```cmd
certutil -hashfile 文件名 SHA256
```

**示例：**
```cmd
certutil -hashfile SrP-CFG_Installer.exe SHA256
```

### Linux / macOS

```bash
sha256sum 文件名
# 或
shasum -a 256 文件名
```

**示例：**
```bash
sha256sum SrP-CFG_Installer.exe
# 输出：abc123def456...  SrP-CFG_Installer.exe
```

## 验证步骤

1. **下载文件和 checksums.txt**
   - 从 Release 页面下载所需的文件
   - 下载 `checksums.txt` 文件

2. **计算文件哈希值**
   - 使用上述命令计算下载文件的 SHA256 哈希值

3. **对比校验和**
   - 将计算出的哈希值与 `checksums.txt` 中的值对比
   - 完全匹配则文件完整无误

## 示例

假设下载了 `Allcfgs_v1.0.0.zip`：

```bash
# 计算哈希值
sha256sum Allcfgs_v1.0.0.zip

# 输出示例：
# a1b2c3d4e5f6...  Allcfgs_v1.0.0.zip

# 打开 checksums.txt
cat checksums.txt

# 内容示例：
# a1b2c3d4e5f6...  Allcfgs_v1.0.0.zip
# b2c3d4e5f6a1...  SrP-CFG_Installer.exe
```

如果两个哈希值完全一致，说明文件完整且未被篡改！

## 注意事项

- ⚠️ 哈希值是区分大小写的
- ⚠️ 确保使用正确的算法（SHA256）
- ⚠️ 文件名必须完全匹配（包括扩展名）

## 常见问题

**Q: 校验和不匹配怎么办？**
A: 文件可能损坏或下载不完整，请重新下载。

**Q: checksums.txt 的作用是什么？**
A: 它是官方发布的所有文件校验和的汇总文件，用于验证下载的文件。

**Q: 为什么不用 MD5？**
A: SHA256 比 MD5 更安全，抗碰撞性更强，是当前推荐的校验算法。
