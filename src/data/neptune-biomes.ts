import { Cloud, Gauge, Orbit, Snowflake, Waves } from '@lucide/vue';
import type { NeptuneBiomeId } from '../lib/neptune-terrain';

export const neptuneBiomes = [
  {
    id: 'neptune-bands',
    name: 'Bands',
    icon: Waves,
    color: '#287fd4',
    lat: 8,
    lon: 90,
    label: 'Deep blue cloud bands',
  },
  {
    id: 'neptune-dark-spot',
    name: 'Dark Spot',
    icon: Cloud,
    color: '#123f91',
    lat: -22,
    lon: -55,
    label: 'Great Dark Spot',
  },
  {
    id: 'neptune-scooter',
    name: 'Scooter',
    icon: Gauge,
    color: '#d6f4ff',
    lat: -42,
    lon: 32,
    label: 'Fast white Scooter cloud',
  },
  {
    id: 'neptune-poles',
    name: 'Polar clouds',
    icon: Snowflake,
    color: '#61b9eb',
    lat: 78,
    lon: 0,
    label: 'Bright polar clouds',
  },
  {
    id: 'neptune-rings',
    name: 'Rings',
    icon: Orbit,
    color: '#6b7890',
    lat: 20,
    lon: 0,
    label: 'Faint ring arcs',
  },
] satisfies {
  id: NeptuneBiomeId;
  name: string;
  icon: typeof Waves;
  color: string;
  lat: number;
  lon: number;
  label: string;
}[];
