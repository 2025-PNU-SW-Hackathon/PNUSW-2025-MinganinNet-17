export function sendMessage(prompt: string, signal?: AbortSignal): Promise<string>;
export function sendMessageFlash(message: string): Promise<string>;
export function sendSimpleMessage(message: string): Promise<string>;
export function sendMessageStream(prompt: string, signal?: AbortSignal, onChunk?: (chunk: string, fullResponse: string) => void): Promise<string>; 

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

export function generateGoalSettingResponse(
    conversationHistory: Array<{type: string, content: string}>,
    currentGoalData: any
): Promise<{textResponse: string, goalData: any}>; 