import React, { useState } from 'react'
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable, 
  TouchableWithoutFeedback,
  Keyboard,
  Alert
} from 'react-native'
import { Link, useRouter} from 'expo-router'
import { supabase } from '../api/supabaseClient';

const Forgetpass = () => {
    const [email, setEmail] = React.useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
         if (!email) {
            Alert.alert('Missing info', 'Please enter your registered email.');
                return;
            }
            setLoading(true);
            const { error } = await supabase.auth.resetPasswordForEmail(email, {});
            setLoading(false);

            if (error) {
            Alert.alert('Error', error.message);
            console.log('Reset error:', error.message);
            } 
            else { Alert.alert( 'Check your email', 'We sent you a password reset link.' );
    }
    }
    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        
        <View style={styles.container}>
            <View style={styles.box}>
            <Text style={styles.title}> Enter your registered email ! </Text>

            <TextInput style={styles.txtinput} 
            placeholder="Registered Email" keyboardType = "email-address" onChangeText={setEmail} value = {email} />

            <Pressable onPress={handleSubmit}
            style={({pressed}) => [styles.btn, pressed && styles.pressed]}>
                <Text style={{color:'white', fontSize:16}}> {loading ? 'Sending...' : 'Send reset link'} </Text>
            </Pressable>

            <Link href="/login" style = {styles.link} > Back to Login </Link>
            </View>
        </View>
        </TouchableWithoutFeedback>
    );
};
export default Forgetpass;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: "#E88504"
    },
    box:{
        width:'80%',
        height: 40,
        flex: 0.5,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor:'white',
        borderRadius:20,
    },
    title: {
        fontSize: 20,
        marginBottom: 10,
        fontWeight: 'bold'
    },
    txtinput: {
        backgroundColor:'lightgrey',
        padding:10,
        color:'black',
        width: '80%',
        marginBottom: 20
    },

    link:{
        fontSize:15, 
        color:'black',
        opacity:0.7,
        marginTop:15
    },
    btn:{
        paddingVertical:12,
        paddingHorizontal:32,
        borderRadius:4,
        backgroundColor:'#4e9bde'
        },
    pressed:{
        opacity:0.75
    }
});
