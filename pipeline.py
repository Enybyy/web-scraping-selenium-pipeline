"""Bounded, same-origin catalog extraction. Local fixtures work without a browser."""
from __future__ import annotations

import argparse
import csv
import json
import re
import sys
import time
from pathlib import Path
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen
from urllib.robotparser import RobotFileParser

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent
DEFAULT_SCHEMA = json.loads((ROOT / 'schema.json').read_text(encoding='utf-8'))


def price_number(value: str) -> float:
    """Fixture convention: USD with dot decimals, optional comma thousands."""
    cleaned = re.sub(r'[^\d.,-]', '', value).replace(',', '')
    if not re.fullmatch(r'\d+(?:\.\d{1,2})?', cleaned):
        raise ValueError('price is missing or invalid')
    return float(cleaned)


def extract(html: str, source: str, schema: dict = DEFAULT_SCHEMA):
    soup = BeautifulSoup(html, 'html.parser')
    cards = soup.select(schema['item'])
    if not cards:
        raise ValueError(f"No records match {schema['item']!r}: {source}")
    rows, rejected = [], []
    for index, card in enumerate(cards, 1):
        values = {}
        for name, selector in schema['fields'].items():
            node = card.select_one(selector)
            values[name] = node.get_text(' ', strip=True) if node else ''
        try:
            if not values.get('sku') or not values.get('name'):
                raise ValueError('sku or name is missing')
            values['price'] = price_number(values.get('price', ''))
            stock = values.get('stock', '')
            if not re.fullmatch(r'\d+', stock):
                raise ValueError('stock must be a non-negative integer')
            values['stock'] = int(stock)
            values['source'] = source
            rows.append(values)
        except ValueError as exc:
            rejected.append({'source': source, 'record': index, 'sku': values.get('sku', ''), 'reason': str(exc)})
    next_node = soup.select_one(schema['next']) if schema.get('next') else None
    next_url = urljoin(source, next_node.get('href', '')) if next_node else None
    return rows, rejected, next_url


def crawl(start: str, schema: dict = DEFAULT_SCHEMA, max_pages: int = 3,
          browser: bool = False, allow_network: bool = False, delay: float = 1):
    if not 1 <= max_pages <= 50:
        raise ValueError('max_pages must be between 1 and 50')
    if delay < 0:
        raise ValueError('delay cannot be negative')
    origin = urlparse(start)
    if origin.scheme not in ('file', 'http', 'https'):
        raise ValueError('Only file, http and https sources are supported')
    if origin.scheme != 'file' and not allow_network:
        raise ValueError('Network access requires --allow-network')
    robot = None
    if origin.scheme != 'file':
        robot = RobotFileParser()
        robots_url = f'{origin.scheme}://{origin.netloc}/robots.txt'
        try:
            with urlopen(Request(robots_url, headers={'User-Agent': 'CatalogPipeline/1.0'}), timeout=15) as response:
                robot.parse(response.read(1_000_000).decode('utf-8', errors='replace').splitlines())
        except Exception as exc:
            raise ValueError(f'Unable to verify robots.txt; use a local fixture or a source with readable robots.txt: {exc}') from exc
    driver = None
    try:
        if browser:
            from selenium import webdriver
            options = webdriver.ChromeOptions()
            options.add_argument('--headless=new')
            driver = webdriver.Chrome(options=options)
            driver.set_page_load_timeout(20)
        rows, rejects, duplicates, visited, seen = [], [], [], [], set()
        url = start
        while url and len(visited) < max_pages:
            parsed = urlparse(url)
            if (parsed.scheme, parsed.netloc) != (origin.scheme, origin.netloc):
                raise ValueError('Pagination cannot leave the starting origin')
            if origin.scheme == 'file':
                from urllib.request import url2pathname
                target = Path(url2pathname(parsed.path)).resolve()
                base = Path(url2pathname(origin.path)).resolve().parent
                if not target.is_relative_to(base):
                    raise ValueError('File pagination cannot leave the source directory')
            if url in visited:
                break
            if robot and not robot.can_fetch('CatalogPipeline', url):
                raise ValueError(f'robots.txt does not allow extraction: {url}')
            if visited and parsed.scheme != 'file':
                time.sleep(delay)
            if driver:
                from selenium.webdriver.common.by import By
                from selenium.webdriver.support.ui import WebDriverWait
                from selenium.webdriver.support import expected_conditions as EC
                driver.get(url)
                final = urlparse(driver.current_url)
                if (final.scheme, final.netloc) != (origin.scheme, origin.netloc):
                    raise ValueError('Browser navigation left the starting origin')
                WebDriverWait(driver, 15).until(EC.presence_of_element_located((By.CSS_SELECTOR, schema['item'])))
                html = driver.page_source
            else:
                with urlopen(Request(url, headers={'User-Agent': 'CatalogPipeline/1.0'}), timeout=20) as response:
                    final = urlparse(response.geturl())
                    if (final.scheme, final.netloc) != (origin.scheme, origin.netloc):
                        raise ValueError('Redirect left the starting origin')
                    data = response.read(2_000_001)
                    if len(data) > 2_000_000:
                        raise ValueError('HTML exceeds 2 MB')
                    html = data.decode('utf-8-sig')
            batch, bad, next_url = extract(html, url, schema)
            visited.append(url)
            rejects.extend(bad)
            for row in batch:
                if row['sku'] in seen:
                    duplicates.append({'sku': row['sku'], 'source': url})
                else:
                    seen.add(row['sku'])
                    rows.append(row)
            url = next_url
        return {'rows': rows, 'rejected': rejects, 'duplicates': duplicates, 'pages': visited,
                'truncated': bool(url and url not in visited)}
    finally:
        if driver:
            driver.quit()


def csv_safe(value):
    text = str(value)
    return "'" + text if text.lstrip().startswith(('=', '+', '-', '@')) else value


def save(result: dict, output: Path):
    output.mkdir(parents=True, exist_ok=True)
    (output / 'report.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
    columns = ['sku', 'name', 'category', 'price', 'stock', 'source']
    with (output / 'catalog.csv').open('w', encoding='utf-8-sig', newline='') as file:
        writer = csv.DictWriter(file, fieldnames=columns, extrasaction='ignore')
        writer.writeheader()
        writer.writerows({key: csv_safe(row.get(key, '')) for key in columns} for row in result['rows'])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', default=(ROOT / 'fixtures/catalog-1.html').as_uri())
    parser.add_argument('--schema', type=Path, default=ROOT / 'schema.json')
    parser.add_argument('--output', type=Path, default=ROOT / 'output')
    parser.add_argument('--max-pages', type=int, default=3)
    parser.add_argument('--browser', action='store_true')
    parser.add_argument('--allow-network', action='store_true')
    parser.add_argument('--delay', type=float, default=1)
    args = parser.parse_args()
    try:
        schema = json.loads(args.schema.read_text(encoding='utf-8'))
        result = crawl(args.source, schema, args.max_pages, args.browser, args.allow_network, args.delay)
        save(result, args.output)
    except Exception as exc:
        print(f'Extraction failed: {exc}', file=sys.stderr)
        return 1
    print(f"{len(result['pages'])} pages, {len(result['rows'])} records, "
          f"{len(result['duplicates'])} duplicates, {len(result['rejected'])} rejected")
    print(f'CSV + JSON: {args.output.resolve()}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
