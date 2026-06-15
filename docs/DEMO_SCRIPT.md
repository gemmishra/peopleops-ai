# PeopleOps AI Demo Script

## Preparation

1. Start MongoDB.
2. Confirm `.env` contains the MongoDB URI, JWT secret, admin credentials, and client origin.
3. Install dependencies with `npm.cmd install`.
4. Start the API:

```powershell
npm.cmd run dev:server
```

5. Start the client in a second terminal:

```powershell
npm.cmd run dev:client
```

6. Open `http://localhost:5173`.
7. Use the **Download sample CSV** link on the upload page.

The sample contains 15 rows: 13 valid and 2 invalid, with low-, medium-, and high-risk examples.

## Three-Minute Demo

### 0:00-0:30 - Frame the Problem

"PeopleOps AI is a payroll validation and workforce risk analytics MVP. It accepts a strict payroll CSV, deterministically calculates salaried pay, highlights review risks, and creates an audit trail. It is built around the correctness and explainability expected in an HCM platform."

### 0:30-0:55 - Log In

1. Sign in with the seeded HR-admin account.
2. Point out that there is no public registration.
3. Mention JWT-protected frontend routes and backend APIs.

### 0:55-1:35 - Upload Payroll

1. Open **Upload Payroll**.
2. Point out the exact CSV contract and salaried-only scope.
3. Download or select `sample-payroll.csv`.
4. Upload it.
5. Show the status, row counts, risk counts, and validation errors.

Say: "Valid rows continue through processing, while invalid rows are retained as structured errors. Raw CSV contents are not written to audit logs."

### 1:35-2:10 - Review Analytics

1. Open **Dashboard**.
2. Show latest net pay, valid and invalid counts, high-risk count, summary, recommendations, and charts.
3. Explain that summaries and recommendations are deterministic templates over computed facts.

### 2:10-2:40 - Inspect a Batch

1. Open **Payroll Batches** and select the uploaded batch.
2. Show aggregate totals, employee results, filters, risk badges, and flags.
3. Highlight a high-risk employee and explain its score components.

### 2:40-3:00 - Close with Auditability

1. Open **Audit Logs**.
2. Show the upload event and sanitized details.
3. Close with:

"Validation agent, calculation service, risk detection agent, summary agent, recommendation agent, then audit log. The modular design is agentic-style, but payroll math remains deterministic and testable."

## Seven-Minute Demo

### 0:00-0:50 - Product and ADP Alignment

Explain that HR teams need accurate calculations and fast exception review, enterprise payroll software must be auditable and maintainable, and this MVP emphasizes a complete workflow rather than broad feature count.

### 0:50-1:30 - Architecture

Show the repository or architecture document:

- React/Vite client and Express/MongoDB server
- Four collections: users, batches, employee payrolls, audit logs
- JWT authentication with a seeded admin
- Service boundaries and protected read APIs

### 1:30-2:15 - Authentication and Security

1. Log in.
2. Explain password hashing, safe user responses, CORS, Helmet, and centralized errors.
3. State that no registration endpoint exists and the admin is seeded from environment values.

### 2:15-3:30 - CSV and Partial Processing

1. Open **Upload Payroll**.
2. Walk through the exact header list.
3. Upload the sample.
4. Explain validation errors and partial processing.
5. Show the result counts and status.

Mention the formulas:

```text
periodBasePay = annualSalary / periods
grossPay = periodBasePay + bonus
taxablePay = max(0, grossPay - preTaxDeductions)
netPay = grossPay - preTaxDeductions - taxWithheld - postTaxDeductions
```

### 3:30-4:30 - Dashboard

1. Show KPI cards.
2. Explain the risk distribution chart.
3. Show recent batch net-pay trend.
4. Review the deterministic summary and recommendations.
5. Point out that the UI does not invent unavailable data.

### 4:30-5:35 - Batch Deep Dive

1. Open the batch list and batch details.
2. Filter employee results by risk level or search.
3. Explain the scoring rules and boundaries.
4. Show that flags explain each score.

### 5:35-6:15 - Audit Logs

1. Open **Audit Logs**.
2. Filter by action or status.
3. Show actor, entity, IP address, and safe detail preview.
4. Explain that secrets, tokens, password fields, raw CSV contents, buffers, rows, and records are sanitized.

### 6:15-7:00 - Engineering Close

Summarize the deterministic financial core, agentic-style modular workflow, JWT security, auditability, tests, linting, production build, and dependency audit. Future scope includes RBAC, background jobs, broader payroll rules, frontend tests, and read-only agent integration.

## Expected Sample Result

- Status: `completed_with_errors`
- Total rows: 15
- Valid rows: 13
- Invalid rows: 2
- Risk distribution: 8 low, 3 medium, 2 high

## Recovery Notes

- If login fails, confirm MongoDB is running and the `.env` admin email matches the seeded account.
- If CORS blocks the client, confirm `CLIENT_ORIGIN=http://localhost:5173`.
- If the upload is rejected, use the public sample and keep the exact header order.
- If old data changes dashboard totals, explain that the dashboard intentionally shows persisted history and latest-batch metrics.
