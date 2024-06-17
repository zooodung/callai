updateCurrentTime();
setInterval(updateCurrentTime, 60000); // 60초 = 1분

const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('username');

console.log(username)

const textBox = document.querySelector('.text-box');
const numberButtons = document.querySelectorAll('.number-button');
const callingButton = document.querySelector('.calling-button');
const removeButton = document.querySelector('.remove-button');
let newText

numberButtons.forEach(button => {
    button.addEventListener('click', () => {
      const currentText = textBox.textContent;
      newText = currentText + button.textContent;
  
      // 하이픈 추가
      switch (newText.length) {
        case 3:
          textBox.textContent = newText + "-";
          break;
        case 8:
          textBox.textContent = newText + "-";
          break;
        default:
          textBox.textContent = newText;
      }
    });
});

callingButton.addEventListener('click', () => {
    const urlParams = new URLSearchParams({
        phone_number: newText
    });
    window.location.href = `calling.html?username=${username}`; 

    //console.log(newText);
});

removeButton.addEventListener('click', () => {
    newText = textBox.textContent.slice(0, -1);
    textBox.textContent = newText;
});



function updateCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('current-time').textContent = `${hours}:${minutes}`;
}

