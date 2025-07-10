const fs = require('fs');
const path = require('path');

const sample = JSON.parse(fs.readFileSync(path.join(__dirname, 'sample.json'), 'utf-8'));
const dates = Object.keys(sample).sort();
const n = dates.length;

const scores = dates.map((date, idx) => {
  // 날짜가 뒤로 갈수록 높은 score를 가질 확률이 높게
  // 앞쪽: 0~4, 중간: 3~7, 뒤쪽: 6~10
  let min, max;
  if (idx < n / 3) {
    min = 0; max = 4;
  } else if (idx < (2 * n) / 3) {
    min = 3; max = 7;
  } else {
    min = 6; max = 10;
  }
  const score = Math.floor(Math.random() * (max - min + 1)) + min;
  return { Date: date, score };
});

fs.writeFileSync(path.join(__dirname, 'score.json'), JSON.stringify(scores, null, 2));
console.log('score.json 생성 완료!'); 