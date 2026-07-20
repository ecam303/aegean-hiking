from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageFilter

# Website-aligned palette from css/style.css
PALETTE = {
    "primary": (106, 146, 173),      # --wine
    "primary_dark": (26, 33, 92),    # --wine-dark
    "bg": (255, 255, 255),
    "muted": (118, 118, 118),        # --text-gray
    "line": (231, 227, 220),         # --line
    "ink": (26, 26, 26),
    "sea_soft": (227, 239, 247),
}

OUT_DIR = Path("outputs/ad-mockups")
OUT_DIR.mkdir(parents=True, exist_ok=True)

SOURCE_HOME = OUT_DIR / "source_home.png"
SOURCE_ANAFI = OUT_DIR / "source_anafi.png"
SOURCE_SYROS = OUT_DIR / "source_syros.png"


def get_fonts():
    # Falls back to default PIL font if system fonts are unavailable.
    try:
        title = ImageFont.truetype("arialbd.ttf", 64)
        h2 = ImageFont.truetype("arialbd.ttf", 42)
        h3 = ImageFont.truetype("arialbd.ttf", 30)
        body = ImageFont.truetype("arial.ttf", 28)
        small = ImageFont.truetype("arial.ttf", 22)
        tiny = ImageFont.truetype("arial.ttf", 18)
    except OSError:
        title = ImageFont.load_default()
        h2 = ImageFont.load_default()
        h3 = ImageFont.load_default()
        body = ImageFont.load_default()
        small = ImageFont.load_default()
        tiny = ImageFont.load_default()
    return title, h2, h3, body, small, tiny


def rounded_rect(draw, xy, r, fill, outline=None, width=1):
    draw.rounded_rectangle(xy, radius=r, fill=fill, outline=outline, width=width)


def draw_feature_chip(draw, x, y, w, h, title, subtitle, color, fonts):
    _, _, _, _, small, tiny = fonts
    rounded_rect(draw, (x, y, x + w, y + h), 26, fill=color)
    draw.text((x + 24, y + 18), title, font=small, fill=(255, 255, 255))
    draw.text((x + 24, y + 58), subtitle, font=tiny, fill=(245, 248, 252))


def draw_phone_frame(canvas, screenshot, x, y, w, h, border=16, radius=34):
    frame = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    fd = ImageDraw.Draw(frame)
    fd.rounded_rectangle((0, 0, w - 1, h - 1), radius=radius, fill=(20, 24, 42, 255))
    inner = (border, border + 26, w - border, h - border)
    fd.rounded_rectangle(inner, radius=max(8, radius - 16), fill=(240, 244, 248, 255))

    top_notch_w = int(w * 0.36)
    notch_x0 = (w - top_notch_w) // 2
    fd.rounded_rectangle((notch_x0, 8, notch_x0 + top_notch_w, 28), radius=8, fill=(10, 12, 20, 255))

    screen_w = inner[2] - inner[0]
    screen_h = inner[3] - inner[1]
    fitted = ImageOps.fit(screenshot, (screen_w, screen_h), method=Image.Resampling.LANCZOS)
    frame.paste(fitted.convert("RGBA"), (inner[0], inner[1]))

    shadow = Image.new("RGBA", (w + 22, h + 22), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle((11, 11, w + 10, h + 10), radius=radius + 2, fill=(0, 0, 0, 120))
    shadow = shadow.filter(ImageFilter.GaussianBlur(8))
    canvas.alpha_composite(shadow, (x - 11, y - 6))
    canvas.alpha_composite(frame, (x, y))


def add_callout(canvas, x, y, text, color, fonts, to_x, to_y):
    _, _, _, _, small, tiny = fonts
    draw = ImageDraw.Draw(canvas)
    padding_x = 14
    padding_y = 10
    text_w = int(draw.textlength(text, font=small))
    w = text_w + padding_x * 2
    h = 44
    rounded_rect(draw, (x, y, x + w, y + h), 12, fill=(255, 255, 255, 245), outline=color, width=2)
    draw.text((x + padding_x, y + padding_y), text, font=small, fill=PALETTE["primary_dark"])
    draw.line((x + w // 2, y + h, to_x, to_y), fill=color, width=3)
    draw.ellipse((to_x - 6, to_y - 6, to_x + 6, to_y + 6), fill=color)


def load_sources():
    missing = [p for p in [SOURCE_HOME, SOURCE_ANAFI, SOURCE_SYROS] if not p.exists()]
    if missing:
        raise FileNotFoundError(
            "Missing source screenshots: " + ", ".join(str(p) for p in missing)
        )
    return (
        Image.open(SOURCE_HOME).convert("RGB"),
        Image.open(SOURCE_ANAFI).convert("RGB"),
        Image.open(SOURCE_SYROS).convert("RGB"),
    )


def ad_mockup_landscape(path):
    home, anafi, syros = load_sources()
    img = Image.new("RGBA", (1600, 900), PALETTE["bg"] + (255,))
    draw = ImageDraw.Draw(img)
    fonts = get_fonts()
    title, h2, h3, body, small, tiny = fonts

    # Background accents inspired by flyer layout
    draw.rectangle((0, 0, 1600, 210), fill=PALETTE["primary_dark"])
    draw.rectangle((0, 790, 1600, 900), fill=PALETTE["primary_dark"])
    draw.rectangle((0, 210, 1600, 260), fill=PALETTE["primary"])

    draw.text((72, 62), "GEO-ARCHAEO HIKING", font=h2, fill=(255, 255, 255))
    draw.text((72, 134), "See the website in action", font=h3, fill=(232, 241, 248))
    draw.text((1056, 138), "ANAFI + SYROS", font=small, fill=(238, 246, 252))

    # Multi-device screenshot layout
    draw_phone_frame(img, home, 120, 286, 300, 530)
    draw_phone_frame(img, anafi, 355, 250, 340, 590)
    draw_phone_frame(img, syros, 625, 286, 300, 530)

    rounded_rect(draw, (980, 290, 1545, 736), 20, fill=(247, 250, 253), outline=PALETTE["line"], width=2)
    draw.text((1012, 330), "Built for the trail", font=h3, fill=PALETTE["primary_dark"])

    draw_feature_chip(draw, 1012, 388, 500, 92, "Track Progress", "Distance and current trail status", PALETTE["primary_dark"], fonts)
    draw_feature_chip(draw, 1012, 492, 500, 92, "Waypoint Navigation", "Jump between mapped route stops", PALETTE["primary"], fonts)
    draw_feature_chip(draw, 1012, 596, 500, 92, "Site Knowledge", "History, archaeology and geology", (137, 172, 196), fonts)

    add_callout(img, 78, 630, "Track progress", PALETTE["primary"], fonts, to_x=516, to_y=646)
    add_callout(img, 638, 212, "Waypoints", PALETTE["primary_dark"], fonts, to_x=702, to_y=410)
    add_callout(img, 1118, 742, "History + geology", PALETTE["primary"], fonts, to_x=840, to_y=720)

    draw.text((72, 830), "Interactive homepage and trail screens from the live site", font=tiny, fill=(230, 236, 245))
    draw.text((1310, 830), "aegean-hiking", font=tiny, fill=(230, 236, 245))

    img.convert("RGB").save(path, "PNG")


def ad_mockup_poster(path):
    home, anafi, syros = load_sources()
    img = Image.new("RGBA", (1080, 1350), PALETTE["bg"] + (255,))
    draw = ImageDraw.Draw(img)
    fonts = get_fonts()
    title, h2, h3, body, small, tiny = fonts

    draw.rectangle((0, 0, 1080, 212), fill=PALETTE["primary_dark"])
    draw.rectangle((0, 212, 1080, 272), fill=PALETTE["primary"])

    draw.text((56, 66), "GEO-ARCHAEO HIKING", font=h2, fill=(255, 255, 255))
    draw.text((56, 136), "Interactive Aegean trail stories", font=small, fill=(230, 240, 248))

    # Main website screenshot panel
    main_shot = ImageOps.fit(home, (928, 418), method=Image.Resampling.LANCZOS)
    panel = Image.new("RGBA", (952, 442), (255, 255, 255, 255))
    pd = ImageDraw.Draw(panel)
    pd.rounded_rectangle((0, 0, 951, 441), radius=22, fill=(255, 255, 255, 255), outline=PALETTE["line"], width=2)
    panel.paste(main_shot.convert("RGBA"), (12, 12))
    img.alpha_composite(panel, (64, 304))

    # Secondary shots
    shot_anafi = ImageOps.fit(anafi, (428, 240), method=Image.Resampling.LANCZOS)
    shot_syros = ImageOps.fit(syros, (428, 240), method=Image.Resampling.LANCZOS)

    card_a = Image.new("RGBA", (452, 264), (255, 255, 255, 255))
    card_s = Image.new("RGBA", (452, 264), (255, 255, 255, 255))
    for card, label in [(card_a, "Anafi trail page"), (card_s, "Syros trail page")]:
        cd = ImageDraw.Draw(card)
        cd.rounded_rectangle((0, 0, 451, 263), radius=18, fill=(255, 255, 255, 255), outline=PALETTE["line"], width=2)
        cd.text((18, 16), label, font=tiny, fill=PALETTE["primary_dark"])

    card_a.paste(shot_anafi.convert("RGBA"), (12, 22))
    card_s.paste(shot_syros.convert("RGBA"), (12, 22))
    img.alpha_composite(card_a, (64, 772))
    img.alpha_composite(card_s, (564, 772))

    # CTA strip + feature chips
    rounded_rect(draw, (64, 1082, 1016, 1148), 16, fill=PALETTE["primary_dark"])
    draw.text((94, 1104), "TRACK PROGRESS  •  WAYPOINTS  •  HISTORY  •  ARCHAEOLOGY  •  GEOLOGY", font=tiny, fill=(255, 255, 255))

    draw_feature_chip(draw, 64, 1166, 298, 122, "Progress", "Know distance to the next stop", PALETTE["primary_dark"], fonts)
    draw_feature_chip(draw, 391, 1166, 298, 122, "Waypoints", "Route stops with context", PALETTE["primary"], fonts)
    draw_feature_chip(draw, 718, 1166, 298, 122, "Site Info", "Landscape and heritage notes", (137, 172, 196), fonts)

    draw.text((64, 1316), "Promo mockup using live screenshots from your local website", font=tiny, fill=PALETTE["muted"])

    img.convert("RGB").save(path, "PNG")


def ad_mockup_square(path):
    home, anafi, syros = load_sources()
    img = Image.new("RGBA", (1080, 1080), (246, 249, 252, 255))
    draw = ImageDraw.Draw(img)
    fonts = get_fonts()
    title, h2, h3, body, small, tiny = fonts

    rounded_rect(draw, (44, 44, 1036, 1036), 30, fill=PALETTE["bg"], outline=PALETTE["line"], width=2)
    rounded_rect(draw, (76, 78, 1004, 226), 20, fill=PALETTE["primary_dark"])
    draw.text((104, 114), "GEO-ARCHAEO HIKING", font=h2, fill=(255, 255, 255))
    draw.text((104, 172), "Website walkthrough ad", font=tiny, fill=(229, 239, 247))

    center = ImageOps.fit(home, (520, 360), method=Image.Resampling.LANCZOS)
    center_card = Image.new("RGBA", (548, 388), (255, 255, 255, 255))
    cd = ImageDraw.Draw(center_card)
    cd.rounded_rectangle((0, 0, 547, 387), radius=18, fill=(255, 255, 255, 255), outline=PALETTE["line"], width=2)
    center_card.paste(center.convert("RGBA"), (14, 14))
    img.alpha_composite(center_card, (266, 264))

    left = ImageOps.fit(anafi, (260, 208), method=Image.Resampling.LANCZOS)
    right = ImageOps.fit(syros, (260, 208), method=Image.Resampling.LANCZOS)
    for ix, shot in [(86, left), (734, right)]:
        c = Image.new("RGBA", (290, 236), (255, 255, 255, 255))
        dd = ImageDraw.Draw(c)
        dd.rounded_rectangle((0, 0, 289, 235), radius=14, fill=(255, 255, 255, 255), outline=PALETTE["line"], width=2)
        c.paste(shot.convert("RGBA"), (14, 14))
        img.alpha_composite(c, (ix, 340))

    rounded_rect(draw, (76, 694, 1004, 772), 14, fill=PALETTE["primary"])
    draw.text((102, 720), "Track progress • Waypoint navigation • History • Archaeology • Geology", font=tiny, fill=(255, 255, 255))

    draw_feature_chip(draw, 76, 804, 286, 176, "Track Progress", "Live route context", PALETTE["primary_dark"], fonts)
    draw_feature_chip(draw, 396, 804, 286, 176, "Waypoints", "Guided stop-by-stop journey", PALETTE["primary"], fonts)
    draw_feature_chip(draw, 716, 804, 286, 176, "Local Sites", "Heritage + geology insights", (137, 172, 196), fonts)

    img.convert("RGB").save(path, "PNG")


def main():
    ad_mockup_landscape(OUT_DIR / "ad_landscape_1600x900.png")
    ad_mockup_poster(OUT_DIR / "ad_poster_1080x1350.png")
    ad_mockup_square(OUT_DIR / "ad_square_1080x1080.png")
    print("Created:")
    for file in sorted(OUT_DIR.glob("*.png")):
        print(file)


if __name__ == "__main__":
    main()
