import { RawCsvRow, PlantDaily, PcsDaily, AppMeta, ProcessedData } from '../types';

export const processData = (rows: RawCsvRow[], headers: string[], meta: AppMeta): ProcessedData => {
  const plantDailyList: PlantDaily[] = [];
  const pcsDailyList: PcsDaily[] = [];
  const pcsColumns = headers.filter(h => h.startsWith('pcs_') && h.endsWith('_kwh'));

  // Helper to get Rated DC for a PCS ID
  const getRatedDc = (pcsId: string): number | undefined => {
    const pcs = meta.pcsList.find(p => p.id === pcsId);
    return pcs?.ratedDcKw;
  };

  let totalPlantPrSum = 0;
  let validPrDays = 0;
  let maxPr = -1;
  let minPr = 9999;
  let maxPrDate: string | null = null;
  let minPrDate: string | null = null;

  rows.forEach(row => {
    const { date, irradiation_h, plant_pdc_kw } = row;

    // 1. Calculate Plant Daily
    let energyTotalKwh = 0;
    pcsColumns.forEach(col => {
      const val = row[col];
      if (typeof val === 'number') {
        energyTotalKwh += val;
      }
    });

    let prPlantPercent: number | null = null;
    if (irradiation_h > 0 && plant_pdc_kw > 0) {
      prPlantPercent = (energyTotalKwh / (irradiation_h * plant_pdc_kw)) * 100;
    }

    plantDailyList.push({
      date,
      irradiationH: irradiation_h,
      plantPdcKw: plant_pdc_kw,
      energyTotalKwh,
      prPlantPercent
    });

    // Stats Calculation
    if (prPlantPercent !== null) {
      totalPlantPrSum += prPlantPercent;
      validPrDays++;
      
      if (prPlantPercent > maxPr) {
        maxPr = prPlantPercent;
        maxPrDate = date;
      }
      if (prPlantPercent < minPr) {
        minPr = prPlantPercent;
        minPrDate = date;
      }
    }

    // 2. Calculate PCS Daily
    pcsColumns.forEach(col => {
      // col format: pcs_{id}_kwh
      const pcsId = col.replace(/^pcs_/, '').replace(/_kwh$/, '');
      const energyAcKwh = (typeof row[col] === 'number') ? row[col] : 0;
      const ratedDcKw = getRatedDc(pcsId);

      let prPcsPercent: number | null = null;
      if (ratedDcKw && irradiation_h > 0) {
        prPcsPercent = (energyAcKwh / (irradiation_h * ratedDcKw)) * 100;
      }

      pcsDailyList.push({
        date,
        pcsId,
        energyAcKwh,
        irradiationH: irradiation_h,
        prPcsPercent
      });
    });
  });

  // Summary
  const startDate = rows.length > 0 ? rows[0].date : '';
  const endDate = rows.length > 0 ? rows[rows.length - 1].date : '';
  const avgPlantPr = validPrDays > 0 ? totalPlantPrSum / validPrDays : null;

  return {
    plantDaily: plantDailyList,
    pcsDaily: pcsDailyList,
    summary: {
      startDate,
      endDate,
      totalDays: rows.length,
      pcsCount: pcsColumns.length,
      avgPlantPr,
      maxPrDate: validPrDays > 0 ? maxPrDate : null,
      minPrDate: validPrDays > 0 ? minPrDate : null,
    },
    rawRows: rows,
    headers
  };
};
