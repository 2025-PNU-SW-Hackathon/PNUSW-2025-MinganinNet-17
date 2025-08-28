import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';

interface MarkdownTextProps {
  children: string;
  style?: StyleProp<ViewStyle>;
}

export default function MarkdownText({ children, style }: MarkdownTextProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // Custom markdown styles that match your app's theme
  const markdownStyles = {
    // Body text
    body: {
      fontSize: colors.typography.fontSize.base,
      lineHeight: colors.typography.lineHeight.normal * colors.typography.fontSize.base,
      color: colors.text,
      fontFamily: colors.typography.fontFamily.korean, // Use Korean font for Korean text
    },
    
    // Headers
    heading1: {
      fontSize: colors.typography.fontSize['4xl'],
      fontWeight: '700' as const,
      lineHeight: colors.typography.lineHeight.tight * colors.typography.fontSize['4xl'],
      color: colors.text,
      marginVertical: 16,
      fontFamily: colors.typography.fontFamily.korean,
    },
    heading2: {
      fontSize: colors.typography.fontSize['3xl'],
      fontWeight: '600' as const,
      lineHeight: colors.typography.lineHeight.snug * colors.typography.fontSize['3xl'],
      color: colors.text,
      marginVertical: 14,
      fontFamily: colors.typography.fontFamily.korean,
    },
    heading3: {
      fontSize: colors.typography.fontSize['2xl'],
      fontWeight: '600' as const,
      lineHeight: colors.typography.lineHeight.snug * colors.typography.fontSize['2xl'],
      color: colors.text,
      marginVertical: 12,
      fontFamily: colors.typography.fontFamily.korean,
    },
    heading4: {
      fontSize: colors.typography.fontSize.xl,
      fontWeight: '600' as const,
      lineHeight: colors.typography.lineHeight.normal * colors.typography.fontSize.xl,
      color: colors.text,
      marginVertical: 10,
      fontFamily: colors.typography.fontFamily.korean,
    },
    heading5: {
      fontSize: colors.typography.fontSize.lg,
      fontWeight: '500' as const,
      lineHeight: colors.typography.lineHeight.normal * colors.typography.fontSize.lg,
      color: colors.text,
      marginVertical: 8,
      fontFamily: colors.typography.fontFamily.korean,
    },
    heading6: {
      fontSize: colors.typography.fontSize.base,
      fontWeight: '500' as const,
      lineHeight: colors.typography.lineHeight.normal * colors.typography.fontSize.base,
      color: colors.textSecondary,
      marginVertical: 6,
      fontFamily: colors.typography.fontFamily.korean,
    },
    
    // Paragraphs
    paragraph: {
      fontSize: colors.typography.fontSize.base,
      lineHeight: colors.typography.lineHeight.normal * colors.typography.fontSize.base,
      color: colors.text,
      marginVertical: 8,
      fontFamily: colors.typography.fontFamily.korean,
    },
    
    // Lists
    list_item: {
      fontSize: colors.typography.fontSize.base,
      lineHeight: colors.typography.lineHeight.normal * colors.typography.fontSize.base,
      color: colors.text,
      marginVertical: 4,
      fontFamily: colors.typography.fontFamily.korean,
    },
    ordered_list: {
      marginVertical: 8,
    },
    bullet_list: {
      marginVertical: 8,
    },
    
    // Emphasis
    strong: {
      fontWeight: '700' as const,
      color: colors.text,
      fontFamily: colors.typography.fontFamily.korean,
    },
    em: {
      fontStyle: 'italic',
      color: colors.text,
      fontFamily: colors.typography.fontFamily.korean,
    },
    
    // Links
    link: {
      color: colors.primary,
      textDecorationLine: 'underline',
      fontFamily: colors.typography.fontFamily.korean,
    },
    
    // Code
    code_inline: {
      fontSize: colors.typography.fontSize.sm,
      backgroundColor: colors.surface,
      color: colors.primary,
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 4,
      fontFamily: 'monospace', // Use monospace for code
    },
    code_block: {
      fontSize: colors.typography.fontSize.sm,
      backgroundColor: colors.surface,
      color: colors.text,
      padding: 12,
      borderRadius: 8,
      marginVertical: 8,
      fontFamily: 'monospace', // Use monospace for code blocks
    },
    fence: {
      fontSize: colors.typography.fontSize.sm,
      backgroundColor: colors.surface,
      color: colors.text,
      padding: 12,
      borderRadius: 8,
      marginVertical: 8,
      fontFamily: 'monospace',
    },
    
    // Blockquotes
    blockquote: {
      backgroundColor: colors.surface,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
      paddingLeft: 16,
      paddingRight: 12,
      paddingVertical: 12,
      marginVertical: 8,
      borderRadius: 4,
    },
    
    // Tables (if needed)
    table: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      marginVertical: 8,
    },
    th: {
      backgroundColor: colors.surface,
      fontSize: colors.typography.fontSize.sm,
      fontWeight: '600' as const,
      color: colors.text,
      padding: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      fontFamily: colors.typography.fontFamily.korean,
    },
    td: {
      fontSize: colors.typography.fontSize.sm,
      color: colors.text,
      padding: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      fontFamily: colors.typography.fontFamily.korean,
    },
    
    // Horizontal rule
    hr: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 16,
    },
  };

  return (
    <Markdown 
      style={markdownStyles}
      mergeStyle={true}
    >
      {children}
    </Markdown>
  );
}