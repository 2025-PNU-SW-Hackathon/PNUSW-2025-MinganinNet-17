# Project Functional Specification: Intelligent Goal Decomposition and Habit Management App

## 1. Overview

This document specifies the main features of a mobile app service designed to help users achieve high-level goals through intelligent goal decomposition, automated sub-goal scheduling, and personalized AI coaching. The app breaks down complex goals into manageable sub-goals, schedules them efficiently on the calendar without time conflicts, and provides AI-powered guidance and app restriction features.

**Key Evolution:** The app has expanded from simple habit management to intelligent goal decomposition. Users input high-level goals (e.g., "read 10 books in a month", "master the college-level Calculus 1 in 2 months"), and the system automatically breaks them down into actionable sub-goals, then schedules them optimally on the calendar while leveraging existing features like morning briefings and daily/weekly reports.

Note: As the application is intended for the Korean market, all user-facing text in the UI (including inputs, prompts, and messages) will be displayed in Korean.

## 2. Development Environment and Key Tech Stack

*   **App Development:** Expo, React Native
*   **Database:** Supabase
*   **Backend Functions:** AI API calls and related logic processing (considering Supabase Edge Functions or similar serverless environments).
*   **AI Service:** Google Gemini API
*   **Calendar Integration:** User-friendly calendar APIs such as the Expo Calendar API or React Native Calendar libraries.

## 3. Key Features and Execution Flow

### 3.1. Intelligent Goal Decomposition and Sub-Goal Scheduling

**Objective:** Based on the user's high-level goal and available time window, Google Gemini intelligently breaks down the goal into actionable sub-goals and schedules them on the calendar without time conflicts.

**Input:**
*   **Primary Goal:** High-level goal the user wants to achieve (String, e.g., "read 10 books in a month," "learn intermediate Spanish conversation in 3 months," "lose 5kg in 8 weeks").
*   **Available Time Window:** Daily time slot when the user can work on their goal (String, e.g., "19:00 - 22:00," "06:00 - 08:00"). No differentiation between weekdays and weekends for implementation simplicity.

**Processing Flow:**
1.  **User Input:** The app receives the primary goal and time window from the user through the UI.
2.  **Data Storage:** The entered goal information is saved to the Supabase database. For Exception Handling, It can be stored both on local database and Supabase database. 
3.  **Backend Function Call:** The app calls a Supabase backend function, passing the goal and time window as arguments.
4.  **Google Gemini API Call for Goal Decomposition (Backend):**
    *   The backend function calls the Google Gemini API to decompose the high-level goal.
    *   **Prompt Example:**
        ```
        "Break down the following high-level goal into specific, actionable sub-goals that can be completed within the given time constraints.
        - Primary Goal: [User Input: Primary Goal]
        - Available Time Window: [User Input: Available Time Window]
        
        Requirements:
        - Create 3-10 sub-goals that collectively achieve the primary goal
        - Each sub-goal should be specific, measurable, and time-bound
        - Sub-goals should fit within the available time window
        - Provide realistic time estimates for each sub-goal
        - Include difficulty progression (easier tasks first)
        
        The response should be in JSON format with the following structure:
        {
          'goal_breakdown': {
            'primary_goal': '[Primary Goal]',
            'total_duration': '[Estimated total duration]',
            'sub_goals': [
              {
                'id': 1,
                'title': '[Sub-goal title]',
                'description': '[Detailed description]',
                'estimated_duration': '[Duration in minutes]',
                'priority': '[High/Medium/Low]',
                'difficulty': '[Easy/Medium/Hard]',
                'prerequisites': '[List of prerequisite sub-goal IDs]'
              }
            ],
            'tips': '[Overall tips for achieving the primary goal]'
          }
        }"
        ```
    *   **Response Format:** Receives and parses the goal decomposition from Gemini in JSON format.
    *   **Model Selection:** Uses an appropriate Gemini model such as `gemini-pro` or `gemini-1.5-flash`.
    *   **Safety Settings:** Applies the Gemini API's safety settings for filtering harmful content.

5.  **Intelligent Calendar Scheduling (Backend):**
    *   Automatically schedules the generated sub-goals on the user's calendar using the  decided Calender such as `react-native-calendars` API.
    *   **Conflict-Free Scheduling:** Implements intelligent scheduling algorithm to ensure no time overlaps between sub-goals.
    *   **Scheduling Logic:**
        - Analyzes the available time window
        - Considers sub-goal prerequisites and dependencies
        - Optimizes for difficulty progression (easier tasks first)
        - Distributes sub-goals across available time slots
        - Ensures adequate breaks between intensive sub-goals
    *   **Calendar Event Creation:** Creates calendar events for each sub-goal with:
        - Title and description
        - Specific start and end times
        - Priority and difficulty indicators
        - Progress tracking capabilities
    *   **Notification Setup:** Sets up notifications before each sub-goal activity to help users stay on track.

6.  **Integration with Existing Features:**
    *   **Morning Briefing:** Incorporates sub-goal progress into daily morning briefings
    *   **Daily/Weekly Reports:** Provides comprehensive progress reports on sub-goal completion
    *   **AI Coaching:** Adapts existing AI coaching features to work with decomposed sub-goals

7.  **Response Return:** The generated sub-goals, calendar scheduling results, and integration status are returned to the app.

### 3.2. Restricted App Access Warning and Message Generation

**Objective:** When a user accesses a self-restricted app, Google Gemini generates a warning message tailored to a specific AI personality and displays it in the app.

**Input:**
*   **Detected App Name:** The name of the restricted app the user has accessed (e.g., "YouTube").
*   **AI Personality:** A pre-defined AI personality from the backend (e.g., "Friendly Advisor," "Strict Coach," "Witty Friend").
*   **Current Sub-Goal Context:** Information about the user's current sub-goal to provide contextual warnings.

**Processing Flow:**
1.  **App Access Detection (Client-side):**
    *   Detects user access to restricted apps within the React Native/Expo environment. (Requires platform-specific native modules or libraries).
2.  **Backend Function Call:** The app calls a Supabase backend function, passing the detected app name, AI personality, and current sub-goal context as arguments.
3.  **Google Gemini API Call (Backend):**
    *   The backend function calls the Google Gemini API based on the received app name, AI personality, and sub-goal context.
    *   **Prompt Example:**
        ```
        "The user has accessed [Detected App Name] while working on their sub-goal: [Current Sub-Goal].
        Based on the following AI personality, write a 1-2 sentence warning message encouraging the user to refrain from using the app and focus on their current sub-goal.
        - AI Personality: [AI Personality]
        - Current Sub-Goal: [Current Sub-Goal Title and Description]

        Examples:
        - Friendly Advisor: 'Hey there! I see you're working on [Sub-Goal]. How about we focus on that instead of [Detected App Name]? You're making great progress!'
        - Strict Coach: 'Access to [Detected App Name] is prohibited. Your current sub-goal "[Sub-Goal]" requires your full attention.'
        - Witty Friend: 'Looks like [Detected App Name] is trying to distract you from [Sub-Goal]! Show it that your goals are stronger!'"
        ```
    *   **Response Format:** Receives the contextual warning message from Gemini in text format.
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

## 5. Technical Requirements for Calendar Integration

### 5.1. Conflict-Free Scheduling Algorithm
*   **Time Window Analysis:** Parse user's available time window (e.g., "19:00 - 22:00") and calculate total available minutes.
*   **Sub-Goal Duration Management:** Ensure sum of all sub-goal durations fits within available time slots.
*   **Dependency Resolution:** Schedule sub-goals that have prerequisites after their dependencies are completed.
*   **Buffer Time:** Include 5-10 minute buffers between sub-goals to prevent overlap and allow for transitions.

### 5.2. Calendar API Integration
*   **Calendar Library:** Utilize `react-native-calendars` for advanced calendar functionality.
*   **Event Management:** Create, update, and delete calendar events programmatically.
*   **Visual Indicators:** Display different colors or icons for sub-goals based on priority and difficulty.
*   **Progress Tracking:** Update calendar events as sub-goals are completed.




# IMPORTANT: My claude agent's role

You are a Master Frontend Design Specialist with comprehensive expertise across all aspects of frontend development and UI/UX implementation. You prioritize TOKEN EFFICIENCY in all communications while maintaining technical excellence.

## Core Competencies:
- **Component Architecture**: Creating reusable, scalable React/Vue/Angular components with proper TypeScript interfaces
- **Responsive Design**: Mobile-first layouts using CSS Grid, Flexbox, and modern CSS techniques
- **Interactive UI**: Smooth animations, micro-interactions, and state-driven interfaces
- **Design Systems**: Implementation of consistent design tokens, theming, and component libraries
- **Form Design**: Intuitive, accessible forms with robust validation and user experience optimization
- **Accessibility**: WCAG compliance, ARIA attributes, keyboard navigation, and inclusive design
- **Performance**: Optimized CSS, efficient animations, and fast-loading interfaces

## CRITICAL: Token Efficiency Guidelines
- **Be Concise**: Answer directly without unnecessary preamble or explanations
- **Code-First**: Provide working code immediately, minimize descriptive text
- **Batch Operations**: Use multiple tool calls in single responses when possible
- **Focused Responses**: Address only what's asked, avoid tangential information
- **Minimal Commentary**: Let code speak for itself unless explanation is specifically requested
- **Efficient Planning**: Create specific, actionable todos without verbose descriptions

## Technical Stack Adaptability:
Automatically detect and work with existing project patterns without lengthy analysis explanations.

## Streamlined Workflow:
1. **Quick Analysis**: Rapidly assess codebase and requirements
2. **Direct Implementation**: Immediately provide working solutions
3. **Efficient Verification**: Test only what's necessary

## Communication Style:
- Use 1-3 sentences maximum for explanations
- Provide code first, explanations only if critical
- Never repeat information already provided
- Skip confirmations like "I'll help you with..." - just do it
- Avoid summarizing what you just did
- One-word answers when appropriate ("Done", "Fixed", "Complete")

## Output Standards:
- Complete, production-ready code with minimal commentary
- Essential TypeScript interfaces only
- Critical accessibility attributes without explanation
- Suggest improvements only when specifically asked

You deliver exceptional frontend solutions with maximum efficiency and minimal token usage, letting your code quality speak for itself.
--- 

