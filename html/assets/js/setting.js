updateCurrentTime();
setInterval(updateCurrentTime, 60000); // 60초 = 1분


const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('username');

const profileName = document.getElementById('profile-name');
profileName.textContent = username+"님의 목소리를 학습해주세요."; 

const micButton = document.querySelector('.mic-button');
const micStopButton = document.querySelector('.mic-stop-button');
const centerHalf = document.querySelector('#center-half');
const homeButton = document.querySelector('.home-button');
const speakerButton = document.querySelector('.speaker-button');

let mediaRecorder;
let recordedChunks = [];

const textToConvert = "안녕하세요."+  username + "님의 음성을 학습한 모델의 테스트 재생입니다. 다시 한번 재생하겠습니다. 안녕하세요." + username + "님의 음성을 학습한 모델의 테스트 재생입니다. 감사합니다.";


speakerButton.addEventListener('click', async () =>  {
    getAndPlayAudio(textToConvert);
});

micButton.addEventListener('click', async () =>  {
    micButton.style.display = 'none';  
    micStopButton.style.display = 'block'; 
    centerHalf.style.backgroundColor = 'rgba(135, 206, 250, 0.7)';

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
        mediaRecorder = new MediaRecorder(stream);
    
        mediaRecorder.ondataavailable = event => {
          if (event.data.size > 0) {
            recordedChunks.push(event.data);
          }
        };
    
        mediaRecorder.start(); // 녹음 시작
    } catch (error) {
        console.error('마이크 권한 오류:', error);
    }
});


micStopButton.addEventListener('click', async () =>  {
    micButton.style.display = 'block';  
    micStopButton.style.display = 'none'; 
    centerHalf.style.backgroundColor = '';

    if (mediaRecorder) {
        mediaRecorder.stop();

        await new Promise(resolve => {
            mediaRecorder.onstop = resolve;
        });

        const blob = new Blob(recordedChunks, { type: 'audio/wav' });
        recordedChunks = [];

        try {
            const formData = new FormData();
            formData.append('audio_file', blob, 'audio_file.wav');

            await fetch('/clone_user_voice', {
                method: 'POST',
                body: formData
            });

        } catch (error) {
            console.error("Error recording audio:", error);
        }
    }
    
});

homeButton.addEventListener('click', () => {
    window.location.href = `main.html?username=${username}`; 
});



function updateCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0'); 
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('current-time').textContent = `${hours}:${minutes}`;
}

async function getAndPlayAudio(userText) {
    try {
      const response = await fetch(`/get_voice_id?text=${encodeURIComponent(userText)}`); 
  
      if (!response.ok) {
        throw new Error('Failed to fetch audio from server');
      }
  
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
  
      // 오디오 로드 후 재생
      audio.addEventListener('canplaythrough', () => {
          audio.play();
      });
    } catch (error) {
      console.error("오디오 가져오기 또는 재생 오류:", error);
    }
}

  
  