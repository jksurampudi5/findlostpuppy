async function test() {
  // Coordinates for Undrajavaram / Karravarisavaram in Andhra Pradesh:
  // Undrajavaram is around lat 16.82, lon 81.65
  const lat = 16.829;
  const lon = 81.648;

  console.log('Querying Nominatim WITHOUT accept-language=en:');
  const res1 = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`, {
    headers: { 'User-Agent': 'FindLostPuppy-Test/1.0' }
  });
  const data1 = await res1.json();
  console.log('Without accept-language:');
  console.log('display_name:', data1.display_name);
  console.log('address:', data1.address);

  console.log('\nQuerying Nominatim WITH accept-language=en&namedetails=1:');
  const res2 = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1&accept-language=en&namedetails=1`, {
    headers: {
      'User-Agent': 'FindLostPuppy-Test/1.0',
      'Accept-Language': 'en',
    }
  });
  const data2 = await res2.json();
  console.log('With accept-language=en:');
  console.log('display_name:', data2.display_name);
  console.log('address:', data2.address);
  console.log('namedetails:', data2.namedetails);
}

test().catch(console.error);
