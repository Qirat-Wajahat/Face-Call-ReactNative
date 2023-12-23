import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import React, {useEffect, useRef, useState} from 'react';

import Icon from 'react-native-vector-icons/MaterialIcons';

import {useNavigation} from '@react-navigation/native';

import firestore from '@react-native-firebase/firestore';
import {GoogleSignin} from '@react-native-google-signin/google-signin';

const Chat = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState();
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [recentChats, setRecentChats] = useState([]);

  const navigation = useNavigation();
  const listeners = useRef([]);

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const user = await GoogleSignin.getCurrentUser();
        const currentUserEmail = user?.user.email;

        if (currentUserEmail) {
          const userRef = firestore()
            .collection('users')
            .where('email', '==', currentUserEmail);
          const unsubscribe = userRef.onSnapshot(querySnapshot => {
            querySnapshot.forEach(doc => {
              const currenntUserData = {id: doc.id, ...doc.data()};

              setCurrentUser(currenntUserData);
            });
          });

          return () => unsubscribe();
        }
      } catch (error) {
        console.error('Error getting current user:', error);
      }
    };

    getCurrentUser();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const usersSnapshot = await firestore().collection('users').get();
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
  
        const filteredUsers = usersData.filter(user => {
          return user.friends && user.friends.some(friend => friend.uid === currentUser.uid);
        });
  
        setUsers(filteredUsers);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching users:', error);
        setIsLoading(false);
      }
    };
  
    if (currentUser) {
      fetchUsers();
    }
  }, [currentUser]);  

  useEffect(() => {
    const chatRoomListener = async () => {
      try {
        setIsLoading(true);

        if (currentUser) {
          const userFriends = currentUser.friends;

          const chatRoomPromises = userFriends.map(friend => {
            const chatRoomId = [currentUser.uid, friend.uid].sort().join('-');

            const unsubscribeSnapshot = firestore()
              .collection('chatrooms')
              .doc(chatRoomId)
              .collection('messages')
              .orderBy('createdAt', 'desc')
              .limit(1)
              .onSnapshot(snapshot => {
                if (!snapshot.empty) {
                  const latestMessageData = snapshot.docs[0].data();
                  const latestMessage = latestMessageData.text;
                  const sentAt = latestMessageData.createdAt;

                  setRecentChats(prevChats => {
                    const chatExists = prevChats.some(
                      chat => chat.userId === friend.uid,
                    );

                    if (chatExists) {
                      return prevChats.map(chat => {
                        if (chat.userId === friend.uid) {
                          return {
                            ...chat,
                            latestMessage,
                            sentAt,
                          };
                        }
                        return chat;
                      });
                    } else {
                      return [
                        ...prevChats,
                        {
                          userId: friend.uid,
                          username: friend.displayName,
                          latestMessage,
                          sentAt,
                        },
                      ];
                    }
                  });
                }
              });

            listeners.current.push(unsubscribeSnapshot);
            return unsubscribeSnapshot;
          });

          await Promise.all(chatRoomPromises);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching recent chats:', error);
        setIsLoading(false);
      }
    };

    chatRoomListener();

    return () => {
      listeners.current.forEach(unsubscribe => unsubscribe());
    };
  }, [currentUser]);

  const handleSearch = query => {
    setSearchQuery(query);
    const filtered = users.filter(user =>
      user.displayName.toLowerCase().includes(query.toLowerCase()),
    );
    setFilteredUsers(filtered);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor={'#858585'}
          onChangeText={handleSearch}
          value={searchQuery}
        />
      </View>
      <>
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('EditProfile');
          }}>
          <Image
            source={
              currentUser?.photoURL
                ? {uri: currentUser?.photoURL}
                : require('../assets/defaultUser.jpg')
            }
            style={styles.profileImage}
          />

          <Text style={styles.noteText}>
            {currentUser?.displayName ? currentUser?.displayName : 'Your note'}
          </Text>
        </TouchableOpacity>
      </>
      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
          data={searchQuery ? filteredUsers : users}
          keyExtractor={item => item.uid}
          renderItem={({item}) => {
            const chat = recentChats.find(chat => chat.userId === item.uid);

            const latestMessage = chat?.latestMessage;

            const sentAt = chat?.sentAt;
            const date = sentAt?.toDate();
            const formattedDate = date?.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('ChatZone', {
                    username: item.displayName,
                    profilePicture: item.photoURL,
                    uid: item.uid,
                    coverPhoto: item.coverPhoto,
                    bio: item.bio,
                    currentUser: currentUser,
                  });
                }}>
                <View style={styles.chatContainer}>
                  <Image
                    source={
                      item.photoURL
                        ? {uri: item.photoURL}
                        : require('../assets/defaultUser.jpg')
                    }
                    style={styles.image}
                  />
                  <View style={styles.chatContent}>
                    <View style={styles.chatHeader}>
                      <View style={styles.chatInfo}>
                        <Text style={styles.chatName}>{item.displayName}</Text>
                        <Text style={styles.lastMessage}>{latestMessage}</Text>
                      </View>
                      <Text style={styles.chatTime}>{formattedDate}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
};

export default Chat;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 15,
  },
  chatContainer: {
    padding: 5,
    flexDirection: 'row',
    marginTop: 10,
    marginLeft: 5,
    marginRight: 5,
    borderRadius: 20,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderWidth: 0,
    borderRadius: 30,
    backgroundColor: '#f5f5f5',
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#858585',
  },
  searchIcon: {
    marginRight: 5,
    color: '#696969',
  },
  profileImage: {
    width: 70,
    height: 70,
    borderWidth: 1,
    borderColor: '#008efe',
    borderRadius: 50,
    marginTop: 20,
  },
  noteText: {
    color: '#989898',
    fontSize: 15,
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
    color: '#989898',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 5,
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
    textAlign: 'right',
    alignSelf: 'center',
    color: 'gray',
  },
});
