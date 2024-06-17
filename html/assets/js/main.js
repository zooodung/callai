window.addEventListener('resize', adjustLayout);

// 초기 레이아웃 설정
adjustLayout();

const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('username');

updateCurrentTime();
setInterval(updateCurrentTime, 60000); // 60초 = 1분

const profileName = document.getElementById('profile-name');
profileName.textContent = username; // 실제 사용자 이름으로 변경

const callingButton = document.getElementsByClassName('calling-button')[0];
const trainingButton = document.getElementsByClassName('training-button')[0];
const settingButton = document.getElementsByClassName('setting-button')[0];

callingButton.addEventListener('click', () => {
    //alert('실제 전화 페이지로 이동');
    window.location.href = `calling_pad.html?username=${username}`; 
});

trainingButton.addEventListener('click', () => {
    //alert('연습 전화 페이지로 이동');
    window.location.href = `training_set.html?username=${username}`; 
});

settingButton.addEventListener('click', () => {
    //alert('사용자 설정 페이지로 이동'); 
    window.location.href = `setting.html?username=${username}`; 
});




function adjustLayout() {
    const leftHalf = document.getElementById('left-half');
    const rightHalf = document.getElementById('right-half');

    leftHalf.style.height = window.innerHeight + 'px';
    rightHalf.style.height = window.innerHeight + 'px';
}

function updateCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0'); 
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('current-time').textContent = `${hours}:${minutes}`;
}
  
