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

import {useIsFocused, useNavigation} from '@react-navigation/native';

import firestore from '@react-native-firebase/firestore';
import database from '@react-native-firebase/database';
import {GoogleSignin} from '@react-native-google-signin/google-signin';

const Chat = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState();
  const [users, setUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [offlineUsers, setOfflineUsers] = useState([]);
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
          return (
            user.friends &&
            user.friends.some(friend => friend.uid === currentUser.uid)
          );
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

  useEffect(() => {
    const onlineRef = database().ref(`/presence/online`);
    const offlineRef = database().ref(`/presence/offline`);

    const onlineListener = onlineRef.on('value', snapshot => {
      if (snapshot.exists()) {
        const data = [];
        data.push(snapshot.val());
        setOnlineUsers(data);
      } else {
        setOnlineUsers([]);
      }
    });

    const offlineListener = offlineRef.on('value', snapshot => {
      if (snapshot.exists()) {
        const data = [];
        data.push(snapshot.val());
        setOfflineUsers(data);
      } else {
        setOfflineUsers([]);
      }
    });

    return () => {
      onlineRef.off('value', onlineListener);
      offlineRef.off('value', offlineListener);
    };
  }, []);

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
            const formattedDate = date?.toLocaleDateString('en-US', {
              year: '2-digit',
              month: '2-digit',
              day: '2-digit',
            });

            const isUserOnline = onlineUsers.some(user =>
              Object.keys(user).includes(item.uid),
            );

            const lastSeenData = offlineUsers.find(user => user[item.uid]);
            const isUserOffline = lastSeenData && lastSeenData[item.uid];

            let lastSeenTime = '';
            let lastSeenMessage = '';

            if (isUserOffline) {
              const lastSeenAt = lastSeenData[item.uid].lastSeenAt;

              const lastSeenDate = new Date(lastSeenAt);
              lastSeenMessage = `Last seen at ${lastSeenDate.toLocaleString(
                [],
                {
                  hour: '2-digit',
                  minute: '2-digit',
                },
              )}`;

              const currentTimestamp = Date.now();
              const offlineDuration = currentTimestamp - lastSeenAt;

              const seconds = Math.floor(offlineDuration / 1000);
              const minutes = Math.floor(seconds / 60);
              const hours = Math.floor(minutes / 60);
              const days = Math.floor(hours / 24);
              const months = Math.floor(days / 30);
              const years = Math.floor(days / 365);

              if (years > 0) {
                lastSeenTime = `${years} Y`;
              } else if (months > 0) {
                lastSeenTime = `${months} M`;
              } else if (days > 0) {
                lastSeenTime = `${days} D`;
              } else if (hours > 0) {
                lastSeenTime = `${hours} H`;
              } else if (minutes > 0) {
                lastSeenTime = `${minutes} Min`;
              } else {
                lastSeenTime = `${seconds} S`;
              }
            }

            return (
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('ChatZone', {
                    username: item.displayName,
                    profilePicture: item.photoURL,
                    uid: item.uid,
                    coverPhoto: item.coverPhoto,
                    bio: item.bio,
                    youtube: item.youtube,
                    twitter: item.twitter,
                    facebook: item.facebook,
                    instagram: item.instagram,
                    presenceData: isUserOnline ? 'Online' : lastSeenMessage,
                    currentUser: currentUser,
                  });
                }}>
                <View style={styles.chatContainer}>
                  <View style={styles.profileContainer}>
                    {isUserOnline ? (
                      <View style={styles.onlineBorder}>
                        <Image
                          source={
                            item.photoURL
                              ? {uri: item.photoURL}
                              : require('../assets/defaultUser.jpg')
                          }
                          style={styles.image}
                        />
                      </View>
                    ) : (
                      <>
                        <View style={styles.lastSeenTime}>
                          <Text style={styles.lastSeenText}>
                            {lastSeenTime}
                          </Text>
                        </View>
                        <View style={styles.offlineBorder}>
                          <Image
                            source={
                              item.photoURL
                                ? {uri: item.photoURL}
                                : require('../assets/defaultUser.jpg')
                            }
                            style={styles.image}
                          />
                        </View>
                      </>
                    )}
                  </View>

                  <View style={styles.chatContent}>
                    <View style={styles.chatHeader}>
                      <View style={styles.chatInfo}>
                        <Text style={styles.chatName}>{item.displayName}</Text>
                        <Text
                          ellipsizeMode="tail"
                          numberOfLines={1}
                          style={styles.lastMessage}>
                          {latestMessage}
                        </Text>
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
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineBorder: {
    borderWidth: 2,
    borderRadius: 50,
    borderColor: '#00CC33',
    padding: 3,
  },
  offlineBorder: {
    borderWidth: 2,
    borderRadius: 50,
    borderColor: '#F0F0F0',
    padding: 3,
  },
  lastSeenTime: {
    width: 30,
    height: 20,
    right: 0,
    position: 'absolute',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  lastSeenText: {
    fontSize: 8,
    color: '#555',
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
