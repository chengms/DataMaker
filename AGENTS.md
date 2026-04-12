# Repository Workflow

## Default Delivery Rule

For any code change in this repository, follow this workflow by default:

1. Complete the requested implementation.
2. Run the baseline local validation for the current change.
3. If validation passes, stage the change, create a commit, and push the current branch to `origin`.
4. If validation fails, stop and report the failure. Do not commit or push.

This rule is the default even if the user does not restate it in each request.

## Baseline Validation

Use the smallest command set that still provides reasonable confidence for the edited area.

For this repository, start with:

- `npm run typecheck`

Add any additional targeted verification that matches the touched code when available.

## Git Rules

- Do not amend existing commits unless the user explicitly asks.
- Do not force-push unless the user explicitly asks.
- If `git push` is rejected, stop and report the reason.
- Before pushing, confirm the staged files match the intended scope.
