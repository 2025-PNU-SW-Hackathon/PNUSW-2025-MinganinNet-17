// 날짜 관련 유틸리티 함수들

// 날짜를 YYYY-MM-DD 형식으로 포맷
function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 시간을 HH:MM 형식으로 포맷
function formatTime(date) {
  const d = new Date(date);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// 날짜와 시간을 ISO 형식으로 포맷
function formatDateTime(date) {
  const d = new Date(date);
  return d.toISOString();
}

// 문자열을 Date 객체로 파싱
function parseDate(dateString) {
  return new Date(dateString);
}

// 두 날짜 사이의 일수 계산
function daysBetween(date1, date2) {
  const oneDay = 24 * 60 * 60 * 1000; // 밀리초 단위
  const diffTime = Math.abs(new Date(date2) - new Date(date1));
  return Math.ceil(diffTime / oneDay);
}

// 주의 시작일 (일요일) 계산
function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

// 주의 마지막일 (토요일) 계산
function getEndOfWeek(date) {
  const startOfWeek = getStartOfWeek(date);
  return new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000);
}

// 월의 시작일 계산
function getStartOfMonth(date) {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

// 월의 마지막일 계산
function getEndOfMonth(date) {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

// 오늘 날짜인지 확인
function isToday(date) {
  const today = new Date();
  const targetDate = new Date(date);
  return formatDate(today) === formatDate(targetDate);
}

// 이번 주인지 확인
function isThisWeek(date) {
  const targetDate = new Date(date);
  const startOfWeek = getStartOfWeek(new Date());
  const endOfWeek = getEndOfWeek(new Date());
  return targetDate >= startOfWeek && targetDate <= endOfWeek;
}

// 이번 달인지 확인
function isThisMonth(date) {
  const targetDate = new Date(date);
  const today = new Date();
  return targetDate.getMonth() === today.getMonth() && 
         targetDate.getFullYear() === today.getFullYear();
}

// 날짜가 유효한지 확인
function isValidDate(date) {
  const d = new Date(date);
  return d instanceof Date && !isNaN(d);
}

// 시간대 변환 (간단한 구현)
function convertTimezone(date, fromTimezone, toTimezone) {
  // 실제 구현에서는 moment-timezone 같은 라이브러리 사용 권장
  const d = new Date(date);
  return d.toLocaleString('en-US', { timeZone: toTimezone });
}

// 상대적 시간 표시 (예: "2시간 전", "3일 후")
function getRelativeTime(date) {
  const now = new Date();
  const targetDate = new Date(date);
  const diffMs = targetDate - now;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffDays > 0) {
    return `${diffDays}일 후`;
  } else if (diffDays < 0) {
    return `${Math.abs(diffDays)}일 전`;
  } else if (diffHours > 0) {
    return `${diffHours}시간 후`;
  } else if (diffHours < 0) {
    return `${Math.abs(diffHours)}시간 전`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes}분 후`;
  } else if (diffMinutes < 0) {
    return `${Math.abs(diffMinutes)}분 전`;
  } else {
    return '지금';
  }
}

module.exports = {
  formatDate,
  formatTime,
  formatDateTime,
  parseDate,
  daysBetween,
  getStartOfWeek,
  getEndOfWeek,
  getStartOfMonth,
  getEndOfMonth,
  isToday,
  isThisWeek,
  isThisMonth,
  isValidDate,
  convertTimezone,
  getRelativeTime
}; 