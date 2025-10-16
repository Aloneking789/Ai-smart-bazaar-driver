export const BASE_URL = 'https://zeptogkp.vercel.app/api/v1';

export interface ApiError {
  message: string;
  status?: number;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  if (token) {
    headers['Authorization'] = token;
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw {
        message: data.message || 'Something went wrong',
        status: response.status,
      } as ApiError;
    }

    return data;
  } catch (error) {
    if ((error as ApiError).message) {
      throw error;
    }
    throw {
      message: 'Network error. Please check your connection.',
      status: 0,
    } as ApiError;
  }
}

export interface SignupRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  address: string;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
}

export interface OrderResponse {
  success: boolean;
  orders: {
    id: string;
    status: string;
    deliveryStatus: string;
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
  }[];
}

export const authApi = {
  signup: (data: SignupRequest) =>
    apiRequest<AuthResponse>('/delivery/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: LoginRequest) =>
    apiRequest<AuthResponse>('/delivery/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const ordersApi = {
  getOrders: (token: string) =>
    apiRequest<OrderResponse>('/delivery/me/orders', {}, token),

  acceptOrder: (orderId: string, token: string) =>
    apiRequest(`/delivery/me/orders/${orderId}/accept`, {
      method: 'PATCH',
    }, token),

  pickupOrder: (orderId: string, token: string) =>
    apiRequest(`/delivery/me/orders/${orderId}/picked-up`, {
      method: 'PATCH',
    }, token),

  deliverOrder: (orderId: string, token: string) =>
    apiRequest(`/delivery/me/orders/${orderId}/delivered`, {
      method: 'PATCH',
    }, token),

  rejectOrder: (orderId: string, token: string) =>
    apiRequest(`/delivery/me/orders/${orderId}/reject`, {
      method: 'PATCH',
    }, token),
};
