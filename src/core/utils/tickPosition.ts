import { calculateTickCount } from './tickCount'

export interface TickPosition {
    /** tick 索引 */
    index: number
    /** 比例值 (0 ~ 1) */
    t: number
    /** 逻辑像素 Y 坐标（未做物理对齐） */
    y: number
}

export interface CalculateTickPositionsOptions {
    /** 面板高度（逻辑像素） */
    height: number
    /** 上内边距（逻辑像素） */
    paddingTop: number
    /** 下内边距（逻辑像素） */
    paddingBottom: number
    /** 是否为主图面板（影响刻度数量计算） */
    isMain?: boolean
    /** 是否隐藏首尾刻度 */
    hideEdgeTicks?: boolean
}

/**
 * 计算 Y 轴 tick 位置（逻辑像素坐标）
 * 供网格线、价格轴刻度等共享同一套位置计算逻辑
 *
 * @returns TickPosition 数组，按从上到下顺序（index 0 为顶部）
 */
export function calculateTickPositions(
    options: CalculateTickPositionsOptions
): TickPosition[] {
    const { height, paddingTop, paddingBottom, isMain, hideEdgeTicks } = options

    const yStart = paddingTop
    const yEnd = Math.max(paddingTop, height - paddingBottom)
    const viewH = Math.max(0, yEnd - yStart)

    const ticks = calculateTickCount(height, isMain)
    const positions: TickPosition[] = []

    for (let i = 0; i < ticks; i++) {
        if (hideEdgeTicks && (i === 0 || i === ticks - 1)) continue

        const t = ticks <= 1 ? 0 : i / (ticks - 1)
        const y = yStart + t * viewH

        positions.push({ index: i, t, y })
    }

    return positions
}

/**
 * 计算 Y 轴 tick 位置（含数值映射）
 * 适用于需要将数值映射到 Y 坐标的场景（如价格轴）
 */
export interface TickPositionWithValue extends TickPosition {
    /** 对应数值 */
    value: number
}

export interface CalculateValueTickPositionsOptions extends CalculateTickPositionsOptions {
    /** 数值范围最小值 */
    valueMin: number
    /** 数值范围最大值 */
    valueMax: number
}

/**
 * 计算带数值映射的 tick 位置
 *
 * @returns TickPositionWithValue 数组，value 按线性映射计算
 */
export function calculateValueTickPositions(
    options: CalculateValueTickPositionsOptions
): TickPositionWithValue[] {
    const { valueMin, valueMax } = options
    const valueRange = valueMax - valueMin || 1

    const basePositions = calculateTickPositions(options)
    const ticks = basePositions.length

    return basePositions.map((pos, arrayIdx) => {
        // 重新计算 step 以匹配原始 ticks 数量（包含被隐藏的）
        const totalTicks = calculateTickCount(options.height, options.isMain)
        const step = valueRange / Math.max(1, totalTicks - 1)
        const originalIndex = pos.index
        const value = valueMax - step * originalIndex

        return { ...pos, value }
    })
}
