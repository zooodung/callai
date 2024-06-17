updateCurrentTime();
setInterval(updateCurrentTime, 60000); // 60초 = 1분
const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('username');

console.log(username)
const characterInput = document.querySelector('.character-input');
const radioButtons = document.querySelectorAll('input[name="speech-level"]');
const confirmButton = document.querySelector('.confirm-button');

confirmButton.addEventListener('click', () => {
  const character = characterInput.value;
  let attitude = '존댓말';
  
  if (character === '') {
    alert('연습하고 싶은 인물을 입력해주세요.');
    location.reload(); // 페이지 새로고침
    return; 
  }

  radioButtons.forEach(radioButton => {
    if (radioButton.checked) {
        attitude = radioButton.value;
    }
  });

  console.log('캐릭터 이름:', character);
  console.log('말투:', attitude);

  const urlParams = new URLSearchParams({
    character: character,
    attitude: attitude,
    username: username
  });

  window.location.href = 'training.html?' + urlParams.toString();

});

function updateCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0'); 
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('current-time').textContent = `${hours}:${minutes}`;
}
  