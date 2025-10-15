import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, TrendingUp, Calendar, Package } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { ordersApi } from '@/utils/api';
import colors from '@/constants/colors';

export default function EarningsScreen() {
  const { token } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['orders', token],
    queryFn: async () => {
      if (!token) throw new Error('No token');
      return await ordersApi.getOrders(token);
    },
    enabled: !!token,
  });

  const orders = data?.orders || [];
  const completedOrders = orders.filter(order => order.deliveryStatus === 'DELIVERED');

  const todayOrders = completedOrders.filter(order => {
    const orderDate = new Date(order.createdAt);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  });

  const thisMonthOrders = completedOrders.filter(order => {
    const orderDate = new Date(order.createdAt);
    const today = new Date();
    return (
      orderDate.getMonth() === today.getMonth() &&
      orderDate.getFullYear() === today.getFullYear()
    );
  });

  const todayEarnings = todayOrders.reduce((sum) => sum + 50, 0);
  const monthEarnings = thisMonthOrders.reduce((sum) => sum + 50, 0);
  const totalEarnings = completedOrders.reduce((sum) => sum + 50, 0);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'My Earnings',
          headerStyle: { backgroundColor: colors.accent.pink },
          headerTintColor: colors.neutral.white,
          headerTitleStyle: { fontWeight: '600' as const },
        }}
      />
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.accent.pink, colors.accent.pinkLight]}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.totalCard}>
            <DollarSign size={32} color={colors.neutral.white} />
            <Text style={styles.totalLabel}>Total Earnings</Text>
            <Text style={styles.totalAmount}>₹{totalEarnings}</Text>
            <Text style={styles.totalSubtext}>{completedOrders.length} deliveries completed</Text>
          </View>
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <View style={[styles.summaryIcon, { backgroundColor: colors.status.successLight }]}>
                <Calendar size={24} color={colors.status.success} />
              </View>
              <Text style={styles.summaryValue}>₹{todayEarnings}</Text>
              <Text style={styles.summaryLabel}>Today</Text>
              <Text style={styles.summaryCount}>{todayOrders.length} orders</Text>
            </View>

            <View style={styles.summaryCard}>
              <View style={[styles.summaryIcon, { backgroundColor: colors.primary.purpleLight + '40' }]}>
                <TrendingUp size={24} color={colors.primary.purple} />
              </View>
              <Text style={styles.summaryValue}>₹{monthEarnings}</Text>
              <Text style={styles.summaryLabel}>This Month</Text>
              <Text style={styles.summaryCount}>{thisMonthOrders.length} orders</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Completed Deliveries</Text>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.accent.pink} />
                <Text style={styles.loadingText}>Loading earnings...</Text>
              </View>
            ) : completedOrders.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Package size={64} color={colors.text.tertiary} />
                <Text style={styles.emptyText}>No completed deliveries yet</Text>
              </View>
            ) : (
              completedOrders.map(order => (
                <View key={order.id} style={styles.earningCard}>
                  <View style={styles.earningHeader}>
                    <View style={styles.earningShop}>
                      <Package size={18} color={colors.accent.pink} />
                      <Text style={styles.earningShopName}>{order.shopkeeper.shopname}</Text>
                    </View>
                    <Text style={styles.earningAmount}>+₹50</Text>
                  </View>
                  <View style={styles.earningDetails}>
                    <Text style={styles.earningAddress}>
                      {order.deliveryAddress.city}, {order.deliveryAddress.state}
                    </Text>
                    <Text style={styles.earningDate}>{formatDate(order.createdAt)}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
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
  headerGradient: {
    paddingTop: 24,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  totalCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 12,
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 48,
    fontWeight: '700' as const,
    color: colors.neutral.white,
    marginBottom: 8,
  },
  totalSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    flex: 1,
    marginTop: -20,
  },
  summaryGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.neutral.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text.primary,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  summaryCount: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text.primary,
    marginBottom: 16,
  },
  loadingContainer: {
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
  earningCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  earningHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  earningShop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  earningShopName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text.primary,
    flex: 1,
  },
  earningAmount: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.status.success,
  },
  earningDetails: {
    gap: 4,
  },
  earningAddress: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  earningDate: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
});
