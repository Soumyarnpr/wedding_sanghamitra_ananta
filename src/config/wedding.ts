import raw from './wedding.config.json';
import { dateValue, timeValue } from '../utils/dates';

export type Photo = { src: string; alt: string; caption: string };
type Config = Omit<typeof raw, 'gallery'> & { gallery: Photo[] };

export function secureUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : '';
  } catch {
    return '';
  }
}

const validPhoto = (item: Photo) => item && typeof item.src === 'string' && item.src.trim();

export const config: Config = {
  ...raw,
  gallery: (raw.gallery as Photo[]).filter(validPhoto),
  story: { ...raw.story, illustrations: raw.story.illustrations.filter(validPhoto) },
  events: raw.events.filter((event) => event.id && event.name && dateValue(event.date)),
};

export const errors = [
  !config.couple.bride.name.trim() || !config.couple.groom.name.trim() ? 'Enter both names.' : '',
  config.wedding.date && !dateValue(config.wedding.date) ? 'Use a valid YYYY-MM-DD wedding date.' : '',
  ...[config.wedding.startTime, config.wedding.endTime, config.wedding.countdown.time]
    .filter((value) => value && !timeValue(value)).map(() => 'Use 24-hour HH:mm wedding times.'),
].filter(Boolean);

try {
  new Intl.DateTimeFormat('en', { timeZone: config.wedding.timezone });
} catch {
  errors.push('Use a valid IANA wedding timezone.');
}

export const coupleName = config.couple.bride.name + ' & ' + config.couple.groom.name;
export const initials = config.couple.bride.name[0] + ' & ' + config.couple.groom.name[0];
export const venue = config.wedding.venue;
export const venueLocation = [venue.name, venue.address].filter(Boolean).join(', ');
const directionsParams = new URLSearchParams({ api: '1', destination: venueLocation });
if (venue.mapsPlaceId) directionsParams.set('destination_place_id', venue.mapsPlaceId);
export const directions = secureUrl(venue.mapsUrl) || (venueLocation ? 'https://www.google.com/maps/dir/?' + directionsParams : '');

export function eventVenue(event: Config['events'][number]) {
  return event.venue === 'wedding' ? venue.name : event.venue;
}
