updateCurrentTime();
setInterval(updateCurrentTime, 60000); 

const urlParams = new URLSearchParams(window.location.search);
const emotion = urlParams.get('emotion');
const summary = urlParams.get('summary');
const comment = urlParams.get('comment');
const username = urlParams.get('username');


console.log(username)

console.log("emotion: ", emotion);
console.log("summary: ", summary);

const summaryTextBox = document.querySelector('.result-container .text-box1');
summaryTextBox.textContent = summary;

const atmosphereTextBox = document.querySelector('.horizontal-section .text-box2');
atmosphereTextBox.textContent = emotion;

const commentTextBox = document.querySelector('.result-container .text-box3');
commentTextBox.textContent = comment;

const homeButton = document.querySelector('.home-button');


homeButton.addEventListener('click', () => {
    window.location.href = `main.html?username=${username}`; 
});

function updateCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0'); 
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('current-time').textContent = `${hours}:${minutes}`;
}
  