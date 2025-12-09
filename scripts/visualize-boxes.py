#!/usr/bin/env python3
"""
Visualize bounding boxes from OCR layout detection results.
Supports both Gemini and Document AI output formats.
Uses different colors for overlapping boxes.
"""

import json
import sys
from pathlib import Path
from PIL import Image, ImageDraw

def boxes_overlap(box1, box2):
    """Check if two bounding boxes overlap."""
    x1, y1, w1, h1 = box1['x'], box1['y'], box1['width'], box1['height']
    x2, y2, w2, h2 = box2['x'], box2['y'], box2['width'], box2['height']

    # Check if one box is completely to the left/right/above/below the other
    if x1 + w1 < x2 or x2 + w2 < x1:
        return False
    if y1 + h1 < y2 or y2 + h2 < y1:
        return False

    return True

def count_overlaps(blocks):
    """Count how many other boxes each box overlaps with."""
    overlap_counts = []

    for i, block in enumerate(blocks):
        count = 0
        for j, other in enumerate(blocks):
            if i != j and boxes_overlap(block['boundingBox'], other['boundingBox']):
                count += 1
        overlap_counts.append(count)

    return overlap_counts

def get_color_for_overlap(overlap_count):
    """Get a color based on overlap count."""
    colors = [
        (0, 255, 0),      # Green - no overlap
        (255, 165, 0),    # Orange - 1-2 overlaps
        (255, 0, 0),      # Red - 3-4 overlaps
        (255, 0, 255),    # Magenta - 5+ overlaps
    ]

    if overlap_count == 0:
        return colors[0]
    elif overlap_count <= 2:
        return colors[1]
    elif overlap_count <= 4:
        return colors[2]
    else:
        return colors[3]

def detect_format(data):
    """Detect if JSON is from Gemini or Document AI."""
    if 'processor' in data and 'Document AI' in data.get('processor', ''):
        return 'documentai'
    elif 'layoutStructure' in data or ('blocks' in data and 'imageWidth' in data):
        return 'gemini'
    else:
        return 'unknown'

def extract_blocks_from_documentai(data):
    """Extract blocks from Document AI format."""
    if 'pages' not in data or len(data['pages']) == 0:
        return []

    page = data['pages'][0]
    return page.get('blocks', [])

def visualize_boxes(image_path, json_path, output_path):
    """Draw bounding boxes on the image."""
    # Load image
    img = Image.open(image_path)
    draw = ImageDraw.Draw(img)

    # Load JSON
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Detect format and extract blocks
    data_format = detect_format(data)
    print(f"📋 Detected format: {data_format}")

    if data_format == 'documentai':
        blocks = extract_blocks_from_documentai(data)
        # Document AI already provides actual pixel coordinates
        reported_width = data.get('imageWidth', img.width)
        reported_height = data.get('imageHeight', img.height)
    elif data_format == 'gemini':
        blocks = data['blocks']
        reported_width = data.get('imageWidth', img.width)
        reported_height = data.get('imageHeight', img.height)
    else:
        print(f"❌ Unknown data format!")
        return

    # Check if we need to scale coordinates
    actual_width = img.width
    actual_height = img.height

    scale_x = actual_width / reported_width
    scale_y = actual_height / reported_height

    print(f"📐 Image dimensions:")
    print(f"   Gemini reported: {reported_width}x{reported_height}")
    print(f"   Actual image:    {actual_width}x{actual_height}")
    print(f"   Scale factors:   x={scale_x:.2f}, y={scale_y:.2f}")

    if scale_x != 1.0 or scale_y != 1.0:
        print(f"   ⚠️  Coordinates will be scaled!")

    overlap_counts = count_overlaps(blocks)

    print(f"\n📊 Found {len(blocks)} blocks")
    print(f"   No overlap: {sum(1 for c in overlap_counts if c == 0)}")
    print(f"   1-2 overlaps: {sum(1 for c in overlap_counts if 1 <= c <= 2)}")
    print(f"   3-4 overlaps: {sum(1 for c in overlap_counts if 3 <= c <= 4)}")
    print(f"   5+ overlaps: {sum(1 for c in overlap_counts if c >= 5)}")

    # Draw boxes
    for block, overlap_count in zip(blocks, overlap_counts):
        bbox = block['boundingBox']
        # Scale coordinates to actual image size
        x = int(bbox['x'] * scale_x)
        y = int(bbox['y'] * scale_y)
        w = int(bbox['width'] * scale_x)
        h = int(bbox['height'] * scale_y)

        color = get_color_for_overlap(overlap_count)

        # Draw rectangle with thicker lines (scale line width too)
        line_width = max(2, int(3 * scale_x))
        draw.rectangle(
            [x, y, x + w, y + h],
            outline=color,
            width=line_width
        )

    # Save
    img.save(output_path)
    print(f"\n✅ Saved visualization to: {output_path}")
    print(f"\n🎨 Color Legend:")
    print(f"   🟢 Green   = No overlaps")
    print(f"   🟠 Orange  = 1-2 overlaps")
    print(f"   🔴 Red     = 3-4 overlaps")
    print(f"   🟣 Magenta = 5+ overlaps")

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python visualize-boxes.py <image-path> <json-path> [output-path]")
        sys.exit(1)

    image_path = sys.argv[1]
    json_path = sys.argv[2]
    output_path = sys.argv[3] if len(sys.argv) > 3 else image_path.replace('.png', '-annotated.png')

    visualize_boxes(image_path, json_path, output_path)
