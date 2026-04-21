'use client';

import { useState, useEffect } from 'react';

export function useSearchDebounce(delay = 300) {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), delay);
    return () => clearTimeout(timer);
  }, [searchInput, delay]);

  return { searchInput, setSearchInput, debouncedSearch };
}
