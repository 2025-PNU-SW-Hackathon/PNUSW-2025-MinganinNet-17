// app.config.js 파일 내용

console.log('🔍 Debug: Loading dotenv...');
require('dotenv').config();

console.log('🔍 Debug: dotenv loaded. Checking environment variables:');
console.log('🔍 Debug: process.env.GEMINI_API_KEY =', process.env.GEMINI_API_KEY);
console.log('🔍 Debug: process.env.EXPO_PUBLIC_SUPABASE_URL =', process.env.EXPO_PUBLIC_SUPABASE_URL);
console.log('🔍 Debug: All process.env keys containing GEMINI:', Object.keys(process.env).filter(key => key.includes('GEMINI')));
console.log('🔍 Debug: Current working directory:', process.cwd());
console.log('🔍 Debug: .env file should be at:', require('path').join(process.cwd(), '.env'));

const geminiApiKey = process.env.GEMINI_API_KEY;
console.log('🔍 Debug: geminiApiKey being passed to extra:', geminiApiKey);
console.log('🔍 Debug: geminiApiKey type:', typeof geminiApiKey);
console.log('🔍 Debug: geminiApiKey length:', geminiApiKey ? geminiApiKey.length : 'undefined');

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
    fonts: [
      "./fonts/나눔손글씨 규리의 일기.ttf"
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
      package: "com.routy.app",
      permissions: ["RECORD_AUDIO"]
    },
    web: {
      favicon: "./assets/images/favicon.png",
      bundler: "metro"
    },
    extra: {
      geminiApiKey: geminiApiKey,
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