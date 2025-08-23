# 환경 변수 설정 가이드

## Supabase Edge Functions 설정

### 1. Supabase 프로젝트 설정
1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. 프로젝트 설정 > API에서 다음 정보 확인:
   - Project URL
   - anon public key
   - service_role key

### 2. 환경 변수 설정
`.env` 파일에 다음 변수들을 추가하세요:

```bash
# Supabase 설정
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Supabase Edge Functions용 (서버 사이드)
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google Cloud API 키
GOOGLE_API_KEY=your_google_cloud_api_key

# Gemini API 키
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Google Cloud API 설정
1. [Google Cloud Console](https://console.cloud.google.com)에서 새 프로젝트 생성
2. 다음 API 활성화:
   - Speech-to-Text API
   - Text-to-Speech API
3. API 키 생성 및 환경 변수에 설정

### 4. Gemini API 설정
1. [Google AI Studio](https://makersuite.google.com/app/apikey)에서 API 키 생성
2. 환경 변수에 설정

## Supabase Edge Functions 배포

### 1. Supabase CLI 설치
```bash
npm install -g supabase
```

### 2. 프로젝트 연결
```bash
supabase login
supabase link --project-ref your_project_ref
```

### 3. Edge Functions 배포
```bash
supabase functions deploy ai-voice-chat
supabase functions deploy ai-text-chat
```

### 4. 환경 변수 설정 (Edge Functions용)
```bash
supabase secrets set GOOGLE_API_KEY=your_google_api_key
supabase secrets set GEMINI_API_KEY=your_gemini_api_key
```

## 데이터베이스 설정

### 1. SQL 스키마 실행
Supabase Dashboard > SQL Editor에서 다음 SQL 실행:

```sql
-- 음성 채팅 응답을 저장하는 테이블
CREATE TABLE IF NOT EXISTS voice_chat_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id TEXT NOT NULL,
  audio_file_name TEXT NOT NULL,
  audio_chunk TEXT, -- base64 encoded audio chunk
  response_text TEXT, -- AI 응답 텍스트
  mime_type TEXT DEFAULT 'audio/mpeg',
  progress INTEGER DEFAULT 0, -- 처리 진행률 (0-100)
  is_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_voice_chat_responses_request_id ON voice_chat_responses(request_id);
CREATE INDEX IF NOT EXISTS idx_voice_chat_responses_audio_file_name ON voice_chat_responses(audio_file_name);
CREATE INDEX IF NOT EXISTS idx_voice_chat_responses_created_at ON voice_chat_responses(created_at);

-- RLS (Row Level Security) 활성화
ALTER TABLE voice_chat_responses ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽고 쓸 수 있도록 정책 설정 (개발 단계)
CREATE POLICY "Allow all operations for voice chat responses" ON voice_chat_responses
  FOR ALL USING (true) WITH CHECK (true);
```

### 2. Storage 버킷 생성
1. Supabase Dashboard > Storage > New Bucket
2. 설정:
   - Bucket name: `voice-chat`
   - Public bucket: `true`
   - File size limit: `50MB`
   - Allowed MIME types: `audio/*`

### 3. Storage 정책 설정
Supabase Dashboard > Storage > Policies에서 `voice-chat` 버킷에 다음 정책 추가:
- SELECT: `true` (모든 사용자가 읽기 가능)
- INSERT: `true` (모든 사용자가 업로드 가능)
- UPDATE: `false` (업데이트 불가)
- DELETE: `false` (삭제 불가)

## 테스트

### 1. Edge Functions 테스트
```bash
# 음성 채팅 테스트
curl -X POST https://your_project_ref.supabase.co/functions/v1/ai-voice-chat \
  -H "Authorization: Bearer your_anon_key" \
  -H "Content-Type: application/json" \
  -d '{
    "audioFileName": "test.m4a",
    "systemInstruction": "You are a helpful assistant.",
    "requestId": "test123"
  }'

# 텍스트 채팅 테스트
curl -X POST https://your_project_ref.supabase.co/functions/v1/ai-text-chat \
  -H "Authorization: Bearer your_anon_key" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "안녕하세요",
    "systemInstruction": "You are a helpful assistant.",
    "requestId": "test456"
  }'
```

### 2. 앱에서 테스트
1. 앱 실행
2. 음성 채팅 화면 열기
3. 음성 녹음 테스트
4. AI 응답 확인

## 문제 해결

### 일반적인 오류들

1. **"GOOGLE_API_KEY가 설정되지 않았습니다"**
   - Edge Functions에 환경 변수가 제대로 설정되었는지 확인
   - `supabase secrets list`로 확인

2. **"음성 파일 업로드 실패"**
   - Storage 버킷이 생성되었는지 확인
   - Storage 정책이 올바르게 설정되었는지 확인

3. **"AI 처리 시작 실패"**
   - Edge Functions가 배포되었는지 확인
   - Supabase 프로젝트 URL과 키가 올바른지 확인

4. **"녹음 시작 실패"**
   - 안드로이드 권한 설정 확인
   - 오디오 모드 설정 확인

### 디버깅

1. **Supabase Dashboard > Logs**에서 Edge Functions 로그 확인
2. **앱 콘솔**에서 클라이언트 로그 확인
3. **Network 탭**에서 API 요청/응답 확인