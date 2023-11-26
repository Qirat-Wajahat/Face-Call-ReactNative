import {View, ActivityIndicator, Text} from 'react-native';
import React, {useState, useEffect} from 'react';
import {Bubble, GiftedChat} from 'react-native-gifted-chat';
import firestore from '@react-native-firebase/firestore';
import {GoogleSignin} from '@react-native-google-signin/google-signin';

const ChatZone = ({route}) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatUserPhoto, setChatUserPhoto] = useState(null);
  
  const {uid, profilePicture} = route.params;

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
              createdAt: firebaseData.createdAt
                ? firebaseData.createdAt.toDate()
                : new Date(),
              user: {
                _id: firebaseData.sentBy,
                name:
                  firebaseData.sentBy === currentUser.uid
                    ? 'You'
                    : 'Other User',
                avatar: chatUserPhoto || '',
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

  const onSend = async newMessages => {
    const message = newMessages[0];
    try {
      const docId = [currentUser.uid, uid].sort().join('-');
      await firestore()
        .collection('chatrooms')
        .doc(docId)
        .collection('messages')
        .add({
          text: message.text,
          createdAt: firestore.FieldValue.serverTimestamp(),
          sentBy: currentUser.uid,
        });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  useEffect(() => {
    if (profilePicture) {
      setChatUserPhoto(profilePicture);
    }
  }, [profilePicture]);

  return (
    <View style={{flex: 1}}>
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
            user={{
              _id: currentUser.uid,
            }}
            textInputProps={{
              color: '#404040',
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
                    }}>
                    <Text style={{color: 'black'}}>
                      {props.currentMessage.text}
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
                      paddingLeft: 5,
                      paddingTop: 2,
                      paddingBottom: 2,
                    },
                    left: {
                      backgroundColor: 'lightgrey',
                      borderRadius: 15,
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

export default ChatZone;
