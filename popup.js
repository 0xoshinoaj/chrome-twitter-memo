document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    const username = urlParams.get('username');

    const title = document.getElementById('title');
    const input = document.getElementById('input');
    const saveButton = document.getElementById('save');
    const cancelButton = document.getElementById('cancel');

    if (type === 'tag') {
        title.textContent = '添加標籤';
        input.placeholder = '請輸入標籤';
    } else if (type === 'note') {
        title.textContent = '添加備註';
        input.placeholder = '請輸入備註';
    }

    saveButton.addEventListener('click', function() {
        const value = input.value;
        if (value) {
            chrome.storage.sync.get(type + 's', function(result) {
                const data = result[type + 's'] || {};
                data[username] = value;
                chrome.storage.sync.set({ [type + 's']: data }, function() {
                    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                        chrome.tabs.sendMessage(tabs[0].id, {action: "refresh"});
                    });
                    window.close();
                });
            });
        }
    });

    cancelButton.addEventListener('click', function() {
        window.close();
    });
});