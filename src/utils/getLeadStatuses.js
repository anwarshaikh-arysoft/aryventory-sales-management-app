import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from '../config';

export default async function getLeadStatuses() {
  const token = await AsyncStorage.getItem('token');
  const response = await axios.get(`${BASE_URL}/lead-statuses`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data.data;
}