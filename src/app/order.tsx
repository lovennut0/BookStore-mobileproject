import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../api/supabaseClient';
import BottomNav from '../components/BottomNav';

interface OrderItem {
  book_id: number;
  quantity: number;
  unit_price: number;
  books: {
  book_name: string;
  author: string;
  img_url: string | null;
  };
}

interface Order {
  order_id: number;
  created_at: string;
  total_price: number;
  order_items: OrderItem[];
}

const OrderHistory: React.FC = () => {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        router.replace('/signin');
      } else {
        setUser(data.user);
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          order_id,
          created_at,
          total_price,
          order_items (
            book_id,
            quantity,
            unit_price,
            books ( book_name, author, img_url )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      type SupabaseOrderRow = {
        order_id: number;
        created_at: string;
        total_price: number;
        order_items: {
          book_id: number;
          quantity: number;
          unit_price: number;
          books: {
            book_name: string;
            author: string;
            img_url: string | null;
          } | null;
        }[];
      };

      const mapped: Order[] =
        ((data as unknown as SupabaseOrderRow[] | null) ?? []).map((row) => ({
          order_id: row.order_id,
          created_at: row.created_at,
          total_price: row.total_price,
          order_items: row.order_items
            .filter((item) => item.books !== null)
            .map((item) => ({
              book_id: item.book_id,
              quantity: item.quantity,
              unit_price: item.unit_price,
              books: item.books as OrderItem['books'],
            })),
        }));

      setOrders(mapped);
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('Error', 'Failed to load order history');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        {orders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🛒</Text>
            <Text style={styles.emptyText}>No orders yet</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace('/Home')} >
              <Text style={styles.primaryButtonText}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.ordersList}>
            {orders.map((order, index) => (
              <View key={order.order_id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View>
                    <Text style={styles.orderTitle}>
                      Order #{orders.length - index}
                    </Text>
                    <Text style={styles.orderDate}>
                      {new Date(order.created_at).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <View style={styles.orderTotalBlock}>
                    <Text style={styles.orderTotalLabel}>Total</Text>
                    <Text style={styles.orderTotalValue}>
                      ฿ {Number(order.total_price).toFixed(2)}
                    </Text>
                  </View>
                </View>

                <View style={styles.itemsBlock}>
                  {order.order_items.map((item, index) => (
                    <View
                      key={`${order.order_id}-${index}`}
                      style={[
                        styles.itemRow,
                        index === order.order_items.length - 1 && {
                          borderBottomWidth: 0,
                        },
                      ]}
                    >
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemTitle}>
                          {item.books.book_name}
                        </Text>
                        <Text style={styles.itemAuthor}>
                          {item.books.author}
                        </Text>
                        <Text style={styles.itemQty}>
                          Qty: {item.quantity}
                        </Text>
                      </View>
                      <Text style={styles.itemPrice}>
                        ฿ {Number(item.unit_price).toFixed(2)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <BottomNav />
    </View>
  );
};

export default OrderHistory;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingBottom: 60,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 10,
    paddingHorizontal: 16,
    backgroundColor: '#E88504',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
  },
  backButton: {
    padding: 6,
    borderRadius: 999,
  },
  backIcon: {
    fontSize: 22,
    color: 'white',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  emptyCard: {
    marginTop: 40,
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    elevation: 2,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
    color: '#999',
  },
  emptyText: {
    fontSize: 14,
    color: '#777',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#E88504',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  ordersList: {
    gap: 16,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  orderDate: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  orderTotalBlock: {
    alignItems: 'flex-end',
  },
  orderTotalLabel: {
    fontSize: 12,
    color: '#777',
  },
  orderTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E88504',
  },
  itemsBlock: {
    marginTop: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  itemInfo: {
    flex: 1,
    marginRight: 8,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemAuthor: {
    fontSize: 12,
    color: '#777',
  },
  itemQty: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
  },
});