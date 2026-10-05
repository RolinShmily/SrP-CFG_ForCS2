#include "preferences_controller.h"
#include "overview_controller.h"
#include "srp/core/packages.h"
#include "srp/core/actions.h"
#include "srp/core/i18n.h"
#include "hustheme.h"
#include <QGuiApplication>
#include <QFontDatabase>
#include <QSettings>
#include <QDir>
#include <algorithm>
namespace { QString translated(const char* key){return QString::fromStdString(srp::core::tr(key));} }
PreferencesController::PreferencesController(QObject* parent,const QString& settingsFile)
    :QObject(parent),m_settingsFile(settingsFile),m_systemFont(QFontDatabase::systemFont(QFontDatabase::GeneralFont)) {
    for(const auto& family:QFontDatabase::families()){
        const auto systems=QFontDatabase::writingSystems(family);
        const bool ordinary=std::any_of(systems.begin(),systems.end(),[](auto s){return s!=QFontDatabase::Symbol&&s!=QFontDatabase::Any;});
        if(ordinary&&!family.startsWith('@')&&!family.contains("icon",Qt::CaseInsensitive)&&!family.contains("symbol",Qt::CaseInsensitive)&&!family.contains("ding",Qt::CaseInsensitive)&&!family.contains("awesome",Qt::CaseInsensitive))m_families<<family;
    }
    m_families.removeDuplicates();m_families.sort(Qt::CaseInsensitive);
    QSettings settings(m_settingsFile.isEmpty()?QSettings(QSettings::IniFormat,QSettings::UserScope,"SrP","SrP-CFG").fileName():m_settingsFile,QSettings::IniFormat);
    m_family=settings.value("ui/fontFamily").toString();if(!m_families.contains(m_family))m_family.clear();
    const auto lang=settings.value("ui/language","zh").toString();
    srp::core::setLanguage(lang=="en"?srp::core::Language::EnUS:srp::core::Language::ZhCN);
    if(auto* overview=srp::gui::OverviewController::instance())overview->setLanguage(lang=="en"?"en":"zh");
    applyFont();
}
QString PreferencesController::language() const {return srp::core::currentLanguage()==srp::core::Language::EnUS?"en":"zh";}
QString PreferencesController::storePath() const {return QDir::toNativeSeparators(QString::fromStdString(srp::core::packageStoreRoot()));}
QVariantList PreferencesController::fontChoices(const QString& search) const {
    QVariantList result{QVariantMap{{"label",translated("preferences.system_font")},{"value",""}}};
    for(const auto& family:m_families)if(search.isEmpty()||family.contains(search,Qt::CaseInsensitive))result.append(QVariantMap{{"label",family},{"value",family}});
    return result;
}
void PreferencesController::applyFont(){
    QFont font=m_systemFont;if(!m_family.isEmpty())font.setFamily(m_family);
    QGuiApplication::setFont(font);
    HusTheme::instance()->installThemePrimaryFontFamiliesBase(font.family());
}
bool PreferencesController::save(const QString& lang,const QString& family){
    if((lang!="en"&&lang!="zh")||(!family.isEmpty()&&!m_families.contains(family))){emit messageNotify(false,translated("preferences.invalid"));return false;}
    QSettings settings(m_settingsFile.isEmpty()?QSettings(QSettings::IniFormat,QSettings::UserScope,"SrP","SrP-CFG").fileName():m_settingsFile,QSettings::IniFormat);
    settings.setValue("ui/language",lang);settings.setValue("ui/fontFamily",family);settings.sync();
    if(settings.status()!=QSettings::NoError){emit messageNotify(false,translated("preferences.save_failed"));return false;}
    m_family=family;
    if(auto* overview=srp::gui::OverviewController::instance())overview->setLanguage(lang);
    else srp::core::setLanguage(lang=="en"?srp::core::Language::EnUS:srp::core::Language::ZhCN);
    applyFont();emit preferencesChanged();emit messageNotify(true,translated("preferences.saved"));return true;
}
void PreferencesController::openStore(){if(!srp::core::openFolderInExplorer(srp::core::packageStoreRoot()))emit messageNotify(false,translated("feedback.open_folder_failed"));}
