pragma Singleton
import QtQuick

QtObject {
    property var host: null
    function success(message) { if (host) host.success(message); }
    function error(message) { if (host) host.error(message); }
}
