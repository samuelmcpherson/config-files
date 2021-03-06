var registeredBorders = [];

var togglePanel = function() {
    callDBus("org.kde.kglobalaccel", "/component/kwin", "org.kde.kglobalaccel.Component", "invokeShortcut", "Parachute");
}

function init() {
    for (var i in registeredBorders) {
        unregisterScreenEdge(registeredBorders[i]);
    }

    registeredBorders = [];

    var borders = readConfig("BorderActivate", "").toString().split(",");
    for (var i in borders) {
        var border = parseInt(borders[i]);
        if (isFinite(border)) {
            registeredBorders.push(border);
            registerScreenEdge(border, togglePanel);
        }
    }
}

options.configChanged.connect(init);

init();
