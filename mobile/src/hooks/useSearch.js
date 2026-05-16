import { useState, useEffect } from "react";

/**
 * Manages the load-on-mount + local-filter + optional-server-submit pattern
 * shared across search screens.
 *
 * @param {Object} opts
 * @param {() => Promise<any[]>} opts.load   Async fn called on mount; must return an array.
 * @param {(items: any[], query: string) => any[]} [opts.filter]  Sync filter; called on every query change.
 * @param {(query: string) => Promise<any[]>} [opts.onSubmit]    Async fn called on explicit submit.
 */
export default function useSearch({ load, filter, onSubmit }) {
  const [allItems, setAllItems] = useState([]);
  const [results, setResults] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    load()
      .then((items) => { setAllItems(items); setResults(items); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const onChangeQuery = (text) => {
    setQuery(text);
    if (filter) setResults(filter(allItems, text));
  };

  const submitFn = onSubmit
    ? async () => {
        setError(""); setLoading(true);
        try {
          const items = await onSubmit(query);
          setResults(items);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    : undefined;

  return { results, query, onChangeQuery, onSubmit: submitFn, loading, error };
}
