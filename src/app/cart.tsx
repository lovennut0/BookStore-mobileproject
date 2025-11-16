import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Image,
  ScrollView,} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../api/supabaseClient';
import BottomNav from '../components/BottomNav';

interface CartItem {
  cart_item_id: number;
  quantity: number;
  books: {
    book_id: number;
    book_name: string;
    author: string;
    price: number;
    stock: number;
    img_url: string | null;
  };
}

const Cart: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [cartItems,setCartItems] = useState<CartItem[]>([]);
  const [cartLoading, setCartLoading] = useState<boolean>(true);
  const [checkoutLoading, setCheckoutLoading] = useState<boolean>(false);

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
      fetchCart();
    }
  }, [user]);

    const fetchCart = async () => {
  try {
    let { data: cart } = await supabase
      .from('carts')
      .select('cart_id')
      .eq('user_id', user!.id)
      .eq('is_active', true)
      .single();

    if (!cart) {
      setCartItems([]);
      setCartLoading(false);
      return;
    }

    const { data: items, error } = await supabase
      .from('cart_items')
      .select(`
        cart_item_id,
        quantity,
        books (
          book_id,
          book_name,
          author,
          price,
          stock,
          img_url
        )
      `)
      .eq('cart_id', cart.cart_id);

    if (error) throw error;

    type SupabaseCartRow = {
      cart_item_id: number;
      quantity: number;
      books: {
        book_id: number;
        book_name: string;
        author: string;
        price: number;
        stock: number;
        img_url: string | null;
      } | null;
    };

    const mapped: CartItem[] =
      ((items as unknown as SupabaseCartRow[] | null) ?? [])
        .filter((row) => row.books !== null)
        .map((row) => ({
          cart_item_id: row.cart_item_id, quantity: row.quantity, books: row.books as CartItem['books'],
        }));

    setCartItems(mapped);
  } catch (error) {
    console.error('Error fetching cart:', error);
  } finally {
    setCartLoading(false);
  }
};

  const updateQuantity = async (
    cartItemId: number,
    newQuantity: number
  ): Promise<void> => {
    if (newQuantity < 1) return;

    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('cart_item_id', cartItemId);

      if (error) throw error;
      await fetchCart();
    } catch (error) {
      console.error('Error updating quantity:', error);
      Alert.alert('Error', 'Failed to update quantity');
    }
  };

  const removeItem = async (cartItemId: number): Promise<void> => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_item_id', cartItemId);

      if (error) throw error;
      await fetchCart();
      Alert.alert('Removed', 'Item removed from cart');
    } catch (error) {
      console.error('Error removing item:', error);
      Alert.alert('Error', 'Failed to remove item');
    }
  };

  const handleCheckout = async (): Promise<void> => {
    if (cartItems.length === 0) return;

    setCheckoutLoading(true);
    try {
      const total = cartItems.reduce(
        (sum, item) => sum + item.books.price * item.quantity,0 );

      for (const item of cartItems) {
        if (item.books.stock < item.quantity) {
          Alert.alert(
            'Not enough stock',
            `Not enough stock for ${item.books.book_name}`
          );
          setCheckoutLoading(false);
          return;
        }
      }

      const { data: cart } = await supabase
        .from('carts')
        .select('cart_id')
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .single();

      if (!cart) throw new Error('Cart not found');

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user!.id,
          total_price: total,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      for (const item of cartItems) {
        const { error: orderItemError } = await supabase
          .from('order_items')
          .insert({
            order_id: order.order_id,
            book_id: item.books.book_id,
            quantity: item.quantity,
            unit_price: item.books.price,
          });

        if (orderItemError) throw orderItemError;

        const { data: updatedBook, error: stockError } = await supabase
        .from('books')
        .update({ stock: item.books.stock - item.quantity })
        .eq('book_id', item.books.book_id)
        .select('book_id, stock')
        .single();

        console.log('Updating stock for book', {
        bookId: item.books.book_id,
        oldStock: item.books.stock,
        quantity: item.quantity,
        newStock: updatedBook?.stock,
        stockError,
        });
        if (stockError) throw stockError;
      }

      await supabase
        .from('carts')
        .update({ is_active: false })
        .eq('cart_id', cart.cart_id);

      Alert.alert('Success', 'Order placed successfully!');
      router.replace('/Home');
    } catch (error) {
      console.error('Error during checkout:', error);
      Alert.alert('Error', 'Checkout failed. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.books.price * item.quantity, 0
  );

  if (authLoading || cartLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/Home')} style={styles.backButton} >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shopping Cart</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.content}>
        {cartItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Your cart is empty</Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.replace('/Home')}
            >
              <Text style={styles.primaryButtonText}>Browse Books</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.itemsContainer}>
              {cartItems.map((item) => (
                <View
                  key={item.cart_item_id}
                  style={styles.itemCard}
                >
                  <View style={styles.itemRow}>
                    <View style={styles.itemImageWrapper}>
                      {item.books.img_url ? (
                        <Image
                          source={{ uri: item.books.img_url }}
                          style={styles.itemImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.noImage}>
                          <Text style={styles.noImageText}>No Image</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.itemInfo}>
                      <Text style={styles.itemTitle} numberOfLines={2}>
                        {item.books.book_name}
                      </Text>
                      <Text style={styles.itemAuthor} numberOfLines={1}>
                        {item.books.author}
                      </Text>
                      <Text style={styles.itemPrice}>
                        {item.books.price} ฿
                      </Text>

                      <View style={styles.quantityRow}>
                        <TouchableOpacity
                          style={[
                            styles.qtyButton,
                            item.quantity <= 1 && styles.qtyButtonDisabled,
                          ]}
                          onPress={() =>
                            updateQuantity(
                              item.cart_item_id,
                              item.quantity - 1
                            )
                          }
                          disabled={item.quantity <= 1}
                        >
                          <Text style={styles.qtyButtonText}>-</Text>
                        </TouchableOpacity>

                        <Text style={styles.qtyText}>{item.quantity}</Text>

                        <TouchableOpacity
                          style={[ styles.qtyButton, item.quantity >= item.books.stock && styles.qtyButtonDisabled,]}
                          onPress={() => updateQuantity( item.cart_item_id, item.quantity + 1 ) }
                          disabled={item.quantity >= item.books.stock}
                        >
                          <Text style={styles.qtyButtonText}>+</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.removeButton}
                          onPress={() => removeItem(item.cart_item_id)} >
                          <Text style={styles.removeButtonText}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total:</Text>
                <Text style={styles.summaryTotal}>
                  {totalPrice.toFixed(2)} ฿
                </Text>
              </View>
              <TouchableOpacity
                style={[ styles.primaryButton, checkoutLoading && styles.primaryButtonDisabled, ]}
                onPress={handleCheckout} disabled={checkoutLoading} >
                <Text style={styles.primaryButtonText}>
                  {checkoutLoading ? 'Processing...' : 'Checkout'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      <BottomNav />
    </View>
  );
};

export default Cart;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingBottom: 60,
  },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 10,
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
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: '#777',
    fontSize: 16,
    marginBottom: 16,
  },
  itemsContainer: {
    marginBottom: 16,
  },
  itemCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    elevation: 2,
  },
  itemRow: {
    flexDirection: 'row',
    gap: 10,
  },
  itemImageWrapper: {
    width: 70,
    height: 100,
    backgroundColor: '#EEE',
    borderRadius: 6,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  noImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    fontSize: 10,
    color: '#888',
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  itemAuthor: {
    fontSize: 11,
    color: '#777',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#E88504',
    marginBottom: 6,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  qtyButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#CCC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyButtonDisabled: {
    opacity: 0.4,
  },
  qtyButtonText: {
    fontSize: 16,
  },
  qtyText: {
    width: 30,
    textAlign: 'center',
    fontSize: 13,
    marginHorizontal: 4,
  },
  removeButton: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  removeButtonText: {
    fontSize: 16,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  summaryTotal: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#E88504',
  },
  primaryButton: {
    backgroundColor: '#E88504',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});