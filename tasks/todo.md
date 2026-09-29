# DomoView Local Studio and AI Editing

## Phase 1: Localhost foundation

- [x] Task 1: Define the localhost server contract
- [x] Task 2: Add workspace-safe project storage
- [x] Task 3: Add asset upload and content hashing

### Checkpoint A

- [x] Local Studio starts with one command
- [x] Static/offline Studio still works
- [x] Projects and assets survive restart
- [x] Tests, lint and build pass

## Phase 2: Safe mutation protocol

- [x] Task 4: Define project schema and revisioning
- [x] Task 5: Implement typed project operations
- [x] Task 6: Route manual fixture edits through operations
- [x] Task 7: Build proposal diff and approval UI

### Checkpoint B

- [x] Manual and proposed edits share one mutation path
- [x] Drafts show structural and visual diffs
- [x] Stale or invalid proposals cannot apply

## Phase 3: Single-agent conversation

- [x] Task 8: Add secure provider configuration
- [x] Task 9: Implement Anthropic/OpenAI provider contract
- [x] Task 10: Add conversational fixture-edit agent
- [ ] Task 11: Persist sessions and compact context

### Checkpoint C

- [ ] Chat streams responses and tool progress
- [ ] Fixture proposal can be accepted, rejected, undone and refined
- [ ] Usage and cost are visible per turn

## Phase 4: Efficient orchestration

- [ ] Task 12: Add deterministic request routing
- [ ] Task 13: Add structured task-graph orchestration
- [ ] Task 14: Add geometry and appearance specialists
- [ ] Task 15: Enforce budgets and prompt caching

### Checkpoint D

- [ ] Simple requests use zero or one planning calls
- [ ] Multi-domain requests use validated task graphs
- [ ] Specialists cannot escape their tool allowlists

## Phase 5: Home Assistant round trip

- [ ] Task 16: Add optional HA connection
- [ ] Task 17: Extend deterministic entity matching
- [ ] Task 18: Add reviewed pack installation

### Checkpoint E

- [ ] Offline mode remains functional
- [ ] HA metadata can be read without exposing the token
- [ ] Pack and card configuration install through a dry-run review

## Phase 6: Additional providers and packaging

- [ ] Task 19: Complete OpenCode compatibility spike
- [ ] Task 20: Package the server as a Home Assistant app
- [ ] Task 21: Add bounded vision suggestions

### Final checkpoint

- [ ] Localhost editor and HACS card remain separate products
- [ ] Anthropic, OpenAI and OpenCode share one provider contract
- [ ] AI edits are typed, validated, previewed and reversible
- [ ] Full tests, lint and production builds pass
