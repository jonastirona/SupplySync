export interface Product {
  id?: number;
  name: string;
  description: string;
  price: number;
  quantity: number;
  lowStockThreshold: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductResponse {
  products: Product[];
  totalCount: number;
}

export interface ProductCreateRequest {
  name: string;
  description: string;
  price: number;
  quantity: number;
  lowStockThreshold: number;
}

export interface ProductUpdateRequest {
  id: number;
  name?: string;
  description?: string;
  price?: number;
  quantity?: number;
  lowStockThreshold?: number;
} 