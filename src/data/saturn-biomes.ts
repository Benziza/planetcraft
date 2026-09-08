import { Cloud, Hexagon, Orbit, Waves, Wind } from '@lucide/vue';
import type { SaturnBiomeId } from '../lib/saturn-terrain';

export const saturnBiomes = [
  {
    id: 'saturn-bands',
    name: 'Bands',
    icon: Waves,
    color: '#d9bc83',
    lat: 8,
    lon: 30,
    label: 'Cloud bands',
  },
  {
    id: 'saturn-storms',
    name: 'Storms',
    icon: Wind,
    color: '#f3e2b7',
    lat: 35,
    lon: -32,
    label: 'Storm lanes',
  },
  {
    id: 'saturn-poles',
    name: 'Poles',
    icon: Cloud,
    color: '#af9670',
    lat: -85,
    lon: 0,
    label: 'Polar haze',
  },
  {
    id: 'saturn-hexagon',
    name: 'Hexagon',
    icon: Hexagon,
    color: '#7c8269',
    lat: 82,
    lon: 0,
    label: 'North hexagon',
  },
  {
    id: 'saturn-rings',
    name: 'Rings',
    icon: Orbit,
    color: '#e5d6ac',
    lat: 22,
    lon: 0,
    label: 'Icy rings',
  },
] satisfies {
  id: SaturnBiomeId;
  name: string;
  icon: typeof Waves;
  color: string;
  lat: number;
  lon: number;
  label: string;
}[];
