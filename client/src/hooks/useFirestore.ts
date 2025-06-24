import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, where, limit as limitQuery } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const useFirestoreCollection = <T>(
  collectionName: string,
  options: {
    orderByField?: string;
    orderDirection?: 'asc' | 'desc';
    whereField?: string;
    whereValue?: any;
    limit?: number;
  } = {}
) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      let q = query(collection(db, collectionName));

      if (options.whereField && options.whereValue !== undefined) {
        q = query(q, where(options.whereField, '==', options.whereValue));
      }

      if (options.orderByField) {
        q = query(q, orderBy(options.orderByField, options.orderDirection || 'desc'));
      }

      if (options.limit) {
        q = query(q, limitQuery(options.limit));
      }

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const documents = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as T[];
          
          setData(documents);
          setLoading(false);
        },
        (err) => {
          setError(err.message);
          setLoading(false);
        }
      );

      return unsubscribe;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }, [collectionName, options.orderByField, options.orderDirection, options.whereField, options.whereValue, options.limit]);

  return { data, loading, error };
};
