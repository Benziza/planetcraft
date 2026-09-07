import { CircleDot, Mountain, Snowflake, Sun, Waves } from '@lucide/vue';
import type { MarsBiomeId } from '../lib/mars-terrain';

export const marsBiomes = [
  {
    id: 'dunes',
    name: 'Dunes',
    icon: Sun,
    color: '#e9a077',
    lat: 10,
    lon: 25,
    label: 'Red dunes',
  },
  {
    id: 'crater',
    name: 'Craters',
    icon: CircleDot,
    color: '#cf8c72',
    lat: -30,
    lon: 28,
    label: 'Impact craters',
  },
  {
    id: 'volcano',
    name: 'Volcano',
    icon: Mountain,
    color: '#b89181',
    lat: 20,
    lon: -38,
    label: 'Volcanic highlands',
  },
  {
    id: 'canyon',
    name: 'Canyon',
    icon: Waves,
    color: '#d08064',
    lat: -9,
    lon: -30,
    label: 'Deep canyons',
  },
  {
    id: 'ice',
    name: 'Ice caps',
    icon: Snowflake,
    color: '#e4dfd4',
    lat: 85,
    lon: 0,
    label: 'Polar ice caps',
  },
] satisfies {
  id: MarsBiomeId;
  name: string;
  icon: typeof Sun;
  color: string;
  lat: number;
  lon: number;
  label: string;
}[];
