import mongoose from 'mongoose';

// 업로드 사진 메타데이터 (실제 바이너리는 GridFS 에 저장)
const photoSchema = new mongoose.Schema(
  {
    filename: { type: String, default: '' },
    contentType: { type: String, default: '' },
    size: { type: Number, default: 0 },
    gridfsId: { type: mongoose.Schema.Types.ObjectId, required: true },
    uploadedBy: { type: String, default: '' },
    uploadedByName: { type: String, default: '' },
    source: { type: String, default: 'upload' }, // upload | excel
  },
  { timestamps: true }
);

photoSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id,
    filename: this.filename,
    contentType: this.contentType,
    size: this.size,
    url: `/api/photos/${this._id}`,
    uploadedByName: this.uploadedByName,
    createdAt: this.createdAt,
  };
};

export default mongoose.model('Photo', photoSchema);
