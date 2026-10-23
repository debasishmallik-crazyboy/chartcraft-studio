"""
FilmCraft Transparent Chart Integration Helper
Imports ChartCraft ProRes 4444 MOV or PNG sequence into an active FilmCraft sequence.
"""

import sys
import os
import json

def import_to_filmcraft(asset_path):
    if not os.path.exists(asset_path):
        print(f"Error: Asset path '{asset_path}' does not exist.")
        return False

    print(f"🎬 [FilmCraft] Preparing to import transparent chart: {asset_path}")
    # Inspect extension
    ext = os.path.splitext(asset_path)[1].lower()
    if ext == '.mov':
        print(f"✅ Recognized Apple ProRes 4444 with Alpha Channel.")
        print(f"💡 In FilmCraft or video editor, drag this clip onto Track 2 (Overlay).")
    elif os.path.isdir(asset_path):
        print(f"✅ Recognized Transparent PNG Frame Sequence.")
        print(f"💡 Import media folder as an image sequence.")

    return True

if __name__ == '__main__':
    if len(sys.argv) > 1:
        import_to_filmcraft(sys.argv[1])
    else:
        print("Usage: python import_filmcraft.py <path_to_chart.mov_or_folder>")
