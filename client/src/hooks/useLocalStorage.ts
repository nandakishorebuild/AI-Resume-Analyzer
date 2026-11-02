import { useState } from "react";

// A custom hook: like useState, but also saves to localStorage
function useLocalStorage(key: string) {
  // read the saved value (or null if nothing saved)
  const [value, setValue] = useState<string | null>(
    localStorage.getItem(key)
  );

  // save a new value
  function save(newValue: string) {
    localStorage.setItem(key, newValue);
    setValue(newValue);
  }

  // remove the value (for logout)
  function remove() {
    localStorage.removeItem(key);
    setValue(null);
  }

  return { value, save, remove };
}

export default useLocalStorage;
