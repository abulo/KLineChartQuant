import type { RendererPlugin, RenderContext } from '@/plugin'
import { RENDERER_PRIORITY } from '@/plugin'
import type { KLineData } from '@/types/price'
import { PRICE_COLORS } from '@/core/theme/colors'

/**
 * 创建最新价虚线渲染器插件
 */
export function createLastPriceLineRendererPlugin(): RendererPlugin {
    return {
        name: 'lastPriceLine',
        version: '1.0.0',
        description: '最新价虚线渲染器',
        debugName: '最新价线',
        paneId: 'main',
        priority: RENDERER_PRIORITY.LAST_PRICE_LABEL,

        draw(context: RenderContext) {
            const { ctx, pane, data, scrollLeft, dpr, kLinePositions, paneWidth } = context
            const klineData = data as KLineData[]
            const last = klineData[klineData.length - 1]
            if (!last) return

            // 检查价格是否在可视范围内
            const displayRange = pane.yAxis.getDisplayRange(pane.priceRange)
            if (last.close < displayRange.minPrice || last.close > displayRange.maxPrice) {
                return
            }

            const y = Math.round(pane.yAxis.priceToY(last.close))

            // 注册 label 到 yAxisLabels
            if (!context.yAxisLabels) context.yAxisLabels = []
            context.yAxisLabels.push({
                dataIndex: klineData.length - 1,
                price: last.close,
                y,
                type: 'lastPrice',
                style: {
                    bgColor: 'rgba(255, 247, 248, 0.98)',
                    borderColor: PRICE_COLORS.LAST_PRICE,
                    textColor: PRICE_COLORS.LAST_PRICE,
                }
            })

            ctx.save()
            ctx.translate(-scrollLeft, 0)

            // 使用统一的 kLinePositions 计算绘制范围
            const startX = kLinePositions[0] ?? 0
            // 虚线始终画到 pane 最右侧，而不是最后一条K线
            const endX = paneWidth + scrollLeft

            ctx.strokeStyle = PRICE_COLORS.LAST_PRICE
            ctx.lineWidth = 1
            ctx.setLineDash([4, 3])
            ctx.beginPath()
            const yy = (Math.floor(y * dpr) + 0.5) / dpr
            ctx.moveTo(Math.round(startX * dpr) / dpr, yy)
            ctx.lineTo(Math.round(endX * dpr) / dpr, yy)
            ctx.stroke()
            ctx.setLineDash([])

            ctx.restore()
        },
    }
}
