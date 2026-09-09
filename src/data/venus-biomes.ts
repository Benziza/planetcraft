import { CircleDot, Mountain, Sun, Waves } from '@lucide/vue';
import type { VenusBiomeId } from '../lib/venus-terrain';

export const venusBiomes = [
  {
    id: 'venus-plains',
    name: 'Plains',
    icon: Sun,
    color: '#d6b574',
    lat: 10,
    lon: 25,
    label: 'Volcanic plains',
  },
  {
    id: 'venus-crater',
    name: 'Craters',
    icon: CircleDot,
    color: '#b99568',
    lat: -30,
    lon: 28,
    label: 'Impact craters',
  },
  {
    id: 'venus-volcano',
    name: 'Volcano',
    icon: Mountain,
    color: '#b59070',
    lat: 20,
    lon: -38,
    label: 'Volcanic peaks',
  },
  {
    id: 'venus-highlands',
    name: 'Highlands',
    icon: Mountain,
    color: '#e2cca0',
    lat: 55,
    lon: 100,
    label: 'Rocky highlands',
  },
  {
    id: 'venus-rift',
    name: 'Rifts',
    icon: Waves,
    color: '#ad895e',
    lat: -11,
    lon: -30,
    label: 'Deep rift valleys',
  },
] satisfies {
  id: VenusBiomeId;
  name: string;
  icon: typeof Sun;
  color: string;
  lat: number;
  lon: number;
  label: string;
}[];
