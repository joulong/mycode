document.getElementById('surveyForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.disabled = true;
    btn.innerText = "傳送中...";

    const formData = new FormData(this);
    let data = {};
    formData.forEach((v, k) => data[k] = data[k] ? data[k] + ", " + v : v);

    fetch('https://script.google.com/macros/s/AKfycbwz1elp3btoU_zGKp89y7Hw3g_vzftGRIkZpKwpWo2it4Q_rYwyAFQhyJ_SVUr8waC_/exec', {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(() => {
        alert("提交成功！");
        btn.disabled = false;
        btn.innerText = "提交問卷";
        this.reset();
    });
});