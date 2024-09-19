chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "openPopup") {
      chrome.windows.create({
        url: chrome.runtime.getURL("popup.html") + `?type=${request.type}&username=${request.username}`,
        type: "popup",
        width: 400,
        height: 300
      });
    }
  });