// Page geometry in units (1 unit = x-height). Row pitch is 3 units: dashed line, x-height line, baseline.
const SLANT_COT = 1 / Math.tan(65 * Math.PI / 180), ICON_COLS = 4.5, WRITE_COLS = 36, MARGIN_COLS = 3.5, PAGE_COLS = ICON_COLS + WRITE_COLS + MARGIN_COLS;
const ROW_PITCH = 3, HEADER_ROWS = 1, ROWS_PER_EXERCISE = 3, SAMPLE_STEP = 0.04, MATCH_TOLERANCE = 0.22;
const page_el = document.getElementById('page'), ruling_canvas = document.getElementById('ruling'), ink_canvas = document.getElementById('ink');
const ruling_ctx = ruling_canvas.getContext('2d'), ink_ctx = ink_canvas.getContext('2d');
let unit_px = 24, lesson_index = 0, row_layouts = [], ink_strokes = [], active_stroke = null, allow_finger_drawing = false, touch_scroll_start = null;
const sample_cache = {};

// Sample an element path into upright points, centred horizontally on x=0.
function sample_element(element_name) {
  if (sample_cache[element_name]) return sample_cache[element_name];
  const svg_path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  svg_path.setAttribute('d', ELEMENT_PATHS[element_name]);
  const path_length = svg_path.getTotalLength(), raw_points = [];
  for (let along = 0; along <= path_length; along += SAMPLE_STEP) { const point_on_path = svg_path.getPointAtLength(along); raw_points.push({x: point_on_path.x, y: point_on_path.y}); }
  const end_point = svg_path.getPointAtLength(path_length); raw_points.push({x: end_point.x, y: end_point.y});
  const min_x = Math.min.apply(null, raw_points.map(point_item => point_item.x)), max_x = Math.max.apply(null, raw_points.map(point_item => point_item.x));
  const centre_x = (min_x + max_x) / 2;
  sample_cache[element_name] = raw_points.map(point_item => ({x: point_item.x - centre_x, y: point_item.y}));
  return sample_cache[element_name];
}

// Upright unit point -> page unit point, given slot centre x and baseline y (both page units).
function to_page(upright_point, centre_x, baseline_y) { return {x: centre_x + upright_point.x + upright_point.y * SLANT_COT, y: baseline_y - upright_point.y}; }
function unslant_x(page_point, baseline_y) { return page_point.x - (baseline_y - page_point.y) * SLANT_COT; }

function build_layout() {
  const lesson = LESSONS[lesson_index];
  row_layouts = [];
  lesson.exercises.forEach((exercise, exercise_index) => {
    const slot_count = exercise.slots || 10, slot_width = WRITE_COLS / slot_count;
    for (let row_offset = 0; row_offset < ROWS_PER_EXERCISE; row_offset++) {
      const row_number = HEADER_ROWS + exercise_index * ROWS_PER_EXERCISE + row_offset;
      const slots = [];
      for (let slot_index = 0; slot_index < slot_count; slot_index++) slots.push({centre_x: ICON_COLS + slot_width * (slot_index + 0.5) - slot_width * 0.15, element: exercise.items[slot_index % exercise.items.length]});
      row_layouts.push({row_number, baseline_y: row_number * ROW_PITCH + 2, slot_width, slots, mode: ['trace', 'dotted', 'free'][row_offset], exercise_index, score: null});
    }
  });
  return HEADER_ROWS + lesson.exercises.length * ROWS_PER_EXERCISE + 1;
}

function draw_polyline(ctx, page_points, line_width, dash_pattern, stroke_colour) {
  ctx.save(); ctx.strokeStyle = stroke_colour; ctx.lineWidth = line_width; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.setLineDash(dash_pattern);
  ctx.beginPath(); page_points.forEach((page_point, point_index) => { const px_x = page_point.x * unit_px, px_y = page_point.y * unit_px; if (point_index === 0) ctx.moveTo(px_x, px_y); else ctx.lineTo(px_x, px_y); }); ctx.stroke(); ctx.restore();
}

function draw_element(ctx, element_name, centre_x, baseline_y, line_width, dash_pattern, stroke_colour) {
  draw_polyline(ctx, sample_element(element_name).map(upright_point => to_page(upright_point, centre_x, baseline_y)), line_width, dash_pattern, stroke_colour);
}

function css_var(var_name) { return getComputedStyle(document.documentElement).getPropertyValue(var_name).trim(); }

function draw_ruling(total_rows) {
  const width_px = PAGE_COLS * unit_px, height_px = total_rows * ROW_PITCH * unit_px, pixel_ratio = window.devicePixelRatio || 1;
  [ruling_canvas, ink_canvas].forEach(canvas_el => { canvas_el.width = width_px * pixel_ratio; canvas_el.height = height_px * pixel_ratio; canvas_el.style.width = width_px + 'px'; canvas_el.style.height = height_px + 'px'; canvas_el.getContext('2d').setTransform(pixel_ratio, 0, 0, pixel_ratio, 0, 0); });
  page_el.style.height = height_px + 'px';
  const line_colour = css_var('--rule'), slant_colour = css_var('--slant'), guide_colour = css_var('--guide'), model_colour = css_var('--model');
  ruling_ctx.fillStyle = css_var('--paper'); ruling_ctx.fillRect(0, 0, width_px, height_px);
  ruling_ctx.fillStyle = css_var('--margin'); ruling_ctx.fillRect((ICON_COLS + WRITE_COLS) * unit_px, 0, MARGIN_COLS * unit_px, height_px);
  const top_y = HEADER_ROWS * ROW_PITCH;
  for (let row_number = HEADER_ROWS; row_number < total_rows; row_number++) {
    const dashed_y = row_number * ROW_PITCH;
    draw_polyline(ruling_ctx, [{x: 0, y: dashed_y}, {x: PAGE_COLS, y: dashed_y}], 0.8, [6, 6], line_colour);
    if (row_number === total_rows - 1) break;
    draw_polyline(ruling_ctx, [{x: 0, y: dashed_y + 1}, {x: PAGE_COLS, y: dashed_y + 1}], 1, [], line_colour);
    draw_polyline(ruling_ctx, [{x: 0, y: dashed_y + 2}, {x: PAGE_COLS, y: dashed_y + 2}], 1, [], line_colour);
  }
  const bottom_y = (total_rows - 1) * ROW_PITCH, slant_height = bottom_y - top_y;
  for (let slant_x = -slant_height * SLANT_COT; slant_x < PAGE_COLS; slant_x += 2.4) draw_polyline(ruling_ctx, [{x: slant_x, y: bottom_y}, {x: slant_x + slant_height * SLANT_COT, y: top_y}], 0.6, [], slant_colour);
  LESSONS[lesson_index].exercises.forEach((exercise, exercise_index) => {
    const box_top = (HEADER_ROWS + exercise_index * ROWS_PER_EXERCISE) * ROW_PITCH + 0.6, box_size = ROW_PITCH * 1.6;
    ruling_ctx.fillStyle = css_var('--icon-bg'); ruling_ctx.strokeStyle = css_var('--icon-edge'); ruling_ctx.lineWidth = 1;
    ruling_ctx.beginPath(); ruling_ctx.roundRect(0.3 * unit_px, box_top * unit_px, (ICON_COLS - 0.6) * unit_px, box_size * unit_px, 0.6 * unit_px); ruling_ctx.fill(); ruling_ctx.stroke();
    draw_icon(exercise.items[0], ICON_COLS / 2, box_top, box_size, model_colour);
  });
  row_layouts.forEach(row_layout => row_layout.slots.forEach((slot, slot_index) => {
    if (row_layout.mode === 'trace') draw_element(ruling_ctx, slot.element, slot.centre_x, row_layout.baseline_y, 1.6, [], guide_colour);
    else if (slot_index === 0) draw_element(ruling_ctx, slot.element, slot.centre_x, row_layout.baseline_y, 1.6, [], model_colour);
    else if (row_layout.mode === 'dotted') draw_element(ruling_ctx, slot.element, slot.centre_x, row_layout.baseline_y, 1.2, [3, 4], guide_colour);
  }));
}

// Large demonstration of the first element, with a start dot and a direction arrow.
function draw_icon(element_name, centre_x, box_top, box_size, model_colour) {
  const upright_points = sample_element(element_name), max_y = Math.max.apply(null, upright_points.map(point_item => point_item.y)), min_y = Math.min.apply(null, upright_points.map(point_item => point_item.y));
  const scale_factor = Math.min(1.8, (box_size * 0.75) / (max_y - min_y)), baseline_y = box_top + box_size / 2 + ((max_y + min_y) / 2) * scale_factor;
  const page_points = upright_points.map(upright_point => to_page({x: upright_point.x * scale_factor - (max_y + min_y) / 2 * scale_factor * SLANT_COT, y: upright_point.y * scale_factor}, centre_x, baseline_y));
  draw_polyline(ruling_ctx, page_points, 2.4, [], model_colour);
  const start_point = page_points[0];
  ruling_ctx.fillStyle = css_var('--paper'); ruling_ctx.strokeStyle = model_colour; ruling_ctx.lineWidth = 1.5;
  ruling_ctx.beginPath(); ruling_ctx.arc(start_point.x * unit_px, start_point.y * unit_px, 0.22 * unit_px, 0, Math.PI * 2); ruling_ctx.fill(); ruling_ctx.stroke();
  const arrow_index = Math.min(page_points.length - 2, Math.floor(page_points.length * 0.3)), arrow_from = page_points[arrow_index], arrow_to = page_points[arrow_index + 1];
  const arrow_angle = Math.atan2(arrow_to.y - arrow_from.y, arrow_to.x - arrow_from.x), offset_x = Math.sin(arrow_angle) * 0.45, offset_y = -Math.cos(arrow_angle) * 0.45;
  const tip_x = (arrow_to.x + offset_x) * unit_px, tip_y = (arrow_to.y + offset_y) * unit_px, head_size = 0.32 * unit_px;
  ruling_ctx.fillStyle = css_var('--accent'); ruling_ctx.beginPath(); ruling_ctx.moveTo(tip_x, tip_y);
  ruling_ctx.lineTo(tip_x - head_size * Math.cos(arrow_angle - 0.45), tip_y - head_size * Math.sin(arrow_angle - 0.45)); ruling_ctx.lineTo(tip_x - head_size * Math.cos(arrow_angle + 0.45), tip_y - head_size * Math.sin(arrow_angle + 0.45)); ruling_ctx.closePath(); ruling_ctx.fill();
}

function redraw_ink() {
  ink_ctx.clearRect(0, 0, ink_canvas.width, ink_canvas.height);
  const ink_colour = css_var('--ink');
  ink_strokes.forEach(stroke_points => draw_polyline(ink_ctx, stroke_points, 2.2, [], ink_colour));
  row_layouts.forEach(row_layout => { if (row_layout.score === null) return;
    const badge_x = (ICON_COLS + WRITE_COLS + MARGIN_COLS / 2) * unit_px, badge_y = (row_layout.baseline_y - 0.5) * unit_px;
    ink_ctx.fillStyle = row_layout.score >= 75 ? css_var('--good') : row_layout.score >= 50 ? css_var('--ok') : css_var('--poor');
    ink_ctx.font = '600 ' + Math.round(unit_px * 0.9) + 'px system-ui, sans-serif'; ink_ctx.textAlign = 'center'; ink_ctx.textBaseline = 'middle';
    ink_ctx.fillText(row_layout.score + '%', badge_x, badge_y); });
}

// Score a row: per slot, compare ink against the model (precision and recall within tolerance). Free rows align model to the ink first.
function score_row(row_layout) {
  const row_top = row_layout.baseline_y - 2, row_bottom = row_layout.baseline_y + 1, slot_scores = [];
  const row_ink = [];
  ink_strokes.forEach(stroke_points => stroke_points.forEach(page_point => { if (page_point.y >= row_top - 0.3 && page_point.y <= row_bottom + 0.3) row_ink.push(page_point); }));
  if (!row_ink.length) { row_layout.score = null; return; }
  row_layout.slots.forEach((slot, slot_index) => {
    if (row_layout.mode === 'free' && slot_index === 0) return;
    const slot_left = slot.centre_x - row_layout.slot_width / 2, slot_ink = row_ink.filter(page_point => { const flat_x = unslant_x(page_point, row_layout.baseline_y); return flat_x >= slot_left && flat_x < slot_left + row_layout.slot_width; });
    if (slot_ink.length < 3) { if (row_layout.mode !== 'free') slot_scores.push(0); return; }
    let model_points = sample_element(slot.element).map(upright_point => to_page(upright_point, slot.centre_x, row_layout.baseline_y));
    if (row_layout.mode === 'free') {
      const ink_centre_x = slot_ink.reduce((sum_x, page_point) => sum_x + unslant_x(page_point, row_layout.baseline_y), 0) / slot_ink.length;
      const model_centre_x = model_points.reduce((sum_x, page_point) => sum_x + unslant_x(page_point, row_layout.baseline_y), 0) / model_points.length;
      model_points = model_points.map(page_point => ({x: page_point.x + ink_centre_x - model_centre_x, y: page_point.y}));
    }
    const near_fraction = (from_points, to_points) => from_points.filter(from_point => to_points.some(to_point => Math.hypot(from_point.x - to_point.x, from_point.y - to_point.y) <= MATCH_TOLERANCE)).length / from_points.length;
    const precision = near_fraction(slot_ink, model_points), recall = near_fraction(model_points, slot_ink);
    slot_scores.push(precision + recall === 0 ? 0 : 2 * precision * recall / (precision + recall));
  });
  row_layout.score = slot_scores.length ? Math.round(100 * slot_scores.reduce((sum_score, slot_score) => sum_score + slot_score, 0) / slot_scores.length) : null;
}

function row_for_point(page_point) { return row_layouts.find(row_layout => page_point.y >= row_layout.baseline_y - 2.5 && page_point.y < row_layout.baseline_y + 0.5); }
function storage_key() { return 'uhp:' + LESSONS[lesson_index].id; }
function save_ink() { try { localStorage.setItem(storage_key(), JSON.stringify(ink_strokes)); } catch (storage_err) {} }
function load_ink() { try { ink_strokes = JSON.parse(localStorage.getItem(storage_key()) || '[]'); } catch (storage_err) { ink_strokes = []; } }

function event_point(pointer_event) { const canvas_rect = ink_canvas.getBoundingClientRect(); return {x: (pointer_event.clientX - canvas_rect.left) / unit_px, y: (pointer_event.clientY - canvas_rect.top) / unit_px}; }
function can_draw(pointer_event) { return pointer_event.pointerType === 'pen' || pointer_event.pointerType === 'mouse' || allow_finger_drawing; }

ink_canvas.addEventListener('pointerdown', pointer_event => {
  if (!can_draw(pointer_event)) { touch_scroll_start = {client_y: pointer_event.clientY, scroll_y: window.scrollY}; return; }
  pointer_event.preventDefault(); ink_canvas.setPointerCapture(pointer_event.pointerId);
  active_stroke = [event_point(pointer_event)]; ink_strokes.push(active_stroke);
});
ink_canvas.addEventListener('pointermove', pointer_event => {
  if (touch_scroll_start && pointer_event.pointerType === 'touch' && !allow_finger_drawing) { window.scrollTo(0, touch_scroll_start.scroll_y - (pointer_event.clientY - touch_scroll_start.client_y)); return; }
  if (!active_stroke) return;
  const coalesced_events = pointer_event.getCoalescedEvents ? pointer_event.getCoalescedEvents() : [pointer_event];
  coalesced_events.forEach(coalesced_event => active_stroke.push(event_point(coalesced_event)));
  const tail_points = active_stroke.slice(-coalesced_events.length - 1);
  draw_polyline(ink_ctx, tail_points, 2.2, [], css_var('--ink'));
});
function end_stroke() {
  touch_scroll_start = null; if (!active_stroke) return;
  const touched_row = row_for_point(active_stroke[0]); active_stroke = null; save_ink();
  if (touched_row) { score_row(touched_row); redraw_ink(); }
}
ink_canvas.addEventListener('pointerup', end_stroke); ink_canvas.addEventListener('pointercancel', end_stroke);

function render_lesson() {
  const lesson = LESSONS[lesson_index];
  document.getElementById('lesson-title').textContent = lesson.title;
  document.getElementById('lesson-subtitle').textContent = (lesson_index + 1) + ' / ' + LESSONS.length + ' · ' + lesson.subtitle;
  last_render_width = page_el.parentElement.clientWidth;
  unit_px = Math.min(30, (page_el.parentElement.clientWidth - 32) / PAGE_COLS);
  page_el.style.width = PAGE_COLS * unit_px + 'px';
  draw_ruling(build_layout()); load_ink(); row_layouts.forEach(score_row); redraw_ink();
  try { localStorage.setItem('uhp:lesson', String(lesson_index)); } catch (storage_err) {}
}

document.getElementById('prev-lesson').onclick = () => { lesson_index = (lesson_index + LESSONS.length - 1) % LESSONS.length; render_lesson(); window.scrollTo(0, 0); };
document.getElementById('next-lesson').onclick = () => { lesson_index = (lesson_index + 1) % LESSONS.length; render_lesson(); window.scrollTo(0, 0); };
document.getElementById('undo').onclick = () => { ink_strokes.pop(); save_ink(); row_layouts.forEach(score_row); redraw_ink(); };
document.getElementById('clear').onclick = () => { if (!confirm('Clear this page?')) return; ink_strokes = []; save_ink(); row_layouts.forEach(score_row); redraw_ink(); };
document.getElementById('finger').onchange = change_event => { allow_finger_drawing = change_event.target.checked; };
let last_render_width = 0;
window.addEventListener('resize', () => { if (page_el.parentElement.clientWidth !== last_render_width) render_lesson(); });
try { lesson_index = Math.min(LESSONS.length - 1, parseInt(localStorage.getItem('uhp:lesson') || '0', 10) || 0); } catch (storage_err) {}
render_lesson();
