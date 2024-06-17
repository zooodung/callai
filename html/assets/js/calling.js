import { generateSpeech } from './openai_tts.js';

updateCurrentTime();
setInterval(updateCurrentTime, 60000); 

const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('username');
console.log(username)

let user_history = [];
let ai_history = [];
let user_sentence= '입력되지 않았습니다.';
let user_bubble;
let loadingElement;
let mediaRecorder;
let recordedChunks = [];
let character = '일반 전화통화 상대';
let summary = ''
let emotion = '긍정'
let comment = ''

const micButton = document.querySelector('.mic-button');
const micStopButton = document.querySelector('.mic-stop-button');
const speakerButton = document.querySelector('.speaker-button');
const chatBox = document.querySelector('.chat-box'); 
const calldeclineButton = document.querySelector('.call-decline-button');

const centerHalf = document.querySelector('#center-half');

micStopButton.style.display = 'none';

micButton.addEventListener('click', async () =>  {
    micButton.style.display = 'none';  
    micStopButton.style.display = 'block'; 

    centerHalf.style.backgroundColor = 'rgba(135, 206, 250, 0.7)';

    user_bubble = document.createElement('div');
    user_bubble.className = 'user_bubble';
    

    loadingElement = document.createElement('div'); 
    loadingElement.classList.add('loading-domino');

    for (let i = 0; i < 5; i++) { 
        const block = document.createElement('div');
        block.classList.add('domino-block');
        loadingElement.appendChild(block);
    }

    user_bubble.appendChild(loadingElement); 
    chatBox.appendChild(user_bubble);

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
        mediaRecorder = new MediaRecorder(stream);
    
        mediaRecorder.ondataavailable = event => {
          if (event.data.size > 0) {
            recordedChunks.push(event.data);
          }
        };
    
        mediaRecorder.start(); 
    } catch (error) {
        console.error('마이크 권한 오류:', error);
    }
    chatBox.scrollTop = chatBox.scrollHeight;
});

micStopButton.addEventListener('click', async () =>  {
    micButton.style.display = 'block';  
    micStopButton.style.display = 'none'; 

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

const textarea = document.querySelector("#keyword textarea");
const sentenceTypeSelect = document.getElementById("sentenceType");
const speechLevelRadios = document.querySelectorAll('input[name="speech-level"]');
const textBox = document.querySelector('.text-box');


let keywords = []
let type = 'none'
let attitude = '반말'

document.querySelector('.enter-button').addEventListener('click', async () => {
    keywords = textarea.value.split(',').map(keyword => keyword.trim());

    type = sentenceTypeSelect.value;

    for (const radio of speechLevelRadios) {
    if (radio.checked) {
        attitude = radio.value;
        break;
    }
    }

    console.log("keywords:", keywords);
    console.log("type:", type);
    console.log("attitude:", attitude);

    const aiResponse = await fetch('/user_sentence', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keywords, type, attitude }),
    });

    if (aiResponse.ok) {
        const responseData = await aiResponse.json();
        user_sentence = responseData.sentence;
        console.log(user_sentence)
        //user_history.push(user_sentence);
        textBox.textContent = user_sentence;
        //displaySentence(aiSentence);
        //generateSpeech(aiSentence);
    } else {
        console.error('AI 응답 에러:', aiResponse.status);
    }
    
});

speakerButton.addEventListener('click', async () =>  {
    //generateSpeech(user_sentence);
    getAndPlayAudio(user_sentence);
    user_history.push(user_sentence);

    user_bubble = document.createElement('div');
    user_bubble.className = 'user_bubble';
    chatBox.appendChild(user_bubble);
    user_bubble.textContent = user_sentence;
    chatBox.scrollTop = chatBox.scrollHeight;

    setTimeout(() => {
        get_sentence(character, attitude, user_sentence, user_history, ai_history);
    }, 5000); 
});


calldeclineButton.addEventListener('click', async () => {
    const aiSummary = await fetch('/training_result', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ character, history: { user_history, ai_history } }),
    });

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

async function get_sentence(character, attitude, user_sentence, user_history, ai_history) {
    const aiResponse = await fetch('/training_sentence', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ character, attitude, input_text: user_sentence, history: { user_history, ai_history } }),
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
}


function updateCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0'); 
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('current-time').textContent = `${hours}:${minutes}`;
}
  
function displaySentence(sentence) {
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = sentence;
    chatBox.appendChild(bubble);
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