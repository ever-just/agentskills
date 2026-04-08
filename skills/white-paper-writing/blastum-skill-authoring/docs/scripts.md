# Utility Scripts

## Benefits
- More reliable than generated code
- Save tokens (no code in context)
- Save time (no generation)
- Ensure consistency

## Structure

```
scripts/
├── analyze.py      # Extract/analyze inputs
├── validate.py     # Check intermediate outputs
├── execute.py      # Perform main operation
└── verify.py       # Confirm final output
```

## Documentation in SKILL.md

```markdown
## Scripts

**analyze.py**: Extract form fields
\`\`\`bash
python scripts/analyze.py input.pdf > fields.json
\`\`\`

**validate.py**: Check for errors
\`\`\`bash
python scripts/validate.py fields.json
# Returns: "OK" or error list
\`\`\`
```

## Execution vs Reference

Make clear in docs:
- **Execute**: "Run `scripts/analyze.py`" (most common)
- **Reference**: "See `scripts/analyze.py` for the algorithm"

## Error Handling

Solve problems, don't punt:

```python
# Good - handle errors
def process(path):
    try:
        return open(path).read()
    except FileNotFoundError:
        print(f"Creating {path}")
        open(path, 'w').close()
        return ''

# Bad - just fail
def process(path):
    return open(path).read()
```

## Verbose Validation

Help agent fix issues:
```
# Good
Error: Field 'signature_date' not found.
Available: customer_name, order_total, signature_date_signed

# Bad
Error: Field not found
```
