import React, { useState, useMemo } from 'react';
import { ChevronRight, FileText } from 'lucide-react';

// Data structure
interface PayRuleDetail {
  id: string;
  name: string;
  description: string;
}

interface PayRuleCategory {
  id: string;
  name: string;
  rules: PayRuleDetail[];
}

// Seed data
const payRulesData: PayRuleCategory[] = [
  {
    id: 'cat-overtime',
    name: 'Overtime Rules',
    rules: [
      { id: 'rule-ot-ca', name: 'California Overtime', description: 'Includes daily overtime after 8 hours, double time after 12 hours, and rules for the 7th consecutive day of work.' },
      { id: 'rule-ot-flsa', name: 'Federal FLSA Overtime', description: 'Standard overtime calculation at 1.5x the regular rate for all hours worked over 40 in a workweek.' },
      { id: 'rule-ot-nv', name: 'Nevada Overtime', description: 'Daily overtime for employees earning less than 1.5x the minimum wage.' },
    ],
  },
  {
    id: 'cat-breaks',
    name: 'Meal & Break Policies',
    rules: [
      { id: 'rule-break-ca', name: 'California Meal Breaks', description: 'Requires a 30-minute unpaid meal break for shifts over 5 hours, with penalties for non-compliance.' },
      { id: 'rule-break-ny', name: 'New York Meal Breaks', description: 'Specifies break durations based on the time of day and length of the shift.' },
      { id: 'rule-break-paid', name: 'Paid 15-Minute Rest Break', description: 'A common policy providing two paid 15-minute breaks for a standard 8-hour shift.' },
    ],
  },
  {
    id: 'cat-shift',
    name: 'Shift Differentials',
    rules: [
      { id: 'rule-shift-night', name: 'Night Shift Premium', description: 'Adds a fixed amount or percentage to the base pay for hours worked during a specified night shift (e.g., 11 PM - 7 AM).' },
      { id: 'rule-shift-weekend', name: 'Weekend Differential', description: 'Provides premium pay for employees working on Saturdays and/or Sundays.' },
    ],
  },
  {
    id: 'cat-holiday',
    name: 'Holiday Pay',
    rules: [
      { id: 'rule-holiday-1.5x', name: 'Time and a Half on Holidays', description: 'Employees working on designated company holidays receive 1.5x their regular rate of pay.' },
      { id: 'rule-holiday-2x', name: 'Double Time on Holidays', description: 'A more generous holiday pay policy, providing 2x the regular rate for hours worked.' },
    ],
  },
];

// Reusable Column Component
const SelectionColumn = ({ title, items, selectedId, onSelect, children }: { title: string, items?: {id: string, name: string}[], selectedId: string | null, onSelect: (id: string) => void, children?: React.ReactNode }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col h-[70vh]">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-cyan-800">{title}</h3>
      </div>
      <div className="flex-grow overflow-y-auto thin-scrollbar">
        {items && items.map(item => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={`w-full text-left p-3 flex justify-between items-center text-sm ${selectedId === item.id ? 'bg-cyan-100 text-cyan-800 font-semibold' : 'hover:bg-gray-50'}`}
          >
            {item.name}
            <ChevronRight size={16} className={selectedId === item.id ? 'text-cyan-600' : 'text-gray-300'} />
          </button>
        ))}
        {children}
      </div>
    </div>
  );
};

// Main Component
const PayRulesTab: React.FC = () => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(payRulesData[0]?.id || null);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);

  const selectedCategory = useMemo(() => {
    return payRulesData.find(c => c.id === selectedCategoryId);
  }, [selectedCategoryId]);

  const selectedRule = useMemo(() => {
    return selectedCategory?.rules.find(r => r.id === selectedRuleId);
  }, [selectedRuleId, selectedCategory]);

  const handleSelectCategory = (id: string) => {
    setSelectedCategoryId(id);
    setSelectedRuleId(null); // Reset rule selection when category changes
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <SelectionColumn
        title="1. Select Category"
        items={payRulesData}
        selectedId={selectedCategoryId}
        onSelect={handleSelectCategory}
      />
      <SelectionColumn
        title="2. Select Rule"
        items={selectedCategory?.rules}
        selectedId={selectedRuleId}
        onSelect={setSelectedRuleId}
      >
        {!selectedCategory && (
          <div className="p-6 text-center text-gray-500">
            <p>Select a category to see available rules.</p>
          </div>
        )}
      </SelectionColumn>

      {/* Details Column */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col h-[70vh]">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-cyan-800">3. Rule Details</h3>
        </div>
        <div className="flex-grow overflow-y-auto thin-scrollbar p-6">
          {selectedRule ? (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-cyan-100 rounded-full">
                   <FileText size={20} className="text-cyan-700" />
                </div>
                <div>
                   <h4 className="font-bold text-lg text-gray-800">{selectedRule.name}</h4>
                   <p className="text-gray-600 mt-2">{selectedRule.description}</p>
                </div>
              </div>
              {/* Future configuration options can go here */}
            </div>
          ) : (
            <div className="text-center text-gray-500 pt-10">
              <p>Select a rule to see its details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PayRulesTab;