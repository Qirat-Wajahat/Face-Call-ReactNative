import React, {useState, useEffect} from 'react';
import {
  ActivityIndicator,
  Image,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  PermissionsAndroid
} from 'react-native';

import SignIn from './src/screens/SignIn';
import Chat from './src/screens/Chat';
import Calls from './src/screens/Calls';
import People from './src/screens/People';
import Stories from './src/screens/Stories';
import ChatZone from './src/screens/ChatZone';
import UserProfile from './src/screens/UserProfile';
import EditProfile from './src/screens/EditProfile';

import Header from './src/assets/Header';

import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';

import {GoogleSignin} from '@react-native-google-signin/google-signin';
import firestore from '@react-native-firebase/firestore';

const App = () => {
  const [userInformation, setUserInformation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const Stack = createNativeStackNavigator();
  const Tab = createBottomTabNavigator();

  useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        '209793389856-n1jcp2od4mu38lui1ou1t50400cq7f29.apps.googleusercontent.com',
    });
    PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
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

    checkAuthentication();
  }, []);

  function Home() {
    return (
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
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
          name="People"
          options={{
            tabBarIcon: ({color, size}) => (
              <Icon name="people" color={color} size={size} />
            ),
          }}>
          {props => <People {...props} user={userInformation} />}
        </Tab.Screen>
        <Tab.Screen
          name="Stories"
          component={Stories}
          options={{
            headerShown: false,
            tabBarIcon: ({color, size}) => (
              <MaterialIcon name="web-stories" color={color} size={size} />
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
                          });
                        }}>
                        <Image
                          style={{
                            width: 45,
                            height: 45,
                            borderRadius: 25,
                            marginRight: 10,
                          }}
                          source={route.params?.profilePicture ? {
                            uri: route.params?.profilePicture,
                          } : require('./src/assets/defaultUser.jpg')}
                        />
                        <Text
                          style={{
                            color: '#5f5f5f',
                            fontSize: 18,
                            fontWeight: 'bold',
                          }}>
                          {route.params?.username}
                        </Text>
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
