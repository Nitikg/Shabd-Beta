'use client';

import { useState, useEffect, useCallback } from 'react';

// --- Types ---

type Kid = {
  id: string;
  name: string;
  ageYears: number;
  class: string;
  language: string;
  interests: string[];
  sessionCount: number;
  createdAt: number | null;
};

type Turn = {
  role: string;
  text: string;
  turnIndex: number;
};

type Session = {
  id: string;
  kidId: string;
  sessionNumber: number;
  startedAt: number | null;
  endedAt: number | null;
  durationSeconds: number;
  turnCount: number;
  language: string;
  turns: Turn[];
  starRating: number | null;
  chips: string[];
  openText: string;
  savedAt: number | null;
};

type AdminData = {
  kids: Kid[];
  sessions: Session[];
};

// --- Helpers ---

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function formatDate(ts: number | null): string {
  if (!ts) return '--';
  const d = new Date(ts);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(ts: number | null): string {
  if (!ts) return '--';
  const d = new Date(ts);
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// --- CSV Export ---

function buildCsv(kids: Kid[], sessions: Session[]): string {
  const headers = [
    'kid_name', 'age', 'class', 'interests', 'language',
    'session_number', 'duration', 'turns', 'star_rating', 'chips', 'open_text',
  ];

  const rows: string[][] = [];

  for (const kid of kids) {
    const kidSessions = sessions.filter((s) => s.kidId === kid.id);
    if (kidSessions.length === 0) {
      rows.push([kid.name, String(kid.ageYears), kid.class, kid.interests.join('; '), kid.language, '', '', '', '', '', '']);
    } else {
      for (const s of kidSessions) {
        rows.push([
          kid.name,
          String(kid.ageYears),
          kid.class,
          kid.interests.join('; '),
          kid.language,
          String(s.sessionNumber),
          String(s.durationSeconds),
          String(s.turnCount),
          s.starRating != null ? String(s.starRating) : '',
          s.chips.join('; '),
          s.openText,
        ]);
      }
    }
  }

  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = [headers.join(','), ...rows.map((r) => r.map(escape).join(','))];
  return lines.join('\n');
}

function downloadCsv(csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `shabd-admin-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// --- Components ---

function PasswordGate({ onAuth }: { onAuth: (pw: string) => void }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pw === 'KIKI_ADMIN_2026') {
      onAuth(pw);
    } else {
      setError(true);
    }
  }

  return (
    <div className="min-h-screen kiki-gradient-bg flex items-center justify-center p-4">
      <div className="kiki-card p-8 max-w-sm w-full">
        <h1 className="text-2xl font-bold text-kiki-indigo mb-6 text-center" style={{ fontFamily: 'var(--font-baloo)' }}>
          Shabd Admin
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={pw}
            onChange={(e) => { setPw(e.target.value); setError(false); }}
            placeholder="Enter admin password"
            className="w-full px-4 py-3 border-2 border-kiki-indigo/20 rounded-xl focus:outline-none focus:border-kiki-orange transition-colors"
            style={{ fontFamily: 'var(--font-nunito)' }}
            autoFocus
          />
          {error && <p className="text-red-500 text-sm">Incorrect password</p>}
          <button
            type="submit"
            className="w-full py-3 bg-kiki-orange text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
            style={{ fontFamily: 'var(--font-nunito)' }}
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

function StarDisplay({ rating }: { rating: number | null }) {
  if (rating == null) return <span className="text-gray-400">--</span>;
  return <span className="text-kiki-orange font-bold">{rating}/5</span>;
}

function SessionDetail({ session }: { session: Session }) {
  return (
    <div className="bg-kiki-offwhite/50 rounded-xl p-4 mb-3 border border-kiki-indigo/10">
      <div className="flex flex-wrap gap-4 mb-3 text-sm text-kiki-indigo/70">
        <span>Session {session.sessionNumber}</span>
        <span>{formatDuration(session.durationSeconds)}</span>
        <span>{session.turnCount} turns</span>
        <span><StarDisplay rating={session.starRating} /></span>
        <span>{formatDateTime(session.startedAt)}</span>
      </div>

      {/* Transcript */}
      <div className="space-y-2 mb-4">
        {session.turns.length === 0 && <p className="text-gray-400 text-sm italic">No transcript recorded</p>}
        {session.turns
          .sort((a, b) => a.turnIndex - b.turnIndex)
          .map((turn, i) => (
            <div key={i} className={`text-sm rounded-lg px-3 py-2 ${
              turn.role === 'assistant'
                ? 'bg-kiki-orange/10 text-kiki-indigo'
                : 'bg-kiki-teal/10 text-kiki-indigo'
            }`}>
              <span className="font-bold text-xs uppercase tracking-wide mr-2">
                {turn.role === 'assistant' ? 'Kiki' : 'Child'}
              </span>
              {turn.text}
            </div>
          ))}
      </div>

      {/* Feedback */}
      {(session.chips.length > 0 || session.openText) && (
        <div className="border-t border-kiki-indigo/10 pt-3">
          <p className="text-xs font-bold text-kiki-indigo/50 uppercase tracking-wide mb-2">Feedback</p>
          {session.chips.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {session.chips.map((chip, i) => (
                <span key={i} className="px-2.5 py-1 bg-kiki-purple/15 text-kiki-purple text-xs rounded-full font-medium">
                  {chip}
                </span>
              ))}
            </div>
          )}
          {session.openText && (
            <p className="text-sm text-kiki-indigo/70 italic">"{session.openText}"</p>
          )}
        </div>
      )}
    </div>
  );
}

function KidRow({ kid, sessions }: { kid: Kid; sessions: Session[] }) {
  const [expanded, setExpanded] = useState(false);
  const kidSessions = sessions
    .filter((s) => s.kidId === kid.id)
    .sort((a, b) => (a.sessionNumber ?? 0) - (b.sessionNumber ?? 0));

  const avgRating = kidSessions.reduce((sum, s) => {
    if (s.starRating != null) return { total: sum.total + s.starRating, count: sum.count + 1 };
    return sum;
  }, { total: 0, count: 0 });

  const avgStr = avgRating.count > 0 ? (avgRating.total / avgRating.count).toFixed(1) : '--';

  const lastSession = kidSessions.length > 0
    ? kidSessions.reduce((latest, s) => ((s.startedAt ?? 0) > (latest.startedAt ?? 0) ? s : latest))
    : null;

  const sessionColor = kid.sessionCount >= 3
    ? 'text-green-600 font-bold'
    : kid.sessionCount > 0
      ? 'text-yellow-600 font-bold'
      : 'text-gray-400';

  return (
    <>
      <tr
        onClick={() => setExpanded(!expanded)}
        className="hover:bg-kiki-orange/5 cursor-pointer transition-colors border-b border-kiki-indigo/10"
      >
        <td className="px-4 py-3 font-medium text-kiki-indigo">{kid.name}</td>
        <td className="px-4 py-3 text-center">{kid.ageYears}</td>
        <td className={`px-4 py-3 text-center ${sessionColor}`}>{kid.sessionCount}/3</td>
        <td className="px-4 py-3 text-center">{avgStr}</td>
        <td className="px-4 py-3 text-center text-sm text-kiki-indigo/60">{formatDate(lastSession?.startedAt ?? null)}</td>
        <td className="px-4 py-3 text-center text-kiki-indigo/40 text-lg">{expanded ? '-' : '+'}</td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={6} className="px-4 py-4 bg-white/50">
            {kidSessions.length === 0 ? (
              <p className="text-gray-400 text-sm italic">No sessions yet</p>
            ) : (
              kidSessions.map((s) => <SessionDetail key={s.id} session={s} />)
            )}
          </td>
        </tr>
      )}
    </>
  );
}

// --- Main Dashboard ---

export default function AdminPage() {
  const [password, setPassword] = useState<string | null>(null);
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem('shabd-admin-pw');
    if (stored === 'KIKI_ADMIN_2026') {
      setPassword(stored);
    }
  }, []);

  const fetchData = useCallback(async (pw: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/data', {
        headers: { Authorization: `Bearer ${pw}` },
      });
      if (res.status === 401) {
        setError('Unauthorized');
        setPassword(null);
        sessionStorage.removeItem('shabd-admin-pw');
        return;
      }
      if (!res.ok) {
        setError('Failed to load data');
        return;
      }
      const json: AdminData = await res.json();
      setData(json);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (password) fetchData(password);
  }, [password, fetchData]);

  function handleAuth(pw: string) {
    sessionStorage.setItem('shabd-admin-pw', pw);
    setPassword(pw);
  }

  if (!password) return <PasswordGate onAuth={handleAuth} />;

  if (loading) {
    return (
      <div className="min-h-screen kiki-gradient-bg flex items-center justify-center">
        <p className="text-kiki-indigo text-lg" style={{ fontFamily: 'var(--font-nunito)' }}>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen kiki-gradient-bg flex items-center justify-center">
        <div className="kiki-card p-8 text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => password && fetchData(password)}
            className="px-6 py-2 bg-kiki-orange text-white rounded-xl font-bold hover:opacity-90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { kids, sessions } = data;

  // --- Overview Stats ---
  const totalKids = kids.length;
  const totalSessions = sessions.length;

  const ratingsArr = sessions.filter((s) => s.starRating != null).map((s) => s.starRating as number);
  const avgRating = ratingsArr.length > 0 ? (ratingsArr.reduce((a, b) => a + b, 0) / ratingsArr.length).toFixed(1) : '--';

  const completedSessions = sessions.filter((s) => s.turnCount >= 3).length;
  const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

  // Top 3 feedback chips
  const chipCounts: Record<string, number> = {};
  for (const s of sessions) {
    for (const chip of s.chips) {
      chipCounts[chip] = (chipCounts[chip] || 0) + 1;
    }
  }
  const topChips = Object.entries(chipCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Sort kids by name
  const sortedKids = [...kids].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="min-h-screen kiki-gradient-bg" style={{ fontFamily: 'var(--font-nunito)' }}>
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-kiki-indigo" style={{ fontFamily: 'var(--font-baloo)' }}>
            Shabd Admin
          </h1>
          <div className="flex gap-3">
            <button
              onClick={() => password && fetchData(password)}
              className="px-4 py-2 bg-kiki-teal/20 text-kiki-teal font-bold rounded-xl hover:bg-kiki-teal/30 transition-colors text-sm"
            >
              Refresh
            </button>
            <button
              onClick={() => downloadCsv(buildCsv(kids, sessions))}
              className="px-4 py-2 bg-kiki-orange text-white font-bold rounded-xl hover:opacity-90 transition-opacity text-sm"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="kiki-card p-4 text-center">
            <p className="text-2xl font-bold text-kiki-indigo">{totalKids}</p>
            <p className="text-xs text-kiki-indigo/60 uppercase tracking-wide mt-1">Kids</p>
          </div>
          <div className="kiki-card p-4 text-center">
            <p className="text-2xl font-bold text-kiki-indigo">{totalSessions}</p>
            <p className="text-xs text-kiki-indigo/60 uppercase tracking-wide mt-1">Sessions</p>
          </div>
          <div className="kiki-card p-4 text-center">
            <p className="text-2xl font-bold text-kiki-orange">{avgRating}</p>
            <p className="text-xs text-kiki-indigo/60 uppercase tracking-wide mt-1">Avg Rating / 5</p>
          </div>
          <div className="kiki-card p-4 text-center">
            <p className="text-2xl font-bold text-kiki-teal">{completionRate}%</p>
            <p className="text-xs text-kiki-indigo/60 uppercase tracking-wide mt-1">Completion</p>
          </div>
          <div className="kiki-card p-4 text-center col-span-2 md:col-span-1">
            {topChips.length > 0 ? (
              <div className="flex flex-wrap gap-1 justify-center">
                {topChips.map(([chip, count]) => (
                  <span key={chip} className="px-2 py-0.5 bg-kiki-purple/15 text-kiki-purple text-xs rounded-full">
                    {chip} ({count})
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">--</p>
            )}
            <p className="text-xs text-kiki-indigo/60 uppercase tracking-wide mt-1">Top Chips</p>
          </div>
        </div>

        {/* Kids Table */}
        <div className="kiki-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-kiki-indigo/5 border-b border-kiki-indigo/10">
                  <th className="px-4 py-3 text-left text-xs font-bold text-kiki-indigo/60 uppercase tracking-wide">Name</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-kiki-indigo/60 uppercase tracking-wide">Age</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-kiki-indigo/60 uppercase tracking-wide">Sessions</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-kiki-indigo/60 uppercase tracking-wide">Avg Stars</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-kiki-indigo/60 uppercase tracking-wide">Last Session</th>
                  <th className="px-4 py-3 text-center w-12"></th>
                </tr>
              </thead>
              <tbody>
                {sortedKids.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">No kids registered yet</td>
                  </tr>
                ) : (
                  sortedKids.map((kid) => <KidRow key={kid.id} kid={kid} sessions={sessions} />)
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
