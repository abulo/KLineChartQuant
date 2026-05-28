import type { RendererPluginWithHost, RenderContext, PluginHost } from '@/plugin'
import { RENDERER_PRIORITY } from '@/plugin'
import type { KeltnerRenderState } from '@/core/indicators/keltnerState'
import { createKeltnerStateKey } from '@/core/indicators/keltnerState'

const KELTNER_UPPER_COLOR = '#7c3aed'
const KELTNER_MIDDLE_COLOR = '#f59e0b'
const KELTNER_LOWER_COLOR = '#7c3aed'

type Point = { x: number; y: number }

export interface KeltnerRendererOptions { paneId?: string }

export function createKeltnerRendererPlugin(options: KeltnerRendererOptions = {}): RendererPluginWithHost {
    const { paneId = 'main' } = options
    const STATE_KEY = createKeltnerStateKey(paneId)
    let pluginHost: PluginHost | null = null

    return {
        name: `keltner_${paneId}`,
        version: '1.1.0',
        description: 'Keltner Channel 渲染器（WebGL + Canvas2D 回退）',
        debugName: 'Keltner',
        paneId,
        priority: RENDERER_PRIORITY.MAIN,

        onInstall(host: PluginHost) { pluginHost = host },
        getDeclaredNamespaces() { return [STATE_KEY] },

        draw(context: RenderContext) {
            const { ctx, pane, range, scrollLeft, kLineCenters, lineWebGLSurface } = context
            const state = pluginHost?.getSharedState<KeltnerRenderState>(STATE_KEY)
            if (!state || state.visibleMin > state.visibleMax) return
            const { showUpper, showMiddle, showLower } = state.params
            if (!showUpper && !showMiddle && !showLower) return

            const { series } = state
            const toY = (v: number) => pane.yAxis.priceToY(v)
            const rangeStart = range.start

            const upperPts: Point[] = []
            const middlePts: Point[] = []
            const lowerPts: Point[] = []
            const drawEnd = Math.min(range.end, series.length)
            for (let i = range.start; i < drawEnd; i++) {
                const point = series[i]
                if (!point) continue
                const centerX = kLineCenters[i - rangeStart]
                if (centerX === undefined) continue
                if (showUpper) upperPts.push({ x: centerX, y: toY(point.upper) })
                if (showMiddle) middlePts.push({ x: centerX, y: toY(point.middle) })
                if (showLower) lowerPts.push({ x: centerX, y: toY(point.lower) })
            }

            const lines: Array<{ points: Point[]; width: number; color: string }> = []
            if (upperPts.length >= 2) lines.push({ points: upperPts, width: 1, color: KELTNER_UPPER_COLOR })
            if (middlePts.length >= 2) lines.push({ points: middlePts, width: 1, color: KELTNER_MIDDLE_COLOR })
            if (lowerPts.length >= 2) lines.push({ points: lowerPts, width: 1, color: KELTNER_LOWER_COLOR })

            const enableWebGL = context.settings?.enableWebGLRendering !== false
            let usedWebGL = false
            if (enableWebGL && lineWebGLSurface?.isAvailable()) {
                const allOk = lines.length > 0 && lineWebGLSurface.drawLineStrips(lines, scrollLeft)
                if (allOk) {
                    usedWebGL = true
                    lineWebGLSurface.compositeTo(ctx, { imageSmoothingEnabled: false })
                }
            }

            if (usedWebGL) return

            ctx.save()
            ctx.translate(-scrollLeft, 0)
            ctx.lineWidth = 1
            ctx.lineJoin = 'round'
            ctx.lineCap = 'round'
            drawLine(ctx, upperPts, KELTNER_UPPER_COLOR)
            drawLine(ctx, middlePts, KELTNER_MIDDLE_COLOR)
            drawLine(ctx, lowerPts, KELTNER_LOWER_COLOR)
            ctx.restore()
        },

        getConfig() {
            const state = pluginHost?.getSharedState<KeltnerRenderState>(STATE_KEY)
            return state?.params ?? {}
        },
        setConfig() {},
    }
}

function drawLine(ctx: CanvasRenderingContext2D, pts: Point[], color: string): void {
    if (pts.length < 2) return
    ctx.strokeStyle = color
    ctx.beginPath()
    ctx.moveTo(pts[0]!.x, pts[0]!.y)
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i]!.x, pts[i]!.y)
    ctx.stroke()
}
