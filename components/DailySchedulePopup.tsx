import { Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  type: 'normal' | 'special';
}

interface DailySchedulePopupProps {
  visible: boolean;
  date: string;
  onClose: () => void;
  tasks: Task[];
  onTaskToggle: (taskId: string) => void;
}

export default function DailySchedulePopup({ 
  visible, 
  date, 
  onClose, 
  tasks, 
  onTaskToggle 
}: DailySchedulePopupProps) {
  const hasData = tasks.length > 0;

  const renderTask = (task: Task) => {
    return (
      <TouchableOpacity
        key={task.id}
        style={styles.taskRow}
        onPress={() => onTaskToggle(task.id)}
      >
        <View style={[
          styles.taskCheckbox,
          task.completed && styles.completedCheckbox,
          task.type === 'special' && !task.completed && styles.specialCheckbox
        ]}>
          {task.completed && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={[
          styles.taskTitle,
          task.completed && styles.completedTaskTitle
        ]}>
          {task.title}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.popup}>
          <Text style={styles.popupTitle}>{date || '7월 8일 (화)'} 할 일</Text>
          
          <View style={styles.taskList}>
            {hasData ? (
              tasks.map(renderTask)
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>이 날짜에는 리포트가 없습니다</Text>
                <Text style={styles.noDataSubText}>
                  해당 날짜에 작성된 일일 리포트가 없어서{'\n'}
                  할 일 목록을 표시할 수 없습니다.
                </Text>
              </View>
            )}
          </View>
          
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>닫기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popup: {
    backgroundColor: '#3a3a50',
    borderRadius: 24,
    width: width - 70,
    height: 320,
    paddingHorizontal: 24,
    paddingVertical: 24,
    justifyContent: 'space-between',
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 32,
    fontFamily: 'Inter',
  },
  taskList: {
    flex: 1,
    gap: 20,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  taskCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#a9a9c2',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedCheckbox: {
    backgroundColor: '#6c63ff',
    borderColor: '#6c63ff',
  },
  specialCheckbox: {
    borderColor: '#5efcd4',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  taskTitle: {
    fontSize: 16,
    color: '#ffffff',
    flex: 1,
    fontFamily: 'Inter',
  },
  completedTaskTitle: {
    color: '#a9a9c2',
    textDecorationLine: 'line-through',
  },
  closeButton: {
    backgroundColor: '#6c63ff',
    borderRadius: 10,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'Inter',
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  noDataText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  noDataSubText: {
    fontSize: 14,
    color: '#a9a9c2',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'Inter',
  },
}); 