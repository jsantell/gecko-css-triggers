let TEST_URL = unsafeWindow.location.href;

console.log("CONTENT SCRIPT LOADED", TEST_URL);

self.port.on("start", function () {
  let button = document.querySelector("#gogogo");
  button.click();

  setTimeout(function checkIfDone() {
    if (unsafeWindow.isDone) {
      self.port.emit("finish", TEST_URL);
    } else {
      setTimeout(checkIfDone, 100);
    }
  }, 200);
});

self.port.emit("ready", TEST_URL);
