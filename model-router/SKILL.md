---
name: model-router
description: Use when a Claude Code session involves multiple delegable coding or design tasks, when the user mentions saving tokens, cost, model routing, subagents, or specialists, or when the user is stuck on a design decision and comparing mockup variants would help them decide. Consult before spawning any subagent.
---

# Model Router

The session's top model (Fable) is the orchestrator: it plans, decomposes, routes, briefs, reviews, and integrates — and never delegates those jobs. Subagents execute. Cheap models never decide what to execute or grade their own work.

Why this skill exists: subagents inherit the orchestrator's model by default, so without an explicit `model` override every subagent runs at top tier. This skill makes routing the default instead of the exception.

## Per-task checklist

1. **Bypass?** If the task is a single edit in one place (one-liner, typo, trivial config value), the orchestrator does it inline. No subagent, no review loop. Anything that touches multiple files or needs a search across the codebase is not a bypass — mechanical multi-file work is Tier 1, not orchestrator work.
2. **Keep?** If success will be judged by the user's eye against a reference — implementing a specific design (Figma, mockup, screenshot), matching a visual or tonal target — the orchestrator does the work itself. There is no verification command a subagent can run, so every feedback round pays a user → orchestrator → subagent translation and loses fidelity. Delegate only self-contained slices with checkable criteria (extract the design tokens, build the test harness), not the fidelity-judged whole. This is about matching a reference the user holds; generative design work from a brief still routes per the table.
3. **Model tier** — see table. Set it with the Agent tool's `model` parameter.
4. **Brief** — subagents start cold. Include: exact file paths or code, codebase conventions and constraints, the plan slice (why this task exists), an explicit blast radius (files it may touch), acceptance criteria, and a verification command to run and report. A thin brief is an orchestrator failure.
5. **Review on return** — read the diff, re-run the verification yourself, judge against the criteria. No rubber-stamping.

## Routing table

| Tier | Model | Task classes |
|------|-------|--------------|
| 1 — Cost | `haiku` | Mechanical: renames, imports, formatting, boilerplate, config, mirror-an-existing-test, docstrings, grep-and-report, commit messages |
| 2 — Balance | `sonnet` | Clear-spec single-file features, routine UI components, single-module refactors, CRUD/APIs, tests for known behavior, small-diff review, debugging with a clear error and locus |
| 3 — Craft | `opus` | Design-quality frontend and UI polish, animation/motion, design engineering, complex-but-bounded features, multi-module refactors with test coverage, thorough code review, debugging without a clear locus |
| 4 — Frontier | omit `model` (inherits top model) | Architecture, cross-cutting refactors, long-horizon debugging, performance, security-sensitive code, subtle correctness (concurrency, migrations, auth), silent-failure risk. Usually the orchestrator keeps these; delegate only when isolation or parallelism is worth it |

Signals: crisp spec, small blast radius, verifiable by tests, existing pattern to copy → lower. Ambiguous, wide, silent-failure-prone, novel → higher. Mixed task → decompose and route the pieces. **No test suite covering the code? Treat verifiability as low: route one tier up, or have a test agent build the net first.**

Effort/thinking budget is not settable per subagent on the Agent tool — do not plan or report effort routing there. Per-agent effort exists only inside Workflow runs (`agent()`'s `effort` option); use it when a Workflow is already justified, and route by model alone otherwise.

## Specialists are briefs, not agent types

There are no specialist agent types. A "specialist" is a role stated in the brief (frontend, design engineering, animation, backend, test engineering). If skills relevant to that role are installed in the session, name them in the brief so the subagent loads them; none are required by this skill. Roles where output quality is a matter of taste rather than a test passing — design, motion, visual polish — default to Tier 3 (`opus`); routine implementation roles default to Tier 2.

## Review loop and escalation

1. On failure, check the brief first. Thin brief → fix it and resend, same tier; doesn't count against the ladder.
2. Real failure → reject ONCE back to the same agent (follow-up message to the same session, so it keeps its context) with specifics: what's wrong, where, what passing looks like.
3. Still failing → escalate one tier. Never a third same-tier attempt. Escalating past Tier 3 means the orchestrator takes the task itself — not a top-model subagent.
4. A user rejection of delegated work is a failure on this ladder — it counts, it never resets. The second time the orchestrator relays user feedback to a subagent on the same task, delegation stops: the orchestrator takes the task for the rest of the session and says so.
5. Tier 4 failure = underspecified task. Stop and clarify with the user.
6. Only reviewed work lands. If the orchestrator keeps repairing a tier's output — even small touch-ups it would rather make than bounce — that task class moves up a tier for the session, and the orchestrator says so.

Escalate immediately (skip the retry) if a subagent ignores stated constraints or edits outside its blast radius.

Batch same-tier follow-up work into the same agent session with a follow-up message instead of spawning a fresh agent.

## Mock agent (design decision support)

When the user is stuck on a design decision, offer 2–3 disposable variants from a Tier 2 mock agent (Tier 1 for rough structure) so they compare options instead of approving in the abstract. Review asks only: does each mock faithfully represent its option? Route the real implementation normally afterward; promote a mock to a starting point only if structurally sound.

## Parallelism

Spawn subagents in parallel only when their briefed file sets don't overlap; the orchestrator assigns disjoint blast radii in the briefs. Overlapping work runs in sequence.

## User overrides

Named model or "just do it here" → comply. Max quality → Tier 3 minimum everywhere, Tier 4 where the table already says so. Min spend → shift down one tier where tests exist, but never route security or migration work below Tier 4. A routing override sticks for the session. Report each routing decision in one line so the user can tune the table.
