import mongoose from 'mongoose';

// 사번(N + 숫자 7자리) 규칙
export const NNUMBER_REGEX = /^N\d{7}$/;

const userSchema = new mongoose.Schema(
  {
    nnumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      match: [NNUMBER_REGEX, '사번은 N + 숫자 7자리 형식이어야 합니다. (예: N1101924)'],
    },
    name: { type: String, required: true, trim: true },
    // 가입 승인 상태 (기존 가입자는 필드가 없으므로 기본값 approved 로 처리)
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved', index: true },
    requestedAt: { type: Date },
    decidedAt: { type: Date },
    decidedBy: { type: String, default: '' },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id,
    nnumber: this.nnumber,
    name: this.name,
    status: this.status,
    createdAt: this.createdAt,
    lastLoginAt: this.lastLoginAt,
  };
};

export default mongoose.model('User', userSchema);
