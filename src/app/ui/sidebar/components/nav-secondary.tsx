"use client"

import React from 'react';
import { useRouter } from 'next/navigation';

interface NavItem {
  title: string;
  url: string;
}

interface NavSecondaryProps {
  items: NavItem[];
}

export function NavSecondary({ items }: NavSecondaryProps) {
  const router = useRouter();

  return (
    <nav className="flex flex-col gap-2">
      {items.map((item) => (
        <button
          key={item.url}
          onClick={() => router.push(item.url)}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          {item.title}
        </button>
      ))}
    </nav>
  );
}
