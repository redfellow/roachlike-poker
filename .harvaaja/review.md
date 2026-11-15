# Review criteria

Besides tracing every behavior to the change's spec, hold the change to these. Each one broken is a change to make.

## Safety

- Nothing weakens secret handling; no secrets or local env files are committed (use `.env.example` placeholders).
- No automated test reaches a real outside service.
- Client views never reveal hidden information (other players' cards, undealt deck); card conservation holds across every game command.

## Compatibility

- SQLite data, protocol messages and stored games stay readable by the previous version, or the change says how they move.

## Code and specs

- Follows AGENTS.md style: tabs, Stroustrup braces, double quotes, no `any`, explicit exported return types, BEM classes.
- New or changed requirements are captured in an OpenSpec change and `openspec/migration-index.md` is accurate; no duplicate requirements in legacy docs.
- Meaningful fixes come with regression tests.

## Words

- Text a person reads (UI, messages, errors) is plain and specific: it says what happened and what can be done.
