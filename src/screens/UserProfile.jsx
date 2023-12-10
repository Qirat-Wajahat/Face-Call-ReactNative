import {View, Text, Image, StyleSheet} from 'react-native';
import React, {useState} from 'react';

import defaultCoverImage from '../assets/defaultCoverImage.jpg';
import defaultUser from '../assets/defaultUser.jpg';

const UserProfile = ({route}) => {
  const {username, profilePicture, userBio, coverPhoto} = route.params;

  return (
    <View
      style={styles.container}>
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

        <Text
          style={styles.username}>
          {username}
        </Text>
        <Text
          style={styles.bioText}>
          {userBio}
        </Text>
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
});

export default UserProfile;
