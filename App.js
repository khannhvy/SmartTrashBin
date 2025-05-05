import * as Notifications from 'expo-notifications';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, ScrollView, StyleSheet, Text } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import * as Progress from 'react-native-progress';
import { db, onValue, ref } from '../../firebaseConfig';

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
    const binRef = ref(db, 'bins/bin001');

    const unsubscribe = onValue(binRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setLevel(data.trashLevel);
        setDistance(data.distanceCm);

        // Lưu lịch sử mức đầy
        setHistory((prev) => {
          const newData = [...prev, data.trashLevel];
          return newData.length > 10 ? newData.slice(newData.length - 10) : newData;
        });

        // Gửi thông báo nếu thùng rác đầy
        if (data.trashLevel >= 80) {
          sendNotification(data.trashLevel);  // Gửi thông báo cục bộ khi thùng rác đầy
          Alert.alert('⚠️ Cảnh báo', 'Thùng rác đã đầy!');
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Hàm gửi thông báo cục bộ
  const sendNotification = async (trashLevel) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🗑️ Thùng rác đầy!",
          body: `Mức đầy: ${trashLevel.toFixed(1)}%`,
        },
        trigger: null, // Thông báo sẽ xuất hiện ngay lập tức
      });
    } catch (error) {
      console.error("Lỗi khi gửi thông báo:", error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>📊 Smart Trash Bin Dashboard</Text>

      {/* Mức đầy hiện tại */}
      <Text style={styles.label}>Mức đầy hiện tại:</Text>
      <Progress.Bar 
        progress={level / 100} 
        width={300} 
        color={level >= 80 ? 'red' : 'green'} 
        borderRadius={10}
        height={20}
      />
      <Text style={styles.levelText}>{level.toFixed(1)}%</Text>

      {/* Khoảng cách cảm biến */}
      <Text style={styles.label}>Khoảng cách cảm biến: {distance.toFixed(1)} cm</Text>

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
       {/* <Button
        title="Xem Bản đồ Thùng rác"
        onPress={() => navigation.navigate('TrashMap')}
      /> */}
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
  progressBar: {
    marginVertical: 20,
    borderRadius: 10, 
    height: 20, 
    width: '90%', 
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
  chartContainer: {
    marginVertical: 30, 
    borderRadius: 12, 
    overflow: 'hidden', 
  },
});

