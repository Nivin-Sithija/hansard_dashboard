# Frontend Product Rules

This document is the binding product and design spec for the public-facing Hansard frontend.

Any future developer working on the frontend must treat this file as the primary guardrail for:

- visual theme
- page layout
- required content
- interaction design
- topic-to-event linking behavior
- scope boundaries

If a future implementation idea conflicts with this document, this document wins unless the repo owner explicitly updates it.

## Product Identity

The frontend is **not** a generic research dashboard and must not feel like a notebook export.

It is a:

- **trilingual Sri Lankan Parliamentary Debate Explorer**
- **public-facing political intelligence interface**
- **research-backed civic product**

The user should feel they are exploring:

- what Parliament talked about
- when attention shifted
- which macro-topics mattered
- how those topics connect to real-world national events

The frontend must always lead with:

- story
- evidence
- interpretability

It must not lead with:

- raw model internals
- unlabeled scatter plots
- generic KPI cards without explanation

## Non-Negotiable UX Direction

The product direction is:

- **Observable-style interactivity**
- **editorial story framing**
- **civic/public-interest tone**

The UI must feel:

- modern
- deliberate
- editorial
- evidence-driven
- multilingual-aware

The UI must not feel:

- like default admin SaaS
- like a BI dashboard template
- like a research notebook screenshot
- like a chart gallery with weak narrative

## Visual Theme Rules

### Overall tone

Use an **editorial civic intelligence** visual system.

The mood should be:

- serious but inviting
- polished but not corporate
- distinctive but not flashy

### Color rules

Use a restrained palette with a warm civic base and strong accents.

Preferred palette direction:

- off-white / parchment / warm paper backgrounds
- deep ink / charcoal primary text
- muted teal
- saffron / amber
- maroon / rust
- slate for neutral states

Do not use:

- generic blue-only SaaS palette
- purple-heavy gradients
- dark mode as the default visual identity
- neon or gaming-style saturation

Color must communicate:

- section hierarchy
- topic identity
- interaction state
- annotations

Macro-topic colors must be:

- stable across all pages
- reused consistently in atlas, timeline, cards, and filters
- defined centrally, not ad hoc inside individual components

### Typography rules

Use typography with obvious hierarchy and editorial presence.

Required:

- one strong Latin UI/display font for headings and interface
- `Noto Sans Sinhala` for Sinhala text rendering
- `Noto Sans Tamil` for Tamil text rendering

Typography must support:

- large statement headlines
- compact chart annotations
- readable speech excerpts
- multilingual labels without fallback problems

Avoid:

- plain system-font-only presentation
- weak title hierarchy
- oversized all-caps overuse

### Layout rules

Pages must use:

- full-width story sections where appropriate
- comfortable whitespace
- clear rhythm between narrative and charts
- fewer boxed card grids than the old dashboard

Avoid:

- dense grid-only dashboards
- every section boxed the same way
- “same card repeated 12 times” layouts

## Architecture Rules

The frontend must remain:

- static-hostable
- based on precomputed JSON
- browser-routed

No runtime backend is required for v1.

All heavy interpretation and aggregation should be precomputed before the frontend consumes it.

Frontend logic should prioritize:

- rendering
- filtering
- linking views
- evidence display

Frontend logic should not become the place where major research transformations happen.

## Core Routes

These are the required public routes:

- `/`
- `/topics`
- `/timeline`
- `/speeches`

These are reserved routes and should remain scaffolded for future growth:

- `/speakers`
- `/compare`
- `/methodology`
- `/data`

Future developers must not remove the reserved-route structure unless the product direction changes explicitly.

## Required Page Content

### 1. Overview

The Overview page is the public landing page and must be the strongest story page.

It must contain:

- a hero statement tied to the paper’s core claim
- a short explanation of what the explorer is
- KPI summary for:
  - speeches analyzed
  - years covered
  - macro-topics
  - languages
- a strong topic-over-time visual with event markers
- a “start here” set of topic cards
- a lightweight methodology summary
- a short explanation of:
  - macro-topics
  - procedural noise
  - multilingual clustering

The Overview page must not begin with:

- an unlabeled UMAP scatter
- a dense control panel
- a table dump

### 2. Topic Atlas

The Topic Atlas is the flagship interaction page.

It must contain:

- a 2D semantic map of speeches or topic points
- topic filtering
- year filtering
- language filtering
- hover interaction
- click-to-select interaction
- linked detail panel

The detail panel must show:

- topic name
- topic label
- total speeches
- peak year
- top keywords
- language composition
- top speakers where available
- representative speech excerpts

The atlas must communicate:

- semantic neighborhoods
- macro-topic separation
- multilingual overlap

The atlas must not be shipped as:

- a raw matplotlib image
- a static screenshot
- a plot without evidence or topic explanation

### 3. Timeline

The Timeline page is the main event-alignment page.

It must contain:

- macro-topic attention over time
- event markers for major national events
- support for comparing multiple topics
- explanatory narrative around key years

Required event anchors include at minimum:

- 2019 Easter Sunday attacks
- 2020 COVID period and constitutional change
- 2021 fertilizer ban / rising economic strain
- 2022 economic crisis / Aragalaya

The Timeline page must make it easy to see:

- spikes
- declines
- recurring issue clusters
- event-linked attention shifts

### 4. Speech Explorer

The Speech Explorer is the evidence page.

It must contain filters for:

- topic
- year
- language
- clustered vs procedural noise
- text query
- speaker query

It must show result cards with:

- date
- speaker
- topic label
- language
- excerpt
- speech identifier

The Speech Explorer should be treated as:

- evidence layer
- interpretability layer
- not merely a search utility

## Topic-to-Event Linking Rules

This is a mandatory feature direction.

The frontend must progressively connect cluster topics and word-cloud topics to **real-world events from cited sources**.

This is not optional decoration. It is part of how the frontend proves that the topics correspond to meaningful public events.

### What this means

For each major macro-topic, especially high-signal topics, the frontend should eventually support:

- related real-world event references
- date ranges
- short explanations of why the event is linked to the topic
- cited sources

Examples:

- Easter Sunday attacks topic linked to reporting / inquiry sources
- economic crisis topic linked to fuel shortages, debt crisis, IMF period, Aragalaya reporting
- COVID / healthcare topic linked to pandemic-era policy and vaccine period reporting

### Event-linking rules

Every linked event must have:

- a title
- a date or date range
- a short plain-language explanation
- at least one source
- a clear reason it belongs to the topic

The frontend must never imply a topic-event connection without evidence.

### Source rules

Sources used for event linking should prioritize:

- reputable news organizations
- official government or parliamentary records
- commission reports
- public institutional datasets

Future developers must not:

- invent event links
- infer event links silently
- add vague “this seems related” notes without sources

### UI rules for event linking

Event links can appear in:

- topic detail pages
- atlas detail panel
- timeline annotations
- word cloud or keyword views

Preferred UI patterns:

- “Related events” section
- keyword-to-event annotation chips
- event markers connected to topic spikes
- expandable evidence blocks

Not acceptable:

- unsourced event labels
- event names floating on charts without explanation
- cluttered tooltip-only sourcing

## Word Cloud Rules

Word clouds are optional as a hero visual and must not be treated as the main explanation mechanism.

If a word cloud is used, it must:

- support topic-specific context
- connect keywords to interpretable meaning
- not stand alone without explanation

The word cloud should be treated as:

- a secondary interpretability view
- a visual doorway into topic meaning

It must not be treated as:

- the final explanation of a topic

### Required enhancement

If a topic word cloud exists, it should eventually support linking topic keywords to real-world events and evidence.

This can be implemented as:

- keyword hover -> related event references
- keyword click -> event/evidence side panel
- topic summary block below the cloud with sourced event associations

The key rule is:

- **keywords must connect to meaning**
- **meaning must connect to evidence**

## Content Rules

All copy on the public-facing pages must be:

- plain-language first
- accurate
- concise
- non-jargony where possible

Research vocabulary should be translated for ordinary users.

Example:

- say “broader topic family” before “macro-topic aggregation”
- say “short procedural speeches filtered out by the model” before “HDBSCAN noise”

Do not remove methodological honesty.
Do simplify how it is introduced.

## Interaction Rules

The frontend should emphasize linked exploration.

Preferred interaction patterns:

- click a topic, update related detail views
- hover a point, reveal evidence
- select a timeline topic, carry context into details
- keep color/topic identity stable across views

Avoid:

- isolated charts that do not affect each other
- too many controls visible at once
- interactions that require expert prior knowledge

## What Future Developers Must Not Do

They must not:

- revert the product back into a generic analytics dashboard
- replace editorial sections with only chart cards
- remove multilingual support
- hide procedural noise explanation
- ship unsourced real-world event claims
- change topic colors inconsistently across pages
- make the Overview page chart-first without narrative framing
- reduce the Speech Explorer into only a raw table
- turn the Topic Atlas into only a static figure

## Required Data Extensions

Future frontend/data work should preserve and extend these data products:

- topic metadata
- atlas point data
- speech explorer records
- overview summary

Additional planned data products should include:

- topic-to-event mapping JSON
- event source metadata
- keyword-to-event association structure

Recommended future file shapes:

- `public/data/topic_event_links.json`
- `public/data/event_sources.json`
- `public/data/topic_keyword_event_links.json`

These should remain precomputed and static if possible.

## Acceptance Criteria For Future Work

A future frontend change is acceptable only if:

- the site still feels like a civic research explorer
- the Overview page still tells the story clearly
- the Topic Atlas still acts as the flagship exploration tool
- the Timeline still expresses event-linked attention shifts
- the Speech Explorer still exposes interpretable evidence
- multilingual rendering still works
- topic identity is visually consistent
- event linking remains sourced and explicit

If any future change weakens these properties, it should be considered a regression.
