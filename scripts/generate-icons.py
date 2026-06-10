"""Generate simple leaf-shaped PWA icons as raw PNGs (no external deps)."""
import math
import struct
import zlib

GREEN = (22, 163, 74, 255)  # #16A34A
WHITE = (255, 255, 255, 255)


def make_icon(path: str, size: int) -> None:
    cx = cy = size / 2
    R = size * 0.254
    offset = size * 0.137
    tip = math.sqrt(R * R - offset * offset)
    stem_half = size * 0.027
    stem_len = size * 0.137

    angle = math.radians(45)
    cos_a, sin_a = math.cos(angle), math.sin(angle)

    raw = bytearray()
    for y in range(size):
        raw.append(0)  # filter type: None
        for x in range(size):
            dx = x + 0.5 - cx
            dy = y + 0.5 - cy
            rx = dx * cos_a + dy * sin_a
            ry = -dx * sin_a + dy * cos_a

            d1 = (rx - offset) ** 2 + ry ** 2
            d2 = (rx + offset) ** 2 + ry ** 2
            in_leaf = d1 <= R * R and d2 <= R * R
            in_stem = abs(rx) <= stem_half and -(tip + stem_len) <= ry <= -tip + 1

            color = WHITE if (in_leaf or in_stem) else GREEN
            raw.extend(color)

    compressed = zlib.compress(bytes(raw), 9)

    def chunk(tag: bytes, data: bytes) -> bytes:
        c = tag + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xFFFFFFFF)

    sig = b'\x89PNG\r\n\x1a\n'
    ihdr = struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0)
    png = sig + chunk(b'IHDR', ihdr) + chunk(b'IDAT', compressed) + chunk(b'IEND', b'')

    with open(path, 'wb') as f:
        f.write(png)


if __name__ == '__main__':
    make_icon('public/icons/icon-192.png', 192)
    make_icon('public/icons/icon-512.png', 512)
    print('Generated icons/icon-192.png and icons/icon-512.png')
