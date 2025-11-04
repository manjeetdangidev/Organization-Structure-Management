import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { StructureItem, ReportingDataType, LocationDataType, ReportingNode, Country, State, District, ItemType } from './types';
import Stepper from './components/Stepper';
import StructureColumn from './components/StructureColumn';
import AvailableJobsColumn from './components/AvailableJobsColumn';
import { ArrowLeft, ArrowRight, Undo, Redo, Building, Briefcase, Users, User, Globe, Landmark, Home, MapPin } from 'lucide-react';
import TreeItem from './components/TreeItem';
import Modal from './components/Modal';
import ReportingTab, { initialData as initialReportingData } from './components/ReportingTab';
import LocationTab, { initialLocationData, initialUnassignedData } from './components/LocationTab';
import ContextMenu from './components/ContextMenu';


// --- State Management with History (for Undo/Redo) ---
type AppState = {
  structure: StructureItem[];
  availableJobs: StructureItem[];
  reporting: ReportingDataType;
  locations: LocationDataType;
  isDirty: boolean;
};

type History<T> = {
  past: T[];
  present: T;
  future: T[];
};

const useHistoryState = (initialState: AppState) => {
  const [history, setHistory] = useState<History<AppState>>({
    past: [],
    present: initialState,
    future: [],
  });

  const setState = useCallback((action: React.SetStateAction<AppState>) => {
    setHistory(currentHistory => {
      const newPresent = typeof action === 'function' ? action(currentHistory.present) : action;

      if (JSON.stringify(newPresent) === JSON.stringify(currentHistory.present)) {
        return currentHistory;
      }
      
      return {
        past: [...currentHistory.past, currentHistory.present],
        present: newPresent,
        future: [],
      };
    });
  }, []);

  const undo = useCallback(() => {
    setHistory(currentHistory => {
      if (currentHistory.past.length === 0) return currentHistory;
      const previous = currentHistory.past[currentHistory.past.length - 1];
      const newPast = currentHistory.past.slice(0, currentHistory.past.length - 1);
      return {
        past: newPast,
        present: previous,
        future: [currentHistory.present, ...currentHistory.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory(currentHistory => {
      if (currentHistory.future.length === 0) return currentHistory;
      const next = currentHistory.future[0];
      const newFuture = currentHistory.future.slice(1);
      return {
        past: [...currentHistory.past, currentHistory.present],
        present: next,
        future: newFuture,
      };
    });
  }, []);
  
  const resetHistory = useCallback((newState: AppState) => {
      setHistory({ past: [], present: newState, future: [] });
  }, []);

  return {
    state: history.present,
    setState,
    resetHistory,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  };
};

const getInitialStructure = (): StructureItem[] => [
  {
    id: 'div-ops', name: 'Operations', type: 'Division',
    children: [
      {
        id: 'dept-foh', name: 'Front of House', type: 'Department',
        children: [
          { id: 'job-host', name: 'Host', type: 'Job' },
          { id: 'job-server', name: 'Server', type: 'Job' },
          { id: 'job-bartender', name: 'Bartender', type: 'Job' },
          { id: 'job-busser', name: 'Busser', type: 'Job' },
          { id: 'job-runner', name: 'Food Runner', type: 'Job' },
          { id: 'job-headwaiter', name: 'Head Waiter', type: 'Job' },
        ],
      },
      {
        id: 'dept-boh', name: 'Back of House', type: 'Department',
        children: [
          { id: 'job-exec-chef', name: 'Executive Chef', type: 'Job' },
          { id: 'job-sous-chef', name: 'Sous Chef', type: 'Job' },
          { id: 'job-line-cook', name: 'Line Cook', type: 'Job' },
          { id: 'job-grill-cook', name: 'Grill Cook', type: 'Job' },
          { id: 'job-prep-cook', name: 'Prep Cook', type: 'Job' },
          { id: 'job-dishwasher', name: 'Dishwasher', type: 'Job' },
        ],
      },
    ],
  },
  {
    id: 'div-mgmt', name: 'Management', type: 'Division',
    children: [
      {
        id: 'dept-admin', name: 'Administration', type: 'Department',
        children: [
            { id: 'job-gm', name: 'General Manager', type: 'Job' },
            { id: 'job-am', name: 'Assistant Manager', type: 'Job' },
            { id: 'job-shiftlead', name: 'Shift Supervisor', type: 'Job' },
            { id: 'job-hr', name: 'HR Coordinator', type: 'Job' },
        ],
      },
       {
        id: 'dept-finance', name: 'Finance', type: 'Department',
        children: [
            { id: 'job-accountant', name: 'Accountant', type: 'Job' },
            { id: 'job-payroll', name: 'Payroll Specialist', type: 'Job' }
        ],
      },
    ],
  },
  {
    id: 'div-culinary', name: 'Culinary', type: 'Division',
    children: [
        {
            id: 'dept-pastry', name: 'Pastry', type: 'Department',
            children: [
                { id: 'job-head-pastry', name: 'Head Pastry Chef', type: 'Job' },
                { id: 'job-baker', name: 'Baker', type: 'Job' },
                { id: 'job-choc', name: 'Chocolatier', type: 'Job' },
            ]
        },
        {
            id: 'dept-beverage', name: 'Beverage Program', type: 'Department',
            children: [
                { id: 'job-bar-manager', name: 'Bar Manager', type: 'Job' },
                { id: 'job-lead-bartender', name: 'Lead Bartender', type: 'Job' },
            ]
        }
    ]
  },
  {
      id: 'div-guest', name: 'Guest Services', type: 'Division',
      children: [
          {
              id: 'dept-reservations', name: 'Reservations', type: 'Department',
              children: [
                  { id: 'job-res-man', name: 'Reservations Manager', type: 'Job'},
                  { id: 'job-res-agent', name: 'Reservations Agent', type: 'Job'},
              ]
          },
          {
              id: 'dept-events', name: 'Events', type: 'Department',
              children: [
                  { id: 'job-events-coord', name: 'Events Coordinator', type: 'Job'},
                  { id: 'job-banquet', name: 'Banquet Server', type: 'Job'},
              ]
          }
      ]
  }
];

const getInitialAvailableJobs = (): StructureItem[] => [
    { id: 'job-av-sommelier', name: 'Sommelier', type: 'Job' },
    { id: 'job-av-pastry-chef', name: 'Pastry Chef', type: 'Job' },
    { id: 'job-av-barback', name: 'Barback', type: 'Job' },
    { id: 'job-av-valet', name: 'Valet', type: 'Job' },
    { id: 'job-av-security', name: 'Security Guard', type: 'Job' },
    { id: 'job-av-maint', name: 'Maintenance Technician', type: 'Job' },
    { id: 'job-av-janitor', name: 'Janitor', type: 'Job' },
    { id: 'job-av-mkt-man', name: 'Marketing Manager', type: 'Job' },
    { id: 'job-av-social', name: 'Social Media Coordinator', type: 'Job' },
    { id: 'job-av-it', name: 'IT Support', type: 'Job' },
    { id: 'job-av-somm-assist', name: 'Sommelier Assistant', type: 'Job' },
    { id: 'job-av-catering', name: 'Catering Manager', type: 'Job' },
    { id: 'job-av-purchasing', name: 'Purchasing Agent', type: 'Job' },
    { id: 'job-av-porter', name: 'Kitchen Porter', type: 'Job' },
    { id: 'job-av-garde', name: 'Garde Manger', type: 'Job' },
    { id: 'job-av-expeditor', name: 'Expeditor', type: 'Job' },
    { id: 'job-av-cashier', name: 'Cashier', type: 'Job' },
    { id: 'job-av-inventory', name: 'Inventory Clerk', type: 'Job' },
];

const getInitialState = (): AppState => ({
    structure: getInitialStructure(),
    availableJobs: getInitialAvailableJobs(),
    reporting: initialReportingData,
    locations: {
        assigned: initialLocationData,
        unassigned: initialUnassignedData,
    },
    isDirty: false,
});


// --- Helper functions for immutable tree manipulation ---
const removeItemRecursive = (items: StructureItem[], itemId: string): [StructureItem[], StructureItem | null] => {
    let removedItem: StructureItem | null = null;
    const newItems = items.filter(item => {
        if (item.id === itemId) {
            removedItem = item;
            return false;
        }
        return true;
    }).map(item => {
        if (item.children) {
            const [newChildren, foundItem] = removeItemRecursive(item.children, itemId);
            if(foundItem) removedItem = foundItem;
            return { ...item, children: newChildren };
        }
        return item;
    });
    return [newItems, removedItem];
};

const insertItemRecursive = (nodes: StructureItem[], overId: string, itemToInsert: StructureItem): [StructureItem[], boolean] => {
    for (let i = 0; i < nodes.length; i++) {
        const overItem = nodes[i];
        if (overItem.id === overId) {
            if (overItem.type !== 'Job') { // Is a container, drop inside at top
                overItem.children = [itemToInsert, ...(overItem.children || [])];
            } else { // Is a job, drop before as sibling
                nodes.splice(i, 0, itemToInsert);
            }
            return [nodes, true];
        }
    }

    // If not found as sibling, check children
    for (const node of nodes) {
        if (node.children) {
            const [newChildren, inserted] = insertItemRecursive(node.children, overId, itemToInsert);
            if (inserted) {
                node.children = newChildren;
                return [nodes, true];
            }
        }
    }

    return [nodes, false];
}

const moveItemsRecursive = (items: StructureItem[], itemIds: string[], direction: 'up' | 'down'): StructureItem[] => {
    let newItems = [...items];
    const selectedIndicesInThisLevel = newItems
        .map((item, index) => (itemIds.includes(item.id) ? index : -1))
        .filter(index => index !== -1);

    if (selectedIndicesInThisLevel.length > 0) {
        const sortedIndices = direction === 'up'
            ? selectedIndicesInThisLevel.sort((a, b) => a - b)
            : selectedIndicesInThisLevel.sort((a, b) => b - a);
        
        sortedIndices.forEach(index => {
            const currentItemOriginalId = items[index].id;
            const currentItemIndexInMutatedArray = newItems.findIndex(i => i.id === currentItemOriginalId);
            const newIndex = direction === 'up' ? currentItemIndexInMutatedArray - 1 : currentItemIndexInMutatedArray + 1;

            if (newIndex >= 0 && newIndex < newItems.length && !itemIds.includes(newItems[newIndex].id)) {
                newItems = arrayMove(newItems, currentItemIndexInMutatedArray, newIndex);
            }
        });
    }

    // Recurse into children
    return newItems.map(item => {
        if (item.children && item.children.length > 0) {
            return { ...item, children: moveItemsRecursive(item.children, itemIds, direction) };
        }
        return item;
    });
};

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

// --- Page and View Components (extracted from App) ---
const ReadOnlyStructureItem: React.FC<{item: StructureItem, depth?: number}> = ({ item, depth = 0 }) => {
     const nameClass = item.type === 'Division' ? 'font-semibold text-gray-800' 
        : item.type === 'Department' ? 'font-medium text-gray-700'
        : 'font-normal text-gray-600';
    return (
        <div style={{ paddingLeft: `${depth * 16}px` }}>
        <div className="flex items-center p-1 rounded-md">
            <span className={nameClass}>{item.name}</span>
        </div>
        {item.children && item.children.length > 0 && (
            <div>
            {item.children.map(child => <ReadOnlyStructureItem key={child.id} item={child} depth={depth + 1} />)}
            </div>
        )}
        </div>
    );
};

const ReadOnlyReportingNode: React.FC<{node: ReportingNode, depth?: number}> = ({ node, depth = 0 }) => {
    const icons = {
        Company: <Building size={14} className="mr-2 flex-shrink-0 text-cyan-800" />,
        BusinessUnit: <Briefcase size={14} className="mr-2 flex-shrink-0 text-cyan-700" />,
        Team: <Users size={14} className="mr-2 flex-shrink-0 text-gray-600" />,
    };
    const EmployeeIcon = <User size={12} className="mr-2 flex-shrink-0 text-gray-500" />;

    return (
        <div style={{ paddingLeft: `${depth * 16}px` }} className="text-sm">
            <div className="flex items-center py-1">
                {icons[node.type]}
                <span className="font-medium">{node.name}</span>
            </div>
             <div style={{ paddingLeft: `16px` }}>
                {node.assignedEmployees.map(emp => (
                    <div key={emp.id} className="flex items-center py-0.5 text-gray-600">
                        {EmployeeIcon}
                        <span>{emp.name}</span>
                    </div>
                ))}
                {node.children.map(child => (
                    <ReadOnlyReportingNode key={child.id} node={child} depth={0} />
                ))}
            </div>
        </div>
    );
};

const ReadOnlyLocation: React.FC<{countries: Country[]}> = ({ countries }) => (
    <div className="text-sm space-y-2">
        {countries.map(country => (
            <div key={country.id}>
                <div className="flex items-center font-medium"><Globe size={14} className="mr-2 text-cyan-800" />{country.name}</div>
                {country.states.map(state => (
                    <div key={state.id} className="pl-4">
                        <div className="flex items-center text-gray-700"><Landmark size={14} className="mr-2 text-cyan-700" />{state.name}</div>
                        {state.districts.map(district => (
                            <div key={district.id} className="pl-8 flex items-center text-gray-600">
                                <MapPin size={12} className="mr-2 text-gray-500" />{district.name}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        ))}
    </div>
);

interface SetupPageProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    state: AppState;
    setState: (action: React.SetStateAction<AppState>) => void;
    activeItem: StructureItem | null;
    activeId: string | null;
    sensors: any;
    handleDragStart: (event: DragStartEvent) => void;
    handleDragEnd: (event: DragEndEvent) => void;
    filteredStructure: StructureItem[];
    selectedItemIds: string[];
    handleSelect: (id: string, isCtrlOrMeta: boolean) => void;
    editingItemId: string | null;
    setEditingItemId: (id: string | null) => void;
    handleNameChange: (id: string, newName: string) => void;
    handleReset: () => void;
    handleMoveItems: (direction: 'up' | 'down') => void;
    handleMoveToPosition: (id: string, position: string) => void;
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
}

const SetupPage: React.FC<SetupPageProps> = (props) => {
    const {
        activeTab, setActiveTab, state, setState, activeItem, sensors, handleDragStart, handleDragEnd,
        filteredStructure, selectedItemIds, handleSelect, editingItemId, setEditingItemId, handleNameChange,
        handleReset, handleMoveItems, handleMoveToPosition, expandedIds, handleToggleExpand, expansionState,
        handleToggleExpandAll, handleExpandLevel, handleContextMenu, clipboard, handleCopy, handleCut, handlePaste,
        handleDeleteItems, handleOpenModifyModal, structureSearchQuery, setStructureSearchQuery, handleMoveRight,
        handleMoveLeft, flattenedStructureIds, availableJobIds, filteredAvailableJobs, setIsCreateModalOpen,
        availableJobsSearchQuery, setAvailableJobsSearchQuery, setActiveStep, justMovedItemIds
    } = props;
    const { reporting, locations } = state;

    const tabs = [
        { id: 'structure', name: 'Labor Structure' },
        { id: 'reporting', name: 'Reporting' },
        { id: 'location', name: 'Location' },
    ];

    return (
        <>
            <div className="mb-6 border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`${
                                activeTab === tab.id
                                ? 'border-cyan-500 text-cyan-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-500`}
                        >
                            {tab.name}
                        </button>
                    ))}
                </nav>
            </div>
            <main>
                {activeTab === 'structure' ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 md:gap-6 items-start">
                    <StructureColumn 
                        items={filteredStructure} 
                        selectedItemIds={selectedItemIds}
                        onSelect={handleSelect}
                        editingItemId={editingItemId}
                        onStartEditing={setEditingItemId}
                        onNameChange={handleNameChange}
                        onReset={handleReset}
                        onMoveItems={handleMoveItems}
                        onMoveToPosition={handleMoveToPosition}
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
                        onModify={handleOpenModifyModal}
                        searchQuery={structureSearchQuery}
                        onSearchChange={setStructureSearchQuery}
                        justMovedItemIds={justMovedItemIds}
                    />
                    
                    <div className="flex flex-row lg:flex-col items-center justify-center gap-4 self-center mx-auto">
                        <button onClick={handleMoveRight} title="Remove job from structure" className="p-2 border rounded-md bg-white shadow-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed" disabled={selectedItemIds.length === 0 || !selectedItemIds.some(id => flattenedStructureIds.includes(id))}>
                        <ArrowRight className="h-5 w-5 text-gray-600" />
                        </button>
                        <button onClick={handleMoveLeft} title="Add job to structure" className="p-2 border rounded-md bg-white shadow-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed" disabled={selectedItemIds.length === 0 || !selectedItemIds.some(id => availableJobIds.includes(id))}>
                        <ArrowLeft className="h-5 w-5 text-gray-600" />
                        </button>
                    </div>

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
                    />
                    </div>
                    <DragOverlay>
                    {activeItem ? <TreeItem item={activeItem} isOverlay={true} selectedItemIds={[]} onSelect={()=>{}} editingItemId={null} onStartEditing={()=>{}} onNameChange={()=>{}} position="" onMoveToPosition={() => {}} onToggleExpand={()=>{}} isExpanded={false} expandedIds={new Set()} onContextMenu={() => {}} onDeleteItem={() => {}}/> : null}
                    </DragOverlay>
                </DndContext>
                ) : activeTab === 'reporting' ? (
                <ReportingTab 
                    reportingData={reporting} 
                    setReportingData={(data) => setState(prev => ({...prev, reporting: data, isDirty: true}))} 
                />
                ) : activeTab === 'location' ? (
                <LocationTab 
                    locationData={locations}
                    setLocationData={(data) => setState(prev => ({...prev, locations: data, isDirty: true}))}
                />
                ) : null}
            </main>
            <footer className="flex justify-end mt-8">
                <button onClick={() => setActiveStep(1)} className="px-6 py-2.5 text-sm font-semibold text-white bg-cyan-700 rounded-md shadow-sm hover:bg-cyan-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500">
                    Save & Continue
                </button>
            </footer>
        </>
    );
};

interface PreviewPageProps {
    state: AppState;
    setActiveStep: (step: number) => void;
}

const PreviewPage: React.FC<PreviewPageProps> = ({ state, setActiveStep }) => {
    const { structure: currentStructure, reporting, locations } = state;
    return (
        <>
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-cyan-800 mb-3 pb-2 border-b">Labor Structure</h3>
                <div className="space-y-1">
                    {currentStructure.map(item => <ReadOnlyStructureItem key={item.id} item={item} />)}
                </div>
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-cyan-800 mb-3 pb-2 border-b">Reporting</h3>
                <div className="space-y-2">
                    {reporting.structure.map(node => <ReadOnlyReportingNode key={node.id} node={node} />)}
                </div>
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-cyan-800 mb-3 pb-2 border-b">Location</h3>
                <div className="space-y-2">
                    <ReadOnlyLocation countries={locations.assigned} />
                </div>
            </div>
        </main>
        <footer className="flex justify-between mt-8">
            <button onClick={() => setActiveStep(0)} className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
                Previous
            </button>
        </footer>
        </>
    );
};


const App: React.FC = () => {
  const { state, setState, resetHistory, undo, redo, canUndo, canRedo } = useHistoryState(getInitialState());
  const { structure: currentStructure, availableJobs } = state;
  
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isModifyModalOpen, setIsModifyModalOpen] = useState(false);
  const [itemToModify, setItemToModify] = useState<{id: string, name: string} | null>(null);
  const [newJobName, setNewJobName] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [activeTab, setActiveTab] = useState('structure');
  
  // State for new features
  const [clipboard, setClipboard] = useState<{ mode: 'copy' | 'cut' | null, item: StructureItem | null }>({ mode: null, item: null });
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, itemId: string } | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
      const ids = new Set<string>();
      const addIds = (items: StructureItem[]) => {
          items.forEach(item => { if(item.children) { ids.add(item.id); addIds(item.children); }});
      };
      addIds(getInitialState().structure);
      return ids;
  });
  const [expansionState, setExpansionState] = useState<'all' | 'depts' | 'jobs' | 'none' | 'custom'>('all');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [structureSearchQuery, setStructureSearchQuery] = useState('');
  const [availableJobsSearchQuery, setAvailableJobsSearchQuery] = useState('');
  const [justMovedItemIds, setJustMovedItemIds] = useState(new Set<string>());
  const [deletionConfirmation, setDeletionConfirmation] = useState<{ itemIds: string[], message: string } | null>(null);


  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 }}));

  const findItemDeep = useCallback((items: StructureItem[], itemId: string): StructureItem | null => {
    for (const item of items) {
        if (item.id === itemId) return item;
        if (item.children) {
            const found = findItemDeep(item.children, itemId);
            if (found) return found;
        }
    }
    return null;
  }, []);
  
  const allItems = useMemo(() => {
    const items: StructureItem[] = [];
    const walk = (structure: StructureItem[]) => {
      for (const item of structure) {
        items.push(item);
        if (item.children) {
          walk(item.children);
        }
      }
    };
    walk(currentStructure);
    return [...items, ...availableJobs];
  }, [currentStructure, availableJobs]);

  
  const activeItem = useMemo(() => activeId ? findItemDeep(allItems, activeId) : null, [activeId, allItems, findItemDeep]);

  const flattenedStructureIds = useMemo(() => {
    const ids: string[] = [];
    const walk = (items: StructureItem[]) => items.forEach(item => { ids.push(item.id); if (item.children) walk(item.children); });
    walk(currentStructure);
    return ids;
  }, [currentStructure]);

  const availableJobIds = useMemo(() => availableJobs.map(job => job.id), [availableJobs]);

  const filteredAvailableJobs = useMemo(() => {
      if (!availableJobsSearchQuery) return availableJobs;
      const query = availableJobsSearchQuery.toLowerCase();
      return availableJobs.filter(job => job.name.toLowerCase().includes(query));
  }, [availableJobs, availableJobsSearchQuery]);
  
  const filteredStructure = useMemo(() => {
      if (!structureSearchQuery) return currentStructure;
      const query = structureSearchQuery.toLowerCase();

      const filterRecursive = (items: StructureItem[]): StructureItem[] => {
          return items.reduce((acc: StructureItem[], item) => {
              const matches = item.name.toLowerCase().includes(query);
              if (item.children) {
                  const filteredChildren = filterRecursive(item.children);
                  if (matches || filteredChildren.length > 0) {
                      acc.push({ ...item, children: filteredChildren });
                  }
              } else if (matches) {
                  acc.push(item);
              }
              return acc;
          }, []);
      };

      return filterRecursive(currentStructure);
  }, [currentStructure, structureSearchQuery]);

    useEffect(() => {
        if (justMovedItemIds.size > 0) {
            const timer = setTimeout(() => setJustMovedItemIds(new Set()), 500); // Highlight for 500ms
            return () => clearTimeout(timer);
        }
    }, [justMovedItemIds]);

    const addToast = useCallback((message: string) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    }, []);

    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

  
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
      if (foundInStructure) {
        activeItem = foundInStructure;
        structure = newStructure;
      } else {
        activeItem = availableJobs.find((j: StructureItem) => j.id === active.id) || null;
        if (activeItem) {
          availableJobs = availableJobs.filter((j: StructureItem) => j.id !== active.id);
        }
      }
  
      if (!activeItem) return prevState;
  
      const overId = over.id as string;
      
      const isDroppingInAvailable = availableJobs.some((j: StructureItem) => j.id === overId) || overId === 'available-jobs-droppable';
      if(isDroppingInAvailable) {
        if (activeItem.type !== 'Job') return prevState;
        const overIndex = availableJobs.findIndex((j: StructureItem) => j.id === overId);
        if (overIndex !== -1) {
            availableJobs.splice(overIndex, 0, activeItem);
        } else {
            availableJobs.push(activeItem);
        }
      }
      else {
        const [finalStructure, inserted] = insertItemRecursive(structure, overId, activeItem);
        if (inserted) {
          structure = finalStructure;
        } else if (overId === 'structure-droppable') {
           structure.push(activeItem);
        } else {
            return prevState;
        }
      }
      
      return { ...prevState, structure, availableJobs, isDirty: true };
    });
  };

  const handleSelect = (itemId: string, isCtrlOrMeta: boolean) => {
    setEditingItemId(null);
    if (isCtrlOrMeta) {
        setSelectedItemIds(prev => 
            prev.includes(itemId) 
            ? prev.filter(id => id !== itemId)
            : [...prev, itemId]
        );
        return;
    }

    const selectedAvailableJobs = selectedItemIds.filter(id => availableJobIds.includes(id));
    const isNewItemInStructure = flattenedStructureIds.includes(itemId);

    if (selectedAvailableJobs.length > 0 && selectedAvailableJobs.length === selectedItemIds.length && isNewItemInStructure) {
        const targetItem = findItemDeep(currentStructure, itemId);
        if (targetItem && (targetItem.type === 'Division' || targetItem.type === 'Department')) {
            setSelectedItemIds([...selectedAvailableJobs, itemId]);
            return;
        }
    }
    
    setSelectedItemIds(prev => (prev.length === 1 && prev[0] === itemId) ? [] : [itemId]);
    
    const isAvailableJob = availableJobIds.includes(itemId);
    const isNewlySelected = !selectedItemIds.includes(itemId);
    if (isAvailableJob && isNewlySelected) {
        addToast("Select a Department or Division in the structure to move this job to.");
    }
  };
  
  const handleMoveRight = useCallback(() => {
    if (selectedItemIds.length === 0) return;
    setState(prev => {
        let structure = prev.structure;
        let availableJobs = [...prev.availableJobs];
        let itemsMoved = 0;
        selectedItemIds.forEach(itemId => {
            const [newStructure, removedItem] = removeItemRecursive(structure, itemId);
            if(removedItem && removedItem.type === 'Job') {
                structure = newStructure;
                availableJobs.push(removedItem);
                itemsMoved++;
            }
        });
        if (itemsMoved > 0) {
            addToast(`Moved ${itemsMoved} job(s) to available.`);
            setSelectedItemIds([]);
        }
        return { ...prev, structure, availableJobs, isDirty: itemsMoved > 0 || prev.isDirty };
    });
  }, [selectedItemIds, setState, addToast]);

  const handleMoveLeft = useCallback(() => {
    const availableToMove = selectedItemIds.filter(id => availableJobIds.includes(id));
    const structureTargets = selectedItemIds.filter(id => flattenedStructureIds.includes(id));

    if (availableToMove.length === 0) {
        addToast("Please select at least one job from the 'Available' list.");
        return;
    }
    if (structureTargets.length !== 1) {
        addToast("Please select exactly one target Division or Department from the structure.");
        return;
    }

    const targetId = structureTargets[0];
    const targetItem = findItemDeep(currentStructure, targetId);

    if (!targetItem || targetItem.type === 'Job') {
        addToast("Please select a Division or Department as the target.");
        return;
    }

    setState(prev => {
        let newAvailable = [...prev.availableJobs];
        let newStructure = JSON.parse(JSON.stringify(prev.structure));
        
        const jobsToMove = newAvailable.filter(job => availableToMove.includes(job.id));
        newAvailable = newAvailable.filter(job => !availableToMove.includes(job.id));

        const addJobsToTarget = (nodes: StructureItem[]): boolean => {
            for (const node of nodes) {
                if (node.id === targetId) {
                    if (!node.children) node.children = [];
                    node.children.push(...jobsToMove);
                    return true;
                }
                if (node.children) {
                    if (addJobsToTarget(node.children)) return true;
                }
            }
            return false;
        }

        const moved = addJobsToTarget(newStructure);
        if (moved) {
            addToast(`Moved ${jobsToMove.length} job(s) to '${targetItem.name}'.`);
            setSelectedItemIds([]);
            return { ...prev, structure: newStructure, availableJobs: newAvailable, isDirty: true };
        }
        return prev;
    });
  }, [selectedItemIds, availableJobIds, flattenedStructureIds, currentStructure, findItemDeep, setState, addToast]);

  const handleMoveItems = useCallback((direction: 'up' | 'down') => {
      if (selectedItemIds.length === 0) return;

      const movedItems = selectedItemIds
        .map(id => findItemDeep(currentStructure, id))
        .filter((item): item is StructureItem => item !== null);
    
      if (movedItems.length > 0) {
          const itemNames = movedItems.map(item => `'${item.name}'`).join(', ');
          addToast(`Moved ${itemNames} ${direction}.`);
      }

      setJustMovedItemIds(new Set(selectedItemIds));

      setState(prev => ({
          ...prev,
          structure: moveItemsRecursive(prev.structure, selectedItemIds, direction),
          isDirty: true
      }));
  }, [selectedItemIds, currentStructure, findItemDeep, setState, addToast]);
  
  const updateItemNameRecursive = (items: StructureItem[], itemId: string, newName: string): StructureItem[] => {
    return items.map(item => {
      if (item.id === itemId) return { ...item, name: newName };
      if (item.children) return { ...item, children: updateItemNameRecursive(item.children, itemId, newName) };
      return item;
    });
  };
  
  const handleMoveToPosition = useCallback((itemId: string, targetPositionStr: string) => {
      setState(prev => {
        const [structureWithoutItem, itemToMove] = removeItemRecursive(prev.structure, itemId);
        if (!itemToMove) return prev;

        const newStructure = JSON.parse(JSON.stringify(structureWithoutItem));
        const path = targetPositionStr.split('.').map(p => parseInt(p, 10) - 1);

        if (path.some(isNaN)) return prev;

        const insertionIndex = path.pop();
        if (insertionIndex === undefined || insertionIndex < 0) return prev;
        
        let parentContainer: StructureItem[] | undefined;
        if (path.length === 0) {
            parentContainer = newStructure;
        } else {
            let currentLevelItems: StructureItem[] = newStructure;
            let parentNode: StructureItem | undefined;
            for (const index of path) {
                parentNode = currentLevelItems?.[index];
                if (!parentNode) return prev;
                if(!parentNode.children) parentNode.children = [];
                currentLevelItems = parentNode.children;
            }
            parentContainer = currentLevelItems;
        }

        if (parentContainer) {
          parentContainer.splice(insertionIndex, 0, itemToMove);
        } else {
          return prev;
        }

        return { ...prev, structure: newStructure, isDirty: true };
      });
    }, [setState]);

  const handleNameChange = useCallback((id: string, newName: string) => {
    if (newName.trim()) {
        setState(prev => {
            const allStructureAndJobs = [...allItems];
            const item = findItemDeep(allStructureAndJobs, id);
            addToast(`Modified '${item?.name}' to '${newName.trim()}'`);
            return {
                ...prev,
                structure: updateItemNameRecursive(prev.structure, id, newName),
                availableJobs: prev.availableJobs.map(job => job.id === id ? {...job, name: newName} : job),
                isDirty: true
            };
        });
    }
    setEditingItemId(null);
    setIsModifyModalOpen(false);
    setItemToModify(null);
  }, [setState, addToast, allItems, findItemDeep]);
  
  const handleCreateCustomJob = useCallback(() => {
    if (newJobName.trim()) {
        const newJob: StructureItem = { id: `job-custom-${Date.now()}`, name: newJobName.trim(), type: 'Job' };
        setState(prev => ({ ...prev, availableJobs: [...prev.availableJobs, newJob], isDirty: true }));
        addToast(`Created custom job: '${newJob.name}'`);
        setNewJobName('');
        setIsCreateModalOpen(false);
    }
  }, [newJobName, setState, addToast]);

  const handleReset = useCallback(() => {
      resetHistory(getInitialState());
      setSelectedItemIds([]);
      addToast('Structure reset to recommended.');
  }, [resetHistory, addToast]);
  
  const handleOpenModifyModal = useCallback((itemId?: string) => {
    const idToModify = itemId || selectedItemIds[0];
    if (!idToModify) return;
    const item = findItemDeep(allItems, idToModify);
    if (item) {
        setItemToModify({id: item.id, name: item.name});
        setIsModifyModalOpen(true);
    }
  }, [selectedItemIds, allItems, findItemDeep]);

  // --- Deletion Logic ---
  const collectItemIds = (item: StructureItem): string[] => {
    let ids = [item.id];
    if (item.children) {
        item.children.forEach(child => {
            ids = [...ids, ...collectItemIds(child)];
        });
    }
    return ids;
  };

  const findAndCollectAllIds = (items: StructureItem[], targetId: string): string[] => {
      for (const item of items) {
          if (item.id === targetId) {
              return collectItemIds(item);
          }
          if (item.children) {
              const foundIds = findAndCollectAllIds(item.children, targetId);
              if (foundIds.length > 0) {
                  return foundIds;
              }
          }
      }
      return [];
  };

  const filterItemsRecursive = (items: StructureItem[], idsToDelete: Set<string>): StructureItem[] => {
      return items
          .filter(item => !idsToDelete.has(item.id))
          .map(item => {
              if (item.children) {
                  return { ...item, children: filterItemsRecursive(item.children, idsToDelete) };
              }
              return item;
          });
  };

  const handleDeleteItems = useCallback((itemIds: string[]) => {
      if (itemIds.length === 0) return;

      const allItemsToDelete = itemIds.map(id => findItemDeep(allItems, id)).filter((i): i is StructureItem => i !== null);
      if (allItemsToDelete.length === 0) return;

      const namesToDelete = allItemsToDelete.map(i => `'${i.name}'`).join(', ');
      const confirmationMessage = `Are you sure you want to delete ${namesToDelete}? This will also delete all items inside them.`;
      
      setDeletionConfirmation({ itemIds, message: confirmationMessage });
  }, [allItems, findItemDeep]);

  const handleConfirmDeletion = useCallback(() => {
    if (!deletionConfirmation) return;
    const { itemIds } = deletionConfirmation;

    setState(prev => {
        const allIdsToDelete = new Set<string>();
        itemIds.forEach(id => {
            const structureIds = findAndCollectAllIds(prev.structure, id);
            if (structureIds.length > 0) {
                structureIds.forEach(subId => allIdsToDelete.add(subId));
            } else if (prev.availableJobs.some(job => job.id === id)) {
                allIdsToDelete.add(id);
            }
        });
        
        if (allIdsToDelete.size === 0) return prev;
        
        const newStructure = filterItemsRecursive(prev.structure, allIdsToDelete);
        const newAvailableJobs = prev.availableJobs.filter(job => !allIdsToDelete.has(job.id));
        
        addToast(`Deleted ${allIdsToDelete.size} item(s).`);
        setSelectedItemIds(currentIds => currentIds.filter(id => !allIdsToDelete.has(id)));
        
        return {
            ...prev,
            structure: newStructure,
            availableJobs: newAvailableJobs,
            isDirty: true 
        };
    });

    setDeletionConfirmation(null);
  }, [deletionConfirmation, setState, addToast]);

  const cloneWithNewIds = (item: StructureItem): StructureItem => {
    const newId = `${item.type.toLowerCase()}-cloned-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newItem: StructureItem = { ...item, id: newId };
    if (item.children) {
      newItem.children = item.children.map(child => cloneWithNewIds(child));
    }
    return newItem;
  };

  const handleContextMenu = (event: React.MouseEvent, itemId: string) => {
    event.preventDefault();
    event.stopPropagation();
    if (!selectedItemIds.includes(itemId)) {
      setSelectedItemIds([itemId]);
    }
    setContextMenu({ x: event.clientX, y: event.clientY, itemId });
  };
  
  useEffect(() => {
      const handleClickOutside = () => setContextMenu(null);
      window.addEventListener('click', handleClickOutside);
      return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const handleCopy = useCallback((itemId: string) => {
    const itemToCopy = findItemDeep(currentStructure, itemId);
    if (itemToCopy) {
      setClipboard({ mode: 'copy', item: itemToCopy });
      addToast(`Copied '${itemToCopy.name}'`);
    }
    setContextMenu(null);
  }, [currentStructure, findItemDeep, addToast]);

  const handleCut = useCallback((itemIds: string[]) => {
      if (itemIds.length !== 1) {
          addToast("Please select a single item to cut.");
          return;
      };
      const itemId = itemIds[0];
      setState(prev => {
        const [newStructure, itemToCut] = removeItemRecursive(prev.structure, itemId);
        if (itemToCut) {
          setClipboard({ mode: 'cut', item: itemToCut });
          addToast(`Cut '${itemToCut.name}'`);
          return { ...prev, structure: newStructure, isDirty: true };
        }
        return prev;
    });
    setContextMenu(null);
  }, [setState, addToast]);

  const handlePaste = useCallback((targetItemId: string) => {
    if (!clipboard.item) return;
    
    let itemToPaste = clipboard.item;
    if (clipboard.mode === 'copy') {
      itemToPaste = cloneWithNewIds(clipboard.item);
    }
    
    setState(prev => {
      const [newStructure, inserted] = insertItemRecursive(JSON.parse(JSON.stringify(prev.structure)), targetItemId, itemToPaste);
      if (inserted) {
        if (clipboard.mode === 'cut') setClipboard({ mode: null, item: null });
        addToast(`Pasted '${itemToPaste.name}'`);
        return { ...prev, structure: newStructure, isDirty: true };
      }
      return prev;
    });
    setContextMenu(null);
  }, [clipboard, setState, addToast]);

  const handleToggleExpand = useCallback((itemId: string) => {
      setExpandedIds(prev => {
          const newSet = new Set(prev);
          if (newSet.has(itemId)) newSet.delete(itemId);
          else newSet.add(itemId);
          return newSet;
      });
      setExpansionState('custom');
  }, []);

  const handleToggleExpandAll = useCallback(() => {
      if (expansionState === 'all') {
          setExpandedIds(new Set());
          setExpansionState('none');
      } else {
          const allIds = new Set<string>();
          const collectIds = (items: StructureItem[]) => items.forEach(i => { if (i.children) { allIds.add(i.id); collectIds(i.children); }});
          collectIds(currentStructure);
          setExpandedIds(allIds);
          setExpansionState('all');
      }
  }, [expansionState, currentStructure]);

  const handleExpandLevel = useCallback((level: number) => {
      const levelState = level === 1 ? 'depts' : 'jobs';
      if (expansionState === levelState) {
          setExpandedIds(new Set());
          setExpansionState('none');
          return;
      }
      
      const newIds = new Set<string>();
      const collect = (items: StructureItem[], currentLevel: number) => {
          if (currentLevel >= level) return;
          items.forEach(item => {
              if (item.children) {
                  newIds.add(item.id);
                  collect(item.children, currentLevel + 1);
              }
          });
      };
      collect(currentStructure, 0);
      setExpandedIds(newIds);
      setExpansionState(levelState);
  }, [expansionState, currentStructure]);

  const steps = ['Labor Setup', 'Preview & Save'];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-4">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div className="max-w-full mx-auto">
        <header className="mb-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <h1 className="text-2xl font-semibold text-gray-700">Organization Structure Management</h1>
            <div className="flex items-center gap-2">
              <button onClick={undo} disabled={!canUndo} className="p-2 text-gray-600 hover:bg-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed" title="Undo">
                <Undo size={18} />
              </button>
              <button onClick={redo} disabled={!canRedo} className="p-2 text-gray-600 hover:bg-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed" title="Redo">
                <Redo size={18} />
              </button>
              <div className="w-px h-6 bg-gray-300 mx-2"></div>
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500">
                View Summary
              </button>
            </div>
          </div>
          <Stepper steps={steps} activeStep={activeStep} onStepClick={setActiveStep} />
        </header>

        {activeStep === 0 && <SetupPage
          key="setup"
          activeTab={activeTab} setActiveTab={setActiveTab} state={state} setState={setState}
          activeItem={activeItem} activeId={activeId} sensors={sensors} handleDragStart={handleDragStart} handleDragEnd={handleDragEnd}
          filteredStructure={filteredStructure} selectedItemIds={selectedItemIds} handleSelect={handleSelect}
          editingItemId={editingItemId} setEditingItemId={setEditingItemId} handleNameChange={handleNameChange}
          handleReset={handleReset} handleMoveItems={handleMoveItems} handleMoveToPosition={handleMoveToPosition}
          expandedIds={expandedIds} handleToggleExpand={handleToggleExpand} expansionState={expansionState}
          handleToggleExpandAll={handleToggleExpandAll} handleExpandLevel={handleExpandLevel} handleContextMenu={handleContextMenu}
          clipboard={clipboard} handleCopy={handleCopy} handleCut={handleCut} handlePaste={handlePaste}
          handleDeleteItems={handleDeleteItems} handleOpenModifyModal={handleOpenModifyModal} structureSearchQuery={structureSearchQuery}
          setStructureSearchQuery={setStructureSearchQuery} handleMoveRight={handleMoveRight} handleMoveLeft={handleMoveLeft}
          flattenedStructureIds={flattenedStructureIds} availableJobIds={availableJobIds} filteredAvailableJobs={filteredAvailableJobs}
          setIsCreateModalOpen={setIsCreateModalOpen} availableJobsSearchQuery={availableJobsSearchQuery}
          setAvailableJobsSearchQuery={setAvailableJobsSearchQuery} setActiveStep={setActiveStep}
          justMovedItemIds={justMovedItemIds}
        />}
        {activeStep === 1 && <PreviewPage key="preview" state={state} setActiveStep={setActiveStep} />}
      </div>
       
      {contextMenu && (
        <ContextMenu 
          x={contextMenu.x} y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onModify={() => { handleOpenModifyModal(contextMenu.itemId); setContextMenu(null); }}
          onCopy={() => handleCopy(contextMenu.itemId)}
          onCut={() => handleCut([contextMenu.itemId])}
          onPaste={() => handlePaste(contextMenu.itemId)}
          canPaste={!!clipboard.item}
          onDelete={() => { handleDeleteItems([contextMenu.itemId]); setContextMenu(null); }}
        />
      )}

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create Custom Job">
        <div className="space-y-4">
            <label htmlFor="jobName" className="block text-sm font-medium text-gray-700">Job Name</label>
            <input 
                type="text" id="jobName" value={newJobName} onChange={(e) => setNewJobName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                placeholder="e.g., Barista"
                onKeyDown={e => e.key === 'Enter' && handleCreateCustomJob()}
            />
            <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
                    Cancel
                </button>
                <button onClick={handleCreateCustomJob} className="px-4 py-2 text-sm font-medium text-white bg-cyan-700 border border-transparent rounded-md shadow-sm hover:bg-cyan-800">
                    Create
                </button>
            </div>
        </div>
      </Modal>

      <Modal isOpen={isModifyModalOpen} onClose={() => setIsModifyModalOpen(false)} title="Modify Item Name">
        <div className="space-y-4">
            <label htmlFor="modifyJobName" className="block text-sm font-medium text-gray-700">Item Name</label>
            <input 
                type="text" id="modifyJobName" value={itemToModify?.name || ''}
                onKeyDown={(e) => { if(e.key === 'Enter') handleNameChange(itemToModify!.id, e.currentTarget.value) }}
                onChange={(e) => setItemToModify(prev => prev ? {...prev, name: e.target.value} : null)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                autoFocus
            />
            <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setIsModifyModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
                    Cancel
                </button>
                <button onClick={() => handleNameChange(itemToModify!.id, itemToModify!.name)} className="px-4 py-2 text-sm font-medium text-white bg-cyan-700 border border-transparent rounded-md shadow-sm hover:bg-cyan-800">
                    Save
                </button>
            </div>
        </div>
      </Modal>

      <Modal isOpen={!!deletionConfirmation} onClose={() => setDeletionConfirmation(null)} title="Confirm Deletion">
        <div className="space-y-4">
            <p className="text-sm text-gray-600">{deletionConfirmation?.message}</p>
            <p className="text-sm text-gray-800 font-medium">This action cannot be undone.</p>
            <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setDeletionConfirmation(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
                    Cancel
                </button>
                <button onClick={handleConfirmDeletion} className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700">
                    Delete
                </button>
            </div>
        </div>
      </Modal>

    </div>
  );
};

export default App;
