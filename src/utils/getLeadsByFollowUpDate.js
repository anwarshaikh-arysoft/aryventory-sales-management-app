import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from '../config';

export const getLeadsByFollowUpDate = async (page = 1, perPage = 5) => {
  try {
    const token = await AsyncStorage.getItem('token'); // If using Sanctum/JWT
    const response = await axios.get(
      `${BASE_URL}/sales-executive/leads-by-follow-up?page=${page}&per_page=${perPage}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      }
    );
    return response.data; // Laravel pagination object
  } catch (error) {
    console.error('Error fetching leads:', error.response?.data || error.message);
    throw error;
  }
};
