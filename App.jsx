import React, {useState, useEffect} from 'react';
import {StatusBar, Button} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import SignIn from './src/screens/SignIn';
import Chat from './src/screens/Chat';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import ChatZone from './src/screens/ChatZone';

const App = () => {
  const [userInformation, setUserInformation] = useState(null);

  const Stack = createNativeStackNavigator();

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const user = await GoogleSignin.getCurrentUser();
        if (user) {
          setUserInformation(user);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
      }
    };

    checkAuthentication();
  }, []);

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
      <StatusBar backgroundColor="#008efe" />
      <NavigationContainer>
        <Stack.Navigator>
          {userInformation ? (
            <>
              <Stack.Screen
                name="Chat"
                options={() => ({
                  headerShown: true,
                  headerTitle: 'Face Call',
                  headerStyle: {
                    backgroundColor: '#D0D0D0',
                  },
                  headerRight: () => (
                    <Button
                      title="Logout"
                      onPress={() => {
                        handleLogout();
                      }}
                    />
                  ),
                  headerBackVisible: false,
                })}>
                {props => <Chat {...props} user={userInformation} />}
              </Stack.Screen>

              <Stack.Screen
                name="ChatZone"
                options={({route}) => ({
                  headerTitle: route.params.username,
                  headerStyle: {
                    backgroundColor: '#D0D0D0',
                  },
                  headerTintColor: '#000',
                })}>
                {props => <ChatZone {...props} user={userInformation} />}
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
    </>
  );
};

export default App;
