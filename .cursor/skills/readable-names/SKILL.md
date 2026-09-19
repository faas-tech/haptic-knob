---
name: readable-names
description: >-
  Choose literal, unit-bearing names for functions, variables, types, files,
  database access code and diagram labels. Use when adding or changing code,
  proposing a rename, reviewing identifiers, or labelling a diagram of a
  system. Keeps collection, format validation, evidence assessment and review
  decision distinct in names, and keeps date kinds separate. Apply across
  projects; use ECM examples where their meaning fits. Prose vocabulary lives
  in ecm-voice or ecm-ai-language; load those for documents.
metadata:
  version: "1.0.1"
  author: shaunmartinak
---

# Readable Names

Name what something is, what it does, and what the evidence establishes. A
longer name is better when it saves the reader from guessing. Apply within
the requested change; when code is not being changed, propose names without
implying the refactor happened.

This skill does not authorize a codebase refactor, database migration, or
change in application behavior. Apply the general rules in any project. Use
ECM examples only when their meaning fits.

## Method

1. Identify the reader and the thing being named: record, check, decision,
   model request, stored value, displayed result.
2. Inspect the surrounding code before replacing an ambiguous term. Use a
   literal subject and action. Never pick a replacement from a thesaurus.
3. Keep framework, protocol, external API and legal names exact. Confirm the
   installed framework version before replacing any API name.
4. Never name a value for the later state you hope it reaches. Retrieved,
   well-formed, assessed and accepted are different accomplishments.
5. Keep one term for one meaning across code, screens, diagrams and prose.
   If the project has ecm-voice or ecm-ai-language, use those shared word
   choices. Otherwise keep the surrounding code's term.

Conventions, the four-stage table, date-kind rules and the avoid list are in
[references/identifiers.md](references/identifiers.md). Read it before
proposing more than a handful of names.

## Diagram labels

Label boxes with the component or record. Label arrows with the action or
information exchanged: "saves source document", "reads reviewed findings".
Do not add a component to a diagram that does not exist in the code.

## Refactor discipline

Do not rename framework conventions, external API fields, generated files,
applied migrations, signed records, original source text or historical audit
evidence to satisfy this skill. Map stored names to readable application
names at the database access point. A required format change needs an
explicit versioned plan. For a coordinated rename keep an old/new table with
owning file, actual meaning and treatment of stored forms, and update
diagrams, documentation and interface labels in the same change.

For a naming review, report current name, proposed name and a short reason.

## Versions

Every change to this skill or its reference bumps `metadata.version` and adds
a dated entry to `CHANGELOG.md`. Patch for wording; minor for a new rule or
convention; major for a changed convention that would rename existing code.
Never edit without bumping.
