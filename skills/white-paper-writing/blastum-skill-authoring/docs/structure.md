# Structure Patterns

## Simple Skill (2 Levels)

```
skill-name/
├── SKILL.md          # L1: frontmatter + pointers
└── docs/
    └── guide.md      # L2: all instructions
```

## Complex Skill (3 Levels)

```
skill-name/
├── SKILL.md          # L1: frontmatter + pointers
├── docs/
│   ├── index.md      # L2: topic index
│   ├── topic-a.md    # L3: detailed content
│   ├── topic-b.md    # L3: detailed content
│   └── topic-c.md    # L3: detailed content
├── scripts/         # Executable scripts
│   └── validate.sh
└── examples/         # Usage examples
    └── example-1.md
```

## With Scripts

```
skill-name/
├── SKILL.md
├── docs/
│   └── usage.md
├── scripts/
│   ├── analyze.py
│   └── validate.sh
└── assets/           # Static resources
    └── helper.py
```

## Folder Purposes

| Folder | Purpose |
|--------|---------|
| `docs/` | Reference documentation |
| `scripts/` | Executable code that agents can run |
| `references/` | Additional documentation loaded on demand |
| `assets/` | Static resources (templates, images, data files) |
| `examples/` | Usage examples |
