const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const EVENTS_FILE = path.join(__dirname, '../user/events.json');

class CalendarService {
  constructor() {
    // { 'yyyy-mm-dd': [ {id, description, time, score}, ... ], ... }
    this.eventsByDate = {};
    this.loadEventsFromFile();
  }

  // 파일에서 이벤트 불러오기
  loadEventsFromFile() {
    if (fs.existsSync(EVENTS_FILE)) {
      try {
        const raw = fs.readFileSync(EVENTS_FILE, 'utf-8');
        const obj = JSON.parse(raw);
        this.eventsByDate = obj;
      } catch (e) {
        console.error('이벤트 파일 읽기 오류:', e);
        this.eventsByDate = {};
      }
    }
  }

  // 파일에 이벤트 저장
  saveEventsToFile() {
    try {
      fs.writeFileSync(EVENTS_FILE, JSON.stringify(this.eventsByDate, null, 2), 'utf-8');
    } catch (e) {
      console.error('이벤트 파일 저장 오류:', e);
    }
  }

  // 새 이벤트 생성
  createEvent(eventData) {
    const { date, description, time, score } = eventData;
    if (!date) throw new Error('date 필드는 필수입니다.');
    const newEvent = {
      id: uuidv4(),
      description: description || '',
      time: time || '',
      score: typeof score === 'number' ? score : 0
    };
    if (!this.eventsByDate[date]) this.eventsByDate[date] = [];
    this.eventsByDate[date].push(newEvent);
    this.saveEventsToFile();
    return newEvent;
  }

  // 특정 날짜의 이벤트 배열 조회
  getEventsByDate(date) {
    return this.eventsByDate[date] || [];
  }

  // 날짜 범위로 이벤트 집계 (잔디밭용)
  getGrassStats(start, end) {
    const stats = {};
    const startDate = new Date(start);
    const endDate = new Date(end);
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      stats[key] = (this.eventsByDate[key] || []).length;
    }
    return stats;
  }

  // 모든 이벤트를 평탄화하여 반환 (id로 검색 등)
  getAllEventsFlat() {
    return Object.entries(this.eventsByDate).flatMap(([date, arr]) =>
      arr.map(ev => ({ ...ev, date }))
    );
  }

  // id로 이벤트 찾기
  findEventById(id) {
    for (const [date, arr] of Object.entries(this.eventsByDate)) {
      const idx = arr.findIndex(ev => ev.id === id);
      if (idx !== -1) return { date, idx, event: arr[idx] };
    }
    return null;
  }

  // 이벤트 수정
  updateEvent(id, updates) {
    const found = this.findEventById(id);
    if (!found) throw new Error('이벤트를 찾을 수 없습니다.');
    const { date, idx } = found;
    this.eventsByDate[date][idx] = { ...this.eventsByDate[date][idx], ...updates };
    this.saveEventsToFile();
    return this.eventsByDate[date][idx];
  }

  // 이벤트 삭제
  deleteEvent(id) {
    const found = this.findEventById(id);
    if (!found) throw new Error('이벤트를 찾을 수 없습니다.');
    const { date, idx } = found;
    this.eventsByDate[date].splice(idx, 1);
    if (this.eventsByDate[date].length === 0) delete this.eventsByDate[date];
    this.saveEventsToFile();
    return { success: true, message: '이벤트가 삭제되었습니다.' };
  }
}

module.exports = CalendarService; 