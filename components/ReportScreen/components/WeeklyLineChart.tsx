import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Svg, Path, Circle, Line, Defs, LinearGradient, Stop, Rect, Text as SvgText } from 'react-native-svg';
import { Colors } from '../../../constants/Colors';
import { useColorScheme } from '../../../hooks/useColorScheme';

interface WeeklyLineChartProps {
  data: {
    dates: string[];
    scores: number[];
    averageScore: number;
  };
  width?: number;
  height?: number;
}

export const WeeklyLineChart: React.FC<WeeklyLineChartProps> = ({
  data,
  width = 300,
  height = 200,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const { dates, scores, averageScore } = data;
  
  // Chart dimensions and padding
  const padding = { top: 20, right: 30, bottom: 40, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  // Score range setup (matching Figma: 7.5 to 9)
  const minScore = 7.5;
  const maxScore = 9.0;
  const scoreRange = maxScore - minScore;
  
  // Helper functions
  const getYPosition = (score: number) => {
    const normalized = (score - minScore) / scoreRange;
    return padding.top + (1 - normalized) * chartHeight;
  };
  
  const getXPosition = (index: number) => {
    return padding.left + (index / (scores.length - 1)) * chartWidth;
  };
  
  // Generate path for line chart
  const generatePath = () => {
    if (scores.length === 0) return '';
    
    let path = `M ${getXPosition(0)} ${getYPosition(scores[0])}`;
    
    for (let i = 1; i < scores.length; i++) {
      path += ` L ${getXPosition(i)} ${getYPosition(scores[i])}`;
    }
    
    return path;
  };
  
  // Generate Y-axis labels
  const yAxisLabels = [7.5, 7.75, 8, 8.25, 8.5, 8.75, 9];
  
  // Generate background zones (success zone: top, warning zone: bottom)
  const successZoneHeight = ((8.5 - minScore) / scoreRange) * chartHeight;
  const warningZoneHeight = chartHeight - successZoneHeight;
  
  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        <Defs>
          {/* Success zone gradient (top - green area) */}
          <LinearGradient id="successZone" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#CDECDD" stopOpacity="1" />
            <Stop offset="100%" stopColor="#CDECDD" stopOpacity="1" />
          </LinearGradient>
          
          {/* Warning zone gradient (bottom - pink area) */}
          <LinearGradient id="warningZone" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#F8CDD8" stopOpacity="1" />
            <Stop offset="100%" stopColor="#F8CDD8" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        
        {/* Background zones */}
        {/* Success zone (top) */}
        <Rect
          x={padding.left}
          y={padding.top}
          width={chartWidth}
          height={chartHeight - warningZoneHeight}
          fill="url(#successZone)"
        />
        
        {/* Warning zone (bottom) */}
        <Rect
          x={padding.left}
          y={padding.top + (chartHeight - warningZoneHeight)}
          width={chartWidth}
          height={warningZoneHeight}
          fill="url(#warningZone)"
        />
        
        {/* Grid lines for Y-axis - removed for cleaner Figma look */}
        
        {/* Y-axis */}
        <Line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={padding.top + chartHeight}
          stroke={colors.figma.darkGray}
          strokeWidth={1}
        />
        
        {/* X-axis */}
        <Line
          x1={padding.left}
          y1={padding.top + chartHeight}
          x2={padding.left + chartWidth}
          y2={padding.top + chartHeight}
          stroke={colors.figma.darkGray}
          strokeWidth={1}
        />
        
        {/* Data line */}
        {scores.length > 1 && (
          <Path
            d={generatePath()}
            stroke={colors.figma.normal}
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        
        {/* Data points */}
        {scores.map((score, index) => (
          <Circle
            key={index}
            cx={getXPosition(index)}
            cy={getYPosition(score)}
            r={4}
            fill={score >= 8.25 ? colors.figma.normal : colors.figma.critical}
            stroke={colors.figma.white}
            strokeWidth={2}
          />
        ))}
        
        {/* Y-axis labels */}
        {yAxisLabels.map((score, index) => (
          <SvgText
            key={index}
            x={padding.left - 10}
            y={getYPosition(score) + 4}
            fontSize="10"
            fill={colors.figma.darkGray}
            textAnchor="end"
          >
            {score}
          </SvgText>
        ))}
      </Svg>
      
      {/* X-axis labels (rendered outside SVG for better text handling) */}
      <View style={[styles.xAxisLabels, { width: chartWidth, marginLeft: padding.left }]}>
        {dates.map((date, index) => (
          <Text
            key={index}
            style={[
              styles.xAxisLabel,
              { color: colors.figma.darkGray }
            ]}
          >
            {date}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  xAxisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  xAxisLabel: {
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '500',
  },
});