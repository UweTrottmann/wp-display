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
  $scope.host = "waermepumpe";
  $scope.port = 8888;

  $scope.tcpClient;
  $scope.timeoutRunnable;

  $scope.refreshIntervalMs = 2000;

  $scope.time = "00:00:00";
  $scope.timeCompressorNoop = "0 h 0 min 0 sec";
  $scope.timeReturnLower = "0 h 0 min 0 sec";
  $scope.timeReturnHigher = "0 h 0 min 0 sec";
  $scope.tempOutdoors = 0.0;
  $scope.tempOutgoing = 0.0;
  $scope.tempReturn = 0.0;
  $scope.tempReturnShould = 0.0;

  $scope.textStatus = "Disconnected.";
  $scope.textBtnConnect = "Connect";
  $scope.textRequestStatus = "OFF";

  $scope.isRequestStatus = false;

  $scope.toggleConnection = function() {
    if (!$scope.tcpClient || !$scope.tcpClient.isConnected) {
      // TODO get host and port from settings UI
      $scope.disconnect();
      $scope.connect();
      $scope.textBtnConnect = "Disconnect";
    } else {
      $scope.disconnect();
      $scope.textBtnConnect = "Connect";
    }
  }

  $scope.connect = function() {
    $scope.tcpClient = new TcpClient($scope.host, $scope.port);
    $scope.tcpClient.connect(function () {
      // connected, display status
      $scope.textStatus = "Connected to " + $scope.host + ":" + $scope.port;

      // add response listener
      $scope.tcpClient.addResponseListener(function (data) {
        if (data[0] != REQUEST_STATUS) {
          $scope.textStatus = "Invalid response: request code does not match";
          return;
        }
        
        // time
        var currentTime = new Date();
        $scope.time = currentTime.getHours() + ":" + currentTime.getMinutes()
          + ":" + currentTime.getSeconds();
        
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
      $scope.textStatus = "Disconnected.";
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

}

/**
/**
 * Shows and hides the help panel
 *
function toggleHelp() {
  document.querySelector(".help").classList.toggle("hidden");
  document.body.classList.toggle("dim");
}

(function () {

  // help screen toggle
  document.body.addEventListener("keydown", function (e) {
    if (e.keyCode == 27) { // Esc
      toggleHelp();
      e.stopPropagation();
      e.preventDefault();
    }
  }, false);

})();
*/