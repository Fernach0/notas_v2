'use client';

import { useState } from 'react';

export function useModal<T = null>() {
  const [isOpen, setIsOpen] = useState(false);
  const [item, setItem] = useState<T | null>(null);

  const open = (data?: T) => {
    setItem(data ?? null);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setItem(null);
  };

  return { isOpen, item, open, close };
}
