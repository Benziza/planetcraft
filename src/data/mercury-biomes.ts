import { CircleDot, Mountain, Snowflake, Sun, Waves } from '@lucide/vue';
import type { MercuryBiomeId } from '../lib/mercury-terrain';

export const mercuryBiomes = [
  {
    id: 'mercury-plains',
    name: 'Plains',
    icon: Sun,
    color: '#aaa397',
    lat: 0,
    lon: 20,
    label: 'Smooth plains',
  },
  {
    id: 'mercury-crater',
    name: 'Craters',
    icon: CircleDot,
    color: '#817c74',
    lat: -32,
    lon: -45,
    label: 'Impact craters',
  },
  {
    id: 'mercury-caloris',
    name: 'Caloris',
    icon: CircleDot,
    color: '#c1ad93',
    lat: 30,
    lon: 160,
    label: 'Caloris Basin',
  },
  {
    id: 'mercury-scarp',
    name: 'Scarps',
    icon: Waves,
    color: '#74706a',
    lat: 8,
    lon: -60,
    label: 'Lobed scarps',
  },
  {
    id: 'mercury-polar',
    name: 'Polar ice',
    icon: Snowflake,
    color: '#d8d4c9',
    lat: 88,
    lon: 0,
    label: 'Polar ice deposits',
  },
] satisfies {
  id: MercuryBiomeId;
  name: string;
  icon: typeof Mountain;
  color: string;
  lat: number;
  lon: number;
  label: string;
}[];
