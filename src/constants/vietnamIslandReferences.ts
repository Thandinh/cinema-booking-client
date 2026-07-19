export interface VietnamIslandReference {
  name: string;
  shortName: string;
  countryLabel: string;
  latitude: number;
  longitude: number;
  sourceLabel: string;
}

export const VIETNAM_ISLAND_REFERENCES: VietnamIslandReference[] = [
  {
    name: 'Quần đảo Hoàng Sa',
    shortName: 'Hoàng Sa',
    countryLabel: 'Việt Nam',
    latitude: 16.3447,
    longitude: 112.001,
    sourceLabel: 'OpenStreetMap/Mapcarta reference coordinate',
  },
  {
    name: 'Quần đảo Trường Sa',
    shortName: 'Trường Sa',
    countryLabel: 'Việt Nam',
    latitude: 10,
    longitude: 114,
    sourceLabel: 'Getty TGN/Wikidata archipelago reference coordinate',
  },
];
