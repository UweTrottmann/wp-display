function HeatingDisplayControl($scope) {
  $scope.requestStatus = "OFF";
}

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

/**
 * Temperature unit.
 * @const
 */
var UNIT_TEMPERATURE_CELSIUS = "°C";

var tcpClient;
var timeoutRunnable;

/** Whether a new status should be requested after one was received. */
var isRequestStatus = false;

var dataView;
var statusView;

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

  // set default connection
  // TODO persist settings
  var host = "waermepumpe";
  var port = 8888;

  // buttons
  var connectButton = document.getElementById("btn-connect");

  // status labels
  var requestStatusLabel = document.getElementById("request-status");

  // data fields
  var time = document.getElementById("time");
  var timeCompressorNoop = document.getElementById("time-compressor-noop");
  var timeReturnLower = document.getElementById("time-return-lower");
  var timeReturnHigher = document.getElementById("time-return-higher");
  var tempOutdoors = document.getElementById("temp-outdoors");
  var tempOutgoing = document.getElementById("temp-outgoing");
  var tempReturn = document.getElementById("temp-return");
  var tempReturnShould = document.getElementById("temp-return-should");

  setStatusUpdatesState(false);

  // connect button
  connectButton.addEventListener("click", function () {
    if (!tcpClient || !tcpClient.isConnected) {
      var host = document.getElementById("host").value;
      var port = parseInt(document.getElementById("port").value, 10);
      disconnect();
      connect(host, port);
      connectButton.textContent = "Disconnect";

      // start requesting status updates
      setStatusUpdatesState(true);
    } else {
      disconnect();
      connectButton.textContent = "Connect";
    }
  });

  /**
   * Connects to a host and port
   *
   * @param {String} host The remote host to connect to
   * @param {Number} port The port to connect to at the remote host
   *
  function connect(host, port) {
    tcpClient = new TcpClient(host, port);
    tcpClient.connect(function () {
      setStatus("Connected to " + host + ":" + port);
      tcpClient.addResponseListener(function (data) {
        if (data[0] != REQUEST_STATUS) {
          setData("Invalid response: request code does not match");
          return;
        }
        
        // time
        var currentTime = new Date();
        time.innerText = currentTime.getHours() + ":" + currentTime.getMinutes() + ":" + currentTime.getSeconds();
        
        // time values
        timeCompressorNoop.innerText = getValue(data, INDEX_TIME_VERDICHTER_STAND);
        timeReturnLower.innerText = getValue(data, INDEX_TIME_HEIZUNG_RUECKLAUF_WENIGER);
        timeReturnHigher.innerText = getValue(data, INDEX_TIME_HEIZUNG_RUECKLAUF_MEHR);

        // temp values
        tempOutdoors.innerText = getValue(data, INDEX_TEMP_OUTDOORS);
        tempOutgoing.innerText = getValue(data, INDEX_TEMP_VORLAUF);
        tempReturn.innerText = getValue(data, INDEX_TEMP_RUECKLAUF);
        tempReturnShould.innerText = getValue(data, INDEX_TEMP_RUECKLAUF_SOLL);

        if (isRequestStatus) {
          timeoutRunnable = window.setTimeout(function () {
            requestStatus();
          }, 1500);
        }
      });
    });
  }

  function getValue(array, index) {
    switch (index) {
      case INDEX_TEMP_VORLAUF:
      case INDEX_TEMP_RUECKLAUF:
      case INDEX_TEMP_RUECKLAUF_SOLL:
      case INDEX_TEMP_OUTDOORS:
        return getTemperatureValue(array, index);
      case INDEX_TIME_HEIZUNG_RUECKLAUF_MEHR:
      case INDEX_TIME_HEIZUNG_RUECKLAUF_WENIGER:
      case INDEX_TIME_VERDICHTER_STAND:
        return getTimeValue(array, index);
    }
    return "n/a";
  }

  function getTemperatureValue(array, index) {
    // offset by 3 (exclude request code, status code and length field)
    return (array[index + 3] / 10);
  }

  function getTimeValue(array, index) {
    // offset by 3 (exclude request code, status code and length field)
    var seconds = array[index + 3];

    var hours = (seconds - (seconds % 3600)) / 3600;
    seconds = seconds - (hours * 3600);
    var minutes = (seconds - (seconds % 60)) / 60;
    seconds = seconds % 60;
    return hours + " h " + minutes + " min " + seconds + " sec";
  }

  function disconnect() {
    setStatusUpdatesState(false);
    if (tcpClient) {
      setStatus("Disconnected.");
      tcpClient.disconnect();
    }
  }

  function setStatus(statusText) {
    if (!statusView) {
      statusView = document.getElementById("status");
    }
    statusView.innerHTML = "<p>" + statusText + "</p>";
  }

  function setStatusUpdatesState(isEnabled) {
    isRequestStatus = isEnabled;
    if (isEnabled) {
      requestStatusLabel.textContent = "ON";
      requestStatus();
    } else {
      window.clearTimeout(timeoutRunnable);
      requestStatusLabel.textContent = "OFF";
    }
  }

  function requestStatus() {
    if (tcpClient) {
      tcpClient.sendInteger(REQUEST_STATUS);
    }
  }

})();
*/