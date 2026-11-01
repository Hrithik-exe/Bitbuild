import { Home } from '../home/Home';

/**
 * Public homepage (`/`). The experience lives in src/home; this file stays as the
 * route entry so src/main.tsx and every existing route are unchanged.
 */
export function HomePage() {
  return <Home />;
}
