/**
 * Irish Locations Data
 * Comprehensive list of all counties and cities in Ireland
 * for consistent use across the application
 */

export interface IrishCounty {
  name: string;
  code: string;
  province: string;
  jurisdiction: 'Republic' | 'Northern Ireland';
}

export interface IrishCity {
  name: string;
  county: string;
  population?: number;
  coordinates?: { lat: number; lng: number };
}

export const IRISH_COUNTIES: IrishCounty[] = [
  // Republic of Ireland - Leinster
  { name: 'Dublin', code: 'DB', province: 'Leinster', jurisdiction: 'Republic' },
  { name: 'Wicklow', code: 'WW', province: 'Leinster', jurisdiction: 'Republic' },
  { name: 'Wexford', code: 'WX', province: 'Leinster', jurisdiction: 'Republic' },
  { name: 'Carlow', code: 'CW', province: 'Leinster', jurisdiction: 'Republic' },
  { name: 'Kildare', code: 'KE', province: 'Leinster', jurisdiction: 'Republic' },
  { name: 'Meath', code: 'MH', province: 'Leinster', jurisdiction: 'Republic' },
  { name: 'Louth', code: 'LH', province: 'Leinster', jurisdiction: 'Republic' },
  { name: 'Longford', code: 'LD', province: 'Leinster', jurisdiction: 'Republic' },
  { name: 'Westmeath', code: 'WH', province: 'Leinster', jurisdiction: 'Republic' },
  { name: 'Offaly', code: 'OY', province: 'Leinster', jurisdiction: 'Republic' },
  { name: 'Laois', code: 'LS', province: 'Leinster', jurisdiction: 'Republic' },
  { name: 'Kilkenny', code: 'KK', province: 'Leinster', jurisdiction: 'Republic' },

  // Republic of Ireland - Munster
  { name: 'Cork', code: 'CK', province: 'Munster', jurisdiction: 'Republic' },
  { name: 'Kerry', code: 'KY', province: 'Munster', jurisdiction: 'Republic' },
  { name: 'Limerick', code: 'LK', province: 'Munster', jurisdiction: 'Republic' },
  { name: 'Tipperary', code: 'TA', province: 'Munster', jurisdiction: 'Republic' },
  { name: 'Waterford', code: 'WD', province: 'Munster', jurisdiction: 'Republic' },
  { name: 'Clare', code: 'CE', province: 'Munster', jurisdiction: 'Republic' },

  // Republic of Ireland - Connacht
  { name: 'Galway', code: 'GY', province: 'Connacht', jurisdiction: 'Republic' },
  { name: 'Mayo', code: 'MO', province: 'Connacht', jurisdiction: 'Republic' },
  { name: 'Roscommon', code: 'RN', province: 'Connacht', jurisdiction: 'Republic' },
  { name: 'Sligo', code: 'SO', province: 'Connacht', jurisdiction: 'Republic' },
  { name: 'Leitrim', code: 'LM', province: 'Connacht', jurisdiction: 'Republic' },

  // Republic of Ireland - Ulster (3 counties)
  { name: 'Donegal', code: 'DL', province: 'Ulster', jurisdiction: 'Republic' },
  { name: 'Cavan', code: 'CN', province: 'Ulster', jurisdiction: 'Republic' },
  { name: 'Monaghan', code: 'MN', province: 'Ulster', jurisdiction: 'Republic' },

  // Northern Ireland - Ulster (6 counties)
  { name: 'Antrim', code: 'ANT', province: 'Ulster', jurisdiction: 'Northern Ireland' },
  { name: 'Armagh', code: 'ARM', province: 'Ulster', jurisdiction: 'Northern Ireland' },
  { name: 'Down', code: 'DOW', province: 'Ulster', jurisdiction: 'Northern Ireland' },
  { name: 'Fermanagh', code: 'FER', province: 'Ulster', jurisdiction: 'Northern Ireland' },
  { name: 'Londonderry', code: 'LDY', province: 'Ulster', jurisdiction: 'Northern Ireland' },
  { name: 'Tyrone', code: 'TYR', province: 'Ulster', jurisdiction: 'Northern Ireland' },
];

export const MAJOR_IRISH_CITIES: IrishCity[] = [
  // Major Cities
  { name: 'Dublin', county: 'Dublin', population: 1173179, coordinates: { lat: 53.3498, lng: -6.2603 } },
  { name: 'Cork', county: 'Cork', population: 208669, coordinates: { lat: 51.8979, lng: -8.4769 } },
  { name: 'Belfast', county: 'Antrim', population: 343542, coordinates: { lat: 54.5973, lng: -5.9301 } },
  { name: 'Galway', county: 'Galway', population: 79934, coordinates: { lat: 53.2707, lng: -9.0568 } },
  { name: 'Limerick', county: 'Limerick', population: 94192, coordinates: { lat: 52.6638, lng: -8.6267 } },
  { name: 'Waterford', county: 'Waterford', population: 53504, coordinates: { lat: 52.2593, lng: -7.1101 } },

  // Large Towns & Regional Centers
  { name: 'Drogheda', county: 'Louth', population: 40956, coordinates: { lat: 53.7189, lng: -6.3478 } },
  { name: 'Kilkenny', county: 'Kilkenny', population: 26512, coordinates: { lat: 52.6541, lng: -7.2448 } },
  { name: 'Wexford', county: 'Wexford', population: 20072, coordinates: { lat: 52.3369, lng: -6.4633 } },
  { name: 'Sligo', county: 'Sligo', population: 19199, coordinates: { lat: 54.2698, lng: -8.4694 } },
  { name: 'Dundalk', county: 'Louth', population: 39004, coordinates: { lat: 54.0019, lng: -6.4052 } },
  { name: 'Bray', county: 'Wicklow', population: 32600, coordinates: { lat: 53.2026, lng: -6.1114 } },
  { name: 'Navan', county: 'Meath', population: 30173, coordinates: { lat: 53.6538, lng: -6.6802 } },
  { name: 'Ennis', county: 'Clare', population: 25276, coordinates: { lat: 52.8438, lng: -8.9864 } },
  { name: 'Tralee', county: 'Kerry', population: 23691, coordinates: { lat: 52.2713, lng: -9.7016 } },
  { name: 'Carlow', county: 'Carlow', population: 24272, coordinates: { lat: 52.8417, lng: -6.9264 } },
  { name: 'Naas', county: 'Kildare', population: 21393, coordinates: { lat: 53.2158, lng: -6.6686 } },
  { name: 'Athlone', county: 'Westmeath', population: 21349, coordinates: { lat: 53.4222, lng: -7.9372 } },
  { name: 'Portlaoise', county: 'Laois', population: 22050, coordinates: { lat: 53.0344, lng: -7.2985 } },
  { name: 'Mullingar', county: 'Westmeath', population: 20928, coordinates: { lat: 53.5239, lng: -7.3398 } },

  // Northern Ireland Cities & Towns
  { name: 'Derry', county: 'Londonderry', population: 85016, coordinates: { lat: 54.9966, lng: -7.3086 } },
  { name: 'Lisburn', county: 'Antrim', population: 45370, coordinates: { lat: 54.5162, lng: -6.0581 } },
  { name: 'Newry', county: 'Down', population: 26967, coordinates: { lat: 54.1751, lng: -6.3402 } },
  { name: 'Armagh', county: 'Armagh', population: 14777, coordinates: { lat: 54.3503, lng: -6.6528 } },
  { name: 'Omagh', county: 'Tyrone', population: 19659, coordinates: { lat: 54.6017, lng: -7.3073 } },
  { name: 'Enniskillen', county: 'Fermanagh', population: 13823, coordinates: { lat: 54.3445, lng: -7.6362 } },
  { name: 'Ballymena', county: 'Antrim', population: 29467, coordinates: { lat: 54.8642, lng: -6.2736 } },
  { name: 'Coleraine', county: 'Londonderry', population: 24634, coordinates: { lat: 55.1344, lng: -6.6681 } },
  { name: 'Bangor', county: 'Down', population: 61011, coordinates: { lat: 54.6536, lng: -5.6683 } },

  // Additional Regional Centers
  { name: 'Letterkenny', county: 'Donegal', population: 19274, coordinates: { lat: 54.9503, lng: -7.7353 } },
  { name: 'Tullamore', county: 'Offaly', population: 14361, coordinates: { lat: 53.2736, lng: -7.4881 } },
  { name: 'Clonmel', county: 'Tipperary', population: 17908, coordinates: { lat: 52.3553, lng: -7.7044 } },
  { name: 'Killarney', county: 'Kerry', population: 14504, coordinates: { lat: 52.0599, lng: -9.5044 } },
  { name: 'Westport', county: 'Mayo', population: 6198, coordinates: { lat: 53.8008, lng: -9.5182 } },
  { name: 'Castlebar', county: 'Mayo', population: 12068, coordinates: { lat: 53.8561, lng: -9.2985 } },
  { name: 'Ballina', county: 'Mayo', population: 10171, coordinates: { lat: 54.1133, lng: -9.1561 } },
  { name: 'Longford', county: 'Longford', population: 10008, coordinates: { lat: 53.7278, lng: -7.7933 } },
  { name: 'Roscommon', county: 'Roscommon', population: 5693, coordinates: { lat: 53.6278, lng: -8.1861 } },
  { name: 'Cavan', county: 'Cavan', population: 10914, coordinates: { lat: 53.9906, lng: -7.3606 } },
  { name: 'Monaghan', county: 'Monaghan', population: 7678, coordinates: { lat: 54.2489, lng: -6.9683 } },
];

// Utility functions
export const getAllCountyNames = (): string[] => {
  return IRISH_COUNTIES.map(county => county.name).sort();
};

export const getAllCityNames = (): string[] => {
  return MAJOR_IRISH_CITIES.map(city => city.name).sort();
};

export const getCountiesByProvince = (province: string): IrishCounty[] => {
  return IRISH_COUNTIES.filter(county => county.province === province);
};

export const getCountiesByJurisdiction = (jurisdiction: 'Republic' | 'Northern Ireland'): IrishCounty[] => {
  return IRISH_COUNTIES.filter(county => county.jurisdiction === jurisdiction);
};

export const getCitiesByCounty = (countyName: string): IrishCity[] => {
  return MAJOR_IRISH_CITIES.filter(city => city.county === countyName);
};

export const getMajorCitiesForDropdown = (): Array<{ value: string; label: string; county: string }> => {
  return MAJOR_IRISH_CITIES
    .filter(city => city.population && city.population > 5000) // Only cities with 5k+ population
    .sort((a, b) => (b.population || 0) - (a.population || 0)) // Sort by population desc
    .map(city => ({
      value: city.name,
      label: `${city.name}, ${city.county}`,
      county: city.county
    }));
};

export const getAllLocationsForDropdown = (): Array<{ value: string; label: string; type: 'county' | 'city' }> => {
  const counties = IRISH_COUNTIES.map(county => ({
    value: county.name,
    label: `${county.name} (County)`,
    type: 'county' as const
  }));

  const cities = MAJOR_IRISH_CITIES
    .filter(city => city.population && city.population > 5000)
    .map(city => ({
      value: city.name,
      label: `${city.name}, ${city.county}`,
      type: 'city' as const
    }));

  return [...counties, ...cities].sort((a, b) => a.label.localeCompare(b.label));
};

// Location matching function for filtering bands
export const matchesLocation = (bandLocation: string | null | undefined, selectedLocation: string): boolean => {
  if (!bandLocation || !selectedLocation) {
    return false;
  }

  // Normalize both strings for comparison (lowercase, trim)
  const normalizedBandLocation = bandLocation.toLowerCase().trim();
  const normalizedSelectedLocation = selectedLocation.toLowerCase().trim();

  // Direct match
  if (normalizedBandLocation === normalizedSelectedLocation) {
    return true;
  }

  // Check if band location contains the selected location
  if (normalizedBandLocation.includes(normalizedSelectedLocation)) {
    return true;
  }

  // Check if selected location is a county and band location is in that county
  const selectedCounty = IRISH_COUNTIES.find(county => 
    county.name.toLowerCase() === normalizedSelectedLocation
  );
  
  if (selectedCounty) {
    // Check if band location contains the county name
    if (normalizedBandLocation.includes(selectedCounty.name.toLowerCase())) {
      return true;
    }
    
    // Check if band location is a city in this county
    const citiesInCounty = MAJOR_IRISH_CITIES.filter(city => 
      city.county.toLowerCase() === selectedCounty.name.toLowerCase()
    );
    
    return citiesInCounty.some(city => 
      normalizedBandLocation.includes(city.name.toLowerCase())
    );
  }

  // Check if selected location is a city and band location contains it
  const selectedCity = MAJOR_IRISH_CITIES.find(city => 
    city.name.toLowerCase() === normalizedSelectedLocation
  );
  
  if (selectedCity) {
    return normalizedBandLocation.includes(selectedCity.name.toLowerCase());
  }

  return false;
};

// Province groupings for advanced filtering
export const PROVINCES = {
  'Leinster': getCountiesByProvince('Leinster'),
  'Munster': getCountiesByProvince('Munster'),
  'Connacht': getCountiesByProvince('Connacht'),
  'Ulster (ROI)': getCountiesByProvince('Ulster').filter(c => c.jurisdiction === 'Republic'),
  'Ulster (NI)': getCountiesByProvince('Ulster').filter(c => c.jurisdiction === 'Northern Ireland'),
};

export default {
  IRISH_COUNTIES,
  MAJOR_IRISH_CITIES,
  getAllCountyNames,
  getAllCityNames,
  getCountiesByProvince,
  getCountiesByJurisdiction,
  getCitiesByCounty,
  getMajorCitiesForDropdown,
  getAllLocationsForDropdown,
  matchesLocation,
  PROVINCES
};
