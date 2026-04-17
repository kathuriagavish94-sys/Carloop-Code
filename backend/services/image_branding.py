"""
TruVant Image Branding Service
Automatically adds branding to uploaded car images:
- Premium gradient background
- Circular TruVant logo watermark (bottom right)
- "TruVant Verified" badge (top left)
"""

import io
import os
import base64
import httpx
import asyncio
import re
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
from typing import Optional, Tuple
import logging

logger = logging.getLogger(__name__)

# TruVant Brand Colors
BRAND_PRIMARY = (15, 23, 42)  # #0F172A - Dark navy
BRAND_ACCENT = (37, 99, 235)  # #2563EB - Blue
BRAND_ORANGE = (249, 115, 22)  # #F97316 - Orange accent
BACKGROUND_LIGHT = (248, 250, 252)  # #F8FAFC - Light gray
BACKGROUND_WHITE = (255, 255, 255)

# Logo URL
TRUVANT_LOGO_URL = "https://customer-assets.emergentagent.com/job_carloop-dealer/artifacts/1p0vv1ry_Gemini_Generated_Image_sp7phhsp7phhsp7p.png"

# Feature flag for branding
BRANDING_ENABLED = True


def convert_google_drive_to_direct_url(url: str) -> str:
    """Convert any Google Drive URL to a direct download URL"""
    if not url or 'drive.google.com' not in url:
        return url
    
    # Extract file ID from various patterns
    file_id = None
    
    # Pattern 1: /file/d/FILE_ID/view or /file/d/FILE_ID/preview
    match = re.search(r'/file/d/([a-zA-Z0-9_-]+)', url)
    if match:
        file_id = match.group(1)
    
    # Pattern 2: /open?id=FILE_ID
    if not file_id:
        match = re.search(r'[?&]id=([a-zA-Z0-9_-]+)', url)
        if match:
            file_id = match.group(1)
    
    # Pattern 3: /uc?export=view&id=FILE_ID (already converted)
    if not file_id and 'uc?export=view' in url:
        return url
    
    if file_id:
        # Use Google's direct image serving URL format
        return f"https://drive.google.com/uc?export=view&id={file_id}"
    
    return url


async def download_image(url: str) -> Optional[Image.Image]:
    """Download an image from URL and return PIL Image"""
    try:
        # Convert Google Drive URLs to direct download URLs
        download_url = convert_google_drive_to_direct_url(url)
        
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            # Use headers that mimic a browser request
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
            }
            response = await client.get(download_url, headers=headers)
            response.raise_for_status()
            
            # Check if we got an actual image (not HTML)
            content_type = response.headers.get('content-type', '')
            if 'text/html' in content_type:
                logger.warning(f"URL returned HTML instead of image: {url}")
                return None
            
            # Try to open as image
            image_data = io.BytesIO(response.content)
            try:
                img = Image.open(image_data)
                # Verify it's a valid image by loading it
                img.load()
                return img
            except Exception as img_error:
                logger.error(f"Failed to parse image data from {url}: {img_error}")
                return None
                
    except httpx.TimeoutException:
        logger.error(f"Timeout downloading image from {url}")
        return None
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error downloading image from {url}: {e.response.status_code}")
        return None
    except Exception as e:
        logger.error(f"Error downloading image from {url}: {e}")
        return None


def create_gradient_background(width: int, height: int) -> Image.Image:
    """Create a premium gradient background"""
    # Create a subtle gradient from light gray to white
    background = Image.new('RGB', (width, height), BACKGROUND_WHITE)
    draw = ImageDraw.Draw(background)
    
    # Create subtle gradient effect
    for y in range(height):
        # Subtle gradient from top (lighter) to bottom (slightly darker)
        ratio = y / height
        r = int(255 - (ratio * 8))  # Very subtle change
        g = int(255 - (ratio * 6))
        b = int(255 - (ratio * 4))
        draw.line([(0, y), (width, y)], fill=(r, g, b))
    
    return background


def create_circular_logo(logo: Image.Image, size: int) -> Image.Image:
    """Create a circular version of the logo with white background"""
    # Create circular mask
    mask = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size, size), fill=255)
    
    # Create white circle background
    circle_bg = Image.new('RGBA', (size, size), (255, 255, 255, 255))
    
    # Resize logo to fit within circle
    logo_size = int(size * 0.85)
    logo_resized = logo.convert('RGBA').resize((logo_size, logo_size), Image.Resampling.LANCZOS)
    
    # Center logo on white background
    offset = (size - logo_size) // 2
    circle_bg.paste(logo_resized, (offset, offset), logo_resized if logo_resized.mode == 'RGBA' else None)
    
    # Apply circular mask
    output = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    output.paste(circle_bg, (0, 0), mask)
    
    return output


def create_verified_badge(width: int = 140, height: int = 32) -> Image.Image:
    """Create 'TruVant Verified' badge"""
    badge = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(badge)
    
    # Draw rounded rectangle background
    draw.rounded_rectangle(
        [(0, 0), (width - 1, height - 1)],
        radius=16,
        fill=(*BRAND_PRIMARY, 230)  # Semi-transparent dark navy
    )
    
    # Add checkmark and text
    try:
        # Try to use a font, fall back to default if not available
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 12)
    except Exception:
        font = ImageFont.load_default()
    
    # Draw checkmark circle
    check_size = 18
    check_x = 8
    check_y = (height - check_size) // 2
    draw.ellipse(
        [(check_x, check_y), (check_x + check_size, check_y + check_size)],
        fill=(*BRAND_ACCENT, 255)
    )
    
    # Draw checkmark
    draw.text((check_x + 4, check_y + 2), "✓", fill=(255, 255, 255, 255), font=font)
    
    # Draw "TruVant Verified" text
    text = "TruVant Verified"
    draw.text((check_x + check_size + 6, (height - 12) // 2), text, fill=(255, 255, 255, 255), font=font)
    
    return badge


def add_shadow(image: Image.Image, shadow_offset: int = 10, shadow_blur: int = 20) -> Image.Image:
    """Add a soft drop shadow to an image"""
    # Create a larger canvas for shadow
    shadow_padding = shadow_blur * 2
    new_width = image.width + shadow_padding * 2
    new_height = image.height + shadow_padding * 2
    
    # Create shadow
    shadow = Image.new('RGBA', (new_width, new_height), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    
    # Draw shadow rectangle
    shadow_draw.rounded_rectangle(
        [
            (shadow_padding + shadow_offset, shadow_padding + shadow_offset),
            (shadow_padding + image.width + shadow_offset, shadow_padding + image.height + shadow_offset)
        ],
        radius=12,
        fill=(0, 0, 0, 60)  # Semi-transparent black
    )
    
    # Blur the shadow
    shadow = shadow.filter(ImageFilter.GaussianBlur(shadow_blur))
    
    return shadow, shadow_padding


async def process_branded_image(
    image_url: str,
    add_background: bool = True,
    add_logo: bool = True,
    add_badge: bool = True,
    logo_opacity: float = 0.15,
    output_quality: int = 90
) -> Optional[Tuple[str, bytes]]:
    """
    Process an image and add TruVant branding
    
    Args:
        image_url: URL of the original image
        add_background: Whether to add gradient background
        add_logo: Whether to add logo watermark
        add_badge: Whether to add "TruVant Verified" badge
        logo_opacity: Opacity of the logo watermark (0-1)
        output_quality: JPEG quality (1-100)
    
    Returns:
        Tuple of (content_type, image_bytes) or None on failure
    """
    try:
        # Download original image
        original = await download_image(image_url)
        if not original:
            logger.error(f"Failed to download original image: {image_url}")
            return None
        
        # Convert to RGBA for processing
        original = original.convert('RGBA')
        
        # Target dimensions (maintain aspect ratio)
        max_width = 1200
        max_height = 900
        
        # Calculate new size maintaining aspect ratio
        ratio = min(max_width / original.width, max_height / original.height)
        if ratio < 1:
            new_size = (int(original.width * ratio), int(original.height * ratio))
            original = original.resize(new_size, Image.Resampling.LANCZOS)
        
        # Add padding for the branded frame
        padding = 40
        car_width = original.width
        car_height = original.height
        
        # Calculate final canvas size
        canvas_width = car_width + padding * 2
        canvas_height = car_height + padding * 2 + 20  # Extra space at bottom for branding
        
        if add_background:
            # Create gradient background
            background = create_gradient_background(canvas_width, canvas_height)
            canvas = background.convert('RGBA')
            
            # Add shadow effect
            shadow, shadow_pad = add_shadow(original, shadow_offset=8, shadow_blur=15)
            
            # Paste shadow (centered, slightly offset)
            shadow_x = padding - shadow_pad
            shadow_y = padding - shadow_pad
            canvas.paste(shadow, (shadow_x, shadow_y), shadow)
        else:
            canvas = Image.new('RGBA', (canvas_width, canvas_height), BACKGROUND_WHITE)
        
        # Paste the car image
        car_x = padding
        car_y = padding
        canvas.paste(original, (car_x, car_y), original if original.mode == 'RGBA' else None)
        
        # Add "TruVant Verified" badge (top left)
        if add_badge:
            badge = create_verified_badge()
            badge_x = padding + 15
            badge_y = padding + 15
            canvas.paste(badge, (badge_x, badge_y), badge)
        
        # Add logo watermark (bottom right)
        if add_logo:
            logo_image = await download_image(TRUVANT_LOGO_URL)
            if logo_image:
                # Create circular logo
                logo_size = min(80, int(car_width * 0.12))
                circular_logo = create_circular_logo(logo_image, logo_size)
                
                # Apply opacity
                if logo_opacity < 1:
                    alpha = circular_logo.split()[3]
                    alpha = alpha.point(lambda x: int(x * logo_opacity))
                    circular_logo.putalpha(alpha)
                
                # Position logo at bottom right
                logo_x = canvas_width - logo_size - padding - 10
                logo_y = canvas_height - logo_size - 15
                canvas.paste(circular_logo, (logo_x, logo_y), circular_logo)
        
        # Convert to RGB for JPEG output
        final_image = Image.new('RGB', canvas.size, BACKGROUND_WHITE)
        final_image.paste(canvas, (0, 0), canvas if canvas.mode == 'RGBA' else None)
        
        # Save to bytes
        output = io.BytesIO()
        final_image.save(output, format='JPEG', quality=output_quality, optimize=True)
        output.seek(0)
        
        return ('image/jpeg', output.getvalue())
        
    except Exception as e:
        logger.error(f"Error processing branded image: {e}")
        import traceback
        traceback.print_exc()
        return None


def image_to_data_uri(image_bytes: bytes, content_type: str = 'image/jpeg') -> str:
    """Convert image bytes to data URI"""
    b64 = base64.b64encode(image_bytes).decode('utf-8')
    return f"data:{content_type};base64,{b64}"


async def process_and_upload_branded_image(image_url: str) -> Optional[str]:
    """
    Process image and return data URI of branded version
    For production, this would upload to cloud storage and return URL
    """
    result = await process_branded_image(
        image_url,
        add_background=True,
        add_logo=True,
        add_badge=True,
        logo_opacity=0.20,  # 20% opacity for watermark
        output_quality=85
    )
    
    if result:
        content_type, image_bytes = result
        return image_to_data_uri(image_bytes, content_type)
    
    return None
