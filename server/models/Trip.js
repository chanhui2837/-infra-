import mongoose from 'mongoose';

const visitSchema = new mongoose.Schema(
  {
    responder: { type: String, default: '' },
    date: { type: String, default: '' },
    note: { type: String, default: '' },
  },
  { _id: false }
);

// 차단기 트립 진행 내역 (엑셀 2번 시트)
const tripSchema = new mongoose.Schema(
  {
    seq: { type: Number },
    region: { type: String, default: '', index: true },
    facilityCode: { type: String, default: '' },
    siteName: { type: String, default: '' },
    occurredDate: { type: String, default: '' },
    manager: { type: String, default: '' },
    breakerType: { type: String, default: '' },
    breakerLocation: { type: String, default: '' },
    occurCount: { type: String, default: '' },
    breakerStatus: { type: String, default: '' },
    insulationResistance: { type: String, default: '' },
    inspectProgress: { type: String, default: '' },
    defectCause: { type: String, default: '' },
    actionResult: { type: String, default: '' },
    keyMission: { type: String, default: '' },
    actionDate: { type: String, default: '' },
    actionBy: { type: String, default: '' },
    actionNote: { type: String, default: '' },
    etcNote: { type: String, default: '' },
    spd: { type: String, default: '' },
    acta: { type: String, default: '' },
    visits: { type: [visitSchema], default: [] },
    // 차단기 교체 시 교체 전/후 사진
    beforePhotos: { type: [mongoose.Schema.Types.ObjectId], ref: 'Photo', default: [] },
    afterPhotos: { type: [mongoose.Schema.Types.ObjectId], ref: 'Photo', default: [] },
    createdBy: { type: String, default: '' },
    updatedBy: { type: String, default: '' },
  },
  { timestamps: true }
);

export const TRIP_COMPLETED_VALUES = ['완료'];

export default mongoose.model('Trip', tripSchema);
