import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { StructureItem, ItemType, SavedTemplate } from '../types';
import { StructureColumn, AvailableJobsColumn, TreeItem } from '../components';
import Modal from '../Modal';
import { AppState } from '../hooks/useHistoryState';
import { Features } from '../App';
import { removeItemRecursive, insertItemRecursive } from '../utils/treeUtils';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const RatioModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onApply: (ratio: number) => void;
  initialRatio: number;
}> = ({ isOpen, onClose, onApply, initialRatio }) => {
  const [leftRatio, setLeftRatio] = useState(initialRatio);

  useEffect(() => {
    if (isOpen) {
        setLeftRatio(initialRatio);
    }
  }, [isOpen, initialRatio]);

  const handleLeftChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseInt(e.target.value, 10);
    if (isNaN(value)) value = 0;
    if (value < 10) value = 10;
    if (value > 90) value = 90;
    setLeftRatio(value);
  };

  const handleApplyClick = () => {
    onApply(leftRatio);
    onClose();
  };

  const rightRatio = 100 - leftRatio;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Set Panel Width Ratio">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">Adjust the width ratio between the Labor Structure and Available Jobs panels.</p>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label htmlFor="leftRatio" className="block text-sm font-medium text-gray-700">Structure (%)</label>
            <input
              type="number"
              id="leftRatio"
              value={leftRatio}
              onChange={handleLeftChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
              min="10"
              max="90"
              autoFocus
            />
          </div>
          <div className="text-2xl font-light text-gray-400 mt-6">:</div>
          <div className="flex-1">
            <label htmlFor="rightRatio" className="block text-sm font-medium text-gray-700">Available Jobs (%)</label>
            <input
              type="number"
              id="rightRatio"
              value={rightRatio}
              readOnly
              className="mt-1 block w-full px-3 py-2 border border-gray-200 bg-gray-100 rounded-md shadow-sm sm:text-sm"
            />
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
            <div className="bg-cyan-600 h-2.5 rounded-full" style={{ width: `${leftRatio}%` }}></div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
                Cancel
            </button>
            <button onClick={handleApplyClick} className="px-4 py-2 text-sm font-medium text-white bg-cyan-700 border border-transparent rounded-md shadow-sm hover:bg-cyan-800">
                Apply Ratio
            </button>
        </div>
      </div>
    </Modal>
  );
};


interface SetupPageProps {
    state: AppState;
    setState: (action: React.SetStateAction<AppState>) => void;
    activeItem: StructureItem | null;
    activeId: string | null;
    setActiveId: (id: string | null) => void;
    filteredStructure: StructureItem[];
    selectedItemIds: string[];
    setSelectedItemIds: (ids: string[]) => void;
    handleSelect: (id: string, isCtrlOrMeta: boolean) => void;
    editingItemId: string | null;
    setEditingItemId: (id: string | null) => void;
    handleNameChange: (id: string, newName: string) => void;
    handleReset: () => void;
    handleMoveItems: (direction: 'up' | 'down') => void;
    handleMoveToPosition: (id: string, position: string) => void;
    handleSwapItems: (id: string, position: string) => void;
    expandedIds: Set<string>;
    handleToggleExpand: (id: string) => void;
    expansionState: 'all' | 'depts' | 'jobs' | 'none' | 'custom';
    handleToggleExpandAll: () => void;
    handleExpandLevel: (level: number) => void;
    handleContextMenu: (event: React.MouseEvent<Element, MouseEvent>, itemId: string) => void;
    clipboard: { mode: 'copy' | 'cut' | null, item: StructureItem | null };
    handleCopy: (itemId: string) => void;
    handleCut: (itemIds: string[]) => void;
    handlePaste: (targetItemId: string) => void;
    handleDeleteItems: (itemIds: string[]) => void;
    handleOpenModifyModal: (itemId?: string) => void;
    structureSearchQuery: string;
    setStructureSearchQuery: (query: string) => void;
    handleMoveRight: () => void;
    handleMoveLeft: () => void;
    flattenedStructureIds: string[];
    availableJobIds: string[];
    filteredAvailableJobs: StructureItem[];
    setIsCreateModalOpen: (isOpen: boolean) => void;
    availableJobsSearchQuery: string;
    setAvailableJobsSearchQuery: (query: string) => void;
    setActiveStep: (step: number) => void;
    justMovedItemIds: Set<string>;
    structureTitle: string;
    handleOpenSaveTemplateModal: () => void;
    savedTemplates: SavedTemplate[];
    handleExpandSelection: (level: "depts" | "jobs") => void;
    handleCollapseSelection: () => void;
    onCollapseToLevel: (level: 'depts' | 'divs' | 'jobs') => void;
    canCollapseSelection: boolean;
    handleLoadTemplate: (name: string) => void;
    handleDeleteTemplate: (name: string) => void;
    canExpandSelection: boolean;
    canExpandToDepts: boolean;
    canCollapseToDepts: boolean;
    canCollapseToJobs: boolean;
    structureCounts: { divisions: number; departments: number; jobs: number; };
    availableJobsCount: number;
    features: Features;
    handleOpenAddItemModal: (type: ItemType, parentId: string | null) => void;
    manualOrder: Record<string, string>;
    onManualOrderChange: (id: string, value: string) => void;
    onApplyManualOrder: () => void;
    onSort: (direction: 'asc' | 'desc') => void;
    showManualOrder: boolean;
    onToggleShowManualOrder: () => void;
    onSortChildren: (parentId: string, direction: 'asc' | 'desc') => void;
    onOpenAddLayerModal: () => void;
    singleSelectedItem: StructureItem | null;
    isAvailableJobsPanelVisible: boolean;
    setIsAvailableJobsPanelVisible: (isVisible: boolean) => void;
}

const SetupPage: React.FC<SetupPageProps> = (props) => {
    const {
        state, setState, activeItem, activeId, setActiveId,
        filteredStructure, selectedItemIds, handleSelect, editingItemId, setEditingItemId, handleNameChange,
        handleReset, handleMoveItems, handleMoveToPosition, handleSwapItems, expandedIds, handleToggleExpand, expansionState,
        handleToggleExpandAll, handleExpandLevel, handleContextMenu, clipboard, handleCopy, handleCut, handlePaste,
        handleDeleteItems, handleOpenModifyModal, structureSearchQuery, setStructureSearchQuery, handleMoveRight,
        handleMoveLeft, flattenedStructureIds, availableJobIds, filteredAvailableJobs, setIsCreateModalOpen,
        availableJobsSearchQuery, setAvailableJobsSearchQuery, setActiveStep, justMovedItemIds, structureTitle,
        handleOpenSaveTemplateModal, savedTemplates, handleExpandSelection, handleCollapseSelection, onCollapseToLevel, canCollapseSelection,
        handleLoadTemplate, handleDeleteTemplate, canExpandSelection, canExpandToDepts,
        canCollapseToDepts, canCollapseToJobs,
        structureCounts, availableJobsCount, features,
        handleOpenAddItemModal, manualOrder, onManualOrderChange, onApplyManualOrder, onSort,
        showManualOrder, onToggleShowManualOrder, onSortChildren, onOpenAddLayerModal, singleSelectedItem,
        isAvailableJobsPanelVisible, setIsAvailableJobsPanelVisible
    } = props;
    
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
    
    const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);
    
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over || active.id === over.id) return;

        setState(prevState => {
            let nextState = JSON.parse(JSON.stringify(prevState));
            let { structure, availableJobs } = nextState;
            
            let activeItem: StructureItem | null = null;
            
            const [newStructure, foundInStructure] = removeItemRecursive(structure, active.id as string);
            if(foundInStructure) {
                activeItem = foundInStructure;
                structure = newStructure;
            } else {
                activeItem = availableJobs.find((j: StructureItem) => j.id === active.id);
                if(activeItem) {
                    availableJobs = availableJobs.filter((j: StructureItem) => j.id !== active.id);
                }
            }
            
            if (!activeItem) return prevState;

            const overId = over.id as string;
            
            if (overId === 'available-jobs-droppable' || availableJobs.some((j: StructureItem) => j.id === overId)) {
                if (activeItem.type !== 'Job') {
                    // addToast("Only Jobs can be moved to the Available list.");
                    return prevState; // Cannot move non-jobs here
                }
                const overIndex = availableJobs.findIndex((j: StructureItem) => j.id === overId);
                if (overIndex !== -1) {
                    availableJobs.splice(overIndex, 0, activeItem);
                } else {
                    availableJobs.push(activeItem);
                }
            } else {
                const [finalStructure, inserted] = insertItemRecursive(structure, overId, activeItem);
                if(inserted) {
                    structure = finalStructure;
                } else if (overId === 'structure-droppable') {
                    if (activeItem.type === 'Division') {
                        structure.push(activeItem);
                    } else {
                        // addToast("Only Divisions can be placed at the root level.");
                        return prevState;
                    }
                } else {
                    //  addToast("Invalid move operation.");
                     return prevState;
                }
            }
            
            return { ...prevState, structure, availableJobs, isDirty: true };
        });
    };

    // Resizable columns logic
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [isResizing, setIsResizing] = useState(false);
    const [structureWidth, setStructureWidth] = useState<number | null>(null);
    const [isRatioModalOpen, setIsRatioModalOpen] = useState(false);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    }, []);

    const handleMouseUp = useCallback(() => {
        setIsResizing(false);
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isResizing || !containerRef.current) return;
    
        const containerRect = containerRef.current.getBoundingClientRect();
        const newStructurePanelWidth = e.clientX - containerRect.left;
    
        const resizerWidth = 32;
        const minPanelWidth = 300; // Minimum width for both panels
    
        // Constraint for the left panel's minimum width
        const constrainedLeft = Math.max(minPanelWidth, newStructurePanelWidth);
        
        // Constraint for the right panel's minimum width
        const maxStructurePanelWidth = containerRect.width - resizerWidth - minPanelWidth;
        
        // Apply both constraints
        const finalWidth = Math.min(constrainedLeft, maxStructurePanelWidth);
        
        setStructureWidth(finalWidth);
    }, [isResizing]);

    useEffect(() => {
        if (containerRef.current && !structureWidth && features.availableJobsPanel) {
            const initialWidth = (containerRef.current.offsetWidth - 32) * 0.8;
            setStructureWidth(initialWidth);
        }
    }, [containerRef, structureWidth, features.availableJobsPanel]);

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isResizing, handleMouseMove, handleMouseUp]);

    const handleApplyRatio = (leftRatio: number) => {
        if (!containerRef.current) return;
        const resizerWidth = 32;
        const containerWidth = containerRef.current.offsetWidth;
        const newStructurePanelWidth = ((containerWidth - resizerWidth) * leftRatio) / 100;

        const minPanelWidth = 300;
        const maxStructurePanelWidth = containerWidth - resizerWidth - minPanelWidth;
        const finalWidth = Math.max(minPanelWidth, Math.min(newStructurePanelWidth, maxStructurePanelWidth));

        setStructureWidth(finalWidth);
    };

    const currentRatio = useMemo(() => {
        if (!structureWidth || !containerRef.current) return 50;
        const resizerWidth = 32;
        const containerWidth = containerRef.current.offsetWidth;
        if (containerWidth - resizerWidth <= 0) return 50;
        return Math.round((structureWidth / (containerWidth - resizerWidth)) * 100);
    }, [structureWidth, containerRef]);


    return (
        <main>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <div ref={containerRef} className={`flex flex-col ${features.availableJobsPanel ? 'lg:flex-row' : ''} gap-4 md:gap-6 items-start`}>
                    <div 
                       className="h-full transition-all duration-300"
                       style={
                        (features.availableJobsPanel && structureWidth && isAvailableJobsPanelVisible) 
                        ? { width: `${structureWidth}px`, flexShrink: 0 } 
                        : { width: '100%' }
                       }>
                        <StructureColumn 
                            title={structureTitle}
                            items={filteredStructure} 
                            selectedItemIds={selectedItemIds}
                            onSelect={handleSelect}
                            editingItemId={editingItemId}
                            onStartEditing={setEditingItemId}
                            onNameChange={handleNameChange}
                            onReset={handleReset}
                            onMoveItems={handleMoveItems}
                            onMoveToPosition={handleMoveToPosition}
                            onSwapItems={handleSwapItems}
                            expandedIds={expandedIds}
                            onToggleExpand={handleToggleExpand}
                            expansionState={expansionState}
                            onToggleExpandAll={handleToggleExpandAll}
                            onExpandLevel={handleExpandLevel}
                            onContextMenu={handleContextMenu}
                            clipboardItem={clipboard.item}
                            onCopy={() => handleCopy(selectedItemIds[0])}
                            onCut={() => handleCut(selectedItemIds)}
                            onPaste={() => handlePaste(selectedItemIds[0])}
                            onDelete={handleDeleteItems}
                            onModify={() => handleOpenModifyModal(selectedItemIds[0])}
                            searchQuery={structureSearchQuery}
                            onSearchChange={setStructureSearchQuery}
                            justMovedItemIds={justMovedItemIds}
                            isDirty={state.isDirty}
                            onOpenSaveTemplateModal={handleOpenSaveTemplateModal}
                            savedTemplates={savedTemplates}
                            onExpandSelection={handleExpandSelection}
                            onCollapseSelection={handleCollapseSelection}
                            onCollapseToLevel={onCollapseToLevel}
                            canCollapseSelection={canCollapseSelection}
                            onLoadTemplate={handleLoadTemplate}
                            onDeleteTemplate={handleDeleteTemplate}
                            canExpandSelection={canExpandSelection}
                            canExpandToDepts={canExpandToDepts}
                            canCollapseToDepts={canCollapseToDepts}
                            canCollapseToJobs={canCollapseToJobs}
                            structureCounts={structureCounts}
                            features={features}
                            onOpenAddItemModal={handleOpenAddItemModal}
                            manualOrder={manualOrder}
                            onManualOrderChange={onManualOrderChange}
                            onApplyManualOrder={onApplyManualOrder}
                            onSort={onSort}
                            showManualOrder={showManualOrder}
                            onToggleShowManualOrder={onToggleShowManualOrder}
                            onSortChildren={onSortChildren}
                            onOpenAddLayerModal={onOpenAddLayerModal}
                            singleSelectedItem={singleSelectedItem}
                        />
                    </div>
                
                {features.availableJobsPanel && isAvailableJobsPanelVisible && (
                    <>
                        <div 
                            onMouseDown={handleMouseDown} 
                            onDoubleClick={() => setIsRatioModalOpen(true)}
                            className="flex-shrink-0 w-8 h-[75vh] hidden lg:flex flex-col items-center justify-center gap-4 bg-gray-100 rounded-md cursor-col-resize group"
                        >
                            <div className="w-1 h-8 bg-gray-300 group-hover:bg-cyan-500 rounded-full" />
                            <button onClick={handleMoveRight} title="Remove job from structure" className="p-2 border rounded-md bg-white shadow-sm hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed" disabled={selectedItemIds.length === 0 || !selectedItemIds.some(id => flattenedStructureIds.includes(id))}>
                                <ArrowRight className="h-5 w-5 text-gray-600" />
                            </button>
                            <button onClick={handleMoveLeft} title="Add job to structure" className="p-2 border rounded-md bg-white shadow-sm hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed" disabled={selectedItemIds.length === 0 || !selectedItemIds.some(id => availableJobIds.includes(id))}>
                                <ArrowLeft className="h-5 w-5 text-gray-600" />
                            </button>
                            <div className="w-1 h-8 bg-gray-300 group-hover:bg-cyan-500 rounded-full" />
                        </div>

                        <div className="flex-grow h-full">
                            <AvailableJobsColumn 
                                items={filteredAvailableJobs} 
                                selectedItemIds={selectedItemIds}
                                onSelect={handleSelect}
                                onCreateCustomJob={() => setIsCreateModalOpen(true)}
                                editingItemId={editingItemId}
                                onStartEditing={setEditingItemId}
                                onNameChange={handleNameChange}
                                onDeleteItem={(id) => handleDeleteItems([id])}
                                onContextMenu={handleContextMenu}
                                searchQuery={availableJobsSearchQuery}
                                onSearchChange={setAvailableJobsSearchQuery}
                                itemCount={availableJobsCount}
                                features={features}
                                onToggleVisibility={() => setIsAvailableJobsPanelVisible(false)}
                            />
                        </div>
                    </>
                )}
                </div>
                <DragOverlay>
                {activeItem ? <TreeItem item={activeItem} isOverlay={true} selectedItemIds={[]} onSelect={()=>{}} editingItemId={null} onStartEditing={()=>{}} onNameChange={()=>{}} position="" onMoveToPosition={() => {}} onSwapItems={()=>{}} onToggleExpand={()=>{}} isExpanded={false} expandedIds={new Set()} onContextMenu={() => {}} onDeleteItem={() => {}} features={features} onOpenAddItemModal={() => {}} manualOrder={{}} onManualOrderChange={() => {}} onSortChildren={() => {}} showManualOrder={false} /> : null}
                </DragOverlay>
                <RatioModal
                    isOpen={isRatioModalOpen}
                    onClose={() => setIsRatioModalOpen(false)}
                    onApply={handleApplyRatio}
                    initialRatio={currentRatio}
                />
            </DndContext>
            <div className="mt-8 pt-6 border-t flex justify-end">
                <button
                    onClick={() => setActiveStep(1)}
                    className="px-6 py-3 text-base font-medium text-white bg-cyan-700 border border-transparent rounded-md shadow-sm hover:bg-cyan-800 flex items-center gap-2"
                >
                    Save and Continue
                    <ArrowRight size={20} />
                </button>
            </div>
        </main>
    );
};

export default SetupPage;