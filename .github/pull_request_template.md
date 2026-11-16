<!--
Pull requests from <prefix>/<issue>-<slug> branches are opened automatically by the pipeline, which
writes its own description. Use this template only for pull requests opened by hand.
A keyword here does not close the issue; the dev -> main promotion pull request does.
-->

## What and why

Work for #<issue>.

## How it was checked

- [ ] `npm run lint` (zero warnings)
- [ ] `npm run typecheck`
- [ ] `npm run check:images`
- [ ] `npm run build` and `NEXT_OUTPUT=export npm run build && npm run verify:out`
- [ ] Layout checked at 390, 1024 and 1475 px (if UI changed)
- [ ] Reduced motion checked (if animation changed)

## Notes for reviewers

Anything surprising, deferred or worth a second look.
