# Report an issue (by hand or by code)

Read this before filing anything, whether you are the bridge, an agent, or a person with a crash in
front of them.

## Is it even ours?

Be strict. File in the product repo only when the defect sits in code or config we ship: our services,
our addons, our frontends, our deploy config. A failure inside a third party service is `external` at
most; a customer's own misconfiguration is support, not a bug.

## Search before filing

A duplicate costs more than no report.

```bash
gh issue list --repo OWNER/REPO --state all --label auto-reported --search "sentry=<sentry issue id> in:body"
gh issue list --repo OWNER/REPO --state all --search "<ExceptionType> <function> in:title"
```

Include closed issues. A match closed as completed that still happens on a newer release is a
regression: reopen it and add `regression`. A match closed as not planned stays closed.

## Add to an existing issue only with new evidence

A different trigger, a narrower reproduction, a new release where it regressed, a symbolized frame the
issue lacks. "It happens to me too" is noise: update the stats block instead, or do nothing.

## File a new issue

Use the exact shape in spec/issue-format.md. Run the redaction helper and `neutralize` over every free
text field first, then run the canary:

```bash
printf '%s\n\n%s\n' "$TITLE" "$BODY" > issue.txt
gitleaks stdin -c spec/canary.gitleaks.toml --no-banner --ignore-gitleaks-allow --redact < issue.txt
trufflehog stdin --no-verification --no-update --fail < issue.txt
```

Only when both pass:

```bash
gh issue create --repo OWNER/REPO --title "$TITLE" --body-file body.md --label auto-reported,product:X,surface:Y,env:prod,severity:Z
```

Never add `devin:fix` by hand to an issue that contains user supplied text.

## Signing

End every agent written issue or comment with a line naming who wrote it, for example
`Posted by Claude Opus 5 via Claude Code`. If unsure of the exact model or version, say so rather than
inventing one.
