import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { StructureItem as StructureItemType } from '../types';
import TreeItem from './TreeItem';
import { Search, ChevronsRight } from 'lucide-react';
import { Features } from '../App';

interface AvailableJobsColumnProps {
  items: StructureItemType[];
  selectedItemIds: string[];
  onSelect: (id: string, isCtrlOrMeta: boolean) => void;
  onCreateCustomJob: () => void;
  editingItemId: string | null;
  onStartEditing: (id: string | null) => void;
  onNameChange: (id: string, newName: string) => void;
  onDeleteItem: (id: string) => void;
  onContextMenu: (event: React.MouseEvent, itemId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  itemCount: number;
  features: Features;
  onToggleVisibility: () => void;
}

const AvailableJobsColumn: React.FC<AvailableJobsColumnProps> = ({ items, selectedItemIds, onSelect, onCreateCustomJob, editingItemId, onStartEditing, onNameChange, onDeleteItem, onContextMenu, searchQuery, onSearchChange, itemCount, features, onToggleVisibility }) => {
  const { setNodeRef } = useDroppable({ id: 'available-jobs-droppable' });
  
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col h-[75vh]">
      <div className="mb-4 flex-shrink-0">
        <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-cyan-800">Available Job Roles</h2>
            <div className="flex items-center gap-2">
                <span className="text-sm font-normal text-gray-500">Total: {itemCount}</span>
                <button onClick={onToggleVisibility} title="Hide Panel" className="p-1 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-200">
                    <ChevronsRight size={20} />
                </button>
            </div>
        </div>
        <p className="text-sm text-gray-500 mt-1">Unassigned jobs. Select a job, then a department to move it.</p>
        <div className="relative mt-3">
            <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
                type="search" 
                placeholder="Search jobs..." 
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
            />
        </div>
      </div>
      <div ref={setNodeRef} className="space-y-1 flex-grow overflow-y-auto pr-2 thin-scrollbar">
        {items.length > 0 ? (
          items.map((item, index) => (
            <TreeItem 
              key={item.id} 
              item={item} 
              position={`${index + 1}`}
              selectedItemIds={selectedItemIds}
              onSelect={onSelect}
              editingItemId={editingItemId}
              onStartEditing={onStartEditing}
              onNameChange={onNameChange}
              isExpanded={false}
              expandedIds={new Set()}
              onToggleExpand={() => {}}
              onContextMenu={onContextMenu}
              onDeleteItem={onDeleteItem}
              features={features}
              showManualOrder={false}
              onSortChildren={() => {}}
            />
          ))
        ) : (
          <div className="text-center text-gray-400 mt-16">
            {searchQuery ? `No results for "${searchQuery}"` : "No available jobs."}
          </div>
        )}
      </div>
       <div className="mt-6 pt-6 border-t flex items-center flex-shrink-0">
        <button 
          onClick={onCreateCustomJob}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
        >
          Create Custom Job
        </button>
      </div>
    </div>
  );
};

export default AvailableJobsColumn;