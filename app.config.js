// app.config.js 파일 내용

require('dotenv').config();

module.exports = {
  expo: {
    name: "routy", // 프로젝트 이름
    slug: "routy", // 프로젝트 slug
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png", // 앱 아이콘 경로
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#1c1c2e"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.routy.app"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#1c1c2e"
      },
      package: "com.routy.app"
    },
    web: {
      favicon: "./assets/images/favicon.png",
      bundler: "metro"
    },
    extra: {
      geminiApiKey: process.env.GEMINI_API_KEY,
      backendUrl: process.env.BACKEND_URL || 'http://localhost:3001',
      eas: {
        projectId: "YOUR_EAS_PROJECT_ID"
      }
    },
    plugins: [
      "expo-router"
    ],
    scheme: "routy",
    experiments: {
      typedRoutes: true
    }
  },
};