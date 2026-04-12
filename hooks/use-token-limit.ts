'use client';

import { useState, useEffect } from 'react';

const DAILY_LIMIT = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_DAILY_LIMIT 
  ? parseInt(process.env.NEXT_PUBLIC_DAILY_LIMIT, 10) 
  : 10000;

export function useTokenLimit() {
  const [used, setUsed] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const stored = localStorage.getItem('imaginex_token_usage');
      
      if (stored) {
        const { date, count } = JSON.parse(stored);
        if (date === today) {
          setUsed(count);
          setIsLoaded(true);
          return;
        }
      }
      
      localStorage.setItem('imaginex_token_usage', JSON.stringify({ date: today, count: 0 }));
      setUsed(0);
    } catch (error) {
      console.error('Failed to load token usage', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const increment = (amount: number = 1) => {
    setUsed((prev) => {
      const newCount = prev + amount;
      try {
        const today = new Date().toISOString().slice(0, 10);
        localStorage.setItem('imaginex_token_usage', JSON.stringify({ date: today, count: newCount }));
      } catch (error) {
        console.error('Failed to save token usage', error);
      }
      return newCount;
    });
  };

  return { 
    used, 
    limit: DAILY_LIMIT, 
    remaining: Math.max(0, DAILY_LIMIT - used),
    isLoaded,
    increment 
  };
}
