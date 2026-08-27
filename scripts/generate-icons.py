"""
public/logo.png(풍생중학교 공식 교표)을 원본으로 PWA/파비콘 아이콘 세트를 생성한다.
- logo192.png / logo512.png : 투명 배경, manifest.json(Android/데스크톱 PWA)용, 여백 추가로 마스크 아이콘 크롭 방지
- apple-touch-icon.png      : 흰 배경(iOS는 투명을 검정으로 채우므로 불투명 배경 필요), 180x180
- favicon.ico               : 흰 배경, 16/32/48px 멀티 사이즈
"""
from PIL import Image

SRC = "public/logo.png"
PAD_RATIO = 0.08  # 여백 비율 (마스크 아이콘 크롭 방지)


def load_padded(size, background=None):
    src = Image.open(SRC).convert("RGBA")
    canvas = Image.new("RGBA", (size, size), background or (0, 0, 0, 0))
    inner = int(size * (1 - PAD_RATIO * 2))
    resized = src.resize((inner, inner), Image.LANCZOS)
    offset = ((size - inner) // 2, (size - inner) // 2)
    canvas.paste(resized, offset, resized)
    return canvas


# 1) manifest.json용 (투명 배경)
load_padded(192).save("public/logo192.png")
load_padded(512).save("public/logo512.png")

# 2) apple-touch-icon (흰 배경, 180x180)
load_padded(180, background=(255, 255, 255, 255)).convert("RGB").save(
    "public/apple-touch-icon.png"
)

# 3) favicon.ico (흰 배경, 멀티 사이즈)
fav_base = load_padded(256, background=(255, 255, 255, 255)).convert("RGB")
fav_base.save(
    "public/favicon.ico",
    sizes=[(16, 16), (32, 32), (48, 48), (64, 64)],
)

print("done")
