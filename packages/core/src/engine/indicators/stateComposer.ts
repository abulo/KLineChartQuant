/**
 * State Composer
 * 把 Worker/Runtime 返回的 series bundle 组装成与现有兼容的 render states
 */

import { KLineChartError } from '../../errors'
import type { MARenderState } from './state/maState'
import type { BOLLRenderState } from './state/bollState'
import type { EXPMARenderState } from './state/expmaState'
import type { ENERenderState } from './state/eneState'
import type { RSIRenderState } from './state/rsiState'
import type { CCIRenderState } from './state/cciState'
import type { STOCHRenderState } from './state/stochState'
import type { MOMRenderState } from './state/momState'
import type { WMSRRenderState } from './state/wmsrState'
import type { KSTRenderState } from './state/kstState'
import type { FASTKRenderState } from './state/fastkState'
import type { MACDRenderState } from './state/macdState'
import type { ATRRenderState } from './state/atrState'
import type { WMARenderState } from './state/wmaState'
import type { DEMARenderState } from './state/demaState'
import type { TEMARenderState } from './state/temaState'
import type { HMARenderState } from './state/hmaState'
import type { KAMARenderState } from './state/kamaState'
import type { SARRenderState } from './state/sarState'
import type { SuperTrendRenderState } from './state/supertrendState'
import type { KeltnerRenderState } from './state/keltnerState'
import type { DonchianRenderState } from './state/donchianState'
import type { IchimokuRenderState } from './state/ichimokuState'
import type { ROCRenderState } from './state/rocState'
import type { TRIXRenderState } from './state/trixState'
import type { HVRenderState } from './state/hvState'
import type { ParkinsonRenderState } from './state/parkinsonState'
import type { ChaikinVolRenderState } from './state/chaikinVolState'
import type { VMARenderState } from './state/vmaState'
import type { OBVRenderState } from './state/obvState'
import type { PVTRenderState } from './state/pvtState'
import type { VWAPRenderState } from './state/vwapState'
import type { CMFRenderState } from './state/cmfState'
import type { MFIRenderState } from './state/mfiState'
import type { PivotRenderState } from './state/pivotState'
import type { FibRenderState } from './state/fibState'
import type { StructureRenderState } from './state/structureState'
import type { ZonesRenderState } from './state/zonesState'
import type { VolumeProfileRenderState } from './state/volumeProfileState'
import type { IndicatorSeriesBundle } from './workerProtocol'
import type { IndicatorMetadata } from './indicatorMetadata'
import { getRegisteredIndicatorDefinitions } from './indicatorDefinitionRegistry'

/**
 * 可见范围
 */
interface VisibleRange {
  start: number
  end: number
}

type VisibleSubIndicatorStates = {
  rsi: RSIRenderState
  cci: CCIRenderState
  stoch: STOCHRenderState
  mom: MOMRenderState
  wmsr: WMSRRenderState
  kst: KSTRenderState
  fastk: FASTKRenderState
  macd: MACDRenderState
  atr: ATRRenderState
  wma: WMARenderState
  dema: DEMARenderState
  tema: TEMARenderState
  hma: HMARenderState
  kama: KAMARenderState
  sar: SARRenderState
  supertrend: SuperTrendRenderState
  keltner: KeltnerRenderState
  donchian: DonchianRenderState
  ichimoku: IchimokuRenderState
  roc: ROCRenderState
  trix: TRIXRenderState
  hv: HVRenderState
  parkinson: ParkinsonRenderState
  chaikinVol: ChaikinVolRenderState
  vma: VMARenderState
  obv: OBVRenderState
  pvt: PVTRenderState
  vwap: VWAPRenderState
  cmf: CMFRenderState
  mfi: MFIRenderState
  pivot: PivotRenderState
  fib: FibRenderState
  structure: StructureRenderState
  zones: ZonesRenderState
  volumeProfile: VolumeProfileRenderState
}

type VisibleSubIndicatorMask = {
  rsi?: boolean
  cci?: boolean
  stoch?: boolean
  mom?: boolean
  wmsr?: boolean
  kst?: boolean
  fastk?: boolean
  macd?: boolean
  atr?: boolean
  wma?: boolean
  dema?: boolean
  tema?: boolean
  hma?: boolean
  kama?: boolean
  sar?: boolean
  supertrend?: boolean
  keltner?: boolean
  donchian?: boolean
  ichimoku?: boolean
  roc?: boolean
  trix?: boolean
  hv?: boolean
  parkinson?: boolean
  chaikinVol?: boolean
  vma?: boolean
  obv?: boolean
  pvt?: boolean
  vwap?: boolean
  cmf?: boolean
  mfi?: boolean
  pivot?: boolean
  fib?: boolean
  structure?: boolean
  zones?: boolean
  volumeProfile?: boolean
}

type MainRenderStates = {
  ma: MARenderState
  boll: BOLLRenderState
  expma: EXPMARenderState
  ene: ENERenderState
}

type MainRenderStateIndicatorId = keyof MainRenderStates

type ComposedRenderStates = VisibleSubIndicatorStates & MainRenderStates

function getVisibleStateIndicatorIds(): (keyof VisibleSubIndicatorStates)[] {
  return getRegisteredIndicatorDefinitions()
    .filter(
      (
        d,
      ): d is IndicatorMetadata & {
        visibleState: NonNullable<IndicatorMetadata['visibleState']>
      } => !!d.visibleState?.compose,
    )
    .map((d) => d.name as keyof VisibleSubIndicatorStates)
}

/**
 * 仅计算副图指标的 visible-only states
 * 用于滚动时的轻量更新，避免重复计算主图指标
 */
export function composeVisibleSubIndicatorStates(
  bundle: IndicatorSeriesBundle,
  visibleRange: VisibleRange,
  timestamp: number,
  activeMask: VisibleSubIndicatorMask = {},
  getIndicatorMetadata: (indicatorId: string) => IndicatorMetadata | undefined,
): VisibleSubIndicatorStates {
  const states: Partial<VisibleSubIndicatorStates> = {}

  for (const indicatorId of getVisibleStateIndicatorIds()) {
    states[indicatorId] = composeRequiredMetadataVisibleState(
      indicatorId,
      bundle,
      visibleRange,
      timestamp,
      activeMask,
      getIndicatorMetadata,
    ) as never
  }

  return states as VisibleSubIndicatorStates
}

/**
 * 从 series bundle 组装所有 render states
 * 同时计算 visibleMin/visibleMax 等派生字段
 */
export function composeRenderStates(
  bundle: IndicatorSeriesBundle,
  visibleRange: VisibleRange,
  timestamp: number,
  getIndicatorMetadata: (indicatorId: string) => IndicatorMetadata | undefined,
): ComposedRenderStates {
  const mainStates = composeMainRenderStates(bundle, visibleRange, timestamp, getIndicatorMetadata)
  const subStates = composeVisibleSubIndicatorStates(
    bundle,
    visibleRange,
    timestamp,
    {},
    getIndicatorMetadata,
  )

  return {
    ...mainStates,
    ...subStates,
  }
}

function composeRequiredMetadataVisibleState(
  indicatorId: keyof VisibleSubIndicatorStates,
  bundle: IndicatorSeriesBundle,
  visibleRange: VisibleRange,
  timestamp: number,
  activeMask: VisibleSubIndicatorMask,
  getIndicatorMetadata: (indicatorId: string) => IndicatorMetadata | undefined,
): unknown {
  const meta = getIndicatorMetadata(indicatorId)
  if (!meta) return undefined

  const compose = meta.visibleState?.compose
  if (!compose) {
    throw new KLineChartError(
      'NOT_REGISTERED',
      `[StateComposer] Missing visibleState.compose for ${indicatorId}`,
    )
  }

  return compose({
    bundle,
    visibleRange,
    timestamp,
    active: activeMask[indicatorId] ?? true,
  })
}

function composeMainRenderStates(
  bundle: IndicatorSeriesBundle,
  visibleRange: VisibleRange,
  timestamp: number,
  getIndicatorMetadata: (indicatorId: string) => IndicatorMetadata | undefined,
): MainRenderStates {
  const states: Partial<Record<MainRenderStateIndicatorId, unknown>> = {}

  for (const def of getRegisteredIndicatorDefinitions()) {
    if (!def.mainPane?.composeRenderState) continue
    const indicatorId = def.name as MainRenderStateIndicatorId
    const meta = getIndicatorMetadata(indicatorId)
    const compose = meta?.mainPane?.composeRenderState ?? def.mainPane.composeRenderState
    if (!compose) continue
    states[indicatorId] = compose(bundle, visibleRange, timestamp)
  }

  return states as MainRenderStates
}

/**
 * 计算主图指标价格范围
 * 用于 Chart.draw() 中的 pane.updateRange
 */
export function computeMainIndicatorPriceRange(
  bundle: IndicatorSeriesBundle,
  visibleRange: VisibleRange,
  activeMainIndicators: Set<string>,
  getIndicatorMetadata: (indicatorId: string) => IndicatorMetadata | undefined,
): { min: number; max: number } | null {
  let min = Infinity
  let max = -Infinity

  for (const indicatorId of activeMainIndicators) {
    const range = getIndicatorMetadata(indicatorId)?.mainPane?.computePriceRange?.(
      bundle,
      visibleRange,
    )
    if (!range) continue
    min = Math.min(min, range.min)
    max = Math.max(max, range.max)
  }

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return null
  }

  return { min, max }
}
