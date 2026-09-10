import { Waves, Cloud, Wind, Circle, Snowflake } from '@lucide/vue';
import type { JupiterBiomeId } from '../lib/jupiter-terrain';

export const jupiterBiomes = [
  {
    id: 'jupiter-belts',
    name: 'Belts',
    icon: Waves,
    color: '#bc825b',
    lat: 16,
    lon: 0,
    label: 'Cloud belts',
  },
  {
    id: 'jupiter-zones',
    name: 'Zones',
    icon: Cloud,
    color: '#e9d9bc',
    lat: 0,
    lon: 0,
    label: 'Bright cloud zones',
  },
  {
    id: 'jupiter-spot',
    name: 'Red Spot',
    icon: Wind,
    color: '#c7613d',
    lat: -22,
    lon: 12,
    label: 'Great Red Spot',
  },
  {
    id: 'jupiter-ovals',
    name: 'Ovals',
    icon: Circle,
    color: '#f4e6d0',
    lat: -40,
    lon: -20,
    label: 'White oval storms',
  },
  {
    id: 'jupiter-poles',
    name: 'Poles',
    icon: Snowflake,
    color: '#969084',
    lat: 80,
    lon: 0,
    label: 'Polar clouds',
  },
] satisfies {
  id: JupiterBiomeId;
  name: string;
  icon: typeof Waves;
  color: string;
  lat: number;
  lon: number;
  label: string;
}[];
