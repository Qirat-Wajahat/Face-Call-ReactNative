import {View, Text, StyleSheet, TouchableOpacity, TextInput} from 'react-native';
import React, {useState} from 'react';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Octicons from 'react-native-vector-icons/Octicons';

const VipDialer = () => {
  const [output, setOutput] = useState('');

  const handleDigitPress = num => {
    if (output.length < 11) {
      setOutput(output + num);
    }
  };

  const handleBackspace = () => {
    if (output.length > 0) {
      setOutput(output.slice(0, -1));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Registered</Text>
        <Text style={styles.headerText}>Balance: Unlimited</Text>
      </View>

      <View style={styles.dialerContainer}>
        <View style={styles.dialingPad}>
          <View style={styles.container}>
            
            <View style={styles.output}>
              <TextInput style={styles.outputText} value={output} showSoftInputOnFocus={false}/>
              <Text style={styles.dialerText}>Calling All Over The World!</Text>
            </View>

            <View style={{marginTop: 8}}>
              <View style={styles.row}>
                <TouchableOpacity
                  style={styles.digit}
                  onPress={() => handleDigitPress('1')}>
                  <Text style={styles.digitText}>1</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.digit}
                  onPress={() => handleDigitPress('2')}>
                  <Text style={styles.digitText}>2</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.digit}
                  onPress={() => handleDigitPress('3')}>
                  <Text style={styles.digitText}>3</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.row}>
                <TouchableOpacity
                  style={styles.digit}
                  onPress={() => handleDigitPress('4')}>
                  <Text style={styles.digitText}>4</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.digit}
                  onPress={() => handleDigitPress('5')}>
                  <Text style={styles.digitText}>5</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.digit}
                  onPress={() => handleDigitPress('6')}>
                  <Text style={styles.digitText}>6</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.row}>
                <TouchableOpacity
                  style={styles.digit}
                  onPress={() => handleDigitPress('7')}>
                  <Text style={styles.digitText}>7</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.digit}
                  onPress={() => handleDigitPress('8')}>
                  <Text style={styles.digitText}>8</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.digit}
                  onPress={() => handleDigitPress('9')}>
                  <Text style={styles.digitText}>9</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.row}>
                <TouchableOpacity
                  style={styles.digit}
                  onPress={() => handleDigitPress('*')}>
                  <Text style={styles.digitText}>*</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.digit}
                  onPress={() => handleDigitPress('0')}>
                  <Text style={styles.digitText}>0</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.digit}
                  onPress={() => handleDigitPress('#')}>
                  <Text style={styles.digitText}>#</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.botRow}>
              <TouchableOpacity style={{right: 18}}>
                <Octicons name="person" size={25} color="#0F0F0F" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.callButton}>
                <Icon name="phone" size={20} color="white" />
              </TouchableOpacity>

              <TouchableOpacity style={{left: 25}} onPress={handleBackspace}>
                <Icon name="keyboard-backspace" size={30} color="#0F0F0F" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default VipDialer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerText: {
    color: '#2B2B2B',
    fontWeight: '600',
  },
  dialerContainer: {
    marginTop: '15%',
    alignItems: 'center',
  },
  dialingPad: {
    backgroundColor: 'white',
    width: '70%',
    padding: 20,
    margin: 30,
    height: 420,
    textAlign: 'center',
  },
  output: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center'
  },
  outputText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 'auto',
  },
  digit: {
    margin: 5,
    width: '50%',
    height: '60%',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#D8D8D8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitText: {
    color: '#040404',
    fontSize: 25,
    fontWeight: '500',
  },
  botRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  callButton: {
    backgroundColor: '#51b545',
    padding: 15,
    left: 10,
    borderRadius: 25,
  },
});
