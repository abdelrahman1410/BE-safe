"""Generates the BE SAFE Excel templates (bilingual EN/AR).
Usage: python xlsx_templates.py <repo-root>
"""
import os
import sys

from openpyxl import Workbook
from openpyxl.chart import LineChart, Reference
from openpyxl.comments import Comment
from openpyxl.drawing.image import Image
from openpyxl.formatting.rule import CellIsRule, FormulaRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

ROOT = sys.argv[1]
OUT = os.path.join(ROOT, "library", "files")
LOGO = os.path.join(ROOT, "app", "icons", "icon-192-v2.png")

NAVY, ORANGE, LIGHT, LINE, GREY = "0B1F3A", "F26A1B", "EEF2F8", "BFC8D6", "5B6B82"
INPUT = "FFF9DB"  # pale yellow = cells to fill
F = "Arial"
thin = Side(style="thin", color=LINE)
BORDER = Border(left=thin, right=thin, top=thin, bottom=thin)
WRAP = Alignment(wrap_text=True, vertical="center")
CENTER = Alignment(horizontal="center", vertical="center", wrap_text=True)

FOOTER_EN = "This template is a general guide. Adapt it to your company procedures, client requirements and applicable Saudi regulations before use."
FOOTER_AR = "هذا النموذج إرشادي عام. يُرجى تكييفه مع إجراءات شركتك ومتطلبات العميل والأنظمة السعودية المعمول بها قبل الاستخدام."
CREDIT = "BE SAFE · Free HSE template by Abdul Rahman Zain · abdelrahman1410.github.io/BE-safe"

LEVELS = [  # max score, english, arabic, fill, font colour, action en, action ar
    (4, "Low", "منخفض", "4CAF50", "000000", "Acceptable. Manage with routine procedures and keep monitoring.", "مقبول. يُدار بالإجراءات المعتادة مع استمرار المتابعة."),
    (9, "Medium", "متوسط", "FFD23F", "000000", "Tolerable. Add controls and have the supervisor review before work starts.", "مقبول بشروط. أضف إجراءات تحكم وراجعها مع المشرف قبل بدء العمل."),
    (16, "High", "مرتفع", "FF8A33", "000000", "Do not start until the risk is reduced. Management approval required.", "لا تبدأ العمل حتى يتم تقليل الخطر. يلزم اعتماد الإدارة."),
    (25, "Extreme", "شديد جدًا", "E53935", "FFFFFF", "Unacceptable. Stop the activity and redesign the work.", "غير مقبول. أوقف النشاط وأعد تصميم طريقة العمل."),
]
LIKELIHOOD = [("Rare", "نادر", "Could happen only in exceptional circumstances"), ("Unlikely", "غير محتمل", "Could happen but not expected"), ("Possible", "ممكن", "Might happen at some time"), ("Likely", "محتمل", "Will probably happen in most circumstances"), ("Almost certain", "شبه مؤكد", "Expected to happen regularly")]
SEVERITY = [("Insignificant", "طفيفة جدًا", "No injury, or first aid only; negligible damage"), ("Minor", "بسيطة", "Medical treatment case; minor damage"), ("Moderate", "متوسطة", "Restricted work or lost time injury; moderate damage"), ("Major", "كبيرة", "Serious injury or permanent disability; major damage"), ("Catastrophic", "كارثية", "Fatality or multiple serious injuries; extensive damage")]


def font(**kw):
    kw.setdefault("name", F)
    kw.setdefault("size", 10)
    return Font(**kw)


def fill(c):
    return PatternFill("solid", start_color=c, end_color=c)


def level_formula(ref):
    return f'=IF({ref}="","",IF({ref}<=4,"Low – منخفض",IF({ref}<=9,"Medium – متوسط",IF({ref}<=16,"High – مرتفع","Extreme – شديد جدًا"))))'


def header(ws, title, title_ar, last_col, code):
    """Logo, title rows and document code. Returns next free row."""
    ws.row_dimensions[1].height = 30
    ws.row_dimensions[2].height = 22
    img = Image(LOGO)
    img.width = img.height = 34
    ws.add_image(img, "A1")
    lc = get_column_letter(last_col)
    ws.merge_cells(f"B1:{get_column_letter(last_col - 1)}1")
    ws["B1"] = title
    ws["B1"].font = font(size=16, bold=True, color=NAVY)
    ws["B1"].alignment = Alignment(vertical="center")
    ws.merge_cells(f"B2:{get_column_letter(last_col - 1)}2")
    ws["B2"] = title_ar
    ws["B2"].font = font(size=13, bold=True, color=ORANGE)
    ws["B2"].alignment = Alignment(vertical="center")
    ws[f"{lc}1"] = code
    ws[f"{lc}1"].font = font(bold=True, color=NAVY)
    ws[f"{lc}1"].alignment = Alignment(horizontal="right", vertical="center")
    ws[f"{lc}2"] = "Rev. 0"
    ws[f"{lc}2"].font = font(size=9, color=GREY)
    ws[f"{lc}2"].alignment = Alignment(horizontal="right")
    for c in range(1, last_col + 1):
        ws.cell(row=3, column=c).border = Border(bottom=Side(style="medium", color=ORANGE))
    ws.row_dimensions[3].height = 6
    return 5


def legend(ws, r, last_col, text_en, text_ar):
    ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=last_col)
    c = ws.cell(row=r, column=1, value=f"{text_en}\n{text_ar}")
    c.font = font(size=9, italic=True, color=GREY)
    c.alignment = Alignment(wrap_text=True, vertical="top")
    ws.row_dimensions[r].height = 42
    return r + 2


def info_block(ws, r, pairs, last_col):
    """pairs: [(en, ar), ...] laid out two per row: label cols span, value cols span."""
    half = last_col // 2
    lab_w = max(1, half // 3)
    for i in range(0, len(pairs), 2):
        for j, (en, ar) in enumerate(pairs[i:i + 2]):
            c0 = 1 + j * half
            lab_end = c0 + lab_w - 1
            val_end = (c0 + half - 1) if j == 0 else last_col
            ws.merge_cells(start_row=r, start_column=c0, end_row=r, end_column=lab_end)
            lc = ws.cell(row=r, column=c0, value=f"{en} / {ar}")
            lc.font = font(bold=True, size=9, color=NAVY)
            lc.fill = fill(LIGHT)
            lc.alignment = WRAP
            ws.merge_cells(start_row=r, start_column=lab_end + 1, end_row=r, end_column=val_end)
            vc = ws.cell(row=r, column=lab_end + 1)
            vc.fill = fill(INPUT)
            vc.alignment = WRAP
            for cc in range(c0, val_end + 1):
                ws.cell(row=r, column=cc).border = BORDER
        ws.row_dimensions[r].height = 24
        r += 1
    return r + 1


def table_head(ws, r, cols, height=34):
    for i, (en, ar, width) in enumerate(cols, start=1):
        c = ws.cell(row=r, column=i, value=f"{en}\n{ar}")
        c.font = font(bold=True, color="FFFFFF", size=9)
        c.fill = fill(NAVY)
        c.alignment = CENTER
        c.border = BORDER
        ws.column_dimensions[get_column_letter(i)].width = width
    ws.row_dimensions[r].height = height
    return r + 1


def footer(ws, r, last_col):
    for i, (t, sz) in enumerate([(FOOTER_EN, 8), (FOOTER_AR, 8), (CREDIT, 8)]):
        ws.merge_cells(start_row=r + i, start_column=1, end_row=r + i, end_column=last_col)
        c = ws.cell(row=r + i, column=1, value=t)
        c.font = font(size=sz, italic=i < 2, color=GREY)
        c.alignment = Alignment(horizontal="right" if i == 1 else "left", wrap_text=True)
    ws.oddFooter.left.text = CREDIT
    ws.oddFooter.left.size = 7
    ws.oddFooter.right.text = "Page &P / &N"
    ws.oddFooter.right.size = 7


def print_setup(ws, landscape, title_rows=None):
    ws.page_setup.paperSize = ws.PAPERSIZE_A4
    ws.page_setup.orientation = "landscape" if landscape else "portrait"
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0
    ws.sheet_properties.pageSetUpPr.fitToPage = True
    ws.page_margins.left = ws.page_margins.right = 0.4
    ws.page_margins.top = ws.page_margins.bottom = 0.5
    if title_rows:
        ws.print_title_rows = title_rows
    ws.sheet_view.showGridLines = False


def signoff(ws, r, last_col, roles, bounds=None, labels=None):
    cols = [(l, 0) for l in (labels or ["Role / الصفة", "Name / الاسم", "Signature / التوقيع", "Date / التاريخ"])]
    span = max(1, last_col // 4)
    bounds = bounds or [(1 + i * span, (1 + (i + 1) * span - 1) if i < 3 else last_col) for i in range(4)]
    for (label, _), (a, b) in zip(cols, bounds):
        ws.merge_cells(start_row=r, start_column=a, end_row=r, end_column=b)
        c = ws.cell(row=r, column=a, value=label)
        c.font = font(bold=True, size=9, color=NAVY)
        c.fill = fill(LIGHT)
        c.alignment = CENTER
        for cc in range(a, b + 1):
            ws.cell(row=r, column=cc).border = BORDER
    for role in roles:
        r += 1
        ws.row_dimensions[r].height = 28
        for k, (a, b) in enumerate(bounds):
            ws.merge_cells(start_row=r, start_column=a, end_row=r, end_column=b)
            c = ws.cell(row=r, column=a, value=role if k == 0 else None)
            c.font = font(bold=k == 0, size=9)
            c.alignment = WRAP
            if k:
                c.fill = fill(INPUT)
            for cc in range(a, b + 1):
                ws.cell(row=r, column=cc).border = BORDER
    return r + 2


# ---------------------------------------------------------------- matrix sheet
def matrix_sheet(ws):
    last = 8
    r = header(ws, "5×5 Risk Matrix & Guide", "مصفوفة المخاطر 5×5 ودليل التقييم", last, "BS-RA-02")
    for col, w in zip("ABCDEFGH", [6, 22, 16, 16, 16, 16, 16, 30]):
        ws.column_dimensions[col].width = w
    r = legend(ws, r, last, "Risk score = Likelihood (1–5) × Severity (1–5). Find the cell where the likelihood row meets the severity column.", "درجة الخطر = الاحتمالية (1–5) × الشدة (1–5). ابحث عن الخانة التي يلتقي فيها صف الاحتمالية مع عمود الشدة.")

    # Matrix
    ws.merge_cells(start_row=r, start_column=3, end_row=r, end_column=7)
    ws.cell(row=r, column=3, value="Severity / الشدة →").font = font(bold=True, color=NAVY)
    ws.cell(row=r, column=3).alignment = CENTER
    r += 1
    head_r = r
    for s in range(1, 6):
        c = ws.cell(row=r, column=2 + s, value=f"{s}\n{SEVERITY[s - 1][0]}\n{SEVERITY[s - 1][1]}")
        c.font = font(bold=True, size=9, color="FFFFFF")
        c.fill = fill(NAVY)
        c.alignment = CENTER
        c.border = BORDER
    ws.cell(row=r, column=2, value="Likelihood ↓\nالاحتمالية").font = font(bold=True, size=9, color=NAVY)
    ws.cell(row=r, column=2).alignment = CENTER
    ws.row_dimensions[r].height = 46
    for li, l in enumerate(range(5, 0, -1)):
        rr = head_r + 1 + li
        ws.row_dimensions[rr].height = 34
        c = ws.cell(row=rr, column=2, value=f"{l}  {LIKELIHOOD[l - 1][0]}\n    {LIKELIHOOD[l - 1][1]}")
        c.font = font(bold=True, size=9, color="FFFFFF")
        c.fill = fill(NAVY)
        c.alignment = WRAP
        c.border = BORDER
        for s in range(1, 6):
            cell = ws.cell(row=rr, column=2 + s, value=f"={get_column_letter(1)}{rr}*{get_column_letter(2 + s)}{head_r + 7}")
            score = l * s
            lv = next(x for x in LEVELS if score <= x[0])
            cell.fill = fill(lv[3])
            cell.font = font(bold=True, size=12, color=lv[4])
            cell.alignment = CENTER
            cell.border = BORDER
        ws.cell(row=rr, column=1, value=l).font = font(size=8, color="FFFFFF")  # helper (hidden-looking)
    # helper severity numbers under matrix (white text) so the matrix cells are real formulas
    for s in range(1, 6):
        ws.cell(row=head_r + 7, column=2 + s, value=s).font = font(size=8, color="FFFFFF")
    r = head_r + 9

    # Levels and actions
    ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=last)
    t = ws.cell(row=r, column=1, value="Risk levels and required action / مستويات الخطر والإجراء المطلوب")
    t.font = font(bold=True, size=11, color="FFFFFF")
    t.fill = fill(NAVY)
    r += 1
    lo = 1
    for mx, en, ar, fc, tc, act_en, act_ar in LEVELS:
        ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=2)
        c = ws.cell(row=r, column=1, value=f"{en} – {ar}")
        c.fill = fill(fc)
        c.font = font(bold=True, color=tc)
        c.alignment = CENTER
        ws.cell(row=r, column=3, value=f"{lo} – {mx}").alignment = CENTER
        ws.merge_cells(start_row=r, start_column=4, end_row=r, end_column=last)
        a = ws.cell(row=r, column=4, value=f"{act_en}\n{act_ar}")
        a.alignment = WRAP
        a.font = font(size=9)
        for cc in range(1, last + 1):
            ws.cell(row=r, column=cc).border = BORDER
        ws.row_dimensions[r].height = 32
        lo = mx + 1
        r += 1
    r += 1

    for title, data in [("Likelihood definitions / تعريفات الاحتمالية", LIKELIHOOD), ("Severity definitions / تعريفات الشدة", SEVERITY)]:
        ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=last)
        t = ws.cell(row=r, column=1, value=title)
        t.font = font(bold=True, size=11, color="FFFFFF")
        t.fill = fill(NAVY)
        r += 1
        for i, (en, ar, desc) in enumerate(data, start=1):
            ws.cell(row=r, column=1, value=i).alignment = CENTER
            ws.cell(row=r, column=1).font = font(bold=True)
            ws.cell(row=r, column=2, value=f"{en} – {ar}").font = font(bold=True, size=9)
            ws.merge_cells(start_row=r, start_column=3, end_row=r, end_column=last)
            ws.cell(row=r, column=3, value=desc).font = font(size=9)
            for cc in range(1, last + 1):
                ws.cell(row=r, column=cc).border = BORDER
                ws.cell(row=r, column=cc).alignment = WRAP if cc > 1 else CENTER
            ws.row_dimensions[r].height = 20
            r += 1
        r += 1
    footer(ws, r, last)
    print_setup(ws, landscape=False)


# ---------------------------------------------------------------- risk register
def risk_register(path):
    wb = Workbook()
    ws = wb.active
    ws.title = "Risk Register"
    cols = [("No.", "م", 5), ("Activity / task", "النشاط / المهمة", 22), ("Hazard", "الخطر", 22), ("Consequence (who / what is harmed)", "النتيجة (من / ما المتضرر)", 22), ("Existing controls", "الإجراءات الحالية", 28),
            ("L", "الاحتمالية", 7), ("S", "الشدة", 7), ("Risk", "الخطر", 7), ("Level", "المستوى", 13), ("Additional controls", "إجراءات إضافية", 28),
            ("L", "الاحتمالية", 7), ("S", "الشدة", 7), ("Residual", "المتبقي", 8), ("Level", "المستوى", 13), ("Responsible", "المسؤول", 15), ("Target date", "التاريخ المستهدف", 12), ("Status", "الحالة", 12)]
    last = len(cols)
    r = header(ws, "Risk Assessment Register", "سجل تقييم المخاطر", last, "BS-RA-04")
    r = legend(ws, r, last, "Fill the yellow cells. L = likelihood (1–5), S = severity (1–5): see the 'Matrix & Guide' sheet. Risk, residual risk and levels calculate automatically. Row 1 is an example: overwrite or delete it.",
               "املأ الخانات الصفراء. الاحتمالية والشدة من 1 إلى 5 (انظر ورقة 'Matrix & Guide'). الخطر والمستوى يُحسبان تلقائيًا. الصف الأول مثال: استبدله أو احذفه.")
    r = info_block(ws, r, [("Project", "المشروع"), ("Location", "الموقع"), ("Prepared by", "إعداد"), ("Date", "التاريخ"), ("Reviewed by", "مراجعة"), ("Revision", "رقم المراجعة")], last)
    head_row = r
    r = table_head(ws, r, cols)
    first = r
    n_rows = 40
    example = [1, "Lifting pipe spools with mobile crane", "Load falling; crane overturning", "Worker struck by load – serious injury or fatality", "Certified crane; daily pre-use check", 4, 4, None, None,
               "Approved lifting plan; competent rigger and signalman; exclusion zone; outrigger mats; tag lines", 2, 4, None, None, "Lifting supervisor", "2026-12-01", "Open"]
    for i in range(n_rows):
        rr = first + i
        ws.row_dimensions[rr].height = 42 if i == 0 else 30
        for c in range(1, last + 1):
            cell = ws.cell(row=rr, column=c)
            cell.border = BORDER
            cell.alignment = CENTER if c in (1, 6, 7, 8, 9, 11, 12, 13, 14, 16, 17) else WRAP
            cell.font = font(size=9, italic=(i == 0), color=GREY if i == 0 else "000000")
            if c not in (8, 9, 13, 14):
                cell.fill = fill("FFF1E8" if i == 0 else INPUT)
        ws.cell(row=rr, column=1, value=i + 1)
        ws.cell(row=rr, column=8, value=f'=IF(OR(F{rr}="",G{rr}=""),"",F{rr}*G{rr})')
        ws.cell(row=rr, column=9, value=level_formula(f"H{rr}"))
        ws.cell(row=rr, column=13, value=f'=IF(OR(K{rr}="",L{rr}=""),"",K{rr}*L{rr})')
        ws.cell(row=rr, column=14, value=level_formula(f"M{rr}"))
        if i == 0:
            for c, v in enumerate(example, start=1):
                if v is not None and c not in (1,):
                    ws.cell(row=rr, column=c, value=v)
    end = first + n_rows - 1

    dv = DataValidation(type="whole", operator="between", formula1="1", formula2="5", allow_blank=True, showErrorMessage=True, errorTitle="1 – 5", error="Enter a number from 1 to 5 / أدخل رقمًا من 1 إلى 5")
    ws.add_data_validation(dv)
    for col in "FGKL":
        dv.add(f"{col}{first}:{col}{end}")
    st = DataValidation(type="list", formula1='"Open,In progress,Closed"', allow_blank=True)
    ws.add_data_validation(st)
    st.add(f"Q{first}:Q{end}")

    for col in ("H", "M"):
        rng = f"{col}{first}:{col}{end}"
        ws.conditional_formatting.add(rng, FormulaRule(formula=[f'AND(ISNUMBER({col}{first}),{col}{first}<=4)'], fill=fill("4CAF50")))
        ws.conditional_formatting.add(rng, FormulaRule(formula=[f'AND(ISNUMBER({col}{first}),{col}{first}>4,{col}{first}<=9)'], fill=fill("FFD23F")))
        ws.conditional_formatting.add(rng, FormulaRule(formula=[f'AND(ISNUMBER({col}{first}),{col}{first}>9,{col}{first}<=16)'], fill=fill("FF8A33")))
        ws.conditional_formatting.add(rng, FormulaRule(formula=[f'AND(ISNUMBER({col}{first}),{col}{first}>16)'], fill=fill("E53935"), font=Font(color="FFFFFF", bold=True)))
    for col, src in (("I", "H"), ("N", "M")):
        rng = f"{col}{first}:{col}{end}"
        ws.conditional_formatting.add(rng, FormulaRule(formula=[f'AND(ISNUMBER({src}{first}),{src}{first}<=4)'], fill=fill("C8E6C9")))
        ws.conditional_formatting.add(rng, FormulaRule(formula=[f'AND(ISNUMBER({src}{first}),{src}{first}>4,{src}{first}<=9)'], fill=fill("FFF3C4")))
        ws.conditional_formatting.add(rng, FormulaRule(formula=[f'AND(ISNUMBER({src}{first}),{src}{first}>9,{src}{first}<=16)'], fill=fill("FFD9BF")))
        ws.conditional_formatting.add(rng, FormulaRule(formula=[f'AND(ISNUMBER({src}{first}),{src}{first}>16)'], fill=fill("F8C1C0")))
    ws.cell(row=head_row, column=8).comment = Comment("Risk = L × S (calculated)", "BE SAFE")
    ws.freeze_panes = ws.cell(row=first, column=3)
    r = signoff(ws, end + 2, last, ["Prepared by / إعداد", "Reviewed by (HSE) / مراجعة (السلامة)", "Approved by / اعتماد"])
    footer(ws, r, last)
    print_setup(ws, landscape=True, title_rows=f"{head_row}:{head_row}")
    matrix_sheet(wb.create_sheet("Matrix & Guide"))
    wb.save(path)


def risk_matrix(path):
    wb = Workbook()
    ws = wb.active
    ws.title = "Matrix & Guide"
    matrix_sheet(ws)
    wb.save(path)


# ---------------------------------------------------------------- checklists
def checklist(path, code, title, title_ar, info, sections, result_no_en, result_no_ar):
    wb = Workbook()
    ws = wb.active
    ws.title = "Checklist"
    cols = [("No.", "م", 6), ("Inspection item", "بند الفحص", 46), ("البند", "Arabic", 40), ("Yes / No / N/A", "نعم / لا / لا ينطبق", 12), ("Remarks / action", "ملاحظات / إجراء", 26)]
    last = len(cols)
    r = header(ws, title, title_ar, last, code)
    r = legend(ws, r, last, "Fill the yellow cells. Choose Yes, No or N/A from the list in column D. Any 'No' turns red and needs an action in the remarks.",
               "املأ الخانات الصفراء. اختر نعم أو لا أو لا ينطبق من القائمة في العمود D. أي إجابة 'No' تظهر باللون الأحمر وتحتاج إجراءً في الملاحظات.")
    for en, ar in info:
        lc = ws.cell(row=r, column=2, value=f"{en} / {ar}")
        lc.font = font(bold=True, size=9, color=NAVY)
        lc.fill = fill(LIGHT)
        lc.alignment = Alignment(horizontal="right", vertical="center")
        ws.merge_cells(start_row=r, start_column=3, end_row=r, end_column=last)
        ws.cell(row=r, column=3).fill = fill(INPUT)
        for cc in range(2, last + 1):
            ws.cell(row=r, column=cc).border = BORDER
        ws.row_dimensions[r].height = 22
        r += 1
    r += 1
    head_row = r
    # custom header (bilingual item columns)
    hdr = [("No.\nم"), ("Inspection item"), ("بند الفحص"), ("Yes / No / N/A\nنعم / لا / لا ينطبق"), ("Remarks / action\nملاحظات / إجراء")]
    for i, (t, (_, _, w)) in enumerate(zip(hdr, cols), start=1):
        c = ws.cell(row=r, column=i, value=t)
        c.font = font(bold=True, color="FFFFFF", size=9)
        c.fill = fill(NAVY)
        c.alignment = CENTER
        c.border = BORDER
        ws.column_dimensions[get_column_letter(i)].width = w
    ws.row_dimensions[r].height = 30
    r += 1
    first = r
    n = 0
    for sec in sections:
        if sec[0]:
            ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=last)
            c = ws.cell(row=r, column=1, value=f"{sec[0]}  /  {sec[1]}")
            c.font = font(bold=True, color=NAVY, size=10)
            c.fill = fill(LIGHT)
            for cc in range(1, last + 1):
                ws.cell(row=r, column=cc).border = BORDER
            r += 1
        for en, ar in sec[2]:
            n += 1
            ws.cell(row=r, column=1, value=n).alignment = CENTER
            ws.cell(row=r, column=2, value=en).alignment = WRAP
            ca = ws.cell(row=r, column=3, value=ar)
            ca.alignment = Alignment(wrap_text=True, vertical="center", horizontal="right", readingOrder=2)
            for cc in range(1, last + 1):
                ws.cell(row=r, column=cc).border = BORDER
                ws.cell(row=r, column=cc).font = font(size=9)
            ws.cell(row=r, column=4).fill = fill(INPUT)
            ws.cell(row=r, column=4).alignment = CENTER
            ws.cell(row=r, column=5).fill = fill(INPUT)
            ws.cell(row=r, column=5).alignment = WRAP
            ws.row_dimensions[r].height = 30
            r += 1
    end = r - 1
    dv = DataValidation(type="list", formula1='"Yes,No,N/A"', allow_blank=True)
    ws.add_data_validation(dv)
    dv.add(f"D{first}:D{end}")
    ws.conditional_formatting.add(f"D{first}:D{end}", CellIsRule(operator="equal", formula=['"No"'], fill=fill("F8C1C0"), font=Font(bold=True, color="B71C1C")))
    ws.conditional_formatting.add(f"D{first}:D{end}", CellIsRule(operator="equal", formula=['"Yes"'], fill=fill("C8E6C9")))

    # Summary
    r += 1
    summ = [("Yes", f'=COUNTIF(D{first}:D{end},"Yes")'), ("No", f'=COUNTIF(D{first}:D{end},"No")'), ("N/A", f'=COUNTIF(D{first}:D{end},"N/A")'),
            ("Compliance % (Yes ÷ (Yes + No))", f'=IFERROR(D{r}/(D{r}+D{r + 1}),"")'),
            ("Result / النتيجة", f'=IF(D{r}+D{r + 1}=0,"",IF(D{r + 1}>0,"{result_no_en} – {result_no_ar}","Satisfactory – مُرضٍ"))')]
    sr = r
    for i, (lab, f) in enumerate(summ):
        rr = sr + i
        ws.merge_cells(start_row=rr, start_column=2, end_row=rr, end_column=3)
        lc = ws.cell(row=rr, column=2, value=lab)
        lc.font = font(bold=True, size=9, color=NAVY)
        lc.fill = fill(LIGHT)
        lc.alignment = Alignment(horizontal="right", vertical="center")
        if i == 4:
            ws.merge_cells(start_row=rr, start_column=4, end_row=rr, end_column=5)
        vc = ws.cell(row=rr, column=4, value=f)
        vc.font = font(bold=True)
        vc.alignment = CENTER
        if i == 3:
            vc.number_format = "0%"
        for cc in range(2, last + 1):
            ws.cell(row=rr, column=cc).border = BORDER
    ws.conditional_formatting.add(f"D{sr + 4}", FormulaRule(formula=[f"D{sr + 1}>0"], fill=fill("F8C1C0"), font=Font(bold=True, color="B71C1C")))
    ws.conditional_formatting.add(f"D{sr + 4}", FormulaRule(formula=[f"AND(D{sr + 1}=0,D{sr}>0)"], fill=fill("C8E6C9")))
    r = sr + 6
    r = signoff(ws, r, last, ["Inspected by / الفاحص", "Reviewed by / المراجع"], bounds=[(1, 2), (3, 3), (4, 5)], labels=["Role / الصفة", "Name / الاسم", "Signature & date / التوقيع والتاريخ"])
    footer(ws, r, last)
    print_setup(ws, landscape=False, title_rows=f"{head_row}:{head_row}")
    ws.freeze_panes = ws.cell(row=first, column=1)
    wb.save(path)
    return sr


# ---------------------------------------------------------------- fire extinguishers register
def extinguishers(path):
    wb = Workbook()
    ws = wb.active
    ws.title = "Monthly Inspection"
    cols = [("No.", "م", 5), ("Extinguisher ID", "رقم الطفاية", 13), ("Location", "الموقع", 20), ("Type", "النوع", 10), ("Size (kg / L)", "السعة", 9),
            ("Gauge in green", "المؤشر في الأخضر", 11), ("Pin & seal intact", "المسمار والختم سليمان", 11), ("Hose / nozzle OK", "الخرطوم سليم", 11), ("Body undamaged", "الجسم سليم", 11),
            ("Accessible & signed", "سهل الوصول وعليه لافتة", 12), ("Last service date", "تاريخ آخر صيانة", 12), ("Next service due", "موعد الصيانة القادمة", 12), ("Result", "النتيجة", 12), ("Remarks", "ملاحظات", 20)]
    last = len(cols)
    r = header(ws, "Fire Extinguisher Monthly Inspection", "الفحص الشهري لطفايات الحريق", last, "BS-CL-03")
    r = legend(ws, r, last, "Fill the yellow cells. Choose Yes / No for each check. 'Next service due' is 12 months after the last service. The result turns to 'Action required' if any check is No or the service is overdue. Row 1 is an example.",
               "املأ الخانات الصفراء. اختر Yes / No لكل فحص. موعد الصيانة القادمة بعد 12 شهرًا من آخر صيانة. تظهر النتيجة 'Action required' إذا كان أي فحص No أو تأخرت الصيانة. الصف الأول مثال.")
    r = info_block(ws, r, [("Project / site", "المشروع / الموقع"), ("Month", "الشهر"), ("Inspected by", "الفاحص"), ("Date", "التاريخ")], last)
    head_row = r
    r = table_head(ws, r, cols, height=50)
    first = r
    n_rows = 30
    for i in range(n_rows):
        rr = first + i
        ws.row_dimensions[rr].height = 22
        for c in range(1, last + 1):
            cell = ws.cell(row=rr, column=c)
            cell.border = BORDER
            cell.font = font(size=9, italic=(i == 0), color=GREY if i == 0 else "000000")
            cell.alignment = CENTER if c != 3 and c != 14 else WRAP
            if c not in (1, 12, 13):
                cell.fill = fill("FFF1E8" if i == 0 else INPUT)
        ws.cell(row=rr, column=1, value=i + 1)
        ws.cell(row=rr, column=11).number_format = "yyyy-mm-dd"
        ws.cell(row=rr, column=12, value=f'=IF(K{rr}="","",EDATE(K{rr},12))').number_format = "yyyy-mm-dd"
        ws.cell(row=rr, column=13, value=f'=IF(B{rr}="","",IF(OR(COUNTIF(F{rr}:J{rr},"No")>0,AND(L{rr}<>"",L{rr}<TODAY())),"Action required","OK"))')
    ex = ["EXT-001", "Ground floor – main entrance", "DCP", "6 kg", "Yes", "Yes", "Yes", "Yes", "Yes"]
    for c, v in enumerate(ex, start=2):
        ws.cell(row=first, column=c, value=v)
    from datetime import date
    ws.cell(row=first, column=11, value=date(2026, 6, 15))
    end = first + n_rows - 1
    yn = DataValidation(type="list", formula1='"Yes,No"', allow_blank=True)
    ws.add_data_validation(yn)
    yn.add(f"F{first}:J{end}")
    tp = DataValidation(type="list", formula1='"DCP,CO2,Foam,Water,Wet chemical"', allow_blank=True)
    ws.add_data_validation(tp)
    tp.add(f"D{first}:D{end}")
    ws.conditional_formatting.add(f"F{first}:J{end}", CellIsRule(operator="equal", formula=['"No"'], fill=fill("F8C1C0"), font=Font(bold=True, color="B71C1C")))
    ws.conditional_formatting.add(f"M{first}:M{end}", CellIsRule(operator="equal", formula=['"Action required"'], fill=fill("F8C1C0"), font=Font(bold=True, color="B71C1C")))
    ws.conditional_formatting.add(f"M{first}:M{end}", CellIsRule(operator="equal", formula=['"OK"'], fill=fill("C8E6C9")))
    ws.freeze_panes = ws.cell(row=first, column=3)
    r = signoff(ws, end + 2, last, ["Inspected by / الفاحص", "Reviewed by / المراجع"])
    footer(ws, r, last)
    print_setup(ws, landscape=True, title_rows=f"{head_row}:{head_row}")
    wb.save(path)


# ---------------------------------------------------------------- monthly statistics
def statistics(path):
    wb = Workbook()
    ws = wb.active
    ws.title = "Monthly HSE Statistics"
    cols = [("Month", "الشهر", 11), ("Man-hours", "ساعات العمل", 12), ("Cumulative man-hours", "ساعات العمل التراكمية", 14), ("Avg. workforce", "متوسط العمالة", 10),
            ("First aid (FAC)", "إسعافات أولية", 9), ("Medical treatment (MTC)", "علاج طبي", 10), ("Restricted work (RWC)", "عمل مقيّد", 10), ("Lost time injury (LTI)", "إصابة مضيعة للوقت", 10), ("Fatalities", "وفيات", 9),
            ("Lost days", "الأيام المفقودة", 9), ("Near misses", "حوادث وشيكة", 9), ("Property damage", "تلف ممتلكات", 9), ("Inspections", "عمليات التفتيش", 10), ("Training attendance", "حضور التدريب", 10),
            ("Recordables", "الحالات المسجّلة", 10), ("TRIR", "TRIR", 9), ("LTIFR", "LTIFR", 9), ("Severity rate", "معدل الخطورة", 10)]
    last = len(cols)
    r = header(ws, "Monthly HSE Statistics", "إحصائيات السلامة الشهرية", last, "BS-IR-04")
    r = legend(ws, r, last, "Fill the yellow cells each month. Recordables = MTC + RWC + LTI + fatalities. TRIR and severity rate use the 200,000-hour base, LTIFR the 1,000,000-hour base (change the bases in the yellow cells if your client uses others). January is an example.",
               "املأ الخانات الصفراء شهريًا. الحالات المسجّلة = علاج طبي + عمل مقيّد + إصابة مضيعة للوقت + وفيات. يُحسب TRIR ومعدل الخطورة على أساس 200,000 ساعة، وLTIFR على أساس 1,000,000 ساعة (غيّر الأساس في الخانات الصفراء إذا كان عميلك يستخدم غيره). شهر يناير مثال.")
    # Inputs
    inputs = [("Project", "المشروع", None), ("Year", "السنة", 2026), ("Base for TRIR & severity rate (hours)", "أساس TRIR ومعدل الخطورة (ساعة)", 200000), ("Base for LTIFR (hours)", "أساس LTIFR (ساعة)", 1000000)]
    base_cells = {}
    for en, ar, v in inputs:
        ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=4)
        lc = ws.cell(row=r, column=1, value=f"{en} / {ar}")
        lc.font = font(bold=True, size=9, color=NAVY)
        lc.fill = fill(LIGHT)
        ws.merge_cells(start_row=r, start_column=5, end_row=r, end_column=7)
        vc = ws.cell(row=r, column=5, value=v)
        vc.fill = fill(INPUT)
        vc.font = font(color="0000FF" if isinstance(v, int) else "000000")
        vc.alignment = CENTER
        if isinstance(v, int) and v > 10000:
            vc.number_format = "#,##0"
        for cc in range(1, 8):
            ws.cell(row=r, column=cc).border = BORDER
        base_cells[en] = f"$E${r}"
        r += 1
    trir_base = base_cells["Base for TRIR & severity rate (hours)"]
    ltifr_base = base_cells["Base for LTIFR (hours)"]
    ws[trir_base].comment = Comment("OSHA-style base: 200,000 hours ≈ 100 full-time workers for one year.", "BE SAFE")
    ws[ltifr_base].comment = Comment("Common international base: 1,000,000 hours.", "BE SAFE")
    r += 1
    head_row = r
    r = table_head(ws, r, cols, height=58)
    first = r
    months = [("Jan", "يناير"), ("Feb", "فبراير"), ("Mar", "مارس"), ("Apr", "أبريل"), ("May", "مايو"), ("Jun", "يونيو"), ("Jul", "يوليو"), ("Aug", "أغسطس"), ("Sep", "سبتمبر"), ("Oct", "أكتوبر"), ("Nov", "نوفمبر"), ("Dec", "ديسمبر")]
    example = [120000, None, 600, 2, 0, 0, 0, 0, 0, 8, 1, 220, 350]
    for i, (m, ma) in enumerate(months):
        rr = first + i
        ws.row_dimensions[rr].height = 20
        ws.cell(row=rr, column=1, value=f"{m} – {ma}").font = font(bold=True, size=9)
        for c in range(1, last + 1):
            cell = ws.cell(row=rr, column=c)
            cell.border = BORDER
            cell.alignment = CENTER
            if 2 <= c <= 14 and c != 3:
                cell.fill = fill("FFF1E8" if i == 0 else INPUT)
                cell.font = font(size=9, italic=i == 0, color="0000FF")
        ws.cell(row=rr, column=2).number_format = "#,##0"
        ws.cell(row=rr, column=3, value=f'=IF(B{rr}="","",SUM($B${first}:B{rr}))').number_format = "#,##0"
        ws.cell(row=rr, column=15, value=f'=IF(B{rr}="","",SUM(F{rr}:I{rr}))')
        ws.cell(row=rr, column=16, value=f'=IF(OR(B{rr}="",B{rr}=0),"",O{rr}*{trir_base}/B{rr})').number_format = "0.00"
        ws.cell(row=rr, column=17, value=f'=IF(OR(B{rr}="",B{rr}=0),"",H{rr}*{ltifr_base}/B{rr})').number_format = "0.00"
        ws.cell(row=rr, column=18, value=f'=IF(OR(B{rr}="",B{rr}=0),"",J{rr}*{trir_base}/B{rr})').number_format = "0.00"
        for c in (3, 15, 16, 17, 18):
            ws.cell(row=rr, column=c).font = font(size=9)
        if i == 0:
            for c, v in enumerate(example, start=2):
                if v is not None:
                    ws.cell(row=rr, column=c, value=v)
    end = first + 11
    tr = end + 1
    ws.cell(row=tr, column=1, value="Year to date\nحتى تاريخه")
    for c in range(1, last + 1):
        cell = ws.cell(row=tr, column=c)
        cell.fill = fill(NAVY)
        cell.font = font(bold=True, color="FFFFFF", size=9)
        cell.alignment = CENTER
        cell.border = BORDER
    ws.row_dimensions[tr].height = 30
    for c in [2] + list(range(5, 16)):
        L = get_column_letter(c)
        ws.cell(row=tr, column=c, value=f"=SUM({L}{first}:{L}{end})").number_format = "#,##0"
    ws.cell(row=tr, column=3, value=f"=B{tr}").number_format = "#,##0"
    ws.cell(row=tr, column=4, value=f'=IFERROR(AVERAGE(D{first}:D{end}),"")').number_format = "#,##0"
    ws.cell(row=tr, column=16, value=f'=IF(B{tr}=0,"",O{tr}*{trir_base}/B{tr})').number_format = "0.00"
    ws.cell(row=tr, column=17, value=f'=IF(B{tr}=0,"",H{tr}*{ltifr_base}/B{tr})').number_format = "0.00"
    ws.cell(row=tr, column=18, value=f'=IF(B{tr}=0,"",J{tr}*{trir_base}/B{tr})').number_format = "0.00"
    ws.freeze_panes = ws.cell(row=first, column=2)

    chart = LineChart()
    chart.title = "Monthly TRIR & LTIFR"
    chart.height, chart.width = 7.5, 22
    chart.y_axis.title = "Rate"
    data = Reference(ws, min_col=16, max_col=17, min_row=first, max_row=end)
    chart.add_data(data, titles_from_data=False)
    from openpyxl.chart.series import SeriesLabel
    chart.series[0].tx = SeriesLabel(v="TRIR")
    chart.series[1].tx = SeriesLabel(v="LTIFR")
    chart.set_categories(Reference(ws, min_col=1, min_row=first, max_row=end))
    ws.add_chart(chart, f"A{tr + 2}")
    r = tr + 18
    r = signoff(ws, r, last, ["Prepared by / إعداد", "Reviewed by / مراجعة"])
    footer(ws, r, last)
    print_setup(ws, landscape=True, title_rows=f"{head_row}:{head_row}")
    wb.save(path)


# ---------------------------------------------------------------- content
SCAFFOLD = [(None, None, [
    ("Erected by competent scaffolders; scaffold tag displayed and current", "تم التركيب بواسطة فنيين مؤهلين؛ بطاقة السقالة معلّقة وسارية"),
    ("Base plates and sole boards on firm, level ground", "قواعد ولوحات ارتكاز على أرض صلبة ومستوية"),
    ("Standards plumb, ledgers level, couplers tight", "القوائم رأسية، العوارض أفقية، الوصلات مشدودة"),
    ("Bracing (longitudinal and diagonal) in place", "التدعيم الطولي والقطري موجود"),
    ("Ties to the structure at the required intervals", "الربط بالمنشأ على المسافات المطلوبة"),
    ("Platforms fully boarded, no gaps, boards secured", "منصات العمل مغطاة بالكامل بدون فراغات والألواح مثبتة"),
    ("Top rail, mid rail and toe board on all open sides", "درابزين علوي ووسطي ولوح قدم على جميع الجوانب المفتوحة"),
    ("Safe access ladder, secured and 1 m above the platform", "سلم وصول آمن ومثبت ويرتفع 1 م فوق المنصة"),
    ("Not overloaded; materials evenly distributed", "غير محمّلة بأكثر من طاقتها؛ المواد موزعة بالتساوي"),
    ("Mobile scaffold: castors locked, height-to-base ratio within limits", "السقالة المتنقلة: العجلات مقفلة ونسبة الارتفاع للقاعدة ضمن الحدود"),
    ("Safe clearance from overhead power lines", "مسافة آمنة من خطوط الكهرباء العلوية"),
    ("No damaged tubes, fittings or boards", "لا توجد أنابيب أو وصلات أو ألواح تالفة"),
    ("Area below barricaded; debris netting where needed", "تطويق المنطقة أسفل السقالة؛ شبك حماية عند الحاجة"),
    ("Re-inspected after bad weather or any modification", "إعادة الفحص بعد سوء الأحوال الجوية أو أي تعديل"),
    ("Weekly inspection record up to date", "سجل الفحص الأسبوعي محدّث"),
])]
LIFTING = [(None, None, [
    ("Valid third-party inspection certificate for the crane / equipment", "شهادة فحص سارية من طرف ثالث للرافعة / المعدة"),
    ("Operator certified and competent for this equipment", "المشغّل معتمد ومؤهل لهذه المعدة"),
    ("Approved lifting plan (critical lift plan where required)", "خطة رفع معتمدة (خطة رفع حرجة عند الحاجة)"),
    ("Load chart in the cab; load within capacity at the working radius", "جدول الأحمال في الكابينة؛ الحمل ضمن السعة عند نصف قطر العمل"),
    ("Outriggers fully extended on pads / mats; ground conditions assessed", "المثبتات ممدودة بالكامل على قواعد؛ تم تقييم الأرض"),
    ("Limit switches, load moment indicator and anti-two-block working", "مفاتيح الحدود ومؤشر عزم الحمل ونظام منع التصادم تعمل"),
    ("Hooks have safety latches; no cracks or deformation", "الخطافات بها مزالج أمان؛ لا تشققات أو تشوهات"),
    ("Wire ropes free of kinks, broken wires and corrosion", "الحبال السلكية خالية من الالتواء والأسلاك المقطوعة والصدأ"),
    ("Slings, shackles and accessories inspected, colour-coded, SWL marked", "الأحزمة والشناكل والملحقات مفحوصة وملونة ومعلّم عليها الحمل الآمن"),
    ("Rigger and signalman certified and identified", "المُربّط والمُؤشّر معتمدان ومعروفان"),
    ("Exclusion zone barricaded; tag lines used", "تطويق منطقة الرفع؛ استخدام حبال التوجيه"),
    ("Wind speed within manufacturer limits", "سرعة الرياح ضمن حدود الشركة المصنعة"),
    ("Safe clearance from overhead power lines", "مسافة آمنة من خطوط الكهرباء العلوية"),
    ("Horn, lights, alarms and fire extinguisher working", "البوق والأضواء والإنذارات وطفاية الحريق تعمل"),
    ("Daily pre-use inspection completed", "اكتمل الفحص اليومي قبل الاستخدام"),
])]
ELECTRICAL = [(None, None, [
    ("Tool inspected and colour-coded / tagged for the current period", "الأداة مفحوصة وعليها لون / بطاقة الفترة الحالية"),
    ("Casing not cracked or damaged", "الغلاف غير مشقوق أو تالف"),
    ("Cable insulation intact; no joints or tape repairs", "عزل الكابل سليم؛ لا توصيلات أو إصلاحات بالشريط"),
    ("Plug undamaged, correct type, earth pin intact", "القابس سليم ومن النوع الصحيح وطرف التأريض سليم"),
    ("Cable grip / strain relief secure", "مثبت الكابل محكم"),
    ("Guards in place and working", "الحواجز الواقية موجودة وتعمل"),
    ("Switch and trigger work properly", "المفتاح والزناد يعملان بشكل صحيح"),
    ("Double insulated or properly earthed", "معزولة عزلًا مزدوجًا أو مؤرّضة بشكل صحيح"),
    ("Used with an RCD / ELCB (30 mA)", "تُستخدم مع قاطع تسرب أرضي (30 ملي أمبير)"),
    ("Extension leads industrial grade, not daisy-chained", "وصلات التمديد صناعية وغير موصولة ببعضها"),
    ("Cables routed to avoid tripping and damage", "تمديد الكابلات بطريقة تمنع التعثر والتلف"),
    ("Suitable for wet or hazardous areas where used there", "مناسبة للأماكن الرطبة أو الخطرة عند استخدامها فيها"),
])]
GENERAL = [
    ("Housekeeping", "النظافة والترتيب", [("Work areas clean and tidy; waste removed regularly", "مناطق العمل نظيفة ومرتبة؛ إزالة المخلفات بانتظام"), ("Materials stored safely and stacked securely", "تخزين المواد بأمان ورصّها بثبات")]),
    ("Access & walkways", "الممرات والوصول", [("Walkways and emergency routes clear and marked", "الممرات ومخارج الطوارئ خالية ومعلّمة"), ("Adequate lighting in work areas and walkways", "إضاءة كافية في مناطق العمل والممرات")]),
    ("PPE", "معدات الوقاية الشخصية", [("All workers wear the required PPE", "جميع العمال يرتدون معدات الوقاية المطلوبة"), ("PPE in good condition", "معدات الوقاية بحالة جيدة")]),
    ("Work at height", "العمل على المرتفعات", [("Scaffolds tagged; edges and openings protected", "السقالات عليها بطاقات؛ الحواف والفتحات محمية"), ("Harnesses used and tied off where required", "استخدام أحزمة الأمان وربطها عند الحاجة")]),
    ("Excavations", "الحفريات", [("Excavations barricaded, supported and with safe access", "الحفريات مطوّقة ومدعّمة ولها وسيلة وصول آمنة")]),
    ("Electrical", "الكهرباء", [("Distribution boards closed, labelled and with RCDs", "لوحات التوزيع مغلقة ومعلّمة وبها قواطع تسرب"), ("Cables and tools in good condition and tagged", "الكابلات والأدوات بحالة جيدة وعليها بطاقات")]),
    ("Fire safety", "السلامة من الحريق", [("Fire extinguishers available, accessible and inspected", "طفايات الحريق متوفرة وسهلة الوصول ومفحوصة"), ("Flammables stored correctly; no smoking rules followed", "تخزين المواد القابلة للاشتعال بشكل صحيح؛ الالتزام بمنع التدخين")]),
    ("Plant & vehicles", "المعدات والمركبات", [("Equipment certified and inspected; operators licensed", "المعدات معتمدة ومفحوصة؛ المشغّلون مرخّصون"), ("Banksmen used; traffic routes separated from pedestrians", "استخدام مؤشّرين؛ فصل مسارات المركبات عن المشاة")]),
    ("Permits & documents", "التصاريح والمستندات", [("Valid permits displayed at the work location", "التصاريح السارية معلّقة في موقع العمل"), ("JSA / risk assessment available and briefed", "تحليل سلامة المهام / تقييم المخاطر متوفر وتم شرحه")]),
    ("Welfare & first aid", "الرعاية والإسعافات الأولية", [("Drinking water, shade and rest areas available (heat stress)", "توفر مياه الشرب والظل وأماكن الراحة (الإجهاد الحراري)"), ("First aid kit stocked; first aider available", "حقيبة إسعافات مكتملة؛ مسعف متوفر")]),
    ("Signage & barricades", "اللافتات والحواجز", [("Safety signs and barricades in place and in good condition", "اللافتات التحذيرية والحواجز موجودة وبحالة جيدة")]),
]


def main():
    os.makedirs(OUT, exist_ok=True)
    risk_register(os.path.join(OUT, "BE-SAFE_Risk-Assessment-Register.xlsx"))
    risk_matrix(os.path.join(OUT, "BE-SAFE_Risk-Matrix-5x5.xlsx"))
    checklist(os.path.join(OUT, "BE-SAFE_Checklist_Scaffolding.xlsx"), "BS-CL-01", "Scaffolding Inspection Checklist", "قائمة فحص السقالات",
              [("Scaffold ID / tag No.", "رقم / بطاقة السقالة"), ("Location", "الموقع"), ("Type (fixed / mobile)", "النوع (ثابتة / متنقلة)"), ("Max. load / duty class", "الحمل الأقصى / الفئة"), ("Inspected by", "الفاحص"), ("Date", "التاريخ")],
              SCAFFOLD, "Do not use – red tag", "ممنوع الاستخدام – بطاقة حمراء")
    checklist(os.path.join(OUT, "BE-SAFE_Checklist_Lifting-Equipment.xlsx"), "BS-CL-02", "Lifting Equipment & Crane Inspection Checklist", "قائمة فحص معدات الرفع والرافعات",
              [("Equipment type", "نوع المعدة"), ("ID / plate No.", "الرقم / اللوحة"), ("Capacity (SWL)", "السعة (الحمل الآمن)"), ("Certificate No. & expiry", "رقم الشهادة وتاريخ انتهائها"), ("Operator & licence No.", "المشغّل ورقم الرخصة"), ("Date", "التاريخ")],
              LIFTING, "Do not use – action required", "ممنوع الاستخدام – يلزم إجراء")
    extinguishers(os.path.join(OUT, "BE-SAFE_Fire-Extinguisher-Inspection.xlsx"))
    checklist(os.path.join(OUT, "BE-SAFE_Checklist_Electrical-Tools.xlsx"), "BS-CL-04", "Portable Electrical Tools Inspection Checklist", "قائمة فحص الأدوات الكهربائية المحمولة",
              [("Tool type", "نوع الأداة"), ("Tool ID / serial No.", "رقم الأداة / الرقم التسلسلي"), ("Owner / contractor", "المالك / المقاول"), ("Location", "الموقع"), ("Inspected by", "الفاحص"), ("Date", "التاريخ")],
              ELECTRICAL, "Remove from use – red tag", "إيقاف الاستخدام – بطاقة حمراء")
    checklist(os.path.join(OUT, "BE-SAFE_Checklist_General-Site-Inspection.xlsx"), "BS-CL-05", "General Site Safety Inspection", "التفتيش العام على سلامة الموقع",
              [("Project / site", "المشروع / الموقع"), ("Area inspected", "المنطقة"), ("Contractor", "المقاول"), ("Weather", "الطقس"), ("Inspected by", "الفاحص"), ("Date", "التاريخ")],
              GENERAL, "Action required", "يلزم إجراء")
    statistics(os.path.join(OUT, "BE-SAFE_Monthly-HSE-Statistics.xlsx"))
    print("done")


main()
