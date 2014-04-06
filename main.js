var REQUEST_STATUS = 3004;

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
  // connect(host, port);

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
        // split integers into lines
        var output = '';
        for (var i = 0; i < data.length; i++) {
          var value = data[i];
          output += '[' + i + ']: ' + value + '<br/>';
        }
        term.output(output + '<br/>');
      });
    });
  }

  function disconnect() {
    if (tcpClient) {
      term.output('Disconnected.');
      tcpClient.disconnect();
    }
  }

})();

