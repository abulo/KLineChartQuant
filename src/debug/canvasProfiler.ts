type MetricEntry = {
    count: number
    totalTime: number
}

type MetricBucket = Record<string, MetricEntry>

type CanvasProfilerMetrics = {
    ctxMethods: MetricBucket
    ctxProps: MetricBucket
    canvasProps: MetricBucket
    ctxMethodSources: Record<string, MetricBucket>
}

type CanvasProfilerReportRow = {
    name: string
    count: number
    totalTime: string
    averageTime: string
}

declare global {
    interface Window {
        __KMAP_CANVAS_PROFILER_INSTALLED__?: boolean
        __KMAP_CANVAS_PROFILER_METRICS__?: CanvasProfilerMetrics
        showCanvasReport?: () => void
        resetCanvasReport?: () => void
    }
}

function createBucket(): MetricBucket {
    return Object.create(null) as MetricBucket
}

function createMetrics(): CanvasProfilerMetrics {
    return {
        ctxMethods: createBucket(),
        ctxProps: createBucket(),
        canvasProps: createBucket(),
        ctxMethodSources: Object.create(null) as Record<string, MetricBucket>,
    }
}

function record(bucket: MetricBucket, name: string, duration: number): void {
    const entry = bucket[name] ??= { count: 0, totalTime: 0 }
    entry.count += 1
    entry.totalTime += duration
}

function recordMethodSource(metrics: CanvasProfilerMetrics, methodName: string, source: string, duration: number): void {
    const bucket = metrics.ctxMethodSources[methodName] ??= createBucket()
    record(bucket, source, duration)
}

function toRows(bucket: MetricBucket): CanvasProfilerReportRow[] {
    return Object.entries(bucket)
        .filter(([, entry]) => entry.count > 0)
        .map(([name, entry]) => ({
            name,
            count: entry.count,
            totalTime: entry.totalTime.toFixed(2),
            averageTime: (entry.totalTime / entry.count).toFixed(4),
        }))
        .sort((a, b) => Number(b.totalTime) - Number(a.totalTime))
}

function getRelevantStackFrame(): string {
    const stack = new Error().stack
    if (!stack) return 'unknown'

    const frames = stack
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)

    for (const frame of frames) {
        if (
            frame.includes('canvasProfiler')
            || frame.includes('CanvasRenderingContext2D')
            || frame === 'Error'
        ) {
            continue
        }

        const normalized = frame.replace(/^at\s+/, '')
        const srcMatch = normalized.match(/((?:src|node_modules)[^\s)]+):(\d+):(\d+)/)
        if (srcMatch) {
            return `${srcMatch[1]}:${srcMatch[2]}`
        }

        const parenMatch = normalized.match(/\(([^)]+):(\d+):(\d+)\)$/)
        if (parenMatch) {
            return `${parenMatch[1]}:${parenMatch[2]}`
        }

        return normalized
    }

    return 'unknown'
}

function wrapMethod(
    proto: object,
    name: string,
    metrics: CanvasProfilerMetrics,
    originalMethods: Map<string, (...args: unknown[]) => unknown>,
    options?: { captureSource?: boolean }
): void {
    const key = `${proto.constructor?.name ?? 'proto'}:${name}`
    if (originalMethods.has(key)) return

    const original = Reflect.get(proto, name)
    if (typeof original !== 'function') return

    originalMethods.set(key, original as (...args: unknown[]) => unknown)

    Reflect.set(proto, name, function (this: object, ...args: unknown[]) {
        const source = options?.captureSource ? getRelevantStackFrame() : null
        const start = performance.now()
        const result = original.apply(this, args)
        const duration = performance.now() - start
        record(metrics.ctxMethods, name, duration)
        if (source) {
            recordMethodSource(metrics, name, source, duration)
        }
        return result
    })
}

function wrapSetter(proto: object, prop: string, bucket: MetricBucket): void {
    const descriptor = Object.getOwnPropertyDescriptor(proto, prop)
    if (!descriptor?.set || !descriptor.configurable) return

    Object.defineProperty(proto, prop, {
        configurable: true,
        enumerable: descriptor.enumerable ?? false,
        get: descriptor.get,
        set(this: object, value: unknown) {
            const start = performance.now()
            descriptor.set!.call(this, value)
            record(bucket, prop, performance.now() - start)
        },
    })
}

export function installCanvasProfiler(): void {
    if (typeof window === 'undefined') return
    if (window.__KMAP_CANVAS_PROFILER_INSTALLED__) return

    const metrics = createMetrics()
    const originalMethods = new Map<string, (...args: unknown[]) => unknown>()

    const ctxProto = CanvasRenderingContext2D?.prototype
    const canvasProto = HTMLCanvasElement?.prototype
    if (!ctxProto || !canvasProto) return

    wrapMethod(ctxProto, 'fillText', metrics, originalMethods, { captureSource: true })
    wrapMethod(ctxProto, 'measureText', metrics, originalMethods, { captureSource: true })
    wrapMethod(ctxProto, 'drawImage', metrics, originalMethods)
    wrapMethod(ctxProto, 'save', metrics, originalMethods)
    wrapMethod(ctxProto, 'restore', metrics, originalMethods)
    wrapMethod(ctxProto, 'clip', metrics, originalMethods)
    wrapMethod(ctxProto, 'setTransform', metrics, originalMethods)
    wrapMethod(ctxProto, 'scale', metrics, originalMethods)

    wrapSetter(ctxProto, 'font', metrics.ctxProps)
    wrapSetter(ctxProto, 'filter', metrics.ctxProps)
    wrapSetter(ctxProto, 'shadowBlur', metrics.ctxProps)
    wrapSetter(ctxProto, 'lineWidth', metrics.ctxProps)

    wrapSetter(canvasProto, 'width', metrics.canvasProps)
    wrapSetter(canvasProto, 'height', metrics.canvasProps)

    window.__KMAP_CANVAS_PROFILER_METRICS__ = metrics
    window.__KMAP_CANVAS_PROFILER_INSTALLED__ = true

    window.showCanvasReport = () => {
        const currentMetrics = window.__KMAP_CANVAS_PROFILER_METRICS__
        if (!currentMetrics) return

        console.group('[kmap] Canvas profiler report')
        console.log('ctx methods')
        console.table(toRows(currentMetrics.ctxMethods))
        console.log('ctx props')
        console.table(toRows(currentMetrics.ctxProps))
        console.log('canvas props')
        console.table(toRows(currentMetrics.canvasProps))

        for (const methodName of ['fillText', 'measureText']) {
            const bucket = currentMetrics.ctxMethodSources[methodName]
            if (!bucket) continue
            console.log(`${methodName} sources`)
            console.table(toRows(bucket).slice(0, 20))
        }

        console.groupEnd()
    }

    window.resetCanvasReport = () => {
        window.__KMAP_CANVAS_PROFILER_METRICS__ = createMetrics()
    }

    console.info('[kmap] Canvas profiler enabled. Use window.showCanvasReport() and window.resetCanvasReport().')
}
