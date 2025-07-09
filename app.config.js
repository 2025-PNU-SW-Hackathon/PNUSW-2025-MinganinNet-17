// app.config.js 파일 내용

// 이 줄을 추가하여 .env 파일을 읽어들입니다.
require('dotenv').config();

module.exports = {
  expo: {
    name: "routy", // 당신의 프로젝트 이름
    slug: "routy", // 프로젝트 slug (name과 같아도 됨)
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png", // 앱 아이콘 경로
    // ... (여기에 기존에 있던 다른 설정들도 그대로 두세요) ...

    extra: {
      geminiApiKey: process.env.GEMINI_API_KEY,
      backendUrl: process.env.BACKEND_URL || 'http://localhost:3001',
      eas: {
        projectId: "YOUR_EAS_PROJECT_ID"
      }
    },
    // ... (여기에 기존에 있던 다른 설정들도 그대로 두세요) ...
  },
};