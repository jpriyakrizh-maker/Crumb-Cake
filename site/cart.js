"use client";
let count = 0;
const listeners = new Set();
export const order = {
  add(name) {
    count += 1;
    listeners.forEach((l) => l(count, { name }));
  },
  subscribe(fn) {
    listeners.add(fn);
    fn(count);
    return () => {
      listeners.delete(fn);
    };
  },
};
