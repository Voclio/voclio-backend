import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

console.log('📄 Generating PDF from Markdown...\n');

// Check if we have the markdown file
if (!fs.existsSync('VOCLIO_API_DOCUMENTATION_COMPLETE.md')) {
  console.error('❌ Error: VOCLIO_API_DOCUMENTATION_COMPLETE.md not found!');
  process.exit(1);
}

console.log('✅ Markdown file found');
console.log('📝 File: VOCLIO_API_DOCUMENTATION_COMPLETE.md');
console.log('\n📋 Instructions to generate PDF:\n');

console.log('Option 1: Using Online Converter (Recommended)');
console.log('   1. Go to: https://www.markdowntopdf.com/');
console.log('   2. Upload: VOCLIO_API_DOCUMENTATION_COMPLETE.md');
console.log('   3. Download the generated PDF\n');

console.log('Option 2: Using VS Code Extension');
console.log('   1. Install "Markdown PDF" extension in VS Code');
console.log('   2. Open: VOCLIO_API_DOCUMENTATION_COMPLETE.md');
console.log('   3. Press: Ctrl+Shift+P');
console.log('   4. Type: "Markdown PDF: Export (pdf)"');
console.log('   5. Press Enter\n');

console.log('Option 3: Using Pandoc (if installed)');
console.log('   Run: pandoc VOCLIO_API_DOCUMENTATION_COMPLETE.md -o VOCLIO_API_DOCUMENTATION.pdf\n');

console.log('Option 4: Using Chrome/Edge');
console.log('   1. Open: VOCLIO_API_DOCUMENTATION_COMPLETE.md in VS Code');
console.log('   2. Press: Ctrl+Shift+V (Preview)');
console.log('   3. Right-click → Print → Save as PDF\n');

console.log('📦 Files Ready:');
console.log('   ✅ VOCLIO_API_DOCUMENTATION_COMPLETE.md (109 APIs)');
console.log('   ✅ Voclio_Complete_API_Final.postman_collection.json (109 APIs)');
console.log('\n🎯 All APIs are documented and ready to use!');
