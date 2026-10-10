# Glossary

> Platform terminology reference. Load this file when you need term definitions.

---

| Term | Definition |
|---|---|
| **Tenant** | A subscribing company on the platform. Every company that signs up gets its own tenant environment — isolated data, isolated users, isolated settings. |
| **Tenant_id** | The UUID that identifies every tenant. Present on every table row. The primary isolation mechanism. |
| **RLS** | Row-Level Security — PostgreSQL feature that enforces tenant isolation at the database layer, making it impossible for application bugs to leak cross-tenant data. |
| **Trade module** | A discipline-specific workflow package (e.g., Electrical module includes panels, circuits, rough-in phases, inspection types specific to electrical work). |
| **Cross-tenant collaboration** | The v1.1 feature that allows two independent tenants (GC and Sub) to connect on a shared project and exchange governed data through the collaboration bridge. |
| **Collaboration bridge** | The shared_project_events table — a neutral store that neither tenant "owns." Both parties write events to it and read from it. Sub data NEVER lives in GC tables. |
| **Connection** | A formal link between two tenants on a specific project. Has states: Pending → Active → Completed/Disconnected. |
| **Shared project event** | A typed event written to the bridge (e.g., task_completed, inspection_passed, invoice_submitted) with a governed payload. |
| **Sub Portal** | A free, limited-access role for non-tenant subcontractors invited by a GC. Has specific allowed actions and explicit exclusions (no GC cost data, no other projects). |
| **Free Sub Portal** | The no-cost access model for sub portal users. Primary acquisition flywheel — subs convert to paid tenants when they need full functionality. |
| **GC Module** | The add-on ($99/mo on Professional, included in Business+) that enables full general contracting workflows. |
| **Starter / Professional / Business / Enterprise** | The four subscription tiers. Starter and Professional ship in v1.0. Business in v1.1. Enterprise in v2.0. |
| **ICP** | Ideal Customer Profile. Primary ICP: GC or trade contractor, 5–50 employees, $1M–$10M revenue, Midwest/Southeast/Southwest US. |
| **Design partner** | An early customer (pre-launch) who gets free platform access in exchange for weekly feedback sessions and co-case study rights. Target: 10–15 companies. |
| **Trial-to-paid conversion** | The percentage of 14-day trial starts that convert to a paying subscription. Target: 35% for self-serve. |
| **NRR** | Net Revenue Retention — expansion revenue from upgrades and add-ons minus churn. Target: 112%. |
| **CAC** | Customer Acquisition Cost. Blended base case: $1,200. |
| **LTV** | Lifetime Value. Base case: $8,064 (24-month average duration × ARPU × gross margin). |
| **Viral loop** | The GC-to-Sub acquisition mechanic: GC invites subs to free portal → subs experience value → subs convert to paid tenants → repeats. |
| **PgBouncer** | The database connection pooler used in transaction mode. Transaction mode is critical for RLS — session mode breaks tenant isolation. |
| **WatermelonDB** | The mobile local database (SQLite-based) used for offline-first data storage on iOS and Android. |
| **Sync queue** | The local SQLite table that holds offline writes until connectivity is restored. Processes in chronological order on reconnect. |
| **Pre-signed URL** | A time-limited (15-min) URL that grants temporary access to a specific file in S3/Spaces. No direct storage exposure — all file access goes through pre-signed URLs. |
| **preferred_language** | The user-level locale setting (e.g., 'es', 'en', 'pt-BR') stored on the users table. Takes precedence over all other locale signals. |
| **Tier 1 languages** | English + Spanish — required at v1.0 launch. Spanish is a launch gate. |
| **Tier 2 languages** | Portuguese (Brazilian) + Haitian Creole — targeted for v1.1. |
| **withTenantContext()** | The mandatory wrapper function that injects SET LOCAL app.current_tenant_id before any tenant-scoped database query. Must be used for all tenant-scoped operations — never bypassed. |
| **Optimistic locking** | The conflict resolution model for offline sync. Every record carries a version integer. Sync writes include client_version; server returns 409 Conflict if version has advanced. |
| **Circuit breaker** | A Redis-backed pattern with Closed/Open/Half-Open states that prevents retry storms against failing external integrations. Opens after 5 consecutive failures. |
| **Quarantine prefix** | The storage path prefix (/{tenant_id}/quarantine/) where uploaded files are held during malware scanning. Files are never accessible from quarantine — only from /live/ prefix. |
| **Hash chaining** | The tamper-evidence mechanism in the audit log. Each entry's SHA-256 hash includes the previous entry's hash, forming an unbreakable chain. Any modification to a past entry is detectable by the nightly integrity check. |
| **Fan-out** | The server-side pattern for cross-tenant real-time events. Server publishes scoped event payloads to each tenant's own private channel independently — no shared channels. |
| **Dead-letter queue (DLQ)** | The SQS queue where failed job messages land after exhausting retries. CloudWatch alarm fires when DLQ depth > 0. Messages are inspectable and replayable by super admin. |
| **Portal user migration** | The process of copying portal user data from the GC's tenant to the portal user's new tenant when they subscribe. Requires super admin approval. Records are copied with new UUIDs — not re-stamped. |

---

*Last updated: March 14, 2026*
