import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const mappings = [
  ['data/mock/mobile-app.json', 'mobile/data/mobile-app.json'],
  ['assets/fonts/PretendardVariable.woff2', 'mobile/assets/PretendardVariable.woff2'],
  ['assets/brand/official/hotelngo-logo-go-capsule-ibm-plex.svg', 'mobile/assets/hotelngo-logo.svg'],
  ['assets/images/hero-hotel.jpg', 'mobile/assets/danang.jpg'],
  ['assets/images/landmark-kyoto.jpg', 'mobile/assets/kyoto.jpg'],
  ['assets/images/landmark-bangkok.jpg', 'mobile/assets/bangkok.jpg'],
  ['assets/images/landmark-bali.jpg', 'mobile/assets/bali.jpg'],
  ['assets/images/marketplace/hotel-resort.jpg', 'mobile/assets/hotel.jpg'],
  ['assets/images/marketplace/hotel-room.jpg', 'mobile/assets/hotel-room.jpg'],
  ['assets/images/marketplace/restaurant-dining.jpg', 'mobile/assets/restaurant.jpg'],
  ['assets/images/marketplace/spa-treatment.jpg', 'mobile/assets/spa.jpg'],
  ['assets/images/marketplace/golf-course.jpg', 'mobile/assets/golf.jpg'],
  ['assets/images/landmark-bangkok.jpg', 'mobile/assets/market.jpg']
];

for (const [source, target] of mappings) {
  const output = resolve(root, target);
  await mkdir(dirname(output), { recursive:true });
  await copyFile(resolve(root, source), output);
}

console.log(`Prepared ${mappings.length} shared assets for the independent mobile app.`);
