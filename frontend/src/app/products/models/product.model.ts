export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  reorderThreshold: number;
  category: string;
  sku: string;
  supplierId: string;
  warehouses: WarehouseInventory[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WarehouseInventory {
  warehouseId: string;
  quantity: number;
  reorderThreshold: number;
} 