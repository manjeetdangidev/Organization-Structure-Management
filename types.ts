export type ItemType = 'Division' | 'Department' | 'Job';

export interface StructureItem {
  id: string;
  name: string;
  type: ItemType;
  children?: StructureItem[];
}

// --- Reporting Tab Types ---
export interface ReportItem {
  id: string;
  name: string;
}

export type NodeType = 'Company' | 'BusinessUnit' | 'Team';

export interface ReportingNode {
  id: string;
  name: string;
  type: NodeType;
  children: ReportingNode[];
  assignedEmployees: ReportItem[];
}

export interface ReportingDataType {
  unassigned: {
    businessUnits: ReportItem[];
    teams: ReportItem[];
    employees: ReportItem[];
  };
  structure: ReportingNode[];
}

// --- Location Tab Types ---
export interface District { id: string; name: string; }
export interface State { id: string; name: string; districts: District[]; }
export interface Country { id: string; name: string; states: State[]; }
export type LocationData = Country[];

export type LocationType = 'Country' | 'State' | 'District';

export interface UnassignedLocationNode {
    id: string;
    name: string;
    type: LocationType | 'Region';
    children?: UnassignedLocationNode[];
}

export interface LocationDataType {
    assigned: LocationData;
    unassigned: UnassignedLocationNode[];
}
