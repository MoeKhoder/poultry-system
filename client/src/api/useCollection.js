import { useCallback, useEffect, useState } from "react";

export function useCollection(resourceApi) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await resourceApi.list();
      setItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [resourceApi]);

  useEffect(() => {
    reload();
  }, [reload]);

  const create = useCallback(
    async (body) => {
      const created = await resourceApi.create(body);
      setItems((prev) => [...prev, created]);
      return created;
    },
    [resourceApi],
  );

  const update = useCallback(
    async (id, body) => {
      const updated = await resourceApi.update(id, body);
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
      return updated;
    },
    [resourceApi],
  );

  const remove = useCallback(
    async (id) => {
      await resourceApi.remove(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    },
    [resourceApi],
  );

  return { items, loading, error, reload, create, update, remove };
}
