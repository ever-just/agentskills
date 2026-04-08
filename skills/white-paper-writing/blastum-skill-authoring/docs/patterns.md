# Common Patterns

## Template Pattern

```markdown
## Report structure
ALWAYS use this template:
\`\`\`markdown
# [Title]
## Summary
[One paragraph]
## Findings
- Finding 1
- Finding 2
## Recommendations
1. Action 1
\`\`\`
```

## Examples Pattern

Input/output pairs for output quality:

```markdown
## Commit message format

**Example 1:**
Input: Added JWT authentication
Output:
\`\`\`
feat(auth): implement JWT authentication
Add login endpoint and token validation
\`\`\`

**Example 2:**
Input: Fixed date display bug
Output:
\`\`\`
fix(reports): correct date formatting
Use UTC timestamps consistently
\`\`\`
```

## Workflow Pattern

Checklist for complex multi-step tasks:

```markdown
## Form workflow

\`\`\`
- [ ] Step 1: Analyze form
- [ ] Step 2: Create mapping
- [ ] Step 3: Validate
- [ ] Step 4: Execute
- [ ] Step 5: Verify
\`\`\`

**Step 1**: Run `python scripts/analyze.py input.pdf`
...
```

## Conditional Pattern

```markdown
## Modification workflow

**Creating new?** → See [create.md](create.md)
**Editing existing?** → See [edit.md](edit.md)
```

## Feedback Loop

```markdown
## Edit process
1. Make edits
2. Validate: `python scripts/validate.py`
3. If errors → fix → validate again
4. Only proceed when validation passes
```
