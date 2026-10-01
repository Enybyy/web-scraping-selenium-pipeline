import csv
import tempfile
import unittest
from pathlib import Path
from pipeline import ROOT, crawl, csv_safe, extract, price_number, save


class PipelineTests(unittest.TestCase):
    def test_paginated_fixture_and_quality(self):
        result = crawl((ROOT / 'fixtures/catalog-1.html').as_uri())
        self.assertEqual(len(result['pages']), 3)
        self.assertEqual(len(result['rows']), 10)
        self.assertEqual(result['duplicates'][0]['sku'], 'AT-001')
        self.assertEqual(result['rejected'][0]['sku'], 'AT-011')
        self.assertFalse(result['truncated'])
        self.assertEqual(next(row['stock'] for row in result['rows'] if row['sku'] == 'AT-009'), 0)

    def test_page_limit(self):
        result = crawl((ROOT / 'fixtures/catalog-1.html').as_uri(), max_pages=1)
        self.assertEqual(len(result['rows']), 4)
        self.assertTrue(result['truncated'])

    def test_missing_selector_fails_clearly(self):
        with self.assertRaisesRegex(ValueError, 'No records match'):
            extract('<html></html>', 'test')

    def test_bad_price_and_stock_are_rejected(self):
        for extra in ['<span class="price">por confirmar</span><span class="stock">2</span>', '<span class="price">$5.00</span><span class="stock">-1</span>']:
            rows, rejected, _ = extract('<article class="product"><h2>Item</h2><span class="sku">1</span>' + extra + '</article>', 'test')
            self.assertFalse(rows)
            self.assertEqual(len(rejected), 1)

    def test_price_format(self):
        self.assertEqual(price_number('$1,234.50'), 1234.5)
        for value in ['', '-2', '1.234.50', 'N/A']:
            with self.assertRaises(ValueError):
                price_number(value)

    def test_network_is_opt_in(self):
        with self.assertRaisesRegex(ValueError, 'allow-network'):
            crawl('https://example.com/catalog')

    def test_invalid_limits(self):
        for pages in [0, 51]:
            with self.assertRaises(ValueError):
                crawl((ROOT / 'fixtures/catalog-1.html').as_uri(), max_pages=pages)

    def test_csv_round_trip_and_formula_protection(self):
        result = crawl((ROOT / 'fixtures/catalog-1.html').as_uri())
        result['rows'][0]['name'] = '=SUM(A1:A2), "Lámpara"'
        with tempfile.TemporaryDirectory() as directory:
            save(result, Path(directory))
            with (Path(directory) / 'catalog.csv').open(encoding='utf-8-sig', newline='') as file:
                rows = list(csv.DictReader(file))
            self.assertEqual(len(rows), 10)
            self.assertEqual(rows[0]['name'], '\'=SUM(A1:A2), "Lámpara"')
        self.assertEqual(csv_safe('  @SUM(A1)'), "'  @SUM(A1)")

    def test_file_pagination_is_confined(self):
        with tempfile.TemporaryDirectory() as directory:
            nested = Path(directory) / 'nested'
            nested.mkdir()
            html = (ROOT / 'fixtures/catalog-1.html').read_text(encoding='utf-8').replace('catalog-2.html" rel="next"', '../escape.html" rel="next"')
            (nested / 'start.html').write_text(html, encoding='utf-8')
            with self.assertRaisesRegex(ValueError, 'source directory'):
                crawl((nested / 'start.html').as_uri())


if __name__ == '__main__':
    unittest.main()
