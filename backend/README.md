# Rooty Backend - Calendar API

캘린더 기능을 위한 RESTful API 서버입니다.

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 모드로 실행 (자동 재시작)
npm run dev

# 프로덕션 모드로 실행
npm start
```

서버는 기본적으로 `http://localhost:3001`에서 실행됩니다.

## API 엔드포인트

### 기본 정보
- **Base URL**: `http://localhost:3001/api/calendar`
- **Content-Type**: `application/json`

### 이벤트 관리

#### 1. 모든 이벤트 조회
```
GET /api/calendar/events
```

**응답 예시:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "팀 미팅",
      "description": "주간 팀 미팅",
      "startDate": "2024-01-15T10:00:00.000Z",
      "endDate": "2024-01-15T11:00:00.000Z",
      "isAllDay": false,
      "location": "회의실 A",
      "color": "#FF6B6B",
      "isRecurring": false,
      "recurrenceRule": null,
      "reminders": [],
      "createdAt": "2024-01-15T09:00:00.000Z",
      "updatedAt": "2024-01-15T09:00:00.000Z"
    }
  ]
}
```

#### 2. 특정 이벤트 조회
```
GET /api/calendar/events/:id
```

#### 3. 새 이벤트 생성
```
POST /api/calendar/events
```

**요청 본문:**
```json
{
  "title": "팀 미팅",
  "description": "주간 팀 미팅",
  "startDate": "2024-01-15T10:00:00Z",
  "endDate": "2024-01-15T11:00:00Z",
  "isAllDay": false,
  "location": "회의실 A",
  "color": "#FF6B6B",
  "isRecurring": false,
  "recurrenceRule": "FREQ=DAILY;INTERVAL=1",
  "reminders": [
    {
      "minutes": 15,
      "type": "notification"
    }
  ]
}
```

#### 4. 이벤트 업데이트
```
PUT /api/calendar/events/:id
```

#### 5. 이벤트 삭제
```
DELETE /api/calendar/events/:id
```

### 날짜별 조회

#### 6. 날짜 범위로 이벤트 조회
```
GET /api/calendar/events/range?startDate=2024-01-01&endDate=2024-01-31
```

#### 7. 특정 날짜의 이벤트 조회
```
GET /api/calendar/events/date/2024-01-15
```

#### 8. 이번 주 이벤트 조회
```
GET /api/calendar/events/week
```

#### 9. 이번 달 이벤트 조회
```
GET /api/calendar/events/month
```

### 통계 정보

#### 10. 캘린더 통계 조회
```
GET /api/calendar/stats
```

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "totalEvents": 10,
    "todayEvents": 2,
    "weekEvents": 5,
    "monthEvents": 15,
    "recurringEvents": 3
  }
}
```

## 이벤트 모델

### 필수 필드
- `title`: 이벤트 제목 (문자열)
- `startDate`: 시작 날짜/시간 (ISO 8601 형식)
- `endDate`: 종료 날짜/시간 (ISO 8601 형식)

### 선택적 필드
- `description`: 이벤트 설명 (문자열)
- `isAllDay`: 종일 이벤트 여부 (불린)
- `location`: 장소 (문자열)
- `color`: 이벤트 색상 (16진수 색상 코드)
- `isRecurring`: 반복 이벤트 여부 (불린)
- `recurrenceRule`: 반복 규칙 (RRULE 형식)
- `reminders`: 알림 설정 (배열)

## 반복 이벤트 규칙 (RRULE)

현재 지원하는 반복 규칙:

### 일일 반복
```
FREQ=DAILY;INTERVAL=1
```

### 주간 반복
```
FREQ=WEEKLY;INTERVAL=1
```

### 월간 반복
```
FREQ=MONTHLY;INTERVAL=1
```

## 테스트

API 테스트를 실행하려면:

```bash
node test-calendar.js
```

## 에러 처리

모든 API 응답은 다음 형식을 따릅니다:

**성공 시:**
```json
{
  "success": true,
  "data": { ... }
}
```

**실패 시:**
```json
{
  "success": false,
  "error": "에러 메시지"
}
```

## HTTP 상태 코드

- `200`: 성공
- `201`: 생성됨
- `400`: 잘못된 요청
- `404`: 리소스를 찾을 수 없음
- `500`: 서버 내부 오류

## 개발 노트

- 현재는 메모리 기반 저장소를 사용합니다 (서버 재시작 시 데이터 손실)
- 실제 프로덕션에서는 데이터베이스 연동이 필요합니다
- 반복 이벤트 처리는 기본적인 구현만 포함되어 있습니다
- 알림 기능은 아직 구현되지 않았습니다 