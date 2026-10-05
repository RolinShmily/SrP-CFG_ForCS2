#include "code_editor_gutter.h"
#include <QPainter>
#include <QTextBlock>
#include <QTextLayout>
#include <QTextDocument>

CodeEditorGutter::CodeEditorGutter(QQuickItem* parent)
    : QQuickPaintedItem(parent) {
    setAntialiasing(true);
}

void CodeEditorGutter::setEditor(QQuickItem* item) {
    if (m_editor == item) return;
    m_editor = item;
    connectDocument();
    emit editorChanged();
    update();
}

void CodeEditorGutter::setScrollY(qreal y) {
    if (qFuzzyCompare(m_scrollY, y)) return;
    m_scrollY = y;
    emit scrollYChanged();
    update();
}

void CodeEditorGutter::setTextColor(const QColor& c) {
    if (m_textColor == c) return;
    m_textColor = c;
    emit textColorChanged();
    update();
}

void CodeEditorGutter::setBackgroundColor(const QColor& c) {
    if (m_backgroundColor == c) return;
    m_backgroundColor = c;
    emit backgroundColorChanged();
    update();
}

void CodeEditorGutter::setBorderColor(const QColor& c) {
    if (m_borderColor == c) return;
    m_borderColor = c;
    emit borderColorChanged();
    update();
}

void CodeEditorGutter::connectDocument() {
    if (!m_editor) return;
    QVariant docProp = m_editor->property("textDocument");
    if (!docProp.isValid()) return;
    auto* quickDoc = docProp.value<QQuickTextDocument*>();
    if (!quickDoc) return;
    auto* doc = quickDoc->textDocument();
    if (!doc) return;

    connect(doc, &QTextDocument::contentsChanged, this, [this]() {
        update();
    });
}

void CodeEditorGutter::paint(QPainter* painter) {
    painter->save();

    // 绘制背景
    if (m_backgroundColor.alpha() > 0) {
        painter->fillRect(boundingRect(), m_backgroundColor);
    }

    // 绘制右边框分割线
    if (m_borderColor.alpha() > 0) {
        painter->setPen(m_borderColor);
        painter->drawLine(QPointF(width() - 1, 0), QPointF(width() - 1, height()));
    }

    if (!m_editor) {
        painter->restore();
        return;
    }

    QVariant docProp = m_editor->property("textDocument");
    if (!docProp.isValid()) {
        painter->restore();
        return;
    }
    auto* quickDoc = docProp.value<QQuickTextDocument*>();
    if (!quickDoc) {
        painter->restore();
        return;
    }
    auto* doc = quickDoc->textDocument();
    if (!doc) {
        painter->restore();
        return;
    }

    qreal topPadding = m_editor->property("topPadding").toReal();
    QFont font = m_editor->property("font").value<QFont>();
    painter->setFont(font);
    painter->setPen(m_textColor);

    const qreal viewH = height();
    const qreal rightMargin = 8.0;
    const qreal textW = width() - rightMargin;

    // 遍历每一个物理 QTextBlock 渲染行号
    for (QTextBlock block = doc->begin(); block.isValid(); block = block.next()) {
        QTextLayout* layout = block.layout();
        if (!layout) continue;

        qreal blockY = layout->position().y() + topPadding - m_scrollY;
        qreal blockH = layout->boundingRect().height();

        // 仅在可视区域内绘制
        if (blockY + blockH >= 0 && blockY <= viewH) {
            QString numStr = QString::number(block.blockNumber() + 1);
            painter->drawText(QRectF(0, blockY, textW, blockH),
                              Qt::AlignRight | Qt::AlignTop,
                              numStr);
        }

        // 超出可视区下方直接截断循环，提升千万行性能
        if (blockY > viewH + 100) {
            break;
        }
    }

    painter->restore();
}
