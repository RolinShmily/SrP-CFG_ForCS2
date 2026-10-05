#include <QGuiApplication>
#include <QQmlApplicationEngine>
#include <QQuickWindow>
#include <QIcon>
#include <QDebug>
#include <QTimer>
#include <QFontDatabase>
#include <iostream>
#include <fstream>

#include "husapp.h"
#include "hustheme.h"
#include "srp/core/i18n.h"
#include "overview_controller.h"
#include "presets_controller.h"
#include "assembly_controller.h"
#include "cs2_cfg_highlighter.h"
#include "code_editor_gutter.h"

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
    QString initialRoute = "overview";
    int initialPresetIndex = -1;
    int initialFileIndex = -1;
    int customWidth = -1;
    int customHeight = -1;
    int initialZoom = -1;
    bool startMaximized = false;
    bool forceDark = false;
    bool forceLight = false;
    bool forceEn = false;
    for (int i = 1; i < argc; ++i) {
        if (std::string_view(argv[i]) == "--screenshot" && i + 1 < argc) {
            screenshotPath = QString::fromUtf8(argv[++i]);
        } else if (std::string_view(argv[i]) == "--route" && i + 1 < argc) {
            initialRoute = QString::fromUtf8(argv[++i]);
        } else if (std::string_view(argv[i]) == "--preset" && i + 1 < argc) {
            QString p = QString::fromUtf8(argv[++i]).toLower();
            if (p == "default") initialPresetIndex = 0;
            else if (p == "echo") initialPresetIndex = 1;
            else if (p == "visionl") initialPresetIndex = 2;
            else if (p == "yszh") initialPresetIndex = 3;
        } else if (std::string_view(argv[i]) == "--file" && i + 1 < argc) {
            QString f = QString::fromUtf8(argv[++i]).toLower();
            if (f == "settings" || f == "settings.cfg") initialFileIndex = 0;
            else if (f == "keymap" || f == "keymap.cfg") initialFileIndex = 1;
            else if (f == "custom" || f == "custom.cfg" || f == "user/custom.cfg") initialFileIndex = 2;
        } else if (std::string_view(argv[i]) == "--width" && i + 1 < argc) {
            customWidth = std::atoi(argv[++i]);
        } else if (std::string_view(argv[i]) == "--height" && i + 1 < argc) {
            customHeight = std::atoi(argv[++i]);
        } else if (std::string_view(argv[i]) == "--maximized") {
            startMaximized = true;
        } else if (std::string_view(argv[i]) == "--zoom" && i + 1 < argc) {
            initialZoom = std::atoi(argv[++i]);
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

    qmlRegisterType<CodeEditorGutter>("SrPGui", 1, 0, "CodeEditorGutter");

    auto* overviewCtrl = new srp::gui::OverviewController(&app);
    qmlRegisterSingletonInstance("SrPGui", 1, 0, "OverviewController", overviewCtrl);

    auto* presetsCtrl = new PresetsController(&app);
    if (initialPresetIndex >= 0) {
        presetsCtrl->setSelectedPresetIndex(initialPresetIndex);
    }
    if (initialFileIndex >= 0) {
        presetsCtrl->setSelectedFileIndex(initialFileIndex);
    }
    if (initialZoom >= 9 && initialZoom <= 28) {
        presetsCtrl->setEditorFontSize(initialZoom);
    }
    qmlRegisterSingletonInstance("SrPGui", 1, 0, "PresetsController", presetsCtrl);

    auto* assemblyCtrl = new AssemblyController(&app);
    if (initialRoute.startsWith("assembly_") && initialFileIndex >= 0) {
        assemblyCtrl->setSelectedFileIndex(initialFileIndex == 2 ? 0 : initialFileIndex + 1);
    }
    qmlRegisterSingletonInstance("SrPGui", 1, 0, "AssemblyController", assemblyCtrl);

#ifdef HUSKARUI_IMPORT_PATH
    qDebug() << "HUSKARUI_IMPORT_PATH:" << HUSKARUI_IMPORT_PATH;
    engine.addImportPath(QString::fromUtf8(HUSKARUI_IMPORT_PATH));
#endif

    // Light is the product default; manual theme switching remains available.
    HusTheme::instance()->setDarkMode(forceDark && !forceLight ? HusTheme::DarkMode::Dark : HusTheme::DarkMode::Light);

    if (forceEn) {
        srp::core::setLanguage(srp::core::Language::EnUS);
    }

    const QUrl url(QStringLiteral("qrc:/SrPGui/qml/Main.qml"));
    QObject::connect(&engine, &QQmlApplicationEngine::objectCreated,
        &app, [url, &engine, screenshotPath, customWidth, customHeight, startMaximized, &app](QObject *obj, const QUrl &objUrl) {
            if (!obj && url == objUrl) {
                qCritical() << "[CRITICAL] Failed to load QML root object:" << url.toString();
                QCoreApplication::exit(-1);
            } else {
                qDebug() << "[INFO] QML root object loaded successfully!";
                if (!engine.rootObjects().isEmpty()) {
                    auto* win = qobject_cast<QQuickWindow*>(engine.rootObjects().first());
                    if (win) {
                        if (customWidth > 0 && customHeight > 0) {
                            win->resize(customWidth, customHeight);
                        }
                        if (startMaximized) {
                            win->showMaximized();
                        }
                    }
                }
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

    engine.setInitialProperties({{QStringLiteral("initialRoute"), initialRoute}});
    engine.load(url);

    return app.exec();
}
