@thoughtbox Let's work through requirements initialization systematically.

Initialize a new requirements document with the following structure:

# Requirements: [Feature/Component Name]

## Problem Statement

[What problem are we solving? What's the user/business need?]

**Use thoughtbox to explore**:

- Root cause of the problem
- Who is affected and how
- Why existing solutions are insufficient

## Goals

[What are we trying to achieve?]

**Use thoughtbox to clarify**:

- Success criteria for each goal
- How we'll measure achievement
- Potential conflicts between goals

## Non-Goals (Optional)

**Ask me**: "Would you like to define non-goals (explicit scope boundaries) now?"

If yes, **use thoughtbox to identify**:

- What's explicitly out of scope
- Future considerations (not now, but maybe later)
- What we're NOT optimizing for
- Why these are non-goals (rationale)

## Gotchas & Constraints (Optional)

**Ask me**: "Any known gotchas, constraints, or technical limitations to capture?"

If yes, **use thoughtbox to explore**:

- Known limitations and why they exist
- Integration risks and dependencies
- Data consistency concerns
- Operational challenges
- Common failure modes in similar systems

## Functional Requirements

[List each requirement with a unique ID like FR-1, FR-2, etc.]

**Use thoughtbox for each requirement to**:

- Break down complex features into discrete, testable requirements
- Identify edge cases and boundary conditions
- Challenge assumptions about user behavior
- Consider error scenarios and failure modes
- Ensure requirements are clear, specific, and measurable

Leave acceptance criteria blank for now (will be generated during review)

## Non-Functional Requirements

### Performance

**Use thoughtbox to define**:

- Response time expectations under different loads
- Throughput requirements
- Resource limits and why they matter
- Acceptable degradation scenarios

### Security

**Use thoughtbox to analyze**:

- Authentication/authorization needs and threat models
- Data sensitivity classification
- Compliance requirements (if applicable)
- Attack surface considerations
- Input validation and sanitization needs

### Monitoring & Observability

**Use thoughtbox to determine**:

- Key metrics (SLIs/SLOs if applicable)
- Alert conditions and thresholds
- Logging requirements (what events must be logged)
- Tracing/debugging considerations
- Dashboard/visibility needs for operations

### Scalability

**Use thoughtbox to project**:

- Expected load patterns (current and future)
- Growth projections
- Scaling strategy (horizontal/vertical)
- Bottlenecks to watch for

## Open Questions

[Anything unresolved that needs clarification]

**Use thoughtbox to surface**:

- Ambiguities in requirements
- Missing information needed for design
- Decisions that need stakeholder input
- Trade-offs that need discussion

---

Start by asking me for the feature/component name, then guide me through each section interactively using thoughtbox to deeply explore each area.
