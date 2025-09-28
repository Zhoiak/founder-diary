import { NextRequest, NextResponse } from "next/server";

interface BookSearchResult {
  id: string;
  title: string;
  authors: string[];
  description?: string;
  publishedDate?: string;
  pageCount?: number;
  categories?: string[];
  imageLinks?: {
    thumbnail?: string;
    smallThumbnail?: string;
  };
  industryIdentifiers?: Array<{
    type: string;
    identifier: string;
  }>;
  printType?: string; // BOOK or MAGAZINE
  maturityRating?: string;
  language?: string;
  publisher?: string;
  averageRating?: number;
  ratingsCount?: number;
}

interface GoogleBooksResponse {
  items?: Array<{
    id: string;
    volumeInfo: BookSearchResult;
  }>;
  totalItems: number;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const query = url.searchParams.get('q');
    const maxResults = parseInt(url.searchParams.get('maxResults') || '10');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ error: "Query must be at least 2 characters" }, { status: 400 });
    }

    // Use Google Books API for book search
    const googleBooksUrl = new URL('https://www.googleapis.com/books/v1/volumes');
    googleBooksUrl.searchParams.set('q', query.trim());
    googleBooksUrl.searchParams.set('maxResults', Math.min(maxResults, 40).toString());
    googleBooksUrl.searchParams.set('printType', 'books');
    googleBooksUrl.searchParams.set('orderBy', 'relevance');

    const response = await fetch(googleBooksUrl.toString(), {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Google Books API error: ${response.status}`);
    }

    const data: GoogleBooksResponse = await response.json();

    if (!data.items || data.items.length === 0) {
      return NextResponse.json({
        success: true,
        books: [],
        totalResults: 0,
        message: "No books found for this search"
      });
    }

    // Process and clean the results
    const processedBooks = data.items.map(item => {
      const book = item.volumeInfo;
      
      // Get ISBN (prefer ISBN_13, fallback to ISBN_10)
      const isbn13 = book.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier;
      const isbn10 = book.industryIdentifiers?.find(id => id.type === 'ISBN_10')?.identifier;
      const isbn = isbn13 || isbn10;

      // Clean and format the data
      return {
        googleId: item.id,
        title: book.title || 'Unknown Title',
        authors: book.authors || ['Unknown Author'],
        author: book.authors ? book.authors.join(', ') : 'Unknown Author',
        description: book.description ? 
          book.description.length > 500 ? 
            book.description.substring(0, 500) + '...' : 
            book.description : 
          undefined,
        publishedDate: book.publishedDate,
        publishedYear: book.publishedDate ? parseInt(book.publishedDate.split('-')[0]) : undefined,
        pageCount: book.pageCount,
        pages: book.pageCount,
        categories: book.categories || [],
        genre: book.categories ? book.categories[0] : undefined,
        coverImage: book.imageLinks?.thumbnail || book.imageLinks?.smallThumbnail,
        cover_image_url: book.imageLinks?.thumbnail || book.imageLinks?.smallThumbnail,
        isbn: isbn,
        printType: book.printType || 'BOOK',
        format: book.printType === 'MAGAZINE' ? 'Magazine' : 'Book',
        language: book.language || 'en',
        publisher: book.publisher,
        averageRating: book.averageRating,
        ratingsCount: book.ratingsCount,
        maturityRating: book.maturityRating || 'NOT_MATURE'
      };
    });

    // Sort by relevance (books with more complete information first)
    const sortedBooks = processedBooks.sort((a, b) => {
      const scoreA = (a.coverImage ? 2 : 0) + (a.description ? 2 : 0) + (a.pageCount ? 1 : 0) + (a.averageRating ? 1 : 0);
      const scoreB = (b.coverImage ? 2 : 0) + (b.description ? 2 : 0) + (b.pageCount ? 1 : 0) + (b.averageRating ? 1 : 0);
      return scoreB - scoreA;
    });

    return NextResponse.json({
      success: true,
      books: sortedBooks,
      totalResults: data.totalItems,
      query: query.trim()
    });

  } catch (error: any) {
    console.error("Error searching books:", error);
    
    // Return a more user-friendly error
    if (error.message.includes('Google Books API')) {
      return NextResponse.json(
        { error: "Book search service temporarily unavailable. Please try again later." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to search books. Please try again." },
      { status: 500 }
    );
  }
}

// Optional: Add a POST endpoint for more complex searches
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, author, isbn, category } = body;

    if (!title && !author && !isbn) {
      return NextResponse.json({ error: "At least one search parameter is required" }, { status: 400 });
    }

    // Build a more specific query
    let query = '';
    if (title) query += `intitle:${title}`;
    if (author) query += ` inauthor:${author}`;
    if (isbn) query += ` isbn:${isbn}`;
    if (category) query += ` subject:${category}`;

    // Use the GET endpoint logic
    const searchUrl = new URL('/api/books/search', req.url);
    searchUrl.searchParams.set('q', query.trim());
    searchUrl.searchParams.set('maxResults', '20');

    const response = await GET(new NextRequest(searchUrl.toString()));
    return response;

  } catch (error: any) {
    console.error("Error in advanced book search:", error);
    return NextResponse.json(
      { error: "Failed to perform advanced search" },
      { status: 500 }
    );
  }
}
