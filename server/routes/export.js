import { Router } from 'express';
import ExcelJS from 'exceljs';
import Trip from '../models/Trip.js';
import Revision from '../models/Revision.js';
import { summarize } from './summary.js';

const router = Router();

/* ---------- 컬럼 정의 ---------- */

const TRIP_COLUMNS = [
  { label: '순번', key: 'seq', width: 7 },
  { label: '지역', key: 'region', width: 9 },
  { label: '통합시설코드', key: 'facilityCode', width: 18 },
  { label: '국소명', key: 'siteName', width: 46 },
  { label: '발생일자', key: 'occurredDate', width: 12 },
  { label: '담당자', key: 'manager', width: 10 },
  { label: '차단기 타입', key: 'breakerType', width: 14 },
  { label: '트립 차단기 위치', key: 'breakerLocation', width: 20 },
  { label: '발생건수', key: 'occurCount', width: 10 },
  { label: '차단기 상태', key: 'breakerStatus', width: 14 },
  { label: '절연저항', key: 'insulationResistance', width: 12 },
  { label: '점검진행', key: 'inspectProgress', width: 12 },
  { label: '불량원인', key: 'defectCause', width: 16 },
  { label: '조치결과', key: 'actionResult', width: 12 },
  { label: 'KEY MISSION 대상', key: 'keyMission', width: 16 },
  { label: '조치 날짜', key: 'actionDate', width: 12 },
  { label: '조치자', key: 'actionBy', width: 12 },
  { label: '조치내역', key: 'actionNote', width: 40 },
  { label: '기타 내역', key: 'etcNote', width: 30 },
  { label: 'SPD 설치 유무', key: 'spd', width: 14 },
  { label: 'ACTA 등록 여부', key: 'acta', width: 14 },
  { label: '교체 전 사진', key: 'beforePhotos', width: 12 },
  { label: '교체 전 사진 링크', key: 'beforePhotoLinks', width: 46 },
  { label: '교체 후 사진', key: 'afterPhotos', width: 12 },
  { label: '교체 후 사진 링크', key: 'afterPhotoLinks', width: 46 },
  { label: '방문/대응 이력', key: 'visits', width: 46 },
  { label: '최종 수정자', key: 'updatedBy', width: 12 },
  { label: '최종 수정일', key: 'updatedAt', width: 20 },
];

const REVISION_COLUMNS = [
  { label: '순번', key: 'seq', width: 7 },
  { label: '지역', key: 'region', width: 9 },
  { label: '통합시설코드', key: 'facilityCode', width: 18 },
  { label: '국소명', key: 'siteName', width: 46 },
  { label: '날짜', key: 'date', width: 12 },
  { label: '대응자', key: 'manager', width: 12 },
  { label: '완료유무', key: 'done', width: 12 },
  { label: '작업자', key: 'worker', width: 20 },
  { label: '조치 날짜', key: 'actionDate', width: 12 },
  { label: '비고', key: 'note', width: 40 },
  { label: '작업 사진', key: 'photos', width: 12 },
  { label: '작업 사진 링크', key: 'photoLinks', width: 46 },
  { label: '최종 수정자', key: 'updatedBy', width: 12 },
  { label: '최종 수정일', key: 'updatedAt', width: 20 },
];

/* ---------- 값 변환 ---------- */

function photoLinks(ids, base) {
  return (ids || []).map((id) => `${base}/api/photos/${id}`).join('\n');
}

function fmt(item, key, base) {
  switch (key) {
    case 'beforePhotoLinks':
      return photoLinks(item.beforePhotos, base);
    case 'afterPhotoLinks':
      return photoLinks(item.afterPhotos, base);
    case 'photoLinks':
      return photoLinks(item.photos, base);
    case 'beforePhotos':
    case 'afterPhotos':
    case 'photos':
      return `${(item[key] || []).length}장`;
    case 'visits':
      return (item.visits || [])
        .map((v) => [v.responder, v.date, v.note].filter(Boolean).join(' · '))
        .join('\n');
    case 'updatedAt':
      return item.updatedAt ? new Date(item.updatedAt).toLocaleString('ko-KR') : '';
    default: {
      const v = item[key];
      return v === undefined || v === null ? '' : v;
    }
  }
}

/* ---------- 시트 생성 ---------- */

function addDataSheet(wb, name, columns, items, base) {
  const ws = wb.addWorksheet(name, { views: [{ state: 'frozen', ySplit: 1 }] });
  ws.columns = columns.map((c) => ({ header: c.label, key: c.key, width: c.width }));

  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: 'FF1B1F2A' } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F3F8' } };
  header.alignment = { vertical: 'middle' };
  header.height = 22;

  for (const it of items) {
    const row = ws.addRow(Object.fromEntries(columns.map((c) => [c.key, fmt(it, c.key, base)])));
    row.alignment = { vertical: 'top', wrapText: true };
  }

  if (items.length) {
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };
  }
  return ws;
}

function addSummarySheet(wb, trips, revisions) {
  const ws = wb.addWorksheet('실적 총괄', { views: [{ showGridLines: false }] });
  ws.columns = [
    { width: 24 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
  ];

  let r = 1;
  ws.mergeCells(r, 1, r, 5);
  const title = ws.getCell(r, 1);
  title.value = '춘천품질개선팀 Infra 설비개선 진행 실적 총괄';
  title.font = { bold: true, size: 14 };
  r += 2;

  const blocks = [
    { name: '차단기 트립 (엑셀 2번 시트)', data: summarize(trips, 'actionResult'), accent: 'FFEA002C' },
    { name: 'DORS415 정류기 리비전 (엑셀 3번 시트)', data: summarize(revisions, 'done'), accent: 'FFF58220' },
  ];

  for (const b of blocks) {
    const d = b.data;

    // 업무 제목
    ws.mergeCells(r, 1, r, 5);
    const head = ws.getCell(r, 1);
    head.value = b.name;
    head.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    head.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: b.accent } };
    head.alignment = { vertical: 'middle' };
    ws.getRow(r).height = 22;
    r += 1;

    // 합계 요약
    ws.getCell(r, 1).value = '합계';
    ws.getCell(r, 1).font = { bold: true };
    ws.mergeCells(r, 2, r, 5);
    ws.getCell(r, 2).value =
      `총 대상 ${d.total}  |  완료 ${d.done}  |  미완료 ${d.pending}  |  조치율 ${(d.rate * 100).toFixed(1)}%`;
    r += 1;

    // 지역별 표 헤더
    const tableHead = ['지역', '대상', '완료', '미완료', '조치율'];
    tableHead.forEach((t, i) => {
      const c = ws.getCell(r, i + 1);
      c.value = t;
      c.font = { bold: true, color: { argb: 'FF3A4152' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7F9FC' } };
      c.alignment = { horizontal: i === 0 ? 'left' : 'right' };
    });
    r += 1;

    // 지역별 데이터
    for (const reg of d.regions) {
      const cells = [
        reg.region,
        reg.total,
        reg.done,
        reg.pending,
        reg.total ? `${(reg.rate * 100).toFixed(1)}%` : '-',
      ];
      cells.forEach((v, i) => {
        const c = ws.getCell(r, i + 1);
        c.value = v;
        c.alignment = { horizontal: i === 0 ? 'left' : 'right' };
      });
      r += 1;
    }

    // 합계 행
    const totalCells = ['합계', d.total, d.done, d.pending, `${(d.rate * 100).toFixed(1)}%`];
    totalCells.forEach((v, i) => {
      const c = ws.getCell(r, i + 1);
      c.value = v;
      c.font = { bold: true };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7F9FC' } };
      c.alignment = { horizontal: i === 0 ? 'left' : 'right' };
    });
    r += 2;
  }

  // 안내 문구
  const note = ws.getCell(r, 1);
  note.value = `내보낸 시각: ${new Date().toLocaleString('ko-KR')}`;
  note.font = { size: 10, color: { argb: 'FF7A8598' } };

  return ws;
}

/* ---------- 라우트 ---------- */

router.get('/', async (req, res) => {
  try {
    const [trips, revisions] = await Promise.all([
      Trip.find().sort({ seq: 1, createdAt: 1 }).lean(),
      Revision.find().sort({ seq: 1, createdAt: 1 }).lean(),
    ]);

    const base = `${req.protocol}://${req.get('host')}`;
    const wb = new ExcelJS.Workbook();
    wb.creator = '춘천품질개선팀 Infra 진행관리';
    wb.created = new Date();

    addSummarySheet(wb, trips, revisions);
    addDataSheet(wb, '차단기 트립 진행 내역', TRIP_COLUMNS, trips, base);
    addDataSheet(wb, 'DORS415 리비전 진행 내역', REVISION_COLUMNS, revisions, base);

    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `Infra_진행내역_${stamp}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="infra-progress-${stamp}.xlsx"; filename*=UTF-8''${encodeURIComponent(filename)}`
    );

    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('[export] 실패:', err);
    if (!res.headersSent) res.status(500).json({ error: err.message });
    else res.end();
  }
});

export default router;
