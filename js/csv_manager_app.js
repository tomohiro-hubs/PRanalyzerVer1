// DOM Elements
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const fileCountLabel = document.getElementById('file-count');
const processBtn = document.getElementById('process-btn');
const downloadBtn = document.getElementById('download-btn');
const logContainer = document.getElementById('log-container');
const statusIndicator = document.getElementById('status-indicator');

// State
let selectedFiles = [];

// --- UI Event Listeners ---

// Click to select
dropZone.addEventListener('click', () => fileInput.click());

// File input change
fileInput.addEventListener('change', (e) => {
    handleFiles(Array.from(e.target.files));
});

// Drag & Drop
const events = ['dragenter', 'dragover', 'dragleave', 'drop'];

// Prevent default defaults for all drag events
events.forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false); // Prevent browser from opening file on miss-drop
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Highlight drop zone
['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, unhighlight, false);
});

function highlight(e) {
    dropZone.classList.add('dragover');
}

function unhighlight(e) {
    dropZone.classList.remove('dragover');
}

// Handle dropped files
dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
        handleFiles(Array.from(files));
    }
});

function handleFiles(files) {
    const csvFiles = files.filter(f => f.name.toLowerCase().endsWith('.csv'));
    
    if (csvFiles.length === 0) {
        alert('CSVファイルを選択してください。');
        return;
    }

    selectedFiles = csvFiles;
    fileCountLabel.textContent = `${selectedFiles.length} ファイル選択中`;
    fileCountLabel.classList.remove('hidden');
    processBtn.disabled = false;
    processBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    
    // Reset UI
    downloadBtn.classList.add('hidden');
    logContainer.innerHTML = '';
    addLog(`System ready. ${selectedFiles.length} files loaded.`, 'info');
    
    // Log file names
    selectedFiles.forEach(f => {
        addLog(`Loaded: ${f.name} (${formatSize(f.size)})`, 'gray');
    });
}

// Process Button
processBtn.addEventListener('click', async () => {
    processBtn.disabled = true;
    processBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 処理中...';
    statusIndicator.textContent = 'Processing...';
    statusIndicator.className = 'text-xs font-mono text-yellow-500';

    try {
        await processFiles();
        statusIndicator.textContent = 'Completed';
        statusIndicator.className = 'text-xs font-mono text-green-500';
    } catch (error) {
        console.error(error);
        addLog(`Critical Error: ${error.message}`, 'error');
        statusIndicator.textContent = 'Error';
        statusIndicator.className = 'text-xs font-mono text-red-500';
    } finally {
        processBtn.disabled = false;
        processBtn.innerHTML = '<i class="fa-solid fa-gears"></i> 処理実行';
    }
});


// --- Core Logic ---

async function processFiles() {
    addLog('Starting processing (Index-based Merge)...', 'info');
    
    // Rows data storage: Array of Objects
    // Example: [ {date: "2023-01-01", pcs_1: 100, ...}, ... ]
    let rows = []; 
    const fixedHeaders = ['date', 'irradiation_kwhm2', 'panel_area_m2', 'panel_efficiency_percent'];
    const dynamicHeaders = []; // Array to keep order of added columns
    let processedCount = 0;

    // Regex for renaming: 1-7-1_PCS 有効電力量(kWh) -> pcs_1-7-1_kwh
    const renameRegex = /(\d+-\d+-\d+)_PCS.*kWh/;

    for (let fIndex = 0; fIndex < selectedFiles.length; fIndex++) {
        const file = selectedFiles[fIndex];
        addLog(`Parsing: ${file.name}...`, 'info');
        
        try {
            const result = await parseCSV(file);
            const data = result.data; // Array of Arrays
            
            if (!data || data.length < 1) {
                addLog(`Skipping empty file: ${file.name}`, 'warning');
                continue;
            }

            // Headers are at index 0
            const originalHeaders = data[0];
            
            if (originalHeaders.length < 1) {
                addLog(`Invalid format in ${file.name}: No columns found.`, 'error');
                continue;
            }

            // Determine columns to extract
            // Changed: Start from index 1 (B col) instead of 4, as user data starts from B col
            const columnMapping = []; 
            let renameCount = 0;

            for (let i = 1; i < originalHeaders.length; i++) {
                const oldName = originalHeaders[i];
                if (!oldName) continue;

                const match = oldName.match(renameRegex);
                let newName = oldName;

                if (match) {
                    newName = `pcs_${match[1]}_kwh`;
                    renameCount++;
                } else {
                    addLog(`[Warning] Column "${oldName}" in ${file.name} did not match pattern. Keeping original name.`, 'warning');
                }
                
                columnMapping.push({ index: i, newName: newName });
                dynamicHeaders.push(newName);
            }

            addLog(`  -> Extracted ${columnMapping.length} data columns. Renamed ${renameCount} columns.`, 'gray');

            // Process Rows (starting from index 1)
            // If first file (fIndex === 0), initialize rows
            // Else, append to existing rows by index
            
            let fileRowCount = 0;

            for (let i = 1; i < data.length; i++) {
                const row = data[i];
                // A column is Date (index 0)
                const dateVal = row[0];

                // Skip empty lines or lines without date
                if (!dateVal) continue; 

                // Current logic index (0-based for data rows)
                const rowIndex = fileRowCount;
                
                // Ensure row object exists
                if (!rows[rowIndex]) {
                    // Only create new row if we are the first file OR if subsequent files have more rows (unlikely but possible)
                    rows[rowIndex] = { date: dateVal };
                }

                // If it's the first file, set the date (Master Date)
                if (fIndex === 0) {
                    rows[rowIndex].date = dateVal;
                }
                // Note: For subsequent files, we IGNORE their date column and trust the row index.

                const record = rows[rowIndex];

                // Populate data columns
                columnMapping.forEach(map => {
                    const val = row[map.index];
                    record[map.newName] = val; 
                });

                fileRowCount++;
            }
            
            addLog(`  -> Processed ${fileRowCount} rows from ${file.name}.`, 'success');
            
            // Warning if row counts mismatch
            if (fIndex > 0 && rows.length !== fileRowCount) {
                 addLog(`[Warning] Row count mismatch in ${file.name}. Master: ${rows.length}, This: ${fileRowCount}. Alignment may be off.`, 'warning');
            }

            processedCount++;

        } catch (err) {
            addLog(`Failed to parse ${file.name}: ${err}`, 'error');
        }
    }

    if (processedCount === 0) {
        addLog('No files were successfully processed.', 'error');
        return;
    }

    addLog('Finalizing merge...', 'info');

    // Combine fixed headers and dynamic headers
    const finalHeaders = [...fixedHeaders, ...dynamicHeaders];

    // Prepare final dataset for Unparse
    const finalData = rows.map(record => {
        const row = {};
        finalHeaders.forEach(header => {
            row[header] = record.hasOwnProperty(header) ? record[header] : "";
        });
        return row;
    });

    addLog(`Total rows: ${finalData.length}`, 'success');
    addLog(`Total columns: ${finalHeaders.length}`, 'success');

    // Generate CSV
    const csvContent = Papa.unparse(finalData, {
        quotes: false, 
        newline: "\r\n"
    });

    createDownloadLink(csvContent);
    addLog('Process Complete! Ready to download.', 'success');
}

// Wrapper for PapaParse
function parseCSV(file) {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            complete: (results) => resolve(results),
            error: (err) => reject(err),
            skipEmptyLines: 'greedy',
            encoding: 'UTF-8' // Assume UTF-8, maybe Shift-JIS if Japanese Excel?
            // PRD doesn't specify encoding. UTF-8 is standard for modern apps, 
            // but legacy CSVs might be Shift-JIS.
            // PapaParse attempts to detect, but explicit is sometimes better.
            // For now, default behavior is usually fine, or UTF-8.
        });
    });
}

// --- Utils ---

function createDownloadLink(content) {
    // Add BOM for Excel compatibility with UTF-8
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    downloadBtn.href = url;
    downloadBtn.download = 'merged.csv';
    downloadBtn.classList.remove('hidden');
    downloadBtn.classList.add('flex', 'fade-in');
}

function addLog(message, type = 'info') {
    const div = document.createElement('div');
    const timestamp = new Date().toLocaleTimeString();
    
    let colorClass = 'text-gray-300';
    let icon = '';

    switch(type) {
        case 'error': colorClass = 'text-red-400'; icon = '<i class="fa-solid fa-circle-xmark mr-1"></i>'; break;
        case 'warning': colorClass = 'text-yellow-400'; icon = '<i class="fa-solid fa-triangle-exclamation mr-1"></i>'; break;
        case 'success': colorClass = 'text-green-400'; icon = '<i class="fa-solid fa-check mr-1"></i>'; break;
        case 'gray': colorClass = 'text-gray-500'; break;
        default: icon = '<i class="fa-solid fa-angle-right mr-1 text-blue-400"></i>';
    }

    div.className = `${colorClass} text-sm break-all`;
    div.innerHTML = `<span class="opacity-50 text-xs mr-2">[${timestamp}]</span>${icon}${message}`;
    
    logContainer.appendChild(div);
    logContainer.scrollTop = logContainer.scrollHeight;
}

function formatSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}