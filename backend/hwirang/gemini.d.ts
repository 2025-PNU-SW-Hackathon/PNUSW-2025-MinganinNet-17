export function sendMessage(prompt: string): Promise<string>; 

interface TodoItem {
    id: string;
    description: string;
    completed: boolean;
}

export function generateDailyFeedback(
    userSummary: string, 
    achievementScore: number, 
    todos: TodoItem[]
): Promise<string>; 