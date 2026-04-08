# Validation & Iteration

## Testing Checklist

### Core Quality
- [ ] Description specific with key terms
- [ ] Description has WHAT + WHEN
- [ ] Third person ("Processes X")
- [ ] SKILL.md < 500 lines (prefer < 50 for L1)
- [ ] Consistent terminology
- [ ] Concrete examples

### Structure
- [ ] References one level deep
- [ ] Progressive disclosure used
- [ ] No time-sensitive info
- [ ] Forward slashes only

### Scripts (if any)
- [ ] Handle errors explicitly
- [ ] No magic numbers
- [ ] Verbose validation output

## Iteration Workflow

1. **Complete task without skill** - note what context you provide
2. **Identify pattern** - what's reusable?
3. **Create minimal skill** - only essential content
4. **Test with fresh session** - does agent find right info?
5. **Observe behavior** - what's missing or unclear?
6. **Refine** - iterate based on real usage

## Model Testing

Test with all target models:
- **Haiku**: Enough guidance?
- **Sonnet**: Clear and efficient?
- **Opus**: Not over-explaining?

## Common Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| Skill not triggered | Vague description | Add specific terms |
| Wrong file read | Unclear links | Make references explicit |
| Missed rules | Buried in text | Make prominent |
| Inconsistent output | Weak examples | Add input/output pairs |
