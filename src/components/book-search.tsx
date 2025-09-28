"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, BookOpen, Star, Calendar, User, Package, Loader2 } from "lucide-react";

interface BookSearchResult {
  googleId: string;
  title: string;
  author: string;
  authors: string[];
  description?: string;
  publishedYear?: number;
  pages?: number;
  genre?: string;
  coverImage?: string;
  isbn?: string;
  printType: string;
  language: string;
  publisher?: string;
  averageRating?: number;
  ratingsCount?: number;
}

interface BookSearchProps {
  onBookSelect: (book: BookSearchResult) => void;
  placeholder?: string;
  className?: string;
}

export function BookSearch({ onBookSelect, placeholder = "Search for books...", className = "" }: BookSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BookSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      searchBooks(query.trim());
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const searchBooks = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/books/search?q=${encodeURIComponent(searchQuery)}&maxResults=8`);
      if (!res.ok) throw new Error("Failed to search books");
      
      const data = await res.json();
      setResults(data.books || []);
      setShowResults(true);
      setSelectedIndex(-1);
    } catch (err: any) {
      console.error("Error searching books:", err);
      toast.error("Failed to search books. Please try again.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => prev < results.length - 1 ? prev + 1 : prev);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          selectBook(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowResults(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const selectBook = (book: BookSearchResult) => {
    onBookSelect(book);
    setQuery(book.title);
    setShowResults(false);
    setSelectedIndex(-1);
    toast.success(`Selected: ${book.title}`);
  };

  const getBookFormat = (book: BookSearchResult) => {
    if (book.printType === 'MAGAZINE') return 'Magazine';
    // You could extend this to detect ebook, hardcover, etc. based on other fields
    return 'Book';
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setShowResults(true);
          }}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 animate-spin" />
        )}
      </div>

      {showResults && results.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-96 overflow-y-auto shadow-lg">
          <CardContent className="p-0">
            {results.map((book, index) => (
              <div
                key={book.googleId}
                className={`flex items-start gap-3 p-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${
                  index === selectedIndex ? 'bg-blue-50 border-blue-200' : ''
                }`}
                onClick={() => selectBook(book)}
              >
                {/* Book Cover */}
                <div className="flex-shrink-0">
                  {book.coverImage ? (
                    <img
                      src={book.coverImage}
                      alt={book.title}
                      className="w-12 h-16 object-cover rounded shadow-sm"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`w-12 h-16 bg-gray-200 rounded flex items-center justify-center ${book.coverImage ? 'hidden' : ''}`}>
                    <BookOpen className="w-6 h-6 text-gray-400" />
                  </div>
                </div>

                {/* Book Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm line-clamp-2 text-gray-900 mb-1">
                    {book.title}
                  </h4>
                  <p className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {book.author}
                  </p>
                  
                  <div className="flex flex-wrap gap-1 mb-2">
                    {book.publishedYear && (
                      <Badge variant="outline" className="text-xs">
                        <Calendar className="w-3 h-3 mr-1" />
                        {book.publishedYear}
                      </Badge>
                    )}
                    {book.pages && (
                      <Badge variant="outline" className="text-xs">
                        {book.pages}p
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      <Package className="w-3 h-3 mr-1" />
                      {getBookFormat(book)}
                    </Badge>
                    {book.averageRating && (
                      <Badge variant="outline" className="text-xs">
                        <Star className="w-3 h-3 mr-1 fill-current text-yellow-500" />
                        {book.averageRating.toFixed(1)}
                      </Badge>
                    )}
                  </div>

                  {book.genre && (
                    <Badge variant="secondary" className="text-xs">
                      {book.genre}
                    </Badge>
                  )}

                  {book.description && (
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                      {book.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {showResults && results.length === 0 && !loading && query.trim().length >= 2 && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 shadow-lg">
          <CardContent className="p-4 text-center text-gray-500">
            <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No books found for "{query}"</p>
            <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
