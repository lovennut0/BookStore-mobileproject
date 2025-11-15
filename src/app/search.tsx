// app/search.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
  StyleSheet,
  ListRenderItem,
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

const Search: React.FC = () => {
  const router = useRouter();

  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [booksLoading, setBooksLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        router.replace('/signin');
      } else {
        setAuthChecked(true);
      }
    };

    checkUser();
  }, [router]);

  useEffect(() => {
    const fetchBooks = async () => {
      if (!authChecked) return;

      setBooksLoading(true);

      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('book_id', { ascending: true });

      if (error) {
        console.log('Error fetching books:', error.message);
        setBooks([]);
        setFilteredBooks([]);
      } else {
        const rows = (data || []) as Book[];
        setBooks(rows);
        setFilteredBooks(rows);
      }

      setBooksLoading(false);
    };

    fetchBooks();
  }, [authChecked]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredBooks(books);
    } else {
      const q = searchQuery.toLowerCase();
      const filtered = books.filter((book) => {
        const name = (book.book_name || '').toLowerCase();
        const author = (book.author || '').toLowerCase();
        const publisher = (book.publisher || '').toLowerCase();
        const isbn = (book.isbn || '').toLowerCase();

        return (
          name.includes(q) ||
          author.includes(q) ||
          publisher.includes(q) ||
          isbn.includes(q)
        );
      });
      setFilteredBooks(filtered);
    }
  }, [searchQuery, books]);

  const handlePressBook = (id: number): void => {
    router.push(`/bookdetail?id=${id}`);
  };

  const renderBook: ListRenderItem<Book> = ({ item }) => (
    <TouchableOpacity
      style={styles.card} onPress={() => handlePressBook(item.book_id)}
    >
      <View style={styles.imageWrapper}>
        {item.img_url ? (
          <Image source={{ uri: item.img_url }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.noImage}>
            <Text style={styles.noImageText}>No Image</Text>
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
      </View>
    </TouchableOpacity>
  );

  if (!authChecked || booksLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Book Lab</Text>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search books, authors, publishers..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.content}>
        {filteredBooks.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No books found' : 'No books available'}
            </Text>
          </View>
        ) : (
          <FlatList data={filteredBooks}
            keyExtractor={(item) => String(item.book_id)}
            renderItem={renderBook}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
      <BottomNav />
    </View>
    </TouchableWithoutFeedback>
  );
};

export default Search;

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
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF6E5',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 6,
    color: '#999',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
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
    borderRadius: 10,
    marginBottom: 12,
    marginHorizontal: 4,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: '#888',
  },
  cardContent: {
    padding: 8,
  },
  bookName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  author: {
    fontSize: 11,
    color: '#777',
    marginBottom: 4,
  },
  price: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#E88504',
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
});