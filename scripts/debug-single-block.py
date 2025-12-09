#!/usr/bin/env python3
"""Debug script to check a single block's coordinates."""

import json
import sys
from PIL import Image, ImageDraw, ImageFont

def debug_block(image_path, json_path, block_index):
    """Draw a single block with debug info."""
    # Load image
    img = Image.open(image_path)
    draw = ImageDraw.Draw(img)

    # Load JSON
    with open(json_path, 'r') as f:
        data = json.load(f)

    block = data['blocks'][block_index]

    # Get dimensions
    reported_width = data['imageWidth']
    reported_height = data['imageHeight']
    actual_width = img.width
    actual_height = img.height

    scale_x = actual_width / reported_width
    scale_y = actual_height / reported_height

    print(f"Image: {reported_width}x{reported_height} -> {actual_width}x{actual_height}")
    print(f"Scale: x={scale_x:.4f}, y={scale_y:.4f}\n")

    # Original coordinates from Gemini
    orig_bbox = block['boundingBox']
    orig_x = orig_bbox['x']
    orig_y = orig_bbox['y']
    orig_w = orig_bbox['width']
    orig_h = orig_bbox['height']

    # Scaled coordinates (what we paint)
    scaled_x = int(orig_x * scale_x)
    scaled_y = int(orig_y * scale_y)
    scaled_w = int(orig_w * scale_x)
    scaled_h = int(orig_h * scale_y)

    print(f"Block {block_index} ({block['id']}):")
    print(f"  Type: {block['type']}")
    print(f"  Reading Order: {block['readingOrder']}")
    print(f"  Text: {block['text'][:100]}...")
    print(f"\nOriginal (Gemini's coords on {reported_width}x{reported_height} image):")
    print(f"  x={orig_x}, y={orig_y}, w={orig_w}, h={orig_h}")
    print(f"  Bottom-right: ({orig_x + orig_w}, {orig_y + orig_h})")
    print(f"\nScaled (what we paint on {actual_width}x{actual_height} image):")
    print(f"  x={scaled_x}, y={scaled_y}, w={scaled_w}, h={scaled_h}")
    print(f"  Bottom-right: ({scaled_x + scaled_w}, {scaled_y + scaled_h})")

    # Draw the scaled box in RED
    draw.rectangle(
        [scaled_x, scaled_y, scaled_x + scaled_w, scaled_y + scaled_h],
        outline=(255, 0, 0),
        width=5
    )

    # Draw corner markers
    marker_size = 20
    for corner_x in [scaled_x, scaled_x + scaled_w]:
        for corner_y in [scaled_y, scaled_y + scaled_h]:
            draw.ellipse(
                [corner_x - marker_size, corner_y - marker_size,
                 corner_x + marker_size, corner_y + marker_size],
                fill=(255, 0, 0)
            )

    # Save
    output_path = image_path.replace('.png', f'-debug-block{block_index}.png')
    img.save(output_path)
    print(f"\n✅ Saved to: {output_path}")

if __name__ == '__main__':
    if len(sys.argv) < 4:
        print("Usage: python debug-single-block.py <image> <json> <block-index>")
        sys.exit(1)

    debug_block(sys.argv[1], sys.argv[2], int(sys.argv[3]))
