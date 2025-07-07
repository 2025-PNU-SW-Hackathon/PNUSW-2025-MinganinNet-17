const express = require('express');
const cors = require('cors');
const calendarRoutes = require('./routes/calendar');

const app = express();
const PORT = process.env.PORT || 3001;

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 기본 라우트
app.get('/', (req, res) => {
  res.json({ 
    message: 'Hello from Rooty Backend!',
    version: '1.0.0',
    endpoints: {
      calendar: '/api/calendar'
    }
  });
});

// 캘린더 API 라우트
app.use('/api/calendar', calendarRoutes);

// 404 핸들러
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Endpoint not found' 
  });
});

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    error: 'Something went wrong!' 
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`Calendar API available at http://localhost:${PORT}/api/calendar`);
}); 