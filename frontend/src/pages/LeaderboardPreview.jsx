import React, { useState } from 'react';
import Top10Leaderboard from '../components/Top10Leaderboard';
import { Trophy, CheckCircle, RefreshCw, Shuffle } from 'lucide-react';

const initialLiveLeaderboard = [
  { id: '1', name: 'Devendra Patil', score: 1450, is_authenticated: true },
  { id: '2', name: 'Rohan Deshmukh', score: 1320, is_authenticated: true },
  { id: '3', name: 'Sneha Kulkarni', score: 1210, is_authenticated: false },
  { id: '4', name: 'Aniket Joshi (You)', score: 1140, is_authenticated: true },
  { id: '5', name: 'Pooja Verma', score: 1020, is_authenticated: true },
  { id: '6', name: 'Tanmay Shinde', score: 960, is_authenticated: false },
  { id: '7', name: 'Priya Rathod', score: 890, is_authenticated: true },
  { id: '8', name: 'Aditya Kale', score: 840, is_authenticated: true },
  { id: '9', name: 'Sanket Gawande', score: 790, is_authenticated: false },
  { id: '10', name: 'Megha Bansal', score: 730, is_authenticated: true },
];

const initialScheduledLeaderboard = [
  { id: 's1', rank: 1, participant_name: 'Devendra Patil', score: 50, correct_count: 10, time_taken_seconds: 68 },
  { id: 's2', rank: 2, participant_name: 'Rohan Deshmukh', score: 48, correct_count: 10, time_taken_seconds: 82 },
  { id: 's3', rank: 3, participant_name: 'Sneha Kulkarni', score: 45, correct_count: 9, time_taken_seconds: 91 },
  { id: 's4', rank: 4, participant_name: 'Aniket Joshi', score: 42, correct_count: 9, time_taken_seconds: 104 },
  { id: 's5', rank: 5, participant_name: 'Pooja Verma', score: 40, correct_count: 8, time_taken_seconds: 112 },
  { id: 's6', rank: 6, participant_name: 'Tanmay Shinde', score: 38, correct_count: 8, time_taken_seconds: 119 },
  { id: 's7', rank: 7, participant_name: 'Priya Rathod', score: 35, correct_count: 7, time_taken_seconds: 125 },
  { id: 's8', rank: 8, participant_name: 'Aditya Kale', score: 32, correct_count: 7, time_taken_seconds: 130 },
  { id: 's9', rank: 9, participant_name: 'Sanket Gawande', score: 30, correct_count: 6, time_taken_seconds: 142 },
  { id: 's10', rank: 10, participant_name: 'Megha Bansal', score: 28, correct_count: 6, time_taken_seconds: 155 },
];

export default function LeaderboardPreview() {
  const [activeTab, setActiveTab] = useState('live'); // 'live' | 'scheduled'
  const [livePlayers, setLivePlayers] = useState(initialLiveLeaderboard);
  const [scheduledPlayers, setScheduledPlayers] = useState(initialScheduledLeaderboard);
  const [isRefreshingLive, setIsRefreshingLive] = useState(false);
  const [isRefreshingResults, setIsRefreshingResults] = useState(false);
  const [roundNumber, setRoundNumber] = useState(4);

  // Smooth Live Quiz Shuffle Simulation with Point Increases
  const handleShuffleLive = () => {
    setIsRefreshingLive(true);
    setTimeout(() => {
      setLivePlayers((prev) => {
        // Randomly award 80-260 points to participants to simulate a real question round
        const updated = prev.map((player) => {
          const addedPoints = Math.random() > 0.2 ? Math.floor(Math.random() * 180) + 80 : 0;
          return {
            ...player,
            score: player.score + addedPoints,
          };
        });

        // Re-sort descending by score
        return updated.sort((a, b) => b.score - a.score);
      });

      setRoundNumber((r) => (r >= 10 ? 1 : r + 1));
      setIsRefreshingLive(false);
    }, 400);
  };

  // Refresh Results Standings
  const handleRefreshResults = () => {
    setIsRefreshingResults(true);
    setTimeout(() => {
      // Simulate refreshed verified standings
      setScheduledPlayers((prev) => [...prev]);
      setIsRefreshingResults(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-3 sm:py-5 px-2 sm:px-4 text-slate-800 font-segoe">
      <div className="w-full max-w-xl mx-auto space-y-2.5 sm:space-y-3">
        
        {/* Sleek Light Tab Header */}
        <div className="flex items-center justify-between bg-white border border-slate-200/80 px-3 py-2 rounded-xl shadow-2xs">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
              <Trophy size={15} />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">Leaderboard</h2>
              <p className="text-[10px] text-slate-400 font-medium">Responsive live view</p>
            </div>
          </div>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80 text-xs">
            <button
              onClick={() => setActiveTab('live')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                activeTab === 'live' 
                  ? 'bg-white text-blue-700 shadow-2xs border border-slate-200/60' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Live Quiz
            </button>
            <button
              onClick={() => setActiveTab('scheduled')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                activeTab === 'scheduled' 
                  ? 'bg-white text-blue-700 shadow-2xs border border-slate-200/60' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Quiz Results
            </button>
          </div>
        </div>

        {/* View Content */}
        {activeTab === 'live' ? (
          <div className="space-y-2.5 animate-fade-in text-left">
            {/* Interim Feedback Card (Compact, Professional, Non-bloated) */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-block px-2 py-0.5 rounded-md text-[9.5px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                  Round {roundNumber} of 10
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  +140 pts
                </span>
              </div>

              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                  What is the default port for PostgreSQL?
                </h3>
                <p className="text-[11px] font-medium text-emerald-600 mt-0.5">
                  ✓ Correct: Option B (5432)
                </p>
              </div>

              {/* Score & Rank Summary Pill */}
              <div className="bg-slate-50 border border-slate-200/70 rounded-lg px-3 py-1.5 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1">
                  <span className="text-slate-400 font-medium">Your Score:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {livePlayers.find((p) => p.id === '4')?.score || 1140} pts
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-slate-400 font-medium">Your Rank:</span>
                  <span className="font-bold text-blue-600">
                    #{livePlayers.findIndex((p) => p.id === '4') + 1}
                  </span>
                </div>
              </div>
            </div>

            {/* Top 10 Live Standings Component with Smooth FLIP Position Transitions & Proper Refresh */}
            <Top10Leaderboard
              leaderboard={livePlayers}
              currentParticipantId="4"
              title="Top 10 Live Standings"
              onRefresh={handleShuffleLive}
              isRefreshing={isRefreshingLive}
            />

            {/* Test Shuffle Control Bar for User Verification */}
            <div className="flex items-center justify-between bg-white border border-slate-200/80 px-3 py-2 rounded-xl text-xs">
              <span className="text-slate-500 font-medium text-[11px]">
                Click to simulate round update & live shuffle:
              </span>
              <button
                type="button"
                onClick={handleShuffleLive}
                disabled={isRefreshingLive}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-lg transition-all shadow-2xs cursor-pointer"
              >
                <Shuffle size={13} className={isRefreshingLive ? 'animate-spin' : ''} />
                <span>Simulate Next Round</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5 animate-fade-in text-left">
            
            {/* Sleek, Professional Assessment Summary Bar (No Verified Attempts, No Unused Clutter) */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-3 sm:p-3.5 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                    <CheckCircle size={16} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      SQL Mastery Assessment
                    </h2>
                    <p className="text-[10px] text-slate-400 font-medium">Submission recorded</p>
                  </div>
                </div>

                {/* Concise Stats Metrics in 1 Clean Line */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200/70 px-2 py-0.5 rounded-md">
                    <span>Rank #4</span>
                    <span className="text-slate-400 font-normal">/ 24</span>
                  </span>

                  <span className="inline-flex items-center text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-md">
                    42 pts
                  </span>

                  <span className="inline-flex items-center text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                    90% acc
                  </span>

                  <span className="inline-flex items-center text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                    1m 44s
                  </span>
                </div>
              </div>
            </div>

            {/* Top 10 Leaderboard Card */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-3 sm:p-4 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 border border-amber-200/80 flex items-center justify-center font-bold shrink-0">
                    <Trophy size={15} />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">Top 10 Leaderboard</h3>
                    <p className="text-[10px] font-medium text-slate-400">Ranked by score & speed</p>
                  </div>
                </div>
                
                {/* Clean, Spacious, Professional Refresh Button */}
                <button
                  type="button"
                  onClick={handleRefreshResults}
                  disabled={isRefreshingResults}
                  className="h-8 px-3 inline-flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-700 hover:text-blue-600 border border-slate-200/90 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs shrink-0 self-center"
                  title="Refresh Leaderboard"
                  aria-label="Refresh Leaderboard"
                >
                  <RefreshCw size={13} className={isRefreshingResults ? 'animate-spin text-blue-600' : 'text-slate-500'} />
                  <span className="text-xs">Refresh</span>
                </button>
              </div>

              {/* All 10 Ranks Rendered Cleanly */}
              <div className="space-y-1">
                {scheduledPlayers.map((player) => {
                  const isCurrentPlayer = player.participant_name.includes('Aniket');
                  
                  let rankBadge = (
                    <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[11px] border border-slate-200 shrink-0">
                      #{player.rank}
                    </span>
                  );

                  let cardStyle = "bg-white hover:bg-slate-50/70 border-slate-200/70";

                  if (player.rank === 1) {
                    rankBadge = (
                      <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center text-xs shrink-0 border border-amber-200">
                        🥇
                      </span>
                    );
                    cardStyle = "bg-amber-50/25 border-amber-200/80";
                  } else if (player.rank === 2) {
                    rankBadge = (
                      <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs shrink-0 border border-slate-300">
                        🥈
                      </span>
                    );
                    cardStyle = "bg-slate-50/50 border-slate-200";
                  } else if (player.rank === 3) {
                    rankBadge = (
                      <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-orange-50 text-orange-700 flex items-center justify-center text-xs shrink-0 border border-orange-200">
                        🥉
                      </span>
                    );
                    cardStyle = "bg-orange-50/20 border-orange-200/70";
                  }

                  if (isCurrentPlayer) {
                    cardStyle += " ring-1.5 ring-blue-500 bg-blue-50/40 border-blue-300 font-semibold";
                  }

                  return (
                    <div
                      key={player.id}
                      className={`p-2 px-2.5 rounded-lg border flex items-center justify-between gap-2 transition-all ${cardStyle}`}
                    >
                      <div className="flex items-center space-x-2 min-w-0 flex-1 truncate">
                        {rankBadge}

                        <div className="min-w-0 flex-1 truncate text-left">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="font-bold text-xs text-slate-900 truncate block">
                              {player.participant_name}
                            </span>
                            {isCurrentPlayer && (
                              <span className="text-[8.5px] font-black uppercase tracking-wider bg-blue-600 text-white px-1.5 py-0.2 rounded shrink-0">
                                YOU
                              </span>
                            )}
                          </div>
                          <p className="text-[9.5px] text-slate-400 font-medium truncate">
                            {player.correct_count} correct • {Math.floor(player.time_taken_seconds / 60)}m {player.time_taken_seconds % 60}s
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 border border-blue-200/70 px-2 py-0.5 rounded-md whitespace-nowrap">
                          {player.score} <span className="text-[9px] font-normal text-slate-400">pts</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Professionally Scaled Action Buttons */}
            <div className="flex items-center gap-2 pt-0.5">
              <button
                className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-2xs transition-all cursor-pointer active:scale-98"
              >
                Explore More Quizzes
              </button>
              <button
                className="flex-1 py-2 px-3 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-lg text-xs border border-slate-200 shadow-2xs transition-all cursor-pointer active:scale-98"
              >
                Return to Home
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
