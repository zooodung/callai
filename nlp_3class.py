#torch>=1.1.0
#transformers>=3,<5
#gluonnlp
#mxnet

import torch
from transformers import AutoTokenizer, AutoModel
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
import gluonnlp as nlp
import numpy as np

# KoBERT 토크나이저 로드
tokenizer = AutoTokenizer.from_pretrained("skt/kobert-base-v1")
bertmodel = AutoModel.from_pretrained("skt/kobert-base-v1")

device = torch.device("cpu")

# 감성 라벨에 대응하는 한글 감정
emotion_labels = ['negative', 'positive', 'neutral']
emotion_korean = {
    'negative': '부정',
    'positive': '긍정',
    'neutral': '무감정'
}

# 훈련된 모델 불러오기
class BERTClassifier(torch.nn.Module):
    def __init__(self, bert, hidden_size=768, num_classes=3, dr_rate=None, params=None):
        super(BERTClassifier, self).__init__()
        self.bert = bert
        self.dr_rate = dr_rate
        self.classifier = torch.nn.Linear(hidden_size, num_classes)
        if dr_rate:
            self.dropout = torch.nn.Dropout(p=dr_rate)

    def gen_attention_mask(self, token_ids, valid_length):
        attention_mask = torch.zeros_like(token_ids)
        for i, v in enumerate(valid_length):
            attention_mask[i][:v] = 1
        return attention_mask.float()

    def forward(self, token_ids, valid_length, segment_ids):
        attention_mask = self.gen_attention_mask(token_ids, valid_length)
        _, pooler = self.bert(input_ids=token_ids, token_type_ids=segment_ids.long(), attention_mask=attention_mask.float().to(token_ids.device), return_dict=False)
        if self.dr_rate:
            out = self.dropout(pooler)
        return self.classifier(out)

# 모델 및 토크나이저 설정
vocab = nlp.vocab.BERTVocab.from_sentencepiece(tokenizer.vocab_file, padding_token='[PAD]')

# 데이터셋 정의
class BERTDataset(Dataset):
    def __init__(self, dataset, sent_idx, label_idx, bert_tokenizer, vocab, max_len, pad, pair):
        transform = nlp.data.BERTSentenceTransform(
            bert_tokenizer, max_seq_length=max_len, vocab=vocab, pad=pad, pair=pair)
        self.sentences = [transform([i[sent_idx]]) for i in dataset]
        self.labels = [np.int32(i[label_idx]) for i in dataset]

    def __getitem__(self, i):
        return (self.sentences[i] + (self.labels[i], ))

    def __len__(self):
        return len(self.labels)

# 최대 시퀀스 길이 설정
max_len = 64

# 모델 불러오기
model = BERTClassifier(bertmodel, dr_rate=0.5).to(device)
model.load_state_dict(torch.load('kobert3_tuning_state_dict.pth', map_location=device), strict=False)

# 문장 예측 함수 정의
def predict_sentence(predict_sentence):
    data = [predict_sentence, '0']
    dataset_another = [data]

    tok = tokenizer.tokenize
    another_test = BERTDataset(dataset_another, 0, 1, tok, vocab, max_len, True, False)
    test_dataloader = DataLoader(another_test, batch_size=1, num_workers=0)

    model.eval()

    for batch_id, (token_ids, valid_length, segment_ids, label) in enumerate(test_dataloader):
        token_ids = token_ids.long().to(device)
        segment_ids = segment_ids.long().to(device)

        valid_length = valid_length
        label = label.long().to(device)

        out = model(token_ids, valid_length, segment_ids)

        test_eval = []
        for i in out:
            logits = i
            logits = logits.detach().cpu().numpy()
            probabilities = F.softmax(torch.tensor(logits), dim=-1).numpy()

            neg_prob = probabilities[0] * 100
            pos_prob = probabilities[1] * 100
            neu_prob = probabilities[2] * 100

            test_eval.append(f'{emotion_korean["negative"]}: {neg_prob:.2f}%, {emotion_korean["positive"]}: {pos_prob:.2f}%, {emotion_korean["neutral"]}: {neu_prob:.2f}%')

        print('>> 입력하신 내용에서 ' + test_eval[0] + ' 느껴집니다.')

if __name__ == "__main__":
    input_sentence = input("문장을 입력하세요: ")
    predict_sentence(input_sentence)
