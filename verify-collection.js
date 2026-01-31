import fs from 'fs';

const data = JSON.parse(fs.readFileSync('Voclio_Complete_API_Final.postman_collection.json', 'utf8'));

console.log('\n📊 Postman Collection Verification\n');
console.log('=' .repeat(50));

let total = 0;
data.item.forEach(folder => {
  console.log(`${folder.name}: ${folder.item.length} APIs`);
  total += folder.item.length;
});

console.log('=' .repeat(50));
console.log(`\n🎯 Total: ${total} APIs`);
console.log(`\n✅ Collection Status: ${total === 108 ? 'COMPLETE' : 'INCOMPLETE'}`);

if (total === 108) {
  console.log('\n🎉 All 108 APIs are included in the collection!');
} else {
  console.log(`\n⚠️  Expected 108 APIs, found ${total}`);
}
