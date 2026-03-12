// --- 1. 全域變數 ---
const GAS_URL = "https://script.google.com/macros/s/AKfycbxzzUNtXrcM3RAHkts7ppYs986OwKRvk0ccvKP3qN9_OOuSKZrMHiZiIaBB9_odZbuyuA/exec";
let allData = [];
let currentDisplayData = [];
let isDescending = true;

// --- 2. 路由與初始化 ---
window.addEventListener('load', () => {
    // 初始載入資料
    fetch(GAS_URL)
        .then(res => res.json())
        .then(data => {
            allData = data;
            handleRouting(); // 資料讀取後才觸發路由
            const loader = document.getElementById('loader');
            if(loader) loader.style.display = 'none';
        });
});

// window.addEventListener('hashchange', handleRouting);

function handleRouting() {
    const hash = window.location.hash || '#browse';
    const browsePage = document.getElementById('browsePage');
    const adminPage = document.getElementById('adminPage');
    const tabBrowse = document.getElementById('tab-browse');
    const tabAdmin = document.getElementById('tab-admin');

    // 切換頁面顯示 (使用 toggle 加上布林值最安全)
    browsePage.classList.toggle('d-none', hash !== '#browse');
    adminPage.classList.toggle('d-none', hash === '#browse');

    // 同步 Tab 的亮起狀態
    if (tabBrowse && tabAdmin) {
        tabBrowse.classList.toggle('active', hash === '#browse');
        tabAdmin.classList.toggle('active', hash === '#admin');
    }

    // 執行對應頁面的資料載入
    if (hash === '#admin') {
        console.log("切換至管理頁面");
        // 如果還沒登入，會顯示 authArea；如果登入過，可以手動呼叫 loadData()
    } else {
        console.log("切換至瀏覽頁面");
        if (allData.length > 0) renderCards(allData);
    }
}

// --- 3. 瀏覽區邏輯 (原 Browse.js) ---
function renderCards(data) {
    const container = document.getElementById('cardContainer');
    if (!container) return;
    container.innerHTML = data.map(item => `
        <div class="col-12 col-md-6 col-lg-4">
            <div class="glass-card">
                <div class="card-content">
                    <h3 class="fw-bold">${item['主題']}</h3>
                    <p class="text-white-50">${item['描述'] || ''}</p>
                    <hr>
                    <div class="small">
                        作者：${item['作者']}<br>
                        類型：${item['類型']}<br>
                        試玩次數：<span id="count-${item['主題']}">${item['次數']}</span><br>
                        點讚數：<span id="like-${item['主題']}">${item['點讚數'] || 0}</span>
                    </div>
                </div>
                <div class="mt-3 d-flex gap-2">
                    <button class="btn btn-custom flex-grow-1" onclick="trackAndOpen('${item['主題']}', '${item['連結']}')">立即瀏覽</button>
                    <button class="btn btn-outline-light" onclick="likeItem('${item['主題']}')">❤️</button>
                </div>
            </div>
        </div>
    `).join('');
}

function filterData() {
  const searchInput = document.getElementById('searchInput');
  const searchTerm = searchInput.value.trim().toLowerCase();
  const typeValue = document.getElementById('typeFilter').value;

  // 1. 如果搜尋框有字，儲存到 localStorage
  if (searchTerm.length > 0) {
    saveSearchHistory(searchTerm);
  }

  // 2. 既有的篩選邏輯
  currentDisplayData = allData.filter(item => {
    const matchesSearch = item['主題'].toLowerCase().includes(searchTerm) || 
                          (item['描述'] || '').toLowerCase().includes(searchTerm);
    const matchesType = (typeValue === '全部') || (item['類型'] === typeValue);
    return matchesSearch && matchesType;
  });

  renderCards(currentDisplayData);
}

// 寫入 localStorage 的輔助函式
function saveSearchHistory(term) {
  let history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
  
  // 如果已經存在，先刪除舊的再放到最前面 (保持最新紀錄在最前)
  history = history.filter(item => item !== term);
  history.unshift(term);
  
  // 只保留最新的 5 筆
  history = history.slice(0, 5);
  localStorage.setItem('searchHistory', JSON.stringify(history));
}

function renderHistory() {
  const historyList = document.getElementById('historyList');
  if (!historyList) return; // 確保元素存在，避免報錯

  const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
  
  // 生成標籤 HTML
  historyList.innerHTML = history.map(term => `
    <span class="badge bg-secondary me-2" 
          style="cursor:pointer; background-color: rgba(255,255,255,0.2) !important;" 
          onclick="useHistory('${term}')">
      ${term}
    </span>
  `).join('');
}

// 點擊歷史標籤直接搜尋
function useHistory(term) {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.value = term;
    filterData(); // 重新篩選列表
  }
}


function sortData() {
    isDescending = !isDescending;
    const dataToSort = (currentDisplayData.length > 0) ? [...currentDisplayData] : [...allData];
    dataToSort.sort((a, b) => isDescending ? (b['次數'] - a['次數']) : (a['次數'] - b['次數']));
    renderCards(dataToSort);
}

function trackAndOpen(title, url) {
    const countSpan = document.getElementById('count-' + title);
    countSpan.innerText = parseInt(countSpan.innerText) + 1;
    fetch(GAS_URL + "?action=increment&title=" + encodeURIComponent(title));
    window.open(url, '_blank');
}

function likeItem(title) {
    const likeSpan = document.getElementById('like-' + title);
    likeSpan.innerText = parseInt(likeSpan.innerText) + 1;
    fetch(GAS_URL + "?action=like&title=" + encodeURIComponent(title));
}

// --- 4. 管理後台邏輯 (原 Browse_manager.js) ---
function checkAuth() {
    if(document.getElementById('adminPwd').value === '1234') {
        document.getElementById('authArea').classList.add('d-none');
        document.getElementById('managerArea').classList.remove('d-none');
        loadData();
    } else { alert("密碼錯誤"); }
}

function loadData() {
    const tbody = document.getElementById('managerTable');
    // 如果表格不在當前頁面，直接跳過，不要報錯
    if (!tbody) {
        console.warn("目前不在管理後台，跳過表格渲染");
        return;
    }
    
    fetch(GAS_URL)
        .then(res => res.json())
        .then(data => {
            tbody.innerHTML = data.map(item => `
                <tr>
                    <td>${item['主題']}</td>
                    <td><a href="${item['連結']}" target="_blank">${item['連結']}</a></td>
                    <td>
                        <button class="btn btn-warning btn-sm me-2" onclick="editLink('${item['主題']}')">編輯</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteItem('${item['主題']}')">刪除</button>
                    </td>
                </tr>
            `).join('');
        });
}

function editLink(title) {
    const newLink = prompt("請輸入新的連結網址:");
    if (newLink) {
        fetch(`${GAS_URL}?action=updateLink&title=${encodeURIComponent(title)}&link=${encodeURIComponent(newLink)}`)
            .then(() => { alert("連結已更新"); loadData(); });
    }
}

function addItem() {
    // 1. 抓取 HTML 欄位的值
    const title = document.getElementById('newTitle').value;
    const link = document.getElementById('newLink').value;
    const author = document.getElementById('newAuthor').value;

    if (!title || !link) {
        alert("主題和連結不能為空！");
        return;
    }

    // 2. 組裝傳送給 GAS 的參數 (注意 action=add)
    const url = `${GAS_URL}?action=add&title=${encodeURIComponent(title)}&link=${encodeURIComponent(link)}&author=${encodeURIComponent(author)}`;

    // 3. 發送請求並重新整理表格
    fetch(url)
        .then(() => {
            alert('新增成功');
            // 清空輸入框
            document.getElementById('newTitle').value = '';
            document.getElementById('newLink').value = '';
            document.getElementById('newAuthor').value = '';
            // 重新載入表格顯示最新資料
            loadData();
        })
        .catch(err => alert("新增失敗：" + err));
}

function deleteItem(title) {
    fetch(GAS_URL + "?action=delete&title=" + encodeURIComponent(title))
        .then(() => loadData());
}

// 頁面載入完成後執行
document.addEventListener('DOMContentLoaded', () => {
    // 1. 初始化顯示
    renderHistory(); 
    
    // 2. 如果你有其他初始化動作，也都放在這裡
    // loadData(); 
});

// 監聽網址 # 變動
window.addEventListener('hashchange', handleRouting);
// 頁面第一次載入時也要跑一次，確保停在正確頁面
window.addEventListener('load', handleRouting);