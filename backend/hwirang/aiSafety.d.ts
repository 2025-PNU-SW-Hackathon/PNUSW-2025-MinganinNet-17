declare module '../backend/hwirang/aiSafety' {
  export function comprehensiveSafetyCheck(
    text: string,
    context: 'goal-setting' | 'daily-report' | 'weekly-report'
  ): {
    allowed: boolean;
    safetyMessage: string;
    emergency?: {
      message: string;
      resources: string[];
    };
  };

  export function validateAIResponse(
    text: string
  ): {
    isValid: boolean;
    filteredResponse: string;
    reason?: string;
    message?: string;
  };
}
