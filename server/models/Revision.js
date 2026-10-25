import mongoose from 'mongoose';

// DORS415 정류기 리비전 진행 내역 (엑셀 3번 시트)
const revisionSchema = new mongoose.Schema(
  {
    seq: { type: Number },
    region: { type: String, default: '', index: true },
    facilityCode: { type: String, default: '' },
    siteName: { type: String, default: '' },
    date: { type: String, default: '' },
    manager: { type: String, default: '' },
    done: { type: String, default: '' },
    worker: { type: String, default: '' },
    actionDate: { type: String, default: '' },
    note: { type: String, default: '' },
    photos: { type: [mongoose.Schema.Types.ObjectId], ref: 'Photo', default: [] },
    createdBy: { type: String, default: '' },
    updatedBy: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('Revision', revisionSchema);
