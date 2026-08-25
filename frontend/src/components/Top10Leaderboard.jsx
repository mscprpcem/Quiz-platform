import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, TrendingUp, TrendingDown, Minus, Sparkles, Award, Info, X, Zap, CheckCircle2, Clock } from 'lucide-react';

export default function Top10Leaderboard({ leaderboard = [], currentParticipantId = null, title = "Top 10 Live Standings" }) {
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
      <div className="bg-white border border-brand-border rounded-2xl p-8 text-center space-y-3 shadow-soft animate-fade-in">
        <Trophy size={36} className="mx-auto text-amber-500/40 animate-pulse" />
        <h3 className="font-bold text-sm text-brand-textMain">Standings will appear after Question 1</h3>
        <p className="text-xs text-brand-textMuted">Answer quickly to secure a top spot on the podium!</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-brand-border rounded-2xl p-5 sm:p-7 shadow-soft space-y-5 animate-fade-in text-left relative">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-brand-border pb-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20">
            <Trophy size={20} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-base sm:text-lg font-black text-brand-textMain tracking-tight leading-none">{title}</h3>
              <button
                type="button"
                onClick={() => setShowMatrixModal(true)}
                className="w-6 h-6 rounded-full bg-brand-lightBlue hover:bg-brand-blue hover:text-white text-brand-blue flex items-center justify-center transition-all shadow-xs border border-brand-blue/20 cursor-pointer"
                title="View Scoring Matrix & Multipliers"
                aria-label="View Scoring Matrix & Multipliers"
              >
                <Info size={13} />
              </button>
            </div>
            <p className="text-[11px] font-semibold text-brand-textMuted mt-1">Live ranking after latest question</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowMatrixModal(true)}
            className="hidden sm:inline-flex items-center gap-1 text-[10px] font-extrabold text-brand-blue bg-white hover:bg-slate-50 border border-brand-border px-2.5 py-1 rounded-full cursor-pointer transition-all"
          >
            <Info size={11} />
            <span>Rules Matrix</span>
          </button>
          <span className="text-[10px] font-black uppercase tracking-wider bg-brand-lightBlue text-brand-blue border border-brand-blue/15 px-3 py-1 rounded-full">
            {rankedList.length} Performers
          </span>
        </div>
      </div>

      {/* Top 10 List with FLIP Shuffle Animations via Framer Motion */}
      <motion.div layout className="space-y-2.5 relative">
        <AnimatePresence mode="popLayout">
          {rankedList.map((player) => {
            const isCurrentPlayer = currentParticipantId && player.id === currentParticipantId;

            // Rank Badges Styling
            let rankBadge = null;
            let rowBgClass = "bg-white hover:bg-zinc-50 border-brand-border";

            if (player.rank === 1) {
              rankBadge = (
                <span className="w-7 h-7 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-white flex items-center justify-center font-black text-xs shadow-sm">
                  👑
                </span>
              );
              rowBgClass = "bg-gradient-to-r from-amber-50/70 via-amber-50/30 to-white border-amber-200/80 shadow-sm";
            } else if (player.rank === 2) {
              rankBadge = (
                <span className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-black text-xs border border-slate-300">
                  2
                </span>
              );
              rowBgClass = "bg-gradient-to-r from-slate-50/70 via-slate-50/30 to-white border-slate-200";
            } else if (player.rank === 3) {
              rankBadge = (
                <span className="w-7 h-7 rounded-full bg-orange-100 text-orange-800 flex items-center justify-center font-black text-xs border border-orange-200">
                  3
                </span>
              );
              rowBgClass = "bg-gradient-to-r from-orange-50/70 via-orange-50/30 to-white border-orange-200/80";
            } else {
              rankBadge = (
                <span className="w-7 h-7 rounded-full bg-zinc-100 text-zinc-600 flex items-center justify-center font-black text-xs border border-zinc-200">
                  {player.rank}
                </span>
              );
            }

            if (isCurrentPlayer) {
              rowBgClass += " ring-2 ring-brand-blue border-brand-blue shadow-md";
            }

            return (
              <motion.div
                key={player.id}
                layout
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                transition={{
                  layout: { type: "spring", stiffness: 350, damping: 28 },
                  opacity: { duration: 0.25 }
                }}
                className={`p-3.5 sm:p-4 rounded-xl border flex items-center justify-between gap-3 ${rowBgClass}`}
              >
                {/* Left Rank & User Info */}
                <div className="flex items-center space-x-3 truncate">
                  {rankBadge}

                  <div className="truncate text-left">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-extrabold text-xs sm:text-sm text-brand-textMain truncate">
                        {player.name}
                      </span>
                      {player.is_authenticated ? (
                        <span className="inline-flex items-center text-[8px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded" title="Verified Student (Eligible for Global Leaderboard)">
                          ✓ Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[8px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded" title="Guest Player">
                          Guest
                        </span>
                      )}
                      {isCurrentPlayer && (
                        <span className="text-[9px] font-black uppercase tracking-wider bg-brand-blue text-white px-2 py-0.5 rounded">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-medium text-brand-textMuted truncate">
                      {player.college || 'PRPCEM Campus'}
                    </p>
                  </div>
                </div>

                {/* Right Rank Delta & Points */}
                <div className="flex items-center space-x-3 flex-shrink-0">
                  {/* Delta Badge */}
                  {player.isNew ? (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-200 text-[9px] font-black uppercase px-2 py-0.5 rounded-full animate-bounce"
                    >
                      <Sparkles size={10} />
                      <span>NEW</span>
                    </motion.span>
                  ) : player.delta > 0 ? (
                    <motion.span
                      initial={{ scale: 0.8 }}
                      animate={{ scale: [1, 1.25, 1] }}
                      transition={{ duration: 0.5 }}
                      className="inline-flex items-center gap-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black px-2 py-0.5 rounded-full"
                    >
                      <TrendingUp size={11} />
                      <span>+{player.delta}</span>
                    </motion.span>
                  ) : player.delta < 0 ? (
                    <motion.span
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="inline-flex items-center gap-0.5 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-black px-2 py-0.5 rounded-full"
                    >
                      <TrendingDown size={11} />
                      <span>{player.delta}</span>
                    </motion.span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 bg-slate-50 text-slate-500 border border-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      <Minus size={10} />
                    </span>
                  )}

                  {/* Score Capsule */}
                  <motion.span
                    key={player.score}
                    initial={{ scale: 1.15 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="font-extrabold text-xs sm:text-sm text-brand-blue bg-brand-lightBlue border border-brand-blue/15 px-3 py-1 rounded-full whitespace-nowrap shadow-xs"
                  >
                    {player.score} <span className="text-[9px] font-bold text-brand-textMuted uppercase">pts</span>
                  </motion.span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

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
