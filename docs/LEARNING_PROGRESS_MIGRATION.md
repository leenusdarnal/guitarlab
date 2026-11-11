# Fresh Learner Profile Policy

## Status

The earlier personal progress-import plan is retired. GuitarLab must not import or preserve lesson continuity, lesson completion, personal practice history or skill ratings from previous chats, private context or external learning systems.

## Initial profile

A newly created GuitarLab profile starts with:

- no completed lessons;
- no current lesson carried over from another system;
- no imported skill mastery or assessment evidence;
- no imported practice notes, recordings or historical timestamps.

The default route begins at Year 1 Week 1. A learner may later choose an optional placement assessment, but it must be a new assessment performed within GuitarLab. It may recommend a starting point; it must not silently mark prior lessons complete.

## Privacy boundary

The public GitHub repository contains generic curriculum data only. Personal learner status, preferences, practice notes, recordings and assessment history belong in private local application storage. Never commit personal profiles, recordings or private seed fixtures.

## Implementation

When local persistence is implemented, create an empty profile with a schema version and a new local learner identifier. Do not seed private historical data. Provide ordinary export and restore for data created in GuitarLab, with clear confirmation before a destructive reset.
