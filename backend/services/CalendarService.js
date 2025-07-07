const Event = require('../models/Event');
const { v4: uuidv4 } = require('uuid');

class CalendarService {
  constructor() {
    this.events = new Map(); // 메모리 기반 저장소 (실제로는 데이터베이스 사용)
  }

  // 새 이벤트 생성
  createEvent(eventData) {
    const id = uuidv4();
    const event = new Event(
      id,
      eventData.title,
      eventData.description || '',
      eventData.startDate,
      eventData.endDate,
      eventData.isAllDay || false,
      eventData.location || '',
      eventData.color || '#007AFF',
      eventData.isRecurring || false,
      eventData.recurrenceRule || null,
      eventData.reminders || []
    );

    event.validate();
    this.events.set(id, event);
    return event.toJSON();
  }

  // 이벤트 조회 (ID로)
  getEventById(id) {
    const event = this.events.get(id);
    if (!event) {
      throw new Error('이벤트를 찾을 수 없습니다.');
    }
    return event.toJSON();
  }

  // 이벤트 업데이트
  updateEvent(id, updates) {
    const event = this.events.get(id);
    if (!event) {
      throw new Error('이벤트를 찾을 수 없습니다.');
    }

    event.update(updates);
    return event.toJSON();
  }

  // 이벤트 삭제
  deleteEvent(id) {
    const event = this.events.get(id);
    if (!event) {
      throw new Error('이벤트를 찾을 수 없습니다.');
    }

    this.events.delete(id);
    return { success: true, message: '이벤트가 삭제되었습니다.' };
  }

  // 날짜 범위로 이벤트 조회
  getEventsByDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const events = [];
    
    for (const event of this.events.values()) {
      // 이벤트가 지정된 범위와 겹치는지 확인
      if (this.isEventInRange(event, start, end)) {
        events.push(event.toJSON());
      }
    }
    
    return events.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  }

  // 특정 날짜의 이벤트 조회
  getEventsByDate(date) {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);
    
    return this.getEventsByDateRange(startOfDay, endOfDay);
  }

  // 이번 주 이벤트 조회
  getEventsThisWeek() {
    const now = new Date();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
    
    return this.getEventsByDateRange(startOfWeek, endOfWeek);
  }

  // 이번 달 이벤트 조회
  getEventsThisMonth() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    return this.getEventsByDateRange(startOfMonth, endOfMonth);
  }

  // 이벤트가 특정 범위에 있는지 확인
  isEventInRange(event, start, end) {
    const eventStart = new Date(event.startDate);
    const eventEnd = new Date(event.endDate);
    
    // 이벤트가 범위와 겹치는 경우
    return (eventStart <= end && eventEnd >= start);
  }

  // 반복 이벤트 처리 (기본적인 구현)
  generateRecurringEvents(event, startDate, endDate) {
    if (!event.isRecurring || !event.recurrenceRule) {
      return [event];
    }

    // 간단한 반복 규칙 파싱 (실제로는 rrule 라이브러리 사용 권장)
    const events = [];
    const rule = this.parseRecurrenceRule(event.recurrenceRule);
    
    if (rule.freq === 'DAILY') {
      let currentDate = new Date(event.startDate);
      while (currentDate <= new Date(endDate)) {
        if (currentDate >= new Date(startDate)) {
          const recurringEvent = new Event(
            `${event.id}_${currentDate.getTime()}`,
            event.title,
            event.description,
            currentDate,
            new Date(currentDate.getTime() + (event.endDate - event.startDate)),
            event.isAllDay,
            event.location,
            event.color,
            false, // 반복 이벤트의 개별 인스턴스는 반복되지 않음
            null,
            event.reminders
          );
          events.push(recurringEvent);
        }
        currentDate.setDate(currentDate.getDate() + rule.interval);
      }
    }
    
    return events;
  }

  // 반복 규칙 파싱 (간단한 구현)
  parseRecurrenceRule(rrule) {
    const parts = rrule.split(';');
    const rule = {};
    
    parts.forEach(part => {
      const [key, value] = part.split('=');
      if (key === 'FREQ') {
        rule.freq = value;
      } else if (key === 'INTERVAL') {
        rule.interval = parseInt(value) || 1;
      }
    });
    
    return rule;
  }

  // 모든 이벤트 조회 (테스트용)
  getAllEvents() {
    return Array.from(this.events.values()).map(event => event.toJSON());
  }
}

module.exports = CalendarService; 