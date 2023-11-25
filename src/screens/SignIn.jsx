import React, {useState, useEffect} from 'react';
import {StyleSheet, View, Text, Image, TouchableOpacity, ActivityIndicator} from 'react-native';
import {useNavigation} from '@react-navigation/native';

import {GoogleSignin} from '@react-native-google-signin/google-signin';

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const SignIn = ({setUserInformation}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const navigation = useNavigation();

  useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        '209793389856-n1jcp2od4mu38lui1ou1t50400cq7f29.apps.googleusercontent.com',
    });
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true)

      await GoogleSignin.hasPlayServices();
      const {idToken} = await GoogleSignin.signIn();

      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      await auth().signInWithCredential(googleCredential);

      auth().onAuthStateChanged(async user => {
        if (user) {
          console.log('user details: ', user);
          const {uid, displayName, photoURL, email} = user;

          await firestore().collection('users').doc(uid).set({
            uid,
            displayName,
            photoURL,
            email,
          });

          setUserInformation(user);
          navigation.navigate('Chat');
          setIsLoading(false);
        }
      });
    } catch (error) {
      console.error(error);
      setError(error);
    }
  };

  return (
    <View style={styles.loginContainer}>
      <Image
        source={require('../assets/welcome-img.jpeg')}
        style={styles.welcomeImage}
      />

      <Text style={styles.welcomeText}>Welcome To Face Call</Text>

      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            handleGoogleSignIn();
          }}>
          <Image
            source={require('../assets/google-icon.png')}
            style={styles.icon}
          />
          <Text style={{color: 'black'}}>Continue with Google</Text>
        </TouchableOpacity>
      )}

      {error ? <Text style={{color: 'red'}}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },

  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },

  welcomeImage: {
    width: 280,
    height: 280,
    resizeMode: 'cover',
  },

  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 24,
    fontSize: 14,
    elevation: 5,
    color: '#333',
    cursor: 'pointer',
  },

  icon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
});

export default SignIn;
