import React, { useState, useCallback } from 'react';
import { Difficulty, GameState, Choice } from './types';
import { generatePuzzle, generatePuzzleImage } from './services/geminiService';
import PuzzlePiece from './components/LetterWheel'; // Using the refactored file
import { Button } from './components/Button';
import { ALPHABET } from './constants';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    status: 'idle',
    puzzle: null,
    imageUrl: null,
    userAnswers: {},
    choices: [],
  });
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.EASY);
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'incorrect'>('none');
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null); // For click-to-place

  // Initialize or reset game
  const startNewRound = useCallback(async () => {
    setGameState(prev => ({ 
      ...prev, 
      status: 'loading', 
      userAnswers: {}, 
      puzzle: null, 
      imageUrl: null, 
      choices: [] 
    }));
    setFeedback('none');
    setSelectedChoiceId(null);

    try {
      // 1. Get the puzzle word
      const puzzle = await generatePuzzle(difficulty);
      
      // 2. Generate Choices (Correct letters + Random distractors to make 6)
      const correctLetters = puzzle.missingIndices.map(i => puzzle.word[i]);
      const lettersNeeded = 6 - correctLetters.length;
      const distractors: string[] = [];
      
      for(let i = 0; i < lettersNeeded; i++) {
        distractors.push(ALPHABET[Math.floor(Math.random() * ALPHABET.length)]);
      }

      const poolChars = [...correctLetters, ...distractors];
      
      // Create Choice objects with unique IDs and Shuffle
      const choices: Choice[] = poolChars
        .map((char, i) => ({ id: `choice-${i}-${Date.now()}`, char }))
        .sort(() => Math.random() - 0.5);

      setGameState(prev => ({
        ...prev,
        puzzle,
        choices,
        userAnswers: {}, // Empty start
      }));

      // 3. Start fetching image (async update)
      generatePuzzleImage(puzzle.word).then(url => {
        if (url) {
          setGameState(prev => ({ ...prev, imageUrl: url }));
        }
      });
      
      setGameState(prev => ({ ...prev, status: 'playing' }));

    } catch (error) {
      console.error(error);
      setGameState(prev => ({ ...prev, status: 'error', errorMessage: "Oops! Something went wrong." }));
    }
  }, [difficulty]);

  // Interaction Logic

  const placeLetter = (slotIndex: number, choiceId: string) => {
    // If this choice is already used in another slot, remove it from there
    const newAnswers = { ...gameState.userAnswers };
    
    // Find if choiceId is used elsewhere and remove it
    Object.keys(newAnswers).forEach(key => {
      if (newAnswers[Number(key)] === choiceId) {
        delete newAnswers[Number(key)];
      }
    });

    // Place in new slot
    newAnswers[slotIndex] = choiceId;

    setGameState(prev => ({
      ...prev,
      userAnswers: newAnswers
    }));
    setFeedback('none');
    setSelectedChoiceId(null); // Clear selection after placing
  };

  const removeLetter = (slotIndex: number) => {
    const newAnswers = { ...gameState.userAnswers };
    delete newAnswers[slotIndex];
    setGameState(prev => ({ ...prev, userAnswers: newAnswers }));
    setFeedback('none');
  };

  // Drag Handlers
  const handleDragStart = (e: React.DragEvent, choiceId: string) => {
    e.dataTransfer.setData("text/plain", choiceId);
    // Optional: Set drag image
  };

  const handleDrop = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault();
    const choiceId = e.dataTransfer.getData("text/plain");
    if (choiceId) {
      placeLetter(slotIndex, choiceId);
    }
  };

  // Click Handlers (Tap to select, Tap to place)
  const handleChoiceClick = (choiceId: string) => {
    // If already placed, do nothing (or maybe animate shaking?)
    const isUsed = Object.values(gameState.userAnswers).includes(choiceId);
    if (isUsed) return;

    if (selectedChoiceId === choiceId) {
      setSelectedChoiceId(null); // Deselect
    } else {
      setSelectedChoiceId(choiceId); // Select
    }
  };

  const handleSlotClick = (slotIndex: number) => {
    // If we have a selection, place it
    if (selectedChoiceId) {
      placeLetter(slotIndex, selectedChoiceId);
    } 
    // If slot is filled, empty it
    else if (gameState.userAnswers[slotIndex]) {
      removeLetter(slotIndex);
    }
  };

  const checkAnswer = () => {
    if (!gameState.puzzle) return;

    const word = gameState.puzzle.word;
    
    // Check if all slots are filled
    const allFilled = gameState.puzzle.missingIndices.every(idx => gameState.userAnswers[idx]);
    if (!allFilled) {
      setFeedback('incorrect'); // Or a specific message like "Fill all spots!"
      return;
    }

    // Verify correctness
    const isCorrect = gameState.puzzle.missingIndices.every(index => {
      const choiceId = gameState.userAnswers[index];
      const choice = gameState.choices.find(c => c.id === choiceId);
      return choice?.char === word[index];
    });

    if (isCorrect) {
      setFeedback('correct');
      setGameState(prev => ({ ...prev, status: 'success' }));
    } else {
      setFeedback('incorrect');
    }
  };

  // --- RENDER HELPERS ---

  const renderStartScreen = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 space-y-8 text-center animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-6xl font-bold text-indigo-600 tracking-tight drop-shadow-sm">SpellBound</h1>
        <p className="text-xl text-indigo-400">Magical Spelling Adventure</p>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-xl border-b-8 border-indigo-200 w-full max-w-md space-y-6">
        <h2 className="text-2xl font-bold text-slate-700">Choose Difficulty</h2>
        
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => setDifficulty(Difficulty.EASY)}
            className={`flex-1 p-4 rounded-2xl border-4 transition-all ${
              difficulty === Difficulty.EASY 
                ? 'border-green-400 bg-green-50 text-green-700 scale-105 shadow-md' 
                : 'border-slate-200 text-slate-400 hover:border-green-200'
            }`}
          >
            <div className="text-3xl mb-2">🎈</div>
            <div className="font-bold">Easy</div>
            <div className="text-xs opacity-75">3-4 Letters</div>
          </button>
          
          <button
            onClick={() => setDifficulty(Difficulty.HARD)}
            className={`flex-1 p-4 rounded-2xl border-4 transition-all ${
              difficulty === Difficulty.HARD 
                ? 'border-purple-400 bg-purple-50 text-purple-700 scale-105 shadow-md' 
                : 'border-slate-200 text-slate-400 hover:border-purple-200'
            }`}
          >
            <div className="text-3xl mb-2">🚀</div>
            <div className="font-bold">Hard</div>
            <div className="text-xs opacity-75">4-6 Letters</div>
          </button>
        </div>

        <Button onClick={startNewRound} size="lg" className="w-full">
          Start Playing!
        </Button>
      </div>
    </div>
  );

  const renderGame = () => {
    if (!gameState.puzzle) return null;
    
    const { word, missingIndices, hint } = gameState.puzzle;
    const letters = word.split('');
    const isGameLocked = gameState.status === 'success';

    return (
      <div className="min-h-screen flex flex-col max-w-3xl mx-auto p-4">
        {/* Header */}
        <header className="flex justify-between items-center py-4">
          <button 
            onClick={() => setGameState(prev => ({...prev, status: 'idle'}))}
            className="text-indigo-400 hover:text-indigo-600 font-bold flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
            Back
          </button>
          <div className="bg-white px-4 py-1 rounded-full text-sm font-bold text-indigo-400 shadow-sm">
            {difficulty === Difficulty.EASY ? '🎈 Easy Mode' : '🚀 Hard Mode'}
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center gap-8 py-4">
          {/* Image Card */}
          <div className="relative w-full max-w-md aspect-square bg-white rounded-3xl shadow-lg border-4 border-white overflow-hidden group">
            {gameState.imageUrl ? (
              <img 
                src={gameState.imageUrl} 
                alt="Puzzle Hint" 
                className="w-full h-full object-cover animate-in fade-in duration-700"
              />
            ) : (
              <div className="w-full h-full bg-indigo-50 flex items-center justify-center flex-col gap-4">
                <span className="text-6xl animate-bounce">🎨</span>
                <span className="text-indigo-300 font-bold">Painting...</span>
              </div>
            )}
            
            <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm p-4 text-center border-t-2 border-indigo-100 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <p className="text-indigo-800 font-bold">Hint: {hint}</p>
            </div>
          </div>

          {/* Choice Pool */}
          {!isGameLocked && (
            <div className="w-full max-w-2xl bg-indigo-50/80 p-4 rounded-2xl shadow-inner border-2 border-indigo-100">
              <p className="text-center text-indigo-400 font-semibold mb-2 text-sm uppercase tracking-wide">
                Drag letters to complete the word
              </p>
              <div className="flex flex-wrap justify-center gap-3 md:gap-4">
                {gameState.choices.map((choice) => {
                  const isUsed = Object.values(gameState.userAnswers).includes(choice.id);
                  
                  if (isUsed) {
                     // Render placeholder to keep layout stable
                     return <PuzzlePiece key={choice.id} status="placeholder" />;
                  }

                  return (
                    <PuzzlePiece
                      key={choice.id}
                      char={choice.char}
                      status="pool"
                      isSelected={selectedChoiceId === choice.id}
                      onClick={() => handleChoiceClick(choice.id)}
                      onDragStart={(e) => handleDragStart(e, choice.id)}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Word Puzzle Area */}
          <div className="flex flex-wrap justify-center items-center gap-2 md:gap-4 mt-2 p-4 rounded-xl">
            {letters.map((char, idx) => {
              const isMissing = missingIndices.includes(idx);
              
              if (isMissing) {
                const filledChoiceId = gameState.userAnswers[idx];
                const filledChoice = gameState.choices.find(c => c.id === filledChoiceId);

                if (filledChoice) {
                   return (
                     <PuzzlePiece 
                       key={idx} 
                       char={filledChoice.char} 
                       status="slot-filled"
                       onClick={() => handleSlotClick(idx)}
                       isLocked={isGameLocked}
                     />
                   );
                } else {
                   return (
                     <PuzzlePiece 
                       key={idx} 
                       status="slot-empty"
                       onDrop={(e) => handleDrop(e, idx)}
                       onClick={() => handleSlotClick(idx)}
                       isLocked={isGameLocked}
                     />
                   );
                }
              }

              // Static Letter
              return <PuzzlePiece key={idx} char={char} status="static" />;
            })}
          </div>

          {/* Feedback Message */}
          <div className="h-8 text-center">
            {feedback === 'correct' && (
               <div className="text-green-600 font-bold text-2xl animate-bounce">
                 🎉 Outstanding!
               </div>
            )}
            {feedback === 'incorrect' && (
               <div className="text-orange-500 font-bold text-2xl animate-shake">
                 🤔 Oops! Try again.
               </div>
            )}
          </div>

          {/* Actions */}
          <div className="w-full max-w-xs pb-8">
            {gameState.status === 'success' ? (
              <Button onClick={startNewRound} size="lg" className="w-full animate-in zoom-in duration-300" variant="success">
                Next Word ➔
              </Button>
            ) : (
              <Button onClick={checkAnswer} size="lg" className="w-full" disabled={Object.keys(gameState.userAnswers).length !== missingIndices.length}>
                Check Answer
              </Button>
            )}
          </div>
        </main>
      </div>
    );
  };

  return (
    <>
      {gameState.status === 'idle' && renderStartScreen()}
      {gameState.status === 'loading' && (
        <div className="flex flex-col items-center justify-center min-h-screen space-y-6">
          <div className="relative w-32 h-32">
            <div className="absolute inset-0 border-8 border-indigo-200 rounded-full"></div>
            <div className="absolute inset-0 border-8 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-2xl font-bold text-indigo-600 animate-pulse">Dreaming up a word...</p>
        </div>
      )}
      {(gameState.status === 'playing' || gameState.status === 'success') && renderGame()}
      {gameState.status === 'error' && (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <h2 className="text-2xl font-bold text-red-500">Oh no!</h2>
          <p className="text-slate-600">{gameState.errorMessage}</p>
          <Button onClick={() => setGameState(prev => ({ ...prev, status: 'idle' }))}>Go Back</Button>
        </div>
      )}
      
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </>
  );
};

export default App;
