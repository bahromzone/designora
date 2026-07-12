# Production rollback runbook

## Trigger

Rollback immediately for authentication lockout, payment duplication, corrupted enrollment/progress, migration failure, sustained 5xx above 2%, or a critical accessibility regression blocking core learning flows.

## Ownership

Incident commander decides. Backend owner handles API and database. Frontend owner handles static assets. One operator records timestamps, commands, evidence, and customer impact.

## Before every deploy

1. Record the release commit and previous known-good commit.
2. Verify all required CI checks are green.
3. Create a database backup and test that it is readable.
4. Record the current canonical Alembic revision.
5. Confirm secrets, environment variables, image tags, and rollback permissions.
6. Keep the previous backend and frontend images available.

## Application rollback

1. Stop traffic shifting, jobs, and schema-writing workers.
2. Redeploy the previous immutable backend image.
3. Redeploy the previous immutable frontend image and purge CDN HTML only. Keep hashed assets.
4. Restore workers only after API health, login, course detail, and enrollment checks pass.
5. Monitor 5xx, latency, payment failures, and offline-sync conflicts for 30 minutes.

## Database rollback

Prefer forward fixes. Use `alembic -c alembic-canonical.ini downgrade <revision>` only when the downgrade was tested and no post-deploy data would be destroyed.

For destructive or uncertain migrations:

1. Put the product in maintenance/read-only mode.
2. Stop all writers.
3. Preserve the failed database for investigation.
4. Restore the pre-deploy backup to a new database instance.
5. Run integrity queries and `alembic -c alembic-canonical.ini current`.
6. Point the application to the restored instance, then resume traffic gradually.

Never stamp a production database without schema verification. Never rewrite deployed legacy revisions.

## Verification

Required smoke checks: `/health`, signup/login, course browse/detail, enrollment, payment status without creating a real charge, lesson completion persistence, assignment submission, certificate verification, analytics ingestion, offline queue replay, keyboard-only navigation, and screen-reader status announcements.

## Abort and escalation

Abort rollback if it increases data loss, the backup fails integrity checks, or the target image cannot read the restored schema. Keep traffic disabled and escalate to the incident commander.

## Evidence and closeout

Capture release and rollback commits, image tags, database revisions, backup identifier, start/end time, impact, verification results, and follow-up owner. Open corrective work before closing the incident.
