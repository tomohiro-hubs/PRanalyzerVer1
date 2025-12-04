import { RawCsvRow } from '../types';

export const generateDemoData = (): { rows: RawCsvRow[], headers: string[] } => {
  const rows: RawCsvRow[] = [];
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 1); // Start 1 month ago
  
  const days = 30;
  const pcsCount = 5; // Create 5 demo PCS units
  const headers = ['date', 'irradiation_h', 'plant_pdc_kw'];
  
  for (let i = 1; i <= pcsCount; i++) {
    headers.push(`pcs_1-1-${i}_kwh`);
  }

  for (let i = 0; i < days; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    // Random irradiation between 1.0 and 6.0
    const irradiation = 1.0 + Math.random() * 5.0;
    
    // Plant capacity
    const plantPdcKw = 250.0; // 50kW * 5 PCS

    const row: any = {
      date: dateStr,
      irradiation_h: parseFloat(irradiation.toFixed(2)),
      plant_pdc_kw: plantPdcKw,
    };

    // Generate PCS data
    for (let p = 1; p <= pcsCount; p++) {
      // Base generation with some randomness
      // Ideal gen = irradiation * 50kW
      // Apply efficiency 90% + random noise
      const efficiency = 0.9 + (Math.random() * 0.1 - 0.05);
      const pcsGen = irradiation * 50.0 * efficiency;
      
      // Occasionally simulate a fault (very low generation)
      const isFault = Math.random() > 0.95;
      const finalGen = isFault ? pcsGen * 0.1 : pcsGen;

      row[`pcs_1-1-${p}_kwh`] = parseFloat(finalGen.toFixed(1));
    }

    rows.push(row);
  }

  return { rows, headers };
};
