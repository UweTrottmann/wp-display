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
var INDEX_HEIZUNG_RUECKLAUF_MEHR = 74;
/** @const */
var INDEX_HEIZUNG_RUECKLAUF_WENIGER = 74;

/**
 * Temperature unit.
 * @const
 */
var UNIT_TEMPERATURE_CELSIUS = '°C';

var tcpClient;

/**
 * Shows and hides the help panel
 */
function toggleHelp() {
  document.querySelector('.help').classList.toggle('hidden');
  document.body.classList.toggle('dim');
}

(function() {

  // Create and init the terminal
  var term = new Terminal('container');
  term.initFS(false, 1024 * 1024);

  // Capture key presses
  document.body.addEventListener('keydown', function(e) {
    if (e.keyCode == 27) { // Esc
      toggleHelp();
      e.stopPropagation();
      e.preventDefault();
    }
  }, false);

  term.output('Press Esc for options.<br/>');

  // Make an ANSI Color converter.
  var ansiConv = new AnsiConverter();

  // Connect to WP by default.
  var host = 'waermepumpe';
  var port = 8888;
  connect(host, port);

  // connect button
  var connectButton = document.getElementById('connect');
  connectButton.addEventListener('click', function() {

    // Disconnect from previous socket.
    var host = document.getElementById('host').value;
    var port = parseInt(document.getElementById('port').value, 10);
    disconnect();
    connect(host, port);
    toggleHelp();

  });

  // disconnect button
  var disconnectButton = document.getElementById('disconnect');
  disconnectButton.addEventListener('click', function() {
    disconnect();
    toggleHelp();
  });

  // request status button
  var requestStatusButton = document.getElementById('requestStatus');
  requestStatusButton.addEventListener('click', function() {
    if (tcpClient) {
      tcpClient.sendInteger(REQUEST_STATUS);
    }
  });

  /**
   * Connects to a host and port
   *
   * @param {String} host The remote host to connect to
   * @param {Number} port The port to connect to at the remote host
   */
  function connect(host, port) {
    tcpClient = new TcpClient(host, port);
    tcpClient.connect(function() {
      term.output('Connected to ' + host + ':' + port + '<br/>');
      tcpClient.addResponseListener(function(data) {
        if (data[0] != REQUEST_STATUS) {
          console.error('Invalid response: was no status package');
          return;
        }

        // extract some values
        var output = '';
        output += getValue(data, INDEX_TEMP_VORLAUF) + '<br/>';
        output += getValue(data, INDEX_TEMP_RUECKLAUF) + '<br/>';
        output += getValue(data, INDEX_TEMP_RUECKLAUF_SOLL) + '<br/>';
        output += getValue(data, INDEX_TEMP_OUTDOORS) + '<br/>';
        term.output(output + '<br/>');
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
    }
    return 'n/a';
  }

  function getTemperatureValue(array, index) {
    var label = 'Unknown';
    switch(index) {
      case INDEX_TEMP_VORLAUF:
        label = 'Temp. Vorlauf';
        break;
      case INDEX_TEMP_RUECKLAUF:
        label = 'Temp. Rücklauf';
        break;
      case INDEX_TEMP_RUECKLAUF_SOLL:
        label = 'Temp. Rücklauf Soll';
        break;
      case INDEX_TEMP_OUTDOORS:
        label = 'Temp. Aussen';
        break;
    }
    // offset by 3 (exclude request code, status code and length field)
    return label + ': ' + (array[index + 3] / 10) + ' ' + UNIT_TEMPERATURE_CELSIUS;
  }

  function disconnect() {
    if (tcpClient) {
      term.output('Disconnected.');
      tcpClient.disconnect();
    }
  }

})();

