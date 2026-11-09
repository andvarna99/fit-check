/* @ds-bundle: {"format":4,"namespace":"FitCheck","components":[{"name":"Button"},{"name":"Chip"},{"name":"ItemCard"},{"name":"DressUpSlot"},{"name":"MatchBadge"},{"name":"TabBar"},{"name":"BottomSheet"},{"name":"WindowPanel"}]} */
(function () {
  var React = window.React;
  var h = React.createElement;
  function cx() { return Array.prototype.filter.call(arguments, Boolean).join(' '); }
  function omit(o, keys) { var r = {}; for (var k in o) if (keys.indexOf(k) < 0) r[k] = o[k]; return r; }

  /* ---------- Icon ---------- */
  var PATHS = {
    today: 'M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
    closet: 'M12 6a2 2 0 1 1 2 2c-1 0-2 .7-2 1.6V10M12 10l-8.4 6.2A1.6 1.6 0 0 0 4.6 19h14.8a1.6 1.6 0 0 0 1-2.8L12 10z',
    outfits: 'M8 4l4 2 4-2 4 3-2 4h-2v9H8v-9H6L4 7l4-3z',
    history: 'M3 12a9 9 0 1 0 3-6.7M3 4v4h4M12 7v5l3 2',
    lock: 'M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5z',
    unlock: 'M7 11V8a5 5 0 0 1 9.6-2M5 11h14v10H5z',
    shuffle: 'M16 4h4v4M20 4l-6 6M4 20l6-6M16 20h4v-4M20 20L4 4',
    left: 'M15 5l-7 7 7 7',
    right: 'M9 5l7 7-7 7',
    close: 'M6 6l12 12M18 6L6 18',
    plus: 'M12 5v14M5 12h14',
    search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4',
    filter: 'M4 6h16M7 12h10M10 18h4',
    settings: 'M4 7h10M18 7h2M4 17h4M12 17h8M16 5v4M10 15v4',
    trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
    check: 'M5 12l5 5 9-10'
  };
  function Icon(props) {
    var size = props.size || 24;
    if (props.name === 'sparkle') return h(Sparkle, { size: size, className: props.className });
    return h('svg', {
      className: cx('fc-icon', props.className), width: size, height: size, viewBox: '0 0 24 24',
      fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round',
      'aria-hidden': props.label ? undefined : true, role: props.label ? 'img' : undefined, 'aria-label': props.label
    }, h('path', { d: PATHS[props.name] || '' }));
  }

  /* ---------- Sparkle (four-point star) ---------- */
  function Sparkle(props) {
    var s = props.size || 16;
    return h('svg', { className: cx('fc-sparkle', props.className), width: s, height: s, viewBox: '0 0 24 24', 'aria-hidden': true, style: props.style },
      h('path', { d: 'M12 0C12.8 7 17 11.2 24 12 17 12.8 12.8 17 12 24 11.2 17 7 12.8 0 12 7 11.2 11.2 7 12 0Z', fill: 'currentColor' }));
  }

  /* ---------- Button ---------- */
  function Button(props) {
    var variant = props.variant || 'primary';
    var rest = omit(props, ['variant', 'icon', 'block', 'loading', 'className', 'children']);
    return h('button', Object.assign({ type: 'button' }, rest, {
      className: cx('fc-btn', 'fc-btn--' + variant, props.block && 'fc-btn--block', props.loading && 'is-loading', props.className),
      'aria-busy': props.loading || undefined
    }),
      props.icon ? h(Icon, { name: props.icon, size: 20 }) : null,
      h('span', null, props.loading ? 'LOADING...' : props.children));
  }

  function IconButton(props) {
    var rest = omit(props, ['icon', 'label', 'variant', 'pressed', 'className']);
    return h('button', Object.assign({ type: 'button' }, rest, {
      className: cx('fc-iconbtn', 'fc-iconbtn--' + (props.variant || 'plain'), props.pressed && 'is-pressed', props.className),
      'aria-label': props.label, 'aria-pressed': props.pressed === undefined ? undefined : !!props.pressed
    }), h(Icon, { name: props.icon }));
  }

  /* ---------- Chip ---------- */
  function Chip(props) {
    var variant = props.variant || 'select';
    var label = h('span', { className: 'fc-chip__label' }, props.children);
    if (variant === 'tag') {
      return h('span', { className: cx('fc-chip', 'fc-chip--tag', props.className) }, label,
        props.onRemove ? h('button', { type: 'button', className: 'fc-chip__x', 'aria-label': 'Remove ' + props.children, onClick: props.onRemove }, h(Icon, { name: 'close', size: 16 })) : null);
    }
    return h('button', {
      type: 'button', className: cx('fc-chip', 'fc-chip--' + variant, props.selected && 'is-selected', props.className),
      'aria-pressed': !!props.selected, onClick: props.onClick
    },
      props.icon ? h(Icon, { name: props.icon, size: 18 }) : null,
      props.swatch ? h('span', { className: 'fc-chip__swatch', style: { background: props.swatch } }) : null,
      label,
      props.count ? h('span', { className: 'fc-chip__count' }, props.count) : null);
  }

  /* ---------- ItemCard ---------- */
  var STATUS = { laundry: 'Laundry', stored: 'Stored', clean: 'Clean' };
  function ItemCard(props) {
    var status = props.status && props.status !== 'clean' ? props.status : null;
    return h('button', { type: 'button', className: cx('fc-item', props.selected && 'is-selected', props.className), onClick: props.onClick, 'aria-pressed': props.selectable ? !!props.selected : undefined },
      h('span', { className: 'fc-item__photo' },
        props.src ? h('img', { src: props.src, alt: '' }) : h('span', { className: 'fc-item__ph' }, h(Icon, { name: 'closet', size: 32 })),
        status ? h('span', { className: 'fc-badge fc-badge--' + status }, STATUS[status]) : null,
        props.draft ? h('span', { className: 'fc-badge fc-badge--draft' }, 'Needs tags') : null,
        props.selectable ? h('span', { className: 'fc-item__check', 'aria-hidden': true }, props.selected ? h(Icon, { name: 'check', size: 16 }) : null) : null),
      props.name ? h('span', { className: 'fc-item__name' }, props.name) : null,
      props.meta ? h('span', { className: 'fc-item__meta' }, props.meta) : null);
  }

  /* ---------- DressUpSlot ---------- */
  function DressUpSlot(props) {
    var items = props.items || [];
    var ctrl = typeof props.index === 'number';
    var st = React.useState(props.defaultIndex || 0);
    var idx = ctrl ? props.index : st[0];
    var lockSt = React.useState(!!props.defaultLocked);
    var locked = props.locked !== undefined ? props.locked : lockSt[0];
    var n = items.length;
    function go(d) {
      if (!n || locked) return;
      var next = (idx + d + n) % n;
      if (!ctrl) st[1](next);
      if (props.onChange) props.onChange(next, items[next]);
    }
    function toggleLock() {
      if (props.locked === undefined) lockSt[1](!locked);
      if (props.onLockChange) props.onLockChange(!locked);
    }
    var cur = items[idx];
    var prev = n > 1 ? items[(idx - 1 + n) % n] : null;
    var next = n > 1 ? items[(idx + 1) % n] : null;
    function thumb(it, cls) {
      if (!it) return h('span', { className: cls });
      return h('span', { className: cls }, it.src ? h('img', { src: it.src, alt: '' }) : null);
    }
    return h('section', { className: cx('fc-slot', locked && 'is-locked', props.className), 'aria-roledescription': 'carousel', 'aria-label': props.label },
      h('header', { className: 'fc-slot__head' },
        h('span', { className: 'fc-slot__label' }, props.label, props.optional ? h('span', { className: 'fc-slot__opt' }, ' optional') : null),
        h('span', { className: 'fc-slot__count' }, n ? (idx + 1) + '/' + n : '0/0'),
        h('button', { type: 'button', className: cx('fc-lock', locked && 'is-on'), 'aria-pressed': locked, 'aria-label': (locked ? 'Unlock ' : 'Lock ') + props.label, onClick: toggleLock },
          h(Icon, { name: locked ? 'lock' : 'unlock', size: 18 }), locked ? h('span', { className: 'fc-lock__txt' }, 'LOCKED') : null)),
      h('div', { className: 'fc-slot__stage' },
        h('button', { type: 'button', className: 'fc-slot__nav', 'aria-label': 'Previous ' + props.label, onClick: function () { go(-1); }, disabled: locked || n < 2 }, h(Icon, { name: 'left' })),
        thumb(prev, 'fc-slot__peek'),
        h('span', { className: 'fc-slot__main', 'aria-live': 'polite' },
          cur ? (cur.src ? h('img', { src: cur.src, alt: cur.name || '' }) : null) : h('span', { className: 'fc-slot__empty' }, props.optional ? 'Tap to add' : 'Nothing fits yet')),
        thumb(next, 'fc-slot__peek'),
        h('button', { type: 'button', className: 'fc-slot__nav', 'aria-label': 'Next ' + props.label, onClick: function () { go(1); }, disabled: locked || n < 2 }, h(Icon, { name: 'right' }))),
      cur && cur.name ? h('p', { className: 'fc-slot__name' }, cur.name) : null);
  }

  /* ---------- MatchBadge ---------- */
  function MatchBadge(props) {
    var state = props.state || 'match';
    var text = { match: 'MATCH!', clash: 'CLASH', thinking: 'THINKING...' }[state];
    return h('div', { className: cx('fc-match', 'fc-match--' + state, props.className), role: 'status', 'aria-live': 'polite' },
      state === 'match' ? h(Sparkle, { size: 14, className: 'fc-match__s1' }) : null,
      h('span', { className: 'fc-match__text' }, text),
      typeof props.score === 'number' && state !== 'thinking' ? h('span', { className: 'fc-match__score' }, Math.round(props.score) + '%') : null,
      state === 'match' ? h(Sparkle, { size: 10, className: 'fc-match__s2' }) : null);
  }

  /* ---------- TabBar ---------- */
  var DEFAULT_TABS = [
    { id: 'today', label: 'Today', icon: 'today' },
    { id: 'closet', label: 'Closet', icon: 'closet' },
    { id: 'outfits', label: 'Outfits', icon: 'outfits' },
    { id: 'history', label: 'History', icon: 'history' }
  ];
  function TabBar(props) {
    var tabs = props.tabs || DEFAULT_TABS;
    var st = React.useState(props.defaultActive || tabs[0].id);
    var active = props.active || st[0];
    return h('nav', { className: cx('fc-tabbar', props.className), 'aria-label': 'Main' },
      tabs.map(function (t) {
        var on = t.id === active;
        return h('button', { key: t.id, type: 'button', className: cx('fc-tab', on && 'is-active'), 'aria-current': on ? 'page' : undefined,
          onClick: function () { if (!props.active) st[1](t.id); if (props.onChange) props.onChange(t.id); } },
          h('span', { className: 'fc-tab__pill' }, h(Icon, { name: t.icon })),
          h('span', { className: 'fc-tab__label' }, t.label),
          t.badge ? h('span', { className: 'fc-tab__badge' }, t.badge) : null);
      }));
  }

  /* ---------- BottomSheet ---------- */
  function BottomSheet(props) {
    if (props.open === false) return null;
    return h('div', { className: cx('fc-sheet-wrap', props.inline && 'is-inline') },
      h('div', { className: 'fc-scrim', onClick: props.onClose }),
      h('div', { className: cx('fc-sheet', props.className), role: 'dialog', 'aria-modal': true, 'aria-label': props.title },
        h('span', { className: 'fc-sheet__grab', 'aria-hidden': true }),
        h('header', { className: 'fc-sheet__head' },
          h('h2', { className: 'fc-sheet__title' }, props.title),
          props.onClose ? h(IconButton, { icon: 'close', label: 'Close', onClick: props.onClose }) : null),
        h('div', { className: 'fc-sheet__body' }, props.children),
        props.footer ? h('footer', { className: 'fc-sheet__foot' }, props.footer) : null));
  }

  /* ---------- WindowPanel ---------- */
  function WindowPanel(props) {
    return h('section', { className: cx('fc-window', props.className), 'aria-label': props.title },
      h('header', { className: 'fc-window__bar' },
        h('span', { className: 'fc-window__title' }, props.title),
        h('span', { className: 'fc-window__btns', 'aria-hidden': !props.onClose },
          h('span', { className: 'fc-window__b' }), h('span', { className: 'fc-window__b' }),
          props.onClose ? h('button', { type: 'button', className: 'fc-window__b fc-window__x', 'aria-label': 'Close', onClick: props.onClose }, h(Icon, { name: 'close', size: 12 })) : h('span', { className: 'fc-window__b' }))),
      h('div', { className: 'fc-window__body' }, props.children));
  }

  window.FitCheck = Object.assign(window.FitCheck || {}, {
    Button: Button, IconButton: IconButton, Chip: Chip, ItemCard: ItemCard, DressUpSlot: DressUpSlot,
    MatchBadge: MatchBadge, TabBar: TabBar, BottomSheet: BottomSheet, WindowPanel: WindowPanel, Icon: Icon, Sparkle: Sparkle
  });
})();
