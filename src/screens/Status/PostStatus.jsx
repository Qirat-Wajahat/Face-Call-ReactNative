import {
  View,
  Image,
  Dimensions,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Text,
} from 'react-native';
import React, {useState} from 'react';
const {width, height} = Dimensions.get('window');

import {useNavigation} from '@react-navigation/native';

import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';

import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

const PostStatus = ({route}) => {
  const {user, image} = route.params;

  const navigation = useNavigation();

  const [isLoading, setIsLoading] = useState(false);
  const [visibilityModel, setVisibilityModel] = useState(false);

  const [caption, setCaption] = useState('');
  const [selectedVisibility, setSelectedVisibility] = useState('everyone');
  const visibilityOptions = ['everyone', 'friends'];

  const RadioButton = ({options, selectedOption, onSelect}) => {
    return (
      <View style={styles.radioButtonContainer}>
        {options.map(option => (
          <TouchableOpacity
            key={option}
            style={[
              styles.radioButton,
              {
                backgroundColor:
                  selectedOption === option ? '#008EFE' : 'white',
                borderColor: selectedOption === option ? '#008EFE' : '#000',
                borderWidth: 0.1,
              },
            ]}
            onPress={() => onSelect(option)}>
            <Text
              style={{
                color: selectedOption === option ? 'white' : '#333',
                fontWeight: 'bold',
              }}>
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  async function handlePostStatus() {
    try {
      setIsLoading(true);
      // Upload image to Firebase Storage
      const imageRef = storage().ref(`statuses/${user?.uid}/${Date.now()}.jpg`);
      await imageRef.putFile(image);
      const downloadURL = await imageRef.getDownloadURL();

      // Save status details in Firestore
      const userStatusRef = firestore().collection('statuses').doc(user?.uid);
      const snapshot = await userStatusRef.get();
      const existingStatuses = snapshot.data()?.statuses || [];

      const newStatus = {
        content: downloadURL,
        type: 'image',
        finish: 0,
        visibility: selectedVisibility,
      };

      if (caption.trim() !== '') {
        newStatus.caption = caption;
      }

      const updatedStatuses = [...existingStatuses, newStatus];

      await userStatusRef.set(
        {
          statuses: updatedStatuses,
        },
        {merge: true},
      );

      navigation.navigate('ViewStatus', {
        user,
        statusContent: updatedStatuses,
      });

      setIsLoading(false);
    } catch (error) {
      console.error('Error posting status: ', error);
    }
  }

  return (
    <View style={styles.container}>
      {image ? (
        <>
          <Modal
            animationType="slide"
            transparent={true}
            visible={visibilityModel}
            onRequestClose={() => setVisibilityModel(false)}>
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Visibility</Text>

                <RadioButton
                  options={visibilityOptions}
                  selectedOption={selectedVisibility}
                  onSelect={setSelectedVisibility}
                />
                <TouchableOpacity
                  onPress={() => setVisibilityModel(false)}
                  style={styles.closeButton}>
                  <Text style={{color: 'blue'}}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <Image
            source={{uri: image}}
            style={{
              width,
              height,
              resizeMode: 'cover',
            }}
          />

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => {
              navigation.goBack();
            }}>
            <Icon name="x" size={30} color="white" />
          </TouchableOpacity>

          <View style={styles.captionContainer}>
            <TouchableOpacity
              style={styles.postStatus}
              onPress={handlePostStatus}>
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Ionicons
                  name="send-sharp"
                  size={30}
                  color="white"
                  style={{left: 5}}
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statusVisibility}
              onPress={() => {
                setVisibilityModel(true);
              }}>
              <Ionicons name="eye" size={30} color="white" />
            </TouchableOpacity>

            <TextInput
              style={styles.captionInput}
              placeholder="Caption"
              placeholderTextColor="gray"
              autoCorrect={false}
              value={caption}
              onChangeText={text => setCaption(text)}
            />
          </View>
        </>
      ) : (
        navigation.goBack()
      )}
    </View>
  );
};

export default PostStatus;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cancelBtn: {
    zIndex: 1,
    height: 50,
    width: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(25, 25, 25, .5)',
    position: 'absolute',
    top: 10,
    left: 10,
  },
  captionContainer: {
    flex: 1,
    height: '8%',
    width,
    position: 'absolute',
    bottom: 25,
    backgroundColor: 'rgba(25, 25, 25, .5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captionInput: {
    color: 'white',
    fontSize: 20,
    width,
    textAlign: 'center',
  },
  statusVisibility: {
    zIndex: 1,
    height: 50,
    width: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(25, 25, 25,.5)',
    position: 'absolute',
    left: 10,
    bottom: '110%',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  radioButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  radioButton: {
    padding: 20,
    borderRadius: 50,
  },
  closeButton: {
    marginTop: 10,
    alignItems: 'center',
  },
  postStatus: {
    height: 55,
    width: 55,
    position: 'absolute',
    right: 15,
    bottom: '110%',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#008EFE',
  },
});
