import React from 'react';
import { Pencil, Copy, Scissors, ClipboardPaste, Trash2 } from 'lucide-react';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onModify: () => void;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onDelete: () => void;
  canPaste: boolean;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onClose, onModify, onCopy, onCut, onPaste, onDelete, canPaste }) => {
  const menuStyle: React.CSSProperties = {
    top: `${y}px`,
    left: `${x}px`,
    position: 'fixed',
    zIndex: 1000,
  };

  const menuItemClass = "flex items-center w-full px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed";

  const handleAction = (action: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    action();
    onClose();
  };

  return (
    <div
      style={menuStyle}
      className="bg-white border border-gray-200 rounded-md shadow-lg py-1 w-40"
      onClick={(e) => e.stopPropagation()}
    >
      <button onClick={handleAction(onModify)} className={menuItemClass}>
        <Pencil size={14} className="mr-2" /> Modify
      </button>
       <button onClick={handleAction(onDelete)} className={`${menuItemClass} hover:bg-red-50 hover:text-red-600`}>
        <Trash2 size={14} className="mr-2" /> Delete
      </button>
      <div className="border-t my-1"></div>
      <button onClick={handleAction(onCopy)} className={menuItemClass}>
        <Copy size={14} className="mr-2" /> Copy
      </button>
      <button onClick={handleAction(onCut)} className={menuItemClass}>
        <Scissors size={14} className="mr-2" /> Cut
      </button>
      <button onClick={handleAction(onPaste)} disabled={!canPaste} className={menuItemClass}>
        <ClipboardPaste size={14} className="mr-2" /> Paste
      </button>
    </div>
  );
};

export default ContextMenu;
