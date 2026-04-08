# MoviePy — Python Video Editing and Compositing

> Programmatic video editing with Python. Cut, concat, composite, add text, effects, and render videos using FFmpeg under the hood.

## Overview

- **Repo**: github.com/Zulko/moviepy (12K+ stars)
- **Language**: Python
- **License**: MIT
- **Install**: `pip install moviepy`
- **Docs**: zulko.github.io/moviepy

## Setup

```bash
pip install moviepy

# FFmpeg is required
brew install ffmpeg
```

## Core Concepts

### Loading and Writing

```python
from moviepy import VideoFileClip, AudioFileClip, TextClip, CompositeVideoClip, concatenate_videoclips

# Load video
clip = VideoFileClip("input.mp4")

# Write video
clip.write_videofile("output.mp4", fps=30)

# Write GIF
clip.write_gif("output.gif", fps=15)
```

### Basic Editing

```python
# Trim (subclip)
clip = VideoFileClip("input.mp4").subclipped(5, 15)  # seconds 5 to 15

# Resize
clip = clip.resized(width=1280)  # maintain aspect ratio
clip = clip.resized((1920, 1080))  # exact size

# Speed
fast = clip.with_speed_scaled(2)    # 2x speed
slow = clip.with_speed_scaled(0.5)  # half speed

# Crop
clip = clip.cropped(x1=100, y1=50, x2=500, y2=350)

# Rotate
clip = clip.rotated(90)  # degrees

# Mirror
clip = clip.with_effects([vfx.MirrorX()])  # horizontal flip
```

### Concatenation

```python
from moviepy import concatenate_videoclips

# Join clips sequentially
final = concatenate_videoclips([clip1, clip2, clip3])

# With transitions (crossfade)
final = concatenate_videoclips([clip1, clip2, clip3], method="compose", padding=-1)
```

### Compositing (Overlays)

```python
from moviepy import CompositeVideoClip

# Layer clips on top of each other
final = CompositeVideoClip([
    background,                                    # Bottom layer
    overlay.with_position(("center", "center")),  # Centered overlay
    logo.with_position((20, 20)),                  # Top-left logo
])
```

### Text

```python
from moviepy import TextClip

text = TextClip(
    text="Hello World",
    font_size=70,
    color="white",
    font="Arial-Bold",
    stroke_color="black",
    stroke_width=2,
).with_duration(5).with_position("center")

# Composite text onto video
final = CompositeVideoClip([video_clip, text])
```

### Audio

```python
from moviepy import AudioFileClip

# Add audio to video
audio = AudioFileClip("music.mp3")
video = video.with_audio(audio)

# Adjust volume
audio = audio.with_volume_scaled(0.5)  # 50% volume

# Concatenate audio
from moviepy import concatenate_audioclips
combined_audio = concatenate_audioclips([audio1, audio2])
```

## Custom Frame-by-Frame Animation

```python
from moviepy import VideoClip
import numpy as np

def make_frame(t):
    """Return a numpy array (H, W, 3) for each frame at time t."""
    frame = np.zeros((1080, 1920, 3), dtype=np.uint8)

    # Draw something based on time
    x = int(t * 200) % 1920  # Moving element
    frame[500:550, x:x+50] = [255, 100, 50]  # Orange rectangle

    return frame

clip = VideoClip(make_frame, duration=10)
clip.write_videofile("animation.mp4", fps=30)
```

### With Matplotlib (Animated Charts)

```python
import matplotlib.pyplot as plt
import numpy as np
from moviepy import VideoClip

def make_chart_frame(t):
    fig, ax = plt.subplots(figsize=(19.2, 10.8), dpi=100)

    data = np.random.seed(42)
    values = [v * min(t / 2, 1) for v in [30, 50, 20, 80, 45]]
    ax.bar(["A", "B", "C", "D", "E"], values, color="#4a90d9")
    ax.set_ylim(0, 100)
    ax.set_title(f"Data at t={t:.1f}s", fontsize=24)

    fig.canvas.draw()
    frame = np.frombuffer(fig.canvas.tostring_rgb(), dtype=np.uint8)
    frame = frame.reshape(fig.canvas.get_width_height()[::-1] + (3,))
    plt.close()
    return frame

clip = VideoClip(make_chart_frame, duration=5)
clip.write_videofile("chart_animation.mp4", fps=30)
```

## Effects

```python
from moviepy import vfx

# Fade in/out
clip = clip.with_effects([vfx.FadeIn(1), vfx.FadeOut(1)])

# Cross fade between clips
clip1 = clip1.with_effects([vfx.CrossFadeOut(1)])
clip2 = clip2.with_effects([vfx.CrossFadeIn(1)])

# Color adjustment
clip = clip.with_effects([vfx.ColorX(factor=1.5)])  # Brighten
clip = clip.with_effects([vfx.BlackAndWhite()])

# Freeze frame
clip = clip.with_effects([vfx.Freeze(t=3, freeze_duration=2)])
```

## Best Practices

1. **Close clips** after use: `clip.close()` or use context managers
2. **Use .subclipped()** not deprecated `.subclip()`
3. **Set fps explicitly** in write_videofile
4. **Preview first**: `clip.preview()` or render a short section
5. **Temporary audio codec**: Use `audio_codec="aac"` for MP4
6. **Memory**: For long videos, process in chunks
7. **Numpy for custom frames**: Return `(H, W, 3)` uint8 arrays

## When to Use MoviePy

- Editing/trimming existing video files
- Adding text overlays and watermarks
- Concatenating multiple clips with transitions
- Creating animated data visualizations (with matplotlib)
- Batch video processing
- Adding audio tracks to video
- Creating GIFs from video

## Source

- Repo: github.com/Zulko/moviepy
- Docs: zulko.github.io/moviepy
