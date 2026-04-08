#!/bin/bash
# Create new skill scaffold
# Usage: new-skill.sh <skill-name> [simple|complex]

set -e

NAME="${1:?Usage: new-skill.sh <skill-name> [simple|complex]}"
TYPE="${2:-simple}"

# Validate name
if [[ ! "$NAME" =~ ^[a-z0-9-]+$ ]]; then
  echo "Error: Name must be lowercase letters, numbers, hyphens only"
  exit 1
fi

if [[ ${#NAME} -gt 64 ]]; then
  echo "Error: Name must be <= 64 characters"
  exit 1
fi

mkdir -p "$NAME/docs"

# Create SKILL.md
cat > "$NAME/SKILL.md" << EOF
---
name: $NAME
description: TODO - describe what this does and when to use it.
---
# ${NAME//-/ }

Brief description.

## Resources
- [Guide](docs/guide.md)
EOF

if [[ "$TYPE" == "complex" ]]; then
  mkdir -p "$NAME/bin" "$NAME/examples"
  
  # Create index
  cat > "$NAME/docs/index.md" << EOF
# $NAME Index

## Topics
- [Topic A](topic-a.md) - description
- [Topic B](topic-b.md) - description

## Quick Reference
[Common case here]
EOF

  # Create topic stubs
  for topic in topic-a topic-b; do
    cat > "$NAME/docs/$topic.md" << EOF
# ${topic//-/ }

## Overview
TODO

## Instructions
TODO

## Examples
TODO
EOF
  done
  
  echo "Created complex skill: $NAME/"
else
  # Simple: single guide file
  cat > "$NAME/docs/guide.md" << EOF
# $NAME Guide

## Quick Start
TODO

## Details
TODO

## Examples
TODO
EOF

  echo "Created simple skill: $NAME/"
fi

echo "Next: Edit $NAME/SKILL.md description"
