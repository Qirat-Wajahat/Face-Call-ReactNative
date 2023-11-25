import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import React, {useEffect, useState} from 'react';

import {useNavigation} from '@react-navigation/native';

import firestore from '@react-native-firebase/firestore';
import {GoogleSignin} from '@react-native-google-signin/google-signin';

const Chat = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState();
  const [users, setUsers] = useState([]);

  const navigation = useNavigation();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const usersSnapshot = await firestore().collection('users').get();
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(usersData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    const getCurrentUser = async () => {
      try {
        const currentUser = await GoogleSignin.getCurrentUser();
        setCurrentUser(currentUser);
      } catch (error) {
        console.error('Error getting current user:', error);
      }
    };

    fetchUsers();
    getCurrentUser();
  }, []);

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <TouchableOpacity onPress={() => {navigation.navigate('ChatZone', {username: item.displayName})}}>
              <View style={styles.chatContainer}>
                <Image source={{uri: item.photoURL}} style={styles.image} />
                <View style={styles.chatContent}>
                  <View style={styles.chatHeader}>
                    <View style={styles.chatInfo}>
                      <Text style={styles.chatName}>
                        {item.displayName +
                          (item.email === currentUser?.user.email
                            ? ' (You)'
                            : '')}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

export default Chat;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 5,
    backgroundColor: '#D8D8D8',
  },

  chatContainer: {
    padding: 5,
    flexDirection: 'row',
    marginTop: 10,
    marginLeft: 5,
    marginR: 5,
    borderRadius: 20,
    backgroundColor: '#C8C8C8',
  },

  image: {
    width: 50,
    height: 50,
    backgroundColor: '#128C7E',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },

  chatContent: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },

  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },

  chatName: {
    color: '#303030',
    fontSize: 16,
    marginRight: 8,
  },

  lastMessage: {
    fontSize: 12,
    marginTop: 10,
    color: '#555555',
  },

  unreadContainer: {
    height: 20,
    width: 20,
    borderRadius: 20,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
    marginStart: 30,
    marginTop: 12,
  },

  totalUnread: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },

  chatTime: {
    fontSize: 12,
    marginTop: 3,
    color: 'gray',
  },
});
