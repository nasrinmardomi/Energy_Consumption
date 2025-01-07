import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity } from "react-native";
import { LineChart } from "react-native-chart-kit";

interface DeviceData {
  Timestamp: string;
  "Fridge (kWh)": number;
  "Oven (kWh)": number;
  "Lights (kWh)": number;
  "EV Charger (kWh)": number;
}

const App = () => {
  const [chartData, setChartData] = useState({
    labels: [] as string[],
    datasets: [{ data: [] as number[] }],
  });

  const [devicePercentages, setDevicePercentages] = useState({
    Oven: 0,
    Fridge: 0,
    Lights: 0,
    "EV Charger": 0,
  });

  const [selectedDay, setSelectedDay] = useState<string>("");
  const jsonData: DeviceData[] = require("../../assets/converted_data.json");

  const processOneDayData = (data: DeviceData[], date: string) => {
    const totalConsumption = {
      Oven: 0,
      Fridge: 0,
      Lights: 0,
      "EV Charger": 0,
    };

    const hourlyData: Record<string, number> = {};

    data.forEach(({ Timestamp, ...consumption }) => {
      const [entryDate, time] = Timestamp.split(" ");
      if (entryDate === date) {
        const hour = time.slice(0, 2);
        const total = Object.values(consumption).reduce((sum, value) => sum + value, 0);

        hourlyData[hour] = (hourlyData[hour] || 0) + total;

        Object.entries(consumption).forEach(([key, value]) => {
          totalConsumption[key] += value;
        });
      }
    });

    const total = Object.values(totalConsumption).reduce((a, b) => a + b, 0);
    const percentages = Object.fromEntries(
      Object.entries(totalConsumption).map(([key, value]) => [key, (value / total) * 100])
    );

    return { percentages, hourlyData };
  };

  useEffect(() => {
    const groupedData = jsonData.reduce<Record<string, DeviceData[]>>((acc, { Timestamp }) => {
      const date = Timestamp.split(" ")[0];
      (acc[date] ||= []).push(jsonData);
      return acc;
    }, {});

    setSelectedDay(Object.keys(groupedData)[0]);
  }, []);

  useEffect(() => {
    if (selectedDay) {
      const { percentages, hourlyData } = processOneDayData(jsonData, selectedDay);
      setDevicePercentages(percentages);

      const labels = Object.keys(hourlyData).sort();
      const dataValues = labels.map((hour) => hourlyData[hour]);
      setChartData({ labels, datasets: [{ data: dataValues }] });
    }
  }, [selectedDay]);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff", paddingTop: 60 },
    header: { fontSize: 18, fontWeight: "bold", margin: 20, textAlign: "center" },
    chartContainer: { alignItems: "center", marginBottom: 20 },
    daySelector: { flexDirection: "row", marginBottom: 20, paddingHorizontal: 10 },
    dayItem: { padding: 10, marginHorizontal: 5, borderRadius: 5, backgroundColor: "#f0f0f0" },
    selectedDayItem: { backgroundColor: "rgba(0, 100, 0, 1)" },
    dayText: { fontSize: 14, color: "#000" },
    selectedDayText: { color: "#fff", fontWeight: "bold" },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Daily Energy Consumption (kWh)</Text>

      <FlatList
        horizontal
        data={Object.keys(
          jsonData.reduce<Record<string, boolean>>((acc, { Timestamp }) => {
            acc[Timestamp.split(" ")[0]] = true;
            return acc;
          }, {})
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.dayItem,
              selectedDay === item && styles.selectedDayItem,
            ]}
            onPress={() => setSelectedDay(item)}
          >
            <Text
              style={[
                styles.dayText,
                selectedDay === item && styles.selectedDayText,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.daySelector}
      />

      <View style={styles.chartContainer}>
        <LineChart
          data={chartData}
          width={Dimensions.get("window").width - 40} 
          height={550} 
          yAxisSuffix=" kWh"
          yAxisInterval={1} 
          chartConfig={{
            backgroundColor: "#f9f9f9",
            backgroundGradientFrom: "#f9f9f9",
            backgroundGradientTo: "#f9f9f9",
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(0, 64, 100, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: { borderRadius: 16 },
            propsForDots: {
              r: "4",
              strokeWidth: "2",
              stroke: "#004064",
            },
            propsForLabels: {
              fontSize: 10, 
            },
            propsForBackgroundLines: {
              strokeDasharray: "",
            },
          }}
          style={{
            marginVertical: 8,
            borderRadius: 16,
          }}
          verticalLabelRotation={-45} 
          fromZero 
          bezier 
        />
      </View>
    </View>
  );
};

export default App;
