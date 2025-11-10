import React, { useState, useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { StructureItem as StructureItemType, SavedTemplate, ItemType } from '../types';
import TreeItem from './TreeItem';
import { Scissors, Copy, ClipboardPaste, Pencil, Expand, Shrink, X, ArrowUp, ArrowDown, Search, ChevronDown, FolderPlus, Library, Trash2, PlusCircle, ListOrdered, ArrowDownAZ, ArrowUpZA, AppWindow, FileText, Briefcase } from 'lucide-react';
import { Features } from '../App';

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
  onSwapItems: (id: string, position: string) => void;
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
  isFullWidth?: boolean;
  title: string;
  isDirty: boolean;
  onOpenSaveTemplateModal: () => void;
  savedTemplates: SavedTemplate[];
  onExpandSelection: (level: 'depts' | 'jobs') => void;
  onCollapseSelection: () => void;
  onCollapseToLevel: (level: 'depts' | 'divs' | 'jobs') => void;
  canCollapseSelection: boolean;
  onLoadTemplate: (name: string) => void;
  onDeleteTemplate: (name: string) => void;
  canExpandSelection: boolean;
  canExpandToDepts: boolean;
  canCollapseToDepts: boolean;
  canCollapseToJobs: boolean;
  structureCounts: { divisions: number; departments: number; jobs: number; };
  features: Features;
  onOpenAddItemModal: (type: ItemType, parentId: string | null) => void;
  manualOrder: Record<string, string>;
  onManualOrderChange: (id: string, value: string) => void;
  onApplyManualOrder: () => void;
  onSort: (direction: 'asc' | 'desc') => void;
  showManualOrder: boolean;
  onToggleShowManualOrder: () => void;
  onSortChildren: (parentId: string, direction: 'asc' | 'desc') => void;
  onOpenAddLayerModal: () => void;
  singleSelectedItem: StructureItemType | null;
}

const StructureColumn: React.FC<StructureColumnProps> = (props) => {
  const { 
    items, selectedItemIds, onSelect, editingItemId, onStartEditing, onNameChange, 
    onReset, onMoveItems, onMoveToPosition, onSwapItems,
    expandedIds, onToggleExpand, expansionState, onToggleExpandAll, onExpandLevel,
    onContextMenu, clipboardItem, onCopy, onCut, onPaste, onDelete, onModify,
    searchQuery, onSearchChange, justMovedItemIds, isFullWidth = false, title,
    isDirty, onOpenSaveTemplateModal, savedTemplates,
    onExpandSelection, onCollapseSelection, onCollapseToLevel, canCollapseSelection, onLoadTemplate, onDeleteTemplate, canExpandSelection, canExpandToDepts,
    canCollapseToDepts, canCollapseToJobs,
    structureCounts, features, onOpenAddItemModal,
    manualOrder, onManualOrderChange, onApplyManualOrder, onSort,
    showManualOrder, onToggleShowManualOrder, onSortChildren, onOpenAddLayerModal, singleSelectedItem
  } = props;
  
  const { setNodeRef } = useDroppable({ id: 'structure-droppable' });
  const [isExpandDropdownOpen, setIsExpandDropdownOpen] = useState(false);
  const [isCollapseDropdownOpen, setIsCollapseDropdownOpen] = useState(false);
  const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);
  const [isAddDropdownOpen, setIsAddDropdownOpen] = useState(false);


  const actionButtonClass = "flex items-center gap-2 px-2.5 py-1 text-xs font-medium text-gray-700 bg-gray-50 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-cyan-500";
  const activeToggleButtonClass = "bg-cyan-100 text-cyan-800 border-cyan-200 hover:bg-cyan-200";
  const dropdownItemClass = "block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed";


  const hasSelection = selectedItemIds.length > 0;
  const hasSingleSelection = selectedItemIds.length === 1;
  const countsString = `Div: ${structureCounts.divisions}, Dept: ${structureCounts.departments}, Job: ${structureCounts.jobs}`;

  const findItem = (nodes: StructureItemType[], id: string): StructureItemType | null => {
    for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children) {
            const found = findItem(node.children, id);
            if (found) return found;
        }
    }
    return null;
  };

  const visibleItemIds = useMemo(() => {
    const ids: string[] = [];
    const walk = (nodes: StructureItemType[]) => {
      for (const node of nodes) {
        ids.push(node.id);
        if (node.children && expandedIds.has(node.id)) {
          walk(node.children);
        }
      }
    };
    walk(items);
    return ids;
  }, [items, expandedIds]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const target = e.target as HTMLElement;
    // Do not interfere with text input
    if (target.tagName === 'INPUT' || target.isContentEditable) {
        return;
    }

    const isCtrlOrMeta = e.metaKey || e.ctrlKey;

    if (isCtrlOrMeta && e.key.toLowerCase() === 'c') {
      e.preventDefault();
      if(hasSingleSelection) onCopy();
    } else if (isCtrlOrMeta && e.key.toLowerCase() === 'x') {
      e.preventDefault();
      if(hasSingleSelection) onCut();
    } else if (isCtrlOrMeta && e.key.toLowerCase() === 'v') {
      e.preventDefault();
      if(hasSingleSelection && clipboardItem) onPaste();
    } else if (e.key === 'Delete') {
      e.preventDefault();
      if(hasSelection) onDelete(selectedItemIds);
    } else if (e.key === 'Insert') {
        e.preventDefault();
        if (hasSingleSelection) {
            const item = singleSelectedItem;
            if (item?.type === 'Division') onOpenAddItemModal('Department', item.id);
            else if (item?.type === 'Department') onOpenAddItemModal('Job', item.id);
        }
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const lastSelectedId = selectedItemIds[selectedItemIds.length - 1];
      let currentIndex = lastSelectedId ? visibleItemIds.indexOf(lastSelectedId) : -1;
      
      if (currentIndex === -1) {
          currentIndex = e.key === 'ArrowDown' ? -1 : 0;
      }
      
      const nextIndex = e.key === 'ArrowDown' ? currentIndex + 1 : currentIndex - 1;

      if (nextIndex >= 0 && nextIndex < visibleItemIds.length) {
          const newId = visibleItemIds[nextIndex];
          onSelect(newId, false);
          
          const itemElement = (e.currentTarget as HTMLElement).querySelector(`[data-id='${newId}']`);
          itemElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      if (hasSingleSelection) {
        const item = findItem(items, selectedItemIds[0]);
        if (item?.children?.length) {
          const isExpanded = expandedIds.has(item.id);
          if (e.key === 'ArrowRight' && !isExpanded) {
            e.preventDefault();
            onToggleExpand(item.id);
          } else if (e.key === 'ArrowLeft' && isExpanded) {
            e.preventDefault();
            onToggleExpand(item.id);
          }
        }
      }
    } else if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      if (hasSelection) {
        onMoveItems(e.key === 'ArrowUp' ? 'up' : 'down');
      }
    }
  };


  return (
    <div className={`bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col ${isFullWidth ? 'h-full' : 'h-[75vh]'}`}>
      <div className="flex-shrink-0">
        <div className="flex items-center gap-4 mb-3 flex-wrap">
            <h2 className="text-lg font-semibold text-cyan-800 flex-shrink-0">
              {title}
            </h2>
            <div className="relative flex-grow">
                <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                    type="search" 
                    placeholder="Search structure..." 
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                />
            </div>
            {features.headerCounts && <span className="text-sm font-medium text-gray-500 flex-shrink-0">{countsString}</span>}
        </div>

        {features.actionPanel && (
        <div className="bg-gray-50 p-2 rounded-md mb-3">
             <div className="flex items-start gap-3 flex-wrap">
                  {/* Actions Group */}
                  <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-gray-600 px-1">Actions</span>
                      <div className="flex items-center gap-1 flex-wrap p-1 border border-gray-200 rounded-md bg-white">
                        <div className="relative">
                           <button onClick={() => setIsAddDropdownOpen(p => !p)} className={actionButtonClass} title="Add a new item">
                              <PlusCircle size={14}/> Add <ChevronDown size={14} className="ml-1" />
                          </button>
                          {isAddDropdownOpen && (
                               <div onMouseLeave={() => setIsAddDropdownOpen(false)} className="absolute z-20 top-full mt-1 w-48 bg-white border rounded-md shadow-lg py-1">
                                  <button onClick={() => { onOpenAddItemModal('Division', null); setIsAddDropdownOpen(false); }} className={`${actionButtonClass} w-full justify-start`}>
                                      <FolderPlus size={14} /> Add Division
                                  </button>
                                  <button onClick={() => { onOpenAddItemModal('Department', singleSelectedItem!.id); setIsAddDropdownOpen(false); }} disabled={!singleSelectedItem || singleSelectedItem.type !== 'Division'} className={`${actionButtonClass} w-full justify-start`}>
                                      <Briefcase size={14} /> Add Department
                                  </button>
                                   <button onClick={() => { onOpenAddItemModal('Job', singleSelectedItem!.id); setIsAddDropdownOpen(false); }} disabled={!singleSelectedItem || singleSelectedItem.type !== 'Department'} className={`${actionButtonClass} w-full justify-start`}>
                                      <FileText size={14} /> Add Job
                                  </button>
                                  {features.addLayer && (
                                    <>
                                      <div className="border-t my-1"></div>
                                      <button onClick={() => { onOpenAddLayerModal(); setIsAddDropdownOpen(false); }} className={`${actionButtonClass} w-full justify-start`}>
                                          <AppWindow size={14} /> Add Layer
                                      </button>
                                    </>
                                  )}
                               </div>
                          )}
                        </div>
                        <button onClick={() => onMoveItems('up')} disabled={!hasSelection} className={actionButtonClass} title="Move selected up (Alt + ArrowUp)"><ArrowUp size={14}/> Up</button>
                        <button onClick={() => onMoveItems('down')} disabled={!hasSelection} className={actionButtonClass} title="Move selected down (Alt + ArrowDown)"><ArrowDown size={14}/> Down</button>
                        <button onClick={onModify} disabled={!hasSingleSelection} className={actionButtonClass} title="Rename selected item"><Pencil size={14}/> Modify</button>
                        <button onClick={onCopy} disabled={!hasSingleSelection} className={actionButtonClass} title="Copy selected item (Ctrl+C)"><Copy size={14}/> Copy</button>
                        <button onClick={onCut} disabled={!hasSingleSelection} className={actionButtonClass} title="Cut selected item (Ctrl+X)"><Scissors size={14}/> Cut</button>
                        <button onClick={onPaste} disabled={!clipboardItem || !hasSingleSelection} className={actionButtonClass} title="Paste item into selected (Ctrl+V)"><ClipboardPaste size={14}/> Paste</button>
                        <button onClick={() => onDelete(selectedItemIds)} disabled={!hasSelection} className={`${actionButtonClass} hover:bg-red-100 hover:text-red-600`} title="Delete selected (Delete)"><X size={14}/> Delete</button>
                      </div>
                  </div>

                  {/* View Group */}
                  <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-gray-600 px-1">View</span>
                      <div className="flex items-center gap-1 flex-wrap p-1 border border-gray-200 rounded-md bg-white">
                        <button onClick={onToggleExpandAll} className={`${actionButtonClass} ${expansionState === 'all' ? activeToggleButtonClass : ''}`} title={expansionState === 'all' ? 'Collapse all items' : 'Expand all divisions and departments'}>
                            {expansionState === 'all' ? <Shrink size={14}/> : <Expand size={14}/>}
                            {expansionState === 'all' ? 'Collapse' : 'Expand'} All
                        </button>
                        <button onClick={() => onExpandLevel(1)} className={`${actionButtonClass} ${expansionState === 'depts' ? activeToggleButtonClass : ''}`} title="Expand to show all departments">Depts</button>
                        <button onClick={() => onExpandLevel(2)} className={`${actionButtonClass} ${expansionState === 'jobs' ? activeToggleButtonClass : ''}`} title="Expand to show all jobs">Jobs</button>
                         <div className="relative">
                            <button onClick={() => setIsExpandDropdownOpen(prev => !prev)} disabled={!canExpandSelection} className={actionButtonClass} title="Expand the currently selected container(s)">
                                Expand Sel. <ChevronDown size={14} />
                            </button>
                            {isExpandDropdownOpen && (
                                <div onMouseLeave={() => setIsExpandDropdownOpen(false)} className="absolute z-10 top-full mt-1 w-48 bg-white border rounded-md shadow-lg py-1">
                                    <button onClick={(e) => { e.preventDefault(); onExpandSelection('depts'); setIsExpandDropdownOpen(false); }} disabled={!canExpandToDepts} className={dropdownItemClass}>To Departments</button>
                                    <button onClick={(e) => { e.preventDefault(); onExpandSelection('jobs'); setIsExpandDropdownOpen(false); }} disabled={!canExpandSelection} className={dropdownItemClass}>To Jobs</button>
                                </div>
                            )}
                        </div>
                        <div className="relative">
                            <button onClick={() => setIsCollapseDropdownOpen(prev => !prev)} disabled={!canCollapseSelection} className={actionButtonClass} title="Collapse the currently selected container(s)">
                                Collapse Sel. <ChevronDown size={14} />
                            </button>
                            {isCollapseDropdownOpen && (
                                <div onMouseLeave={() => setIsCollapseDropdownOpen(false)} className="absolute z-10 top-full mt-1 w-48 bg-white border rounded-md shadow-lg py-1">
                                    <button onClick={(e) => { e.preventDefault(); onCollapseSelection(); setIsCollapseDropdownOpen(false); }} disabled={!canCollapseSelection} className={dropdownItemClass}>Collapse All</button>
                                    <button onClick={(e) => { e.preventDefault(); onCollapseToLevel('jobs'); setIsCollapseDropdownOpen(false); }} disabled={!canCollapseToJobs} className={dropdownItemClass}>To Jobs</button>
                                    <button onClick={(e) => { e.preventDefault(); onCollapseToLevel('depts'); setIsCollapseDropdownOpen(false); }} disabled={!canCollapseToDepts} className={dropdownItemClass}>To Departments</button>
                                    <button onClick={(e) => { e.preventDefault(); onCollapseToLevel('divs'); setIsCollapseDropdownOpen(false); }} disabled={!canCollapseToDepts} className={dropdownItemClass}>To Divisions</button>
                                </div>
                            )}
                        </div>
                      </div>
                  </div>

                   {/* Ordering Group */}
                  {(features.manualOrdering || features.globalSorting) && (
                      <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold text-gray-600 px-1">Ordering</span>
                          <div className="flex items-center gap-1 flex-wrap p-1 border border-gray-200 rounded-md bg-white">
                            {features.manualOrdering && (
                                <>
                                <button onClick={onToggleShowManualOrder} className={`${actionButtonClass} ${showManualOrder ? activeToggleButtonClass : ''}`} title="Toggle visibility of manual order inputs">
                                    <ListOrdered size={14} /> Manual
                                </button>
                                <button onClick={onApplyManualOrder} className={actionButtonClass} title="Apply custom numeric order">Apply</button>
                                </>
                            )}
                            {features.globalSorting && (
                                <>
                                <button onClick={() => onSort('asc')} className={actionButtonClass} title="Sort all levels alphabetically A-Z"><ArrowDownAZ size={14} /> A-Z</button>
                                <button onClick={() => onSort('desc')} className={actionButtonClass} title="Sort all levels alphabetically Z-A"><ArrowUpZA size={14} /> Z-A</button>
                                </>
                            )}
                          </div>
                      </div>
                  )}
                  
                  {/* Templates Group */}
                  {features.templates && (
                      <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold text-gray-600 px-1">Templates</span>
                           <div className="flex items-center gap-1 flex-wrap p-1 border border-gray-200 rounded-md bg-white">
                             <button onClick={onOpenSaveTemplateModal} disabled={!isDirty} className={actionButtonClass} title="Save the current structure as a new template">
                                <FolderPlus size={14} /> Save
                            </button>
                            <div className="relative">
                                <button onClick={() => setIsTemplateDropdownOpen(p => !p)} disabled={savedTemplates.length === 0} className={actionButtonClass} title="Load or delete existing templates">
                                    <Library size={14} /> Manage <ChevronDown size={14} className="ml-1" />
                                </button>
                                {isTemplateDropdownOpen && (
                                    <div onMouseLeave={() => setIsTemplateDropdownOpen(false)} className="absolute z-20 top-full right-0 mt-1 w-64 bg-white border rounded-md shadow-lg py-1 max-h-60 overflow-y-auto thin-scrollbar">
                                        {savedTemplates.length > 0 ? (
                                            savedTemplates.map(template => (
                                                <div key={template.name} className="flex flex-col px-3 py-2 hover:bg-gray-50">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm font-medium text-gray-800 truncate pr-2">{template.name}</span>
                                                        <div className="flex items-center gap-1 flex-shrink-0">
                                                            <button onClick={() => { onLoadTemplate(template.name); setIsTemplateDropdownOpen(false); }} className="px-2 py-0.5 text-xs font-semibold text-white bg-cyan-600 rounded-md hover:bg-cyan-700">Load</button>
                                                            <button onClick={() => { onDeleteTemplate(template.name); }} className="p-1 text-xs text-red-600 rounded-md hover:bg-red-100"><Trash2 size={14} /></button>
                                                        </div>
                                                    </div>
                                                    <span className="text-xs text-gray-400 mt-1">
                                                        Saved: {new Date(template.createdAt).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-gray-500 text-center px-3 py-2">No saved templates found.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                         </div>
                     </div>
                  )}
             </div>
        </div>
        )}
      </div>
      
      <div 
        className="space-y-1 flex-grow overflow-y-auto pr-2 thin-scrollbar focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded" 
        ref={setNodeRef}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
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
            onSwapItems={onSwapItems}
            expandedIds={expandedIds}
            isExpanded={expandedIds.has(item.id)}
            onToggleExpand={onToggleExpand}
            onContextMenu={onContextMenu}
            onDeleteItem={id => onDelete([id])}
            justMovedItemIds={justMovedItemIds}
            features={features}
            onOpenAddItemModal={onOpenAddItemModal}
            manualOrder={manualOrder}
            onManualOrderChange={onManualOrderChange}
            showManualOrder={showManualOrder}
            onSortChildren={onSortChildren}
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