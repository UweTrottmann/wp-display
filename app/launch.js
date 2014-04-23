/**
 * Listens for the app launching then creates the window
 *
 * @see http://developer.chrome.com/apps/app.runtime.html
 * @see http://developer.chrome.com/apps/app.window.html
 */
chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('terminal.html', {
  	id: "mainwin",
    bounds: {
      width: 600,
      height: 350
    }
  });
});

chrome.runtime.onSuspend.addListener(function() {
  // Do some simple clean-up tasks.
  if (window.tcpClient) {
    tcpClient.disconnect();
  }
});