import React, {useEffect, useRef, useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Modal,
  FlatList,
  Image,
  ToastAndroid,
} from 'react-native';

import {useNavigation} from '@react-navigation/native';

import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import {InAppBrowser} from 'react-native-inappbrowser-reborn';

import {GoogleSignin} from '@react-native-google-signin/google-signin';
import firestore from '@react-native-firebase/firestore';

const Header = ({handleLogout}) => {
  const [currentUser, setCurrentUser] = useState();
  const [receivedRequests, setReceivedRequests] = useState([]);

  const [showSideMenu, setShowSideMenu] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const slideAnimation = useRef(new Animated.Value(-300)).current;

  const navigation = useNavigation();

  const requestsCount = receivedRequests.length;

  useEffect(() => {
    const fetchUserDataAndRequests = async () => {
      try {
        const user = await GoogleSignin.getCurrentUser();
        const currentUserEmail = user?.user.email;

        if (currentUserEmail) {
          const userRef = firestore()
            .collection('users')
            .where('email', '==', currentUserEmail);

          const unsubscribe = userRef.onSnapshot(querySnapshot => {
            querySnapshot.forEach(doc => {
              setCurrentUser({id: doc.id, ...doc.data()});

              const recipientRef = firestore().collection('users').doc(doc.id);
              recipientRef
                .get()
                .then(recipientDoc => {
                  if (recipientDoc.exists) {
                    const recipientData = recipientDoc.data();
                    if (recipientData.receivedRequests) {
                      setReceivedRequests(recipientData.receivedRequests);
                    }
                  }
                })
                .catch(error => {
                  console.error('Error fetching received requests:', error);
                });
            });
          });

          return () => unsubscribe();
        }
      } catch (error) {
        console.error('Error getting current user:', error);
      }
    };

    fetchUserDataAndRequests();
  }, []);
  
  const openMenu = () => {
    setShowSideMenu(true);

    Animated.timing(slideAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeMenu = () => {
    Animated.timing(slideAnimation, {
      toValue: -300,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setShowSideMenu(false));
  };

  const toggleSideMenu = () => {
    if (showSideMenu) {
      closeMenu();
    } else {
      openMenu();
    }
  };

  const handleOpenInAppBrowser = async () => {
    if (await InAppBrowser.isAvailable()) {
      const url = 'https://uphello.in';
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

  const formatTime = timestamp => {
    if (!timestamp) return '';

    // Convert timestamp to a Date object
    const date = timestamp.toDate();

    // Format the date and time
    const formattedDate = `${date.getDate()}/${
      date.getMonth() + 1
    }/${date.getFullYear()}`;
    const hours = (date.getHours() < 10 ? '0' : '') + date.getHours();
    const minutes = (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();
    const formattedTime = `${hours}:${minutes}`;

    return `${formattedDate} ${formattedTime}`;
  };

  const handleAccept = async (request) => {
    try {
      await firestore().runTransaction(async (transaction) => {
        const senderRef = firestore().collection('users').doc(request.uid);
        const recipientRef = firestore().collection('users').doc(currentUser.uid);
  
        const [senderDoc, recipientDoc] = await Promise.all([
          transaction.get(senderRef),
          transaction.get(recipientRef),
        ]);
  
        const senderData = senderDoc.data();
        const recipientData = recipientDoc.data();
  
        const updatedSenderFriends = [
          ...(senderData.friends || []),
          {
            uid: currentUser.uid,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
          },
        ];
  
        const updatedSenderRequests = senderData.sentRequests.filter(
          (sentReq) => sentReq.uid !== currentUser.uid
        );
  
        const updatedRecipientFriends = [
          ...(recipientData.friends || []),
          {
            uid: request.uid,
            displayName: request.displayName,
            photoURL: request.photoURL,
          },
        ];
  
        const updatedRecipientRequests = recipientData.receivedRequests.filter(
          (recvReq) => recvReq.uid !== request.uid
        );
  
        transaction.update(senderRef, {
          friends: updatedSenderFriends,
          sentRequests: updatedSenderRequests,
        });
  
        transaction.update(recipientRef, {
          friends: updatedRecipientFriends,
          receivedRequests: updatedRecipientRequests,
        });
      });
  
      ToastAndroid.show('Friend request accepted!', ToastAndroid.SHORT);
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };  
  
  const handleReject = async (request) => {
    try {
      await firestore().runTransaction(async (transaction) => {
        const senderRef = firestore().collection('users').doc(request.uid);
        const recipientRef = firestore().collection('users').doc(currentUser.uid);
  
        const [senderDoc, recipientDoc] = await Promise.all([
          transaction.get(senderRef),
          transaction.get(recipientRef),
        ]);
  
        const senderData = senderDoc.data();
        const recipientData = recipientDoc.data();
  
        const updatedSenderRequests = senderData.sentRequests.filter(
          (sentReq) => sentReq.uid !== currentUser.uid
        );
  
        const updatedRecipientRequests = recipientData.receivedRequests.filter(
          (recvReq) => recvReq.uid !== request.uid
        );
  
        transaction.update(senderRef, { sentRequests: updatedSenderRequests });
        transaction.update(recipientRef, { receivedRequests: updatedRecipientRequests });
      });
  
      ToastAndroid.show('Friend request rejected!', ToastAndroid.SHORT);
    } catch (error) {
      console.error('Error rejecting friend request:', error);
    }
  };  

  useEffect(() => {
    slideAnimation.setValue(-300);
  }, []);

  return (
    <View style={styles.header}>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
        }}>
        <View style={styles.friendRequestsModal}>
          <View style={styles.friendRequestsModalContent}>
            <View style={styles.friendRequestsModalHeader}>
              <Text style={styles.friendRequestsModalTitle}>
                Friend Requests
              </Text>

              <TouchableOpacity
                style={styles.closeFriendRequestsModalBtn}
                onPress={() => setModalVisible(false)}>
                <Icon name="cancel" size={25} color="#797979" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={receivedRequests}
              keyExtractor={(item, index) => index.toString()}
              ListEmptyComponent={() => (
                <View style={styles.noRequestsContainer}>
                  <Text style={styles.noRequestsText}>
                    No pending requests at the moment
                  </Text>
                </View>
              )}
              renderItem={({item}) => (
                <View style={styles.requestContainer}>
                  <Image
                    source={
                      item.photoURL
                        ? {uri: item.photoURL}
                        : require('../assets/defaultUser.jpg')
                    }
                    style={styles.recipientProfilePhoto}
                  />
                  <View style={styles.chatContent}>
                    <Text style={styles.recipientName}>{item.displayName}</Text>
                    <Text style={styles.timeSent}>
                      {formatTime(item.timestamp)}
                    </Text>
                    <View style={styles.buttonsContainer}>
                      <TouchableOpacity
                        style={[styles.button, styles.acceptButton]}
                        onPress={() => handleAccept(item)}>
                        <Text style={styles.buttonText}>Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.button, styles.rejectButton]}
                        onPress={() => handleReject(item)}>
                        <Text style={styles.buttonText}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>

      <TouchableOpacity style={styles.headerLeft} onPress={toggleSideMenu}>
        <Icon
          name={showSideMenu ? 'keyboard-arrow-left' : 'menu'}
          size={25}
          color="#000000"
          style={styles.headerMenuIcon}
        />
      </TouchableOpacity>

      <Text style={styles.headerTitle}>Face Call</Text>

      <Animated.View
        style={[
          styles.sideMenu,
          {transform: [{translateX: slideAnimation}]},
          showSideMenu ? null : {display: 'none'},
        ]}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            toggleSideMenu;
            navigation.navigate('EditProfile');
          }}>
          <Icon name="account-circle" size={25} color="gray" />
          <Text style={styles.menuText}>Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={toggleSideMenu}>
          <Icon name="privacy-tip" size={25} color="gray" />
          <Text style={styles.menuText}>Privacy & Policies</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={toggleSideMenu}>
          <Icon name="thumb-up" size={25} color="gray" />

          <Text style={styles.menuText}>Rate App</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleOpenInAppBrowser}>
          <Icon name="shopping-bag" size={25} color="gray" />

          <Text style={styles.menuText}>Shopping</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            toggleSideMenu();
            handleLogout();
          }}>
          <Icon name="exit-to-app" size={25} color="gray" />

          <Text style={styles.menuText}>Logout</Text>
        </TouchableOpacity>
      </Animated.View>

      <TouchableOpacity
        onPress={() => {
          setModalVisible(true);
        }}>
        <View style={styles.badgeContainer}>
          {requestsCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {requestsCount > 9 ? '9+' : requestsCount}
              </Text>
            </View>
          )}

          <View style={styles.headerRight}>
            <MaterialCommunityIcons
              name="bell"
              size={25}
              color="#000000"
              style={styles.headerBellIcon}
            />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 80,
    padding: 15,
    paddingBottom: 10,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: '#0a0a0a',
    fontSize: 40,
    fontWeight: 'bold',
    marginTop: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e1e1e1',
    height: 40,
    width: 40,
    borderRadius: 25,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e1e1e1',
    height: 40,
    width: 40,
    borderRadius: 25,
  },
  headerMenuIcon: {
    marginLeft: 7,
  },
  headerBellIcon: {
    marginLeft: 7,
  },
  badgeContainer: {
    flexDirection: 'row',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -3,
    backgroundColor: 'red',
    borderRadius: 10,
    minWidth: 20,
    minHeight: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sideMenu: {
    position: 'absolute',
    top: 80,
    left: 0,
    backgroundColor: '#ffffff',
    width: 250,
    height: 'auto',
    elevation: 20,
    borderWidth: 0,
    zIndex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  menuText: {
    fontSize: 18,
    marginLeft: 10,
    color: '#333',
  },
  friendRequestsModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  friendRequestsModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    height: '80%',
    width: '90%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  friendRequestsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
    borderBottomWidth: 0.5,
    borderColor: '#797979',
  },
  closeFriendRequestsModalBtn: {
    marginBottom: 10,
  },
  friendRequestsModalTitle: {
    marginBottom: 10,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#606060',
  },
  noRequestsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 250,
  },
  noRequestsText: {
    fontSize: 18,
    color: '#555',
    textAlign: 'center',
  },
  requestContainer: {
    padding: 5,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginRight: 5,
    paddingBottom: 15,
    borderBottomWidth: 0.5,
    borderColor: '#B8B8B8',
  },
  recipientProfilePhoto: {
    width: 50,
    height: 50,
    backgroundColor: '#128C7E',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipientName: {
    color: '#303030',
    fontSize: 17,
    fontWeight: '500',
    marginLeft: 8,
  },
  timeSent: {
    position: 'absolute',
    alignSelf: 'flex-end',
    right: 10,
  },
  buttonsContainer: {
    flexDirection: 'row',
    marginTop: 8,
    flex: 1,
  },
  button: {
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: '12%',
    marginHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
});

export default Header;
