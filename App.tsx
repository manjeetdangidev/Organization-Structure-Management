import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { StructureItem, ItemType, SavedTemplate } from './types';
import { Stepper, ContextMenu, FeaturePanel, Modal, AddLayerForm } from './components';
import { SetupPage, ReviewPage, CongratulationsPage } from './pages';
import { useHistoryState, AppState, History } from './hooks/useHistoryState';
import { getInitialState } from './data/initialState';
import { findItemRecursive, removeItemRecursive, insertItemRecursive, moveItemsRecursive, modifySiblingOrderRecursive } from './utils/treeUtils';
import { Briefcase, Undo, Redo, AlertTriangle } from 'lucide-react';
import { LayerDivision } from './components/AddLayerForm';


// --- Toast Notification Components ---
type ToastMessage = { id: number; message: string };

const Toast: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => (
  <div className="bg-gray-800 text-white py-2 px-4 rounded-md shadow-lg flex items-center justify-between animate-fade-in-out">
    <span className="text-sm">{message}</span>
    <button onClick={onClose} className="ml-4 p-1 rounded-full hover:bg-gray-700 text-gray-300 hover:text-white">&times;</button>
  </div>
);

const ToastContainer: React.FC<{ toasts: ToastMessage[]; removeToast: (id: number) => void }> = ({ toasts, removeToast }) => (
  <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[1000] space-y-2">
    {toasts.map(toast => (
      <Toast key={toast.id} message={toast.message} onClose={() => removeToast(toast.id)} />
    ))}
  </div>
);

const SaveTemplateModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  existingNames: string[];
}> = ({ isOpen, onClose, onSave, existingNames }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setName('');
      setError('');
    }
  }, [isOpen]);

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Template name cannot be empty.');
      return;
    }
    if (existingNames.includes(trimmedName)) {
      if (!window.confirm(`A template named "${trimmedName}" already exists. Overwrite it?`)) {
        return;
      }
    }
    onSave(trimmedName);
    onClose();
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Save Structure Template">
      <div className="space-y-4">
        <div>
            <label htmlFor="templateName" className="block text-sm font-medium text-gray-700">Template Name</label>
            <input 
                ref={inputRef}
                type="text" id="templateName" value={name} onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
                Cancel
            </button>
            <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-cyan-700 border border-transparent rounded-md shadow-sm hover:bg-cyan-800">
                Save
            </button>
        </div>
      </div>
    </Modal>
  );
};

export type Features = {
    inlineEditing: boolean;
    inlineMoveControls: boolean;
    dragAndDrop: boolean;
    layerCounts: boolean;
    headerCounts: boolean;
    availableJobsPanel: boolean;
    contextMenu: boolean;
    actionPanel: boolean;
    manualOrdering: boolean;
    childSorting: boolean;
    globalSorting: boolean;
    templates: boolean;
    undoRedo: boolean;
    addLayer: boolean;
};

const App: React.FC = () => {
    const [activeStep, setActiveStep] = useState(0);
    const { state, setState, resetHistory, undo, redo, canUndo, canRedo } = useHistoryState(getInitialState());
    const [activeId, setActiveId] = useState<string | null>(null);
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(getInitialState().structure.map(i => i.id)));
    const [expansionState, setExpansionState] = useState<'all' | 'depts' | 'jobs' | 'none' | 'custom'>('all');
    const [isModifyModalOpen, setIsModifyModalOpen] = useState(false);
    const [structureSearchQuery, setStructureSearchQuery] = useState('');
    const [availableJobsSearchQuery, setAvailableJobsSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newJobName, setNewJobName] = useState('');
    const [isCreateItemModalOpen, setIsCreateItemModalOpen] = useState(false);
    const [createItemContext, setCreateItemContext] = useState<{type: ItemType, parentId: string | null} | null>(null);
    const [newItemName, setNewItemName] = useState('');
    const [isAddLayerModalOpen, setIsAddLayerModalOpen] = useState(false);
    const [isAvailableJobsPanelVisible, setIsAvailableJobsPanelVisible] = useState(true);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, itemId: string } | null>(null);
    const [clipboard, setClipboard] = useState<{ mode: 'copy' | 'cut' | null, item: StructureItem | null }>({ mode: null, item: null });
    const [justMovedItemIds, setJustMovedItemIds] = useState<Set<string>>(new Set());
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [structureTitle, setStructureTitle] = useState("Recommended Labor Structure");
    const [manualOrder, setManualOrder] = useState<Record<string, string>>({});
    const [showManualOrder, setShowManualOrder] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ids: string[], message: string} | null>(null);


    const [features, setFeatures] = useState<Features>({
        inlineEditing: true,
        inlineMoveControls: true,
        dragAndDrop: true,
        layerCounts: true,
        headerCounts: true,
        availableJobsPanel: true,
        contextMenu: true,
        actionPanel: true,
        manualOrdering: true,
        childSorting: true,
        globalSorting: true,
        templates: true,
        undoRedo: true,
        addLayer: true,
    });
    
    // --- Templates ---
    const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);
    const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
    
    useEffect(() => {
        try {
          const stored = localStorage.getItem('org-templates-v2');
          if (stored) {
            setSavedTemplates(JSON.parse(stored));
          }
        } catch (error) {
          console.error("Failed to load templates:", error);
        }
    }, []);

    useEffect(() => {
        if (state.isDirty) {
            setStructureTitle("Current Labor Structure");
        }
    }, [state.isDirty]);

    const addToast = (message: string) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message }]);
        setTimeout(() => removeToast(id), 4100);
    };

    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const handleToggleFeature = (feature: keyof Features) => {
        setFeatures(prev => ({ ...prev, [feature]: !prev[feature] }));
    };

    const handleSaveTemplate = (name: string) => {
        const newTemplates = savedTemplates.filter(t => t.name !== name);
        const newTemplate: SavedTemplate = {
          name: name,
          structure: state.structure,
          availableJobs: state.availableJobs,
          createdAt: new Date().toISOString(),
        };
        const updatedTemplates = [...newTemplates, newTemplate].sort((a, b) => a.name.localeCompare(b.name));
        setSavedTemplates(updatedTemplates);
        localStorage.setItem('org-templates-v2', JSON.stringify(updatedTemplates));
        setState(prev => ({ ...prev, isDirty: false }));
        addToast(`Template "${name}" saved successfully!`);
    };

    const handleLoadTemplate = (name: string) => {
        const template = savedTemplates.find(t => t.name === name);
        if(template) {
            resetHistory({
                structure: template.structure,
                availableJobs: template.availableJobs,
                isDirty: false,
            });
            setStructureTitle("User Labour Structure");
            addToast(`Template "${name}" loaded.`);
        }
    };

    const handleDeleteTemplate = (name: string) => {
        if(window.confirm(`Are you sure you want to delete the template "${name}"?`)){
            const newTemplates = savedTemplates.filter(t => t.name !== name);
            setSavedTemplates(newTemplates);
            localStorage.setItem('org-templates-v2', JSON.stringify(newTemplates));
            addToast(`Template "${name}" deleted.`);
        }
    };
    
    const activeItem = useMemo(() => {
        if (!activeId) return null;
        const fromStructure = findItemRecursive(state.structure, activeId);
        if (fromStructure) return fromStructure;
        return state.availableJobs.find(job => job.id === activeId) || null;
    }, [activeId, state.structure, state.availableJobs]);
    
     const flattenedStructure = useMemo(() => {
        const flattened: StructureItem[] = [];
        const walk = (items: StructureItem[]) => {
            items.forEach(item => {
                flattened.push(item);
                if (item.children) walk(item.children);
            });
        };
        walk(state.structure);
        return flattened;
    }, [state.structure]);

    const flattenedStructureIds = useMemo(() => flattenedStructure.map(i => i.id), [flattenedStructure]);
    const availableJobIds = useMemo(() => state.availableJobs.map(i => i.id), [state.availableJobs]);
    
    const filteredStructure = useMemo(() => {
        if (!structureSearchQuery) return state.structure;
        const query = structureSearchQuery.toLowerCase();
  
        const filterRecursive = (items: StructureItem[]): StructureItem[] => {
            return items.reduce((acc: StructureItem[], item) => {
                const nameMatches = item.name.toLowerCase().includes(query);
                if (item.children) {
                    const filteredChildren = filterRecursive(item.children);
                    if (nameMatches || filteredChildren.length > 0) {
                        acc.push({ ...item, children: filteredChildren });
                    }
                } else if (nameMatches) {
                    acc.push(item);
                }
                return acc;
            }, []);
        };
  
        return filterRecursive(state.structure);
    }, [state.structure, structureSearchQuery]);

    const filteredAvailableJobs = useMemo(() => {
        if (!availableJobsSearchQuery) return state.availableJobs;
        const query = availableJobsSearchQuery.toLowerCase();
        return state.availableJobs.filter(job => job.name.toLowerCase().includes(query));
    }, [state.availableJobs, availableJobsSearchQuery]);

    const handleSelect = (itemId: string, isCtrlOrMeta: boolean) => {
        setEditingItemId(null);
        if (isCtrlOrMeta) {
            setSelectedItemIds(prev =>
                prev.includes(itemId)
                    ? prev.filter(id => id !== itemId)
                    : [...prev, itemId]
            );
        } else {
            setSelectedItemIds(prev => (prev.length === 1 && prev[0] === itemId) ? [] : [itemId]);
        }
    };
    
    const handleNameChange = (id: string, newName: string) => {
        if (!newName.trim()) {
            addToast("Name cannot be empty.");
            setEditingItemId(null);
            return;
        }

        const updateRecursive = (items: StructureItem[]): StructureItem[] => {
            return items.map(item => {
                if(item.id === id) return { ...item, name: newName };
                if(item.children) return { ...item, children: updateRecursive(item.children) };
                return item;
            });
        };

        setState(prev => ({
            ...prev,
            structure: updateRecursive(prev.structure),
            availableJobs: prev.availableJobs.map(job => job.id === id ? { ...job, name: newName } : job),
            isDirty: true,
        }));
        setEditingItemId(null);
    };

    const handleReset = () => {
        const initialState = getInitialState();
        resetHistory(initialState);
        
        // Reset all local component states to their defaults
        setActiveStep(0);
        setActiveId(null);
        setSelectedItemIds([]);
        setEditingItemId(null);
        setExpandedIds(new Set(initialState.structure.map(i => i.id)));
        setExpansionState('all');
        setIsModifyModalOpen(false);
        setStructureSearchQuery('');
        setAvailableJobsSearchQuery('');
        setIsCreateModalOpen(false);
        setIsCreateItemModalOpen(false);
        setCreateItemContext(null);
        setIsAddLayerModalOpen(false);
        setIsAvailableJobsPanelVisible(true);
        setIsSubmitted(false);
        setContextMenu(null);
        setClipboard({ mode: null, item: null });
        setJustMovedItemIds(new Set());
        setToasts([]);
        addToast("Structure has been reset to the recommended state.");
        setStructureTitle("Recommended Labor Structure");
        setManualOrder({});
        setShowManualOrder(false);
    };
    
    const handleMoveItems = (direction: 'up' | 'down') => {
        setState(prev => ({
            ...prev,
            structure: moveItemsRecursive(prev.structure, selectedItemIds, direction),
            isDirty: true,
        }));
    };

    const handleDeleteItems = (itemIds: string[]) => {
        let itemsToDeleteDetails: StructureItem[] = [];
        itemIds.forEach(id => {
            const item = findItemRecursive(state.structure, id) || state.availableJobs.find(j => j.id === id);
            if (item) itemsToDeleteDetails.push(item);
        });

        const hasContainerWithChildren = itemsToDeleteDetails.some(item => item.children && item.children.length > 0);
        const confirmMessage = hasContainerWithChildren 
            ? "This action will delete the selected container(s) and all items within them."
            : `You are about to delete ${itemIds.length} item(s).`;
        
        setDeleteConfirmation({ ids: itemIds, message: confirmMessage });
    };

    const handleConfirmDelete = () => {
        if (!deleteConfirmation) return;
        const { ids } = deleteConfirmation;

        setState(prev => {
            let currentStructure = prev.structure;
            let currentAvailableJobs = prev.availableJobs;

            ids.forEach(idToDelete => {
                const [structureAfterRemove, removedFromStructure] = removeItemRecursive(currentStructure, idToDelete);
                if (removedFromStructure) {
                    currentStructure = structureAfterRemove;
                } else {
                    currentAvailableJobs = currentAvailableJobs.filter(job => job.id !== idToDelete);
                }
            });
            
            return { ...prev, structure: currentStructure, availableJobs: currentAvailableJobs, isDirty: true };
        });

        setSelectedItemIds([]);
        setDeleteConfirmation(null);
        addToast(`Successfully deleted ${ids.length} item(s).`);
    };

    const handleMoveToPosition = (id: string, position: string) => {
        setState(prev => {
            const [newStructure, modified] = modifySiblingOrderRecursive(prev.structure, id, position, 'move');
            return modified ? { ...prev, structure: newStructure, isDirty: true } : prev;
        });
    };
    
    const handleSwapItems = (id: string, position: string) => {
        setState(prev => {
            const [newStructure, modified] = modifySiblingOrderRecursive(prev.structure, id, position, 'swap');
            return modified ? { ...prev, structure: newStructure, isDirty: true } : prev;
        });
    };

    const handleToggleExpand = (id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
        setExpansionState('custom');
    };
    
    const handleToggleExpandAll = () => {
        if (expansionState === 'all') {
            setExpandedIds(new Set());
            setExpansionState('none');
        } else {
            const allIds = new Set<string>();
            const walk = (items: StructureItem[]) => items.forEach(item => {
                if(item.children) {
                    allIds.add(item.id);
                    walk(item.children);
                }
            });
            walk(state.structure);
            setExpandedIds(allIds);
            setExpansionState('all');
        }
    };

    const handleExpandLevel = (level: number) => { // 0: Divs, 1: Depts, 2: Jobs
        const newExpandedIds = new Set<string>();
        const walk = (items: StructureItem[], currentDepth: number) => {
            if (currentDepth >= level) return;
            items.forEach(item => {
                if (item.children) {
                    newExpandedIds.add(item.id);
                    walk(item.children, currentDepth + 1);
                }
            });
        };
        walk(state.structure, 0);
        setExpandedIds(newExpandedIds);
        setExpansionState(level === 1 ? 'depts' : (level === 2 ? 'jobs' : 'custom'));
    };

    const handleContextMenu = (event: React.MouseEvent, itemId: string) => {
        event.preventDefault();
        event.stopPropagation();
        if (!selectedItemIds.includes(itemId)) {
            handleSelect(itemId, false);
        }
        setContextMenu({ x: event.clientX, y: event.clientY, itemId });
    };

    const handleCopy = (itemId: string) => {
        const itemToCopy = findItemRecursive(state.structure, itemId);
        if (itemToCopy) {
            setClipboard({ mode: 'copy', item: JSON.parse(JSON.stringify(itemToCopy)) });
            addToast(`Copied "${itemToCopy.name}"`);
        }
    };

    const handleCut = (itemIds: string[]) => {
        const itemToCut = findItemRecursive(state.structure, itemIds[0]); // Simple cut, only first selected
        if(itemToCut) {
            setClipboard({ mode: 'cut', item: itemToCut });
            handleDeleteItems(itemIds);
            addToast(`Cut "${itemToCut.name}"`);
        }
    };

    const handlePaste = (targetItemId: string) => {
        if (!clipboard.item) return;

        const deepCopy = (item: StructureItem): StructureItem => ({
            ...item,
            id: `copy-${item.id}-${Date.now()}`,
            children: item.children ? item.children.map(deepCopy) : undefined
        });

        const itemToPaste = clipboard.mode === 'copy' ? deepCopy(clipboard.item) : clipboard.item;
        
        setState(prev => {
            const [newStructure] = insertItemRecursive(JSON.parse(JSON.stringify(prev.structure)), targetItemId, itemToPaste);
            return { ...prev, structure: newStructure, isDirty: true };
        });

        if (clipboard.mode === 'cut') {
            setClipboard({ mode: null, item: null });
        }
    };

    const handleMoveRight = () => { // Move from structure to available
        const jobsToMove = selectedItemIds
            .map(id => findItemRecursive(state.structure, id))
            .filter(item => item && item.type === 'Job') as StructureItem[];
        
        if (jobsToMove.length === 0) return;
        
        setState(prev => {
            let currentStructure = prev.structure;
            jobsToMove.forEach(job => {
                const [structureAfterRemove] = removeItemRecursive(currentStructure, job.id);
                currentStructure = structureAfterRemove;
            });
            const newAvailableJobs = [...prev.availableJobs, ...jobsToMove];
            return { ...prev, structure: currentStructure, availableJobs: newAvailableJobs, isDirty: true };
        });

        setSelectedItemIds(jobsToMove.map(j => j.id));
        setJustMovedItemIds(new Set(jobsToMove.map(j => j.id)));
        setTimeout(() => setJustMovedItemIds(new Set()), 1500);
    };

    const handleMoveLeft = () => { // Move from available to last selected valid structure item
        const jobsToMove = selectedItemIds
            .map(id => state.availableJobs.find(job => job.id === id))
            .filter(Boolean) as StructureItem[];
        
        if (jobsToMove.length === 0) return;

        const lastSelectedItemInStructure = findItemRecursive(state.structure, selectedItemIds[selectedItemIds.length - 1]);
        let targetParentId: string | null = null;
        if(lastSelectedItemInStructure) {
            if(lastSelectedItemInStructure.type === 'Department') targetParentId = lastSelectedItemInStructure.id;
        }

        if(!targetParentId) {
            addToast("Please select a Department in the structure to move jobs into.");
            return;
        }
        
        setState(prev => {
            const newAvailableJobs = prev.availableJobs.filter(job => !selectedItemIds.includes(job.id));
            let currentStructure = prev.structure;
            jobsToMove.forEach(job => {
                const [structureAfterInsert] = insertItemRecursive(currentStructure, targetParentId!, job);
                currentStructure = structureAfterInsert;
            });
            return { ...prev, availableJobs: newAvailableJobs, structure: currentStructure, isDirty: true };
        });

        setSelectedItemIds(jobsToMove.map(j => j.id));
        setJustMovedItemIds(new Set(jobsToMove.map(j => j.id)));
        setTimeout(() => setJustMovedItemIds(new Set()), 1500);
    };

    const handleCreateCustomJob = (name: string) => {
        if (!name.trim()) return;
        const newJob: StructureItem = {
            id: `job-custom-${Date.now()}`,
            name,
            type: 'Job'
        };
        setState(prev => ({
            ...prev,
            availableJobs: [...prev.availableJobs, newJob],
            isDirty: true
        }));
        setIsCreateModalOpen(false);
        setNewJobName('');
    };
    
    const handleCreateItem = () => {
        if(!createItemContext || !newItemName.trim()) {
            setIsCreateItemModalOpen(false);
            return;
        };
        const { type, parentId } = createItemContext;

        const newItem: StructureItem = {
            id: `${type.toLowerCase()}-${Date.now()}`,
            name: newItemName.trim(),
            type: type,
            children: (type === 'Division' || type === 'Department') ? [] : undefined
        };
        
        setState(prev => {
            let newStructure = JSON.parse(JSON.stringify(prev.structure));
            if(parentId) {
                const [structureAfterInsert] = insertItemRecursive(newStructure, parentId, newItem);
                newStructure = structureAfterInsert;
            } else { // Root level
                newStructure.push(newItem);
            }
            return {...prev, structure: newStructure, isDirty: true };
        });

        setIsCreateItemModalOpen(false);
        setCreateItemContext(null);
    };

    const handleOpenAddItemModal = (type: ItemType, parentId: string | null) => {
        setCreateItemContext({ type, parentId });
        setNewItemName('');
        setIsCreateItemModalOpen(true);
    };
    
    const handleAddLayer = (layerData: LayerDivision[]) => {
        const newDivisions: StructureItem[] = layerData
            .filter(div => div.name.trim())
            .map(div => ({
                id: `div-layer-${div.id}`,
                name: div.name,
                type: 'Division',
                children: div.departments
                    .filter(dept => dept.name.trim())
                    .map(dept => ({
                        id: `dept-layer-${dept.id}`,
                        name: dept.name,
                        type: 'Department',
                        children: dept.jobs
                            .filter(job => job.name.trim())
                            .map(job => ({
                                id: `job-layer-${job.id}`,
                                name: job.name,
                                type: 'Job'
                            }))
                    }))
            }));

        if (newDivisions.length > 0) {
            setState(prev => ({
                ...prev,
                structure: [...prev.structure, ...newDivisions],
                isDirty: true
            }));
            addToast(`Added ${newDivisions.length} new division(s).`);
        }
        setIsAddLayerModalOpen(false);
    };
    
    const handleSortChildren = (parentId: string, direction: 'asc' | 'desc') => {
        const sortRecursive = (items: StructureItem[]): StructureItem[] => {
            return items.map(item => {
                if(item.id === parentId && item.children) {
                    const sortedChildren = [...item.children].sort((a,b) => 
                        direction === 'asc' 
                        ? a.name.localeCompare(b.name) 
                        : b.name.localeCompare(a.name)
                    );
                    return { ...item, children: sortRecursive(sortedChildren) };
                }
                if (item.children) {
                    return { ...item, children: sortRecursive(item.children) };
                }
                return item;
            });
        };
        setState(prev => ({...prev, structure: sortRecursive(prev.structure), isDirty: true }));
    };

    const handleSort = (direction: 'asc' | 'desc') => {
        const sortAll = (items: StructureItem[]): StructureItem[] => {
            const sorted = [...items].sort((a,b) => 
                direction === 'asc'
                ? a.name.localeCompare(b.name)
                : b.name.localeCompare(a.name)
            );
            return sorted.map(item => 
                item.children ? { ...item, children: sortAll(item.children) } : item
            );
        };
        setState(prev => ({...prev, structure: sortAll(prev.structure), isDirty: true }));
    };

    const handleApplyManualOrder = () => {
        const applyOrderRecursive = (items: StructureItem[]): StructureItem[] => {
            const itemsWithOrder = items.map(item => ({
                ...item,
                order: parseInt(manualOrder[item.id] || '9999', 10)
            }));
            
            const sortedItems = itemsWithOrder.sort((a, b) => a.order - b.order);

            return sortedItems.map(({ order, ...item }) => {
                if (item.children) {
                    return { ...item, children: applyOrderRecursive(item.children) };
                }
                return item;
            });
        };

        setState(prev => ({ ...prev, structure: applyOrderRecursive(prev.structure), isDirty: true }));
        addToast("Manual order applied.");
    };

    // Derived state for props
    const singleSelectedItem = useMemo(() => {
        if (selectedItemIds.length !== 1) return null;
        return findItemRecursive(state.structure, selectedItemIds[0]) || state.availableJobs.find(j => j.id === selectedItemIds[0]) || null;
    }, [selectedItemIds, state.structure, state.availableJobs]);
    
    const canExpandSelection = useMemo(() => {
        return selectedItemIds.some(id => {
            const item = findItemRecursive(state.structure, id);
            return item && (item.type === 'Division' || item.type === 'Department') && item.children && item.children.length > 0;
        });
    }, [selectedItemIds, state.structure]);

    const canCollapseSelection = useMemo(() => {
        return selectedItemIds.some(id => {
            const item = findItemRecursive(state.structure, id);
            // Can collapse if the item itself is expanded and has children.
            return item && expandedIds.has(id) && item.children && item.children.length > 0;
        });
    }, [selectedItemIds, expandedIds, state.structure]);
    
    const canExpandToDepts = useMemo(() => {
        return selectedItemIds.some(id => {
            const item = findItemRecursive(state.structure, id);
            return item && item.type === 'Division' && item.children && item.children.some(c => c.type === 'Department');
        });
    }, [selectedItemIds, state.structure]);

    const canCollapseToDepts = useMemo(() => {
        return selectedItemIds.some(id => {
            const item = findItemRecursive(state.structure, id);
            return item && item.type === 'Division' && expandedIds.has(id);
        });
    }, [selectedItemIds, state.structure, expandedIds]);

    const canCollapseToJobs = useMemo(() => {
        return selectedItemIds.some(id => {
            const item = findItemRecursive(state.structure, id);
            if (!item) return false;
            if (item.type === 'Department' && expandedIds.has(id)) return true;
            if (item.type === 'Division' && expandedIds.has(id)) {
                 // True if this division is expanded and any of its children departments are expanded
                return item.children?.some(child => child.type === 'Department' && expandedIds.has(child.id)) || false;
            }
            return false;
        });
    }, [selectedItemIds, state.structure, expandedIds]);

    const handleExpandSelection = (level: "depts" | "jobs") => {
        const newExpandedIds = new Set(expandedIds);
        const idsToExpand = new Set<string>();

        const findChildren = (item: StructureItem) => {
            if (level === 'depts' && item.type === 'Division' && item.children) {
                idsToExpand.add(item.id);
            } else if (level === 'jobs') {
                 if ((item.type === 'Division' || item.type === 'Department') && item.children) {
                     idsToExpand.add(item.id);
                     item.children.forEach(findChildren);
                 }
            }
        }
        
        selectedItemIds.forEach(id => {
            const item = findItemRecursive(state.structure, id);
            if(item) findChildren(item);
        });

        idsToExpand.forEach(id => newExpandedIds.add(id));
        setExpandedIds(newExpandedIds);
        setExpansionState('custom');
    };

    const handleCollapseSelection = () => {
        const newExpandedIds = new Set(expandedIds);

        const collapseAllDescendants = (item: StructureItem) => {
            newExpandedIds.delete(item.id);
            if (item.children) {
                item.children.forEach(collapseAllDescendants);
            }
        };

        selectedItemIds.forEach(id => {
            const item = findItemRecursive(state.structure, id);
            if (item) {
                collapseAllDescendants(item);
            }
        });

        setExpandedIds(newExpandedIds);
        setExpansionState('custom');
    };

    const handleCollapseToLevel = (level: 'depts' | 'divs' | 'jobs') => {
        const newExpandedIds = new Set(expandedIds);
    
        const collapseRecursively = (item: StructureItem) => {
            if (level === 'jobs' && item.type === 'Department') {
                newExpandedIds.delete(item.id);
            }
            if (level === 'depts' && item.type === 'Division') {
                item.children?.forEach(child => {
                    if (child.type === 'Department') newExpandedIds.delete(child.id);
                });
            }
            if (level === 'divs' && item.type === 'Division') {
                newExpandedIds.delete(item.id);
            }
    
            if (item.children) {
                item.children.forEach(collapseRecursively);
            }
        };
        
        selectedItemIds.forEach(id => {
            const item = findItemRecursive(state.structure, id);
            if (item) {
                // If we collapse a Division to Depts, the division itself should remain expanded
                if (level === 'depts' && item.type === 'Division') {
                     item.children?.forEach(child => {
                        if (child.type === 'Department') newExpandedIds.delete(child.id);
                    });
                } else if (level === 'jobs' && (item.type === 'Division' || item.type === 'Department')) {
                    collapseRecursively(item);
                } else {
                    collapseRecursively(item);
                }
            }
        });
    
        setExpandedIds(newExpandedIds);
        setExpansionState('custom');
    };
    
    const structureCounts = useMemo(() => {
        let divisions = 0, departments = 0, jobs = 0;
        const count = (items: StructureItem[]) => {
            for(const item of items) {
                if (item.type === 'Division') divisions++;
                if (item.type === 'Department') departments++;
                if (item.type === 'Job') jobs++;
                if (item.children) count(item.children);
            }
        };
        count(state.structure);
        return { divisions, departments, jobs };
    }, [state.structure]);


    const propsForSetupPage = {
        state, setState, activeItem, activeId, setActiveId,
        filteredStructure, selectedItemIds, setSelectedItemIds, handleSelect, editingItemId, setEditingItemId, handleNameChange,
        handleReset, handleMoveItems, handleMoveToPosition, handleSwapItems, expandedIds, handleToggleExpand, expansionState,
        handleToggleExpandAll, handleExpandLevel, handleContextMenu, clipboard, handleCopy, handleCut, handlePaste,
        handleDeleteItems, handleOpenModifyModal: (itemId?: string) => {
            if (itemId) setSelectedItemIds([itemId]);
            setIsModifyModalOpen(true);
        },
        structureSearchQuery, setStructureSearchQuery,
        handleMoveRight, handleMoveLeft,
        flattenedStructureIds, availableJobIds, filteredAvailableJobs, setIsCreateModalOpen,
        availableJobsSearchQuery, setAvailableJobsSearchQuery, setActiveStep, justMovedItemIds, structureTitle,
        handleOpenSaveTemplateModal: () => setIsSaveTemplateModalOpen(true), 
        savedTemplates, handleExpandSelection, handleCollapseSelection, canCollapseSelection,
        handleLoadTemplate, handleDeleteTemplate, canExpandSelection, canExpandToDepts,
        canCollapseToDepts, canCollapseToJobs,
        structureCounts, availableJobsCount: state.availableJobs.length, features,
        handleOpenAddItemModal,
        manualOrder, onManualOrderChange: (id: string, value: string) => setManualOrder(prev => ({ ...prev, [id]: value})),
        onApplyManualOrder: handleApplyManualOrder, onSort: handleSort,
        showManualOrder, onToggleShowManualOrder: () => setShowManualOrder(p => !p),
        onSortChildren: handleSortChildren, onOpenAddLayerModal: () => setIsAddLayerModalOpen(true),
        singleSelectedItem, isAvailableJobsPanelVisible, setIsAvailableJobsPanelVisible,
        onCollapseToLevel: handleCollapseToLevel
    };

    return (
        <div className="bg-gray-100 min-h-screen p-4 sm:p-6 lg:p-8" onClick={() => setContextMenu(null)}>
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <div className="bg-white rounded-xl shadow-lg p-6">
                <header className="flex justify-between items-start pb-4 border-b">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Labour Setup</h1>
                        <p className="text-gray-500 mt-1 font-medium">Configure your organization's structure and roles.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {features.undoRedo && (
                            <>
                                <button onClick={undo} disabled={!canUndo} className="p-2 border rounded-md bg-white shadow-sm hover:bg-gray-200 disabled:opacity-50" title="Undo">
                                    <Undo size={16} />
                                </button>
                                <button onClick={redo} disabled={!canRedo} className="p-2 border rounded-md bg-white shadow-sm hover:bg-gray-200 disabled:opacity-50" title="Redo">
                                    <Redo size={16} />
                                </button>
                            </>
                        )}
                        {activeStep === 0 && features.availableJobsPanel && !isAvailableJobsPanelVisible && (
                            <button
                                onClick={() => setIsAvailableJobsPanelVisible(true)}
                                title="Show available jobs panel"
                                className="p-2 border rounded-md bg-white shadow-sm hover:bg-gray-200"
                                aria-label="Show available jobs panel"
                            >
                                <Briefcase size={16} />
                            </button>
                        )}
                        <FeaturePanel features={features} onToggleFeature={handleToggleFeature} />
                    </div>
                </header>

                <Stepper 
                    steps={['Labor Structure', 'Review & Save']} 
                    activeStep={activeStep} 
                    onStepClick={(step) => {
                        // If already submitted, don't allow navigation from review page.
                        if (isSubmitted && activeStep === 1) return;

                        // Allow navigation to any step
                        setActiveStep(step);
                        
                        // When navigating away from the review step, reset submitted status
                        if (step !== 1) {
                            setIsSubmitted(false);
                        }
                    }}
                />

                <div className="mt-8">
                   {activeStep === 0 && <SetupPage {...propsForSetupPage} />}
                   {activeStep === 1 && !isSubmitted && (
                     <ReviewPage 
                        structure={state.structure}
                        structureCounts={structureCounts} 
                        onBack={() => setActiveStep(0)} 
                        onSubmit={() => setIsSubmitted(true)} 
                     />
                   )}
                   {activeStep === 1 && isSubmitted && (
                     <CongratulationsPage 
                        onReset={handleReset} 
                     />
                   )}
                </div>
            </div>

            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={() => setContextMenu(null)}
                    onModify={() => setIsModifyModalOpen(true)}
                    onCopy={() => handleCopy(contextMenu.itemId)}
                    onCut={() => handleCut(selectedItemIds)}
                    onPaste={() => handlePaste(contextMenu.itemId)}
                    onDelete={() => handleDeleteItems(selectedItemIds)}
                    canPaste={!!clipboard.item}
                    itemType={singleSelectedItem?.type}
                    onExpandSelection={handleExpandSelection}
                    onCollapseSelection={handleCollapseSelection}
                    canExpandSelection={canExpandSelection}
                    canExpandToDepts={canExpandToDepts}
                    canCollapseSelection={canCollapseSelection}
                    canCollapseToDepts={canCollapseToDepts}
                    canCollapseToJobs={canCollapseToJobs}
                    onCollapseToLevel={handleCollapseToLevel}
                    onOpenAddItemModal={() => {
                        const item = singleSelectedItem;
                        if (item && (item.type === 'Division' || item.type === 'Department')) {
                            propsForSetupPage.handleOpenAddItemModal(item.type === 'Division' ? 'Department' : 'Job', item.id);
                        }
                    }}
                />
            )}
            
            <SaveTemplateModal 
              isOpen={isSaveTemplateModalOpen}
              onClose={() => setIsSaveTemplateModalOpen(false)}
              onSave={handleSaveTemplate}
              existingNames={savedTemplates.map(t => t.name)}
            />

            <Modal isOpen={isModifyModalOpen} onClose={() => setIsModifyModalOpen(false)} title={`Modify ${singleSelectedItem?.type || 'Item'}`}>
                <input 
                    type="text" 
                    defaultValue={singleSelectedItem?.name || ''}
                    onBlur={(e) => singleSelectedItem && handleNameChange(singleSelectedItem.id, e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && singleSelectedItem) handleNameChange(singleSelectedItem.id, e.currentTarget.value) }}
                    autoFocus
                    className="w-full p-2 border rounded"
                />
            </Modal>
            
            <Modal isOpen={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); setNewJobName(''); }} title="Create Custom Job">
                 <input 
                    type="text" 
                    placeholder="Enter new job name"
                    value={newJobName}
                    onChange={(e) => setNewJobName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleCreateCustomJob(newJobName) }}
                    autoFocus
                    className="w-full p-2 border rounded"
                />
                <div className="flex justify-end gap-2 pt-4">
                    <button onClick={() => { setIsCreateModalOpen(false); setNewJobName(''); }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
                        Cancel
                    </button>
                    <button onClick={() => handleCreateCustomJob(newJobName)} className="px-4 py-2 text-sm font-medium text-white bg-cyan-700 border border-transparent rounded-md shadow-sm hover:bg-cyan-800">
                        OK
                    </button>
                </div>
            </Modal>

            <Modal isOpen={isCreateItemModalOpen} onClose={() => setIsCreateItemModalOpen(false)} title={`Create New ${createItemContext?.type || 'Item'}`}>
                <input
                    type="text"
                    placeholder={`Enter new ${createItemContext?.type || ''} name`}
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleCreateItem() }}
                    autoFocus
                    className="w-full p-2 border rounded"
                />
                <div className="flex justify-end gap-2 pt-4">
                    <button onClick={() => setIsCreateItemModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
                        Cancel
                    </button>
                    <button onClick={handleCreateItem} className="px-4 py-2 text-sm font-medium text-white bg-cyan-700 border border-transparent rounded-md shadow-sm hover:bg-cyan-800">
                        OK
                    </button>
                </div>
            </Modal>
            
            <Modal isOpen={isAddLayerModalOpen} onClose={() => setIsAddLayerModalOpen(false)} title="Add New Layer">
                <AddLayerForm onSave={handleAddLayer} onClose={() => setIsAddLayerModalOpen(false)} />
            </Modal>

            {deleteConfirmation && (
                <Modal isOpen={true} onClose={() => setDeleteConfirmation(null)} title="Confirm Deletion">
                    <div className="text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                            <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                        </div>
                        <h3 className="mt-2 text-lg font-medium text-gray-900">Are you sure?</h3>
                        <div className="mt-2 text-sm text-gray-500">
                            <p>{deleteConfirmation.message}</p>
                            <p className="mt-1">This action cannot be undone.</p>
                        </div>
                    </div>
                    <div className="mt-5 sm:mt-6 flex justify-center gap-3">
                        <button type="button" onClick={() => setDeleteConfirmation(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
                            Cancel
                        </button>
                        <button type="button" onClick={handleConfirmDelete} className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700">
                            Delete
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default App;