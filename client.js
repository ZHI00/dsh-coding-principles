window.__ModuleLoader__.load({
  id: 'dsh-coding-principles',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const NS = 'coding-principles-stats';
    const PKG = 'dsh-coding-principles';
    const dicts = {
      zh: {
        title: '生效统计',
        injections: '累计注入',
        lastInjected: '最近注入',
        unit: '次',
        never: '尚未注入',
        loading: '读取中…',
        error: '读取失败',
        note: '插件在每次模型请求时自动注入规则并计数，此处读取的是宿主记录的实时统计。'
      },
      en: {
        title: 'Injection stats',
        injections: 'Injections',
        lastInjected: 'Last injected',
        unit: 'times',
        never: 'Not yet',
        loading: 'Loading…',
        error: 'Failed to load',
        note: 'The plugin injects the rules into every model request and counts it; these numbers come from the host.'
      }
    };

    function statsPath() {
      const relative = 'dsh-coding-principles/stats';
      if (typeof document === 'undefined') return `/${relative}`;
      return new URL(relative, document.baseURI).pathname;
    }

    function formatTime(iso) {
      const date = new Date(iso);
      return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
    }

    function StatsSection({ t }) {
      const [state, setState] = React.useState({ status: 'loading' });

      React.useEffect(() => {
        let alive = true;
        const controller = new AbortController();
        fetch(statsPath(), { cache: 'no-store', signal: controller.signal })
          .then((response) => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
          })
          .then((data) => {
            if (alive) setState({ status: 'ok', data });
          })
          .catch((error) => {
            if (alive) setState({ status: 'error', message: error instanceof Error ? error.message : String(error) });
          });
        return () => {
          alive = false;
          controller.abort();
        };
      }, []);

      const row = (label, value) =>
        h(
          'div',
          {
            key: label,
            style: { display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 13 }
          },
          h('span', { style: { opacity: 0.7 } }, label),
          h('span', { style: { fontVariantNumeric: 'tabular-nums' } }, value)
        );

      let body;
      if (state.status === 'loading') {
        body = h('div', { style: { fontSize: 13, opacity: 0.7 } }, t('loading'));
      } else if (state.status === 'error') {
        body = h('div', { style: { fontSize: 13, opacity: 0.7 } }, t('error'));
      } else {
        body = [
          row(t('injections'), `${state.data.injections} ${t('unit')}`),
          row(t('lastInjected'), state.data.lastInjectedAt ? formatTime(state.data.lastInjectedAt) : t('never'))
        ];
      }

      return h(
        'section',
        {
          'data-coding-principles-stats': '',
          style: {
            border: '1px solid rgba(127, 127, 127, 0.25)',
            borderRadius: 10,
            padding: '12px 14px',
            display: 'grid',
            gap: 8
          }
        },
        h('div', { style: { fontWeight: 600, fontSize: 14 } }, t('title')),
        body,
        h('div', { style: { fontSize: 12, opacity: 0.6, lineHeight: 1.5 } }, t('note'))
      );
    }

    return {
      name: PKG,
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, dicts), 'coding-principles: stats locale');
        const t = ctx.locale.bind(NS);

        ctx.slots.inject('plugins.detail.section', () =>
          ctx.slots.register(
            { name: 'plugins.detail.section', id: 'coding-principles-stats', order: 50, locale: NS },
            ({ t: translate, subject }) => {
              const pkgName = typeof subject?.pkg === 'string' ? subject.pkg : subject?.pkg?.name;
              if (subject?.kind !== 'bundle' || pkgName !== PKG) return null;
              return h(StatsSection, { t: translate ?? t });
            }
          )
        );
      }
    };
  }
});
