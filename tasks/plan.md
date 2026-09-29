# Implementation Plan: DomoView Local Studio and AI Editing

## Status and confirmed intent

This plan is based on the following confirmed product split:

- The HACS package remains the lightweight Home Assistant card used at runtime.
- A separately started localhost application becomes the full DomoView editor.
- The localhost editor works offline for project authoring.
- It can optionally connect to Home Assistant to read entities and areas and to
  install generated packs and card configuration.
- Anthropic, OpenAI and OpenCode are optional AI providers used by the editor,
  never by the HACS card.

Until explicitly changed, AI mutations use **review, diff, then apply**. Existing
project files are not modified merely because a model proposed a tool call.

## Product outcome

A user starts DomoView Studio locally, creates or opens a project, imports a
floor plan and room photos, builds the geometry and lighting interactively, and
exports a valid Home Pack. The same project can then be refined through a
Codex-style conversation:

> Move the kitchen wall 20 cm left, make the pendant warmer, and reduce the
> blind's visible travel to 70%.

The system plans the request, delegates independent parts to focused agents,
executes only typed DomoView operations, validates the result, renders a
preview, and presents a reversible diff. The user may accept, reject, partially
accept, undo, or continue the conversation.

## Explicit non-goals for the first production slice

- The HACS card does not contain API keys, prompts, agents or provider SDKs.
- AI does not write arbitrary JSON or arbitrary files.
- AI does not directly call Home Assistant services or change a live dashboard.
- A vision model does not generate a precision floor plan without calibration.
- Multi-user collaboration, cloud accounts and hosted project storage are not
  part of the localhost-first product.
- The orchestrator does not call several agents when a deterministic tool or a
  single model call can complete the request.

## Architecture

### Deployment boundaries

```text
┌──────────────────────── Home Assistant ────────────────────────┐
│ HACS: dist/domoview.js                                         │
│ - render Home Pack                                             │
│ - read mapped entity states                                    │
│ - issue normal HA service calls after user interaction         │
│ - no AI, no provider keys, no project filesystem access        │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────── Localhost DomoView Studio ─────────────────┐
│ Browser UI                                                     │
│ - existing plan editor and 3D preview                          │
│ - chat, task timeline, diff and approval UI                    │
│ - never receives provider or HA secrets                        │
│                                                               │
│ Local Node server, bound to 127.0.0.1                          │
│ - project/workspace filesystem                                 │
│ - AI providers and orchestration                               │
│ - typed mutation tools and validation                          │
│ - optional HA WebSocket/API bridge                             │
│ - pack export and installation                                 │
└─────────────────────────────────────────────────────────────────┘
```

The local server should later be packaged unchanged as a Home Assistant app
(formerly add-on). In that deployment it uses Ingress, `/config`, and the
Supervisor token. The first implementation targets localhost because it gives
faster iteration and a real filesystem without coupling authoring to HA.

### Repository layout

The existing source layout remains valid. New code should be added without
moving the HACS card unnecessarily:

```text
src/
  core/                    shared runtime and pack logic
  domoview-card.js         HACS card
  domoview-editor.js       Lovelace card configuration editor

studio/
  src/                     browser authoring UI
  server/                  localhost-only Node application
    api/
    ai/
      providers/
      orchestration/
      tools/
    ha/
    projects/
    index.js

schemas/
  home-pack-1.schema.json
  project-1.schema.json
  ai-operation-1.schema.json

test/
  ...
```

Shared browser-safe operations belong in `studio/src` or `src/core`. Secrets,
filesystem access, subprocesses and provider clients belong exclusively in
`studio/server`.

### Source of truth and mutation model

`project.domoview.json` remains the editable source of truth. `home.json`, GLB,
images, card YAML and ZIP files are derived outputs.

Every edit, manual or AI-driven, is represented as a typed domain operation:

```json
{
  "type": "wall.move",
  "target": "wall_kitchen_west",
  "delta": [-0.2, 0],
  "precondition": {
    "projectRevision": 42
  }
}
```

Initial operation families:

- `wall.add`, `wall.move`, `wall.resize`, `wall.remove`
- `room.rename`, `room.set_polygon`
- `opening.add`, `opening.update`, `opening.remove`
- `fixture.add`, `fixture.move`, `fixture.update`, `fixture.remove`
- `material.update`
- `camera.update`
- `cover_profile.update`
- `binding.propose`, `binding.set`, `binding.remove`

Each operation has:

1. JSON Schema validation.
2. Semantic preconditions.
3. A deterministic apply function.
4. An inverse operation or snapshot-backed undo.
5. A human-readable summary.
6. A structural before/after diff.

The existing `Project.commit()` path and undo stack should be adapted to consume
the same operations used by AI. There must not be one mutation path for the UI
and a second one for agents.

### Local server API

Use a versioned local API, initially HTTP plus Server-Sent Events. SSE is enough
for streamed model output and task progress while being simpler to reconnect
and inspect than a custom WebSocket protocol.

Core endpoints:

```text
GET    /api/v1/health
GET    /api/v1/capabilities
POST   /api/v1/projects
GET    /api/v1/projects/:id
PUT    /api/v1/projects/:id
POST   /api/v1/projects/:id/assets
POST   /api/v1/projects/:id/validate
POST   /api/v1/projects/:id/export

POST   /api/v1/sessions
POST   /api/v1/sessions/:id/messages
GET    /api/v1/sessions/:id/events
POST   /api/v1/proposals/:id/apply
POST   /api/v1/proposals/:id/reject

POST   /api/v1/ha/connect
GET    /api/v1/ha/entities
POST   /api/v1/ha/install
```

The browser receives sanitized provider status and HA metadata, never API keys,
access tokens or raw Supervisor credentials.

### Project and session persistence

- Project files and imported assets live in an explicit workspace directory.
- Paths are resolved relative to that workspace; `..`, UNC paths and arbitrary
  absolute writes are rejected.
- Session metadata, messages, proposals, tool results, token usage and model
  calls live in SQLite.
- Large images, GLBs and generated previews remain files, referenced by content
  hash from SQLite.
- Every accepted proposal increments a project revision.
- A proposal created against an old revision cannot be applied silently.

### AI provider abstraction

All providers implement one internal contract:

```text
complete(request) -> normalized response
stream(request)   -> normalized events
capabilities()    -> tools, vision, prompt caching, JSON schema, context limit
estimate(request) -> approximate token and cost budget
```

Adapters:

- **Anthropic:** native Messages API, tool use, prompt caching and vision.
- **OpenAI:** Responses API, function tools, structured output and vision.
- **OpenCode:** begin with a compatibility spike. Prefer its local server/API
  when available; isolate CLI subprocess support behind the same adapter.
- **OpenAI-compatible local endpoint:** optional follow-up for Ollama, llama.cpp
  or other local models; do not mix this into the OpenAI cloud credential.

Provider configuration is role-based:

```yaml
roles:
  orchestrator:
    provider: anthropic
    model: configurable
  executor:
    provider: anthropic
    model: configurable-small-model
  vision:
    provider: openai
    model: configurable-vision-model
```

No model name is hard-coded as a permanent architectural choice.

### Orchestration strategy

The cost-saving hierarchy is:

1. **Deterministic command parser:** handle obvious single-tool requests locally.
2. **Single-agent execution:** one model call for a bounded change.
3. **Orchestrator plus specialists:** only for requests spanning independent
   domains or requiring investigation.
4. **Vision:** only when image interpretation is actually needed.

The orchestrator outputs a task graph, not prose:

```json
{
  "goal": "Adjust kitchen geometry and pendant light",
  "tasks": [
    {
      "id": "geometry",
      "agent": "geometry",
      "dependsOn": [],
      "input": {"instruction": "Move the kitchen wall 20 cm left"}
    },
    {
      "id": "lighting",
      "agent": "lighting",
      "dependsOn": [],
      "input": {"instruction": "Make the pendant warmer"}
    }
  ]
}
```

Specialist agents:

| Agent | Reads | Allowed tools |
|---|---|---|
| Project analyst | project summary, validation | read-only inspection |
| Geometry | walls, rooms, openings, calibration | geometry operations |
| Lighting | fixtures, emitters, materials, preview metrics | fixture/light operations |
| Appearance | materials, camera, environment | appearance operations |
| Bindings | fixtures, sanitized HA catalog | binding operations |
| Validation | proposed operations and schemas | read-only validators |
| Vision | selected images and calibration context | annotation proposals only |

An agent receives only the project slice it needs. This reduces tokens and
prevents an entity-binding task from seeing room photos, for example.

### Conversational editing loop

```text
User message
    ↓
Intent classifier / deterministic router
    ↓
Optional orchestrator task graph
    ↓
Specialist tool calls in isolated draft transaction
    ↓
Schema + semantic validation
    ↓
Preview rebuild and visual snapshot
    ↓
Proposal:
  - task results
  - operations
  - JSON diff
  - visual before/after
  - warnings
  - token/cost usage
    ↓
Accept all / accept selected / reject / revise in chat
```

Follow-up messages retain the session, accepted project revision and compact
summaries. They do not resend the entire conversation and full project on every
turn.

### Token and cost controls

- Compute project summaries deterministically and cache them by revision.
- Send only affected rooms, fixtures and operations to specialists.
- Cache stable system prompts, schemas and tool definitions where supported.
- Summarize old conversation turns into explicit decisions and unresolved
  items; preserve original messages locally for audit.
- Set per-turn limits for calls, input tokens, output tokens and estimated cost.
- Show an estimate before a vision-heavy or multi-agent request.
- Deduplicate equivalent tool calls before execution.
- Run independent specialist tasks in parallel only when their write sets do
  not overlap.
- Use deterministic matching for entity binding before asking any model.
- Record actual provider usage so model-role decisions can be measured.

### Lighting and shadow editing

AI should manipulate meaningful scene parameters, not renderer internals:

- Fixture position and height
- Point versus spot emitter
- Target, cone angle and penumbra
- Luminous intensity and range
- Color or color temperature
- Shadow enabled/disabled
- Bulb/emissive-node appearance
- Environment exposure and ambient intensity
- Occluders and explicit shadow casters

The preview should expose a diagnostic mode showing emitter positions, cones,
targets, shadow casters and active renderer limits. This is essential for a
conversation such as “the spot should hit the painting, not the floor.”

The first AI lighting slice should modify one selected fixture and produce a
before/after preview. Automated photorealistic reconstruction from photos is a
later capability.

### Floor plan and photo workflow

Phase-one authoring remains deterministic:

1. Import a floor plan image.
2. Calibrate a known distance.
3. Trace walls and rooms.
4. Add openings, fixtures and furniture.
5. Import room photos as references.
6. Preview and export.

Vision assistance is introduced incrementally:

- OCR room labels and dimensions.
- Suggest wall/opening line segments.
- Suggest fixture categories and approximate room placement.
- Ask the user to confirm calibration and ambiguous geometry.

Vision outputs annotations and typed suggestions. Pixel-to-metre conversion is
always anchored to explicit calibration.

### Optional Home Assistant connection

Localhost mode:

- User supplies HA URL and a long-lived access token to the local server.
- The server uses the HA REST/WebSocket APIs.
- The token is never returned to browser JavaScript after submission.
- Entity, device and area registries are normalized into a sanitized catalog.
- Installation writes only to an explicitly selected target and shows the
  generated files/config first.

Future HA app mode:

- Use Ingress for authentication and UI routing.
- Use `SUPERVISOR_TOKEN` for Core API access.
- Mount `/config` for controlled pack installation.
- Use Supervisor options/secrets for provider configuration.
- Reuse the same server, provider, orchestration and tool modules.

### Security model

- Bind to `127.0.0.1` by default; remote binding requires an explicit flag and
  authentication.
- Enforce Host and Origin checks.
- Keep provider and HA credentials server-side.
- Redact secrets and raw headers from logs and model traces.
- Restrict all reads/writes to configured workspace and export roots.
- Do not expose a generic shell tool to models.
- Do not expose arbitrary HTTP fetch to models; provider and HA clients use
  allowlisted destinations.
- Validate all uploaded file types and sizes.
- Treat imported project files and model responses as untrusted input.
- Require approval before filesystem install or Home Assistant config changes.

## Dependency graph

```text
Local server shell
  ├── Workspace and project API
  │     ├── Shared operation protocol
  │     │     ├── Manual UI mutations
  │     │     ├── Proposal diff/approval
  │     │     └── AI tools
  │     └── Export/install
  ├── Session persistence
  │     └── Provider abstraction
  │           ├── Single-agent editing
  │           └── Orchestrator and specialists
  └── HA bridge
        ├── Entity matcher
        └── Pack/card installation

Vision assistance depends on calibration, operation tools and proposal review.
HA app packaging depends on a stable localhost server and filesystem contract.
```

## Implementation phases and tasks

### Phase 1: Localhost product shell

#### Task 1: Define the localhost server contract

**Description:** Add server configuration, health/capabilities endpoints and a
single command that starts the existing Studio through a local server.

**Acceptance criteria:**
- `npm run studio:local` starts one process bound to `127.0.0.1`.
- The browser loads the Studio from the server without CDN dependencies.
- `/api/v1/health` reports version and workspace status without secrets.

**Verification:**
- Automated API test covers health and invalid methods.
- Production card and Studio builds remain green.
- Manual check loads the editor from the printed localhost URL.

**Dependencies:** None

**Likely files:** `package.json`, `studio/server/index.js`,
`studio/server/config.js`, `test/server.test.js`

**Estimated scope:** Medium

#### Task 2: Add workspace-safe project storage

**Description:** Move localhost project open/save behind a constrained server
workspace while retaining browser download/upload in static Studio mode.

**Acceptance criteria:**
- Projects can be created, listed, opened and saved under one workspace root.
- Traversal and writes outside the workspace are rejected.
- Static Studio still opens and saves project downloads without a server.

**Verification:**
- API tests cover normal paths, traversal, missing files and revision conflict.
- Existing project serialization tests pass.

**Dependencies:** Task 1

**Likely files:** `studio/server/projects/store.js`,
`studio/server/api/projects.js`, `studio/src/project-client.js`,
`test/project-store.test.js`

**Estimated scope:** Medium

#### Task 3: Add asset upload and content hashing

**Description:** Store floor plans and photos as project assets rather than
embedding every image indefinitely as a data URL.

**Acceptance criteria:**
- Supported images upload into the selected project.
- Duplicate content is stored once and referenced by hash.
- Type, size and malformed-image errors are explicit.

**Verification:**
- Upload tests cover PNG/JPEG/WebP, duplicate data and rejected files.
- Existing static export still embeds or packages the required assets.

**Dependencies:** Task 2

**Likely files:** `studio/server/projects/assets.js`,
`studio/server/api/assets.js`, `studio/src/photos.js`,
`test/assets.test.js`

**Estimated scope:** Medium

### Checkpoint A: Local authoring foundation

- Localhost Studio starts with one documented command.
- Existing offline/static Studio behavior still works.
- A project and its assets survive process restart.
- Full tests, lint and build pass.

### Phase 2: One safe mutation protocol

#### Task 4: Define project schema and revisioning

**Description:** Formalize the current project document with JSON Schema and a
monotonic revision used by server and proposals.

**Acceptance criteria:**
- Every saved project validates against a versioned schema.
- Older version-1 projects load through an explicit migration path.
- Conflicting writes return a revision error rather than overwriting.

**Verification:**
- Schema tests include current demo, malformed values and migration fixture.

**Dependencies:** Task 2

**Likely files:** `schemas/project-1.schema.json`,
`studio/src/project.js`, `studio/server/projects/validate.js`,
`test/project-schema.test.js`

**Estimated scope:** Medium

#### Task 5: Implement typed project operations

**Description:** Introduce a shared operation registry with validation,
application, summaries and affected-object metadata.

**Acceptance criteria:**
- Initial wall, opening and fixture operations apply deterministically.
- Invalid targets, values and stale revisions fail without partial mutation.
- Each accepted operation is undoable.

**Verification:**
- Table-driven tests cover apply, inverse and rejection for every operation.

**Dependencies:** Task 4

**Likely files:** `studio/src/operations/index.js`,
`studio/src/operations/geometry.js`,
`studio/src/operations/fixtures.js`, `test/operations.test.js`

**Estimated scope:** Medium

#### Task 6: Route manual editor changes through operations

**Description:** Replace direct mutations for a narrow vertical slice—fixture
editing first—with the shared operation path.

**Acceptance criteria:**
- Adding, moving, editing and removing a fixture use typed operations.
- Existing undo/redo UX remains intact.
- Export output for an unchanged project remains byte-equivalent.

**Verification:**
- Editor interaction tests or operation-level regression tests pass.
- Demo manifest reproduction remains green.

**Dependencies:** Task 5

**Likely files:** `studio/src/project.js`, `studio/src/editor.js`,
`studio/src/panels.js`, `test/pipeline.test.js`

**Estimated scope:** Medium

#### Task 7: Build proposal diff and approval UI

**Description:** Apply operations to an isolated draft, show structural and
visual differences, then accept or reject the proposal.

**Acceptance criteria:**
- A proposal cannot mutate the active project before approval.
- Accept, reject and accept-selected produce deterministic revisions.
- A stale proposal is blocked and can be regenerated.

**Verification:**
- Proposal transaction tests cover all approval paths.
- Manual check compares before/after fixture position and undo.

**Dependencies:** Tasks 5 and 6

**Likely files:** `studio/server/projects/proposals.js`,
`studio/src/proposals.js`, `studio/src/main.js`,
`test/proposals.test.js`

**Estimated scope:** Medium

### Checkpoint B: AI-independent safety core

- Manual fixture edits and synthetic proposals share one operation path.
- Draft changes have visual and structural diffs.
- No proposal can bypass validation, approval or revision checks.

### Phase 3: Provider abstraction and single-agent editing

#### Task 8: Add secure provider configuration

**Description:** Configure provider, model and role without exposing API keys to
the browser or committing them to project files.

**Acceptance criteria:**
- Anthropic and OpenAI credentials can be supplied through environment or a
  server-side local configuration.
- UI exposes connection status and model choices, not credential values.
- Logs and diagnostics redact secrets.

**Verification:**
- Configuration tests cover precedence, missing keys and redaction.

**Dependencies:** Task 1

**Likely files:** `studio/server/ai/config.js`,
`studio/server/api/providers.js`, `studio/src/settings.js`,
`test/provider-config.test.js`

**Estimated scope:** Medium

#### Task 9: Implement the normalized provider contract

**Description:** Add Anthropic and OpenAI adapters behind one request, stream,
tool-call and usage representation.

**Acceptance criteria:**
- Both providers can stream text and return validated tool calls.
- Timeouts, rate limits and provider errors remain distinguishable.
- Token usage and estimated cost are recorded per call.

**Verification:**
- Contract tests run against mocked provider responses and streams.
- No live API call is required in CI.

**Dependencies:** Task 8

**Likely files:** `studio/server/ai/provider.js`,
`studio/server/ai/providers/anthropic.js`,
`studio/server/ai/providers/openai.js`, `test/providers.test.js`

**Estimated scope:** Medium

#### Task 10: Add one conversational fixture-edit agent

**Description:** Deliver the first complete AI slice: discuss and propose
changes to one selected fixture's position, color, intensity and shadow setup.

**Acceptance criteria:**
- The agent sees only selected fixture, room and relevant scene context.
- It can call only fixture-related typed operations.
- Its result enters the standard proposal review flow.

**Verification:**
- Mocked conversation tests cover valid edit, clarification and refused invalid
  geometry access.
- Manual provider smoke test changes one fixture after approval.

**Dependencies:** Tasks 7 and 9

**Likely files:** `studio/server/ai/agents/lighting.js`,
`studio/server/ai/tools/fixtures.js`, `studio/src/chat.js`,
`test/lighting-agent.test.js`

**Estimated scope:** Medium

#### Task 11: Persist sessions and compact context

**Description:** Store chat turns, calls, tool results and project revisions in
SQLite, and create deterministic compact context for later turns.

**Acceptance criteria:**
- Conversation resumes after server restart.
- Old turns can be summarized without deleting the original local audit trail.
- A follow-up references the accepted revision, not a stale project snapshot.

**Verification:**
- Persistence and resume tests cover accepted and rejected proposals.

**Dependencies:** Task 10

**Likely files:** `studio/server/sessions/database.js`,
`studio/server/sessions/context.js`,
`studio/server/api/sessions.js`, `test/sessions.test.js`

**Estimated scope:** Medium

### Checkpoint C: Codex-style single-agent loop

- User can chat, stream a response, inspect tool operations, preview, accept,
  reject, undo and continue the same session.
- Anthropic and OpenAI pass the same mocked contract suite.
- Usage and cost are visible per turn.

### Phase 4: Efficient orchestration

#### Task 12: Add deterministic request routing

**Description:** Resolve simple commands locally or send them directly to one
specialist before considering a planner call.

**Acceptance criteria:**
- Explicit fixture, wall and binding commands route without an orchestrator.
- Ambiguous or multi-domain requests escalate with a recorded reason.
- Routing decisions are visible in diagnostics.

**Verification:**
- Intent corpus tests assert route, context slice and expected model-call count.

**Dependencies:** Task 10

**Likely files:** `studio/server/ai/orchestration/router.js`,
`test/router.test.js`

**Estimated scope:** Small

#### Task 13: Add structured task-graph orchestration

**Description:** Let a configurable orchestrator decompose multi-domain
requests into bounded specialist tasks with dependencies and write sets.

**Acceptance criteria:**
- Task graphs validate against schema before execution.
- Cycles, unknown agents and overlapping unsafe writes are rejected.
- Independent read or non-overlapping write tasks may run in parallel.

**Verification:**
- Graph tests cover sequential, parallel, cyclic and conflicting plans.

**Dependencies:** Tasks 11 and 12

**Likely files:** `schemas/ai-task-graph-1.schema.json`,
`studio/server/ai/orchestration/planner.js`,
`studio/server/ai/orchestration/executor.js`,
`test/orchestrator.test.js`

**Estimated scope:** Medium

#### Task 14: Add geometry and appearance specialists

**Description:** Expand the tool surface to wall/opening geometry and materials,
camera and environment parameters.

**Acceptance criteria:**
- Each specialist receives a minimal project slice and a strict tool allowlist.
- Cross-domain requests merge into one proposal when operations do not conflict.
- Validation errors return to the responsible task, not as silent defaults.

**Verification:**
- Mocked end-to-end requests cover geometry-only and geometry-plus-lighting.

**Dependencies:** Task 13

**Likely files:** `studio/server/ai/agents/geometry.js`,
`studio/server/ai/agents/appearance.js`,
`studio/server/ai/tools/geometry.js`,
`test/specialists.test.js`

**Estimated scope:** Medium

#### Task 15: Enforce budgets and prompt caching

**Description:** Add call, token and estimated-cost budgets plus provider-aware
prompt caching and context reuse.

**Acceptance criteria:**
- A session can cap calls and estimated cost per turn.
- Budget overruns require explicit user approval before further calls.
- Stable schemas and prompts use provider caching where supported.

**Verification:**
- Budget tests cover preflight rejection, mid-run stop and cached accounting.

**Dependencies:** Tasks 9 and 13

**Likely files:** `studio/server/ai/budget.js`,
`studio/server/ai/context-cache.js`,
`studio/src/chat-usage.js`, `test/ai-budget.test.js`

**Estimated scope:** Medium

### Checkpoint D: Multi-agent editing

- A request spanning geometry and lighting produces a validated task graph.
- Small requests still use zero or one planning calls.
- Specialists cannot call tools outside their domains.
- Usage proves the orchestration saves context instead of multiplying calls.

### Phase 5: Home Assistant bridge and installation

#### Task 16: Add optional HA connection

**Description:** Connect from the local server using URL and token and expose a
sanitized entity/device/area catalog to the editor.

**Acceptance criteria:**
- Offline authoring remains fully usable.
- Connection failures and permission failures are explicit.
- The browser never receives the stored token.

**Verification:**
- Mock HA API tests cover success, auth failure and unavailable Core.

**Dependencies:** Tasks 1 and 8

**Likely files:** `studio/server/ha/client.js`,
`studio/server/api/ha.js`, `studio/src/ha-settings.js`,
`test/ha-client.test.js`

**Estimated scope:** Medium

#### Task 17: Reuse and extend deterministic entity matching

**Description:** Feed the existing matcher with the server's sanitized catalog,
display high- and medium-confidence candidates, and keep AI for unresolved
bindings only.

**Acceptance criteria:**
- Existing bindings are never overwritten automatically.
- Deterministic scores and reasons are shown.
- Only unresolved, explicitly selected fixtures may be sent to a model.

**Verification:**
- WE3 fixture corpus tracks match accuracy and ambiguity.

**Dependencies:** Task 16

**Likely files:** `src/core/entity-matcher.js`,
`studio/src/bindings.js`, `studio/server/ai/agents/bindings.js`,
`test/entity-matcher.test.js`

**Estimated scope:** Medium

#### Task 18: Add reviewed pack installation

**Description:** Export the pack and card YAML, show the target and files, then
install through an explicit server-side action.

**Acceptance criteria:**
- Dry-run lists all created/replaced files and configuration snippets.
- Install is limited to the configured Home Assistant target.
- Existing files are backed up or require explicit overwrite confirmation.

**Verification:**
- Filesystem fixture tests cover new install, update, collision and rollback.

**Dependencies:** Tasks 2, 7 and 16

**Likely files:** `studio/server/ha/install.js`,
`studio/server/api/export.js`, `studio/src/export/install.js`,
`test/install.test.js`

**Estimated scope:** Medium

### Checkpoint E: Home Assistant round trip

- Connect to HA, match entities, export a pack and perform a reviewed install.
- Disconnecting HA leaves the local project and editor functional.
- HACS card still has no dependency on the local server.

### Phase 6: OpenCode, HA app and vision

#### Task 19: Complete the OpenCode compatibility spike

**Description:** Verify the supported OpenCode integration surface and implement
the adapter through its stable local API or isolated CLI bridge.

**Acceptance criteria:**
- Capability detection reports exactly which tools, streaming and models work.
- Cancellation terminates only the process/request owned by the session.
- OpenCode passes the normalized provider contract tests it supports.

**Verification:**
- Automated adapter tests use a fake server or executable.
- One documented manual smoke test runs against a supported OpenCode release.

**Dependencies:** Task 9

**Likely files:** `studio/server/ai/providers/opencode.js`,
`docs/local-studio.md`, `test/opencode-provider.test.js`

**Estimated scope:** Medium

#### Task 20: Package the local server as a Home Assistant app

**Description:** Reuse the localhost server in an Ingress-enabled container with
Supervisor API access and controlled `/config` installation.

**Acceptance criteria:**
- HACS and HA app repository metadata coexist in this repository.
- Ingress mode requires no separate HA URL or long-lived token.
- The same project API and AI safety rules run in localhost and app modes.

**Verification:**
- Container build passes for supported architectures.
- App configuration and startup are validated in a supervised HA test instance.

**Dependencies:** Tasks 15, 16 and 18

**Likely files:** `repository.yaml`, `addon/domoview-studio/config.yaml`,
`addon/domoview-studio/Dockerfile`, `addon/domoview-studio/run.sh`,
`test/addon-config.test.js`

**Estimated scope:** Medium

#### Task 21: Add bounded vision suggestions

**Description:** Let a selected vision provider suggest labels, walls, openings
and fixtures from chosen images without directly editing the project.

**Acceptance criteria:**
- The UI shows exactly which images and project metadata will be sent.
- Results are annotations or typed proposals tied to calibration.
- Uncertain measurements are marked rather than invented.

**Verification:**
- Golden-image tests validate response normalization and operation generation.
- Manual test confirms no image is transmitted without explicit action.

**Dependencies:** Tasks 7, 9 and 15

**Likely files:** `studio/server/ai/agents/vision.js`,
`studio/src/vision-review.js`, `test/vision-agent.test.js`

**Estimated scope:** Medium

### Final checkpoint

- Localhost editor supports offline authoring and optional HA integration.
- Anthropic, OpenAI and OpenCode use one provider contract.
- Codex-style iterative editing works through typed, reviewable operations.
- Deterministic routing and budgets prevent unnecessary model calls.
- HACS runtime remains standalone and secret-free.
- HA app packaging reuses the localhost server rather than creating a fork.

## Testing strategy

### Unit

- Operation schema, semantic validation, apply and inverse
- Router decisions and context slicing
- Task-graph validation and conflict detection
- Provider normalization and streaming
- Secret redaction and path constraints
- Entity matching accuracy

### Integration

- Project create/open/save/revision conflict
- Session message to proposal to approval
- Export and dry-run installation
- Mock HA and provider servers
- Server restart and session resume

### End-to-end

1. Start local Studio.
2. Create project and import floor plan.
3. Add one room and fixture manually.
4. Ask AI to move and recolor the fixture.
5. Review visual and structural diff.
6. Accept and undo.
7. Connect mock or real HA.
8. Match entity and export/install.
9. Load result in the HACS card.

### Non-regression

Every checkpoint runs:

```text
npm test
npm run lint
npm run build
```

The existing demo manifest reproduction and Home Pack schema validation remain
release gates.

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Multi-agent orchestration costs more than one model call | High | Deterministic router first; measure calls and tokens per intent; orchestrate only multi-domain work |
| Model corrupts project geometry | High | Typed operations, draft transaction, semantic validation, preview, approval and revision checks |
| Browser gains access to API keys or HA token | High | Local server owns all secrets; sanitized APIs only |
| Local server writes outside intended folders | High | Workspace-relative paths, canonical-path checks and allowlisted export roots |
| Provider APIs diverge | Medium | Capability-driven adapter contract; no lowest-common-denominator promises |
| OpenCode integration is unstable or CLI-only | Medium | Time-boxed compatibility spike and isolated adapter |
| Vision produces inaccurate dimensions | High | Calibration is mandatory; vision suggests annotations rather than final geometry |
| HACS and HA app releases interfere | Medium | Separate build artifacts and release checks in one repository |
| Undo and AI proposals diverge from manual editing | High | One shared operation protocol before adding general AI tools |
| Project context grows without bound | Medium | Revision summaries, domain slices, local audit log and provider caching |

## Decisions still to confirm

These do not block Phase 1 or the mutation foundation:

1. Whether review-before-apply is always required or configurable per session.
2. Which operating systems need one-click packaging first; the server itself
   should remain cross-platform.
3. Whether local credentials are environment-only initially or stored through
   the operating-system credential manager.
4. Whether OpenCode means its local server, its CLI, or both.
5. Whether the first vision provider receives room photos at all, or floor-plan
   images only.

## Recommended first milestone

Implement Tasks 1-7 before adding a live LLM. This produces a real localhost
product, secure project storage and the proposal/diff/approval machinery. The
first AI integration then becomes a narrow adapter onto a tested mutation
system instead of becoming the system's architecture.

