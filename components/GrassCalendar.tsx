import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

// 색상 단계 (활동량에 따라 색상 변경)
const grassColors = [
  '#ebedf0', // 0
  '#c6e48b', // 1
  '#7bc96f', // 2
  '#239a3b', // 3
  '#196127', // 4 이상
];

function getGrassColor(count: number) {
  if (count === 0) return grassColors[0];
  if (count === 1) return grassColors[1];
  if (count === 2) return grassColors[2];
  if (count === 3) return grassColors[3];
  return grassColors[4];
}

function getMonthMatrix(year: number, month: number) {
  // month: 0-based (6월이면 5)
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const matrix: (string | null)[][] = [];
  let week: (string | null)[] = [];

  // 첫 주 빈칸 채우기
  for (let i = 0; i < firstDay.getDay(); i++) week.push(null);

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    week.push(dateStr);
    if (week.length === 7) {
      matrix.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    matrix.push(week);
  }
  return matrix;
}

function isToday(dateStr: string | null) {
  if (!dateStr) return false;
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;
  return dateStr === todayStr;
}

interface GrassCalendarProps {
  data: Record<string, number>;
  year: number;
  month: number;
  onDayPress?: (date: string) => void;
}

const GrassCalendar: React.FC<GrassCalendarProps> = ({ data, year, month, onDayPress }) => {
  // month: 0-based (6월이면 5)
  const matrix = getMonthMatrix(year, month);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{year}년 {month + 1}월 잔디밭</Text>
      <View style={styles.weekRow}>
        {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
          <Text key={d} style={styles.weekDay}>{d}</Text>
        ))}
      </View>
      {matrix.map((week, i) => (
        <View key={i} style={styles.weekRow}>
          {week.map((date, j) => {
            let dayNum = null;
            if (date) {
              const parts = date.split('-');
              dayNum = parseInt(parts[2], 10);
            }
            return (
              <Pressable
                key={j}
                style={[
                  styles.grassCell,
                  { backgroundColor: date ? getGrassColor(data[date] || 0) : 'transparent' },
                  isToday(date) && styles.todayCell,
                ]}
                onPress={() => date && onDayPress && onDayPress(date)}
                disabled={!date}
              >
                {date && dayNum ? (
                  <Text style={styles.countText}>{dayNum}</Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekDay: {
    width: 28,
    textAlign: 'center',
    color: '#888',
    marginBottom: 2,
  },
  grassCell: {
    width: 28,
    height: 28,
    margin: 1,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayCell: {
    borderWidth: 2,
    borderColor: '#1976d2',
    backgroundColor: '#fffbe6',
  },
  countText: {
    color: '#222',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default GrassCalendar; 