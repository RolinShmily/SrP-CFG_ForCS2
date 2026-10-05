#pragma once
#include <QObject>
#include <QStringList>
#include <QVariantList>
#include <QFont>
class PreferencesController : public QObject {
    Q_OBJECT
    Q_PROPERTY(QString language READ language NOTIFY preferencesChanged)
    Q_PROPERTY(QString fontFamily READ fontFamily NOTIFY preferencesChanged)
    Q_PROPERTY(QString effectiveFontFamily READ effectiveFontFamily NOTIFY preferencesChanged)
    Q_PROPERTY(QStringList fontFamilies READ fontFamilies CONSTANT)
    Q_PROPERTY(QString storePath READ storePath CONSTANT)
public:
    explicit PreferencesController(QObject* parent=nullptr,const QString& settingsFile={});
    QString language() const;
    QString fontFamily() const { return m_family; }
    QString effectiveFontFamily() const { return m_family.isEmpty()?m_systemFont.family():m_family; }
    QStringList fontFamilies() const { return m_families; }
    QString storePath() const;
    Q_INVOKABLE QVariantList fontChoices(const QString& search) const;
    Q_INVOKABLE bool save(const QString& language,const QString& family);
    Q_INVOKABLE void openStore();
signals:
    void preferencesChanged();
    void messageNotify(bool success,const QString& text);
private:
    void applyFont();
    QString m_settingsFile,m_family;
    QStringList m_families;
    QFont m_systemFont;
};
