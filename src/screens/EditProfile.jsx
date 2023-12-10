import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  PermissionsAndroid,
  Modal,
  TextInput,
  StyleSheet,
} from 'react-native';

import defaultCoverImage from '../assets/defaultCoverImage.jpg';

import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import {GoogleSignin} from '@react-native-google-signin/google-signin';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ImagePicker from 'react-native-image-crop-picker';

const EditProfile = () => {
  const [currentUser, setCurrentUser] = useState();
  const [coverPhoto, setCoverPhoto] = useState();
  const [profilePicture, setProfilePicture] = useState();
  const [modalVisible, setModalVisible] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [editDisplayNameModalVisible, setEditDisplayNameModalVisible] =
    useState(false);
  const [newBio, setNewBio] = useState('');
  const [editBioModalVisible, setEditBioModalVisible] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = await GoogleSignin.getCurrentUser();

        const currentUserEmail = user?.user.email;

        if (currentUserEmail) {
          const userSnapshot = await firestore()
            .collection('users')
            .where('email', '==', currentUserEmail)
            .get();

          if (!userSnapshot.empty) {
            const userData = userSnapshot.docs[0].data();
            setCoverPhoto(userData.coverPhoto || coverPhoto);
            setProfilePicture(userData.photoURL);
            setCurrentUser(userData);
          }
        }
      } catch (error) {
        console.error('Error getting current user:', error);
      }
    };

    fetchUserData();
  }, [currentUser, coverPhoto]);

  const handleCoverPhoto = async () => {
    try {
      const image = await ImagePicker.openPicker({
        width: 1280,
        height: 720,
        cropping: true,
        cropperToolbarTitle: 'Crop Cover Image',
        compressImageQuality: 0.7,
      });

      const imageUri = image.path;
      const filename = imageUri.substring(imageUri.lastIndexOf('/') + 1);
      const storageRef = storage().ref(`coverPhotos/${filename}`);
      const responseUpload = await storageRef.putFile(imageUri);

      const uploadedCoverPhotoURL = await storageRef.getDownloadURL();

      setCoverPhoto(uploadedCoverPhotoURL);

      if (currentUser) {
        const uid = currentUser.uid;
        await firestore()
          .collection('users')
          .doc(uid)
          .update({coverPhoto: uploadedCoverPhotoURL});
      }
    } catch (error) {
      console.log('Error handling cover photo:', error);
    }
  };

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
        const image = await ImagePicker.openCamera({
          width: 300,
          height: 300,
          cropping: true,
          cropperCircleOverlay: true,
          compressImageQuality: 0.7,
        });

        const imageUri = image.path;
        const filename = imageUri.substring(imageUri.lastIndexOf('/') + 1);
        const storageRef = storage().ref(`profilePictures/${filename}`);
        const responseUpload = await storageRef.putFile(imageUri);

        const uploadedImageURL = await storageRef.getDownloadURL();
        setProfilePicture(uploadedImageURL);

        if (currentUser) {
          const uid = currentUser.uid;
          await firestore()
            .collection('users')
            .doc(uid)
            .update({photoURL: uploadedImageURL});
          setCurrentUser(prevState => ({
            ...prevState,
            photoURL: uploadedImageURL,
          }));
          console.log('PhotoURL updated successfully!');
        }
      } else {
        console.log('Camera permission denied');
      }
    } catch (error) {
      console.log('Error handling image:', error);
    }
  };

  const choosePhotoFromGallery = async () => {
    setModalVisible(false);
    try {
      const image = await ImagePicker.openPicker({
        width: 300,
        height: 300,
        cropping: true,
        cropperCircleOverlay: true,
        cropperToolbarTitle: 'Crop Profile Picture',
        compressImageQuality: 0.7,
      });

      const imageUri = image.path;
      const filename = imageUri.substring(imageUri.lastIndexOf('/') + 1);
      const storageRef = storage().ref(`profilePictures/${filename}`);
      const responseUpload = await storageRef.putFile(imageUri);

      const uploadedImageURL = await storageRef.getDownloadURL();
      setProfilePicture(uploadedImageURL);

      if (currentUser) {
        const uid = currentUser.uid;
        await firestore()
          .collection('users')
          .doc(uid)
          .update({photoURL: uploadedImageURL});
        setCurrentUser(prevState => ({
          ...prevState,
          photoURL: uploadedImageURL,
        }));
        console.log('PhotoURL updated successfully!');
      }
    } catch (error) {
      console.log('Error handling image:', error);
    }
  };

  const updateDisplayName = async () => {
    try {
      if (currentUser) {
        const uid = currentUser.uid;
        await firestore()
          .collection('users')
          .doc(uid)
          .update({displayName: newDisplayName});
        setCurrentUser(prevState => ({
          ...prevState,
          displayName: newDisplayName,
        }));
        setEditDisplayNameModalVisible(false);
        console.log('DisplayName updated successfully!');
      }
    } catch (error) {
      console.error('Error updating displayName:', error);
    }
  };

  const updateBio = async () => {
    try {
      if (currentUser) {
        const uid = currentUser.uid;
        await firestore().collection('users').doc(uid).update({bio: newBio});
        setCurrentUser(prevState => ({
          ...prevState,
          bio: newBio,
        }));
        setEditBioModalVisible(false);
        console.log('Bio updated successfully!');
      }
    } catch (error) {
      console.error('Error updating bio:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
        }}>
        <View style={styles.editModal}>
          <View style={styles.editModalContent}>
            <Text style={styles.editModalTitle}>Choose an Option</Text>
            <TouchableOpacity
              style={{
                backgroundColor: '#008efe',
                paddingVertical: 15,
                paddingHorizontal: 40,
                borderRadius: 8,
                marginBottom: 10,
              }}
              onPress={takePhotoFromCamera}>
              <Text style={{color: 'white', fontSize: 16}}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: '#008efe',
                paddingVertical: 15,
                paddingHorizontal: 40,
                borderRadius: 8,
                marginBottom: 10,
              }}
              onPress={choosePhotoFromGallery}>
              <Text style={{color: 'white', fontSize: 16}}>
                Choose from Gallery
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: '#ccc',
                paddingVertical: 15,
                paddingHorizontal: 40,
                borderRadius: 8,
              }}
              onPress={() => setModalVisible(false)}>
              <Text style={{fontSize: 16, color: 'black'}}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={editDisplayNameModalVisible}
        onRequestClose={() => {
          setEditDisplayNameModalVisible(false);
        }}>
        <View style={styles.editModal}>
          <View style={styles.editModalContent}>
            <Text style={styles.editModalTitle}>Edit Username</Text>
            <TextInput
              placeholder={currentUser?.displayName}
              placeholderTextColor="#757575"
              style={styles.textInput}
              onChangeText={text => setNewDisplayName(text)}
              value={newDisplayName}
            />
            {newDisplayName !== '' ? (
              <TouchableOpacity
                style={styles.updateButton}
                onPress={updateDisplayName}>
                <Text style={{color: 'white', fontSize: 16}}>Update</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={styles.updateButton}
              onPress={() => setEditDisplayNameModalVisible(false)}>
              <Text style={{fontSize: 16, color: 'black'}}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={editBioModalVisible}
        onRequestClose={() => {
          setEditBioModalVisible(false);
        }}>
        <View style={styles.editModal}>
          <View style={styles.editModalContent}>
            <Text style={styles.editModalTitle}>Edit Bio</Text>
            <TextInput
              placeholder={currentUser?.bio}
              placeholderTextColor="#757575"
              style={styles.textInput}
              onChangeText={text => setNewBio(text)}
              value={newBio}
            />
            <TouchableOpacity style={styles.updateButton} onPress={updateBio}>
              <Text style={{color: 'white', fontSize: 16}}>Update</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setEditBioModalVisible(false)}>
              <Text style={{fontSize: 16, color: 'black'}}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <TouchableOpacity
        style={{position: 'relative'}}
        onPress={() => {
          handleCoverPhoto();
        }}>
        <Image
          source={coverPhoto ? {uri: coverPhoto} : defaultCoverImage}
          style={styles.coverPhoto}
        />

        <View style={styles.coverPhotoIconContainer}>
          <Icon
            name="camera"
            size={25}
            color="white"
            style={styles.coverPhotoIcon}
          />
        </View>
      </TouchableOpacity>

      <View style={{flex: 1, alignItems: 'center', position: 'relative'}}>
        {currentUser?.photoURL ? (
          <View style={{position: 'relative'}}>
            <TouchableOpacity
              onPress={() => {
                setModalVisible(true);
              }}>
              <Image
                source={{uri: profilePicture}}
                style={styles.profilePicture}
              />
              <Icon
                name="camera"
                size={25}
                color="white"
                style={styles.profilePictureIcon}
              />
            </TouchableOpacity>
          </View>
        ) : (
          <ActivityIndicator size="small" />
        )}

        <TouchableOpacity
          style={{flexDirection: 'row', alignItems: 'center'}}
          onPress={() => setEditDisplayNameModalVisible(true)}>
          <Text style={styles.username}>{currentUser?.displayName}</Text>
          <Icon
            name="pencil"
            size={20}
            color="#008efe"
            style={styles.editIcon}
          />
        </TouchableOpacity>

        {currentUser?.bio ? (
          <TouchableOpacity
            style={styles.addBioContainer}
            onPress={() => setEditBioModalVisible(true)}>
            <Text style={styles.bioText}>{currentUser?.bio}</Text>
            <Icon
              name="pencil"
              size={16}
              color="#008efe"
              style={styles.editIcon}
            />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={{flexDirection: 'row', alignItems: 'center'}}
            onPress={() => setEditBioModalVisible(true)}>
            <Text
              style={{
                color: '#6E6D88',
              }}>
              Add Bio
            </Text>
            <Icon
              name="plus"
              size={16}
              color="#6E6D88"
              style={styles.pencilIcon}
            />
          </TouchableOpacity>
        )}
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
  },
  coverPhotoIconContainer: {
    position: 'absolute',
    top: 5,
    right: 5,
  },
  coverPhotoIcon: {
    backgroundColor: '#008efe',
    borderRadius: 20,
    padding: 5,
  },
  profilePicture: {
    height: 155,
    width: 155,
    borderRadius: 80,
    borderColor: '#008EFE',
    borderWidth: 2,
    marginTop: -90,
  },
  profilePictureIcon: {
    position: 'absolute',
    bottom: 120,
    right: 10,
    backgroundColor: '#008efe',
    borderRadius: 20,
    padding: 5,
  },
  editIcon: {
    marginLeft: 3,
    marginBottom: 15,
    backgroundColor: 'silver',
    borderRadius: 20,
    padding: 3,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#008efe',
    marginVertical: 10,
  },
  bioText: {
    color: '#6E6D88',
    textAlign: 'center',
  },
  addBioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '70%',
  },
  pencilIcon: {
    marginLeft: 3,
    marginBottom: 5,
    backgroundColor: 'silver',
    borderRadius: 20,
    padding: 3,
  },
  editModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  editModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '80%',
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  editModalTitle: {
    fontSize: 18,
    marginBottom: 20,
    color: '#797979',
  },
  textInput: {
    height: 50,
    borderWidth: 0,
    borderRadius: 20,
    backgroundColor: '#ccc',
    color: 'black',
    width: '100%',
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  updateButton: {
    backgroundColor: '#008efe',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#ccc',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 8,
    marginTop: 10,
  },
});

export default EditProfile;
