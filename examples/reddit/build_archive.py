"""Build a self-contained, readable archive from an observed Reddit snapshot.

Usage: python build_archive.py snapshot.json archive.html
Scores are observed net scores, not individual like counts. Missing values stay missing.
"""
import base64
import html
import json
import mimetypes
from pathlib import Path
import sys
from datetime import datetime


def esc(value):
    return html.escape(str(value if value is not None else "Not available"), quote=True)


def date(value):
    if not value:
        return 'Not available'
    return datetime.fromisoformat(value.replace('Z', '+00:00')).strftime('%d %b %Y · %H:%M UTC')


def media(items, base):
    result = []
    for item in items or []:
        path = (base / item["file"]).resolve() if item.get("file") else None
        if path and path.is_relative_to(base.resolve()) and path.is_file():
            mime = mimetypes.guess_type(path.name)[0] or ""
            if mime in {"image/png", "image/jpeg", "image/webp", "image/gif"}:
                src = "data:" + mime + ";base64," + base64.b64encode(path.read_bytes()).decode()
                result.append(f'<figure><img loading="lazy" src="{src}" alt="{esc(item.get("alt", "Image from the source"))}"></figure>')
        elif item.get("url", "").startswith("https://"):
            result.append(f'<p><a href="{esc(item["url"])}" rel="noopener noreferrer">View source image online</a></p>')
    return "".join(result)


def comment(item, base, depth=0):
    metadata = f'u/{esc(item.get("author"))} · {esc(date(item.get("date")))} · Score: {esc(item.get("score"))}'
    body = esc(item.get("text", "")).replace("\n", "<br>")
    replies = "".join(comment(reply, base, depth + 1) for reply in item.get("replies", []))
    source = item.get("url", "")
    link = f'<a href="{esc(source)}" rel="noopener noreferrer">Original comment</a>' if source.startswith("https://") else ""
    return f'<article class="comment {"reply" if depth else ""}"><header>{metadata}</header><div class="body">{body}</div>{media(item.get("images"), base)}{link}{replies}</article>'


def build(data, base):
    post = data["post"]
    comments = data["comments"][:10]
    if not comments:
        raise ValueError("A sample must contain real observed comments; refusing an empty archive.")
    content = "".join(comment(item, base) for item in comments)
    return f'''<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(post['title'])} — Reddit archive sample</title>
<style>
:root{{color-scheme:light;--bg:#f2f5f7;--paper:#fff;--ink:#183044;--muted:#526577;--accent:#bc4319;--line:#d8e0e7}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--bg);color:var(--ink);font:17px/1.65 "Segoe UI",sans-serif}}
main{{max-width:980px;margin:36px auto;padding:0 24px}}h1{{font:700 clamp(26px,3vw,34px)/1.2 Georgia,serif;max-width:40ch;margin:18px 0}}
a{{color:var(--accent);overflow-wrap:anywhere}}a:focus-visible,input:focus-visible,button:focus-visible{{outline:3px solid var(--accent);outline-offset:4px}}
.intro{{padding:28px;background:var(--paper);border-top:5px solid var(--accent)}}.meta,header,footer{{font-size:14px;color:var(--muted)}}
.tools{{display:flex;gap:12px;margin:26px 0;align-items:center;flex-wrap:wrap}}input{{flex:1;min-width:0;padding:12px;font:inherit;border:1px solid var(--line);border-radius:6px}}
button{{padding:12px 18px;background:var(--ink);color:white;border:0;border-radius:6px;font:inherit;cursor:pointer}}
.comment{{padding:24px 28px;background:var(--paper);margin:18px 0;border:1px solid var(--line);border-radius:8px;overflow-wrap:anywhere}}
.reply{{padding:16px 0 0 20px;margin:16px 0 0;border:0;border-left:3px solid var(--line);border-radius:0}}
.body{{margin:12px 0;max-width:76ch}}figure{{margin:18px 0}}img{{display:block;max-width:100%;max-height:520px;object-fit:contain;border-radius:6px}}
.intro img{{height:240px;width:100%;object-fit:contain;object-position:left center}}
footer{{padding:24px 0}}[hidden]{{display:none!important}}
@media(max-width:600px){{main{{padding:0 14px;margin:18px auto}}.intro,.comment{{padding:20px}}.reply{{padding:12px 0 0 12px}}}}
@media print{{body{{background:white}}main{{max-width:none;margin:0}}.tools{{display:none}}.comment{{break-inside:avoid}}}}
</style>
<main><section class="intro"><div class="meta">Reddit archive · r/{esc(post.get('subreddit'))}</div>
<h1>{esc(post['title'])}</h1><p class="meta">u/{esc(post.get('author'))} · {esc(date(post.get('date')))} · Score: {esc(post.get('score'))}</p>
<p>{esc(post.get('text', '')).replace(chr(10), '<br>')}</p>{media(post.get('images'), base)}
<a href="{esc(post['url'])}">View original discussion</a></section>
<div class="tools"><label for="search">Find in sample</label><input id="search" type="search" placeholder="Search text or author"><button id="expand">Clear search</button></div>
<p class="meta">{len(comments)} top-level comments · Replies shown where captured · Captured {esc(date(data.get('captured_at')))}</p>
<section id="comments">{content}</section>
<footer>This is a limited snapshot, not the complete discussion. Scores are observed net scores, not like counts, and may change. Only captured replies and media are included. Missing values are marked as unavailable. Reddit authors retain attribution.</footer></main>
<script>
const roots=[...document.querySelectorAll('#comments > article')];
document.querySelector('#search').addEventListener('input',e=>{{const q=e.target.value.toLowerCase();roots.forEach(c=>c.hidden=!c.textContent.toLowerCase().includes(q))}});
document.querySelector('#expand').addEventListener('click',()=>{{document.querySelector('#search').value='';roots.forEach(c=>c.hidden=false)}});
</script></html>'''


if __name__ == "__main__":
    source, target = map(Path, sys.argv[1:3])
    data = json.loads(source.read_text(encoding="utf-8"))
    target.write_text(build(data, source.parent), encoding="utf-8")
    print(target.resolve())
