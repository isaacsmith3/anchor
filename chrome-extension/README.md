# Anchor

Block websites with NFC friction. Works with the Brick LLC product.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure Supabase:

   - Create a `.env` file in the `chrome-extension` directory (or set environment variables)
   - Add your Supabase credentials:
     ```
     SUPABASE_URL=https://your-project.supabase.co
     SUPABASE_ANON_KEY=your-anon-key-here
     ```
   - You can find these in your Supabase project settings under API
   - Alternatively, you can directly edit `src/lib/supabase.ts` and replace the placeholder values

3. Build the extension:

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

### Authentication

1. Click the Anchor extension icon in your toolbar
2. Sign up with your email and password, or sign in if you already have an account
3. Your session will be saved and you'll stay logged in across browser restarts

### Blocking Sites

1. After signing in, click the Anchor extension icon
2. Go to the "Modes" tab to create a new blocking mode
3. Enter a mode name and add websites to block (e.g., `youtube.com`)
4. Switch to the "Blocking" tab to activate a mode
5. Try visiting a blocked site - you'll see the blocked page!

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
│   ├── lib/
│   │   └── supabase.ts        # Supabase client configuration
│   ├── popup/
│   │   ├── index.tsx          # React entry point for popup
│   │   ├── Popup.tsx          # Main popup component
│   │   ├── Auth.tsx           # Authentication component (login/signup)
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
✅ Supabase authentication (sign up/login)
✅ Session persistence across browser restarts
✅ User profiles linked to Supabase auth

## Supabase Setup

The extension requires a Supabase project with:

1. **Auth enabled** - Email/password authentication
2. **Profiles table** with the following schema:
   ```sql
   CREATE TABLE profiles (
     id UUID REFERENCES auth.users(id) PRIMARY KEY,
     email TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```
3. **Trigger to auto-create profiles**:

   ```sql
   CREATE OR REPLACE FUNCTION public.handle_new_user()
   RETURNS TRIGGER AS $$
   BEGIN
     INSERT INTO public.profiles (id, email)
     VALUES (NEW.id, NEW.email);
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;

   CREATE TRIGGER on_auth_user_created
     AFTER INSERT ON auth.users
     FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
   ```

## Coming Soon

- Supabase integration for syncing blocked sites across devices
- Real-time unlock approval via NFC device
- Temporary unlock timers
- Element-level blocking (e.g., YouTube sidebar)
- Granular blocking rules
