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

export function parsePlanModificationCommand(
    command: string
): Promise<{
    action: 'add_todo' | 'complete_todo' | 'create_report' | 'unknown';
    payload?: {
        description: string;
    };
}>;

export function generateDailyReflectionChatResponse(
    messages: Array<{role: 'user' | 'coach', content: string, timestamp: Date}>,
    todos: Array<{id: string, description: string, completed: boolean}>,
    achievementScore: number
): Promise<string>;

export function evaluateDailyReflectionCompletion(
    messages: Array<{role: 'user' | 'coach', content: string, timestamp: Date}>,
    minimumExchanges?: number
): Promise<{
    isComplete: boolean;
    reason: string;
    completionScore: number;
    missingAspects: string[];
}>;

export function generateFinalDailyReflectionSummary(
    messages: Array<{role: 'user' | 'coach', content: string, timestamp: Date}>,
    todos: Array<{id: string, description: string, completed: boolean}>,
    achievementScore: number
): Promise<string>; 