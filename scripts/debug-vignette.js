const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const PARENT_DIR = path.resolve(__dirname, '..', '..');
const VIGNETTE_PATH = path.join(PARENT_DIR, 'clincialvignette.xlsx');

const workbook = XLSX.readFile(VIGNETTE_PATH);
const sheetName = workbook.SheetNames[0];
const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

console.log('Total Vignette Rows:', data.length);
if (data.length > 0) {
    console.log('Vignette Column Keys:', Object.keys(data[0]));
    console.log('First Row Data:', JSON.stringify(data[0], null, 2));
}
const ids = data.map(r => r['Case ID'] || r['Case_ID'] || r['ID']);
console.log('Sample IDs:', ids.slice(0, 10));
