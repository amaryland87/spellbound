import React from 'react';

interface PuzzlePieceProps {
  char?: string;
  status: 'pool' | 'slot-empty' | 'slot-filled' | 'static' | 'placeholder';
  isSelected?: boolean;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  isLocked?: boolean;
}

// Replaces the LetterWheel with a versatile tile component
const PuzzlePiece: React.FC<PuzzlePieceProps> = ({ 
  char, 
  status, 
  isSelected, 
  onClick, 
  onDragStart, 
  onDrop,
  isLocked 
}) => {
  
  const handleDragOver = (e: React.DragEvent) => {
    if (status === 'slot-empty' || status === 'slot-filled') {
      e.preventDefault(); // Allow dropping
    }
  };

  const baseClasses = "w-[64px] h-[64px] md:w-[72px] md:h-[72px] rounded-xl flex items-center justify-center text-3xl md:text-4xl font-bold transition-all duration-200 select-none";

  // Styles based on status
  const styles = {
    'static': "bg-indigo-500 text-white shadow-[0_4px_0_rgb(0,0,0,0.2)] border-b-4 border-indigo-700",
    
    'pool': `bg-white text-indigo-600 border-2 ${isSelected ? 'border-yellow-400 bg-yellow-50 scale-110 ring-4 ring-yellow-200' : 'border-indigo-100 shadow-sm hover:border-indigo-300 hover:scale-105'} cursor-grab active:cursor-grabbing`,
    
    'slot-empty': `bg-indigo-50 border-4 border-dashed border-indigo-200 text-transparent ${!isLocked ? 'hover:bg-indigo-100 hover:border-indigo-300' : ''}`,
    
    'slot-filled': "bg-yellow-400 text-indigo-900 border-b-4 border-yellow-600 shadow-[0_4px_0_rgb(0,0,0,0.1)] cursor-pointer hover:bg-yellow-300",
    
    'placeholder': "bg-indigo-50/50 border-2 border-indigo-50 text-transparent opacity-50", // Used in pool when letter is placed
  };

  return (
    <div
      draggable={status === 'pool' && !isLocked}
      onDragStart={onDragStart}
      onDragOver={handleDragOver}
      onDrop={onDrop}
      onClick={onClick}
      className={`${baseClasses} ${styles[status]} ${isLocked && status !== 'static' ? 'opacity-80 pointer-events-none' : ''}`}
    >
      {char}
    </div>
  );
};

export default PuzzlePiece;
