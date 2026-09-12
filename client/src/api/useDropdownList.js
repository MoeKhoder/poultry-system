import { useEffect, useState } from "react";
import { dropdownOptionsApi } from "./resources";

export function useDropdownList(label) {
  const [values, setValues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dropdownOptionsApi
      .list()
      .then((lists) => {
        const match = lists.find((l) => l.label === label);
        setValues(match?.values || []);
      })
      .finally(() => setLoading(false));
  }, [label]);

  return { values, loading };
}
