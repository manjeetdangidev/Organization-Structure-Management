import { StructureItem } from '../types';
import { arrayMove } from '@dnd-kit/sortable';

export const findItemRecursive = (items: StructureItem[], itemId: string): StructureItem | null => {
    for(const item of items) {
        if(item.id === itemId) return item;
        if(item.children) {
            const found = findItemRecursive(item.children, itemId);
            if (found) return found;
        }
    }
    return null;
}

export const removeItemRecursive = (items: StructureItem[], itemId: string): [StructureItem[], StructureItem | null] => {
    let removedItem: StructureItem | null = null;

    const newItems = items.reduce((acc: StructureItem[], item) => {
        if (item.id === itemId) {
            removedItem = item;
            return acc; // Don't include this item in the new array
        }
        
        if (item.children) {
            const [newChildren, foundItem] = removeItemRecursive(item.children, itemId);
            // If an item was found and removed in a child, update the parent's children
            if (foundItem) {
                removedItem = foundItem;
                acc.push({ ...item, children: newChildren });
            } else {
                // No change in children, add the item as is
                acc.push(item);
            }
        } else {
            // Not the item to remove and no children, so just add it
            acc.push(item);
        }
        
        return acc;
    }, []);

    // If the item was found at the top level, newItems will be the filtered list.
    // If it was found in a descendant, newItems will contain the updated parent hierarchy.
    return [newItems, removedItem];
};


export const insertItemRecursive = (nodes: StructureItem[], overId: string, itemToInsert: StructureItem): [StructureItem[], boolean] => {
    let inserted = false;

    const recurse = (currentNodes: StructureItem[]): StructureItem[] => {
        // Check if dropping directly onto a container (Division or Department)
        for (let i = 0; i < currentNodes.length; i++) {
            const overItem = currentNodes[i];
            if (overItem.id === overId) {
                if (overItem.type !== 'Job') { // Is a container, drop inside at top
                    if ( (itemToInsert.type === 'Job' && overItem.type === 'Department') || 
                         (itemToInsert.type === 'Department' && overItem.type === 'Division')
                       ) {
                        const newChildren = [itemToInsert, ...(overItem.children || [])];
                        inserted = true;
                        return [
                            ...currentNodes.slice(0, i),
                            { ...overItem, children: newChildren },
                            ...currentNodes.slice(i + 1)
                        ];
                    }
                } else { // Is a job, drop before as sibling
                    if(itemToInsert.type === overItem.type) {
                         const newNodes = [...currentNodes];
                         newNodes.splice(i, 0, itemToInsert);
                         inserted = true;
                         return newNodes;
                    }
                }
            }
        }
        
        // If not found as sibling or direct drop, recurse into children
        return currentNodes.map(node => {
            if (inserted) return node;
            if (node.children) {
                const newChildren = recurse(node.children);
                if (inserted) {
                    return { ...node, children: newChildren };
                }
            }
            return node;
        });
    };

    const newNodes = recurse(nodes);
    return [newNodes, inserted];
}

export const moveItemsRecursive = (items: StructureItem[], itemIds: string[], direction: 'up' | 'down'): StructureItem[] => {
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

export const modifySiblingOrderRecursive = (
    items: StructureItem[], 
    itemId: string, 
    targetPosition: string, 
    mode: 'move' | 'swap'
): [StructureItem[], boolean] => {
    
    const currentIndex = items.findIndex(item => item.id === itemId);
    
    if (currentIndex !== -1) {
        // Target index is calculated based on the last part of the position string, e.g., "1.2.3" -> index 2.
        const targetIndex = parseInt(targetPosition.split('.').pop() || '1', 10) - 1;
        
        if (targetIndex >= 0 && targetIndex < items.length && targetIndex !== currentIndex) {
            if (mode === 'move') {
                return [arrayMove(items, currentIndex, targetIndex), true];
            } else { // swap
                const newItems = [...items];
                // ES6 destructuring assignment for swap
                [newItems[currentIndex], newItems[targetIndex]] = [newItems[targetIndex], newItems[currentIndex]];
                return [newItems, true];
            }
        }
        return [items, false];
    }

    // Recurse into children, returning a new array of items if a child was modified.
    let modified = false;
    const newItems = items.map(item => {
        if (modified) return item; // Optimization: if we already found and modified, just return remaining items.

        if (item.children) {
            const [newChildren, wasModified] = modifySiblingOrderRecursive(item.children, itemId, targetPosition, mode);
            if (wasModified) {
                modified = true;
                return { ...item, children: newChildren };
            }
        }
        return item;
    });

    return [newItems, modified];
};