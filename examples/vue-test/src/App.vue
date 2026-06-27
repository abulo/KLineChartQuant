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
import { CustomDataSource, KLineChart } from '@363045841yyt/klinechart'
import demoData from './demo-data.json'

const isFullscreen = ref(false)
const currentTheme = ref<'light' | 'dark'>('dark')

const customData = ref<CustomDataSource>(demoData as CustomDataSource)
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
