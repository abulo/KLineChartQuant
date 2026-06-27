<template>
  <div class="app-container" :data-theme="currentTheme">
    <DebugControls
      :custom-data-active="useCustomData"
      :theme="currentTheme"
      @open-modal="showModal = true"
      @toggle-embed-size="toggleEmbedSize"
      @toggle-custom-data="onToggleCustomData"
    />

    <!-- 嵌入场景：模拟组件库在父容器中的使用 -->
    <KLineChart
      ref="chartRef"
      :mcp="mcpConfig"
      :left-axis-width="60"
      :custom-data="customData"
      v-model:is-fullscreen="isFullscreen"
      v-model:theme="currentTheme"
      :style="{ width: embedWidth, height: embedHeight }"
    />

    <!-- Modal 场景 -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
          <div class="modal-container">
            <header class="modal-header">
              <span>K线图 Modal 测试</span>
              <button class="close-btn" @click="showModal = false">×</button>
            </header>
            <div class="modal-body">
              <KLineChart v-model:theme="currentTheme" />
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import KLineChart from '../src/components/KLineChart.vue'
import DebugControls from './DebugControls.vue'

import { type KLineData, type CustomDataSource } from '@363045841yyt/klinechart-core/controllers'
import { executeTool } from '@363045841yyt/klinechart-ai-runtime'

/** 硬编码演示数据：主品种 CUSTOM.DEMO（15 根日 K） */
const DEMO_MAIN_DATA: KLineData[] = [
  { timestamp: 1748736000000, date: '2025-06-01', open: 30.00, high: 32.00, low: 30.00, close: 31.50, volume: 1500000 },
  { timestamp: 1748822400000, date: '2025-06-02', open: 31.50, high: 33.20, low: 31.20, close: 33.00, volume: 2100000 },
  { timestamp: 1748908800000, date: '2025-06-03', open: 33.00, high: 33.50, low: 31.80, close: 32.10, volume: 1800000 },
  { timestamp: 1748995200000, date: '2025-06-04', open: 32.10, high: 32.80, low: 31.00, close: 31.20, volume: 1200000 },
  { timestamp: 1749081600000, date: '2025-06-05', open: 31.20, high: 31.50, low: 29.80, close: 30.00, volume: 900000 },
  { timestamp: 1749168000000, date: '2025-06-06', open: 30.00, high: 31.00, low: 29.50, close: 30.80, volume: 1350000 },
  { timestamp: 1749254400000, date: '2025-06-07', open: 30.80, high: 32.40, low: 30.60, close: 32.20, volume: 1700000 },
  { timestamp: 1749340800000, date: '2025-06-08', open: 32.20, high: 34.00, low: 32.00, close: 33.80, volume: 2200000 },
  { timestamp: 1749427200000, date: '2025-06-09', open: 33.80, high: 35.50, low: 33.50, close: 35.00, volume: 2600000 },
  { timestamp: 1749513600000, date: '2025-06-10', open: 35.00, high: 35.20, low: 33.60, close: 33.80, volume: 1900000 },
  { timestamp: 1749600000000, date: '2025-06-11', open: 33.80, high: 34.50, low: 33.00, close: 34.20, volume: 1550000 },
  { timestamp: 1749686400000, date: '2025-06-12', open: 34.20, high: 36.00, low: 34.00, close: 35.60, volume: 2400000 },
  { timestamp: 1749772800000, date: '2025-06-13', open: 35.60, high: 36.50, low: 35.00, close: 36.20, volume: 2800000 },
  { timestamp: 1749859200000, date: '2025-06-14', open: 36.20, high: 36.80, low: 35.20, close: 35.50, volume: 2000000 },
  { timestamp: 1749945600000, date: '2025-06-15', open: 35.50, high: 36.00, low: 34.50, close: 35.80, volume: 1600000 },
]

/** 硬编码演示数据：对比商品 COMP.A（15 根日 K，偏弱走势） */
const DEMO_COMP_A_DATA: KLineData[] = [
  { timestamp: 1748736000000, date: '2025-06-01', open: 28.00, high: 29.50, low: 27.80, close: 29.00, volume: 800000 },
  { timestamp: 1748822400000, date: '2025-06-02', open: 29.00, high: 29.20, low: 27.50, close: 27.80, volume: 950000 },
  { timestamp: 1748908800000, date: '2025-06-03', open: 27.80, high: 28.50, low: 26.80, close: 27.00, volume: 720000 },
  { timestamp: 1748995200000, date: '2025-06-04', open: 27.00, high: 27.20, low: 25.50, close: 25.80, volume: 1100000 },
  { timestamp: 1749081600000, date: '2025-06-05', open: 25.80, high: 26.50, low: 25.00, close: 25.20, volume: 680000 },
  { timestamp: 1749168000000, date: '2025-06-06', open: 25.20, high: 26.00, low: 24.80, close: 25.60, volume: 840000 },
  { timestamp: 1749254400000, date: '2025-06-07', open: 25.60, high: 26.80, low: 25.40, close: 26.50, volume: 920000 },
  { timestamp: 1749340800000, date: '2025-06-08', open: 26.50, high: 27.50, low: 26.20, close: 27.30, volume: 1050000 },
  { timestamp: 1749427200000, date: '2025-06-09', open: 27.30, high: 28.00, low: 26.80, close: 27.00, volume: 780000 },
  { timestamp: 1749513600000, date: '2025-06-10', open: 27.00, high: 27.20, low: 25.80, close: 26.10, volume: 890000 },
  { timestamp: 1749600000000, date: '2025-06-11', open: 26.10, high: 26.50, low: 25.00, close: 25.20, volume: 760000 },
  { timestamp: 1749686400000, date: '2025-06-12', open: 25.20, high: 25.80, low: 24.00, close: 24.50, volume: 1300000 },
  { timestamp: 1749772800000, date: '2025-06-13', open: 24.50, high: 25.60, low: 24.20, close: 25.40, volume: 960000 },
  { timestamp: 1749859200000, date: '2025-06-14', open: 25.40, high: 26.50, low: 25.00, close: 26.20, volume: 1120000 },
  { timestamp: 1749945600000, date: '2025-06-15', open: 26.20, high: 27.00, low: 25.80, close: 26.80, volume: 840000 },
]

/** 硬编码演示数据：对比商品 COMP.B（15 根日 K，偏强走势） */
const DEMO_COMP_B_DATA: KLineData[] = [
  { timestamp: 1748736000000, date: '2025-06-01', open: 35.00, high: 36.50, low: 34.80, close: 36.00, volume: 1800000 },
  { timestamp: 1748822400000, date: '2025-06-02', open: 36.00, high: 37.20, low: 35.50, close: 37.00, volume: 2200000 },
  { timestamp: 1748908800000, date: '2025-06-03', open: 37.00, high: 38.00, low: 36.20, close: 36.50, volume: 1950000 },
  { timestamp: 1748995200000, date: '2025-06-04', open: 36.50, high: 37.50, low: 35.80, close: 37.20, volume: 1650000 },
  { timestamp: 1749081600000, date: '2025-06-05', open: 37.20, high: 39.00, low: 37.00, close: 38.50, volume: 2500000 },
  { timestamp: 1749168000000, date: '2025-06-06', open: 38.50, high: 40.00, low: 38.20, close: 39.80, volume: 2800000 },
  { timestamp: 1749254400000, date: '2025-06-07', open: 39.80, high: 41.50, low: 39.50, close: 41.00, volume: 3100000 },
  { timestamp: 1749340800000, date: '2025-06-08', open: 41.00, high: 41.20, low: 39.00, close: 39.50, volume: 2400000 },
  { timestamp: 1749427200000, date: '2025-06-09', open: 39.50, high: 40.00, low: 38.00, close: 38.50, volume: 2100000 },
  { timestamp: 1749513600000, date: '2025-06-10', open: 38.50, high: 39.50, low: 37.50, close: 39.00, volume: 1750000 },
  { timestamp: 1749600000000, date: '2025-06-11', open: 39.00, high: 40.80, low: 38.50, close: 40.50, volume: 2300000 },
  { timestamp: 1749686400000, date: '2025-06-12', open: 40.50, high: 42.00, low: 40.00, close: 41.50, volume: 2900000 },
  { timestamp: 1749772800000, date: '2025-06-13', open: 41.50, high: 43.50, low: 41.00, close: 43.00, volume: 3400000 },
  { timestamp: 1749859200000, date: '2025-06-14', open: 43.00, high: 43.50, low: 41.50, close: 42.00, volume: 2600000 },
  { timestamp: 1749945600000, date: '2025-06-15', open: 42.00, high: 42.50, low: 40.50, close: 41.20, volume: 1900000 },
]

const chartRef = ref<InstanceType<typeof KLineChart> | null>(null)
const mcpConfig = {
  wsUrl: 'ws://localhost:8081',
  autoReconnect: true,
  onToolCall: (call: { name: string; input: Record<string, unknown> }) => {
    const ctrl = chartRef.value?.getController?.()
    if (!ctrl) return { success: false, error: 'Controller not ready yet' }
    return executeTool(ctrl, call)
  },
}

const showModal = ref(false)

const sizeIndex = ref(0)
const sizes = [
  { w: '100%', h: '100%' },
  { w: '800px', h: '500px' },
  { w: '600px', h: '400px' },
  { w: '100%', h: '300px' },
]

const embedWidth = computed(() => sizes[sizeIndex.value]?.w ?? '100%')
const embedHeight = computed(() => sizes[sizeIndex.value]?.h ?? '100%')

function toggleEmbedSize() {
  sizeIndex.value = (sizeIndex.value + 1) % sizes.length
}

const isFullscreen = ref(false)
const currentTheme = ref<'light' | 'dark'>('light')

// ── 自定义数据源 Demo ──
const useCustomData = ref(false)
const customData = ref<CustomDataSource>()

function onToggleCustomData() {
  useCustomData.value = !useCustomData.value
  if (useCustomData.value) {
    customData.value = {
      symbol: 'CUSTOM.DEMO',
      period: 'daily',
      data: DEMO_MAIN_DATA,
      comparisons: {
        'COMP.A': DEMO_COMP_A_DATA,
        'COMP.B': DEMO_COMP_B_DATA,
      },
    }
  } else {
    customData.value = undefined
  }
}
</script>

<style>
.app-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal-container {
  width: 90%;
  height: 80%;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: #fafafa;
  border-bottom: 1px solid #e8e8e8;
  font-weight: 600;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  font-size: 24px;
  cursor: pointer;
  border-radius: 4px;
  color: #666;
}

.close-btn:hover {
  background: #f0f0f0;
  color: #333;
}

.modal-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.95) translateY(20px);
  opacity: 0;
}

/* ── 深色模式 ── */
.app-container[data-theme='dark'] {
  background: #000000;
  color: #e5e7eb;
}

.app-container[data-theme='dark'] .modal-container {
  background: #1f2937;
}

.app-container[data-theme='dark'] .modal-header {
  background: #374151;
  border-color: #4b5563;
  color: #e5e7eb;
}

.app-container[data-theme='dark'] .close-btn {
  color: #9ca3af;
}

.app-container[data-theme='dark'] .close-btn:hover {
  background: #4b5563;
  color: #f3f4f6;
}
</style>
