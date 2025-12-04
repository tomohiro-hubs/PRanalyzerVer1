export type PlantMeta = {
  id: string;
  name: string;
  defaultPdcKw: number;
};

export type PcsMeta = {
  id: string;
  name: string;
  ratedDcKw: number;
};

export type AppMeta = {
  plant: PlantMeta;
  pcsList: PcsMeta[];
};

// Represents a raw row after parsing CSV but before complex processing
// Note: dynamic keys for pcs_*_kwh are handled via index signature or mapping
export type RawCsvRow = {
  date: string;
  temp_avg_c?: number | null;
  temp_max_c?: number | null;
  temp_min_c?: number | null;
  irradiation_h: number;
  plant_pdc_kw: number; 
  [key: string]: any; // To allow pcs_XXX_kwh dynamic access
};

export type PlantDaily = {
  date: string;
  irradiationH: number;
  plantPdcKw: number;
  energyTotalKwh: number;      
  prPlantPercent: number | null; 
};

export type PcsDaily = {
  date: string;
  pcsId: string;          
  energyAcKwh: number;    
  irradiationH: number;
  prPcsPercent: number | null;
};

export type ProcessedData = {
  plantDaily: PlantDaily[];
  pcsDaily: PcsDaily[];
  summary: {
    startDate: string;
    endDate: string;
    totalDays: number;
    pcsCount: number;
    avgPlantPr: number | null;
    maxPrDate: string | null;
    minPrDate: string | null;
  };
  rawRows: RawCsvRow[]; // Kept for export
  headers: string[];    // Original headers
};
