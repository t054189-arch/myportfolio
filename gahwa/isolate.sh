#!/usr/bin/env bash
# ============================================================================
# Does anything inside gahwa/ know about the site hosting it?
#
# Run from anywhere: it locates the repository from its own path, so it works
# in a checkout, in CI, and inside a build that has unpacked a tarball.
#
# It scans the module's CODE — stylesheet, scripts, pages, migrations, the
# Edge Function — and deliberately not its README or this file. Prose is
# allowed to explain that a particular shop hosts the module; code is not
# allowed to depend on it. And this script necessarily contains every string
# it searches for, so scanning itself would always fail.
# ============================================================================

cd "$(cd "$(dirname "$0")/.." && pwd)" || exit 2

CODE=$(find gahwa -type f \( -name '*.css' -o -name '*.js' -o -name '*.html' \
        -o -name '*.sql' -o -name '*.ts' \) ! -name 'isolate.sh' | sort)

fails=0
say() { printf '  %-52s %s\n' "$1" "$2"; }
bad() { fails=$((fails + 1)); }
hit() { grep -n -- "$1" $CODE 2>/dev/null | head -3; }

# 1. a path into the host's own folders
if grep -nE '\.\./(css|js|assets)/|"(css|js|assets)/|'"'"'(css|js|assets)/' $CODE >/dev/null 2>&1; then
  say "no path into the host's css/js/assets" "FAIL"; bad
  grep -nE '\.\./(css|js|assets)/|"(css|js|assets)/' $CODE | head -3
else
  say "no path into the host's css/js/assets" "ok"
fi

# 2. the host's design tokens, fonts and globals
found=0
for token in 'tokens.css' '\-\-paper' '\-\-ink:' '\-\-leaf:' '\-\-clay:' \
             'Bodoni' 'Archivo' 'IBM Plex' \
             'window\.BLOOM' 'BLOOM\.' 'PRODUCTS' 'WORDS\.' 'I18N\.' \
             'Auth\.' 'Cart\.' 'Drawer\.' 'Scene\.' 'Room\.' 'Motion\.' \
             'Rings\.' 'GLYPHS' 'ICONS' 'bloom\.session' 'bloom\.lang' \
             'bloom\.theme' 'bloom\.cart' 'GahwaPage'; do
  if grep -nE -- "$token" $CODE >/dev/null 2>&1; then
    say "no reference to '$token'" "FAIL"; bad; found=1
    grep -nE -- "$token" $CODE | head -2
  fi
done
[ $found -eq 0 ] && say "no host token, font or global referenced" "ok"

# 3. the host's product ids
if grep -nE 'eth-guji|col-huila|yem-haraz|ken-nyeri|bra-cerrado|gua-huehue|cri-tarrazu|rwa-nyamasheke' $CODE >/dev/null 2>&1; then
  say "no host product ids" "FAIL"; bad
  hit 'eth-guji'
else
  say "no host product ids" "ok"
fi

# 4. one shop named in code. The seed and the venue-kind enum are data —
#    a directory row for a real cafe, like the eighteen others.
NONSQL=$(printf '%s\n' $CODE | grep -v '^gahwa/sql/')
if grep -nE 'Bloom|bloom-salmiya|bloom_cafe' $NONSQL >/dev/null 2>&1; then
  say "the module names no particular shop in code" "FAIL"; bad
  grep -nE 'Bloom|bloom-salmiya' $NONSQL | head -3
else
  say "the module names no particular shop in code" "ok"
fi

# 5. only its own stylesheet
if grep -n 'stylesheet' gahwa/*.html | grep -v 'gahwa\.css' >/dev/null 2>&1; then
  say "each page loads only gahwa.css" "FAIL"; bad
  grep -n 'stylesheet' gahwa/*.html | grep -v 'gahwa\.css' | head -3
else
  say "each page loads only gahwa.css" "ok"
fi

# 6. no third-party request of any kind: no CDN script, no web font, no
#    analytics. The only outside host is the project's own API.
if grep -noP 'https?://(?!amejrcyvjbaepglimnal)[a-z0-9.-]+' $CODE 2>/dev/null \
     | grep -v 'www\.w3\.org' | grep -q .; then
  say "no third-party script, font or beacon" "FAIL"; bad
  grep -noP 'https?://(?!amejrcyvjbaepglimnal)[a-z0-9.-]+' $CODE | grep -v w3\.org | head -3
else
  say "no third-party script, font or beacon" "ok"
fi

# 7. every custom property it declares is namespaced
undecl=$(grep -ohE '^\s*--[a-z][a-z0-9-]*' gahwa/gahwa.css | tr -d ' ' | sort -u | grep -cv '^--g-')
if [ "$undecl" -eq 0 ]; then
  say "every custom property is --g-*" "ok"
else
  say "every custom property is --g-*" "FAIL ($undecl)"; bad
  grep -ohE '^\s*--[a-z][a-z0-9-]*' gahwa/gahwa.css | tr -d ' ' | sort -u | grep -v '^--g-' | head
fi

# 8. the payload contract. Enumerate the keys the outbound message can
#    carry rather than matching a line: a substring match happily accepts
#    a widened payload that merely still contains the old text, which is
#    exactly how a leak would arrive.
KEYS=$(awk '/function toHost\(/,/^  \}/' gahwa/checkin.html \
        | grep -oE 'body\.[a-zA-Z_]+' | sort -u | sed 's/body\.//' | paste -sd, -)
# `type` is set in the object literal, not assigned, so it is not in this
# list; `height` belongs to the resize message and is legitimate.
if [ "$KEYS" = "at,height,venue_id" ]; then
  say "the outbound message adds only venue_id, at, height" "ok"
else
  say "the outbound message adds only venue_id, at, height" "FAIL"; bad
  echo "      keys it can set: $KEYS   (expected at,height,venue_id)"
fi

echo
if [ $fails -eq 0 ]; then
  echo "gahwa/ references nothing from the host site."
else
  echo "$fails coupling(s) found."
fi
exit $fails
