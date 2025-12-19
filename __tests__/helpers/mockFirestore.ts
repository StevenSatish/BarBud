type Store = Map<string, any>;

const store: Store = new Map();

type PendingOp =
  | { type: 'set'; path: string; data: any; merge?: boolean }
  | { type: 'delete'; path: string };

const commits: Array<PendingOp[]> = [];

const clone = (obj: any) => (obj === undefined ? obj : JSON.parse(JSON.stringify(obj)));

const mergeData = (target: any, source: any) => {
  if (!target) return clone(source);
  return { ...clone(target), ...clone(source) };
};

export const resetMockFirestore = (initial: Record<string, any> = {}) => {
  store.clear();
  Object.entries(initial).forEach(([path, value]) => {
    store.set(path, clone(value));
  });
  commits.length = 0;
};

export const getStore = () => store;
export const getCommits = () => commits;

const buildPath = (first: any, rest: any[]) => {
  const parts: string[] = [];
  if (first?.path) parts.push(first.path);
  else if (typeof first === 'string') parts.push(first);
  rest.forEach((p) => {
    if (p == null) return;
    parts.push(String(p));
  });
  return parts.filter(Boolean).join('/');
};

export const doc = (...args: any[]) => {
  const path = buildPath(args[0], args.slice(1));
  const segments = path.split('/').filter(Boolean);
  return { path, id: segments[segments.length - 1] };
};

export const collection = (...args: any[]) => ({
  path: buildPath(args[0], args.slice(1)),
});

export const getDoc = async (ref: { path: string }) => ({
  exists: () => store.has(ref.path),
  data: () => clone(store.get(ref.path)),
});

export const getDocs = async (ref: { path: string }) => {
  const prefix = `${ref.path}/`;
  const docs = Array.from(store.entries())
    .filter(([path]) => path.startsWith(prefix))
    .map(([path, value]) => {
      const segments = path.split('/').filter(Boolean);
      return {
        id: segments[segments.length - 1],
        data: () => clone(value),
        ref: { path },
      };
    });
  return {
    empty: docs.length === 0,
    docs,
    forEach: (cb: (d: any) => void) => docs.forEach(cb),
  };
};

export const writeBatch = () => {
  const pending: PendingOp[] = [];
  return {
    set: (ref: { path: string }, data: any, opts?: { merge?: boolean }) => {
      pending.push({ type: 'set', path: ref.path, data: clone(data), merge: opts?.merge });
    },
    delete: (ref: { path: string }) => {
      pending.push({ type: 'delete', path: ref.path });
    },
    commit: async () => {
      pending.forEach((op) => {
        if (op.type === 'delete') {
          store.delete(op.path);
        } else {
          const prev = op.merge ? store.get(op.path) : undefined;
          const next = op.merge ? mergeData(prev, op.data) : clone(op.data);
          store.set(op.path, next);
        }
      });
      commits.push([...pending]);
    },
  };
};
