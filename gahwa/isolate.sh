#!/usr/bin/env bash
# Does anything inside gahwa/ know about the site hosting it?
cd /home/user/myportfolio
fails=0
say() { printf '  %-52s %s\n' "$1" "$2"; }
bad() { fails=$((fails+1)); }

# 1. Bloom's own files, by path
if grep -rn -E '\.\./(css|js|assets)|["'"'"'](css|js|assets)/' gahwa/ demo/ --include=* 2>/dev/null | grep -v 'gahwa\.\(css\|js\)' | grep -q .; then
  say "no path into the host's css/js/assets" "FAIL"; bad
  grep -rn -E '\.\./(css|js|assets)|["'"'"'](css|js|assets)/' gahwa/ demo/ | head -5
else
  say "no path into the host's css/js/assets" "ok"
fi

# 2. Bloom's token names and globals
for token in 'tokens.css' '--paper' '--ink' '--leaf' '--clay' 'Bodoni' 'Archivo' 'IBM Plex' \
             'window.BLOOM' 'BLOOM\.' 'PRODUCTS' 'WORDS' 'I18N' 'Auth\.' 'Cart\.' 'Drawer\.' \
             'Scene\.' 'Room\.' 'Motion\.' 'Rings\.' 'GLYPHS' 'ICONS' 'bloom\.session' 'bloom\.lang' \
             'bloom\.theme' 'bloom\.cart'; do
  if grep -rn -- "$token" gahwa/ >/dev/null 2>&1; then
    say "no reference to '$token'" "FAIL"; bad
    grep -rn -- "$token" gahwa/ | head -3
  fi
done
[ $fails -eq 0 ] && say "no host token, font or global referenced" "ok"

# 3. Bloom product ids hard-coded in the module
if grep -rn -E 'eth-guji|col-huila|yem-haraz|ken-nyeri|bra-cerrado|gua-huehue|cri-tarrazu|rwa-nyamasheke' gahwa/ >/dev/null 2>&1; then
  say "no host product ids" "FAIL"; bad
  grep -rn -E 'eth-guji|col-huila' gahwa/ | head -3
else
  say "no host product ids" "ok"
fi

# 4. the word Bloom, outside the seed row and honest prose
hits=$(grep -rn 'Bloom\|bloom-salmiya\|bloom_cafe' gahwa/ | grep -v '^gahwa/sql/' | wc -l)
if [ "$hits" -gt 0 ]; then
  say "the module names no particular shop in code" "FAIL ($hits)"; bad
  grep -rn 'Bloom\|bloom-salmiya\|bloom_cafe' gahwa/ | grep -v '^gahwa/sql/' | head -5
else
  say "the module names no particular shop in code" "ok"
fi

# 5. its own stylesheet only
css=$(grep -rn 'stylesheet' gahwa/*.html | grep -v 'gahwa.css' | wc -l)
[ "$css" -eq 0 ] && say "each page loads only gahwa.css" "ok" || { say "each page loads only gahwa.css" "FAIL"; bad; }

# 6. no external network dependency at all
if grep -rn -E 'https?://(?!amejrcyvjbaepglimnal)' gahwa/*.js gahwa/*.html -P 2>/dev/null | grep -v 'www.w3.org' | grep -q .; then
  say "no third-party script or font" "FAIL"; bad
  grep -rnP 'https?://(?!amejrcyvjbaepglimnal)' gahwa/*.js gahwa/*.html | grep -v w3.org | head -5
else
  say "no third-party script or font" "ok"
fi

# 7. its own tokens are all namespaced
undecl=$(grep -ohE '\-\-[a-z][a-z0-9-]*' gahwa/gahwa.css | sort -u | grep -v '^--g-' | wc -l)
[ "$undecl" -eq 0 ] && say "every custom property is --g-*" "ok" || { say "every custom property is --g-*" "FAIL ($undecl)"; bad; grep -ohE '\-\-[a-z][a-z0-9-]*' gahwa/gahwa.css | sort -u | grep -v '^--g-' | head; }

echo
[ $fails -eq 0 ] && echo "gahwa/ references nothing from the host site." || echo "$fails coupling(s) found."
exit $fails
