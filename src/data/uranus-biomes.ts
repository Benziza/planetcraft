import { Circle, Cloud, Orbit, Snowflake, Waves } from '@lucide/vue';
import type { UranusBiomeId } from '../lib/uranus-terrain';

export const uranusBiomes = [
  {
    id: 'uranus-bands',
    name: 'Bands',
    icon: Waves,
    color: '#78cbd1',
    lat: 5,
    lon: 20,
    label: 'Faint cloud bands',
  },
  {
    id: 'uranus-storms',
    name: 'Storms',
    icon: Cloud,
    color: '#e6f8f2',
    lat: 27,
    lon: -42,
    label: 'Bright methane storms',
  },
  {
    id: 'uranus-polar-cap',
    name: 'Polar cap',
    icon: Snowflake,
    color: '#afe2df',
    lat: 76,
    lon: 0,
    label: 'Pale polar cap',
  },
  {
    id: 'uranus-collar',
    name: 'Collar',
    icon: Circle,
    color: '#58aebb',
    lat: 48,
    lon: 0,
    label: 'Polar cloud collar',
  },
  {
    id: 'uranus-rings',
    name: 'Rings',
    icon: Orbit,
    color: '#92a5a4',
    lat: 18,
    lon: 0,
    label: 'Dark narrow rings',
  },
] satisfies {
  id: UranusBiomeId;
  name: string;
  icon: typeof Waves;
  color: string;
  lat: number;
  lon: number;
  label: string;
}[];
