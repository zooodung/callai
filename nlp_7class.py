import torch
import torch.nn.functional as F
from transformers import AutoTokenizer, AutoModelForSequenceClassification

PATH = r'nlp_model\\beomi.pth'

# 미리 학습한 모델과 토크나이저 로드
tokenizer = AutoTokenizer.from_pretrained("beomi/KcELECTRA-base")
model = torch.load(PATH, map_location=torch.device('cpu'))  # Load on CPU

emotion_labels = ['angry', 'disgust', 'fear', 'happiness', 'neutral', 'sadness', 'surprise']
emotion_korean = {
    'angry': '분노',
    'disgust': '혐오',
    'fear': '불안',
    'happiness': '행복',
    'neutral': '중립',
    'sadness': '슬픔',
    'surprise': '놀람'
}

emotion_categories = {
    '분노': '부정',
    '혐오': '부정',
    '불안': '부정',
    '행복': '긍정',
    '슬픔': '부정',
    '중립': '중립',
}

def predict_emotion(sentence):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)

    inputs = tokenizer(sentence, return_tensors='pt')
    input_ids = inputs['input_ids'].to(device)
    attention_mask = inputs['attention_mask'].to(device)

    with torch.no_grad():
        outputs = model(input_ids, attention_mask=attention_mask)
        logits = outputs.logits
        probabilities = F.softmax(logits, dim=1).cpu().numpy()[0]

    adjusted_probs = [probabilities[i] for i, label in enumerate(emotion_labels) if label != 'surprise']
    total_prob = sum(adjusted_probs)

    result_probs = {'긍정': 0.0, '중립': 0.0, '부정': 0.0}
    for i, label in enumerate(emotion_labels):
        if label != 'surprise':
            emotion = emotion_korean[label]
            category = emotion_categories[emotion]
            result_probs[category] += probabilities[i]

    result_probs = {k: f"{(v / total_prob) * 100:.2f}%" for k, v in result_probs.items()}

    return result_probs

#sample_sentence = input("문장을 입력하세요: ")
#predicted_emotion = predict_emotion(sample_sentence)
#print(f"입력 문장: {sample_sentence}")
#print(f"예측 감정: {predicted_emotion}")

def extract_percentage(emotion_str):
    return float(emotion_str.rstrip('%'))

#max_emotion = max(predicted_emotion, key=lambda x: extract_percentage(predicted_emotion[x]))

#result = max_emotion

#print(f"가장 높은 감정: {result}")