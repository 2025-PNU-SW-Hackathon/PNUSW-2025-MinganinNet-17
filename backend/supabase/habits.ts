import { DailyTodoInstance, DailyTodoInstanceForCreation, Plan, PlanForCreation } from '../../types/habit';
import { supabase } from './client';
import { useDebugStore } from '../../src/config/debug';
import { MOCK_PLAN } from '../../src/data/mockPlan';

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

  // Step 5: Generate daily todo instances based on the created plan and todos
  const finalPlan = { ...newPlan, milestones: createdMilestones } as Plan;
  try {
    await generateDailyTodoInstances(finalPlan);
    console.log('✅ Daily todo instances generated successfully');
  } catch (error) {
    console.error('❌ Error generating daily todo instances:', error);
    // Proceed without blocking plan creation; instances can be generated later if needed
  }

  return finalPlan;
}

/**
 * Helper function to parse duration string to days using accurate date calculation
 * @param duration - Duration string (e.g., "3개월", "2주", "7일")
 * @param startDate - Base date for calculation (important for accurate month calculation)
 * @returns number of days
 */
function parseDurationToDays(duration: string, startDate: Date): number {
  if (duration.includes('개월')) {
    const months = parseInt(duration.replace('개월', '').trim(), 10);
    if (isNaN(months)) return 0;
    
    // Use Date.setMonth() for accurate month calculation
    const endDate = new Date(startDate);
    endDate.setMonth(startDate.getMonth() + months);
    
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }
  if (duration.includes('주')) {
    const weeks = parseInt(duration.replace('주', '').trim(), 10);
    return isNaN(weeks) ? 0 : weeks * 7;
  }
  if (duration.includes('일')) {
    const days = parseInt(duration.replace('일', '').trim(), 10);
    return isNaN(days) ? 0 : days;
  }
  return 0;
}

/**
 * Generates mock daily todo instances from the mock plan for debug mode
 * 
 * @param date - The date in "YYYY-MM-DD" format  
 * @returns DailyTodoInstance[] - Array of mock daily todo instances
 */
function generateMockTodoInstances(date: string): DailyTodoInstance[] {
  console.log('🐛 DEBUG MODE: Generating mock todo instances for date:', date);
  
  // Use first milestone todos for simplicity in debug mode
  const firstMilestone = MOCK_PLAN.milestones[0];
  if (!firstMilestone) return [];

  return firstMilestone.daily_todos.map(todo => ({
    id: `mock-instance-${todo.id}-${date}`,
    user_id: 'mock-user-debug',
    plan_id: MOCK_PLAN.id,
    original_todo_id: todo.id.toString(),
    date: date,
    description: todo.description,
    is_completed: todo.is_completed,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));
}

/**
 * Fetches daily todo instances for a specific date.
 * In debug mode, returns mock data instead of querying the database.
 * 
 * @param date - The date in "YYYY-MM-DD" format
 * @returns Promise<DailyTodoInstance[]> - Array of daily todo instances for the date
 */
export async function getDailyTodosByDate(date: string): Promise<DailyTodoInstance[]> {
  // Check for debug mode first
  const { isDebugEnabled } = useDebugStore.getState();
  if (__DEV__ && isDebugEnabled) {
    console.log('🐛 DEBUG MODE: Using mock data instead of database');
    return generateMockTodoInstances(date);
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.warn('🔓 No authenticated user found, cannot fetch daily todos.');
    return [];
  }

  const { data, error } = await supabase
    .from('daily_todo_instances')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', date)
    .order('created_at');

  if (error) {
    console.error('Error fetching daily todos:', error);
    return [];
  }

  return data || [];
}

/**
 * Updates the completion status of a daily todo instance.
 * In debug mode, simulates the update without touching the database.
 * 
 * @param instanceId - The UUID of the daily todo instance
 * @param isCompleted - The new completion status
 * @returns Promise<void>
 */
export async function updateTodoCompletion(
  instanceId: string, 
  isCompleted: boolean
): Promise<void> {
  // Check for debug mode first
  const { isDebugEnabled } = useDebugStore.getState();
  if (__DEV__ && isDebugEnabled) {
    console.log('🐛 DEBUG MODE: Simulating todo completion update for:', instanceId, isCompleted);
    // In debug mode, we don't actually update anything - the UI state will handle this
    return;
  }

  const { error } = await supabase
    .from('daily_todo_instances')
    .update({ 
      is_completed: isCompleted,
      updated_at: new Date().toISOString()
    })
    .eq('id', instanceId);

  if (error) {
    console.error('Error updating todo completion:', error);
    throw error;
  }
}

/**
 * Generates daily todo instances for all dates in a plan.
 * This function should be called after creating a new plan.
 * Uses accurate date calculation for month durations.
 * 
 * @param plan - The plan object with milestones and daily todos
 * @returns Promise<void>
 */
export async function generateDailyTodoInstances(plan: Plan): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const instances: DailyTodoInstanceForCreation[] = [];
  const startDate = new Date(plan.start_date);
  
  let dayCounter = 0;
  
  for (const milestone of plan.milestones) {
    // Use improved parseDurationToDays with startDate for accurate calculation
    const milestoneStartDate = new Date(startDate);
    milestoneStartDate.setDate(startDate.getDate() + dayCounter);
    
    const durationInDays = parseDurationToDays(milestone.duration, milestoneStartDate);
    
    for (let day = 0; day < durationInDays; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + dayCounter + day);
      
      for (const todo of milestone.daily_todos) {
        instances.push({
          user_id: user.id,
          plan_id: plan.id,
          original_todo_id: todo.id,
          date: currentDate.toISOString().split('T')[0],
          description: todo.description,
          is_completed: false
        });
      }
    }
    dayCounter += durationInDays;
  }

  // Batch insert all instances
  if (instances.length > 0) {
    const { error } = await supabase
      .from('daily_todo_instances')
      .insert(instances);

    if (error) {
      console.error('Error generating daily todo instances:', error);
      throw error;
    }
    
    console.log(`✅ Generated ${instances.length} daily todo instances for plan ${plan.id}`);
  }
}

/**
 * 특정 날짜의 타임라인 이벤트 데이터를 가져옵니다.
 * daily_todo_instances를 중심으로 관련 테이블들을 JOIN하여 
 * 타임라인 표시에 필요한 모든 정보를 한 번에 가져옵니다.
 *
 * @param userId - 사용자 ID
 * @param date - 조회할 날짜 (YYYY-MM-DD 형식)
 * @returns {Promise<any[]>} 타임라인 이벤트 데이터 배열
 */
export async function getTimelineEventsForDate(userId: string, date: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('daily_todo_instances')
      .select(`
        id,
        description,
        is_completed,
        date,
        created_at,
        daily_todos (
          id,
          milestones (
            id,
            title,
            duration,
            status,
            plans (
              id,
              available_time,
              plan_title,
              intensity,
              status
            )
          )
        )
      `)
      .eq('user_id', userId)
      .eq('date', date)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Supabase error fetching timeline events:', error);
      return [];
    }

    console.log(`✅ Fetched ${data?.length || 0} timeline events for date ${date}`);
    return data || [];
    
  } catch (error) {
    console.error('Error fetching timeline events for date:', date, error);
    return [];
  }
} 