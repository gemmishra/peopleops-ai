import mongoose from 'mongoose'
import {
  PAY_FREQUENCIES,
  RISK_LEVELS,
} from '../utils/payrollConstants.js'

const riskFlagSchema = new mongoose.Schema(
  {
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
    severity: {
      type: String,
      enum: RISK_LEVELS,
      required: true,
    },
    scoreImpact: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  },
)

const validationWarningSchema = new mongoose.Schema(
  {
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

const employeePayrollSchema = new mongoose.Schema(
  {
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PayrollBatch',
      required: true,
      index: true,
    },
    employeeId: {
      type: String,
      required: true,
      trim: true,
    },
    employeeName: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    annualSalary: {
      type: Number,
      required: true,
      validate: {
        validator: (value) => value > 0,
        message: 'annualSalary must be greater than zero',
      },
    },
    payFrequency: {
      type: String,
      enum: PAY_FREQUENCIES,
      required: true,
    },
    bonus: {
      type: Number,
      required: true,
      min: 0,
    },
    preTaxDeductions: {
      type: Number,
      required: true,
      min: 0,
    },
    taxWithheld: {
      type: Number,
      required: true,
      min: 0,
    },
    postTaxDeductions: {
      type: Number,
      required: true,
      min: 0,
    },
    payPeriodStart: {
      type: Date,
      required: true,
    },
    payPeriodEnd: {
      type: Date,
      required: true,
    },
    periodBasePay: {
      type: Number,
      required: true,
    },
    grossPay: {
      type: Number,
      required: true,
    },
    taxablePay: {
      type: Number,
      required: true,
    },
    netPay: {
      type: Number,
      required: true,
    },
    riskScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    riskLevel: {
      type: String,
      enum: RISK_LEVELS,
      default: 'low',
      required: true,
      index: true,
    },
    riskFlags: {
      type: [riskFlagSchema],
      default: [],
    },
    validationWarnings: {
      type: [validationWarningSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
)

employeePayrollSchema.index(
  {
    batchId: 1,
    employeeId: 1,
  },
  {
    unique: true,
  },
)
employeePayrollSchema.index({ batchId: 1, riskLevel: 1, riskScore: -1 })
employeePayrollSchema.index({ employeeId: 1, createdAt: -1 })
employeePayrollSchema.index({ batchId: 1, department: 1 })

const EmployeePayroll = mongoose.model(
  'EmployeePayroll',
  employeePayrollSchema,
)

export default EmployeePayroll
