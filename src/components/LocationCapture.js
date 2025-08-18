// components/LocationCapture.js
import React, { useState, useEffect } from "react";
import { View, Button, Text, Alert } from "react-native";
import * as Location from "expo-location";

export default function LocationCapture({ onCapture }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    (async () => {
      const status = await Location.requestForegroundPermissionsAsync();
      setHasPermission(status.status === "granted");
    })();
  }, []);

  const getLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({});
      setCoords(location.coords);
      if (onCapture) onCapture(location.coords);
    } catch {
      Alert.alert("Error", "Could not fetch location");
    }
  };

  if (hasPermission === null) return null;
  if (!hasPermission) return <Text>No location permission</Text>;

  return (
    <View>
      <Button title="Get Location" onPress={getLocation} />
      {coords && (
        <Text>
          Lat: {coords.latitude}, Lon: {coords.longitude}
        </Text>
      )}
    </View>
  );
}
