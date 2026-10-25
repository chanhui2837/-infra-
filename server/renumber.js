// 순번(seq) 재정렬: 현재 순서(seq → 등록순)를 유지한 채 1..N 으로 다시 매긴다.
export async function renumber(Model) {
  const docs = await Model.find({}, { _id: 1, seq: 1 }).sort({ seq: 1, createdAt: 1, _id: 1 }).lean();
  const ops = [];
  docs.forEach((d, i) => {
    if (d.seq !== i + 1) {
      ops.push({ updateOne: { filter: { _id: d._id }, update: { $set: { seq: i + 1 } } } });
    }
  });
  if (ops.length) await Model.bulkWrite(ops);
  return ops.length;
}
