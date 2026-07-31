export type DemoAccount = {
  id: string;
  label: string;
  email: string;
  password: string;
  note: string;
};

/**
 * Login demo strip order (base → ops → buyers):
 * 1 Super admin · 2 Admin · 3 Wholesaler · 4 Distributor · 5 Sales · 6 Logistics · 7 Retail
 */
export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: "super",
    label: "1 · Super admin",
    email: "super@umaxes.com",
    password: "Super1234!",
    note: "Devs · full access",
  },
  {
    id: "admin",
    label: "2 · Admin",
    email: "admin@umaxes.com",
    password: "Admin1234!",
    note: "Ops · no staff mgmt",
  },
  {
    id: "wholesaler",
    label: "3 · Wholesaler",
    email: "wholesale@demo.umaxes.com",
    password: "Demo1234!",
    note: "Buyer portal",
  },
  {
    id: "distributor",
    label: "4 · Distributor",
    email: "distro@demo.umaxes.com",
    password: "Demo1234!",
    note: "Buyer portal",
  },
  {
    id: "sales",
    label: "5 · Sales",
    email: "sales@umaxes.com",
    password: "Staff1234!",
    note: "Confirm & assist",
  },
  {
    id: "logistics",
    label: "6 · Logistics",
    email: "logistics@umaxes.com",
    password: "Staff1234!",
    note: "Shipments",
  },
  {
    id: "retail",
    label: "7 · Retail",
    email: "retail@demo.umaxes.com",
    password: "Demo1234!",
    note: "Shop buyer",
  },
];
