/* eslint-disable no-undef */
/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* This file is used to override existing Firefox functions and various variables. */


// Override Forward & Backward button's custamizeble element.
//From "browser.js" line 750
SetClickAndHoldHandlers = function () {
    // Bug 414797: Clone the back/forward buttons' context menu into both buttons.
    let popup = document.getElementById("backForwardMenu").cloneNode(true);
    popup.removeAttribute("id");
    // Prevent the back/forward buttons' context attributes from being inherited.
    popup.setAttribute("context", "");
  
    let backButton = document.getElementById("back-button");
    if(backButton != null)
    {
      backButton.setAttribute("type", "menu");
      backButton.prepend(popup);
      gClickAndHoldListenersOnElement.add(backButton);
    }
  
    let forwardButton = document.getElementById("forward-button");
    if(forwardButton != null)
    {
      popup = popup.cloneNode(true);
      forwardButton.setAttribute("type", "menu");
      forwardButton.prepend(popup);
      gClickAndHoldListenersOnElement.add(forwardButton);
    }
}

// Override the default newtab opening position in tabbar.
//copy from browser.js (./browser/base/content/browser.js)
BrowserOpenTab = function ({ event, url = BROWSER_NEW_TAB_URL } = {}) {
    let relatedToCurrent = false; //"relatedToCurrent" decide where to open the new tab. Default work as last tab (right side). Floorp use this.
    let where = "tab";
    let _OPEN_NEW_TAB_POSITION_PREF = Services.prefs.getIntPref(
      "floorp.browser.tabs.openNewTabPosition"
    );
  
    switch (_OPEN_NEW_TAB_POSITION_PREF) {
      case 0:
        // Open the new tab as unrelated to the current tab.
        relatedToCurrent = false;
        break;
      case 1:
        // Open the new tab as related to the current tab.
        relatedToCurrent = true;
        break;
      default:
       if (event) {
        where = whereToOpenLink(event, false, true);
        switch (where) {
          case "tab":
          case "tabshifted":
            // When accel-click or middle-click are used, open the new tab as
            // related to the current tab.
            relatedToCurrent = true;
            break;
          case "current":
            where = "tab";
            break;
          }
       }
    }
  
    //Wrote by Mozilla(Firefox)
    // A notification intended to be useful for modular peformance tracking
    // starting as close as is reasonably possible to the time when the user
    // expressed the intent to open a new tab.  Since there are a lot of
    // entry points, this won't catch every single tab created, but most
    // initiated by the user should go through here.
    //
    // Note 1: This notification gets notified with a promise that resolves
    //         with the linked browser when the tab gets created
    // Note 2: This is also used to notify a user that an extension has changed
    //         the New Tab page.
    Services.obs.notifyObservers(
      {
        wrappedJSObject: new Promise(resolve => {
          openTrustedLinkIn(url, where, {
            relatedToCurrent,
            resolveOnNewTabCreated: resolve,
          });
        }),
      },
     "browser-open-newtab-start"
   );
}

// Override the default newtab url in tabbar. If pref seted.
// Experimental feature. Malware can change this pref to redirect user to malware site.
const newtabOverrideURL = "floorp.newtab.overrides.newtaburl";
if(Services.prefs.getStringPref(newtabOverrideURL,"") != "") {
    ChromeUtils.import("resource:///modules/AboutNewTab.jsm");
    const newTabURL = Services.prefs.getStringPref(newtabOverrideURL);
    AboutNewTab.newTabURL = newTabURL;
}
