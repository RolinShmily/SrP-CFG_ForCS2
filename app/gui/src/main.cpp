#include <QGuiApplication>
#include <QQmlApplicationEngine>
#include <QQuickWindow>
#include <QIcon>
#include <QDebug>
#include <QTimer>
#include <QFontDatabase>
#include <QSettings>
#include <QStyleHints>
#include <iostream>
#include <fstream>

#include "husapp.h"
#include "hustheme.h"
#include "srp/core/i18n.h"
#include "overview_controller.h"

void customLog(QtMsgType type, const QMessageLogContext &context, const QString &msg) {
    static std::ofstream logFile("srp_gui_debug.log", std::ios::app);
    logFile << "[" << type << "] " << msg.toStdString() << std::endl;
    logFile.flush();
}

int main(int argc, char* argv[]) {
    qInstallMessageHandler(customLog);
    qDebug() << "srp_gui starting up...";

#if defined(_WIN32)
    QQuickWindow::setDefaultAlphaBuffer(true);
#endif

    QGuiApplication app(argc, argv);
    app.setOrganizationName("SrP");
    app.setOrganizationDomain("srprolin.top");
    app.setApplicationName("SrP-CFG");
    app.setApplicationDisplayName("SrP-CFG");
    app.setApplicationVersion("3.4.0");
    app.setWindowIcon(QIcon(":/SrPGui/resources/icon.png"));

    // 加载 HuskarUI-Icons 字体
    int fontId1 = QFontDatabase::addApplicationFont(":/SrPGui/resources/font/HuskarUI-Icons.ttf");
    int fontId2 = QFontDatabase::addApplicationFont(":/HuskarUI/resources/font/HuskarUI-Icons.ttf");
    qDebug() << "[FONT] Added HuskarUI-Icons font IDs:" << fontId1 << fontId2;

    QString screenshotPath;
    bool forceDark = false;
    bool forceLight = false;
    bool forceEn = false;
    for (int i = 1; i < argc; ++i) {
        if (std::string_view(argv[i]) == "--screenshot" && i + 1 < argc) {
            screenshotPath = QString::fromUtf8(argv[++i]);
        } else if (std::string_view(argv[i]) == "--dark") {
            forceDark = true;
        } else if (std::string_view(argv[i]) == "--light") {
            forceLight = true;
        } else if (std::string_view(argv[i]) == "--en" || std::string_view(argv[i]) == "--english") {
            forceEn = true;
        }
    }

    if (forceEn) {
        srp::core::setLanguage(srp::core::Language::EnUS);
    }

    QQmlApplicationEngine engine;
    HusApp::initialize(&engine);

    auto* overviewCtrl = new srp::gui::OverviewController(&app);
    qmlRegisterSingletonInstance("SrPGui", 1, 0, "OverviewController", overviewCtrl);

#ifdef HUSKARUI_IMPORT_PATH
    qDebug() << "HUSKARUI_IMPORT_PATH:" << HUSKARUI_IMPORT_PATH;
    engine.addImportPath(QString::fromUtf8(HUSKARUI_IMPORT_PATH));
#endif

    bool isSystemDark = false;
#if defined(_WIN32)
    QSettings personalize("HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize", QSettings::NativeFormat);
    if (personalize.contains("AppsUseLightTheme")) {
        isSystemDark = (personalize.value("AppsUseLightTheme").toInt() == 0);
    } else {
        isSystemDark = (QGuiApplication::styleHints()->colorScheme() == Qt::ColorScheme::Dark);
    }
#else
    isSystemDark = (QGuiApplication::styleHints()->colorScheme() == Qt::ColorScheme::Dark);
#endif

    if (forceLight) {
        HusTheme::instance()->setDarkMode(HusTheme::DarkMode::Light);
    } else if (forceDark || isSystemDark) {
        HusTheme::instance()->setDarkMode(HusTheme::DarkMode::Dark);
    } else {
        HusTheme::instance()->setDarkMode(HusTheme::DarkMode::Light);
    }

    QObject::connect(QGuiApplication::styleHints(), &QStyleHints::colorSchemeChanged, [](Qt::ColorScheme scheme) {
        HusTheme::instance()->setDarkMode(scheme == Qt::ColorScheme::Dark ? HusTheme::DarkMode::Dark : HusTheme::DarkMode::Light);
    });

    if (forceEn) {
        srp::core::setLanguage(srp::core::Language::EnUS);
    }

    const QUrl url(QStringLiteral("qrc:/SrPGui/qml/Main.qml"));
    QObject::connect(&engine, &QQmlApplicationEngine::objectCreated,
        &app, [url, &engine, screenshotPath, &app](QObject *obj, const QUrl &objUrl) {
            if (!obj && url == objUrl) {
                qCritical() << "[CRITICAL] Failed to load QML root object:" << url.toString();
                QCoreApplication::exit(-1);
            } else {
                qDebug() << "[INFO] QML root object loaded successfully!";
                if (!screenshotPath.isEmpty()) {
                    QTimer::singleShot(1200, [&engine, screenshotPath, &app]() {
                        if (!engine.rootObjects().isEmpty()) {
                            auto* win = qobject_cast<QQuickWindow*>(engine.rootObjects().first());
                            if (win) {
                                QImage shot = win->grabWindow();
                                bool saved = shot.save(screenshotPath);
                                qDebug() << "[SCREENSHOT] Grabbed and saved:" << screenshotPath << "success:" << saved;
                            }
                        }
                        app.quit();
                    });
                }
            }
        }, Qt::QueuedConnection);

    engine.load(url);

    return app.exec();
}
