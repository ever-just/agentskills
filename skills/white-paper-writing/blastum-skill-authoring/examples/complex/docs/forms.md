# Form Filling

## Workflow

```
- [ ] Step 1: Analyze form
- [ ] Step 2: Create mapping
- [ ] Step 3: Validate
- [ ] Step 4: Fill
- [ ] Step 5: Verify
```

## Step 1: Analyze

```bash
python scripts/analyze.py form.pdf > fields.json
```

Output:
```json
{
  "customer_name": {"type": "text", "page": 1},
  "signature": {"type": "sig", "page": 2}
}
```

## Step 2: Create Mapping

Edit `fields.json` to add values:
```json
{
  "customer_name": {"value": "John Doe", ...},
  "signature": {"value": "path/to/sig.png", ...}
}
```

## Step 3: Validate

```bash
python scripts/validate.py fields.json
# Returns: OK or error list
```

If errors → fix → validate again.

## Step 4: Fill

```bash
python scripts/fill.py form.pdf fields.json output.pdf
```

## Step 5: Verify

Open output.pdf and confirm all fields populated correctly.
