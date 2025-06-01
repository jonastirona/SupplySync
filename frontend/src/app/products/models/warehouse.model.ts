export interface Warehouse {
  id: string;
  name: string;
  locationCode: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  capacity: number;
  currentUtilization: number;
  createdAt: string;
} 