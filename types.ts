export type ItemType = 'Division' | 'Department' | 'Job';

export interface StructureItem {
  id: string;
  name: string;
  type: ItemType;
  children?: StructureItem[];
}

export interface SavedTemplate {
  name: string;
  structure: StructureItem[];
  availableJobs: StructureItem[];
  createdAt: string;
}

// --- Fix: Add missing type definitions for ReportingTab ---
export interface ReportItem {
  id: string;
  name: string;
}

export interface ReportingNode {
  id: string;
  name: string;
  type: 'Company' | 'BusinessUnit' | 'Team';
  assignedEmployees: ReportItem[];
  children: ReportingNode[];
}

export interface ReportingDataType {
  unassigned: {
    businessUnits: ReportItem[];
    teams: ReportItem[];
    employees: ReportItem[];
  };
  structure: ReportingNode[];
}

// --- Fix: Add missing type definitions for LocationTab ---
export interface District {
  id: string;
  name: string;
}

export interface State {
  id: string;
  name: string;
  districts: District[];
}

export interface Country {
  id: string;
  name: string;
  states: State[];
}

export type LocationData = Country[];

export type LocationType = 'Country' | 'State' | 'District';

export interface UnassignedLocationNode {
  id: string;
  name: string;
  type: 'Region' | LocationType;
  children?: UnassignedLocationNode[];
}

export interface LocationDataType {
  assigned: LocationData;
  unassigned: UnassignedLocationNode[];
}
