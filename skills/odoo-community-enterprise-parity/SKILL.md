# Odoo Community Enterprise Parity

## Overview

Replicate Enterprise-only features in Odoo 19 Community Edition using OCA modules, custom addons, and strategic integration. Achieve near-feature-parity without an Enterprise license.

Use this skill when you need to:
- Build an Enterprise-equivalent experience on Community
- Identify which features are CE vs EE and find alternatives
- Install and configure OCA modules that fill Enterprise gaps

---

## Feature Parity Map

### Home Screen / App Grid
**Enterprise:** HomeMenu component (fullscreen app grid with search)
**Community:** Does NOT exist. WebClient._loadDefaultApp() just loads the first menu item (Discuss).

**Solution:** Build a custom `ir.actions.client` + OWL component that renders the app grid, then patch `WebClient._loadDefaultApp()`:
```javascript
patch(WebClient.prototype, {
    _loadDefaultApp() {
        return this.actionService.doAction("your_module.action_home_menu", {
            clearBreadcrumbs: true,
        });
    },
});
```
Use `computeAppsAndMenuItems()` from `@web/webclient/menus/menu_helpers` — it exists in Community.

### VoIP / Phone
**Enterprise:** `voip` module — softphone widget, click-to-dial, call logging
**Community:** Nothing built-in.

**Solution:** OCA `voip_oca` (19.0 branch, tested with Ringover/Zerovoz). Uses SIP.js over WebSocket. Provides systray widget, click-to-dial, call records, transfer/hold/mute.

**For Twilio:** Build custom module with `@twilio/voice-sdk` (WebRTC). voip_oca uses SIP which is incompatible with Twilio. Twilio requires their proprietary Voice JS SDK.

### SMS
**Enterprise uses:** Odoo IAP (pay-per-message)
**Community has:** Full SMS framework (`sms` module) — composer, templates, phone field buttons, chatter threading, all bridge modules (crm_sms, sale_sms, event_sms, stock_sms).

**What's missing:** Only the sending backend. Override `res.company._get_sms_api_class()` to return your own `SmsApiBase` subclass:
```python
class SmsApiCustom(SmsApiBase):
    def _send_sms_batch(self, messages, delivery_reports_url=False):
        # Route through TextBee, Twilio, VoIP.ms, etc.
        results = []
        for msg in messages:
            for recipient in msg["numbers"]:
                # Send via your gateway
                results.append({"uuid": recipient["uuid"], "state": "success"})
        return results
```

### Documents (File Management)
**Enterprise:** Documents app — workspaces, OCR, automated actions
**Community:** Nothing built-in.

**Solution:** OCA `dms` module (port from 18.0). Provides directories, file upload, tags, RBAC, portal sharing.

### Knowledge (Wiki)
**Enterprise:** Knowledge app — block editor, Excalidraw, collaborative editing
**Community:** Nothing built-in.

**Solution:** OCA `document_page` (available on 19.0). Wiki-style articles with categories, version history, diffs.

### Spreadsheets
**Enterprise:** Create/edit spreadsheets via Documents app
**Community:** `spreadsheet` engine + dashboard viewing built-in, but NO create/edit UI.

**Solution:** OCA `spreadsheet_oca` (port from 18.0). Wraps the existing `o-spreadsheet` JS component in a user-facing create/edit experience.

---

## What Community Already Has (commonly assumed EE-only)

| Feature | Module | Status |
|---|---|---|
| SMS composer + templates | `sms` | Built-in CE |
| SMS Marketing | `mass_mailing_sms` | Built-in CE |
| Phone number validation | `phone_validation` | Built-in CE |
| 2FA / TOTP | `auth_totp` | Built-in CE, auto-install |
| Passkeys / WebAuthn | `auth_passkey` | Built-in CE, auto-install |
| OAuth login (Google/Facebook) | `auth_oauth` | Built-in CE |
| Spreadsheet dashboards | `spreadsheet_dashboard` | Built-in CE |

## OCA Modules to Check First

| Need | OCA Repo | Module | 19.0? |
|---|---|---|---|
| VoIP softphone | connector-telephony | `voip_oca` | Yes |
| OpenID Connect | server-auth | `auth_oidc` | Yes |
| API key auth | server-auth | `auth_api_key` | Yes |
| Wiki/Knowledge | knowledge | `document_page` | Yes |
| DMS/Documents | dms | `dms` | Port from 18.0 |
| Spreadsheets | spreadsheet | `spreadsheet_oca` | Port from 18.0 |

## Pitfalls
- `voip_oca` uses SIP.js — incompatible with Twilio (no WebSocket SIP endpoint)
- Enterprise `voip` module sets `excludes: ["voip"]` in voip_oca — they can't coexist
- `sms_twilio` module ships in CE core — already handles Twilio SMS sending
- `web_editor` was renamed to `html_builder` in v19 — breaks OCA modules referencing it
- Third-party app install from Apps Store downloads a .zip in CE — one-click install is EE only
