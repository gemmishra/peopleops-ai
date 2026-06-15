import mongoose from 'mongoose'
import { z } from 'zod'
import EmployeePayroll from '../models/EmployeePayroll.js'
import PayrollBatch from '../models/PayrollBatch.js'
import {
  BATCH_STATUSES,
  RISK_LEVELS,
} from '../utils/payrollConstants.js'
import {
  dateRangeSchema,
  escapeRegex,
  getInclusiveDateRange,
  paginationSchema,
  toPagination,
} from '../utils/queryValidation.js'

const batchListQuerySchema = z
  .object({
    ...paginationSchema,
    ...dateRangeSchema,
    status: z.enum(BATCH_STATUSES).optional(),
  })
  .strict()

const employeeListQuerySchema = z
  .object({
    ...paginationSchema,
    riskLevel: z.enum(RISK_LEVELS).optional(),
    department: z.string().trim().min(1).max(100).optional(),
    search: z.string().trim().min(1).max(100).optional(),
    sort: z
      .enum(['netPay', 'grossPay', 'riskScore', 'employeeName'])
      .default('employeeName'),
    order: z.enum(['asc', 'desc']).optional(),
  })
  .strict()

const batchListFields = {
  originalFileName: 1,
  status: 1,
  totalRows: 1,
  validRows: 1,
  invalidRows: 1,
  aggregateTotals: 1,
  riskCounts: 1,
  processedAt: 1,
  createdAt: 1,
}

const employeeListFields = {
  employeeId: 1,
  employeeName: 1,
  department: 1,
  annualSalary: 1,
  payFrequency: 1,
  bonus: 1,
  preTaxDeductions: 1,
  taxWithheld: 1,
  postTaxDeductions: 1,
  payPeriodStart: 1,
  payPeriodEnd: 1,
  periodBasePay: 1,
  grossPay: 1,
  taxablePay: 1,
  netPay: 1,
  riskScore: 1,
  riskLevel: 1,
  riskFlags: 1,
  validationWarnings: 1,
}

const createNotFoundError = (message) => {
  const error = new Error(message)
  error.statusCode = 404
  return error
}

const ensureValidBatchId = (batchId) => {
  if (!mongoose.isValidObjectId(batchId)) {
    throw createNotFoundError('Payroll batch not found')
  }
}

const toPlainObject = (document) =>
  typeof document?.toObject === 'function' ? document.toObject() : document

export const serializeBatch = (batch) => {
  const value = toPlainObject(batch)

  return {
    id: String(value._id || value.id),
    originalFileName: value.originalFileName,
    status: value.status,
    totalRows: value.totalRows,
    validRows: value.validRows,
    invalidRows: value.invalidRows,
    aggregateTotals: value.aggregateTotals,
    riskCounts: value.riskCounts,
    processedAt: value.processedAt,
    createdAt: value.createdAt,
  }
}

export const serializeEmployee = (employee) => {
  const value = toPlainObject(employee)

  return {
    id: String(value._id || value.id),
    employeeId: value.employeeId,
    employeeName: value.employeeName,
    department: value.department,
    annualSalary: value.annualSalary,
    payFrequency: value.payFrequency,
    bonus: value.bonus,
    preTaxDeductions: value.preTaxDeductions,
    taxWithheld: value.taxWithheld,
    postTaxDeductions: value.postTaxDeductions,
    payPeriodStart: value.payPeriodStart,
    payPeriodEnd: value.payPeriodEnd,
    periodBasePay: value.periodBasePay,
    grossPay: value.grossPay,
    taxablePay: value.taxablePay,
    netPay: value.netPay,
    riskScore: value.riskScore,
    riskLevel: value.riskLevel,
    riskFlags: value.riskFlags || [],
    validationWarnings: value.validationWarnings || [],
  }
}

export const listPayrollBatches = async (rawQuery) => {
  const query = batchListQuerySchema.parse(rawQuery)
  const filter = {}
  const createdAt = getInclusiveDateRange(query)

  if (query.status) {
    filter.status = query.status
  }

  if (createdAt) {
    filter.createdAt = createdAt
  }

  const [batches, total] = await Promise.all([
    PayrollBatch.find(filter)
      .select(batchListFields)
      .sort({ createdAt: -1, _id: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean(),
    PayrollBatch.countDocuments(filter),
  ])

  return {
    batches: batches.map(serializeBatch),
    pagination: toPagination({
      page: query.page,
      limit: query.limit,
      total,
    }),
  }
}

export const getPayrollBatch = async (batchId) => {
  ensureValidBatchId(batchId)
  const batch = await PayrollBatch.findById(batchId).lean()

  if (!batch) {
    throw createNotFoundError('Payroll batch not found')
  }

  return {
    ...serializeBatch(batch),
    uploadedBy: batch.uploadedBy,
    summary: batch.summary,
    recommendations: batch.recommendations || [],
    validationErrors: batch.validationErrors || [],
    updatedAt: batch.updatedAt,
  }
}

export const listBatchEmployees = async (batchId, rawQuery) => {
  ensureValidBatchId(batchId)
  const batchExists = await PayrollBatch.exists({ _id: batchId })

  if (!batchExists) {
    throw createNotFoundError('Payroll batch not found')
  }

  const query = employeeListQuerySchema.parse(rawQuery)
  const filter = {
    batchId,
  }

  if (query.riskLevel) {
    filter.riskLevel = query.riskLevel
  }

  if (query.department) {
    filter.department = new RegExp(
      `^${escapeRegex(query.department)}$`,
      'i',
    )
  }

  if (query.search) {
    const search = new RegExp(escapeRegex(query.search), 'i')
    filter.$or = [
      { employeeId: search },
      { employeeName: search },
      { department: search },
    ]
  }

  const defaultOrder = query.sort === 'employeeName' ? 1 : -1
  const direction = query.order
    ? query.order === 'asc'
      ? 1
      : -1
    : defaultOrder
  const sort = {
    [query.sort]: direction,
    _id: 1,
  }

  const [employees, total] = await Promise.all([
    EmployeePayroll.find(filter)
      .select(employeeListFields)
      .sort(sort)
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean(),
    EmployeePayroll.countDocuments(filter),
  ])

  return {
    batchId,
    employees: employees.map(serializeEmployee),
    pagination: toPagination({
      page: query.page,
      limit: query.limit,
      total,
    }),
  }
}

export const getBatchSummary = async (batchId) => {
  const batch = await getPayrollBatch(batchId)

  return {
    id: batch.id,
    status: batch.status,
    summary: batch.summary,
    recommendations: batch.recommendations,
    riskCounts: batch.riskCounts,
    aggregateTotals: batch.aggregateTotals,
    validationErrorCount: batch.validationErrors.length,
    processedAt: batch.processedAt,
  }
}

export const getLatestBatch = async () => {
  const batch = await PayrollBatch.findOne()
    .sort({ createdAt: -1, _id: -1 })
    .lean()

  if (!batch) {
    throw createNotFoundError('No payroll batches found')
  }

  return batch
}

export const getLatestBatchSummary = async () => {
  const batch = await getLatestBatch()

  return {
    id: String(batch._id),
    originalFileName: batch.originalFileName,
    status: batch.status,
    totalRows: batch.totalRows,
    validRows: batch.validRows,
    invalidRows: batch.invalidRows,
    summary: batch.summary,
    recommendations: batch.recommendations || [],
    riskCounts: batch.riskCounts,
    aggregateTotals: batch.aggregateTotals,
    validationErrorCount: batch.validationErrors?.length || 0,
    processedAt: batch.processedAt,
    createdAt: batch.createdAt,
  }
}

export const getLatestHighRiskEmployees = async () => {
  const batch = await getLatestBatch()
  const employees = await EmployeePayroll.find({
    batchId: batch._id,
    riskLevel: 'high',
  })
    .select(employeeListFields)
    .sort({ riskScore: -1, employeeName: 1 })
    .lean()

  return {
    batch: {
      id: String(batch._id),
      originalFileName: batch.originalFileName,
      status: batch.status,
      processedAt: batch.processedAt,
    },
    count: employees.length,
    employees: employees.map(serializeEmployee),
  }
}

export const getLatestEmployeeRisk = async (employeeId) => {
  const normalizedEmployeeId = String(employeeId).trim()
  const employee = await EmployeePayroll.findOne({
    employeeId: normalizedEmployeeId,
  })
    .sort({ createdAt: -1, _id: -1 })
    .populate({
      path: 'batchId',
      select: 'originalFileName status processedAt createdAt',
    })
    .lean()

  if (!employee) {
    throw createNotFoundError('Employee payroll risk record not found')
  }

  return {
    employeeId: employee.employeeId,
    employeeName: employee.employeeName,
    department: employee.department,
    annualSalary: employee.annualSalary,
    grossPay: employee.grossPay,
    netPay: employee.netPay,
    riskScore: employee.riskScore,
    riskLevel: employee.riskLevel,
    riskFlags: employee.riskFlags || [],
    validationWarnings: employee.validationWarnings || [],
    batch: employee.batchId
      ? {
          id: String(employee.batchId._id),
          originalFileName: employee.batchId.originalFileName,
          status: employee.batchId.status,
          processedAt: employee.batchId.processedAt,
          createdAt: employee.batchId.createdAt,
        }
      : null,
  }
}
