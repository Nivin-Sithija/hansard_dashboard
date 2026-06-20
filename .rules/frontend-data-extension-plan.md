# Frontend Data Extension Plan

This file defines the next required data extension for the public frontend.

## Immediate Next Data Requirement

Add a sourced topic-to-event mapping layer so topic pages, word clouds, and timeline annotations can connect model output to real-world events.

## Required Output Files

The next developer should plan to produce static JSON artifacts like:

- `topic_event_links.json`
- `event_sources.json`
- `topic_keyword_event_links.json`

## Minimum Suggested Structures

### `topic_event_links.json`

Each topic entry should support:

- `topic_id`
- `topic_label`
- `events`

Each event should support:

- `event_id`
- `title`
- `start_date`
- `end_date`
- `summary`
- `reason_for_link`
- `source_ids`

### `event_sources.json`

Each source should support:

- `source_id`
- `title`
- `publisher`
- `url`
- `published_date`
- `source_type`

### `topic_keyword_event_links.json`

Each record should support:

- `topic_id`
- `keyword`
- `event_ids`
- `note`

## Data Quality Rules

Every event link must be:

- human-readable
- source-backed
- date-grounded
- explicit about why it links to the topic

Do not emit:

- speculative links
- unsourced links
- event tags without descriptions

## UI Consumption Rules

Frontend consumers should be able to use these files for:

- topic detail “Related events”
- timeline evidence callouts
- word cloud keyword-to-event linkage
- future compare pages
