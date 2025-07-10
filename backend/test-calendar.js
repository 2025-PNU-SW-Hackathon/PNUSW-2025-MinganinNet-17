const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/calendar';

async function testCalendarAPI() {
  console.log('🧪 캘린더 API 테스트 시작...\n');

  try {
    // 1. 새 이벤트 생성
    console.log('1. 새 이벤트 생성 테스트');
    const newEvent = {
      title: '팀 미팅',
      description: '주간 팀 미팅',
      startDate: '2024-01-15T10:00:00Z',
      endDate: '2024-01-15T11:00:00Z',
      location: '회의실 A',
      color: '#FF6B6B'
    };

    const createResponse = await axios.post(`${BASE_URL}/events`, newEvent);
    console.log('✅ 이벤트 생성 성공:', createResponse.data.data.title);
    const eventId = createResponse.data.data.id;

    // 2. 모든 이벤트 조회
    console.log('\n2. 모든 이벤트 조회 테스트');
    const allEventsResponse = await axios.get(`${BASE_URL}/events`);
    console.log('✅ 이벤트 개수:', allEventsResponse.data.data.length);

    // 3. 특정 이벤트 조회
    console.log('\n3. 특정 이벤트 조회 테스트');
    const eventResponse = await axios.get(`${BASE_URL}/events/${eventId}`);
    console.log('✅ 이벤트 조회 성공:', eventResponse.data.data.title);

    // 4. 이벤트 업데이트
    console.log('\n4. 이벤트 업데이트 테스트');
    const updateData = {
      title: '팀 미팅 (수정됨)',
      description: '주간 팀 미팅 - 업데이트됨'
    };
    const updateResponse = await axios.put(`${BASE_URL}/events/${eventId}`, updateData);
    console.log('✅ 이벤트 업데이트 성공:', updateResponse.data.data.title);

    // 5. 오늘 이벤트 조회
    console.log('\n5. 오늘 이벤트 조회 테스트');
    const today = new Date().toISOString().split('T')[0];
    const todayResponse = await axios.get(`${BASE_URL}/events/date/${today}`);
    console.log('✅ 오늘 이벤트 개수:', todayResponse.data.data.length);

    // 6. 이번 주 이벤트 조회
    console.log('\n6. 이번 주 이벤트 조회 테스트');
    const weekResponse = await axios.get(`${BASE_URL}/events/week`);
    console.log('✅ 이번 주 이벤트 개수:', weekResponse.data.data.length);

    // 7. 이번 달 이벤트 조회
    console.log('\n7. 이번 달 이벤트 조회 테스트');
    const monthResponse = await axios.get(`${BASE_URL}/events/month`);
    console.log('✅ 이번 달 이벤트 개수:', monthResponse.data.data.length);

    // 8. 통계 정보 조회
    console.log('\n8. 통계 정보 조회 테스트');
    const statsResponse = await axios.get(`${BASE_URL}/stats`);
    console.log('✅ 통계 정보:', statsResponse.data.data);

    // 9. 이벤트 삭제
    console.log('\n9. 이벤트 삭제 테스트');
    const deleteResponse = await axios.delete(`${BASE_URL}/events/${eventId}`);
    console.log('✅ 이벤트 삭제 성공:', deleteResponse.data.message);

    console.log('\n🎉 모든 테스트가 성공적으로 완료되었습니다!');

  } catch (error) {
    console.error('❌ 테스트 실패:', error.response?.data || error.message);
  }
}

// 테스트 실행
testCalendarAPI(); 