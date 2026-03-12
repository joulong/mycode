const GAS_URL = "https://script.google.com/macros/s/AKfycbxzzUNtXrcM3RAHkts7ppYs986OwKRvk0ccvKP3qN9_OOuSKZrMHiZiIaBB9_odZbuyuA/exec";

function checkAuth() {
  if(document.getElementById('adminPwd').value === '1234') { // 建議改更複雜的驗證
    document.getElementById('authArea').classList.add('d-none');
    document.getElementById('managerArea').classList.remove('d-none');
    loadData();
  } else { alert("密碼錯誤"); }
}


// 修改載入表格邏輯，顯示連結
function loadData() {
  fetch(GAS_URL).then(res => res.json()).then(data => {
    const tbody = document.getElementById('managerTable');
    tbody.innerHTML = data.map(item => `
      <tr>
        <td>${item['主題']}</td>
        <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          <a href="${item['連結']}" target="_blank">${item['連結']}</a>
        </td>
        <td>
          <button class="btn btn-warning btn-sm me-2" onclick="editLink('${item['主題']}')">編輯連結</button>
          <button class="btn btn-danger btn-sm" onclick="deleteItem('${item['主題']}')">刪除</button>
        </td>
      </tr>
    `).join('');
  });
}

// 編輯連結的函數
function editLink(title) {
  const newLink = prompt("請輸入新的連結網址:");
  if (newLink) {
    // 呼叫 GAS，記得 action 要改為更新連結
    fetch(`${GAS_URL}?action=updateLink&title=${encodeURIComponent(title)}&link=${encodeURIComponent(newLink)}`)
      .then(() => {
        alert("連結已更新");
        loadData();
      });
  }
}

function addItem() {
  const title = document.getElementById('newTitle').value;
  const desc = document.getElementById('newDesc').value;
  const author = document.getElementById('newAuthor').value;
  const type = document.getElementById('newType').value;
  
  // 將所有參數打包傳送
  const url = `${GAS_URL}?action=add&title=${encodeURIComponent(title)}&desc=${encodeURIComponent(desc)}&author=${encodeURIComponent(author)}&type=${encodeURIComponent(type)}`;
  
  fetch(url)
    .then(() => {
      alert('新增成功');
      loadData();
    });
}


function deleteItem(title) {
  fetch(GAS_URL + "?action=delete&title=" + encodeURIComponent(title))
    .then(() => loadData());
}