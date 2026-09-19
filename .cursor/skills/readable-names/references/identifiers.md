# Identifier conventions

## Shapes

- Functions: verb + object + necessary qualifier. `collectSourceDocument`,
  `compareResearchStatements`, `saveReviewDecision`.
- Booleans: `is`, `has`, `should`, `can`. `hasSupportingExcerpt`,
  `canReviewStatement`, `shouldRetryRequest`.
- Numbers: measure and unit. `requestTimeoutMs`, `maxResponseBytes`,
  `maxOutputTokens`, `reservedCostUsd`, `confirmedCostUsd`,
  `requiredTestCount`. State the range for a score or ratio when the scale
  is not obvious.
- Collections say what they hold; maps say what they index.
  `pendingSourceReviews`, `statementIdToReviews`.
- Server/client context visible in the directory, filename or name:
  `fetchFindingsOnServer`, `*.server.ts`.
- One accurate role suffix for custom structural units: `Tool`, `Prompt`,
  `Schema`, `Client`, `Repository`, `Action`, `Store`, `Provider`, `Config`,
  `Error`, `Eval`. Components are subject + kind (`EvidenceList`); hooks are
  `use` + subject or action (`useResearchFilters`).
- camelCase for TypeScript values, PascalCase for types, snake_case in
  Python. Preserve required external JSON field names.
- Explicit names up to about 40 characters. Remove redundant context before
  abbreviating. Enclosing context can remove repetition:
  `SourceCollectionAttempt.startedAt` is readable; rename a destructured
  field to `collectionStartedAt` if the context disappears at the use site.
- Split responsibilities only when the implementation combines them. Length
  alone is not a reason to invent architecture.

## The four stages, kept separate in names

| Stage | Establishes | Example names |
|---|---|---|
| Collection | material was retrieved; saving is a separate successful write | `sourceRetrievalCompletedAt`, `sourceSavedToDatabaseAt` |
| Format validation | a value satisfies structural rules | `isSourceRecordWellFormed`, `parseSourceRecord` |
| Evidence assessment | specified checks evaluated the evidence | `evidenceSupportLevel`, `sourceDateCheckResult` |
| Review decision | an authorized reviewer decided about this revision | `statementReviewDecision` |

Do not name a model proposal `verifiedDate` or a format check `verifyFacts`.
Use `proposedSourceDate` or the actual named check. Distinguish
`modelReportedConfidence` from an evidence support score.

## Dates

Preserve publication, update, event, effective, reporting-period, patent
filing, priority, grant, system observation, retrieval and database-save
dates separately. `firstObservedByThisSystemAt` does not mean first published.
Use `date`, `month` or `year` when that is the supplied precision; use an
`At` suffix only when the value is a timestamp with that meaning. Keep
timezone and precision beside a source date where needed.

## Avoid when they hide the subject

`data`, `info`, `item`, `obj`, `temp`, `utils`, `helper`, `manager`,
`engine`, `orchestrator`, `pipeline`, `chain`, `brain`, `memory`, `layer`,
`gateway`, `spine`, `gate`, `claim`, `handler`, `service`, `wrapper`,
`processor`, `hub`, `core`, `base`, `common`, `misc`, `thing`, `flow`.

Established terms stay valid: supply chain, route handler, database, patent
claim, `page.tsx`, `route.ts`, `streamText`, `maxOutputTokens`. A single
model request is not an autonomous agent unless it behaves like one.
