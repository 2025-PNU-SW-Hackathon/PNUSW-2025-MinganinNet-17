class Event {
  constructor(id, title, description, startDate, endDate, isAllDay = false, location = '', color = '#007AFF', isRecurring = false, recurrenceRule = null, reminders = []) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.startDate = new Date(startDate);
    this.endDate = new Date(endDate);
    this.isAllDay = isAllDay;
    this.location = location;
    this.color = color;
    this.isRecurring = isRecurring;
    this.recurrenceRule = recurrenceRule; // RRULE 형식 (예: "FREQ=DAILY;INTERVAL=1")
    this.reminders = reminders; // [{minutes: 15, type: 'notification'}]
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  // 이벤트 유효성 검사
  validate() {
    if (!this.title || this.title.trim() === '') {
      throw new Error('이벤트 제목은 필수입니다.');
    }
    
    if (this.startDate >= this.endDate) {
      throw new Error('시작 시간은 종료 시간보다 빨라야 합니다.');
    }
    
    return true;
  }

  // 이벤트 업데이트
  update(updates) {
    Object.assign(this, updates);
    this.updatedAt = new Date();
    this.validate();
  }

  // JSON으로 변환
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      startDate: this.startDate.toISOString(),
      endDate: this.endDate.toISOString(),
      isAllDay: this.isAllDay,
      location: this.location,
      color: this.color,
      isRecurring: this.isRecurring,
      recurrenceRule: this.recurrenceRule,
      reminders: this.reminders,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    };
  }
}

module.exports = Event; 