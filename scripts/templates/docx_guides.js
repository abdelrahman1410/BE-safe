// Generates the BE SAFE toolbox talks and HSE plan templates (bilingual EN/AR).
// Usage (from the repo root): node scripts/templates/docx_guides.js .
const {
  pEn, pAr, bi, empty, spacer, cell, table, row, sectionBar, fields, options, grid, textBox, signoff, note, build,
  NAVY, ORANGE, LIGHT, GREY, AlignmentType, VerticalAlign,
} = require("./docx_templates.js");

// Numbered bilingual points: [[en, ar], ...]
function points(W, items, color = ORANGE) {
  return table([600, W - 600], items.map((t, i) => row([
    cell(pEn(String(i + 1), { bold: true, color, align: AlignmentType.CENTER, size: 20 }), 600),
    cell(bi(t[0], t[1], { size: 17 }), W - 600),
  ], { height: 460 })));
}

// Two-column bilingual table: [[left en, left ar, right en, right ar], ...] with headers
function twoCol(W, headers, rows, leftW) {
  const w = [leftW, W - leftW];
  const head = row(headers.map((h, i) => cell(bi(h[0], h[1], { bold: true, color: "FFFFFF", arColor: "DDE4EE", size: 16 }), w[i], { fill: NAVY })), { header: true });
  return table(w, [head, ...rows.map(r => row([
    cell(bi(r[0], r[1], { bold: true, size: 17 }), w[0], { fill: LIGHT }),
    cell(bi(r[2], r[3], { size: 16 }), w[1]),
  ], { height: 520 }))]);
}

// Table with a navy header row and pre-filled label rows: cols [[en, ar, width]], data [[labelEn, labelAr, cell2En?, cell2Ar?, ...]]
function labeledTable(cols, data) {
  const w = cols.map(c => c[2]);
  const head = row(cols.map(c => cell(bi(c[0], c[1], { bold: true, color: "FFFFFF", arColor: "DDE4EE", size: 16 }), c[2], { fill: NAVY })), { header: true });
  return table(w, [head, ...data.map(d => row(w.map((wd, i) => {
    if (i === 0) return cell(bi(d[0], d[1], { bold: true, size: 16 }), wd, { fill: LIGHT });
    const en = d[i * 2], ar = d[i * 2 + 1];
    return cell(en ? bi(en, ar, { size: 16 }) : empty(), wd);
  }), { height: 460 }))]);
}

// Key message banner
function keyMessage(W, en, ar) {
  return table([W], [row([cell([pEn(en, { bold: true, size: 20, color: NAVY }), pAr(ar, { bold: true, size: 19, color: ORANGE })], W, { fill: "FFF1E8" })], { height: 600 })]);
}

// Section with guidance text and a writing box
function planSection(W, n, en, ar, guideEn, guideAr, height = 1300) {
  return [...sectionBar(W, n, en, ar), textBox(W, guideEn, guideAr, height)];
}

const docControl = (W, extra = []) => [
  ...sectionBar(W, null, "Document control", "ضبط المستند"),
  fields(W, [["Project", "المشروع"], ["Client", "العميل"], ["Consultant", "الاستشاري"], ["Contractor", "المقاول"], ["Document No.", "رقم المستند"], ["Revision / date", "المراجعة / التاريخ"], ...extra]),
];
const approval = (W, roles) => [...sectionBar(W, null, "Review and approval", "المراجعة والاعتماد"), signoff(W, roles)];

// ---------------------------------------------------------------- toolbox talks
function toolboxTalk(file, code, title, titleAr, key, hazardsTitle, hazards, rules, extraTitle, extra, questions) {
  return build(file, { code, title: `Toolbox Talk: ${title}`, titleAr: `محاضرة توعية: ${titleAr}`, intro: "A 10-minute talk for the start of the shift. Read the points out, discuss the questions, and have everyone sign the attendance sheet.", introAr: "محاضرة مدتها 10 دقائق لبداية الوردية. اقرأ النقاط، وناقش الأسئلة، واطلب من الجميع التوقيع في كشف الحضور." }, (W) => [
    ...sectionBar(W, null, "Talk details", "بيانات المحاضرة"),
    fields(W, [["Date", "التاريخ"], ["Time", "الوقت"], ["Location / area", "الموقع / المنطقة"], ["Presenter", "المحاضر"]]),
    spacer(100),
    keyMessage(W, key[0], key[1]),
    ...sectionBar(W, 1, hazardsTitle[0], hazardsTitle[1]),
    points(W, hazards, "E53935"),
    ...sectionBar(W, 2, "Key safety rules", "قواعد السلامة الأساسية"),
    points(W, rules),
    ...(extra ? [...sectionBar(W, 3, extraTitle[0], extraTitle[1]), points(W, extra, NAVY)] : []),
    ...sectionBar(W, extra ? 4 : 3, "Discussion questions", "أسئلة للنقاش"),
    points(W, questions, NAVY),
    ...sectionBar(W, null, "Attendance", "كشف الحضور"),
    grid([["#", "م", 500], ["Name", "الاسم", 3300], ["ID / Iqama No.", "رقم الهوية / الإقامة", 2200], ["Company / trade", "الشركة / المهنة", 2400], ["Signature", "التوقيع", W - 8400]], 15, { numbered: true, height: 380 }),
  ]);
}

module.exports = { toolboxTalk, points };

const files = [];
if (require.main === module) {

files.push(toolboxTalk("BE-SAFE_TBT_Heat-Stress.docx", "BS-TBT-01", "Heat Stress", "الإجهاد الحراري",
  ["Heat illness can kill, and it is preventable: water, rest and shade.", "الإجهاد الحراري قد يقتل، ويمكن الوقاية منه: الماء والراحة والظل."],
  ["Warning signs", "العلامات التحذيرية"],
  [
    ["Heat cramps: painful muscle cramps, heavy sweating.", "تقلصات حرارية: تشنجات عضلية مؤلمة وتعرّق شديد."],
    ["Heat exhaustion: weakness, dizziness, headache, nausea, cold clammy skin.", "الإنهاك الحراري: ضعف، دوار، صداع، غثيان، جلد بارد ورطب."],
    ["Heat stroke (emergency): confusion, slurred speech, collapse, seizures, very hot skin.", "ضربة الشمس (طوارئ): ارتباك، تلعثم في الكلام، إغماء، تشنجات، جلد شديد الحرارة."],
  ],
  [
    ["Drink water often, about one cup every 15–20 minutes, even if you are not thirsty.", "اشرب الماء باستمرار، حوالي كوب كل 15–20 دقيقة، حتى لو لم تشعر بالعطش."],
    ["Avoid energy drinks and sugary soft drinks; they increase dehydration.", "تجنب مشروبات الطاقة والمشروبات الغازية السكرية؛ فهي تزيد الجفاف."],
    ["Take rest breaks in shade or a cooled rest area.", "خذ فترات راحة في الظل أو في استراحة مكيّفة."],
    ["Follow the midday outdoor work ban in direct sun (12:00–15:00, 15 June – 15 September) and the site work-rest schedule.", "التزم بحظر العمل تحت الشمس وقت الظهيرة (12:00–15:00، من 15 يونيو حتى 15 سبتمبر) وبجدول العمل والراحة في الموقع."],
    ["New and returning workers need time to get used to the heat; build up the workload gradually.", "العمال الجدد والعائدون يحتاجون وقتًا للتأقلم مع الحرارة؛ زِد عبء العمل تدريجيًا."],
    ["Use the buddy system: watch each other for warning signs.", "طبّق نظام الزميل: راقبوا بعضكم لاكتشاف العلامات التحذيرية."],
    ["Wear light-coloured, loose clothing and cover your head and neck.", "ارتدِ ملابس فاتحة اللون وفضفاضة وغطِّ رأسك ورقبتك."],
    ["Check your urine: pale yellow is good; dark yellow means drink more.", "راقب لون البول: الأصفر الفاتح جيد، والأصفر الداكن يعني أنك تحتاج إلى المزيد من الماء."],
  ],
  ["First aid: what to do", "الإسعافات الأولية: ماذا تفعل"],
  [
    ["Stop work, move the person to shade or a cool area, and call the first aider.", "أوقف العمل، وانقل الشخص إلى الظل أو مكان بارد، واستدعِ المسعف."],
    ["Loosen clothing; cool the body with water, wet cloths and fanning, and ice packs on the neck, armpits and groin.", "فك الملابس؛ برّد الجسم بالماء والقماش المبلل والتهوية، وضع كمادات ثلج على الرقبة والإبطين وأعلى الفخذين."],
    ["If the person is conscious, give small sips of cool water.", "إذا كان الشخص واعيًا، أعطه رشفات صغيرة من الماء البارد."],
    ["If you suspect heat stroke, call emergency services immediately, keep cooling and never leave the person alone.", "إذا اشتبهت في ضربة شمس، اتصل بالطوارئ فورًا، واستمر في التبريد، ولا تترك الشخص وحده أبدًا."],
  ],
  [
    ["Where are the nearest drinking water point and shaded rest area?", "أين أقرب نقطة مياه شرب وأقرب استراحة مظللة؟"],
    ["What are the signs of heat stroke, and what would you do?", "ما علامات ضربة الشمس، وماذا ستفعل؟"],
    ["Who is your buddy today?", "من زميلك المراقب اليوم؟"],
  ]));

files.push(toolboxTalk("BE-SAFE_TBT_Manual-Handling.docx", "BS-TBT-02", "Manual Handling", "المناولة اليدوية",
  ["Most back injuries come from lifting the wrong way or lifting too much. Think before you lift.", "معظم إصابات الظهر سببها الرفع بطريقة خاطئة أو رفع وزن زائد. فكّر قبل أن ترفع."],
  ["Hazards", "المخاطر"],
  [
    ["Back injuries, strains and hernias.", "إصابات الظهر والشد العضلي والفتق."],
    ["Crushed fingers and feet from dropped loads.", "سحق الأصابع والأقدام بسبب سقوط الأحمال."],
    ["Slips and trips while carrying loads that block your view.", "الانزلاق والتعثر أثناء حمل أحمال تحجب الرؤية."],
  ],
  [
    ["Plan the lift: check the weight, the route and where the load will go.", "خطّط للرفع: تحقق من الوزن والمسار ومكان وضع الحمل."],
    ["Use mechanical aids wherever possible: trolleys, pallet trucks, hoists, forklifts.", "استخدم الوسائل الميكانيكية كلما أمكن: العربات، رافعات المنصات، الروافع، الرافعات الشوكية."],
    ["Get help for heavy or awkward loads. As a general guide, ask for help above 25 kg.", "اطلب المساعدة للأحمال الثقيلة أو غير المتوازنة. كقاعدة عامة، اطلب المساعدة لما يزيد عن 25 كجم."],
    ["Feet apart, bend your knees, keep your back straight, and lift with your legs.", "باعد بين قدميك، اثنِ ركبتيك، حافظ على استقامة ظهرك، وارفع بقوة ساقيك."],
    ["Keep the load close to your body and get a firm grip.", "أبقِ الحمل قريبًا من جسمك وأمسكه بإحكام."],
    ["Do not twist your back: turn by moving your feet.", "لا تلوِ ظهرك: استدر بتحريك قدميك."],
    ["Avoid lifting above shoulder height or carrying loads that block your view.", "تجنب الرفع فوق مستوى الكتف أو حمل أحمال تحجب رؤيتك."],
    ["Wear gloves and safety shoes; take breaks during repetitive work; report pain early.", "ارتدِ القفازات وحذاء السلامة؛ خذ فترات راحة في العمل المتكرر؛ أبلغ عن الألم مبكرًا."],
  ],
  null, null,
  [
    ["Which loads in today's work need a mechanical aid or a team lift?", "ما الأحمال في عمل اليوم التي تحتاج إلى وسيلة ميكانيكية أو رفع جماعي؟"],
    ["Show the correct way to lift a box from the floor.", "وضّح الطريقة الصحيحة لرفع صندوق من الأرض."],
    ["What should you do if you feel back pain?", "ماذا تفعل إذا شعرت بألم في الظهر؟"],
  ]));

files.push(toolboxTalk("BE-SAFE_TBT_PPE.docx", "BS-TBT-03", "Personal Protective Equipment (PPE)", "معدات الوقاية الشخصية",
  ["PPE is the last line of defence. Wear the right PPE, the right way, every time.", "معدات الوقاية هي خط الدفاع الأخير. ارتدِ المعدات الصحيحة، بالطريقة الصحيحة، في كل مرة."],
  ["Minimum PPE on site", "الحد الأدنى من معدات الوقاية في الموقع"],
  [
    ["Safety helmet, safety shoes, high-visibility vest, safety glasses and gloves.", "خوذة، حذاء سلامة، سترة عاكسة، نظارات سلامة، قفازات."],
    ["Task-specific PPE: harness, hearing protection, respirator, face shield, welding gear.", "معدات حسب المهمة: حزام أمان، واقي سمع، كمامة، واقي وجه، معدات لحام."],
    ["Check the JSA or permit for the PPE your task needs.", "راجع تحليل سلامة المهام أو التصريح لمعرفة المعدات التي تحتاجها مهمتك."],
  ],
  [
    ["Wear PPE in all designated areas, for the whole task, not only when supervisors are around.", "ارتدِ معدات الوقاية في جميع المناطق المحددة وطوال المهمة، وليس فقط عند وجود المشرف."],
    ["Inspect PPE before use: cracks, cuts, worn straps, damaged lenses, expiry dates.", "افحص المعدات قبل الاستخدام: الشقوق، القطوع، الأحزمة المهترئة، العدسات التالفة، تواريخ الصلاحية."],
    ["Make sure it fits: wrong size means less protection.", "تأكد من المقاس المناسب: المقاس الخاطئ يعني حماية أقل."],
    ["Use the helmet chin strap when working at height.", "استخدم حزام الذقن للخوذة عند العمل على ارتفاع."],
    ["Wear hearing protection in noisy areas and near loud tools.", "ارتدِ واقي السمع في المناطق المرتفعة الضوضاء وقرب الأدوات الصاخبة."],
    ["Use the correct respirator and cartridge for the hazard; a dust mask does not protect against gases.", "استخدم الكمامة والفلتر المناسبين للخطر؛ كمامة الغبار لا تحمي من الغازات."],
    ["Do not modify PPE. Replace damaged PPE immediately; do not repair it yourself.", "لا تعدّل المعدات. استبدل التالف فورًا؛ ولا تصلحه بنفسك."],
    ["Keep PPE clean and store it in a dry place out of direct sun.", "حافظ على نظافة المعدات وخزّنها في مكان جاف بعيدًا عن أشعة الشمس المباشرة."],
  ],
  null, null,
  [
    ["What PPE does your task today require?", "ما معدات الوقاية التي تحتاجها مهمتك اليوم؟"],
    ["Check your helmet and gloves now: are they in good condition?", "افحص خوذتك وقفازاتك الآن: هل هي بحالة جيدة؟"],
    ["Where do you get replacement PPE on this site?", "من أين تحصل على معدات بديلة في هذا الموقع؟"],
  ]));

files.push(toolboxTalk("BE-SAFE_TBT_Housekeeping.docx", "BS-TBT-04", "Housekeeping", "النظافة والترتيب",
  ["A tidy site is a safe site. Most slips, trips and many fires start with poor housekeeping.", "الموقع المرتب موقع آمن. معظم حوادث الانزلاق والتعثر وكثير من الحرائق تبدأ من سوء الترتيب."],
  ["Hazards", "المخاطر"],
  [
    ["Slips, trips and falls over materials, cables and waste.", "الانزلاق والتعثر والسقوط بسبب المواد والكابلات والمخلفات."],
    ["Cuts and puncture wounds from nails and sharp offcuts.", "الجروح والوخز من المسامير وبقايا المواد الحادة."],
    ["Fires from accumulated waste and flammable materials.", "الحرائق بسبب تراكم المخلفات والمواد القابلة للاشتعال."],
    ["Objects falling from height; blocked emergency exits.", "سقوط الأجسام من أعلى؛ وانسداد مخارج الطوارئ."],
  ],
  [
    ["Clean as you go; do not leave it for the end of the shift.", "نظّف أولًا بأول؛ لا تؤجل ذلك لنهاية الوردية."],
    ["Put waste in the designated skips and bins; separate waste types where required.", "ضع المخلفات في الحاويات المخصصة؛ وافصل أنواعها عند الحاجة."],
    ["Remove or bend protruding nails from timber.", "انزع المسامير البارزة من الأخشاب أو اثنِها."],
    ["Keep walkways, stairs, ladders and emergency exits clear at all times.", "أبقِ الممرات والسلالم ومخارج الطوارئ خالية في جميع الأوقات."],
    ["Route cables and hoses overhead or along edges, and cover them where they cross walkways.", "مدّ الكابلات والخراطيم في الأعلى أو على الأطراف، وغطّها حيث تعبر الممرات."],
    ["Stack materials on firm, level ground, not too high and away from edges.", "رصّ المواد على أرض صلبة ومستوية، بارتفاع مناسب وبعيدًا عن الحواف."],
    ["Clean up spills straight away and report oil or chemical spills.", "نظّف الانسكابات فورًا وأبلغ عن انسكابات الزيوت أو الكيماويات."],
    ["Secure loose items at height; nothing should be left on scaffold edges.", "ثبّت الأشياء السائبة في الأعلى؛ لا تترك شيئًا على حواف السقالات."],
  ],
  null, null,
  [
    ["What housekeeping problems can you see in our work area right now?", "ما مشكلات الترتيب التي تراها في منطقة عملنا الآن؟"],
    ["Where are the waste skips for each type of waste?", "أين حاويات المخلفات لكل نوع؟"],
    ["Who is responsible for the end-of-shift clean-up in your team?", "من المسؤول عن التنظيف في نهاية الوردية في فريقك؟"],
  ]));

files.push(toolboxTalk("BE-SAFE_TBT_Working-Near-Moving-Equipment.docx", "BS-TBT-05", "Working Near Moving Equipment", "العمل بالقرب من المعدات المتحركة",
  ["Being struck by or caught between moving equipment is one of the most serious hazards on site. Stay visible, stay clear.", "الاصطدام بالمعدات المتحركة أو الانحشار بينها من أخطر المخاطر في الموقع. كن مرئيًا، وابقَ بعيدًا."],
  ["Hazards", "المخاطر"],
  [
    ["Struck by reversing vehicles and plant.", "الاصطدام بالمركبات والمعدات أثناء الرجوع للخلف."],
    ["Caught or crushed between equipment and a wall, vehicle or load.", "الانحشار أو السحق بين المعدة وجدار أو مركبة أو حمل."],
    ["Operator blind spots and the swing radius of excavators and cranes.", "النقاط العمياء للمشغّل ونطاق دوران الحفارات والرافعات."],
    ["Suspended loads falling or swinging.", "سقوط الأحمال المعلّقة أو تأرجحها."],
  ],
  [
    ["Use the marked pedestrian walkways and crossings only.", "استخدم ممرات ومعابر المشاة المحددة فقط."],
    ["Stay out of the swing radius and blind spots of equipment.", "ابقَ خارج نطاق دوران المعدات ونقاطها العمياء."],
    ["Make eye contact with the operator and get a signal before you approach.", "تواصل بالنظر مع المشغّل وانتظر إشارته قبل الاقتراب."],
    ["Never walk behind a reversing vehicle. Reversing needs a trained banksman.", "لا تمشِ أبدًا خلف مركبة ترجع للخلف. الرجوع يحتاج إلى مؤشّر مدرب."],
    ["Always wear your high-visibility vest.", "ارتدِ السترة العاكسة دائمًا."],
    ["Do not use your phone while walking near plant.", "لا تستخدم الهاتف أثناء المشي قرب المعدات."],
    ["Never ride on equipment unless there is a proper seat.", "لا تركب على المعدات إلا إذا كان هناك مقعد مخصص."],
    ["Never stand or walk under a suspended load.", "لا تقف أو تمشِ تحت حمل معلّق أبدًا."],
  ],
  null, null,
  [
    ["Which equipment will be working near our area today?", "ما المعدات التي ستعمل قرب منطقتنا اليوم؟"],
    ["Where are the pedestrian routes and crossings?", "أين ممرات ومعابر المشاة؟"],
    ["How do you let an operator know you need to pass?", "كيف تُعلم المشغّل بأنك تريد المرور؟"],
  ]));

// ---------------------------------------------------------------- HSE plans
files.push(build("BE-SAFE_Plan_Project-HSE-Plan.docx", { code: "BS-PLN-01", title: "Project HSE Plan", titleAr: "خطة الصحة والسلامة والبيئة للمشروع", intro: "A template for the project HSE plan. Replace the grey guidance in each section with your project details.", introAr: "نموذج لخطة السلامة للمشروع. استبدل الإرشادات الرمادية في كل قسم ببيانات مشروعك." }, (W) => [
  ...docControl(W),
  ...planSection(W, 1, "Purpose and scope", "الغرض والنطاق", "Describe the project, its location, main activities and duration, and who this plan applies to (all employees, subcontractors and visitors).", "صف المشروع وموقعه وأنشطته الرئيسية ومدته، ومن تنطبق عليهم الخطة (جميع الموظفين والمقاولين من الباطن والزوار).", 1100),
  ...planSection(W, 2, "HSE policy and objectives", "سياسة وأهداف السلامة", "Attach the signed HSE policy. Set measurable objectives, e.g. zero lost time injuries, TRIR target, training hours, inspection completion rate, near miss reporting.", "أرفق سياسة السلامة الموقّعة. حدد أهدافًا قابلة للقياس، مثل: صفر إصابات مضيعة للوقت، مستهدف TRIR، ساعات التدريب، نسبة إنجاز التفتيش، الإبلاغ عن الحوادث الوشيكة.", 1100),
  ...sectionBar(W, 3, "Roles and responsibilities", "الأدوار والمسؤوليات"),
  twoCol(W, [["Role", "الدور"], ["Main HSE responsibilities", "مسؤوليات السلامة الرئيسية"]], [
    ["Project manager", "مدير المشروع", "Overall accountability for HSE; provides resources; leads by example.", "المسؤولية الكاملة عن السلامة؛ توفير الموارد؛ القدوة في الالتزام."],
    ["Site / construction manager", "مدير الموقع / الإنشاءات", "Plans work safely; makes sure controls and permits are in place.", "تخطيط العمل بأمان؛ التأكد من تطبيق الإجراءات والتصاريح."],
    ["HSE manager", "مدير السلامة", "Develops and monitors the HSE system; reports performance; advises management.", "إعداد نظام السلامة ومتابعته؛ تقارير الأداء؛ تقديم المشورة للإدارة."],
    ["HSE officers / inspectors", "مسؤولو / مفتشو السلامة", "Daily inspections, permit checks, toolbox talks, incident reporting.", "التفتيش اليومي، مراجعة التصاريح، محاضرات التوعية، الإبلاغ عن الحوادث."],
    ["Supervisors / foremen", "المشرفون / رؤساء العمال", "Brief JSAs; enforce rules; stop unsafe work.", "شرح تحليل سلامة المهام؛ تطبيق القواعد؛ إيقاف العمل غير الآمن."],
    ["Workers", "العمال", "Follow rules, use PPE, report hazards and incidents; right to stop unsafe work.", "اتباع القواعد، استخدام معدات الوقاية، الإبلاغ عن المخاطر والحوادث؛ حق إيقاف العمل غير الآمن."],
    ["Subcontractors", "المقاولون من الباطن", "Comply with this plan; provide competent people and certified equipment.", "الالتزام بهذه الخطة؛ توفير أفراد مؤهلين ومعدات معتمدة."],
  ], 2800),
  ...planSection(W, 4, "Legal and other requirements", "المتطلبات النظامية وغيرها", "List what applies, e.g. Saudi Labour Law and its regulations, MHRSD occupational safety and health requirements, Saudi Building Code (SBC), Civil Defense requirements, client and consultant HSE specifications, ISO 45001:2018.", "اذكر ما ينطبق، مثل: نظام العمل السعودي ولوائحه، اشتراطات السلامة والصحة المهنية لوزارة الموارد البشرية، كود البناء السعودي، اشتراطات الدفاع المدني، مواصفات السلامة للعميل والاستشاري، ISO 45001:2018.", 1100),
  ...planSection(W, 5, "Hazard identification and risk assessment", "تحديد المخاطر وتقييمها", "Explain how hazards are identified (HIRA, JSA), who prepares and approves risk assessments, the risk matrix used, and when they are reviewed.", "وضّح طريقة تحديد المخاطر (HIRA وJSA)، ومن يُعدّ تقييم المخاطر ويعتمده، ومصفوفة المخاطر المستخدمة، ومتى تتم المراجعة.", 1000),
  ...planSection(W, 6, "Permit to work system", "نظام تصاريح العمل", "List the permits used (hot work, confined space, work at height, electrical isolation, excavation, lifting), issuers and receivers, and how permits are controlled.", "اذكر التصاريح المستخدمة (أعمال ساخنة، أماكن مغلقة، عمل على ارتفاع، عزل كهربائي، حفر، رفع)، والمُصدرين والمستلمين، وطريقة ضبط التصاريح.", 1000),
  ...sectionBar(W, 7, "Training and competence", "التدريب والكفاءة"),
  labeledTable([["Training", "التدريب", 3400], ["Who", "الفئة المستهدفة", 2600], ["Frequency", "التكرار", 2000], ["Records kept by", "حفظ السجلات", W - 8000]], [
    ["Site HSE induction", "التعريف بالسلامة في الموقع", "All new workers and visitors", "جميع العمال الجدد والزوار", "Before starting work", "قبل بدء العمل"],
    ["Toolbox talks", "محاضرات التوعية", "All workers", "جميع العمال", "Daily / weekly", "يوميًا / أسبوعيًا"],
    ["Task-specific training", "تدريب حسب المهمة", "Workers in high-risk tasks", "عمال المهام عالية الخطورة", "Before the task", "قبل المهمة"],
    ["Permit to work training", "التدريب على تصاريح العمل", "Issuers and receivers", "المُصدرون والمستلمون", "Before authorization", "قبل التفويض"],
    ["Emergency drills", "تمارين الطوارئ", "All site personnel", "جميع العاملين في الموقع", "As per ERP", "حسب خطة الطوارئ"],
  ]),
  ...planSection(W, 8, "Communication and consultation", "التواصل والتشاور", "Describe meetings and channels: daily toolbox talks, weekly HSE meeting, monthly management review, notice boards, how workers raise concerns.", "صف الاجتماعات وقنوات التواصل: محاضرات التوعية اليومية، اجتماع السلامة الأسبوعي، المراجعة الإدارية الشهرية، لوحات الإعلانات، وطريقة رفع العمال لملاحظاتهم.", 900),
  ...planSection(W, 9, "Inspections and audits", "التفتيش والتدقيق", "List inspection types, frequency and responsibility: daily site inspections, weekly equipment checks, monthly management walk-through, internal audits.", "اذكر أنواع التفتيش وتكراره والمسؤول عنه: تفتيش يومي للموقع، فحص أسبوعي للمعدات، جولة إدارية شهرية، تدقيق داخلي.", 900),
  ...planSection(W, 10, "Incident reporting and investigation", "الإبلاغ عن الحوادث والتحقيق فيها", "Explain how incidents and near misses are reported (timescales), who investigates, the root cause method (5 Whys) and how actions are tracked to closure.", "وضّح طريقة الإبلاغ عن الحوادث والحوادث الوشيكة (المدد الزمنية)، ومن يحقق، وطريقة تحليل السبب الجذري (5 لماذا)، ومتابعة الإجراءات حتى إغلاقها.", 900),
  ...planSection(W, 11, "Emergency preparedness", "الاستعداد للطوارئ", "Refer to the Emergency Response Plan: emergency contacts, assembly points, first aid and rescue arrangements, drills.", "ارجع إلى خطة الاستجابة للطوارئ: أرقام الطوارئ، نقاط التجمع، ترتيبات الإسعاف والإنقاذ، التمارين.", 800),
  ...planSection(W, 12, "Subcontractor management", "إدارة المقاولين من الباطن", "Describe pre-qualification, HSE requirements in contracts, induction, monitoring and performance review of subcontractors.", "صف التأهيل المسبق، ومتطلبات السلامة في العقود، والتعريف، والمتابعة، وتقييم أداء المقاولين من الباطن.", 800),
  ...planSection(W, 13, "Health and welfare", "الصحة والرعاية", "Describe heat stress management, drinking water, shade and rest areas, toilets, first aid and medical facilities, and occupational health checks.", "صف إدارة الإجهاد الحراري، ومياه الشرب، والظل والاستراحات، ودورات المياه، والإسعافات والمرافق الطبية، والفحوص الصحية المهنية.", 800),
  ...planSection(W, 14, "Environmental management", "الإدارة البيئية", "Describe controls for waste, dust, noise, spills, water use and protection of the surroundings.", "صف إجراءات التحكم في المخلفات والغبار والضوضاء والانسكابات واستخدام المياه وحماية المحيط.", 800),
  ...planSection(W, 15, "Performance monitoring and KPIs", "متابعة الأداء والمؤشرات", "List leading indicators (inspections, training, near misses, observations) and lagging indicators (TRIR, LTIFR, severity rate), and the monthly reporting format.", "اذكر المؤشرات الاستباقية (التفتيش، التدريب، الحوادث الوشيكة، الملاحظات) والمؤشرات التأخرية (TRIR وLTIFR ومعدل الخطورة)، وشكل التقرير الشهري.", 900),
  ...planSection(W, 16, "Document control and records", "ضبط المستندات والسجلات", "Explain how HSE documents are numbered, approved, distributed and archived, and how long records are kept.", "وضّح طريقة ترقيم مستندات السلامة واعتمادها وتوزيعها وأرشفتها، ومدة حفظ السجلات.", 800),
  ...approval(W, [["Prepared by (HSE)", "إعداد (السلامة)"], ["Reviewed by (site manager)", "مراجعة (مدير الموقع)"], ["Approved by (project manager)", "اعتماد (مدير المشروع)"], ["Client / consultant", "العميل / الاستشاري"]]),
]));

files.push(build("BE-SAFE_Plan_Emergency-Response-Plan.docx", { code: "BS-PLN-02", title: "Emergency Response Plan", titleAr: "خطة الاستجابة للطوارئ", intro: "Fill in your site details, post the contacts and assembly points on site, and brief everyone during induction.", introAr: "املأ بيانات موقعك، وعلّق أرقام الطوارئ ونقاط التجمع في الموقع، واشرحها للجميع أثناء التعريف." }, (W) => [
  ...docControl(W),
  ...planSection(W, 1, "Purpose and scope", "الغرض والنطاق", "Describe the site, number of people on site, working hours and the emergencies this plan covers.", "صف الموقع، وعدد الأشخاص، وساعات العمل، وحالات الطوارئ التي تغطيها هذه الخطة.", 900),
  ...sectionBar(W, 2, "Emergency contacts", "أرقام الطوارئ"),
  (() => {
    const w = [4200, 2600, W - 6800];
    const head = row([["Service / person", "الجهة / الشخص"], ["Phone", "الهاتف"], ["Notes", "ملاحظات"]].map((h, i) => cell(bi(h[0], h[1], { bold: true, color: "FFFFFF", arColor: "DDE4EE", size: 16 }), w[i], { fill: NAVY })), { header: true });
    const fixed = [["Unified emergency number (where available)", "رقم الطوارئ الموحد (حيث يتوفر)", "911"], ["Civil Defense", "الدفاع المدني", "998"], ["Ambulance (Red Crescent)", "الإسعاف (الهلال الأحمر)", "997"], ["Police", "الشرطة", "999"]];
    const site = [["Site emergency coordinator", "منسق الطوارئ في الموقع"], ["HSE manager", "مدير السلامة"], ["Site first aider / clinic", "المسعف / العيادة في الموقع"], ["Nearest hospital", "أقرب مستشفى"], ["Client / consultant representative", "ممثل العميل / الاستشاري"]];
    return table(w, [head,
      ...fixed.map(f => row([cell(bi(f[0], f[1], { bold: true, size: 16 }), w[0], { fill: LIGHT }), cell(pEn(f[2], { bold: true, size: 22, color: "E53935" }), w[1]), cell(empty(), w[2])], { height: 440 })),
      ...site.map(f => row([cell(bi(f[0], f[1], { bold: true, size: 16 }), w[0], { fill: LIGHT }), cell(empty(), w[1]), cell(empty(), w[2])], { height: 440 })),
    ]);
  })(),
  ...note("Check the numbers for your region before posting them on site.", "تحقق من الأرقام الخاصة بمنطقتك قبل تعليقها في الموقع."),
  ...sectionBar(W, 3, "Emergency organization", "فريق الطوارئ"),
  labeledTable([["Role", "الدور", 3200], ["Name", "الاسم", 3000], ["Phone", "الهاتف", 2000], ["Backup", "البديل", W - 8200]], [["Emergency coordinator", "منسق الطوارئ"], ["Fire wardens", "مراقبو الحريق"], ["First aiders", "المسعفون"], ["Assembly point marshals", "مسؤولو نقاط التجمع"], ["Rescue team (height / confined space)", "فريق الإنقاذ (المرتفعات / الأماكن المغلقة)"]]),
  ...planSection(W, 4, "Alarm and communication", "الإنذار والتواصل", "Describe how an emergency is raised (alarm, siren, radio channel, phone) and how everyone is informed.", "صف طريقة إطلاق الإنذار (جرس، صفارة، قناة اللاسلكي، الهاتف) وكيف يتم إبلاغ الجميع.", 800),
  ...planSection(W, 5, "Assembly points and evacuation routes", "نقاط التجمع ومسارات الإخلاء", "List the assembly points and attach the site evacuation plan drawing. Describe how headcount is done.", "اذكر نقاط التجمع وأرفق مخطط الإخلاء للموقع. وضّح طريقة حصر الأفراد.", 800),
  ...sectionBar(W, 6, "Response to emergency scenarios", "الاستجابة لسيناريوهات الطوارئ"),
  twoCol(W, [["Scenario", "السيناريو"], ["Immediate actions", "الإجراءات الفورية"]], [
    ["Fire", "حريق", "Raise the alarm; use an extinguisher only if safe and trained; evacuate to the assembly point; call Civil Defense; do not use lifts.", "أطلق الإنذار؛ استخدم الطفاية فقط إذا كان ذلك آمنًا وكنت مدربًا؛ أخلِ إلى نقطة التجمع؛ اتصل بالدفاع المدني؛ لا تستخدم المصاعد."],
    ["Serious injury", "إصابة خطيرة", "Make the area safe; call the first aider and ambulance; do not move the casualty unless in danger; send someone to guide the ambulance.", "أمّن المنطقة؛ استدعِ المسعف والإسعاف؛ لا تحرّك المصاب إلا إذا كان في خطر؛ أرسل شخصًا لإرشاد الإسعاف."],
    ["Heat stroke", "ضربة شمس", "Move to shade; cool the person immediately with water and ice packs; call the ambulance; do not leave the person alone.", "انقله إلى الظل؛ برّده فورًا بالماء وكمادات الثلج؛ اتصل بالإسعاف؛ لا تتركه وحده."],
    ["Fall arrest / suspended worker", "عامل معلّق بحزام الأمان", "Raise the alarm; start the rescue plan immediately (rescue within minutes); never leave a suspended worker; get medical check after rescue.", "أطلق الإنذار؛ ابدأ خطة الإنقاذ فورًا (الإنقاذ خلال دقائق)؛ لا تترك العامل المعلّق؛ فحص طبي بعد الإنقاذ."],
    ["Confined space emergency", "طوارئ في مكان مغلق", "The attendant raises the alarm and does not enter; use the retrieval system; only the trained rescue team with breathing apparatus enters.", "يطلق المراقب الإنذار ولا يدخل؛ استخدم نظام السحب؛ لا يدخل إلا فريق الإنقاذ المدرب بأجهزة التنفس."],
    ["Gas leak / toxic release", "تسرب غاز / مواد سامة", "Stop work and ignition sources; move upwind to the assembly point; isolate the source if safe; call Civil Defense.", "أوقف العمل ومصادر الاشتعال؛ تحرك عكس اتجاه الريح إلى نقطة التجمع؛ اعزل المصدر إن كان آمنًا؛ اتصل بالدفاع المدني."],
    ["Excavation or structure collapse", "انهيار حفرية أو منشأ", "Stop all work nearby; keep people and vehicles back; call emergency services; do not enter to rescue without shoring.", "أوقف كل الأعمال القريبة؛ أبعد الأشخاص والمركبات؛ اتصل بالطوارئ؛ لا تدخل للإنقاذ دون تدعيم."],
    ["Electric shock", "صعق كهربائي", "Isolate the power before touching the casualty; call the first aider and ambulance; start CPR if trained and needed.", "افصل الكهرباء قبل لمس المصاب؛ استدعِ المسعف والإسعاف؛ ابدأ الإنعاش إذا كنت مدربًا ودعت الحاجة."],
    ["Chemical or fuel spill", "انسكاب كيماويات أو وقود", "Stop the source if safe; contain with spill kit; keep away from drains; check the SDS; report to HSE.", "أوقف المصدر إن كان آمنًا؛ احتوِ الانسكاب بحقيبة الانسكاب؛ أبعده عن المصارف؛ راجع صحيفة بيانات السلامة؛ أبلغ السلامة."],
    ["Sandstorm, high wind or heavy rain", "عاصفة رملية أو رياح شديدة أو أمطار غزيرة", "Stop lifting and work at height; secure materials; move people to shelter; check excavations and scaffolds before restarting.", "أوقف أعمال الرفع والعمل على ارتفاع؛ ثبّت المواد؛ انقل الأفراد إلى مكان آمن؛ افحص الحفريات والسقالات قبل الاستئناف."],
  ], 2600),
  ...sectionBar(W, 7, "Emergency equipment", "معدات الطوارئ"),
  grid([["Equipment", "المعدة", 3600], ["Location", "الموقع", 3400], ["Checked (frequency)", "الفحص (التكرار)", W - 7000]], 6, { height: 400 }),
  ...planSection(W, 8, "Drills and training", "التمارين والتدريب", "State drill types and frequency (e.g. evacuation, rescue from height, confined space rescue), who attends, and how lessons learned are recorded.", "حدد أنواع التمارين وتكرارها (مثل الإخلاء، الإنقاذ من المرتفعات، الإنقاذ من الأماكن المغلقة)، والحضور، وتوثيق الدروس المستفادة.", 800),
  ...planSection(W, 9, "After an emergency", "بعد حالة الطوارئ", "Describe reporting, investigation, support for affected people, and review of this plan.", "صف الإبلاغ، والتحقيق، ودعم المتأثرين، ومراجعة هذه الخطة.", 700),
  ...approval(W, [["Prepared by (HSE)", "إعداد (السلامة)"], ["Approved by (project manager)", "اعتماد (مدير المشروع)"]]),
]));

files.push(build("BE-SAFE_Plan_Traffic-Management-Plan.docx", { code: "BS-PLN-03", title: "Traffic Management Plan", titleAr: "خطة إدارة الحركة المرورية", intro: "Plan how vehicles, plant and pedestrians move safely on and around the site. Attach the site traffic layout drawing.", introAr: "خطّط لحركة المركبات والمعدات والمشاة بأمان داخل الموقع وحوله. أرفق مخطط الحركة المرورية للموقع." }, (W) => [
  ...docControl(W),
  ...planSection(W, 1, "Scope and site description", "النطاق ووصف الموقع", "Describe the site, gates, surrounding roads, working hours and the types of vehicles and plant used.", "صف الموقع والبوابات والطرق المحيطة وساعات العمل وأنواع المركبات والمعدات المستخدمة.", 900),
  ...planSection(W, 2, "Site traffic layout", "مخطط الحركة في الموقع", "Attach a drawing showing: entry and exit gates, vehicle routes and one-way systems, pedestrian walkways and crossings, parking, loading and laydown areas, speed limit signs.", "أرفق مخططًا يوضح: بوابات الدخول والخروج، مسارات المركبات والاتجاه الواحد، ممرات ومعابر المشاة، المواقف، مناطق التحميل والتخزين، لافتات السرعة.", 1000),
  ...sectionBar(W, 3, "Site traffic rules", "قواعد الحركة في الموقع"),
  points(W, [
    ["Site speed limit: ______ km/h. Signs posted at all gates.", "حد السرعة في الموقع: ______ كم/س. اللافتات معلّقة عند جميع البوابات."],
    ["Pedestrians and vehicles separated with barriers wherever possible.", "فصل المشاة عن المركبات بحواجز كلما أمكن."],
    ["One-way routes used where possible to reduce reversing.", "استخدام مسارات باتجاه واحد كلما أمكن لتقليل الرجوع للخلف."],
    ["Reversing only with a trained banksman; reversing alarms and cameras working.", "الرجوع للخلف فقط بوجود مؤشّر مدرب؛ إنذارات وكاميرات الرجوع تعمل."],
    ["Drivers and operators licensed and authorized for the vehicle or plant.", "السائقون والمشغّلون مرخّصون ومصرح لهم بالمركبة أو المعدة."],
    ["Seat belts worn; no passengers unless there is a seat; no phone use while driving.", "ربط حزام الأمان؛ لا ركاب بدون مقعد؛ لا استخدام للهاتف أثناء القيادة."],
    ["Daily pre-use inspection of vehicles and plant.", "فحص يومي للمركبات والمعدات قبل الاستخدام."],
    ["Engines off and keys removed when parked; parking only in marked areas.", "إطفاء المحرك وسحب المفتاح عند التوقف؛ الوقوف في الأماكن المحددة فقط."],
  ]),
  ...sectionBar(W, 4, "Vehicle and plant register", "سجل المركبات والمعدات"),
  grid([["Type", "النوع", 2200], ["Plate / ID", "اللوحة / الرقم", 1800], ["Driver / operator", "السائق / المشغّل", 2400], ["Licence No.", "رقم الرخصة", 1800], ["Certificate expiry", "انتهاء الشهادة", W - 8200]], 6, { height: 400 }),
  ...planSection(W, 5, "Deliveries, loading and unloading", "التوريد والتحميل والتفريغ", "Describe delivery times, booking, the delivery route, who receives and guides deliveries, and controls during loading and unloading.", "صف أوقات التوريد والحجز ومسار التوريد ومن يستقبل المركبات ويرشدها، وإجراءات التحكم أثناء التحميل والتفريغ.", 800),
  ...planSection(W, 6, "Work on or next to public roads", "العمل على الطرق العامة أو بجوارها", "Describe approvals from the authorities, temporary traffic signs and barriers, flagmen and night lighting.", "صف موافقات الجهات المختصة، واللافتات والحواجز المؤقتة، ومنظمي الحركة، والإضاءة الليلية.", 800),
  ...planSection(W, 7, "Monitoring and review", "المتابعة والمراجعة", "Describe inspection frequency of routes, signs and barriers, how violations are handled, and when the plan is reviewed (e.g. when the site layout changes).", "صف تكرار فحص المسارات واللافتات والحواجز، وطريقة التعامل مع المخالفات، ومتى تُراجع الخطة (مثل تغيّر مخطط الموقع).", 800),
  ...approval(W, [["Prepared by (HSE)", "إعداد (السلامة)"], ["Approved by (site manager)", "اعتماد (مدير الموقع)"]]),
]));

files.push(build("BE-SAFE_Plan_Method-Statement-Template.docx", { code: "BS-PLN-04", title: "Method Statement", titleAr: "طريقة التنفيذ (Method Statement)", intro: "Describe how an activity will be done safely, step by step. Use it together with the JSA / risk assessment.", introAr: "صف طريقة تنفيذ النشاط بأمان خطوة بخطوة. استخدمه مع تحليل سلامة المهام / تقييم المخاطر." }, (W) => [
  ...docControl(W, [["Activity", "النشاط", true]]),
  ...planSection(W, 1, "Scope of work", "نطاق العمل", "Describe the activity, location, quantities and duration.", "صف النشاط والموقع والكميات والمدة.", 900),
  ...planSection(W, 2, "References", "المراجع", "List drawings, specifications, standards, the related JSA / risk assessment and the permits needed.", "اذكر المخططات والمواصفات والمعايير وتحليل سلامة المهام / تقييم المخاطر المرتبط والتصاريح المطلوبة.", 700),
  ...sectionBar(W, 3, "Resources", "الموارد"),
  grid([["Manpower (trade)", "العمالة (المهنة)", 3600], ["Number", "العدد", 1400], ["Competency / certificate", "الكفاءة / الشهادة", W - 5000]], 4, { height: 400 }),
  spacer(80),
  grid([["Equipment / tools", "المعدات / الأدوات", 3600], ["Qty", "العدد", 1400], ["Certificate / inspection", "الشهادة / الفحص", W - 5000]], 4, { height: 400 }),
  ...sectionBar(W, 4, "Sequence of work", "تسلسل العمل"),
  grid([["Step", "الخطوة", 800], ["Activity", "النشاط", W - 800 - 3800], ["Responsible", "المسؤول", 2000], ["Hold / check point", "نقطة توقف / فحص", 1800]], 8, { numbered: true, height: 460, example: ["e.g.", "Barricade the work area and place warning signs", "Supervisor", "HSE check"] }),
  ...sectionBar(W, 5, "Main hazards and controls", "المخاطر الرئيسية وإجراءات التحكم"),
  grid([["Hazard", "الخطر", 3600], ["Control measures (see JSA)", "إجراءات التحكم (انظر JSA)", W - 3600]], 5, { height: 460 }),
  ...sectionBar(W, 6, "Permits and PPE", "التصاريح ومعدات الوقاية"),
  table([W], [row([cell(options([["Hot work", "أعمال ساخنة"], ["Confined space", "أماكن مغلقة"], ["Work at height", "عمل على ارتفاع"], ["Electrical isolation", "عزل كهربائي"], ["Excavation", "حفر"], ["Lifting plan", "خطة رفع"], ["Helmet", "خوذة"], ["Safety shoes", "حذاء سلامة"], ["Hi-vis vest", "سترة عاكسة"], ["Gloves", "قفازات"], ["Glasses", "نظارات"], ["Harness", "حزام أمان"]], 3), W)])]),
  ...planSection(W, 7, "Inspection and quality checks", "الفحص ومراقبة الجودة", "List the inspections and tests before, during and after the work.", "اذكر عمليات الفحص والاختبار قبل العمل وأثناءه وبعده.", 700),
  ...planSection(W, 8, "Emergency arrangements", "ترتيبات الطوارئ", "Describe rescue arrangements specific to this activity, first aid and emergency contacts (refer to the ERP).", "صف ترتيبات الإنقاذ الخاصة بهذا النشاط والإسعافات الأولية وأرقام الطوارئ (ارجع إلى خطة الطوارئ).", 700),
  ...planSection(W, 9, "Environmental controls", "الإجراءات البيئية", "Describe waste, dust, noise and spill controls for this activity.", "صف إجراءات التحكم في المخلفات والغبار والضوضاء والانسكابات لهذا النشاط.", 600),
  ...approval(W, [["Prepared by", "إعداد"], ["Reviewed by (HSE)", "مراجعة (السلامة)"], ["Approved by (site manager)", "اعتماد (مدير الموقع)"], ["Consultant", "الاستشاري"]]),
]));

Promise.all(files).then(() => console.log("done"));
}
