export interface ScheduleEvent {
  id: string;
  time: string;
  endTime?: string;
  title: string;
  subtitle?: string;
  description?: string;
  iconType: 'clock' | 'list' | 'document' | 'plus' | 'settings' | 'heart' | 'filter';
  iconColor: 'red' | 'green' | 'blue' | 'gray' | 'coral';
  progress?: {
    current: number;
    total: number;
  };
  status: 'completed' | 'in-progress' | 'pending' | 'break';
  isHighlight?: boolean;
}

export interface DayData {
  date: number;
  dayOfWeek: string;
  hasEvents: boolean;
  isToday: boolean;
  eventIndicators: Array<'red' | 'blue' | 'green'>;
}

// Sample data matching the reference image
export const sampleScheduleEvents: ScheduleEvent[] = [
  {
    id: '1',
    time: '7:00',
    title: '산뜻한 시작',
    subtitle: '오전 7:00',
    description: '휴식을 마쳤어요. 다시 알으로!',
    iconType: 'clock',
    iconColor: 'red',
    status: 'completed'
  },
  {
    id: '2',
    time: '12:00',
    endTime: '1:00',
    title: '웹개발 끝내기',
    subtitle: '오후 12:00-1:00 (1시간)',
    description: '준비하세요, 다음 일정까지 5분 남았어요.',
    iconType: 'list',
    iconColor: 'green',
    status: 'in-progress',
    isHighlight: true
  },
  {
    id: '3',
    time: '5:10',
    title: 'Structured와 함께 시작!',
    subtitle: '팀에서 기본 사항 알아보기',
    iconType: 'document',
    iconColor: 'gray',
    status: 'pending'
  },
  {
    id: '4',
    time: '5:20',
    title: '첫 일정 추가하기',
    subtitle: '하루를 체계적으로 만들기',
    iconType: 'plus',
    iconColor: 'coral',
    progress: {
      current: 0,
      total: 5
    },
    status: 'pending'
  },
  {
    id: '5',
    time: '5:25',
    title: '보관함 채우기',
    subtitle: '워드지 깜빡하지 않도록',
    iconType: 'filter',
    iconColor: 'coral',
    status: 'pending'
  },
  {
    id: '6',
    time: '5:30',
    title: '나만의 스타일로 만들기',
    subtitle: '갤러더 등등과 연결하기',
    iconType: 'settings',
    iconColor: 'coral',
    progress: {
      current: 0,
      total: 5
    },
    status: 'pending'
  }
];

export const sampleWeekData: DayData[] = [
  {
    date: 27,
    dayOfWeek: '일',
    hasEvents: true,
    isToday: false,
    eventIndicators: ['red', 'blue']
  },
  {
    date: 28,
    dayOfWeek: '월',
    hasEvents: true,
    isToday: false,
    eventIndicators: ['red', 'blue']
  },
  {
    date: 29,
    dayOfWeek: '화',
    hasEvents: true,
    isToday: false,
    eventIndicators: ['red', 'blue']
  },
  {
    date: 30,
    dayOfWeek: '수',
    hasEvents: true,
    isToday: false,
    eventIndicators: ['red', 'blue']
  },
  {
    date: 31,
    dayOfWeek: '목',
    hasEvents: true,
    isToday: false,
    eventIndicators: ['red', 'blue']
  },
  {
    date: 1,
    dayOfWeek: '금',
    hasEvents: true,
    isToday: false,
    eventIndicators: ['red', 'blue']
  },
  {
    date: 2,
    dayOfWeek: '토',
    hasEvents: true,
    isToday: true,
    eventIndicators: ['red', 'green', 'blue']
  }
];