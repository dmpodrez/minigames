# MiniGames

MiniGames project for RS School.

## Testing

Run unit and integration tests:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

The project requires at least 80% aggregate statement coverage.

## App session

The client-side application session is stored under the namespaced key:

`minigames:dmpodrez:app-session`

The application session lasts exactly 5 minutes from successful authentication.

Firebase authentication state and the MiniGames application session are treated separately.

Firebase `currentUser` is not used to restore authenticated application UI after the app session expires.
