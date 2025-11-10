import React, { useState, useMemo, useEffect } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { StructureItem as StructureItemType, ItemType } from '../types';
import { Folder, ClipboardList, Circle, ChevronLeft, ArrowUp, ArrowDown, X, PlusCircle, ArrowDownAZ, ArrowUpZA } from 'lucide-react';
import { Features } from '../App';

interface TreeItemProps {
  item: StructureItemType;
  depth?: number;
  position: string;
  selectedItemIds: string[];
  onSelect: (id: string, isCtrlOrMeta: boolean) => void;
  isOverlay?: boolean;
  editingItemId: string | null;
  onStartEditing: (id: string | null) => void;
  onNameChange: (id: string, newName: string) => void;
  onMoveToPosition?: (id: string, position: string) => void;
  onSwapItems?: (id: string, position: string) => void;
  onMoveItems?: (direction: 'up' | 'down') => void;
  isExpanded: boolean;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onContextMenu: (event: React.MouseEvent, itemId: string) => void;
  onDeleteItem: (id: string) => void;
  justMovedItemIds?: Set<string>;
  features: Features;
  onOpenAddItemModal?: (type: ItemType, parentId: string) => void;
  manualOrder?: Record<string, string>;
  onManualOrderChange?: (id: string, value: string) => void;
  showManualOrder: boolean;
  onSortChildren: (parentId: string, direction: 'asc' | 'desc') => void;
}

const TreeItem: React.FC<TreeItemProps> = (props) => {
  const { 
    item, depth = 0, position, selectedItemIds, onSelect, isOverlay = false, 
    editingItemId, onStartEditing, onNameChange, onMoveItems, onMoveToPosition, onSwapItems,
    isExpanded, expandedIds, onToggleExpand, onContextMenu, onDeleteItem,
    justMovedItemIds, features, onOpenAddItemModal, manualOrder, onManualOrderChange,
    showManualOrder, onSortChildren
  } = props;
  
  const [posValue, setPosValue] = useState(position);
  const [isSwap, setIsSwap] = useState(false);
  const isSelected = selectedItemIds.includes(item.id);
  
  useEffect(() => {
    setPosValue(position);
  }, [position]);

  const {
    attributes,
    listeners,
    setNodeRef: setDraggableNodeRef,
    transform,
    isDragging,
  } = useDraggable({ 
      id: item.id,
      disabled: !!editingItemId || !features.dragAndDrop
  });

  const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({ id: item.id });

  const setNodeRef = (node: HTMLElement | null) => {
    setDraggableNodeRef(node);
    setDroppableNodeRef(node);
  };

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging || isOverlay ? 10 : 1,
    boxShadow: isOverlay ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
  };
  
  const hasChildren = item.children && item.children.length > 0;
  const isEditing = item.id === editingItemId;

  const childCounts = useMemo(() => {
    if (!item.children || item.children.length === 0) {
      return null;
    }

    if (item.type === 'Division') {
      let departmentCount = 0;
      let jobCount = 0;
      item.children.forEach(dept => {
        if (dept.type === 'Department') {
          departmentCount++;
          jobCount += dept.children?.filter(job => job.type === 'Job').length || 0;
        }
      });
      if (departmentCount === 0 && jobCount === 0) return null;
      return { departments: departmentCount, jobs: jobCount };
    }

    if (item.type === 'Department') {
      const jobCount = item.children.filter(job => job.type === 'Job').length;
      if (jobCount === 0) return null;
      return { jobs: jobCount };
    }

    return null;
  }, [item]);


  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpand(item.id);
  };
  
  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEditing) {
      onSelect(item.id, e.metaKey || e.ctrlKey);
    }
  };

  const handleDoubleClick = () => {
    if (features.inlineEditing) {
      onStartEditing(item.id);
    }
  }

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    onNameChange(item.id, e.currentTarget.value);
  };
  
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onNameChange(item.id, e.currentTarget.value);
    } else if (e.key === 'Escape') {
      onStartEditing(null);
    }
  };
  
  const handlePositionAction = (targetPosition: string) => {
      if (isSwap) {
          onSwapItems?.(item.id, targetPosition);
      } else {
          onMoveToPosition?.(item.id, targetPosition);
      }
  };

  const TypeIcon = () => {
    switch (item.type) {
      case 'Division': return <Folder size={16} className="text-cyan-800" />;
      case 'Department': return <ClipboardList size={16} className="text-cyan-700" />;
      case 'Job': return <Circle size={6} className="text-gray-500 fill-current mt-1" />;
      default: return null;
    }
  };
  
  const nameClass = item.type === 'Division' ? 'font-semibold text-gray-900' 
    : item.type === 'Department' ? 'font-medium text-gray-800'
    : 'font-normal text-gray-700';

  return (
    <div style={{ paddingLeft: `${depth * 24}px` }}>
      <div
        ref={setNodeRef}
        style={style}
        data-id={item.id}
        className={`flex items-center justify-between rounded-md text-sm group transition-all duration-500 relative ${
          isSelected ? 'bg-cyan-100' : 'hover:bg-gray-100'
        } ${isOver && !isDragging ? 'outline outline-2 outline-cyan-500' : ''} ${
            justMovedItemIds?.has(item.id) ? 'bg-yellow-200' : ''
        }`}
        onClick={handleSelect}
        onDoubleClick={handleDoubleClick}
        onContextMenu={(e) => { if (features.contextMenu) onContextMenu(e, item.id) }}
      >
        <div className="flex items-center flex-grow p-2 cursor-grab min-w-0" {...attributes} {...listeners}>
            {showManualOrder && features.manualOrdering && manualOrder && onManualOrderChange && (
              <input 
                  type="text" 
                  value={manualOrder[item.id] || ''}
                  onChange={e => onManualOrderChange(item.id, e.target.value)}
                  onClick={e => e.stopPropagation()}
                  className="w-10 text-xs text-center mr-1 bg-gray-50 border border-gray-200 rounded-sm group-hover:bg-white"
                  title="Manual order"
              />
            )}
          <span className="flex items-center justify-center text-gray-400 w-5 h-5 flex-shrink-0">
            {hasChildren ? (
              <button onClick={handleToggleExpand} className="p-0.5 rounded hover:bg-gray-200">
                <ChevronLeft size={14} className={`transition-transform ${isExpanded ? '-rotate-90' : ''}`} />
              </button>
            ) : null}
          </span>
           <span className="text-gray-400 text-xs font-mono mr-2 w-10 text-right flex-shrink-0">{position}.</span>
          <span className="flex items-center justify-center w-5 h-5 flex-shrink-0 mr-1">
            <TypeIcon />
          </span>

          {isEditing ? (
            <input 
              type="text" 
              defaultValue={item.name}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyDown}
              onClick={(e) => e.stopPropagation()}
              autoFocus
              className="p-0 bg-white border border-cyan-500 rounded-sm focus:ring-1 focus:ring-cyan-500 outline-none w-full"
            />
          ) : (
            <div className="flex items-center min-w-0">
                <span className={`truncate ${nameClass}`}>{item.name}</span>
                {(item.type === 'Division' || item.type === 'Department') && hasChildren && features.childSorting && (
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                        <button onClick={(e) => { e.stopPropagation(); onSortChildren(item.id, 'asc'); }} title="Sort children A-Z" className="p-1 rounded-full text-gray-400 hover:text-cyan-600 hover:bg-cyan-100"><ArrowDownAZ size={14} /></button>
                        <button onClick={(e) => { e.stopPropagation(); onSortChildren(item.id, 'desc'); }} title="Sort children Z-A" className="p-1 rounded-full text-gray-400 hover:text-cyan-600 hover:bg-cyan-100"><ArrowUpZA size={14} /></button>
                    </div>
                )}
                {(item.type === 'Division' || item.type === 'Department') && onOpenAddItemModal && (
                     <button onClick={(e) => { e.stopPropagation(); onOpenAddItemModal(item.type === 'Division' ? 'Department' : 'Job', item.id); }} title={`Add ${item.type === 'Division' ? 'Department' : 'Job'}`} className="ml-1 p-1 rounded-full text-gray-400 hover:text-cyan-600 hover:bg-cyan-100 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <PlusCircle size={16} />
                    </button>
                )}
                 <button onClick={(e) => { e.stopPropagation(); onDeleteItem(item.id); }} title="Delete Item" className="ml-1 p-1 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <X size={16} />
                </button>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 pr-2 flex items-center gap-3">
            {isSelected && !isEditing && selectedItemIds.length === 1 && onMoveItems && onMoveToPosition && onSwapItems && features.inlineMoveControls && (
                <div className="flex items-center gap-2 bg-gray-200/50 rounded-md p-0.5">
                    <button onClick={(e) => { e.stopPropagation(); onMoveItems('up'); }} title="Move Up" className="p-1 rounded text-gray-500 hover:text-gray-800 hover:bg-gray-200">
                        <ArrowUp size={16} />
                    </button>
                     <button onClick={(e) => { e.stopPropagation(); onMoveItems('down'); }} title="Move Down" className="p-1 rounded text-gray-500 hover:text-gray-800 hover:bg-gray-200">
                        <ArrowDown size={16} />
                    </button>
                     <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-medium px-1">Move to</span>
                        <input 
                            type="text"
                            value={posValue}
                            onChange={(e) => setPosValue(e.target.value)}
                            onKeyDown={(e) => { if(e.key === 'Enter') handlePositionAction(e.currentTarget.value) }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-16 text-xs text-center bg-white border border-gray-300 rounded-sm"
                        />
                        <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer">
                            <input type="checkbox" checked={isSwap} onChange={e => setIsSwap(e.target.checked)} onClick={e => e.stopPropagation()} className="w-3.5 h-3.5 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500" />
                            Swap
                        </label>
                     </div>
                </div>
            )}
             <div className="flex items-baseline w-56 justify-end">
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider text-right whitespace-nowrap shrink-0">
                    {item.type}
                </span>
                {features.layerCounts && childCounts && (
                    <span className="font-normal normal-case text-gray-500 ml-2 text-left whitespace-nowrap w-[140px]">
                        ({childCounts.departments !== undefined ? `Dept: ${childCounts.departments}, Job: ${childCounts.jobs}` : `Job: ${childCounts.jobs}`})
                    </span>
                )}
            </div>
        </div>
      </div>
      {hasChildren && isExpanded && (
        <div className="pl-3 border-l border-gray-200 ml-3">
          {item.children?.map((child, index) => (
            <TreeItem
              {...props}
              key={child.id}
              item={child}
              depth={depth + 1} 
              position={`${position}.${index + 1}`}
              isExpanded={expandedIds.has(child.id)}
              justMovedItemIds={justMovedItemIds}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TreeItem;