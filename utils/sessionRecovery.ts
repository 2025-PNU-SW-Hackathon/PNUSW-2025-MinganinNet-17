import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../backend/supabase/client';

/**
 * Clears all authentication-related data and forces a fresh login
 * This helps resolve corrupted session issues
 */
export async function clearAuthenticationData(): Promise<void> {
  try {
    console.log('🔧 RECOVERY: Clearing all authentication data...');
    
    // Clear Supabase session
    await supabase.auth.signOut();
    console.log('✅ RECOVERY: Supabase session cleared');
    
    // Clear AsyncStorage Supabase keys
    const allKeys = await AsyncStorage.getAllKeys();
    const supabaseKeys = allKeys.filter(key => 
      key.includes('supabase') || 
      key.includes('@supabase') ||
      key.includes('auth')
    );
    
    if (supabaseKeys.length > 0) {
      await AsyncStorage.multiRemove(supabaseKeys);
      console.log('✅ RECOVERY: Cleared AsyncStorage keys:', supabaseKeys);
    }
    
    // Clear any other auth-related keys
    const authKeys = [
      'user_session',
      'auth_token',
      'refresh_token',
      'pending_notification'
    ];
    
    for (const key of authKeys) {
      try {
        await AsyncStorage.removeItem(key);
      } catch (error) {
        // Ignore errors for non-existent keys
      }
    }
    
    console.log('✅ RECOVERY: All authentication data cleared');
    console.log('📋 RECOVERY: Please log in again to establish a fresh session');
    
  } catch (error) {
    console.error('❌ RECOVERY: Error clearing auth data:', error);
    throw error;
  }
}

/**
 * Validates current session and attempts recovery if corrupted
 */
export async function validateAndRecoverSession(): Promise<boolean> {
  try {
    console.log('🔍 RECOVERY: Validating current session...');
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.log('🚨 RECOVERY: Session error detected:', error.message);
      await clearAuthenticationData();
      return false;
    }
    
    if (!user) {
      console.log('🚨 RECOVERY: No user found, session may be corrupted');
      await clearAuthenticationData();
      return false;
    }
    
    console.log('✅ RECOVERY: Session is valid for user:', user.id);
    return true;
    
  } catch (error) {
    console.error('❌ RECOVERY: Error validating session:', error);
    await clearAuthenticationData();
    return false;
  }
}