const express = require('express');
const CalendarService = require('../services/CalendarService');

const router = express.Router();
const calendarService = new CalendarService();

// 모든 이벤트 조회
router.get('/events', (req, res) => {
  try {
    const events = calendarService.getAllEvents();
    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 특정 이벤트 조회
router.get('/events/:id', (req, res) => {
  try {
    const event = calendarService.getEventById(req.params.id);
    res.json({ success: true, data: event });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

// 새 이벤트 생성
router.post('/events', (req, res) => {
  try {
    const eventData = req.body;
    const event = calendarService.createEvent(eventData);
    res.status(201).json({ success: true, data: event });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// 이벤트 업데이트
router.put('/events/:id', (req, res) => {
  try {
    const updates = req.body;
    const event = calendarService.updateEvent(req.params.id, updates);
    res.json({ success: true, data: event });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// 이벤트 삭제
router.delete('/events/:id', (req, res) => {
  try {
    const result = calendarService.deleteEvent(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

// 날짜 범위로 이벤트 조회
router.get('/events/range', (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        error: 'startDate와 endDate는 필수입니다.' 
      });
    }
    
    const events = calendarService.getEventsByDateRange(startDate, endDate);
    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 특정 날짜의 이벤트 조회
router.get('/events/date/:date', (req, res) => {
  try {
    const events = calendarService.getEventsByDate(req.params.date);
    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 이번 주 이벤트 조회
router.get('/events/week', (req, res) => {
  try {
    const events = calendarService.getEventsThisWeek();
    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 이번 달 이벤트 조회
router.get('/events/month', (req, res) => {
  try {
    const events = calendarService.getEventsThisMonth();
    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 캘린더 통계 정보
router.get('/stats', (req, res) => {
  try {
    const allEvents = calendarService.getAllEvents();
    const today = new Date();
    const todayEvents = calendarService.getEventsByDate(today);
    const weekEvents = calendarService.getEventsThisWeek();
    const monthEvents = calendarService.getEventsThisMonth();
    
    const stats = {
      totalEvents: allEvents.length,
      todayEvents: todayEvents.length,
      weekEvents: weekEvents.length,
      monthEvents: monthEvents.length,
      recurringEvents: allEvents.filter(event => event.isRecurring).length
    };
    
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router; 