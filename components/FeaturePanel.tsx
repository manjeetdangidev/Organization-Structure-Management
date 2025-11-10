import React, { useState } from 'react';
import { Settings, X } from 'lucide-react';
import { Features } from '../App';

interface FeaturePanelProps {
  features: Features;
  onToggleFeature: (feature: keyof Features) => void;
}

const featureDescriptions: Record<keyof Features, string> = {
    inlineEditing: "Inline Text Editing",
    inlineMoveControls: "Inline Move Controls",
    dragAndDrop: "Drag & Drop",
    layerCounts: "Child Item Counts",
    headerCounts: "Overall Structure Counts",
    availableJobsPanel: "Available Jobs Panel",
    contextMenu: "Right-Click Context Menu",
    actionPanel: "Header Action Bar",
    manualOrdering: "Manual Ordering Inputs",
    childSorting: "Per-Item Child Sorting",
    globalSorting: "Global A-Z Sorting",
    templates: "Save/Load Templates",
    undoRedo: "Undo/Redo Buttons",
    addLayer: "Add Layer Functionality",
};


const FeaturePanel: React.FC<FeaturePanelProps> = ({ features, onToggleFeature }) => {
    const [isOpen, setIsOpen] = useState(false);

    const FeatureToggle: React.FC<{ featureKey: keyof Features }> = ({ featureKey }) => (
        <label className="flex items-center justify-between py-2 px-3 hover:bg-gray-100 rounded-md cursor-pointer">
            <span className="text-sm font-medium text-gray-700">{featureDescriptions[featureKey]}</span>
            <div className="relative inline-flex items-center cursor-pointer">
                <input
                    type="checkbox"
                    checked={features[featureKey]}
                    onChange={() => onToggleFeature(featureKey)}
                    className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-cyan-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
            </div>
        </label>
    );

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                title="Settings"
                className="p-2 border rounded-md bg-white shadow-sm hover:bg-gray-200"
                aria-label="Open settings panel"
            >
                <Settings size={16} />
            </button>
            <div
                className={`fixed top-0 right-0 h-full bg-black bg-opacity-50 z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100 w-full' : 'opacity-0 w-0 pointer-events-none'}`}
                onClick={() => setIsOpen(false)}
            >
                <div
                    onClick={(e) => e.stopPropagation()}
                    className={`absolute top-0 right-0 h-full bg-white shadow-2xl w-80 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
                >
                    <div className="flex justify-between items-center p-4 border-b">
                        <h2 className="text-lg font-semibold text-gray-800">Feature Flags</h2>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100"
                            aria-label="Close feature panel"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <div className="p-2 space-y-1">
                       {(Object.keys(features) as Array<keyof Features>).map(key => (
                           <FeatureToggle key={key} featureKey={key} />
                       ))}
                    </div>
                </div>
            </div>
        </>
    );
};

export default FeaturePanel;
