# React Best Practices

Universal best practices for React applications. These are not style preferences—they are patterns that prevent bugs, improve performance, and maintain code quality regardless of project conventions.

---

## Severity Levels

- **Critical**: Causes bugs, crashes, infinite loops, memory leaks, or violates React's core model
- **Warning**: Performance issues, maintainability problems, or patterns that lead to bugs
- **Info**: Recommendations that improve code quality but aren't strictly necessary

---

## 1. Component Design

### 1.1 Component Size & Responsibility (Warning)

Split components when any of these signals appear:

- **Lines of code > 150**: Component is too large to reason about
- **Multiple responsibilities**: Component does more than one logical thing
- **Reusability signals**: Duplicate patterns or sections that could be reused

```tsx
// Warning: Component doing too much
const UserDashboard = () => {
  // 200+ lines handling user profile, notifications, settings, and analytics
};

// Fixed: Split by responsibility
const UserDashboard = () => (
  <div>
    <UserProfile />
    <NotificationPanel />
    <UserSettings />
    <AnalyticsWidget />
  </div>
);
```

### 1.2 Mixed Controlled/Uncontrolled Inputs (Warning)

Never mix controlled and uncontrolled patterns in the same form.

```tsx
// Warning: Mixed patterns in same form
const Form = () => {
  const [email, setEmail] = useState('');
  const nameRef = useRef<HTMLInputElement>(null); // Uncontrolled

  return (
    <form>
      <input value={email} onChange={(e) => setEmail(e.target.value)} /> {/* Controlled */}
      <input ref={nameRef} defaultValue="" /> {/* Uncontrolled */}
    </form>
  );
};

// Fixed: Use consistent pattern
const Form = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  return (
    <form>
      <input value={email} onChange={(e) => setEmail(e.target.value)} />
      <input value={name} onChange={(e) => setName(e.target.value)} />
    </form>
  );
};
```

### 1.3 Component Naming (Warning)

Components must use PascalCase with descriptive, meaningful names.

```tsx
// Warning: Poor naming
const Card = () => {}; // Too generic
const Data = () => {}; // What data?
const Comp1 = () => {}; // Meaningless

// Fixed: Descriptive names
const UserProfileCard = () => {};
const TransactionHistory = () => {};
const NotificationBadge = () => {};
```

---

## 2. JSX Anti-Patterns

### 2.1 Deeply Nested Ternaries (Warning)

Avoid complex conditional logic inline in JSX.

```tsx
// Warning: Nested ternaries
return (
  <div>
    {isLoading ? (
      <Spinner />
    ) : hasError ? (
      <Error />
    ) : hasData ? (
      <DataDisplay />
    ) : (
      <EmptyState />
    )}
  </div>
);

// Fixed: Extract to derived state
const renderContent = () => {
  if (isLoading) return <Spinner />;
  if (hasError) return <Error />;
  if (hasData) return <DataDisplay />;
  return <EmptyState />;
};

return <div>{renderContent()}</div>;
```

### 2.2 Inline Object/Array Literals as Props (Warning)

Avoid creating new object/array references on every render.

```tsx
// Warning: New object created every render
<Component style={{ margin: 10 }} />
<List items={[1, 2, 3]} />
<Chart options={{ animate: true, duration: 300 }} />

// Fixed: Stable references
const style = { margin: 10 };
const items = [1, 2, 3];
const chartOptions = useMemo(() => ({ animate: true, duration: 300 }), []);

<Component style={style} />
<List items={items} />
<Chart options={chartOptions} />
```

### 2.3 Business Logic in Render (Warning)

Don't perform data transformations or filtering inline in JSX.

```tsx
// Warning: Logic in render
return (
  <ul>
    {users
      .filter((u) => u.isActive)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
  </ul>
);

// Fixed: Extract to derived state
const activeUsersSorted = useMemo(
  () =>
    users
      .filter((u) => u.isActive)
      .sort((a, b) => a.name.localeCompare(b.name)),
  [users]
);

return (
  <ul>
    {activeUsersSorted.map((user) => (
      <li key={user.id}>{user.name}</li>
    ))}
  </ul>
);
```

---

## 3. State Management

### 3.1 Storing Derived State (Warning)

Never store values that can be calculated from existing state or props.

```tsx
// Warning: Derived state stored separately
const [items, setItems] = useState<Item[]>([]);
const [itemCount, setItemCount] = useState(0); // Derived!
const [hasItems, setHasItems] = useState(false); // Derived!

useEffect(() => {
  setItemCount(items.length);
  setHasItems(items.length > 0);
}, [items]);

// Fixed: Calculate on render
const [items, setItems] = useState<Item[]>([]);
const itemCount = items.length;
const hasItems = items.length > 0;

// For expensive calculations, use useMemo
const expensiveTotal = useMemo(
  () => items.reduce((sum, item) => sum + calculateValue(item), 0),
  [items]
);
```

### 3.2 Expensive State Initialization (Warning)

Use lazy initialization for expensive initial values.

```tsx
// Warning: Expensive computation runs every render
const [data, setData] = useState(expensiveComputation());
const [parsed, setParsed] = useState(JSON.parse(largeJsonString));

// Fixed: Lazy initialization
const [data, setData] = useState(() => expensiveComputation());
const [parsed, setParsed] = useState(() => JSON.parse(largeJsonString));
```

### 3.3 Duplicate State Across Components (Warning)

When siblings need the same data, lift state to their common parent.

```tsx
// Warning: Duplicate state in siblings
const Sidebar = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // ...
};

const MainPanel = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // ...
};

// Fixed: Lift state to parent
const Dashboard = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <>
      <Sidebar selectedId={selectedId} onSelect={setSelectedId} />
      <MainPanel selectedId={selectedId} />
    </>
  );
};
```

### 3.4 URL State Stored in React State (Info)

Shareable state like search params, filters, and pagination should live in the URL.

```tsx
// Info: Consider using URL state
const [searchQuery, setSearchQuery] = useState('');
const [page, setPage] = useState(1);
const [filters, setFilters] = useState<Filters>({});

// Recommended: Use URL state (e.g., nuqs, next-typesafe-url)
const [searchQuery, setSearchQuery] = useQueryState('q');
const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
```

---

## 4. Effects & Hooks

### 4.1 Missing Cleanup for Subscriptions (Critical)

Always clean up subscriptions, event listeners, and intervals.

```tsx
// Critical: Memory leak - no cleanup
useEffect(() => {
  window.addEventListener('resize', handleResize);
  const interval = setInterval(pollData, 5000);
  socket.subscribe(channel);
}, []);

// Fixed: Proper cleanup
useEffect(() => {
  window.addEventListener('resize', handleResize);
  const interval = setInterval(pollData, 5000);
  socket.subscribe(channel);

  return () => {
    window.removeEventListener('resize', handleResize);
    clearInterval(interval);
    socket.unsubscribe(channel);
  };
}, []);
```

### 4.2 Data Fetching Without Abort (Warning)

Fetch calls should use AbortController to prevent state updates on unmounted components.

```tsx
// Warning: No abort handling
useEffect(() => {
  fetch('/api/data')
    .then((res) => res.json())
    .then(setData);
}, []);

// Fixed: With AbortController
useEffect(() => {
  const controller = new AbortController();

  fetch('/api/data', { signal: controller.signal })
    .then((res) => res.json())
    .then(setData)
    .catch((err) => {
      if (err.name !== 'AbortError') throw err;
    });

  return () => controller.abort();
}, []);
```

### 4.3 State Sync That Should Be Derived (Warning)

Using useEffect to sync one state from another is usually wrong.

```tsx
// Warning: Effect syncing derived state
const [firstName, setFirstName] = useState('');
const [lastName, setLastName] = useState('');
const [fullName, setFullName] = useState('');

useEffect(() => {
  setFullName(`${firstName} ${lastName}`);
}, [firstName, lastName]);

// Fixed: Derive directly
const [firstName, setFirstName] = useState('');
const [lastName, setLastName] = useState('');
const fullName = `${firstName} ${lastName}`;
```

### 4.4 Unnecessary Effects (Warning)

Many effects should be event handlers, derived state, or removed entirely.

```tsx
// Warning: Effect that should be event handler
useEffect(() => {
  if (formSubmitted) {
    sendAnalytics('form_submit');
  }
}, [formSubmitted]);

// Fixed: Call in event handler
const handleSubmit = () => {
  setFormSubmitted(true);
  sendAnalytics('form_submit');
};

// Warning: Effect for initialization
useEffect(() => {
  initializeThirdPartyLib();
}, []);

// Consider: Move to module scope or component mount
const initialized = useRef(false);
if (!initialized.current) {
  initializeThirdPartyLib();
  initialized.current = true;
}
```

### 4.5 Missing Dependencies (Warning)

Include all referenced values in dependency arrays.

```tsx
// Warning: Missing dependency
const [count, setCount] = useState(0);
const [multiplier, setMultiplier] = useState(2);

useEffect(() => {
  console.log(count * multiplier); // multiplier is referenced but not in deps
}, [count]);

// Fixed: Include all dependencies
useEffect(() => {
  console.log(count * multiplier);
}, [count, multiplier]);
```

### 4.6 Rules of Hooks Violations (Critical)

Hooks must be called at the top level, not inside conditions, loops, or nested functions.

```tsx
// Critical: Hook in condition
const Component = ({ isEnabled }) => {
  if (isEnabled) {
    const [state, setState] = useState(false); // Violation!
  }
};

// Critical: Hook in loop
const Component = ({ items }) => {
  items.forEach((item) => {
    useEffect(() => {}, [item]); // Violation!
  });
};

// Fixed: Always call hooks unconditionally
const Component = ({ isEnabled }) => {
  const [state, setState] = useState(false);

  // Use the condition inside the hook or return early from render
  if (!isEnabled) return null;
  // ...
};
```

### 4.7 Custom Hook Naming (Warning)

Custom hooks must start with `use` prefix.

```tsx
// Warning: Missing use prefix
const fetchUserData = () => {
  const [user, setUser] = useState(null);
  useEffect(() => {
    /* fetch */
  }, []);
  return user;
};

// Fixed: Proper naming
const useUserData = () => {
  const [user, setUser] = useState(null);
  useEffect(() => {
    /* fetch */
  }, []);
  return user;
};
```

---

## 5. Performance

### 5.1 When to Use useMemo/useCallback (Warning if missing)

**USE memoization when:**

```tsx
// Expensive calculations (O(n^2) or worse, large arrays)
const sortedItems = useMemo(
  () => items.sort((a, b) => complexComparison(a, b)),
  [items]
);

// Values passed to memoized child components or effect dependencies
const config = useMemo(() => ({ theme, locale }), [theme, locale]);
<MemoizedChild config={config} />;

// Context provider values (prevents all consumers re-rendering)
const contextValue = useMemo(() => ({ user, actions }), [user, actions]);
<UserContext.Provider value={contextValue}>{children}</UserContext.Provider>;

// Callbacks passed to memoized children
const handleClick = useCallback(() => onClick(id), [onClick, id]);
<MemoizedButton onClick={handleClick} />;
```

### 5.2 When NOT to Use useMemo/useCallback (Warning if present)

**SKIP memoization when:**

```tsx
// Warning: Memoizing primitive values
const doubled = useMemo(() => count * 2, [count]); // Unnecessary

// Warning: Cheap calculations
const fullName = useMemo(() => `${first} ${last}`, [first, last]); // Unnecessary

// Warning: useCallback when child isn't memoized
const handleClick = useCallback(() => doSomething(), []);
<UnmemoizedButton onClick={handleClick} />; // Wasted overhead

// Fixed: Just use regular values/functions
const doubled = count * 2;
const fullName = `${first} ${last}`;
const handleClick = () => doSomething();
```

### 5.3 React.memo Usage (Warning)

Use React.memo for components that:

- Render frequently with the same props
- Have expensive render logic
- Are used in lists with many items

Don't use React.memo for:

- Simple components with minimal render cost
- Components that always receive new props

```tsx
// Good: Expensive list item
const UserCard = memo(({ user }: { user: User }) => {
  // Expensive rendering
  return <Card>{/* complex UI */}</Card>;
});

// Unnecessary: Simple component
const Label = memo(({ text }: { text: string }) => {
  return <span>{text}</span>; // Trivial render
});
```

### 5.4 List Keys (Critical for dynamic lists)

Never use array index as key for lists that can add, remove, or reorder items.

```tsx
// Critical: Index as key for dynamic list
{
  todos.map((todo, index) => <TodoItem key={index} todo={todo} />);
}

// Fixed: Use stable unique identifier
{
  todos.map((todo) => <TodoItem key={todo.id} todo={todo} />);
}

// OK: Index for static lists that never change
{
  STATIC_MENU_ITEMS.map((item, index) => <MenuItem key={index} item={item} />);
}
```

---

## 6. Error Handling

### 6.1 Async Error States (Warning)

Async operations must handle error states in the UI.

```tsx
// Warning: No error handling
const [data, setData] = useState(null);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  fetch('/api/data')
    .then((res) => res.json())
    .then(setData)
    .finally(() => setIsLoading(false));
}, []);

// Fixed: Complete error handling
const [data, setData] = useState(null);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<Error | null>(null);

useEffect(() => {
  fetch('/api/data')
    .then((res) => {
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    })
    .then(setData)
    .catch(setError)
    .finally(() => setIsLoading(false));
}, []);

if (error) return <ErrorMessage error={error} />;
```

### 6.2 Try-Catch in Async Handlers (Warning)

Event handlers with async operations should use try-catch.

```tsx
// Warning: Unhandled promise rejection
const handleSubmit = async () => {
  await submitForm(data);
  showSuccess();
};

// Fixed: Proper error handling
const handleSubmit = async () => {
  try {
    await submitForm(data);
    showSuccess();
  } catch (error) {
    showError(error instanceof Error ? error.message : 'Unknown error');
  }
};
```

### 6.3 Silent Catch Blocks (Warning)

Never swallow errors silently.

```tsx
// Warning: Silent catch
try {
  await riskyOperation();
} catch (e) {
  // Empty - error is lost
}

// Fixed: At minimum, log the error
try {
  await riskyOperation();
} catch (error) {
  console.error('Operation failed:', error);
  // Or: report to monitoring service
  // Or: set error state for UI
}
```

### 6.4 Error Boundaries (Info)

Consider error boundaries for critical UI sections.

```tsx
// Recommended: Wrap fallible components
<ErrorBoundary fallback={<ErrorFallback />}>
  <DataVisualization data={complexData} />
</ErrorBoundary>

// Recommended: App-level boundary
<ErrorBoundary fallback={<CrashScreen />}>
  <App />
</ErrorBoundary>
```

---

## 7. TypeScript

### 7.1 `any` in Props (Warning)

Never use `any` type in component props.

```tsx
// Warning: any in props
interface DataTableProps {
  data: any[];
  onRowClick: (row: any) => void;
}

// Fixed: Proper typing
interface DataTableProps<T> {
  data: T[];
  onRowClick: (row: T) => void;
}

// Or with specific types
interface DataTableProps {
  data: User[];
  onRowClick: (row: User) => void;
}
```

### 7.2 Event Handler Types (Warning)

Use React event types, not native DOM types.

```tsx
// Warning: Native DOM event type
const handleClick = (e: MouseEvent) => {};

// Fixed: React event type
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {};
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {};
const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {};

// Also OK: Let TypeScript infer
<button onClick={(e) => handleClick(e)} />; // e is inferred
```

### 7.3 Props Interface Naming (Info)

Props interfaces should end with `Props` suffix.

```tsx
// Info: Missing Props suffix
interface UserCard {
  user: User;
}

// Recommended
interface UserCardProps {
  user: User;
}
```

---

## 8. React Server Components (RSC)

### 8.1 Client-Only Code in Server Components (Critical)

Don't use client-only APIs in server components.

```tsx
// Critical: Client APIs in server component (no 'use client')
const ServerComponent = () => {
  const [state, setState] = useState(false); // Error: hooks
  useEffect(() => {}, []); // Error: hooks

  window.localStorage.getItem('key'); // Error: browser API

  return <button onClick={() => {}} />; // Error: event handlers
};

// Fixed: Mark as client component or remove client code
('use client');
const ClientComponent = () => {
  const [state, setState] = useState(false);
  // ...
};
```

### 8.2 Passing Non-Serializable Props (Critical)

Server components can only pass serializable data to client components.

```tsx
// Critical: Non-serializable props
const ServerParent = () => {
  const handleClick = () => console.log('clicked'); // Function

  return <ClientChild onClick={handleClick} />; // Error
};

// Fixed: Define handlers in client component
const ClientChild = () => {
  const handleClick = () => console.log('clicked');
  return <button onClick={handleClick}>Click</button>;
};
```

---

## Library-Aware Adjustments

### TanStack Query

When TanStack Query is detected:

- Skip manual loading/error state rules (Query handles this)
- Skip manual cache invalidation warnings
- Focus on query key structure and mutation patterns

### TanStack Form

When TanStack Form is detected:

- Skip controlled/uncontrolled rules for form fields
- Focus on validation patterns and field component usage

### React Hook Form

When React Hook Form is detected:

- Skip controlled input warnings (RHF uses refs)
- Focus on resolver patterns and form structure

---

## Quick Reference: Severity by Category

| Category           | Critical                                        | Warning                                     | Info                          |
| ------------------ | ----------------------------------------------- | ------------------------------------------- | ----------------------------- |
| Component Design   | -                                               | Size, mixed inputs, naming                  | -                             |
| JSX Patterns       | -                                               | Nested ternaries, inline objects, logic     | -                             |
| State Management   | -                                               | Derived state, expensive init, duplicate    | URL state                     |
| Effects            | Missing cleanup, hook rules                     | No abort, sync effects, missing deps        | -                             |
| Performance        | Dynamic list keys                               | Missing memo where needed, unnecessary memo | -                             |
| Error Handling     | -                                               | No error state, no try-catch, silent catch  | Error boundaries              |
| TypeScript         | -                                               | `any` in props, wrong event types           | Props naming                  |
| RSC                | Client code in server, non-serializable props   | -                                           | -                             |
