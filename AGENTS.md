# Planetcraft working conventions

- Build with Vue 3, TypeScript, Vite, and Three.js.
- Keep the GitHub repository private. The website is public and hosted only on GitHub Pages, as approved by the owner.
- Each PR adds one tiny feature or focused fix. Include its necessary tests and avoid unrelated cleanup.
- Prefer one focused commit per PR. Extra commits must serve the same small change.
- Use English for project text, commit messages, PR descriptions, and comments.
- Attribute author and committer to Benziza <74437449+Benziza@users.noreply.github.com>. Use the repository-local Git identity.
- Add a short top-level PR comment explaining this step, how to try it, and what was checked. Keep it understandable without reading the code.
- Leave new PRs open until the user asks to merge them. Earlier merge requests do not automatically apply to later feature work.
- Create a dedicated branch for each PR. If it depends on an open PR, branch from that PR and state the dependency.
- Run lint, the tests available at that step, and the production build before opening a code PR. Review the text and links for documentation-only changes.
- Use npm run build -- --base=/planetcraft/ for the production build. Respect Vite's BASE_URL for runtime URLs and the home link.
- Preserve responsive layout, keyboard access, reduced-motion behavior, and scene cleanup. Keep Three.js objects outside Vue's deep reactivity and renderer styles global.
- Merge dependent PRs in order using merge commits, retarget the next PR after its prerequisite is merged, and delete merged branches when requested.
