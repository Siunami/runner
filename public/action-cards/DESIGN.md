# Action cards — design language

The action-cards prototype shares one CSS file and one visual grammar. This doc is the source of truth for both. New cards must pass a quick read of these rules before they ship.

## 1. Color philosophy

**Default to neutral.** The warm-dark / warm-white spectrum carries 95% of the UI. Color is a *signal* that costs attention — use it only when the signal is worth the cost.

### When color is allowed

- **Destructive red** — reserved for **hard-delete** action text (permanently destroys data) and for **incident-grade priority signal** (P1 only, as a small dot prefix). Never as a background fill on a non-action element. **Discard / Skip / Reset are recoverable** → plain neutral `.link-btn`, not danger.
- **Success green** — only on the chip that confirms an action the user just took (e.g., `Sent ✓`, `2 sent`). Quiet — a tint, not a fill.

### When color is not allowed

- **No amber / yellow.** "Heads-up," "Decision needed," "Connector data broken" — all rendered with neutral surfaces and a `⚠` or `ⓘ` icon.
- **No accent blue.** Drop it.
- **No multi-color priority pills.** P1/P2/P3/P4 share one neutral chip style; differentiate with text or a small dot.
- **No green for "everything is fine" status** ("✓ both clear," "memory updated," etc.). Use a neutral check + muted text. Green is the *finish line*, not the *idle state*.

### Tokens

```
Neutrals
  --bg-base:         #21201d
  --bg-panel:        #26272D
  --bg-card:         #2E2F35
  --fg:              #f7f7f5
  --fg-85:           rgba(247,247,245,0.85)
  --fg-70:           rgba(247,247,245,0.70)
  --fg-50:           rgba(247,247,245,0.50)
  --fg-30:           rgba(247,247,245,0.30)
  --fg-15:           rgba(247,247,245,0.15)
  --fg-10:           rgba(247,247,245,0.10)
  --fg-5:            rgba(247,247,245,0.05)
  --border:          var(--fg-5)
  --border-strong:   var(--fg-10)

Signal (sparing)
  --destructive:     rgba(239, 68, 68, 0.85)
  --destructive-bg:  rgba(239, 68, 68, 0.10)   /* dot prefix only — not whole chips */
  --success:         rgba(34, 197, 94, 0.85)
  --success-bg:      rgba(34, 197, 94, 0.10)
```

`--info` (amber) and `--accent-blue` are not part of the system. Don't introduce new usages.

## 2. Typography

Five sizes. No more.

| Role     | Size   | Weight | Use                                   |
|----------|--------|--------|---------------------------------------|
| Title    | 16px   | 600    | Card `h2`                             |
| Section  | 13.5px | 600    | `h3`, subject line, ticket title       |
| Body     | 13.5px | 400    | Paragraphs, inputs, textarea          |
| Caption  | 12px   | 500    | Meta, tally, "1 / 8" position counter |
| Label    | 11px   | 500    | Field labels (uppercase, 0.04em)      |

Italic is reserved for inline notes / warnings, never for body content.

## 3. Spacing

Base unit: **4px**. Use only: `4, 8, 12, 16, 24, 32`. Don't invent intermediates.

## 4. Components

### Chip

One shape. Pill (~999px radius). Neutral by default.

- `.chip` — `--fg-5` bg, `--fg-70` text. For all metadata, priorities, tags.
- `.chip.is-sent` — `--success-bg` bg, `--success` text. Only after a Send.
- `.chip.is-discarded` — `--fg-5` bg, `--fg-50` text, line-through. After a Discard.
- `.chip.is-p1` — neutral chip with a small `--destructive` dot prefix (`●`).

P2/P3/P4 = plain neutral `.chip` with the text "P2" etc. No `.chip.high`, `.chip.med`, `.chip.p2`.

### Button

Four variants. That's all there is.

- `.btn.primary` — `--fg` bg, `--bg-base` text. *One* per action group. The forward action.
- `.btn.ghost` — transparent bg, `--border-strong` border, `--fg-85` text. Secondary.
- `.btn.link` — text-only, `--fg-70`, no border. Tertiary.
- `.btn.link.danger` — text-only, `--destructive`. **Only for hard-delete** (permanently destroys data). Never on Discard / Skip / Reset.

### Field row

Borderless inputs. Field rows separated by a single thin `--border` rule. The data reads as text, not as a form. Labels appear only when meaning isn't obvious from position.

### Composer (the standard for batch operations)

```
Title                                ‹ n / total ›
(optional tiny "from" line, muted)

[chip] [chip] [chip]                                    ← context strip

(content area — editable)

(optional inline warning — italic, neutral)

────────────────────────────────────
Discard (link danger)   tally (caption)   Action all N (link)   Action (primary)
```

Done state replaces content + footer when nothing pending; single `Reset` link.

### List row (read-only)

Use only when items don't need editing. If editing is on the table, use the composer instead — that's the rule.

## 5. Patterns

- **Batch operations** → composer. No exceptions in this prototype.
- **Status indication** → quiet visual cues (left border, opacity, subtle chip). Not loud colors.
- **CTAs** describe the action, not the urgency. "File all 6," "Send" — never "Review #1 first (P1 blocker)." Card structure must make the priority visible; copy doesn't carry that load.
- **Warnings** → single-line italic note with `⚠` icon in `--fg-70`. Not a yellow box.

## 6. Anti-patterns

- Yellow callouts. Banner-style colored warnings.
- More than one primary button in an action group.
- Verbose CTA buttons that double as a hint ("Review #1 first (P1 blocker)").
- Chips that change color per category. Pick one chip style; differentiate with text or a small dot.
- Per-component custom paddings outside the spacing scale.
- Nested cards (`.card` inside `.card`). Use sections within a single card instead.

## 7. Adding a new card

Before writing CSS:

1. Does the user need to edit per item? → composer.
2. Read-only / just browse? → list rows in a single card.
3. Does any text need color? Re-read § 1. The answer is almost always no.
4. Does any button need its own variant? Re-read § 4. The answer is no.

If you need an exception, document it here and justify the signal cost.
