var REQUEST_STATUS = 3004;

/**
 * Temperatur Vorlauf, Faktor 10, Celsius.
 * @const
 * @type {number}
 */
var INDEX_TEMP_VORLAUF = 10;
/**
 * Temperatur Rücklauf, Faktor 10, Celsius.
 * @const
 * @type {number}
 */
var INDEX_TEMP_RUECKLAUF = 11;
/**
 * Temperatur Rücklauf Soll, Faktor 10, Celsius.
 * @const
 * @type {number}
 */
var INDEX_TEMP_RUECKLAUF_SOLL = 12;
/**
 * Aussentemperatur, Faktor 10, Celsius.
 * @const
 * @type {number}
 */
var INDEX_TEMP_OUTDOORS = 15;

/** @const */
var INDEX_TIME_VERDICHTER_STAND = 73;

/** @const */
var INDEX_TIME_HEIZUNG_RUECKLAUF_WENIGER = 74;
/** @const */
var INDEX_TIME_HEIZUNG_RUECKLAUF_MEHR = 75;

function HeatingDisplayControl($scope) {
  // localized strings
  $scope.strAppDescription = chrome.i18n.getMessage("appDesc");
  $scope.strTitleSettings = chrome.i18n.getMessage("titleSettings");
  $scope.strLabelHost = chrome.i18n.getMessage("hostname");
  $scope.strLabelPort = chrome.i18n.getMessage("port");
  $scope.strTitleAbout = chrome.i18n.getMessage("titleAbout");
  $scope.strLabelTempOutgoing = chrome.i18n.getMessage("tempOutgoing");
  $scope.strLabelTempReturn = chrome.i18n.getMessage("tempReturn");
  $scope.strLabelTempReturnShould = chrome.i18n.getMessage("tempReturnShould");
  $scope.strLabelTempOutdoors = chrome.i18n.getMessage("tempOutdoors");
  $scope.strLabelTimeReceived = chrome.i18n.getMessage("timeReceived");
  $scope.strLabelTimeCompressorNoop = chrome.i18n.getMessage("timeCompressorNoop");
  $scope.strLabelTimeReturnLower = chrome.i18n.getMessage("timeReturnLower");
  $scope.strLabelTimeReturnHigher = chrome.i18n.getMessage("timeReturnHigher");

  $scope.host = "waermepumpe";
  $scope.port = 8888;

  $scope.tcpClient;
  $scope.timeoutRunnable;

  $scope.refreshIntervalMs = 2000;

  $scope.timeReceived = "00:00:00";
  $scope.timeCompressorNoop = "0 h 0 min 0 sec";
  $scope.timeReturnLower = "0 h 0 min 0 sec";
  $scope.timeReturnHigher = "0 h 0 min 0 sec";
  $scope.tempOutdoors = 0.0;
  $scope.tempOutgoing = 0.0;
  $scope.tempReturn = 0.0;
  $scope.tempReturnShould = 0.0;

  $scope.textStatus = chrome.i18n.getMessage("disconnected");
  $scope.textBtnConnect = chrome.i18n.getMessage("connect");
  $scope.textRequestStatus = "OFF";

  $scope.isRequestStatus = false;
  $scope.isShowingSettings = false;

  $scope.toggleConnection = function() {
    if (!$scope.tcpClient || !$scope.tcpClient.isConnected) {
      // TODO get host and port from settings UI
      $scope.disconnect();
      $scope.connect();
      $scope.textBtnConnect = chrome.i18n.getMessage("disconnect");
    } else {
      $scope.disconnect();
      $scope.textBtnConnect = chrome.i18n.getMessage("connect");
    }
  }

  $scope.connect = function() {
    $scope.tcpClient = new TcpClient($scope.host, $scope.port);
    $scope.tcpClient.connect(function () {
      // connected, display status
      $scope.textStatus = chrome.i18n.getMessage("connected") + " " + $scope.host + ":" + $scope.port;

      // add response listener
      $scope.tcpClient.addResponseListener(function (data) {
        if (data[0] != REQUEST_STATUS) {
          $scope.textStatus = "Invalid response: request code does not match";
          return;
        }
        
        // current time
        $scope.timeReceived = moment().lang(chrome.i18n.getMessage("@@ui_locale")).format("L HH:mm:ss");
        
        // time values
        $scope.timeCompressorNoop = $scope.getValue(data, INDEX_TIME_VERDICHTER_STAND);
        $scope.timeReturnLower = $scope.getValue(data, INDEX_TIME_HEIZUNG_RUECKLAUF_WENIGER);
        $scope.timeReturnHigher = $scope.getValue(data, INDEX_TIME_HEIZUNG_RUECKLAUF_MEHR);

        // temp values
        $scope.tempOutdoors = $scope.getValue(data, INDEX_TEMP_OUTDOORS);
        $scope.tempOutgoing = $scope.getValue(data, INDEX_TEMP_VORLAUF);
        $scope.tempReturn = $scope.getValue(data, INDEX_TEMP_RUECKLAUF);
        $scope.tempReturnShould = $scope.getValue(data, INDEX_TEMP_RUECKLAUF_SOLL);

        // force angular to update watched values
        $scope.$apply();

        // schedule next request?
        if ($scope.isRequestStatus) {
          $scope.timeoutRunnable = window.setTimeout(function () {
            $scope.requestStatus();
          }, $scope.refreshIntervalMs);
        }
      });

      // start requesting status updates
      $scope.setStatusUpdatesState(true);
    });
  }

  $scope.disconnect = function() {
    $scope.setStatusUpdatesState(false);
    if ($scope.tcpClient) {
      $scope.textStatus = chrome.i18n.getMessage("disconnected");
      $scope.tcpClient.disconnect();
    }
  }

  $scope.setStatusUpdatesState = function(isEnabled) {
    $scope.isRequestStatus = isEnabled;
    if (isEnabled) {
      $scope.textRequestStatus = "ON";
      $scope.requestStatus();
    } else {
      window.clearTimeout($scope.timeoutRunnable);
      $scope.textRequestStatus = "OFF";
    }
  }

  $scope.requestStatus = function() {
    if ($scope.tcpClient) {
      $scope.tcpClient.sendInteger(REQUEST_STATUS);
    }
  }

  $scope.getValue = function(array, index) {
    switch (index) {
      case INDEX_TEMP_VORLAUF:
      case INDEX_TEMP_RUECKLAUF:
      case INDEX_TEMP_RUECKLAUF_SOLL:
      case INDEX_TEMP_OUTDOORS:
        return $scope.getTemperatureValue(array, index);
      case INDEX_TIME_HEIZUNG_RUECKLAUF_MEHR:
      case INDEX_TIME_HEIZUNG_RUECKLAUF_WENIGER:
      case INDEX_TIME_VERDICHTER_STAND:
        return $scope.getTimeValue(array, index);
    }
    return "n/a";
  }

  $scope.getTemperatureValue = function(array, index) {
    // offset by 3 (exclude request code, status code and length field)
    return (array[index + 3] / 10);
  }

  $scope.getTimeValue = function(array, index) {
    // offset by 3 (exclude request code, status code and length field)
    var seconds = array[index + 3];

    var hours = (seconds - (seconds % 3600)) / 3600;
    seconds = seconds - (hours * 3600);
    var minutes = (seconds - (seconds % 60)) / 60;
    seconds = seconds % 60;
    return hours + " h " + minutes + " min " + seconds + " sec";
  }

  $scope.toggleSettings = function() {
    $scope.isShowingSettings = !$scope.isShowingSettings;
  }

}
