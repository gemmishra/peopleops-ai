import fs from 'node:fs/promises'
import {
  getBatchSummary,
  getLatestBatchSummary,
  getLatestEmployeeRisk,
  getLatestHighRiskEmployees,
  getPayrollBatch,
  listBatchEmployees,
  listPayrollBatches,
} from '../services/payrollRead.service.js'
import { processPayrollUpload } from '../services/payrollUpload.service.js'

const missingFileError = () => {
  const error = new Error(
    'A CSV file is required in multipart field "file"',
  )
  error.statusCode = 400
  error.code = 'MISSING_FILE'
  return error
}

const toBatchResponse = (batch) => ({
  id: batch.id,
  status: batch.status,
  originalFileName: batch.originalFileName,
  totalRows: batch.totalRows,
  validRows: batch.validRows,
  invalidRows: batch.invalidRows,
  aggregateTotals: batch.aggregateTotals,
  riskCounts: batch.riskCounts,
  summary: batch.summary,
  recommendations: batch.recommendations,
  validationErrors: batch.validationErrors,
})

const toEmployeeResponse = (employee) => ({
  employeeId: employee.employeeId,
  employeeName: employee.employeeName,
  department: employee.department,
  grossPay: employee.grossPay,
  netPay: employee.netPay,
  riskScore: employee.riskScore,
  riskLevel: employee.riskLevel,
  riskFlags: employee.riskFlags,
})

const getUploadMessage = (status) => {
  if (status === 'completed_with_errors') {
    return 'Payroll batch processed with validation errors'
  }

  if (status === 'failed') {
    return 'Payroll batch failed because no valid rows were available'
  }

  return 'Payroll batch processed successfully'
}

export const uploadPayroll = async (req, res) => {
  if (!req.file) {
    throw missingFileError()
  }

  try {
    const result = await processPayrollUpload({
      filePath: req.file.path,
      originalFileName: req.file.originalname,
      uploadedBy: req.user.id,
      ipAddress: req.ip,
    })

    res.status(201).json({
      success: true,
      message: getUploadMessage(result.batch.status),
      data: {
        batch: toBatchResponse(result.batch),
        employees: result.employees.map(toEmployeeResponse),
      },
    })
  } finally {
    await fs.rm(req.file.path, { force: true }).catch((error) => {
      console.error('Failed to remove temporary payroll upload', error)
    })
  }
}

export const getPayrollBatches = async (req, res) => {
  const data = await listPayrollBatches(req.query)

  res.status(200).json({
    success: true,
    message: 'Payroll batches retrieved successfully',
    data,
  })
}

export const getPayrollBatchById = async (req, res) => {
  const batch = await getPayrollBatch(req.params.batchId)

  res.status(200).json({
    success: true,
    message: 'Payroll batch retrieved successfully',
    data: {
      batch,
    },
  })
}

export const getPayrollBatchEmployees = async (req, res) => {
  const data = await listBatchEmployees(req.params.batchId, req.query)

  res.status(200).json({
    success: true,
    message: 'Employee payroll records retrieved successfully',
    data,
  })
}

export const getPayrollBatchSummary = async (req, res) => {
  const summary = await getBatchSummary(req.params.batchId)

  res.status(200).json({
    success: true,
    message: 'Payroll batch summary retrieved successfully',
    data: {
      summary,
    },
  })
}

export const getLatestPayrollSummary = async (_req, res) => {
  const summary = await getLatestBatchSummary()

  res.status(200).json({
    success: true,
    message: 'Latest payroll summary retrieved successfully',
    data: {
      summary,
    },
  })
}

export const getLatestHighRiskPayroll = async (_req, res) => {
  const data = await getLatestHighRiskEmployees()

  res.status(200).json({
    success: true,
    message: 'Latest high-risk payroll records retrieved successfully',
    data,
  })
}

export const getEmployeeRisk = async (req, res) => {
  const employee = await getLatestEmployeeRisk(req.params.employeeId)

  res.status(200).json({
    success: true,
    message: 'Employee payroll risk retrieved successfully',
    data: {
      employee,
    },
  })
}
