export type ItemType = 'tree' | 'pine' | 'house' | 'castle' | 'cloud' | 'mountain' | 'flower';

export interface PlacedItem {
  id: string;
  type: ItemType;
  angle: number;   // degrees around equator (0-360)
  lat: number;     // latitude offset (-40 to 40 degrees from equator)
}

export type WeatherType = 'clear' | 'rain' | 'snow' | 'storm';
export type TimeOfDay = 'day' | 'night';
