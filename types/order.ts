export type OrderStatus = 'ASSIGNED' | 'ACCEPTED' | 'PICKED_UP' | 'DELIVERED' | 'REJECTED';

export interface Order {
  id: string;
  status: string;
  deliveryStatus: OrderStatus;
  totalPrice: string;
  createdAt: string;
  shopkeeper: {
    shopname: string;
  };
  deliveryAddress: {
    city: string;
    state: string;
    pincode: string;
    flatnumber: number;
  };
}

export interface OrdersResponse {
  success: boolean;
  orders: Order[];
}

export interface OrderActionResponse {
  success: boolean;
  message?: string;
  order?: Order;
}
