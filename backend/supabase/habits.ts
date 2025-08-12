import { Plan, PlanForCreation } from '../../types/habit';
import { supabase } from './client';

/**
 * Checks if the current user has any habits in the database.
 * 
 * @returns {Promise<boolean>} A promise that resolves to true if user has habits, false otherwise.
 */
export async function checkUserHasHabits(): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    console.warn('🔓 No authenticated user found, cannot check habits.');
    return false;
  }

  const { data: habitsData, error } = await supabase
    .from('habits')
    .select('id')
    .eq('user_id', user.id)
    .limit(1);

  if (error) {
    console.error('Supabase error checking user habits:', error);
    return false;
  }

  return habitsData && habitsData.length > 0;
}

/**
 * Fetches the currently active plan for the logged-in user.
 * It retrieves a nested structure of Plan -> Milestones -> Daily_Todos.
 *
 * @returns {Promise<Plan | null>} A promise that resolves to the user's active plan or null if not found.
 */
export async function getActivePlan(): Promise<Plan | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    console.warn('🔓 No authenticated user found, cannot fetch plan.');
    return null;
  }

  const { data: planData, error } = await supabase
    .from('plans')
    .select(
      `
      *,
      milestones (
        *,
        daily_todos ( * )
      )
    `
    )
    .eq('user_id', user.id) // Assuming 'plans' has 'user_id'
    .eq('status', 'in_progress')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows found, which is not an error in this context
      console.log('✅ No active plan found for this user.');
      return null;
    }
    console.error('Supabase error fetching active plan:', error);
    return null;
  }

  return planData as Plan;
}

/**
 * Creates a new habit and its associated plan, milestones, and daily todos in the database.
 * This function handles the entire relational insert process.
 *
 * @param habitName - The name of the new habit.
 * @param planData - An object with the structure of PlanForCreation, containing all details for the new plan.
 * @returns {Promise<Plan>} A promise that resolves to the newly created plan, including DB-generated fields.
 */
export async function createNewHabitAndPlan(
  habitName: string,
  planData: PlanForCreation // <-- Use the new creation type
): Promise<Plan> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Authentication required to create a new habit and plan.');
  }

  // Step 1: Create the new Habit
  const { data: newHabit, error: habitError } = await supabase
    .from('habits')
    .insert({
      user_id: user.id,
      habit_name: habitName,
    })
    .select()
    .single();

  if (habitError || !newHabit) {
    console.error('Error creating habit:', habitError);
    throw new Error('Failed to create the habit.');
  }

  // Step 2: Create the new Plan, linked to the habit
  const { milestones, ...planDetails } = planData;
  const { data: newPlan, error: planError } = await supabase
    .from('plans')
    .insert({
      ...planDetails,
      habit_id: newHabit.id,
      user_id: user.id, // Make sure user_id is in plans table
    })
    .select()
    .single();

  if (planError || !newPlan) {
    console.error('Error creating plan:', planError);
    throw new Error('Failed to create the plan.');
  }

  // 잠시 대기 (RLS 정책이 적용될 시간을 줌)
  await new Promise(resolve => setTimeout(resolve, 100));

  // Step 3: Create the Milestones and Daily_Todos
  console.log('🔍 Debug: About to create milestones for plan:', newPlan.id);
  console.log('🔍 Debug: Current user ID:', user.id);
  console.log('🔍 Debug: Milestones to create:', milestones);
  
  const createdMilestones = [];
  for (const milestone of milestones) {
    const { daily_todos, ...milestoneDetails } = milestone;
    console.log('🔍 Debug: Creating milestone with data:', { ...milestoneDetails, plan_id: newPlan.id });
    
    const { data: newMilestone, error: milestoneError } = await supabase
      .from('milestones')
      .insert({
        ...milestoneDetails,
        plan_id: newPlan.id,
      })
      .select()
      .single();

    if (milestoneError || !newMilestone) {
      console.error('💥 Error creating milestone:', milestoneError);
      console.error('💥 Milestone data that failed:', { ...milestoneDetails, plan_id: newPlan.id });
      console.error('💥 Plan ID:', newPlan.id);
      console.error('💥 User ID:', user.id);
      throw new Error('Failed to create a milestone.');
    }

    const createdTodos = [];
    for (const todo of daily_todos) {
      const { data: newTodo, error: todoError } = await supabase
        .from('daily_todos')
        .insert({
          ...todo,
          milestone_id: newMilestone.id,
        })
        .select()
        .single();
      
      if (todoError || !newTodo) {
        console.error('Error creating daily todo:', todoError);
        throw new Error('Failed to create a daily todo.');
      }
      createdTodos.push(newTodo);
    }
    createdMilestones.push({ ...newMilestone, daily_todos: createdTodos });
  }

  return { ...newPlan, milestones: createdMilestones };
} 