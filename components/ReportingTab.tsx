import React, { useState } from 'react';
import { DndContext, useDraggable, useDroppable, DragEndEvent, DragStartEvent, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ChevronRight, PlusCircle, Building, Users, Briefcase, X } from 'lucide-react';
import Modal from './Modal';
import { ReportingDataType, ReportItem, ReportingNode } from '../types';

interface ReportingTabProps {
  reportingData: ReportingDataType;
  setReportingData: (data: ReportingDataType) => void;
}

// --- INITIAL DATA ---
export const initialData: ReportingDataType = {
  unassigned: {
    businessUnits: [
      { id: 'un-bu1', name: 'Global Marketing' },
      { id: 'un-bu2', name: 'International Sales' },
    ],
    teams: [
      { id: 'un-t1', name: 'Content Creators' },
      { id: 'un-t2', name: 'Product Marketing' },
      { id: 'un-t3', name: 'APAC Sales Division' },
    ],
    employees: [
      { id: 'un-e1', name: 'John Doe' },
      { id: 'un-e2', name: 'Jane Smith' },
      { id: 'un-e3', name: 'Peter Jones' },
      { id: 'un-e4', name: 'Mary Williams' },
    ],
  },
  structure: [
    {
      id: 'comp-1', name: 'Innovate Corp.', type: 'Company', assignedEmployees: [],
      children: [
        {
          id: 'bu-1', name: 'Research & Development', type: 'BusinessUnit', assignedEmployees: [],
          children: [
            { id: 't-1', name: 'Core Platform Team', type: 'Team', children: [], assignedEmployees: [{id: 'e-5', name: 'David Brown'}] },
            { id: 't-2', name: 'AI Research Group', type: 'Team', children: [], assignedEmployees: [] },
          ]
        },
        { id: 'bu-2', name: 'Product Engineering', type: 'BusinessUnit', assignedEmployees: [], children: [] },
      ]
    }
  ],
};

// --- Recursive helpers ---
const removeItemFromTree = (nodes: ReportingNode[], itemId: string): [ReportingNode[], ReportItem | null] => {
  let removedItem: ReportItem | null = null;

  function findAndRemove(nodeList: ReportingNode[]): ReportingNode[] {
    if (removedItem) return nodeList;

    const nodeIndex = nodeList.findIndex(n => n.id === itemId);
    if (nodeIndex !== -1) {
      removedItem = { id: nodeList[nodeIndex].id, name: nodeList[nodeIndex].name };
      const newNodes = [...nodeList];
      newNodes.splice(nodeIndex, 1);
      return newNodes;
    }

    return nodeList.map(node => {
      if (removedItem) return node;

      const empIndex = node.assignedEmployees.findIndex(e => e.id === itemId);
      if (empIndex !== -1) {
        removedItem = node.assignedEmployees[empIndex];
        const newEmployees = [...node.assignedEmployees];
        newEmployees.splice(empIndex, 1);
        return { ...node, assignedEmployees: newEmployees };
      }

      if (node.children) {
        const newChildren = findAndRemove(node.children);
        if (newChildren !== node.children) {
          return { ...node, children: newChildren };
        }
      }
      return node;
    });
  }

  const newStructure = findAndRemove(nodes);
  return [newStructure, removedItem];
};

const addItemToTree = (nodes: ReportingNode[], targetId: string, itemToAdd: ReportItem, itemType: string): [ReportingNode[], boolean] => {
  let success = false;
  
  const findAndAdd = (nodeList: ReportingNode[]): ReportingNode[] => {
    return nodeList.map(node => {
      if (success) return node; // Already added, no need to check further down this path
      
      if (node.id === targetId) {
          let canDrop = false;
          if (itemType === 'BusinessUnit' && node.type === 'Company') canDrop = true;
          if (itemType === 'Team' && node.type === 'BusinessUnit') canDrop = true;
          if (itemType === 'Employee' && node.type === 'Team') canDrop = true;

          if (canDrop) {
              if (itemType === 'Employee') {
                  if (!node.assignedEmployees.some(e => e.id === itemToAdd.id)) {
                      success = true;
                      return { ...node, assignedEmployees: [...node.assignedEmployees, itemToAdd] };
                  }
              } else {
                  if (!node.children.some(c => c.id === itemToAdd.id)) {
                      const newChildType = itemType === 'BusinessUnit' ? 'BusinessUnit' : 'Team';
                      const newChild: ReportingNode = { id: itemToAdd.id, name: itemToAdd.name, type: newChildType, children: [], assignedEmployees: [] };
                      success = true;
                      return { ...node, children: [...node.children, newChild] };
                  }
              }
          }
      }
      
      if (node.children && !success) {
        const newChildren = findAndAdd(node.children);
        // Only create a new node object if children array actually changed.
        if (newChildren !== node.children) {
            return { ...node, children: newChildren };
        }
      }

      return node;
    });
  }
  
  const newNodes = findAndAdd(nodes);
  return [newNodes, success];
};


// --- DRAGGABLE ITEM CHIP ---
const DraggableItemChip: React.FC<{ item: ReportItem, type: string, onDelete?: () => void, isOverlay?: boolean }> = ({ item, type, onDelete, isOverlay = false }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { type, item },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    boxShadow: isOverlay ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
    zIndex: isDragging || isOverlay ? 100 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center px-3 py-1.5 bg-gray-200 text-gray-800 rounded-md text-sm font-medium"
    >
      <span {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing flex-grow">{item.name}</span>
      {onDelete && (
        <button onClick={onDelete} className="ml-2 text-gray-500 hover:text-red-600 focus:outline-none p-0.5 rounded-full hover:bg-gray-300">
          <X size={14} />
        </button>
      )}
    </div>
  );
};

// --- REPORTING HIERARCHY NODE ---
const ReportingNodeComponent: React.FC<{ node: ReportingNode; depth?: number; expandedNodes: Set<string>; onToggleExpand: (id: string) => void; activeDragType: string | null; }> = ({ node, depth = 0, expandedNodes, onToggleExpand, activeDragType }) => {
  
  const droppableData = { type: 'node', nodeType: node.type, nodeId: node.id };
  const { setNodeRef, isOver } = useDroppable({ id: node.id, data: droppableData });
  const isExpanded = expandedNodes.has(node.id);
  const hasChildren = node.children && node.children.length > 0;

  const getDropValidity = () => {
    if (!activeDragType) return false;
    if (activeDragType === 'BusinessUnit' && node.type === 'Company') return true;
    if (activeDragType === 'Team' && node.type === 'BusinessUnit') return true;
    if (activeDragType === 'Employee' && node.type === 'Team') return true;
    return false;
  };
  const isValidDropTarget = getDropValidity();
  
  const nodeStyles = {
    Company: 'bg-cyan-800 text-white',
    BusinessUnit: 'bg-white text-gray-800',
    Team: 'bg-white',
  };

  const getBackgroundColor = () => {
    if (isOver && isValidDropTarget) return 'bg-green-100';
    if (isOver) return 'bg-red-100';
    if (activeDragType && isValidDropTarget) return 'bg-cyan-100';
    return nodeStyles[node.type];
  };

  const Icon = () => {
    switch(node.type) {
      case 'Company': return <Building size={16} className="mr-2 flex-shrink-0" />;
      case 'BusinessUnit': return <Briefcase size={16} className="mr-2 flex-shrink-0 text-cyan-700" />;
      case 'Team': return <Users size={16} className="mr-2 flex-shrink-0 text-gray-500" />;
      default: return null;
    }
  };

  return (
    <div style={{ paddingLeft: `${depth * 20}px` }}>
      <div
        ref={setNodeRef}
        className="border-b border-gray-200"
      >
        <div className={`flex items-center p-2 transition-colors ${getBackgroundColor()}`}>
          <div className="w-5 h-5 flex items-center justify-center mr-1">
             {(hasChildren || node.type === 'Company') && (
              <button onClick={(e) => { e.stopPropagation(); onToggleExpand(node.id); }}>
                  <ChevronRight size={16} className={`transition-transform ${isExpanded ? 'rotate-90' : 'rotate-0'}`} />
              </button>
            )}
          </div>
          <Icon />
          <span className="font-medium text-sm">{node.name}</span>
        </div>
        
        {node.assignedEmployees.length > 0 && (
           <div className="p-2 pl-8 bg-gray-50 flex flex-wrap gap-2">
            {node.assignedEmployees.map(person => <DraggableItemChip key={person.id} item={person} type="Employee" />)}
          </div>
        )}
      </div>

      {isExpanded && hasChildren && (
        <div>
          {node.children?.map(child => (
            <ReportingNodeComponent
              key={child.id}
              node={child}
              depth={depth + 1}
              expandedNodes={expandedNodes}
              onToggleExpand={onToggleExpand}
              activeDragType={activeDragType}
            />
          ))}
        </div>
      )}
    </div>
  );
};


// --- MAIN TAB COMPONENT ---
const ReportingTab: React.FC<ReportingTabProps> = ({ reportingData, setReportingData }) => {
  const { unassigned, structure } = reportingData;
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['comp-1', 'bu-1']));
  const [activeDragItem, setActiveDragItem] = useState<{item: ReportItem, type: string} | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContext, setModalContext] = useState<{type: 'BusinessUnit' | 'Team' | 'Employee', title: string} | null>(null);
  const [newItemName, setNewItemName] = useState('');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 }}));

  const handleToggleExpand = (id: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };
  
  const openCreateModal = (type: 'BusinessUnit' | 'Team' | 'Employee') => {
    const titles = {
        BusinessUnit: 'Create New Business Unit',
        Team: 'Create New Team',
        Employee: 'Create New Employee',
    }
    setModalContext({type, title: titles[type]});
    setIsModalOpen(true);
  }

  const handleDeleteItem = (idToDelete: string, type: 'BusinessUnit' | 'Team' | 'Employee') => {
      const newUnassigned = { ...unassigned };
      if (type === 'BusinessUnit') {
        newUnassigned.businessUnits = unassigned.businessUnits.filter(i => i.id !== idToDelete);
      } else if (type === 'Team') {
        newUnassigned.teams = unassigned.teams.filter(i => i.id !== idToDelete);
      } else {
        newUnassigned.employees = unassigned.employees.filter(i => i.id !== idToDelete);
      }
      setReportingData({ ...reportingData, unassigned: newUnassigned });
  };

  const handleCreateItem = () => {
    if(!newItemName.trim() || !modalContext) return;
    const newItem = { id: `new-${Date.now()}`, name: newItemName.trim() };
    
    const newUnassigned = { ...unassigned };
    if (modalContext.type === 'BusinessUnit') {
        newUnassigned.businessUnits = [...unassigned.businessUnits, newItem];
    } else if (modalContext.type === 'Team') {
        newUnassigned.teams = [...unassigned.teams, newItem];
    } else if (modalContext.type === 'Employee') {
        newUnassigned.employees = [...unassigned.employees, newItem];
    }
    setReportingData({ ...reportingData, unassigned: newUnassigned });

    setNewItemName('');
    setIsModalOpen(false);
    setModalContext(null);
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { type, item } = event.active.data.current as { type: string, item: ReportItem };
    setActiveDragItem({ type, item });
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragItem(null);
    const { active, over } = event;

    if (!over || !active.data.current || active.id === over.id) return;

    const activeItem = active.data.current.item as ReportItem;
    const activeType = active.data.current.type as string;
    const activeId = active.id as string;
    
    let nextStructure = JSON.parse(JSON.stringify(structure));
    let nextUnassigned = JSON.parse(JSON.stringify(unassigned));
    
    let itemToMove: ReportItem | null = null;
    
    const [structureAfterRemove, removedFromStructure] = removeItemFromTree(nextStructure, activeId);
    if(removedFromStructure) {
        itemToMove = removedFromStructure;
        nextStructure = structureAfterRemove;
    } else {
        itemToMove = activeItem;
        if (activeType === 'BusinessUnit') {
            nextUnassigned.businessUnits = nextUnassigned.businessUnits.filter((i: ReportItem) => i.id !== activeId);
        } else if (activeType === 'Team') {
            nextUnassigned.teams = nextUnassigned.teams.filter((i: ReportItem) => i.id !== activeId);
        } else if (activeType === 'Employee') {
            nextUnassigned.employees = nextUnassigned.employees.filter((i: ReportItem) => i.id !== activeId);
        }
    }

    if (!itemToMove) return;

    const overId = over.id as string;
    const overData = over.data.current;

    let droppedSuccessfully = false;

    if (overData?.type === 'node') {
        const [structureAfterAdd, wasAdded] = addItemToTree(nextStructure, overId, itemToMove, activeType);
        if (wasAdded) {
            nextStructure = structureAfterAdd;
            droppedSuccessfully = true;
        }
    } else {
        const droppableUnassignedMap: { [key: string]: string } = {
          'BusinessUnit': 'unassigned-businessunits-droppable',
          'Team': 'unassigned-teams-droppable',
          'Employee': 'unassigned-employees-droppable',
        };
        if (overId === droppableUnassignedMap[activeType]) {
            if(activeType === 'BusinessUnit' && !nextUnassigned.businessUnits.some((i: ReportItem) => i.id === itemToMove!.id)) nextUnassigned.businessUnits.push(itemToMove);
            if(activeType === 'Team' && !nextUnassigned.teams.some((i: ReportItem) => i.id === itemToMove!.id)) nextUnassigned.teams.push(itemToMove);
            if(activeType === 'Employee' && !nextUnassigned.employees.some((i: ReportItem) => i.id === itemToMove!.id)) nextUnassigned.employees.push(itemToMove);
            droppedSuccessfully = true;
        }
    }

    if(droppedSuccessfully) {
        setReportingData({ unassigned: nextUnassigned, structure: nextStructure });
    }
  };
  
  const UnassignedSection: React.FC<{title: string, items: ReportItem[], type: 'BusinessUnit' | 'Team' | 'Employee', droppableId: string}> = ({title, items, type, droppableId}) => {
     const { setNodeRef } = useDroppable({ id: droppableId });
     return (
     <div>
        <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold text-gray-700">{title}</h4>
            <button onClick={() => openCreateModal(type)} className="flex items-center gap-1 text-sm text-cyan-600 hover:text-cyan-800 font-medium">
                <PlusCircle size={16} /> Create
            </button>
        </div>
        <div ref={setNodeRef} className="p-3 bg-gray-50 border-2 border-dashed rounded-lg min-h-[60px] flex flex-wrap gap-3">
            {items.map(item => <DraggableItemChip key={item.id} item={item} type={type} onDelete={() => handleDeleteItem(item.id, type)} />)}
            {items.length === 0 && <p className="text-gray-400 text-sm">No items.</p>}
        </div>
    </div>
  )};

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-4">
          <UnassignedSection title="Unassigned Business Units" items={unassigned.businessUnits} type="BusinessUnit" droppableId="unassigned-businessunits-droppable" />
          <UnassignedSection title="Unassigned Teams" items={unassigned.teams} type="Team" droppableId="unassigned-teams-droppable" />
          <UnassignedSection title="Unassigned Employees" items={unassigned.employees} type="Employee" droppableId="unassigned-employees-droppable"/>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            {structure.map(node => (
                <ReportingNodeComponent 
                  key={node.id} 
                  node={node} 
                  expandedNodes={expandedNodes}
                  onToggleExpand={handleToggleExpand}
                  activeDragType={activeDragItem?.type || null}
                />
            ))}
        </div>
      </div>
       <DragOverlay>
        {activeDragItem ? <DraggableItemChip item={activeDragItem.item} type={activeDragItem.type} isOverlay /> : null}
      </DragOverlay>
       <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalContext?.title || "Create New Item"}>
        <div className="space-y-4">
            <label htmlFor="itemName" className="block text-sm font-medium text-gray-700">Name</label>
            <input 
                type="text" id="itemName" value={newItemName} onChange={(e) => setNewItemName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                placeholder={`e.g., "New ${modalContext?.type}"`}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateItem()}
            />
            <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
                    Cancel
                </button>
                <button onClick={handleCreateItem} className="px-4 py-2 text-sm font-medium text-white bg-cyan-700 border border-transparent rounded-md shadow-sm hover:bg-cyan-800">
                    Create
                </button>
            </div>
        </div>
      </Modal>
    </DndContext>
  );
};

export default ReportingTab;
