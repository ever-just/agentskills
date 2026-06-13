# Odoo Module Migration: 18.0 → 19.0

## Overview

Port OCA or custom Odoo modules from version 18.0 to 19.0. Odoo 19 has the largest structural overhaul in Odoo history — 130 model renames, 51 field renames, security system rewrite, and view schema changes.

---

## Migration Tool

```bash
pipx install oca-port
pipx inject --include-deps oca-port git+https://github.com/OCA/odoo-module-migrator.git@master
oca-port origin/18.0 origin/19.0 <module_path> --verbose
```

## Breaking Changes Checklist

### Python / ORM
| Change | Before (18.0) | After (19.0) |
|---|---|---|
| Route type | `type='json'` | `type='jsonrpc'` |
| IR rules | `_apply_ir_rules(query)` | Removed — use `_search(domain, bypass_access=True)` |
| SQL constraints | `_sql_constraints = [...]` | `models.Constraint(...)` on model class |
| Expressions | `from odoo.osv.expression import OR` | `from odoo.fields import Domain` |

### XML Views
| Change | Before | After |
|---|---|---|
| Search group | `<group expand="0" string="Group By">` | `<group>` (remove expand + string) |
| Kanban card | `<kanban-box>` | `<card>` |
| OWL directives | `t-if` in form views | Use `invisible` attribute |

### Security / Groups (CRITICAL)
| Change | Before | After |
|---|---|---|
| Group category | `<field name="category_id" ref="..."/>` | `<field name="privilege_id" ref="..."/>` with `res.groups.privilege` model |
| User groups field | `groups_id` | `group_ids` |
| Group users field | `users` | `user_ids` |

### Module Renames
| Before | After |
|---|---|
| `web_editor` | `html_builder` |
| `hr.contract` | `hr.version` |

## Step-by-Step Migration

1. **Copy module from 18.0 source**
2. **Bump version** in `__manifest__.py` to `19.0.x.x.x`
3. **Scan for breaking patterns:**
   ```bash
   grep -rn 'groups_id\|category_id.*res.groups\|type=.json.\|expand="0"\|_apply_ir_rules\|_sql_constraints\|kanban-box' module/ --include="*.py" --include="*.xml"
   ```
4. **Apply fixes** per the checklist above
5. **Test install** on a clean 19.0 database:
   ```bash
   odoo -d test -i module_name --stop-after-init --no-http
   ```
6. **Check warnings** — `auto_join` parameter invalid on some field types in v19
7. **Verify views** — any `t-if` in form/list/kanban XML will fail

## Common Errors

| Error | Cause | Fix |
|---|---|---|
| `Invalid attribute string for element group` | `string="Group By"` on search `<group>` | Remove the `string` attribute |
| `Forbidden owl directive used in arch (t-if)` | `t-if` in server-rendered views | Use `invisible="condition"` |
| `Invalid field res.partner.mobile` | Field doesn't exist on this install | Check field exists: `if "mobile" in Model._fields` |
| `duplicate key violates unique constraint ir_config_parameter_key_uniq` | Config param already exists in DB | Delete from DB before install, or use `noupdate="1"` |
| `External ID not found: crm.crm_case_form_view_leads` | CRM not installed, view doesn't exist | Make CRM an optional dependency, move view to separate file |

## Pitfalls
- `docker compose run --rm` creates an ephemeral container — pip packages installed there don't persist
- Module state `to install` requires an Odoo restart with `update_module=True` to complete
- `noupdate="1"` data files still fail on unique constraints if records were created manually before install
- `auto_join` parameter is silently ignored (warning only) on fields that don't support it in v19
