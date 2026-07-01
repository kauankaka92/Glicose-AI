"""
Gera icon.png (512x512) e splash.png (1024x500) para o Buildozer.
Usa apenas stdlib Python — sem Pillow nem dependências externas.
Execute: python generate_assets.py
"""
import struct
import zlib
import math


def write_png(filename, width, height, pixels):
    """Escreve um PNG RGB a partir de uma lista de (r,g,b) por pixel."""
    def chunk(name, data):
        c = struct.pack('>I', len(data)) + name + data
        return c + struct.pack('>I', zlib.crc32(name + data) & 0xFFFFFFFF)

    raw = b''
    for y in range(height):
        raw += b'\x00'  # filter type None
        for x in range(width):
            r, g, b = pixels[y * width + x]
            raw += bytes([r, g, b])

    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0))
    png += chunk(b'IDAT', zlib.compress(raw, 9))
    png += chunk(b'IEND', b'')

    with open(filename, 'wb') as f:
        f.write(png)


def hex_to_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))


def draw_icon(size=512):
    """Ícone: fundo #0f172a com símbolo de glicose em #6366f1."""
    bg = hex_to_rgb('#0f172a')
    fg = hex_to_rgb('#6366f1')
    pixels = [bg] * (size * size)
    cx, cy = size // 2, size // 2

    # Círculo externo (raio 38% do tamanho)
    outer_r = int(size * 0.38)
    inner_r = int(size * 0.32)
    for y in range(size):
        for x in range(size):
            dx, dy = x - cx, y - cy
            dist = math.sqrt(dx * dx + dy * dy)
            if inner_r <= dist <= outer_r:
                pixels[y * size + x] = fg

    # Cruz central (linha horizontal e vertical)
    bar_w = max(4, size // 20)
    bar_len = int(size * 0.28)
    for i in range(-bar_len, bar_len + 1):
        for t in range(-bar_w // 2, bar_w // 2 + 1):
            # horizontal
            px, py = cx + i, cy + t
            if 0 <= px < size and 0 <= py < size:
                pixels[py * size + px] = fg
            # vertical
            px, py = cx + t, cy + i
            if 0 <= px < size and 0 <= py < size:
                pixels[py * size + px] = fg

    return pixels


def draw_splash(width=1024, height=500):
    """Splash: fundo #0f172a com ícone centralizado menor."""
    bg = hex_to_rgb('#0f172a')
    fg = hex_to_rgb('#6366f1')
    pixels = [bg] * (width * height)
    cx, cy = width // 2, height // 2

    outer_r = int(height * 0.28)
    inner_r = int(height * 0.22)
    for y in range(height):
        for x in range(width):
            dx, dy = x - cx, y - cy
            dist = math.sqrt(dx * dx + dy * dy)
            if inner_r <= dist <= outer_r:
                pixels[y * width + x] = fg

    bar_w = max(3, height // 25)
    bar_len = int(height * 0.18)
    for i in range(-bar_len, bar_len + 1):
        for t in range(-bar_w // 2, bar_w // 2 + 1):
            px, py = cx + i, cy + t
            if 0 <= px < width and 0 <= py < height:
                pixels[py * width + px] = fg
            px, py = cx + t, cy + i
            if 0 <= px < width and 0 <= py < height:
                pixels[py * width + px] = fg

    return pixels


if __name__ == '__main__':
    import os
    out = os.path.join(os.path.dirname(__file__), 'assets')
    os.makedirs(out, exist_ok=True)

    print('Gerando icon.png (512x512)...')
    write_png(os.path.join(out, 'icon.png'), 512, 512, draw_icon(512))

    print('Gerando splash.png (1024x500)...')
    write_png(os.path.join(out, 'splash.png'), 1024, 500, draw_splash(1024, 500))

    print('Assets gerados em:', out)
