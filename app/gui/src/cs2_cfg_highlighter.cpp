#include "cs2_cfg_highlighter.h"

Cs2CfgHighlighter::Cs2CfgHighlighter(QTextDocument* parent)
    : QSyntaxHighlighter(parent) {
    setupRules();
}

void Cs2CfgHighlighter::setDarkTheme(bool isDark) {
    if (m_isDark != isDark) {
        m_isDark = isDark;
        setupRules();
        rehighlight();
    }
}

void Cs2CfgHighlighter::setupRules() {
    m_rules.clear();

    // 1. 核心命令关键字 (alias, bind, unbind, exec, echo 等)
    QTextCharFormat keywordFormat;
    keywordFormat.setForeground(m_isDark ? QColor("#c084fc") : QColor("#7e22ce"));
    keywordFormat.setFontWeight(QFont::Bold);

    const QStringList keywordPatterns = {
        QStringLiteral("\\b(alias|bind|unbind|unbindall|exec|exec_async|exec_async_wait|execifexists|echo|echoln|setinfo|quit|say|say_team)\\b")
    };
    for (const auto& pattern : keywordPatterns) {
        HighlightingRule rule;
        rule.pattern = QRegularExpression(pattern, QRegularExpression::CaseInsensitiveOption);
        rule.format = keywordFormat;
        m_rules.push_back(rule);
    }

    // 2. Actions 动作命令 (+attack, +jump, +duck, -forward 等)
    QTextCharFormat actionFormat;
    actionFormat.setForeground(m_isDark ? QColor("#38bdf8") : QColor("#0284c7"));
    actionFormat.setFontWeight(QFont::DemiBold);

    HighlightingRule actionRule;
    actionRule.pattern = QRegularExpression(
        QStringLiteral("([\\+\\-](attack|attack2|back|duck|forward|jump|klook|left|lookatweapon|movedown|moveup|reload|right|showscores|sprint|strafe|turndown|turnleft|turnright|turnup|use|zoom|radialradio\\d?|quickbuyradial|quickgearradial|quickgrenaderadial|quickinv|spray_menu))\\b"),
        QRegularExpression::CaseInsensitiveOption
    );
    actionRule.format = actionFormat;
    m_rules.push_back(actionRule);

    // 3. Convar 常用参数变量 (cl_*, sv_*, fps_*, sensitivity, volume 等)
    QTextCharFormat convarFormat;
    convarFormat.setForeground(m_isDark ? QColor("#fde047") : QColor("#b45309"));

    HighlightingRule convarRule;
    convarRule.pattern = QRegularExpression(
        QStringLiteral("\\b(cl_|sv_|fps_|m_|sensitivity|volume|viewmodel_|hud_|r_|net_|safezone|voice_|snd_)[a-zA-Z0-9_]*\\b"),
        QRegularExpression::CaseInsensitiveOption
    );
    convarRule.format = convarFormat;
    m_rules.push_back(convarRule);

    // 4. 数字字面量 (0, 1, 1.25, -0.5 等)
    QTextCharFormat numberFormat;
    numberFormat.setForeground(m_isDark ? QColor("#fb923c") : QColor("#ea580c"));

    HighlightingRule numberRule;
    numberRule.pattern = QRegularExpression(QStringLiteral("\\b[+-]?\\d+(\\.\\d+)?([eE][+-]?\\d+)?\\b"));
    numberRule.format = numberFormat;
    m_rules.push_back(numberRule);

    // 5. 分号语句终止符
    QTextCharFormat semicolonFormat;
    semicolonFormat.setForeground(m_isDark ? QColor("#f87171") : QColor("#dc2626"));
    semicolonFormat.setFontWeight(QFont::Bold);

    HighlightingRule semicolonRule;
    semicolonRule.pattern = QRegularExpression(QStringLiteral(";"));
    semicolonRule.format = semicolonFormat;
    m_rules.push_back(semicolonRule);

    // 6. 双引号字符串 ("...")
    QTextCharFormat stringFormat;
    stringFormat.setForeground(m_isDark ? QColor("#4ade80") : QColor("#15803d"));

    HighlightingRule stringRule;
    stringRule.pattern = QRegularExpression(QStringLiteral("\"([^\"\\\\]|\\\\.)*\""));
    stringRule.format = stringFormat;
    m_rules.push_back(stringRule);

    // 7. 单行注释 (// 开头，高优先级，覆盖整行末尾)
    m_commentFormat.setForeground(m_isDark ? QColor("#71717a") : QColor("#64748b"));
    m_commentFormat.setFontItalic(true);
    m_commentRegex = QRegularExpression(QStringLiteral("//[^\r\n]*"));
}

void Cs2CfgHighlighter::highlightBlock(const QString& text) {
    // 应用常规语法规则
    for (const auto& rule : m_rules) {
        auto matchIterator = rule.pattern.globalMatch(text);
        while (matchIterator.hasNext()) {
            auto match = matchIterator.next();
            setFormat(match.capturedStart(), match.capturedLength(), rule.format);
        }
    }

    // 单行注释覆盖在其上 (保证注释内字符串/数字不高亮)
    auto commentIterator = m_commentRegex.globalMatch(text);
    while (commentIterator.hasNext()) {
        auto match = commentIterator.next();
        setFormat(match.capturedStart(), match.capturedLength(), m_commentFormat);
    }
}
