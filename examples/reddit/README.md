# Readable Reddit discussion archive

A real sample captured on 2 October 2026: 10 top-level comments and 6 loaded replies, with author attribution, UTC dates, net scores, two comment GIFs and the original post image.

[Open the sample](archive.html) · [CSV](comments.csv) · [Captured records](snapshot.json)

The HTML embeds all three media files and can be opened offline. It includes text/author search and nested reply formatting. Source links require internet access. Scores are observed net scores, not separate upvote/downvote counts. Unloaded replies are excluded.

## Reproduce the rendering

```sh
python build_archive.py snapshot.json archive.html
```

`capture_dom.js` reads the currently loaded original-language Reddit page. It neither logs in nor bypasses human verification. `download_media.py` retrieves the media URLs recorded in the snapshot and writes the CSV. Media requests are limited to this small sample.

This demonstrates archiving a public discussion. Private-group access and full-history extraction require a separate, source-specific implementation. Reddit content remains attributed to its original authors; this sample is not covered by the repository's software license.
