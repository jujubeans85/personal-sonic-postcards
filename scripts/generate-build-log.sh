#!/bin/bash

# generate-build-log.sh
# Generates BUILD-LOG.md for the entire repo with commit history and diffs

LOG_FILE="BUILD-LOG.md"

cat > "$LOG_FILE" << 'EOF'
# Build Log - personal-sonic-postcards

**Generated:** $(date '+%Y-%m-%d %H:%M:%S')
**Scope:** Entire repository (including juice-cinema modular development)

This file is auto-generated from git history. It tracks major changes, additions, modifications, and deletions during the Juice Cinema modular architecture build.

---

EOF

echo "Generating build log from git history..."

git log --pretty=format:"## %h - %s (%ad)" --date=short --all -- . >> "$LOG_FILE"

echo "" >> "$LOG_FILE"
echo "---" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

echo "Appending diffs for recent commits..." >> "$LOG_FILE"

git log -p --all -- . | head -500 >> "$LOG_FILE"

echo "Build log generated: $LOG_FILE"