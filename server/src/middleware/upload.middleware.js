import path from 'node:path'
import os from 'node:os'
import multer from 'multer'

const CSV_FILE_SIZE_LIMIT = 5 * 1024 * 1024

const csvFileFilter = (_req, file, callback) => {
  const extension = path.extname(file.originalname).toLowerCase()

  if (extension !== '.csv') {
    const error = new Error('Only .csv files are allowed')
    error.statusCode = 400
    error.code = 'INVALID_FILE_TYPE'
    callback(error)
    return
  }

  callback(null, true)
}

export const uploadPayrollCsv = multer({
  dest: os.tmpdir(),
  fileFilter: csvFileFilter,
  limits: {
    fileSize: CSV_FILE_SIZE_LIMIT,
    files: 1,
  },
})
