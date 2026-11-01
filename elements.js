// Stroke elements in upright units: baseline y=0, x-height y=1, capital/ascender y=2, descender y=-1. Slant is applied at draw time.
const ELEMENT_PATHS = {
  stick_short: 'M0 1 L0 0',
  stick_tall: 'M0 2 L0 0',
  tick_short: 'M-0.3 0.3 C-0.25 0 -0.05 -0.05 0 0.12 L0 1',
  tick_tall: 'M-0.3 0.3 C-0.25 0 -0.05 -0.05 0 0.12 L0 2',
  c_small: 'M0.6 0.82 C0.45 1.04 0 1 0 0.5 C0 0 0.45 -0.04 0.66 0.16',
  c_cap: 'M1.15 1.7 C0.9 2.06 0 2 0 1 C0 0 0.9 -0.08 1.25 0.3',
  rc_small: 'M0.06 0.82 C0.21 1.04 0.66 1 0.66 0.5 C0.66 0 0.21 -0.04 0 0.16',
  rc_cap: 'M0.1 1.7 C0.35 2.06 1.25 2 1.25 1 C1.25 0 0.35 -0.08 0 0.3',
  o_small: 'M0.33 1 C0.15 1 0 0.78 0 0.5 C0 0.22 0.15 0 0.33 0 C0.51 0 0.66 0.22 0.66 0.5 C0.66 0.78 0.51 1 0.33 1',
  o_cap: 'M0.55 2 C0.25 2 0 1.56 0 1 C0 0.44 0.25 0 0.55 0 C0.85 0 1.1 0.44 1.1 1 C1.1 1.56 0.85 2 0.55 2',
  loop_down: 'M0 1 L0 -0.6 C0 -1.05 -0.45 -1.05 -0.45 -0.75 C-0.45 -0.45 -0.05 -0.15 0.35 0.05',
  loop_up: 'M-0.25 0.25 C0.15 0.7 0.5 1.6 0.35 1.9 C0.2 2.15 0 1.9 0 1.5 L0 0',
  stick_loop_foot: 'M0 1 L0 0.25 C0 -0.05 -0.4 -0.08 -0.42 0.12 C-0.44 0.32 -0.05 0.2 0.3 0.02',
  oval_stem: 'M0.62 0.78 C0.5 1.02 0.05 1 0.05 0.62 C0.05 0.3 0.5 0.28 0.62 0.6 L0.62 0.2 C0.62 -0.05 0.3 -0.05 0.15 0.1',
  i_stroke: 'M0 1 L0 0.22 C0 -0.02 0.25 -0.05 0.42 0.15',
  l_stroke: 'M0 2 L0 0.22 C0 -0.02 0.25 -0.05 0.42 0.15',
  g_small: 'M0.08 0.62 C0.12 0.96 0.55 1.06 0.55 0.76 C0.55 0.46 0.12 0.42 0.12 0.18 C0.12 0 0.38 -0.02 0.55 0.1',
  g_tall: 'M0.08 1.3 C0.14 1.95 0.75 2.08 0.75 1.55 C0.75 0.95 0.15 0.85 0.15 0.35 C0.15 0 0.5 -0.04 0.75 0.16',
  zigzag_tall: 'M0 0.55 L0.05 2 L0.05 0 L0.25 1.45',
  zigzag_small: 'M0 0 L0 1 L0.45 0 L0.45 1',
  corner_up: 'M0 0 L0 0.85 C0 1.02 0.15 1.05 0.55 1.02',
  hook_cap: 'M0.35 1.85 C0.2 2.05 0 1.95 0 1.7 L0 0.3 C0 -0.05 -0.42 -0.05 -0.48 0.22',
  bar_top: 'M0 1.72 C0.05 2.02 0.35 2.02 1 2',
  arch_small: 'M0 0.55 C0.05 1.02 0.5 1.06 0.58 0.7',
  b_loop: 'M0.4 0.7 C0.3 0.38 0.02 0.38 0.02 0.12 C0.02 -0.08 0.35 -0.06 0.4 0.2 L0.4 0.7 C0.45 0.95 0.7 1 0.75 0.9'
};

// Exercises follow the order of the printed copybook. Each row cycles through `items`.
const LESSONS = [
  {id: 'strokes', title: 'Прямі лінії та гачки', subtitle: 'Straight strokes and hooks', exercises: [
    {items: ['stick_short']}, {items: ['stick_tall'], slots: 9}, {items: ['tick_short']}, {items: ['tick_tall'], slots: 9},
    {items: ['stick_short', 'stick_tall'], slots: 10}, {items: ['tick_short', 'tick_tall'], slots: 10}]},
  {id: 'semiovals', title: 'Півовали', subtitle: 'Half-ovals', exercises: [
    {items: ['c_small']}, {items: ['c_cap'], slots: 8}, {items: ['rc_small']}, {items: ['rc_cap'], slots: 8},
    {items: ['c_small', 'c_cap'], slots: 8}, {items: ['rc_small', 'rc_cap'], slots: 8}, {items: ['rc_small', 'c_small']}, {items: ['rc_cap', 'c_cap'], slots: 8}]},
  {id: 'ovals', title: 'Овали', subtitle: 'Ovals', exercises: [
    {items: ['o_small']}, {items: ['o_cap'], slots: 8}, {items: ['o_small', 'o_cap'], slots: 8}, {items: ['o_small', 'stick_tall']}, {items: ['o_cap', 'stick_tall'], slots: 8}]},
  {id: 'loops', title: 'Петлі', subtitle: 'Loops', exercises: [
    {items: ['loop_down']}, {items: ['loop_up']}, {items: ['stick_loop_foot'], slots: 8}, {items: ['oval_stem']},
    {items: ['loop_down', 'loop_up']}, {items: ['stick_loop_foot', 'oval_stem'], slots: 10}]},
  {id: 'il_g', title: 'Елементи і, л, г', subtitle: 'Elements of і, л, г', exercises: [
    {items: ['i_stroke']}, {items: ['l_stroke']}, {items: ['g_small']}, {items: ['g_tall'], slots: 9},
    {items: ['i_stroke', 'l_stroke']}, {items: ['g_small', 'g_tall'], slots: 10}]},
  {id: 'zigzags', title: 'Зигзаги та кути', subtitle: 'Zigzags and corners', exercises: [
    {items: ['zigzag_tall']}, {items: ['zigzag_small']}, {items: ['corner_up']}, {items: ['hook_cap']},
    {items: ['rc_small', 'zigzag_small', 'c_small'], slots: 12}, {items: ['corner_up', 'o_small'], slots: 10}, {items: ['hook_cap', 'loop_up'], slots: 10}]},
  {id: 'arcs', title: 'Дуги та з’єднання', subtitle: 'Arcs and joins', exercises: [
    {items: ['bar_top'], slots: 6}, {items: ['bar_top', 'hook_cap'], slots: 8}, {items: ['arch_small']}, {items: ['arch_small', 'hook_cap'], slots: 10}, {items: ['b_loop']}]}
];
