
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const PARENT_DIR = path.resolve(__dirname, '..', '..');
const EXCEL_PATH = path.join(PARENT_DIR, 'LLMs.xlsx');
const MEDGEMMA_PATH = path.join(PARENT_DIR, 'MedGemma_1.5_4B_Results_20260213_102142.xlsx');
const VIGNETTE_PATH = path.join(PARENT_DIR, 'clincialvignette.xlsx');
const GROUND_TRUTH_PATH = path.join(PARENT_DIR, 'groundtruth.xlsx');
const IMAGES_DIR = path.join(PARENT_DIR, 'LLM_AIIMS');
const OUTPUT_DIR = path.join(__dirname, '..', 'src', 'data');
const PUBLIC_IMAGES_DIR = path.join(__dirname, '..', 'public', 'cases');

// Ensure output directories exist
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}
if (!fs.existsSync(PUBLIC_IMAGES_DIR)) {
    fs.mkdirSync(PUBLIC_IMAGES_DIR, { recursive: true });
}

function readExcel(filePath) {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
}

try {
    console.log('Reading Excel files...');
    const mainData = readExcel(EXCEL_PATH);
    const medGemmaData = readExcel(MEDGEMMA_PATH);
    const vignetteData = readExcel(VIGNETTE_PATH);
    const gtData = readExcel(GROUND_TRUTH_PATH);

    console.log('Main Data Keys:', Object.keys(mainData[0] || {}));
    console.log('MedGemma Data Keys:', Object.keys(medGemmaData[0] || {}));
    console.log('***VIGNETTE KEYS***:', Object.keys(vignetteData[0] || {}), '***END VIGNETTE KEYS***');
    console.log('GT Data Keys:', Object.keys(gtData[0] || {}));

    // Group Main Data by Case_ID
    // Headers: Case_ID, LLM, Response, Image_Files
    const casesMap = {};

    // Helper to process rows
    const processRow = (row, modelNameOverride = null) => {
        const caseId = row['Case_ID'] || row['Case ID'];
        if (!caseId) return;

        if (!casesMap[caseId]) {
            casesMap[caseId] = {
                id: caseId,
                llmResponses: {},
                imageFiles: []
            };
        }

        const modelName = modelNameOverride || row['LLM'] || row['Model'];
        const response = row['Response'] || row['Output'] || row['Result']; // Handle potential column name variations

        if (modelName && response) {
            casesMap[caseId].llmResponses[modelName] = response;
        }

        // Collect images (comma separated) - primarily from main file
        if (row['Image_Files']) {
            const imgs = row['Image_Files'].split(',').map(s => s.trim());
            imgs.forEach(img => {
                if (!casesMap[caseId].imageFiles.includes(img)) {
                    casesMap[caseId].imageFiles.push(img);
                }
            });
        }
    };

    mainData.forEach(row => processRow(row));
    medGemmaData.forEach(row => processRow(row, 'MedGemma-1.5-4B')); // Force model name for this specific file if needed, or rely on column


    const finalCases = [];

    // Process each case
    Object.values(casesMap).forEach(caseObj => {
        const id = caseObj.id;
        const gtRow = gtData.find(g => g['Case_ID'] === id || g['ID'] === id); // Handle potential variation

        if (!gtRow) {
            console.warn(`Warning: No Ground Truth found for Case ${id}`);
        }

        // Copy images
        const processedImages = [];
        caseObj.imageFiles.forEach(imgName => {
            const srcPath = path.join(IMAGES_DIR, imgName);
            const destPath = path.join(PUBLIC_IMAGES_DIR, imgName);

            if (fs.existsSync(srcPath)) {
                try {
                    fs.copyFileSync(srcPath, destPath);
                    processedImages.push(`/cases/${imgName}`);
                } catch (e) {
                    console.error(`Error copying image ${imgName}:`, e.message);
                }
            } else {
                console.warn(`Warning: Image not found: ${srcPath}`);
            }
        });

        // Find Vignette
        const vRow = vignetteData.find(v => v['Case ID'] == id || v['Case_ID'] == id || v['ID'] == id);
        if (vRow) {
            // Found column key via debug: 'Clinical_Vignette'
            const vignetteText = vRow['Clinical_Vignette'] || vRow['Clinical Vignette'] || vRow['Vignette'] || vRow['Clinical History'] || vRow['Clinical'] || '';
            if (vignetteText) {
                caseObj.clinical = vignetteText;
            }
        }

        finalCases.push({
            id: id,
            section: gtRow ? (gtRow['Section'] || 'Unknown') : 'Unknown',
            subsection: gtRow ? (gtRow['Subsection'] || 'Unknown') : 'Unknown',
            title: gtRow ? (gtRow['Diagnosis'] || `Case ${id}`) : `Case ${id}`,
            clinical: caseObj.clinical || (gtRow ? (gtRow['Clinical History'] || '') : ''), // Prioritize vignette, fall back to GT
            histology: gtRow ? (gtRow['Histopathology'] || gtRow['Microscopy'] || '') : '',
            ihc: gtRow ? (gtRow['IHC'] || '') : '',
            stage: gtRow ? (gtRow['Stage'] || 'Unknown') : 'Unknown',
            goldLabel: gtRow ? (gtRow['Gold Label'] || 'Not Available') : 'Not Available',
            expectedBehavior: gtRow ? (gtRow['Expected Behavior'] || 'Unknown') : 'Unknown',
            images: processedImages, // Array of strings
            llmResponses: caseObj.llmResponses
        });
    });

    fs.writeFileSync(path.join(OUTPUT_DIR, 'cases.json'), JSON.stringify(finalCases, null, 2));
    console.log(`Processed ${finalCases.length} cases.`);

} catch (error) {
    console.error('Error processing data:', error);
}
