const Tabs = require("sdk/tabs");
const { PageMod } = require("sdk/page-mod");
const { defer } = require("sdk/core/promise");
const { Task } = require("resource://gre/modules/Task.jsm");
const CONTENT_SCRIPT_FILE = "./test-content-script.js";
const TEST_NAMES = require("../tests.json").tests;

const { connect } = require("./recorder");

function parseMarkers (markers) {
  return {
    paint: markers.some(m => m.name === "Paint"),
    layout: markers.some(m => m.name === "Reflow"),
    composite: markers.some(m => m.name === "Composite"),
  };
}

function runTest (tab, mod, recorder, testFile) {
  let { promise, resolve } = defer();

  console.info(`Running test: ${testFile}`);

  function onModAttach (tabWorker) {
    tabWorker.port.on("ready", Task.async(function* onReady (url) {
      if (url !== testFile) {
        return;
      }

      recorder.start();
      tabWorker.port.emit("start");
    }));

    tabWorker.port.on("finish", Task.async(function* onFinish (url) {
      if (url !== testFile) {
        return;
      }

      mod.off("attach", onModAttach);
      tabWorker.port.off("ready");
      tabWorker.port.off("finish");
      let markers = yield recorder.stop();
      resolve(markers);
    }));
  }

  mod.on("attach", onModAttach);
  tab.url = testFile;

  return promise;
}

function openTab () {
  let { promise, resolve } = defer();
  Tabs.open({
    url: "about:home",
    onOpen: resolve,
  });
  return promise;
}

function createMod (root) {
  return PageMod({
    //include: [new RegExp(`^${root}`)],
    include: "*",
    contentScriptFile: CONTENT_SCRIPT_FILE
  });
}

exports.runSuite = Task.async(function *(root) {
  let allResults = Object.create(null);
  let tab = yield openTab();
  let mod = createMod(root);
  let recorder = yield connect();

  for (let testName of TEST_NAMES) {
    let results = yield runTest(tab, mod, recorder, `${root}${testName}`);
    let resultName = testName.replace(/\.html/, "");
    allResults[resultName] = parseMarkers(results);
    console.info(`Results for ${resultName}: ${JSON.stringify(allResults[resultName])}`);
  }

  yield recorder.disconnect();

  mod.destroy();
  yield new Promise(resolve => tab.close(resolve));

  return allResults;
});
