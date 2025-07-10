import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface AppSettingsScreenProps {
  onBack: () => void;
}

export default function AppSettingsScreen({ onBack }: AppSettingsScreenProps) {
  const settingsOptions = [
    { id: 'profile', title: '프로필 설정', subtitle: '개인 정보 및 목표 관리' },
    { id: 'notifications', title: '알림 설정', subtitle: '루틴 알림 및 경고 메시지' },
    { id: 'coach', title: '코치 설정', subtitle: 'AI 코치 성격 및 강도 조절' },
    { id: 'apps', title: '제한 앱 관리', subtitle: '차단할 앱 목록 설정' },
    { id: 'data', title: '데이터 관리', subtitle: '백업 및 동기화 설정' },
    { id: 'about', title: '앱 정보', subtitle: '버전 정보 및 지원' },
  ];

  const handleSettingPress = (settingId: string) => {
    console.log(`Setting pressed: ${settingId}`);
    // TODO: Navigate to specific setting screens
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>설정</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* User Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.profileIcon}>
              <Text style={styles.profileIconText}>👤</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>사용자</Text>
              <Text style={styles.profileEmail}>example@email.com</Text>
            </View>
          </View>

          {/* Settings Options */}
          <View style={styles.settingsSection}>
            {settingsOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.settingItem}
                onPress={() => handleSettingPress(option.id)}
              >
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>{option.title}</Text>
                  <Text style={styles.settingSubtitle}>{option.subtitle}</Text>
                </View>
                <Text style={styles.settingArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Routy v1.0.0</Text>
            <Text style={styles.footerSubtext}>습관 형성의 새로운 시작</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c2e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a50',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6c63ff',
    fontFamily: 'Inter',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'Inter',
  },
  headerSpacer: {
    width: 60,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3a3a50',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
  },
  profileIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6c63ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileIconText: {
    fontSize: 24,
    color: '#ffffff',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  profileEmail: {
    fontSize: 14,
    color: '#a9a9c2',
    fontFamily: 'Inter',
  },
  settingsSection: {
    backgroundColor: '#3a3a50',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 30,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#4a4a60',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#a9a9c2',
    fontFamily: 'Inter',
  },
  settingArrow: {
    fontSize: 20,
    color: '#a9a9c2',
    marginLeft: 16,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  footerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6c63ff',
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  footerSubtext: {
    fontSize: 14,
    color: '#a9a9c2',
    fontFamily: 'Inter',
  },
}); 