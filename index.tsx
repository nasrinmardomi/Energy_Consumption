import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { BarChart } from "react-native-chart-kit";
import StatusTable from "../../components/StatusTable"; 

interface DeviceData {
  Timestamp: string;
  "Fridge (kWh)": number;
  "Oven (kWh)": number;
  "Lights (kWh)": number;
  "EV Charger (kWh)": number;
}

const App = () => {
  const [chartData, setChartData] = useState<{
    labels: string[];
    datasets: { data: number[] }[];
  }>({
    labels: [],
    datasets: [{ data: [] }],
  });

  const [devicePercentages, setDevicePercentages] = useState({
    "Oven": 0,
    "Fridge": 0,
    "Lights": 0,
    "EV Charger": 0,
  });

  const jsonData: DeviceData[] = require("../../assets/converted_data.json");

  const processConsumptionData = (data: DeviceData[]) => {
    const totalConsumption = {
      "Oven": 0,
      "Fridge": 0,
      "Lights": 0,
      "EV Charger": 0,
    };

    data.forEach((entry) => {
      totalConsumption.Oven += entry["Oven (kWh)"];
      totalConsumption.Fridge += entry["Fridge (kWh)"];
      totalConsumption.Lights += entry["Lights (kWh)"];
      totalConsumption["EV Charger"] += entry["EV Charger (kWh)"];
    });
  
    const total = Object.values(totalConsumption).reduce((a, b) => a + b, 0);
  
    const percentages = {
      Oven: (totalConsumption.Oven / total) * 100,
      Fridge: (totalConsumption.Fridge / total) * 100,
      Lights: (totalConsumption.Lights / total) * 100,
      "EV Charger": (totalConsumption["EV Charger"] / total) * 100,
    };
  
    return percentages;
  };

  useEffect(() => {
    const percentages = processConsumptionData(jsonData);
    setDevicePercentages(percentages);

    const dailyConsumption = jsonData.reduce<Record<string, number>>((acc, entry) => {
      const date = entry.Timestamp.split(" ")[0];
      const total =
        entry["Fridge (kWh)"] +
        entry["Oven (kWh)"] +
        entry["Lights (kWh)"] +
        entry["EV Charger (kWh)"];
      acc[date] = (acc[date] || 0) + total;
      return acc;
    }, {});

    const labels = Object.keys(dailyConsumption).slice(0, 7);
    const dataValues = Object.values(dailyConsumption).slice(0, 7);

    setChartData({ labels, datasets: [{ data: dataValues }] });
  }, []);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff", paddingTop: 60 },
    header: { fontSize: 18, fontWeight: "bold", margin: 20, textAlign: "center" },
    chartContainer: { alignItems: "center", marginBottom: 20 },
    tableContainer: { marginHorizontal: 20, marginBottom: 20 },
    
  });

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Weekly Energy Consumption (kWh)</Text>
        <View style={styles.chartContainer}>
        <BarChart
          data={chartData}
          width={Dimensions.get("window").width - 30}
          height={300}
          yAxisSuffix=" kWh"
          chartConfig={{
            backgroundColor: "#white",
            backgroundGradientFrom: "#white",
            backgroundGradientTo: "#white",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 64, 100, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          }}
          style={{ marginVertical: 0, borderRadius: 16, paddingLeft: 0 }}
          verticalLabelRotation={-90}
          showValuesOnTopOfBars={false} 
          fromZero True
        />
      </View>
      <StatusTable percentages={devicePercentages} />
    </View>
  );
};

export default App;
