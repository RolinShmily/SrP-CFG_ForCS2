#include "app_update_controller.h"
#include "overview_controller.h"
#include "srp/core/i18n.h"
#include <QtConcurrent>
#include <QDesktopServices>
#include <QUrl>
AppUpdateController::AppUpdateController(QObject* parent,std::function<srp::core::AppUpdateResult()> checker):QObject(parent),m_checker(std::move(checker)){
    connect(&m_watcher,&QFutureWatcher<srp::core::AppUpdateResult>::finished,this,[this]{m_result=m_watcher.result();m_checked=true;emit stateChanged();});
    if(auto* overview=srp::gui::OverviewController::instance())connect(overview,&srp::gui::OverviewController::languageChanged,this,&AppUpdateController::stateChanged);
}
QString AppUpdateController::status() const {
    const std::string key=busy()?"appupdate.checking":!m_checked?"appupdate.manual":!m_result.success?m_result.error:m_result.updateAvailable?"appupdate.available":"appupdate.current";
    return QString::fromStdString(srp::core::tr(key));
}
QString AppUpdateController::releaseNotes() const {return QString::fromStdString(srp::core::currentLanguage()==srp::core::Language::EnUS?m_result.release.notesEn:m_result.release.notesZh);}
void AppUpdateController::check(){
    if(busy())return;m_checked=false;m_result={};m_watcher.setFuture(QtConcurrent::run(m_checker));emit stateChanged();
}
void AppUpdateController::openLink(const QString& kind){
    QString url;if(kind=="website")url=website();else if(kind=="blog")url=blog();else if(kind=="project")url=project();else if(kind=="releases")url=releases();else return;
    if(!QDesktopServices::openUrl(QUrl(url)))emit messageNotify(false,QString::fromStdString(srp::core::tr("appupdate.link_failed")));
}
