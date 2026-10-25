# -*- coding: utf-8 -*-
"""엑셀(춘천품질개선팀 Infra설비 개선 등 진행내역) -> JSON 변환 스크립트.

외부 라이브러리 없이 xlsx(zip+xml)를 직접 파싱하여 server/data/*.json 생성.
"""
import zipfile, glob, os, json, re, sys
from datetime import datetime, timedelta
from xml.etree import ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, 'server', 'data')
NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'

files = glob.glob(os.path.join(ROOT, '*.xlsx'))
if not files:
    print('xlsx 파일을 찾을 수 없습니다.'); sys.exit(1)
xlsx_path = files[0]
print('원본 파일:', os.path.basename(xlsx_path))

z = zipfile.ZipFile(xlsx_path)

# ---- shared strings ----
shared = []
if 'xl/sharedStrings.xml' in z.namelist():
    root = ET.fromstring(z.read('xl/sharedStrings.xml'))
    for si in root.findall('{%s}si' % NS):
        shared.append(''.join(t.text or '' for t in si.iter('{%s}t' % NS)))

# ---- workbook sheets ----
wb = ET.fromstring(z.read('xl/workbook.xml'))
rels = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
relmap = {r.get('Id'): r.get('Target') for r in rels}

sheets = []
for s in wb.iter('{%s}sheet' % NS):
    rid = s.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
    target = relmap.get(rid, '')
    if target and not target.startswith('xl/'):
        target = 'xl/' + target.lstrip('/')
    sheets.append((s.get('name'), target))

def col_idx(ref):
    m = re.match(r'([A-Z]+)(\d+)', ref)
    col = m.group(1); row = int(m.group(2))
    c = 0
    for ch in col:
        c = c * 26 + (ord(ch) - 64)
    return c - 1, row

def read_sheet(target):
    """returns dict {row_number: {col_index: value}}"""
    try:
        sroot = ET.fromstring(z.read(target))
    except KeyError:
        return {}
    rows = {}
    for row in sroot.iter('{%s}row' % NS):
        rnum = int(row.get('r'))
        cells = {}
        for c in row.findall('{%s}c' % NS):
            ref = c.get('r'); t = c.get('t')
            v = c.find('{%s}v' % NS)
            isv = c.find('{%s}is' % NS)
            val = ''
            if t == 's' and v is not None:
                val = shared[int(v.text)]
            elif t == 'inlineStr' and isv is not None:
                val = ''.join(x.text or '' for x in isv.iter('{%s}t' % NS))
            elif v is not None:
                val = v.text
            if val not in (None, ''):
                ci, _ = col_idx(ref)
                cells[ci] = str(val).strip()
        if cells:
            rows[rnum] = cells
    return rows

def to_date(val):
    """엑셀 시리얼 숫자 또는 문자열 날짜 -> 'YYYY-MM-DD'."""
    if val is None:
        return ''
    val = str(val).strip()
    if not val:
        return ''
    if re.fullmatch(r'\d{5}(\.\d+)?', val):
        try:
            d = datetime(1899, 12, 30) + timedelta(days=float(val))
            return d.strftime('%Y-%m-%d')
        except Exception:
            return val
    s = val.replace('.', '-').replace('/', '-')
    m = re.fullmatch(r'(\d{4})-(\d{1,2})-(\d{1,2})', s)
    if m:
        return '%04d-%02d-%02d' % (int(m.group(1)), int(m.group(2)), int(m.group(3)))
    return val

def cell(cells, i):
    return (cells.get(i) or '').strip()

# =========================================================
# 1) 차단기 트립 진행 내역  (header row = 3, data from row 4)
# =========================================================
trip_rows = read_sheet(dict(sheets)['차단기 트립 진행 내역'])
trips = []
for rnum in sorted(trip_rows):
    if rnum < 4:
        continue
    c = trip_rows[rnum]
    sn = cell(c, 0)
    if not sn.isdigit():
        continue
    visits = []
    col = 22  # 0-index: col23 -> index22
    while col in c or (col + 1) in c or (col + 2) in c:
        if not (cell(c, col) or cell(c, col + 1) or cell(c, col + 2)):
            col += 3
            if col > 60:
                break
            continue
        visits.append({
            'responder': cell(c, col),
            'date': to_date(cell(c, col + 1)),
            'note': cell(c, col + 2),
        })
        col += 3
        if col > 60:
            break
    trips.append({
        'seq': int(sn),
        'region': cell(c, 1),
        'facilityCode': cell(c, 2),
        'siteName': cell(c, 3),
        'occurredDate': to_date(cell(c, 5)),
        'manager': cell(c, 6),
        'breakerType': cell(c, 7),
        'breakerLocation': cell(c, 8),
        'occurCount': cell(c, 9),
        'breakerStatus': cell(c, 10),
        'insulationResistance': cell(c, 11),
        'inspectProgress': cell(c, 12),
        'defectCause': cell(c, 13),
        'actionResult': cell(c, 14),
        'keyMission': cell(c, 15),
        'actionDate': to_date(cell(c, 16)),
        'actionBy': cell(c, 17),
        'actionNote': cell(c, 18),
        'etcNote': cell(c, 19),
        'spd': cell(c, 20),
        'acta': cell(c, 21),
        'visits': visits,
    })

# =========================================================
# 2) DORS415 리비전 미완료 진행 내역 (header row = 3, data from row 4)
# =========================================================
rev_rows = read_sheet(dict(sheets)['DORS415 리비전 미완료 진행 내역'])
revisions = []
for rnum in sorted(rev_rows):
    if rnum < 4:
        continue
    c = rev_rows[rnum]
    sn = cell(c, 0)
    if not sn.isdigit():
        continue
    revisions.append({
        'seq': int(sn),
        'region': cell(c, 1),
        'facilityCode': cell(c, 2),
        'siteName': cell(c, 3),
        'date': to_date(cell(c, 4)),
        'manager': cell(c, 5),
        'done': cell(c, 6),
        'worker': cell(c, 7),
        'actionDate': to_date(cell(c, 8)),
    })

# =========================================================
# 3) 총괄 시트의 특이사항 텍스트
# =========================================================
sum_rows = read_sheet(dict(sheets)['총괄'])
notes = []
for rnum in sorted(sum_rows):
    for ci in sorted(sum_rows[rnum]):
        for ln in str(sum_rows[rnum][ci]).split('\n'):
            ln = ln.strip()
            if re.match(r'^\d+\.\s', ln) and ln not in notes:
                notes.append(ln)

os.makedirs(OUT_DIR, exist_ok=True)

def dump(name, obj):
    p = os.path.join(OUT_DIR, name)
    with open(p, 'w', encoding='utf-8') as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)
    print('생성:', os.path.relpath(p, ROOT), '(', len(obj) if isinstance(obj, list) else 'obj', ')')

dump('trips.json', trips)
dump('revisions.json', revisions)
dump('notes.json', notes)

# 임베디드 이미지 추출
media = [n for n in z.namelist() if 'media/' in n]
img_dir = os.path.join(OUT_DIR, 'excel-images')
os.makedirs(img_dir, exist_ok=True)
img_list = []
for n in media:
    data = z.read(n)
    fn = os.path.basename(n)
    with open(os.path.join(img_dir, fn), 'wb') as f:
        f.write(data)
    img_list.append({'file': fn, 'size': len(data)})
with open(os.path.join(OUT_DIR, 'excel-images.json'), 'w', encoding='utf-8') as f:
    json.dump(img_list, f, ensure_ascii=False, indent=1)
print('엑셀 내 이미지:', img_list if img_list else '없음')
print('완료')
