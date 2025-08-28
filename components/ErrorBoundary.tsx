import React, { Component, ErrorInfo, ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../constants/Colors';
import { Spacing } from '../constants/Spacing';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error details for debugging
    console.error('Error stack:', error.stack);
    console.error('Component stack:', errorInfo.componentStack);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  private handleNavigateHome = () => {
    this.setState({ hasError: false, error: undefined });
    try {
      router.replace('/(tabs)');
    } catch (navError) {
      console.error('Navigation error:', navError);
      // If navigation fails, just reset the error state
    }
  };

  private handleReload = () => {
    this.setState({ hasError: false, error: undefined });
    // In a real app, you might want to reload the entire app
    // For now, we'll just reset the error boundary
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return <ErrorFallback 
        error={this.state.error}
        onRetry={this.handleRetry}
        onNavigateHome={this.handleNavigateHome}
        onReload={this.handleReload}
      />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error?: Error;
  onRetry: () => void;
  onNavigateHome: () => void;
  onReload: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  onRetry, 
  onNavigateHome, 
  onReload 
}) => {
  const isDevelopment = __DEV__;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Error Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
        </View>

        {/* Error Title */}
        <Text style={styles.title}>앗, 오류가 발생했어요!</Text>
        
        {/* Error Description */}
        <Text style={styles.description}>
          예상치 못한 문제가 발생했습니다. 다시 시도하거나 홈 화면으로 돌아가세요.
        </Text>

        {/* Development Error Details */}
        {isDevelopment && error && (
          <View style={styles.errorDetails}>
            <Text style={styles.errorDetailsTitle}>개발자 정보:</Text>
            <Text style={styles.errorDetailsText} numberOfLines={5}>
              {error.message}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]} 
            onPress={onRetry}
            activeOpacity={0.8}
          >
            <Text style={[styles.buttonText, styles.primaryButtonText]}>
              다시 시도
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]} 
            onPress={onNavigateHome}
            activeOpacity={0.8}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              홈으로 돌아가기
            </Text>
          </TouchableOpacity>

          {isDevelopment && (
            <TouchableOpacity 
              style={[styles.button, styles.ghostButton]} 
              onPress={onReload}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, styles.ghostButtonText]}>
                새로고침
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing['4xl'],
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  iconContainer: {
    marginBottom: Spacing.xl,
  },
  errorIcon: {
    fontSize: 64,
    textAlign: 'center',
  },
  title: {
    fontSize: Colors.light.typography.fontSize['2xl'],
    fontWeight: '700' as const,
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  description: {
    fontSize: Colors.light.typography.fontSize.base,
    fontWeight: '500' as const,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: Colors.light.typography.fontSize.base * Colors.light.typography.lineHeight.relaxed,
    marginBottom: Spacing['3xl'],
  },
  errorDetails: {
    backgroundColor: Colors.light.neutral[100],
    borderRadius: Spacing.layout.borderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    width: '100%',
  },
  errorDetailsTitle: {
    fontSize: Colors.light.typography.fontSize.sm,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: Spacing.sm,
  },
  errorDetailsText: {
    fontSize: Colors.light.typography.fontSize.xs,
    fontFamily: 'monospace',
    color: Colors.light.textMuted,
    lineHeight: Colors.light.typography.fontSize.xs * 1.4,
  },
  buttonContainer: {
    width: '100%',
    gap: Spacing.md,
  },
  button: {
    height: Spacing.layout.button.height.md,
    borderRadius: Spacing.layout.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing['3xl'],
  },
  primaryButton: {
    backgroundColor: Colors.light.primary,
    shadowColor: Colors.light.primary,
    shadowOffset: {
      width: 0,
      height: Spacing.sm,
    },
    shadowOpacity: 0.25,
    shadowRadius: Spacing.md,
    elevation: Spacing.layout.elevation.sm,
  },
  secondaryButton: {
    backgroundColor: Colors.light.buttonSecondary,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  ghostButton: {
    backgroundColor: 'transparent',
  },
  buttonText: {
    fontSize: Colors.light.typography.fontSize.base,
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
  },
  secondaryButtonText: {
    color: Colors.light.text,
  },
  ghostButtonText: {
    color: Colors.light.primary,
  },
});

// Export a higher-order component for easier wrapping
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

export default ErrorBoundary;