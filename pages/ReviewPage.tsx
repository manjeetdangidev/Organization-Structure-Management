import React, { useState } from 'react';
import { StructureItem } from '../types';
import { TreeItem } from '../components';
import { Eye, EyeOff } from 'lucide-react';
import { Features } from '../App';

interface ReviewPageProps {
  structure: StructureItem[];
  structureCounts: { divisions: number; departments: number; jobs: number; };
  onBack: () => void;
  onSubmit: () => void;
}

const ReadOnlyTree: React.FC<{ items: StructureItem[] }> = ({ items }) => {
    const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
        const ids = new Set<string>();
        const walk = (nodes: StructureItem[]) => {
            nodes.forEach(node => {
                if (node.children && node.children.length > 0) {
                    ids.add(node.id);
                    walk(node.children);
                }
            });
        };
        walk(items);
        return ids;
    });

    const handleToggleExpand = (id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const readOnlyFeatures: Features = {
        inlineEditing: false,
        inlineMoveControls: false,
        dragAndDrop: false,
        layerCounts: true,
        headerCounts: false,
        availableJobsPanel: false,
        contextMenu: false,
        actionPanel: false,
        manualOrdering: false,
        childSorting: false,
        globalSorting: false,
        templates: false,
        undoRedo: false,
        addLayer: false,
    };

    return (
        <div className="space-y-1 text-left mt-4 max-h-[60vh] overflow-auto thin-scrollbar border rounded-lg p-4 bg-gray-50">
            {items.map((item, index) => (
                <TreeItem
                    key={item.id}
                    item={item}
                    depth={0}
                    position={`${index + 1}`}
                    selectedItemIds={[]}
                    onSelect={() => {}}
                    editingItemId={null}
                    onStartEditing={() => {}}
                    onNameChange={() => {}}
                    isExpanded={expandedIds.has(item.id)}
                    expandedIds={expandedIds}
                    onToggleExpand={handleToggleExpand}
                    onContextMenu={(e) => e.preventDefault()}
                    onDeleteItem={() => {}}
                    features={readOnlyFeatures}
                    showManualOrder={false}
                    onSortChildren={() => {}}
                />
            ))}
        </div>
    );
};

const ReviewPage: React.FC<ReviewPageProps> = ({ structure, structureCounts, onBack, onSubmit }) => {
  const [isTreeVisible, setIsTreeVisible] = useState(false);

  return (
    <div className="p-8 bg-white rounded-lg shadow-md max-w-4xl mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Review & Save</h2>
        <p className="mt-2 text-gray-600">You are about to finalize the labor structure with the following composition.</p>
        
        <div className="mt-8 flex justify-center gap-8">
          <div className="p-6 bg-cyan-50 rounded-xl w-48">
            <p className="text-sm font-medium text-cyan-800">Divisions</p>
            <p className="mt-1 text-4xl font-bold text-cyan-700">{structureCounts.divisions}</p>
          </div>
          <div className="p-6 bg-cyan-50 rounded-xl w-48">
            <p className="text-sm font-medium text-cyan-800">Departments</p>
            <p className="mt-1 text-4xl font-bold text-cyan-700">{structureCounts.departments}</p>
          </div>
          <div className="p-6 bg-cyan-50 rounded-xl w-48">
            <p className="text-sm font-medium text-cyan-800">Job Roles</p>
            <p className="mt-1 text-4xl font-bold text-cyan-700">{structureCounts.jobs}</p>
          </div>
        </div>

        <div className="mt-8">
            <button 
              onClick={() => setIsTreeVisible(prev => !prev)} 
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
            >
              {isTreeVisible ? <EyeOff size={16} /> : <Eye size={16} />}
              {isTreeVisible ? 'Hide Structure Preview' : 'Show Structure Preview'}
            </button>
        </div>
      </div>
      
      {isTreeVisible && <ReadOnlyTree items={structure} />}

      <div className="mt-10 flex justify-center gap-4">
        <button onClick={onBack} className="px-6 py-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
          Back to Edit
        </button>
        <button onClick={onSubmit} className="px-6 py-3 text-base font-medium text-white bg-cyan-700 border border-transparent rounded-md shadow-sm hover:bg-cyan-800">
          Submit Structure
        </button>
      </div>
    </div>
  );
};

export default ReviewPage;