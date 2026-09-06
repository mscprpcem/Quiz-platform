import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, TrendingDown, Sparkles, Info, X, Zap, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function Top10Leaderboard({ 
  leaderboard = [], 
  currentParticipantId = null, 
  title = "Top 10 Live Standings",
  onRefresh = null,
  isRefreshing = false
}) {
  const [rankedList, setRankedList] = useState([]);
  const [showMatrixModal, setShowMatrixModal] = useState(false);
  const prevRanksRef = useRef({});

  useEffect(() => {
    if (!Array.isArray(leaderboard)) return;

    const top10 = leaderboard.slice(0, 10);
    const newPrevRanks = { ...prevRanksRef.current };

    const listWithDeltas = top10.map((player, index) => {
      const newRank = index + 1;
      const prevRank = prevRanksRef.current[player.id];

      let delta = null;
      let isNew = false;

      if (prevRank !== undefined) {
        delta = prevRank - newRank; // Positive means moved up, negative means moved down
      } else if (Object.keys(prevRanksRef.current).length > 0) {
        isNew = true;
      }

      // Store new rank position
      newPrevRanks[player.id] = newRank;

      return {
        ...player,
        rank: newRank,
        delta,
        isNew
      };
    });

    prevRanksRef.current = newPrevRanks;
    setRankedList(listWithDeltas);
  }, [leaderboard]);

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-xl p-6 text-center space-y-2 shadow-2xs animate-fade-in">
        <Trophy size={28} className="mx-auto text-amber-500/50 animate-pulse" />
        <h3 className="font-bold text-xs text-slate-800">Standings will appear after Question 1</h3>
        <p className="text-[10px] text-slate-400 font-medium">Answer quickly to secure a top spot on the podium!</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-3 sm:p-4 shadow-2xs space-y-2 sm:space-y-2.5 text-left relative">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/80 shrink-0">
            <Trophy size={15} />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">{title}</h3>
              <button
                type="button"
                onClick={() => setShowMatrixModal(true)}
                className="p-0.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0 self-center"
                title="View Scoring Rules"
                aria-label="View Scoring Rules"
              >
                <Info size={13} />
              </button>
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Ranked by score & speed</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 self-center">
          <span className="text-[10px] font-semibold bg-slate-50 text-slate-600 border border-slate-200/80 px-2 py-0.5 rounded-md">
            {rankedList.length} Players
          </span>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="h-8 px-3 inline-flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-700 hover:text-blue-600 border border-slate-200/90 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs shrink-0 self-center"
              title="Refresh Standings"
              aria-label="Refresh Standings"
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-blue-600' : 'text-slate-500'} />
              <span className="text-xs">Refresh</span>
            </button>
          )}
        </div>
      </div>

      {/* Top 10 List with Smooth FLIP Position Transitions (Zero Jitter) */}
      <div className="space-y-1 sm:space-y-1.5 relative">
        {rankedList.map((player) => {
          const isCurrentPlayer = currentParticipantId && player.id === currentParticipantId;

          // Rank Badges Styling (Medals for Top 3, Clean Badges for Others)
          let rankBadge = null;
          let rowBgClass = "bg-white hover:bg-slate-50/70 border-slate-200/70";

          if (player.rank === 1) {
            rankBadge = (
              <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center text-xs shrink-0 border border-amber-200">
                🥇
              </span>
            );
            rowBgClass = "bg-amber-50/25 border-amber-200/80";
          } else if (player.rank === 2) {
            rankBadge = (
              <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs shrink-0 border border-slate-300">
                🥈
              </span>
            );
            rowBgClass = "bg-slate-50/50 border-slate-200";
          } else if (player.rank === 3) {
            rankBadge = (
              <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-orange-50 text-orange-700 flex items-center justify-center text-xs shrink-0 border border-orange-200">
                🥉
              </span>
            );
            rowBgClass = "bg-orange-50/20 border-orange-200/70";
          } else {
            rankBadge = (
              <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[11px] border border-slate-200 shrink-0">
                #{player.rank}
              </span>
            );
          }

          if (isCurrentPlayer) {
            rowBgClass += " ring-1.5 ring-blue-500 bg-blue-50/40 border-blue-300 font-semibold";
          }

          return (
            <motion.div
              key={player.id}
              layout
              transition={{
                type: "spring",
                stiffness: 320,
                damping: 26,
                mass: 0.6
              }}
              className={`p-2 px-2.5 rounded-lg border flex items-center justify-between gap-2 transition-colors duration-300 ${rowBgClass}`}
            >
              {/* Left: Rank & Player Identity */}
              <div className="flex items-center space-x-2 min-w-0 flex-1 truncate">
                {rankBadge}

                <div className="min-w-0 flex-1 truncate text-left">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 truncate block">
                      {player.name}
                    </span>

                    {/* Current Player Pill */}
                    {isCurrentPlayer && (
                      <span className="text-[8.5px] font-black uppercase tracking-wider bg-blue-600 text-white px-1.5 py-0.2 rounded shrink-0">
                        YOU
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Delta Indicator & Score Capsule */}
              <div className="flex items-center space-x-1.5 shrink-0">
                {/* Delta Badge */}
                {player.isNew ? (
                  <span className="inline-flex items-center gap-0.5 bg-purple-50 text-purple-700 border border-purple-200 text-[8.5px] font-bold uppercase px-1.5 py-0.5 rounded-md">
                    <Sparkles size={9} />
                    <span>NEW</span>
                  </span>
                ) : player.delta > 0 ? (
                  <span className="inline-flex items-center gap-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9.5px] font-bold px-1.5 py-0.5 rounded-md">
                    <TrendingUp size={10} />
                    <span>+{player.delta}</span>
                  </span>
                ) : player.delta < 0 ? (
                  <span className="inline-flex items-center gap-0.5 bg-rose-50 text-rose-700 border border-rose-200 text-[9.5px] font-bold px-1.5 py-0.5 rounded-md">
                    <TrendingDown size={10} />
                    <span>{player.delta}</span>
                  </span>
                ) : (
                  <span className="text-slate-300 text-xs px-1 select-none hidden sm:inline">—</span>
                )}

                {/* Score Capsule */}
                <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 border border-blue-200/70 px-2 py-0.5 rounded-md whitespace-nowrap shadow-2xs">
                  {player.score} <span className="text-[9px] font-medium text-slate-400 uppercase">pts</span>
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── LIVE SCORING & DIFFICULTY MATRIX MODAL ── */}
      {showMatrixModal && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in text-left"
          onClick={() => setShowMatrixModal(false)}
        >
          <div 
            className="max-w-lg w-full bg-white rounded-3xl shadow-2xl border border-zinc-100 overflow-hidden animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-brand-blue to-indigo-700 px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Trophy size={18} className="text-amber-300" />
                <h4 className="font-extrabold text-sm tracking-tight">Live Quiz Scoring Matrix</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowMatrixModal(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="space-y-2">
                <p className="font-black text-brand-textMain uppercase tracking-wider text-[10px]">Difficulty Multipliers</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl">
                    <span className="font-bold text-emerald-800">Easy</span>
                    <p className="font-extrabold text-emerald-950 text-sm mt-0.5">1.0x</p>
                    <p className="text-[10px] text-emerald-700">+20% Speed</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl">
                    <span className="font-bold text-amber-800">Medium</span>
                    <p className="font-extrabold text-amber-950 text-sm mt-0.5">1.5x</p>
                    <p className="text-[10px] text-amber-700">+30% Speed</p>
                  </div>
                  <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-xl">
                    <span className="font-bold text-rose-800">Hard</span>
                    <p className="font-extrabold text-rose-950 text-sm mt-0.5">2.0x</p>
                    <p className="text-[10px] text-rose-700">+40% Speed</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1.5 text-slate-700">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Zap size={13} className="text-brand-blue" />
                  <span>Dynamic Speed Bonus Formula</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Score = (Base Marks × Multiplier) + Speed Bonus. Faster answers award up to 40% additional bonus points based on the countdown clock.
                </p>
              </div>

              <div className="bg-blue-50/70 border border-blue-100 p-3 rounded-xl space-y-1 text-slate-700">
                <div className="flex items-center gap-1.5 font-bold text-blue-900">
                  <CheckCircle2 size={13} className="text-blue-600" />
                  <span>Verified Student vs. Guest</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Guest players can play and place on the live in-room podium. Only verified student accounts persist permanently on the Global Leaderboard.
                </p>
              </div>
            </div>

            <div className="bg-zinc-50 border-t border-zinc-100 p-3 px-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowMatrixModal(false)}
                className="px-4 py-1.5 rounded-xl bg-brand-blue hover:bg-brand-dark text-white font-bold text-xs transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
