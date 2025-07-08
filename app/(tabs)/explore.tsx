import GrassCalendar from '@/components/GrassCalendar';
import React, { useMemo, useState } from 'react';
import { Button, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface RoutineItem {
  description: string;
  time: string;
}

function generateRandomGrassData(year: number, month: number) {
  const data: Record<string, RoutineItem[]> = {};
  const lastDay = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= lastDay; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    // 0~3개의 루틴 랜덤 생성
    const count = Math.floor(Math.random() * 4);
    data[dateStr] = Array.from({ length: count }, (_, i) => ({
      description: `루틴 ${i + 1}`,
      time: `${String(8 + i)}:00-${String(8 + i + 1)}:00`,
    }));
  }
  return data;
}

export default function TabTwoScreen() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // 날짜별 루틴 데이터
  const routineData = useMemo(() => generateRandomGrassData(year, month), [year, month]);
  // 날짜별 개수만 추출 (잔디밭 색상용)
  const grassData = useMemo(() => {
    const obj: Record<string, number> = {};
    Object.entries(routineData).forEach(([date, arr]) => {
      obj[date] = arr.length;
    });
    return obj;
  }, [routineData]);

  const goToPrevMonth = () => {
    if (month === 0) {
      setYear(y => y - 1);
      setMonth(11);
    } else {
      setMonth(m => m - 1);
    }
  };
  const goToNextMonth = () => {
    if (month === 11) {
      setYear(y => y + 1);
      setMonth(0);
    } else {
      setMonth(m => m + 1);
    }
  };

  // 날짜 셀 클릭 시
  const handleDayPress = (date: string) => {
    setSelectedDate(date);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedDate(null);
  };

  const routines = selectedDate ? routineData[selectedDate] || [] : [];

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 8, marginTop: 16 }}>
        <Button title="이전 달" onPress={goToPrevMonth} />
        <View style={{ width: 16 }} />
        <Button title="다음 달" onPress={goToNextMonth} />
      </View>
      <GrassCalendar data={grassData} year={year} month={month} onDayPress={handleDayPress} />
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedDate} 루틴 목록</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {routines.length === 0 ? (
                <Text style={{ textAlign: 'center', color: '#888', marginTop: 16 }}>루틴 없음</Text>
              ) : (
                routines.map((item, idx) => (
                  <View key={idx} style={styles.routineRow}>
                    <TouchableOpacity style={styles.checkbox}>
                      {/* 실제 체크박스 구현은 상태 추가 필요, 여기선 UI만 */}
                      <View style={styles.checkboxBox} />
                    </TouchableOpacity>
                    <Text style={styles.routineDesc}>{item.description}</Text>
                    <Text style={styles.routineTime}>{item.time}</Text>
                  </View>
                ))
              )}
            </ScrollView>
            <Button title="닫기" onPress={closeModal} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: 320,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  routineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    marginRight: 8,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: '#888',
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  routineDesc: {
    flex: 1,
    fontSize: 15,
    color: '#222',
  },
  routineTime: {
    marginLeft: 8,
    color: '#1976d2',
    fontWeight: 'bold',
  },
});
