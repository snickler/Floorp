/* eslint-disable no-undef */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* import-globals-from preferences.js */

var { AppConstants } =  ChromeUtils.import(
  "resource://gre/modules/AppConstants.jsm"
);
var { NetUtil } = ChromeUtils.importESModule(
  "resource://gre/modules/NetUtil.sys.mjs"
);

XPCOMUtils.defineLazyGetter(this, "L10n", () => {
  return new Localization(["branding/brand.ftl", "browser/floorp", ]);
});

function coventToDateAndTime(timestamp) {
  let date = new Date(timestamp);
  let dateStr = date.toLocaleDateString();
  let timeStr = date.toLocaleTimeString();
  return dateStr + " " + timeStr;
}

const gWorkspacesPane = {
  _pane: null,
  init() {
    this._pane = document.getElementById("paneWorkspaces");
    document.getElementById("backtogeneral-workspaces").addEventListener("command", function () {
      gotoPref("general")
    });

    // get workspace backups.
    const file = FileUtils.getFile("ProfD", ["floorp-workspace-backup.json"]);
    const fstream = Cc[
      "@mozilla.org/network/file-input-stream;1"
    ].createInstance(Ci.nsIFileInputStream);
    fstream.init(file, -1, 0, 0);
    const inputStream = NetUtil.readInputStreamToString(
      fstream,
      fstream.available()
    );
    fstream.close();
    //Workspace saved in json format. a line save 1 json object.
    let lines = inputStream.split("\r");

    for(let i = 0; i < lines.length; i++) {
      let workspace = JSON.parse(lines[i]);

      let element = window.MozXULElement.parseXULToFragment(`
      <richlistitem>
        <label class="backup-date" value="${coventToDateAndTime(Number(Object.keys(workspace)[0]))}"></label>
        <spacer flex="1"/> 
        <button class="restore-workspaces-button" linenum="${i}"  data-l10n-id="restore-button"></button>
      </richlistitem>
     `);

      function insetElement() {
        let parentElemnt = document.getElementById("workspaces-backup-list");
        if (parentElemnt !== null) {
          parentElemnt.appendChild(element);
          applyFunctions();
        } else {
          setTimeout(insetElement, 100);
        }
      }
      
      function applyFunctions() {
        let targets = document.getElementsByClassName("restore-workspaces-button");
        for (let i = 0; i < targets.length; i++) {
          targets[i].onclick = function () {
            restoreWorkspaces(targets[i].getAttribute("linenum"));
          }
        }
      }

      async function restoreWorkspaces(i) {
        let l10n = new Localization(["browser/floorp.ftl"], true);
        const prompts = Services.prompt;
        const check = {
          value: false
        };
        const flags = prompts.BUTTON_POS_0 * prompts.BUTTON_TITLE_OK + prompts.BUTTON_POS_1 * prompts.BUTTON_TITLE_CANCEL;
        let result = prompts.confirmEx(null, l10n.formatValueSync("workspaces-restore-service-title"), l10n.formatValueSync("workspaces-restore-warning"), flags, "", null, "", null, check);
        if (result == 0) {
          Services.obs.notifyObservers({lineNum:i}, 'backupWorkspace');
          window.setTimeout(function () {
            Services.obs.notifyObservers([], "floorp-restart-browser");
          }, 4000);
        }
      }
      insetElement();
    }
  },  
};
