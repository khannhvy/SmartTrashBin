import { useNavigation, useRoute } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, ScrollView, StyleSheet, Text } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import * as Progress from 'react-native-progress';
import { db, onValue, ref } from '../../firebaseConfig';

interface Bin {
    id: string;
    name: string;
    trashLevel: number;
  }

  
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function TrashLevel() {
  const [level, setLevel] = useState(0);
  const [distance, setDistance] = useState(0);
  const [history, setHistory] = useState([]);
  const route = useRoute();
  const navigation = useNavigation();
  const { binId } = route.params;

  // Yêu cầu quyền thông báo
  useEffect(() => {
    const getPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Thông báo", "Không được cấp quyền gửi thông báo.");
      }
    };
    getPermissions();
  }, []);

  // Lấy dữ liệu từ Firebase
  useEffect(() => {
    const binRef = ref(db, `bins/${binId}`);
  
    console.log("binId from params:", binId);  // In ra binId
  
    const unsubscribe = onValue(binRef, (snapshot) => {
      const data = snapshot.val();
      console.log("Data from Firebase:", data);  // In ra dữ liệu lấy từ Firebase
      if (data) {
        setLevel(data.trashLevel);
        setDistance(data.distanceCm);
        setHistory((prev) => {
          const newData = [...prev, data.trashLevel];
          return newData.length > 10 ? newData.slice(newData.length - 10) : newData;
        });
  
        if (data.trashLevel >= 80) {
          sendNotification(data.trashLevel, binId);  // Gửi thông báo với mức đầy và binId
          //Alert.alert('⚠️ Cảnh báo', 'Thùng rác đã đầy!');
        }
      }
    });
  
    return () => unsubscribe();
  }, [binId]);
  

  // Hàm gửi thông báo cục bộ
  const sendNotification = async (trashLevel: number, binId: string) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🗑️ Thùng rác đầy!",
          body: `Mức đầy: ${trashLevel.toFixed(2)}% - Thùng rác ID: ${binId}`, // Thêm binId vào body
        },
        trigger: null, // Thông báo sẽ xuất hiện ngay lập tức
      });
    } catch (error) {
      console.error("Lỗi khi gửi thông báo:", error);
    }
  };
  

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>📊 Smart Trash Bin</Text>

      {/* Mức đầy hiện tại */}
      <Text style={styles.label}>Mức đầy hiện tại:</Text>
      <Progress.Bar 
        progress={level / 100} 
        width={300} 
        color={level >= 80 ? 'red' : 'green'} 
        borderRadius={10}
        height={20}
      />
      <Text style={styles.levelText}>{level.toFixed(2)}%</Text>

      {/* Khoảng cách cảm biến */}
      <Text style={styles.label}>Khoảng cách cảm biến: {distance.toFixed(2)} cm</Text>

      {/* Lịch sử mức đầy */}
      <Text style={styles.label}>Lịch sử mức đầy:</Text>
      <LineChart
        data={{
          labels: Array(history.length).fill('').map((_, i) => `#${i + 1}`),
          datasets: [{ data: history }],
        }}
        width={Dimensions.get('window').width - 30}
        height={220}
        yAxisSuffix="%"
        chartConfig={{
          backgroundGradientFrom: "#fff",
          backgroundGradientTo: "#f0f0f0",
          decimalPlaces: 1,
          color: (opacity = 1) => `rgba(0, 128, 0, ${opacity})`,
        }}
        style={{ marginVertical: 16, borderRadius: 10 }}
      />

      {level >= 80 && (
        <Text style={styles.warningText}>⚠️ CẢNH BÁO: Thùng rác đã đầy!</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#f4f4f9', 
    flexGrow: 1,
    justifyContent: 'center', 
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#4CAF50', 
    marginBottom: 30, 
    textAlign: 'center', 
  },
  label: {
    fontSize: 20,
    color: '#333',
    marginTop: 25, 
    fontWeight: '500', 
  },
  levelText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 15,
    color: '#333', 
  },
  warningText: {
    color: '#fff',
    backgroundColor: '#F44336', 
    fontWeight: 'bold',
    fontSize: 20,
    padding: 10, 
    borderRadius: 10, 
    marginTop: 20,
    textAlign: 'center',
  },
});
