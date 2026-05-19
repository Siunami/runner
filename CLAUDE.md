# Design Guidance for Runner Prototypes

This file collects design principles that have come up repeatedly across prototyping sessions. Read this before designing any interaction, animation, or visual element. These are not style suggestions — they are rules learned from iteration.

---

## 1. Speed beats theatrics

Animations exist to make state changes legible, not to perform. The user will do these actions hundreds of times — anything that gets in the way is friction.

- **Default to short durations**: 220ms crossfades, 280–420ms morphs. Anything past ~500ms had better be doing real work.
- **No cute flourishes on hot paths.** If a label flip will be triggered hundreds of times, the flip itself must be fast and unobtrusive.
- **Calm > noisy.** Letter-by-letter scramble effects, sparkle reveals, and staggered per-character animations almost always read as noise. Prefer a single clean crossfade.
- **Respect `prefers-reduced-motion`** for any non-essential motion.

> "make it fast. It can't get in the way. All these actions you are going to be doing hundreds of times."

---

## 2. No AI slop — motion must be honest

The pulse-dot, the "Runner is thinking…" animation, the spinner that spins forever — these are AI-product clichés that signal performance instead of state. Avoid them.

The test: **does the visual change because real data changed?** If yes, ship it. If it's animating for vibes, cut it.

- **Static frame, dynamic value.** A CI build clock (`Active · 47s` → `48s`) is honest because the number is real. A pulsing green dot with no underlying signal is not.
- **If you cycle text, every entry must be a real distinct operation.** `Querying Logfire · alice@…` → `Querying Logfire · bob@…` is fine — same tool call, different target. `Reading…` → `Thinking…` → `Drafting…` is slop.
- **Use familiar conventions from real systems**: `Last run · 2m ago`, `Online · 32s`, `tail -f`-style log lines. Don't invent new visual languages for things that already have honest ones.
- **One honest state sentence beats an activity ticker.** "Drafted agenda and risk sections — holding for your framing decision" is more useful than a cycling list of vague verbs.

---

## 3. Context-sensitive information graphics (Bret Victor / Magic Ink)

When a decision needs information, show the information *as the interface*, not text describing the information. Read [Magic Ink](http://worrydream.com/MagicInk/) and [Tangle](https://worrydream.com/Tangle/) for the source ideas.

- **Show a map for hotels**, with prices on the pins, cross-highlighting between pins and cards.
- **Show a calendar mini-grid for scheduling**, with existing meetings drawn in so the user can see how a proposed slot lands.
- **Show the email draft inline** instead of asking the user to click "Reply" to find out what it does.
- **Show the flight cards** with prices, times, and per-column selection — let the column itself be the booking button.
- **For numeric inputs, make them draggable** (Tangle-style) so the user can scrub values directly.

Whenever you find yourself writing text like "Runner found 3 flights" — stop and show the flights instead.

---

## 4. Reduce text, increase visual reading

When a card looks bad, it's usually because there's too much text doing the work of icons, chips, badges, and layout.

- **Chip rows beat eyebrow labels.** `[⚡ Operational] [⚠ Needs you] [Active · 5m]` beats three lines of `RUNNER IS WORKING / STATUS / DURATION`.
- **Icons in tinted circles beat bulleted lists** when the items are categorical (sources, kinds, types).
- **Bold the single thing that matters** when it's the only signal. If "12 items" is the entire content, it should be the heaviest text in the card.
- **Hierarchy by weight and color, not by box-drawing.** Don't add borders/backgrounds to create hierarchy when type weight and color contrast will do it.

---

## 5. Smooth transitions between states

State changes — open/close, expand/collapse, swap, morph — should always be animated. Snapping reads as a bug.

- **Cards collapse and expand smoothly.** When confirming an action collapses the card, animate the height change. When stacking new alternatives below an artifact, animate them in.
- **One DOM node that transforms its position is always better than two nodes that crossfade.** When a chip moves from bullet position to card header, it should be the same element with a transform, not two chips fading in and out.
- **Stagger reveals in a clear order** ("staircase") when multiple things appear at once: surface → accent → chip → title → sources. Cascade, don't dump.
- **When dismissing a UI, animate it out** — same duration as the entrance, opposite direction. A panel that fades in but vanishes instantly feels broken.
- **`prefers-reduced-motion`** disables the staircase, keeps the final state.

---

## 6. Treat the frame as the interface

When prototyping inside a gray frame (or any container that represents the production surface), keep the frame clean.

- **Prototype-only controls** (stage dots, Reset, Back, Replay) go *outside* the frame.
- **Real production controls** (primary actions, toolbars, filters) go *inside* the frame.
- **The user should be able to imagine the frame zoomed to full-screen and have it still make sense.** No "Step 2 · Triaged" captions floating inside the frame — those are scaffolding.

---

## 7. Consistent language across states

The label for a concept must not change when the view changes.

- If a section is called "Looking at" in compact mode, it stays "Looking at" in expanded mode.
- Mode shifts (working → watching) don't get to rename labels either — only the *content* changes.
- Renaming the same field per-state is one of the fastest ways to make an interface feel sloppy.

---

## 8. Every suggestion chip must do real work

Suggestion chips, quick actions, and shortcut affordances are promises. Each one must:

- **Have a real handler** — never fall through to a generic "Looking into it…" reply.
- **Reference the actual data in the card.** "Walk under 5 min" on a hotel card must check the actual hotels and return a specific answer about them.
- **Produce a contextually accurate response** with real numbers, real options, real next steps.

Generic mocked suggestions destroy trust. The user notices instantly.

---

## 9. Universal escape hatches

Every card-shaped surface needs a natural-language input so the user can redirect Runner without hunting for the right button.

- **Pill input + suggestion chips above it.** Placeholder copy is context-aware ("Tell Runner to check now, change the trigger…" for a monitor; "Push back, ask for alternatives…" for an action card).
- **Multiple ways to exit a mode.** Bunny click, × button, Cancel button — three coherent exits beat one cryptic one.
- **The chat is the catch-all** for anything the suggestion chips don't cover.

---

## 10. Affordances must be obvious

If a button's behavior is non-obvious, the affordance is failing. The fix is rarely better wording — usually it's showing the consequence.

- **Show the draft inline** instead of relabeling "Reply" to "View draft." The draft *is* the affordance.
- **Per-column selection is its own commit** — the column inverting to black-and-white with a "Selected" badge is the booking confirmation; don't add a separate "Book with X" button below.
- **Icon-only buttons need tooltips + `aria-label`.** A bare arrow icon must announce "Open session" on hover/screen reader.

---

## 11. Information hierarchy and density

Every card should answer at a glance:

1. *What is this?* (chip row + title)
2. *What's the state?* (one honest sentence, no theatrics)
3. *What needs my attention?* (Needs You hero block, if any)
4. *What is Runner currently doing?* (Currently line, only if actively executing)
5. *What can I do?* (actions + chat escape hatch)

Other rules:

- **Most recent activity above the fold in collapsed mode.** "12 min ago · Polled · no change" tells the user the system is alive without forcing them to expand.
- **Cards hug their content** — `width: auto` with a `max-width` cap, never a fixed width that creates dead space.
- **Single-line `white-space: nowrap`** for pill rows, chip rows, and any "[count] to [chip]" patterns. Wrapping looks broken.
- **No vertical waste.** If the action row only has Cancel/Apply and 12 items left of it, they fit on one line.

---

## 12. Cross-highlighting for coherent interfaces

When two visual elements represent the same underlying thing, hovering one should highlight the other — bidirectionally.

- Hotel card hover → map pin lifts.
- Map pin hover → hotel card highlights.
- Use a shared identifier (pin number) visible on both sides so the relationship is decodable without hovering.

This is what makes a screen feel like one interface instead of a stack of widgets.

---

## 13. Bubble / notch / panel metaphor for facilitated actions

When an agent (the bunny, Runner, anything anthropomorphic) is the facilitator of a multi-step interaction, treat the visual thread as one continuous bunny-message:

- **Bubble** at the top = what the agent is doing / what the user picked.
- **Notch** = visual connector from bubble down to the controls.
- **Panel** below = the controls for that action.

When the user picks an option, the option's bubble slides up to the agent's vertical level (fluid motion, not snap) and stays present as the label. The controls fade in beneath. This sells the metaphor that the agent is holding the operation for you.

---

## 14. Match production fidelity

Even prototypes should look like the real product. Reference and extend the design system in `src/design-system/` — don't invent ad-hoc tokens.

- Use the canonical color tokens (`--foreground`, `--info`, `--success`, etc.).
- Use the existing primitives (`Heading`, `Meta`, `SourceCluster`, `LaneBlock`, `NeedsStack`, `AskRow`, etc.) when they fit. Extend them when they don't, rather than duplicating.
- Add new primitives to `/design-system` so future prototypes pattern-match.

---

## 15. Responsive via container queries, not viewport

Cards live inside dashboards. They get resized by their container, not the viewport. Use container queries (or width-based logic on the card itself) to switch layouts — stacked on narrow, side-by-side on wide. Don't read `window.innerWidth`.

---

## 16. Cap structural complexity

Power-user features that let users build their own structure (outlines, nested lists, custom hierarchies) almost always invite procrastination through architecture.

- **Cap nesting at 2 levels** in outliner-style interfaces — top-level + one nested level.
- **Default to flat over hierarchical** when in doubt.
- **The system should infer structure** (which items are subtasks of which) rather than asking the user to organize as they capture.

---

## 17. Don't change layout dimensions during mode switches

When a row enters "edit" or "staged" mode, its height should stay the same. The user's eye is locked onto that row — a height jump is jarring.

- Use inset decorations (a tinted pseudo-element pill, an icon swap) for state changes.
- Avoid adding new rows of inline UI inside a list item when staging it. Move the UI elsewhere (a panel docked to the side).

---

## 18. The two questions a live-work card must answer

Whenever you design a card that shows ongoing work, anchor on these two questions:

1. **What are you working on right now?** → one honest state sentence below the title. Past-tense progress + current hold/blocker. Static text.
2. **What needs my attention?** → a Needs You hero block. Amber-railed. Stacked decision mini-cards if there are multiple.

Everything else (sources, schedule, footer) is supporting context. Lead with these two answers.

---

## 19. Honest "active" status

A card that's currently executing work can show an `Active` state — but render it like a CI build badge, not a performance:

- Static chip with a real elapsed-time counter (`Active · 5m 28s`). Tabular numerals so digits don't jitter.
- Tied to a real server-side `activeSince` timestamp (in prototypes, seed at mount time and note the caveat).
- No pulse, no spinner. The number changing *is* the signal.
- A card can be Active and still need user input — the two are independent.

---

## 20. The card collapse rule

Once a user takes the committal action on a card (confirm booking, send email, archive), the card should smoothly collapse to a 1-line summary that preserves the chrome (chip, title) so it reads as a resolved entry. Don't unmount it — collapse it. The user just made a decision; show that the system received it.

---

## Quick reference — the rules in one sentence each

1. Fast > slow. Calm > noisy.
2. Don't fake progress. Show real changing data only.
3. Show the information, don't describe it.
4. Less text, more visual.
5. Animate every state change.
6. Frame = production interface. Scaffolding goes outside.
7. Same label across states.
8. Every chip does real work.
9. Universal chat escape hatch on every card.
10. Show the consequence as the affordance.
11. Answer "what is this," "what's the state," "what needs me," "what can I do" at a glance.
12. Cross-highlight related visual elements bidirectionally.
13. Bubble → notch → panel for facilitated actions.
14. Use the real design system.
15. Container queries, not viewport.
16. Cap nesting at 2 levels.
17. Don't change row heights in edit modes.
18. Lead with "what are you working on" and "what needs me."
19. Active is a status badge with a real clock, not a performance.
20. Confirm collapses the card; don't unmount it.
