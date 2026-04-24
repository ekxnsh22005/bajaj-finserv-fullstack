'use client';
import { useState } from 'react';
import styles from './page.module.css';

function OrgTree({ root, treeData }) {
  function renderNode(name, children) {
    const entries = Object.entries(children || {});
    return (
      <li key={name}>
        <span className={styles.vizNode}>{name}</span>
        {entries.length > 0 && (
          <ul>
            {entries.map(([child, grandChildren]) =>
              renderNode(child, grandChildren)
            )}
          </ul>
        )}
      </li>
    );
  }

  return (
    <div className={styles.vizTree}>
      <ul>
        {renderNode(root, treeData[root] || {})}
      </ul>
    </div>
  );
}

function CycleChain({ path }) {
  if (!path || path.length === 0) {
    return <p className={styles.cycleNote}>Cyclic group: no acyclic root exists.</p>;
  }
  return (
    <div className={styles.cycleChain}>
      {path.map((node, i) => (
        <span key={i} className={styles.cycleStep}>
          <span className={styles.cycleNode}>{node}</span>
          <span className={styles.cycleArrow}>→</span>
        </span>
      ))}
      <span className={`${styles.cycleNode} ${styles.cycleNodeBack}`}>{path[0]}</span>
      <span className={styles.cycleLoopLabel}> ↩ cycle</span>
    </div>
  );
}

const EXAMPLE =
  'A->B, A->C, B->D, C->E, E->F, X->Y, Y->Z, Z->X, P->Q, Q->R, G->H, G->H, G->I, hello, 1->2, A->';

export default function Home() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setError(null);
    setResult(null);
    setLoading(true);
    const data = input.split(',').map(s => s.trim()).filter(Boolean);
    try {
      const res = await fetch('/bfhl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setResult(json);
    } catch (e) {
      setError(e.message || 'Could not reach the API.');
    } finally {
      setLoading(false);
    }
  };

  const clear = () => { setInput(''); setResult(null); setError(null); };

  return (
    <div className={styles.shell}>
      <main className={styles.main}>

        <header className={styles.header}>
          <h1 className={styles.title}>Node Hierarchy Analyzer</h1>
          <p className={styles.subtitle}>
            Feed directed edges: get back parsed trees, cycle detection, invalid entries, and a summary.
          </p>
        </header>

        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <span className={styles.panelLabel}>Input Edges</span>
            <span className={styles.panelHint}>comma-separated · Ctrl+Enter to run</span>
          </div>
          <textarea
            className={styles.textarea}
            rows={4}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={'A->B, A->C, B->D …'}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) run(); }}
            spellCheck={false}
          />
          <div className={styles.panelFoot}>
            <div className={styles.btnRow}>
              <button className={styles.btnGhost}
                onClick={() => { setInput(EXAMPLE); setResult(null); setError(null); }}>
                Load example
              </button>
              {(result || error || input) &&
                <button className={styles.btnGhost} onClick={clear}>Clear</button>
              }
              <button className={styles.btnRun} onClick={run}
                disabled={loading || !input.trim()}>
                {loading ? '···' : 'Run →'}
              </button>
            </div>
          </div>
        </section>

        {error && (
          <div className={styles.errorBanner}>
            <span className={styles.errorIcon}>!</span>
            {error}
          </div>
        )}

        {result && (
          <div className={styles.results}>

            <div className={styles.grid2}>
              <div className={styles.panel}>
                <div className={styles.panelHead}>
                  <span className={styles.panelLabel}>Identity</span>
                </div>
                <dl className={styles.kv}>
                  <dt>user_id</dt><dd>{result.user_id}</dd>
                  <dt>email_id</dt><dd>{result.email_id}</dd>
                  <dt>roll</dt><dd>{result.college_roll_number}</dd>
                </dl>
              </div>

              <div className={styles.panel}>
                <div className={styles.panelHead}>
                  <span className={styles.panelLabel}>Summary</span>
                </div>
                <div className={styles.stats}>
                  <div className={styles.stat}>
                    <div className={styles.statN}>{result.summary.total_trees}</div>
                    <div className={styles.statK}>trees</div>
                  </div>
                  <div className={styles.statDiv} />
                  <div className={styles.stat}>
                    <div className={`${styles.statN} ${result.summary.total_cycles > 0 ? styles.red : ''}`}>
                      {result.summary.total_cycles}
                    </div>
                    <div className={styles.statK}>cycles</div>
                  </div>
                  <div className={styles.statDiv} />
                  <div className={styles.stat}>
                    <div className={`${styles.statN} ${styles.accent}`}>
                      {result.summary.largest_tree_root ?? '—'}
                    </div>
                    <div className={styles.statK}>largest root</div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.panel}>
              <div className={styles.panelHead}>
                <span className={styles.panelLabel}>Hierarchies</span>
                <span className={styles.countBadge}>{result.hierarchies.length}</span>
              </div>
              <div className={styles.hierarchyList}>
                {result.hierarchies.map((h, i) => (
                  <div key={i} className={`${styles.hCard} ${h.has_cycle ? styles.hCardCycle : ''}`}>
                    <div className={styles.hCardHead}>
                      <span className={styles.hRoot}>
                        <span className={styles.hRootKw}>root</span>{' '}{h.root}
                      </span>
                      {h.has_cycle
                        ? <span className={styles.badgeCycle}>CYCLE</span>
                        : <span className={styles.badgeDepth}>depth {h.depth}</span>
                      }
                    </div>
                    {h.has_cycle
                      ? <CycleChain path={h.cycle_path} />
                      : <OrgTree root={h.root} treeData={h.tree} />
                    }
                  </div>
                ))}
              </div>
            </div>

            {(result.invalid_entries.length > 0 || result.duplicate_edges.length > 0) && (
              <div className={styles.grid2}>
                {result.invalid_entries.length > 0 && (
                  <div className={styles.panel}>
                    <div className={styles.panelHead}>
                      <span className={styles.panelLabel}>Invalid Entries</span>
                      <span className={styles.countBadge}>{result.invalid_entries.length}</span>
                    </div>
                    <div className={styles.tagRow}>
                      {result.invalid_entries.map((e, i) => (
                        <span key={i} className={styles.tagWarn}>{e || '""'}</span>
                      ))}
                    </div>
                  </div>
                )}
                {result.duplicate_edges.length > 0 && (
                  <div className={styles.panel}>
                    <div className={styles.panelHead}>
                      <span className={styles.panelLabel}>Duplicate Edges</span>
                      <span className={styles.countBadge}>{result.duplicate_edges.length}</span>
                    </div>
                    <div className={styles.tagRow}>
                      {result.duplicate_edges.map((e, i) => (
                        <span key={i} className={styles.tagInfo}>{e}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
}
