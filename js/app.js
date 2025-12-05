const { useState, useEffect, Component, useMemo } = React;

// --- Error Boundary ---
class ErrorBoundary extends Component {
    constructor(props) { super(props); this.state = { hasError: false, error: null }; }
    static getDerivedStateFromError(error) { return { hasError: true, error }; }
    componentDidCatch(error, errorInfo) { console.error("Uncaught error:", error, errorInfo); }
    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
                        <h2 className="text-xl font-bold text-red-600 mb-4">Something went wrong</h2>
                        <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto text-red-800">{this.state.error?.toString()}</pre>
                        <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-600 text-white rounded">Reload Page</button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

// --- Icons ---
const Icons = {
    Sun: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>,
    Upload: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>,
    FileText: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>,
    PlayCircle: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>,
    Download: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>,
    ChevronUp: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="18 15 12 9 6 15"/></svg>,
    ChevronDown: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="6 9 12 15 18 9"/></svg>,
    Copy: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
    Check: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="20 6 9 17 4 12"/></svg>,
};

// --- Heatmap Color Logic ---
// Low: #004C99 (Blue) -> High: #FF8C00 (Orange)
const HEAT_COLORS = [
    { r: 0,   g: 76,  b: 153 }, // C0: #004C99 (Deep Blue - Low PR)
    { r: 102, g: 178, b: 255 }, // C1: #66B2FF (Light Blue)
    { r: 255, g: 224, b: 102 }, // C2: #FFE066 (Yellow)
    { r: 255, g: 140, b: 0   }  // C3: #FF8C00 (Deep Orange - High PR)
];

const getHeatColor = (value, vMin, vMax) => {
    if (value === null || value === undefined || isNaN(value)) return '#f3f4f6'; // bg-gray-100
    
    // Default PR range 60-100 if not provided
    if (vMax === undefined) vMax = 100;
    if (vMin === undefined) vMin = 60;
    if (vMax <= vMin) { vMin = 0; vMax = 100; }

    // 1. Normalize
    let t = (value - vMin) / (vMax - vMin);
    t = Math.max(0, Math.min(1, t)); // Clip 0-1

    // 2. Interpolate
    let c0, c1, u;
    if (t < 0.33) {
        c0 = HEAT_COLORS[0]; c1 = HEAT_COLORS[1];
        u = t / 0.33;
    } else if (t < 0.66) {
        c0 = HEAT_COLORS[1]; c1 = HEAT_COLORS[2];
        u = (t - 0.33) / 0.33;
    } else {
        c0 = HEAT_COLORS[2]; c1 = HEAT_COLORS[3];
        u = (t - 0.66) / 0.34;
    }

    // 3. Lerp RGB
    const r = Math.round(c0.r * (1 - u) + c1.r * u);
    const g = Math.round(c0.g * (1 - u) + c1.g * u);
    const b = Math.round(c0.b * (1 - u) + c1.b * u);

    // 4. Hex
    const toHex = (x) => x.toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const getTextColor = (hexColor) => {
    if (!hexColor || hexColor === '#f3f4f6') return '#9ca3af'; // Gray text for null
    const r = parseInt(hexColor.substr(1, 2), 16);
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
};

// --- Logic ---
const processData = (rows, headers) => {
    if (!rows || !headers) return null;

    // Identify PCS Columns with strict regex
    // Must start with 'pcs_', end with '_kwh' (case insensitive)
    const pcsRegex = /^pcs_(.*)_kwh$/i;
    const pcsColumns = headers.filter(h => pcsRegex.test(h));
    
    if (pcsColumns.length === 0) {
        throw new Error("PCS発電量のカラム（pcs_◯◯◯_kwh）が1つも見つかりません。");
    }

    // Map dynamic columns to simple IDs
    const dynamicPcsList = pcsColumns.map(col => {
        const match = col.match(pcsRegex);
        const id = match ? match[1] : col; // Extracted ID
        return { id, col };
    });

    const plantDaily = [];
    const allPrValues = [];
    
    rows.forEach(row => {
        if (!row.date) return; // Skip if no date

        // 1. Parse Basic Metrics
        const irr = parseFloat(row.irradiation_kwhm2);
        const area = parseFloat(row.panel_area_m2);
        const eff = parseFloat(row.panel_efficiency_percent);

        const isValidBase = !isNaN(irr) && irr > 0 && !isNaN(area) && area > 0 && !isNaN(eff) && eff > 0;
        const pcsDetails = {};

        // 2. Calculate PR for each PCS column
        dynamicPcsList.forEach(({ id, col }) => {
            const val = parseFloat(row[col]);
            let pr = null;
            
            // PR Calculation
            // Only calculate if base metrics are valid and generation value exists
            if (isValidBase && !isNaN(val) && val >= 0) {
                // Formula: PR = (PCS_Energy / (Irrad * Area * (Eff/100))) * 100
                const denominator = irr * area * (eff / 100);
                if (denominator > 0) {
                    pr = (val / denominator) * 100;
                    allPrValues.push(pr);
                }
            }
            pcsDetails[id] = pr;
        });

        plantDaily.push({
            date: row.date,
            irradiation: isNaN(irr) ? null : irr,
            panelArea: isNaN(area) ? null : area,
            efficiency: isNaN(eff) ? null : eff,
            pcsDetails: pcsDetails
        });
    });

    // Sort by date ascending (DISABLED per user request, keep original order)
    // plantDaily.sort((a, b) => {
    //     if (a.date < b.date) return -1;
    //     if (a.date > b.date) return 1;
    //     return 0;
    // });

    // Stats for Heatmap
    allPrValues.sort((a, b) => a - b);
    let vMin = 0, vMax = 100;
    if (allPrValues.length > 0) {
        // Filter outliers (5th - 95th percentile) to keep heatmap useful
        const p5 = Math.floor(allPrValues.length * 0.05);
        const p95 = Math.floor(allPrValues.length * 0.95);
        vMin = allPrValues[p5];
        vMax = allPrValues[p95];
        // Add slight buffer to prevent flat colors if range is tiny
        if (vMax - vMin < 5) { vMin = Math.max(0, vMin - 5); vMax = vMax + 5; }
    }

    return {
        plantDaily,
        pcsList: dynamicPcsList.map(p => p.id),
        stats: { vMin, vMax }
    };
};

const parseCsv = (file) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const buffer = e.target.result;
            const uint8Array = new Uint8Array(buffer);
            let text;

            // Smart Decoding: Try UTF-8 first, then fallback to Shift-JIS
            try {
                // fatal: true causes it to throw if invalid UTF-8 sequences are found
                const decoder = new TextDecoder("utf-8", { fatal: true });
                text = decoder.decode(uint8Array);
            } catch (e) {
                // Fallback to Shift-JIS (common in Japanese CSVs)
                const decoder = new TextDecoder("shift-jis");
                text = decoder.decode(uint8Array);
            }
            
            Papa.parse(text, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const { data, meta } = results;
                    const headers = meta.fields || [];
                    
                    // Strict Header Validation
                    const required = ['date', 'irradiation_kwhm2', 'panel_area_m2', 'panel_efficiency_percent'];
                    const missing = required.filter(r => !headers.includes(r));
                    
                    if (missing.length > 0) {
                        return resolve({ success: false, error: `必須カラムが不足しています: ${missing.join(', ')}` });
                    }

                    resolve({ success: true, data, headers });
                },
                error: (err) => resolve({ success: false, error: err.message })
            });
        };
        reader.readAsArrayBuffer(file);
    });
};

// --- Components ---

const Header = ({ onReset, hasData, currentView, onChangeView }) => (
    <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-8">
                <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onChangeView('analyzer')}>
                    <Icons.Sun className="text-amber-500" />
                    <span className="text-xl font-bold text-gray-900">PR Analyzer</span>
                </div>
                <nav className="hidden md:flex space-x-1">
                    <button 
                        onClick={() => onChangeView('analyzer')}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === 'analyzer' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                    >
                        PR分析
                    </button>
                    <button 
                        onClick={() => onChangeView('calculator')}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === 'calculator' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                    >
                        パネル面積計算
                    </button>
                </nav>
            </div>
            
            <div className="flex items-center gap-4">
                {currentView === 'analyzer' && hasData && <button onClick={onReset} className="text-sm font-medium text-blue-600 hover:text-blue-500">Upload New CSV</button>}
                <div className="hidden sm:flex flex-col items-end text-[10px] text-gray-400 leading-tight border-l pl-4 border-gray-200">
                    <span>Last Updated: 2025.12.05</span>
                    <span>Version 1.0.1</span>
                </div>
            </div>
        </div>
    </header>
);

const PanelCalculator = () => {
    const presets = [
        { id: 'custom', name: 'カスタム入力', length: '', width: '' },
        { id: 'wake', name: 'プリセット和気', length: '0.992', width: '1.956' },
        { id: 'nasu', name: 'プリセット那須', length: '0.992', width: '2.000' },
    ];

    const [selectedPreset, setSelectedPreset] = useState('custom');
    const [length, setLength] = useState('');
    const [width, setWidth] = useState('');
    const [count, setCount] = useState('');
    const [isCopied, setIsCopied] = useState(false);

    const handlePresetChange = (e) => {
        const presetId = e.target.value;
        setSelectedPreset(presetId);
        const preset = presets.find(p => p.id === presetId);
        if (preset) {
            setLength(preset.length);
            setWidth(preset.width);
        }
    };

    const handleLengthChange = (e) => {
        setLength(e.target.value);
        if (selectedPreset !== 'custom') setSelectedPreset('custom');
    };

    const handleWidthChange = (e) => {
        setWidth(e.target.value);
        if (selectedPreset !== 'custom') setSelectedPreset('custom');
    };

    const areaPerPanel = useMemo(() => {
        const l = parseFloat(length);
        const w = parseFloat(width);
        if (!isNaN(l) && !isNaN(w) && l > 0 && w > 0) {
            return (l * w).toFixed(4);
        }
        return '-';
    }, [length, width]);

    const totalArea = useMemo(() => {
        const area = parseFloat(areaPerPanel);
        const c = parseInt(count);
        if (!isNaN(area) && !isNaN(c) && c > 0) {
            return (area * c).toFixed(2);
        }
        return '-';
    }, [areaPerPanel, count]);

    const handleCopy = () => {
        if (totalArea === '-' || totalArea === '0.00') return;
        navigator.clipboard.writeText(totalArea).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    return (
        <div className="max-w-xl mx-auto mt-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">パネル面積計算</h2>
            <p className="text-gray-600 mb-8">パネルの寸法と枚数を入力して、総パネル面積を算出します。</p>

            <div className="bg-white shadow-lg rounded-lg p-8 border border-gray-200">
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">パネル選択</label>
                        <select 
                            value={selectedPreset} 
                            onChange={handlePresetChange}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border bg-white"
                        >
                            {presets.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">パネル縦寸法 (m)</label>
                        <input 
                            type="number" 
                            step="0.001" 
                            placeholder="例: 1.65" 
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                            value={length}
                            onChange={handleLengthChange}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">パネル横寸法 (m)</label>
                        <input 
                            type="number" 
                            step="0.001" 
                            placeholder="例: 0.99" 
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                            value={width}
                            onChange={handleWidthChange}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">枚数</label>
                        <input 
                            type="number" 
                            placeholder="例: 200" 
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                            value={count}
                            onChange={(e) => setCount(e.target.value)}
                        />
                    </div>
                </div>

                <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">計算結果</h3>
                    <div className="space-y-3 text-gray-700">
                        <div className="flex justify-between items-baseline border-b border-gray-200 pb-2">
                            <span>1枚あたりの面積:</span>
                            <span className="text-xl font-mono">{areaPerPanel} m²</span>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <span className="font-semibold">総パネル面積:</span>
                            <div className="flex items-center gap-3">
                                <span className="text-2xl font-mono font-bold text-blue-600">{totalArea} <span className="text-base font-normal text-gray-600">m²</span></span>
                                <button 
                                    onClick={handleCopy}
                                    disabled={totalArea === '-'}
                                    className={`p-2 rounded-md transition-colors ${isCopied ? 'text-green-600 bg-green-50' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
                                    title="数値をコピー"
                                >
                                    {isCopied ? <Icons.Check width={20} height={20} /> : <Icons.Copy width={20} height={20} />}
                                </button>
                            </div>
                        </div>
                    </div>
                    <p className="mt-4 text-xs text-gray-500">面積 = 縦 (m) × 横 (m) × 枚数 で計算しています。</p>
                </div>
            </div>
        </div>
    );
};

const TemplateGuide = ({ onDownload }) => (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-8">
            <div className="border-b pb-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-900">PR入力用 CSV テンプレート & 入力ガイド</h2>
            </div>

            <p className="text-gray-700 mb-6 leading-relaxed">
                本アプリは、太陽光発電所の <strong>日次PR（Performance Ratio）</strong> を算出します。<br/>
                以下の新フォーマットに対応したCSVファイルを作成・アップロードしてください。<br/>
                テンプレートのフォーマットでE列以降は増やすことができます。ただし、1行目の入力カラム名については以下の命名規則に則り入力してください。<br/>
                パネル総面積がわからない場合は、タブからパネル面積計算を使って算出したものを入力してください。
            </p>

            <div className="mb-10">
                <button 
                    onClick={onDownload}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors shadow-md font-medium"
                >
                    <Icons.Download width={18} height={18} />
                    CSVテンプレートをダウンロード
                </button>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-4">入力カラム一覧（必須）</h3>
            <div className="overflow-x-auto mb-10 rounded-lg border border-gray-200">
                <table className="table-auto w-full border-collapse text-sm text-left">
                    <thead className="bg-gray-100 text-gray-700">
                        <tr>
                            <th className="border-b px-4 py-3 font-semibold">カラム名</th>
                            <th className="border-b px-4 py-3 font-semibold">日本語</th>
                            <th className="border-b px-4 py-3 font-semibold">単位</th>
                            <th className="border-b px-4 py-3 font-semibold">説明</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-600">
                        <tr className="bg-white border-b"><td className="px-4 py-2 font-mono font-bold">date</td><td className="px-4 py-2">日付</td><td className="px-4 py-2">―</td><td className="px-4 py-2">YYYY-MM-DD 形式</td></tr>
                        <tr className="bg-gray-50 border-b"><td className="px-4 py-2 font-mono font-bold text-blue-600">irradiation_kwhm2</td><td className="px-4 py-2">積算日射量</td><td className="px-4 py-2">kWh/m²</td><td className="px-4 py-2">POA日射量（必須）</td></tr>
                        <tr className="bg-white border-b"><td className="px-4 py-2 font-mono font-bold text-blue-600">panel_area_m2</td><td className="px-4 py-2">パネル総面積</td><td className="px-4 py-2">m²</td><td className="px-4 py-2">サイト全体の合計面積</td></tr>
                        <tr className="bg-gray-50 border-b"><td className="px-4 py-2 font-mono font-bold text-blue-600">panel_efficiency_percent</td><td className="px-4 py-2">パネル変換効率</td><td className="px-4 py-2">%</td><td className="px-4 py-2">例: 20.1</td></tr>
                        <tr className="bg-white border-b"><td className="px-4 py-2 font-mono font-bold">pcs_◯◯◯_kwh</td><td className="px-4 py-2">PCS発電量</td><td className="px-4 py-2">kWh</td><td className="px-4 py-2">PCSごとの日次発電量（列単位でPR計算）</td></tr>
                    </tbody>
                </table>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-4">重要：入力ルール</h3>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-10 text-sm text-gray-800 rounded-r-lg">
                <ul className="space-y-2 list-disc list-inside">
                    <li><strong>PCSごとのPR算出：</strong> <code>pcs_</code> カラムごとに個別にPRを計算します。</li>
                    <li><strong>自動補完なし：</strong> 空欄や不正な値（0以下の面積など）がある行は、PR計算結果が「–」（NaN）になります。</li>
                    <li><strong>ヘッダ名固定：</strong> カラム名を変更するとエラーになります。</li>
                </ul>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-4">サンプル CSV</h3>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono leading-relaxed">
{`date,irradiation_kwhm2,panel_area_m2,panel_efficiency_percent,pcs_1-1-1_kwh,pcs_1-1-2_kwh
2025-11-01,3.95,1500,20.1,124.5,126.2
2025-11-02,3.10,1500,20.1,109.2,111.0
2025-11-03,3.55,1500,20.1,127.3,129.4`}
            </pre>

            <div className="mt-8 pt-6 border-t border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">PR値の算出式</h3>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-gray-700">
                    <p className="mb-2 font-medium">各PCSのPR（Performance Ratio）は以下の式で算出されます：</p>
                    <p className="font-mono text-sm bg-white p-3 rounded border border-gray-200 overflow-x-auto">
                        PR(%) = ( PCS発電量[kWh] ÷ ( 日射量[kWh/m²] × パネル総面積[m²] × (パネル変換効率[%] ÷ 100) ) ) × 100
                    </p>
                </div>
            </div>
        </div>
    </div>
);

const FileUploader = ({ onFileSelect, isLoading, error }) => (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 text-center p-8">
        <div className="mx-auto h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
            {isLoading ? <div className="spinner text-blue-600"></div> : <Icons.Upload className="text-blue-600" style={{width:32, height:32}} />}
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">{isLoading ? 'Processing...' : 'Upload CSV Data'}</h2>
        {error && <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-lg text-left">{error}</div>}
        <label className="relative w-full flex items-center justify-center px-6 py-4 bg-blue-600 text-white rounded-xl cursor-pointer hover:bg-blue-700 shadow-lg transition-all max-w-md mx-auto">
            <Icons.FileText className="mr-2" />
            <span>Select CSV File</span>
            <input type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files[0] && onFileSelect(e.target.files[0])} disabled={isLoading} />
        </label>
        <p className="mt-4 text-xs text-gray-400">Supported: Shift-JIS / UTF-8 CSV</p>
    </div>
);

const DailyTable = ({ data, pcsList, stats }) => {
    // State for Sorting
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc', pcsId: null });

    const handleSort = (key, pcsId = null) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.pcsId === pcsId && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction, pcsId });
    };

    const resetSort = () => {
        setSortConfig({ key: null, direction: 'asc', pcsId: null });
    };

    const sortedData = useMemo(() => {
        let sortableData = [...data];
        if (sortConfig.key !== null) {
            sortableData.sort((a, b) => {
                let valA, valB;

                if (sortConfig.key === 'pcs_pr') {
                     valA = a.pcsDetails[sortConfig.pcsId];
                     valB = b.pcsDetails[sortConfig.pcsId];
                } else {
                     valA = a[sortConfig.key];
                     valB = b[sortConfig.key];
                }

                // Handle nulls/undefined - always put at bottom or treat as -Infinity?
                // Treating null as lowest value for consistent sorting
                if (valA === null || valA === undefined) valA = -Infinity;
                if (valB === null || valB === undefined) valB = -Infinity;

                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableData;
    }, [data, sortConfig]);

    const getSortIcon = (key, pcsId = null) => {
        if (sortConfig.key !== key || sortConfig.pcsId !== pcsId) {
            return <span className="ml-1 text-gray-300 opacity-0 group-hover:opacity-100">↕</span>; 
        }
        return sortConfig.direction === 'asc' ? 
            <Icons.ChevronUp className="ml-1 inline w-3 h-3" /> : 
            <Icons.ChevronDown className="ml-1 inline w-3 h-3" />;
    };

    return (
        <div className="bg-white shadow border border-gray-200 sm:rounded-lg flex flex-col h-[calc(100vh-200px)]">
            {/* Sort Reset Button */}
            {sortConfig.key !== null && (
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex justify-end">
                    <button 
                        onClick={resetSort}
                        className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center"
                    >
                        ✕ Reset Sort (Show Original Order)
                    </button>
                </div>
            )}
            <div className="flex-1 overflow-auto">
                <table className="min-w-full divide-y divide-gray-200 border-collapse">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                            <th 
                                className="sticky left-0 z-20 bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r shadow-sm w-32 cursor-pointer group hover:bg-gray-100 transition-colors"
                                onClick={() => handleSort('date')}
                            >
                                <div className="flex items-center">Date {getSortIcon('date')}</div>
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r">Irrad<br/><span className="text-[10px] normal-case">(kWh/m²)</span></th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r">Area<br/><span className="text-[10px] normal-case">(m²)</span></th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r">Eff<br/><span className="text-[10px] normal-case">(%)</span></th>
                            
                            {/* Dynamic PCS Columns */}
                            {pcsList.map(pcsId => (
                                <th 
                                    key={pcsId} 
                                    className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-b bg-blue-50 border-r min-w-[100px] cursor-pointer group hover:bg-blue-100 transition-colors"
                                    onClick={() => handleSort('pcs_pr', pcsId)}
                                >
                                    <div className="flex flex-col items-center justify-center h-full">
                                        <div className="truncate w-24 mx-auto flex items-center justify-center" title={pcsId}>
                                            {pcsId} {getSortIcon('pcs_pr', pcsId)}
                                        </div>
                                        <span className="text-[10px] font-normal text-gray-500">PR(%)</span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {sortedData.map((row, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                                <td className="sticky left-0 z-10 bg-white px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap border-r shadow-sm">{row.date}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-500 border-r">{row.irradiation?.toFixed(2) ?? '-'}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-500 border-r">{row.panelArea?.toLocaleString() ?? '-'}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-500 border-r">{row.efficiency?.toFixed(1) ?? '-'}</td>
                                
                                {/* Dynamic PCS PR Values */}
                                {pcsList.map(pcsId => {
                                    const pr = row.pcsDetails && row.pcsDetails[pcsId];
                                    const bgColor = getHeatColor(pr, stats.vMin, stats.vMax);
                                    const textColor = getTextColor(bgColor);
                                    
                                    return (
                                        <td key={pcsId} className="px-2 py-3 text-sm text-center whitespace-nowrap border-r" style={{backgroundColor: pr ? bgColor : 'transparent'}}>
                                            <span 
                                                className="px-1.5 py-0.5 rounded text-xs font-bold"
                                                style={{ color: pr ? textColor : '#9ca3af' }}
                                            >
                                                {pr ? pr.toFixed(2) + '%' : '-'}
                                            </span>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const App = () => {
    const [view, setView] = useState('analyzer');
    const [status, setStatus] = useState('idle');
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    const handleProcess = async (loader) => {
        setStatus('loading');
        setError(null);
        try {
            const result = await loader();
            if(!result.success) throw new Error(result.error);
            
            const pData = processData(result.data, result.headers);
            setData(pData);
            setStatus('loaded');
        } catch(e) {
            console.error(e);
            setError(e.message);
            setStatus('error');
        }
    };

    const exportToExcel = () => {
        if (!data) return;

        // Headers: Date, Irrad, Area, Eff, ...PCS_Names
        const headers = ['Date', 'Irradiation (kWh/m²)', 'Panel Area (m²)', 'Efficiency (%)', ...data.pcsList];
        
        const rows = data.plantDaily.map(row => {
            const pcsValues = data.pcsList.map(id => {
                const val = row.pcsDetails && row.pcsDetails[id];
                return val !== null && val !== undefined ? parseFloat(val.toFixed(2)) : ''; 
            });
            return [
                row.date,
                row.irradiation,
                row.panelArea,
                row.efficiency,
                ...pcsValues
            ];
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
        XLSX.utils.book_append_sheet(wb, ws, "PR Analysis");
        XLSX.writeFile(wb, `PR_Analysis_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const downloadTemplate = () => {
        const csvContent = "date,irradiation_kwhm2,panel_area_m2,panel_efficiency_percent,pcs_1_kwh,pcs_2_kwh\n" +
                           "2025-11-01,3.95,1500,20.1,124.5,126.2\n" +
                           "2025-11-02,3.10,1500,20.1,109.2,111.0";
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "input_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            <Header 
                hasData={status === 'loaded'} 
                onReset={() => setStatus('idle')} 
                currentView={view}
                onChangeView={setView}
            />
            <main className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {view === 'calculator' ? (
                    <PanelCalculator />
                ) : (
                    <React.Fragment>
                        {status === 'error' && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex justify-between items-center animate-fade-in">
                                <span><strong>Error:</strong> {error}</span>
                                <button onClick={() => setStatus('idle')} className="px-4 py-2 bg-white border border-red-200 rounded hover:bg-red-50 text-sm">Try Again</button>
                            </div>
                        )}
                        
                        {status !== 'loaded' && (
                            <div className="max-w-4xl mx-auto space-y-12 animate-fade-in">
                                <FileUploader isLoading={status === 'loading'} error={null}
                                    onFileSelect={(f) => handleProcess(() => parseCsv(f))}
                                />
                                <TemplateGuide onDownload={downloadTemplate} />
                            </div>
                        )}

                        {status === 'loaded' && data && (
                            <div className="animate-fade-in">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-gray-900">Daily PCS PR Overview</h2>
                                    <div className="flex items-center space-x-4">
                                        <div className="flex items-center space-x-1 text-xs text-gray-500 border-r pr-4 mr-4">
                                            <span className="w-3 h-3 rounded-sm" style={{backgroundColor:'#004C99'}}></span><span>Low</span>
                                            <span className="w-3 h-3 rounded-sm ml-1" style={{backgroundColor:'#FFE066'}}></span><span>Avg</span>
                                            <span className="w-3 h-3 rounded-sm ml-1" style={{backgroundColor:'#FF8C00'}}></span><span>High</span>
                                        </div>
                                        <button 
                                            onClick={exportToExcel}
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 transition-colors"
                                        >
                                            <Icons.Download className="mr-2 h-4 w-4" />
                                            Export Excel
                                        </button>
                                    </div>
                                </div>
                                <DailyTable data={data.plantDaily} pcsList={data.pcsList} stats={data.stats} />
                            </div>
                        )}
                    </React.Fragment>
                )}
            </main>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<ErrorBoundary><App /></ErrorBoundary>);