# PeopleOps AI Architecture

## System Shape

PeopleOps AI is an npm-workspace monorepo with two independently runnable applications:

- `client/`: React single-page application built with Vite
- `server/`: Express REST API backed by MongoDB and Mongoose

The client owns presentation, navigation, session persistence, filters, and charts. The server owns authentication, validation, calculation, risk analysis, persistence, and audit behavior.

## Data Stores

MongoDB contains four domain collections:

- `users`: seeded HR-admin identity and password hash
- `payrollbatches`: file metadata, processing status, totals, errors, summary, and recommendations
- `employeepayrolls`: immutable calculated employee results and risk details
- `auditlogs`: sanitized system actions and outcomes

Separating batches and employees keeps batch analytics compact while allowing employee results to be filtered and paginated.

## Authentication

At startup, the server validates configuration, connects to MongoDB, and looks up `ADMIN_EMAIL`. It hashes `ADMIN_PASSWORD` and creates the admin only when that email does not exist. Existing accounts are never overwritten, and passwords are stored only as bcrypt hashes.

`POST /api/auth/login` validates credentials and returns a signed JWT plus a safe user object. Protected middleware reads the bearer token, verifies it, loads the user, and attaches the safe identity to the request. There is no public registration route.

## Payroll Upload Flow

```text
Authenticated request
  -> Multer CSV filter and temporary file
  -> CSV parser
  -> exact header validation
  -> row validation and normalization
  -> deterministic payroll calculation
  -> batch statistics and risk scoring
  -> aggregate analytics
  -> deterministic summary and recommendations
  -> batch and employee persistence
  -> sanitized audit event
  -> temporary file cleanup
```

The processor supports partial success:

- All valid rows: `completed`
- Valid and invalid rows: `completed_with_errors`
- No valid rows or unrecoverable error: `failed`

Invalid rows become structured batch errors. Raw CSV contents are not stored.

## Modular Agentic Workflow

The backend uses agent-oriented naming to express clear ownership and sequencing. Each module has a narrow, deterministic contract.

### Validation Agent

- Enforces the exact CSV header order
- Validates identity, department, numeric, and date fields
- Rejects duplicate employee IDs within a batch
- Produces structured row errors and warnings

### Payroll Calculation Service

- Maps pay frequency to a fixed annual divisor
- Calculates base, gross, taxable, and net pay
- Rounds monetary output to two decimal places
- Rejects unsupported frequencies

This service is the sole authority for calculated pay values.

### Risk Detection Agent

- Consumes validated, calculated rows
- Computes safe batch salary statistics
- Applies documented scoring rules
- Caps scores and assigns risk levels
- Emits human-readable flags with score impact

### Summary Agent

Builds a template-based narrative from row counts, total net pay, risk counts, common flags, department totals, and batch status.

### Recommendation Agent

Maps high-risk results, invalid rows, deduction anomalies, bonus anomalies, and salary outliers to deterministic HR review actions.

### Audit Service

Writes reusable audit events while recursively removing sensitive fields. Passwords, tokens, secrets, authorization values, raw CSV content, buffers, rows, and records are excluded.

## Why Payroll Is Deterministic

Payroll is a high-consequence financial workflow. A probabilistic model could produce different answers, introduce assumptions, or make arithmetic errors. PeopleOps AI keeps calculations and risk rules in pure, testable JavaScript services.

This means:

- The same inputs always produce the same outputs.
- Every value can be traced to a formula and source row.
- Unit tests cover exact values and boundaries.
- Reviewers can explain risk flags without prompt inspection.
- Summary modules cannot mutate payroll values.

No LLM is used for salary calculation. The AI-style value comes from modular orchestration, anomaly detection, explainable recommendations, and concise presentation of computed facts.

## Gemini Payroll Review

Phase 11 adds an optional server-side Gemini adapter for on-demand HR review. The protected endpoint loads one stored batch and at most ten medium/high-risk employee records ordered by risk score. It constructs a compact context from persisted facts only.

The Gemini system instruction explicitly prohibits:

- Calculating or recalculating salary, deductions, taxes, or risk scores
- Changing payroll or risk records
- Approving payroll
- Providing legal or tax advice
- Following instructions embedded in context values

The browser never receives the API key. The server sends the key to Gemini in a request header, applies a timeout, and returns a safe provider error without logging provider payloads. A missing key does not block startup; only the review endpoint returns `503`.

After a successful review, the audit event `AI_PAYROLL_REVIEW_GENERATED` stores only provider, model, selected employee count, and batch risk counts. The prompt, key, full response, raw CSV, JWT, and secrets are excluded.

## Read Architecture

JWT-protected APIs expose paginated batches, batch details, employee results, compact summaries, latest high-risk employees, employee risk history, and sanitized audit events.

The dashboard composes existing read APIs instead of duplicating business logic in a separate analytics store.

## Client Architecture

The React application contains:

- Authentication context for JWT persistence and `/auth/me` validation
- Protected routing and a shared enterprise layout
- Axios API modules for auth, payroll, dashboard, and audit reads
- Reusable status, risk, loading, error, empty-state, table, and chart components
- Pages for dashboard, upload, batches, batch details, and audit logs

The UI never calculates payroll. It formats and presents backend-owned values.

## Security Boundaries

- Zod validates environment and login input.
- Helmet sets standard security headers.
- CORS allows only the configured client origin.
- Central error middleware provides consistent safe errors.
- Multer limits upload type and temporary files are deleted.
- Invalid and expired JWTs are rejected before controllers run.
- Payroll records are read-only in the MVP.

## Future Read-Only Agent Integration

The latest summary, latest high-risk, and employee-risk endpoints remain a future read surface for an OpenClaw or chat-based agent. A future integration should authenticate as a constrained read-only principal, cite stored batch IDs and risk flags, avoid direct database access, and never calculate, edit, or approve payroll.

No OpenClaw or chatbot integration exists in the current MVP. Gemini is limited to the explicit, on-demand payroll review endpoint.
