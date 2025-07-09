# Project Functional Specification: Habit Formation and Management App

## 1. Overview

This document specifies the main features of a mobile app service designed to help users form habits, restrict the use of specific apps to achieve set goals, and provide personalized routines and warning messages using AI (Google Gemini).

Note: As the application is intended for the Korean market, all user-facing text in the UI (including inputs, prompts, and messages) will be displayed in Korean.

## 2. Development Environment and Key Tech Stack

*   **App Development:** Expo, React Native
*   **Database:** Supabase
*   **Backend Functions:** AI API calls and related logic processing (considering Supabase Edge Functions or similar serverless environments).
*   **AI Service:** Google Gemini API
*   **Calendar Integration:** User-friendly calendar APIs such as the Expo Calendar API or React Native Calendar libraries.

## 3. Key Features and Execution Flow

### 3.1. Habit Setting and Routine Generation

**Objective:** Based on the user's habit goals, available time, and difficulties, Google Gemini generates an optimized routine and saves it to the calendar.

**Input:**
*   **Desired Habit:** Specific habit goals the user wants to achieve (e.g., "Exercise for 30 minutes every morning," "Read for 2 hours a day").
*   **Available Time for Habit:** Time slots when the user can practice the habit (e.g., "7 AM to 8 AM," "1 hour after work").
*   **Difficulties in Habit Formation:** Obstacles that hinder consistent practice of the habit (e.g., "Difficulty in being consistent," "Fatigue after exercise," "Lack of focus").
*   **Restricted Apps:** A list of apps the user deems distracting from habit formation (e.g., "YouTube," "Instagram," "TikTok").

**Processing Flow:**
1.  **User Input:** The app receives the above input values from the user through the UI.
2.  **Data Storage:** The entered user settings are saved to the Supabase database.
3.  **Backend Function Call:** The app calls a Supabase backend function, passing the user input data as arguments.
4.  **Google Gemini API Call (Backend):**
    *   The backend function calls the Google Gemini API based on the received user data.
    *   **Prompt Example:**
        ```
        "Based on the following information, create a personalized habit formation routine for the user.
        - Desired Habit: [User Input: Desired Habit]
        - Available Time: [User Input: Available Time]
        - Difficulties in Habit Formation: [User Input: Difficulties in Habit Formation]
        - Restricted Apps: [User Input: List of Restricted Apps]

        The routine should consist of specific activities and recommended times, and include advice to help the user overcome their difficulties.
        The response should be in JSON format, including 'routine_name', 'activities' (each activity with 'time' and 'description' fields), and 'tips' fields."
        ```
    *   **Response Format:** Receives and parses the routine information from Gemini in JSON format.
    *   **Model Selection:** Uses an appropriate Gemini model such as `gemini-pro` or `gemini-1.5-flash`.
    *   **Safety Settings:** Applies the Gemini API's safety settings for filtering harmful content.
5.  **Calendar Integration (Backend):**
    *   Automatically registers the generated routine information into the user's calendar.
    *   **Calendar API Utilization:** Implemented using user-friendly calendar APIs like the React Native Calendar library or Expo Calendar API.
    *   **Schedule Registration:** Registers each activity of the Gemini-generated routine as a calendar event according to its time slot.
    *   **Notification Setup:** Sets up notifications at appropriate times before each routine activity starts to help the user avoid missing their habit practice.
6.  **Response Return:** The generated routine information and calendar registration results are returned to the app.


### 3.2. Restricted App Access Warning and Message Generation

**Objective:** When a user accesses a self-restricted app, Google Gemini generates a warning message tailored to a specific AI personality and displays it in the app.

**Input:**
*   **Detected App Name:** The name of the restricted app the user has accessed (e.g., "YouTube").
*   **AI Personality:** A pre-defined AI personality from the backend (e.g., "Friendly Advisor," "Strict Coach," "Witty Friend").

**Processing Flow:**
1.  **App Access Detection (Client-side):**
    *   Detects user access to restricted apps within the React Native/Expo environment. (Requires platform-specific native modules or libraries).
2.  **Backend Function Call:** The app calls a Supabase backend function, passing the detected app name and AI personality as arguments.
3.  **Google Gemini API Call (Backend):**
    *   The backend function calls the Google Gemini API based on the received app name and AI personality.
    *   **Prompt Example:**
        ```
        "The user has accessed [Detected App Name].
        Based on the following AI personality, write a 1-2 sentence warning message encouraging the user to refrain from using the app and focus on their habit.
        - AI Personality: [AI Personality]

        Examples:
        - Friendly Advisor: 'Hey there! How about we focus on your habit instead of [Detected App Name]? You're so close to reaching your goal!'
        - Strict Coach: 'Access to [Detected App Name] is prohibited. It is now time to focus on your habit goal.'
        - Witty Friend: 'Looks like [Detected App Name] is trying to tempt you! Show it that your habit is stronger!'"
        ```
    *   **Response Format:** Receives the warning message from Gemini in text format.
    *   **Model Selection:** Uses an appropriate Gemini model such as `gemini-pro` or `gemini-1.5-flash`.
    *   **Safety Settings:** Applies the Gemini API's safety settings for filtering harmful content.
4.  **Display Warning Message (Client-side):**
    *   Displays the Gemini-generated warning message on the app screen as a Toast message, modal pop-up, or push notification.

## 4. Environment Variable Management

For security and flexible management, the following information is stored and managed as environment variables.

*   `GEMINI_API_KEY`: Google Gemini API authentication key.
*   `SUPABASE_URL`: Supabase project URL.
*   `SUPABASE_ANON_KEY`: Supabase anonymous key.
*   `BACKEND_FUNCTION_ENDPOINT`: Endpoint URL for backend function calls.

--- 