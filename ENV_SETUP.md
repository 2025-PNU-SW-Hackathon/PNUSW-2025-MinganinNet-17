# 환경 변수 설정 가이드

## 🔧 필수 설정

### 1. .env 파일 생성

프로젝트 루트(`minganinet/` 폴더)에 `.env` 파일을 생성해주세요:

```bash
# Gemini API 설정
GEMINI_API_KEY=your_gemini_api_key_here

# 백엔드 URL (선택사항)
BACKEND_URL=http://localhost:3001
```

### 2. Gemini API 키 발급

1. [Google AI Studio](https://makersuite.google.com/app/apikey) 방문
2. Google 계정으로 로그인
3. "Create API Key" 버튼 클릭
4. 생성된 API 키를 복사
5. 위의 `.env` 파일에서 `your_gemini_api_key_here`를 실제 API 키로 교체

### 3. 앱 재시작

환경 변수 설정 후 Expo 개발 서버를 재시작해주세요:

```bash
cd minganinet
npx expo start
```

## 🌐 웹 환경에서 음성 인식 사용하기

### 브라우저 권한 설정

1. **Chrome/Edge**: 주소창 왼쪽의 🔒 아이콘 클릭 → "마이크" 권한 허용
2. **Firefox**: 주소창 왼쪽의 🔒 아이콘 클릭 → "마이크 사용" 허용
3. **Safari**: Safari > 환경설정 > 웹사이트 > 마이크에서 권한 허용

### 지원 브라우저

- ✅ Chrome (권장)
- ✅ Edge
- ✅ Safari (macOS/iOS)
- ✅ Firefox
- ❌ Internet Explorer (지원 안함)

## 📱 모바일 환경

### iOS
- 마이크 권한이 자동으로 요청됩니다
- "허용" 선택 시 정상 작동

### Android
- 마이크 권한이 자동으로 요청됩니다
- "허용" 선택 시 정상 작동

## 🔍 문제 해결

### API 키 관련 오류
```
API 키가 설정되지 않았습니다
```
→ `.env` 파일이 올바른 위치(`minganinet/` 폴더)에 있는지 확인
→ 파일 이름이 정확히 `.env`인지 확인 (확장자 없음)

### 음성 인식 권한 오류
```
음성 인식을 위해 마이크 권한이 필요합니다
```
→ 브라우저에서 마이크 권한을 허용했는지 확인
→ 페이지를 새로고침 후 다시 시도

### HTTPS 필요 오류 (프로덕션)
```
웹에서 음성 인식은 HTTPS에서만 작동합니다
```
→ 개발 환경에서는 localhost이므로 문제없음
→ 배포 시에는 HTTPS 사용 필요

## ✨ 기능별 차이점

| 기능 | 웹 | iOS/Android |
|------|----|----|
| 실시간 음성 인식 | ✅ Web Speech API | ✅ expo-av + 시뮬레이션 |
| 음성 파일 저장 | ❌ (불필요) | ✅ |
| 오프라인 사용 | ❌ | ❌ (둘 다 인터넷 필요) |
| 다국어 지원 | ✅ | ✅ |

## 🛡️ 보안 주의사항

- API 키는 절대 GitHub 등에 업로드하지 마세요
- `.env` 파일을 `.gitignore`에 추가했는지 확인하세요
- 프로덕션에서는 환경 변수를 안전하게 관리하세요

---

문제가 계속 발생하면 [GitHub Issues](링크)에 문의해주세요!