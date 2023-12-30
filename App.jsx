import React, {useState, useEffect} from 'react';
import {
  ActivityIndicator,
  Image,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  PermissionsAndroid,
} from 'react-native';

import SignIn from './src/screens/SignIn';
import Chat from './src/screens/Chat';
import Calls from './src/screens/Calls';
import ShortVideos from './src/screens/ShotVideos';
import People from './src/screens/People';
import VipDialer from './src/screens/VipDialer';
import ChatZone from './src/screens/ChatZone';
import UserProfile from './src/screens/UserProfile';
import EditProfile from './src/screens/EditProfile';

import Header from './src/assets/Header';

import {NavigationContainer, useNavigation} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';

import {GoogleSignin} from '@react-native-google-signin/google-signin';
import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';
import database from '@react-native-firebase/database';

const App = () => {
  const [userInformation, setUserInformation] = useState();
  const [isLoading, setIsLoading] = useState(true);

  const Stack = createNativeStackNavigator();
  const Tab = createBottomTabNavigator();

  useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        '209793389856-n1jcp2od4mu38lui1ou1t50400cq7f29.apps.googleusercontent.com',
    });
  }, []);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const user = await GoogleSignin.getCurrentUser();

        const currentUserEmail = user?.user.email;

        if (currentUserEmail) {
          const userSnapshot = await firestore()
            .collection('users')
            .where('email', '==', currentUserEmail)
            .get();

          if (!userSnapshot.empty) {
            const userData = userSnapshot.docs[0].data();
            setUserInformation(userData);
          }
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking authentication:', error);
        setIsLoading(false);
      }
    };

    const getPermissions = async () => {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );

      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      );

      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      );

      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      );
    };

    getPermissions();
    checkAuthentication();
  }, []);

  useEffect(() => {
    const getCurrentUserPresence = () => {
      const userId = userInformation?.uid;

      if (userId) {
        const onlineRef = database().ref(`presence/online/${userId}`);
        const offlineRef = database().ref(`presence/offline/${userId}`);

        onlineRef.set(true).then(() => console.log('Online presence set'));

        onlineRef
          .onDisconnect()
          .update({
            lastSeenAt: database.ServerValue.TIMESTAMP,
          })
          .then(() => {
            onlineRef.onDisconnect().remove();
            offlineRef.set({lastSeenAt: database.ServerValue.TIMESTAMP});
            console.log('On disconnect function configured.');
          });
      } else {
        console.log('User information or UID is undefined');
      }
    };
    getCurrentUserPresence();

    return () => {
      const userId = userInformation?.uid;
      if (userId) {
        const onlineRef = database().ref(`presence/online/${userId}`);
        const offlineRef = database().ref(`presence/offline/${userId}`);

        onlineRef.remove().then(() => console.log('Offline presence set'));
        offlineRef.set({lastSeenAt: database.ServerValue.TIMESTAMP});
      }
    };
  }, [userInformation]);

  function Home() {
    const navigation = useNavigation();

    useEffect(() => {
      messaging().setBackgroundMessageHandler(async remoteMessage => {
        console.log('Message handled in the Background Mode!');
      });

      messaging().onNotificationOpenedApp(remoteMessage => {
        const {
          username,
          profilePicture,
          uid,
          coverPhoto,
          bio,
          youtube,
          twitter,
          facebook,
          instagram,
        } = remoteMessage.data;

        const sanitizedProfilePicture = profilePicture || '';
        const sanitizedCoverPhoto = coverPhoto || '';
        const sanitizedBio = bio || '';

        const sanitizedYoutube = parseSafely(youtube);
        const sanitizedTwitter = parseSafely(twitter);
        const sanitizedFacebook = parseSafely(facebook);
        const sanitizedInstagram = parseSafely(instagram);

        navigation.navigate('ChatZone', {
          username,
          profilePicture: sanitizedProfilePicture,
          uid,
          coverPhoto: sanitizedCoverPhoto,
          bio: sanitizedBio,
          youtube: sanitizedYoutube,
          twitter: sanitizedTwitter,
          facebook: sanitizedFacebook,
          instagram: sanitizedInstagram,
          currentUser: userInformation,
        });
      });

      const parseSafely = data => {
        try {
          return data ? JSON.parse(data) : '';
        } catch (error) {
          console.error('Error parsing JSON:', error);
          return '';
        }
      };
    }, []);

    return (
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#F5F5F5',
            paddingBottom: 5,
            borderTopWidth: 0,
            elevation: 0,
          },
          tabBarHideOnKeyboard: true,
        }}>
        <Tab.Screen
          name="Chat"
          options={{
            tabBarIcon: ({color, size}) => (
              <Icon name="chatbubble" color={color} size={size} />
            ),
          }}>
          {props => <Chat {...props} user={userInformation} />}
        </Tab.Screen>

        <Tab.Screen
          name="Calls"
          component={Calls}
          options={{
            headerShown: false,
            tabBarIcon: ({color, size}) => (
              <Icon name="videocam" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen
          name="Shorts"
          component={ShortVideos}
          options={{
            headerShown: false,
            tabBarItemStyle: {
              bottom: 20,
              backgroundColor: '#F5F5F5',
              borderRadius: 25,
            },
            tabBarIcon: ({color, size}) => (
              <Icon name="play" color={color} size={size + 5} />
            ),
          }}
        />
        <Tab.Screen
          name="People"
          options={{
            tabBarIcon: ({color, size}) => (
              <Icon name="people" color={color} size={size} />
            ),
          }}>
          {props => <People {...props} user={userInformation} />}
        </Tab.Screen>
        <Tab.Screen
          name="Vip Caller"
          component={VipDialer}
          options={{
            headerShown: false,
            tabBarIcon: ({color, size}) => (
              <MaterialIcon name="phone" color={color} size={size} />
            ),
          }}
        />
      </Tab.Navigator>
    );
  }

  const handleLogout = async () => {
    try {
      await GoogleSignin.signOut();
      setUserInformation(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <>
      <StatusBar backgroundColor="#008EFE" />
      <View style={{flex: 1, backgroundColor: '#ffffff'}}>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              animation: 'slide_from_right',
            }}>
            {isLoading ? (
              <Stack.Screen
                name="Loading"
                component={ActivityIndicator}
                options={{headerShown: false}}
              />
            ) : userInformation ? (
              <>
                <Stack.Screen
                  name="Home"
                  component={Home}
                  options={{
                    header: () => (
                      <Header title="Home" handleLogout={handleLogout} />
                    ),
                  }}
                />

                <Stack.Screen
                  name="ChatZone"
                  options={({route, navigation}) => ({
                    headerTitle: () => (
                      <TouchableOpacity
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          right: 20,
                        }}
                        onPress={() => {
                          navigation.navigate('UserProfile', {
                            coverPhoto: route.params?.coverPhoto,
                            profilePicture: route.params?.profilePicture,
                            username: route.params?.username,
                            userBio: route.params?.bio,
                            youtube: route.params?.youtube,
                            twitter: route.params?.twitter,
                            facebook: route.params?.facebook,
                            instagram: route.params?.instagram,
                            uid: route.params?.uid,
                            currentUser: route.params?.currentUser,
                          });
                        }}>
                        <Image
                          style={{
                            width: 45,
                            height: 45,
                            borderRadius: 25,
                            marginRight: 10,
                          }}
                          source={
                            route.params?.profilePicture
                              ? {
                                  uri: route.params?.profilePicture,
                                }
                              : require('./src/assets/defaultUser.jpg')
                          }
                        />
                        <View>
                          <Text
                            style={{
                              color: '#5f5f5f',
                              fontSize: 18,
                              fontWeight: 'bold',
                            }}>
                            {route.params?.username}
                          </Text>
                          <Text
                            style={{
                              fontSize: 12,
                              color: '#5f5f5f',
                            }}>
                            {route.params?.presenceData}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ),
                    headerRight: () => (
                      <View style={{flexDirection: 'row', marginRight: 10}}>
                        <TouchableOpacity
                          style={{
                            justifyContent: 'center',
                            padding: 5,
                          }}>
                          <MaterialIcon
                            name="phone"
                            color="#008efe"
                            size={30}
                          />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={{
                            justifyContent: 'center',
                            padding: 5,
                            marginLeft: 10,
                          }}>
                          <Icon name="videocam" color="#008efe" size={30} />
                        </TouchableOpacity>
                      </View>
                    ),
                    headerStyle: {
                      backgroundColor: '#D0D0D0',
                    },
                    headerTintColor: '#000',
                  })}>
                  {props => <ChatZone {...props} user={userInformation} />}
                </Stack.Screen>

                <Stack.Screen
                  name="UserProfile"
                  component={UserProfile}
                  options={({route}) => ({
                    headerTitle: route.params?.username,
                  })}
                />

                <Stack.Screen
                  name="EditProfile"
                  options={{headerTitle: 'Edit Profile'}}>
                  {props => (
                    <EditProfile {...props} userInformation={userInformation} />
                  )}
                </Stack.Screen>
              </>
            ) : (
              <Stack.Screen name="SignIn" options={{headerShown: false}}>
                {props => (
                  <SignIn {...props} setUserInformation={setUserInformation} />
                )}
              </Stack.Screen>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </View>
    </>
  );
};

export default App;
