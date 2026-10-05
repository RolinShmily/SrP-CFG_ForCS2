#include "code_editor_gutter.h"
#include <QPainter>
#include <QTextBlock>
#include <QTextLayout>
#include <QTextDocument>
#include <QWheelEvent>

CodeEditorGutter::CodeEditorGutter(QQuickItem* parent)
    : QQuickPaintedItem(parent) {
    setAntialiasing(true);
    connect(this, &QQuickItem::windowChanged, this, [this](QQuickWindow* window) {
        if (m_wheelWindow) m_wheelWindow->removeEventFilter(this);
        m_wheelWindow = window;
        if (window) window->installEventFilter(this);
    });
    connect(this, &QQuickItem::heightChanged, this, &CodeEditorGutter::requestRedraw);
    connect(this, &QQuickItem::widthChanged, this, &CodeEditorGutter::requestRedraw);
}

bool CodeEditorGutter::eventFilter(QObject* watched, QEvent* event) {
    if (watched == m_wheelWindow && event->type() == QEvent::Wheel && isVisible() && isEnabled() && parentItem()) {
        auto* wheel = static_cast<QWheelEvent*>(event);
        const QPointF local = parentItem()->mapFromScene(wheel->position());
        if (parentItem()->contains(local)) {
            if (wheel->modifiers().testFlag(Qt::ControlModifier)) {
                const int delta = wheel->angleDelta().y();
                if (delta) emit zoomRequested(delta > 0 ? 1 : -1);
            } else {
                QPointF delta = wheel->pixelDelta();
                if (delta.isNull()) {
                    const qreal step = m_editor ? m_editor->property("font").value<QFont>().pixelSize() * 6.0 : 72.0;
                    delta = QPointF(wheel->angleDelta()) * (step / 120.0);
                }
                if (wheel->modifiers().testFlag(Qt::ShiftModifier)) delta = QPointF(delta.y(), delta.x());
                emit scrollRequested(-delta.x(), -delta.y());
            }
            wheel->accept();
            return true;
        }
    }
    return QQuickPaintedItem::eventFilter(watched, event);
}

void CodeEditorGutter::setEditor(QQuickItem* item) {
    if (m_editor == item) return;
    for (const auto& connection : m_connections) disconnect(connection);
    m_connections.clear();
    m_editor = item;
    connectDocument();
    emit editorChanged();
    requestRedraw();
}

void CodeEditorGutter::setScrollY(qreal y) {
    if (qFuzzyCompare(m_scrollY, y)) return;
    m_scrollY = y;
    emit scrollYChanged();
    requestRedraw();
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

    m_connections.append(connect(doc, &QTextDocument::contentsChanged, this, &CodeEditorGutter::requestRedraw));
    m_connections.append(connect(m_editor.data(), &QQuickItem::widthChanged, this, &CodeEditorGutter::requestRedraw));
    m_connections.append(connect(m_editor.data(), &QQuickItem::heightChanged, this, &CodeEditorGutter::requestRedraw));
}

void CodeEditorGutter::updatePolish() {
    // QTextDocument may trigger layout/timers on access. Read it on the GUI thread,
    // then let the render thread paint only this geometry snapshot.
    m_lines.clear();
    if (!m_editor) return;
    auto* quickDoc = m_editor->property("textDocument").value<QQuickTextDocument*>();
    if (!quickDoc || !quickDoc->textDocument()) return;
    auto* doc = quickDoc->textDocument();
    const qreal padding = m_editor->property("topPadding").toReal();
    m_font = m_editor->property("font").value<QFont>();
    for (QTextBlock block = doc->begin(); block.isValid(); block = block.next()) {
        auto* layout = block.layout();
        if (!layout) continue;
        const qreal y = layout->position().y() + padding - m_scrollY;
        const qreal h = layout->boundingRect().height();
        if (y > height()) break;
        if (y + h >= 0) m_lines.append({block.blockNumber() + 1, y, h});
    }
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

    painter->setFont(m_font);
    painter->setPen(m_textColor);
    for (const auto& line : m_lines) {
        painter->drawText(QRectF(0, line.y, width() - 8.0, line.height),
                          Qt::AlignRight | Qt::AlignTop, QString::number(line.number));
    }

    painter->restore();
}
