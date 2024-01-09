import {
  View,
  Text,
  Dimensions,
  Image,
  TouchableOpacity,
  Animated,
} from 'react-native';
import React, {useRef, useState} from 'react';
import {useNavigation} from '@react-navigation/native';

import Icon from 'react-native-vector-icons/Feather';

const ViewStatus = ({route}) => {
  const {user, statusContent} = route.params;

  const {width, height} = Dimensions.get('window');
  const [currentStatus, setCurrentStatus] = useState(0);
  const [statusData, setStatusData] = useState(statusContent);

  const progress = useRef(new Animated.Value(0)).current;

  const navigation = useNavigation();

  function startProgress() {
    Animated.timing(progress, {
      toValue: 1,
      duration: 5000,
      useNativeDriver: false,
    }).start(({finished}) => {
      if (finished) {
        handleNext();
      }
    });
  }

  function handlePrevious() {
    if (currentStatus - 1 >= 0 && statusData[currentStatus - 1]) {
      let data = [...statusData];
      data[currentStatus].finish = 0;
      setStatusData(data);
      setCurrentStatus(currentStatus - 1);
      progress.setValue(0);
    } else {
      close();
    }
  }

  function handleNext() {
    if (currentStatus !== statusData.length - 1) {
      let data = [...statusData];
      data[currentStatus].finish = 1;
      setStatusData(data);
      setCurrentStatus(currentStatus + 1);
      progress.setValue(0);
    } else {
      close();
    }
  }

  function close() {
    progress.setValue(0);
    navigation.navigate('Status');
  }

  return (
    <View style={{flex: 1, backgroundColor: '#000'}}>
      <Image
        source={{uri: statusData[currentStatus].content}}
        onLoadEnd={() => {
          progress.setValue(0);
          startProgress();
        }}
        style={{height, width, resizeMode: 'cover'}}
      />

      <View
        style={{
          height: 50,
          width,
          flexDirection: 'row',
          justifyContent: 'space-between',
          position: 'absolute',
          top: 20,
        }}>
        <View style={{flexDirection: 'row', alignItems: 'center', margin: 10}}>
          <Image
            source={{uri: user.photoURL}}
            style={{height: 40, width: 40, borderRadius: 20, marginRight: 8}}
          />
          <Text style={{fontSize: 18, fontWeight: '700'}}>
            {user.displayName}
          </Text>
        </View>

        <TouchableOpacity
          style={{
            height: 40,
            width: 40,
            borderRadius: 20,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(25, 25, 25,.5)',
            marginRight: 10,
            zIndex: 1,
          }}
          onPress={() => {
            navigation.navigate('Status');
          }}>
          <Icon name="x" size={25} color="white" />
        </TouchableOpacity>
      </View>

      {statusData[currentStatus].caption ? (
        <View
          style={{
            flex: 1,
            height: '8%',
            width,
            position: 'absolute',
            bottom: 25,
            backgroundColor: 'rgba(25, 25, 25, .5)',
          }}>
          <Text
            style={{
              color: 'white',
              fontSize: 20,
              textAlign: 'center',
              marginTop: 10,
            }}>
            {statusData[currentStatus].caption}
          </Text>
        </View>
      ) : null}

      <View
        style={{
          width,
          position: 'absolute',
          top: 10,
          flexDirection: 'row',
          justifyContent: 'space-evenly',
          alignItems: 'center',
        }}>
        {statusData.map((index, key) => {
          return (
            <View
              key={key}
              style={{
                height: 2,
                flex: 1,
                flexDirection: 'row',
                backgroundColor: 'rgba(117, 117, 117, 0.5)',
                marginHorizontal: 2,
              }}>
              <Animated.View
                style={{
                  flex:
                    currentStatus == key ? progress : statusData[key].finish,
                  height: 2,
                  backgroundColor: 'rgba(255, 255, 255, 1)',
                }}
              />
            </View>
          );
        })}
      </View>

      <View
        style={{
          height,
          width,
          position: 'absolute',
          top: 0,
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}>
        <TouchableOpacity
          style={{height: '100%', width: '30%'}}
          onPress={() => handlePrevious()}></TouchableOpacity>

        <TouchableOpacity
          style={{height: '100%', width: '30%'}}
          onPress={() => handleNext()}></TouchableOpacity>
      </View>
    </View>
  );
};

export default ViewStatus;
