# Twilio Embedded Telephony for Web Apps

## Overview

Build a fully embedded phone system (calls + SMS) inside any web application using Twilio's Voice JS SDK and Programmable SMS. No browser extensions, no external apps, 100% white-labeled.

Use this skill when you need to:
- Add browser-based calling to a web app (make/receive PSTN calls)
- Embed SMS conversations in an existing UI
- Build a multi-tenant phone system with per-tenant numbers and billing
- Replace a third-party VoIP service (Ringover, OnSIP) with a native solution

---

## Architecture

```
Browser (Your App)
│   @twilio/voice-sdk (WebRTC)
│   ├── Device.connect() → outbound call
│   └── Device.on('incoming') → inbound call
│
└── Your Backend
    ├── Token endpoint → generate Twilio AccessToken with VoiceGrant
    ├── TwiML App webhook → return XML routing instructions
    ├── Status callback → log call state changes
    └── SMS webhook → receive inbound messages
```

## Key Concept: Twilio Does NOT Use SIP

Twilio's browser calling uses a **proprietary protocol** over WebSocket + DTLS-SRTP media. It is NOT SIP. You cannot connect SIP.js or any SIP softphone to Twilio. You MUST use `@twilio/voice-sdk`.

This means existing SIP-based VoIP modules (like OCA voip_oca) are incompatible with Twilio.

## Token Generation

```python
from twilio.jwt.access_token import AccessToken
from twilio.jwt.access_token.grants import VoiceGrant

token = AccessToken(account_sid, api_key, api_secret, identity=user_id, ttl=3600)
token.add_grant(VoiceGrant(
    outgoing_application_sid=twiml_app_sid,
    incoming_allow=True,
))
return token.to_jwt()
```

- **API Key + Secret** (not Account SID + Auth Token) for token generation
- Identity must be unique per user (no special characters)
- TTL: 1 hour, refresh before expiry via `device.on('tokenWillExpire')`

## Browser Client

```javascript
import { Device } from '@twilio/voice-sdk';

// Initialize
const device = new Device(token, { edge: 'ashburn' });
await device.register();

// Make call
const call = await device.connect({ params: { To: '+15551234567' } });

// Receive call
device.on('incoming', (call) => {
    call.accept(); // or call.reject()
});

// Controls
call.mute(true);     // mute
call.disconnect();   // hangup
call.sendDigits('1'); // DTMF
```

## TwiML Webhooks

### Outbound (TwiML App Voice URL)
```xml
<Response>
  <Dial callerId="+19525551234" record="record-from-answer-dual"
        recordingStatusCallback="/webhook/recording">
    <Number>+15551234567</Number>
  </Dial>
</Response>
```

### Inbound (Number Voice URL)
```xml
<Response>
  <Dial timeout="25" action="/twiml/voicemail">
    <Client>user_identity</Client>
  </Dial>
</Response>
```

### Voicemail (no-answer fallback)
```xml
<Response>
  <Say voice="Polly.Joanna">Leave a message after the beep.</Say>
  <Record maxLength="120" transcribe="true"
          transcribeCallback="/webhook/transcription"/>
</Response>
```

## Multi-Tenant (Subaccounts)

```python
from twilio.rest import Client
client = Client(account_sid, auth_token)

# Create subaccount per tenant
sub = client.api.accounts.create(friendly_name="Tenant XYZ")
# sub.sid = new account SID
# sub.auth_token = new auth token

# Buy a number for this tenant
number = Client(sub.sid, sub.auth_token).incoming_phone_numbers.create(
    phone_number='+19525551234'
)
```

Each subaccount gets isolated: numbers, call logs, recordings, billing.

## SMS

### Send
```python
client.messages.create(body="Hello", from_="+19525551234", to="+15551234567")
```

### Receive (webhook)
Twilio POSTs to your SMS webhook URL with `From`, `To`, `Body`, `MessageSid`.

## Costs

| Item | Cost |
|---|---|
| Local number | $1.15/mo |
| Outbound calls | $0.014/min |
| Inbound calls | $0.0085/min |
| Browser SDK | $0.004/min |
| SMS | $0.0083/msg |
| ~Per tenant/mo | ~$8-16 |

## Twilio Setup Checklist

1. Create account at twilio.com
2. Create API Key + Secret (Account > API Keys)
3. Create TwiML App (Voice > TwiML Apps) — set Voice URL to your outbound webhook
4. Buy a phone number
5. Set number's Voice URL to your inbound webhook
6. Set number's SMS URL to your SMS webhook
7. Store: Account SID, Auth Token, API Key, API Secret, TwiML App SID, Phone Number

## Pitfalls
- Twilio Voice JS SDK is ~300KB minified — bundle it as a lazy-loaded asset
- `external_dependencies: {"python": ["twilio"]}` in Odoo manifest blocks install if pip package missing — use lazy imports instead
- Token identity must not contain `@` or `.` — sanitize email-based identities
- `docker compose run --rm` creates ephemeral containers — pip installs don't persist
- Add `pip install twilio` to your docker-compose command for persistence
- Twilio requires HTTPS for all webhooks — no HTTP
