//! 暂存区分类与安装预处理（纯逻辑）。
//!
//! 对应原 `app/desktop/src/main/services/staging.ts` 的纯计算部分：
//! - `classifyFile` / `processUploadToStaging` 的归类与目标路径推导
//! - `generateTimestampFolderName` / `enforceLimit`（上传/下载目录命名与数量上限）
//! - `executableLine` / `execTarget` / `isRuntimeRegistrationOnly`（Runtime 包识别）
//! - `getFileInfo` 的文件类型判定
//!
//! 文件系统 I/O（zip 解压、复制、目录扫描）由 tauri 壳层负责，本模块只做纯计算。

use std::collections::{HashMap, HashSet};

// ─────────────────────────────────────────────
// 文件归类（对应 staging.ts classifyFile）
// ─────────────────────────────────────────────

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StagedCategory {
    Cfg,
    Annotations,
    Video,
    Vcfg,
    Unsupported,
}

fn basename(p: &str) -> &str {
    let trimmed = p.trim_end_matches(['/', '\\']);
    trimmed.rsplit(['/', '\\']).next().unwrap_or(trimmed)
}

/// 与 TS / 用户定制判定规则一致：
/// 1. vcfg（.vcfg / .vcfg_lastclouded）→ 安全隔离拦截
/// 2. cfg（.cfg）→ 100% 归为 Runtime Core（保留相对路径结构）
/// 3. video（文件名含 cs2_video 或 首行/内容包含 "video.cfg"）→ Video Config
/// 4. annotations（内容包含 "MapAnnotationNode"，或无内容样本时路径含 annotations/guide）→ Annotations
/// 5. 其他无签名 .txt（如 README.txt）或未知后缀 → Unsupported（自动跳过）
pub fn classify_file_with_content(relative_path: &str, content_sample: Option<&str>) -> StagedCategory {
    let lower = relative_path.to_lowercase();
    if lower.ends_with(".vcfg") || lower.ends_with(".vcfg_lastclouded") {
        return StagedCategory::Vcfg;
    }
    if lower.ends_with(".cfg") {
        return StagedCategory::Cfg;
    }

    let bname = basename(&lower);

    // 画面设置：文件名包含 cs2_video，或内容/头部包含 video.cfg
    if bname.contains("cs2_video") {
        return StagedCategory::Video;
    }
    if let Some(content) = content_sample {
        let trimmed = content.trim_start();
        if trimmed.starts_with("\"video.cfg\"")
            || trimmed.starts_with("video.cfg")
            || trimmed.starts_with("\"Video.cfg\"")
            || content.contains("\"video.cfg\"")
            || content.contains("video.cfg")
        {
            return StagedCategory::Video;
        }

        // 地图指南：内容必须包含 MapAnnotationNode 节点签名
        if content.contains("MapAnnotationNode") {
            return StagedCategory::Annotations;
        }

        // 提供了内容样本但未命中 MapAnnotationNode / video.cfg，则归为不支持（跳过如 README.txt）
        return StagedCategory::Unsupported;
    }

    // 无内容样本时的纯路径回退
    if lower.contains("annotations") || lower.contains("guide") {
        return StagedCategory::Annotations;
    }

    StagedCategory::Unsupported
}

/// 纯路径分类兼容接口
pub fn classify_file(relative_path: &str) -> StagedCategory {
    classify_file_with_content(relative_path, None)
}

/// 地图指南目标相对路径推导：
/// 必须且仅有一级父目录文件夹（例如 `SrP-Dust2-Guide/SrP-Dust2-Guide.txt`）。
/// - 若路径已有父目录，保留最后一级父目录；
/// - 若为裸文件，以文件名（去扩展名）自动作为一级父目录。
fn derive_annotations_destination(relative_path: &str) -> String {
    let normalized = relative_path.replace('\\', "/");
    let trimmed = normalized.trim_matches('/');

    // 剔除前置 annotations/local/ 或 annotations/ 前缀
    let clean_path = if let Some(idx) = trimmed.to_lowercase().find("annotations/local/") {
        &trimmed[idx + "annotations/local/".len()..]
    } else if let Some(idx) = trimmed.to_lowercase().find("annotations/") {
        &trimmed[idx + "annotations/".len()..]
    } else {
        trimmed
    };

    let segments: Vec<&str> = clean_path.split('/').filter(|s| !s.is_empty()).collect();

    match segments.len() {
        0 => "unnamed_guide/guide.txt".to_string(),
        1 => {
            // 单个裸文件：以去除扩展名后的主名作为父文件夹
            let filename = segments[0];
            let stem = filename.rsplit_once('.').map(|(s, _)| s).unwrap_or(filename);
            let folder_name = if stem.is_empty() { "custom_guide" } else { stem };
            format!("{folder_name}/{filename}")
        }
        2 => {
            // 正好有一级父文件夹与文件名：保持 FolderName/FileName
            format!("{}/{}", segments[0], segments[1])
        }
        _ => {
            // 多层嵌套：取倒数第二段（直接父目录）与文件名，保证只有一级父目录
            let len = segments.len();
            format!("{}/{}", segments[len - 2], segments[len - 1])
        }
    }
}

/// 目标相对路径推导（带内容样本检查）：
/// - cfg → 原相对路径（完整保留子目录）
/// - annotations → 确保保留一级父目录文件夹（`FolderName/FileName.txt`）
/// - video → 固定 `cs2_video.txt`
/// - vcfg / unsupported → None（被阻止/跳过）
pub fn staging_destination_with_content(
    relative_path: &str,
    content_sample: Option<&str>,
) -> Option<(StagedCategory, String)> {
    match classify_file_with_content(relative_path, content_sample) {
        StagedCategory::Cfg => Some((StagedCategory::Cfg, relative_path.to_string())),
        StagedCategory::Annotations => {
            let dest = derive_annotations_destination(relative_path);
            Some((StagedCategory::Annotations, dest))
        }
        StagedCategory::Video => Some((StagedCategory::Video, "cs2_video.txt".to_string())),
        StagedCategory::Vcfg | StagedCategory::Unsupported => None,
    }
}

/// 纯路径目标相对路径推导
pub fn staging_destination(relative_path: &str) -> Option<(StagedCategory, String)> {
    staging_destination_with_content(relative_path, None)
}

/// 上传文件类型（对应 TS `getFileInfo`：扩展名 .cfg → cfg、.txt → txt，其余 unsupported）。
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum UploadFileType {
    Cfg,
    Txt,
    Unsupported,
}

pub fn upload_file_type(name: &str) -> UploadFileType {
    let ext = name.rsplit('.').next().unwrap_or("").to_lowercase();
    match ext.as_str() {
        "cfg" => UploadFileType::Cfg,
        "txt" => UploadFileType::Txt,
        _ => UploadFileType::Unsupported,
    }
}

/// 上传是否允许（ALLOWED_EXTENSIONS = .cfg / .txt）。
pub fn is_allowed_upload_file(name: &str) -> bool {
    matches!(upload_file_type(name), UploadFileType::Cfg | UploadFileType::Txt)
}

// ─────────────────────────────────────────────
// 暂存归类计划（对应 TS processUploadToStaging）
// ─────────────────────────────────────────────

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct StagingPlan {
    /// 目标暂存相对路径（cfg 区）
    pub cfg_destinations: Vec<String>,
    /// 目标暂存相对路径（annotations 区）
    pub annotations_destinations: Vec<String>,
    /// 视频文件数（固定落到 cs2_video.txt）
    pub video_count: usize,
    /// 被阻止的 VCFG 文件数
    pub blocked_vcfg_count: usize,
    /// 不支持的文件数
    pub unsupported_count: usize,
}

impl StagingPlan {
    pub fn cfg_count(&self) -> usize {
        self.cfg_destinations.len()
    }
    pub fn annotations_count(&self) -> usize {
        self.annotations_destinations.len()
    }
}

/// 给定上传包内全部相对路径，计算归类计划（不依赖文件系统）。
pub fn plan_staging(upload_relative_paths: &[String]) -> StagingPlan {
    let mut plan = StagingPlan::default();
    for rel in upload_relative_paths {
        match classify_file(rel) {
            StagedCategory::Cfg => plan.cfg_destinations.push(rel.clone()),
            StagedCategory::Annotations => {
                if let Some((_, dest)) = staging_destination(rel) {
                    plan.annotations_destinations.push(dest);
                }
            }
            StagedCategory::Video => plan.video_count += 1,
            StagedCategory::Vcfg => plan.blocked_vcfg_count += 1,
            StagedCategory::Unsupported => plan.unsupported_count += 1,
        }
    }
    plan
}

// ─────────────────────────────────────────────
// 时间戳目录名 / 数量上限（对应 TS generateTimestampFolderName / enforceLimit）
// ─────────────────────────────────────────────

/// "YYYY-MM-DD-NNNN" 格式校验（对应 TS `/^\d{4}-\d{2}-\d{2}-\d{4}$/`）。
pub fn is_timestamp_folder(name: &str) -> bool {
    let b = name.as_bytes();
    let digit = |c: u8| c.is_ascii_digit();
    b.len() == 15
        && digit(b[0]) && digit(b[1]) && digit(b[2]) && digit(b[3])
        && b[4] == b'-'
        && digit(b[5]) && digit(b[6])
        && b[7] == b'-'
        && digit(b[8]) && digit(b[9])
        && b[10] == b'-'
        && digit(b[11]) && digit(b[12]) && digit(b[13]) && digit(b[14])
}

/// 生成下一个时间戳目录名：`{date}-{seq:04}`，seq = 已存在同名前缀的最大序号 + 1（从 1 起）。
pub fn next_timestamp_folder(existing_names: &[String], date: &str) -> String {
    let prefix = format!("{date}-");
    let max_seq = existing_names
        .iter()
        .filter_map(|name| name.strip_prefix(&prefix)?.parse::<u32>().ok())
        .max()
        .unwrap_or(0);
    format!("{prefix}{:04}", max_seq + 1)
}

/// 需要删除的旧目录（对应 TS `enforceLimit`：排序后 while len >= max 删最旧）。
/// 注意：TS 行为是删到 len == max-1，本函数 1:1 复刻该语义。
pub fn folders_to_remove(existing_names: &[String], max: usize) -> Vec<String> {
    let mut folders: Vec<String> = existing_names
        .iter()
        .filter(|name| is_timestamp_folder(name))
        .cloned()
        .collect();
    folders.sort();
    let mut to_remove = Vec::new();
    while folders.len() >= max {
        to_remove.push(folders.remove(0));
    }
    to_remove
}

// ─────────────────────────────────────────────
// Runtime 包识别（对应 TS executableLine / execTarget / isRuntimeRegistrationOnly）
// ─────────────────────────────────────────────

/// 去掉行内注释（`//` 之后全部忽略）并 trim（对应 TS `executableLine`）。
pub fn executable_line(line: &str) -> &str {
    line.split("//").next().unwrap_or("").trim()
}

/// 解析 `exec` / `execifexists` 目标文件（对应 TS `execTarget`）：
/// 返回归一化相对路径（`\` → `/`，无 .cfg 后缀则补上）。
pub fn exec_target(raw_line: &str) -> Option<String> {
    let line = executable_line(raw_line);
    let lower = line.to_lowercase();
    let rest = if lower.strip_prefix("execifexists").is_some() {
        &line["execifexists".len()..]
    } else if lower.strip_prefix("exec").is_some() {
        &line["exec".len()..]
    } else {
        return None;
    };
    let rest = rest.trim_start();
    if rest.is_empty() {
        return None;
    }

    let (target, after): (&str, &str) = if rest.starts_with('"') || rest.starts_with('\'') {
        let quote = rest.chars().next().unwrap();
        let inner = &rest[1..];
        let end = inner.find(quote)?;
        (&inner[..end], &inner[end + 1..])
    } else {
        let end = rest.find(char::is_whitespace).unwrap_or(rest.len());
        (&rest[..end], &rest[end..])
    };

    if target.is_empty() || !after.trim().is_empty() {
        return None;
    }
    if !target
        .chars()
        .all(|c| c.is_ascii_alphanumeric() || matches!(c, '_' | '.' | '/' | '\\' | '-'))
    {
        return None;
    }

    let normalized = target.replace('\\', "/");
    Some(if normalized.to_lowercase().ends_with(".cfg") {
        normalized
    } else {
        format!("{normalized}.cfg")
    })
}

/// `alias` / `echo` / `echoln`（含词边界，对应 TS `/^(?:alias|echo|echoln)\b/i`）。
fn is_alias_echo(line: &str) -> bool {
    for kw in ["alias", "echo", "echoln"] {
        if line.len() >= kw.len() && line[..kw.len()].eq_ignore_ascii_case(kw) {
            let next = line[kw.len()..].chars().next();
            // \b：后续字符不是单词字符（字母/数字/下划线）
            if next.is_none_or(|c| !(c.is_alphanumeric() || c == '_')) {
                return true;
            }
        }
    }
    false
}

/// 是否"只注册 Runtime"（对应 TS `isRuntimeRegistrationOnly`）：
/// 从 autoexec.cfg 出发 BFS 跟随 exec 目标，途中只允许 alias/echo/echoln/exec，
/// 出现其他可执行语句（绑定、指令）即视为非纯注册包。
/// `files`：cfg 区内相对路径 → 文件内容。
pub fn is_runtime_registration_only(files: &HashMap<String, String>) -> bool {
    let mut pending = vec!["autoexec.cfg".to_string()];
    let mut visited: HashSet<String> = HashSet::new();

    while let Some(relative) = pending.pop() {
        if !visited.insert(relative.clone()) {
            continue;
        }
        let Some(content) = files.get(&relative) else {
            continue;
        };
        for raw_line in content.split('\n') {
            let line = executable_line(raw_line);
            if line.is_empty() {
                continue;
            }
            if let Some(target) = exec_target(raw_line) {
                pending.push(target);
                continue;
            }
            if is_alias_echo(line) {
                continue;
            }
            return false;
        }
    }
    true
}

/// cfg 区内容研判（对应 TS `inspectConfigDirectory`）：
/// 无 .cfg → empty；有 autoexec.cfg 且全链路只注册 Runtime → runtime-core；否则 custom。
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StagedConfigKind {
    Empty,
    RuntimeCore,
    Custom,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ConfigImpact {
    pub kind: StagedConfigKind,
    pub cfg_count: usize,
}

pub fn inspect_cfg_files(files: &HashMap<String, String>) -> ConfigImpact {
    let cfg_count = files
        .keys()
        .filter(|k| k.to_lowercase().ends_with(".cfg"))
        .count();
    let kind = if cfg_count == 0 {
        StagedConfigKind::Empty
    } else if files.contains_key("autoexec.cfg") && is_runtime_registration_only(files) {
        StagedConfigKind::RuntimeCore
    } else {
        StagedConfigKind::Custom
    };
    ConfigImpact { kind, cfg_count }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn map(entries: &[(&str, &str)]) -> HashMap<String, String> {
        entries
            .iter()
            .map(|(k, v)| (k.to_string(), v.to_string()))
            .collect()
    }

    // ── classify_file ───────────────────────
    #[test]
    fn classifies_by_extension_and_path() {
        assert_eq!(classify_file("autoexec.cfg"), StagedCategory::Cfg);
        assert_eq!(classify_file("cfg/run.cfg"), StagedCategory::Cfg);
        assert_eq!(classify_file("annotations/local/dust2.txt"), StagedCategory::Annotations);
        assert_eq!(classify_file("settings/annotations/notes.txt"), StagedCategory::Annotations);
        assert_eq!(classify_file("cs2_video.txt"), StagedCategory::Video);
        assert_eq!(classify_file("sub/cs2_video.txt"), StagedCategory::Video);
        assert_eq!(classify_file("config.vcfg"), StagedCategory::Vcfg);
        assert_eq!(classify_file("config.vcfg_lastclouded"), StagedCategory::Vcfg);
        assert_eq!(classify_file("readme.md"), StagedCategory::Unsupported);
        assert_eq!(classify_file("notes.txt"), StagedCategory::Unsupported);
    }

    #[test]
    fn cfg_always_classified_as_cfg() {
        assert_eq!(classify_file("autoexec.cfg"), StagedCategory::Cfg);
        assert_eq!(classify_file("annotations/guide.cfg"), StagedCategory::Cfg);
        assert_eq!(classify_file("srp-cfg/features/jumpthrow.cfg"), StagedCategory::Cfg);
    }

    #[test]
    fn text_content_smart_detection() {
        // 画面设置签名
        assert_eq!(
            classify_file_with_content("custom_video.txt", Some("\"video.cfg\"\n{\n  \"setting.cpu_level\" \"2\"\n}")),
            StagedCategory::Video
        );
        // 地图指南签名
        assert_eq!(
            classify_file_with_content("dust2.txt", Some("\"map_annotation_list\"\n{\n  \"0\"\n  {\n    \"MapAnnotationNode\"\n    {\n    }\n  }\n}")),
            StagedCategory::Annotations
        );
        // 无关说明文本自动跳过
        assert_eq!(
            classify_file_with_content("README.txt", Some("This is a user manual for SrP-CFG")),
            StagedCategory::Unsupported
        );
    }

    // ── staging_destination ─────────────────
    #[test]
    fn cfg_keeps_relative_subdirs() {
        assert_eq!(
            staging_destination("presets/yszh.cfg"),
            Some((StagedCategory::Cfg, "presets/yszh.cfg".to_string()))
        );
    }

    #[test]
    fn annotations_ensures_single_level_parent_folder() {
        // 已有完整父文件夹结构：SrP-Dust2-Guide/SrP-Dust2-Guide.txt
        assert_eq!(
            staging_destination("SrP-Dust2-Guide/SrP-Dust2-Guide.txt"),
            Some((StagedCategory::Annotations, "SrP-Dust2-Guide/SrP-Dust2-Guide.txt".to_string()))
        );
        // 带前缀 annotations/local/ 剥离后保留一级父目录
        assert_eq!(
            staging_destination("annotations/local/SrP-Mirage-Guide/SrP-Mirage-Guide.txt"),
            Some((StagedCategory::Annotations, "SrP-Mirage-Guide/SrP-Mirage-Guide.txt".to_string()))
        );
        // 嵌套多层路径：取最靠近文件的父目录
        assert_eq!(
            staging_destination("config/annotations/SrP-Ancient-Guide/SrP-Ancient-Guide.txt"),
            Some((StagedCategory::Annotations, "SrP-Ancient-Guide/SrP-Ancient-Guide.txt".to_string()))
        );
        // 单个裸文件（无父目录）：自动以主名包装为一级父目录
        assert_eq!(
            staging_destination("SrP-Inferno-Guide.txt"),
            Some((StagedCategory::Annotations, "SrP-Inferno-Guide/SrP-Inferno-Guide.txt".to_string()))
        );
    }

    #[test]
    fn video_and_blocked_files() {
        assert_eq!(
            staging_destination("cs2_video.txt"),
            Some((StagedCategory::Video, "cs2_video.txt".to_string()))
        );
        assert_eq!(staging_destination("config.vcfg"), None);
        assert_eq!(staging_destination("notes.txt"), None);
        assert_eq!(staging_destination("readme.md"), None);
    }

    // ── upload_file_type ────────────────────
    #[test]
    fn upload_types_by_extension() {
        assert_eq!(upload_file_type("a.CFG"), UploadFileType::Cfg);
        assert_eq!(upload_file_type("b.txt"), UploadFileType::Txt);
        assert_eq!(upload_file_type("c.zip"), UploadFileType::Unsupported);
        assert!(is_allowed_upload_file("x.cfg"));
        assert!(is_allowed_upload_file("x.txt"));
        assert!(!is_allowed_upload_file("x.md"));
    }

    // ── plan_staging ────────────────────────
    #[test]
    fn plan_counts_categories() {
        let files = [
            "autoexec.cfg".to_string(),
            "annotations/local/dust2.txt".to_string(),
            "cs2_video.txt".to_string(),
            "config.vcfg".to_string(),
            "config.vcfg_lastclouded".to_string(),
            "readme.md".to_string(),
        ];
        let plan = plan_staging(&files);
        assert_eq!(plan.cfg_count(), 1);
        assert_eq!(plan.annotations_count(), 1);
        assert_eq!(plan.video_count, 1);
        assert_eq!(plan.blocked_vcfg_count, 2);
        assert_eq!(plan.unsupported_count, 1);
    }

    // ── timestamp folders ───────────────────
    #[test]
    fn timestamp_folder_validation() {
        assert!(is_timestamp_folder("2026-08-04-0001"));
        assert!(is_timestamp_folder("2026-12-31-9999"));
        assert!(!is_timestamp_folder("2026-8-4-1"));
        assert!(!is_timestamp_folder("2026-08-04-000a"));
        assert!(!is_timestamp_folder("random"));
    }

    #[test]
    fn next_folder_sequence() {
        let existing = vec!["2026-08-04-0001".to_string(), "2026-08-04-0003".to_string()];
        assert_eq!(next_timestamp_folder(&existing, "2026-08-04"), "2026-08-04-0004");
        assert_eq!(next_timestamp_folder(&[], "2026-08-04"), "2026-08-04-0001");
        // 其他日期的目录不参与序号计算
        let other = vec!["2026-08-03-0009".to_string()];
        assert_eq!(next_timestamp_folder(&other, "2026-08-04"), "2026-08-04-0001");
    }

    #[test]
    fn limit_removes_oldest() {
        let names = vec![
            "2026-08-01-0001".to_string(),
            "2026-08-02-0002".to_string(),
            "2026-08-03-0003".to_string(),
            "2026-08-04-0004".to_string(),
            "2026-08-05-0005".to_string(),
        ];
        // TS 语义：while len >= max → 删到 max-1
        assert_eq!(folders_to_remove(&names, 5), vec!["2026-08-01-0001".to_string()]);
        assert_eq!(folders_to_remove(&names, 6), Vec::<String>::new());
        // 非时间戳目录不参与；唯一时间戳目录在 max=1 时被删（TS `while len >= max` 语义）
        let mixed = vec!["keep".to_string(), "2026-08-01-0001".to_string()];
        assert_eq!(folders_to_remove(&mixed, 1), vec!["2026-08-01-0001".to_string()]);
    }

    // ── executable_line / exec_target ───────
    #[test]
    fn strips_inline_comments() {
        assert_eq!(executable_line("  exec foo // 注释"), "exec foo");
        assert_eq!(executable_line("// 整行注释"), "");
        assert_eq!(executable_line("   "), "");
    }

    #[test]
    fn parses_exec_targets() {
        assert_eq!(exec_target("exec srpcfg/runtime.cfg"), Some("srpcfg/runtime.cfg".to_string()));
        assert_eq!(exec_target("execifexists user/custom.cfg"), Some("user/custom.cfg".to_string()));
        assert_eq!(exec_target("exec \"quoted/path.cfg\""), Some("quoted/path.cfg".to_string()));
        // 无 .cfg 后缀自动补
        assert_eq!(exec_target("exec srpcfg/init"), Some("srpcfg/init.cfg".to_string()));
        // 反斜杠归一化
        assert_eq!(exec_target("exec srpcfg\\init"), Some("srpcfg/init.cfg".to_string()));
        // 大小写不敏感前缀
        assert_eq!(exec_target("EXEC foo.cfg"), Some("foo.cfg".to_string()));
        assert_eq!(exec_target("ExecIfExists foo.cfg"), Some("foo.cfg".to_string()));
    }

    #[test]
    fn rejects_invalid_exec_targets() {
        assert_eq!(exec_target("exec"), None);
        assert_eq!(exec_target("exec foo bar"), None); // 目标后有多余内容
        assert_eq!(exec_target("exec \"unclosed"), None);
        assert_eq!(exec_target("exec foo$bar.cfg"), None); // 非法字符
        assert_eq!(exec_target("bind x +forward"), None); // 非 exec 语句
        assert_eq!(exec_target(""), None);
    }

    // ── is_runtime_registration_only ────────
    #[test]
    fn pure_runtime_registration_detected() {
        let files = map(&[
            ("autoexec.cfg", "exec srpcfg/runtime.cfg\n// SrP-CFG Runtime\n"),
            ("srpcfg/runtime.cfg", "alias srp_reload exec srpcfg/reload.cfg\necho SrP-CFG loaded\necholn OK\n"),
            ("srpcfg/reload.cfg", "alias srp_reset_valve exec srpcfg/reset.cfg\n"),
        ]);
        assert!(is_runtime_registration_only(&files));
    }

    #[test]
    fn runtime_with_binding_is_custom() {
        let files = map(&[
            ("autoexec.cfg", "exec srpcfg/runtime.cfg\n"),
            ("srpcfg/runtime.cfg", "bind p \"say hello\"\n"),
        ]);
        assert!(!is_runtime_registration_only(&files));
    }

    #[test]
    fn missing_autoexec_vacuously_registration_only() {
        // BFS 找不到 autoexec.cfg → 空转返回 true；是否判为 runtime-core 由
        // inspect_cfg_files 的 `contains_key("autoexec.cfg")` 条件把关
        let files = map(&[("srpcfg/runtime.cfg", "alias x y\n")]);
        assert!(is_runtime_registration_only(&files));
    }

    #[test]
    fn exec_cycle_does_not_hang() {
        let files = map(&[
            ("autoexec.cfg", "exec a.cfg\n"),
            ("a.cfg", "exec b.cfg\n"),
            ("b.cfg", "exec a.cfg\n"),
        ]);
        assert!(is_runtime_registration_only(&files));
    }

    // ── inspect_cfg_files ───────────────────
    #[test]
    fn inspect_kinds() {
        assert_eq!(
            inspect_cfg_files(&HashMap::new()),
            ConfigImpact { kind: StagedConfigKind::Empty, cfg_count: 0 }
        );
        let custom = map(&[("autoexec.cfg", "cl_crosshair_size 3\n")]);
        assert_eq!(
            inspect_cfg_files(&custom),
            ConfigImpact { kind: StagedConfigKind::Custom, cfg_count: 1 }
        );
        let runtime = map(&[("autoexec.cfg", "exec runtime.cfg\n"), ("runtime.cfg", "alias srp_reload srp_reload\n")]);
        assert_eq!(
            inspect_cfg_files(&runtime),
            ConfigImpact { kind: StagedConfigKind::RuntimeCore, cfg_count: 2 }
        );
    }
}
