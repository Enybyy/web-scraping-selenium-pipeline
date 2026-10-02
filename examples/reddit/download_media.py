"""Download only media URLs captured from the source DOM and export a flat CSV."""
import csv
import json
from pathlib import Path
from urllib.request import Request, urlopen

base = Path(__file__).resolve().parent
data = json.loads((base / 'snapshot.json').read_text(encoding='utf-8'))
(base / 'media').mkdir(exist_ok=True)

def walk(items):
    for item in items:
        yield item
        yield from walk(item.get('replies', []))

for index, item in enumerate([data['post'], *walk(data['comments'])]):
    for number, image in enumerate(item.get('images', [])):
        try:
            with urlopen(Request(image['url'], headers={'User-Agent': 'RedditArchiveSample/1.0'}), timeout=30) as response:
                mime = response.headers.get_content_type()
                extension = {'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif', 'image/webp': '.webp'}.get(mime)
                if not extension:
                    raise ValueError(f'Unexpected media type: {mime}')
                payload = response.read(12_000_001)
                if len(payload) > 12_000_000:
                    raise ValueError('Media larger than sample limit')
            path = base / 'media' / f'{index:02d}-{number}{extension}'
            path.write_bytes(payload)
            image['file'] = path.relative_to(base).as_posix()
            print(image['file'], len(payload))
        except Exception as error:
            image['download_status'] = str(error)
            print('Unavailable:', image['url'], str(error))
(base / 'snapshot.json').write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
fields = ['id', 'parent_id', 'author', 'date', 'score', 'text', 'url', 'media_urls']
with (base / 'comments.csv').open('w', encoding='utf-8-sig', newline='') as handle:
    writer = csv.DictWriter(handle, fieldnames=fields)
    writer.writeheader()
    for item in walk(data['comments']):
        row = {key: item.get(key, '') for key in fields}
        row['media_urls'] = ' | '.join(image['url'] for image in item.get('images', []))
        for key, value in row.items():
            if isinstance(value, str) and value.lstrip().startswith(('=', '+', '-', '@')):
                row[key] = "'" + value
        writer.writerow(row)
