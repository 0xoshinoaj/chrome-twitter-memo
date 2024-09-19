chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "saveNote") {
        // 處理保存備註的邏輯
        chrome.storage.sync.get(['notes'], function(result) {
            let notes = result.notes || {};
            notes[request.userId] = request.note;
            chrome.storage.sync.set({notes: notes}, function() {
                console.log('備註已保存');
                // 可以在這裡發送一個消息回content script，通知保存成功
                chrome.tabs.sendMessage(sender.tab.id, {action: "noteSaved"});
            });
        });
    }
});