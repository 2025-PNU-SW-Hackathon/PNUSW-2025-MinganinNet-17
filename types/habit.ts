// Type definitions for the new database schema

// Enum types matching the SQL schema
export type PersonaType = 'Easy' | 'Medium' | 'Hard' | 'System';
export type MilestoneStatus = 'in_progress' | 'completed' | 'pending' | 'error';

/**
 * Represents a single, actionable to-do item for a specific day.
 * Corresponds to the `daily_todos` table.
 */
export interface DailyTodo {
  description: string;
  time_slot: string; // "HH:MM-HH:MM"
  repeat_count: number;
  score: number;
}

/**
 * Represents an intermediate goal to achieve the primary plan.
 * Corresponds to the `milestones` table.
 */
export interface Milestone {
  title: string;
  duration: string; // e.g., "1주", "3일"
  status: MilestoneStatus;
  daily_todos: DailyTodo[];
}

/**
 * Represents the user's top-level goal and the AI-generated plan.
 * Corresponds to the `plans` table.
 */
export interface Plan {
  primary_goal: string;
  ai_plan_title: string;
  ai_persona: PersonaType;
  goal_period: string; // e.g., "1개월", "4주"
  start_date: string; // "YYYY-MM-DD"
  milestones: Milestone[];
}