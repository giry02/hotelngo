"""Create transparent HotelnGo assets without redrawing the approved logo.

Only the alpha channel is derived. RGB pixels are copied verbatim from the
approved 303x91 PNG, and the white disc inside the map pin is kept opaque.
"""

from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
BRAND_DIR = ROOT / "assets" / "brand"
SOURCE = BRAND_DIR / "source" / "hotelngo-logo-approved-raster-white.png"
OFFICIAL_DIR = BRAND_DIR / "official"
WORDMARK_OUTPUT = OFFICIAL_DIR / "hotelngo-logo-primary.png"
MARK_OUTPUT = OFFICIAL_DIR / "hotelngo-symbol-primary.png"


def near_white_components(image: Image.Image, threshold: int = 245):
    pixels = image.load()
    width, height = image.size
    seen: set[tuple[int, int]] = set()
    components: list[list[tuple[int, int]]] = []

    for y in range(height):
        for x in range(width):
            if (x, y) in seen or min(pixels[x, y]) < threshold:
                continue

            queue = deque([(x, y)])
            seen.add((x, y))
            component: list[tuple[int, int]] = []

            while queue:
                current_x, current_y = queue.popleft()
                component.append((current_x, current_y))
                for next_x, next_y in (
                    (current_x - 1, current_y),
                    (current_x + 1, current_y),
                    (current_x, current_y - 1),
                    (current_x, current_y + 1),
                ):
                    if not (0 <= next_x < width and 0 <= next_y < height):
                        continue
                    if (next_x, next_y) in seen:
                        continue
                    if min(pixels[next_x, next_y]) < threshold:
                        continue
                    seen.add((next_x, next_y))
                    queue.append((next_x, next_y))

            components.append(component)

    return components


def create_transparent_wordmark(source: Image.Image) -> Image.Image:
    rgb = source.convert("RGB")
    width, height = rgb.size
    result = Image.new("RGBA", rgb.size)
    source_pixels = rgb.load()
    result_pixels = result.load()

    # Convert white and near-white compositing pixels to transparency. Pixels
    # sufficiently far from white remain fully opaque, preserving logo colors.
    for y in range(height):
        for x in range(width):
            red, green, blue = source_pixels[x, y]
            distance_from_white = max(255 - red, 255 - green, 255 - blue)
            alpha = min(255, round(distance_from_white * 255 / 48))
            result_pixels[x, y] = (red, green, blue, alpha)

    # The white circle inside the blue map pin is part of the mark, not the
    # background. Find that enclosed white component and keep its disc opaque.
    candidates = []
    for component in near_white_components(rgb):
        xs = [point[0] for point in component]
        ys = [point[1] for point in component]
        touches_border = (
            min(xs) == 0 or min(ys) == 0 or max(xs) == width - 1 or max(ys) == height - 1
        )
        if not touches_border and min(xs) > width * 0.7:
            candidates.append((len(component), min(xs), min(ys), max(xs), max(ys)))

    if not candidates:
        raise RuntimeError("Map-pin white disc could not be identified.")

    _, left, top, right, bottom = max(candidates)
    center_x = (left + right) / 2
    center_y = (top + bottom) / 2
    radius = max(right - left + 1, bottom - top + 1) / 2 + 1.25

    for y in range(max(0, int(center_y - radius - 1)), min(height, int(center_y + radius + 2))):
        for x in range(max(0, int(center_x - radius - 1)), min(width, int(center_x + radius + 2))):
            if (x - center_x) ** 2 + (y - center_y) ** 2 <= radius**2:
                red, green, blue = source_pixels[x, y]
                result_pixels[x, y] = (red, green, blue, 255)

    return result


def create_mark(wordmark: Image.Image) -> Image.Image:
    # The approved pin occupies the right side of the source. This crop keeps
    # its original pixels and scale, then places it on a square transparent artboard.
    alpha = wordmark.getchannel("A")
    width, height = wordmark.size
    right_side = alpha.crop((round(width * 0.73), 0, width, height))
    bbox = right_side.getbbox()
    if bbox is None:
        raise RuntimeError("Map-pin mark could not be identified.")

    left, top, right, bottom = bbox
    left += round(width * 0.73)
    right += round(width * 0.73)
    mark = wordmark.crop((left, top, right, bottom))

    side = max(mark.width, mark.height) + 12
    canvas = Image.new("RGBA", (side, side), (255, 255, 255, 0))
    canvas.alpha_composite(mark, ((side - mark.width) // 2, (side - mark.height) // 2))
    return canvas


def main() -> None:
    OFFICIAL_DIR.mkdir(parents=True, exist_ok=True)
    source = Image.open(SOURCE).convert("RGB")
    if source.size != (303, 91):
        raise RuntimeError(f"Unexpected source dimensions: {source.size}")

    wordmark = create_transparent_wordmark(source)
    mark = create_mark(wordmark)
    wordmark.save(WORDMARK_OUTPUT, optimize=True)
    mark.save(MARK_OUTPUT, optimize=True)

    print(f"created {WORDMARK_OUTPUT.relative_to(ROOT)} {wordmark.size} {wordmark.mode}")
    print(f"created {MARK_OUTPUT.relative_to(ROOT)} {mark.size} {mark.mode}")


if __name__ == "__main__":
    main()
