# Feed like real Twitter + real-time updates

## All done

### Backend (tweetweb)

- **GET /api/tweets/feed?feedType=forYou|following**
  - **following**: only tweets from people you follow (+ your own). Chronological.
  - **forYou**: mixed feed = tweets from following + **suggested** tweets (from everyone else, sorted by engagement: likes, retweets, views). New users still see posts.
- **Socket.io**: when a tweet is created, backend emits **newTweet** to all connected clients.

### App (mytweet)

- **For You tab** → calls `feedType=forYou`. **Following tab** → calls `feedType=following`.
- **Polling**: every 20s fetches feed and **prepends only new** tweets (no full refresh).
- **Socket.io**: connects to backend and listens for **newTweet**; prepends that tweet immediately so the feed updates in real time when anyone posts.
