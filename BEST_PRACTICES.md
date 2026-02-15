# Best practices – light, scalable app (millions of users)

This doc summarizes how the app stays **light** and **scalable** so it can serve millions of users without becoming heavy or slow.

---

## 1. Lists: virtualized and paginated

- **Feed, Search, Notifications, Profile tweets** use **FlatList** (not ScrollView + map). Only visible items are rendered; the rest are unmounted. This keeps memory and CPU low even with thousands of items.
- **Pagination**: All list APIs use `page` and `limit` (e.g. 20 per page). We load more on scroll (`onEndReached`), never load the full dataset at once.
- **FlatList tuning** (where applied):
  - `initialNumToRender={10}` – first paint is fast.
  - `maxToRenderPerBatch={10}` – small batches so UI stays responsive.
  - `windowSize={10}` – only a small window of items kept in memory.
  - `removeClippedSubviews={true}` on Android – reclaims memory for off-screen rows.

---

## 2. Memoization

- **List item components** (e.g. `TweetCard`, `ProfileTweetRow`) are wrapped in **React.memo()** so they only re-render when their props change. Parent state (e.g. which video is playing) doesn’t re-render every row.
- **Stable callbacks**: `renderItem` and other list callbacks are created with **useCallback** so references don’t change every render and memoization stays effective.

---

## 3. API and token

- **No Axios**: We use native **fetch** only. Fewer dependencies and smaller bundle.
- **Token cache**: JWT is cached in memory after the first read. We don’t hit AsyncStorage on every request. Cache is cleared on login, logout, and 401 so the correct token is always used.

---

## 4. Real-time: no polling

- **Socket.IO** is used for live updates (new tweets, notifications). We do **not** poll the feed or notifications on a timer. That keeps server load and battery usage low at scale.

---

## 5. Backend alignment

- Feed, user tweets, and notifications support **page/limit** and return **pagination** metadata. The app uses this for infinite scroll and avoids over-fetching.
- Rate limiting and security (e.g. Helmet, JWT) are handled on the backend for production scale.

---

## 6. What to avoid as you grow

- **ScrollView + .map()** for long lists → use **FlatList** (or similar) with pagination.
- **Polling** for updates → use **sockets** or **focus-based refetch** where appropriate.
- **Reading token from storage on every API call** → use a small in-memory cache and invalidate on auth changes.
- **Heavy list item components** → keep rows simple and memoized; lazy-load media if needed later (e.g. images only when in view).

---

## 7. Optional next steps (when you need more scale)

- **Image sizing**: If you use a CDN (e.g. Cloudinary), request resized thumbnails in list views (e.g. `?w=400`) to reduce payload and memory.
- **Analytics/crash reporting**: Prefer lightweight SDKs and sample or batch events to avoid impacting performance.
- **Code splitting**: Use lazy loading for heavy screens (e.g. `React.lazy` + dynamic import) if the JS bundle grows.

Keeping these patterns in place will help the app stay light and ready for millions of users.
