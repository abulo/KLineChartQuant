import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'

import { version } from '../package.json'
document.title = `KLineChartQuant v${version}`

if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_CANVAS_PROFILER === 'true') {
    void import('./debug/canvasProfiler').then(({ installCanvasProfiler }) => {
        installCanvasProfiler()
    })
}

const app = createApp(App)

app.mount('#app')
