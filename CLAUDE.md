@AGENTS.md

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Skills to use

- UI/UX design or redesign: `ui-ux-pro-max` first; `redesign-existing-projects` when changing an existing page; `frontend-design` for new pages. Match the site's existing style — don't switch to `industrial-brutalist-ui` or other one-look skills unless asked.
- UI review before shipping: `/web-interface-guidelines`, then `design:accessibility-review`.
- Coding: `/code-review` on the diff before pushing; `/simplify` for cleanups.

## Low token usage

- Answer codebase questions from `graphify query` before opening files; read only the lines you need (`Read` with offset/limit).
- Don't re-read a file you just edited. Don't load a design skill for a pure logic/backend change.
- Verify UI with one screenshot of the changed area, not full-page captures of every template.
