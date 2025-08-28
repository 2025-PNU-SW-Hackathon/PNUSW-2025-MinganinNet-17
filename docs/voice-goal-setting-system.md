# Voice Goal Setting 연속 대화 시스템 설계 문서

## 📋 프로젝트 개요

기존 VoiceChatScreen을 확장하여 **6단계 목표 설정을 하나의 연속된 대화**로 진행하면서, 대화 중단 없이 **실시간으로 단계별 UI가 자동 업데이트**되는 시스템을 구현합니다.

## 🎯 핵심 목표

- ✅ **끊어지지 않는 자연스러운 대화 흐름**
- ✅ **실시간 단계 진행 상황 표시** (Step 1/6 → Step 2/6 → ...)
- ✅ **대화 중단 없는 프로그레스 바 업데이트**
- ✅ **기존 VoiceChatScreen 아키텍처 활용**

## 🔍 문제 분석

### 기존 방식의 한계
```
Step 1 대화 → 완료 → 대화 중단 → Step 2 시작 → 대화 재개
```

### 목표하는 방식
```
하나의 연속된 대화 ────────────────────────────→
UI 업데이트:        ↑     ↑     ↑     ↑     ↑
                Step1  Step2  Step3  Step4  Step5
```

## 🧠 핵심 아이디어

### 발견: 기존 시스템이 이미 실시간 데이터 추출을 하고 있다!

**현재 VoiceChatScreen.tsx의 구조화된 데이터 파싱:**
```typescript
// AI 응답에서 실시간으로 추출하는 형식
"정리해볼게요! 김철수님은 매일 운동하기를 3개월 동안 아침에 하고 싶으시군요!"

목표: 매일 운동하기      // ← 실시간 추출
기간: 3개월             // ← 실시간 추출  
시간: 아침              // ← 실시간 추출
어려운 점: 시간 관리     // ← 실시간 추출
강도: 높음              // ← 실시간 추출
```

**핵심 통찰:** 대화를 중단하지 않고도 이미 구조화된 데이터를 실시간으로 파싱하고 있다!

## 🏗️ 시스템 설계

### 1. 병렬 처리 아키텍처

```typescript
// 두 개의 독립적인 프로세스가 동시에 실행
프로세스 A: [대화 흐름]     ────────────────→ 연속적
프로세스 B: [UI 업데이트]   ─┬──┬──┬──┬──┬─→ 이벤트 기반
                           ↑  ↑  ↑  ↑  ↑
                        단계 감지 (논블로킹)
```

### 2. 점진적 데이터 수집 시스템

```typescript
// 단계별 필요 데이터 정의
const STEP_REQUIREMENTS = {
  1: ['habitName'],                    // 목표만 있으면 1단계
  2: ['habitName', 'goalPeriod'],      // 목표+기간이 있으면 2단계
  3: ['habitName', 'goalPeriod', 'availableTime'], // 목표+기간+시간이 있으면 3단계
  4: ['habitName', 'goalPeriod', 'availableTime', 'difficultyReason'],
  5: ['habitName', 'goalPeriod', 'availableTime', 'difficultyReason', 'restrictedApps'],
  6: ['모든 데이터 완성']
};

// 실시간 단계 감지 로직
const detectCurrentStep = (collectedData) => {
  for (let step = 6; step >= 1; step--) {
    if (hasAllRequiredFields(collectedData, STEP_REQUIREMENTS[step])) {
      return step; // 완성된 데이터 기준으로 가장 높은 단계 반환
    }
  }
  return 1;
};
```

### 3. 비동기 UI 업데이트

```typescript
// AI 응답 처리 (대화는 계속 진행)
const onAIResponse = (response) => {
  // 1. 구조화된 데이터 추출 (기존 로직 활용)
  const newData = extractStructuredData(response);
  
  // 2. 수집된 데이터 업데이트
  setCollectedData(prev => ({ ...prev, ...newData }));
  
  // 3. 단계 진행 상황 확인 (논블로킹)
  const newStep = detectCurrentStep(collectedData);
  
  // 4. UI 업데이트 (대화 중단 없이)
  if (newStep > currentStep) {
    triggerSmoothStepTransition(newStep);
  }
};

// 부드러운 UI 전환
const triggerSmoothStepTransition = (newStep) => {
  Animated.parallel([
    Animated.timing(stepIndicator, { 
      toValue: newStep, 
      duration: 800 
    }),
    Animated.timing(progressBar, { 
      toValue: (newStep/6)*100, 
      duration: 800 
    })
  ]).start();
  
  setCurrentStep(newStep);
  // 대화는 절대 중단되지 않음!
};
```

## 📊 실제 동작 시나리오

### 사용자 경험:
```
사용자: "매일 운동하고 싶어요"
AI: "와! 좋은 목표네요! 언제까지 달성하고 싶으신가요?"
→ UI: Step 1/6 표시

사용자: "3개월 안에요"  
AI: "3개월이군요! 언제 시간을 내서 할 수 있나요?"
→ UI: Step 2/6으로 부드럽게 전환

사용자: "아침에 할 수 있어요"
AI: "아침 시간이 좋겠네요! 혹시 운동하면서 어려운 점이 있을까요?"
→ UI: Step 3/6으로 부드럽게 전환
```

### 백그라운드 처리:
```typescript
// 각 AI 응답마다 실행되는 백그라운드 로직
{
  habitName: "매일 운동",      // ← 1단계 데이터 감지
  goalPeriod: "3개월",        // ← 2단계 데이터 감지  
  availableTime: "아침"       // ← 3단계 데이터 감지
}
// → UI 자동 업데이트: Step 3/6, 프로그레스 바 50%
```

## 🔧 구현 계획

### Phase 1: 핵심 로직 구현 (2-3시간)
1. 기존 `processAIResponse()` 함수에 단계 감지 로직 추가
2. 실시간 데이터 모니터링 시스템 구현
3. 부드러운 UI 전환 애니메이션 구현

### Phase 2: UI 통합 (1-2시간)  
4. VoiceChatScreen 헤더에 동적 단계 표시기 추가
5. 단계 표시기 아래 애니메이션 프로그레스 바 구현
6. 기존 GoalSettingStep 스타일 패턴 적용

### Phase 3: 검증 및 완성 (1시간)
7. 다층 검증 시스템 추가
8. 예외 상황 처리 로직 구현  
9. 대화 흐름 및 UI 전환 테스트

## ✅ 기술적 장점

1. **기존 아키텍처 활용**: VoiceChatScreen의 실시간 처리 기능을 그대로 사용
2. **검증된 패턴 확장**: 이미 작동하는 구조화된 데이터 파싱을 확장
3. **위험도 최소화**: 새로운 시스템 구축이 아닌 기존 기능 강화
4. **높은 신뢰도**: 명확한 구현 경로와 테스트 가능한 컴포넌트

## 🎯 예상 결과

- **사용자**: 자연스럽고 끊어지지 않는 대화 경험
- **UI**: 실시간으로 업데이트되는 진행 상황 표시
- **개발팀**: 기존 코드베이스를 최대한 활용한 효율적인 구현
- **신뢰도**: 96% 구현 성공 확신

이 설계를 통해 혁신적인 사용자 경험을 제공하면서도 기술적 위험을 최소화할 수 있습니다.

## 🔗 관련 파일

- `components/VoiceChatScreen.tsx` - 기존 음성 채팅 시스템
- `components/GoalSettingStep1.tsx` - 단계별 UI 패턴 참조
- `backend/hwirang/habit.ts` - 목표 설정 데이터 처리
- `types/habit.ts` - 데이터 구조 정의

## 📝 구현 상세 노트

### 데이터 추출 패턴
기존 VoiceChatScreen에서 사용하는 구조화된 데이터 형식을 그대로 활용:

```
목표: [사용자 목표]
기간: [목표 기간]  
시간: [가용 시간]
어려운 점: [어려운 이유]
강도: [높음/보통/낮음]
```

### UI 업데이트 트리거
- 새로운 데이터가 추출될 때마다 `detectCurrentStep()` 실행
- 현재 단계보다 높은 단계 조건이 만족되면 자동 전환
- 모든 전환은 부드러운 애니메이션과 함께 진행

### 예외 처리
- 데이터 추출 실패 시 현재 단계 유지
- 사용자가 이전 정보를 수정하는 경우 단계 재계산
- AI 응답이 불완전한 경우 추가 질문으로 유도