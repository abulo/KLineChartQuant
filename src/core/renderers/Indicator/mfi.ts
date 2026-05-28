import type { RendererPluginWithHost, RenderContext, PluginHost } from '@/plugin'
import { RENDERER_PRIORITY } from '@/plugin'
import type { MFIRenderState } from '@/core/indicators/mfiState'
import { createMFIStateKey } from '@/core/indicators/mfiState'

const MFI_COLOR = '#fb923c'

type LinePoint = { x: number; y: number }

export function createMFIRendererPlugin(options: { paneId?: string } = {}): RendererPluginWithHost {
    const { paneId = 'sub_MFI' } = options
    const STATE_KEY = createMFIStateKey(paneId)
    let pluginHost: PluginHost | null = null
    return {
        name: `mfi_${paneId}`,
        version: '1.1.0',
        description: 'MFI 资金流强弱渲染器（WebGL + Canvas2D 回退，80/20 超买超卖线）',
        debugName: 'MFI',
        paneId,
        priority: RENDERER_PRIORITY.MAIN,
        onInstall(host) { pluginHost = host },
        getDeclaredNamespaces() { return [STATE_KEY] },
        draw(context: RenderContext) {
            const { ctx, pane, range, scrollLeft, kLineCenters, lineWebGLSurface } = context
            const state = pluginHost?.getSharedState<MFIRenderState>(STATE_KEY)
            if (!state || !state.params.showMFI || state.visibleMin > state.visibleMax) return

            const { valueMin, valueMax, series } = state
            const displayRange = pane.yAxis.getDisplayRange({ minPrice: valueMin, maxPrice: valueMax })
            const displayMin = displayRange.minPrice
            const displayMax = displayRange.maxPrice
            const displayValueRange = displayMax - displayMin || 1
            const paneH = pane.height
            const invRange = paneH / displayValueRange
            const rangeStart = range.start
            const toY = (v: number) => paneH - (v - displayMin) * invRange

            // 80 / 20 reference lines
            ctx.save()
            ctx.translate(-scrollLeft, 0)
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)'
            ctx.lineWidth = 1
            ctx.setLineDash([4, 4])
            ctx.beginPath()
            ctx.moveTo(scrollLeft, toY(80))
            ctx.lineTo(scrollLeft + context.paneWidth, toY(80))
            ctx.stroke()
            ctx.strokeStyle = 'rgba(34, 197, 94, 0.3)'
            ctx.beginPath()
            ctx.moveTo(scrollLeft, toY(20))
            ctx.lineTo(scrollLeft + context.paneWidth, toY(20))
            ctx.stroke()
            ctx.setLineDash([])
            ctx.restore()

            const drawEnd = Math.min(range.end, series.length)
            const points: LinePoint[] = []
            for (let i = range.start; i < drawEnd; i++) {
                const value = series[i]
                if (value === undefined) continue
                const centerX = kLineCenters[i - rangeStart]
                if (centerX === undefined) continue
                points.push({ x: centerX, y: toY(value) })
            }

            if (points.length < 2) return

            const enableWebGL = context.settings?.enableWebGLRendering !== false
            let usedWebGL = false
            if (enableWebGL && lineWebGLSurface?.isAvailable()) {
                const allOk = lineWebGLSurface.drawLineStrips(
                    [{ points, width: 1, color: MFI_COLOR }],
                    scrollLeft,
                )
                if (allOk) {
                    usedWebGL = true
                    lineWebGLSurface.compositeTo(ctx, { imageSmoothingEnabled: false })
                }
            }

            if (usedWebGL) return

            ctx.save()
            ctx.translate(-scrollLeft, 0)
            ctx.strokeStyle = MFI_COLOR
            ctx.lineWidth = 1
            ctx.lineJoin = 'round'
            ctx.lineCap = 'round'
            ctx.beginPath()
            ctx.moveTo(points[0]!.x, points[0]!.y)
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i]!.x, points[i]!.y)
            }
            ctx.stroke()
            ctx.restore()
        },
        getConfig() { return pluginHost?.getSharedState<MFIRenderState>(STATE_KEY)?.params ?? {} },
        setConfig() {},
    }
}
