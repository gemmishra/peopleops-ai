# PeopleOps AI

**Payroll Validation & Workforce Risk Analytics Platform**

PeopleOps AI is a full-stack MVP for reviewing salaried payroll files. An HR administrator can upload a strict CSV, process valid employees while retaining invalid-row errors, inspect deterministic payroll results and risk signals, review dashboard analytics, and trace activity through sanitized audit logs.

The project is designed around ADP-style HCM and payroll concerns: correctness, explainability, enterprise structure, secure access, operational visibility, and maintainable workflows.

## Features

- Seeded HR-admin authentication with JWT-protected routes
- Strict CSV header and row validation
- Partial batch processing with explicit completion statuses
- Deterministic payroll calculations with auditable formulas
- Rule-based risk scoring, flags, summaries, and recommendations
- Optional Gemini payroll review generated from stored computed facts
- Dashboard KPIs, batch trends, and high-risk employee review
- Payroll batch, employee result, and audit-log interfaces
- Sanitized audit events that exclude credentials, tokens, and raw CSV data
- Backend unit and API-boundary tests

## Architecture

The repository is an npm-workspace monorepo:

```text
PeopleOps AI/
|-- client/                 React and Vite application
|-- server/                 Express and MongoDB API
|-- sample-data/            Demo payroll CSV
|-- docs/                   API and architecture documentation
|-- .env.example
`-- package.json
```

The backend uses an agentic-style modular workflow:

```text
CSV upload
  -> validation agent
  -> payroll calculation service
  -> risk detection agent
  -> summary agent
  -> recommendation agent
  -> audit log
```

These modules act as specialized, testable workflow stages. No external LLM is involved in payroll calculations, risk scores, or the deterministic summary and recommendation pipeline. Gemini is an optional read-only review layer over stored results. See [Architecture](docs/ARCHITECTURE.md) for the full design.

## Tech Stack

| Area | Technologies |
| --- | --- |
| Frontend | React, Vite, React Router, Bootstrap, Recharts, Axios |
| Backend | Node.js, Express, MongoDB, Mongoose |
| Authentication | JWT, bcryptjs |
| Upload and validation | Multer, csv-parser, Zod |
| AI review | Gemini REST API, server-side only |
| Testing and quality | Jest, ESLint, npm audit |

## Deterministic Payroll Engine

PeopleOps AI supports salaried employees and these frequencies:

| Frequency | Periods |
| --- | ---: |
| weekly | 52 |
| biweekly | 26 |
| semimonthly | 24 |
| monthly | 12 |

All monetary values are rounded to two decimal places.

```text
periodBasePay = annualSalary / frequencyPeriods
grossPay      = periodBasePay + bonus
taxablePay    = max(0, grossPay - preTaxDeductions)
netPay        = grossPay - preTaxDeductions - taxWithheld - postTaxDeductions
```

The summary and recommendation modules can describe computed results, but they cannot modify them. An optional Gemini review can also summarize stored batch and risk facts, but it cannot calculate salary, change records, approve payroll, or provide legal or tax advice.

## Risk Scoring

Risk scoring runs only after a row passes validation and payroll is calculated.

| Rule | Score |
| --- | ---: |
| Net pay is zero or negative | +40 |
| Total deductions exceed 40% of gross pay | +25 |
| Bonus exceeds 20% of period base pay | +20 |
| Salary is at least two standard deviations from batch mean | +20 |
| Row contains a validation warning | +10 |

Scores are capped at 100. Levels are `low` (0-29), `medium` (30-59), and `high` (60-100). Each score includes human-readable flags so an HR reviewer can see why it was assigned.

## Strict CSV Contract

The header row must match this exact order:

```csv
employeeId,employeeName,department,annualSalary,payFrequency,bonus,preTaxDeductions,taxWithheld,postTaxDeductions,payPeriodStart,payPeriodEnd
```

Rules include required identity and department fields, positive annual salary, supported pay frequency, nonnegative bonus and deductions, valid dates, and unique employee IDs within a batch.

Valid rows are processed even when other rows fail:

- `completed`: every row is valid
- `completed_with_errors`: valid and invalid rows are present
- `failed`: no rows are valid or the file cannot be processed

Sample files are available at `sample-data/payroll-sample.csv` and through the UI at `/sample-payroll.csv`.

## Setup

### Prerequisites

- Node.js 20.19 or later
- npm
- A local or hosted MongoDB instance

### Install

```powershell
npm.cmd install
Copy-Item .env.example .env
```

Update `.env` with your MongoDB connection and private development credentials.

### Environment Variables

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | Runtime environment |
| `PORT` | Backend port |
| `CLIENT_ORIGIN` | Allowed frontend origin for CORS |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Long private signing secret |
| `JWT_EXPIRES_IN` | Token lifetime such as `1d` |
| `ADMIN_NAME` | Seeded HR-admin display name |
| `ADMIN_EMAIL` | Seeded HR-admin login email |
| `ADMIN_PASSWORD` | Seeded HR-admin login password |
| `AI_PROVIDER` | AI provider identifier, currently `gemini` |
| `GEMINI_API_KEY` | Optional server-only Gemini key |
| `AI_MODEL` | Gemini model, currently `gemini-2.5-flash` |
| `VITE_API_BASE_URL` | Frontend API base URL |

Do not commit `.env`. The checked-in `.env.example` contains placeholders only. `GEMINI_API_KEY` is never exposed through a `VITE_` variable. If it is blank, the server still starts and the AI review endpoint returns `503`.

## Run the Application

Start MongoDB, then use two PowerShell terminals:

```powershell
npm.cmd run dev:server
```

```powershell
npm.cmd run dev:client
```

Open `http://localhost:5173`. The API health endpoint is `http://localhost:5000/api/health`.

The server seeds one admin from `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` when that email does not already exist. Log in with the credentials configured in `.env`. There is no registration page or public registration endpoint.

## Usage Workflow

1. Log in with the seeded HR-admin account.
2. Open **Upload Payroll** and select the sample CSV.
3. Review valid rows, invalid rows, risk counts, and validation errors.
4. Open **Dashboard** for KPIs, summaries, recommendations, recent batches, and charts.
5. Open **Payroll Batches**, select the upload, and inspect employee calculations and risk flags.
6. Generate an optional Gemini review of the stored batch results.
7. Open **Audit Logs** to review sanitized system activity.

## API Documentation

The authenticated API surface and response conventions are documented in [API Reference](docs/API.md).

## Testing and Quality

Run individual checks:

```powershell
npm.cmd run lint --workspace server
npm.cmd test --workspace server
npm.cmd run lint --workspace client
npm.cmd run build --workspace client
npm.cmd audit --audit-level=low
```

Or run the root quality gate:

```powershell
npm.cmd run check
```

Backend tests cover calculation and rounding, validation, duplicates, risk rules and boundaries, deterministic summaries, upload processing, authenticated read controllers, and audit-log reads. The client is verified through ESLint, production builds, and manual workflow checks.

## Security and Auditability

- Passwords are hashed with bcryptjs and never returned by the API.
- JWTs are required for protected API routes.
- CORS is restricted to `CLIENT_ORIGIN`, and Helmet sets security headers.
- Uploads accept CSV files only and temporary files are cleaned up.
- Raw CSV contents are never stored in audit logs.
- Audit sanitization removes credential, token, CSV-content, buffer, row, and record fields.
- Gemini receives only a compact context built from stored batch facts and up to ten medium/high-risk employees.
- Gemini prompts, keys, responses, raw CSV data, and JWTs are never written to audit logs.
- Payroll results cannot be edited through the MVP.

## MVP Boundaries

- One seeded HR-admin role; no public registration or broader RBAC
- Salaried payroll only
- No editable payroll records
- Gemini is limited to an on-demand, read-only HR review of stored facts
- No chatbot integration
- No AI calculation, mutation, approval, legal advice, or tax advice
- No asynchronous job queue or production deployment automation

## Future Improvements

- Role-based access control and organization isolation
- HTTP-only cookie sessions and token rotation
- Background processing for large files
- More pay types, jurisdictional rules, and configurable risk policies
- Automated frontend component and end-to-end tests
- Cloud deployment, observability, and CI/CD

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [API Reference](docs/API.md)

## License

This project is licensed under the MIT License. See the LICENSE file for details.
