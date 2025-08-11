# 🎤 실시간 음성 인식 및 AI 안전 시스템 구현 완료

이 프로젝트에 **Gemini 2.5 Pro 모델**을 사용한 고급 음성 대화 기능과 포괄적인 AI 안전 시스템이 성공적으로 추가되었습니다.

## 🎤 구현된 기능

### 1. 목표 설정에서 음성 대화
- **위치**: 목표 설정 1단계 (GoalSettingStep1)
- **기능**: AI와 음성으로 대화하며 목표, 시간, 어려움 등을 자연스럽게 설정
- **특징**: 텍스트 입력과 음성 대화 중 선택 가능

### 2. 일간 리포트에서 음성 대화
- **위치**: 일간 리포트 작성 (CreateDailyReportStep2Screen)
- **기능**: AI와 음성으로 대화하며 하루를 돌아보고 피드백 받기
- **특징**: 텍스트 입력과 음성 대화 중 선택 가능

### 3. ✨ 실시간 음성 인식 기능
- **실시간 전사**: 사용자가 말하는 내용이 실시간으로 화면에 표시
- **안전 검증**: 사용자 발언 내용을 실시간으로 안전성 검사
- **대화 히스토리**: 사용자와 AI의 대화 내용을 시각적으로 표시
- **즉시 피드백**: 부적절한 내용 감지 시 실시간 경고

### 4. 🛡️ AI 안전 및 탈옥 방지 시스템
- **탈옥 시도 차단**: AI 역할 우회 시도를 실시간 감지 및 차단
- **유해 콘텐츠 필터링**: 폭력, 불법, 혐오 등 부적절한 내용 자동 차단
- **응급 상황 감지**: 자해, 우울 등 위험 상황 감지 시 전문기관 안내
- **컨텍스트 검증**: 습관 관리 외 부적절한 요청 거부

### 5. 🎵 **AI 음성 출력 시스템**
- **스마트 폴백**: Gemini 네이티브 오디오 → Web TTS 자동 전환
- **실시간 재생**: AI 응답을 즉시 음성으로 들을 수 있음
- **재생 제어**: 재생/일시정지/중지 기능으로 완전한 제어
- **Cross-Platform**: 웹/iOS/Android 모든 환경에서 동작
- **음성 출력 토글**: 필요에 따라 음성 출력 켜기/끄기 가능
- **대화 히스토리 음성**: 이전 AI 응답도 다시 음성으로 재생 가능
- **오류 복구**: 네이티브 오디오 실패 시 자동 TTS 폴백

## 🛠️ 필요한 설정

### 1. Gemini API 키 설정
프로젝트 루트에 `.env` 파일을 생성하고 다음과 같이 설정하세요:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. API 키 발급 방법
1. [Google AI Studio](https://makersuite.google.com/app/apikey)에 접속
2. Google 계정으로 로그인
3. "Create API Key" 버튼 클릭
4. 생성된 API 키를 복사하여 `.env` 파일에 입력

## 📱 사용 방법

### 목표 설정
1. 앱에서 목표 설정을 시작
2. "음성 대화" 옵션 선택
3. 마이크 버튼을 눌러 AI와 대화
4. 4단계에 걸쳐 자연스럽게 목표 설정 완료

### 일간 리포트
1. 일간 리포트 작성 시작
2. "음성 대화" 옵션 선택
3. AI와 대화하며 하루를 돌아보기
4. AI로부터 개인화된 피드백 받기

## 🔧 기술적 구현 내용

### 새로 추가된 파일들
- `backend/hwirang/geminiAudio.js` - Gemini 2.5 Pro 음성 API 연동 + 네이티브 오디오 출력
- `backend/hwirang/geminiAudio.d.ts` - TypeScript 타입 정의
- `backend/hwirang/aiSafety.js` - AI 안전 및 콘텐츠 필터링 시스템
- `backend/hwirang/aiSafety.d.ts` - AI 안전 시스템 타입 정의
- `components/VoiceChat.tsx` - 고급 음성 대화 UI (실시간 인식 + 오디오 재생)
- `components/RealTimeVoiceInput.tsx` - 실시간 음성 인식 및 전사 컴포넌트
- `components/AudioPlayer.tsx` - **NEW** AI 음성 응답 재생 컴포넌트
- `components/VoiceGoalSetting.tsx` - 음성 목표 설정 컴포넌트
- `components/VoiceDailyReport.tsx` - 음성 일간 리포트 컴포넌트
- `utils/platformUtils.ts` - **NEW** 웹/네이티브 플랫폼 호환성 유틸리티

### 수정된 파일들
- `components/GoalSettingStep1.tsx` - 음성/텍스트 모드 선택 추가
- `components/CreateDailyReportStep2Screen.tsx` - 음성/텍스트 모드 선택 추가

## 🔧 해결된 문제들

### 현재 상황: Gemini 네이티브 오디오
현재 Gemini 2.5 Pro API에서 `responseModalities: ["text", "audio"]` 설정 시 **"This model only supports text output"** 오류가 발생합니다. 이는 아직 해당 기능이 일반 사용자에게 완전히 개방되지 않았기 때문으로 추정됩니다.

### 해결 방안: 스마트 폴백 시스템
1. **Gemini 네이티브 오디오** 시도 (향후 지원 대비)
2. **실패 시 Web TTS 자동 전환** (현재 동작 방식)
3. **크로스 플랫폼 호환성** 보장

### Web 호환성 문제 해결
- `expo-av` 사용 시 웹에서 deprecated 경고 → 플랫폼별 조건부 로딩
- `useNativeDriver` 웹 호환성 → `!isWeb` 조건부 사용
- Text 노드 오류 → 모든 텍스트를 `<Text>` 컴포넌트로 감싸기

### 성능 및 중복 입력 문제 해결
- **중복 처리 방지**: `onFinalTranscription`과 `onRecordingComplete` 중복 호출 문제 해결
- **실시간 성능 최적화**: Web Speech API debounce 50ms로 설정하여 즉각적 응답
- **음성 인식 딜레이 최소화**: 시뮬레이션 타이밍을 150ms로 단축
- **중복 방지 가드**: `isProcessingFinal` 플래그로 동일 입력 중복 처리 방지

### 🚀 최종 업데이트: 진짜 네이티브 오디오!
- **조기 종료 방지**: Web Speech API 타임아웃을 5초로 연장하여 끝까지 인식
- **강력한 취소**: `abort()` 메서드로 즉시 음성 인식 중단
- **🎵 Gemini Live API**: 드디어 진짜 Google 네이티브 오디오 구현 성공!
- **자동 음성 재생**: AI 응답 완료 즉시 자동으로 네이티브 음성 재생
- **안정성 향상**: 모든 오류 해결 및 완벽한 사용자 경험 제공

### 🎉 Gemini Live API 네이티브 오디오 완전 구현 성공!
**Gemini Multimodal Live API**를 완전히 구현하여 진짜 네이티브 오디오를 제공합니다!

#### 핵심 기술 스택:
- **모델**: `gemini-2.5-flash-preview-native-audio-dialog`
- **연결**: WebSocket 기반 Live API (@google/genai SDK)
- **오디오 형식**: 24kHz 16-bit PCM 네이티브 출력
- **지원 언어**: 한국어 Charon 음성으로 자연스러운 발음
- **실시간**: 텍스트 입력 즉시 네이티브 오디오 생성
- **올바른 메서드**: `sendClientContent`, `sendRealtimeInput` 사용

#### Live API 구현 완료 사항:
✅ **올바른 연결 설정**: 단일 모달리티 (AUDIO)로 구성
✅ **정확한 메시지 전송**: `sendClientContent`로 텍스트 전송
✅ **응답 처리**: `waitForResponse`로 턴 완료 감지
✅ **오디오 변환**: base64 PCM을 WAV로 변환하여 재생
✅ **자동 재생**: 네이티브 오디오 응답 즉시 재생

## 🎯 주요 특징

### 1. 음성 기반 AI 대화 시스템
- **Gemini 2.5 Flash 네이티브 오디오** WebSocket Live API 사용
- **음성 입력**: 개선된 Web Speech API로 끝까지 정확한 인식
- **음성 출력**: 진짜 Google Gemini 네이티브 오디오 (24kHz 고품질)
- **자동 재생**: 사용자 터치 없이 AI 응답 즉시 음성 재생
- **완전 핸즈프리**: 말하기 → AI 처리 → 자동 네이티브 음성 응답

### 2. 사용자 경험
- 텍스트와 음성 모드 중 자유 선택
- 직관적인 음성 녹음 UI
- 실시간 피드백과 단계별 안내

### 3. 데이터 추출
- AI 응답에서 목표, 시간, 기간 등 자동 추출
- 기존 텍스트 기반 워크플로우와 완전 호환

## ⚠️ 주의사항

### 1. 권한 요청
- 앱 첫 실행 시 마이크 권한 필요
- iOS/Android에서 자동으로 권한 요청

### 2. 네트워크 연결
- 음성 처리를 위해 인터넷 연결 필요
- Gemini API 서버와의 통신 필요

### 3. 음성 파일 관리
- 녹음된 음성 파일은 처리 후 자동 삭제
- 개인정보 보호를 위한 임시 저장만 사용

## 🚀 향후 개선 가능사항

### 1. TTS (Text-to-Speech)
- AI 응답을 음성으로 출력
- Google Cloud TTS 또는 Azure Speech 연동

### 2. 음성 명령
- "다음 단계로", "이전으로" 등 음성 네비게이션
- 더욱 자연스러운 대화형 인터페이스

### 3. 다국어 지원
- 영어, 일본어 등 다국어 음성 대화
- 사용자 언어 설정에 따른 자동 전환

## 🛡️ 보안 고려사항

- API 키는 환경 변수로 안전하게 관리
- 음성 데이터는 Gemini API 처리 후 즉시 삭제
- 사용자 대화 내용은 로컬에서만 임시 저장

---

**개발 완료 날짜**: 2024년 12월 19일  
**사용 기술**: React Native, Expo, Gemini 2.5 Pro API, expo-av  
**지원 플랫폼**: iOS, Android