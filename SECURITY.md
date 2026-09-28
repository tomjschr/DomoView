# Security Policy

## Supported versions

DomoView is pre-1.0. Security fixes go into the latest release only; please
upgrade before reporting.

| Version | Supported |
|---------|-----------|
| 0.1.x   | yes       |

## Reporting a vulnerability

Please **do not open a public issue** for a security problem.

Use [GitHub's private vulnerability reporting](https://github.com/tomjschr/DomoView/security/advisories/new)
on this repository. You should get an acknowledgement within a week.

Helpful to include: what an attacker can do, the steps to reproduce it, the
DomoView version, and whether it needs an authenticated Home Assistant session.

## What is in scope

DomoView is a frontend dashboard card plus a static authoring tool. The
relevant classes of problem:

- **Cross-site scripting through pack content.** A Home Pack is data from an
  untrusted source as soon as packs are shared. If a crafted `home.json` — a
  room name, a fixture name, a license string — can execute script in the card
  or the Studio, that is a vulnerability. All pack-derived text should reach
  the DOM through `textContent` or the card's `escape()` helper, never through
  `innerHTML`.
- **Unexpected service calls.** The card should only call
  `light.turn_on`/`turn_off`, `switch.*`, `media_player.*` and
  `cover.set_cover_position`, and only on entities the user explicitly mapped.
  A pack that can induce a call against an entity the user never bound, or
  against another domain, is a vulnerability.
- **Data leaving the browser.** Neither the card nor the Studio should make a
  network request to anywhere other than the pack's own asset paths. The Studio
  in particular handles floor plans and room photographs of real homes and must
  never upload them. Any outbound request is a vulnerability.
- **Path traversal in the dev server.** `tools/serve.mjs` is for local
  development, but it should still refuse to serve outside the repository.

## What is out of scope

- `tools/serve.mjs` being unsuitable for exposure to a network. It binds to
  `127.0.0.1` and is documented as a development convenience.
- Home Assistant's own authentication, and anything reachable by a user who
  already has dashboard access. A card cannot be more restrictive than the
  dashboard that contains it.
- A Home Pack that is merely wrong — bad geometry, an inside-out wall — rather
  than actively malicious.
- Denial of service through a deliberately enormous pack. Rendering a
  million-triangle model slowly is a performance bug; please report it as a
  normal issue.

## A note on shared packs

Packs are shared between users, which makes them untrusted input. Treat a pack
from someone you do not know as you would any other downloaded file: it is
geometry and JSON, not code, but it is worth running
`node tools/pack/validate.mjs` over it first.
