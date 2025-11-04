import React, { useState, useMemo } from 'react';
import { PlusCircle, Edit, Trash2, Globe, Landmark, Home, Map, ChevronRight } from 'lucide-react';
import { DndContext, useDraggable, useDroppable, DragEndEvent, DragStartEvent, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import Modal from './Modal';
import { LocationDataType, LocationData, UnassignedLocationNode, LocationType, Country, State, District } from '../types';

interface LocationTabProps {
    locationData: LocationDataType;
    setLocationData: (data: LocationDataType) => void;
}

interface ModalContext {
    mode: 'create' | 'edit';
    type: LocationType;
    parentId?: string;
    item?: Country | State | District;
}

// --- INITIAL DATA ---
export const initialLocationData: LocationData = [
  {
    id: 'country-usa', name: 'United States', states: [
      { id: 'state-ca', name: 'California', districts: [
          { id: 'dist-la', name: 'Los Angeles County' },
          { id: 'dist-sf', name: 'San Francisco County' },
          { id: 'dist-sd', name: 'San Diego County' },
          { id: 'dist-oc', name: 'Orange County' },
      ]},
      { id: 'state-ny', name: 'New York', districts: [
          { id: 'dist-nyc', name: 'New York County' },
          { id: 'dist-kings', name: 'Kings County' },
          { id: 'dist-queens', name: 'Queens County' },
      ]},
      { id: 'state-tx', name: 'Texas', districts: [
          { id: 'dist-harris', name: 'Harris County' },
          { id: 'dist-dallas', name: 'Dallas County' },
          { id: 'dist-tarrant', name: 'Tarrant County' },
      ]},
      { id: 'state-fl', name: 'Florida', districts: [
          { id: 'dist-miami', name: 'Miami-Dade County' },
          { id: 'dist-broward', name: 'Broward County' },
      ]},
    ]
  },
  {
    id: 'country-can', name: 'Canada', states: [
        {id: 'state-on', name: 'Ontario', districts: [
            {id: 'dist-tor', name: 'Toronto'},
            {id: 'dist-ott', name: 'Ottawa'},
            {id: 'dist-miss', name: 'Mississauga'},
        ]},
        {id: 'state-bc', name: 'British Columbia', districts: [
            {id: 'dist-van', name: 'Vancouver'},
            {id: 'dist-vic', name: 'Victoria'},
        ]},
        {id: 'state-qc', name: 'Quebec', districts: [
            {id: 'dist-mon', name: 'Montreal'},
            {id: 'dist-qbc', name: 'Quebec City'},
        ]},
    ]
  },
  {
    id: 'country-uk', name: 'United Kingdom', states: [
        {id: 'state-eng', name: 'England', districts: [
            {id: 'dist-lon', name: 'Greater London'},
            {id: 'dist-man', name: 'Greater Manchester'},
            {id: 'dist-wm', name: 'West Midlands'},
        ]},
        {id: 'state-sco', name: 'Scotland', districts: [
            {id: 'dist-gla', name: 'Glasgow City'},
            {id: 'dist-edi', name: 'City of Edinburgh'},
        ]},
    ]
  },
  {
    id: 'country-ger', name: 'Germany', states: [
        {id: 'state-bav', name: 'Bavaria', districts: [
            {id: 'dist-mun', name: 'Munich'},
            {id: 'dist-nur', name: 'Nuremberg'},
        ]},
        {id: 'state-hes', name: 'Hesse', districts: [
            {id: 'dist-fra', name: 'Frankfurt'},
            {id: 'dist-wies', name: 'Wiesbaden'},
        ]},
        {id: 'state-ber', name: 'Berlin', districts: [
            {id: 'dist-berlin', name: 'Berlin'},
        ]},
    ]
  },
  {
    id: 'country-ind', name: 'India', states: [
        {id: 'state-mh', name: 'Maharashtra', districts: [
            {id: 'dist-mum', name: 'Mumbai'},
            {id: 'dist-pun', name: 'Pune'},
            {id: 'dist-nag', name: 'Nagpur'},
        ]},
        {id: 'state-ka', name: 'Karnataka', districts: [
            {id: 'dist-blr', name: 'Bengaluru'},
            {id: 'dist-mys', name: 'Mysuru'},
        ]},
         {id: 'state-del', name: 'Delhi', districts: [
            {id: 'dist-nd', name: 'New Delhi'},
        ]},
    ]
  },
  {
    id: 'country-aus', name: 'Australia', states: [
        {id: 'state-nsw', name: 'New South Wales', districts: [
            {id: 'dist-syd', name: 'Sydney'},
            {id: 'dist-new', name: 'Newcastle'},
        ]},
        {id: 'state-vic', name: 'Victoria', districts: [
            {id: 'dist-mel', name: 'Melbourne'},
            {id: 'dist-gee', name: 'Geelong'},
        ]},
    ]
  },
  {
    id: 'country-bra', name: 'Brazil', states: [
        {id: 'state-sp', name: 'São Paulo', districts: [
            {id: 'dist-sp', name: 'São Paulo'},
            {id: 'dist-camp', name: 'Campinas'},
        ]},
        {id: 'state-rj', name: 'Rio de Janeiro', districts: [
            {id: 'dist-rio', name: 'Rio de Janeiro'},
        ]},
    ]
  }
];

export const initialUnassignedData: UnassignedLocationNode[] = [
    { id: 'reg-emea', name: 'EMEA', type: 'Region', children: [
        { id: 'un-country-fr', name: 'France', type: 'Country', children: [
            { id: 'un-state-idf', name: 'Île-de-France', type: 'State', children: [
                { id: 'un-dist-par', name: 'Paris', type: 'District' }
            ]}
        ]}
    ]},
    { id: 'reg-apac', name: 'APAC', type: 'Region', children: [
        { id: 'un-country-jp', name: 'Japan', type: 'Country', children: [
            { id: 'un-state-tok', name: 'Tokyo', type: 'State', children: [
                { id: 'un-dist-shinj', name: 'Shinjuku', type: 'District' }
            ]}
        ]},
        { id: 'un-country-sg', name: 'Singapore', type: 'Country', children: []}
    ]}
];


// --- Unassigned Locations Tree Component ---
const UnassignedNodeComponent: React.FC<{
    node: UnassignedLocationNode;
    depth?: number;
    expandedNodes: Set<string>;
    onToggleExpand: (id: string) => void;
}> = ({ node, depth = 0, expandedNodes, onToggleExpand }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: node.id,
        data: { type: node.type, item: { id: node.id, name: node.name } },
        disabled: node.type === 'Region',
    });

    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    
    return (
        <div style={{ paddingLeft: `${depth * 16}px` }}>
            <div
                ref={setNodeRef}
                className={`flex items-center p-2 rounded-md my-1 text-sm ${node.type !== 'Region' ? 'cursor-grab hover:bg-gray-100' : 'font-semibold text-gray-500'} ${isDragging ? 'opacity-50' : ''}`}
                {...(node.type !== 'Region' ? listeners : {})}
                {...(node.type !== 'Region' ? attributes : {})}
            >
                {hasChildren ? (
                    <button onClick={() => onToggleExpand(node.id)} className="mr-1 p-0.5 rounded hover:bg-gray-200">
                        <ChevronRight size={14} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>
                ) : <span className="w-5 mr-1"></span>}
                <span>{node.name}</span>
            </div>
            {isExpanded && hasChildren && (
                <div>
                    {node.children?.map(child => (
                        <UnassignedNodeComponent key={child.id} node={child} depth={depth+1} expandedNodes={expandedNodes} onToggleExpand={onToggleExpand} />
                    ))}
                </div>
            )}
        </div>
    );
};


// --- COLUMN COMPONENT ---
interface LocationColumnProps {
    title: string;
    Icon: React.ElementType;
    items: { id: string, name: string }[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onAdd: () => void;
    onEdit: (item: {id: string, name: string}) => void;
    onDelete: (id: string) => void;
    disabled?: boolean;
    droppableId: string;
    activeDragType: LocationType | 'Region' | null;
}

const LocationColumn: React.FC<LocationColumnProps> = ({ title, Icon, items, selectedId, onSelect, onAdd, onEdit, onDelete, disabled = false, droppableId, activeDragType }) => {
    const { setNodeRef, isOver } = useDroppable({ id: droppableId });

    const isValidDropTarget = (
        (activeDragType === 'Country' && droppableId === 'countries-droppable') ||
        (activeDragType === 'State' && droppableId === 'states-droppable' && !disabled) ||
        (activeDragType === 'District' && droppableId === 'districts-droppable' && !disabled)
    );

    return (
        <div ref={setNodeRef} className={`bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col h-[70vh] transition-colors ${isValidDropTarget && isOver ? 'bg-green-100' : ''}`}>
            <div className="p-4 border-b flex justify-between items-center">
                <div className="flex items-center">
                    <Icon className="h-5 w-5 mr-2 text-cyan-700" />
                    <h3 className="font-semibold text-cyan-800">{title}</h3>
                </div>
                <button onClick={onAdd} disabled={disabled} className="p-1 rounded-full text-cyan-600 hover:bg-cyan-100 disabled:opacity-50 disabled:cursor-not-allowed">
                    <PlusCircle size={20} />
                </button>
            </div>
            <div className="flex-grow overflow-y-auto thin-scrollbar">
                {items.length === 0 ? (
                    <p className="text-center text-gray-400 p-6">No {title.toLowerCase()} found.</p>
                ) : (
                    items.map(item => (
                        <div
                            key={item.id}
                            onClick={() => onSelect(item.id)}
                            className={`group w-full text-left p-3 flex justify-between items-center text-sm cursor-pointer ${selectedId === item.id ? 'bg-cyan-100 text-cyan-800 font-semibold' : 'hover:bg-gray-50'}`}
                        >
                            <span>{item.name}</span>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                                <button onClick={(e) => { e.stopPropagation(); onEdit(item); }} className="p-1 text-gray-500 hover:text-blue-600"><Edit size={14} /></button>
                                <button onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} className="p-1 text-gray-500 hover:text-red-600"><Trash2 size={14} /></button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};


// --- MAIN TAB COMPONENT ---
const LocationTab: React.FC<LocationTabProps> = ({ locationData, setLocationData }) => {
    const { assigned: locations, unassigned } = locationData;
    const [unassignedExpanded, setUnassignedExpanded] = useState(new Set(['reg-emea', 'reg-apac']));
    const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null);
    const [selectedStateId, setSelectedStateId] = useState<string | null>(null);
    const [activeDragItem, setActiveDragItem] = useState<{item: {id: string, name: string}, type: LocationType | 'Region'} | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContext, setModalContext] = useState<ModalContext | null>(null);
    const [itemName, setItemName] = useState('');
    
    const [isCreateUnassignedModalOpen, setCreateUnassignedModalOpen] = useState(false);
    const [newUnassignedLocation, setNewUnassignedLocation] = useState({ country: '', state: '', district: ''});


    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const selectedCountry = useMemo(() => locations.find(c => c.id === selectedCountryId), [locations, selectedCountryId]);
    const selectedState = useMemo(() => selectedCountry?.states.find(s => s.id === selectedStateId), [selectedCountry, selectedStateId]);

    const handleSelectCountry = (id: string) => {
        setSelectedCountryId(id);
        setSelectedStateId(null);
    };

    const handleOpenModal = (context: ModalContext) => {
        setModalContext(context);
        setItemName(context.item?.name || '');
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setModalContext(null);
        setItemName('');
    };

    const removeUnassignedRecursive = (nodes: UnassignedLocationNode[], id: string): [UnassignedLocationNode[], UnassignedLocationNode | null] => {
        let removedItem: UnassignedLocationNode | null = null;
        const newNodes = nodes.filter(node => {
            if (node.id === id) {
                removedItem = node;
                return false;
            }
            if (node.children) {
                const [newChildren, foundItem] = removeUnassignedRecursive(node.children, id);
                if (foundItem) {
                    removedItem = foundItem;
                    node.children = newChildren;
                }
            }
            return true;
        });
        return [newNodes, removedItem];
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { type, item } = event.active.data.current as { type: LocationType | 'Region', item: {id: string, name: string} };
        setActiveDragItem({ type, item });
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveDragItem(null);
        const { active, over } = event;
        if (!over || !active.data.current) return;

        const { type: activeType, item: activeItem } = active.data.current;
        const overId = over.id as string;
        
        const [newUnassigned, removedItem] = removeUnassignedRecursive(unassigned, activeItem.id);
        if (!removedItem) return;

        let dropSuccessful = false;
        let newLocations = [...locations];
        
        if (overId === 'countries-droppable' && activeType === 'Country') {
            newLocations = [...locations, { id: removedItem.id, name: removedItem.name, states: removedItem.children?.map(s => ({id: s.id, name: s.name, districts: s.children || []})) || [] }];
            dropSuccessful = true;
        } else if (overId === 'states-droppable' && activeType === 'State' && selectedCountryId) {
            newLocations = locations.map(c => c.id === selectedCountryId ? {...c, states: [...c.states, {id: removedItem.id, name: removedItem.name, districts: removedItem.children || []}]} : c);
            dropSuccessful = true;
        } else if (overId === 'districts-droppable' && activeType === 'District' && selectedStateId) {
            newLocations = locations.map(c => ({...c, states: c.states.map(s => s.id === selectedStateId ? {...s, districts: [...s.districts, {id: removedItem.id, name: removedItem.name}]} : s)}));
            dropSuccessful = true;
        }

        if (dropSuccessful) {
            setLocationData({ assigned: newLocations, unassigned: newUnassigned });
        }
    };
    
    const handleCreateUnassigned = () => {
        const { country, state, district } = newUnassignedLocation;
        if (!country.trim()) {
            alert("Country name is required.");
            return;
        }
    
        const newUnassigned = JSON.parse(JSON.stringify(unassigned));
        let regionNode = newUnassigned.find((n: UnassignedLocationNode) => n.id === 'reg-new');
        if (!regionNode) {
            regionNode = { id: 'reg-new', name: 'Newly Created', type: 'Region', children: [] };
            newUnassigned.push(regionNode);
        }

        let countryNode = regionNode.children.find((c: UnassignedLocationNode) => c.name.toLowerCase() === country.trim().toLowerCase());
        if (!countryNode) {
            countryNode = { id: `un-country-${Date.now()}`, name: country.trim(), type: 'Country', children: [] };
            regionNode.children.push(countryNode);
        }

        if (state.trim()) {
            let stateNode = countryNode.children.find((s: UnassignedLocationNode) => s.name.toLowerCase() === state.trim().toLowerCase());
            if (!stateNode) {
                stateNode = { id: `un-state-${Date.now()}`, name: state.trim(), type: 'State', children: [] };
                countryNode.children.push(stateNode);
            }

            if (district.trim()) {
                const districtExists = stateNode.children.some((d: UnassignedLocationNode) => d.name.toLowerCase() === district.trim().toLowerCase());
                if (!districtExists) {
                    const districtNode = { id: `un-dist-${Date.now()}`, name: district.trim(), type: 'District' };
                    stateNode.children.push(districtNode);
                }
            }
        }
        
        setLocationData({ ...locationData, unassigned: newUnassigned });
        setNewUnassignedLocation({ country: '', state: '', district: '' });
        setCreateUnassignedModalOpen(false);
    };

    const handleSave = () => {
        if (!itemName.trim() || !modalContext) return;
        const { mode, type, parentId, item } = modalContext;
        
        let newLocations = [...locations];

        if (mode === 'create') {
            const newItem = { id: `item-${Date.now()}`, name: itemName.trim() };
            if (type === 'Country') {
                newLocations = [...locations, { ...newItem, states: [] }];
            } else if (type === 'State' && parentId) {
                newLocations = locations.map(c => c.id === parentId ? { ...c, states: [...c.states, { ...newItem, districts: [] }] } : c);
            } else if (type === 'District' && parentId) {
                newLocations = locations.map(c => ({...c, states: c.states.map(s => s.id === parentId ? { ...s, districts: [...s.districts, newItem] } : s)}));
            }
        } else if (mode === 'edit' && item) {
             const editedLocations = JSON.parse(JSON.stringify(locations));
             if(type === 'Country'){
                 const country = editedLocations.find((c: Country) => c.id === item.id);
                 if (country) country.name = itemName.trim();
             } else if (type === 'State') {
                 for(const country of editedLocations) {
                     const state = country.states.find((s: State) => s.id === item.id);
                     if (state) { state.name = itemName.trim(); break; }
                 }
             } else if (type === 'District') {
                  for(const country of editedLocations) {
                     for (const state of country.states) {
                         const district = state.districts.find((d: District) => d.id === item.id);
                         if (district) { district.name = itemName.trim(); break; }
                     }
                 }
             }
             newLocations = editedLocations;
        }
        setLocationData({ ...locationData, assigned: newLocations });
        handleCloseModal();
    };

    const handleDelete = (type: LocationType, id: string) => {
        if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;

        let newLocations = [...locations];
        if (type === 'Country') {
            newLocations = locations.filter(c => c.id !== id);
            if(selectedCountryId === id) { setSelectedCountryId(null); setSelectedStateId(null); }
        } else if (type === 'State') {
            newLocations = locations.map(c => ({ ...c, states: c.states.filter(s => s.id !== id) }));
             if(selectedStateId === id) { setSelectedStateId(null); }
        } else if (type === 'District') {
            newLocations = locations.map(c => ({...c, states: c.states.map(s => ({ ...s, districts: s.districts.filter(d => d.id !== id) }))}));
        }
        setLocationData({ ...locationData, assigned: newLocations });
    };

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col h-[70vh]">
                    <div className="p-4 border-b flex justify-between items-center">
                        <div className="flex items-center">
                            <Map className="h-5 w-5 mr-2 text-cyan-700" />
                            <h3 className="font-semibold text-cyan-800">Unassigned Locations</h3>
                        </div>
                        <button onClick={() => setCreateUnassignedModalOpen(true)} className="flex items-center gap-1 text-sm text-cyan-600 hover:text-cyan-800 font-medium p-1">
                             <PlusCircle size={16}/> Create
                        </button>
                    </div>
                    <div className="flex-grow overflow-y-auto thin-scrollbar p-2">
                        {unassigned.map(node => (
                             <UnassignedNodeComponent key={node.id} node={node} expandedNodes={unassignedExpanded} onToggleExpand={(id) => setUnassignedExpanded(prev => {
                                const next = new Set(prev);
                                if (next.has(id)) next.delete(id); else next.add(id);
                                return next;
                            })} />
                        ))}
                    </div>
                </div>
                <LocationColumn
                    title="Countries" Icon={Globe} items={locations} selectedId={selectedCountryId}
                    onSelect={handleSelectCountry} onAdd={() => handleOpenModal({ mode: 'create', type: 'Country' })}
                    onEdit={(item) => handleOpenModal({mode: 'edit', type: 'Country', item})}
                    onDelete={(id) => handleDelete('Country', id)} droppableId="countries-droppable" activeDragType={activeDragItem?.type || null}
                />
                 <LocationColumn
                    title="States" Icon={Landmark} items={selectedCountry?.states || []} selectedId={selectedStateId}
                    onSelect={setSelectedStateId} onAdd={() => handleOpenModal({ mode: 'create', type: 'State', parentId: selectedCountryId! })}
                    onEdit={(item) => handleOpenModal({mode: 'edit', type: 'State', item})}
                    onDelete={(id) => handleDelete('State', id)} disabled={!selectedCountryId} droppableId="states-droppable" activeDragType={activeDragItem?.type || null}
                />
                 <LocationColumn
                    title="Districts" Icon={Home} items={selectedState?.districts || []} selectedId={null}
                    onSelect={() => {}} onAdd={() => handleOpenModal({ mode: 'create', type: 'District', parentId: selectedStateId! })}
                    onEdit={(item) => handleOpenModal({mode: 'edit', type: 'District', item})}
                    onDelete={(id) => handleDelete('District', id)} disabled={!selectedStateId} droppableId="districts-droppable" activeDragType={activeDragItem?.type || null}
                />
            </div>
            <DragOverlay>
                {activeDragItem && activeDragItem.type !== 'Region' ? (
                     <div className="px-3 py-1.5 bg-gray-200 text-gray-800 rounded-md text-sm font-medium shadow-lg">
                        {activeDragItem.item.name}
                    </div>
                ): null}
            </DragOverlay>
             <Modal 
                isOpen={isModalOpen} 
                onClose={handleCloseModal} 
                title={`${modalContext?.mode === 'edit' ? 'Edit' : 'Create'} ${modalContext?.type}`}
             >
                <div className="space-y-4">
                    <label htmlFor="locationName" className="block text-sm font-medium text-gray-700">{modalContext?.type} Name</label>
                    <input 
                        type="text" id="locationName" value={itemName} onChange={(e) => setItemName(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    />
                    <div className="flex justify-end gap-2 pt-2">
                        <button onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
                            Cancel
                        </button>
                        <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-cyan-700 border border-transparent rounded-md shadow-sm hover:bg-cyan-800">
                            Save
                        </button>
                    </div>
                </div>
            </Modal>
             <Modal 
                isOpen={isCreateUnassignedModalOpen} 
                onClose={() => setCreateUnassignedModalOpen(false)} 
                title="Create Unassigned Location"
             >
                <div className="space-y-4">
                    <div>
                        <label htmlFor="countryName" className="block text-sm font-medium text-gray-700">Country Name (Required)</label>
                        <input type="text" id="countryName" value={newUnassignedLocation.country} onChange={(e) => setNewUnassignedLocation(p => ({...p, country: e.target.value}))}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm" />
                    </div>
                     <div>
                        <label htmlFor="stateName" className="block text-sm font-medium text-gray-700">State Name (Optional)</label>
                        <input type="text" id="stateName" value={newUnassignedLocation.state} onChange={(e) => setNewUnassignedLocation(p => ({...p, state: e.target.value}))}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm" />
                    </div>
                     <div>
                        <label htmlFor="districtName" className="block text-sm font-medium text-gray-700">District Name (Optional)</label>
                        <input type="text" id="districtName" value={newUnassignedLocation.district} onChange={(e) => setNewUnassignedLocation(p => ({...p, district: e.target.value}))}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm" />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button onClick={() => setCreateUnassignedModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
                            Cancel
                        </button>
                        <button onClick={handleCreateUnassigned} className="px-4 py-2 text-sm font-medium text-white bg-cyan-700 border border-transparent rounded-md shadow-sm hover:bg-cyan-800">
                            Create
                        </button>
                    </div>
                </div>
            </Modal>
    </DndContext>
    );
};

export default LocationTab;
