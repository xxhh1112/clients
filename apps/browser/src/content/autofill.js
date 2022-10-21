import { collect, fill } from "./autofill_collect";

!(function () {
  chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (msg.command === "collectPageDetails") {
      var pageDetails = collect(document);
      var pageDetailsObj = JSON.parse(pageDetails);
      chrome.runtime.sendMessage({
        command: "collectPageDetailsResponse",
        tab: msg.tab,
        details: pageDetailsObj,
        sender: msg.sender,
      });
      sendResponse();
      return true;
    } else if (msg.command === "fillForm") {
      fill(document, msg.fillScript);
      sendResponse();
      return true;
    } else if (msg.command === "collectPageDetailsImmediately") {
      var pageDetails2 = collect(document);
      var pageDetailsObj2 = JSON.parse(pageDetails2);
      sendResponse(pageDetailsObj2);
      return true;
    }
  });
})();
