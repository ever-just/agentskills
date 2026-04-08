# D3.js — Data-Driven Visualization with Animations

> The foundational library for creating dynamic, interactive data visualizations. SVG, Canvas, and HTML rendering with powerful transitions.

## Overview

- **Repo**: github.com/d3/d3 (109K+ stars)
- **Language**: JavaScript / TypeScript
- **License**: ISC
- **Install**: `npm install d3` or `npm install d3-selection d3-scale d3-transition`
- **Docs**: d3js.org

## Core Concepts

### Selection and Data Binding

```js
import * as d3 from "d3";

// Select and modify elements
d3.select("body").append("svg").attr("width", 800).attr("height", 600);

// Data binding
const data = [30, 80, 45, 60, 20, 90, 55];

d3.select("svg")
  .selectAll("rect")
  .data(data)
  .join("rect")
  .attr("x", (d, i) => i * 50)
  .attr("y", (d) => 200 - d)
  .attr("width", 40)
  .attr("height", (d) => d)
  .attr("fill", "steelblue");
```

### Scales

```js
// Linear scale (numbers)
const xScale = d3.scaleLinear()
  .domain([0, 100])    // data range
  .range([0, 800]);     // pixel range

// Band scale (categories)
const xBand = d3.scaleBand()
  .domain(["A", "B", "C", "D"])
  .range([0, 400])
  .padding(0.2);

// Color scale
const color = d3.scaleOrdinal(d3.schemeCategory10);

// Time scale
const timeScale = d3.scaleTime()
  .domain([new Date("2024-01-01"), new Date("2024-12-31")])
  .range([0, 800]);
```

### Axes

```js
const xAxis = d3.axisBottom(xScale);
const yAxis = d3.axisLeft(yScale);

svg.append("g")
  .attr("transform", `translate(0, ${height - margin.bottom})`)
  .call(xAxis);

svg.append("g")
  .attr("transform", `translate(${margin.left}, 0)`)
  .call(yAxis);
```

## Animated Transitions

### Basic Transition

```js
d3.selectAll("rect")
  .transition()
  .duration(750)          // milliseconds
  .delay((d, i) => i * 50)  // staggered
  .ease(d3.easeElasticOut)
  .attr("height", (d) => yScale(d))
  .attr("fill", "orange");
```

### Enter/Update/Exit Pattern (Animated)

```js
function update(data) {
  const bars = svg.selectAll("rect").data(data, d => d.id);

  // EXIT — remove old elements
  bars.exit()
    .transition().duration(300)
    .attr("opacity", 0)
    .attr("height", 0)
    .remove();

  // ENTER — add new elements
  const enter = bars.enter()
    .append("rect")
    .attr("opacity", 0)
    .attr("height", 0);

  // UPDATE + ENTER merged
  enter.merge(bars)
    .transition().duration(500)
    .attr("x", (d, i) => xScale(i))
    .attr("y", (d) => yScale(d.value))
    .attr("width", xScale.bandwidth())
    .attr("height", (d) => height - yScale(d.value))
    .attr("opacity", 1)
    .attr("fill", "steelblue");
}
```

### Easing Functions

```js
d3.easeLinear        // constant speed
d3.easeCubicInOut    // smooth acceleration/deceleration
d3.easeElasticOut    // spring-like bounce
d3.easeBounceOut     // bouncing ball
d3.easeBackOut       // slight overshoot
d3.easeCircleInOut   // circular motion
```

## Chart Types

### Bar Chart

```js
function barChart(data, container) {
  const margin = { top: 20, right: 20, bottom: 30, left: 40 };
  const width = 600 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const svg = d3.select(container).append("svg")
    .attr("viewBox", `0 0 600 400`);

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand().domain(data.map(d => d.name)).range([0, width]).padding(0.2);
  const y = d3.scaleLinear().domain([0, d3.max(data, d => d.value)]).range([height, 0]);

  g.selectAll("rect")
    .data(data)
    .join("rect")
    .attr("x", d => x(d.name))
    .attr("width", x.bandwidth())
    .attr("y", height)  // start from bottom
    .attr("height", 0)
    .attr("fill", "steelblue")
    .transition().duration(800).delay((d, i) => i * 100)
    .attr("y", d => y(d.value))
    .attr("height", d => height - y(d.value));

  g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));
  g.append("g").call(d3.axisLeft(y));
}
```

### Line Chart with Animated Drawing

```js
const line = d3.line()
  .x(d => xScale(d.date))
  .y(d => yScale(d.value))
  .curve(d3.curveMonotoneX);

const path = g.append("path")
  .datum(data)
  .attr("fill", "none")
  .attr("stroke", "steelblue")
  .attr("stroke-width", 2)
  .attr("d", line);

// Animate the line drawing
const totalLength = path.node().getTotalLength();
path.attr("stroke-dasharray", totalLength)
  .attr("stroke-dashoffset", totalLength)
  .transition().duration(2000).ease(d3.easeLinear)
  .attr("stroke-dashoffset", 0);
```

### Pie / Donut Chart

```js
const pie = d3.pie().value(d => d.value).sort(null);
const arc = d3.arc().innerRadius(60).outerRadius(120);

const arcs = g.selectAll(".arc")
  .data(pie(data))
  .join("path")
  .attr("fill", (d, i) => color(i))
  .transition().duration(800)
  .attrTween("d", function(d) {
    const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
    return function(t) { return arc(interpolate(t)); };
  });
```

## Using D3 Inside Remotion

D3 can render inside Remotion for animated data viz videos:

```tsx
import { useCurrentFrame, interpolate } from "remotion";
import * as d3 from "d3";

export const AnimatedBarChart: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, 60], [0, 1], { extrapolateRight: "clamp" });

  const data = [30, 80, 45, 60, 20];
  const yScale = d3.scaleLinear().domain([0, 100]).range([200, 0]);
  const xScale = d3.scaleBand().domain(data.map((_, i) => String(i))).range([0, 400]).padding(0.2);

  return (
    <svg viewBox="0 0 400 200">
      {data.map((d, i) => {
        const barProgress = interpolate(progress, [i * 0.15, i * 0.15 + 0.4], [0, 1], {
          extrapolateLeft: "clamp", extrapolateRight: "clamp",
        });
        return (
          <rect
            key={i}
            x={xScale(String(i))}
            y={yScale(d * barProgress)}
            width={xScale.bandwidth()}
            height={200 - yScale(d * barProgress)}
            fill="steelblue"
          />
        );
      })}
    </svg>
  );
};
```

## Best Practices

1. **Use .join()** instead of enter/append — cleaner data binding
2. **Set viewBox** on SVG for responsive sizing
3. **Use margins convention** — `{ top, right, bottom, left }`
4. **Transitions after data join** — animate enter, update, and exit separately
5. **Use scales** — never calculate pixel positions manually
6. **Stagger with delay** — `delay((d, i) => i * 50)` for sequential reveals
7. **attrTween for complex** — interpolate paths, arcs, and custom attributes
8. **d3-format for labels** — `d3.format(",.0f")(1234)` → "1,234"

## Source

- Repo: github.com/d3/d3
- Gallery: observablehq.com/@d3/gallery
- Awesome D3: github.com/wbkd/awesome-d3
