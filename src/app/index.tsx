import React from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import { Link } from 'expo-router';
import Logo from '../../assets/book_logo.png';

const Index: React.FunctionComponent = () => {
  return (
    <View style={styles.container}>
      <Image source={Logo} style={styles.img} />

      <Text style={styles.title}>Book Lab</Text>

      <Text style={styles.subtitle}>
        Welcome to our Bookstore App
      </Text>

      <Link href="/signin" style={styles.link}>
        Go to Login
      </Link>

      <Link href="/signup" style={styles.link}>
        Go to Signup
      </Link>
    </View>
  );
};

export default Index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },

  subtitle: {
    marginTop: 20,
    marginBottom: 20,
    fontSize: 20,
  },

  img: {
    marginVertical: 10,
    width: 150,
    height: 150,
    resizeMode: 'contain',
  },

  link: {
    fontSize: 18,
    color: 'white',
    padding: 10,
    backgroundColor: '#E88504',
    borderRadius: 8,
    marginTop: 15,

    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 2, height: 2 },
    shadowRadius: 4,
  },
});
