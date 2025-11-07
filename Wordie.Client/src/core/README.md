# Core Layer

This directory hosts application-wide domain logic and service adapters. Feature slices should consume functionality from here instead of calling infrastructure utilities directly, which keeps cross-cutting rules in one place.

## Conventions

- `types.ts` files define canonical domain contracts used across the app.
- `service.ts` files wrap HTTP or persistence calls and return strongly typed domain objects.
- Avoid importing React components into this layer; keep it framework agnostic.
