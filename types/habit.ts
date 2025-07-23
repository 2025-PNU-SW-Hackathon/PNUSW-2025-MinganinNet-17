/**
 * This file defines the TypeScript interfaces that correspond to the new,
 * relational database schema. These types act as the "data blueprints" for
 * our application, ensuring that the data flowing from the backend to the
 * frontend is structured correctly.
 */

// Enum types matching the 'status' columns in the new schema
export type PlanStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type MilestoneStatus = 'pending' | 'in_progress' | 'completed';

/**
 * Corresponds to the `daily_todos` table.
 * Represents a single, actionable to-do item for a specific day.
 */
export interface DailyTodo {
  id: number; // Matches 'bigint' in DB
  created_at: string;
  milestone_id: number;
  description: string;
  is_completed: boolean;
}

/**
 * Corresponds to the `milestones` table.
 * Represents an intermediate goal to achieve a plan.
 */
export interface Milestone {
  id: number; // Matches 'bigint' in DB
  created_at: string;
  plan_id: string; // uuid
  title: string;
  duration: string; // e.g., "1주", "3일"
  status: MilestoneStatus;
  // This array will be populated by Supabase's nested queries
  daily_todos: DailyTodo[];
}

/**
 * Corresponds to the `plans` table.
 * Represents a specific, actionable plan to achieve a habit.
 */
export interface Plan {
  id: string; // uuid
  created_at: string;
  habit_id: string; // uuid
  plan_title: string;
  status: PlanStatus;
  start_date: string; // "YYYY-MM-DD"
  difficulty_reason: string;
  intensity: string;
  available_time: string;
  // This array will be populated by Supabase's nested queries
  milestones: Milestone[];
}

/**
 * Corresponds to the `habits` table.
 * Represents the user's high-level, abstract habit goal.
 */
export interface Habit {
  id: string; // uuid
  created_at: string;
  user_id: string;
  habit_name: string;
}

// --- Types for Creation ---

/**
 * Represents the data structure needed to create a new plan.
 * This is used before the data is inserted into the database,
 * so it does not contain DB-generated fields like `id` or `created_at`.
 */
export interface DailyTodoForCreation {
  description: string;
  is_completed: boolean;
}

export interface MilestoneForCreation {
  title: string;
  duration: string;
  status: MilestoneStatus;
  daily_todos: DailyTodoForCreation[];
}

export interface PlanForCreation {
  plan_title: string;
  status: PlanStatus;
  start_date: string;
  difficulty_reason: string;
  intensity: string;
  available_time: string;
  milestones: MilestoneForCreation[];
}