import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ToastAndroid,
  Alert,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {useNavigation} from '@react-navigation/native';

import defaultCoverImage from '../assets/defaultCoverImage.jpg';
import defaultUser from '../assets/defaultUser.jpg';

import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import firestore from '@react-native-firebase/firestore';
import axios from 'axios';
import InAppBrowser from 'react-native-inappbrowser-reborn';

const UserProfile = ({route}) => {
  const {
    username,
    profilePicture,
    userBio,
    coverPhoto,
    uid,
    youtube,
    twitter,
    facebook,
    instagram,
    currentUser,
  } = route.params;

  const navigation = useNavigation();

  const isRequestSent = () => {
    if (
      currentUser.sentRequests &&
      currentUser.sentRequests.some(request => request.uid === uid)
    ) {
      return true;
    }
    return false;
  };

  const [friendRequestSent, setFriendRequestSent] = useState(isRequestSent());
  const [hasReceivedRequest, setHasReceivedRequest] = useState(false);

  const [areFriends, setAreFriends] = useState(
    currentUser.friends.some(friend => friend.uid === uid),
  );

  useEffect(() => {
    if (
      currentUser.receivedRequests &&
      currentUser.receivedRequests.some(request => request.uid === uid)
    ) {
      setHasReceivedRequest(true);
    }
  }, [currentUser.receivedRequests, uid]);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('users')
      .doc(currentUser.uid)
      .onSnapshot(snapshot => {
        const updatedAreFriends = snapshot
          .data()
          ?.friends.some(friend => friend.uid === uid);
        setAreFriends(updatedAreFriends);

        if (!updatedAreFriends) {
          navigation.setOptions({
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('People');
                }}
                style={{paddingRight: 10}}>
                <Icon name="arrow-back" size={24} color="#000" />
              </TouchableOpacity>
            ),
          });
        }
      });

    return () => unsubscribe();
  }, [currentUser.uid, uid]);

  const handleUnfriend = async friendUid => {
    const confirmUnfriend = async () => {
      return new Promise(resolve => {
        Alert.alert(
          'Confirm',
          `Are you sure you want to remove ${username} as a friend?`,
          [
            {text: 'Cancel', style: 'cancel', onPress: () => resolve(false)},
            {text: 'Yes', onPress: () => resolve(true)},
          ],
          {cancelable: true},
        );
      });
    };

    const confirmed = await confirmUnfriend();

    if (confirmed) {
      try {
        await firestore().runTransaction(async transaction => {
          const currentUserRef = firestore()
            .collection('users')
            .doc(currentUser.uid);
          const friendUserRef = firestore().collection('users').doc(friendUid);

          const [currentUserDoc, friendUserDoc] = await Promise.all([
            transaction.get(currentUserRef),
            transaction.get(friendUserRef),
          ]);

          const currentUserData = currentUserDoc.data();
          const friendUserData = friendUserDoc.data();

          const updatedCurrentUserFriends = (
            currentUserData.friends || []
          ).filter(friend => friend.uid !== friendUid);

          const updatedFriendFriends = (friendUserData.friends || []).filter(
            friend => friend.uid !== currentUser.uid,
          );

          transaction.update(currentUserRef, {
            friends: updatedCurrentUserFriends,
          });
          transaction.update(friendUserRef, {friends: updatedFriendFriends});
        });

        ToastAndroid.show('Friend removed successfully!', ToastAndroid.SHORT);
      } catch (error) {
        console.error('Error removing friend:', error);
      }
    }
  };

  const sendFriendRequest = async (
    senderUID,
    recipientUID,
    senderDisplayName,
    senderPhotoURL,
  ) => {
    try {
      setFriendRequestSent(true);

      ToastAndroid.show('Friend request sent!', ToastAndroid.SHORT);

      const senderRef = firestore().collection('users').doc(senderUID);
      const recipientRef = firestore().collection('users').doc(recipientUID);

      await firestore().runTransaction(async transaction => {
        const senderDoc = await transaction.get(senderRef);
        const recipientDoc = await transaction.get(recipientRef);

        const senderData = senderDoc.data();
        const recipientData = recipientDoc.data();

        const updatedSentRequests = [
          ...(senderData.sentRequests || []),
          {
            uid: recipientUID,
            displayName: recipientData.displayName,
            photoURL: recipientData.photoURL,
          },
        ];
        transaction.update(senderRef, {sentRequests: updatedSentRequests});

        const updatedReceivedRequests = [
          ...(recipientData.receivedRequests || []),
          {
            uid: senderUID,
            displayName: senderDisplayName,
            photoURL: senderPhotoURL,
          },
        ];
        transaction.update(recipientRef, {
          receivedRequests: updatedReceivedRequests,
        });

        if (recipientData.deviceToken) {
          const notificationData = {
            notification: {
              title: 'Friend Request!',
              body: `${senderDisplayName} sent you a Friend Request!`,
            },
            data: {
              senderUID,
              senderDisplayName,
              senderPhotoURL,
            },
            token: recipientData.deviceToken,
          };

          axios
            .post(
              'https://strange-newt-pinafore.cyclic.app/send-notification',
              {
                notificationData,
              },
            )
            .then(response => {
              console.log('Notification sent successfully:', response.data);
            })
            .catch(error => {
              console.error('Error sending notification:', error);
            });
        }
      });
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const handleOpenInAppBrowser = async url => {
    if (await InAppBrowser.isAvailable()) {
      const result = await InAppBrowser.open(url, {
        showTitle: true,
        enableUrlBarHiding: true,
        enableDefaultShare: true,
        forceCloseOnRedirection: false,
        hasBackButton: true,
        includeReferrel: true,
        animated: true,
      });
      console.log(result);
    } else {
      console.error('InAppBrowser is null');
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={
          coverPhoto
            ? {
                uri: coverPhoto,
              }
            : defaultCoverImage
        }
        style={styles.coverPhoto}
      />

      <View style={{flex: 1, alignItems: 'center'}}>
        <Image
          source={profilePicture ? {uri: profilePicture} : defaultUser}
          style={styles.profilePicture}
        />

        <Text style={styles.username}>{username}</Text>
        <Text style={styles.bioText}>{userBio}</Text>

        {areFriends && (
          <TouchableOpacity
            onPress={() => handleUnfriend(uid)}
            style={styles.removeFriendButton}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Text style={styles.friendRequestButtonText}>Remove Friend</Text>
              <Icon
                name="person-remove-alt-1"
                color="#fff"
                size={20}
                style={styles.addFriendIcon}
              />
            </View>
          </TouchableOpacity>
        )}

        {!areFriends && !friendRequestSent && !hasReceivedRequest && (
          <TouchableOpacity
            onPress={() =>
              sendFriendRequest(
                currentUser.uid,
                uid,
                currentUser.displayName,
                currentUser.photoURL,
              )
            }
            style={styles.friendRequestButton}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Text style={styles.friendRequestButtonText}>
                Send Friend Request
              </Text>
              <Icon
                name="person-add-alt-1"
                color="#fff"
                size={20}
                style={styles.addFriendIcon}
              />
            </View>
          </TouchableOpacity>
        )}

        {friendRequestSent && (
          <View style={styles.friendRequestSentButton}>
            <Text style={styles.friendRequestSentButtonText}>
              Friend Request Sent
            </Text>
            <Icon
              name="check"
              color="#4CAF50"
              size={25}
              style={styles.requestSentIcon}
            />
          </View>
        )}

        {hasReceivedRequest && (
          <View style={styles.friendRequestSentButton}>
            <Text style={styles.friendRequestAlreadySentText}>
              This User has Sent you a Friend Request
            </Text>
            <MaterialCommunityIcons
              name="bell-ring"
              color="#4CAF50"
              size={25}
              style={styles.requestSentIcon}
            />
          </View>
        )}
        <View
          style={{
            alignSelf: 'flex-start',
            marginStart: 20,
            top: 5,
          }}>
          {youtube ? (
            <TouchableOpacity
              onPress={() => {
                handleOpenInAppBrowser(youtube.link);
              }}
              style={styles.socialIcon}>
              <MaterialCommunityIcons
                name="youtube"
                size={56}
                color="#f44234"
              />
              <Text style={styles.socialLabel}>{youtube.label}</Text>
            </TouchableOpacity>
          ) : null}

          {twitter ? (
            <TouchableOpacity
              onPress={() => {
                handleOpenInAppBrowser(twitter.link);
              }}
              style={styles.socialIcon}>
              <MaterialCommunityIcons
                name="twitter"
                size={56}
                color="#00aeeb"
              />
              <Text style={styles.socialLabel}>{twitter.label}</Text>
            </TouchableOpacity>
          ) : null}

          {facebook ? (
            <TouchableOpacity
              onPress={() => {
                handleOpenInAppBrowser(facebook.link);
              }}
              style={styles.socialIcon}>
              <MaterialCommunityIcons
                name="facebook"
                size={56}
                color="#2978b3"
              />
              <Text style={styles.socialLabel}>{facebook.label}</Text>
            </TouchableOpacity>
          ) : null}

          {instagram ? (
            <TouchableOpacity
              onPress={() => {
                handleOpenInAppBrowser(instagram.link);
              }}
              style={styles.socialIcon}>
              <MaterialCommunityIcons
                name="instagram"
                size={56}
                color="#cd436c"
              />
              <Text style={styles.socialLabel}>{instagram.label}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  coverPhoto: {
    width: '100%',
    aspectRatio: 16 / 9,
    position: 'relative',
  },
  profilePicture: {
    height: 155,
    width: 155,
    borderRadius: 80,
    borderColor: '#008EFE',
    borderWidth: 2,
    marginTop: -90,
  },
  bioText: {
    width: '70%',
    color: '#6E6D88',
    textAlign: 'center',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#008efe',
    marginVertical: 10,
  },
  friendRequestButton: {
    marginTop: 30,
    backgroundColor: '#008EFE',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  removeFriendButton: {
    marginTop: 30,
    backgroundColor: '#F44336',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  friendRequestButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  addFriendIcon: {
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 10,
  },
  friendRequestSentButton: {
    marginTop: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendRequestSentButtonText: {
    color: '#4CAF50',
    fontWeight: '500',
    fontSize: 18,
  },
  friendRequestAlreadySentText: {
    color: '#4CAF50',
    fontWeight: '500',
    fontSize: 18,
  },
  requestSentIcon: {
    paddingLeft: 5,
    fontWeight: '500',
  },
  socialIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  socialLabel: {
    fontSize: 28,
    marginStart: 8,
    borderBottomWidth: 2,
    color: '#030303',
  },
});

export default UserProfile;
