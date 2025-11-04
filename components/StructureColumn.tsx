
import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { StructureItem as StructureItemType } from '../types';
import TreeItem from './TreeItem';
import { Scissors, Copy, ClipboardPaste, Pencil, Expand, Shrink, Trash2, ArrowUp, ArrowDown, Search } from 'lucide-react';

interface StructureColumnProps {
  items: StructureItemType[];
  selectedItemIds: string[];
  onSelect: (id: string, isCtrlOrMeta: boolean) => void;
  editingItemId: string | null;
  onStartEditing: (id:string | null) => void;
  onNameChange: (id: string, newName: string) => void;
  onReset: () => void;
  onMoveItems: (direction: 'up' | 'down') => void;
  onMoveToPosition: (id: string, position: string) => void;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  expansionState: 'all' | 'depts' | 'jobs' | 'none' | 'custom';
  onToggleExpandAll: () => void;
  onExpandLevel: (level: number) => void;
  onContextMenu: (event: React.MouseEvent, itemId: string) => void;
  clipboardItem: StructureItemType | null;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onDelete: (ids: string[]) => void;
  onModify: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  justMovedItemIds: Set<string>;
}

const StructureColumn: React.FC<StructureColumnProps> = (props) => {
  const { 
    items, selectedItemIds, onSelect, editingItemId, onStartEditing, onNameChange, 
    onReset, onMoveItems, onMoveToPosition,
    expandedIds, onToggleExpand, expansionState, onToggleExpandAll, onExpandLevel,
    onContextMenu, clipboardItem, onCopy, onCut, onPaste, onDelete, onModify,
    searchQuery, onSearchChange, justMovedItemIds
  } = props;
  
  const { setNodeRef } = useDroppable({ id: 'structure-droppable' });

  const actionButtonClass = "flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed";
  const activeToggleButtonClass = "bg-cyan-100 text-cyan-700 border-cyan-200";

  const hasSelection = selectedItemIds.length > 0;
  const hasSingleSelection = selectedItemIds.length === 1;

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col h-[75vh]">
      <div className="flex-shrink-0">
        <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold text-cyan-800">
            Current Labor Structure
            </h2>
        </div>
        <div className="bg-gray-50 p-2 rounded-md mb-3 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-gray-500 mr-2">Actions:</span>
                <button onClick={() => onMoveItems('up')} disabled={!hasSelection} className={actionButtonClass}><ArrowUp size={14}/> Up</button>
                <button onClick={() => onMoveItems('down')} disabled={!hasSelection} className={actionButtonClass}><ArrowDown size={14}/> Down</button>
                <button onClick={onModify} disabled={!hasSingleSelection} className={actionButtonClass}><Pencil size={14}/> Modify</button>
                <button onClick={onCopy} disabled={!hasSingleSelection} className={actionButtonClass}><Copy size={14}/> Copy</button>
                <button onClick={onCut} disabled={!hasSingleSelection} className={actionButtonClass}><Scissors size={14}/> Cut</button>
                <button onClick={onPaste} disabled={!clipboardItem || !hasSingleSelection} className={actionButtonClass}><ClipboardPaste size={14}/> Paste</button>
                <button onClick={() => onDelete(selectedItemIds)} disabled={!hasSelection} className={`${actionButtonClass} hover:bg-red-50 hover:border-red-200 hover:text-red-600`}><Trash2 size={14}/> Delete</button>
            </div>
             <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-gray-500 mr-2">View:</span>
                <button onClick={onToggleExpandAll} className={`${actionButtonClass} ${expansionState === 'all' ? activeToggleButtonClass : ''}`}>
                    {expansionState === 'all' ? <Shrink size={14}/> : <Expand size={14}/>}
                    {expansionState === 'all' ? 'Collapse All' : 'Expand All'}
                </button>
                <button onClick={() => onExpandLevel(1)} className={`${actionButtonClass} ${expansionState === 'depts' ? activeToggleButtonClass : ''}`}>Show Depts</button>
                <button onClick={() => onExpandLevel(2)} className={`${actionButtonClass} ${expansionState === 'jobs' ? activeToggleButtonClass : ''}`}>Show Jobs</button>
             </div>
             <div className="relative">
                <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                    type="search" 
                    placeholder="Search structure..." 
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                />
            </div>
        </div>
      </div>
      
      <div ref={setNodeRef} className="space-y-1 flex-grow overflow-y-auto pr-2 thin-scrollbar">
        {items.length > 0 ? items.map((item, index) => (
          <TreeItem 
            key={item.id} 
            item={item} 
            depth={0}
            position={`${index + 1}`}
            selectedItemIds={selectedItemIds}
            onSelect={onSelect}
            editingItemId={editingItemId}
            onStartEditing={onStartEditing}
            onNameChange={onNameChange}
            onMoveItems={onMoveItems}
            onMoveToPosition={onMoveToPosition}
            expandedIds={expandedIds}
            isExpanded={expandedIds.has(item.id)}
            onToggleExpand={onToggleExpand}
            onContextMenu={onContextMenu}
            onDeleteItem={id => onDelete([id])}
            justMovedItemIds={justMovedItemIds}
          />
        )) : <p className="text-sm text-gray-500 text-center py-4">No results found for "{searchQuery}".</p>}
      </div>
      <div className="mt-4 pt-4 border-t flex items-center gap-2 flex-shrink-0">
        <button 
          onClick={onReset}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
          Reset to Recommended
        </button>
      </div>
    </div>
  );
};

export default StructureColumn;