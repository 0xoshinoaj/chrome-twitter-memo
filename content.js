console.log("X (Twitter) 賬戶備註擴充程式已載入");

let lastCheckedUrl = '';
let checkInterval = null;
let currentDialog = null;
let buttonsAdded = false; // 新增標誌，用於跟踪按鈕是否已添加

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
    buttonsAdded = false; // 重置標誌
    startChecking();
  }

  console.log("檢查是否需要添加按鈕...");
  const profileHeader = document.querySelector('[data-testid="UserName"]');
  
  if (profileHeader && !buttonsAdded) {
    console.log("找到帳戶資料區，添加按鈕和備註");
    addButtons(profileHeader);
    buttonsAdded = true; // 設置標誌為 true
    stopChecking(); // 添加按鈕後停止檢查
  } else if (!profileHeader) {
    console.log("未找到帳戶資料區");
    buttonsAdded = false; // 重置標誌
  }
}

function addButtons(profileHeader) {
  // 檢查是否已經添加了按鈕
  if (document.querySelector('.account-button-container')) {
    console.log("按鈕已存在，不重複添加");
    return;
  }

  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'account-button-container';
  buttonContainer.style.cssText = 'margin-top: 10px; display: flex;';

  const tagButton = createButton('新增標籤', openTagPopup);
  const noteButton = createButton('新增備註', openNotePopup);
  noteButton.classList.add('add-note-button');

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
  const userId = getUserIdFromUrl();
  showNoteDialog(userId, username);
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
    buttonsAdded = false; // 重置標誌
    checkAndAddButtons();
  }
  if (request.action === "noteSaved") {
    console.log("備註已保存，刷新顯示");
    // 在這裡添加更新備註顯示的邏輯
    const noteDisplay = document.querySelector('.account-note-display');
    if (noteDisplay) {
      const username = getUserName();
      chrome.storage.sync.get(['notes'], function(result) {
        if (result.notes && result.notes[username]) {
          noteDisplay.textContent = `備註: ${result.notes[username]}`;
          noteDisplay.style.display = 'block';
        } else {
          noteDisplay.style.display = 'none';
        }
      });
    }
  }
});

function showNoteDialog(userId, username) {
  // 如果已經有一個對話框打開，就關閉它
  if (currentDialog) {
    currentDialog.close();
    currentDialog.remove();
  }

  const dialog = document.createElement('dialog');
  currentDialog = dialog;
  
  // 獲取現有的備註
  chrome.storage.sync.get(['notes'], function(result) {
    const existingNote = result.notes && result.notes[username] ? result.notes[username] : '';
    
    dialog.innerHTML = `
      <form method="dialog">
        <h2>新增/修改備註 - @${username}</h2>
        <textarea id="noteText" rows="6" cols="50">${existingNote}</textarea>
        <br>
        <button type="submit">保存</button>
        <button type="button" id="cancelButton">取消</button>
      </form>
    `;
    
    // 應用樣式
    dialog.style.cssText = `
      padding: 20px;
      border: 1px solid #ccc;
      border-radius: 5px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    `;
    
    const style = document.createElement('style');
    style.textContent = `
      dialog::backdrop {
        background-color: rgba(0, 0, 0, 0.5);
      }
      dialog form {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      dialog textarea {
        resize: vertical;
        min-height: 100px;
      }
      dialog button {
        padding: 5px 10px;
        cursor: pointer;
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(dialog);
    
    dialog.querySelector('#cancelButton').addEventListener('click', () => {
      dialog.close();
    });
    
    dialog.addEventListener('close', () => {
      const noteText = dialog.querySelector('#noteText').value;
      if (noteText !== existingNote) {  // 只有當備註內容變更時才保存
        chrome.runtime.sendMessage({
          action: "saveNote",
          userId: userId,
          note: noteText
        });
      }
      dialog.remove();
      currentDialog = null;
    });
    
    dialog.showModal();
  });
}

// 添加這兩個輔助函數
function getUserIdFromUrl() {
  const match = window.location.pathname.match(/\/(\w+)$/);
  return match ? match[1] : '';
}