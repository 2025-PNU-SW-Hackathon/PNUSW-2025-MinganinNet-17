// app.config.js 파일 내용

// 이 줄을 추가하여 .env 파일을 읽어들입니다.
require('dotenv').config(); 
console.log('--- app.config.js에서 읽은 GEMINI_API_KEY:', process.env.GEMINI_API_KEY);

module.exports = {
  expo: {
    name: "rooty", // 당신의 프로젝트 이름
    slug: "rooty", // 프로젝트 slug (name과 같아도 됨)
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png", // 앱 아이콘 경로
    // ... (여기에 기존에 있던 다른 설정들도 그대로 두세요) ...

    // !!! 이 'extra' 필드를 추가하거나 수정하세요 !!!
    extra: {
      // .env 파일에서 읽어온 GEMINI_API_KEY 값을 여기에 넣어줍니다.
      geminiApiKey: process.env.GEMINI_API_KEY, 
      eas: {
        projectId: "YOUR_EAS_PROJECT_ID" // EAS를 사용한다면 입력, 아니면 이 줄은 생략해도 됩니다.
      }
    },
    // ... (여기에 기존에 있던 다른 설정들도 그대로 두세요) ...
  },
};