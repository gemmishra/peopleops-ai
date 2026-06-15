# PeopleOps AI Interview Pitch

## 60-Second Pitch

"PeopleOps AI is a full-stack payroll validation and workforce risk analytics platform built for an HR administrator. The user uploads a strict payroll CSV, and the backend validates each employee, calculates salaried payroll with deterministic formulas, identifies explainable risk conditions, stores immutable results, and generates a concise review summary and recommendations. Valid rows still process when other rows fail, so HR gets useful output plus structured corrections.

The architecture uses an agentic-style workflow: validation agent, payroll calculation service, risk detection agent, summary agent, recommendation agent, and audit log. An optional Gemini assistant can summarize stored results, but I deliberately keep it outside salary calculation because payroll needs reproducibility, accuracy, and auditability. The application uses React, Express, MongoDB, JWT authentication, automated Jest tests, and a protected dashboard with batch and audit review."

## Technical Deep Dive

The project is split into a React client and an Express API. MongoDB stores users, payroll batches, calculated employee payroll records, and audit events.

The upload flow validates the exact CSV header before processing rows. Row validation returns structured errors rather than discarding the entire file. Valid rows are normalized and passed into a pure calculation service. Risk scoring uses the calculated output and safe batch statistics. Summary and recommendation services consume those stored facts but cannot change payroll values.

Read APIs are paginated and filterable. Static `latest` routes are declared before dynamic batch routes. The React application keeps API concerns in small client modules, validates the JWT session through `/auth/me`, protects application routes, and reuses status, table, empty-state, and chart components.

## GenAI and Agentic AI Framing

PeopleOps AI demonstrates agentic architecture without overstating generative AI. Each module is specialized and has a clear input, output, and responsibility:

```text
validation -> calculation -> risk detection -> summary -> recommendations -> audit
```

The flow is orchestrated and explainable. Gemini now provides an optional HR-facing review of stored facts. It receives a compact, server-built context and is instructed not to calculate pay, change records, approve payroll, or provide legal or tax advice. Existing read-only summary and risk APIs still provide a controlled future integration surface for richer agent workflows.

## Responsible AI-Assisted Development

Codex was used as an engineering assistant for repository exploration, scaffolding, implementation iteration, test generation, quality checks, and documentation. The controls were explicit:

- Business rules were defined before implementation.
- Payroll formulas and risk boundaries are deterministic.
- Generated code was reviewed against API contracts and models.
- Pure services received exact-value unit tests.
- Lint, tests, production builds, and dependency audits were run.
- AI is not used at runtime to calculate or approve payroll.
- Gemini prompts and responses are not persisted in audit logs.

This treats AI as a productivity tool while keeping engineering judgment, tests, and auditable rules in control.

## Why Payroll Logic Is Deterministic

Payroll output must be repeatable. A language model may produce plausible but inconsistent arithmetic or infer unauthorized rules. PeopleOps AI uses fixed divisors, explicit formulas, two-decimal rounding, and version-controlled risk rules. Given the same validated row, it always returns the same result.

The summary and recommendation agents receive calculated facts. They cannot write back into gross pay, net pay, or deductions.

## Security and Auditability

- One seeded admin is created from environment variables; no public registration exists.
- Passwords are bcrypt hashes and never returned.
- JWT middleware protects payroll and audit routes.
- Helmet, controlled CORS, validated input, and centralized errors reduce common API risk.
- Uploaded files are temporary and cleaned up.
- Audit details are recursively sanitized.
- The Gemini API key remains backend-only, and a missing key degrades the endpoint to `503` without stopping the server.
- AI review audit events contain metadata only.
- Payroll records have no edit endpoint.
- Risk scores include reason flags and score impact.

## Testing Strategy

The backend suite focuses on the highest-risk deterministic behavior:

- Frequency divisors, calculations, rounding, and invalid frequencies
- Exact headers, required values, dates, and duplicate IDs
- Risk triggers and level boundaries
- Deterministic summaries and recommendations
- Upload orchestration and partial-processing statuses
- Authentication boundaries and payroll/audit read controllers

ESLint checks both workspaces, Vite verifies the production frontend bundle, and `npm audit` checks dependency advisories. Frontend component and end-to-end automation are future work.

## Future Improvements

- Organization isolation, RBAC, and least-privilege service accounts
- HTTP-only cookie sessions, token rotation, and rate limiting
- Queue-based processing and object storage for large imports
- Configurable payroll jurisdictions and policy versions
- Historical anomaly baselines and richer explainability
- React component and browser end-to-end tests
- CI/CD, cloud deployment, metrics, traces, and alerting
- Read-only chat or OpenClaw access with citations and audit events

## Likely Interview Questions

### 1. Why did you build this project?

It maps directly to payroll and HCM workflows while demonstrating full-stack development, database modeling, security, testable business logic, visualization, and responsible AI framing in one coherent MVP.

### 2. Why use Gemini but not let it calculate payroll?

Payroll requires exact, repeatable, auditable output, so fixed formulas and tests own the math. Gemini is useful for turning stored exceptions into a concise HR review, but it has no ability to write records, approve payroll, or replace the deterministic services.

### 3. What makes the design agentic?

The workflow is decomposed into specialized modules that execute in sequence and produce explicit artifacts: validation results, calculations, risk flags, summaries, recommendations, and audit records. It uses agentic separation of concerns without introducing nondeterminism.

### 4. How do you handle both valid and invalid rows?

The header must be exact. Each row is then validated independently. Valid rows are calculated and stored, invalid rows become structured batch errors, and the batch is `completed_with_errors`. If no rows are valid, it is `failed`.

### 5. How is risk scoring explainable?

Every rule has a fixed score impact and generates a flag containing a code, message, severity, and score contribution. The final score is capped at 100 and mapped to documented boundaries.

### 6. How did you secure authentication?

The server seeds one admin from environment values, stores only a bcrypt hash, validates login input, signs expiring JWTs, and protects all business routes. Safe user objects omit the hash, and there is no public registration.

### 7. What would you change for production scale?

I would add organization isolation and RBAC, queue large uploads, use managed storage and MongoDB, add rate limiting and observability, move sessions to secure HTTP-only cookies, and deploy through CI/CD with integration and end-to-end gates.

### 8. How do you know the calculation is correct?

The service is pure and tests cover every frequency divisor, formula output, rounding, and unsupported frequency. Risk tests cover triggers and boundaries. The same input always produces the same result.

### 9. How is sensitive data kept out of audit logs?

Audit details pass through a recursive sanitizer that removes password, token, JWT, secret, authorization, CSV-content, buffer, row, and record fields. The API returns only stored sanitized events.

### 10. What was the most important engineering tradeoff?

Keeping the MVP narrow. I chose salaried payroll, one admin role, strict CSV input, and read-only calculated records. That made room for a complete workflow with tests, documentation, error states, and auditability instead of many partial features.
