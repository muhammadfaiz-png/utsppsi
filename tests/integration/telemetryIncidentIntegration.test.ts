import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TruckTelemetry, IncidentRecord, ReeferState } from '@/types';

// State machine simulating incident escalation and mitigation
export class IncidentSimulationEngine {
  private trucks: Map<string, TruckTelemetry> = new Map();
  private incidents: Map<string, IncidentRecord> = new Map();
  private tempThreshold = 22.0;

  constructor(initialTrucks: TruckTelemetry[], initialIncidents: IncidentRecord[] = []) {
    initialTrucks.forEach((t) => this.trucks.set(t.truckPlate, { ...t }));
    initialIncidents.forEach((inc) => this.incidents.set(inc.id, { ...inc }));
  }

  public updateTelemetry(plate: string, newTemp: number, newSpeed: number): void {
    const truck = this.trucks.get(plate);
    if (!truck) throw new Error(`Armada dengan plat ${plate} tidak ditemukan`);

    truck.temperatureC = newTemp;
    truck.speedKmh = newSpeed;

    if (newTemp > this.tempThreshold) {
      truck.reeferStatus = 'EXCURSION';
      const existingIncident = Array.from(this.incidents.values()).find(
        (inc) => inc.truckPlate === plate && inc.status === 'ACTIVE'
      );

      if (!existingIncident) {
        const newIncId = `#INC-TEMP-${plate.replace(/\s+/g, '').slice(-4)}`;
        this.incidents.set(newIncId, {
          id: newIncId,
          truckPlate: plate,
          batchId: truck.batchId,
          type: 'TEMP_EXCURSION',
          title: `Penyimpangan Suhu Kritis (${newTemp.toFixed(1)}°C)`,
          severity: 'CRITICAL',
          status: 'ACTIVE',
          detectedValue: `+${newTemp.toFixed(1)}°C (Max ${this.tempThreshold}°C)`,
          locationLabel: 'Koridor Tol JTTS KM 42+200',
          iotDiagnostic: 'Auxiliary Power Unit Fault (Kompresor Mati)',
          createdAt: new Date().toLocaleTimeString('id-ID'),
        });
      }
    } else {
      truck.reeferStatus = 'OPTIMAL';
    }
  }

  public dispatchSopAction(incidentId: string, actionName: string): void {
    const incident = this.incidents.get(incidentId);
    if (!incident) throw new Error(`Insiden ${incidentId} tidak ditemukan`);

    incident.status = 'DISPATCHED';
    incident.sopDispatchedAction = actionName;
  }

  public resolveIncident(incidentId: string): void {
    const incident = this.incidents.get(incidentId);
    if (!incident) throw new Error(`Insiden ${incidentId} tidak ditemukan`);

    incident.status = 'RESOLVED';
    const truck = this.trucks.get(incident.truckPlate);
    if (truck) {
      truck.reeferStatus = 'OPTIMAL';
      truck.temperatureC = 18.0; // Stabilized
    }
  }

  public getTruck(plate: string): TruckTelemetry | undefined {
    return this.trucks.get(plate);
  }

  public getIncident(id: string): IncidentRecord | undefined {
    return this.incidents.get(id);
  }

  public getActiveAlertCount(): number {
    return Array.from(this.incidents.values()).filter(
      (inc) => inc.status === 'ACTIVE' || inc.status === 'DISPATCHED'
    ).length;
  }
}

describe('Integration Test: Telemetry Ingest & Incident SOP Escalation Workflow', () => {
  it('TC-INT-01: lonjakan suhu melebihi ambang batas 22°C otomatis memicu status EXCURSION dan record insiden', () => {
    const engine = new IncidentSimulationEngine([
      {
        truckPlate: 'BE 8920 YU',
        driverName: 'Bambang Supriyadi',
        driverPhone: '+62 812-7391-8821',
        batchId: '#KOP-LBG-2026-0891',
        currentLat: -5.4496,
        currentLng: 105.3129,
        speedKmh: 60,
        temperatureC: 18.2,
        humidityPct: 62.0,
        reeferStatus: 'OPTIMAL',
        doorLocked: true,
        eSealId: 'SEAL-DIGI-9921',
        lastUpdated: '16:00 WIB',
        routeProgressPct: 75,
        targetGate: 'Gate 2',
        origin: 'Ulubelu',
        destination: 'Pelabuhan Panjang',
        commodity: 'Kopi Robusta',
      },
    ]);

    assert.equal(engine.getTruck('BE 8920 YU')?.reeferStatus, 'OPTIMAL');
    assert.equal(engine.getActiveAlertCount(), 0);

    // Trigger excursion: compressor failure -> temperature rises to 24.5°C
    engine.updateTelemetry('BE 8920 YU', 24.5, 45);

    const updatedTruck = engine.getTruck('BE 8920 YU');
    assert.equal(updatedTruck?.reeferStatus, 'EXCURSION');
    assert.equal(engine.getActiveAlertCount(), 1);

    const incident = engine.getIncident('#INC-TEMP-20YU');
    assert.ok(incident);
    assert.equal(incident?.severity, 'CRITICAL');
    assert.equal(incident?.status, 'ACTIVE');
  });

  it('TC-INT-02: dispatch tindakan SOP (Tim Mobile / Nav Koreksi) harus mengubah status menjadi DISPATCHED', () => {
    const engine = new IncidentSimulationEngine(
      [
        {
          truckPlate: 'BE 8412 AA',
          driverName: 'Joko Susilo',
          driverPhone: '+62 813-8820-1194',
          batchId: '#KOP-LBG-2026-0892',
          currentLat: -5.3612,
          currentLng: 105.2415,
          speedKmh: 48,
          temperatureC: 24.2,
          humidityPct: 78.0,
          reeferStatus: 'EXCURSION',
          doorLocked: true,
          eSealId: 'SEAL-DIGI-9922',
          lastUpdated: '16:00 WIB',
          routeProgressPct: 50,
          targetGate: 'Gate 1',
          origin: 'Liwa',
          destination: 'Pelabuhan Panjang',
          commodity: 'Kopi Robusta',
        },
      ],
      [
        {
          id: '#INC-TEMP-8412',
          truckPlate: 'BE 8412 AA',
          batchId: '#KOP-LBG-2026-0892',
          type: 'TEMP_EXCURSION',
          title: 'Excursion Suhu Kritis',
          severity: 'CRITICAL',
          status: 'ACTIVE',
          detectedValue: '+24.2°C',
          locationLabel: 'JTTS KM 42',
          iotDiagnostic: 'APU Fault',
          createdAt: '16:20 WIB',
        },
      ]
    );

    engine.dispatchSopAction('#INC-TEMP-8412', 'Kirim Tim Mobile Teknisi Cold-Chain');
    const incident = engine.getIncident('#INC-TEMP-8412');
    assert.equal(incident?.status, 'DISPATCHED');
    assert.equal(incident?.sopDispatchedAction, 'Kirim Tim Mobile Teknisi Cold-Chain');
  });

  it('TC-INT-03: mitigasi selesai (RESOLVED) menstabilkan suhu kembali normal dan menurunkan alert counter', () => {
    const engine = new IncidentSimulationEngine(
      [
        {
          truckPlate: 'BE 8412 AA',
          driverName: 'Joko Susilo',
          driverPhone: '+62 813-8820-1194',
          batchId: '#KOP-LBG-2026-0892',
          currentLat: -5.3612,
          currentLng: 105.2415,
          speedKmh: 48,
          temperatureC: 24.2,
          humidityPct: 78.0,
          reeferStatus: 'EXCURSION',
          doorLocked: true,
          eSealId: 'SEAL-DIGI-9922',
          lastUpdated: '16:00 WIB',
          routeProgressPct: 50,
          targetGate: 'Gate 1',
          origin: 'Liwa',
          destination: 'Pelabuhan Panjang',
          commodity: 'Kopi Robusta',
        },
      ],
      [
        {
          id: '#INC-TEMP-8412',
          truckPlate: 'BE 8412 AA',
          batchId: '#KOP-LBG-2026-0892',
          type: 'TEMP_EXCURSION',
          title: 'Excursion Suhu Kritis',
          severity: 'CRITICAL',
          status: 'DISPATCHED',
          detectedValue: '+24.2°C',
          locationLabel: 'JTTS KM 42',
          iotDiagnostic: 'APU Fault',
          createdAt: '16:20 WIB',
        },
      ]
    );

    assert.equal(engine.getActiveAlertCount(), 1);
    engine.resolveIncident('#INC-TEMP-8412');

    assert.equal(engine.getActiveAlertCount(), 0);
    assert.equal(engine.getIncident('#INC-TEMP-8412')?.status, 'RESOLVED');
    assert.equal(engine.getTruck('BE 8412 AA')?.reeferStatus, 'OPTIMAL');
    assert.equal(engine.getTruck('BE 8412 AA')?.temperatureC, 18.0);
  });
});

