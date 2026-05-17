---
layout: post
title: Hello, world
date: 2026-01-01
tags: [meta, rust]
excerpt: "First post on the new markdown-driven setup. Demonstrates tags, an optional header image, and inline figures."
# Optional header image — uncomment to use:
# image: /assets/images/hero.jpg
# image_alt: "Decorative banner"
---

This is the first post on the new markdown-driven setup. Front-matter at the top of each file controls the title, date, tags, optional header image, and excerpt.

## Tags

Tags are declared in YAML front-matter as a list, e.g. `tags: [meta, rust]`. Each tag becomes a link to `/tags/<name>/`, a generated archive page listing every post with that tag. The global tag index lives at [/tags/](/tags/).

## Inline media

Standard markdown image syntax works as-is:

![placeholder](/assets/images/.gitkeep)

For richer media with captions, use the `figure` include:

{% include figure.html src="/assets/images/.gitkeep" alt="placeholder" caption="A figure with a caption." %}

Code embeds via `jekyll-gist` are also still available:

```rust
fn main() {
    println!("hello, world");
}
```

## Optional header image

Add `image: /assets/images/foo.jpg` to the front-matter and the layout will render it above the title. Pair with `image_alt: "..."` for accessibility.
