import mongoose from 'mongoose'

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      index: true,
    },
    entityType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      index: true,
    },
    entityId: {
      type: String,
      default: null,
      trim: true,
      maxlength: 100,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
    status: {
      type: String,
      enum: ['success', 'failure'],
      required: true,
      default: 'success',
      index: true,
    },
    ipAddress: {
      type: String,
      default: null,
      trim: true,
      maxlength: 64,
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
    versionKey: false,
  },
)

auditLogSchema.index({ createdAt: -1 })
auditLogSchema.index({ action: 1, status: 1, createdAt: -1 })

const AuditLog = mongoose.model('AuditLog', auditLogSchema)

export default AuditLog
