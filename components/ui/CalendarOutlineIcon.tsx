import Svg, { Line, Rect } from 'react-native-svg';

export default function CalendarOutlineIcon({ size = 20, color = '#fff' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* 바깥 사각형 */}
      <Rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="3"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
      {/* 위쪽 가로선 */}
      <Line
        x1="3"
        y1="9"
        x2="21"
        y2="9"
        stroke={color}
        strokeWidth="2"
      />
      {/* 왼쪽 달력 고리 */}
      <Line
        x1="7"
        y1="2"
        x2="7"
        y2="6"
        stroke={color}
        strokeWidth="2"
      />
      {/* 오른쪽 달력 고리 */}
      <Line
        x1="17"
        y1="2"
        x2="17"
        y2="6"
        stroke={color}
        strokeWidth="2"
      />
    </Svg>
  );
} 