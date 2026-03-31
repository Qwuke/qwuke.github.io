// ASCII Twinkling Stars — powered by pretext for character width measurement
// Inspired by chenglou/pretext variable-typographic-ascii demo

import { prepareWithSegments } from '/lib/pretext/layout.js'

// --- Configuration ---
const FONT_SIZE = 14
const LINE_HEIGHT = 18
const FONT = `${FONT_SIZE}px OtherFont, Georgia, serif`
const BASE_STAR_DENSITY = 0.035
const NARROW_BREAKPOINT = 600
const NARROW_STAR_DENSITY = 0.018
const TWINKLE_MIN_PERIOD = 1500
const TWINKLE_MAX_PERIOD = 4000
const FALLING_STAR_MIN_INTERVAL = 4000
const FALLING_STAR_MAX_INTERVAL = 9000
const FALLING_STAR_LENGTH = 6
const FALLING_STAR_SPEED = 35

const STAR_CHARS = ['.', '*', '+', '\u00B7', '\u00B0', '\u00D7', '`']
const FALLING_CHARS_RIGHT = ['\\', '\\', '*', '.', '.', ' ']
const FALLING_CHARS_LEFT = ['/', '/', '*', '.', '.', ' ']

// --- Pretext character measurement ---
function measureCharWidth(ch) {
  const prepared = prepareWithSegments(ch, FONT)
  return prepared.widths && prepared.widths.length > 0 ? prepared.widths[0] : 0
}

// --- Brightness estimation via canvas ---
const bCanvas = document.createElement('canvas')
bCanvas.width = 28
bCanvas.height = 28
const bCtx = bCanvas.getContext('2d', { willReadFrequently: true })

function estimateBrightness(ch) {
  const size = 28
  bCtx.clearRect(0, 0, size, size)
  bCtx.font = FONT
  bCtx.fillStyle = '#fff'
  bCtx.textBaseline = 'middle'
  bCtx.fillText(ch, 1, size / 2)
  const data = bCtx.getImageData(0, 0, size, size).data
  let sum = 0
  for (let i = 3; i < data.length; i += 4) sum += data[i]
  return sum / (255 * size * size)
}

// --- Build star palette with pretext-measured widths ---
function buildPalette() {
  const entries = []
  for (const ch of STAR_CHARS) {
    const width = measureCharWidth(ch)
    if (width <= 0) continue
    const brightness = estimateBrightness(ch)
    entries.push({ char: ch, width, brightness })
  }
  entries.sort((a, b) => a.brightness - b.brightness)
  return entries
}

function esc(ch) {
  if (ch === '<') return '&lt;'
  if (ch === '>') return '&gt;'
  if (ch === '&') return '&amp;'
  if (ch === '"') return '&quot;'
  return ch
}

// --- Grid setup: use pretext-measured space width for accurate column count ---
function computeGridSize(container, spaceWidth) {
  const w = container.clientWidth
  const h = container.clientHeight
  const charWidth = spaceWidth > 0 ? spaceWidth : 4
  const cols = Math.max(20, Math.floor(w / charWidth))
  const rows = Math.max(4, Math.floor(h / LINE_HEIGHT))
  return { cols, rows, width: w }
}

// --- Star density scales with viewport width ---
function getDensity(viewportWidth) {
  if (viewportWidth <= NARROW_BREAKPOINT) return NARROW_STAR_DENSITY
  // Lerp between narrow and base density
  const t = Math.min(1, (viewportWidth - NARROW_BREAKPOINT) / 600)
  return NARROW_STAR_DENSITY + t * (BASE_STAR_DENSITY - NARROW_STAR_DENSITY)
}

// --- Star state ---
function createStarGrid(cols, rows, palette, viewportWidth) {
  const density = getDensity(viewportWidth)
  const grid = []
  for (let r = 0; r < rows; r++) {
    const row = []
    for (let c = 0; c < cols; c++) {
      if (Math.random() < density) {
        const entry = palette[Math.floor(Math.random() * palette.length)]
        const isWarm = Math.random() < 0.15
        row.push({
          type: 'star',
          char: entry.char,
          brightness: entry.brightness,
          warm: isWarm,
          phase: Math.random() * Math.PI * 2,
          period: TWINKLE_MIN_PERIOD + Math.random() * (TWINKLE_MAX_PERIOD - TWINKLE_MIN_PERIOD),
          baseBrightness: 0.3 + Math.random() * 0.7,
        })
      } else {
        row.push({ type: 'empty' })
      }
    }
    grid.push(row)
  }
  return grid
}

// --- Falling star state ---
function spawnFallingStar(cols, rows) {
  const goRight = Math.random() < 0.5
  const startCol = goRight
    ? Math.floor(Math.random() * (cols * 0.7))
    : Math.floor(cols * 0.3 + Math.random() * (cols * 0.7))
  const startRow = Math.floor(Math.random() * Math.max(1, rows * 0.4))
  return {
    col: startCol,
    row: startRow,
    dx: goRight ? 1 : -1,
    dy: 1,
    progress: 0,
    length: FALLING_STAR_LENGTH,
    chars: goRight ? FALLING_CHARS_RIGHT : FALLING_CHARS_LEFT,
    active: true,
    lastStep: 0,
  }
}

function nextFallingStarDelay() {
  return FALLING_STAR_MIN_INTERVAL + Math.random() * (FALLING_STAR_MAX_INTERVAL - FALLING_STAR_MIN_INTERVAL)
}

// --- Rendering ---
function renderRow(rowData, cols, now, fallingStarCells) {
  let html = ''
  for (let c = 0; c < cols; c++) {
    const fKey = `${c}`
    if (fallingStarCells && fallingStarCells[fKey]) {
      const fc = fallingStarCells[fKey]
      html += `<span class="sf">${esc(fc.char)}</span>`
      continue
    }

    const cell = rowData[c]
    if (!cell || cell.type === 'empty') {
      html += ' '
      continue
    }

    const t = now / cell.period + cell.phase
    const wave = 0.5 + 0.5 * Math.sin(t * Math.PI * 2)
    const brightness = cell.baseBrightness * wave
    const alphaIndex = Math.max(1, Math.min(10, Math.round(brightness * 10)))

    if (alphaIndex < 1) {
      html += ' '
    } else {
      const cls = cell.warm ? `sw${alphaIndex}` : `sa${alphaIndex}`
      html += `<span class="${cls}">${esc(cell.char)}</span>`
    }
  }
  return html
}

// --- Position star field below header ---
function positionBelowHeader(container) {
  const header = document.querySelector('header.header-container')
  if (header) {
    const headerRect = header.getBoundingClientRect()
    const topOffset = headerRect.bottom
    container.style.top = topOffset + 'px'
    // Fill from below header to ~45vh
    const availableHeight = window.innerHeight * 0.45 - topOffset
    container.style.height = Math.max(100, availableHeight) + 'px'
  } else {
    container.style.top = '0px'
    container.style.height = '45vh'
  }
}

// --- Main init ---
let animationId = null

function init() {
  const container = document.getElementById('star-field')
  if (!container) return

  // Cancel any running animation
  if (animationId) cancelAnimationFrame(animationId)
  container.innerHTML = ''

  // Position below header
  positionBelowHeader(container)

  // Measure space width using pretext for accurate column calculation
  const spaceWidth = measureCharWidth(' ')

  const { cols, rows, width } = computeGridSize(container, spaceWidth)
  const palette = buildPalette()
  if (palette.length === 0) return

  const grid = createStarGrid(cols, rows, palette, width)
  const fallingStars = []

  // Create row elements
  const rowNodes = []
  for (let r = 0; r < rows; r++) {
    const div = document.createElement('div')
    div.className = 'star-row'
    container.appendChild(div)
    rowNodes.push(div)
  }

  let nextSpawn = performance.now() + nextFallingStarDelay()

  function animate(now) {
    // Spawn falling stars
    if (now >= nextSpawn) {
      fallingStars.push(spawnFallingStar(cols, rows))
      nextSpawn = now + nextFallingStarDelay()
    }

    // Advance falling stars
    for (const fs of fallingStars) {
      if (!fs.active) continue
      if (now - fs.lastStep >= FALLING_STAR_SPEED) {
        fs.progress++
        fs.lastStep = now
        if (fs.progress > fs.length + 8) {
          fs.active = false
        }
      }
    }

    // Build falling star cell map per row
    const fallingCellsByRow = {}
    for (const fs of fallingStars) {
      if (!fs.active) continue
      for (let i = 0; i < fs.length; i++) {
        const age = fs.progress - i
        if (age < 0 || age >= fs.chars.length) continue
        const r = fs.row + (fs.progress - i) * fs.dy
        const c = fs.col + (fs.progress - i) * fs.dx
        if (r < 0 || r >= rows || c < 0 || c >= cols) continue
        if (!fallingCellsByRow[r]) fallingCellsByRow[r] = {}
        fallingCellsByRow[r][`${c}`] = { char: fs.chars[i] }
      }
    }

    // Clean up dead falling stars
    for (let i = fallingStars.length - 1; i >= 0; i--) {
      if (!fallingStars[i].active) fallingStars.splice(i, 1)
    }

    // Render rows
    for (let r = 0; r < rows; r++) {
      const html = renderRow(grid[r], cols, now, fallingCellsByRow[r] || null)
      rowNodes[r].innerHTML = html
    }

    animationId = requestAnimationFrame(animate)
  }

  animationId = requestAnimationFrame(animate)
}

// Handle resize — debounced reinit
let resizeTimeout
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout)
  resizeTimeout = setTimeout(() => init(), 300)
})

// Wait for fonts then start
document.fonts.ready.then(() => {
  if (document.getElementById('star-field')) {
    init()
  }
})
