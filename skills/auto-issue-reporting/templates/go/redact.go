// Package redact scrubs secrets and PII from strings and Sentry events.
// Patterns come from spec/redact_patterns.json (embedded). Copy this file and the JSON
// next to each binary that needs it; do not import across Go modules.
package redact

import (
	_ "embed"
	"encoding/json"
	"regexp"
	"strings"

	"github.com/getsentry/sentry-go"
)

//go:embed redact_patterns.json
var patternsJSON []byte

type rule struct {
	Name  string `json:"name"`
	Flags string `json:"flags"`
	Re    string `json:"re"`
	Repl  string `json:"repl"`
	Luhn  bool   `json:"luhn"`
	rx    *regexp.Regexp
}

var rules = func() []rule {
	var f struct {
		Rules []rule `json:"rules"`
	}
	if err := json.Unmarshal(patternsJSON, &f); err != nil {
		panic(err)
	}
	for i := range f.Rules {
		p := f.Rules[i].Re
		if strings.Contains(f.Rules[i].Flags, "i") {
			p = "(?i)" + p
		}
		f.Rules[i].rx = regexp.MustCompile(p)
		// JSON uses ${1} style references, which Go already understands.
	}
	return f.Rules
}()

func luhn(s string) bool {
	var d []int
	for _, c := range s {
		if c >= '0' && c <= '9' {
			d = append(d, int(c-'0'))
		}
	}
	if len(d) < 13 {
		return false
	}
	sum := 0
	for i := 0; i < len(d); i++ {
		n := d[len(d)-1-i]
		if i%2 == 1 {
			n *= 2
			if n > 9 {
				n -= 9
			}
		}
		sum += n
	}
	return sum%10 == 0
}

// String redacts one string. Values in allow (for example the release SHA) survive untouched.
func String(s string, allow ...string) string {
	if s == "" {
		return s
	}
	kept := []string{}
	for _, a := range allow {
		if a != "" && strings.Contains(s, a) {
			s = strings.ReplaceAll(s, a, "\x00"+string(rune('A'+len(kept)))+"\x00")
			kept = append(kept, a)
		}
	}
	for _, r := range rules {
		switch {
		case r.Luhn:
			name := r.Name
			s = r.rx.ReplaceAllStringFunc(s, func(m string) string {
				if luhn(m) {
					return "[REDACTED_" + name + "]"
				}
				return m
			})
		case r.Repl != "":
			s = r.rx.ReplaceAllString(s, r.Repl)
		default:
			s = r.rx.ReplaceAllLiteralString(s, "[REDACTED_"+r.Name+"]")
		}
	}
	for i, a := range kept {
		s = strings.ReplaceAll(s, "\x00"+string(rune('A'+i))+"\x00", a)
	}
	return s
}

// Event scrubs a Sentry event in place: messages, exception values, breadcrumbs, request, tags, user.
// Use it from ClientOptions.BeforeSend and BeforeSendTransaction.
func Event(e *sentry.Event, allow ...string) *sentry.Event {
	if e == nil {
		return nil
	}
	e.Message = String(e.Message, allow...)
	for i := range e.Exception {
		e.Exception[i].Value = String(e.Exception[i].Value, allow...)
		if st := e.Exception[i].Stacktrace; st != nil {
			for j := range st.Frames {
				st.Frames[j].Vars = nil
			}
		}
	}
	for i := range e.Breadcrumbs {
		e.Breadcrumbs[i].Message = String(e.Breadcrumbs[i].Message, allow...)
		for k, v := range e.Breadcrumbs[i].Data {
			if sv, ok := v.(string); ok {
				e.Breadcrumbs[i].Data[k] = String(sv, allow...)
			}
		}
	}
	if e.Request != nil {
		e.Request.URL = String(e.Request.URL, allow...)
		e.Request.QueryString = ""
		e.Request.Cookies = ""
		e.Request.Data = ""
		for k := range e.Request.Headers {
			lk := strings.ToLower(k)
			if lk == "authorization" || lk == "cookie" || lk == "set-cookie" || strings.Contains(lk, "token") || strings.Contains(lk, "key") || strings.Contains(lk, "secret") || strings.Contains(lk, "signature") {
				delete(e.Request.Headers, k)
				continue
			}
			e.Request.Headers[k] = String(e.Request.Headers[k], allow...)
		}
	}
	for k, v := range e.Tags {
		e.Tags[k] = String(v, allow...)
	}
	e.User = sentry.User{ID: e.User.ID}
	return e
}
