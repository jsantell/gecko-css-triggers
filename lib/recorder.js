const { devtools } = require("resource://devtools/shared/Loader.jsm");
const { Task } = require("resource://gre/modules/Task.jsm");
const { DebuggerClient } = devtools.require("resource://devtools/shared/client/main");
const { DebuggerServer } = devtools.require("resource://devtools/server/main");
const { TimelineFront } = devtools.require("resource://devtools/server/actors/timeline");

function connectDebuggerClient (client) {
  return client.connect()
         .then(() => client.listTabs())
         .then(tabs => tabs.tabs[tabs.selected]);
}

exports.connect = Task.async(function*() {
  console.info("DebuggerServer::starting");
  DebuggerServer.init();
  DebuggerServer.addBrowserActors();

  let client = new DebuggerClient(DebuggerServer.connectPipe());
  let form = yield connectDebuggerClient(client);
  let front = TimelineFront(client, form);

  let markers = [];
  front.on("markers", function onTimelineMarkers (data) {
    markers = markers.concat(data);
  });

  console.info("DebuggerServer::started");

  return {
    start: Task.async(function*() {
      console.info("Recording::starting");
      recording = yield front.start({ withMarkers: true });
      console.info("Recording::started");
    }),

    stop: Task.async(function*() {
      console.info("Recording::stopping");

      // Wait for one more tick of markers to ensure we collect them,
      // unfortunately stopping recording does not drain markers
      // https://bugzilla.mozilla.org/show_bug.cgi?id=1249713
      yield new Promise(resolve => {
        front.on("markers", function onMarkerData () {
          front.off("markers", onMarkerData);
          resolve();
        });
      });

      yield front.stop();
      console.info("Recording::stopped");
      return markers;
    }),

    disconnect: () => new Promise(resolve => client.close(resolve))
  };
});
