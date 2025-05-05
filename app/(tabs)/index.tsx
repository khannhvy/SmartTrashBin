import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useState } from 'react';
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db, onValue, ref } from '../../firebaseConfig';


interface Bin {
  id: string;
  name: string;
  trashLevel: number;
}

// Thiết lập xử lý thông báo
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});


export default function TrashBinListScreen() {
  const [bins, setBins] = useState<Bin[]>([]);
  const navigation = useNavigation();

  // Hàm gửi thông báo
  const sendNotification = async (trashLevel: number, binId: string) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🗑️ Cảnh báo đầy thùng rác",
          body: `Mức đầy: ${trashLevel.toFixed(2)}% - Thùng ID: ${binId}`,
        },
        trigger: null, // Gửi ngay lập tức
      });
    } catch (error) {
      console.error("Lỗi gửi thông báo:", error);
    }
  };

  // const sendNotificationReminder = async (trashLevel: number, binId: string) => {
  //   setTimeout(() => {
  //     sendNotification(trashLevel, binId);
  //   }, 15000); // Gửi sau 15 giây
  // };

  useEffect(() => {
    const binsRef = ref(db, 'bins'); 
    const unsubscribe = onValue(binsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const binList = Object.keys(data).map((key) => {
          const level = data[key].trashLevel || 0;
          const binId = key;

          // Gửi thông báo nếu mức đầy >= 80
          if (level >= 80) {
            sendNotification(level, binId);
           // sendNotificationReminder(level, binId);
          }

          return {
            id: key,
            name: data[key].name || key,
            trashLevel: level,
          };
        });
        setBins(binList);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSelectBin = (bin:string) => {
    navigation.navigate('TrashLevel', { binId: bin.id });
  };

  const getBinColor = (trashLevel: number) => {
    if (trashLevel < 30.0) return '#4CAF50';
    else if (trashLevel < 80.0) return '#FFEB3B';
    else return '#F44336';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📍 Danh sách Thùng rác</Text>
      <FlatList
        data={bins}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.gridContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.binItem, { backgroundColor: getBinColor(item.trashLevel) }]}
            onPress={() => handleSelectBin(item)}
          >
            <Text style={styles.binName}>{item.name}</Text>
            <Text style={styles.trashLevelText}>
              {item.trashLevel !== undefined ? item.trashLevel.toFixed(2) : 'N/A'}%
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const screenWidth = Dimensions.get('window').width;
const itemSize = (screenWidth - 60) / 2;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 10,
    paddingTop: 60,
  },
  gridContainer: {
    justifyContent: 'center',
  },
  binItem: {
    width: itemSize,
    height: itemSize,
    margin: 10,
    borderRadius: 16,
    elevation: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  binName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  trashLevelText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginTop: 5,
  },
});
