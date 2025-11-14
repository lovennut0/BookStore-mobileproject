import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Pressable,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { supabase } from '../api/supabaseClient';
const BottomNav: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string): boolean => pathname === path;

  const handleLogout = async (): Promise<void> => {
    Alert.alert('Logging out', 'You will be logged out.', [{ text: 'NO' }, 
      { text: 'YES', onPress: async () => {
        const { error } = await supabase.auth.signOut();

        if (error) {
          Alert.alert('Error', 'Failed to log out');
        } else {
          router.replace('/signin');
        }
    } }]);
  };  

  return (
    <View style={styles.navContainer}>
      <Pressable onPress={() => router.push('/Home')} style={styles.navItem} >
        <Text style={[styles.icon, isActive('/Home') && styles.activeText]}> 🏠 </Text>
        <Text style={[styles.label, isActive('/Home') && styles.activeText]}> Home </Text>
      </Pressable>

      <TouchableOpacity onPress={() => router.push('/search')} style={styles.navItem} >
        <Text style={[styles.icon, isActive('/search') && styles.activeText]}> 🔍 </Text>
        <Text style={[styles.label, isActive('/search') && styles.activeText]}> Search </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/order')} style={styles.navItem} >
        <Text style={[styles.icon, isActive('/order') && styles.activeText]}> 📋 </Text>
        <Text style={[styles.label, isActive('/order') && styles.activeText]}> Orders </Text>
      </TouchableOpacity>
        
      <TouchableOpacity onPress={handleLogout} style={styles.navItem}>
        <Text style={styles.icon}>【⏻】</Text>
        <Text style={styles.label}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

export default BottomNav;

const styles = StyleSheet.create({
  navContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
    color: '#888',
  },
  label: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  activeText: {
    color: '#E88504',
    fontWeight: '600',
  },
});
