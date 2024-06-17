import { generateSpeech } from './openai_tts.js';

updateCurrentTime();
setInterval(updateCurrentTime, 60000); 

const urlParams = new URLSearchParams(window.location.search);
const character = urlParams.get('character');
const attitude = urlParams.get('attitude');
const username = urlParams.get('username');
console.log(username)

console.log('캐릭터 이름:', character);
console.log('말투:', attitude);

let user_history = []
let ai_history = []
let summary = ''
let emotion = '긍정'
let comment = ''

getTrainingSentence(); // 페이지 로드 시 첫 문장 생성

const micButton = document.querySelector('.mic-button');
const micStopButton = document.querySelector('.mic-stop-button');
const calldeclineButton = document.querySelector('.call-decline-button');
const centerHalf = document.querySelector('#center-half'); 
const chatBox = document.getElementById('chat-box');

let loadingElement;
let user_bubble;
let mediaRecorder;
let recordedChunks = [];

calldeclineButton.style.display = 'none';

micButton.addEventListener('click', async () =>  {
    micButton.style.display = 'none'; 
    calldeclineButton.style.display = 'none';
    micStopButton.style.display = 'block'; 
    centerHalf.style.backgroundColor = 'rgba(135, 206, 250, 0.7)';

    user_bubble = document.createElement('div');
    user_bubble.className = 'user_bubble';
    chatBox.appendChild(user_bubble);

    loadingElement = document.createElement('div'); 
    loadingElement.classList.add('loading-domino');

    for (let i = 0; i < 5; i++) { 
        const block = document.createElement('div');
        block.classList.add('domino-block');
        loadingElement.appendChild(block);
    }

    user_bubble.appendChild(loadingElement);

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

micStopButton.addEventListener('click', async () => {
    micStopButton.style.display = 'none';
    micButton.style.display = 'block';
    calldeclineButton.style.display = 'block';
    centerHalf.style.backgroundColor = '';

    if (user_bubble.contains(loadingElement)) {
        user_bubble.removeChild(loadingElement);
    }

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

            const response = await fetch('/stt', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            const transcript = data.transcript;
            console.log("User STT :", transcript);

            user_history.push(transcript);
            user_bubble.textContent = transcript;
            
            const aiResponse = await fetch('/training_sentence', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ character, attitude, input_text: transcript, history: { user_history, ai_history } }),
            });

            if (aiResponse.ok) {
                const responseData = await aiResponse.json();
                const aiSentence = responseData.sentence;
                ai_history.push(aiSentence);
                displaySentence(aiSentence);
                generateSpeech(aiSentence);
            } else {
                console.error('AI 응답 에러:', aiResponse.status);
            }

        } catch (error) {
            console.error("Error transcribing audio:", error);
        }
    }


});


calldeclineButton.addEventListener('click', async () => {
    const aiSummary = await fetch('/training_result', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ character, history: { user_history, ai_history } }),
    });

    console.log(history);

    if (aiSummary.ok) {
        const responseData = await aiSummary.json();
        summary = responseData.sentence;
        comment = responseData.comment;
        emotion = responseData.emotion;
        console.log("통화 내용 요약: ", summary)
        console.log("AI comment: ", comment)
        console.log("대화 분위기: ", emotion)
        const urlParams = new URLSearchParams({
            summary: summary,
            emotion: emotion,
            comment: comment,
            username: username
        });
        window.location.href = 'training_result.html?' + urlParams.toString();

    } else {
        console.error('AI 응답 에러:', aiSummary.status);
        alert("통화 내용 요약 오류");
    }


});

async function getTrainingSentence() {
    try {
      const response = await fetch('/training_first_sentence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ character, attitude }),
      });
  
      if (response.ok) {
        const data = await response.json();
        const firstTrainingSentence = data.sentence;
  
        ai_history.push(firstTrainingSentence); 
        console.log("AI first : ", firstTrainingSentence)
        
        displaySentence(firstTrainingSentence);
        generateSpeech(firstTrainingSentence); 
      } else {
        console.error('서버 응답 에러:', response.status);
      }
    } catch (error) {
      console.error('오류 발생:', error);
    }
}

function displaySentence(sentence) {
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = sentence;
    chatBox.appendChild(bubble);
}

function updateCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0'); 
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('current-time').textContent = `${hours}:${minutes}`;
}
  