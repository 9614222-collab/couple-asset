import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBmmfgt8PNp7L6nuJP6WxI-evyLxw8i9Jg",
  authDomain: "couple-asset.firebaseapp.com",
  projectId: "couple-asset",
  storageBucket: "couple-asset.firebasestorage.app",
  messagingSenderId: "309204837184",
  appId: "1:309204837184:web:a767922ab2e49e479590a5",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const DOC_REF = doc(db, "asset", "main");

const PALETTE = [
  "#6C63FF",
  "#48C9A9",
  "#F4A261",
  "#E76F8A",
  "#3B82F6",
  "#F59E0B",
  "#10B981",
  "#8B5CF6",
];
const TYPES = ["은행", "증권", "부동산", "현금", "기타"];

const fmt = (n) => "₩" + Math.round(n).toLocaleString("ko-KR");
const monthLabel = (m) => m.slice(2, 4) + "년 " + parseInt(m.slice(5)) + "월";

const EMPTY_INIT = {
  wife: { name: "아내", accounts: [] },
  husband: { name: "남편", accounts: [] },
  history: [],
  goal: 100000000,
  dividends: [],
};

const Card = ({ style, children }) => (
  <div
    style={{
      background: "var(--color-background-primary)",
      border: "0.5px solid var(--color-border-tertiary)",
      borderRadius: 16,
      padding: "18px 20px",
      ...style,
    }}
  >
    {children}
  </div>
);
const Label = ({ children, style }) => (
  <p
    style={{
      margin: 0,
      fontSize: 12,
      color: "var(--color-text-tertiary)",
      letterSpacing: "0.04em",
      ...style,
    }}
  >
    {children}
  </p>
);

const LineChart = ({ history, goal }) => {
  if (history.length < 2)
    return (
      <div
        style={{
          height: 160,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-text-tertiary)",
          fontSize: 13,
        }}
      >
        기록이 2개 이상이면 그래프가 표시돼요
      </div>
    );
  const W = 520,
    H = 180,
    PL = 60,
    PR = 16,
    PT = 12,
    PB = 32;
  const cW = W - PL - PR,
    cH = H - PT - PB;
  const vals = history.map((h) => h.wife + h.husband);
  const allVals = [
    ...history.map((h) => h.wife),
    ...history.map((h) => h.husband),
    ...vals,
    goal,
  ];
  const minV = Math.min(...allVals) * 0.92,
    maxV = Math.max(...allVals, goal) * 1.08;
  const xPos = (i) => PL + (i / (history.length - 1)) * cW;
  const yPos = (v) => PT + cH - ((v - minV) / (maxV - minV)) * cH;
  const line = (arr, color, dash = "") => {
    const d = arr
      .map(
        (v, i) =>
          `${i === 0 ? "M" : "L"}${xPos(i).toFixed(1)},${yPos(v).toFixed(1)}`
      )
      .join(" ");
    return (
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeDasharray={dash}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  };
  const area = (arr, color) => {
    const d =
      arr
        .map(
          (v, i) =>
            `${i === 0 ? "M" : "L"}${xPos(i).toFixed(1)},${yPos(v).toFixed(1)}`
        )
        .join(" ") +
      ` L${xPos(arr.length - 1).toFixed(1)},${(PT + cH).toFixed(1)} L${PL},${(
        PT + cH
      ).toFixed(1)} Z`;
    return <path d={d} fill={color} opacity="0.07" />;
  };
  const fmtShort = (v) =>
    v >= 100000000
      ? (v / 100000000).toFixed(1) + "억"
      : v >= 10000000
      ? (v / 10000000).toFixed(0) + "천만"
      : v >= 10000
      ? (v / 10000).toFixed(0) + "만"
      : "0";
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
        const v = minV + (maxV - minV) * t;
        const y = yPos(v);
        return (
          <g key={i}>
            <line
              x1={PL}
              y1={y}
              x2={W - PR}
              y2={y}
              stroke="rgba(128,128,128,0.1)"
              strokeWidth="1"
            />
            <text
              x={PL - 6}
              y={y + 4}
              textAnchor="end"
              fontSize="9"
              fill="rgba(128,128,128,0.7)"
            >
              {fmtShort(v)}
            </text>
          </g>
        );
      })}
      {area(
        history.map((h) => h.wife),
        "#6C63FF"
      )}
      {area(
        history.map((h) => h.husband),
        "#F4A261"
      )}
      {line(
        history.map(() => goal),
        "rgba(180,180,180,0.5)",
        "6,4"
      )}
      {line(vals, "#10B981", "4,3")}
      {line(
        history.map((h) => h.wife),
        "#6C63FF"
      )}
      {line(
        history.map((h) => h.husband),
        "#F4A261"
      )}
      {history.map((h, i) => [
        <circle
          key={"w" + i}
          cx={xPos(i)}
          cy={yPos(h.wife)}
          r="3.5"
          fill="#6C63FF"
        />,
        <circle
          key={"h" + i}
          cx={xPos(i)}
          cy={yPos(h.husband)}
          r="3.5"
          fill="#F4A261"
        />,
        <circle
          key={"t" + i}
          cx={xPos(i)}
          cy={yPos(h.wife + h.husband)}
          r="3"
          fill="#10B981"
        />,
        <text
          key={"l" + i}
          x={xPos(i)}
          y={H - 4}
          textAnchor="middle"
          fontSize="9"
          fill="rgba(128,128,128,0.7)"
        >
          {monthLabel(h.month).slice(-3)}
        </text>,
      ])}
    </svg>
  );
};

const BarChart = ({ history }) => {
  if (history.length < 2)
    return (
      <div
        style={{
          height: 120,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-text-tertiary)",
          fontSize: 13,
        }}
      >
        기록이 2개 이상이면 표시돼요
      </div>
    );
  const W = 520,
    H = 140,
    PL = 44,
    PR = 16,
    PT = 16,
    PB = 28;
  const cW = W - PL - PR,
    cH = H - PT - PB;
  const rates = history
    .map((h, i) => {
      if (i === 0) return null;
      const prev = history[i - 1].wife + history[i - 1].husband;
      const cur = h.wife + h.husband;
      return prev > 0
        ? parseFloat((((cur - prev) / prev) * 100).toFixed(1))
        : 0;
    })
    .filter((r) => r !== null);
  const labels = history.slice(1).map((h) => monthLabel(h.month).slice(-3));
  const maxAbs = Math.max(...rates.map(Math.abs), 0.5) * 1.4;
  const barW = Math.min((cW / rates.length) * 0.5, 36);
  const xPos = (i) => PL + (i + 0.5) * (cW / rates.length);
  const zeroY = PT + cH / 2;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
      <line
        x1={PL}
        y1={zeroY}
        x2={W - PR}
        y2={zeroY}
        stroke="rgba(128,128,128,0.25)"
        strokeWidth="1"
      />
      {rates.map((r, i) => {
        const bH = (Math.abs(r) / maxAbs) * (cH / 2);
        const y = r >= 0 ? zeroY - bH : zeroY;
        return (
          <g key={i}>
            <rect
              x={xPos(i) - barW / 2}
              y={y}
              width={barW}
              height={bH}
              fill={r >= 0 ? "rgba(16,185,129,0.75)" : "rgba(239,68,68,0.7)"}
              rx="3"
            />
            <text
              x={xPos(i)}
              y={r >= 0 ? y - 3 : y + bH + 10}
              textAnchor="middle"
              fontSize="9"
              fill={r >= 0 ? "#10B981" : "#EF4444"}
            >
              {r > 0 ? "+" : ""}
              {r}%
            </text>
            <text
              x={xPos(i)}
              y={H - 4}
              textAnchor="middle"
              fontSize="9"
              fill="rgba(128,128,128,0.7)"
            >
              {labels[i]}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

const DividendTab = ({ data, setData }) => {
  const [form, setForm] = useState({
    name: "",
    shares: "",
    price: "",
    divPerShare: "",
    frequency: "연 1회",
  });
  const [showAdd, setShowAdd] = useState(false);
  const [editDivId, setEditDivId] = useState(null);
  const FREQ = ["연 1회", "연 2회", "연 4회(분기)", "연 12회(월배당)"];
  const freqNum = {
    "연 1회": 1,
    "연 2회": 2,
    "연 4회(분기)": 4,
    "연 12회(월배당)": 12,
  };
  const monthlyDiv = (d) =>
    (d.shares * d.divPerShare * freqNum[d.frequency]) / 12;
  const totalMonthly = (data.dividends || []).reduce(
    (s, d) => s + monthlyDiv(d),
    0
  );
  const TARGET = 1000000;
  const progress = Math.min((totalMonthly / TARGET) * 100, 100);
  const remaining = Math.max(TARGET - totalMonthly, 0);
  const avgYield =
    (data.dividends || []).length > 0
      ? (data.dividends || []).reduce(
          (s, d) =>
            s +
            (d.price > 0
              ? ((d.divPerShare * freqNum[d.frequency]) / d.price) * 100
              : 0),
          0
        ) / (data.dividends || []).length
      : 3;
  const needInvest =
    remaining > 0 && avgYield > 0 ? ((remaining * 12) / avgYield) * 100 : 0;
  const addDiv = () => {
    const sh = parseFloat(form.shares),
      pr = parseFloat(form.price),
      dp = parseFloat(form.divPerShare);
    if (!form.name || isNaN(sh) || isNaN(dp)) return;
    if (editDivId) {
      setData((d) => ({
        ...d,
        dividends: (d.dividends || []).map((x) =>
          x.id === editDivId
            ? { ...x, ...form, shares: sh, price: pr || 0, divPerShare: dp }
            : x
        ),
      }));
    } else {
      setData((d) => ({
        ...d,
        dividends: [
          ...(d.dividends || []),
          {
            id: Date.now(),
            ...form,
            shares: sh,
            price: pr || 0,
            divPerShare: dp,
          },
        ],
      }));
    }
    setForm({
      name: "",
      shares: "",
      price: "",
      divPerShare: "",
      frequency: "연 1회",
    });
    setEditDivId(null);
    setShowAdd(false);
  };
  const delDiv = (id) =>
    setData((d) => ({
      ...d,
      dividends: (d.dividends || []).filter((x) => x.id !== id),
    }));
  return (
    <div>
      <div
        style={{
          background: "linear-gradient(135deg,#10B981 0%,#3B82F6 100%)",
          borderRadius: 20,
          padding: "20px 22px",
          marginBottom: 14,
          color: "#fff",
        }}
      >
        <p style={{ margin: "0 0 2px", fontSize: 12, opacity: 0.8 }}>
          월 배당금 목표
        </p>
        <p style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 500 }}>
          ₩1,000,000
        </p>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 14,
          }}
        >
          <div>
            <p style={{ margin: "0 0 2px", fontSize: 11, opacity: 0.7 }}>
              현재 월 배당금
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 500,
                color: totalMonthly >= TARGET ? "#a7f3d0" : "#fff",
              }}
            >
              {fmt(Math.round(totalMonthly))}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: "0 0 2px", fontSize: 11, opacity: 0.7 }}>
              목표까지 부족
            </p>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 500 }}>
              {fmt(Math.round(remaining))}
            </p>
          </div>
        </div>
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 11,
              opacity: 0.8,
              marginBottom: 5,
            }}
          >
            <span>달성률</span>
            <span>{progress.toFixed(1)}%</span>
          </div>
          <div
            style={{
              background: "rgba(255,255,255,0.25)",
              borderRadius: 99,
              height: 8,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "#fff",
                borderRadius: 99,
                transition: "width 0.5s",
              }}
            />
          </div>
        </div>
      </div>
      {remaining > 0 && (
        <Card style={{ marginBottom: 12, background: "rgba(59,130,246,0.05)" }}>
          <p
            style={{
              margin: "0 0 4px",
              fontSize: 12,
              color: "var(--color-text-tertiary)",
            }}
          >
            목표 달성을 위한 추가 투자 예상액
          </p>
          <p
            style={{
              margin: "0 0 4px",
              fontSize: 20,
              fontWeight: 500,
              color: "#3B82F6",
            }}
          >
            {fmt(Math.round(needInvest))}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 11,
              color: "var(--color-text-tertiary)",
            }}
          >
            평균 배당수익률 {avgYield.toFixed(1)}% 기준 추정치
          </p>
        </Card>
      )}
      <Card style={{ marginBottom: 12 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <Label>보유 배당주</Label>
          <button
            onClick={() => setShowAdd(true)}
            style={{
              border: "none",
              background: "#6C63FF",
              color: "#fff",
              borderRadius: 8,
              padding: "5px 12px",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            + 추가
          </button>
        </div>
        {(data.dividends || []).length === 0 && (
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: "var(--color-text-tertiary)",
              textAlign: "center",
              padding: "20px 0",
            }}
          >
            보유 배당주를 추가해보세요
          </p>
        )}
        {(data.dividends || []).map((d, i) => {
          const monthly = monthlyDiv(d);
          const annual = monthly * 12;
          const yld =
            d.price > 0
              ? ((d.divPerShare * freqNum[d.frequency]) / d.price) * 100
              : 0;
          return (
            <div
              key={d.id}
              style={{
                padding: "10px 0",
                borderBottom: "0.5px solid var(--color-border-tertiary)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: PALETTE[i % PALETTE.length] + "22",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 2,
                        background: PALETTE[i % PALETTE.length],
                      }}
                    />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>
                      {d.name}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 11,
                        color: "var(--color-text-tertiary)",
                      }}
                    >
                      {d.shares.toLocaleString()}주 · {d.frequency}
                      {d.price > 0 ? ` · 수익률 ${yld.toFixed(1)}%` : ""}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 14,
                      fontWeight: 500,
                      color: "#10B981",
                    }}
                  >
                    월 {fmt(Math.round(monthly))}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 11,
                      color: "var(--color-text-tertiary)",
                    }}
                  >
                    연 {fmt(Math.round(annual))}
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <button
                  onClick={() => {
                    setForm({
                      name: d.name,
                      shares: String(d.shares),
                      price: String(d.price),
                      divPerShare: String(d.divPerShare),
                      frequency: d.frequency,
                    });
                    setEditDivId(d.id);
                    setShowAdd(true);
                  }}
                  style={{
                    border: "0.5px solid var(--color-border-secondary)",
                    background: "none",
                    borderRadius: 6,
                    padding: "3px 10px",
                    cursor: "pointer",
                    fontSize: 11,
                    color: "var(--color-text-secondary)",
                  }}
                >
                  수정
                </button>
                <button
                  onClick={() => delDiv(d.id)}
                  style={{
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    fontSize: 11,
                    color: "var(--color-text-tertiary)",
                    padding: 0,
                  }}
                >
                  삭제
                </button>
              </div>
            </div>
          );
        })}
        {(data.dividends || []).length > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: 12,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 500 }}>합계</span>
            <div style={{ textAlign: "right" }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 15,
                  fontWeight: 500,
                  color: "#10B981",
                }}
              >
                월 {fmt(Math.round(totalMonthly))}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: "var(--color-text-tertiary)",
                }}
              >
                연 {fmt(Math.round(totalMonthly * 12))}
              </p>
            </div>
          </div>
        )}
      </Card>
      {showAdd && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
          }}
        >
          <div
            style={{
              background: "var(--color-background-primary)",
              borderRadius: 20,
              padding: 24,
              width: "88%",
              maxWidth: 360,
            }}
          >
            <p style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 500 }}>
              배당주 추가
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input
                placeholder="종목명 (예: 삼성전자, SCHD)"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                style={{ fontSize: 14 }}
              />
              <input
                placeholder="보유 주수"
                value={form.shares}
                onChange={(e) =>
                  setForm((f) => ({ ...f, shares: e.target.value }))
                }
                type="number"
                style={{ fontSize: 14 }}
              />
              <input
                placeholder="주당 배당금 (원)"
                value={form.divPerShare}
                onChange={(e) =>
                  setForm((f) => ({ ...f, divPerShare: e.target.value }))
                }
                type="number"
                style={{ fontSize: 14 }}
              />
              <input
                placeholder="현재 주가 (선택, 배당수익률 계산용)"
                value={form.price}
                onChange={(e) =>
                  setForm((f) => ({ ...f, price: e.target.value }))
                }
                type="number"
                style={{ fontSize: 14 }}
              />
              <select
                value={form.frequency}
                onChange={(e) =>
                  setForm((f) => ({ ...f, frequency: e.target.value }))
                }
                style={{ fontSize: 14 }}
              >
                {FREQ.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              <button
                onClick={() => setShowAdd(false)}
                style={{
                  flex: 1,
                  padding: 11,
                  borderRadius: 10,
                  border: "0.5px solid var(--color-border-secondary)",
                  background: "none",
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                취소
              </button>
              <button
                onClick={addDiv}
                style={{
                  flex: 2,
                  padding: 11,
                  borderRadius: 10,
                  border: "none",
                  background: "#10B981",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                추가하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [locked, setLocked] = useState(true);
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const [data, setDataState] = useState(EMPTY_INIT);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncOk, setSyncOk] = useState(false);
  const [tab, setTab] = useState("summary");
  const [who, setWho] = useState("wife");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({
    name: "",
    type: "은행",
    amount: "",
    color: PALETTE[0],
  });
  const [goalEdit, setGoalEdit] = useState(false);
  const [goalStr, setGoalStr] = useState("");
  const [recorded, setRecorded] = useState(false);

  const CORRECT = "2879";
  const tryPin = (p) => {
    if (p === CORRECT) {
      setLocked(false);
      setPin("");
    } else if (p.length === 4) {
      setShake(true);
      setTimeout(() => {
        setShake(false);
        setPin("");
      }, 500);
    }
  };
  const pressKey = (k) => {
    if (k === "del") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    const next = pin + k;
    setPin(next);
    if (next.length === 4) setTimeout(() => tryPin(next), 80);
  };

  // Firebase 실시간 연동
  useEffect(() => {
    const unsub = onSnapshot(
      DOC_REF,
      (snap) => {
        if (snap.exists()) {
          setDataState(snap.data());
        } else {
          setDataState(EMPTY_INIT);
        }
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const setData = async (updater) => {
    const next = typeof updater === "function" ? updater(data) : updater;
    setDataState(next);
    setSyncing(true);
    try {
      await setDoc(DOC_REF, next);
      setSyncOk(true);
      setTimeout(() => setSyncOk(false), 1500);
    } catch (e) {
      console.error(e);
    }
    setSyncing(false);
  };

  const wifeTotal = data.wife.accounts.reduce((s, a) => s + a.amount, 0);
  const husbandTotal = data.husband.accounts.reduce((s, a) => s + a.amount, 0);
  const grandTotal = wifeTotal + husbandTotal;
  const progress = Math.min((grandTotal / data.goal) * 100, 100);
  const lastTwo = data.history.slice(-2);
  const growthRate =
    lastTwo.length === 2
      ? ((lastTwo[1].wife +
          lastTwo[1].husband -
          (lastTwo[0].wife + lastTwo[0].husband)) /
          (lastTwo[0].wife + lastTwo[0].husband)) *
        100
      : 0;

  const parseGoal = (str) => {
    let v = str.replace(/[^0-9.억만]/g, ""),
      n = 0;
    if (v.includes("억")) {
      const p = v.split("억");
      n += parseFloat(p[0] || 0) * 100000000;
      if (p[1]) n += parseFloat(p[1].replace("만", "") || 0) * 10000;
    } else if (v.includes("만"))
      n = parseFloat(v.replace("만", "") || 0) * 10000;
    else n = parseFloat(v || 0);
    return n > 0 ? n : data.goal;
  };

  const recordMonth = () => {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
    setData((d) => {
      const hist = [...d.history];
      const idx = hist.findIndex((h) => h.month === month);
      const entry = { month, wife: wifeTotal, husband: husbandTotal };
      if (idx >= 0) hist[idx] = entry;
      else hist.push(entry);
      return {
        ...d,
        history: hist.sort((a, b) => a.month.localeCompare(b.month)),
      };
    });
    setRecorded(true);
    setTimeout(() => setRecorded(false), 2500);
  };

  const openAdd = () => {
    setForm({
      name: "",
      type: "은행",
      amount: "",
      color: PALETTE[data[who].accounts.length % PALETTE.length],
    });
    setModal("add");
  };
  const openEdit = (acc) => {
    setForm({
      name: acc.name,
      type: acc.type,
      amount: String(acc.amount),
      color: acc.color,
    });
    setModal({ type: "edit", id: acc.id });
  };
  const saveAcc = () => {
    const amt = parseInt(String(form.amount).replace(/,/g, ""));
    if (!form.name || isNaN(amt)) return;
    setData((d) => {
      const accs =
        modal === "add"
          ? [...d[who].accounts, { id: Date.now(), ...form, amount: amt }]
          : d[who].accounts.map((a) =>
              a.id === modal.id ? { ...a, ...form, amount: amt } : a
            );
      return { ...d, [who]: { ...d[who], accounts: accs } };
    });
    setModal(null);
  };
  const delAcc = (w, id) =>
    setData((d) => ({
      ...d,
      [w]: { ...d[w], accounts: d[w].accounts.filter((a) => a.id !== id) },
    }));

  const TABS = [
    { k: "summary", l: "요약" },
    { k: "accounts", l: "계좌" },
    { k: "chart", l: "그래프" },
    { k: "dividend", l: "배당 💚" },
  ];

  if (loading)
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 16,
            background: "linear-gradient(135deg,#6C63FF,#48C9A9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
          }}
        >
          💰
        </div>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            color: "var(--color-text-secondary)",
          }}
        >
          데이터 불러오는 중...
        </p>
      </div>
    );

  if (locked)
    return (
      <div
        style={{
          fontFamily: "var(--font-sans)",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div style={{ marginBottom: 32, textAlign: "center" }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              background: "linear-gradient(135deg,#6C63FF,#48C9A9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              fontSize: 28,
            }}
          >
            💰
          </div>
          <p
            style={{
              margin: "0 0 4px",
              fontSize: 20,
              fontWeight: 500,
              color: "var(--color-text-primary)",
            }}
          >
            우리 가족 자산
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: "var(--color-text-tertiary)",
            }}
          >
            PIN 4자리를 입력하세요
          </p>
        </div>
        <div
          style={{
            display: "flex",
            gap: 16,
            marginBottom: 40,
            animation: shake ? "shake 0.4s ease" : "none",
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                background:
                  pin.length > i
                    ? "#6C63FF"
                    : "var(--color-background-secondary)",
                border: "1.5px solid",
                borderColor:
                  pin.length > i ? "#6C63FF" : "var(--color-border-secondary)",
                transition: "background 0.15s",
              }}
            />
          ))}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,72px)",
            gap: 12,
          }}
        >
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"].map(
            (k, i) =>
              k === "" ? (
                <div key={i} />
              ) : (
                <button
                  key={i}
                  onClick={() => pressKey(k)}
                  style={{
                    height: 72,
                    borderRadius: 16,
                    border: "0.5px solid var(--color-border-tertiary)",
                    background: "var(--color-background-primary)",
                    cursor: "pointer",
                    fontSize: k === "del" ? 18 : 22,
                    fontWeight: k === "del" ? 400 : 500,
                    color: "var(--color-text-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                  }}
                >
                  {k === "del" ? "⌫" : k}
                </button>
              )
          )}
        </div>
        <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}`}</style>
      </div>
    );

  return (
    <div
      style={{
        fontFamily: "var(--font-sans)",
        maxWidth: 560,
        margin: "0 auto",
        padding: "20px 14px",
      }}
    >
      {/* 동기화 상태 */}
      <div style={{ position: "fixed", top: 16, right: 16, zIndex: 999 }}>
        {syncing && (
          <div
            style={{
              background: "#F59E0B",
              color: "#fff",
              padding: "8px 14px",
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            ☁️ 저장 중...
          </div>
        )}
        {syncOk && (
          <div
            style={{
              background: "#10B981",
              color: "#fff",
              padding: "8px 14px",
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            ✓ 클라우드 저장됨
          </div>
        )}
      </div>
      {recorded && (
        <div
          style={{
            position: "fixed",
            top: 56,
            right: 16,
            background: "#6C63FF",
            color: "#fff",
            padding: "12px 18px",
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 500,
            zIndex: 999,
            lineHeight: 1.6,
          }}
        >
          📅 이번 달 기록 완료!
          <br />
          <span style={{ fontSize: 11, opacity: 0.9 }}>
            아내 {fmt(wifeTotal)}
            <br />
            남편 {fmt(husbandTotal)}
            <br />
            합계 {fmt(grandTotal)}
          </span>
        </div>
      )}

      {/* Hero */}
      <div
        style={{
          background: "linear-gradient(135deg,#6C63FF 0%,#48C9A9 100%)",
          borderRadius: 20,
          padding: "22px 22px 18px",
          marginBottom: 14,
          color: "#fff",
        }}
      >
        <p style={{ margin: "0 0 2px", fontSize: 12, opacity: 0.8 }}>
          우리 가족 총 자산
        </p>
        <p style={{ margin: "0 0 14px", fontSize: 28, fontWeight: 500 }}>
          {fmt(grandTotal)}
        </p>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <div>
            <p style={{ margin: "0 0 2px", fontSize: 11, opacity: 0.7 }}>
              이번 달 성장률
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 17,
                fontWeight: 500,
                color: growthRate >= 0 ? "#a7f3d0" : "#fca5a5",
              }}
            >
              {growthRate >= 0 ? "+" : ""}
              {growthRate.toFixed(1)}%
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            {goalEdit ? (
              <input
                autoFocus
                value={goalStr}
                onChange={(e) => setGoalStr(e.target.value)}
                onBlur={() => {
                  setData((d) => ({ ...d, goal: parseGoal(goalStr) }));
                  setGoalEdit(false);
                }}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  (setData((d) => ({ ...d, goal: parseGoal(goalStr) })),
                  setGoalEdit(false))
                }
                style={{
                  width: 110,
                  fontSize: 13,
                  padding: "4px 8px",
                  borderRadius: 8,
                  border: "none",
                  background: "rgba(255,255,255,0.2)",
                  color: "#fff",
                  outline: "none",
                }}
                placeholder="예: 2억"
              />
            ) : (
              <div
                onClick={() => {
                  setGoalEdit(true);
                  setGoalStr(fmt(data.goal));
                }}
                style={{ cursor: "pointer" }}
              >
                <p style={{ margin: "0 0 2px", fontSize: 11, opacity: 0.7 }}>
                  목표 (탭하여 수정)
                </p>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>
                  {fmt(data.goal)}
                </p>
              </div>
            )}
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 11,
              opacity: 0.8,
              marginBottom: 5,
            }}
          >
            <span>목표 달성률</span>
            <span>{progress.toFixed(1)}%</span>
          </div>
          <div
            style={{
              background: "rgba(255,255,255,0.25)",
              borderRadius: 99,
              height: 6,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "#fff",
                borderRadius: 99,
                transition: "width 0.5s",
              }}
            />
          </div>
        </div>
      </div>

      {/* Tab */}
      <div
        style={{
          display: "flex",
          gap: 3,
          marginBottom: 14,
          background: "var(--color-background-secondary)",
          borderRadius: 12,
          padding: 3,
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            style={{
              flex: 1,
              padding: "7px 0",
              border: "none",
              borderRadius: 9,
              cursor: "pointer",
              fontSize: 11,
              fontWeight: tab === t.k ? 500 : 400,
              background:
                tab === t.k ? "var(--color-background-primary)" : "transparent",
              color:
                tab === t.k
                  ? "var(--color-text-primary)"
                  : "var(--color-text-secondary)",
              transition: "all 0.15s",
            }}
          >
            {t.l}
          </button>
        ))}
      </div>

      {/* Summary */}
      {tab === "summary" && (
        <div>
          <Card style={{ marginBottom: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
              {[
                ["wife", "👩", "#6C63FF"],
                ["husband", "👨", "#F4A261"],
              ].map(([k, emoji, color]) => {
                const tot = data[k].accounts.reduce((s, a) => s + a.amount, 0);
                const ratio = grandTotal > 0 ? (tot / grandTotal) * 100 : 0;
                return (
                  <div
                    key={k}
                    style={{
                      padding: "0 12px",
                      borderRight:
                        k === "wife"
                          ? "0.5px solid var(--color-border-tertiary)"
                          : "none",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 10,
                      }}
                    >
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: "50%",
                          background: color + "22",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 15,
                        }}
                      >
                        {emoji}
                      </div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>
                        {data[k].name}
                      </p>
                    </div>
                    <p
                      style={{
                        margin: "0 0 4px",
                        fontSize: 16,
                        fontWeight: 500,
                        color,
                      }}
                    >
                      {fmt(tot)}
                    </p>
                    <p
                      style={{
                        margin: "0 0 6px",
                        fontSize: 11,
                        color: "var(--color-text-tertiary)",
                      }}
                    >
                      {ratio.toFixed(1)}%
                    </p>
                    <div
                      style={{
                        height: 4,
                        borderRadius: 99,
                        background: "var(--color-background-secondary)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${ratio}%`,
                          height: "100%",
                          borderRadius: 99,
                          background: color,
                        }}
                      />
                    </div>
                    <div
                      style={{
                        marginTop: 10,
                        display: "flex",
                        flexDirection: "column",
                        gap: 5,
                      }}
                    >
                      {data[k].accounts.map((a) => (
                        <div
                          key={a.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "5px 8px",
                            background: "var(--color-background-secondary)",
                            borderRadius: 8,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <div
                              style={{
                                width: 7,
                                height: 7,
                                borderRadius: 2,
                                background: a.color,
                              }}
                            />
                            <span style={{ fontSize: 11 }}>{a.name}</span>
                          </div>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 500,
                              color: "var(--color-text-secondary)",
                            }}
                          >
                            {fmt(a.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card style={{ marginBottom: 12 }}>
            <Label style={{ marginBottom: 12 }}>유형별 합계</Label>
            {TYPES.map((type) => {
              const amt = [...data.wife.accounts, ...data.husband.accounts]
                .filter((a) => a.type === type)
                .reduce((s, a) => s + a.amount, 0);
              if (!amt) return null;
              return (
                <div
                  key={type}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 0",
                    borderBottom: "0.5px solid var(--color-border-tertiary)",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        color: "var(--color-text-secondary)",
                        minWidth: 36,
                      }}
                    >
                      {type}
                    </span>
                    <div
                      style={{
                        height: 4,
                        borderRadius: 99,
                        background: "var(--color-background-secondary)",
                        width: 80,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${
                            grandTotal > 0 ? (amt / grandTotal) * 100 : 0
                          }%`,
                          background: "#6C63FF",
                          borderRadius: 99,
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--color-text-tertiary)",
                      }}
                    >
                      {grandTotal > 0
                        ? ((amt / grandTotal) * 100).toFixed(0)
                        : 0}
                      %
                    </span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>
                    {fmt(amt)}
                  </span>
                </div>
              );
            })}
          </Card>
          <button
            onClick={recordMonth}
            style={{
              width: "100%",
              padding: 13,
              borderRadius: 12,
              border: "none",
              background: "#6C63FF",
              color: "#fff",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 500,
              marginBottom: 8,
            }}
          >
            이번 달 자산 기록하기
          </button>
          <button
            onClick={() => {
              if (window.confirm("기록 내역을 모두 삭제할까요?")) {
                setData((d) => ({ ...d, history: [] }));
              }
            }}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 12,
              border: "1px dashed #EF4444",
              background: "transparent",
              cursor: "pointer",
              fontSize: 13,
              color: "#EF4444",
            }}
          >
            🗑 기록 내역 전체 삭제
          </button>
        </div>
      )}

      {/* Accounts */}
      {tab === "accounts" && (
        <div>
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {[
              ["wife", "👩 아내"],
              ["husband", "👨 남편"],
            ].map(([k, l]) => (
              <button
                key={k}
                onClick={() => setWho(k)}
                style={{
                  flex: 1,
                  padding: "9px 0",
                  border: `1.5px solid ${
                    who === k
                      ? k === "wife"
                        ? "#6C63FF"
                        : "#F4A261"
                      : "var(--color-border-tertiary)"
                  }`,
                  borderRadius: 10,
                  cursor: "pointer",
                  background:
                    who === k
                      ? k === "wife"
                        ? "rgba(108,99,255,0.08)"
                        : "rgba(244,162,97,0.08)"
                      : "transparent",
                  color:
                    who === k
                      ? k === "wife"
                        ? "#6C63FF"
                        : "#F4A261"
                      : "var(--color-text-secondary)",
                  fontWeight: who === k ? 500 : 400,
                  fontSize: 13,
                }}
              >
                {l}
              </button>
            ))}
          </div>
          <p
            style={{
              margin: "0 0 10px",
              fontSize: 13,
              color: "var(--color-text-secondary)",
            }}
          >
            {data[who].name} 총 자산:{" "}
            <strong>
              {fmt(data[who].accounts.reduce((s, a) => s + a.amount, 0))}
            </strong>
          </p>
          {data[who].accounts.map((a) => (
            <div
              key={a.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "var(--color-background-primary)",
                border: "0.5px solid var(--color-border-tertiary)",
                borderRadius: 12,
                padding: "13px 16px",
                marginBottom: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: a.color + "22",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 3,
                      background: a.color,
                    }}
                  />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>
                    {a.name}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 11,
                      color: "var(--color-text-tertiary)",
                    }}
                  >
                    {a.type}
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 500 }}>
                  {fmt(a.amount)}
                </span>
                <button
                  onClick={() => openEdit(a)}
                  style={{
                    border: "0.5px solid var(--color-border-secondary)",
                    background: "none",
                    borderRadius: 7,
                    padding: "4px 10px",
                    cursor: "pointer",
                    fontSize: 12,
                    color: "var(--color-text-secondary)",
                  }}
                >
                  수정
                </button>
                <button
                  onClick={() => delAcc(who, a.id)}
                  style={{
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    fontSize: 18,
                    color: "var(--color-text-tertiary)",
                    padding: "0 2px",
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={openAdd}
            style={{
              width: "100%",
              padding: 13,
              borderRadius: 12,
              border: `1px dashed ${who === "wife" ? "#6C63FF" : "#F4A261"}`,
              background: "transparent",
              cursor: "pointer",
              fontSize: 14,
              color: who === "wife" ? "#6C63FF" : "#F4A261",
              fontWeight: 500,
              marginTop: 4,
            }}
          >
            + {data[who].name} 계좌 추가
          </button>
        </div>
      )}

      {/* Chart */}
      {tab === "chart" && (
        <div>
          <div
            style={{
              display: "flex",
              gap: 12,
              marginBottom: 10,
              fontSize: 12,
              color: "var(--color-text-secondary)",
              flexWrap: "wrap",
            }}
          >
            {[
              ["아내", "#6C63FF"],
              ["남편", "#F4A261"],
              ["합계", "#10B981"],
              ["목표", "#aaa"],
            ].map(([l, c]) => (
              <span
                key={l}
                style={{ display: "flex", alignItems: "center", gap: 5 }}
              >
                <span
                  style={{
                    width: 12,
                    height: 2.5,
                    background: c,
                    display: "inline-block",
                    borderRadius: 2,
                  }}
                />
                {l}
              </span>
            ))}
          </div>
          <Card style={{ marginBottom: 14 }}>
            <Label style={{ marginBottom: 10 }}>월별 자산 추이</Label>
            <LineChart history={data.history} goal={data.goal} />
          </Card>
          <Card style={{ marginBottom: 14 }}>
            <Label style={{ marginBottom: 10 }}>월별 성장률</Label>
            <BarChart history={data.history} />
          </Card>
          <Card>
            <Label style={{ marginBottom: 10 }}>월별 내역</Label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr 1fr",
                gap: 8,
                padding: "6px 0",
                borderBottom: "0.5px solid var(--color-border-tertiary)",
              }}
            >
              {["월", "아내", "남편", "합계"].map((h, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 11,
                    color: "var(--color-text-tertiary)",
                    textAlign: i > 0 ? "right" : "left",
                  }}
                >
                  {h}
                </span>
              ))}
            </div>
            {data.history.length === 0 && (
              <p
                style={{
                  margin: "16px 0",
                  fontSize: 13,
                  color: "var(--color-text-tertiary)",
                  textAlign: "center",
                }}
              >
                아직 기록이 없어요
              </p>
            )}
            {[...data.history].reverse().map((h, i, arr) => {
              const prev = arr[i + 1];
              const tot = h.wife + h.husband;
              const ptot = prev ? prev.wife + prev.husband : null;
              const rate = ptot ? ((tot - ptot) / ptot) * 100 : null;
              return (
                <div
                  key={h.month}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr 1fr",
                    gap: 8,
                    padding: "8px 0",
                    borderBottom: "0.5px solid var(--color-border-tertiary)",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    {monthLabel(h.month)}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: "#6C63FF",
                      textAlign: "right",
                    }}
                  >
                    {fmt(h.wife)}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: "#F4A261",
                      textAlign: "right",
                    }}
                  >
                    {fmt(h.husband)}
                  </span>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 12, fontWeight: 500 }}>
                      {fmt(tot)}
                    </span>
                    {rate !== null && (
                      <span
                        style={{
                          display: "block",
                          fontSize: 10,
                          color: rate >= 0 ? "#10B981" : "#EF4444",
                        }}
                      >
                        {rate >= 0 ? "+" : ""}
                        {rate.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </Card>
        </div>
      )}

      {tab === "dividend" && <DividendTab data={data} setData={setData} />}

      {modal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
          }}
        >
          <div
            style={{
              background: "var(--color-background-primary)",
              borderRadius: 20,
              padding: 24,
              width: "88%",
              maxWidth: 360,
            }}
          >
            <p style={{ margin: "0 0 18px", fontSize: 16, fontWeight: 500 }}>
              {modal === "add" ? "계좌 추가" : "계좌 수정"} — {data[who].name}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input
                placeholder="계좌명"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                style={{ fontSize: 14 }}
              />
              <select
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, type: e.target.value }))
                }
                style={{ fontSize: 14 }}
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <input
                placeholder="금액 (숫자만)"
                value={form.amount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amount: e.target.value }))
                }
                type="number"
                style={{ fontSize: 14 }}
              />
              <div>
                <p
                  style={{
                    margin: "0 0 8px",
                    fontSize: 12,
                    color: "var(--color-text-secondary)",
                  }}
                >
                  색상
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {PALETTE.map((c) => (
                    <div
                      key={c}
                      onClick={() => setForm((f) => ({ ...f, color: c }))}
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 6,
                        background: c,
                        cursor: "pointer",
                        border:
                          form.color === c
                            ? "2.5px solid var(--color-text-primary)"
                            : "2.5px solid transparent",
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <button
                onClick={() => setModal(null)}
                style={{
                  flex: 1,
                  padding: 11,
                  borderRadius: 10,
                  border: "0.5px solid var(--color-border-secondary)",
                  background: "none",
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                취소
              </button>
              <button
                onClick={saveAcc}
                style={{
                  flex: 2,
                  padding: 11,
                  borderRadius: 10,
                  border: "none",
                  background: who === "wife" ? "#6C63FF" : "#F4A261",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
