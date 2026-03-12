async function loadNav(){

const res = await fetch("components/nav.html")

const html = await res.text()

document.getElementById("nav-container").innerHTML = html

}

window.addEventListener("DOMContentLoaded", loadNav)
