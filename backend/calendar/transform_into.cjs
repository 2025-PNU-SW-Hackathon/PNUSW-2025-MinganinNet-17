const fs = require('fs');
const path = require('path');

// 파일 경로
const inputPath = path.join(__dirname, 'input.json');
const outputPath = path.join(__dirname, 'sample.json');
const scorePath = path.join(__dirname, 'score.json');

// input.json 읽기
const inputData = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
// score.json 읽기 (날짜별 score 매핑)
let scoreMap = {};
if (fs.existsSync(scorePath)) {
  try {
    console.log('score.json 읽기 시작');
    const scoreArr = JSON.parse(fs.readFileSync(scorePath, 'utf-8'));
    console.log('score.json 읽기 완료', scoreArr.length);
    scoreMap = Object.fromEntries(scoreArr.map(({ Date, score }) => [Date, score]));
  } catch (e) {
    console.error('score.json 읽기/파싱 에러:', e);
  }
}

// 날짜를 YYYY-MM-DD 문자열로 변환
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// sample.json 구조: { [date: string]: Array<{id, description, time, score}> }
const result = {};
let uuidCounter = 1;

inputData.forEach((item) => {
  const { startDate, description, time, repeat, score } = item;
  const start = new Date(startDate);
  for (let i = 0; i < repeat; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dateStr = formatDate(d);
    if (!result[dateStr]) result[dateStr] = [];
    // score.json에 값이 있으면 덮어쓰기, 없으면 기존 score 사용
    result[dateStr].push({
      id: `uuid-${uuidCounter++}`,
      description,
      time,
      score: scoreMap[dateStr] !== undefined ? scoreMap[dateStr] : score
    });
  }
});

// sample.json로 저장
fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');

console.log('변환 완료! sample.json 파일이 생성되었습니다.'); 