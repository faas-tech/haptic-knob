---
name: ecm-ai-language
description: >-
  Choose plain, precise vocabulary for application explanations, documentation,
  diagrams, interface labels, and code names. Use when writing or reviewing ECM
  material, simplifying AI jargon, choosing readable identifiers, or applying
  the user's vocabulary preferences in other projects. Preserve technical meaning,
  evidence uncertainty, and required framework and API names.
metadata:
  version: "1.0.0"
  author: shaunmartinak
---

# ECM AI Language

Name what something is, what it does, and what the evidence establishes. Prefer
ordinary words and explicit names over metaphors, abbreviations, or impressive
labels. A longer name is useful when it saves the reader from guessing.

This skill applies to prose and naming. It does not authorize a codebase refactor,
database migration, new research run, or change in application behavior. Apply the
general rules across projects; use the ECM examples where their meaning fits.

## Choose words from the actual meaning

1. Identify the reader and the thing being described: person, document, statement,
   check, decision, model request, stored record, or displayed result.
2. Inspect the surrounding code or source before replacing an ambiguous term.
   Use a literal subject and action. Do not select replacements from a thesaurus.
3. Preserve established scientific, legal, framework, and protocol terminology.
   Explain it on first use when the reader needs that explanation.
4. Never make a name sound more certain than the operation warrants. Retrieved,
   format-validated, assessed, and accepted describe different accomplishments.
5. Keep one term for one meaning across prose, diagrams, screens, and code. Show
   the current identifier alongside its explanation when readers need to find it.

Say “required checks before historical collection,” not “the historical gate.”
Say “shared research record fields,” not “the intelligence spine.” A metaphor may
remain in a quotation, product name, or established technical term. Do not apply
mechanical word replacement to those cases.

## Writing and diagram labels

- Name the actor and action: “The reviewer checks the source date.” Avoid
  “Verification is operationalized through the review layer.”
- Use ordinary verbs: use, check, save, compare, send, collect, review, accept.
  Avoid padding such as leverage, unlock, robust, seamless, or holistic.
- Explain purpose before implementation details. Put the specific limitation next
  to the capability it limits. Distinguish proposed, implemented, tested, and
  demonstrated in live use.
- Prefer a clear sentence to a compressed noun stack. Extra words should remove
  ambiguity, not repeat the same point.
- Label diagram boxes with the component or record. Label arrows with the action
  or information exchanged: “saves source document,” “reads reviewed findings.”
  Do not add architecture or suggest a component exists merely to improve a diagram.
- Preserve original source quotations, source-language text, proper names, and
  exact identifiers in technical references.

Give It to Me Straight can be used alongside this skill for voice and document
structure. This skill is self-contained and governs vocabulary and naming when
that companion is unavailable. Do not import a chat response format into a PRD,
technical design document, spreadsheet, or diagram.

For a **full ECM application documentation edition**, include a one- or two-page
nontechnical executive brief explaining why the application exists, when it is
used, how it operates, and for whom it is built. This requirement does not turn
every short update or other project's document into an executive brief.

## Vocabulary choices

These are contextual examples, not unconditional aliases. Preserve distinctions
between records that the implementation stores separately.

| Term to inspect | Prefer when this is the intended meaning | Qualification |
|---|---|---|
| spine | shared research record fields | Name the shared records or requirements, not an imagined central component. |
| gate | required checks before running; acceptance requirements | Specify the operation and checks. Keep a literal logic gate or required framework term. |
| claim, assertion | reported statement; research statement; statement to review | A source reporting something does not establish its truth. |
| patent claim | patent claim | Keep the exact legal term and numbered source language. |
| JWT claim | login-token field in explanations; required `claims` API field in code | Authentication fields are unrelated to research statements. |
| artifact | retained source document; generated report | Determine what the artifact actually contains. |
| evidence packet | structured source evidence | It may reference a retained document; the two are not interchangeable records. |
| contract | input and output requirements | Keep exact schema/type names and genuine legal contracts. |
| adapter | named external API client; database access code | Use the actual responsibility; not every adapter is an API client. |
| projection | evidence details prepared for display | Use “projection” for a mathematical or other established meaning. |
| canonical | standard source URL; designated record | A standard identifier is not proof that its contents are correct. |
| digest, hash | content fingerprint; content hash | Detects changes or identifies bytes; does not prove truth. |
| head | current record revision | Keep Git terminology when discussing Git. |
| envelope, bundle, manifest | record with identifying details; skill files; research settings | Inspect contents. Keep required package and protocol names. |
| sidecar, receipt | attached review record; source-save confirmation; signed execution record | A save confirmation and a signed execution record establish different things. |
| signal, event | research finding; reported development | Preserve browser events, `AbortSignal`, and other established platform terms. |
| lane | research category | Name the category when known. |
| maturity | development stage; operating stage | Keep laboratory, qualification, construction, and production stages distinct. |
| attention | reporting volume | Volume of reporting is not importance or independent corroboration. |
| corpus, dossier | documents reviewed; company research record | State coverage or contents. Do not imply exhaustive research. |
| locator, anchor, passage | excerpt location; source excerpt | Identify the retained source version and exact supporting wording. |
| source family | related source group | Several URLs or translations may originate from one report. |
| attestation | recorded source review | Does not by itself establish final acceptance. |
| assessment | evidence quality check | Describe the checks and policy actually applied. |
| decision | reviewer decision; human acceptance | Reserve human acceptance for a decision a person actually made. |
| accepted_current | accepted with current checks | Do not remove conditions on current inputs, permissions, and review evidence. |
| stale, freshness | review is due; last checked at; valid until | Name what changed or needs another check. |
| pending | awaiting source review; awaiting confirmed charge | State what is missing when known. |
| entitlement, capability | document access permission; allowed action | Do not collapse document access and permission to perform an action. |
| actor, principal | reviewer; signed-in user; background service | Name the identity relevant to this operation. |
| workflow, orchestration | research process; ordered model and tool steps | Keep official workflow/agent API names where required. |
| preflight | model readiness check; checks before collection | Describe what is checked. |
| campaign | model comparison run | Keep the term for a genuine campaign in another domain. |
| route | model test sequence | A web route remains a web route. |
| independent pass | independent second analysis | Only independent if the earlier answer was withheld during the analysis. |
| reconciliation | answer comparison and correction | Billing reconciliation retains its separate financial meaning. |
| adjudication | review of unresolved disagreement | Do not imply disagreements were resolved just because another model ran. |
| rubric | scoring rules | Keep the denominator, criteria, and disqualifying errors visible. |
| trace, span | execution log; logged operation | Preserve vendor fields such as `traceId` and `spanId`. |
| budget ledger | model-test spending record | Retain reserved, confirmed, and unresolved charges separately. |
| dispatch | send model request; start collection | Describe the actual action. |
| bounded | limited to a stated document count, time, or cost | Give the actual limits when known. |
| backfill | historical data collection | Do not imply the historical coverage is already complete. |
| cursor, watermark | saved collection progress | Progress means what was processed, not proof of complete coverage. |
| slice, wave, work ledger | development task group; development task register | Keep established technical meanings in other contexts. |

Words such as `scope`, `authority`, and `provider` also need context. Distinguish:

- Search boundaries, statement coverage, affected products, and records a user
  can access.
- A publisher's relationship to a statement and a reviewer's permissions.
- React context providers, model service providers, and a source publisher.
- Model token counts, authentication tokens, and credentials.

## Accuracy must survive simplification

Keep these four stages separate in names and explanations:

| Stage | What it establishes | Example |
|---|---|---|
| Collection | Material was retrieved; saving requires a separate successful write | `sourceRetrievalCompletedAt`, `sourceSavedToDatabaseAt` |
| Format validation | A value satisfies specified structural rules | `isSourceRecordWellFormed` |
| Evidence assessment | Specified checks evaluated the evidence | `evidenceSupportLevel`, `sourceDateCheckResult` |
| Review decision | An authorized reviewer decided about the identified revision | `statementReviewDecision` |

Do not rename a model proposal `verifiedDate` or a format check `verifyFacts`.
Use `proposedSourceDate`, `parseSourceRecord`, or the actual named check. Distinguish
`modelReportedConfidence` from an evidence support score. Agreement between models
does not establish independent source corroboration.

Preserve publication, update, event, effective, patent filing, patent priority,
patent grant, system observation, retrieval, and database-save dates separately.
`firstObservedByThisSystemAt` does not mean first published anywhere. Unknown dates
remain unknown; a reported month does not justify inventing a day or timestamp.
Use `date`, `month`, or `year` when that is the supplied precision; use an `At`
timestamp name only when the represented value has that meaning. Preserve the
timezone and precision alongside a source date where needed.

Keep original-language wording distinct from a translation, reported quantities
distinct from calculated estimates, and source independence distinct from URL
count. A source is original **for a particular statement**; that does not make
the publisher correct about everything. Preserve disagreement and uncertainty.

## Code, file, and variable names

Apply these conventions within the requested change. When code is not being
changed, propose names without implying that the refactor has happened.

- Functions use verb + object + necessary qualifier:
  `collectSourceDocument`, `compareResearchStatements`, `saveReviewDecision`.
- Booleans use `is`, `has`, `should`, or `can`:
  `hasSupportingExcerpt`, `canReviewStatement`, `shouldRetryRequest`.
- Numbers identify the measure and unit:
  `requestTimeoutMs`, `maxResponseBytes`, `maxOutputTokens`, `reservedCostUsd`,
  `confirmedCostUsd`, `requiredTestCount`. State the range for a score, percentage,
  or ratio when its scale is not obvious.
- Collections say what they hold; maps say what they index:
  `pendingSourceReviews`, `statementIdToReviews`.
- Distinguish proposed, received, saved, checked, and accepted states. Do not name
  a value for the later state you hope it will reach.
- Make server/client context visible in the owning directory, filename, or name.
  Use names such as `fetchFindingsOnServer` and `*.server.ts` where context is absent.
- Use one accurate role suffix for custom structural units where applicable:
  `Tool`, `Prompt`, `Schema`, `Client`, `Repository`, `Action`, `Store`, `Provider`,
  `Config`, `Error`, or `Eval`. For example, `SourceDocumentRepository` and
  `SourceDateSchema`. Components use subject + kind, such as `EvidenceList`;
  hooks use `use` + subject/action, such as `useResearchFilters`.
- Preserve framework filenames and APIs such as `page.tsx`, `route.ts`, server
  actions, route handlers, `streamText`, and `maxOutputTokens`. Confirm the installed
  framework version before replacing any API name. A single model request should
  not be described as an autonomous agent unless it actually has that behavior.
- Avoid vague custom names such as `data`, `info`, `item`, `obj`, `temp`, `utils`,
  `helper`, `manager`, `engine`, `orchestrator`, `pipeline`, `chain`, `brain`,
  `memory`, `layer`, `gateway`, `spine`, `gate`, `claim`, `handler`, `service`,
  `wrapper`, `processor`, `hub`, `core`, `base`, `common`, `misc`, `thing`, and
  `flow` when they hide the actual subject. Established terms such as supply
  chain, route handler, database, and patent claim remain valid.
- Prefer explicit names up to 40 characters. Remove redundant context before
  abbreviating. Preserve units and necessary execution context. Required external
  names take precedence. Split responsibilities only when the implementation
  actually combines them; length alone is not a reason to invent new architecture.
- Enclosing context can remove repetition: `SourceCollectionAttempt.startedAt`
  is readable. Rename a destructured field to `collectionStartedAt` if the context
  would disappear at its use site.
- Use camelCase for TypeScript values, PascalCase for types, and Python's
  snake_case conventions. Map stored database fields to readable application
  fields at the database access point. Preserve required external JSON field names.

## Refactor and review discipline

Do not rename framework conventions, external API fields, generated files,
applied migrations, signed records, original source text, or historical audit
evidence merely to satisfy this skill. Use readable application names around
stable stored formats. A required format change needs an explicit versioned plan.

When a coordinated refactor is requested, keep an old/new name table with the
owning file, actual meaning, and treatment of stored or externally visible forms.
Update current diagrams, documentation, examples, and interface labels in the
same change. Preserve earlier dated evidence as earlier evidence. Version and
evaluate changes to model-visible terminology that could change research results.

Before delivering, check that each changed term identifies its subject, preserves
units and uncertainty, and matches the actual operation. For a naming review,
report the current name, proposed name, and a short reason. Keep necessary
technical terms; explain them rather than substituting an inaccurate synonym.
