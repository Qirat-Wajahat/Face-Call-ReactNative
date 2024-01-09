import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {useNavigation} from '@react-navigation/native';

import firestore from '@react-native-firebase/firestore';

import ImagePicker from 'react-native-image-crop-picker';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const Status = ({user}) => {
  const [statusContent, setStatusContent] = useState([]);
  const [filteredStatuses, setFilteredStatuses] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);

  const {width, height} = Dimensions.get('window');

  const navigation = useNavigation();

  const friends = user.friends;

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const statusSnapshot = await firestore().collection('statuses').get();
        const statusData = statusSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        const filteredFriends = friends.find(friend => {
          const filteredData = statusData.map(item => item.id);

          return filteredData.includes(friend.uid);
        });

        setFilteredStatuses([filteredFriends]);
        setStatusContent(statusData);
      } catch (error) {
        console.log(error);
      }
    };

    fetchStatus();
  }, [statusContent]);

  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const usersSnapshot = await firestore().collection('users').get();
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        const removeCurrentUser = usersData.filter(
          item => item.uid !== user.uid,
        );

        const friendUids = friends.map(friend => friend.uid);

        const removeFriends = removeCurrentUser.filter(
          item => !friendUids.includes(item.uid),
        );

        const filteredData = removeFriends.filter(user => {
          const statusIds = statusContent.map(item => item.id);
          return statusIds.includes(user.uid);
        });

        setFilteredUsers(filteredData);
      } catch (error) {
        console.log(error);
      }
    };

    fetchAllUsers();
  }, [user.uid, friends, statusContent]);

  // const openCamera = async () => {
  //   try {
  //     const image = await ImagePicker.openCamera({
  //       width: 300,
  //       height: 400,
  //       cropping: true,
  //     });

  //     if (image.path) {
  //       navigation.navigate('PostStatus', {
  //         image: image.path,
  //       });
  //     }
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };

  const openGallery = async () => {
    try {
      const image = await ImagePicker.openPicker({
        width,
        height,
        cropping: true,
      });

      if (image.path) {
        navigation.navigate('PostStatus', {
          image: image.path,
          user,
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusContainer}>
        <TouchableOpacity
          style={[
            styles.pfpContainer,
            {borderRightWidth: 0.5, borderColor: 'gray'},
          ]}
          onPress={() => {
            const matchingStatus = statusContent.find(
              status => status.id === user.uid,
            );

            if (matchingStatus) {
              navigation.navigate('ViewStatus', {
                user,
                statusContent: matchingStatus.statuses,
              });
            } else {
              openGallery();
            }
          }}>
          <Image source={{uri: user.photoURL}} style={styles.userPfp} />

          {!statusContent?.find(status => status.id === user.uid) && (
            <Icon
              name="plus"
              size={16}
              color="#6E6D88"
              style={styles.addStatusIcon}
            />
          )}

          <Text style={styles.name}>{user.displayName}</Text>
        </TouchableOpacity>

        <FlatList
          data={filteredStatuses}
          horizontal
          keyExtractor={item => item.uid}
          renderItem={({item: friend}) => {
            const matchingStatus = statusContent.find(
              status => status.id === friend.uid,
            );

            if (matchingStatus) {
              return (
                <TouchableOpacity
                  style={styles.pfpContainer}
                  key={friend.uid}
                  onPress={() => {
                    navigation.navigate('ViewStatus', {
                      user: friend,
                      statusContent: matchingStatus.statuses,
                    });
                  }}>
                  <View style={styles.statusCounter}>
                    <Text style={{color: 'white'}}>
                      {matchingStatus.statuses.length}
                    </Text>
                  </View>
                  <Image
                    source={{uri: friend.photoURL}}
                    style={styles.userPfp}
                  />

                  <Text style={styles.name}>{friend.displayName}</Text>
                </TouchableOpacity>
              );
            }
          }}
        />
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={item => item.uid}
        renderItem={({item}) => {
          const getStatus = statusContent.find(
            status => status.id === item.uid,
          );

          const filteredVisibility = getStatus.statuses.filter(
            item => item.visibility === 'everyone',
          );

          if (filteredVisibility) {
            return (
              <TouchableOpacity
                key={item.uid}
                style={{
                  padding: 5,
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: 10,
                }}
                onPress={() => {
                  navigation.navigate('ViewStatus', {
                    user: item,
                    statusContent: filteredVisibility,
                  });
                }}>
                <Image source={{uri: item.photoURL}} style={styles.userPfp} />
                <View
                  style={{
                    height: 20,
                    width: 20,
                    left: 10,
                    top: 0,
                    position: 'absolute',
                    backgroundColor: '#008EFE',
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1,
                  }}>
                  <Text style={{color: 'white'}}>
                    {filteredVisibility.length}
                  </Text>
                </View>
                <Text style={{marginLeft: 10, fontSize: 16}}>
                  {item.displayName}
                </Text>
              </TouchableOpacity>
            );
          }
        }}
      />

      <TouchableOpacity style={styles.addStatus} onPress={openGallery}>
        <Icon name="camera" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
};

export default Status;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#ffffff',
  },
  statusContainer: {
    flexDirection: 'row',
  },
  pfpContainer: {
    margin: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userPfp: {
    width: 55,
    height: 55,
    borderRadius: 35,
  },
  addStatusIcon: {
    position: 'absolute',
    bottom: 20,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 4,
  },
  name: {
    textAlign: 'center',
  },
  addStatus: {
    position: 'absolute',
    bottom: 25,
    right: 15,
    height: 55,
    width: 55,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#008EFE',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusCounter: {
    height: 20,
    width: 20,
    right: 10,
    top: 0,
    position: 'absolute',
    backgroundColor: '#25D366',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
});
