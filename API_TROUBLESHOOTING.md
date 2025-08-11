# API 문제 해결 가이드

## 🔍 현재 발생한 문제들

### 1. Gemini 2.5 Flash TTS API 할당량 초과 (429 오류)
```
You exceeded your current quota, please check your plan and billing details
```

### 2. Google Cloud TTS API 비활성화 (403 오류)
```
Requests to this API texttospeech.googleapis.com method google.cloud.texttospeech.v1.TextToSpeech.SynthesizeSpeech are blocked
```

## 🛠️ 해결 방법

### 1. Gemini API 할당량 문제 해결

#### A. Google AI Studio에서 할당량 확인
1. [Google AI Studio](https://makersuite.google.com/app/apikey) 방문
2. 로그인 후 "API Keys" 섹션 확인
3. 현재 사용 중인 API 키의 할당량 상태 확인

#### B. 할당량 증가 요청
1. [Google Cloud Console](https://console.cloud.google.com/) 방문
2. 프로젝트 선택
3. "APIs & Services" > "Quotas" 메뉴
4. "Generative Language API" 검색
5. "Requests per day" 할당량 증가 요청

#### C. 대안: 무료 할당량 최적화
```javascript
// 요청 빈도 제한 (이미 구현됨)
const MIN_REQUEST_INTERVAL = 500; // 0.5초 간격 (더 빠르게)

// 더 안정적인 모델 사용
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
const GEMINI_TTS_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
```

### 2. Google Cloud TTS API 활성화

#### A. Google Cloud Console에서 API 활성화
1. [Google Cloud Console](https://console.cloud.google.com/) 방문
2. 프로젝트 선택 (API 키와 동일한 프로젝트)
3. "APIs & Services" > "Library" 메뉴
4. "Cloud Text-to-Speech API" 검색
5. "Enable" 버튼 클릭

#### B. API 키 권한 확인
1. "APIs & Services" > "Credentials" 메뉴
2. 현재 사용 중인 API 키 선택
3. "API restrictions" 섹션에서 "Cloud Text-to-Speech API" 추가

#### C. 대안: 다른 음성 사용
```javascript
// 다양한 음성 옵션
const VOICE_OPTIONS = [
  'ko-KR-Neural2-A',    // Neural2 음성 (고품질)
  'ko-KR-Wavenet-A',    // Wavenet 음성 (고품질)
  'ko-KR-Standard-A',   // Standard 음성 (기본)
  'ko-KR-Standard-B',   // Standard 음성 (대안)
];
```

### 3. API 키 보안 설정

#### A. API 키 제한 설정
1. Google Cloud Console > "APIs & Services" > "Credentials"
2. API 키 선택 > "Edit"
3. "Application restrictions" 설정:
   - "HTTP referrers (web sites)" 선택
   - 앱 도메인 추가 (예: `localhost:8081`, `localhost:3000`)
4. "API restrictions" 설정:
   - "Restrict key" 선택
   - 다음 API들만 허용:
     - Generative Language API
     - Cloud Text-to-Speech API

#### B. 환경 변수 보안
```bash
# .env 파일 (프로젝트 루트에 위치)
GEMINI_API_KEY=your_actual_api_key_here
BACKEND_URL=http://localhost:3001
```

### 4. 개발 환경 최적화

#### A. 요청 제한 구현 (이미 완료)
```javascript
// 요청 간격 제한 (더 빠르게)
const MIN_REQUEST_INTERVAL = 500; // 0.5초
const MAX_RETRIES = 3; // 최대 재시도 횟수
```

#### B. 오류 처리 개선 (이미 완료)
```javascript
// 429 오류 시 자동 재시도 (더 빠르게)
if (response.status === 429) {
  await new Promise(resolve => setTimeout(resolve, 3000)); // 3초 대기
  return await generateNativeTTS(text, voiceName); // 재시도
}
```

## 🚀 즉시 적용 가능한 해결책

### 1. Google Cloud Console에서 API 활성화
1. [Google Cloud Console](https://console.cloud.google.com/apis/api/texttospeech.googleapis.com/overview) 방문
2. "Enable" 버튼 클릭
3. 프로젝트 선택 (API 키와 동일한 프로젝트)

### 2. API 키 권한 확인
1. [Credentials 페이지](https://console.cloud.google.com/apis/credentials) 방문
2. 현재 API 키 선택
3. "API restrictions"에서 다음 API들 확인:
   - Generative Language API
   - Cloud Text-to-Speech API

### 3. 할당량 확인
1. [Quotas 페이지](https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas) 방문
2. "Requests per day" 할당량 확인
3. 필요시 할당량 증가 요청

## 📞 추가 지원

### Google Cloud 지원
- [Google Cloud Support](https://cloud.google.com/support)
- [API 문서](https://ai.google.dev/docs)

### 개발자 커뮤니티
- [Stack Overflow](https://stackoverflow.com/questions/tagged/google-cloud-text-to-speech)
- [Google Cloud Community](https://cloud.google.com/community)

## 🔄 코드 변경사항

### 이미 적용된 개선사항
1. ✅ Gemini 2.5 Flash TTS로 변경 (더 빠르고 안정적)
2. ✅ 요청 제한 개선 (0.5초 간격)
3. ✅ 자동 재시도 로직 개선 (3초 대기)
4. ✅ 다중 음성 fallback 시스템
5. ✅ 안정적인 오류 처리
6. ✅ Web TTS 타임아웃 추가 (5초)

### 추가 권장사항
1. 🔄 Google Cloud Console에서 API 활성화
2. 🔄 API 키 권한 설정 확인
3. 🔄 할당량 모니터링 설정 