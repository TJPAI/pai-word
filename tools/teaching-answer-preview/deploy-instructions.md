# Isolated teaching-answer preview deployment

## Isolation contract
- Stable preview path `/perf-preview/rebuild-preview/` must remain unchanged.
- Source: `TJPAI/pai-word` branch `teaching-answer-isolated-preview-20261025`.
- New output path: `site/teaching-preview/`.
- Only six staging KU answer cards are added; no changes to SRS or user state.

## Add these steps before the Scene500 E5 checkout in TJPAI/pai-word-preview/.github/workflows/deploy-preview.yml

```yaml
      - name: Checkout isolated teaching-answer source
        uses: actions/checkout@v4
        with:
          repository: TJPAI/pai-word
          ref: teaching-answer-isolated-preview-20261025
          path: teaching-source
          fetch-depth: 1
          persist-credentials: false
      - name: Stage isolated teaching-answer preview
        run: |
          TEACHING_SHA=$(git -C teaching-source rev-parse HEAD)
          test ! -e site/teaching-preview
          mkdir -p site/teaching-preview
          rsync -a --exclude='.git' --exclude='.github' --exclude='CNAME' teaching-source/ site/teaching-preview/
          test -f site/teaching-preview/rebuild-preview/index.html
          printf '%s\\n' "$TEACHING_SHA" > site/teaching-preview/preview-source-sha.txt
          echo "Teaching preview source SHA: $TEACHING_SHA" >> "$GITHUB_STEP_SUMMARY"
```

## Acceptance criteria
1. Deploy workflow succeeds; `/teaching-preview/preview-source-sha.txt` matches isolated source HEAD.
2. `/perf-preview/preview-source-sha.txt` still matches stable source HEAD.
3. Teaching preview loads homepage without `baseRender` error.
4. Learning answer displays the extra block only for matching six KU IDs.
5. Question/answer toggle, audio, swipe, three-button grading, persistence and SRS work unchanged.
6. No preview content is promoted to certified teaching runtime.

**Status:** instructions prepared; deployment NOT completed (preview repo workflow write returned 403).
