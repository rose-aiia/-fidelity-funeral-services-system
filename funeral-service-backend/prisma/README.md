# Prisma setup for Funeral Service Backend

This project uses Prisma with PostgreSQL for the initial Phase 3 schema.

## Environment

The Prisma datasource uses the existing `DATABASE_URL` value from the backend environment configuration.

## Schema approach

The first migration includes:

- core user, customer, admin, provider, memorial, marketplace and audit tables
- cemetery and burial tables for location-aware grave records
- media consent tracking

Deferred future modules remain out of scope for this migration and are intentionally omitted:

- ai_chat_sessions
- ai_chat_messages
- ai_knowledge_sources
- avatar_generation_requests
- virtual_cemetery_visits
- virtual_tributes

## Future note

The database is designed to support those modules without creating them in the initial migration.
