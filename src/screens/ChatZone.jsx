import { View, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { GiftedChat } from 'react-native-gifted-chat';
import firestore from '@react-native-firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const ChatZone = ({ route }) => {
  const [messages, setMessages] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [chatUserPhoto, setChatUserPhoto] = useState(null); // State for chat user's photo

  const { uid, profilePicture } = route.params;

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

      const unsubscribe = firestore()
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
              createdAt: firebaseData.createdAt ? firebaseData.createdAt.toDate() : new Date(),
              user: {
                _id: firebaseData.sentBy,
                name: firebaseData.sentBy === currentUser.uid ? 'You' : 'Other User',
                avatar: chatUserPhoto || '', // Set chat user's photo as avatar
              },
            };
          });
          setMessages(fetchedMessages.reverse());
        });

      return () => {
        unsubscribe();
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
    <View style={{ flex: 1 }}>
      {currentUser ? (
        <GiftedChat
          messages={messages} 
          onSend={newMessages => onSend(newMessages)}
          user={{
            _id: currentUser.uid,
          }}
        />
      ) : (
        <ActivityIndicator size="large" color="#0000ff" />
      )}
    </View>
  );
};

export default ChatZone;
