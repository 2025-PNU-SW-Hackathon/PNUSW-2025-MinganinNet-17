/**
 * Debug test script for weekly reports
 * Run this to test the weekly report generation in debug mode
 */

// Mock debug store for testing
const mockDebugStore = {
  getState: () => ({ isDebugEnabled: true })
};

// Test the mock data functions
async function testMockData() {
  console.log('🧪 Testing Mock Daily Reports...\n');
  
  try {
    // Import the mock data
    const { 
      MOCK_DAILY_REPORTS, 
      calculateMockWeeklyStats, 
      getMockWeekRange 
    } = await import('./src/data/mockDailyReports.js');
    
    // Test mock data structure
    console.log('📊 Mock Daily Reports Count:', MOCK_DAILY_REPORTS.length);
    console.log('📅 Date Range:', getMockWeekRange());
    console.log('📈 Weekly Stats:', calculateMockWeeklyStats());
    
    // Test individual report structure
    console.log('\n📋 Sample Report Structure:');
    const sampleReport = MOCK_DAILY_REPORTS[0];
    console.log('- ID:', sampleReport.id);
    console.log('- Date:', sampleReport.report_date);
    console.log('- Score:', sampleReport.achievement_score);
    console.log('- Todos Count:', sampleReport.daily_activities.todos.length);
    console.log('- Feedback Count:', sampleReport.ai_coach_feedback.length);
    
    console.log('\n✅ Mock data test successful!');
    return true;
  } catch (error) {
    console.error('❌ Mock data test failed:', error);
    return false;
  }
}

// Test weekly aggregation logic
async function testWeeklyAggregation() {
  console.log('\n🧪 Testing Weekly Aggregation Logic...\n');
  
  try {
    // Import the functions we need to test
    const { aggregateWeeklyReports } = await import('./backend/supabase/reports.js');
    
    // Mock the debug store globally
    global.useDebugStore = mockDebugStore;
    
    // Test the aggregation function
    const result = await aggregateWeeklyReports();
    
    if (result) {
      console.log('📊 Aggregation Result:');
      console.log('- Week Start:', result.weekStart);
      console.log('- Week End:', result.weekEnd);  
      console.log('- Average Score:', result.averageScore);
      console.log('- Days Completed:', result.daysCompleted);
      console.log('- Daily Scores:', result.dailyScores);
      console.log('- Reports Count:', result.dailyReports.length);
      
      console.log('\n✅ Weekly aggregation test successful!');
      return true;
    } else {
      console.error('❌ Aggregation returned null');
      return false;
    }
  } catch (error) {
    console.error('❌ Weekly aggregation test failed:', error);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Weekly Report Debug Tests\n');
  console.log('=' .repeat(50));
  
  const mockDataSuccess = await testMockData();
  const aggregationSuccess = await testWeeklyAggregation();
  
  console.log('\n' + '=' .repeat(50));
  console.log('📋 Test Summary:');
  console.log('- Mock Data:', mockDataSuccess ? '✅ PASS' : '❌ FAIL');
  console.log('- Aggregation:', aggregationSuccess ? '✅ PASS' : '❌ FAIL');
  
  if (mockDataSuccess && aggregationSuccess) {
    console.log('\n🎉 All tests passed! Weekly reports should work in debug mode.');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the implementation.');
  }
  
  console.log('\n🔧 To use in the app:');
  console.log('1. Enable debug mode in the app settings');
  console.log('2. Navigate to weekly reports');
  console.log('3. Click "주간 리포트 생성하기"');
  console.log('4. Check console for debug logs');
}

// Run the tests
runTests().catch(console.error);