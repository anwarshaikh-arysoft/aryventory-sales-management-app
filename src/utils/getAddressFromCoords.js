// import axios from 'axios';

// /**
//  * Get address from coordinates string.
//  * @param {string} coordsString - Coordinates in "lat,lng" format.
//  * @returns {Promise<string|null>} - The address or null if not found.
//  */
// export async function getAddressFromCoords(coordsString) {
//   try {
//     if (!coordsString) return null;

//     const [lat, lng] = coordsString.split(',').map(c => c.trim());

//     if (!lat || !lng) {
//       throw new Error('Invalid coordinates format. Expected "lat,lng"');
//     }

//     const res = await axios.get('https://nominatim.openstreetmap.org/reverse', {
//       params: {
//         lat,
//         lon: lng,
//         format: 'json',
//       },
//       headers: {
//         'User-Agent': 'aryventorysalesapp/1.0 (anwar.shaikh@ary-soft.com)', // required
//         'Accept-Language': 'en', // optional (set preferred language)
//       },
//     });

//     return {address : res.data.display_name, postalCode: res.data.address.postcode}  || null;
//   } catch (err) {
//     console.error('Error fetching address:', err.message);
//     return null;
//   }
// }


import axios from 'axios';

/**
 * Get address from coordinates using Google Maps Geocoding API
 * @param {string} coordsString - Coordinates in "lat,lng" format
 * @param {string} apiKey - Your Google Maps API key
 * @returns {Promise<string|null>} - The formatted address or null if not found
 */
export async function getAddressFromCoords(coordsString) {
  try {
    const apiKey = 'AIzaSyD3c8kpPb9cHrN8JMmQogfM4PSAb4wV4N4';
    if (!coordsString) return null;

    const [lat, lng] = coordsString.split(',').map(c => c.trim());

    if (!lat || !lng) {
      throw new Error('Invalid coordinates format. Expected "lat,lng"');
    }

    const res = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json`,
      {
        params: {
          latlng: `${lat},${lng}`,
          key: apiKey,
        },
      }
    );

    if (res.data.status === 'OK' && res.data.results.length > 0) {

      const pc = res.data.results[0].address_components.find(ac =>
        Array.isArray(ac.types) && ac.types.includes('postal_code')
      );
      const postalCode = pc ? pc.long_name : '';     
      return {address : res.data.results[0].formatted_address, postalCode: postalCode}  || null;
    } else {
      console.warn('Google Maps API error:', res.data.status);
      return null;
    }
  } catch (err) {
    console.error('Error fetching address:', err.message);
    return null;
  }
}
