# Architecture Decision Record Generator

You are creating a new Architecture Decision Record (ADR) for the PageSage project.

## Context

PageSage is an Ancient Text OCR & Annotation Platform using:

- SvelteKit + TypeScript
- GitHub for storage and authentication
- Google Document AI for OCR
- Focus on data integrity and cost management

## Your Task

1. **Ask the user** what architectural decision needs to be documented
2. **Create ADR file** in `/docs/adr/` with format: `ADR-NNN-short-title.md`
   - Check existing ADRs to determine next number
   - Use kebab-case for title
3. **Use this template**:

```markdown
# ADR-NNN: [Title]

**Status:** Proposed | Accepted | Rejected | Superseded by ADR-XXX
**Date:** YYYY-MM-DD
**Deciders:** [List of people involved]
**Technical Story:** [GitHub issue or ticket reference if applicable]

## Context

[Describe the issue or problem that motivated this decision, including technical, business, or organizational context]

## Decision

[Describe the decision that was made, clearly and concisely]

## Rationale

[Explain why this decision was made, including:]

- What alternatives were considered
- Why this option was chosen
- Trade-offs and implications
- Cost considerations (if applicable for API usage)

## Consequences

### Positive

- [Benefit 1]
- [Benefit 2]

### Negative

- [Risk or limitation 1]
- [Risk or limitation 2]

### Neutral

- [Other implications]

## Implementation Notes

[Specific technical details, code patterns, or migration steps needed]

## Related Decisions

- Related to: [ADR-XXX]
- Supersedes: [ADR-XXX]
- Superseded by: [ADR-XXX]

## References

- [Link to relevant docs, discussions, or external resources]
```

4. **Consider PageSage-specific concerns**:
   - Data integrity for historical texts
   - Cost implications for Google AI APIs
   - Git-friendly storage format
   - Multi-language support (Sanskrit/Hindi/English)
   - Collaboration and attribution

5. **Save the file** and confirm creation

## Notes

- Keep it concise but thorough
- Focus on WHY, not just WHAT
- Document alternatives considered
- Update index if `/docs/adr/README.md` exists
