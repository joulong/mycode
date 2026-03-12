// let allData = [];
const GAS_URL = "https://script.google.com/macros/s/AKfycbxzzUNtXrcM3RAHkts7ppYs986OwKRvk0ccvKP3qN9_OOuSKZrMHiZiIaBB9_odZbuyuA/exec";

window.onload = function() {
  fetch(GAS_URL)
    .then(res => res.json())
    .then(data => {
      allData = data;
      renderCards(allData);
      document.getElementById('loader').style.display = 'none';
    });

  document.getElementById('searchInput').addEventListener('input', filterData);
  document.getElementById('typeFilter').addEventListener('change', filterData);
};



// 1. 新增一個變數來儲存「當前顯示的資料」（包含篩選與排序後的結果）
let currentDisplayData = []; 

// 2. 修改 filterData：讓它不僅篩選，還要維持當前的排序狀態
function filterData() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const typeValue = document.getElementById('typeFilter').value;

  // 先篩選
  currentDisplayData = allData.filter(item => {
    const matchesSearch = item['主題'].toLowerCase().includes(searchTerm) || 
                          (item['描述'] || '').toLowerCase().includes(searchTerm);
    const matchesType = (typeValue === '全部') || (item['類型'] === typeValue);
    return matchesSearch && matchesType;
  });

  // 篩選後，直接渲染
  renderCards(currentDisplayData);
}



// 在檔案上方新增一個紀錄狀態的變數
let isDescending = true; 

function sortData() {
  // 切換排序方向：如果是大到小，下次就變小到大
  isDescending = !isDescending;

  // 使用當前的篩選資料進行排序
  const dataToSort = (currentDisplayData.length > 0) ? [...currentDisplayData] : [...allData];
  
  dataToSort.sort((a, b) => {
    return isDescending ? (b['次數'] - a['次數']) : (a['次數'] - b['次數']);
  });
  
  // 更新介面
  renderCards(dataToSort);
  
  // (選填) 更新按鈕文字，讓使用者知道現在是哪種排序
  const btn = document.querySelector('button[onclick="sortData()"]');
  btn.innerText = isDescending ? "按次數由大到小 ⇅" : "按次數由小到大 ⇅";
}

function renderCards(data) {
  const container = document.getElementById('cardContainer');
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

// 點讚功能邏輯
function likeItem(title) {
  const likeSpan = document.getElementById('like-' + title);
  // 樂觀更新畫面
  likeSpan.innerText = parseInt(likeSpan.innerText) + 1;
  // 發送請求給 GAS
  fetch(GAS_URL + "?action=like&title=" + encodeURIComponent(title))
    .then(() => console.log("點讚已同步"))
    .catch(err => console.error("點讚失敗:", err));
}

function trackAndOpen(title, url) {
  const countSpan = document.getElementById('count-' + title);
  let currentCount = parseInt(countSpan.innerText);
  countSpan.innerText = currentCount + 1;
  
  fetch(GAS_URL + "?action=increment&title=" + encodeURIComponent(title));
  window.open(url, '_blank');
}