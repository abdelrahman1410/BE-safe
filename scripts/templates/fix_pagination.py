"""Improve page breaks in the generated Word templates.

Adds "keep with next" so that:
- navy section bars stay on the same page as the content below them;
- short tables (up to 9 rows) are never split across pages;
- long tables keep their header with the first rows, and their last rows together;
- note text directly above a table stays with that table.

Usage: python3 fix_pagination.py file1.docx [file2.docx ...]
"""
import re
import sys
import zipfile

KEEP = "<w:keepNext/>"
SECTION_FILL = 'w:fill="0B1F3A"'
SHORT_TABLE = 9


def keep_paragraphs(xml):
    """Add keepNext to every paragraph in an XML fragment."""
    def add(m):
        p = m.group(0)
        if KEEP in p:
            return p
        if "<w:pPr>" in p:
            if "<w:pStyle " in p:
                return re.sub(r"(<w:pStyle [^>]*/>)", r"\1" + KEEP, p, count=1)
            return p.replace("<w:pPr>", "<w:pPr>" + KEEP, 1)
        return re.sub(r"^(<w:p(?: [^>]*)?>)", r"\1<w:pPr>" + KEEP + "</w:pPr>", p, count=1)
    return re.sub(r"<w:p(?: [^>]*)?>.*?</w:p>", add, xml, flags=re.S)


def is_section_bar(tbl):
    return len(re.findall(r"<w:tr[ >]", tbl)) == 1 and SECTION_FILL in tbl


def fix_table(tbl):
    rows = re.findall(r"<w:tr(?: [^>]*)?>.*?</w:tr>", tbl, flags=re.S)
    n = len(rows)
    if n == 1:
        if SECTION_FILL in rows[0]:
            keep = {0}
        else:
            return tbl
    elif n <= SHORT_TABLE:
        keep = set(range(n - 1))
    else:
        keep = {0, 1, 2} | {n - 3, n - 2}
    out = tbl
    for i, r in enumerate(rows):
        if i in keep:
            out = out.replace(r, keep_paragraphs(r), 1)
    return out


def fix_document(xml):
    body_start = xml.index("<w:body>") + len("<w:body>")
    body_end = xml.rindex("<w:sectPr")
    body = xml[body_start:body_end]
    parts = re.findall(r"<w:tbl>.*?</w:tbl>|<w:p(?: [^>]*)?/>|<w:p(?: [^>]*)?>.*?</w:p>", body, flags=re.S)
    assert "".join(parts) == body, "unexpected body structure"
    for i, part in enumerate(parts):
        if part.startswith("<w:tbl>"):
            parts[i] = fix_table(part)
            # keep non-empty paragraphs directly above this table with it
            j = i - 1
            while j >= 0 and parts[j].startswith("<w:p") and re.search(r"<w:t[ >]", parts[j]):
                parts[j] = keep_paragraphs(parts[j])
                j -= 1
    # a short table followed (after empty spacer paragraphs) by another table of the
    # same section stays with it, e.g. the closure options and the closure signatures
    for i, part in enumerate(parts):
        if not part.startswith("<w:tbl>"):
            continue
        j = i + 1
        while j < len(parts) and parts[j].startswith("<w:p") and not re.search(r"<w:t[ >]", parts[j]):
            j += 1
        nxt = parts[j] if j < len(parts) else ""
        n_rows = len(re.findall(r"<w:tr[ >]", part))
        if nxt.startswith("<w:tbl>") and not is_section_bar(nxt) and not is_section_bar(part) and n_rows <= SHORT_TABLE:
            parts[i] = keep_paragraphs(part)
            for k in range(i + 1, j):
                parts[k] = keep_paragraphs(parts[k])
    return xml[:body_start] + "".join(parts) + xml[body_end:]


def fix_file(path):
    with zipfile.ZipFile(path) as z:
        items = [(i, z.read(i.filename)) for i in z.infolist()]
    out = []
    for info, data in items:
        if info.filename == "word/document.xml":
            data = fix_document(data.decode("utf-8")).encode("utf-8")
        out.append((info, data))
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        for info, data in out:
            if info.filename.endswith("/"):
                continue
            z.writestr(info, data)


if __name__ == "__main__":
    for f in sys.argv[1:]:
        fix_file(f)
        print("fixed", f)
