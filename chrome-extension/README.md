# Anchor

Block websites with NFC friction. Works with the Brick LLC product.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Build the extension:

```bash
npm run build
```

## Development

Run in watch mode for auto-rebuild on changes:

```bash
npm run dev
```

## Loading in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `dist` folder in this directory
5. The extension should now appear in your toolbar!

## Usage

### Blocking Sites

1. Click the Brick extension icon in your toolbar
2. Enter a website URL or pattern (e.g., `twitter.com` or `*reddit.com*`)
3. Click "Add Blocked Site"
4. Try visiting that site - you'll see the blocked page!

### Testing Unlock Flow (Phase 4 - Coming Soon)

The unlock flow requires:

- Supabase backend setup
- Mobile app with NFC capability
- Your Brick NFC device

## Project Structure

```
chrome-extension/
├── src/
│   ├── background.ts          # Service worker for blocking logic
│   ├── popup/
│   │   ├── index.tsx          # React entry point for popup
│   │   ├── Popup.tsx          # Main popup component
│   │   ├── popup.html         # Popup HTML shell
│   │   └── popup.css          # Popup styles
│   └── blocked-page/
│       ├── index.tsx          # React entry point for blocked page
│       ├── BlockedPage.tsx    # Blocked page component
│       ├── blocked.html       # Blocked page HTML shell
│       └── blocked.css        # Blocked page styles
├── manifest.json              # Extension manifest
├── webpack.config.js          # Webpack build configuration
└── tsconfig.json             # TypeScript configuration
```

## Features Implemented

✅ Website blocking using declarativeNetRequest API
✅ Add/remove blocked sites via popup
✅ Beautiful blocked page UI with unlock request button
✅ React-based frontend
✅ TypeScript throughout

## Coming Soon

- Supabase integration for syncing blocked sites
- Real-time unlock approval via NFC device
- Temporary unlock timers
- Element-level blocking (e.g., YouTube sidebar)
- Granular blocking rules
