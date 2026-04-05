"""
Generate a video segment from screenshots using FFmpeg.
Creates a Ken Burns pan/zoom slideshow with text overlays and transitions.

This demonstrates what we can do PROGRAMMATICALLY for the devlog video.
"""

import subprocess
import os
import json

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCREENSHOTS_DIR = os.path.join(BASE, "docs", "making-of", "screenshots")
LAUNCH_DIR = os.path.join(BASE, "docs", "lancement", "assets", "screenshots")
OUTPUT_DIR = os.path.join(BASE, "docs", "making-of", "video")
FFMPEG = "ffmpeg"

# Our evolution screenshots in chronological order
SLIDES = [
    {
        "file": os.path.join(SCREENSHOTS_DIR, "02_monde_ouvert_gameplay.png"),
        "title": "JOUR 1-2  Le Monde Ouvert",
        "subtitle": "Village PNJs dialogues - ambition RPG",
        "day": "Jour 2/19"
    },
    {
        "file": os.path.join(SCREENSHOTS_DIR, "03_migration_32x32_gameplay.png"),
        "title": "JOUR 3  Migration 32x32",
        "subtitle": "Resolution doublee de 16x16 a 32x32",
        "day": "Jour 3/19"
    },
    {
        "file": os.path.join(SCREENSHOTS_DIR, "04_provence_gameplay.png"),
        "title": "JOUR 3  La Provence",
        "subtitle": "Gravier oliviers ciel bleu le game feel",
        "day": "Jour 3/19"
    },
    {
        "file": os.path.join(SCREENSHOTS_DIR, "05_sprites_pipoya_gameplay.png"),
        "title": "JOUR 4  Premiers Sprites",
        "subtitle": "De cercles colores a de vrais personnages",
        "day": "Jour 4/19"
    },
    {
        "file": os.path.join(SCREENSHOTS_DIR, "07_pivot_arcade_gameplay.png"),
        "title": "JOUR 5  LE PIVOT",
        "subtitle": "De RPG a Arcade  56 commits en 1 jour",
        "day": "Jour 5/19"
    },
    {
        "file": os.path.join(SCREENSHOTS_DIR, "08_refonte_visuelle_v1_gameplay.png"),
        "title": "JOUR 5-6  Refonte Visuelle",
        "subtitle": "Style unifie personnages PixelLab",
        "day": "Jour 6/19"
    },
    {
        "file": os.path.join(SCREENSHOTS_DIR, "09_polish_complet_gameplay.png"),
        "title": "JOUR 6-7  Le Polish",
        "subtitle": "Hit stop confettis iris wipe boutique",
        "day": "Jour 7/19"
    },
    {
        "file": os.path.join(SCREENSHOTS_DIR, "10_etat_actuel_gameplay.png"),
        "title": "JOUR 8-19  Le Jeu Final",
        "subtitle": "12 personnages 5 terrains 3158 tests",
        "day": "Jour 19/19"
    },
]

# Filter to existing files only
SLIDES = [s for s in SLIDES if os.path.exists(s["file"])]

def generate_ken_burns_slideshow():
    """
    Generate a Ken Burns slideshow with:
    - Slow zoom/pan on each image (4 seconds per slide)
    - Fade transitions between slides (0.5s)
    - Text overlays (title + subtitle + day counter)
    - Provencal color scheme
    """
    if not SLIDES:
        print("No slides found!")
        return

    duration_per_slide = 4  # seconds
    fps = 30
    frames_per_slide = duration_per_slide * fps
    total_frames = len(SLIDES) * frames_per_slide

    # Build the FFmpeg filter graph
    inputs = []
    filter_parts = []

    for i, slide in enumerate(SLIDES):
        inputs.extend(["-loop", "1", "-t", str(duration_per_slide), "-i", slide["file"]])

    # For each input, apply Ken Burns (zoom) + text overlay
    for i, slide in enumerate(SLIDES):
        # Alternating zoom directions for variety
        if i % 4 == 0:
            # Zoom in from center
            zoom_expr = "1+0.04*on/(30*4)"
            x_expr = "iw/2-(iw/zoom/2)"
            y_expr = "ih/2-(ih/zoom/2)"
        elif i % 4 == 1:
            # Pan left to right
            zoom_expr = "1.15"
            x_expr = "on/(30*4)*(iw-iw/zoom)"
            y_expr = "(ih-ih/zoom)/2"
        elif i % 4 == 2:
            # Zoom out from center
            zoom_expr = "1.2-0.04*on/(30*4)"
            x_expr = "iw/2-(iw/zoom/2)"
            y_expr = "ih/2-(ih/zoom/2)"
        else:
            # Pan right to left
            zoom_expr = "1.15"
            x_expr = "(1-on/(30*4))*(iw-iw/zoom)"
            y_expr = "(ih-ih/zoom)/2"

        # Scale input to 1920x1080, then apply zoompan
        filter_parts.append(
            f"[{i}:v]scale=1920:1080:flags=neighbor,setsar=1,"
            f"zoompan=z='{zoom_expr}':x='{x_expr}':y='{y_expr}'"
            f":d={frames_per_slide}:s=1920x1080:fps={fps},"
            # Day counter (top-right)
            f"drawtext=text='{slide['day']}':fontsize=28:fontcolor=0xD4A574:"
            f"x=w-tw-40:y=30:borderw=3:bordercolor=0x1A1510,"
            # Title (bottom-left, large)
            f"drawtext=text='{slide['title']}':fontsize=36:fontcolor=0xF5E6D0:"
            f"x=40:y=h-100:borderw=3:bordercolor=0x1A1510,"
            # Subtitle (below title, smaller)
            f"drawtext=text='{slide['subtitle']}':fontsize=22:fontcolor=0x9B7BB8:"
            f"x=40:y=h-55:borderw=2:bordercolor=0x1A1510,"
            # Fade in/out
            f"fade=t=in:st=0:d=0.5,fade=t=out:st={duration_per_slide-0.5}:d=0.5"
            f"[v{i}]"
        )

    # Concatenate all slides
    concat_inputs = "".join(f"[v{i}]" for i in range(len(SLIDES)))
    filter_parts.append(f"{concat_inputs}concat=n={len(SLIDES)}:v=1:a=0[outv]")

    filter_complex = ";".join(filter_parts)

    output_path = os.path.join(OUTPUT_DIR, "evolution_slideshow.mp4")
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    cmd = [
        FFMPEG, "-y",
        *inputs,
        "-filter_complex", filter_complex,
        "-map", "[outv]",
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "20",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        output_path
    ]

    print(f"Generating slideshow with {len(SLIDES)} slides...")
    print(f"Total duration: {len(SLIDES) * duration_per_slide}s")
    print(f"Output: {output_path}")
    print()

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0:
        size = os.path.getsize(output_path)
        print(f"Success! {output_path}")
        print(f"File size: {size / 1024 / 1024:.1f} MB")
    else:
        print(f"FFmpeg error:\n{result.stderr[-2000:]}")

def generate_counter_animation():
    """
    Generate an animated counter video: 0 → 456 commits
    Pure FFmpeg with drawtext and frame counter expression.
    """
    output_path = os.path.join(OUTPUT_DIR, "counter_commits.mp4")
    duration = 5  # 5 seconds to count to 456
    fps = 30

    # The counter goes from 0 to 456 over 5 seconds
    # frame_number goes 0 to 150 (5*30)
    # value = floor(456 * frame_number / 150)
    counter_expr = "floor(456*n/150)"

    cmd = [
        FFMPEG, "-y",
        "-f", "lavfi",
        "-i", f"color=c=0x2A1F1A:s=800x400:d={duration}:r={fps}",
        "-vf",
        # Big counter number
        f"drawtext=text='%{{eif\\:{counter_expr}\\:d}}':fontsize=120:fontcolor=0xD4A574:"
        f"x=(w-tw)/2:y=(h-th)/2-30:borderw=4:bordercolor=0x1A1510,"
        # Label
        f"drawtext=text='COMMITS':fontsize=36:fontcolor=0x9B7BB8:"
        f"x=(w-tw)/2:y=(h-th)/2+70:borderw=2:bordercolor=0x1A1510,"
        # Subtitle
        f"drawtext=text='19 jours de developpement':fontsize=20:fontcolor=0x6B8E4E:"
        f"x=(w-tw)/2:y=h-50:borderw=1:bordercolor=0x1A1510",
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "22",
        "-pix_fmt", "yuv420p",
        output_path
    ]

    print("Generating commit counter animation...")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0:
        print(f"Success! {output_path}")
    else:
        print(f"FFmpeg error:\n{result.stderr[-1000:]}")

def generate_tests_counter():
    """
    Generate counter: 0 → 3158 tests
    """
    output_path = os.path.join(OUTPUT_DIR, "counter_tests.mp4")
    duration = 5
    fps = 30
    counter_expr = "floor(3158*n/150)"

    cmd = [
        FFMPEG, "-y",
        "-f", "lavfi",
        "-i", f"color=c=0x2A1F1A:s=800x400:d={duration}:r={fps}",
        "-vf",
        f"drawtext=text='%{{eif\\:{counter_expr}\\:d}}':fontsize=120:fontcolor=0x6B8E4E:"
        f"x=(w-tw)/2:y=(h-th)/2-30:borderw=4:bordercolor=0x1A1510,"
        f"drawtext=text='TESTS PASSED':fontsize=36:fontcolor=0xD4A574:"
        f"x=(w-tw)/2:y=(h-th)/2+70:borderw=2:bordercolor=0x1A1510,"
        f"drawtext=text='Vitest — zero echec':fontsize=20:fontcolor=0x87CEEB:"
        f"x=(w-tw)/2:y=h-50:borderw=1:bordercolor=0x1A1510",
        "-c:v", "libx264", "-preset", "fast", "-crf", "22", "-pix_fmt", "yuv420p",
        output_path
    ]

    print("Generating tests counter animation...")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0:
        print(f"Success! {output_path}")
    else:
        print(f"FFmpeg error:\n{result.stderr[-1000:]}")


if __name__ == "__main__":
    print("=" * 60)
    print("PETANQUE MASTER — Video Segment Generator")
    print("=" * 60)
    print()

    generate_ken_burns_slideshow()
    print()
    generate_counter_animation()
    print()
    generate_tests_counter()
    print()
    print("All segments generated in docs/making-of/video/")
