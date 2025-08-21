import MapView from 'react-native-maps';

export default function LocationPicker({ onSelect }) {
  const [region, setRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [marker, setMarker] = useState(null);

  return (
    <MapView
      style={{ flex: 1 }}
      region={region}
      onPress={(e) => {
        const { latitude, longitude } = e.nativeEvent.coordinate;
        setMarker({ latitude, longitude });
        onSelect(`${latitude},${longitude}`); // update formData
      }}
    >
      {marker && <Marker coordinate={marker} />}
    </MapView>
  );
}


// import { View, StyleSheet } from "react-native";
// import { MapView, Marker } from "expo-maps";

// export default function LocationPicker({ location }) {
//   return (
//     <View style={styles.container}>
//       <MapView
//         style={styles.map}
//         initialCamera={{
//           center: {
//             latitude: location?.latitude || 37.78825,
//             longitude: location?.longitude || -122.4324,
//           },
//           zoom: 14,
//         }}
//       >
//         {location && (
//           <Marker
//             coordinate={{
//               latitude: location.latitude,
//               longitude: location.longitude,
//             }}
//             title="You are here"
//           />
//         )}
//       </MapView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   map: {
//     flex: 1,
//   },
// });
