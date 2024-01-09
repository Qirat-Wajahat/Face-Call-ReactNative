import {
  View,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Image,
  ToastAndroid,
  StyleSheet,
  Modal,
  PermissionsAndroid,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import Clipboard from '@react-native-clipboard/clipboard';

import Sound from 'react-native-sound';

import defaultUser from '../assets/defaultUser.jpg';

import {Bubble, GiftedChat, InputToolbar, Send} from 'react-native-gifted-chat';
import ImageCropPicker from 'react-native-image-crop-picker';

import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import messaging from '@react-native-firebase/messaging';

import axios from 'axios';
import {GoogleSignin} from '@react-native-google-signin/google-signin';

const ChatZone = ({route}) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [imageUri, setImageUri] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatUserPhoto, setChatUserPhoto] = useState(null);

  const {profilePicture, uid} = route.params;

  useEffect(() => {
    setMessages([]);

    const getCurrentUserDetails = async () => {
      try {
        const currentUser = await GoogleSignin.getCurrentUser();
        if (currentUser?.user?.email) {
          const snapshot = await firestore()
            .collection('users')
            .where('email', '==', currentUser.user.email)
            .get();
          if (!snapshot.empty) {
            const userDoc = snapshot.docs[0];
            setCurrentUser(userDoc.data());
          }
        }
      } catch (error) {
        console.error('Error getting current user details:', error);
      }
    };

    getCurrentUserDetails();
  }, []);

  useEffect(() => {
    if (profilePicture) {
      setChatUserPhoto(profilePicture);
    } else {
      setChatUserPhoto(defaultUser);
    }
  }, [profilePicture]);

  useEffect(() => {
    if (currentUser) {
      const conversationParticipants = [currentUser.uid, uid].sort();
      const docId = conversationParticipants.join('-');

      let unsubscribeSnapshot;

      unsubscribeSnapshot = firestore()
        .collection('chatrooms')
        .doc(docId)
        .collection('messages')
        .orderBy('createdAt', 'asc')
        .onSnapshot(snapshot => {
          const fetchedMessages = snapshot.docs.map(doc => {
            const firebaseData = doc.data();

            return {
              _id: doc.id,
              text: firebaseData.text,
              image: firebaseData.image,
              createdAt: firebaseData.createdAt
                ? firebaseData.createdAt.toDate()
                : new Date(),
              user: {
                _id: firebaseData.sentBy,
                name:
                  firebaseData.sentBy === currentUser.uid
                    ? 'You'
                    : 'Other User',
                avatar:
                  firebaseData.sentBy === currentUser.uid
                    ? currentUser.photoURL
                    : chatUserPhoto || '',
              },
            };
          });
          setMessages(fetchedMessages.reverse());
        });

      return () => {
        if (unsubscribeSnapshot) {
          unsubscribeSnapshot();
        }
      };
    }
  }, [currentUser, uid, chatUserPhoto]);

  useEffect(() => {
    const unsubscribe = messaging().onMessage(() => {
      playMessageReceivedSound();
    });

    return unsubscribe;
  }, []);

  const takePhotoFromCamera = async () => {
    setModalVisible(false);
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'Face Call needs access to your camera.',
          buttonPositive: 'OK',
          buttonNegative: 'Cancel',
        },
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        const image = await ImageCropPicker.openCamera({
          width: 300,
          height: 300,
          cropping: true,
          compressImageQuality: 0.7,
        });

        const imageUri = image.path;
        setImageUri(imageUri);
        setModalVisible(false);
      } else {
        console.log('Camera permission denied');
      }
    } catch (error) {
      console.log('Error handling image:', error);
    }
  };

  const choosePhotoFromGallery = async () => {
    try {
      const image = await ImageCropPicker.openPicker({
        width: 300,
        height: 300,
        cropping: true,
        compressImageQuality: 0.7,
      });

      const imageUri = image.path;
      setImageUri(imageUri);
      setModalVisible(false);
    } catch (error) {
      console.error('Error handling image:', error);
    }
  };

  const playMessageSentSound = () => {
    const sentSound = new Sound('messagesent.mp3', Sound.MAIN_BUNDLE, error => {
      if (error) {
        console.log('Failed to load the sent sound', error);
        return;
      }
      sentSound.play(success => {
        if (success) {
          console.log('Message sent sound played successfully');
        } else {
          console.log('Failed to play the message sent sound');
        }
      });
    });
  };

  const playMessageReceivedSound = () => {
    const receivedSound = new Sound(
      'messagereceived.wav',
      Sound.MAIN_BUNDLE,
      error => {
        if (error) {
          console.log('Failed to load the received sound', error);
          return;
        }
        receivedSound.play(success => {
          if (success) {
            console.log('Message received sound played successfully');
          } else {
            console.log('Failed to play the message received sound');
          }
        });
      },
    );
  };

  const onSend = async newMessages => {
    const message = newMessages[0];
    try {
      const docId = [currentUser.uid, uid].sort().join('-');
      const messageData = {
        text: message.text,
        createdAt: firestore.FieldValue.serverTimestamp(),
        sentBy: currentUser.uid,
      };

      if (imageUri) {
        const filename = imageUri.substring(imageUri.lastIndexOf('/') + 1);
        const storageRef = storage().ref(`images/${filename}`);

        setImageUri('');
        const responseUpload = await storageRef.putFile(imageUri);

        const downloadURL = await storageRef.getDownloadURL();

        messageData.image = downloadURL;
      }

      if (messageData.sentBy == currentUser.uid) {
        playMessageSentSound();
      }

      await firestore()
        .collection('chatrooms')
        .doc(docId)
        .collection('messages')
        .add(messageData);

      const recipientUid = currentUser.uid === uid ? currentUser.uid : uid;

      const recipientSnapshot = await firestore()
        .collection('users')
        .doc(recipientUid)
        .get();
      const recipientData = recipientSnapshot.data();

      if (recipientData?.deviceToken) {
        const notificationData = {
          notification: {
            title: currentUser.displayName,
            body: messageData.text,
            imageUrl: messageData.image,
          },
          data: {
            username: currentUser.displayName,
            profilePicture: currentUser.photoURL,
            uid: currentUser.uid,
            coverPhoto: currentUser.coverPhoto || '',
            bio: currentUser.bio || '',
            youtube: JSON.stringify(currentUser.youtube) || '',
            twitter: JSON.stringify(currentUser.twitter) || '',
            facebook: JSON.stringify(currentUser.facebook) || '',
            instagram: JSON.stringify(currentUser.instagram) || '',
            currentUserData: JSON.stringify(currentUser),
          },
          token: recipientData.deviceToken,
        };

        axios
          .post('https://strange-newt-pinafore.cyclic.app/send-notification', {
            notificationData,
          })
          .then(response => {
            console.log('Notification sent successfully:', response.data);
          })
          .catch(error => {
            console.error('Error sending notification:', error);
          });
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const deleteMessage = async messageId => {
    try {
      const docId = [currentUser.uid, uid].sort().join('-');
      await firestore()
        .collection('chatrooms')
        .doc(docId)
        .collection('messages')
        .doc(messageId)
        .delete();
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const customInputToolbar = props => {
    return (
      <View style={styles.customInputContainer}>
        <InputToolbar
          {...props}
          containerStyle={{
            backgroundColor: '#ffffff',
            width: '85%',
            borderTopWidth: 0,
            borderRadius: 25,
            elevation: 5,
            marginHorizontal: 5,
            marginVertical: '2%',
            flex: 1,
          }}
        />

        {props.text !== '' || imageUri ? (
          <TouchableOpacity
            style={styles.sendBtn}
            onPress={() => {
              props.onSend({text: props.text});
            }}>
            <Icon name="send-sharp" size={24} color="white" style={{left: 2}} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.sendBtn}>
            <Icon name="mic" size={24} color="white" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={{flex: 1}}>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
        }}>
        <View style={styles.imageModal}>
          <View style={styles.imageModalContent}>
            <TouchableOpacity
              style={{
                alignItems: 'flex-end',
                margin: 10,
                borderBottomWidth: 0.5
              }}
              onPress={() => setModalVisible(false)}>
              <Icon name="close" size={30} color="black" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modelActionBtn}
              onPress={takePhotoFromCamera}>
              <Icon name="camera" size={24} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modelActionBtn}
              onPress={choosePhotoFromGallery}>
              <Icon name="image" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {currentUser ? (
        <>
          {messages.length === 0 && (
            <View style={{alignItems: 'center', padding: 10}}>
              <View
                style={{
                  backgroundColor: 'lightgrey',
                  borderRadius: 15,
                  padding: 10,
                }}>
                <Text
                  style={{fontSize: 14, color: 'black', textAlign: 'center'}}>
                  Your conversations are private and secure. All messages
                  exchanged are encrypted end-to-end for your security.
                </Text>
              </View>
            </View>
          )}

          <GiftedChat
            messages={messages}
            onSend={newMessages => onSend(newMessages)}
            showUserAvatar
            scrollToBottom
            textInputStyle={{color: 'black'}}
            renderInputToolbar={props => customInputToolbar(props)}
            onLongPress={(context, message) => {
              const options = ['Delete for Everyone', 'Copy Text', 'Cancel'];
              const cancelButtonIndex = options.length - 1;

              context.actionSheet().showActionSheetWithOptions(
                {
                  options,
                  cancelButtonIndex,
                },
                async buttonIndex => {
                  switch (buttonIndex) {
                    case 0:
                      await deleteMessage(message._id);
                      ToastAndroid.showWithGravity(
                        'Message Deleted',
                        ToastAndroid.SHORT,
                        ToastAndroid.BOTTOM,
                      );
                      break;

                    case 1:
                      Clipboard.setString(message.text);
                      ToastAndroid.showWithGravity(
                        'Message Copied',
                        ToastAndroid.SHORT,
                        ToastAndroid.BOTTOM,
                      );
                      break;
                  }
                },
              );
            }}
            user={{
              _id: currentUser.uid,
            }}
            renderSend={props => {
              return (
                <>
                  {imageUri ? (
                    <View
                      style={{
                        width: 50,
                        height: 100,
                        borderRadius: 10,
                        marginRight: 10,
                        marginTop: 5,
                      }}>
                      <Image
                        source={{uri: imageUri}}
                        style={{
                          width: 50,
                          height: 100,
                          borderRadius: 10,
                          position: 'absolute',
                          backgroundColor: 'gray',
                          borderRadius: 5,
                        }}
                      />
                      <TouchableOpacity
                        onPress={() => {
                          setImageUri('');
                        }}>
                        <MaterialIcons
                          name="cancel"
                          size={20}
                          style={{left: 30}}
                        />
                      </TouchableOpacity>
                    </View>
                  ) : null}

                  <TouchableOpacity
                    onPress={() => {
                      setModalVisible(true);
                    }}
                    style={{
                      marginBottom: 10,
                      marginRight: 10,
                    }}>
                    <FontAwesome name="paperclip" size={24} color="#008efe" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      takePhotoFromCamera();
                    }}
                    style={{
                      marginBottom: 10,
                      marginRight: 10,
                    }}>
                    <Icon name="camera" size={26} color="#008efe" />
                  </TouchableOpacity>
                </>
              );
            }}
            renderBubble={props => {
              const isCurrentUser =
                props.currentMessage?.user?._id === currentUser.uid;

              if (!isCurrentUser) {
                return (
                  <View
                    style={{
                      backgroundColor: 'lightgrey',
                      borderRadius: 15,
                      padding: 10,
                      maxWidth: '80%',
                    }}>
                    {props.currentMessage.image && (
                      <Image
                        source={{uri: props.currentMessage.image}}
                        style={{width: 180, height: 180, borderRadius: 8}}
                      />
                    )}
                    <Text style={{color: 'black'}}>
                      {props.currentMessage.text}
                    </Text>
                    <Text style={{fontSize: 10, color: 'grey'}}>
                      {props.currentMessage.createdAt &&
                        new Date(
                          props.currentMessage.createdAt,
                        ).toLocaleTimeString([], {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                    </Text>
                  </View>
                );
              }
              return (
                <Bubble
                  {...props}
                  wrapperStyle={{
                    right: {
                      backgroundColor: '#008efe',
                      padding: 5,
                    },
                  }}
                />
              );
            }}
          />
        </>
      ) : (
        <ActivityIndicator size="large" color="#0000ff" />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  imageModal: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    marginBottom: '15%',
    marginRight: '15%',
  },
  imageModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '30%',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modelActionBtn: {
    backgroundColor: '#008efe',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    borderRadius: 40,
    margin: 10,
  },
  customInputContainer: {
    alignItems: 'flex-end',
  },
  sendBtn: {
    backgroundColor: '#008efe',
    bottom: 10,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    borderRadius: 25,
  },
});

export default ChatZone;
