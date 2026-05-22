import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const rawRows = [
  ['2026-05-01', 10000, 120, 18],
  ['2026-05-02', 15000, 135, 22],
  ['2026-05-03', 20000, 140, 24],
  ['2026-05-04', 30000, 180, 40],
  ['2026-05-05', 22000, 160, 33],
  ['2026-05-06', 18000, 150, 30],
  ['2026-05-07', 25000, 170, 38],
  ['2026-05-11', 28000, 175, 42],
  ['2026-05-12', 26000, 168, 39],
  ['2026-05-13', 31000, 188, 45],
  ['2026-06-01', 40000, 210, 52],
  ['2026-06-02', 36000, 190, 48],
  ['2026-06-08', 46000, 230, 61],
].map(([date, revenue, dau, pu], index) => ({
  date: new Date(`${date}T00:00:00`),
  revenue,
  dau,
  pu,
  index,
}));

const levels = ['year', 'month', 'week', 'day'];
const levelName = {
  year: '年',
  month: '月',
  week: '週',
  day: '日',
};

function formatNumber(value) {
  return value.toLocaleString('zh-TW');
}

function monthDay(date) {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function mondayOf(date) {
  const next = new Date(date);
  next.setDate(next.getDate() - ((next.getDay() + 6) % 7));
  return next;
}

function dateKey(date, level) {
  if (level === 'day') return monthDay(date);
  if (level === 'month') return `${date.getMonth() + 1}月`;
  if (level === 'year') return `${date.getFullYear()}年`;
  return monthDay(mondayOf(date));
}

function sortDateFor(date, level) {
  if (level === 'week') return mondayOf(date);
  if (level === 'month') return new Date(date.getFullYear(), date.getMonth(), 1);
  if (level === 'year') return new Date(date.getFullYear(), 0, 1);
  return date;
}

function aggregateRows(level) {
  const groups = new Map();

  for (const row of rawRows) {
    const key = dateKey(row.date, level);
    if (!groups.has(key)) {
      groups.set(key, {
        date: key,
        sortDate: sortDateFor(row.date, level),
        revenue: 0,
        dauSet: new Set(),
        puSet: new Set(),
      });
    }

    const group = groups.get(key);
    group.revenue += row.revenue;

    // Demo 用假 ID 表示「區間排重」概念。
    // 正式系統請用真實 player_id / member_id 在該時間區間排重。
    for (let i = 0; i < row.dau; i += 1) {
      group.dauSet.add(`D${(row.index * 83 + i) % 520}`);
    }
    for (let i = 0; i < row.pu; i += 1) {
      group.puSet.add(`P${(row.index * 29 + i) % 145}`);
    }
  }

  return [...groups.values()]
    .sort((a, b) => a.sortDate - b.sortDate)
    .map((group) => ({
      date: group.date,
      revenue: group.revenue,
      dau: group.dauSet.size,
      pu: group.puSet.size,
      payrate: group.puSet.size / group.dauSet.size,
    }));
}

function App() {
  const [level, setLevel] = useState('week');
  const levelIndex = levels.indexOf(level);
  const rows = useMemo(() => aggregateRows(level), [level]);
  const total = rows.reduce(
    (acc, row) => ({
      revenue: acc.revenue + row.revenue,
      dau: acc.dau + row.dau,
      pu: acc.pu + row.pu,
    }),
    { revenue: 0, dau: 0, pu: 0 },
  );
  const totalPayrate = total.pu / total.dau;

  const drillUp = () => {
    if (levelIndex > 0) setLevel(levels[levelIndex - 1]);
  };
  const drillDown = () => {
    if (levelIndex < levels.length - 1) setLevel(levels[levelIndex + 1]);
  };

  return (
    <main className="page">
      <section className="card intro">
        <div>
          <p className="eyebrow">Xinluck Operations Mockup</p>
          <h1>日期欄位 + / - 上探下鑽</h1>
          <p className="summary">
            同一張營運報表透過日期欄位標題切換時間粒度。清單內週日期只顯示該週週一，
            例如 <strong>5/11</strong>，不顯示完整週區間。
          </p>
        </div>
        <div className="ruleBox">
          <strong>操作規則</strong>
          <span>+ 往更細：年 &gt; 月 &gt; 週 &gt; 日</span>
          <span>- 往更粗：日 &gt; 週 &gt; 月 &gt; 年</span>
        </div>
      </section>

      <section className="card">
        <div className="levelPath">
          {levels.map((item, index) => (
            <React.Fragment key={item}>
              <span className={`pill ${item === level ? 'active' : ''}`}>{levelName[item]}</span>
              {index < levels.length - 1 && <span className="arrow">&gt;</span>}
            </React.Fragment>
          ))}
          <span className="hint">目前：日期（{levelName[level]}）</span>
        </div>

        <div className="kpis">
          <div className="kpi">
            <span>Revenue</span>
            <b>{formatNumber(total.revenue)}</b>
            <small>金額類：加總</small>
          </div>
          <div className="kpi">
            <span>DAU</span>
            <b>{formatNumber(total.dau)}</b>
            <small>人數類：區間排重</small>
          </div>
          <div className="kpi">
            <span>PU</span>
            <b>{formatNumber(total.pu)}</b>
            <small>人數類：區間排重</small>
          </div>
          <div className="kpi">
            <span>Payrate</span>
            <b>{(totalPayrate * 100).toFixed(1)}%</b>
            <small>比例類：PU / DAU 重算</small>
          </div>
        </div>
      </section>

      <section className="card tableCard">
        <table>
          <thead>
            <tr>
              <th>
                <div className="dateHeader">
                  <button onClick={drillUp} disabled={levelIndex === 0} title="上探：切到更粗時間粒度">
                    -
                  </button>
                  <span>日期（{levelName[level]}）</span>
                  <button onClick={drillDown} disabled={levelIndex === levels.length - 1} title="下鑽：切到更細時間粒度">
                    +
                  </button>
                </div>
              </th>
              <th>Revenue<br /><small>加總</small></th>
              <th>DAU<br /><small>區間排重</small></th>
              <th>PU<br /><small>區間排重</small></th>
              <th>Payrate<br /><small>PU / DAU 重算</small></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.date}>
                <td>{row.date}</td>
                <td>{formatNumber(row.revenue)}</td>
                <td>{formatNumber(row.dau)}</td>
                <td>{formatNumber(row.pu)}</td>
                <td>{(row.payrate * 100).toFixed(1)}%</td>
              </tr>
            ))}
            <tr className="totalRow">
              <th>總計 / 重算</th>
              <th>{formatNumber(total.revenue)}</th>
              <th>{formatNumber(total.dau)}</th>
              <th>{formatNumber(total.pu)}</th>
              <th>{(totalPayrate * 100).toFixed(1)}%</th>
            </tr>
          </tbody>
        </table>

        <div className="specNote">
          <strong>清單日期顯示規格：</strong>
          <span>日：5/1</span>
          <span>週：5/11（代表該週週一）</span>
          <span>月：5月</span>
          <span>年：2026年</span>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
