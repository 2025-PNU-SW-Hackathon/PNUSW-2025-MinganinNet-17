/**
 * Korean text utilities for font handling
 */

/**
 * Check if text contains Korean characters (Hangul)
 */
export const containsKorean = (text: string): boolean => {
  const koreanRegex = /[가-힣]/;
  return koreanRegex.test(text);
};

/**
 * Get appropriate font family based on text content
 */
export const getKoreanFontFamily = (text?: string): string => {
  if (!text) return 'sans-serif';
  return containsKorean(text) ? 'NanumHandwriting' : 'sans-serif';
};

/**
 * Style object for Korean text with handwriting font
 */
export const koreanTextStyle = (text?: string) => ({
  fontFamily: getKoreanFontFamily(text),
});