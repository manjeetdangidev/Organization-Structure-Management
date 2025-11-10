import React from 'react';
import { Pencil, Copy, Scissors, ClipboardPaste, Trash2, Rows, ChevronsDown, PlusCircle, ChevronsUp } from 'lucide-react';
import { ItemType } from '../types';

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
  itemType?: ItemType;
  onExpandSelection: (level: 'depts' | 'jobs') => void;
  onCollapseSelection: () => void;
  onCollapseToLevel: (level: 'depts' | 'divs' | 'jobs') => void;
  onOpenAddItemModal: () => void;
  canExpandSelection: boolean;
  canExpandToDepts: boolean;
  canCollapseSelection: boolean;
  canCollapseToDepts: boolean;
  canCollapseToJobs: boolean;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ 
  x, y, onClose, onModify, onCopy, onCut, onPaste, onDelete, canPaste, itemType, 
  onExpandSelection, onCollapseSelection, onCollapseToLevel, onOpenAddItemModal,
  canExpandSelection, canExpandToDepts, canCollapseSelection, canCollapseToDepts, canCollapseToJobs,
}) => {
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

  const showAddOption = itemType === 'Division' || itemType === 'Department';
  const showExpandCollapseSeparator = canExpandSelection || canCollapseSelection;

  return (
    <div
      style={menuStyle}
      className="bg-white border border-gray-200 rounded-md shadow-lg py-1 w-48"
      onClick={(e) => e.stopPropagation()}
    >
      <button onClick={handleAction(onModify)} className={menuItemClass}>
        <Pencil size={14} className="mr-2" /> Modify
      </button>
      {showAddOption && (
           <button onClick={handleAction(onOpenAddItemModal)} className={menuItemClass}>
            <PlusCircle size={14} className="mr-2" /> Add {itemType === 'Division' ? 'Department' : 'Job'}
          </button>
      )}
       <button onClick={handleAction(onDelete)} className={`${menuItemClass} hover:bg-red-50 hover:text-red-600`}>
        <Trash2 size={14} className="mr-2" /> Delete
      </button>

      {showExpandCollapseSeparator && <div className="border-t my-1"></div>}
      
      <button onClick={handleAction(() => onExpandSelection('depts'))} disabled={!canExpandToDepts} className={menuItemClass}>
        <Rows size={14} className="mr-2" /> Expand to Depts
      </button>
      <button onClick={handleAction(() => onExpandSelection('jobs'))} disabled={!canExpandSelection} className={menuItemClass}>
        <ChevronsDown size={14} className="mr-2" /> Expand to Jobs
      </button>
      
      <button onClick={handleAction(() => onCollapseToLevel('jobs'))} disabled={!canCollapseToJobs} className={menuItemClass}>
          <ChevronsUp size={14} className="mr-2" /> Collapse to Jobs
      </button>
      <button onClick={handleAction(() => onCollapseToLevel('depts'))} disabled={!canCollapseToDepts} className={menuItemClass}>
          <ChevronsUp size={14} className="mr-2" /> Collapse to Depts
      </button>
      <button onClick={handleAction(() => onCollapseToLevel('divs'))} disabled={!canCollapseToDepts} className={menuItemClass}>
          <ChevronsUp size={14} className="mr-2" /> Collapse to Divs
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