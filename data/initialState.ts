import { StructureItem } from '../types';
import { AppState } from '../hooks/useHistoryState';

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

export const getInitialState = (): AppState => ({
    structure: getInitialStructure(),
    availableJobs: getInitialAvailableJobs(),
    isDirty: false,
});
