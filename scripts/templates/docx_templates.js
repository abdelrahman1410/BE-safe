// Generates the BE SAFE Word templates (bilingual EN/AR).
// Usage: node docx_templates.js <repo-root>
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
  Header, Footer, AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign,
  HeightRule, PageNumber, PageOrientation, TabStopType, LevelFormat,
} = require("docx");

const ROOT = process.argv[2];
const OUT = path.join(ROOT, "library", "files");
const LOGO = fs.readFileSync(path.join(ROOT, "app", "icons", "icon-192-v2.png"));

const NAVY = "0B1F3A", ORANGE = "F26A1B", LIGHT = "EEF2F8", LINE = "BFC8D6", GREY = "5B6B82";
const FONT = "Arial";
const BOX = "☐";

// ---------- text helpers ----------
const en = (text, o = {}) => new TextRun({ text, font: FONT, size: o.size || 18, bold: o.bold, italics: o.italics, color: o.color });
const ar = (text, o = {}) => new TextRun({ text, font: FONT, size: o.size || 17, bold: o.bold, italics: o.italics, color: o.color, rightToLeft: true });
const box = (o = {}) => new TextRun({ text: BOX + " ", font: "Segoe UI Symbol", size: o.size || 20, color: o.color });

const pEn = (text, o = {}) => new Paragraph({ spacing: { before: 0, after: o.after ?? 0 }, alignment: o.align, children: [en(text, o)] });
const pAr = (text, o = {}) => new Paragraph({ bidirectional: true, spacing: { before: 0, after: o.after ?? 0 }, children: [ar(text, o)] });
const bi = (e, a, o = {}) => [pEn(e, { bold: o.bold, size: o.size, color: o.color, italics: o.italics }), pAr(a, { bold: o.bold, size: (o.size || 18) - 1, color: o.arColor || GREY, italics: o.italics })];
const empty = () => new Paragraph({ children: [] });
const spacer = (after = 120) => new Paragraph({ spacing: { before: 0, after }, children: [] });

// ---------- table helpers ----------
const border = { style: BorderStyle.SINGLE, size: 4, color: LINE };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

function cell(children, width, o = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    columnSpan: o.span,
    borders: o.borders || borders,
    verticalAlign: o.valign || VerticalAlign.CENTER,
    shading: o.fill ? { type: ShadingType.CLEAR, fill: o.fill, color: "auto" } : undefined,
    margins: { top: 50, bottom: 50, left: 90, right: 90 },
    children: Array.isArray(children) ? children : [children],
  });
}
function table(widths, rows) {
  return new Table({
    width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: widths,
    rows,
  });
}
function row(cells, o = {}) {
  return new TableRow({ children: cells, tableHeader: o.header, cantSplit: true, height: o.height ? { value: o.height, rule: HeightRule.ATLEAST } : undefined });
}

// Navy section bar: "1. English title ............ العنوان العربي"
function sectionBar(W, n, e, a) {
  return [spacer(100), table([W], [row([cell(new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: W - 200 }],
    children: [en(`${n ? n + ". " : ""}${e}`, { bold: true, color: "FFFFFF", size: 20 }), new TextRun({ text: "\t" }), ar(a, { bold: true, color: "FFFFFF", size: 20 })],
  }), W, { fill: NAVY, borders: { top: { ...border, color: NAVY }, bottom: { ...border, color: NAVY }, left: { ...border, color: NAVY }, right: { ...border, color: NAVY } } })])])];
}

// Label/value grid. fields: [[en, ar, full?], ...]
function fields(W, list, o = {}) {
  const lw = o.labelW || 2100;
  const vw = (W - 2 * lw) / 2;
  const rows = [];
  let pending = null;
  const flush = () => {
    if (pending) { rows.push(row([cell(bi(pending[0], pending[1], { bold: true, size: 16 }), lw, { fill: LIGHT }), cell(empty(), vw), cell(empty(), lw, { fill: LIGHT }), cell(empty(), vw)], { height: 480 })); pending = null; }
  };
  for (const f of list) {
    if (f[2]) {
      flush();
      rows.push(row([cell(bi(f[0], f[1], { bold: true, size: 16 }), lw, { fill: LIGHT }), cell(f[3] ? f[3] : empty(), W - lw, { span: 3 })], { height: f[4] || 480 }));
    } else if (pending) {
      rows.push(row([cell(bi(pending[0], pending[1], { bold: true, size: 16 }), lw, { fill: LIGHT }), cell(empty(), vw), cell(bi(f[0], f[1], { bold: true, size: 16 }), lw, { fill: LIGHT }), cell(empty(), vw)], { height: 480 }));
      pending = null;
    } else pending = f;
  }
  flush();
  return table([lw, vw, lw, vw], rows);
}

// Inline checkbox options inside one paragraph group: [[en, ar], ...]
function options(list, perLine = 3) {
  const paras = [];
  for (let i = 0; i < list.length; i += perLine) {
    const chunk = list.slice(i, i + perLine);
    const kids = [];
    chunk.forEach((x, j) => { kids.push(box(), en(x[0] + "  ", { size: 16 }), ar(x[1], { size: 15, color: GREY })); if (j < chunk.length - 1) kids.push(new TextRun({ text: "      " })); });
    paras.push(new Paragraph({ spacing: { before: 20, after: 20 }, children: kids }));
  }
  return paras;
}

// Checklist: items [[en, ar], ...] with Yes / No / N/A / Remarks
function checklist(W, items, o = {}) {
  const w = [500, W - 500 - 3 * 650 - 1500, 650, 650, 650, 1500];
  const head = row([
    cell(pEn("#", { bold: true, color: "FFFFFF", align: AlignmentType.CENTER }), w[0], { fill: NAVY }),
    cell(bi(o.title || "Check item", o.titleAr || "بند الفحص", { bold: true, color: "FFFFFF", arColor: "DDE4EE" }), w[1], { fill: NAVY }),
    cell(bi("Yes", "نعم", { bold: true, color: "FFFFFF", arColor: "DDE4EE" }).map(p => p), w[2], { fill: NAVY }),
    cell(bi("No", "لا", { bold: true, color: "FFFFFF", arColor: "DDE4EE" }), w[3], { fill: NAVY }),
    cell(bi("N/A", "لا ينطبق", { bold: true, color: "FFFFFF", arColor: "DDE4EE", size: 16 }), w[4], { fill: NAVY }),
    cell(bi("Remarks", "ملاحظات", { bold: true, color: "FFFFFF", arColor: "DDE4EE" }), w[5], { fill: NAVY }),
  ], { header: true });
  const boxCell = (wd) => cell(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: BOX, font: "Segoe UI Symbol", size: 22 })] }), wd);
  const rows = items.map((it, i) => row([
    cell(pEn(String(i + 1), { align: AlignmentType.CENTER }), w[0]),
    cell(bi(it[0], it[1], { size: 17 }), w[1]),
    boxCell(w[2]), boxCell(w[3]), boxCell(w[4]), cell(empty(), w[5]),
  ]));
  return table(w, [head, ...rows]);
}

// Generic grid with header labels [[en, ar, width]], n blank rows, optional example row
function grid(cols, n, o = {}) {
  const w = cols.map(c => c[2]);
  const head = row(cols.map(c => cell(bi(c[0], c[1], { bold: true, color: "FFFFFF", arColor: "DDE4EE", size: 16 }), c[2], { fill: NAVY })), { header: true });
  const rows = [head];
  if (o.example) rows.push(row(o.example.map((t, i) => cell(pEn(t, { italics: true, color: GREY, size: 16 }), w[i], { fill: "FFF8F2" })), { height: 420 }));
  for (let i = 0; i < n; i++) rows.push(row(w.map((wd, j) => cell(o.numbered && j === 0 ? pEn(String(i + 1), { align: AlignmentType.CENTER, color: GREY }) : empty(), wd)), { height: o.height || 480 }));
  return table(w, rows);
}

// Free text box with a hint
function textBox(W, hintEn, hintAr, height = 1500) {
  return table([W], [row([cell([pEn(hintEn, { italics: true, color: GREY, size: 16 }), pAr(hintAr, { italics: true, color: GREY, size: 15 })], W, { valign: VerticalAlign.TOP })], { height })]);
}

// Sign-off table: roles [[en, ar]]
function signoff(W, roles) {
  const w = [Math.round(W * 0.28), Math.round(W * 0.28), Math.round(W * 0.24)];
  w.push(W - w[0] - w[1] - w[2]);
  const head = row([["Role", "الصفة"], ["Name", "الاسم"], ["Signature", "التوقيع"], ["Date / Time", "التاريخ / الوقت"]].map((h, i) => cell(bi(h[0], h[1], { bold: true, size: 16 }), w[i], { fill: LIGHT })), { header: true });
  return table(w, [head, ...roles.map(r => row([cell(bi(r[0], r[1], { bold: true, size: 16 }), w[0]), cell(empty(), w[1]), cell(empty(), w[2]), cell(empty(), w[3])], { height: 560 }))]);
}

function ppe(W, list) {
  return table([W], [row([cell(options(list, 3), W)])]);
}

function note(text, arText) {
  return [spacer(60), pEn(text, { italics: true, color: GREY, size: 15 }), pAr(arText, { italics: true, color: GREY, size: 14 })];
}

// ---------- document shell ----------
// Optional filter: node docx_templates.js <repo> <part1,part2>  builds only files whose name contains one of the parts
const ONLY = (process.argv[3] || "").split(",").filter(Boolean);

function build(file, meta, bodyFn, o = {}) {
  if (ONLY.length && !ONLY.some(p => file.includes(p))) return Promise.resolve();
  const landscape = !!o.landscape;
  const pageW = 11906, pageH = 16838, margin = 851;
  const W = (landscape ? pageH : pageW) - 2 * margin;

  const header = new Header({ children: [table([900, W - 900 - 2600, 2600], [row([
    cell(new Paragraph({ children: [new ImageRun({ type: "png", data: LOGO, transformation: { width: 38, height: 38 } })] }), 900, { borders: noBorders }),
    cell([pEn("BE SAFE", { bold: true, color: NAVY, size: 22 }), pEn("HSE Templates · نماذج السلامة", { color: GREY, size: 15 })], W - 900 - 2600, { borders: noBorders }),
    cell([pEn(meta.code, { bold: true, color: NAVY, size: 16, align: AlignmentType.RIGHT }), pEn("Rev. 0", { color: GREY, size: 15, align: AlignmentType.RIGHT })], 2600, { borders: noBorders }),
  ])]), new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: ORANGE, space: 2 } }, spacing: { after: 0 }, children: [] })] });

  const footer = new Footer({ children: [
    new Paragraph({ border: { top: { style: BorderStyle.SINGLE, size: 4, color: LINE, space: 4 } }, spacing: { after: 0 }, children: [en("This template is a general guide. Adapt it to your company procedures, client requirements and applicable Saudi regulations before use.", { size: 13, color: GREY, italics: true })] }),
    pAr("هذا النموذج إرشادي عام. يُرجى تكييفه مع إجراءات شركتك ومتطلبات العميل والأنظمة السعودية المعمول بها قبل الاستخدام.", { size: 13, color: GREY, italics: true }),
    new Paragraph({ tabStops: [{ type: TabStopType.RIGHT, position: W }], spacing: { before: 40 }, children: [
      en("BE SAFE · Free HSE template by Abdul Rahman Zain · abdelrahman1410.github.io/BE-safe", { size: 13, color: GREY }),
      new TextRun({ text: "\t" }),
      new TextRun({ font: FONT, size: 13, color: GREY, children: ["Page ", PageNumber.CURRENT, " / ", PageNumber.TOTAL_PAGES] }),
    ] }),
  ] });

  const title = [
    new Paragraph({ spacing: { before: 80, after: 0 }, children: [en(meta.title, { bold: true, size: 32, color: NAVY })] }),
    new Paragraph({ bidirectional: true, spacing: { before: 0, after: 80 }, children: [ar(meta.titleAr, { bold: true, size: 28, color: ORANGE })] }),
  ];
  if (meta.intro) title.push(pEn(meta.intro, { color: GREY, size: 16 }), pAr(meta.introAr, { color: GREY, size: 15, after: 60 }));

  const doc = new Document({
    creator: "Abdul Rahman Zain – BE SAFE",
    title: meta.title,
    description: meta.titleAr,
    styles: { default: { document: { run: { font: FONT, size: 18 }, paragraph: { spacing: { before: 0, after: 0 } } } } },
    sections: [{
      properties: { page: { size: { width: pageW, height: pageH, orientation: landscape ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT }, margin: { top: 1300, bottom: 1250, left: margin, right: margin, header: 400, footer: 300 } } },
      headers: { default: header },
      footers: { default: footer },
      children: [...title, ...bodyFn(W)],
    }],
  });
  return Packer.toBuffer(doc).then(buf => { fs.writeFileSync(path.join(OUT, file), buf); console.log("wrote", file); });
}

// ---------- shared PTW parts ----------
const ptwDetails = (W, extra = []) => [
  ...sectionBar(W, 1, "Permit details", "بيانات التصريح"),
  fields(W, [
    ["Permit No.", "رقم التصريح"], ["Date", "التاريخ"],
    ["Valid from (time)", "ساري من (الوقت)"], ["Valid to (time)", "ساري حتى (الوقت)"],
    ["Project / Site", "المشروع / الموقع"], ["Exact work location", "موقع العمل بالتحديد"],
    ["Contractor / Company", "المقاول / الشركة"], ["Number of workers", "عدد العمال"],
    ...extra,
    ["Work description", "وصف العمل", true, empty(), 800],
    ["Tools & equipment", "الأدوات والمعدات", true, empty(), 600],
  ]),
];
const ptwAttachments = (W, list) => [
  ...sectionBar(W, null, "Attached documents", "المستندات المرفقة"),
  table([W], [row([cell(options(list, 3), W)])]),
];
const ptwAuth = (W) => [
  ...sectionBar(W, null, "Authorization", "الاعتماد"),
  pEn("By signing, each person confirms that the precautions above are in place and understood.", { italics: true, color: GREY, size: 15 }),
  pAr("بالتوقيع، يؤكد كل شخص أن الاحتياطات أعلاه مطبّقة ومفهومة.", { italics: true, color: GREY, size: 14, after: 60 }),
  signoff(W, [["Permit receiver (supervisor)", "مستلم التصريح (المشرف)"], ["Permit issuer", "مُصدر التصريح"], ["HSE representative", "ممثل السلامة"], ["Area authority (if required)", "مسؤول المنطقة (عند الحاجة)"]]),
];
const ptwExtension = (W) => [
  ...sectionBar(W, null, "Extension (next shift)", "التمديد (الوردية التالية)"),
  grid([["Date", "التاريخ", 1500], ["From – To", "من – إلى", 1700], ["Gas test / conditions OK", "فحص الغاز / الظروف سليمة", 2400], ["Receiver signature", "توقيع المستلم", Math.floor((W - 5600) / 2)], ["Issuer signature", "توقيع المُصدر", W - 5600 - Math.floor((W - 5600) / 2)]], 2),
];
const ptwClosure = (W, items) => [
  ...sectionBar(W, null, "Permit closure", "إغلاق التصريح"),
  table([W], [row([cell(options(items, 2), W)])]),
  spacer(60),
  signoff(W, [["Permit receiver", "مستلم التصريح"], ["Permit issuer", "مُصدر التصريح"]]),
];
function gasTable(W, limits) {
  const w = [1900, 2300]; const r = W - 4200; w.push(Math.floor(r / 3), Math.floor(r / 3), r - 2 * Math.floor(r / 3));
  const head = row([["Parameter", "المعيار"], ["Acceptable limit", "الحد المقبول"], ["Reading 1 / time", "القراءة 1 / الوقت"], ["Reading 2 / time", "القراءة 2 / الوقت"], ["Reading 3 / time", "القراءة 3 / الوقت"]].map((h, i) => cell(bi(h[0], h[1], { bold: true, color: "FFFFFF", arColor: "DDE4EE", size: 16 }), w[i], { fill: NAVY })), { header: true });
  const rows = limits.map(l => row([cell(pEn(l[0], { bold: true }), w[0], { fill: LIGHT }), cell(pEn(l[1]), w[1]), cell(empty(), w[2]), cell(empty(), w[3]), cell(empty(), w[4])], { height: 440 }));
  rows.push(row([cell(bi("Tested by / detector ID", "الفاحص / رقم الجهاز", { bold: true, size: 16 }), w[0], { fill: LIGHT }), cell(empty(), W - w[0], { span: 4 })], { height: 440 }));
  return [...sectionBar(W, null, "Gas test results", "نتائج فحص الغازات"), table(w, [head, ...rows]), ...note("Limits shown are common values. Use your site procedure and calibrated detectors (bump-tested before use).", "الحدود المذكورة قيم شائعة. اتبع إجراءات موقعك واستخدم أجهزة معايرة ومفحوصة قبل الاستخدام.")];
}

module.exports = { en, ar, box, pEn, pAr, bi, empty, spacer, cell, table, row, sectionBar, fields, options, checklist, grid, textBox, signoff, ppe, note, build, NAVY, ORANGE, LIGHT, LINE, GREY, AlignmentType, VerticalAlign, TextRun, Paragraph };

// ---------- documents ----------
const docs = [];
if (require.main === module) {

// PTW – Hot Work
docs.push(build("BE-SAFE_PTW_Hot-Work.docx", { code: "BS-PTW-01", title: "Hot Work Permit", titleAr: "تصريح الأعمال الساخنة", intro: "For welding, cutting, grinding, brazing and any work that produces sparks, flame or heat.", introAr: "لأعمال اللحام والقطع والتجليخ واللحام بالنحاس وأي عمل ينتج عنه شرر أو لهب أو حرارة." }, (W) => [
  ...ptwDetails(W, [["Type of hot work", "نوع العمل الساخن"], ["Fire watch name", "اسم مراقب الحريق"]]),
  ...ptwAttachments(W, [["JSA / Risk assessment", "تحليل سلامة المهام / تقييم المخاطر"], ["Method statement", "طريقة التنفيذ"], ["Gas test record", "سجل فحص الغازات"], ["Isolation certificate", "شهادة العزل"], ["Fire watch checklist", "قائمة مراقب الحريق"], ["Other", "أخرى"]]),
  ...sectionBar(W, 2, "Precautions checklist", "قائمة الاحتياطات"),
  checklist(W, [
    ["Combustible materials removed within 11 m of the work, or covered with fire blankets", "إزالة المواد القابلة للاشتعال في نطاق 11 م من العمل أو تغطيتها ببطانيات الحريق"],
    ["Floors swept clean; openings, gaps and drains covered", "تنظيف الأرضيات وتغطية الفتحات والفراغات والمصارف"],
    ["Gas test done at the work point; LEL 0% before starting", "إجراء فحص الغاز في موقع العمل؛ نسبة LEL صفر قبل البدء"],
    ["Fire extinguishers (at least 2) available at the work point", "توفر طفايات حريق (اثنتان على الأقل) في موقع العمل"],
    ["Trained fire watch assigned during the work and at least 30 minutes after", "تعيين مراقب حريق مدرب أثناء العمل ولمدة 30 دقيقة على الأقل بعده"],
    ["Welding and cutting equipment inspected (cables, hoses, regulators, flashback arrestors)", "فحص معدات اللحام والقطع (الكابلات، الخراطيم، المنظمات، مانعات الارتداد)"],
    ["Gas cylinders upright, secured and capped; oxygen and fuel gas separated", "أسطوانات الغاز قائمة ومثبتة ومغطاة؛ فصل الأكسجين عن غاز الوقود"],
    ["Welding screens or curtains in place to protect others", "وضع ستائر أو حواجز اللحام لحماية الآخرين"],
    ["Adequate ventilation or fume extraction", "تهوية كافية أو شفط للأبخرة"],
    ["Fire alarm / sprinkler isolation approved (if applicable)", "اعتماد عزل إنذار الحريق / الرشاشات (عند الحاجة)"],
    ["Other side of walls, floors and ceilings checked for combustibles", "فحص الجهة الأخرى من الجدران والأرضيات والأسقف من المواد القابلة للاشتعال"],
    ["Workers competent and briefed; emergency numbers and assembly point known", "العمال مؤهلون وتم إبلاغهم؛ أرقام الطوارئ ونقطة التجمع معروفة"],
  ]),
  ...gasTable(W, [["Oxygen (O₂)", "19.5 – 23.5 %"], ["Flammable gas (LEL)", "0 %"], ["Hydrogen sulphide (H₂S)", "< 10 ppm"], ["Carbon monoxide (CO)", "< 25 ppm"]]),
  ...sectionBar(W, 3, "Required PPE", "معدات الوقاية المطلوبة"),
  ppe(W, [["Safety helmet", "خوذة"], ["Safety shoes", "حذاء سلامة"], ["Welding helmet / face shield", "قناع لحام / واقي وجه"], ["Welding gloves", "قفازات لحام"], ["Leather apron", "مريلة جلدية"], ["FR coverall", "أفرول مقاوم للهب"], ["Safety glasses", "نظارات سلامة"], ["Respirator", "كمامة تنفس"], ["Hearing protection", "واقي سمع"]]),
  ...ptwAuth(W),
  ...ptwExtension(W),
  ...ptwClosure(W, [["Work completed", "اكتمل العمل"], ["Area inspected and left clean", "تم فحص المنطقة وتنظيفها"], ["Fire watch completed (30 min after work)", "اكتملت مراقبة الحريق (30 دقيقة بعد العمل)"], ["Equipment and cylinders removed", "إزالة المعدات والأسطوانات"], ["Isolations removed / systems restored", "إزالة العزل / إعادة الأنظمة"], ["Permit returned to issuer", "إعادة التصريح للمُصدر"]]),
]));

// PTW – Confined Space
docs.push(build("BE-SAFE_PTW_Confined-Space.docx", { code: "BS-PTW-02", title: "Confined Space Entry Permit", titleAr: "تصريح دخول الأماكن المغلقة", intro: "For entry into tanks, pits, manholes, chambers, ducts and any space with limited access and poor ventilation.", introAr: "لدخول الخزانات والحفر وغرف التفتيش والمجاري والقنوات وأي مكان بمداخل محدودة وتهوية ضعيفة." }, (W) => [
  ...ptwDetails(W, [["Confined space name / ID", "اسم / رقم المكان المغلق"], ["Standby attendant", "المراقب عند المدخل"]]),
  ...ptwAttachments(W, [["JSA / Risk assessment", "تحليل سلامة المهام / تقييم المخاطر"], ["Rescue plan", "خطة الإنقاذ"], ["Isolation certificate", "شهادة العزل"], ["Gas test record", "سجل فحص الغازات"], ["Hot work permit (if needed)", "تصريح أعمال ساخنة (عند الحاجة)"], ["Other", "أخرى"]]),
  ...sectionBar(W, 2, "Precautions checklist", "قائمة الاحتياطات"),
  checklist(W, [
    ["Entry is necessary; alternatives without entry considered", "الدخول ضروري؛ تم دراسة بدائل لا تتطلب الدخول"],
    ["All energy sources and lines isolated (LOTO, blinds, double block and bleed)", "عزل جميع مصادر الطاقة والخطوط (القفل والوسم، الألواح العمياء، العزل المزدوج)"],
    ["Space emptied, cleaned and purged", "تفريغ المكان وتنظيفه وتطهيره"],
    ["Continuous forced ventilation in place", "تهوية قسرية مستمرة"],
    ["Gas test done before entry and repeated at set intervals / continuous monitoring", "فحص الغاز قبل الدخول وتكراره دوريًا / مراقبة مستمرة"],
    ["Trained standby attendant at the entrance at all times", "مراقب مدرب عند المدخل طوال الوقت"],
    ["Rescue plan briefed; rescue equipment ready (tripod, winch, harness, lifeline)", "شرح خطة الإنقاذ؛ معدات الإنقاذ جاهزة (حامل ثلاثي، ونش، حزام، حبل نجاة)"],
    ["Communication method between entrants and attendant agreed", "الاتفاق على وسيلة تواصل بين الداخلين والمراقب"],
    ["Low-voltage (24 V) lighting and suitable tools used", "استخدام إضاءة منخفضة الجهد (24 فولت) وأدوات مناسبة"],
    ["Entrants trained and medically fit", "الداخلون مدربون ولائقون طبيًا"],
    ["Barriers and warning signs at the entrance", "حواجز ولافتات تحذيرية عند المدخل"],
    ["Entry / exit log maintained (see below)", "تسجيل الدخول والخروج (انظر أدناه)"],
  ]),
  ...gasTable(W, [["Oxygen (O₂)", "19.5 – 23.5 %"], ["Flammable gas (LEL)", "< 10 %"], ["Hydrogen sulphide (H₂S)", "< 10 ppm"], ["Carbon monoxide (CO)", "< 25 ppm"]]),
  ...sectionBar(W, 3, "Required PPE & equipment", "معدات الوقاية والمعدات المطلوبة"),
  ppe(W, [["Safety helmet", "خوذة"], ["Safety shoes", "حذاء سلامة"], ["Full body harness", "حزام أمان كامل"], ["Personal gas detector", "جهاز كشف غاز شخصي"], ["Respirator / SCBA", "كمامة / جهاز تنفس"], ["Coverall", "أفرول"], ["Gloves", "قفازات"], ["Goggles", "نظارات واقية"], ["Radio", "جهاز اتصال"]]),
  ...sectionBar(W, 4, "Entry / exit log", "سجل الدخول والخروج"),
  grid([["Name", "الاسم", 3000], ["In", "دخول", Math.floor((W - 3000) / 4)], ["Out", "خروج", Math.floor((W - 3000) / 4)], ["In", "دخول", Math.floor((W - 3000) / 4)], ["Out", "خروج", W - 3000 - 3 * Math.floor((W - 3000) / 4)]], 6, { height: 420 }),
  ...ptwAuth(W),
  ...ptwExtension(W),
  ...ptwClosure(W, [["Work completed", "اكتمل العمل"], ["All persons and tools out of the space", "خروج جميع الأشخاص والأدوات"], ["Space closed / covers replaced", "إغلاق المكان / إعادة الأغطية"], ["Isolations removed / systems restored", "إزالة العزل / إعادة الأنظمة"], ["Permit returned to issuer", "إعادة التصريح للمُصدر"]]),
]));

// PTW – Work at Height
docs.push(build("BE-SAFE_PTW_Work-at-Height.docx", { code: "BS-PTW-03", title: "Work at Height Permit", titleAr: "تصريح العمل على المرتفعات", intro: "For any work where a person could fall from one level to another (scaffolds, MEWPs, ladders, roofs, edges).", introAr: "لأي عمل قد يسقط فيه شخص من مستوى إلى آخر (سقالات، رافعات أفراد، سلالم، أسطح، حواف)." }, (W) => [
  ...ptwDetails(W, [["Working height (m)", "ارتفاع العمل (م)"], ["Access type", "وسيلة الوصول"]]),
  ...ptwAttachments(W, [["JSA / Risk assessment", "تحليل سلامة المهام / تقييم المخاطر"], ["Scaffold tag / inspection", "بطاقة / فحص السقالة"], ["MEWP certificate", "شهادة رافعة الأفراد"], ["Rescue plan", "خطة الإنقاذ"], ["Method statement", "طريقة التنفيذ"], ["Other", "أخرى"]]),
  ...sectionBar(W, 2, "Precautions checklist", "قائمة الاحتياطات"),
  checklist(W, [
    ["Work at height cannot be avoided; safest access method selected", "لا يمكن تجنب العمل على ارتفاع؛ تم اختيار أكثر وسائل الوصول أمانًا"],
    ["Scaffold inspected and green-tagged, or MEWP inspected and certified", "السقالة مفحوصة وعليها بطاقة خضراء، أو رافعة الأفراد مفحوصة ومعتمدة"],
    ["Edge protection in place: top rail, mid rail and toe board", "حماية الحواف: درابزين علوي ووسطي ولوح قدم"],
    ["Full body harness and double lanyard with shock absorber inspected; 100% tie-off", "فحص حزام الأمان الكامل والحبل المزدوج مع ممتص الصدمات؛ ربط دائم 100%"],
    ["Suitable, rated anchor points identified", "تحديد نقاط تثبيت مناسبة ومعتمدة"],
    ["Floor openings covered, secured and marked", "تغطية فتحات الأرضيات وتثبيتها وتعليمها"],
    ["Area below barricaded; protection against falling objects", "تطويق المنطقة أسفل العمل؛ حماية من سقوط الأجسام"],
    ["Ladders inspected, secured, at 1:4 angle and 1 m above the landing", "السلالم مفحوصة ومثبتة بزاوية 1:4 وتمتد 1 م فوق منطقة الوصول"],
    ["Weather checked; wind speed within limits", "التحقق من الطقس؛ سرعة الرياح ضمن الحدود"],
    ["Tools and materials tethered or secured", "تثبيت أو ربط الأدوات والمواد"],
    ["Workers trained; rescue plan for a suspended worker in place", "العمال مدربون؛ توجد خطة لإنقاذ عامل معلّق"],
    ["Adequate lighting", "إضاءة كافية"],
  ]),
  ...sectionBar(W, 3, "Required PPE", "معدات الوقاية المطلوبة"),
  ppe(W, [["Helmet with chin strap", "خوذة بحزام ذقن"], ["Full body harness", "حزام أمان كامل"], ["Double lanyard", "حبل مزدوج"], ["Safety shoes", "حذاء سلامة"], ["Gloves", "قفازات"], ["Safety glasses", "نظارات سلامة"], ["Hi-vis vest", "سترة عاكسة"], ["Tool lanyards", "حبال تثبيت الأدوات"], ["Other", "أخرى"]]),
  ...ptwAuth(W),
  ...ptwExtension(W),
  ...ptwClosure(W, [["Work completed", "اكتمل العمل"], ["Tools and materials removed from height", "إزالة الأدوات والمواد من الأعلى"], ["Openings re-covered / edge protection restored", "إعادة تغطية الفتحات / إعادة حماية الحواف"], ["Barricades removed safely", "إزالة الحواجز بأمان"], ["Permit returned to issuer", "إعادة التصريح للمُصدر"]]),
]));

// PTW – Energy Isolation Certificate (LOTO)
docs.push(build("BE-SAFE_PTW_Energy-Isolation-LOTO.docx", { code: "BS-PTW-04", title: "Energy Isolation Certificate (LOTO)", titleAr: "شهادة عزل الطاقة (القفل والوسم)", intro: "For isolating all hazardous energy (electrical, mechanical, hydraulic, pneumatic, process) before work. Attach it to the related work permit.", introAr: "لعزل جميع مصادر الطاقة الخطرة (كهربائية، ميكانيكية، هيدروليكية، هوائية، خطوط تشغيل) قبل العمل. تُرفق مع تصريح العمل المرتبط." }, (W) => [
  ...ptwDetails(W, [["Equipment / system", "المعدة / النظام"], ["Related permit No.", "رقم التصريح المرتبط"]]),
  ...sectionBar(W, 2, "Isolation points", "نقاط العزل"),
  grid([["Isolation point / equipment", "نقطة العزل / المعدة", 2700], ["Energy & method (breaker, valve, blind)", "الطاقة والطريقة (قاطع، صمام، لوح أعمى)", 2100], ["Lock No.", "رقم القفل", 1100], ["Tag No.", "رقم البطاقة", 1100], ["Isolated by", "عزل بواسطة", Math.floor((W - 7000) / 2)], ["Verified by", "تحقق بواسطة", W - 7000 - Math.floor((W - 7000) / 2)]], 6, { height: 420 }),
  ...sectionBar(W, 3, "Isolation checklist", "قائمة التحقق من العزل"),
  checklist(W, [
    ["All energy sources identified (electrical, stored, mechanical, hydraulic, pneumatic, process lines)", "تحديد جميع مصادر الطاقة (كهربائية، مخزنة، ميكانيكية، هيدروليكية، هوائية، خطوط التشغيل)"],
    ["Isolation points checked against drawings (single-line diagrams, P&IDs)", "مطابقة نقاط العزل مع المخططات (المخططات أحادية الخط، مخططات الأنابيب والأجهزة)"],
    ["Equipment shut down by the normal stop procedure", "إيقاف المعدة بإجراء الإيقاف المعتاد"],
    ["Isolation points opened / closed and locked with personal locks", "فتح / غلق نقاط العزل وقفلها بأقفال شخصية"],
    ["Danger tags attached with name, date and reason", "تعليق بطاقات الخطر بالاسم والتاريخ والسبب"],
    ["Lines drained, depressurized and vented; blinds or double block and bleed fitted where required", "تصريف الخطوط وتفريغ الضغط والتهوية؛ تركيب ألواح عمياء أو عزل مزدوج مع تصريف عند الحاجة"],
    ["Stored energy released (capacitors discharged, springs released, moving parts blocked)", "تفريغ الطاقة المخزنة (تفريغ المكثفات، تحرير النوابض، تثبيت الأجزاء المتحركة)"],
    ["Zero energy verified: try-start and test-before-touch with a proven tester", "التحقق من انعدام الطاقة: محاولة التشغيل والفحص قبل اللمس بجهاز مُختبر"],
    ["Each worker applied a personal lock (group lock box where used)", "كل عامل وضع قفله الشخصي (صندوق القفل الجماعي عند استخدامه)"],
    ["Isolations done only by authorized, competent persons", "تنفيذ العزل بواسطة أشخاص مؤهلين ومصرح لهم فقط"],
    ["Isolation status displayed at the work location / isolation register updated", "عرض حالة العزل في موقع العمل / تحديث سجل العزل"],
    ["De-isolation and re-energization procedure agreed with the area authority", "الاتفاق على إجراء فك العزل وإعادة التشغيل مع مسؤول المنطقة"],
  ]),
  ...ptwAuth(W),
  ...ptwClosure(W, [["Work completed and tested", "اكتمل العمل وتم اختباره"], ["All persons clear of the equipment", "ابتعاد جميع الأشخاص عن المعدة"], ["Guards, covers and blinds restored", "إعادة الحواجز والأغطية وإزالة الألواح العمياء"], ["Locks and tags removed by their owners", "إزالة الأقفال والبطاقات بواسطة أصحابها"], ["Equipment de-isolated and handed back", "فك العزل وتسليم المعدة"], ["Isolation register closed", "إغلاق سجل العزل"]]),
]));

// PTW – Electrical Work
docs.push(build("BE-SAFE_PTW_Electrical-Work.docx", { code: "BS-PTW-06", title: "Electrical Work Permit", titleAr: "تصريح الأعمال الكهربائية", intro: "For work on or near electrical equipment and systems, including testing. Work de-energized whenever possible; live work needs separate justification and approval.", introAr: "للعمل على المعدات والأنظمة الكهربائية أو بالقرب منها، بما في ذلك الاختبارات. نفّذ العمل بعد فصل التيار كلما أمكن؛ والعمل على أجزاء حية يحتاج مبررًا واعتمادًا منفصلًا." }, (W) => [
  ...ptwDetails(W, [["Equipment / panel", "المعدة / اللوحة"], ["Voltage", "الجهد"], ["Isolation certificate No.", "رقم شهادة العزل"], ["Authorized electrician", "الكهربائي المصرح له"]]),
  ...sectionBar(W, null, "Type of work", "نوع العمل"),
  table([W], [row([cell(options([["De-energized work", "عمل بعد فصل التيار"], ["Live (energized) work", "عمل على أجزاء حية"], ["Testing / fault finding", "اختبار / تحديد أعطال"], ["Commissioning", "تشغيل تجريبي"], ["Work near overhead lines", "عمل قرب خطوط هوائية"], ["Other", "أخرى"]], 3), W)])]),
  ...ptwAttachments(W, [["JSA / Risk assessment", "تحليل سلامة المهام / تقييم المخاطر"], ["Energy isolation certificate", "شهادة عزل الطاقة"], ["Single-line diagram", "المخطط أحادي الخط"], ["Live work justification", "مبرر العمل على أجزاء حية"], ["Test procedure", "إجراء الاختبار"], ["Other", "أخرى"]]),
  ...sectionBar(W, 2, "Precautions checklist", "قائمة الاحتياطات"),
  checklist(W, [
    ["Work planned de-energized; energy isolation certificate attached", "العمل مخطط بعد فصل التيار؛ شهادة عزل الطاقة مرفقة"],
    ["Absence of voltage verified with a proven tester (test before touch)", "التحقق من انعدام الجهد بجهاز مُختبر (الفحص قبل اللمس)"],
    ["Live work only if justified, risk assessed and approved by management", "العمل على أجزاء حية فقط بمبرر وتقييم مخاطر واعتماد الإدارة"],
    ["Shock and arc-flash boundaries set and barricaded", "تحديد حدود الصعق والقوس الكهربائي وتطويقها"],
    ["Only qualified, authorized electricians do the work", "تنفيذ العمل بواسطة كهربائيين مؤهلين ومصرح لهم فقط"],
    ["Insulated tools and correctly rated test instruments used", "استخدام أدوات معزولة وأجهزة قياس بالتصنيف المناسب"],
    ["Arc-rated PPE suitable for the arc-flash category", "معدات وقاية مقاومة للقوس مناسبة لفئة الخطر"],
    ["Rubber insulating mats in place", "وضع سجاد مطاطي عازل"],
    ["Safety watcher present for live work", "وجود مراقب سلامة أثناء العمل على أجزاء حية"],
    ["Temporary earths applied where required", "تركيب التأريض المؤقت عند الحاجة"],
    ["Rescue arrangements ready (insulated rescue hook, CPR-trained person)", "ترتيبات الإنقاذ جاهزة (خطاف إنقاذ معزول، شخص مدرب على الإنعاش)"],
    ["Panel doors and covers controlled; warning signs posted", "التحكم في أبواب وأغطية اللوحات؛ تعليق لافتات التحذير"],
  ]),
  ...sectionBar(W, 3, "Required PPE", "معدات الوقاية المطلوبة"),
  ppe(W, [["Arc-rated clothing / suit", "ملابس / بدلة مقاومة للقوس"], ["Insulated gloves with leather protectors", "قفازات معزولة مع واقيات جلدية"], ["Arc face shield / hood", "واقي وجه / قناع للقوس"], ["Helmet (electrical class)", "خوذة (فئة كهربائية)"], ["EH safety shoes", "حذاء عازل"], ["Safety glasses", "نظارات سلامة"]]),
  ...ptwAuth(W),
  ...ptwClosure(W, [["Work completed and tested", "اكتمل العمل وتم اختباره"], ["Tools and materials removed", "إزالة الأدوات والمواد"], ["Covers and doors closed", "إغلاق الأغطية والأبواب"], ["Temporary earths removed", "إزالة التأريض المؤقت"], ["Isolation certificate returned for de-isolation", "إعادة شهادة العزل لفك العزل"], ["Permit returned to issuer", "إعادة التصريح للمُصدر"]]),
]));

// PTW – Cold Work
docs.push(build("BE-SAFE_PTW_Cold-Work.docx", { code: "BS-PTW-07", title: "Cold Work Permit", titleAr: "تصريح الأعمال الباردة", intro: "For work that does not produce sparks, flame or heat but needs control: maintenance, mechanical work, painting, insulation, cleaning and similar work in operating or restricted areas.", introAr: "للأعمال التي لا ينتج عنها شرر أو لهب أو حرارة لكنها تحتاج إلى ضبط: الصيانة، الأعمال الميكانيكية، الدهان، العزل، التنظيف ونحوها في المناطق التشغيلية أو المقيدة." }, (W) => [
  ...ptwDetails(W, [["Equipment / system", "المعدة / النظام"], ["Isolation certificate No. (if any)", "رقم شهادة العزل (إن وجدت)"]]),
  ...ptwAttachments(W, [["JSA / Risk assessment", "تحليل سلامة المهام / تقييم المخاطر"], ["Energy isolation certificate", "شهادة عزل الطاقة"], ["Gas test record", "سجل فحص الغازات"], ["Safety data sheets (SDS)", "صحائف بيانات السلامة"], ["Method statement", "طريقة التنفيذ"], ["Other", "أخرى"]]),
  ...sectionBar(W, 2, "Precautions checklist", "قائمة الاحتياطات"),
  checklist(W, [
    ["Work area inspected; hazards and controls covered in the JSA", "فحص منطقة العمل؛ المخاطر وإجراءات التحكم مذكورة في تحليل سلامة المهام"],
    ["Equipment isolated, drained and depressurized where required", "عزل المعدة وتصريفها وتفريغ الضغط عند الحاجة"],
    ["Gas test done where flammable or toxic gases may be present", "إجراء فحص الغاز حيث يُحتمل وجود غازات قابلة للاشتعال أو سامة"],
    ["Non-sparking tools used in hazardous areas", "استخدام أدوات لا تُحدث شررًا في المناطق الخطرة"],
    ["Barricades and warning signs in place", "وضع الحواجز واللافتات التحذيرية"],
    ["Safe access and adequate lighting", "وسيلة وصول آمنة وإضاءة كافية"],
    ["Chemicals: SDS available, correct storage and handling", "الكيماويات: صحائف بيانات السلامة متوفرة، والتخزين والمناولة صحيحان"],
    ["Spill kit and drip trays available", "توفر حقيبة الانسكاب وصواني التجميع"],
    ["Noise and dust controls in place", "تطبيق إجراءات التحكم في الضوضاء والغبار"],
    ["Other work in the same area coordinated (simultaneous operations)", "التنسيق مع الأعمال الأخرى في نفس المنطقة (العمليات المتزامنة)"],
    ["Workers competent and briefed on the JSA", "العمال مؤهلون وتم إطلاعهم على تحليل سلامة المهام"],
    ["Waste disposal and housekeeping arranged", "ترتيب التخلص من المخلفات والنظافة"],
  ]),
  ...sectionBar(W, 3, "Required PPE", "معدات الوقاية المطلوبة"),
  ppe(W, [["Safety helmet", "خوذة"], ["Safety shoes", "حذاء سلامة"], ["Gloves", "قفازات"], ["Safety glasses / goggles", "نظارات سلامة / واقية"], ["Coverall", "أفرول"], ["Hi-vis vest", "سترة عاكسة"], ["Hearing protection", "واقي سمع"], ["Dust mask / respirator", "كمامة غبار / تنفس"], ["Other", "أخرى"]]),
  ...ptwAuth(W),
  ...ptwExtension(W),
  ...ptwClosure(W, [["Work completed", "اكتمل العمل"], ["Area inspected and left clean", "تم فحص المنطقة وتنظيفها"], ["Tools, materials and waste removed", "إزالة الأدوات والمواد والمخلفات"], ["Isolations returned for de-isolation", "إعادة العزل لفكه"], ["Permit returned to issuer", "إعادة التصريح للمُصدر"]]),
]));

// PTW – Lifting
docs.push(build("BE-SAFE_PTW_Lifting.docx", { code: "BS-PTW-08", title: "Lifting Permit", titleAr: "تصريح أعمال الرفع", intro: "For lifting operations with cranes and other lifting equipment. A critical lift needs a detailed lifting plan approved before the permit is issued.", introAr: "لعمليات الرفع بالرافعات ومعدات الرفع الأخرى. الرفع الحرج يحتاج خطة رفع تفصيلية معتمدة قبل إصدار التصريح." }, (W) => [
  ...ptwDetails(W, [["Crane / equipment type & ID", "نوع ورقم الرافعة / المعدة"], ["Crane certificate No. & expiry", "رقم شهادة الرافعة وانتهاؤها"], ["Operator & licence No.", "المشغّل ورقم الرخصة"], ["Rigger / signalman", "المُربّط / المُؤشّر"]]),
  ...sectionBar(W, null, "Lift category", "تصنيف الرفع"),
  table([W], [row([cell([...options([["Routine lift", "رفع روتيني"], ["Critical lift", "رفع حرج"]], 2), pEn("Critical lift: e.g. load above 75% of crane capacity, tandem lift, lift over occupied areas or live plant, lifting personnel, or a non-routine load.", { italics: true, color: GREY, size: 15 }), pAr("الرفع الحرج: مثل حمل يزيد عن 75% من سعة الرافعة، الرفع بأكثر من رافعة، الرفع فوق مناطق مأهولة أو منشآت عاملة، رفع الأشخاص، أو حمل غير معتاد.", { italics: true, color: GREY, size: 14 })], W)])]),
  ...sectionBar(W, 2, "Load calculation", "حساب الحمل"),
  (() => {
    const lw = 3800, vw = W - lw;
    return table([lw, vw], [
      ["Load weight (t)", "وزن الحمل (طن)"], ["Rigging weight: slings, shackles, spreader (t)", "وزن أدوات الربط: أحزمة، شناكل، عارضة (طن)"], ["Hook block weight (t)", "وزن بكرة الخطاف (طن)"], ["Total load (t)", "إجمالي الحمل (طن)"],
      ["Maximum working radius (m)", "أقصى نصف قطر للعمل (م)"], ["Crane capacity at that radius (t)", "سعة الرافعة عند هذا النصف قطر (طن)"], ["Utilization = total load ÷ capacity × 100 (%)", "نسبة الاستخدام = إجمالي الحمل ÷ السعة × 100 (%)"],
    ].map(r => row([cell(bi(r[0], r[1], { bold: true, size: 16 }), lw, { fill: LIGHT }), cell(empty(), vw)], { height: 440 })));
  })(),
  ...note("Use the manufacturer's load chart for the actual crane configuration (boom length, counterweight, outriggers).", "استخدم جدول الأحمال من الشركة المصنعة حسب إعداد الرافعة الفعلي (طول الذراع، الثقل الموازن، المثبتات)."),
  ...sectionBar(W, 3, "Precautions checklist", "قائمة الاحتياطات"),
  checklist(W, [
    ["Lifting plan approved (critical lift plan for critical lifts)", "خطة الرفع معتمدة (خطة رفع حرج للرفعات الحرجة)"],
    ["Crane third-party certificate valid; daily pre-use inspection done", "شهادة الطرف الثالث للرافعة سارية؛ الفحص اليومي قبل الاستخدام منجز"],
    ["Operator certified and competent for this crane", "المشغّل معتمد ومؤهل لهذه الرافعة"],
    ["Rigger and signalman certified and identified; signals or radio channel agreed", "المُربّط والمُؤشّر معتمدان ومعروفان؛ الاتفاق على الإشارات أو قناة اللاسلكي"],
    ["Rigging gear inspected, colour-coded and rated for the load", "أدوات الربط مفحوصة وملونة ومناسبة للحمل"],
    ["Ground assessed; outriggers fully extended on mats", "تقييم الأرض؛ المثبتات ممدودة بالكامل على قواعد"],
    ["Load moment indicator and limit switches working", "مؤشر عزم الحمل ومفاتيح الحدود تعمل"],
    ["Exclusion zone barricaded; nobody under the load", "تطويق منطقة الرفع؛ لا أحد تحت الحمل"],
    ["Tag lines used to control the load", "استخدام حبال التوجيه للتحكم في الحمل"],
    ["Wind speed and weather within the manufacturer's limits", "سرعة الرياح والطقس ضمن حدود الشركة المصنعة"],
    ["Safe clearance from power lines and structures", "مسافة آمنة من خطوط الكهرباء والمنشآت"],
    ["Load secured, centre of gravity known, no loose items on the load", "الحمل مثبت، ومركز الثقل معروف، ولا أشياء سائبة عليه"],
  ]),
  ...sectionBar(W, 4, "Required PPE", "معدات الوقاية المطلوبة"),
  ppe(W, [["Safety helmet", "خوذة"], ["Safety shoes", "حذاء سلامة"], ["Hi-vis vest", "سترة عاكسة"], ["Rigging gloves", "قفازات الربط"], ["Safety glasses", "نظارات سلامة"], ["Radio", "جهاز لاسلكي"]]),
  ...ptwAuth(W),
  ...ptwClosure(W, [["Lift completed", "اكتمل الرفع"], ["Load landed and secured", "إنزال الحمل وتثبيته"], ["Rigging gear removed and stored", "فك أدوات الربط وتخزينها"], ["Crane parked safely", "ركن الرافعة بأمان"], ["Barricades removed", "إزالة الحواجز"], ["Permit returned to issuer", "إعادة التصريح للمُصدر"]]),
]));

// PTW – Excavation
docs.push(build("BE-SAFE_PTW_Excavation.docx", { code: "BS-PTW-05", title: "Excavation Permit", titleAr: "تصريح أعمال الحفر", intro: "For any excavation, trenching or ground breaking, by hand or machine.", introAr: "لأي أعمال حفر أو خنادق أو تكسير للأرض، يدويًا أو بالمعدات." }, (W) => [
  ...ptwDetails(W, [["Depth (m)", "العمق (م)"], ["Length × width (m)", "الطول × العرض (م)"], ["Soil type", "نوع التربة"], ["Method (hand / machine)", "الطريقة (يدوي / آلي)"]]),
  ...ptwAttachments(W, [["Utility drawings", "مخططات المرافق"], ["Utility scan / survey", "مسح المرافق"], ["Shoring design", "تصميم الدعامات"], ["JSA / Risk assessment", "تحليل سلامة المهام / تقييم المخاطر"], ["Confined space permit", "تصريح مكان مغلق"], ["Other", "أخرى"]]),
  ...sectionBar(W, 2, "Precautions checklist", "قائمة الاحتياطات"),
  checklist(W, [
    ["Underground utilities identified from drawings and a cable / pipe detector survey", "تحديد المرافق تحت الأرض من المخططات ومسح بجهاز كشف الكابلات والأنابيب"],
    ["Utility owners consulted; services isolated where required", "التنسيق مع ملاك المرافق؛ عزل الخدمات عند الحاجة"],
    ["Hand digging or vacuum excavation near known utilities", "الحفر اليدوي أو بالشفط قرب المرافق المعروفة"],
    ["Protective system for deep excavations: sloping, benching, shoring or trench box", "نظام حماية للحفر العميقة: ميول، مدرجات، دعامات أو صندوق خندق"],
    ["Spoil and materials kept at least 1 m from the edge", "إبعاد ناتج الحفر والمواد مسافة 1 م على الأقل عن الحافة"],
    ["Safe access and egress (ladder within easy reach of workers)", "وسيلة دخول وخروج آمنة (سلم قريب من العمال)"],
    ["Hard barricades, signs and night lights around the excavation", "حواجز صلبة ولافتات وإضاءة ليلية حول الحفرة"],
    ["Plant and vehicles kept away from the edge; stop blocks used", "إبعاد المعدات والمركبات عن الحافة؛ استخدام مصدات"],
    ["Daily inspection by a competent person, and after rain", "فحص يومي بواسطة شخص مؤهل وبعد الأمطار"],
    ["Water controlled / dewatering in place", "التحكم في المياه / نزحها"],
    ["Stability of adjacent structures checked", "التحقق من ثبات المنشآت المجاورة"],
    ["Gas test done where gases may accumulate (treat as confined space)", "فحص الغاز حيث يمكن تجمّع الغازات (يُعامل كمكان مغلق)"],
  ]),
  ...sectionBar(W, 3, "Required PPE", "معدات الوقاية المطلوبة"),
  ppe(W, [["Safety helmet", "خوذة"], ["Safety shoes", "حذاء سلامة"], ["Hi-vis vest", "سترة عاكسة"], ["Gloves", "قفازات"], ["Safety glasses", "نظارات سلامة"], ["Other", "أخرى"]]),
  ...ptwAuth(W),
  ...ptwExtension(W),
  ...ptwClosure(W, [["Work completed", "اكتمل العمل"], ["Excavation backfilled or fully protected", "ردم الحفرة أو حمايتها بالكامل"], ["Utilities marked / reinstated", "تعليم المرافق / إعادتها"], ["Area cleaned and barricades adjusted", "تنظيف المنطقة وتعديل الحواجز"], ["Permit returned to issuer", "إعادة التصريح للمُصدر"]]),
]));

// JSA (landscape)
docs.push(build("BE-SAFE_JSA-Form.docx", { code: "BS-RA-01", title: "Job Safety Analysis (JSA)", titleAr: "تحليل سلامة المهام (JSA)", intro: "Break the task into steps, list the hazards of each step and the controls. Risk = Likelihood (1–5) × Severity (1–5). The orange row is an example.", introAr: "قسّم المهمة إلى خطوات، واذكر مخاطر كل خطوة وإجراءات التحكم. الخطر = الاحتمالية (1–5) × الشدة (1–5). الصف البرتقالي مثال." }, (W) => [
  ...sectionBar(W, 1, "Task details", "بيانات المهمة"),
  fields(W, [["JSA No.", "رقم التحليل"], ["Date", "التاريخ"], ["Project / Site", "المشروع / الموقع"], ["Location", "الموقع بالتحديد"], ["Task / activity", "المهمة / النشاط", true], ["Prepared by", "إعداد"], ["Reviewed by (HSE)", "مراجعة (السلامة)"]], { labelW: 2600 }),
  ...sectionBar(W, 2, "Job steps, hazards and controls", "خطوات العمل والمخاطر وإجراءات التحكم"),
  grid([["#", "م", 600], ["Job step", "خطوة العمل", 2700], ["Hazards", "المخاطر", 2900], ["Risk (L×S)", "الخطر", 1200], ["Control measures", "إجراءات التحكم", W - 600 - 2700 - 2900 - 1200 - 1200 - 2100], ["Residual (L×S)", "المتبقي", 1200], ["Responsible", "المسؤول", 2100]], 8, {
    numbered: true, height: 620,
    example: ["e.g.", "Lift pipe spool with mobile crane", "Load falling; crane overturning; worker struck by load", "4×4 = 16", "Approved lifting plan; certified crane and rigging; competent rigger and signalman; exclusion zone; outrigger mats; tag lines", "2×4 = 8", "Lifting supervisor"],
  }),
  ...note("Risk levels: 1–4 Low · 5–9 Medium · 10–16 High · 20–25 Extreme. Do not start work with a High or Extreme residual risk.", "مستويات الخطر: 1–4 منخفض · 5–9 متوسط · 10–16 مرتفع · 20–25 شديد جدًا. لا تبدأ العمل إذا كان الخطر المتبقي مرتفعًا أو شديدًا جدًا."),
  ...sectionBar(W, 3, "Required PPE & permits", "معدات الوقاية والتصاريح المطلوبة"),
  table([W], [row([cell(options([["Helmet", "خوذة"], ["Safety shoes", "حذاء سلامة"], ["Gloves", "قفازات"], ["Glasses", "نظارات"], ["Harness", "حزام أمان"], ["Respirator", "كمامة"], ["Hot work permit", "تصريح أعمال ساخنة"], ["Confined space permit", "تصريح مكان مغلق"], ["Work at height permit", "تصريح عمل على ارتفاع"], ["Electrical isolation", "عزل كهربائي"], ["Excavation permit", "تصريح حفر"], ["Lifting plan", "خطة رفع"]], 6), W)])]),
  ...sectionBar(W, 4, "Team briefing", "إحاطة فريق العمل"),
  pEn("I have been briefed on this JSA and understand the hazards and controls.", { italics: true, color: GREY, size: 15 }),
  pAr("تم إطلاعي على هذا التحليل وأفهم المخاطر وإجراءات التحكم.", { italics: true, color: GREY, size: 14, after: 60 }),
  grid([["Name", "الاسم", 3200], ["Job title", "المهنة", 2400], ["Signature", "التوقيع", 1968], ["Name", "الاسم", 3200], ["Job title", "المهنة", 2400], ["Signature", "التوقيع", W - 3200 - 2400 - 1968 - 3200 - 2400]], 5, { height: 420 }),
  ...sectionBar(W, 5, "Approval", "الاعتماد"),
  signoff(W, [["Supervisor", "المشرف"], ["HSE", "السلامة"], ["Site / project manager", "مدير الموقع / المشروع"]]),
], { landscape: true }));

// Hierarchy of controls guide
docs.push(build("BE-SAFE_Hierarchy-of-Controls-Guide.docx", { code: "BS-RA-03", title: "Hierarchy of Controls – Quick Guide", titleAr: "تسلسل إجراءات التحكم – دليل سريع", intro: "Use this order when choosing controls in a JSA or risk assessment. Start at the top: the higher the control, the more reliable it is.", introAr: "اتبع هذا الترتيب عند اختيار إجراءات التحكم في تحليل سلامة المهام أو تقييم المخاطر. ابدأ من الأعلى: كلما كان الإجراء أعلى كان أكثر فاعلية." }, (W) => {
  const w = [600, 2300, W - 600 - 2300 - 3400 - 1500, 3400, 1500];
  const lv = [
    ["1", "Elimination", "الإزالة", "Remove the hazard completely.", "إزالة الخطر بالكامل.", "Prefabricate at ground level instead of working at height; design out manual lifting.", "التصنيع المسبق على الأرض بدل العمل على ارتفاع؛ إلغاء الرفع اليدوي من التصميم.", "Most effective", "الأكثر فاعلية", "2E7D32"],
    ["2", "Substitution", "الاستبدال", "Replace with something less hazardous.", "الاستبدال بما هو أقل خطورة.", "Water-based paint instead of solvent-based; smaller, lighter blocks; cold cutting instead of hot work.", "دهان مائي بدل المذيبات؛ بلوكات أصغر وأخف؛ قطع بارد بدل العمل الساخن.", "", "", "7CB342"],
    ["3", "Engineering controls", "الضوابط الهندسية", "Isolate people from the hazard.", "عزل الأشخاص عن الخطر.", "Guardrails, machine guards, local exhaust ventilation, interlocks, shoring and trench boxes.", "الدرابزين، حواجز الآلات، الشفط الموضعي، أقفال التعشيق، الدعامات وصناديق الخنادق.", "", "", "FBC02D"],
    ["4", "Administrative controls", "الضوابط الإدارية", "Change the way people work.", "تغيير طريقة العمل.", "Permits to work, procedures, training, signs, job rotation, supervision, exclusion zones.", "تصاريح العمل، الإجراءات، التدريب، اللافتات، تدوير العمل، الإشراف، المناطق المحظورة.", "", "", "FB8C00"],
    ["5", "PPE", "معدات الوقاية الشخصية", "Protect the worker with personal equipment.", "حماية العامل بمعدات شخصية.", "Helmets, harnesses, gloves, respirators, hearing protection.", "الخوذ، أحزمة الأمان، القفازات، الكمامات، واقيات السمع.", "Least effective", "الأقل فاعلية", "E53935"],
  ];
  const head = row([["#", "م"], ["Control level", "مستوى التحكم"], ["What it means", "المعنى"], ["Construction examples", "أمثلة من الإنشاءات"], ["Effectiveness", "الفاعلية"]].map((h, i) => cell(bi(h[0], h[1], { bold: true, color: "FFFFFF", arColor: "DDE4EE", size: 16 }), w[i], { fill: NAVY })), { header: true });
  const rows = lv.map(l => row([
    cell(pEn(l[0], { bold: true, color: "FFFFFF", size: 22, align: AlignmentType.CENTER }), w[0], { fill: l[9] }),
    cell(bi(l[1], l[2], { bold: true, size: 18 }), w[1], { fill: LIGHT }),
    cell(bi(l[3], l[4], { size: 17 }), w[2]),
    cell(bi(l[5], l[6], { size: 16 }), w[3]),
    cell(l[7] ? bi(l[7], l[8], { bold: true, size: 16 }) : empty(), w[4]),
  ], { height: 900 }));
  const tips = [
    ["Always ask first: can we eliminate or substitute? Only then move down the list.", "اسأل دائمًا أولًا: هل يمكن الإزالة أو الاستبدال؟ ثم انتقل إلى المستوى التالي."],
    ["Combine controls. High risks usually need engineering + administrative + PPE together.", "اجمع بين الإجراءات. المخاطر المرتفعة تحتاج عادةً ضوابط هندسية وإدارية ومعدات وقاية معًا."],
    ["PPE is the last line of defence, never the only control for a high risk.", "معدات الوقاية هي خط الدفاع الأخير، ولا تكون الإجراء الوحيد لخطر مرتفع."],
    ["Re-score the risk after controls. If it is still High or Extreme, do not start work.", "أعد تقييم الخطر بعد الإجراءات. إذا ظل مرتفعًا أو شديدًا جدًا فلا تبدأ العمل."],
    ["Check that controls work on site, not only on paper.", "تأكد أن الإجراءات مطبّقة فعليًا في الموقع، وليس على الورق فقط."],
  ];
  return [
    spacer(80), table(w, [head, ...rows]),
    ...sectionBar(W, null, "Tips for using the hierarchy", "نصائح لاستخدام التسلسل"),
    table([600, W - 600], tips.map((t, i) => row([cell(pEn(String(i + 1), { bold: true, color: ORANGE, align: AlignmentType.CENTER, size: 20 }), 600), cell(bi(t[0], t[1], { size: 17 }), W - 600)], { height: 520 }))),
  ];
}));

// Incident report
docs.push(build("BE-SAFE_Incident-Report.docx", { code: "BS-IR-01", title: "Incident Report", titleAr: "تقرير حادث", intro: "Complete within 24 hours of the incident. Attach photos, statements and the root cause analysis.", introAr: "يُستكمل خلال 24 ساعة من وقوع الحادث. أرفق الصور والإفادات وتحليل السبب الجذري." }, (W) => [
  ...sectionBar(W, 1, "Incident details", "بيانات الحادث"),
  fields(W, [["Report No.", "رقم التقرير"], ["Date of incident", "تاريخ الحادث"], ["Time", "الوقت"], ["Date reported", "تاريخ الإبلاغ"], ["Project / Site", "المشروع / الموقع"], ["Exact location", "المكان بالتحديد"], ["Reported by", "المُبلّغ"], ["Company / contractor", "الشركة / المقاول"], ["Activity at the time", "النشاط وقت الحادث", true]]),
  ...sectionBar(W, 2, "Incident classification", "تصنيف الحادث"),
  table([W], [row([cell(options([["Near miss", "حادث وشيك"], ["First aid case (FAC)", "إسعافات أولية"], ["Medical treatment (MTC)", "علاج طبي"], ["Restricted work (RWC)", "عمل مقيّد"], ["Lost time injury (LTI)", "إصابة مضيعة للوقت"], ["Fatality", "وفاة"], ["Property / equipment damage", "تلف ممتلكات / معدات"], ["Fire", "حريق"], ["Environmental / spill", "بيئي / انسكاب"], ["Vehicle incident", "حادث مركبة"], ["Dangerous occurrence", "حدث خطير"], ["Other", "أخرى"]], 3), W)])]),
  ...sectionBar(W, 3, "Injured person(s)", "المصاب / المصابون"),
  grid([["Name", "الاسم", 2000], ["ID / Iqama No.", "رقم الهوية / الإقامة", 1600], ["Job title", "المهنة", 1500], ["Company", "الشركة", 1500], ["Injury & body part", "الإصابة وموضعها", 2000], ["Treatment", "العلاج", W - 8600]], 3, { height: 440 }),
  ...sectionBar(W, 4, "What happened", "وصف ما حدث"),
  textBox(W, "Describe the sequence of events: what was being done, what went wrong, and the result. Stick to facts.", "صف تسلسل الأحداث: ما العمل الذي كان يُنفّذ، وما الذي حدث خطأ، وما النتيجة. التزم بالحقائق.", 2400),
  ...sectionBar(W, 5, "Immediate actions taken", "الإجراءات الفورية المتخذة"),
  textBox(W, "e.g. first aid given, area made safe, work stopped, equipment isolated, management informed.", "مثل: تقديم الإسعافات، تأمين المنطقة، إيقاف العمل، عزل المعدات، إبلاغ الإدارة.", 1200),
  ...sectionBar(W, 6, "Witnesses", "الشهود"),
  grid([["Name", "الاسم", 3600], ["Company", "الشركة", 3000], ["Contact", "رقم التواصل", W - 6600]], 3, { height: 420 }),
  ...sectionBar(W, 7, "Causes", "الأسباب"),
  fields(W, [["Immediate causes (unsafe acts / conditions)", "الأسباب المباشرة (تصرفات / ظروف غير آمنة)", true, empty(), 900], ["Root causes (use the 5 Whys form)", "الأسباب الجذرية (استخدم نموذج 5 لماذا)", true, empty(), 900]], { labelW: 2600 }),
  ...sectionBar(W, 8, "Corrective and preventive actions", "الإجراءات التصحيحية والوقائية"),
  grid([["#", "م", 500], ["Action", "الإجراء", W - 500 - 2200 - 1600 - 1400], ["Responsible", "المسؤول", 2200], ["Target date", "التاريخ المستهدف", 1600], ["Status", "الحالة", 1400]], 4, { numbered: true, height: 460 }),
  ...sectionBar(W, 9, "Attachments", "المرفقات"),
  table([W], [row([cell(options([["Photos", "صور"], ["Witness statements", "إفادات الشهود"], ["Sketch / drawing", "رسم توضيحي"], ["Medical report", "تقرير طبي"], ["5 Whys analysis", "تحليل 5 لماذا"], ["Other", "أخرى"]], 3), W)])]),
  ...sectionBar(W, 10, "Review and sign-off", "المراجعة والتوقيع"),
  signoff(W, [["Supervisor", "المشرف"], ["HSE", "السلامة"], ["Site / project manager", "مدير الموقع / المشروع"]]),
]));

// Near miss
docs.push(build("BE-SAFE_Near-Miss-Report.docx", { code: "BS-IR-02", title: "Near Miss Report", titleAr: "تقرير حادث وشيك", intro: "A near miss is an event that could have caused injury or damage but did not. Reporting it helps prevent the next incident.", introAr: "الحادث الوشيك هو حدث كان يمكن أن يسبب إصابة أو ضررًا لكنه لم يحدث. الإبلاغ عنه يساعد على منع الحادث التالي." }, (W) => [
  ...sectionBar(W, 1, "Details", "البيانات"),
  fields(W, [["Date", "التاريخ"], ["Time", "الوقت"], ["Project / Site", "المشروع / الموقع"], ["Exact location", "المكان بالتحديد"], ["Reported by (optional)", "المُبلّغ (اختياري)"], ["Company", "الشركة"]]),
  ...sectionBar(W, 2, "Category", "التصنيف"),
  table([W], [row([cell(options([["Unsafe act", "تصرف غير آمن"], ["Unsafe condition", "ظرف غير آمن"], ["Equipment / tool", "معدة / أداة"], ["Falling object", "سقوط جسم"], ["Vehicle / plant", "مركبة / معدة ثقيلة"], ["Other", "أخرى"]], 3), W)])]),
  ...sectionBar(W, 3, "What happened", "ماذا حدث"),
  textBox(W, "Describe what happened.", "صف ما حدث.", 1500),
  ...sectionBar(W, 4, "What could have happened", "ماذا كان يمكن أن يحدث"),
  textBox(W, "Describe the worst realistic outcome.", "صف أسوأ نتيجة واقعية محتملة.", 1000),
  table([W], [row([cell(options([["Potential severity: Minor", "الشدة المحتملة: بسيطة"], ["Serious", "خطيرة"], ["Major / fatal", "كبيرة / مميتة"]], 3), W)])]),
  ...sectionBar(W, 5, "Immediate action and suggestion", "الإجراء الفوري والاقتراح"),
  fields(W, [["Immediate action taken", "الإجراء الفوري المتخذ", true, empty(), 900], ["Suggestion to prevent it", "اقتراح لمنع تكراره", true, empty(), 900]], { labelW: 2600 }),
  ...sectionBar(W, 6, "HSE follow-up", "متابعة السلامة"),
  fields(W, [["Action agreed", "الإجراء المتفق عليه", true, empty(), 800], ["Responsible", "المسؤول"], ["Target date", "التاريخ المستهدف"], ["Closed (date)", "أُغلق (التاريخ)"], ["Reviewed by", "راجعه"]], { labelW: 2600 }),
]));

// 5 Whys
docs.push(build("BE-SAFE_Root-Cause-5-Whys.docx", { code: "BS-IR-03", title: "Root Cause Analysis – 5 Whys", titleAr: "تحليل السبب الجذري – 5 لماذا", intro: "Ask \"why?\" repeatedly until you reach a cause the organization can control. Focus on systems, not blame, and support each answer with facts.", introAr: "اسأل \"لماذا؟\" بشكل متكرر حتى تصل إلى سبب يمكن للمؤسسة التحكم فيه. ركّز على الأنظمة لا على اللوم، وادعم كل إجابة بالحقائق." }, (W) => [
  ...sectionBar(W, 1, "Details", "البيانات"),
  fields(W, [["Incident / report No.", "رقم الحادث / التقرير"], ["Date", "التاريخ"], ["Investigation team", "فريق التحقيق", true]]),
  ...sectionBar(W, 2, "Problem statement", "وصف المشكلة"),
  textBox(W, "What happened, where, when and what was the impact? One or two clear sentences.", "ماذا حدث وأين ومتى وما الأثر؟ جملة أو جملتان واضحتان.", 1000),
  ...sectionBar(W, 3, "The 5 Whys", "الأسئلة الخمسة"),
  (() => {
    const w = [1300, W - 1300 - 2600, 2600];
    const head = row([["Why?", "لماذا؟"], ["Answer (cause)", "الإجابة (السبب)"], ["Evidence / fact", "الدليل / الحقيقة"]].map((h, i) => cell(bi(h[0], h[1], { bold: true, color: "FFFFFF", arColor: "DDE4EE", size: 16 }), w[i], { fill: NAVY })), { header: true });
    const ex = row([cell(pEn("Example", { italics: true, color: GREY, size: 15 }), w[0], { fill: "FFF8F2" }), cell(pEn("Worker fell from ladder → ladder slipped → not tied or footed → no one checked the set-up → ladder use not covered in the permit / supervision checks.", { italics: true, color: GREY, size: 15 }), w[1], { fill: "FFF8F2" }), cell(pEn("Site photos, witness statements, permit records", { italics: true, color: GREY, size: 15 }), w[2], { fill: "FFF8F2" })]);
    return table(w, [head, ex, ...[1, 2, 3, 4, 5].map(n => row([cell(bi(`Why ${n}`, `لماذا ${n}`, { bold: true }), w[0], { fill: LIGHT }), cell(empty(), w[1]), cell(empty(), w[2])], { height: 700 }))]);
  })(),
  ...sectionBar(W, 4, "Root cause", "السبب الجذري"),
  textBox(W, "State the root cause(s) the organization can control.", "اذكر السبب أو الأسباب الجذرية التي يمكن للمؤسسة التحكم فيها.", 900),
  table([W], [row([cell(options([["People / training", "الأفراد / التدريب"], ["Procedure / permit", "الإجراءات / التصاريح"], ["Equipment / tools", "المعدات / الأدوات"], ["Work environment", "بيئة العمل"], ["Supervision / management", "الإشراف / الإدارة"], ["Design", "التصميم"]], 3), W)])]),
  ...sectionBar(W, 5, "Corrective and preventive actions", "الإجراءات التصحيحية والوقائية"),
  grid([["#", "م", 500], ["Action (addresses the root cause)", "الإجراء (يعالج السبب الجذري)", W - 500 - 2200 - 1600 - 1400], ["Responsible", "المسؤول", 2200], ["Target date", "التاريخ المستهدف", 1600], ["Status", "الحالة", 1400]], 4, { numbered: true, height: 460 }),
  ...sectionBar(W, 6, "Approval", "الاعتماد"),
  signoff(W, [["Investigation lead", "قائد التحقيق"], ["HSE manager", "مدير السلامة"]]),
]));

Promise.all(docs).then(() => console.log("done"));
}
