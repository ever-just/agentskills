# Manim — Mathematical Animation Engine (Python)

> The engine behind 3Blue1Brown videos. Creates precise programmatic animations for math, science, algorithms, and data storytelling.

## Overview

- **Repo**: github.com/ManimCommunity/manim (community fork, actively maintained)
- **Original**: github.com/3b1b/manim (72K+ stars, by Grant Sanderson)
- **Language**: Python
- **License**: MIT
- **Install**: `pip install manim`
- **Docs**: docs.manim.community

## Setup

```bash
# Install manim (community edition)
pip install manim

# System dependency
brew install ffmpeg

# Optional for LaTeX support
brew install --cask mactex-no-gui

# Verify installation
manim --version
```

## Core Concepts

### Scene Structure

Every animation is a `Scene` class with a `construct` method:

```python
from manim import *

class MyScene(Scene):
    def construct(self):
        circle = Circle(radius=1, color=BLUE)
        self.play(Create(circle))
        self.wait(1)
        self.play(FadeOut(circle))
```

### Basic Objects (Mobjects)

```python
# Shapes
circle = Circle(radius=1, color=BLUE, fill_opacity=0.5)
square = Square(side_length=2, color=RED)
rect = Rectangle(width=4, height=2, color=GREEN)
line = Line(LEFT * 2, RIGHT * 2, color=WHITE)
arrow = Arrow(LEFT, RIGHT, color=YELLOW)
dot = Dot(point=ORIGIN, color=WHITE)

# Text
text = Text("Hello World", font_size=48, color=WHITE)
math = MathTex(r"\int_0^1 x^2 dx = \frac{1}{3}")
code = Code("example.py", language="python", font_size=24)

# Groups
group = VGroup(circle, square).arrange(RIGHT, buff=1)
```

### Animations

```python
# Creation
self.play(Create(circle))          # Draw shape
self.play(Write(text))             # Write text
self.play(FadeIn(square))          # Fade in
self.play(GrowFromCenter(circle))  # Grow from center

# Transformation
self.play(Transform(circle, square))  # Morph shape
self.play(ReplacementTransform(a, b)) # Replace with new
self.play(circle.animate.shift(RIGHT * 2))  # Move right
self.play(circle.animate.scale(2))    # Scale up
self.play(circle.animate.set_color(RED))  # Change color

# Removal
self.play(FadeOut(circle))
self.play(Uncreate(circle))

# Multiple simultaneous
self.play(
    circle.animate.shift(RIGHT),
    square.animate.shift(LEFT),
    run_time=2
)

# Sequential with wait
self.play(Create(circle))
self.wait(0.5)
self.play(circle.animate.shift(UP))
```

### Positioning

```python
# Constants: UP, DOWN, LEFT, RIGHT, ORIGIN, UL, UR, DL, DR
circle.move_to(ORIGIN)
circle.shift(RIGHT * 2 + UP * 1)
circle.next_to(square, RIGHT, buff=0.5)
circle.align_to(square, UP)

# Arrange groups
VGroup(a, b, c).arrange(RIGHT, buff=0.5)
VGroup(a, b, c).arrange_in_grid(rows=2)
```

### Graphs and Charts

```python
# Number line
number_line = NumberLine(x_range=[-5, 5, 1], length=10)

# Axes
axes = Axes(
    x_range=[0, 10, 1],
    y_range=[0, 10, 1],
    x_length=8,
    y_length=6,
)

# Plot function
graph = axes.plot(lambda x: x**2, color=BLUE)
label = axes.get_graph_label(graph, label="x^2")

# Bar chart
chart = BarChart(
    values=[3, 5, 2, 8, 4],
    bar_names=["A", "B", "C", "D", "E"],
    bar_colors=[BLUE, GREEN, RED, YELLOW, PURPLE],
)
```

### Camera Movement

```python
class MyCameraScene(MovingCameraScene):
    def construct(self):
        self.play(self.camera.frame.animate.scale(0.5))  # Zoom in
        self.play(self.camera.frame.animate.move_to(RIGHT * 3))  # Pan
```

## Commands

```bash
# Render scene (low quality preview)
manim -ql scene.py MyScene

# Render medium quality
manim -qm scene.py MyScene

# Render high quality (1080p)
manim -qh scene.py MyScene

# Render 4K
manim -qk scene.py MyScene

# Preview (opens viewer)
manim -p -ql scene.py MyScene

# Save as GIF
manim -ql --format=gif scene.py MyScene

# List scenes in file
manim scene.py --list
```

## Best Practices

1. **Start with low quality (`-ql`)** for fast iteration
2. **Use VGroup** to organize related objects
3. **Use `.animate` syntax** for clean transformations: `obj.animate.shift(RIGHT)`
4. **Add `self.wait()`** between animations for pacing
5. **Use `run_time`** parameter to control animation speed
6. **LaTeX for math**: `MathTex(r"\frac{a}{b}")` for beautiful equations
7. **Color constants**: `BLUE`, `RED`, `GREEN`, `YELLOW`, `WHITE`, `GREY`
8. **Rate functions**: `rate_func=smooth`, `rate_func=there_and_back`

## When to Use Manim

- Mathematical proofs and concepts
- Algorithm visualization (sorting, pathfinding, etc.)
- Data storytelling with animated charts
- Physics simulations
- Educational content (any STEM topic)
- Conference talks with mathematical content

## Agent Skill Source

- Community agent skill: github.com/adithya-s-k/manim_skill
- NLU video generator: github.com/rohitg00/manim-video-generator
- Math-to-Manim AI pipeline: github.com/HarleyCoops/Math-To-Manim
