# Alembic canonical baseline

`app/alembic` is the deployed legacy audit trail. It is frozen because its initial revision predates the complete LMS schema and cannot safely rebuild a fresh database.

`app/alembic_canonical` is now the source of truth for fresh installs and all future migrations.

## Fresh database

```bash
alembic -c alembic-canonical.ini upgrade head
```

## Existing production database

1. Create and verify a database backup.
2. Compare the live schema with SQLAlchemy metadata.
3. Run `alembic -c alembic-canonical.ini stamp head` only after verification.
4. Deploy future canonical revisions normally.

Never replay or rewrite deployed legacy revisions.
