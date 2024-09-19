console.log("X (Twitter) 賬戶備註擴充程式已載入");

let lastCheckedUrl = '';
let checkInterval = null;

function startChecking() {
  if (checkInterval) {
    clearInterval(checkInterval);
  }
  checkInterval = setInterval(checkAndAddButtons, 1000); // 每秒檢查一次
}

function stopChecking() {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
}

function checkAndAddButtons() {
  const currentUrl = window.location.href;
  if (currentUrl !== lastCheckedUrl) {
    lastCheckedUrl = currentUrl;
    console.log("URL 已變更，重新開始檢查");
    startChecking();
  }

  console.log("檢查是否需要添加按鈕...");
  const profileHeader = document.querySelector('[data-testid="UserName"]');
  
  if (profileHeader && !document.querySelector('.account-button-container')) {
    console.log("找到賬戶資料區，添加按鈕和備註");
    addButtons(profileHeader);
    stopChecking(); // 添加按鈕後停止檢查
  } else if (!profileHeader) {
    console.log("未找到賬戶資料區");
  }
}

function addButtons(profileHeader) {
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'account-button-container';
  buttonContainer.style.cssText = 'margin-top: 10px; display: flex;';

  const tagButton = createButton('添加標籤', openTagPopup);
  const noteButton = createButton('添加備註', openNotePopup);

  buttonContainer.appendChild(tagButton);
  buttonContainer.appendChild(noteButton);
  profileHeader.parentNode.insertBefore(buttonContainer, profileHeader.nextSibling);

  // 添加備註顯示區域
  const noteDisplay = document.createElement('div');
  noteDisplay.className = 'account-note-display';
  updateNoteDisplayStyle(noteDisplay);
  profileHeader.parentNode.insertBefore(noteDisplay, buttonContainer.nextSibling);

  // 檢查是否已有標籤和備註
  const username = getUserName();
  chrome.storage.sync.get(['tags', 'notes'], function(result) {
    if (result.tags && result.tags[username]) {
      tagButton.textContent = '更改標籤';
    }
    if (result.notes && result.notes[username]) {
      noteButton.textContent = '更改備註';
      noteDisplay.textContent = `備註: ${result.notes[username]}`;
    } else {
      noteDisplay.style.display = 'none';
    }
  });
}

function createButton(text, onClick) {
  const button = document.createElement('button');
  button.textContent = text;
  button.style.cssText = 'margin-right: 10px; padding: 5px 10px; border: 1px solid #ccc; border-radius: 4px; background-color: transparent; color: inherit; cursor: pointer; transition: background-color 0.3s;';
  button.addEventListener('mouseover', () => {
    button.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
  });
  button.addEventListener('mouseout', () => {
    button.style.backgroundColor = 'transparent';
  });
  button.addEventListener('click', onClick);
  return button;
}

function openTagPopup() {
  const username = getUserName();
  chrome.runtime.sendMessage({action: "openPopup", type: "tag", username: username});
}

function openNotePopup() {
  const username = getUserName();
  chrome.runtime.sendMessage({action: "openPopup", type: "note", username: username});
}

function updateNoteDisplayStyle(noteDisplay) {
  noteDisplay.style.cssText = 'margin-top: 10px; padding: 5px; border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 4px; background-color: rgba(255, 255, 255, 0.05);';
}

function getUserName() {
  const userNameElement = document.querySelector('[data-testid="UserName"]');
  return userNameElement ? userNameElement.textContent.split('@')[1] : '';
}

// 初次執行
startChecking();

// 監聽 URL 變化
window.addEventListener('popstate', function() {
  startChecking();
});

// 監聽主題變化
const themeObserver = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    if (mutation.type === "attributes" && mutation.attributeName === "class") {
      const noteDisplay = document.querySelector('.account-note-display');
      if (noteDisplay) {
        updateNoteDisplayStyle(noteDisplay);
      }
    }
  });
});

themeObserver.observe(document.body, {
  attributes: true,
  attributeFilter: ['class']
});

// 監聽來自彈出窗口的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "refresh") {
    checkAndAddButtons();
  }
});