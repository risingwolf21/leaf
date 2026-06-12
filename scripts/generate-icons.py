"""Generate PWA icons: the Lucide "Leaf" glyph in green (#16A34A) on a white
square, matching the leaf icon shown in the app header.

Requires Playwright (used to rasterize the SVG to PNG).
"""
import asyncio
import os

from playwright.async_api import async_playwright

GREEN = '#16A34A'
LEAF_PATHS = [
    'M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z',
    'M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12',
]
ICON_RATIO = 0.6  # leaf glyph occupies 60% of the canvas, centered


def build_svg(size: int) -> str:
    scale = (size * ICON_RATIO) / 24
    pad = (size - 24 * scale) / 2
    paths = '\n    '.join(f'<path d="{d}"/>' for d in LEAF_PATHS)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 {size} {size}">
  <rect width="{size}" height="{size}" fill="#ffffff"/>
  <g transform="translate({pad} {pad}) scale({scale})" fill="none" stroke="{GREEN}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    {paths}
  </g>
</svg>'''


async def main() -> None:
    async with async_playwright() as p:
        browser = await p.chromium.launch(args=['--no-sandbox'])
        page = await browser.new_page()

        for size in (192, 512):
            await page.set_viewport_size({'width': size, 'height': size})
            svg = build_svg(size)
            await page.set_content(
                f'<!DOCTYPE html><html><head><style>html,body{{margin:0;padding:0}}</style></head><body>{svg}</body></html>'
            )
            out_path = os.path.join('public', 'icons', f'icon-{size}.png')
            await page.screenshot(path=out_path)
            print(f'Generated {out_path}')

        await browser.close()


if __name__ == '__main__':
    asyncio.run(main())
