# PeopleOps AI API

## Conventions

Base URL:

```text
http://localhost:5000/api
```

Protected endpoints require `Authorization: Bearer <jwt>`.

Successful responses use:

```json
{
  "success": true,
  "message": "Human-readable result",
  "data": {}
}
```

Errors use `success: false` with a safe message and may include validation details. Passwords, JWTs, secrets, and raw CSV contents are never returned.

## Health

### `GET /health`

- Authentication: No
- Purpose: Report API status, uptime, timestamp, and runtime environment.
- Response: `status`, `uptime`, `timestamp`, and `environment`.

## Authentication

### `POST /auth/login`

- Authentication: No
- Purpose: Authenticate the seeded HR-admin and issue a JWT.

```json
{
  "email": "admin@example.com",
  "password": "your-admin-password"
}
```

Response data contains a `token` and safe `user` object with `id`, `name`, `email`, and `role`. There is no public registration endpoint.

### `GET /auth/me`

- Authentication: Required
- Purpose: Validate the current token and return the safe authenticated user.

## Payroll Upload

### `POST /payroll/upload`

- Authentication: Required
- Content type: `multipart/form-data`
- File field: `file`
- Purpose: Validate and process a strict payroll CSV.

```powershell
curl.exe -X POST http://localhost:5000/api/payroll/upload `
  -H "Authorization: Bearer $token" `
  -F "file=@sample-data/payroll-sample.csv"
```

The response contains batch identity, file name, status, row counts, totals, risk counts, a deterministic summary, recommendations, structured validation errors, and processed employee previews.

Invalid headers return `400`. Mixed files process valid rows and use `completed_with_errors`. Raw file contents are not stored.

## Payroll Batch Reads

### `GET /payroll/batches`

- Authentication: Required
- Purpose: Return newest payroll batches first.
- Query: `page`, `limit`, `status`, `from`, `to`
- Response: `batches` plus pagination metadata.

```powershell
curl.exe "http://localhost:5000/api/payroll/batches?page=1&limit=10" `
  -H "Authorization: Bearer $token"
```

### `GET /payroll/batches/:batchId`

- Authentication: Required
- Purpose: Return full batch metadata, totals, risk counts, summary, recommendations, and validation errors.
- Response: Full batch object. Missing batches return `404`.

### `GET /payroll/batches/:batchId/employees`

- Authentication: Required
- Purpose: Return paginated employee payroll results for one batch.
- Query: `page`, `limit`, `riskLevel`, `department`, `search`, `sort`, `order`
- Sort values: `netPay`, `grossPay`, `riskScore`, `employeeName`
- Response: `employees` plus pagination metadata.

Employee objects include deterministic pay results and explainable risk flags.

### `GET /payroll/batches/:batchId/summary`

- Authentication: Required
- Purpose: Return a compact batch review.
- Response: Summary, recommendations, risk counts, aggregate totals, and validation error count.

## Future-Agent Read Endpoints

These are ordinary JWT-protected read APIs designed for safe access to stored payroll summaries and risk results.

### `GET /payroll/batches/latest/summary`

- Authentication: Required
- Purpose: Return the most recent batch summary and key metrics.

### `GET /payroll/batches/latest/high-risk`

- Authentication: Required
- Purpose: Return high-risk employees from the most recent batch.
- Response: Batch reference and high-risk employee list.

### `GET /payroll/employee/:employeeId/risk`

- Authentication: Required
- Purpose: Return the employee's latest stored risk result across processed batches.
- Response: Employee identity, batch context, score, level, flags, warnings, and payroll values.

Static `latest` routes are registered before dynamic `:batchId` routes so route matching is unambiguous.

## Audit Logs

### `GET /audit-logs`

- Authentication: Required
- Purpose: Return sanitized system activity in newest-first order.
- Query: `page`, `limit`, `action`, `status`, `from`, `to`
- Response: `auditLogs` plus pagination metadata.

```powershell
curl.exe "http://localhost:5000/api/audit-logs?page=1&limit=10&status=success" `
  -H "Authorization: Bearer $token"
```

Events may include action, status, entity type, entity ID, safe user details, IP address, sanitized details, and timestamp.

## AI Payroll Review

### `POST /ai/payroll-review/:batchId`

- Authentication: Required
- Purpose: Generate an HR-facing Gemini review from stored batch facts.
- Input: No request body.
- Data scope: Batch totals, row counts, risk counts, deterministic summary and recommendations, plus at most ten medium/high-risk employee records.

```powershell
curl.exe -X POST `
  "http://localhost:5000/api/ai/payroll-review/$batchId" `
  -H "Authorization: Bearer $token"
```

Response data includes `review`, `provider`, `model`, `batchId`, `selectedEmployeeCount`, and `generatedAt`.

Safety boundaries:

- The model does not calculate or recalculate payroll.
- The model cannot modify records or approve payroll.
- The model is instructed not to provide legal or tax advice.
- The API key remains in the backend environment.
- If `GEMINI_API_KEY` is missing, the server remains available and this endpoint returns `503`.
- The audit event stores only provider, model, selected employee count, and risk counts.

## PowerShell Login

```powershell
$loginBody = @{
  email = "admin@example.com"
  password = "your-admin-password"
} | ConvertTo-Json

$login = Invoke-RestMethod `
  -Method Post `
  -Uri http://localhost:5000/api/auth/login `
  -ContentType "application/json" `
  -Body $loginBody

$token = $login.data.token

Invoke-RestMethod `
  -Uri http://localhost:5000/api/auth/me `
  -Headers @{ Authorization = "Bearer $token" }
```
