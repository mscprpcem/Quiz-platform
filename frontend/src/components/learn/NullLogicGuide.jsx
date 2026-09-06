import React, { useState } from 'react';
import { 
  AlertTriangle, CheckCircle2, XCircle, HelpCircle, 
  Copy, Check, Sparkles, BookOpen, Layers, Zap, Info, ShieldAlert
} from 'lucide-react';

const THREE_VL_EXPRESSIONS = [
  {
    expr: 'NULL = NULL',
    result: 'UNKNOWN',
    status: 'unknown',
    why: 'Because neither value is known, SQL cannot confirm equality. Returns UNKNOWN, which WHERE clauses reject.'
  },
  {
    expr: 'NULL != NULL',
    result: 'UNKNOWN',
    status: 'unknown',
    why: 'Just like equality, SQL cannot determine inequality between two unknown values.'
  },
  {
    expr: 'NULL IS NULL',
    result: 'TRUE',
    status: 'true',
    why: 'IS NULL is a dedicated unary operator checking for absence of value. It accurately evaluates to TRUE.'
  },
  {
    expr: 'NULL IS NOT NULL',
    result: 'FALSE',
    status: 'false',
    why: 'The value is absent, so asserting it is NOT NULL evaluates directly to FALSE.'
  },
  {
    expr: "'Berlin' IS NOT NULL",
    result: 'TRUE',
    status: 'true',
    why: "'Berlin' is a valid, populated string, so IS NOT NULL evaluates to TRUE."
  },
  {
    expr: "'Berlin' = NULL",
    result: 'UNKNOWN',
    status: 'unknown',
    why: "Comparing any known value to NULL using '=' yields UNKNOWN, never TRUE or FALSE."
  },
  {
    expr: 'TRUE AND UNKNOWN',
    result: 'UNKNOWN',
    status: 'unknown',
    why: 'In AND logic, if one operand is TRUE and the other is UNKNOWN, the overall outcome remains UNKNOWN.'
  },
  {
    expr: 'FALSE AND UNKNOWN',
    result: 'FALSE',
    status: 'false',
    why: 'In AND logic, a single FALSE guarantees the entire condition is FALSE, regardless of UNKNOWN.'
  },
  {
    expr: 'TRUE OR UNKNOWN',
    result: 'TRUE',
    status: 'true',
    why: 'In OR logic, a single TRUE guarantees the entire condition is TRUE, regardless of UNKNOWN.'
  },
  {
    expr: 'NOT UNKNOWN',
    result: 'UNKNOWN',
    status: 'unknown',
    why: 'Negating an unknown proposition still leaves it unknown in Three-Valued Logic.'
  }
];

export default function NullLogicGuide() {
  const [selectedExprIdx, setSelectedExprIdx] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);

  const activeTest = THREE_VL_EXPRESSIONS[selectedExprIdx];

  const practicalSql = `-- 1. Finding unassigned / missing records (IS NULL)
SELECT employee_id, first_name, city
FROM employees
WHERE city IS NULL;

-- 2. Finding populated / valid records (IS NOT NULL)
SELECT employee_id, first_name, city
FROM employees
WHERE city IS NOT NULL;`;

  const handleCopy = () => {
    navigator.clipboard.writeText(practicalSql);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-8 my-8">
      {/* ── TOP HEADER / ARCHITECTURAL BANNER ── */}
      <div className="bg-gradient-to-br from-amber-500/10 via-amber-50/50 to-blue-500/10 border border-amber-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black uppercase tracking-wider">
            <Sparkles size={13} className="text-amber-700" />
            <span>Three-Valued Logic (3VL) Guide</span>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-white/80 px-3 py-1 rounded-full border border-slate-200">
            Interactive Code Component
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          The NULL Concept: What Is NULL in SQL?
        </h2>
        <p className="text-sm sm:text-base text-slate-600 font-medium mt-2 leading-relaxed">
          <strong className="text-slate-900 font-bold">NULL is NOT Zero (0)</strong> • <strong className="text-slate-900 font-bold">NULL is NOT an Empty String ("")</strong> • <strong className="text-slate-900 font-bold">NULL represents an UNKNOWN or MISSING value</strong>.
        </p>
      </div>

      {/* ── THREE COMPARISON CARDS SIDE BY SIDE ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: ZERO (0) */}
        <div className="bg-white border-2 border-blue-200/90 hover:border-blue-400 rounded-3xl p-6 shadow-xs flex flex-col justify-between transition-all duration-200 hover:-translate-y-1">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-mono font-black text-2xl shadow-2xs">
                0
              </span>
              <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Known Number
              </span>
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">Number 0</h3>
              <p className="text-xs font-bold text-blue-600 mt-0.5">Known Numerical Quantity</p>
            </div>

            <ul className="space-y-2 text-xs text-slate-600 font-medium pt-2 border-t border-slate-100">
              <li className="flex items-start space-x-2">
                <span className="text-blue-500 font-black">•</span>
                <span>Occupies 4 bytes in standard <code className="font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded">INT</code>.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-500 font-black">•</span>
                <span>Arithmetic functions normally: <code className="font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded">0 + 50 = 50</code>.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-500 font-black">•</span>
                <span>Included in SQL aggregate calculations.</span>
              </li>
            </ul>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs font-mono font-bold text-emerald-800">
              <span>0 = 0</span>
              <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-md text-[10px] font-black">TRUE ✓</span>
            </div>
          </div>
        </div>

        {/* Card 2: EMPTY STRING ("") */}
        <div className="bg-white border-2 border-purple-200/90 hover:border-purple-400 rounded-3xl p-6 shadow-xs flex flex-col justify-between transition-all duration-200 hover:-translate-y-1">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center font-mono font-black text-xl shadow-2xs">
                ""
              </span>
              <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                Known Text
              </span>
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">Empty String</h3>
              <p className="text-xs font-bold text-purple-600 mt-0.5">Known Character Data</p>
            </div>

            <ul className="space-y-2 text-xs text-slate-600 font-medium pt-2 border-t border-slate-100">
              <li className="flex items-start space-x-2">
                <span className="text-purple-500 font-black">•</span>
                <span>A defined string whose length is strictly <code className="font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded">0</code>.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-purple-500 font-black">•</span>
                <span>Concatenation works: <code className="font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded">'' || 'PRP' = 'PRP'</code>.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-purple-500 font-black">•</span>
                <span>It is an actual value that the user typed or stored.</span>
              </li>
            </ul>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs font-mono font-bold text-emerald-800">
              <span>'' = ''</span>
              <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-md text-[10px] font-black">TRUE ✓</span>
            </div>
          </div>
        </div>

        {/* Card 3: NULL (UNKNOWN) */}
        <div className="bg-amber-50/40 border-2 border-amber-300 hover:border-amber-500 rounded-3xl p-6 shadow-xs flex flex-col justify-between transition-all duration-200 hover:-translate-y-1">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center font-mono font-black text-2xl shadow-2xs">
                ?
              </span>
              <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-amber-200 text-amber-900 border border-amber-300 uppercase tracking-wider">
                NULL
              </span>
            </div>

            <div>
              <h3 className="text-lg font-black text-amber-950">NULL (Unknown)</h3>
              <p className="text-xs font-bold text-amber-700 mt-0.5">Absence of Any Recorded Value</p>
            </div>

            <ul className="space-y-2 text-xs text-amber-900/80 font-medium pt-2 border-t border-amber-200/60">
              <li className="flex items-start space-x-2">
                <span className="text-amber-600 font-black">•</span>
                <span>Signifies missing, inapplicable, or undisclosed data.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-amber-600 font-black">•</span>
                <span>Arithmetic propagates NULL: <code className="font-mono text-amber-950 bg-amber-100 px-1 py-0.5 rounded">NULL + 50 = NULL</code>.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-amber-600 font-black">•</span>
                <span>Cannot be tested with <code className="font-mono text-amber-950 bg-amber-100 px-1 py-0.5 rounded">=</code> or <code className="font-mono text-amber-950 bg-amber-100 px-1 py-0.5 rounded">!=</code>.</span>
              </li>
            </ul>
          </div>

          <div className="mt-5 pt-3 border-t border-amber-200/60">
            <div className="bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs font-mono font-bold text-rose-800">
              <span>NULL = NULL</span>
              <span className="px-2 py-0.5 bg-rose-600 text-white rounded-md text-[10px] font-black">UNKNOWN ✗</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── THE FATAL TRAP VS THE SQL SOLUTION (SIDE BY SIDE CODE CARDS) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* The Fatal Trap */}
        <div className="bg-white border-2 border-rose-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 text-rose-600">
            <ShieldAlert size={20} />
            <h3 className="text-sm font-black uppercase tracking-wider text-rose-800">
              ❌ The Fatal Trap (Common Anti-Pattern)
            </h3>
          </div>

          <div className="bg-slate-900 rounded-2xl p-4 font-mono text-xs text-rose-300 border border-slate-800 space-y-1 select-text">
            <div className="text-slate-500 italic">-- ❌ WRONG: Returns 0 rows every time!</div>
            <div>SELECT * FROM employees</div>
            <div className="text-rose-400 font-black">WHERE city = NULL;</div>
            <div className="pt-2 text-slate-500 italic">-- ❌ WRONG: Also returns 0 rows!</div>
            <div>SELECT * FROM employees</div>
            <div className="text-rose-400 font-black">WHERE city != NULL;</div>
          </div>

          <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-4 space-y-1.5 text-xs text-rose-900">
            <p className="font-extrabold text-rose-950 flex items-center space-x-1.5">
              <XCircle size={15} className="text-rose-600 shrink-0" />
              <span>Result: Evaluates to UNKNOWN (Returns Empty Set)</span>
            </p>
            <p className="leading-relaxed text-rose-800">
              Because SQL does not know what is inside an unknown column, it cannot confirm whether it equals another unknown value. 
              SQL <code className="font-mono font-bold bg-rose-100 px-1 rounded">WHERE</code> clauses filter out anything that is not strictly <code className="font-mono font-bold bg-rose-100 px-1 rounded">TRUE</code>!
            </p>
          </div>
        </div>

        {/* The SQL Solution */}
        <div className="bg-white border-2 border-emerald-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 text-emerald-700">
            <CheckCircle2 size={20} />
            <h3 className="text-sm font-black uppercase tracking-wider text-emerald-800">
              ✅ The SQL Solution (Production Standard)
            </h3>
          </div>

          <div className="bg-slate-900 rounded-2xl p-4 font-mono text-xs text-emerald-300 border border-slate-800 space-y-1 select-text">
            <div className="text-slate-500 italic">-- ✅ CORRECT: Find records with missing city</div>
            <div>SELECT * FROM employees</div>
            <div className="text-emerald-400 font-black">WHERE city IS NULL;</div>
            <div className="pt-2 text-slate-500 italic">-- ✅ CORRECT: Find records with populated city</div>
            <div>SELECT * FROM employees</div>
            <div className="text-emerald-400 font-black">WHERE city IS NOT NULL;</div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 space-y-1.5 text-xs text-emerald-900">
            <p className="font-extrabold text-emerald-950 flex items-center space-x-1.5">
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
              <span>Dedicated Unary Operators: IS NULL & IS NOT NULL</span>
            </p>
            <p className="leading-relaxed text-emerald-800">
              Always use <code className="font-mono font-bold bg-emerald-100 px-1 rounded">IS NULL</code> to search for unassigned data, and <code className="font-mono font-bold bg-emerald-100 px-1 rounded">IS NOT NULL</code> to retrieve records that contain valid, populated data.
            </p>
          </div>
        </div>
      </div>

      {/* ── INTERACTIVE 3-VALUED LOGIC (3VL) EVALUATOR ── */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold">
              <Zap size={16} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                Interactive 3-Valued Logic Evaluator
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Click any SQL expression below to inspect how the database engine evaluates it:
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
            Live Tester
          </span>
        </div>

        {/* Expression Pills Selector */}
        <div className="flex flex-wrap gap-2">
          {THREE_VL_EXPRESSIONS.map((item, idx) => {
            const isSelected = idx === selectedExprIdx;
            return (
              <button
                key={item.expr}
                type="button"
                onClick={() => setSelectedExprIdx(idx)}
                className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs scale-[1.02]'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {item.expr}
              </button>
            );
          })}
        </div>

        {/* Evaluation Output Card */}
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 text-white space-y-3 shadow-inner">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-bold font-mono">Expression:</span>
              <span className="text-sm sm:text-base font-black font-mono text-amber-300">
                {activeTest.expr}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-bold font-mono">Evaluates To:</span>
              <span
                className={`px-3 py-1 rounded-lg text-xs font-black font-mono tracking-wider uppercase shadow-xs ${
                  activeTest.status === 'true'
                    ? 'bg-emerald-500 text-white'
                    : activeTest.status === 'false'
                    ? 'bg-blue-500 text-white'
                    : 'bg-rose-500 text-white'
                }`}
              >
                {activeTest.result}
              </span>
            </div>
          </div>

          <div className="pt-1">
            <div className="text-xs text-slate-300 leading-relaxed font-sans">
              <strong className="text-white font-semibold">Engine Explanation: </strong>
              {activeTest.why}
            </div>
          </div>
        </div>
      </div>

      {/* ── PRACTICAL SQL CHEAT CODE SNIPPET (COPYABLE) ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-3 text-white">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <BookOpen size={16} className="text-blue-400" />
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">
              Production Cheat Sheet: IS NULL & IS NOT NULL
            </h4>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 hover:text-white transition-all border border-slate-700 cursor-pointer"
          >
            {copiedCode ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            <span>{copiedCode ? 'Copied!' : 'Copy SQL'}</span>
          </button>
        </div>

        <pre className="font-mono text-xs sm:text-sm text-emerald-400 leading-relaxed overflow-x-auto select-text pt-1">
          {practicalSql}
        </pre>
      </div>
    </div>
  );
}
