import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Package, DollarSign, CheckCircle, Clock, TrendingUp } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '@/utils/api';
import colors from '@/constants/colors';
import { useState } from 'react';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['orders', token],
    queryFn: async () => {
      if (!token) throw new Error('No token');
      return await ordersApi.getOrders(token);
    },
    enabled: !!token,
  });

  const orders = data?.orders || [];

  const todayOrders = orders.filter(order => {
    const orderDate = new Date(order.createdAt);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  });

  const completedOrders = orders.filter(order => order.deliveryStatus === 'DELIVERED');
  const activeOrders = orders.filter(
    order => order.deliveryStatus === 'ACCEPTED' || order.deliveryStatus === 'PICKED_UP'
  );

  const todayEarnings = todayOrders
    .filter(order => order.deliveryStatus === 'DELIVERED')
    .reduce((sum, order) => sum + 50, 0);

  const totalEarnings = completedOrders.reduce(
    (sum, order) => sum + 50,
    0
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary.purple, colors.primary.purpleLight]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello,</Text>
            <Text style={styles.name}>{user?.name || 'Driver'}</Text>
          </View>
          <View style={styles.earningsCard}>
            <Text style={styles.earningsLabel}>Today&apos;s Earnings</Text>
            <Text style={styles.earningsAmount}>₹{todayEarnings}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.status.infoLight }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.status.info }]}>
              <Package size={24} color={colors.neutral.white} />
            </View>
            <Text style={styles.statValue}>{todayOrders.length}</Text>
            <Text style={styles.statLabel}>Today&apos;s Orders</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.status.successLight }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.status.success }]}>
              <CheckCircle size={24} color={colors.neutral.white} />
            </View>
            <Text style={styles.statValue}>{completedOrders.length}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.status.warningLight }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.status.warning }]}>
              <Clock size={24} color={colors.neutral.white} />
            </View>
            <Text style={styles.statValue}>{activeOrders.length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.accent.pinkLight + '40' }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.accent.pink }]}>
              <TrendingUp size={24} color={colors.neutral.white} />
            </View>
            <Text style={styles.statValue}>₹{totalEarnings}</Text>
            <Text style={styles.statLabel}>Total Earnings</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/orders' as never)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[colors.primary.purple, colors.primary.purpleLight]}
              style={styles.actionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.actionContent}>
                <View>
                  <Text style={styles.actionTitle}>My Orders</Text>
                  <Text style={styles.actionSubtitle}>View and manage deliveries</Text>
                </View>
                <Package size={32} color={colors.neutral.white} />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/earnings' as never)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[colors.accent.pink, colors.accent.pinkLight]}
              style={styles.actionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.actionContent}>
                <View>
                  <Text style={styles.actionTitle}>My Earnings</Text>
                  <Text style={styles.actionSubtitle}>Track your income</Text>
                </View>
                <DollarSign size={32} color={colors.neutral.white} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {isLoading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading your data...</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  name: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.neutral.white,
  },
  earningsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'flex-end',
  },
  earningsLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  earningsAmount: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.neutral.white,
  },
  content: {
    flex: 1,
    marginTop: -16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
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
  actionCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionGradient: {
    padding: 20,
  },
  actionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.neutral.white,
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
});
