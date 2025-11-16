// app/signup.tsx
import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, TouchableWithoutFeedback, Keyboard, Alert, } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { supabase } from '../api/supabaseClient';

const SignUp: React.FunctionComponent = () => {
  const [email, setEmail] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const handleSubmit = async (): Promise<void> => {
    if (!email || !username || !password) {
      Alert.alert('Missing info', 'Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });

    setLoading(false);

    if (error) {
      Alert.alert('Sign up Error', error.message);
      console.log('Signup error:', error.message);
    } else {
      Alert.alert('Success', 'Account created successfully!');
      console.log('Signup success:', data);
      router.push('/Home');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
            <View style={styles.box}>
            <Text style={styles.title}> Create Your Account </Text>

            <TextInput style={styles.txtinput}
                placeholder="Email" keyboardType="email-address" autoCapitalize="none" onChangeText={setEmail} value={email}/>

            <TextInput style={styles.txtinput} 
                placeholder="Username" onChangeText={setUsername} value={username} />

            <TextInput style={styles.txtinput} 
                placeholder="Password at least 6 characters" secureTextEntry onChangeText={setPassword} value={password} />

            <Pressable onPress={handleSubmit} style={({ pressed }) => [styles.btn, pressed && styles.pressed]} >
                <Text style={styles.btnText}> {loading ? 'Creating...' : 'Sign Up'} </Text>
            </Pressable>

            <Link href="/" style={styles.link}> Back to previous page </Link>
            </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default SignUp;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E88504',
  },
  box: {
    width: '80%',
    flex: 0.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  title: {
    fontSize: 20,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  txtinput: {
    backgroundColor: 'lightgrey',
    color: 'black',
    padding: 10,
    width: '100%',
    marginBottom: 20,
    borderRadius: 8,
  },
  link: {
    fontSize: 15,
    color: 'black',
    opacity: 0.7,
    marginTop: 15,
  },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 4,
    backgroundColor: '#4e9bde',
  },
  btnText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
});