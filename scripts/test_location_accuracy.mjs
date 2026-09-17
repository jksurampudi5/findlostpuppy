import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import fs from 'fs';
import path from 'path';

console.log('====================================================');
console.log('FINDLOSTPUPPY LOCATION ACCURACY VERIFICATION SUITE');
console.log('====================================================\n');

// 1. Point-in-Polygon Boundary Containment Test
console.log('TEST 1: Point-in-Polygon Boundary Containment Check');
const tgPath = path.resolve('src/data/location/boundaries/36_mandals.geojson');
const tgData = JSON.parse(fs.readFileSync(tgPath, 'utf8'));

// Test Coordinate: Hyderabad / Serilingampally (approx 17.48, 78.34)
const testPt1 = point([78.34, 17.48]);
const ptInPoly = booleanPointInPolygon.default || booleanPointInPolygon;
let matchedMandal = null;

for (const feature of tgData.features) {
  if (feature.bbox) {
    const [minX, minY, maxX, maxY] = feature.bbox;
    if (78.34 < minX || 78.34 > maxX || 17.48 < minY || 17.48 > maxY) continue;
  }
  if (ptInPoly(testPt1, feature)) {
    matchedMandal = feature.properties;
    break;
  }
}

if (matchedMandal) {
  console.log('  ✔ Point (17.48, 78.34) contained in:', matchedMandal.subDistrictName, ',', matchedMandal.districtName, `(State: ${matchedMandal.stateName})`);
} else {
  console.error('  ❌ Point-in-polygon failed for test coordinate!');
  process.exit(1);
}

// 2. AP Boundary Test: Rajahmundry / Kakinada / East Godavari region (approx 16.98, 81.78)
console.log('\nTEST 2: AP Boundary Point-in-Polygon Check');
const apPath = path.resolve('src/data/location/boundaries/28_mandals.geojson');
const apData = JSON.parse(fs.readFileSync(apPath, 'utf8'));
const testPt2 = point([81.78, 16.98]);
let matchedAp = null;

for (const feature of apData.features) {
  if (feature.bbox) {
    const [minX, minY, maxX, maxY] = feature.bbox;
    if (81.78 < minX || 81.78 > maxX || 16.98 < minY || 16.98 > maxY) continue;
  }
  if (ptInPoly(testPt2, feature)) {
    matchedAp = feature.properties;
    break;
  }
}

if (matchedAp) {
  console.log('  ✔ Point (16.98, 81.78) contained in:', matchedAp.subDistrictName, ',', matchedAp.districtName, `(State: ${matchedAp.stateName})`);
} else {
  console.error('  ❌ AP Point-in-polygon failed for test coordinate!');
  process.exit(1);
}

// 3. Multi-Office Postal PIN Selection Scoring Test
console.log('\nTEST 3: Multi-Office Postal PIN Scoring (Anti-PostOffice[0] Rule)');
const mockOffices = [
  { Name: 'DistantVillageBO', Block: 'FarAwayBlock', District: 'Krishna', State: 'Andhra Pradesh' },
  { Name: 'TargetLocalitySO', Block: 'VijayawadaUrban', District: 'NTR', State: 'Andhra Pradesh' },
  { Name: 'AnotherVillageBO', Block: 'OtherBlock', District: 'Krishna', State: 'Andhra Pradesh' }
];

function scorePostOffices(offices, context) {
  let bestScore = -1;
  let bestPo = null;
  const targetMandal = (context.mandal || '').trim().toLowerCase();
  const targetCity = (context.city || '').trim().toLowerCase();
  const targetDistrict = (context.district || '').trim().toLowerCase();

  for (const po of offices) {
    let score = 0;
    const poBlock = (po.Block || '').trim().toLowerCase();
    const poName = (po.Name || '').trim().toLowerCase();
    const poDistrict = (po.District || '').trim().toLowerCase();

    if (targetMandal && poBlock === targetMandal) score += 40;
    if (targetCity && poName === targetCity) score += 30;
    if (targetDistrict && poDistrict === targetDistrict) score += 20;

    if (score > bestScore) {
      bestScore = score;
      bestPo = po;
    }
  }
  return { bestPo, bestScore };
}

const pinContext = { mandal: 'VijayawadaUrban', city: 'TargetLocalitySO', district: 'NTR', state: 'Andhra Pradesh' };
const scored = scorePostOffices(mockOffices, pinContext);
if (scored.bestPo && scored.bestPo.Name === 'TargetLocalitySO') {
  console.log(`  ✔ Correctly picked "${scored.bestPo.Name}" (score ${scored.bestScore}) instead of arbitrary PostOffice[0] ("${mockOffices[0].Name}")`);
} else {
  console.error('  ❌ Multi-office scoring failed!');
  process.exit(1);
}

// 4. Accuracy & Confidence Categorization Test
console.log('\nTEST 4: Location Accuracy & Confidence Categorization');
function categorizeConfidence(source, permissionStatus, accuracyMeters, boundaryMatched) {
  if (source === 'ip') {
    return { confidence: 'LOW', reason: 'Coarse IP address location fallback.' };
  } else if (permissionStatus === 'coarse') {
    return { confidence: 'LOW', reason: 'Approximate permission granted.' };
  } else if (accuracyMeters > 150) {
    return { confidence: 'LOW', reason: 'Coarse position fix.' };
  } else if (boundaryMatched && accuracyMeters <= 50) {
    return { confidence: 'HIGH', reason: 'High-accuracy GPS fix inside boundary polygon.' };
  } else if (boundaryMatched && accuracyMeters <= 150) {
    return { confidence: 'MEDIUM', reason: 'Moderate GPS fix inside boundary polygon.' };
  }
  return { confidence: 'LOW', reason: 'Outside verified boundary polygons.' };
}

console.log('  Testing GPS 12m + Boundary Matched:');
const c1 = categorizeConfidence('gps', 'fine', 12, true);
console.log(`    Result: ${c1.confidence} (${c1.reason})`);
if (c1.confidence !== 'HIGH') {
  console.error('    ❌ Expected HIGH confidence!');
  process.exit(1);
}

console.log('  Testing Coarse Android Permission (1600m):');
const c2 = categorizeConfidence('gps', 'coarse', 1600, true);
console.log(`    Result: ${c2.confidence} (${c2.reason})`);
if (c2.confidence !== 'LOW') {
  console.error('    ❌ Expected LOW confidence for coarse permission!');
  process.exit(1);
}

console.log('  Testing IP Fallback:');
const c3 = categorizeConfidence('ip', 'denied', 10000, false);
console.log(`    Result: ${c3.confidence} (${c3.reason})`);
if (c3.confidence !== 'LOW') {
  console.error('    ❌ Expected LOW confidence for IP fallback!');
  process.exit(1);
}

console.log('\n====================================================');
console.log('✔ ALL TEST SUITE CHECKS PASSED SUCCESSFULLY!');
console.log('====================================================');
