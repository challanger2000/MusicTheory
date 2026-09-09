# Source layout

This directory will contain the Studio Pro extension and the standalone music-theory engine.

Planned separation:

- `integration/` — Studio Pro-specific commands, editor access and panel/service wiring
- `theory/` — deterministic music-theory data and analysis logic without Studio Pro dependencies
- `skin/` — Studio Pro XML UI definitions and related resources

The first implementation step is architecture validation. Production theory features will be added only after the Studio Pro integration path has been proven reliable.
