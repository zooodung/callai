import openai

client = openai.OpenAI(api_key='API_KEY') 

conversation_history = []


# 핵심 단어 입력으로 자연스러운 문장 생성
def openai_user_sentence(words, structure, attitude):
    input_words = ', '.join(words)
    
    prompt = f"""
    핵심 단어 : {input_words}
    문장 형식 : {structure}

    사용자가 입력한 핵심 단어들을 연결 및 사용하여서 문장 형식에 맞게 자연스러운 문장을 생성해야함.

    1. 핵심 단어를 생성할 문장에 전부 반영하여야 함.
    2. 문장은 상대방에게 전달할 내용이기 때문에 명확해야함.
    3. 추상적이고, 일관적인 문장을 생성하지 않아야함.
    4. 실제 전화 통화 및 타인과의 대화에 사용하는 말투로 생성하여야함.
    5. 문장 형식이 '의문문'이 아닐 때는 물어보는 문장을 생성하지 않아야 함.
    6. {attitude}로 문장을 생성해야함.
    7. 적절한 길이로 생성해야함.
    8. 핵심 단어가 '시작 인사', '마무리 인사'와 동일한 경우 문장에 핵심 단어를 필수적으로 포함하지 않아도 되며 일상에 자주 사용되는 인사말 문장으로 의미만 명확하게 전달.
    9. 핵심 단어가 '기다려'와 동일한 경우 문장에 핵심 단어를 필수적으로 포함하지 않아도 되며 기다려달라는 문장을 짧은 한 문장으로 생성해야 함. 

    """
    response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
            {"role": "system", "content": "Your role is to connect the words and sentence structures entered by the user to form natural sentences in Korean that will be used in phone calls and conversations with others."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.8,
        max_tokens=300,
    )

    # API에서 반환된 텍스트
    text = response.choices[0].message.content
    
    return text

#imp_words = ["내일 오후 1시에 만나고 싶어.", "근데 로또 5천원 당첨", "교환하러 가야되는데", "야구는 오늘 이겼대?"]
#text = openai_user_sentence(imp_words , '청유문', '반말')

#print(f'AI answer: {text}')


# 특정 인물에 맞추어 인삿말 생성
def openai_training_first_sentence(situation, attitude):
    prompt = f"""
    특정 인물 : {situation}

    특정 인물이 되어 아주 간략하게 자신을 소개하고 인사하는 문장을 생성해야함.
    
    1. 특정 인물을 인지할 수 없을때만 인물 입력을 다시 진행해달라고 요청 문장을 생성해야함, 특정 인물을 인지할 수 없으면 1번 단계는 생략함.
    2. 실제 전화 통화 및 타인과의 대화에 사용하는 말투로 생성하여야함.
    3. {attitude}로 문장을 생성해야함.
    4. 생성되는 문장에 이름을 포함하지 않아야 함.
    """
    response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
            {"role": "system", "content": "You need to take on a specific character and generate appropriate responses to the sentences entered by the user."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.8,
        max_tokens=300,
    )

    # API에서 반환된 텍스트
    text = response.choices[0].message.content
    
    return text

#text = openai_training_first_sentence('편의점 아르바이트생', '존댓말')
#print(f'{text}')

# 특정 인물에 맞추어 사용자 입력에 따른 답변 문장 생성
def openai_training_sentence(situation, attitude, input_text, history):
    prompt = f"""
    특정 인물 : {situation}
    입력 문장 : {input_text}
    이전 대화 내용 : {history}

    특정 인물이 되어 사용자가 입력한 문장에 대한 적절한 답변을 생성해야함.

    1. 이전 대화 내용을 참고하여 답변을 생성해야함.
    2. 추상적이고, 일관적인 문장을 생성하지 않아야함.
    3. 실제 전화 통화 및 타인과의 대화에 사용하는 말투로 생성하여야함.
    4. 한번의 답변에 한번의 물음만을 생성해야함.
    5. {attitude}로 문장을 생성해야함.
    6. 적절한 길이로 문장을 생성해야함.
    """
    response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
            {"role": "system", "content": "You need to take on a specific character and generate appropriate responses to the sentences entered by the user."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.8,
        max_tokens=300,
    )

    # API에서 반환된 텍스트
    text = response.choices[0].message.content
    
    return text

#history = ['openai api text : 안녕하세요 은행직원입니다.', 'user input : 네 안녕하세요', 'openai api text : 무슨 일 때문에 전화주셨죠?']

#text = openai_training_sentence('은행 직원', '존댓말', '통장을 만들고 싶어요.', history)
#print(f'AI answer: {text}')


# 통화 내용 요약
def openai_get_summary(situation, history):
    prompt = f"""
    특정 인물 : {situation}
    대화 내용 : {history}

    대화 내용 전체에 대한 요약 글을 생성해야함.

    1. 대화 내용 전부를 참고 및 반영하여 요약 글을 생성해야함.
    2. 특정 인물이 'unknown'이라면 통화 내용을 바탕으로 상대방이 누군지 추측해서 반영해야함.
    3. 요약 글에 어떤 특정 인물과 전화한 것인지 포함해야함.
    4. 50 글자 내외로 문장을 생성해야함.
    """
    response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
            {"role": "system", "content": "You need to generate a summary of the entire conversation, including which specific character was spoken to."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.8,
        max_tokens=300,
    )

    # API에서 반환된 텍스트
    text = response.choices[0].message.content
    
    return text

#history = ['openai api text : 안녕하세요 은행직원입니다.', 'user input : 네 안녕하세요', 'openai api text : 무슨 일 때문에 전화주셨죠?']

#text = openai_get_summary('은행 직원', history)
#print(f'AI answer: {text}')

# AI comment
def openai_get_comment(situation, history):
    prompt = f"""
    특정 인물 : {situation}
    대화 내용 : {history}

    대화 내용 전체에 대한 격려와 대화 스킬면에서의 개선점을 포함한 조언 문장을 생성해야함.

    1. 대화 내용 전부를 참고 및 반영하여 생성해야함.
    2. 명확한 의미들로 생성해야함.
    3. 추상적이고, 일관적인 문장을 생성하지 않아야함.
    4. 우선 칭찬 혹은 격려와 같은 따뜻한 문장으로 시작하여야 함.
    5. 특정 인물과의 대화에 대해서 대화 스킬적으로 개선할 방안이 있다면 조언 문장에 포함해야 하며 이미 충분히 좋은 대화 스킬을 가지고 있다고 판단하면 칭찬하여야 함.
    6. 150 글자 내외로 문장을 생성해야함.
    """
    response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
            {"role": "system", "content": "You should generate sentences that include encouragement for the entire conversation as well as advice for improving conversational skills."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.8,
        max_tokens=300,
    )

    # API에서 반환된 텍스트
    text = response.choices[0].message.content
    
    return text

#history = ['openai api text : 안녕하세요 은행직원입니다.', 'user input : 네 안녕하세요', 'openai api text : 무슨 일 때문에 전화주셨죠?']

#text = openai_get_summary('은행 직원', history)
#print(f'AI answer: {text}')


# STT
def openai_stt(audio_file_path):
    try:
        with open(audio_file_path, "rb") as audio_file:
            transcription = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file
            )
            if transcription.text.strip():  # Check if the returned text is not empty
                return transcription.text.strip()
            else:
                return "None"
    except FileNotFoundError:
        return "Audio file not found."
    
