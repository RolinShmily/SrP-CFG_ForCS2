#pragma once

#include <QQuickPaintedItem>
#include <QQuickTextDocument>
#include <QColor>
#include <QFont>
#include <QPointer>
#include <QVector>

class CodeEditorGutter : public QQuickPaintedItem {
    Q_OBJECT
    Q_PROPERTY(QQuickItem* editor READ editor WRITE setEditor NOTIFY editorChanged)
    Q_PROPERTY(qreal scrollY READ scrollY WRITE setScrollY NOTIFY scrollYChanged)
    Q_PROPERTY(QColor textColor READ textColor WRITE setTextColor NOTIFY textColorChanged)
    Q_PROPERTY(QColor backgroundColor READ backgroundColor WRITE setBackgroundColor NOTIFY backgroundColorChanged)
    Q_PROPERTY(QColor borderColor READ borderColor WRITE setBorderColor NOTIFY borderColorChanged)

public:
    explicit CodeEditorGutter(QQuickItem* parent = nullptr);

    QQuickItem* editor() const { return m_editor; }
    void setEditor(QQuickItem* item);

    qreal scrollY() const { return m_scrollY; }
    void setScrollY(qreal y);

    QColor textColor() const { return m_textColor; }
    void setTextColor(const QColor& c);

    QColor backgroundColor() const { return m_backgroundColor; }
    void setBackgroundColor(const QColor& c);

    QColor borderColor() const { return m_borderColor; }
    void setBorderColor(const QColor& c);

    void paint(QPainter* painter) override;

    Q_INVOKABLE void requestRedraw() { polish(); update(); }

protected:
    void updatePolish() override;

signals:
    void editorChanged();
    void scrollYChanged();
    void textColorChanged();
    void backgroundColorChanged();
    void borderColorChanged();

private:
    void connectDocument();

    QPointer<QQuickItem> m_editor;
    struct LineNumber { int number; qreal y; qreal height; };
    QVector<LineNumber> m_lines;
    QVector<QMetaObject::Connection> m_connections;
    QFont m_font;
    qreal m_scrollY = 0;
    QColor m_textColor = QColor("#8c8c8c");
    QColor m_backgroundColor = QColor("transparent");
    QColor m_borderColor = QColor("#303030");
};
