import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

export type LayerJob = { id: number; name: string };
export type LayerDept = { id: number; name: string; jobs: LayerJob[] };
export type LayerDivision = { id: number; name: string; departments: LayerDept[] };

interface AddLayerFormProps {
    onSave: (data: LayerDivision[]) => void;
    onClose: () => void;
}

const AddLayerForm: React.FC<AddLayerFormProps> = ({ onSave, onClose }) => {
    const [divisions, setDivisions] = useState<LayerDivision[]>([
        { id: Date.now(), name: '', departments: [{ id: Date.now() + 1, name: '', jobs: [{ id: Date.now() + 2, name: '' }] }] }
    ]);

    const handleUpdateDivisionName = (divId: number, name: string) => {
        setDivisions(prev => prev.map(div => div.id === divId ? { ...div, name } : div));
    };
    
    const handleAddDivision = () => {
        const newId = Date.now();
        setDivisions(prev => [...prev, { id: newId, name: '', departments: [{ id: newId + 1, name: '', jobs: [{ id: newId + 2, name: '' }] }] }]);
    };

    const handleRemoveDivision = (divId: number) => {
        setDivisions(prev => prev.filter(div => div.id !== divId));
    };

    const handleUpdateDeptName = (divId: number, deptId: number, name: string) => {
        setDivisions(prev => prev.map(div =>
            div.id === divId
                ? { ...div, departments: div.departments.map(dept => dept.id === deptId ? { ...dept, name } : dept) }
                : div
        ));
    };

    const handleAddDepartment = (divId: number) => {
        setDivisions(prev => prev.map(div =>
            div.id === divId
                ? { ...div, departments: [...div.departments, { id: Date.now(), name: '', jobs: [{ id: Date.now() + 1, name: '' }] }] }
                : div
        ));
    };

    const handleRemoveDepartment = (divId: number, deptId: number) => {
        setDivisions(prev => prev.map(div =>
            div.id === divId
                ? { ...div, departments: div.departments.filter(dept => dept.id !== deptId) }
                : div
        ));
    };

    const handleUpdateJobName = (divId: number, deptId: number, jobId: number, name: string) => {
        setDivisions(prev => prev.map(div =>
            div.id === divId
                ? { ...div, departments: div.departments.map(dept =>
                    dept.id === deptId
                        ? { ...dept, jobs: dept.jobs.map(job => job.id === jobId ? { ...job, name } : job) }
                        : dept
                )}
                : div
        ));
    };

    const handleAddJob = (divId: number, deptId: number) => {
        setDivisions(prev => prev.map(div =>
            div.id === divId
                ? { ...div, departments: div.departments.map(dept =>
                    dept.id === deptId
                        ? { ...dept, jobs: [...dept.jobs, { id: Date.now(), name: '' }] }
                        : dept
                )}
                : div
        ));
    };

    const handleRemoveJob = (divId: number, deptId: number, jobId: number) => {
        setDivisions(prev => prev.map(div =>
            div.id === divId
                ? { ...div, departments: div.departments.map(dept =>
                    dept.id === deptId
                        ? { ...dept, jobs: dept.jobs.filter(job => job.id !== jobId) }
                        : dept
                )}
                : div
        ));
    };

    const handleSaveClick = () => {
        onSave(divisions);
    };

    const inputClass = "w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500";
    const buttonClass = "flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-cyan-700 bg-cyan-50 border border-cyan-200 rounded-md hover:bg-cyan-100";
    const removeButtonClass = "p-1.5 text-red-500 rounded-md hover:bg-red-100";
    
    return (
        <div className="space-y-4">
            <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-3 -mr-1 thin-scrollbar">
                {divisions.map((div, divIndex) => (
                    <div key={div.id} className="p-3 bg-gray-100 rounded-lg border border-gray-300">
                         <div className="flex items-center gap-2 mb-3">
                            <input
                                type="text"
                                value={div.name}
                                onChange={e => handleUpdateDivisionName(div.id, e.target.value)}
                                placeholder={`Division Name ${divIndex + 1}`}
                                className={`${inputClass} bg-white font-semibold`}
                            />
                            {divisions.length > 1 && (
                                <button onClick={() => handleRemoveDivision(div.id)} className={removeButtonClass} title="Remove Division">
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>

                        <div className="pl-4 space-y-3">
                            {div.departments.map((dept, deptIndex) => (
                                <div key={dept.id} className="p-3 bg-gray-50 rounded-lg border">
                                    <div className="flex items-center gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={dept.name}
                                            onChange={e => handleUpdateDeptName(div.id, dept.id, e.target.value)}
                                            placeholder={`Department Name ${deptIndex + 1}`}
                                            className={`${inputClass} bg-white`}
                                        />
                                        {div.departments.length > 1 && (
                                            <button onClick={() => handleRemoveDepartment(div.id, dept.id)} className={removeButtonClass} title="Remove Department">
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                    <div className="pl-4 space-y-2">
                                        {dept.jobs.map((job, jobIndex) => (
                                            <div key={job.id} className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={job.name}
                                                    onChange={e => handleUpdateJobName(div.id, dept.id, job.id, e.target.value)}
                                                    placeholder={`Job Name ${jobIndex + 1}`}
                                                    className={`${inputClass} bg-white`}
                                                />
                                                {dept.jobs.length > 1 && (
                                                    <button onClick={() => handleRemoveJob(div.id, dept.id, job.id)} className={removeButtonClass} title="Remove Job">
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button onClick={() => handleAddJob(div.id, dept.id)} className={buttonClass}>
                                            <Plus size={14} /> Add Job
                                        </button>
                                    </div>
                                </div>
                            ))}
                             <button onClick={() => handleAddDepartment(div.id)} className={buttonClass}>
                                <Plus size={14} /> Add Department
                            </button>
                        </div>
                    </div>
                ))}

                 <button onClick={handleAddDivision} className={`${buttonClass} mt-3`}>
                    <Plus size={14} /> Add Another Division
                </button>
            </div>


            <div className="flex justify-end gap-2 pt-4 border-t">
                <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
                    Cancel
                </button>
                <button onClick={handleSaveClick} className="px-4 py-2 text-sm font-medium text-white bg-cyan-700 border border-transparent rounded-md shadow-sm hover:bg-cyan-800">
                    Save Layer(s)
                </button>
            </div>
        </div>
    );
};

export default AddLayerForm;