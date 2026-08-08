/* ============================================================
   AquaPulse AI — Application Logic
   ============================================================ */

// ---------- Utilities ----------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function rand(min, max) {
    return Math.random() * (max - min) + min;
}

function setStatus(el, statusClass, label) {
    el.className = 'status-badge ' + statusClass;
    el.textContent = label;
}

function showToast(msg, isError = false) {
    const toast = $('#toast');
    toast.innerHTML = `<i class="fas fa-${isError ? 'times-circle' : 'check-circle'}"></i><span>${msg}</span>`;
    toast.classList.toggle('error', isError);
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ---------- Gauge Rendering (canvas) ----------
function drawGauge(canvas, value) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.width;
    const H = canvas.height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const cx = W / 2;
    const cy = H - 12;
    const r = Math.min(W, H) / 2 - 14;
    const start = Math.PI;
    const end = 2 * Math.PI;
    const pct = Math.max(0, Math.min(100, value)) / 100;

    ctx.clearRect(0, 0, W, H);

    // background arc
    ctx.beginPath();
    ctx.arc(cx, cy, r, start, end);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 16;
    ctx.lineCap = 'round';
    ctx.stroke();

    // colored arc by value
    ctx.beginPath();
    ctx.arc(cx, cy, r, start, start + pct * Math.PI);
    if (value <= 40) ctx.strokeStyle = '#ff4d6d';
    else if (value <= 60) ctx.strokeStyle = '#ffb020';
    else if (value <= 75) ctx.strokeStyle = '#37f5c4';
    else ctx.strokeStyle = '#37f5a5';
    ctx.lineWidth = 16;
    ctx.lineCap = 'round';
    ctx.stroke();

    // tick marks
    ctx.font = '10px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.textAlign = 'center';
    for (let i = 0; i <= 10; i++) {
        const a = start + (i / 10) * Math.PI;
        const tx = cx + Math.cos(a) * (r - 22);
        const ty = cy + Math.sin(a) * (r - 22);
        ctx.fillText(i * 10, tx, ty);
    }
}

// ---------- Line Chart Rendering (canvas) ----------
function drawLineChart(canvas, data, color = '#00d4ff', fillColor = 'rgba(0,212,255,0.15)') {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const W = rect.width || 600;
    const H = canvas.getAttribute('height') || 140;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, W, H);

    const pad = 30;
    const innerW = W - pad * 2;
    const innerH = H - pad * 2;
    const min = Math.min(...data) - 2;
    const max = Math.max(...data) + 2;

    function x(i) { return pad + (i / (data.length - 1)) * innerW; }
    function y(v) { return H - pad - ((v - min) / (max - min)) * innerH; }

    // horizontal grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '10px Inter, sans-serif';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const gv = min + (max - min) * (i / 4);
        const gy = y(gv);
        ctx.beginPath();
        ctx.moveTo(pad, gy);
        ctx.lineTo(W - pad, gy);
        ctx.stroke();
        ctx.fillText(gv.toFixed(1), 4, gy + 3);
    }

    // fill
    ctx.beginPath();
    data.forEach((v, i) => i === 0 ? ctx.moveTo(x(i), y(v)) : ctx.lineTo(x(i), y(v)));
    ctx.lineTo(W - pad, H - pad);
    ctx.lineTo(pad, H - pad);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, fillColor);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fill();

    // line
    ctx.beginPath();
    data.forEach((v, i) => i === 0 ? ctx.moveTo(x(i), y(v)) : ctx.lineTo(x(i), y(v)));
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // points
    data.forEach((v, i) => {
        ctx.beginPath();
        ctx.arc(x(i), y(v), 3.5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
    });
}

// ---------- Sample Data ----------
const sensors = {
    ph: { value: 7.2, range: [6.5, 8.5] },
    turb: { value: 4.1, range: [0, 5] },
    tds: { value: 420, range: [0, 500] },
    do: { value: 7.8, range: [6, 14] },
    temp: { value: 24.5, range: [20, 28] },
    cond: { value: 680, range: [0, 1000] }
};

let phData = [], turbData = [], doData = [], tempData = [];

// Seed history data
for (let i = 0; i < 24; i++) {
    phData.push(rand(6.8, 7.6));
    turbData.push(rand(3, 6));
    doData.push(rand(6.5, 8.5));
    tempData.push(rand(23, 26));
}

const waterBodies = [
    { loc: 'Yamuna River, Delhi', type: 'River', ph: 6.9, turb: 8.4, tds: 480, wqi: 58, status: 'Moderate' },
    { loc: 'Chilika Lake, Odisha', type: 'Lake', ph: 8.1, turb: 3.2, tds: 320, wqi: 88, status: 'Good' },
    { loc: 'Godavari River, Andhra', type: 'River', ph: 7.4, turb: 5.6, tds: 410, wqi: 73, status: 'Moderate' },
    { loc: 'Pulicat Lake, Tamil Nadu', type: 'Lake', ph: 7.0, turb: 12.3, tds: 540, wqi: 42, status: 'Critical' },
    { loc: 'Ganga River, Varanasi', type: 'River', ph: 7.6, turb: 9.1, tds: 460, wqi: 55, status: 'Moderate' },
    { loc: 'Bhoj Wetland, Bhopal', type: 'Reservoir', ph: 7.9, turb: 2.8, tds: 290, wqi: 91, status: 'Good' },
    { loc: 'Tap Water, Bengaluru', type: 'Tap Water', ph: 6.7, turb: 1.2, tds: 210, wqi: 94, status: 'Good' },
    { loc: 'Hussain Sagar, Hyderabad', type: 'Lake', ph: 7.3, turb: 14.7, tds: 560, wqi: 38, status: 'Critical' }
];

// Recommendations per status
const recs = {
    'Good': 'Water is safe for all uses including drinking. Maintain regular monitoring.',
    'Moderate': 'Practicable water treatment recommended before drinking. Increase turbidity and TDS monitoring frequency.',
    'Critical': 'DO NOT consume. Intensified treatment required. Restrict water access and escalate pH/TDS remediation.'
};

// ---------- AI Scan Logic ----------
const scanKeywords = {
    river: { score: 62, grade: 'Moderate', findings: [
        { text: 'Elevated turbidity from sediment runoff', good: false },
        { text: 'Organic pollutants detected above threshold', good: false },
        { text: 'pH within acceptable band', good: true },
        { text: 'Dissolved oxygen recovering', good: true }
    ]},
    lake: { score: 74, grade: 'Moderate', findings: [
        { text: 'Eutrophication risk detected', good: false },
        { text: 'Algal bloom probability 32%', good: false },
        { text: 'TDS within safe limits', good: true },
        { text: 'Temperature stable', good: true }
    ]},
    tap: { score: 92, grade: 'Good', findings: [
        { text: 'No contaminant anomalies found', good: true },
        { text: 'Chlorine residual at safe level', good: true },
        { text: 'Turbidity negligible', good: true },
        { text: 'Microbial count well below limits', good: true }
    ]},
    ganges: { score: 52, grade: 'Moderate', findings: [
        { text: 'High coliform bacteria count', good: false },
        { text: 'Elevated BOD from sewage', good: false },
        { text: 'Visible floating debris', good: false },
        { text: 'pH marginally acidic', good: false }
    ]}
};

const DEFAULT_SCAN = { score: 68, grade: 'Moderate', findings: [
    { text: 'Parameter variances within expected range', good: true },
    { text: 'Minor contamination risk from unknown source', good: false },
    { text: 'Dissolved oxygen acceptable', good: true },
    { text: 'Recommended thorough filtration before use', good: false }
]};

function getScanResult(location) {
    const loc = (location || '').toLowerCase();
    for (const key of Object.keys(scanKeywords)) {
        if (loc.includes(key)) return scanKeywords[key];
    }
    return DEFAULT_SCAN;
}

function gradeColor(grade) {
    if (grade === 'Good') return 'status-good';
    if (grade === 'Critical') return 'status-critical';
    return 'status-warning';
}

// ---------- Render Functions ----------
function renderWaterBodies(statusFilter = '', search = '') {
    const tbody = $('#bodiesTable');
    const rows = waterBodies.filter(b => {
        const okStatus = !statusFilter || b.status === statusFilter;
        const q = search.toLowerCase();
        const okSearch = !q || b.loc.toLowerCase().includes(q) || b.type.toLowerCase().includes(q) || b.status.toLowerCase().includes(q);
        return okStatus && okSearch;
    });

    if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text-dim)">No water bodies found.</td></tr>`;
        return;
    }

    tbody.innerHTML = rows.map(b => `
        <tr>
            <td class="loc"><i class="fas fa-water"></i>${b.loc}</td>
            <td><span class="type-pill">${b.type}</span></td>
            <td>${b.ph}</td>
            <td>${b.turb} NTU</td>
            <td>${b.tds} ppm</td>
            <td><b style="color:${b.wqi > 75 ? 'var(--good)' : b.wqi > 50 ? 'var(--warning)' : 'var(--danger)'}">${b.wqi}</b></td>
            <td><span class="status-badge status-${b.status.toLowerCase()}">${b.status}</span></td>
        </tr>
    `).join('');
}

function renderReports(statusFilter = '') {
    const tbody = $('#reportsTable');
    const dates = ['2026-01-12', '2026-01-10', '2026-01-08', '2026-01-06', '2026-01-04', '2026-01-02', '2026-12-30', '2025-12-28'];
    const data = waterBodies.map((b, i) => ({ ...b, date: dates[i % dates.length] }))
        .filter(r => !statusFilter || r.status === statusFilter);

    tbody.innerHTML = data.map(r => `
        <tr>
            <td>${r.date}</td>
            <td class="loc"><i class="fas fa-water"></i>${r.loc}</td>
            <td>${r.ph}</td>
            <td>${r.turb} NTU</td>
            <td>${r.tds} ppm</td>
            <td>${sensors.do.value.toFixed(1)} mg/L</td>
            <td><b style="color:${r.wqi > 75 ? 'var(--good)' : r.wqi > 50 ? 'var(--warning)' : 'var(--danger)'}">${r.wqi}</b></td>
            <td><span class="status-badge status-${r.status.toLowerCase()}">${r.status}</span></td>
        </tr>
    `).join('');
}

// ---------- Sensor Value Updates ----------
function classify(value, range) {
    if (value >= range[0] && value <= range[1]) return { cls: 'status-good', label: 'Normal' };
    return { cls: 'status-warning', label: 'Watch' };
}

function updateSensorCards() {
    const classes = { ph: 'pH', turb: 'NTU', tds: 'ppm', do: 'mg/L', temp: '°C', cond: 'µS/cm' };
    document.querySelectorAll('.sensor-card').forEach(card => {
        const param = card.dataset.param;
        const s = sensors[param];
        card.querySelector('.sensor-value').textContent = s.value;
        const st = classify(s.value, s.range);
        const badge = card.querySelector('.sensor-status');
        badge.className = 'sensor-status ' + st.cls;
        badge.textContent = st.label;
    });
}

function computeWQI() {
    // Weighted quality based on each parameter's distance from ideal
    const factors = [
        (7.2 - Math.abs(sensors.ph.value - 7.2) * 8) / 7.2,
        Math.max(0, 1 - sensors.turb.value / 12),
        Math.max(0, 1 - sensors.tds.value / 800),
        Math.min(1, sensors.do.value / 8),
        Math.max(0, 1 - Math.abs(sensors.temp.value - 24) / 20),
        Math.max(0, 1 - sensors.cond.value / 1500)
    ];
    const wqi = Math.round(factors.reduce((a, b) => a + b, 0) / factors.length * 100);
    return Math.max(0, Math.min(100, wqi));
}

let currentWqi = 82;

function updateDashboard() {
    currentWqi = computeWQI();
    [$('#heroWqi'), $('#dashWqi')].forEach(el => { if (el) el.textContent = currentWqi; });
    drawGauge($('#heroGauge'), currentWqi);
    drawGauge($('#dashGauge'), currentWqi);

    let st, note, cls;
    if (currentWqi >= 75) { cls = 'status-good'; st = 'GOOD'; note = 'Water quality is excellent. Safe for all uses.'; }
    else if (currentWqi >= 50) { cls = 'status-warning'; st = 'WARNING'; note = 'Water quality is declining. Some treatment required.'; }
    else { cls = 'status-critical'; st = 'CRITICAL'; note = 'Water quality is unsafe. Immediate action needed.'; }

    setStatus($('#heroStatus'), cls, st);
    setStatus($('#dashWqiStatus'), cls, st);
    $('#dashNote').textContent = note;
    updateSensorCards();
}

function renderCharts() {
    drawLineChart($('#phTrendChart'), phData, '#00d4ff');
    drawLineChart($('#turbTrendChart'), turbData, '#ffb020', 'rgba(255,176,32,0.15)');
    drawLineChart($('#doStreamChart'), doData, '#37f5a5', 'rgba(55,245,165,0.15)');
    drawLineChart($('#tempStreamChart'), tempData, '#ff4d6d', 'rgba(255,77,109,0.15)');
}

function simulateLive() {
    // update sensor values slightly
    sensors.ph.value = clamp(sensors.ph.value + rand(-0.15, 0.15), 6.5, 8.5);
    sensors.turb.value = clamp(sensors.turb.value + rand(-0.4, 0.4), 0, 8);
    sensors.tds.value = clamp(sensors.tds.value + rand(-15, 15), 200, 600);
    sensors.do.value = clamp(sensors.do.value + rand(-0.2, 0.2), 5, 9);
    sensors.temp.value = clamp(sensors.temp.value + rand(-0.3, 0.3), 18, 30);
    sensors.cond.value = clamp(sensors.cond.value + rand(-20, 20), 400, 900);

    // shift history
    phData.push(sensors.ph.value); phData.shift();
    turbData.push(sensors.turb.value); turbData.shift();
    doData.push(sensors.do.value); doData.shift();
    tempData.push(sensors.temp.value); tempData.shift();

    updateDashboard();
    renderCharts();
    $('#lastUpdate').textContent = new Date().toLocaleTimeString();
}

function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }

// ---------- Events ----------
// Sticky header + active nav + back to top
function onScroll() {
    const h = $('.header');
    h.classList.toggle('scrolled', window.scrollY > 40);
    const back = $('#backTop');
    back.classList.toggle('show', window.scrollY > 400);

    // active link
    let current = 'dashboard';
    $$('section').forEach(sec => {
        if (window.scrollY >= sec.offsetTop - 120) current = sec.id;
    });
    $$('.nav-link').forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + current));
}

// Menu toggle
$('#menuToggle').addEventListener('click', () => $('#nav').classList.toggle('open'));
$$('.nav-link').forEach(l => l.addEventListener('click', () => $('#nav').classList.remove('open')));

// Theme toggle
$('#themeToggle').addEventListener('click', () => {
    const isDark = !document.body.dataset.theme || document.body.dataset.theme === 'dark';
    document.body.dataset.theme = isDark ? 'light' : 'dark';
    $('#themeToggle i').className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    // re-render charts/gauge for correct colors
    updateDashboard();
    renderCharts();
});

// AI Scan
$('#scanBtn').addEventListener('click', runScan);
$('#scanLocation').addEventListener('keydown', (e) => { if (e.key === 'Enter') runScan(); });

function runScan() {
    const loc = $('#scanLocation').value.trim() || 'Monitored Water Body';
    const result = getScanResult(loc);
    const box = $('#aiResult');

    showToast('AI analysis complete');

    $('#aiResultLocation').textContent = loc;
    $('#aiResultScore').textContent = result.score;
    const g = $('#aiResultGrade');
    g.className = 'grade-badge ' + gradeColor(result.grade);
    g.textContent = result.grade;

    $('#aiFindings').innerHTML = result.findings.map(f =>
        `<li class="${f.good ? 'good' : 'bad'}"><i class="fas fa-${f.good ? 'check-circle' : 'exclamation-circle'}"></i>${f.text}</li>`
    ).join('');

    $('#aiRecommendation').innerHTML = '<i class="fas fa-lightbulb"></i> ' + recs[result.grade];

    box.style.display = 'flex';
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Refresh monitoring
$('#refreshBtn').addEventListener('click', () => {
    simulateLive();
    $('#lastUpdate').textContent = 'Just now';
    showToast('Live feed refreshed');
});

// Filters
$('#filterStatus').addEventListener('change', (e) => renderWaterBodies(e.target.value, $('#searchInput').value));
$('#searchInput').addEventListener('input', (e) => renderWaterBodies($('#filterStatus').value, e.target.value));
$('#reportStatus').addEventListener('change', (e) => renderReports(e.target.value));

// Export CSV
$('#exportBtn').addEventListener('click', () => {
    const header = ['Date', 'Location', 'Type', 'pH', 'Turbidity', 'TDS', 'DO', 'WQI', 'Status'];
    const dates = ['2026-01-12', '2026-01-10', '2026-01-08', '2026-01-06'];
    const rows = waterBodies.map((b, i) => [
        dates[i % dates.length], b.loc, b.type, b.ph, b.turb,
        b.tds, sensors.do.value.toFixed(1), b.wqi, b.status
    ]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'aquapulse-reports.csv';
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('Report exported as CSV');
});

// ---------- Init ----------
drawGauge($('#heroGauge'), 82);
drawGauge($('#dashGauge'), 82);
renderWaterBodies();
renderReports();
renderCharts();
updateDashboard();

window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Live simulation loop
setInterval(simulateLive, 3000);


