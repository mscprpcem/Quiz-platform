import React, { useState, useEffect, useRef } from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus, Sparkles, Award } from 'lucide-react';

export default function Top10Leaderboard({ leaderboard = [], currentParticipantId = null, title = "Top 10 Live Standings" }) {
  const [rankedList, setRankedList] = useState([]);
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

  if (rankedList.length === 0) {
    return (
      <div className="bg-white border border-brand-border rounded-2xl p-8 text-center space-y-3 shadow-soft">
        <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mx-auto border border-purple-100 shadow-sm">
          <Trophy size={24} />
        </div>
        <h3 className="text-base font-extrabold text-brand-textMain">{title}</h3>
        <p className="text-xs text-brand-textMuted max-w-sm mx-auto">
          Standings will appear dynamically as answers are evaluated after each question.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-brand-border rounded-2xl p-5 sm:p-7 shadow-soft space-y-5 animate-fade-in text-left">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-brand-border pb-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20">
            <Trophy size={20} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-brand-textMain tracking-tight leading-none">{title}</h3>
            <p className="text-[11px] font-semibold text-brand-textMuted mt-1">Live ranking after latest question</p>
          </div>
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider bg-brand-lightBlue text-brand-blue border border-brand-blue/15 px-3 py-1 rounded-full">
          {rankedList.length} Performers
        </span>
      </div>

      {/* Top 10 List with Shuffle Animations */}
      <div className="space-y-2.5 relative">
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
            <div
              key={player.id}
              className={`p-3.5 sm:p-4 rounded-xl border transition-all duration-700 ease-out flex items-center justify-between gap-3 ${rowBgClass}`}
            >
              {/* Left Rank & User Info */}
              <div className="flex items-center space-x-3 truncate">
                {rankBadge}

                {/* Avatar Initials */}
                <div className="w-9 h-9 rounded-full bg-brand-blue/10 text-brand-blue font-black text-xs flex items-center justify-center flex-shrink-0 border border-brand-blue/15">
                  {player.name ? player.name.substring(0, 2).toUpperCase() : 'P'}
                </div>

                <div className="truncate text-left">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-extrabold text-xs sm:text-sm text-brand-textMain truncate">
                      {player.name}
                    </span>
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
                  <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-200 text-[9px] font-black uppercase px-2 py-0.5 rounded-full animate-bounce">
                    <Sparkles size={10} />
                    <span>NEW</span>
                  </span>
                ) : player.delta > 0 ? (
                  <span className="inline-flex items-center gap-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                    <TrendingUp size={11} />
                    <span>+{player.delta}</span>
                  </span>
                ) : player.delta < 0 ? (
                  <span className="inline-flex items-center gap-0.5 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-black px-2 py-0.5 rounded-full">
                    <TrendingDown size={11} />
                    <span>{player.delta}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 bg-slate-50 text-slate-500 border border-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    <Minus size={10} />
                  </span>
                )}

                {/* Score Capsule */}
                <span className="font-extrabold text-xs sm:text-sm text-brand-blue bg-brand-lightBlue border border-brand-blue/15 px-3 py-1 rounded-full whitespace-nowrap">
                  {player.score} <span className="text-[9px] font-bold text-brand-textMuted uppercase">pts</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
