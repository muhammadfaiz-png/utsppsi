export type CommodityType =
  | 'KOPI_ROBUSTA'
  | 'LADA_HITAM'
  | 'KAKAO'
  | 'CPO'
  | 'KOPI_ARABIKA_ULUBELU';

export interface CommodityBatch {
  id: string; // e.g. #KOP-LBG-2026-0891
  ddsId: string; // e.g. EU-DDS-2026-ID-09941
  commodity: CommodityType;
  commodityLabel: string;
  weightKg: number;
  containerId: string;
  exporterName: string;
  exporterNib: string;
  consigneeName: string;
  destinationPort: string;
  originDistrict: string;
  centroidCoordinates: [number, number];
  polygonCoordinates?: [number, number][];
  eudrStatus: 'VERIFIED' | 'UNDER_REVIEW' | 'FLAGGED';
  harvestWindow: string;
  postGisStateHash: string;
  createdAt: string;
  scaScore?: number;
  moisturePct?: number;
  carbonKgCo2e?: number;
  coldChainIndex?: number;
}

export type ReeferState = 'OPTIMAL' | 'WARNING' | 'EXCURSION';

export interface TruckTelemetry {
  truckPlate: string; // e.g. "BE 8920 YU"
  driverName: string;
  driverPhone: string;
  batchId: string;
  currentLat: number;
  currentLng: number;
  speedKmh: number;
  temperatureC: number;
  humidityPct: number;
  reeferStatus: ReeferState;
  doorLocked: boolean;
  eSealId: string;
  lastUpdated: string;
  routeProgressPct: number;
  targetGate: string;
  origin: string;
  destination: string;
  commodity: string;
}

export type IncidentType = 'TEMP_EXCURSION' | 'ROUTE_DEVIATION' | 'SEAL_TAMPER' | 'CONGESTION';
export type IncidentSeverity = 'CRITICAL' | 'WARNING' | 'INFO';
export type IncidentStatus = 'ACTIVE' | 'DISPATCHED' | 'MITIGATED' | 'RESOLVED';

export interface IncidentRecord {
  id: string; // e.g. "#INC-TEMP-8412"
  truckPlate: string;
  batchId: string;
  type: IncidentType;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  detectedValue: string;
  locationLabel: string;
  iotDiagnostic: string;
  createdAt: string;
  sopDispatchedAction?: string;
}

export type GateDecision = 'APPROVE' | 'DIVERT' | 'REJECT';

export interface GateInspectionItem {
  id: string;
  truckPlate: string;
  batchId: string;
  driverName: string;
  driverPhone: string;
  commodity: string;
  alprMatch: boolean;
  ocrConfidence: number; // e.g. 99.4
  qrTokenValid: boolean;
  eSealIntegrity: 'SECURE' | 'TAMPERED';
  weighbridgeGrossKg: number;
  weighbridgeNetKg: number;
  weightVariancePct: number;
  assignedLane: string;
  status: 'QUEUED' | 'IN_INSPECTION' | 'APPROVED' | 'DIVERTED' | 'REJECTED';
  timeSlot: string;
  priorityStatus: 'Priority Transit' | 'Buffer Holding' | 'Audit Hold';
  queueNumber: number;
  temperatureHistory: { time: string; temp: number }[];
}

