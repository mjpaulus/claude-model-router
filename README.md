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

## Cost model

**Routing is not model switching.** A common objection: "switching to a cheaper model invalidates the prompt cache — with 150k tokens of context, committing with the top model and reading from cache costs less than re-ingesting 150k tokens on Sonnet." The mechanism is real (prompt caches are per-model, and cache reads cost ~0.1× the base input price), but it describes mid-thread model switching, which this skill never does. The orchestrator's thread stays on one model for the whole session, so its cache is never invalidated. Routing means spawning a fresh-context subagent whose input is a small brief (typically 1–3k tokens) — the orchestrator's context is never re-ingested by anyone, on any model. Delegating to a cheaper model for a sub-task while the main loop stays put is also exactly the workaround Anthropic's own agent-design guidance recommends for the per-model cache constraint.

**Where the savings actually come from.** In verification runs, token counts were similar across tiers (~30–45k per task), so the savings are almost entirely the per-token price gap — roughly 10× between Haiku and the top tier on input, and larger on output (illustrative July 2026 list prices per MTok, in/out: Haiku $1/$5, Sonnet $3/$15, Opus $5/$25, Fable $10/$50 — check current pricing). On a subscription plan the same routing buys rate-limit headroom rather than dollars.

**The real cost variable is context acquisition, not the cache.** A subagent starts cold and must re-gather whatever context it needs (running `git diff`, reading files). Delegation pays when the task needs little of the orchestrator's context — mechanical, bounded work with a small brief. It costs when the subagent would have to rebuild large context the orchestrator already holds, which is why the Tier 4 row says the orchestrator usually keeps that work itself, and why the bypass rule exists at all: for a trivial task, the orchestrator pays its (cached) turn to dispatch and review anyway, so spawning a subagent is strictly additive.

## FAQ

**Doesn't switching models break prompt caching?**
Only if you switch the *conversation's* model, which this skill never does — see the cost model above. Subagents are separate fresh contexts; the orchestrator's cache survives every delegation.

**Why would I delegate a commit to Haiku instead of letting the orchestrator do it on its warm cache?**
You usually wouldn't — that's the bypass rule. The orchestrator handles anything smaller than the delegation ceremony inline, on cached context. The Tier 1 row is for mechanical work with real volume (a rename across files, boilerplate generation), where a cheap subagent does the mechanical labor and the orchestrator only reviews.

**Why does Tier 4 say "omit `model`" instead of naming a model?**
Omitting the parameter makes the subagent inherit the session's top model, whatever that is. It keeps the skill evergreen across model generations, and it reflects the reality that Tier 4 work usually stays with the orchestrator anyway.

**Why doesn't the skill set thinking effort per subagent?**
Because the Agent tool has no effort parameter — per-agent effort only exists inside Workflow runs. An earlier draft had an "effort dial" section; testing showed it was silently skipped on every task, so it was cut. A skill instruction that can't execute is worse than none.

**What happens when a subagent fails?**
The escalation ladder: first check whether the brief was thin (fix and resend, same tier — doesn't count). Real failure gets one specific rejection back to the same agent, then one tier up. Never a third same-tier attempt. Tier 4 failure means the task was underspecified — stop and ask the user.

## Repo layout

```
model-router/SKILL.md   the skill itself — this is what you install
testbed/                the small JS project used for live verification
```

## License

MIT
