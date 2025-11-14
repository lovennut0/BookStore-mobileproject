import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ListRenderItem,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
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

const Home: React.FunctionComponent = () => {
  const router = useRouter();
  const [userChecked, setUserChecked] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [booksLoading, setBooksLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        router.replace('/signin');
      } else {
        setUserChecked(true);
      }
    };

    checkUser();
  }, [router]);

  useEffect(() => {
    const fetchBooks = async () => {
      if (!userChecked) return;

      setBooksLoading(true);

      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('book_id', { ascending: true });

      if (error) {
        console.log('Error fetching books:', error.message);
        setBooks([]);
      } else {
        setBooks(data || []);
      }

      setBooksLoading(false);
    };

    fetchBooks();
  }, [userChecked]);

  if (!userChecked || booksLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const handlePressBook = (book_id: number) => {
    router.push(`/bookdetail?id=${book_id}`);
  };

  const renderBook: ListRenderItem<Book> = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handlePressBook(item.book_id)}
    >
      <View style={styles.imageWrapper}>
        {item.img_url ? (
          <Image source={{ uri: item.img_url }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.noImage}>
            <Text style={styles.noImageText}> No Image </Text>
          </View>
        )}
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.bookName} numberOfLines={2}>
          {item.book_name}
        </Text>
        <Text style={styles.author} numberOfLines={1}>
          {item.author}
        </Text>
        <Text style={styles.price}>{item.price} ฿</Text>
        <Text style={styles.stock}>{item.stock} in stock</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Book Lab</Text>
        <TouchableOpacity onPress={() => router.navigate("/cart")} style={styles.cartButton} > 
          <Text style={{fontSize:24}}> 🛒 </Text>
        </TouchableOpacity>
        </View>

      <View style={styles.content}>
        {books.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No books available</Text>
          </View> ) : (
          <FlatList
            data={books} keyExtractor={(item) => String(item.book_id)}
            renderItem={renderBook} numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listContent} /> )}
      </View>
      <BottomNav/>
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingBottom: 60,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#E88504',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  cartIcon: {
    fontSize: 22,
  },
  content: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  row: {
    justifyContent: 'space-between',
  },
  listContent: {
    paddingBottom: 16,
  },
  card: {
    flex: 1,
    backgroundColor: 'white',
    marginBottom: 12,
    marginHorizontal: 4,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 2,
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: '#EEE',
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
    color: '#888',
  },
  cardContent: {
    padding: 8,
  },
  bookName: {
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 2,
  },
  author: {
    fontSize: 12,
    color: '#777',
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E88504',
  },
  stock: {
    fontSize: 11,
    color: '#555',
    marginTop: 2,
  },
  empty: {
    marginTop: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#777',
    fontSize: 16,
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
  cartButton: {
    padding: 8,
  },
});