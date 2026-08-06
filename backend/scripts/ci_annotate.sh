#!/usr/bin/env bash
# CI qadamini ishga tushiradi va yiqilganda GitHub annotatsiyasi chiqaradi.
#
# Nega kerak: job sahifasida standart holda faqat "Process completed with
# exit code 1" ko'rinadi va loglarni ochmasdan sababni bilib bo'lmaydi.
# Annotatsiyalar esa log ochmasdan ham ko'rinadi.
#
# Foydalanish:  bash scripts/ci_annotate.sh "Pytest (SQLite)" pytest --tb=short

set -uo pipefail

title="$1"
shift

if output=$("$@" 2>&1); then
  printf '%s\n' "$output" | tail -n 25
  exit 0
fi

printf '%s\n' "$output"

# Birinchi FAILURES/ERRORS bloki — asosiy sabab shu yerda.
detail=$(printf '%s\n' "$output" |
  sed -n '/^=\{3,\} \(ERRORS\|FAILURES\)/,$p' |
  head -c 2500 | tr '\n' '|')
# Yakuniy xulosa — nechta yiqildi va qaysilari.
summary=$(printf '%s\n' "$output" | tail -c 1500 | tr '\n' '|')

if [ -n "$detail" ]; then
  echo "::error title=${title} — birinchi xato::${detail}"
fi
echo "::error title=${title} — xulosa::${summary}"
exit 1
