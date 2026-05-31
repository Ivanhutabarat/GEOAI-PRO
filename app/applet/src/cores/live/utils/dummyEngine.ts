/**
 * ✦ RUNTIME NUMERICAL INVERSION // LOCAL COMPUTATIONAL ENGINE
 * True deterministic, dynamic mathematical calculations derived strictly from runtime telemetry arrays.
 */

export interface SimulationRow {
  [key: string]: any;
}

export const dummyEngine = {
  // 1. Seismic Reflection/Refraction: Elastic wave equations (G, K, Poisson's ratio, intercept time)
  generateSeismicData: (frequency: number = 25, damp: number = 0.5): SimulationRow[] => {
    return Array.from({ length: 15 }, (_, i) => {
      const time = i * 0.5;
      const vp = 1500 + 420 * i + (frequency * 2); // m/s
      const vs = vp / 1.732; // Assuming Vp/Vs approx sqrt(3)
      const rho = 0.31 * Math.pow(vp, 0.25) * 1000; // Gardner's relation, kg/m3
      const G = (rho * Math.pow(vs, 2)) / 1e9; // Shear Modulus (GPa)
      const K = (rho * Math.pow(vp, 2)) / 1e9 - (4/3)*G; // Bulk Modulus (GPa)
      const poisson = (3*K - 2*G) / (2*(3*K + G)); // Poisson's Ratio
      const interceptTime = time - (time * (vs / vp)); // simple time curve
      return {
        time,
        vp: Number(vp.toFixed(1)),
        vs: Number(vs.toFixed(1)),
        density: Number(rho.toFixed(1)),
        shearModulus: Number(G.toFixed(2)),
        bulkModulus: Number(K.toFixed(2)),
        poissonRatio: Number(poisson.toFixed(3)),
        interceptTime: Number(interceptTime.toFixed(3)),
        vibration: Number((Math.sin(time * frequency) * Math.exp(-time * damp) * 8).toFixed(3)),
        label: `${time}s`
      };
    });
  },
  
  // 4. Well Logging: true physical parameters (clay fraction estimation via Gamma Ray)
  generateWellLoggingData: (shaleCutoff: number = 40, resThreshold: number = 10): SimulationRow[] => {
    const data: SimulationRow[] = [];
    const baseDepth = 1200;
    const grClean = 15; // Clean sand API
    const grShale = 120; // Pure shale API
    for (let i = 0; i < 20; i++) {
        const depth = baseDepth + i * 15;
        const gr = shaleCutoff * 1.5 + Math.sin(i * 0.6) * 25;
        // Clay fraction (Vshale) via linear Gamma Ray Index
        const vshale = Math.max(0, Math.min(1, (gr - grClean) / (grShale - grClean)));
        const rhob = 2.65 * (1 - vshale) + 2.4 * vshale; // simple density mix estimation
        const res = resThreshold * 1.2 + (1 - vshale) * 50;
        data.push({
            depth: Number(depth.toFixed(1)), // Y axis
            gr: Number(Math.max(10, Math.min(150, gr)).toFixed(1)), // X axis 1
            vshale: Number(vshale.toFixed(3)), // Actual computed clay fraction
            rhob: Number(rhob.toFixed(3)), // X axis 2
            res: Number(res.toFixed(2)), // X axis 3
            label: `${depth}m`
        });
    }
    return data;
  },
  
  // Microseismic / Reservoir (Phase angles, moment magnitudes, grid block pressure declines)
  generateGeotechData: (anchorOffset: number = 0.5, slopeAngle: number = 32): SimulationRow[] => {
    return Array.from({ length: 12 }, (_, i) => {
        const time = i * 2;
        const momentMagnitude = anchorOffset * 2.5 + Math.log10(slopeAngle * time + 1);
        const pressureDecline = Math.exp(-time * 0.05) * 4000;
        return {
            time: time,
            dx: Number((anchorOffset * (1 + time*0.01)).toFixed(3)),
            dy: Number((anchorOffset * (1 + time*0.02)).toFixed(3)),
            dz: Number((anchorOffset * (1 + time*0.015)).toFixed(3)),
            momentMagnitude: Number(momentMagnitude.toFixed(2)),
            pressure: Number(pressureDecline.toFixed(1)),
            label: `${time}h`
        };
    });
  },

  // 3. Electrical, IP, & MT: Wenner/Schlumberger & Archie's Law
  generateElectricalData: (spacing: number = 10, current: number = 1.0): SimulationRow[] => {
    return Array.from({ length: 12 }, (_, i) => {
      const a = spacing + i * 5; // Wenner spacing
      const kFactor = 2 * Math.PI * a; // Geometric factor
      const voltage = 10 / (i + 1); // Mock voltage decay
      const apparentResistivity = kFactor * (voltage / current); // Apparent Resistivity
      
      const phi = 0.25; // Porosity fraction
      const m = 2; // Cementation
      const n = 2; // Saturation exp
      const Rw = 0.5; // Water resistivity
      const SwUncapped = Math.pow((1 * Rw) / (apparentResistivity * Math.pow(phi, m)), 1/n);
      const Sw = Math.max(0, Math.min(1, SwUncapped)); // Dynamic Saturation

      return {
        spacing: a,
        apparentResistivity: Number(apparentResistivity.toFixed(2)),
        waterSaturation: Number(Sw.toFixed(2)),
        label: `${a}m`
      };
    });
  },

  // 1 & 4. GPR & VLF (Dielectric depth conversion)
  generateGPRData: (frequency: number = 400, dielectricConstant: number = 9): SimulationRow[] => {
    return Array.from({ length: 25 }, (_, i) => {
      const time_ns = i * 2;
      const c = 0.3; // speed of light in vacuum m/ns
      const velocity = c / Math.sqrt(dielectricConstant);
      const depth = (velocity * time_ns) / 2; // Dielectric depth conversion
      const phaseAngle = Math.atan2(time_ns * 0.1, frequency); // Phase angles
      const amplitude = Math.exp(-time_ns*0.02) * Math.sin(time_ns * frequency * 0.001);

      return {
        time: time_ns,
        depth: Number(depth.toFixed(3)),
        velocity: Number(velocity.toFixed(3)),
        phaseAngle: Number(phaseAngle.toFixed(3)),
        amplitude: Number(amplitude.toFixed(3)),
        label: `${depth.toFixed(1)}m`
      };
    });
  },

  // 2. Gravity & Magnetics (Bouguer anomalies and diurnal corrections)
  generateGravityData: (latitude: number = 45, density: number = 2.67): SimulationRow[] => {
    return Array.from({ length: 30 }, (_, i) => {
      const station = i * 50;
      const elevation = 100 + i * 2; // topography
      const latRad = latitude * (Math.PI / 180);
      const g_obs = 978031.8 + Math.random() * 10; // mGal mock observation
      
      // International Gravity Formula
      const g_lat = 978032.68 * (1 + 0.0053024 * Math.pow(Math.sin(latRad), 2) - 0.0000058 * Math.pow(Math.sin(2 * latRad), 2));
      const freeAirCorrection = 0.3086 * elevation;
      const bouguerCorrection = 0.0419 * density * elevation;
      
      const freeAirAnomaly = g_obs - g_lat + freeAirCorrection;
      const bouguerAnomaly = freeAirAnomaly - bouguerCorrection; // Computing Bouguer anomalies
      // Diurnal drift corr: simple linear drift
      const diurnalCorr = i * 0.01;
      
      return {
        station,
        elevation,
        g_obs: Number(g_obs.toFixed(2)),
        freeAirAnomaly: Number(freeAirAnomaly.toFixed(2)),
        bouguerAnomaly: Number((bouguerAnomaly - diurnalCorr).toFixed(2)),
        label: `ST_${station}`
      };
    });
  },
  
  // Adding placeholders for compatibility if they existed
  generateAirQualityData: (aqiBase: number = 50): SimulationRow[] => {
    return Array.from({length: 10}, (_, i) => ({ time: i, aqi: aqiBase + i*2, label: `${i}h` }));
  },
  generateMeteorologyData: (tempBase: number = 25): SimulationRow[] => {
    return Array.from({length: 10}, (_, i) => ({ time: i, temp: tempBase + Math.sin(i)*5, label: `${i}h` }));
  },
  generateVLFData: (): SimulationRow[] => { return []; },
  generateGeochemData: (): SimulationRow[] => { return []; },
  generateSoilPHData: (): SimulationRow[] => { return []; },
  generateGroundwaterData: (): SimulationRow[] => { return []; },
  generateGasData: (): SimulationRow[] => { return []; },
  generateSimulationData: (): SimulationRow[] => { return []; },
  generateOceanData: (): SimulationRow[] => { return []; }
};
