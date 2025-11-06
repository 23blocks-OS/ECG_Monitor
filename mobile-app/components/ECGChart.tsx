import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Colors } from '@/constants/Colors';

interface ECGChartProps {
  title: string;
  data: number[];
  color: string;
}

const screenWidth = Dimensions.get('window').width;

export function ECGChart({ title, data, color }: ECGChartProps) {
  // Normalize data for chart
  const normalizedData = data.length > 0 ? data : Array(50).fill(0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chartContainer}>
        <LineChart
          data={{
            labels: [],
            datasets: [
              {
                data: normalizedData,
                color: (opacity = 1) => color,
                strokeWidth: 2,
              },
            ],
          }}
          width={screenWidth - 48}
          height={180}
          chartConfig={{
            backgroundColor: Colors.dark.surface,
            backgroundGradientFrom: Colors.dark.surface,
            backgroundGradientTo: Colors.dark.surface,
            decimalPlaces: 0,
            color: (opacity = 1) => color,
            labelColor: (opacity = 1) => Colors.dark.textSecondary,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '0',
            },
            propsForBackgroundLines: {
              strokeDasharray: '5,5',
              stroke: Colors.dark.border,
              strokeWidth: 1,
            },
          }}
          bezier
          style={styles.chart}
          withHorizontalLabels={false}
          withVerticalLabels={false}
          withDots={false}
          withInnerLines={true}
          withOuterLines={false}
          withShadow={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 8,
    paddingLeft: 4,
  },
  chartContainer: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    overflow: 'hidden',
    backgroundColor: Colors.dark.surface,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});
