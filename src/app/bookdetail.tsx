import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../api/supabaseClient';
import BottomNav from '../components/BottomNav';

interface Book {
  book_id: number;
  book_name: string;
  author: string;
  publisher: string;
  isbn: string;
  price: number;
  stock: number;
  img_url: string | null;
}

const BookDetail: React.FC = () => {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [book, setBook] = useState<Book | null>(null);
  const [bookLoading, setBookLoading] = useState<boolean>(true);

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
    const fetchBook = async () => {
      if (!user || !id) return;

      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('book_id', Number(id))
        .single();

      if (error) {
        console.error('Error fetching book:', error);
        Alert.alert('Error', 'Book not found');
        router.replace('/home');
      } else {
        setBook(data as Book);
      }
      setBookLoading(false);
    };

    fetchBook();
  }, [user, id, router]);

  const handleAddToCart = async () => {
    if (!user || !book) return;

    try {
      let { data: cart } = await supabase
        .from('carts')
        .select('cart_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();
      let cartId: number;
      if (!cart) {
        const { data: newCart, error: cartError } = await supabase
          .from('carts')
          .insert({ user_id: user.id, is_active: true })
          .select()
          .single();

        if (cartError || !newCart) {
          throw cartError ?? new Error('Failed to create cart');
        }
          cartId = newCart.cart_id;
        } else {
          cartId = cart.cart_id;
        }
        
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('cart_item_id, quantity')
        .eq('cart_id', cartId)
        .eq('book_id', book.book_id)
        .single();

      if (existingItem) {
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + 1 })
          .eq('cart_item_id', existingItem.cart_item_id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cart_items')
          .insert({
            cart_id: cartId,
            book_id: book.book_id,
            quantity: 1,
          });

        if (error) throw error;
      }

      Alert.alert('Success', 'Added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'Failed to add to cart');
    }
  };

  if (authLoading || bookLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!book) {
    return null;
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()} 
          style={styles.backButton}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>BookBook</Text>
        <TouchableOpacity style={styles.cartButton} onPress={() => router.push('/cart')} >
          <Text style={styles.cartIcon}>🛒</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.imageWrapper}>
            {book.img_url ? (
              <Image source={{ uri: book.img_url }} style={styles.image} resizeMode="contain" />
            ) : (
              <View style={styles.noImage}>
                <Text style={styles.noImageText}>No Image Available</Text>
              </View>
            )}
          </View>

          <View style={styles.body}>
            <View style={{ marginBottom: 12 }}>
              <Text style={styles.bookName}>{book.book_name}</Text>
              <Text style={styles.author}>By {book.author}</Text>
            </View>

            <View style={styles.infoBlock}>
              <View style={styles.row}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Publisher:</Text>
                  <Text style={styles.infoValue}>{book.publisher}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>ISBN:</Text>
                  <Text style={styles.infoValue}>{book.isbn}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>In Stock:</Text>
                <Text style={styles.infoValue}>
                  {book.stock} {book.stock === 1 ? 'copy' : 'copies'}
                </Text>
              </View>
            </View>

            <View style={styles.priceBlock}>
              <View>
                <Text style={styles.price}>{book.price} ฿ </Text>
                <Text style={styles.stockText}>{book.stock} in stock</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleAddToCart}
              style={[ styles.addButton, book.stock === 0 && styles.addButtonDisabled, ]}
              disabled={book.stock === 0} >
              <Text style={styles.addButtonText}>
                {book.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <BottomNav />
    </View>
  );
};

export default BookDetail;

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
  row:{
    flexDirection: 'row', 
    justifyContent: 'space-between'
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
  cartButton: {
    padding: 6,
    backgroundColor: 'white',
    borderRadius: 50,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 2, height: 2 },
    shadowRadius: 4,
  },
  cartIcon: {
    fontSize: 15,
    color: 'white',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: '#EEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  noImage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noImageText: {
    color: '#777',
  },
  body: {
    padding: 16,
  },
  bookName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  author: {
    fontSize: 14,
    color: '#666',
  },
  infoBlock: {
    marginTop: 8,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 13,
    color: '#777',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
    marginLeft: 8,
    flexShrink: 1,
    textAlign: 'right',
  },
  priceBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  price: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#E88504',
  },
  stockText: {
    fontSize: 12,
    color: '#777',
  },
  addButton: {
    backgroundColor: '#E88504',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});