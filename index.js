const Tabs = require("sdk/tabs");
const { ActionButton } = require("sdk/ui/button/action");
const Prefs = require("sdk/simple-prefs");
const { Task } = require("resource://gre/modules/Task.jsm");
const { writeFile } = require("sdk/io/fs");
const { pathFor } = require("sdk/system");

const { runSuite } = require("./lib/suite");

let button = ActionButton({
  id: "gecko-css-trigger-button",
  icon: "./firefox.png",
  label: "Run Gecko CSS Trigger test",
  onClick: Task.async(function *() {
    let URL_ROOT = Prefs.prefs.urlRoot;

    if (URL_ROOT.charAt(URL_ROOT.length - 1) !== "/") {
      URL_ROOT = `${URL_ROOT}/`;
    }

    console.info(`Running tests from ${URL_ROOT}`);

    let results = yield runSuite(URL_ROOT);
    console.log("RESULTS", results);

    let data = `module.exports = ${JSON.stringify({ data: results }, null, 2)}`;
    Tabs.open({
      url: `data:text/plain;charset=utf-8,${data}`
    });

    let savePath = `${pathFor("ProfD")}/gecko.js`;
    yield new Promise(resolve => writeFile(savePath, data, resolve));
    console.info(`Saved data to ${savePath}`);
  })
});
