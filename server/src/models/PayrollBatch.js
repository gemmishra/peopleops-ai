import mongoose from 'mongoose'
import { BATCH_STATUSES } from '../utils/payrollConstants.js'

const validationErrorSchema = new mongoose.Schema(
  {
    rowNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    employeeId: {
      type: String,
      trim: true,
      default: null,
    },
    field: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
  },
)

const payrollBatchSchema = new mongoose.Schema(
  {
    originalFileName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: BATCH_STATUSES,
      default: 'processing',
      required: true,
      index: true,
    },
    totalRows: {
      type: Number,
      default: 0,
      min: 0,
    },
    validRows: {
      type: Number,
      default: 0,
      min: 0,
    },
    invalidRows: {
      type: Number,
      default: 0,
      min: 0,
    },
    aggregateTotals: {
      grossPay: { type: Number, default: 0 },
      netPay: { type: Number, default: 0 },
      bonus: { type: Number, default: 0 },
      preTaxDeductions: { type: Number, default: 0 },
      taxWithheld: { type: Number, default: 0 },
      postTaxDeductions: { type: Number, default: 0 },
    },
    riskCounts: {
      low: { type: Number, default: 0, min: 0 },
      medium: { type: Number, default: 0, min: 0 },
      high: { type: Number, default: 0, min: 0 },
    },
    validationErrors: {
      type: [validationErrorSchema],
      default: [],
    },
    summary: {
      type: String,
      default: '',
      trim: true,
    },
    recommendations: {
      type: [String],
      default: [],
    },
    processedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
)

payrollBatchSchema.index({ createdAt: -1 })
payrollBatchSchema.index({ status: 1, createdAt: -1 })

const PayrollBatch = mongoose.model('PayrollBatch', payrollBatchSchema)

export default PayrollBatch
