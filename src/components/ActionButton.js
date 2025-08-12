import { Text, View, StyleSheet, Pressable, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import Icon from 'react-native-vector-icons/Feather';

export default function ActionButton({ active, action, text }) {
  const { colors, typography } = useTheme();

  const onPressHandler = active
    ? action
    : () => console.log('Please enter details first');

  // const backgroundColor = active ? colors.primary : colors.primaryLight;
  const backgroundColor = active ? '#000' : '#BDBDBD';

  return (
    <View style={styles.container}>
       <TouchableOpacity style={[styles.signInButton, {backgroundColor}]} onPress={onPressHandler}>        
        <Text style={styles.signInText}>{text}</Text>
        <Icon name="arrow-right" size={18} color="#fff" style={styles.signInIcon} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInButton: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: '#000',
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginTop: 10,
  },
  signInText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  signInIcon: {
    marginLeft: 10,
  },
});
