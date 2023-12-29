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
import React, {useEffect, useState} from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';

import {useNavigation} from '@react-navigation/native';

import firestore from '@react-native-firebase/firestore';
import {GoogleSignin} from '@react-native-google-signin/google-signin';

const People = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState();
  const [users, setUsers] = useState([]);
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);

  const navigation = useNavigation();

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
              const userData = {id: doc.id, ...doc.data()};
              setCurrentUser(userData);
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
        const filteredUsers = usersData.filter(
          user => user.email !== currentUser?.email,
        );

        const filterFriends = usersData.filter(user => {
          return (
            user.friends &&
            user.friends.some(friend => friend.uid === currentUser.uid)
          );
        });

        setUsers(filteredUsers);
        setFriends(filterFriends);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    if (currentUser) {
      fetchUsers();
    }
  }, [currentUser]);

  const handleSearch = query => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredUsers([]);
    } else {
      const filtered = users.filter(user => user.uid === query);
      setFilteredUsers(filtered);
    }
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
      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
          data={searchQuery ? filteredUsers : friends}
          keyExtractor={item => item.uid}
          renderItem={({item}) => (
            <TouchableOpacity
              onPress={() => {
                const isFriend = currentUser.friends.some(
                  friend => friend.uid === item.uid,
                );

                if (isFriend) {
                  navigation.navigate('ChatZone', {
                    coverPhoto: item.coverPhoto,
                    profilePicture: item.photoURL,
                    username: item.displayName,
                    bio: item.bio,
                    uid: item.uid,
                    youtube: item.youtube,
                    twitter: item.twitter,
                    facebook: item.facebook,
                    instagram: item.instagram,
                    currentUser: currentUser,
                  });
                } else {
                  navigation.navigate('UserProfile', {
                    coverPhoto: item.coverPhoto,
                    profilePicture: item.photoURL,
                    username: item.displayName,
                    bio: item.bio,
                    uid: item.uid,
                    youtube: item.youtube,
                    twitter: item.twitter,
                    facebook: item.facebook,
                    instagram: item.instagram,
                    currentUser: currentUser,
                  });
                }
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

export default People;

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
