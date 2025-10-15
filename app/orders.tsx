import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, MapPin, DollarSign, CheckCircle, XCircle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { ordersApi } from '@/utils/api';

import colors from '@/constants/colors';

type TabType = 'all' | 'accepted' | 'started' | 'completed';

export default function OrdersScreen() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['orders', token],
    queryFn: async () => {
      if (!token) throw new Error('No token');
      return await ordersApi.getOrders(token);
    },
    enabled: !!token,
  });

  const orderActionMutation = useMutation({
    mutationFn: async ({ orderId, action }: { orderId: string; action: string }) => {
      if (!token) throw new Error('No token');
      
      switch (action) {
        case 'accept':
          return await ordersApi.acceptOrder(orderId, token);
        case 'picked-up':
          return await ordersApi.pickupOrder(orderId, token);
        case 'delivered':
          return await ordersApi.deliverOrder(orderId, token);
        case 'reject':
          return await ordersApi.rejectOrder(orderId, token);
        default:
          throw new Error('Invalid action');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: unknown) => {
      const err = error as { message: string };
      Alert.alert('Error', err.message || 'Action failed');
    },
  });

  const orders = data?.orders || [];

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'all') return true;
    if (activeTab === 'accepted') return order.deliveryStatus === 'ACCEPTED';
    if (activeTab === 'started') return order.deliveryStatus === 'PICKED_UP';
    if (activeTab === 'completed') return order.deliveryStatus === 'DELIVERED';
    return true;
  });

  const handleAction = (orderId: string, action: string) => {
    orderActionMutation.mutate({ orderId, action });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ASSIGNED':
        return colors.status.info;
      case 'ACCEPTED':
        return colors.status.warning;
      case 'PICKED_UP':
        return colors.primary.purple;
      case 'DELIVERED':
        return colors.status.success;
      case 'REJECTED':
        return colors.status.error;
      default:
        return colors.text.secondary;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'My Orders',
          headerStyle: { backgroundColor: colors.primary.purple },
          headerTintColor: colors.neutral.white,
          headerTitleStyle: { fontWeight: '600' as const },
        }}
      />
      <View style={styles.container}>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'all' && styles.tabActive]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'accepted' && styles.tabActive]}
            onPress={() => setActiveTab('accepted')}
          >
            <Text style={[styles.tabText, activeTab === 'accepted' && styles.tabTextActive]}>
              Accepted
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'started' && styles.tabActive]}
            onPress={() => setActiveTab('started')}
          >
            <Text style={[styles.tabText, activeTab === 'started' && styles.tabTextActive]}>
              Started
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'completed' && styles.tabActive]}
            onPress={() => setActiveTab('completed')}
          >
            <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>
              Completed
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary.purple} />
              <Text style={styles.loadingText}>Loading orders...</Text>
            </View>
          ) : filteredOrders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Package size={64} color={colors.text.tertiary} />
              <Text style={styles.emptyText}>No orders found</Text>
            </View>
          ) : (
            filteredOrders.map(order => (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View style={styles.orderShop}>
                    <Package size={20} color={colors.primary.purple} />
                    <Text style={styles.shopName}>{order.shopkeeper.shopname}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.deliveryStatus) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(order.deliveryStatus) }]}>
                      {order.deliveryStatus}
                    </Text>
                  </View>
                </View>

                <View style={styles.orderDetails}>
                  <View style={styles.detailRow}>
                    <MapPin size={16} color={colors.text.secondary} />
                    <Text style={styles.detailText}>
                      {order.deliveryAddress.flatnumber}, {order.deliveryAddress.city}, {order.deliveryAddress.state}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <DollarSign size={16} color={colors.text.secondary} />
                    <Text style={styles.detailText}>₹{order.totalPrice}</Text>
                  </View>
                  <Text style={styles.dateText}>{formatDate(order.createdAt)}</Text>
                </View>

                <View style={styles.orderActions}>
                  {order.deliveryStatus === 'ASSIGNED' && (
                    <>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.acceptButton]}
                        onPress={() => handleAction(order.id, 'accept')}
                        disabled={orderActionMutation.isPending}
                      >
                        <CheckCircle size={18} color={colors.neutral.white} />
                        <Text style={styles.actionButtonText}>Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={() => handleAction(order.id, 'reject')}
                        disabled={orderActionMutation.isPending}
                      >
                        <XCircle size={18} color={colors.neutral.white} />
                        <Text style={styles.actionButtonText}>Reject</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  {order.deliveryStatus === 'ACCEPTED' && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.pickedButton]}
                      onPress={() => handleAction(order.id, 'picked-up')}
                      disabled={orderActionMutation.isPending}
                    >
                      <Package size={18} color={colors.neutral.white} />
                      <Text style={styles.actionButtonText}>Picked Up</Text>
                    </TouchableOpacity>
                  )}
                  {order.deliveryStatus === 'PICKED_UP' && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deliveredButton]}
                      onPress={() => handleAction(order.id, 'delivered')}
                      disabled={orderActionMutation.isPending}
                    >
                      <CheckCircle size={18} color={colors.neutral.white} />
                      <Text style={styles.actionButtonText}>Mark as Delivered</Text>
                    </TouchableOpacity>
                  )}
                  {order.deliveryStatus === 'DELIVERED' && (
                    <View style={styles.completedBadge}>
                      <CheckCircle size={18} color={colors.status.success} />
                      <Text style={styles.completedText}>Completed</Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.neutral.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray200,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.primary.purple,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.text.secondary,
  },
  tabTextActive: {
    color: colors.neutral.white,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.text.secondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text.secondary,
  },
  orderCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderShop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text.primary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  orderDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: colors.text.secondary,
    flex: 1,
  },
  dateText: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: 4,
  },
  orderActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
  },
  acceptButton: {
    backgroundColor: colors.status.success,
  },
  rejectButton: {
    backgroundColor: colors.status.error,
  },
  pickedButton: {
    backgroundColor: colors.primary.purple,
  },
  deliveredButton: {
    backgroundColor: colors.status.success,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.neutral.white,
  },
  completedBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  completedText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.status.success,
  },
});
