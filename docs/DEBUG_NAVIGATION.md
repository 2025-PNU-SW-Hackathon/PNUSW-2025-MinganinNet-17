# Debug Navigation Override System

## Overview

The Debug Navigation Override System provides a standardized way to bypass backend dependencies during development, allowing UI testing to proceed independently of backend status. This system is automatically disabled in production builds.

## Architecture

### Configuration (`src/config/debug.ts`)
- **Global Flag**: `IS_DEBUG_MODE_ENABLED = __DEV__` - automatically disabled in production
- **Feature Flags**: Individual controls for debug features
- **Utilities**: Debug logging and navigation helpers

### Component (`components/DebugNextButton.tsx`)
- **Reusable Component**: Standardized debug button with consistent styling
- **Production Safe**: Automatically hidden when debug mode is disabled
- **Strict Independence**: Only handles navigation, no business logic

## Usage

### Basic Implementation

```tsx
import DebugNextButton from './DebugNextButton';

// In your component
const handleDebugNext = () => {
  // Only navigation logic - no backend calls
  if (onNext) {
    onNext(data);
  }
};

// In your render method
<DebugNextButton
  to="Next Screen"
  onPress={handleDebugNext}
  label="Debug: Skip Backend (건너뛰기)"
  disabled={isLoading}
  style={styles.debugButton}
/>
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `to` | string | Yes | Screen name for logging |
| `onPress` | () => void | Yes | Navigation callback (navigation only) |
| `label` | string | No | Button text (auto-generated if not provided) |
| `disabled` | boolean | No | Whether button is disabled |
| `style` | ViewStyle | No | Custom styling |

### Styling Guidelines

```tsx
const styles = StyleSheet.create({
  debugButton: {
    position: 'absolute',
    bottom: 120, // Above main buttons
    left: 24,
    right: 24,
  },
});
```

## Current Implementations

### 1. SignUpScreen.tsx
- **Bypasses**: Supabase `signUp()` call
- **Location**: Step 1 (password creation)
- **Purpose**: Allow UI testing without backend auth

### 2. LoginScreen.tsx
- **Bypasses**: Supabase `signIn()` call
- **Location**: Main login form
- **Purpose**: Skip authentication for UI testing

### 3. GoalSettingStep1.tsx
- **Bypasses**: `saveHabitToSupabase()` call
- **Location**: Habit goal input
- **Purpose**: Skip database save for UI flow testing

### 4. GoalSettingStep4.tsx
- **Bypasses**: `saveHabitToSupabase()` call
- **Location**: Coaching intensity selection
- **Purpose**: Skip database update for UI flow testing

### 5. GoalSettingStep5.tsx
- **Bypasses**: Multiple backend calls:
  - `submitHabitData()` (AI routine generation)
  - `saveHabitToSupabase()` (database save)
  - `scheduleAllHabitRoutines()` (notification setup)
- **Location**: Final completion step
- **Purpose**: Skip all backend processing for UI completion testing

### 6. GoalSettingStep6.tsx
- **Bypasses**: Missing AI-generated plan dependency
- **Location**: Plan display and final completion
- **Purpose**: Creates mock plan data when AI generation fails, allowing UI flow testing
- **Special Feature**: Shows on both error state (missing plan) and normal state

## Standards for New Screens

### Required Implementation
Any new screen with backend-dependent navigation **must** include debug navigation:

```tsx
// 1. Import the component
import DebugNextButton from './DebugNextButton';

// 2. Create debug handler (navigation only)
const handleDebugNext = () => {
  // Save to local state if needed
  setLocalData(data);
  
  // Call navigation callback
  if (onNext) {
    onNext(data);
  }
};

// 3. Add to render
<DebugNextButton
  to="Target Screen"
  onPress={handleDebugNext}
  disabled={isLoading}
  style={styles.debugButton}
/>
```

### Critical Requirements

1. **Strict Independence**: Debug handlers must ONLY contain navigation logic
2. **No Backend Calls**: Never call APIs, database functions, or external services
3. **Local State Only**: Update local state/store if necessary for UI consistency
4. **Consistent Styling**: Use absolute positioning, typically `bottom: 120`
5. **Production Safety**: Always use the standardized component (auto-hidden in production)

## Development Workflow

### Testing Backend-Independent UI
1. Enable debug mode (automatic in `__DEV__`)
2. Navigate to screen with backend dependency
3. Fill required fields (if any)
4. Press debug button to bypass backend calls
5. Continue UI testing on subsequent screens

### Disabling Debug Features
```typescript
// In src/config/debug.ts
export const IS_DEBUG_MODE_ENABLED = false; // Force disable
```

## Best Practices

### Do's ✅
- Use for all screens with backend-dependent navigation
- Keep debug handlers simple and focused
- Update local state for UI consistency
- Use consistent styling and positioning
- Include descriptive labels with Korean text

### Don'ts ❌
- Never include business logic in debug handlers
- Don't make API calls or database operations
- Don't skip input validation that affects UI
- Don't modify the standardized component styling
- Don't forget to test both debug and normal flows

## Troubleshooting

### Debug Button Not Visible
- Check if `IS_DEBUG_MODE_ENABLED` is `true`
- Verify you're running in development mode (`__DEV__`)
- Ensure the component is imported correctly

### Navigation Not Working
- **Fixed in v2**: Enhanced error boundaries and validation now catch navigation failures
- **Fixed in v2**: All debug handlers now validate callback existence before calling
- **Fixed in v2**: Comprehensive logging helps identify the exact failure point
- Check console logs for detailed error messages with 🐛 DEBUG prefix

### Button Always Disabled
- **Fixed in v2**: Debug buttons no longer require user input to function
- **Fixed in v2**: All debug buttons provide fallback data automatically
- Debug buttons are only disabled during loading/submitting states
- Check console logs to see what fallback data is being used

### Styling Issues
- Use absolute positioning for consistent placement
- Ensure the button doesn't overlap with main UI elements
- Test on different screen sizes

## Version 2 Improvements (2025-01-29)

### Enhanced Error Handling
- All debug handlers now wrapped in try-catch blocks
- Comprehensive logging for debugging navigation issues
- Validation of callback functions before execution
- Detailed error reporting with context information

### Fallback Data Support
- **GoalSettingStep1**: Provides "Debug Habit: 물 8잔 마시기" when no habit text entered
- **SignUpScreen**: Uses "debug@test.com" / "debug123" when fields are empty
- **GoalSettingStep4**: Auto-selects "보통" intensity when none selected
- **GoalSettingStep6**: Creates complete mock plan with milestones and todos when AI generation fails
- All buttons work immediately without requiring user input

### Standardized Disabled States
- LoginScreen: `disabled={isLoading}`
- SignUpScreen: `disabled={isLoading}`
- GoalSettingStep1: `disabled={isSubmitting}`
- GoalSettingStep4: `disabled={isSubmitting}`
- GoalSettingStep5: `disabled={isSubmitting}`
- GoalSettingStep6: `disabled={isSubmitting}`
- No longer dependent on user input validation

### Improved Logging
- Consistent 🐛 DEBUG prefix for all debug messages
- Screen-specific logging (e.g., "GoalStep1", "SignUp", "Login")
- Callback validation logging
- Success/failure confirmation messages

## Future Enhancements

### Potential Additions
- Debug overlay showing current screen state
- Mock data injection for testing edge cases
- Debug navigation history tracking
- Automatic screenshot capture for UI testing

### Integration Opportunities
- CI/CD pipeline integration for automated UI testing
- Testing framework integration (Jest, Detox)
- Debug analytics for development velocity metrics

---

**Note**: This system is designed to improve development velocity. Always ensure production builds have debug features disabled and never commit code with debug features permanently enabled. 