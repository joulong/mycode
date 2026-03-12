// 1. 全域變數定義
let timer;
const display = document.getElementById('display');
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// 2. 初始化下拉選單
function populateSelect(id, limit, label) {
    const select = document.getElementById(id);
    let defaultOpt = document.createElement('option');
    defaultOpt.text = label;
    defaultOpt.value = 0;
    select.appendChild(defaultOpt);

    for (let i = 1; i <= limit; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.text = i.toString().padStart(2, '0');
        select.appendChild(option);
    }
}

// 執行下拉選單初始化
populateSelect('hours', 12, '時');
populateSelect('minutes', 59, '分');
populateSelect('seconds', 59, '秒');

// 3. 音效處理函式
function playTick() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}

function playExplosion() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const bufferSize = audioCtx.sampleRate * 2;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(100, audioCtx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 2);
    noise.connect(filter);
    filter.connect(audioCtx.destination);
    noise.start();
}


// 切換設定欄位的顯示/隱藏
function toggleLineSettings() {
    const settingsDiv = document.getElementById('lineSettings');
    if (settingsDiv.style.display === 'none' || settingsDiv.style.display === '') {
        settingsDiv.style.display = 'block';
    } else {
        settingsDiv.style.display = 'none';
    }
}

// 儲存設定 (同時會自動隱藏欄位)
function saveLineSettings() {
    localStorage.setItem('lineUserId', document.getElementById('lineUserId').value);
    localStorage.setItem('lineChannelSecret', document.getElementById('lineChannelSecret').value);
    localStorage.setItem('lineAccessToken', document.getElementById('lineAccessToken').value);
    alert("LINE 設定已儲存！");
    toggleLineSettings(); // 存完後自動關閉設定區
}
// 2. 頁面載入時自動填入上次的設定
window.addEventListener('load', () => {
    document.getElementById('lineUserId').value = localStorage.getItem('lineUserId') || '';
    document.getElementById('lineChannelSecret').value = localStorage.getItem('lineChannelSecret') || '';
    document.getElementById('lineAccessToken').value = localStorage.getItem('lineAccessToken') || '';
});

// 3. 發送訊息到 LINE 的核心函式
// async function sendLineMessage(message) {
//     const userId = localStorage.getItem('lineUserId');
//     const token = localStorage.getItem('lineAccessToken');

//     if (!userId || !token) {
//         console.error("請先設定 LINE 參數");
//         return;
//     }

//     const response = await fetch('https://api.line.me/v2/bot/message/push', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${token}`
//         },
//         body: JSON.stringify({
//             to: userId,
//             messages: [{ type: 'text', text: message }]
//         })
//     });
//     return response.ok;
// }



// 請更換成你剛才部署得到的 GAS 網址
const GAS_URL = 'https://script.google.com/macros/s/AKfycbyg-ezK-_pG0V-w-rwq65MwOLRgjw_ZKffzssra3kOJ36vdTImls4GspWgj4E459UWv/exec';

async function sendLineViaGAS(msg) {
    const userId = localStorage.getItem('lineUserId');
    const accessToken = localStorage.getItem('lineAccessToken');

    if (!userId || !accessToken) {
        console.log("LINE 設定不完整，取消傳送");
        return;
    }

    try {
        await fetch(GAS_URL, {
            method: 'POST',
            mode: 'no-cors', // 解決跨域問題
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userId,
                accessToken: accessToken,
                message: msg
            })
        });
        console.log("LINE 訊息已透過 GAS 送出");
    } catch (e) {
        console.error("發送失敗:", e);
    }
}


// 全螢幕切換
document.getElementById('fullScreenBtn').addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
});

// 快捷時間設定
function setQuickTime(mins) {
    document.getElementById('minutes').value = mins;
    document.getElementById('seconds').value = 0;
    document.getElementById('hours').value = 0;
}

let totalTime; // 儲存初始總時間以便計算進度

function startTimer() {
    clearInterval(timer);
    let h = parseInt(document.getElementById('hours').value) || 0;
    let m = parseInt(document.getElementById('minutes').value) || 0;
    let s = parseInt(document.getElementById('seconds').value) || 0;
    let totalSeconds = h * 3600 + m * 60 + s;
    totalTime = totalSeconds; // 儲存初始值

    if (totalSeconds <= 0) return;

    timer = setInterval(() => {
        totalSeconds--;
        updateDisplay(totalSeconds);
        updateProgress(totalSeconds); // 更新進度條

        if (totalSeconds <= 0) {
            clearInterval(timer);
            playExplosion();

            // 檢查「傳送 LINE」開關是否開啟
            if (document.getElementById('lineNotifyToggle').checked) {
                // 這裡就是你準備要呼叫 LINE API 的地方
                console.log("準備發送 LINE 通知...");
                // sendLineMessage("💥計時器已結束！");
                sendLineViaGAS("設定"+totalTime.toString()+ "秒💥 計時器已結束！");
            }
            
            document.getElementById('bombModal').style.display = 'block';
        } else if (document.getElementById('soundToggle').checked) {
            playTick();
        }
    }, 1000);
}

function updateProgress(current) {
    const bar = document.getElementById('progress-bar');
    const percentage = (current / totalTime) * 100;
    bar.style.width = percentage + "%";
}

// 輔助顯示函式 (先前已定義)
function updateDisplay(totalSeconds) {
    let hh = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    let mm = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    let ss = (totalSeconds % 60).toString().padStart(2, '0');
    display.innerText = `${hh}:${mm}:${ss}`;
}


// A. 多語言詞庫
const translations = {
    zh: { title: "倒數計時器", start: "開始倒數", reset: "重置" },
    en: { title: "Countdown Timer", start: "Start", reset: "Reset" }
};

// B. 儲存與載入設定 (localStorage)
function saveSettings() {
    localStorage.setItem('theme', document.getElementById('themeSelect').value);
    localStorage.setItem('lang', document.getElementById('langSelect').value);
}

function loadSettings() {
    const theme = localStorage.getItem('theme') || 'default';
    const lang = localStorage.getItem('lang') || 'zh';
    
    document.documentElement.setAttribute('data-theme', theme);
    document.getElementById('themeSelect').value = theme;
    document.getElementById('langSelect').value = lang;
    changeLanguage(); // 套用語言
}

// C. 執行切換邏輯
function changeTheme() {
    const theme = document.getElementById('themeSelect').value;
    document.documentElement.setAttribute('data-theme', theme);
    saveSettings();
}

function changeLanguage() {
    const lang = document.getElementById('langSelect').value;
    document.querySelector('h1').innerText = translations[lang].title;
    document.getElementById('startBtn').innerText = translations[lang].start;
    document.getElementById('resetBtn').innerText = translations[lang].reset;
    saveSettings();
}

// 頁面載入時自動恢復設定
window.onload = loadSettings;


// 全螢幕按鈕事件
document.getElementById('fullScreenBtn').addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
});


// 5. 其他控制功能
function resetTimer() {
    clearInterval(timer);
    display.innerText = "00:00:00";
    document.getElementById('hours').value = 0;
    document.getElementById('minutes').value = 0;
    document.getElementById('seconds').value = 0;
}

function closeModal() {
    document.getElementById('bombModal').style.display = 'none';
    resetTimer();
}

// 事件綁定
document.getElementById('startBtn').addEventListener('click', startTimer);
document.getElementById('resetBtn').addEventListener('click', resetTimer);