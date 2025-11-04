import React, { useState } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { StructureItem as StructureItemType } from '../types';
import { Folder, ClipboardList, Circle, ChevronLeft, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';

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
  onMoveItems?: (direction: 'up' | 'down') => void;
  isExpanded: boolean;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onContextMenu: (event: React.MouseEvent, itemId: string) => void;
  onDeleteItem: (id: string) => void;
  justMovedItemIds?: Set<string>;
}

const TreeItem: React.FC<TreeItemProps> = (props) => {
  const { 
    item, depth = 0, position, selectedItemIds, onSelect, isOverlay = false, 
    editingItemId, onStartEditing, onNameChange, onMoveItems, onMoveToPosition,
    isExpanded, expandedIds, onToggleExpand, onContextMenu, onDeleteItem,
    justMovedItemIds
  } = props;
  
  const [posValue, setPosValue] = useState(position);
  const isSelected = selectedItemIds.includes(item.id);

  const {
    attributes,
    listeners,
    setNodeRef: setDraggableNodeRef,
    transform,
    isDragging,
  } = useDraggable({ 
      id: item.id,
      disabled: !!editingItemId
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
    onStartEditing(item.id);
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
        className={`flex items-center justify-between rounded-md text-sm group transition-all duration-500 relative ${
          isSelected ? 'bg-cyan-100' : 'hover:bg-gray-100'
        } ${isOver && !isDragging ? 'outline outline-2 outline-cyan-500' : ''} ${
            justMovedItemIds?.has(item.id) ? 'bg-yellow-200' : ''
        }`}
        onClick={handleSelect}
        onDoubleClick={handleDoubleClick}
        onContextMenu={(e) => onContextMenu(e, item.id)}
      >
        <div className="flex items-center flex-grow p-2 cursor-grab min-w-0" {...attributes} {...listeners}>
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
                 <button onClick={(e) => { e.stopPropagation(); onDeleteItem(item.id); }} title="Delete Item" className="ml-2 p-1 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <Trash2 size={14} />
                </button>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 pr-2 flex items-center gap-1">
            {isSelected && !isEditing && selectedItemIds.length === 1 && onMoveItems && onMoveToPosition && (
                <div className="flex items-center gap-1 bg-gray-200/50 rounded-md p-0.5">
                    <button onClick={(e) => { e.stopPropagation(); onMoveItems('up'); }} title="Move Up" className="p-1 rounded text-gray-500 hover:text-gray-800 hover:bg-gray-200">
                        <ArrowUp size={16} />
                    </button>
                     <button onClick={(e) => { e.stopPropagation(); onMoveItems('down'); }} title="Move Down" className="p-1 rounded text-gray-500 hover:text-gray-800 hover:bg-gray-200">
                        <ArrowDown size={16} />
                    </button>
                     <div className="flex items-center">
                        <span className="text-xs text-gray-500 font-medium px-1">Move to</span>
                        <input 
                            type="text"
                            value={posValue}
                            onChange={(e) => setPosValue(e.target.value)}
                            onBlur={() => setPosValue(position)}
                            onKeyDown={(e) => { if(e.key === 'Enter') onMoveToPosition(item.id, e.currentTarget.value) }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-16 text-xs text-center bg-white border border-gray-300 rounded-sm"
                        />
                     </div>
                </div>
            )}
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider w-20 text-right">{item.type}</span>
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