import { Mountain, Snowflake, Sun, Trees, Waves } from '@lucide/vue';
import type { BiomeId } from '../lib/voxel-earth';

export const biomes = [
  {
    id: 'forest',
    name: 'Forest',
    icon: Trees,
    color: '#a5ce78',
    lat: -5,
    lon: -61,
    label: 'Amazon rainforest',
  },
  {
    id: 'desert',
    name: 'Desert',
    icon: Sun,
    color: '#dfc087',
    lat: 24,
    lon: 15,
    label: 'Sahara desert',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    icon: Waves,
    color: '#83c4ef',
    lat: 6,
    lon: -145,
    label: 'Pacific Ocean',
  },
  {
    id: 'snow',
    name: 'Snow',
    icon: Snowflake,
    color: '#d1e1e7',
    lat: 73,
    lon: -41,
    label: 'Greenland ice sheet',
  },
  {
    id: 'mountain',
    name: 'Mountain',
    icon: Mountain,
    color: '#b9b7ab',
    lat: 30,
    lon: 85,
    label: 'The Himalayas',
  },
] satisfies {
  id: BiomeId;
  name: string;
  icon: typeof Trees;
  color: string;
  lat: number;
  lon: number;
  label: string;
}[];
