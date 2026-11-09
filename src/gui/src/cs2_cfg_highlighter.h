#pragma once

#include <QSyntaxHighlighter>
#include <QTextCharFormat>
#include <QRegularExpression>
#include <QQuickTextDocument>
#include <vector>

class Cs2CfgHighlighter : public QSyntaxHighlighter {
    Q_OBJECT

public:
    explicit Cs2CfgHighlighter(QTextDocument* parent = nullptr);

    void setDarkTheme(bool isDark);
    void setStructuredMode(bool enabled);

protected:
    void highlightBlock(const QString& text) override;

private:
    void setupRules();

    struct HighlightingRule {
        QRegularExpression pattern;
        QTextCharFormat format;
    };

    std::vector<HighlightingRule> m_rules;
    QRegularExpression m_commentRegex;
    QTextCharFormat m_commentFormat;

    bool m_isDark = true;
    bool m_structured = false;
};
