import Papa from 'papaparse';
import { RawCsvRow } from '../types';

export type ParseResult = {
  success: boolean;
  data?: RawCsvRow[];
  headers?: string[];
  error?: string;
};

export const parseCsv = (file: File): Promise<ParseResult> => {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const { data, meta } = results;
        const headers = meta.fields || [];

        // 1. Validate Headers
        const requiredHeaders = ['date', 'irradiation_h', 'plant_pdc_kw'];
        const missing = requiredHeaders.filter(h => !headers.includes(h));
        if (missing.length > 0) {
          return resolve({
            success: false,
            error: `Missing required headers: ${missing.join(', ')}`
          });
        }

        const pcsColumns = headers.filter(h => h.startsWith('pcs_') && h.endsWith('_kwh'));
        if (pcsColumns.length === 0) {
          return resolve({
            success: false,
            error: 'No PCS columns found (pcs_XXX_kwh)'
          });
        }

        if (!data || data.length === 0) {
          return resolve({
            success: false,
            error: 'No data rows found.'
          });
        }

        // 2. Type Conversion & Validation
        const parsedRows: RawCsvRow[] = [];
        
        // Capture the first row's plant_pdc_kw to use for all rows (as per requirement)
        let firstRowPlantPdcKw: number | null = null;

        for (let i = 0; i < data.length; i++) {
          const row = data[i] as any;
          
          // Validate Date
          if (!row.date || !/^\d{4}-\d{2}-\d{2}$/.test(row.date)) {
             // Skip empty lines or invalid dates gracefully, or error? 
             // PRD says "Row 5 ... cannot be interpreted", implying we should catch errors.
             // But to be robust, let's try to parse what we can.
             // Actually PRD says: "Error if... value type error".
             return resolve({
               success: false,
               error: `Row ${i + 2}: Invalid date format (expected YYYY-MM-DD). Value: ${row.date}`
             });
          }

          // Validate irradiation_h
          const irr = parseFloat(row.irradiation_h);
          if (isNaN(irr) || irr < 0) {
             return resolve({
               success: false,
               error: `Row ${i + 2}: Invalid irradiation_h. Value: ${row.irradiation_h}`
             });
          }

          // Validate plant_pdc_kw
          // Requirement: "Use 1st row value, ignore subsequent".
          // However, we still need to read it from the first row.
          if (i === 0) {
            const pdc = parseFloat(row.plant_pdc_kw);
            if (isNaN(pdc) || pdc <= 0) {
              return resolve({
                success: false,
                error: `Row ${i + 2}: Invalid plant_pdc_kw. Value: ${row.plant_pdc_kw}`
              });
            }
            firstRowPlantPdcKw = pdc;
          }

          // Validate PCS columns
          const pcsValues: Record<string, number | null> = {};
          for (const col of pcsColumns) {
            const valStr = row[col];
            if (valStr === undefined || valStr === '' || valStr === null) {
              pcsValues[col] = null;
            } else {
              const val = parseFloat(valStr);
              if (isNaN(val) || val < 0) {
                 return resolve({
                   success: false,
                   error: `Row ${i + 2}: Invalid value for ${col}. Value: ${valStr}`
                 });
              }
              pcsValues[col] = val;
            }
          }

          // Construct RawCsvRow
          const cleanRow: RawCsvRow = {
            date: row.date,
            irradiation_h: irr,
            plant_pdc_kw: firstRowPlantPdcKw!, // safe assert, we checked i=0
            ...pcsValues,
            // Keep other potential columns? PRD implies we just need these.
            // We'll spread ...row to keep extras for "Raw Data" view if needed, 
            // but type definition restricts us. Let's stick to what we parsed.
            // Actually, "Raw Data + PR Table" implies we show original data.
            // Let's spread the original row but overwrite with parsed numbers where valid
            ...row, 
            ...pcsValues,
            irradiation_h: irr,
            plant_pdc_kw: firstRowPlantPdcKw! 
          };

          parsedRows.push(cleanRow);
        }

        resolve({
          success: true,
          data: parsedRows,
          headers: headers
        });
      },
      error: (err) => {
        resolve({
          success: false,
          error: `CSV Parsing failed: ${err.message}`
        });
      }
    });
  });
};
