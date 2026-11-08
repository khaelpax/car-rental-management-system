import type { CityLocation } from '../types';

export const NORTH_SULAWESI_CITIES: CityLocation[] = [
  {
    name: 'Manado',
    latitude: 1.4748,
    longitude: 124.8421,
    province: 'Sulawesi Utara',
    description: 'Ibu kota provinsi, pusat transportasi dan bandara internasional Sam Ratulangi.',
  },
  {
    name: 'Tomohon',
    latitude: 1.3323,
    longitude: 124.8407,
    province: 'Sulawesi Utara',
    description: 'Kota bunga di dataran tinggi, berhawa sejuk di kaki Gunung Lokon.',
  },
  {
    name: 'Bitung',
    latitude: 1.4404,
    longitude: 125.1888,
    province: 'Sulawesi Utara',
    description: 'Kota pelabuhan industri dan gerbang wisata Selat Lembeh.',
  },
  {
    name: 'Tondano',
    latitude: 1.3061,
    longitude: 124.9126,
    province: 'Sulawesi Utara',
    description: 'Pusat pemerintahan Kabupaten Minahasa di tepi Danau Tondano.',
  },
  {
    name: 'Kotamobagu',
    latitude: 0.7306,
    longitude: 124.3139,
    province: 'Sulawesi Utara',
    description: 'Pusat perekonomian dan kebudayaan wilayah Bolaang Mongondow.',
  },
];

export const DEFAULT_CITY: CityLocation = NORTH_SULAWESI_CITIES[0]; // Manado
