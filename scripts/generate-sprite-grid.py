"""
Generate a showcase grid of all Petanque Master characters.
Creates a professional-looking character roster image for video/thumbnail.

Uses Pillow to:
1. Extract the first frame (front-facing idle) from each spritesheet
2. Upscale with nearest-neighbor (pixelated look preserved)
3. Arrange in a grid with names, stats, and provencal styling
4. Output at 1920x1080 for video use
"""

from PIL import Image, ImageDraw, ImageFont
import json
import os

# Paths
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SPRITES_DIR = os.path.join(BASE, "public", "assets", "sprites")
FACES_DIR = os.path.join(BASE, "docs", "presentation", "sprites_face")
DATA_DIR = os.path.join(BASE, "public", "data")
OUTPUT_DIR = os.path.join(BASE, "docs", "making-of", "video")

# Provencal palette
BG_DARK = (42, 31, 26)        # #2A1F1A
BG_CARD = (58, 46, 40)        # #3A2E28
OCRE = (212, 165, 116)        # #D4A574
TERRACOTTA = (196, 133, 74)   # #C4854A
OLIVE = (107, 142, 78)        # #6B8E4E
LAVANDE = (155, 123, 184)     # #9B7BB8
CIEL = (135, 206, 235)        # #87CEEB
CREME = (245, 230, 208)       # #F5E6D0
SHADOW = (26, 21, 16)         # #1A1510

# Character order (matching the game)
CHARACTERS = [
    {"id": "rookie", "file": "rookie_animated.png", "face": "01_rookie.png"},
    {"id": "la_choupe", "file": "la_choupe_animated.png", "face": "02_la_choupe.png"},
    {"id": "ley", "file": "ley_animated.png", "face": "03_ley.png"},
    {"id": "foyot", "file": "foyot_animated.png", "face": "04_foyot.png"},
    {"id": "suchaud", "file": "suchaud_animated.png", "face": "05_suchaud.png"},
    {"id": "fazzino", "file": "fazzino_animated.png", "face": "06_fazzino.png"},
    {"id": "rocher", "file": "rocher_animated.png", "face": "07_rocher.png"},
    {"id": "robineau", "file": "robineau_animated.png", "face": "08_robineau.png"},
    {"id": "mamie_josette", "file": "mamie_josette_animated.png", "face": "09_mamie_josette.png"},
    {"id": "sofia", "file": "sofia_animated.png", "face": "10_sofia.png"},
    {"id": "papi_rene", "file": "papi_rene_animated.png", "face": "11_papi_rene.png"},
    {"id": "rizzi", "file": "rizzi_animated.png", "face": "12_rizzi.png"},
]

def load_character_data():
    """Load character stats from characters.json"""
    with open(os.path.join(DATA_DIR, "characters.json"), "r", encoding="utf-8") as f:
        data = json.load(f)
    roster = data.get("roster", data) if isinstance(data, dict) else data
    return {c["id"]: c for c in roster}

def extract_first_frame(spritesheet_path, frame_size=32):
    """Extract the front-facing idle frame (first frame) from a 4x4 spritesheet"""
    img = Image.open(spritesheet_path).convert("RGBA")
    # First frame is top-left corner
    frame = img.crop((0, 0, frame_size, frame_size))
    return frame

def upscale_nearest(img, scale):
    """Upscale with nearest-neighbor to preserve pixel art"""
    new_size = (img.width * scale, img.height * scale)
    return img.resize(new_size, Image.NEAREST)

def draw_stat_bar(draw, x, y, width, value, max_val, color, height=6):
    """Draw a small stat bar"""
    # Background
    draw.rectangle([x, y, x + width, y + height], fill=BG_DARK)
    # Fill
    fill_width = int(width * value / max_val)
    if fill_width > 0:
        draw.rectangle([x, y, x + fill_width, y + height], fill=color)

def generate_roster_grid():
    """Generate the full character roster grid at 1920x1080"""
    char_data = load_character_data()

    # Canvas 1920x1080
    W, H = 1920, 1080
    canvas = Image.new("RGBA", (W, H), BG_DARK)
    draw = ImageDraw.Draw(canvas)

    # Try to load a font, fallback to default
    try:
        font_title = ImageFont.truetype("arial.ttf", 48)
        font_name = ImageFont.truetype("arial.ttf", 18)
        font_stat = ImageFont.truetype("arial.ttf", 12)
        font_small = ImageFont.truetype("arial.ttf", 10)
    except:
        font_title = ImageFont.load_default()
        font_name = font_title
        font_stat = font_title
        font_small = font_title

    # Title
    title = "PETANQUE MASTER — LE ROSTER"
    bbox = draw.textbbox((0, 0), title, font=font_title)
    tw = bbox[2] - bbox[0]
    draw.text(((W - tw) // 2, 20), title, fill=OCRE, font=font_title)

    # Subtitle
    sub = "12 personnages  •  456 commits  •  19 jours  •  3 IAs"
    bbox_s = draw.textbbox((0, 0), sub, font=font_name)
    sw = bbox_s[2] - bbox_s[0]
    draw.text(((W - sw) // 2, 78), sub, fill=LAVANDE, font=font_name)

    # Grid: 6 columns x 2 rows
    cols, rows = 6, 2
    margin_x, margin_y = 40, 115
    card_w = (W - margin_x * 2 - 20 * (cols - 1)) // cols  # ~280
    card_h = (H - margin_y - 40 - 20) // rows  # ~440
    sprite_scale = 4  # 32x32 → 128x128

    for idx, char_info in enumerate(CHARACTERS):
        col = idx % cols
        row = idx // cols

        cx = margin_x + col * (card_w + 20)
        cy = margin_y + row * (card_h + 20)

        # Card background with rounded corners effect
        draw.rectangle([cx, cy, cx + card_w, cy + card_h], fill=BG_CARD)
        # Top accent bar
        draw.rectangle([cx, cy, cx + card_w, cy + 4], fill=OCRE if char_info["id"] == "rookie" else TERRACOTTA)

        # Load and draw face sprite (presentation version — higher quality)
        face_path = os.path.join(FACES_DIR, char_info["face"])
        if os.path.exists(face_path):
            face = Image.open(face_path).convert("RGBA")
            # Scale to fit card (max ~120px tall)
            face_scale = min(120 / face.height, (card_w - 20) / face.width)
            face_scaled = face.resize(
                (int(face.width * face_scale), int(face.height * face_scale)),
                Image.NEAREST
            )
            fx = cx + (card_w - face_scaled.width) // 2
            fy = cy + 15
            canvas.paste(face_scaled, (fx, fy), face_scaled)
        else:
            # Fallback: extract from spritesheet
            sprite_path = os.path.join(SPRITES_DIR, char_info["file"])
            if os.path.exists(sprite_path):
                frame = extract_first_frame(sprite_path)
                frame_big = upscale_nearest(frame, sprite_scale)
                fx = cx + (card_w - frame_big.width) // 2
                fy = cy + 15
                canvas.paste(frame_big, (fx, fy), frame_big)

        # Character name
        cdata = char_data.get(char_info["id"], {})
        name = cdata.get("name", char_info["id"])
        bbox_n = draw.textbbox((0, 0), name, font=font_name)
        nw = bbox_n[2] - bbox_n[0]
        draw.text((cx + (card_w - nw) // 2, cy + 145), name, fill=CREME, font=font_name)

        # Title/archetype
        archetype = cdata.get("archetype", cdata.get("title", ""))
        if archetype:
            bbox_a = draw.textbbox((0, 0), archetype, font=font_small)
            aw = bbox_a[2] - bbox_a[0]
            draw.text((cx + (card_w - aw) // 2, cy + 168), archetype, fill=LAVANDE, font=font_small)

        # Stats bars
        stats = cdata.get("stats", {})
        stat_labels = [
            ("PRE", stats.get("precision", 5), CIEL),
            ("PUI", stats.get("puissance", 5), TERRACOTTA),
            ("EFF", stats.get("effet", 5), LAVANDE),
            ("S.F", stats.get("sang_froid", 5), OLIVE),
        ]

        bar_y = cy + 188
        bar_x = cx + 15
        bar_w = card_w - 30

        for label, value, color in stat_labels:
            draw.text((bar_x, bar_y - 1), label, fill=CREME, font=font_small)
            draw_stat_bar(draw, bar_x + 30, bar_y + 2, bar_w - 30, value, 10, color, height=8)
            # Value number
            draw.text((bar_x + bar_w - 8, bar_y - 1), str(value), fill=CREME, font=font_small)
            bar_y += 16

        # Total
        total = sum(stats.get(s, 0) for s in ["precision", "puissance", "effet", "sang_froid"])
        total_text = f"Total: {total}/40"
        draw.text((bar_x, bar_y + 4), total_text, fill=OCRE, font=font_stat)

    # Bottom credit
    credit = "Petanque Master — Made with Claude + PixelLab + ElevenLabs"
    bbox_c = draw.textbbox((0, 0), credit, font=font_small)
    cw = bbox_c[2] - bbox_c[0]
    draw.text(((W - cw) // 2, H - 25), credit, fill=(100, 80, 60), font=font_small)

    # Save
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    output_path = os.path.join(OUTPUT_DIR, "roster_grid_1080p.png")
    canvas.save(output_path, "PNG")
    print(f"Roster grid saved to {output_path}")
    print(f"Size: {W}x{H}")
    return output_path

if __name__ == "__main__":
    path = generate_roster_grid()
    print(f"\nDone! Open: {path}")
