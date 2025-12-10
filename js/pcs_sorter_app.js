const { useState, useEffect, useMemo, useCallback, useRef } = React;

// --- Utility Components ---

const Icon = ({ name, className = "", size = 20 }) => {
  const iconRef = useRef(null);

  useEffect(() => {
    if (iconRef.current && window.lucide) {
      const iconName = name; // Assuming PascalCase names are passed
      const iconDef = window.lucide.icons[iconName];
      
      if (iconDef) {
        iconRef.current.innerHTML = '';
        
        // lucide.createElement returns an SVG element
        const svgElement = window.lucide.createElement(iconDef);
        
        // Apply attributes
        svgElement.setAttribute('class', className);
        svgElement.setAttribute('width', size);
        svgElement.setAttribute('height', size);
        svgElement.setAttribute('stroke-width', 2); // Default stroke width
        
        iconRef.current.appendChild(svgElement);
      } else {
        console.warn(`Icon not found: ${name}`);
      }
    }
  }, [name, className, size]);

  return <span ref={iconRef} className="inline-flex items-center justify-center" />;
};

const Alert = ({ type = "error", title, children }) => {
  const styles = {
    error: "bg-red-50 text-red-700 border-red-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    info: "bg-blue-50 text-blue-700 border-blue-200"
  };
  
  const icons = {
    error: "AlertCircle",
    warning: "AlertTriangle",
    info: "Info"
  };

  return (
    <div className={`p-4 rounded-lg border ${styles[type]} flex gap-3 mb-4`}>
      <div className="shrink-0 pt-0.5">
        <Icon name={icons[type]} size={20} />
      </div>
      <div>
        {title && <h3 className="font-semibold mb-1">{title}</h3>}
        <div className="text-sm">{children}</div>
      </div>
    </div>
  );
};

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full">
            <Icon name="X" size={20} />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

// --- Main Application Logic ---

const REQUIRED_COLUMNS = [
  "date",
  "irradiation_kwhm2",
  "panel_area_m2",
  "panel_efficiency_percent"
];

function App() {
  // State
  const [pvMaster, setPvMaster] = useState(null); // { [pcsId]: { count, area } }
  const [pvStatus, setPvStatus] = useState("loading"); // loading, loaded, error
  const [masterError, setMasterError] = useState(null); // Detailed error message for master load
  
  const [processingStatus, setProcessingStatus] = useState("idle"); // idle, processing, error, done
  const [errorMsg, setErrorMsg] = useState(null);
  const [warningMsg, setWarningMsg] = useState(null);

  const [groupedSheets, setGroupedSheets] = useState([]);
  const [activeGroupKey, setActiveGroupKey] = useState(null);
  const [commonData, setCommonData] = useState([]); // Array of arrays (data rows without header)
  const [dataHeaders, setDataHeaders] = useState([]); // Array of strings (header row)
  const [headerMap, setHeaderMap] = useState({}); // { columnName: index }

  const [showHelp, setShowHelp] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false); // Track drag state

  // 1. Load PV Master Data
  useEffect(() => {
    console.log("Starting master data load...");
    
    // Check if XLSX is available
    if (!window.XLSX) {
        console.error("SheetJS (XLSX) library not found on window object");
        setPvStatus("error");
        setMasterError("SheetJSライブラリがロードされていません。インターネット接続を確認してください。");
        return;
    }

    fetch('./data/pvdata.xlsx')
      .then(res => {
        console.log("Fetch response:", res.status, res.statusText);
        if (!res.ok) throw new Error(`HTTP Error: ${res.status} ${res.statusText}`);
        return res.arrayBuffer();
      })
      .then(buffer => {
        try {
            console.log("Buffer received, size:", buffer.byteLength);
            const workbook = XLSX.read(buffer, { type: 'array' });
            
            if (!workbook.SheetNames.length) {
                throw new Error("Excelファイルにシートが存在しません。");
            }

            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            console.log("JSON Data parsed, rows:", jsonData.length);

            const map = {};
            jsonData.forEach(row => {
              // keys: No, PCS番号（通し）, 枚数, 面積
              // Flexible key matching for "PCS番号"
              const pcsId = row['PCS番号（通し）'] || row['PCS番号(通し)'] || row['PCS番号'] || row['No.'] || row['No'];
              const count = row['枚数'];
              const area = row['面積'];
    
              if (pcsId) {
                map[String(pcsId).trim()] = {
                  count: parseInt(count, 10),
                  area: parseFloat(area)
                };
              }
            });
            
            const recordCount = Object.keys(map).length;
            console.log("Master Map built, records:", recordCount);
            
            if (recordCount === 0) {
                throw new Error("マスタデータから有効なレコードを読み込めませんでした。カラム名を確認してください。");
            }

            setPvMaster(map);
            setPvStatus("loaded");
        } catch (parseError) {
            throw new Error(`Parse Error: ${parseError.message}`);
        }
      })
      .catch(err => {
        console.error("Master Load Error:", err);
        setPvStatus("error");
        setMasterError(err.message);
      });
  }, []);

  // 2. Handle File Upload & Processing
  const handleFileUpload = (file) => {
    if (pvStatus !== 'loaded') {
      setErrorMsg("マスタデータが読み込まれていないため処理できません。");
      return;
    }

    setProcessingStatus("processing");
    setErrorMsg(null);
    setWarningMsg(null);
    // Don't store full file object in state to save memory

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      // Clear previous data to free memory before processing new
      setCommonData([]);
      setGroupedSheets([]);
      
      // Use setTimeout to allow UI to update to "processing" state
      setTimeout(() => processCSV(text), 10);
    };
    reader.onerror = () => {
      setProcessingStatus("error");
      setErrorMsg("ファイルの読み込みに失敗しました。");
    };
    reader.readAsText(file);
  };
  
  // Drag and Drop Handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (pvStatus === 'loaded') {
        setIsDragOver(true);
    }
  }, [pvStatus]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    if (pvStatus !== 'loaded') return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === "text/csv" || file.name.endsWith(".csv")) {
          handleFileUpload(file);
      } else {
          setErrorMsg("CSVファイルのみアップロード可能です。");
      }
    }
  }, [pvStatus]);

  const processCSV = (csvText) => {
    // Parse without header: true to get array of arrays (much more memory efficient)
    Papa.parse(csvText, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.data || results.data.length < 2) {
           setProcessingStatus("error");
           setErrorMsg("有効なデータが見つかりません（ヘッダまたはデータ行が不足しています）。");
           return;
        }
        analyzeData(results.data);
      },
      error: (err) => {
        setProcessingStatus("error");
        setErrorMsg(`CSV解析エラー: ${err.message}`);
      }
    });
  };

  const analyzeData = (allRows) => {
    const headers = allRows[0];
    const dataRows = allRows.slice(1);
    
    // A. Create Header Map for O(1) lookup
    const hMap = {};
    headers.forEach((h, idx) => {
      if (typeof h === 'string') {
        hMap[h.trim()] = idx;
      }
    });

    // B. Validate Headers
    const missing = REQUIRED_COLUMNS.filter(col => hMap[col] === undefined);
    if (missing.length > 0) {
      setProcessingStatus("error");
      setErrorMsg(`必須列が不足しています: ${missing.join(", ")}`);
      return;
    }

    // C. Find PCS Columns
    const pcsRegex = /^pcs_(.+)_kwh$/;
    const pcsCols = [];
    
    headers.forEach(h => {
      if (typeof h !== 'string') return;
      const match = h.trim().match(pcsRegex);
      if (match) {
        pcsCols.push({
          header: h.trim(),
          key: match[1] // "1-7-1"
        });
      }
    });

    if (pcsCols.length === 0) {
      setProcessingStatus("error");
      setErrorMsg("PCS列 (pcs_xxx_kwh) が見つかりません。");
      return;
    }

    // D. Match with Master & Grouping
    const groups = {}; // Key: "126" or "unclassified"
    let hasUnregistered = false;
    let unregisteredExamples = [];

    pcsCols.forEach(col => {
      const lookupKey = `PCS ${col.key}`;
      const meta = pvMaster[lookupKey];

      let groupKey = "unclassified";
      let count = null;

      if (meta) {
        count = meta.count;
        groupKey = String(count);
      } else {
        hasUnregistered = true;
        if (unregisteredExamples.length < 3) unregisteredExamples.push(col.header);
      }

      if (!groups[groupKey]) {
        groups[groupKey] = {
          key: groupKey,
          label: groupKey === "unclassified" ? "未分類" : `${groupKey}枚`,
          count: count,
          columns: []
        };
      }
      groups[groupKey].columns.push(col.header);
    });

    // Convert groups map to array and sort
    const groupArray = Object.values(groups).sort((a, b) => {
      // Unclassified goes last
      if (a.key === 'unclassified') return 1;
      if (b.key === 'unclassified') return -1;
      // Otherwise sort by columns count (desc) then by module count (desc)
      if (b.columns.length !== a.columns.length) return b.columns.length - a.columns.length;
      return parseInt(b.key) - parseInt(a.key);
    });

    // E. Store Data (Optimized for Memory)
    setCommonData(dataRows); // Store array of arrays
    setDataHeaders(headers);
    setHeaderMap(hMap);
    setGroupedSheets(groupArray);
    setActiveGroupKey(groupArray[0]?.key);
    
    if (hasUnregistered) {
      setWarningMsg(`マスタ未登録のPCS列があります（${unregisteredExamples.join(", ")}...）。これらは「未分類」タブに含まれます。`);
    }

    setProcessingStatus("done");
  };

  // 3. Export Logic
  const handleDownload = (format) => {
    if (!activeGroupKey || !commonData.length) return;

    const group = groupedSheets.find(g => g.key === activeGroupKey);
    if (!group) return;

    const targetColumns = [...REQUIRED_COLUMNS, ...group.columns];
    const targetIndices = targetColumns.map(col => headerMap[col]);
    
    // Create subset of data
    // Header row
    const exportData = [targetColumns];
    
    // Data rows
    commonData.forEach(row => {
      const newRow = targetIndices.map(idx => row[idx]);
      exportData.push(newRow);
    });

    if (format === 'csv') {
      const csv = Papa.unparse(exportData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `pcs_group_${group.key}_${new Date().getTime()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === 'xlsx') {
      const ws = XLSX.utils.aoa_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, group.label);
      XLSX.writeFile(wb, `pcs_group_${group.key}.xlsx`);
    }
  };

  // --- Render ---
  
  // Helper to safely get cell data by column name
  const getCell = useCallback((row, colName) => {
    const idx = headerMap[colName];
    return idx !== undefined ? row[idx] : '-';
  }, [headerMap]);

  // Compute limited columns for preview
  const activeGroup = groupedSheets.find(g => g.key === activeGroupKey);
  const PREVIEW_COL_LIMIT = 20;
  const PREVIEW_ROW_LIMIT = 50;

  const previewCols = useMemo(() => {
    if (!activeGroup) return [];
    return activeGroup.columns.slice(0, PREVIEW_COL_LIMIT);
  }, [activeGroup]);

  const hiddenColCount = activeGroup ? Math.max(0, activeGroup.columns.length - PREVIEW_COL_LIMIT) : 0;
  const hiddenRowCount = Math.max(0, commonData.length - PREVIEW_ROW_LIMIT);

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-30 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <Icon name="FileSpreadsheet" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 leading-tight">PCS枚数別仕訳ツール（和気SP用）</h1>
            <div className="text-[10px] text-slate-500 font-mono leading-none mt-0.5">
              Version 1.0.0 | Last Updated: 2025.12.10
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
            <a href="index.html" className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 px-3 py-1.5 rounded-full hover:bg-slate-50 transition-colors">
              <Icon name="ArrowLeft" size={18} />
              <span>Back to PR Analyzer</span>
            </a>
            <button 
              onClick={() => setShowHelp(true)}
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 px-3 py-1.5 rounded-full hover:bg-slate-50 transition-colors"
            >
              <Icon name="HelpCircle" size={18} />
              <span>使い方</span>
            </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full grid md:grid-cols-[350px_1fr] gap-6 items-start">
        
        {/* Left Column: Upload & Status */}
        <div className="space-y-6">
          {/* Master Status Card */}
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">システム状態</h2>
            <div className="flex items-center gap-3">
              {pvStatus === 'loading' && (
                <>
                  <Icon name="Loader2" className="animate-spin text-blue-500" />
                  <span className="text-sm">マスタデータ読込中...</span>
                </>
              )}
              {pvStatus === 'error' && (
                <>
                  <Icon name="AlertCircle" className="text-red-500" />
                  <span className="text-sm text-red-600 font-medium">マスタ読込エラー</span>
                </>
              )}
              {pvStatus === 'loaded' && (
                <>
                  <Icon name="CheckCircle2" className="text-green-500" />
                  <div>
                    <div className="text-sm font-medium">準備完了</div>
                    <div className="text-xs text-slate-500 mt-1">
                      登録PCS数: {Object.keys(pvMaster || {}).length} 件
                    </div>
                  </div>
                </>
              )}
            </div>
            {pvStatus === 'error' && (
              <div className="mt-3 text-xs text-red-600 bg-red-50 p-2 rounded break-words">
                エラー: {masterError || "リロードしてください。"}
              </div>
            )}
          </div>

          {/* Upload Card */}
          <div className={`bg-white rounded-xl shadow-sm border p-5 transition-all ${processingStatus === 'processing' ? 'opacity-70 pointer-events-none' : ''}`}>
            <h2 className="font-bold text-lg mb-2">ファイルアップロード</h2>
            <p className="text-sm text-slate-500 mb-4">
              ファイルを選択またはドロップしてください。
            </p>
            
            <label 
                className={`block w-full cursor-pointer group ${isDragOver ? 'ring-2 ring-indigo-400' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
              <input 
                type="file" 
                accept=".csv"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                disabled={pvStatus !== 'loaded'}
              />
              <div className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all 
                ${isDragOver 
                    ? 'border-indigo-400 bg-indigo-50/80 scale-[1.02]' 
                    : 'border-slate-200 group-hover:border-indigo-400 group-hover:bg-indigo-50/50'
                }`}
              >
                <div className={`p-3 rounded-full mb-3 transition-transform ${isDragOver ? 'bg-indigo-100 scale-110 text-indigo-700' : 'bg-indigo-50 text-indigo-600 group-hover:bg-white group-hover:scale-110'}`}>
                  <Icon name="UploadCloud" size={24} />
                </div>
                <span className="text-sm font-medium text-slate-700">ファイルを選択</span>
                <span className="text-xs text-slate-400 mt-1">またはここにドロップ</span>
              </div>
            </label>

            {processingStatus === 'processing' && (
              <div className="mt-4 flex items-center justify-center gap-2 text-indigo-600 bg-indigo-50 p-3 rounded-lg">
                <Icon name="Loader2" className="animate-spin" />
                <span className="text-sm font-medium">解析中...</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="min-w-0 space-y-4">
          
          {/* Messages */}
          {errorMsg && (
            <Alert type="error" title="エラーが発生しました">
              {errorMsg}
            </Alert>
          )}
          {warningMsg && (
            <Alert type="warning" title="確認が必要です">
              {warningMsg}
            </Alert>
          )}

          {/* Initial State Placeholder */}
          {processingStatus === 'idle' && !errorMsg && (
            <div className="bg-white rounded-xl border shadow-sm p-12 text-center flex flex-col items-center justify-center h-[400px] text-slate-400">
              <Icon name="Sheet" size={48} className="mb-4 text-slate-200" />
              <p className="text-lg font-medium text-slate-500">データを表示するにはファイルをアップロードしてください</p>
            </div>
          )}

          {/* Results View */}
          {processingStatus === 'done' && groupedSheets.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col h-[calc(100vh-140px)]">
              {/* Tabs */}
              <div className="border-b bg-slate-50/50 px-2 pt-2 flex items-center gap-1 overflow-x-auto no-scrollbar">
                {groupedSheets.map(group => (
                  <button
                    key={group.key}
                    onClick={() => setActiveGroupKey(group.key)}
                    className={`
                      px-4 py-2.5 text-sm font-medium rounded-t-lg border-t border-x relative top-[1px] flex items-center gap-2 transition-all whitespace-nowrap
                      ${activeGroupKey === group.key 
                        ? 'bg-white border-slate-200 text-indigo-600 border-b-transparent z-10' 
                        : 'bg-transparent border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}
                    `}
                  >
                    <span>{group.label}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeGroupKey === group.key ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-200 text-slate-600'}`}>
                      {group.columns.length}
                    </span>
                  </button>
                ))}
              </div>

              {/* Toolbar */}
              <div className="p-4 border-b flex flex-wrap gap-4 items-center justify-between bg-white">
                <div className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-900">
                    {activeGroup?.label}
                  </span>
                  <span className="mx-2 text-slate-300">|</span>
                  <span>全 {commonData.length} 行</span>
                  <span className="mx-2 text-slate-300">|</span>
                  <span>対象PCS: {activeGroup?.columns.length} 列</span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleDownload('csv')}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
                  >
                    <Icon name="FileText" size={16} />
                    CSV出力
                  </button>
                  <button 
                    onClick={() => handleDownload('xlsx')}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors shadow-sm"
                  >
                    <Icon name="Table" size={16} />
                    Excel出力
                  </button>
                </div>
              </div>

              {/* Table Area */}
              <div className="flex-1 overflow-auto custom-scrollbar relative">
                <table className="w-full text-sm text-left text-slate-600">
                  <thead className="text-xs text-slate-700 uppercase bg-slate-50 sticky top-0 z-20 shadow-sm">
                    <tr>
                      {REQUIRED_COLUMNS.map(col => (
                        <th key={col} className="px-4 py-3 bg-slate-50 font-semibold border-b border-r min-w-[120px]">
                          {col}
                        </th>
                      ))}
                      {previewCols.map(col => (
                        <th key={col} className="px-4 py-3 bg-indigo-50/30 font-semibold text-indigo-900 border-b min-w-[150px]">
                          {col}
                        </th>
                      ))}
                      {hiddenColCount > 0 && (
                        <th className="px-4 py-3 bg-slate-100 font-semibold text-slate-500 border-b italic min-w-[150px]">
                          ...他 {hiddenColCount} 列
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {commonData.slice(0, PREVIEW_ROW_LIMIT).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        {REQUIRED_COLUMNS.map(col => (
                          <td key={col} className="px-4 py-2 border-r font-medium text-slate-800 whitespace-nowrap">
                            {getCell(row, col)}
                          </td>
                        ))}
                        {previewCols.map(col => (
                          <td key={col} className="px-4 py-2 whitespace-nowrap">
                            {getCell(row, col)}
                          </td>
                        ))}
                        {hiddenColCount > 0 && (
                          <td className="px-4 py-2 text-slate-400 italic text-xs bg-slate-50/50 text-center">
                            (DLして確認)
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 border-t font-medium">
                  {hiddenRowCount > 0 
                    ? `※プレビュー用に ${PREVIEW_ROW_LIMIT}行 × ${PREVIEW_COL_LIMIT}列 のみ表示しています（全データは ${commonData.length}行 × ${activeGroup?.columns.length}列）。ダウンロードしてご確認ください。`
                    : '※全てのデータが表示されています。'}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Help Modal */}
      <Modal isOpen={showHelp} onClose={() => setShowHelp(false)} title="使い方">
        <div className="space-y-4 text-sm text-slate-600">
          <section>
            <h4 className="font-semibold text-slate-900 mb-2">1. マスタデータの読み込み</h4>
            <p>ページを開くと自動的に <code>pvdata.xlsx</code> を読み込みます。システム状態が「準備完了」であることを確認してください。</p>
          </section>
          <section>
            <h4 className="font-semibold text-slate-900 mb-2">2. ファイルのアップロード</h4>
            <p>CSVファイルをドラッグ＆ドロップまたは選択してください。以下の列が必須です。</p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li><code>date</code>, <code>irradiation_kwhm2</code></li>
              <li><code>panel_area_m2</code>, <code>panel_efficiency_percent</code></li>
              <li><code>pcs_xxx_kwh</code> (1つ以上のPCS列)</li>
            </ul>
          </section>
          <section>
            <h4 className="font-semibold text-slate-900 mb-2">3. 仕訳とダウンロード</h4>
            <p>自動的にパネル枚数ごとにタブ分けされます。必要なタブを選択し、「CSV出力」または「Excel出力」ボタンでデータをダウンロードしてください。</p>
          </section>
        </div>
      </Modal>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);