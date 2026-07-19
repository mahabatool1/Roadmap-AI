'use client';

import React, { useState, useEffect } from 'react';
import { useLearningStore, QuizQuestion, Quiz } from '@/lib/store';
import { CheckSquare, Loader2, Sparkles, AlertCircle, CheckCircle, XCircle, ArrowRight, RefreshCw, Award } from 'lucide-react';

export default function Quizzes() {
  const {
    theme,
    roadmaps,
    currentQuiz,
    setCurrentQuiz,
    answerQuizQuestion,
    submitQuiz,
    weakAreas,
    activeRoadmapId
  } = useLearningStore();

  const [selectedRoadmapId, setSelectedRoadmapId] = useState(() => activeRoadmapId || (roadmaps.length > 0 ? roadmaps[0].id : ''));
  const [selectedMilestoneId, setSelectedMilestoneId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'mcq' | 'question' | 'true-false' | 'fill-blank'>('mcq');

  const isDark = theme === 'dark';

  // Find active roadmap based on dropdown selection
  const selectedRoadmap = roadmaps.find((r) => r.id === selectedRoadmapId);

  // Sync selectedMilestoneId dynamically if empty or mismatch
  const milestones = selectedRoadmap?.milestones || [];
  const selectedMilestone = milestones.find((m) => m.id === selectedMilestoneId) || milestones[0];

  // Helper calculation functions for the 25-question tabs
  const getTabStats = () => {
    if (!currentQuiz) return { mcq: 0, question: 0, 'true-false': 0, 'fill-blank': 0 };
    const stats = { mcq: 0, question: 0, 'true-false': 0, 'fill-blank': 0 };
    currentQuiz.questions.forEach((q) => {
      const type = q.type || 'mcq';
      const ans = currentQuiz.userAnswers[q.id];
      const isAnswered = ans !== undefined && ans !== null && (typeof ans === 'string' ? ans.trim().length > 0 : true);
      if (isAnswered) {
        stats[type]++;
      }
    });
    return stats;
  };

  const getTabTotals = () => {
    if (!currentQuiz) return { mcq: 0, question: 0, 'true-false': 0, 'fill-blank': 0 };
    const totals = { mcq: 0, question: 0, 'true-false': 0, 'fill-blank': 0 };
    currentQuiz.questions.forEach((q) => {
      const type = q.type || 'mcq';
      totals[type]++;
    });
    return totals;
  };

  // Automatically generate quiz if a placeholder quiz (with empty questions) is loaded
  useEffect(() => {
    if (currentQuiz && currentQuiz.questions.length === 0 && !isLoading) {
      const handleGenerateQuizForPlaceholder = async () => {
        setIsLoading(true);
        setErrorMsg('');
        try {
          const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'generate-quiz',
              payload: {
                moduleTitle: currentQuiz.moduleTitle,
                roadmapTitle: currentQuiz.roadmapTitle
              }
            })
          });

          if (!response.ok) {
            throw new Error('Failed to reach server-side Gemini Quiz generator.');
          }

          const generatedData = await response.json();
          if (generatedData.error) {
            throw new Error(generatedData.error);
          }

          const formattedQuiz: Quiz = {
            moduleTitle: currentQuiz.moduleTitle,
            roadmapId: currentQuiz.roadmapId,
            roadmapTitle: currentQuiz.roadmapTitle,
            questions: generatedData.questions.map((q: any) => ({
              id: q.id || Math.random().toString(),
              type: q.type || 'mcq',
              questionText: q.questionText,
              options: q.options || [],
              correctOptionIndex: q.correctOptionIndex !== undefined ? q.correctOptionIndex : -1,
              correctTextAnswer: q.correctTextAnswer || '',
              explanation: q.explanation || ''
            })),
            userAnswers: {},
            score: null,
            submitted: false
          };

          setCurrentQuiz(formattedQuiz);
        } catch (err: any) {
          console.error(err);
          setErrorMsg(err.message || 'Something went wrong while generating the quiz.');
          // Reset currentQuiz on failure so they can try again from the form
          setCurrentQuiz(null);
        } finally {
          setIsLoading(false);
        }
      };

      handleGenerateQuizForPlaceholder();
    }
  }, [currentQuiz, isLoading, setCurrentQuiz]);

  const handleExitQuiz = () => {
    if (currentQuiz) {
      if (currentQuiz.roadmapId) {
        setSelectedRoadmapId(currentQuiz.roadmapId);
      }
      const roadmapObj = roadmaps.find((r) => r.id === currentQuiz.roadmapId);
      if (roadmapObj) {
        const milestoneObj = roadmapObj.milestones.find((m) => m.title === currentQuiz.moduleTitle);
        if (milestoneObj) {
          setSelectedMilestoneId(milestoneObj.id);
        }
      }
    }
    setCurrentQuiz(null);
  };

  // Trigger server-side AI quiz generation
  const handleGenerateQuiz = async () => {
    if (!selectedRoadmap || !selectedMilestone) return;

    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-quiz',
          payload: {
            moduleTitle: selectedMilestone.title,
            roadmapTitle: selectedRoadmap.title
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to reach server-side Gemini Quiz generator.');
      }

      const generatedData = await response.json();
      
      if (generatedData.error) {
        throw new Error(generatedData.error);
      }

      const formattedQuiz: Quiz = {
        moduleTitle: selectedMilestone.title,
        roadmapId: selectedRoadmap.id,
        roadmapTitle: selectedRoadmap.title,
        questions: generatedData.questions.map((q: any) => ({
          id: q.id || Math.random().toString(),
          type: q.type || 'mcq',
          questionText: q.questionText,
          options: q.options || [],
          correctOptionIndex: q.correctOptionIndex !== undefined ? q.correctOptionIndex : -1,
          correctTextAnswer: q.correctTextAnswer || '',
          explanation: q.explanation || ''
        })),
        userAnswers: {},
        score: null,
        submitted: false
      };

      setCurrentQuiz(formattedQuiz);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Something went wrong while generating the quiz.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!currentQuiz) return;
    
    // Validate that all questions have been answered with a non-empty value
    const answeredCount = Object.keys(currentQuiz.userAnswers).filter((key) => {
      const val = currentQuiz.userAnswers[key];
      if (val === undefined || val === null) return false;
      if (typeof val === 'string') return val.trim().length > 0;
      return true;
    }).length;

    if (answeredCount < currentQuiz.questions.length) {
      alert(`Please answer all ${currentQuiz.questions.length} assessment questions before submitting! You've completed ${answeredCount}/${currentQuiz.questions.length}.`);
      return;
    }

    submitQuiz();
  };

  const handleRetakeQuiz = () => {
    if (!currentQuiz) return;
    setCurrentQuiz({
      ...currentQuiz,
      userAnswers: {},
      score: null,
      submitted: false
    });
  };

  // Check if we are currently loading an AI generated quiz structure
  const isGenerating = isLoading;

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto h-screen scrollbar-thin">
      
      {/* Title */}
      <div>
        <h2 className={`text-2xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
          Checkpoint Assessments Hub
        </h2>
        <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Generate dynamic, 25-question comprehensive conceptual and practical quizzes using server-side Gemini AI.
        </p>
      </div>

      {isGenerating && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col items-center justify-center text-white p-6 animate-fade-in">
          <Loader2 size={50} className={`animate-spin mb-4 ${isDark ? 'text-violet-400' : 'text-sky-400'}`} />
          <h3 className="text-xl font-bold tracking-tight mb-2">Assembling Checkpoint Quiz...</h3>
          <p className="text-sm text-slate-400 text-center max-w-sm">
            We are asking Gemini 3.5 to build 25 distinct questions (10 MCQs, 5 Short Questions, 5 True/False, 5 Fill-Blanks) covering <strong className="text-white">&quot;{selectedMilestone?.title || currentQuiz?.moduleTitle}&quot;</strong>...
          </p>
        </div>
      )}

      {currentQuiz ? (
        /* ACTIVE QUIZ EXPERIENCE */
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-500/10">
            <div>
              <span className={`text-[10px] uppercase font-bold tracking-widest ${isDark ? 'text-violet-400' : 'text-sky-600'}`}>
                Assessment Course: {currentQuiz.roadmapTitle}
              </span>
              <h3 className={`text-lg font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
                Checkpoint: {currentQuiz.moduleTitle}
              </h3>
            </div>

            <button
              onClick={handleExitQuiz}
              className={`text-xs font-bold hover:underline ${isDark ? 'text-violet-400' : 'text-sky-500'}`}
            >
              Exit assessment
            </button>
          </div>

          {/* Quiz Complete Grade Card */}
          {currentQuiz.submitted && currentQuiz.score !== null && (
            <div
              className={`p-5 rounded-2xl border text-center relative overflow-hidden transition-all duration-300 ${
                currentQuiz.score >= 70
                  ? isDark
                    ? 'bg-green-500/5 border-green-500/20 text-green-300'
                    : 'bg-green-50 border-green-200 text-green-800'
                  : isDark
                  ? 'bg-orange-500/5 border-orange-500/20 text-orange-300'
                  : 'bg-orange-50 border-orange-200 text-orange-800'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                {currentQuiz.score >= 70 ? (
                  <>
                    <Award size={40} className={isDark ? 'text-green-400 animate-bounce' : 'text-green-600 animate-bounce'} />
                    <h4 className="text-lg font-black tracking-tight">Checkpoint Cleared!</h4>
                    <p className="text-3xl font-black">{currentQuiz.score}% Score</p>
                    <p className="text-xs text-slate-400 max-w-md mt-1 leading-relaxed">
                      Amazing job! You have demonstrated strong comprehension of the target topics. This skill is officially recognized under your strengths.
                    </p>
                  </>
                ) : (
                  <>
                    <AlertCircle size={40} className={isDark ? 'text-orange-400 animate-pulse' : 'text-orange-600 animate-pulse'} />
                    <h4 className="text-lg font-black tracking-tight">Practice Recommended</h4>
                    <p className="text-3xl font-black">{currentQuiz.score}% Score</p>
                    <p className="text-xs text-slate-400 max-w-md mt-1 leading-relaxed">
                      Don&apos;t worry! This module is now logged under &quot;Weak Areas&quot; on your dashboard. Use the detailed explanations below to review, then retake the checkpoint.
                    </p>
                  </>
                )}

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleRetakeQuiz}
                    className={`py-2 px-4 rounded-xl font-bold text-xs flex items-center gap-1 border transition-all hover:scale-105 active:scale-95 ${
                      isDark ? 'border-slate-500/20 hover:bg-slate-500/10' : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <RefreshCw size={12} /> Retake Assessment
                  </button>
                  <button
                    onClick={handleExitQuiz}
                    className={`py-2 px-4 rounded-xl font-bold text-xs text-white transition-all hover:scale-105 active:scale-95 ${
                      isDark ? 'bg-violet-600 hover:bg-violet-500' : 'bg-sky-500 hover:bg-sky-600'
                    }`}
                  >
                    Go Back To Hub
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Section Tabs */}
          <div className="flex flex-wrap gap-2 pb-2">
            {[
              { id: 'mcq', label: '10 MCQs' },
              { id: 'question', label: '5 Conceptual' },
              { id: 'true-false', label: '5 True/False' },
              { id: 'fill-blank', label: '5 Fill Blanks' }
            ].map((tab) => {
              const stats = getTabStats();
              const totals = getTabTotals();
              const count = stats[tab.id as keyof typeof stats] || 0;
              const total = totals[tab.id as keyof typeof totals] || 0;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 min-w-[110px] p-2.5 rounded-xl border text-[11px] font-bold transition-all text-center flex flex-col items-center justify-center gap-0.5 ${
                    isActive
                      ? isDark
                        ? 'bg-violet-500/10 border-violet-500 text-violet-300 shadow-sm shadow-violet-500/5'
                        : 'bg-sky-500/10 border-sky-500 text-sky-700 shadow-sm shadow-sky-500/5'
                      : isDark
                      ? 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-300 hover:border-slate-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="uppercase tracking-wider">{tab.label}</span>
                  <span className="text-[10px] opacity-75">
                    {count} / {total} Done
                  </span>
                </button>
              );
            })}
          </div>

          {/* Question List Cards */}
          <div className="space-y-6">
            {currentQuiz.questions
              .filter((q) => (q.type || 'mcq') === activeTab)
              .map((q) => {
                const overallIdx = currentQuiz.questions.findIndex((item) => item.id === q.id);
                const selectedOpt = currentQuiz.userAnswers[q.id];
                const qType = q.type || 'mcq';
                
                let isCorrect = false;
                if (qType === 'mcq' || qType === 'true-false') {
                  isCorrect = selectedOpt === q.correctOptionIndex;
                } else if (qType === 'fill-blank') {
                  isCorrect = String(selectedOpt || '').trim().toLowerCase() === String(q.correctTextAnswer || '').trim().toLowerCase();
                } else if (qType === 'question') {
                  isCorrect = String(selectedOpt || '').trim().length >= 5;
                }

                return (
                  <div
                    key={q.id}
                    className={`p-5 rounded-2xl border transition-all duration-300 ${
                      isDark
                        ? 'bg-[#121631]/40 border-violet-500/5'
                        : 'bg-white border-slate-200 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-500/10 px-2 py-0.5 rounded-full shrink-0">
                        Q{overallIdx + 1 < 10 ? `0${overallIdx + 1}` : overallIdx + 1}
                      </span>
                      <p className="font-bold text-sm tracking-tight leading-normal">{q.questionText}</p>
                    </div>

                    {/* Rendering different types */}
                    {qType === 'mcq' && (
                      <div className="mt-4 space-y-2">
                        {q.options.map((opt, oIdx) => {
                          const isSelected = selectedOpt === oIdx;
                          const showCorrect = currentQuiz.submitted && oIdx === q.correctOptionIndex;
                          const showIncorrect = currentQuiz.submitted && isSelected && !isCorrect;

                          return (
                            <button
                              key={oIdx}
                              disabled={currentQuiz.submitted}
                              onClick={() => answerQuizQuestion(q.id, oIdx)}
                              className={`w-full p-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between gap-3 transition-all ${
                                showCorrect
                                  ? 'bg-green-500/10 border-green-500/40 text-green-400'
                                  : showIncorrect
                                  ? 'bg-red-500/10 border-red-500/40 text-red-400'
                                  : isSelected
                                  ? isDark
                                    ? 'bg-violet-500/10 border-violet-500 text-violet-300'
                                    : 'bg-sky-500/10 border-sky-500 text-sky-700'
                                  : isDark
                                  ? 'bg-violet-950/5 border-violet-500/5 text-slate-300 hover:bg-violet-950/10 hover:border-violet-500/15'
                                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/50'
                              }`}
                            >
                              <span>{opt}</span>
                              <div className="shrink-0">
                                {showCorrect && <CheckCircle size={14} className="text-green-500" />}
                                {showIncorrect && <XCircle size={14} className="text-red-500" />}
                                {isSelected && !currentQuiz.submitted && (
                                  <div className="w-3.5 h-3.5 rounded-full border-2 border-current flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {qType === 'true-false' && (
                      <div className="mt-4 flex gap-4">
                        {[
                          { index: 0, label: 'True' },
                          { index: 1, label: 'False' }
                        ].map((btn) => {
                          const isSelected = selectedOpt === btn.index;
                          const showCorrect = currentQuiz.submitted && btn.index === q.correctOptionIndex;
                          const showIncorrect = currentQuiz.submitted && isSelected && selectedOpt !== q.correctOptionIndex;

                          return (
                            <button
                              key={btn.index}
                              disabled={currentQuiz.submitted}
                              onClick={() => answerQuizQuestion(q.id, btn.index)}
                              className={`flex-1 py-3 px-4 rounded-xl border text-center text-xs font-bold transition-all ${
                                showCorrect
                                  ? 'bg-green-500/10 border-green-500/40 text-green-400'
                                  : showIncorrect
                                  ? 'bg-red-500/10 border-red-500/40 text-red-400'
                                  : isSelected
                                  ? isDark
                                    ? 'bg-violet-500/10 border-violet-500 text-violet-300'
                                    : 'bg-sky-500/10 border-sky-500 text-sky-700'
                                  : isDark
                                  ? 'bg-violet-950/5 border-violet-500/5 text-slate-300 hover:bg-violet-950/10 hover:border-violet-500/15'
                                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/50'
                              }`}
                            >
                              {btn.label}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {qType === 'question' && (
                      <div className="mt-4 space-y-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Your Conceptual Response:
                        </label>
                        <textarea
                          disabled={currentQuiz.submitted}
                          value={selectedOpt || ''}
                          onChange={(e) => answerQuizQuestion(q.id, e.target.value)}
                          placeholder="Type your explanation or conceptual answer here..."
                          rows={3}
                          className={`w-full p-3 rounded-xl border text-xs outline-none transition-all ${
                            isDark
                              ? 'bg-[#0f1225] border-violet-500/20 text-white focus:border-violet-500'
                              : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-sky-500'
                          }`}
                        />
                        {currentQuiz.submitted && (
                          <div className="mt-2 space-y-2 text-xs">
                            <div className={`p-3 rounded-xl border ${
                              isDark ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-300' : 'bg-emerald-50 border-emerald-100 text-emerald-800'
                            }`}>
                              <p className="font-bold uppercase tracking-wider text-[10px]">Model Answer / Key Terms:</p>
                              <p className="mt-1 font-semibold">{q.correctTextAnswer}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {qType === 'fill-blank' && (
                      <div className="mt-4 space-y-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Your Answer:
                        </label>
                        <input
                          type="text"
                          disabled={currentQuiz.submitted}
                          value={selectedOpt || ''}
                          onChange={(e) => answerQuizQuestion(q.id, e.target.value)}
                          placeholder="Type the word that fits in the blank..."
                          className={`w-full p-2.5 rounded-xl border text-xs outline-none transition-all ${
                            currentQuiz.submitted
                              ? isCorrect
                                ? 'bg-green-500/5 border-green-500/40 text-green-400'
                                : 'bg-red-500/5 border-red-500/40 text-red-400'
                              : isDark
                              ? 'bg-[#0f1225] border-violet-500/20 text-white focus:border-violet-500'
                              : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-sky-500'
                          }`}
                        />
                        {currentQuiz.submitted && (
                          <div className="mt-2 text-xs font-semibold">
                            Correct word: <span className="text-emerald-400">{q.correctTextAnswer}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Assessment Explanations Panel */}
                    {currentQuiz.submitted && (
                      <div className={`mt-4 p-3 rounded-xl border leading-relaxed text-[11px] font-medium animate-fade-in ${
                        isCorrect
                          ? 'bg-green-500/5 border-green-500/10 text-slate-300'
                          : 'bg-red-500/5 border-red-500/10 text-slate-300'
                      }`}>
                        <p className="font-bold mb-1 uppercase tracking-wider text-[9px] text-slate-400">
                          {isCorrect ? '✅ Explanation:' : '❌ Correction Guide:'}
                        </p>
                        <p>{q.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>

          {/* Action Footer */}
          {!currentQuiz.submitted && (
            <div className="flex justify-end pt-2">
              <button
                onClick={handleSubmit}
                className={`px-6 py-3 rounded-xl font-bold text-xs text-white flex items-center gap-1.5 transition-all shadow-md hover:scale-105 active:scale-95 ${
                  isDark ? 'bg-violet-600 hover:bg-violet-500' : 'bg-sky-500 hover:bg-sky-600'
                }`}
              >
                Submit Assessment <ArrowRight size={13} />
              </button>
            </div>
          )}
        </div>
      ) : roadmaps.length === 0 ? (
        /* QUIZ SELECTION EMPTY STATE */
        <div className="max-w-md mx-auto space-y-6 animate-fade-in text-center py-12">
          <div className={`w-12 h-12 rounded-xl mx-auto flex items-center justify-center border mb-3 ${
            isDark ? 'bg-violet-500/10 border-violet-500/25 text-violet-400' : 'bg-sky-500/10 border-sky-300 text-sky-600'
          }`}>
            <CheckSquare size={24} />
          </div>
          <h3 className={`text-lg font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
            No roadmaps available yet
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Please enter a topic on the Home dashboard to generate your first custom learning roadmap before taking checkpoint assessments!
          </p>
        </div>
      ) : (
        /* QUIZ SELECTION DASHBOARD */
        <div className="max-w-md mx-auto space-y-6 animate-fade-in">
          <div
            className={`rounded-2xl border p-6 relative transition-all duration-300 ${
              isDark
                ? 'bg-gradient-to-br from-[#121631] via-[#111428] to-[#121631] border-violet-500/10'
                : 'bg-white border-slate-200'
            }`}
          >
            <div className="text-center mb-6">
              <div className={`w-12 h-12 rounded-xl mx-auto flex items-center justify-center border mb-3 ${
                isDark ? 'bg-violet-500/10 border-violet-500/25 text-violet-400' : 'bg-sky-500/10 border-sky-300 text-sky-600'
              }`}>
                <CheckSquare size={24} />
              </div>
              <h3 className="text-lg font-extrabold tracking-tight">Generate Checkpoint</h3>
              <p className="text-xs text-slate-400 mt-1">Select a course module to generate a fresh dynamic challenge.</p>
            </div>

            <div className="space-y-4">
              {/* Select Roadmap */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                  1. Select course track
                </label>
                <select
                  value={selectedRoadmapId}
                  onChange={(e) => {
                    setSelectedRoadmapId(e.target.value);
                    setSelectedMilestoneId('');
                  }}
                  className={`w-full p-2.5 rounded-xl border text-xs font-bold outline-none cursor-pointer ${
                    isDark
                      ? 'bg-violet-950/20 border-violet-500/35 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  {roadmaps.map((r) => (
                    <option key={r.id} value={r.id} className={isDark ? 'bg-[#111428]' : 'bg-white'}>
                      {r.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Milestone */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                  2. Select milestone module
                </label>
                <select
                  value={selectedMilestoneId}
                  onChange={(e) => setSelectedMilestoneId(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border text-xs font-bold outline-none cursor-pointer ${
                    isDark
                      ? 'bg-violet-950/20 border-violet-500/35 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                  disabled={!selectedRoadmap}
                >
                  {selectedRoadmap?.milestones.map((m) => (
                    <option key={m.id} value={m.id} className={isDark ? 'bg-[#111428]' : 'bg-white'}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>

              {errorMsg && <p className="text-xs text-red-400 font-bold mt-1 text-center">{errorMsg}</p>}

              {/* Submit Button */}
              <button
                onClick={handleGenerateQuiz}
                disabled={!selectedMilestone}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-97 disabled:opacity-50 mt-4 ${
                  isDark
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500'
                    : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700'
                }`}
              >
                Generate Assessment ✨
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
