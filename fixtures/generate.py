"""Rebuild the synthetic, paginated catalog used by both engines."""
from pathlib import Path
from html import escape

PRODUCTS = [
    ('AT-001', 'Lámpara de escritorio Arco', 'Iluminación', '49.90', '18', '♧'),
    ('AT-002', 'Silla de trabajo Nido', 'Mobiliario', '189.00', '7', '♜'),
    ('AT-003', 'Cuaderno de ideas A5', 'Papelería', '12.50', '42', '▤'),
    ('AT-004', 'Taza de cerámica Alba', 'Accesorios', '24.00', '26', '◡'),
    ('AT-005', 'Organizador modular', 'Accesorios', '32.80', '13', '▦'),
    ('AT-006', 'Mesa auxiliar Roble', 'Mobiliario', '119.00', '4', '⊤'),
    ('AT-007', 'Reloj de pared Línea', 'Accesorios', '38.00', '15', '◷'),
    ('AT-008', 'Bolígrafo Studio', 'Papelería', '8.90', '64', '✎'),
    ('AT-009', 'Luz de lectura Mini', 'Iluminación', '29.90', '0', '☼'),
    ('AT-010', 'Estante de pared Norte', 'Mobiliario', '74.00', '11', '≡'),
    ('AT-001', 'Lámpara de escritorio Arco', 'Iluminación', '49.90', '18', '♧'),
    ('AT-011', 'Set de notas Punto', 'Papelería', '', '23', '▧'),
]


def build():
    for page in range(1, 4):
        cards = []
        for sku, name, category, price, stock, icon in PRODUCTS[(page-1)*4:page*4]:
            cards.append(f'<article class="product"><div class="picture"><span aria-hidden="true">{icon}</span></div>'
                         f'<p class="category">{escape(category)}</p><h2>{escape(name)}</h2>'
                         f'<div class="price">{("$" + price) if price else "Por confirmar"}</div>'
                         f'<div class="meta"><span class="sku">{sku}</span><span class="stock">{stock}</span></div></article>')
        navigation = ''.join(f'<span aria-current="page">{i}</span>' if i == page else
                             f'<a href="catalog-{i}.html">{i}</a>' for i in range(1,4))
        if page < 3:
            navigation += f'<a href="catalog-{page+1}.html" rel="next">Siguiente</a>'
        html = ('<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
                '<title>Atelier · Catálogo de prueba</title><link rel="stylesheet" href="catalog.css"></head><body>'
                '<header><div class="brand">atelier<b>.</b></div><small>Tienda ficticia · datos sintéticos</small></header>'
                '<div class="intro"><div><h1>Objetos para crear.</h1><p>Una selección para tu espacio de trabajo.</p></div><small>USD · precio neto</small></div>'
                f'<main class="grid">{"".join(cards)}</main><nav aria-label="Páginas">{navigation}</nav>'
                '<footer>Fuente local de prueba. No representa inventario comercial.</footer></body></html>')
        (Path(__file__).parent / f'catalog-{page}.html').write_text(html, encoding='utf-8')


if __name__ == '__main__':
    build()
