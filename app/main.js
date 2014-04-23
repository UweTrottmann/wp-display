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
var INDEX_TIME_HEIZUNG_RUECKLAUF_MEHR = 74;
/** @const */
var INDEX_TIME_HEIZUNG_RUECKLAUF_WENIGER = 75;

/**
 * Temperature unit.
 * @const
 */
var UNIT_TEMPERATURE_CELSIUS = "°C";

var tcpClient;
var isRequestStatus = false;

var dataView;
var statusView;

/**
 * Shows and hides the help panel
 */
function toggleHelp() {
  document.querySelector(".help").classList.toggle("hidden");
  document.body.classList.toggle("dim");
}

(function () {

  // Capture key presses
  document.body.addEventListener("keydown", function (e) {
    if (e.keyCode == 27) { // Esc
      toggleHelp();
      e.stopPropagation();
      e.preventDefault();
    }
  }, false);

  // Connect to WP by default.
  var host = "waermepumpe";
  var port = 8888;
  // connect(host, port);

  // connect button
  var connectButton = document.getElementById("connect");
  connectButton.addEventListener("click", function () {

    // Disconnect from previous socket.
    var host = document.getElementById("host").value;
    var port = parseInt(document.getElementById("port").value, 10);
    disconnect();
    connect(host, port);
    toggleHelp();

  });

  // disconnect button
  var disconnectButton = document.getElementById("disconnect");
  disconnectButton.addEventListener("click", function () {
    disconnect();
    toggleHelp();
  });

  // request status toggle button
  var requestStatusButton = document.getElementById("requestStatus");
  requestStatusButton.addEventListener("click", function () {
    if (isRequestStatus) {
      isRequestStatus = false;
    } else {
      isRequestStatus = true;
      requestStatus();
    }
  });

  function setData(dataText) {
    if (!dataView) {
      dataView = document.getElementById("data");
    }
    dataView.textContent = dataText;
  }

  function setStatus(statusText) {
    if (!statusView) {
      statusView = document.getElementById("status");
    }
    statusView.textContent = statusText;
  }

  /**
   * Connects to a host and port
   *
   * @param {String} host The remote host to connect to
   * @param {Number} port The port to connect to at the remote host
   */
  function connect(host, port) {
    tcpClient = new TcpClient(host, port);
    tcpClient.connect(function () {
      setStatus("Connected to " + host + ":" + port);
      tcpClient.addResponseListener(function (data) {
        if (data[0] != REQUEST_STATUS) {
          setData("Invalid response: request code does not match");
          return;
        }

        // extract some values
        var output = "";
        var currentTime = new Date();
        output += currentTime.getHours() + ":" + currentTime.getMinutes() + ":" + currentTime.getSeconds();
        output += "<br/>";
        output += getValue(data, INDEX_TEMP_VORLAUF) + "<br/>";
        output += getValue(data, INDEX_TEMP_RUECKLAUF) + "<br/>";
        output += getValue(data, INDEX_TEMP_RUECKLAUF_SOLL) + "<br/>";
        output += getValue(data, INDEX_TEMP_OUTDOORS) + "<br/>";
        output += getValue(data, INDEX_TIME_HEIZUNG_RUECKLAUF_MEHR) + "<br/>";
        output += getValue(data, INDEX_TIME_HEIZUNG_RUECKLAUF_WENIGER) + "<br/>";
        output += getValue(data, INDEX_TIME_VERDICHTER_STAND) + "<br/>";
        setData(output);

        if (isRequestStatus) {
          window.setTimeout(function () {
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
    var label = "Unknown";
    switch (index) {
      case INDEX_TEMP_VORLAUF:
        label = "Temp. Vorlauf";
        break;
      case INDEX_TEMP_RUECKLAUF:
        label = "Temp. Rücklauf";
        break;
      case INDEX_TEMP_RUECKLAUF_SOLL:
        label = "Temp. Rücklauf Soll";
        break;
      case INDEX_TEMP_OUTDOORS:
        label = "Temp. Aussen";
        break;
    }
    // offset by 3 (exclude request code, status code and length field)
    return label + ": " + (array[index + 3] / 10) + " " + UNIT_TEMPERATURE_CELSIUS;
  }

  function getTimeValue(array, index) {
    var label = "Unknown";
    switch (index) {
      case INDEX_TIME_HEIZUNG_RUECKLAUF_MEHR:
        label = "T Rücklauf < (T Rücklauf Soll - Hysterese)";
        break;
      case INDEX_TIME_HEIZUNG_RUECKLAUF_WENIGER:
        label = "T Rücklauf > (T Rücklauf Soll + Hysterese)";
        break;
      case INDEX_TIME_VERDICHTER_STAND:
        label = "Verdichter Stillstand";
        break;
    }
    var seconds = array[index + 3];
    var minutes = (seconds - (seconds % 60)) / 60;
    // offset by 3 (exclude request code, status code and length field)
    return label + ": " + minutes + " min " + (seconds % 60) + " sec";
  }

  function disconnect() {
    if (tcpClient) {
      setStatus("Disconnected.");
      tcpClient.disconnect();
    }
  }

  function requestStatus() {
    if (tcpClient) {
      tcpClient.sendInteger(REQUEST_STATUS);
    }
  }

})();
