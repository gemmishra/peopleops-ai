import fs from 'node:fs'
import csvParser from 'csv-parser'

export const parseCsvFile = (filePath) =>
  new Promise((resolve, reject) => {
    const rows = []
    let headers = null

    fs.createReadStream(filePath)
      .on('error', reject)
      .pipe(
        csvParser({
          mapHeaders: ({ header }) => header,
          strict: true,
        }),
      )
      .on('headers', (parsedHeaders) => {
        headers = parsedHeaders
      })
      .on('data', (row) => {
        rows.push(row)
      })
      .on('error', reject)
      .on('end', () => {
        resolve({
          headers: headers || [],
          rows,
        })
      })
  })
