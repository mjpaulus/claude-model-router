# claude-model-router

A [Claude Code skill](https://code.claude.com/docs/en/skills) that makes model routing the default instead of the exception. The session's top model orchestrates — plans, decomposes, briefs, reviews — and delegates execution to subagents on the cheapest Claude model that will reliably succeed.

Inspired by [Cursor's post on model routing](https://cursor.com/blog/router), adapted for Claude Code's actual tool surface.

## Why

In Claude Code, subagents inherit the orchestrator's model by default: unless the orchestrator explicitly sets the Agent tool's `model` parameter, every delegated task runs on the most expensive model in the session. This skill flips that default. Mechanical work goes to Haiku, clear-spec implementation to Sonnet, design-quality and craft work to Opus, and the top model is reserved for orchestration and the work that genuinely needs it.

## The routing table

| Tier | Model | Task classes |
|------|-------|--------------|
| 1 — Cost | `haiku` | Mechanical: renames, imports, formatting, boilerplate, config, docstrings, grep-and-report |
| 2 — Balance | `sonnet` | Clear-spec single-file features, routine UI, single-module refactors, CRUD/APIs, tests for known behavior |
| 3 — Craft | `opus` | Design-quality frontend, animation/motion, design engineering, complex-but-bounded features, thorough review |
| 4 — Frontier | omit `model` | Architecture, subtle correctness (concurrency, migrations, auth), security-sensitive, silent-failure risk |

Plus the rules that make the table safe to use: a briefing checklist (subagents start cold), a strict escalation ladder (one specific rejection at the same tier, then one tier up, never a third same-tier attempt), a no-silent-repair rule, and a hard floor — security and migration work never routes below Tier 4. Untested code treats verifiability as low: route one tier up or have a test agent build the safety net first.

## Install

Copy the `model-router/` directory into your skills directory:

```bash
cp -r model-router ~/.claude/skills/model-router
```

Or install it for a single project by copying it to `.claude/skills/model-router` inside the repo.

No other skills or plugins are required. If role-relevant skills (design, animation, testing) happen to be installed in a session, the orchestrator names them in the subagent's brief — but none are dependencies.

## How it was verified

The skill text was tested, not just written:

- **Live mixed session** — bypass, Tier 1, Tier 2, and Tier 4-class tasks routed per the table against a real test project (`testbed/`); all tiers passed review first-attempt, agents stayed inside their assigned blast radii. A separate live Tier 3 (Opus) design task produced `testbed/demo/index.html`.
- **Routing-compliance micro-test** — fresh-context agents were given the skill text plus task vignettes and asked for their routing decision, including no-skill controls. Six of seven vignettes routed correctly on the first run; the seventh exposed a bypass-rule loophole (a multi-file rename classified as "smaller than the ceremony"), which was fixed and re-verified. The controls showed the skill changes real behavior: without it, design-quality work runs at top-tier inherit.

Known limits: vignettes were single-sample (smoke-level evidence, not statistical), and the escalation ladder's second rung has only been tested as stated intention, not observed live. Per-subagent thinking-effort control is deliberately **not** part of this skill — the Agent tool has no effort parameter, so the skill routes by model alone and says so.

## Repo layout

```
model-router/SKILL.md   the skill itself — this is what you install
testbed/                the small JS project used for live verification
```

## License

MIT
