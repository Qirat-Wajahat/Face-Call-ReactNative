import { View, Text } from 'react-native'
import React from 'react'

const RecordVoiceMessage = () => {
  return (
    <View>
      <Text>recordVoiceMessage</Text>
    </View>
  )
}

export default RecordVoiceMessage


// import React, {useState, useEffect} from 'react';
// import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
// import AudioRecorderPlayer, {
//   AudioEncoderAndroidType,
//   AudioSourceAndroidType,
//   OutputFormatAndroidType,
// } from 'react-native-audio-recorder-player';
// import Sound from 'react-native-sound';

// const RecordVoiceMessage = () => {
//   const [recording, setRecording] = useState(false);
//   const [playing, setPlaying] = useState(false);
//   const [recordSecs, setRecordSecs] = useState(0);
//   const [recordTime, setRecordTime] = useState('00:00:00');
//   const [sound, setSound] = useState(null);
//   const [path, setPath] = useState('');
//   const [previewing, setPreviewing] = useState(false);

//   const audioRecorderPlayer = new AudioRecorderPlayer();
//   audioRecorderPlayer.setSubscriptionDuration(0.1);

//   useEffect(() => {
//     return () => {
//       audioRecorderPlayer.stopRecorder();
//       audioRecorderPlayer.removeRecordBackListener();
//       if (sound) {
//         sound.stop();
//         sound.release();
//       }
//     };
//   }, [audioRecorderPlayer, sound]);

//   const loadSound = () => {
//     setSound(
//       new Sound(path, Sound.MAIN_BUNDLE, error => {
//         if (error) {
//           console.log('Error loading sound:', error);
//         }
//       }),
//     );
//   };

//   const onPreviewSound = () => {
//     if (!sound && path) {
//       loadSound();
//     }
//     if (sound) {
//       sound.play(success => {
//         if (success) {
//           console.log('Sound played successfully');
//           setPreviewing(true);
//         } else {
//           console.log('Failed to play the sound');
//           setPreviewing(false);
//         }
//       });
//     }
//   };

//   const onStartRecord = async () => {
//     try {
//       const audioSet = {
//         AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
//         AudioSourceAndroid: AudioSourceAndroidType.MIC,
//         OutputFormatAndroid: OutputFormatAndroidType.AAC_ADTS,
//       };

//       setRecording(true);

//       const uri = await audioRecorderPlayer.startRecorder(null, audioSet);

//       if (!uri) {
//         throw new Error('URI not available');
//       }

//       console.log('Recording started with URI:', uri);
//       setPath(uri); // Update the path dynamically

//       audioRecorderPlayer.addRecordBackListener(e => {
//         setRecordSecs(e.currentPosition);
//         setRecordTime(
//           audioRecorderPlayer.mmssss(Math.floor(e.currentPosition)),
//         );
//       });
//     } catch (err) {
//       console.error('Error starting recording:', err);
//     }
//   };

//   const onStopRecord = async () => {
//     try {
//       const result = await audioRecorderPlayer.stopRecorder();
//       audioRecorderPlayer.removeRecordBackListener();
//       setRecording(false);
//       setRecordSecs(0);
//       console.log('Recording stopped');
//     } catch (err) {
//       console.error('Error stopping recording:', err);
//     }
//   };

//   return (
//     <View style={styles.container}>
//     {/* Buttons for recording and previewing */}
//     <TouchableOpacity
//       style={recording ? styles.stopButton : styles.startButton}
//       onPress={recording ? onStopRecord : onStartRecord}>
//       <Text style={styles.buttonText}>
//         {recording ? 'Stop Recording' : 'Start Recording'}
//       </Text>
//     </TouchableOpacity>
//     <TouchableOpacity
//       style={styles.startButton}
//       onPress={!previewing ? onPreviewSound : null}>
//       <Text style={styles.buttonText}>
//         {!previewing ? 'Preview Audio' : 'Stop Preview'}
//       </Text>
//     </TouchableOpacity>
//     {/* Display recorded time */}
//     <Text style={styles.recordTime}>{recordTime}</Text>
//   </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   startButton: {
//     backgroundColor: 'green',
//     padding: 20,
//     borderRadius: 10,
//   },
//   stopButton: {
//     backgroundColor: 'red',
//     padding: 20,
//     borderRadius: 10,
//   },
//   buttonText: {
//     fontSize: 18,
//     color: 'white',
//     fontWeight: 'bold',
//   },
//   recordTime: {
//     marginTop: 20,
//     fontSize: 20,
//   },
// });

// export default RecordVoiceMessage;
