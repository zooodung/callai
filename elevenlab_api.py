from elevenlabs.client import ElevenLabs
from elevenlabs import play
import tempfile
import requests
import json

api_key = "API_KEY"

client = ElevenLabs(
  api_key=api_key,
)

# 생성 혹은 찾아야 할 voice id
name="callai0915"

# voice id 탐색
def get_voice_id():
  url = "https://api.elevenlabs.io/v1/voices"

  headers = {
    "Accept": "application/json",
    "xi-api-key": api_key,
    "Content-Type": "application/json"
  }

  response = requests.get(url, headers=headers)

  data = response.json()

  for voice in data['voices']:
      if name == voice['name']:
          voice_id = voice['voice_id']
          print(f"{voice_id}; {voice['voice_id']}")
  
  return voice_id

# 사용자 목소리 학습
def clone_user_voice(audiopath):
    voice = client.clone(
      name= name,
      description="Korean male voice and he is developer.", #옵션
      files=[audiopath],
    )

    return voice
