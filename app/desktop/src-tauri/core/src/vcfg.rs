//! VCFG / CFG 解析与快照生成（纯逻辑）。
//!
//! 对应原 `app/desktop/src/main/services/vcfg.ts` 的纯计算部分。
//! 文件 I/O 由壳层负责，本模块只处理字符串与数据结构。

use std::collections::HashMap;

// ─────────────────────────────────────────────
// VDF (KeyValues) 解析
// ─────────────────────────────────────────────

#[derive(Debug, Clone, PartialEq)]
pub enum VdfValue {
    Str(String),
    Node(VdfNode),
}

pub type VdfNode = HashMap<String, VdfValue>;

/// 与 TS `tokenize` 行为一致：
/// - 空白跳过；`//` 行注释；`{`/`}` 单字符 token
/// - 双引号字符串**不做转义处理**（CS2 生成的 KeyValues 使用字面反斜杠键）
/// - 其他字符直接跳过（忽略非法字符）
pub fn tokenize(content: &str) -> Vec<String> {
    let chars: Vec<char> = content.chars().collect();
    let n = chars.len();
    let mut tokens: Vec<String> = Vec::new();
    let mut i = 0;

    while i < n {
        let c = chars[i];
        if c.is_whitespace() {
            i += 1;
            continue;
        }
        if c == '/' && chars.get(i + 1) == Some(&'/') {
            while i < n && chars[i] != '\n' {
                i += 1;
            }
            continue;
        }
        if c == '{' || c == '}' {
            tokens.push(c.to_string());
            i += 1;
            continue;
        }
        if c != '"' {
            i += 1;
            continue;
        }

        i += 1; // 跳过左引号
        let mut value = String::new();
        while i < n {
            let cur = chars[i];
            i += 1;
            if cur == '"' {
                break;
            }
            value.push(cur);
        }
        tokens.push(value);
    }

    tokens
}

fn parse_node(tokens: &[String], cursor: &mut usize) -> VdfNode {
    let mut node = VdfNode::new();
    while *cursor < tokens.len() {
        let key = tokens[*cursor].clone();
        *cursor += 1;
        if key == "}" {
            break;
        }
        if *cursor >= tokens.len() {
            break;
        }
        let value = tokens[*cursor].clone();
        *cursor += 1;
        if value == "{" {
            node.insert(key, VdfValue::Node(parse_node(tokens, cursor)));
        } else {
            node.insert(key, VdfValue::Str(value));
        }
    }
    node
}

/// 解析完整 VDF 文档，返回 `{ root_key: <node> }`（与 TS `parseVcfg` 一致）。
pub fn parse_vdf(content: &str) -> Option<VdfNode> {
    let tokens = tokenize(content);
    let root_key = tokens.first()?.clone();
    if tokens.get(1) != Some(&"{".to_string()) {
        return None;
    }
    let mut cursor = 2;
    let mut root = VdfNode::new();
    root.insert(root_key, VdfValue::Node(parse_node(&tokens, &mut cursor)));
    Some(root)
}

/// 沿 key 路径取子节点；任一环节缺失或为字符串值则返回 None。
pub fn child<'a>(node: &'a VdfNode, keys: &[&str]) -> Option<&'a VdfNode> {
    let mut current: Option<&VdfNode> = Some(node);
    for key in keys {
        let n = current?;
        current = match n.get(*key) {
            Some(VdfValue::Node(child_node)) => Some(child_node),
            _ => None,
        };
    }
    current
}

/// 节点中所有字符串值条目（键名排序，保证输出稳定）。
pub fn string_entries(node: &VdfNode) -> Vec<(String, String)> {
    let mut entries: Vec<(String, String)> = node
        .iter()
        .filter_map(|(k, v)| match v {
            VdfValue::Str(s) => Some((k.clone(), s.clone())),
            VdfValue::Node(_) => None,
        })
        .collect();
    entries.sort_by(|a, b| a.0.cmp(&b.0));
    entries
}

pub fn count_entries(node: &VdfNode) -> usize {
    node.len()
}

// ─────────────────────────────────────────────
// CFG ConVar 解析
// ─────────────────────────────────────────────

/// 解析单行：`name "quoted value"` 或 `name bare_value`。
/// 无匹配（含多余空白 token）返回 None，与 TS 正则 `^(\S+)\s+(?:"([^"]*)"|(\S+))$` 行为一致。
fn parse_cfg_convar_line(line: &str) -> Option<(String, String)> {
    let trimmed = line.trim();
    if trimmed.is_empty() {
        return None;
    }
    let first_ws = trimmed.find(char::is_whitespace)?;
    let name = &trimmed[..first_ws];
    let rest = trimmed[first_ws..].trim_start();

    let value = if rest.starts_with('"') {
        rest.strip_suffix('"')?.get(1..)?.to_string()
    } else {
        if rest.contains(char::is_whitespace) {
            return None;
        }
        rest.to_string()
    };
    Some((name.to_string(), value))
}

/// 判断行首是否为需要跳过的 CFG 指令（echo/exec/bind/binddefaults/firstperson，大小写不敏感，词边界）。
fn is_cfg_directive(code: &str) -> bool {
    const DIRECTIVES: [&str; 5] = ["echo", "exec", "bind", "binddefaults", "firstperson"];
    let lower = code.to_ascii_lowercase();
    DIRECTIVES.iter().any(|d| {
        lower.starts_with(d)
            && lower[d.len()..]
                .chars()
                .next()
                .is_none_or(|c| !(c.is_alphanumeric() || c == '_'))
    })
}

pub fn parse_cfg_convars(content: &str) -> Vec<(String, String)> {
    let mut result = Vec::new();
    for raw in content.lines() {
        let comment_idx = raw.find("//").unwrap_or(raw.len());
        let code = raw[..comment_idx].trim();
        if code.is_empty() {
            continue;
        }
        if is_cfg_directive(code) {
            continue;
        }
        if let Some((name, value)) = parse_cfg_convar_line(code) {
            result.push((name, value));
        }
    }
    result
}

/// 规范化布尔字面量："true"/"True" → "1"，"false"/"False" → "0"。
pub fn normalize_cfg_value(v: &str) -> &str {
    match v {
        "true" | "True" => "1",
        "false" | "False" => "0",
        _ => v,
    }
}

// ─────────────────────────────────────────────
// Snapshot → CFG
// ─────────────────────────────────────────────

pub struct SnapshotToCfgOptions {
    pub bindings: bool,
    pub analog_bindings: bool,
    pub user_convars: bool,
    pub machine_convars: bool,
}

/// 将 VCFG 快照转成 CFG 文本，按类别过滤。
/// ConVars 与 Valve baseline 对比，仅输出非默认值（规范化后比较）。
/// 键按字典序排序（ASCII 场景下与 TS `localeCompare` 一致）。
pub fn snapshot_to_cfg(
    bindings: &[(String, String)],
    analog_bindings: &[(String, String)],
    user_convars: &[(String, String)],
    machine_convars: &[(String, String)],
    options: &SnapshotToCfgOptions,
    baseline: &HashMap<String, String>,
) -> String {
    let mut sections: Vec<String> = Vec::new();

    if options.bindings && !bindings.is_empty() {
        sections.push("// ── 按键绑定 ──".to_string());
        let mut sorted = bindings.to_vec();
        sorted.sort_by(|a, b| a.0.cmp(&b.0));
        for (key, cmd) in sorted {
            sections.push(format!("bind \"{key}\" \"{cmd}\""));
        }
    }

    if options.analog_bindings && !analog_bindings.is_empty() {
        sections.push("// ── 模拟轴绑定 ──".to_string());
        let mut sorted = analog_bindings.to_vec();
        sorted.sort_by(|a, b| a.0.cmp(&b.0));
        for (axis, cmd) in sorted {
            sections.push(format!("bind \"{axis}\" \"{cmd}\""));
        }
    }

    if options.user_convars {
        let mut filtered: Vec<(String, String)> = user_convars
            .iter()
            .filter(|(name, value)| match baseline.get(name) {
                Some(def) => normalize_cfg_value(def) != normalize_cfg_value(value),
                None => true,
            })
            .cloned()
            .collect();
        filtered.sort_by(|a, b| a.0.cmp(&b.0));
        if !filtered.is_empty() {
            sections.push("// ── 个人偏好设置（仅与 Valve 默认值不同的项）──".to_string());
            for (convar, value) in filtered {
                if value.contains(' ') {
                    sections.push(format!("{convar} \"{value}\""));
                } else {
                    sections.push(format!("{convar} {value}"));
                }
            }
        }
    }

    if options.machine_convars {
        let mut filtered: Vec<(String, String)> = machine_convars
            .iter()
            .filter(|(name, value)| match baseline.get(name) {
                Some(def) => normalize_cfg_value(def) != normalize_cfg_value(value),
                None => true,
            })
            .cloned()
            .collect();
        filtered.sort_by(|a, b| a.0.cmp(&b.0));
        if !filtered.is_empty() {
            sections.push("// ── 机器设置（仅与 Valve 默认值不同的项）──".to_string());
            for (convar, value) in filtered {
                if value.contains(' ') {
                    sections.push(format!("{convar} \"{value}\""));
                } else {
                    sections.push(format!("{convar} {value}"));
                }
            }
        }
    }

    sections.join("\n")
}

// ─────────────────────────────────────────────
// 测试
// ─────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    // ── tokenize ──
    #[test]
    fn tokenize_handles_quotes_comments_braces() {
        let input = "\"root\"\n{\n  // comment\n  \"key\" \"value\"\n  \"nested\" { \"a\" \"b\" }\n}";
        let tokens = tokenize(input);
        assert_eq!(
            tokens,
            vec![
                "root".to_string(),
                "{".to_string(),
                "key".to_string(),
                "value".to_string(),
                "nested".to_string(),
                "{".to_string(),
                "a".to_string(),
                "b".to_string(),
                "}".to_string(),
                "}".to_string(),
            ]
        );
    }

    #[test]
    fn tokenize_keeps_literal_backslash_key() {
        // CS2 生成的 KeyValues 使用字面反斜杠键 "\"；不做转义
        let content = "\"config\" { \"\\\" \"1\" }";
        let tokens = tokenize(content);
        assert!(tokens.contains(&"\\".to_string()));
    }

    // ── parse_vdf / child ──
    #[test]
    fn parse_vdf_builds_nested_tree() {
        let content = "\"config\"\n{\n  \"bindings\" { \"j\" \"say hi\" }\n  \"convars\" { \"fps_max\" \"0\" }\n}";
        let root = parse_vdf(content).expect("should parse");
        let bindings = child(&root, &["config", "bindings"]).expect("bindings node");
        let entries = string_entries(bindings);
        assert_eq!(entries, vec![("j".to_string(), "say hi".to_string())]);
    }

    #[test]
    fn child_returns_none_for_missing_or_string_path() {
        let content = "\"config\" { \"bindings\" { \"j\" \"x\" } }";
        let root = parse_vdf(content).unwrap();
        assert!(child(&root, &["config", "nope"]).is_none());
        assert!(child(&root, &["config", "bindings", "j"]).is_none()); // "j" 是字符串
    }

    #[test]
    fn string_entries_sorts_and_excludes_nodes() {
        let content = "\"config\" { \"b\" \"2\" \"a\" \"1\" \"nested\" { } }";
        let root = parse_vdf(content).unwrap();
        let entries = string_entries(child(&root, &["config"]).unwrap());
        assert_eq!(
            entries,
            vec![("a".to_string(), "1".to_string()), ("b".to_string(), "2".to_string())]
        );
    }

    #[test]
    fn parse_vdf_rejects_missing_root_brace() {
        assert!(parse_vdf("\"root\" \"not-a-brace\"").is_none());
    }

    // ── parse_cfg_convars ──
    #[test]
    fn cfg_convars_skips_comments_and_directives() {
        let content = "\
// 顶部注释
fps_max 0
cl_crosshairsize 3.5
bind \"j\" \"say_team hello\"
exec other.cfg
echo loading
sens \"2.5\"
name \"with space\"";
        let convars = parse_cfg_convars(content);
        let map: HashMap<String, String> = convars.into_iter().collect();
        assert_eq!(map.get("fps_max"), Some(&"0".to_string()));
        assert_eq!(map.get("cl_crosshairsize"), Some(&"3.5".to_string()));
        assert_eq!(map.get("sens"), Some(&"2.5".to_string()));
        assert_eq!(map.get("name"), Some(&"with space".to_string()));
        assert!(!map.contains_key("bind"));
        assert!(!map.contains_key("exec"));
        assert!(!map.contains_key("echo"));
        assert_eq!(map.len(), 4);
    }

    #[test]
    fn cfg_convars_directive_check_is_case_insensitive() {
        let content = "BIND \"x\" \"y\"\nExec foo.cfg\n";
        assert!(parse_cfg_convars(content).is_empty());
    }

    #[test]
    fn cfg_convars_inline_comment_stripped() {
        let content = "fps_max 144 // 帧率上限\n";
        let convars = parse_cfg_convars(content);
        assert_eq!(convars, vec![("fps_max".to_string(), "144".to_string())]);
    }

    // ── normalize ──
    #[test]
    fn normalize_boolean_literals() {
        assert_eq!(normalize_cfg_value("true"), "1");
        assert_eq!(normalize_cfg_value("True"), "1");
        assert_eq!(normalize_cfg_value("false"), "0");
        assert_eq!(normalize_cfg_value("False"), "0");
        assert_eq!(normalize_cfg_value("3.5"), "3.5");
    }

    // ── snapshot_to_cfg ──
    fn kvs(pairs: &[(&str, &str)]) -> Vec<(String, String)> {
        pairs
            .iter()
            .map(|(k, v)| (k.to_string(), v.to_string()))
            .collect()
    }

    #[test]
    fn snapshot_bindings_sorted_and_quoted() {
        let out = snapshot_to_cfg(
            &kvs(&[("j", "say hi"), ("a", "b")]),
            &[],
            &[],
            &[],
            &SnapshotToCfgOptions {
                bindings: true,
                analog_bindings: false,
                user_convars: false,
                machine_convars: false,
            },
            &HashMap::new(),
        );
        assert_eq!(
            out,
            "// ── 按键绑定 ──\nbind \"a\" \"b\"\nbind \"j\" \"say hi\""
        );
    }

    #[test]
    fn snapshot_convars_filtered_by_baseline() {
        let mut baseline = HashMap::new();
        baseline.insert("fps_max".to_string(), "0".to_string());
        baseline.insert("sv_cheats".to_string(), "0".to_string());

        let out = snapshot_to_cfg(
            &[],
            &[],
            &kvs(&[
                ("fps_max", "0"),     // 默认值 → 过滤
                ("sv_cheats", "true"), // true→1 vs baseline 0 → 保留
                ("cl_grenade_trail", "1"),
            ]),
            &[],
            &SnapshotToCfgOptions {
                bindings: false,
                analog_bindings: false,
                user_convars: true,
                machine_convars: false,
            },
            &baseline,
        );
        assert_eq!(
            out,
            "// ── 个人偏好设置（仅与 Valve 默认值不同的项）──\ncl_grenade_trail 1\nsv_cheats true"
        );
    }

    #[test]
    fn snapshot_convar_value_with_space_is_quoted() {
        let out = snapshot_to_cfg(
            &[],
            &[],
            &kvs(&[("name", "with space")]),
            &[],
            &SnapshotToCfgOptions {
                bindings: false,
                analog_bindings: false,
                user_convars: true,
                machine_convars: false,
            },
            &HashMap::new(),
        );
        assert_eq!(out, "// ── 个人偏好设置（仅与 Valve 默认值不同的项）──\nname \"with space\"");
    }

    #[test]
    fn snapshot_all_sections_ordered() {
        let out = snapshot_to_cfg(
            &kvs(&[("j", "x")]),
            &kvs(&[("joy_x", "y")]),
            &kvs(&[("cl_foo", "1")]),
            &kvs(&[("r_bar", "2")]),
            &SnapshotToCfgOptions {
                bindings: true,
                analog_bindings: true,
                user_convars: true,
                machine_convars: true,
            },
            &HashMap::new(),
        );
        let lines: Vec<&str> = out.lines().collect();
        assert!(lines[0].contains("按键绑定"));
        assert!(lines[2].contains("模拟轴绑定"));
        assert!(lines[4].contains("个人偏好"));
        assert!(lines[6].contains("机器设置"));
        assert_eq!(lines.len(), 8);
    }
}
