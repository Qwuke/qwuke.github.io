[qwu.ke](http://qwu.ke)
===============

To run locally, you will need to install ruby, bundler, and jekyll.

Run `bundle exec jekyll serve` to see a local version of the site.

## Writing a blog post

Drop a markdown file into `_posts/` named `YYYY-MM-DD-slug.md` with this
front-matter:

```yaml
---
layout: post
title: Your title
date: 2026-01-01
tags: [tag-a, tag-b]
excerpt: "Short summary used on the post list."
# Optional:
# image: /assets/images/hero.jpg
# image_alt: "Description of the image"
---
```

- Tags auto-generate archive pages at `/tags/<name>/` via
  [`jekyll-archives`](https://github.com/jekyll/jekyll-archives). A global
  tag index lives at `/tags/`.
- Inline images use standard markdown: `![alt](/path/to/image.jpg)`.
- For images with captions use the figure include:
  `{% include figure.html src="/path.jpg" alt="..." caption="..." %}`.

The site builds and deploys via the workflow in `.github/workflows/pages.yml`.
The non-allowlisted `jekyll-archives` gem is the reason for the custom build
(stock GitHub Pages would skip it).