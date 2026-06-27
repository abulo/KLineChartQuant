<template>
  <div class="app-container" :data-theme="currentTheme">
    <KLineChart
      v-model:is-fullscreen="isFullscreen"
      v-model:theme="currentTheme"
      :custom-data="customData"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { CustomDataSource, KLineChart, KLineData } from '@363045841yyt/klinechart'

const isFullscreen = ref(false)
const currentTheme = ref<'light' | 'dark'>('dark')

const customData = ref<CustomDataSource>()

const DEMO_MAIN_DATA: KLineData[] = [
  {
    timestamp: 1748736000000,
    date: '2025-06-01',
    open: 30.0,
    high: 32.0,
    low: 30.0,
    close: 31.5,
    volume: 1500000,
  },
  {
    timestamp: 1748822400000,
    date: '2025-06-02',
    open: 31.5,
    high: 33.2,
    low: 31.2,
    close: 33.0,
    volume: 2100000,
  },
  {
    timestamp: 1748908800000,
    date: '2025-06-03',
    open: 33.0,
    high: 33.5,
    low: 31.8,
    close: 32.1,
    volume: 1800000,
  },
  {
    timestamp: 1748995200000,
    date: '2025-06-04',
    open: 32.1,
    high: 32.8,
    low: 31.0,
    close: 31.2,
    volume: 1200000,
  },
  {
    timestamp: 1749081600000,
    date: '2025-06-05',
    open: 31.2,
    high: 31.5,
    low: 29.8,
    close: 30.0,
    volume: 900000,
  },
  {
    timestamp: 1749168000000,
    date: '2025-06-06',
    open: 30.0,
    high: 31.0,
    low: 29.5,
    close: 30.8,
    volume: 1350000,
  },
  {
    timestamp: 1749254400000,
    date: '2025-06-07',
    open: 30.8,
    high: 32.4,
    low: 30.6,
    close: 32.2,
    volume: 1700000,
  },
  {
    timestamp: 1749340800000,
    date: '2025-06-08',
    open: 32.2,
    high: 34.0,
    low: 32.0,
    close: 33.8,
    volume: 2200000,
  },
  {
    timestamp: 1749427200000,
    date: '2025-06-09',
    open: 33.8,
    high: 35.5,
    low: 33.5,
    close: 35.0,
    volume: 2600000,
  },
  {
    timestamp: 1749513600000,
    date: '2025-06-10',
    open: 35.0,
    high: 35.2,
    low: 33.6,
    close: 33.8,
    volume: 1900000,
  },
  {
    timestamp: 1749600000000,
    date: '2025-06-11',
    open: 33.8,
    high: 34.5,
    low: 33.0,
    close: 34.2,
    volume: 1550000,
  },
  {
    timestamp: 1749686400000,
    date: '2025-06-12',
    open: 34.2,
    high: 36.0,
    low: 34.0,
    close: 35.6,
    volume: 2400000,
  },
  {
    timestamp: 1749772800000,
    date: '2025-06-13',
    open: 35.6,
    high: 36.5,
    low: 35.0,
    close: 36.2,
    volume: 2800000,
  },
  {
    timestamp: 1749859200000,
    date: '2025-06-14',
    open: 36.2,
    high: 36.8,
    low: 35.2,
    close: 35.5,
    volume: 2000000,
  },
  {
    timestamp: 1749945600000,
    date: '2025-06-15',
    open: 35.5,
    high: 36.0,
    low: 34.5,
    close: 35.8,
    volume: 1600000,
  },
]

/** 硬编码演示数据：对比商品 COMP.A（15 根日 K，偏弱走势） */
const DEMO_COMP_A_DATA: KLineData[] = [
  {
    timestamp: 1748736000000,
    date: '2025-06-01',
    open: 28.0,
    high: 29.5,
    low: 27.8,
    close: 29.0,
    volume: 800000,
  },
  {
    timestamp: 1748822400000,
    date: '2025-06-02',
    open: 29.0,
    high: 29.2,
    low: 27.5,
    close: 27.8,
    volume: 950000,
  },
  {
    timestamp: 1748908800000,
    date: '2025-06-03',
    open: 27.8,
    high: 28.5,
    low: 26.8,
    close: 27.0,
    volume: 720000,
  },
  {
    timestamp: 1748995200000,
    date: '2025-06-04',
    open: 27.0,
    high: 27.2,
    low: 25.5,
    close: 25.8,
    volume: 1100000,
  },
  {
    timestamp: 1749081600000,
    date: '2025-06-05',
    open: 25.8,
    high: 26.5,
    low: 25.0,
    close: 25.2,
    volume: 680000,
  },
  {
    timestamp: 1749168000000,
    date: '2025-06-06',
    open: 25.2,
    high: 26.0,
    low: 24.8,
    close: 25.6,
    volume: 840000,
  },
  {
    timestamp: 1749254400000,
    date: '2025-06-07',
    open: 25.6,
    high: 26.8,
    low: 25.4,
    close: 26.5,
    volume: 920000,
  },
  {
    timestamp: 1749340800000,
    date: '2025-06-08',
    open: 26.5,
    high: 27.5,
    low: 26.2,
    close: 27.3,
    volume: 1050000,
  },
  {
    timestamp: 1749427200000,
    date: '2025-06-09',
    open: 27.3,
    high: 28.0,
    low: 26.8,
    close: 27.0,
    volume: 780000,
  },
  {
    timestamp: 1749513600000,
    date: '2025-06-10',
    open: 27.0,
    high: 27.2,
    low: 25.8,
    close: 26.1,
    volume: 890000,
  },
  {
    timestamp: 1749600000000,
    date: '2025-06-11',
    open: 26.1,
    high: 26.5,
    low: 25.0,
    close: 25.2,
    volume: 760000,
  },
  {
    timestamp: 1749686400000,
    date: '2025-06-12',
    open: 25.2,
    high: 25.8,
    low: 24.0,
    close: 24.5,
    volume: 1300000,
  },
  {
    timestamp: 1749772800000,
    date: '2025-06-13',
    open: 24.5,
    high: 25.6,
    low: 24.2,
    close: 25.4,
    volume: 960000,
  },
  {
    timestamp: 1749859200000,
    date: '2025-06-14',
    open: 25.4,
    high: 26.5,
    low: 25.0,
    close: 26.2,
    volume: 1120000,
  },
  {
    timestamp: 1749945600000,
    date: '2025-06-15',
    open: 26.2,
    high: 27.0,
    low: 25.8,
    close: 26.8,
    volume: 840000,
  },
]

/** 硬编码演示数据：对比商品 COMP.B（15 根日 K，偏强走势） */
const DEMO_COMP_B_DATA: KLineData[] = [
  {
    timestamp: 1748736000000,
    date: '2025-06-01',
    open: 35.0,
    high: 36.5,
    low: 34.8,
    close: 36.0,
    volume: 1800000,
  },
  {
    timestamp: 1748822400000,
    date: '2025-06-02',
    open: 36.0,
    high: 37.2,
    low: 35.5,
    close: 37.0,
    volume: 2200000,
  },
  {
    timestamp: 1748908800000,
    date: '2025-06-03',
    open: 37.0,
    high: 38.0,
    low: 36.2,
    close: 36.5,
    volume: 1950000,
  },
  {
    timestamp: 1748995200000,
    date: '2025-06-04',
    open: 36.5,
    high: 37.5,
    low: 35.8,
    close: 37.2,
    volume: 1650000,
  },
  {
    timestamp: 1749081600000,
    date: '2025-06-05',
    open: 37.2,
    high: 39.0,
    low: 37.0,
    close: 38.5,
    volume: 2500000,
  },
  {
    timestamp: 1749168000000,
    date: '2025-06-06',
    open: 38.5,
    high: 40.0,
    low: 38.2,
    close: 39.8,
    volume: 2800000,
  },
  {
    timestamp: 1749254400000,
    date: '2025-06-07',
    open: 39.8,
    high: 41.5,
    low: 39.5,
    close: 41.0,
    volume: 3100000,
  },
  {
    timestamp: 1749340800000,
    date: '2025-06-08',
    open: 41.0,
    high: 41.2,
    low: 39.0,
    close: 39.5,
    volume: 2400000,
  },
  {
    timestamp: 1749427200000,
    date: '2025-06-09',
    open: 39.5,
    high: 40.0,
    low: 38.0,
    close: 38.5,
    volume: 2100000,
  },
  {
    timestamp: 1749513600000,
    date: '2025-06-10',
    open: 38.5,
    high: 39.5,
    low: 37.5,
    close: 39.0,
    volume: 1750000,
  },
  {
    timestamp: 1749600000000,
    date: '2025-06-11',
    open: 39.0,
    high: 40.8,
    low: 38.5,
    close: 40.5,
    volume: 2300000,
  },
  {
    timestamp: 1749686400000,
    date: '2025-06-12',
    open: 40.5,
    high: 42.0,
    low: 40.0,
    close: 41.5,
    volume: 2900000,
  },
  {
    timestamp: 1749772800000,
    date: '2025-06-13',
    open: 41.5,
    high: 43.5,
    low: 41.0,
    close: 43.0,
    volume: 3400000,
  },
  {
    timestamp: 1749859200000,
    date: '2025-06-14',
    open: 43.0,
    high: 43.5,
    low: 41.5,
    close: 42.0,
    volume: 2600000,
  },
  {
    timestamp: 1749945600000,
    date: '2025-06-15',
    open: 42.0,
    high: 42.5,
    low: 40.5,
    close: 41.2,
    volume: 1900000,
  },
]

customData.value = {
  symbol: 'CUSTOM.DEMO',
  period: 'daily',
  data: DEMO_MAIN_DATA,
  comparisons: {
    'COMP.A': DEMO_COMP_A_DATA,
    'COMP.B': DEMO_COMP_B_DATA,
  },
}
</script>

<style>
body {
  margin: 0;
}

.app-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-container[data-theme='dark'] {
  background: #000;
  color: #e5e7eb;
}
</style>
