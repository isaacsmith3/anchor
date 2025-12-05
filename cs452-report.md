# Anchor - Final Project Report

## Summary

Anchor is a cross-platform website blocking application designed to help users maintain focus by creating real friction when accessing distracting websites. The system consists of a Chrome extension that blocks websites using declarativeNetRequest APIs, a React Native mobile app, and a Next.js web application—all synchronized in real-time through Supabase. Users can create custom blocking modes with specific website lists and schedule automatic blocking sessions, creating intentional friction that prevents impulsive browsing and scrolling.

## Diagrams, Demo Video or GIF

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT APPLICATIONS                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │ Chrome Extension │  │   Mobile App     │  │    Web App       │   │
│  │                  │  │                  │  │                  │   │
│  │ • Blocks sites   │  │ • View sessions  │  │ • Landing page   │   │
│  │ • Manage modes   │  │ • Control block  │  │ • Auth pages     │   │
│  │ • Schedules      │  │ • NFC unlock     │  │                  │   │
│  └────────┬─────────┘  └────────-┬────────┘  └──-─────-─┬───────┘   │
│           │                      │                      │           │
│           │                      │                      │           │
│           │ Auth & Sync          │ Auth & Sync          │ Auth      │
│           │ Read/Write           │ Read/Write           │ Read      │
│           │ Real-time            │ Real-time            │           │
│           │                      │                      │           │
└───────────┼──────────────────────┼──────────────────────┼───────────┘
            │                      │                      │
            │                      │                      │
            ▼                      ▼                      ▼
┌────────────────────────────────────────────────────────────────────-─┐
│                        SUPABASE BACKEND                              │
├───────────────────────────────────────────────────────────────────-──┤
│                                                                      │
│  ┌──────────────────┐      ┌──────────────────┐                      │
│  │  Authentication  │──────│  PostgreSQL DB   │                      │
│  │                  │      │                  │                      │
│  │ • Email/Password │      │ • blocking_      │                      │
│  │ • Sessions       │      │   sessions       │                      │
│  │ • Token Refresh  │      │ • schedules      │                      │
│  └──────────────────┘      └────────┬─────────┘                      │
│                                     │                                │
│                                     │ Change Events                  │
│                                     ▼                                │
│                          ┌──────────────────┐                        │
│                          │ Realtime Engine  │                        │
│                          │                  │                        │
│                          │ • WebSockets     │                        │
│                          │ • Push Updates   │                        │
│                          └────────┬─────────┘                        │
│                                   │                                  │
│                                   │ Real-time Updates                │
│                                   │                                  │
└───────────────────────────────────┼──────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
            ┌───────────────┐              ┌───────────────┐
            │ Chrome Ext    │              │  Mobile App   │
            │ (receives     │              │ (receives     │
            │  updates)     │              │  updates)     │
            └───────────────┘              └───────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL DEVICES                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────┐                                               │
│  │  NFC Brick       │◄─── NFC Tap (future feature) ──── Mobile App  │ 
│  │  Device          │                                               │
│  │  (Physical       │                                               │
│  │   Unlock Token)  │                                               │
│  └──────────────────┘                                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow: Real-Time Synchronization

```
User Action: Start Blocking Session
    │
    ▼
┌─────────────────────┐
│ Chrome Extension   │
│                    │
│ 1. Update local    │
│    blocking rules  │
│                    │
│ 2. Save to local   │
│    storage         │
└─────────┬──────────┘
          │
          │ Create Session Record
          ▼
┌─────────────────────┐
│  Supabase Backend   │
│                     │
│ 3. Insert into      │
│    blocking_sessions│
│                     │
│ 4. Broadcast change │
│    event via        │
│    WebSocket        │
└─────────┬───────────┘
          │
          ├──────────────────────┬──────────────────────┐
          │                      │                      │
          ▼                      ▼                      ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│ Chrome Extension│   │   Mobile App    │   │   Other Devices │
│                 │   │                 │   │                 │
│ 5. Receive      │   │ 5. Receive      │   │ 5. Receive      │
│    real-time    │   │    real-time    │   │    real-time    │
│    update       │   │    update       │   │    update       │
│                 │   │                 │   │                 │
│ 6. Update UI    │   │ 6. Update UI    │   │ 6. Update UI    │
│   (confirmation)│   │    (show active)│   │                 │
└─────────────────┘   └─────────────────┘   └─────────────────┘

Result: All devices stay synchronized in real-time
```

## What Did You Learn in This Project?

I learned the intricacies of Manifest V3, including declarativeNetRequest APIs for blocking websites, service workers for background processing, and the complexities of managing state across extension components (popup, background, content scripts). I also learned the intricacies of Supabase's PostgreSQL change streams, event-driven architectures, and handling race conditions when multiple devices update the same state simultaneously. I also learned how to design shared data models, handle platform-specific constraints, and maintain consistent UX patterns across different interaction paradigms. I also learned how to implement Row Level Security (RLS) policies in Supabase, designing efficient database schemas for blocking sessions and schedules, and ensuring proper authentication flows across all platforms. I also learned how to manage blocking state that needs to persist locally (for offline functionality), sync to cloud (for cross-device), and respond to real-time updates required careful orchestration to prevent conflicts and ensure data consistency.

## Does Your Project Integrate with AI in Any Interesting Way?

No, Anchor does not currently integrate with AI. The project focuses on creating intentional friction through physical and digital barriers rather than using AI to predict or adapt to user behavior. However, there are interesting opportunities for future AI usage, such as:

- Analyzing browsing patterns to suggest optimal blocking schedules
- Detecting when users are most likely to be distracted
- Personalized website categorization based on user behavior

## How Did You Use AI to Assist in Building Your Project?

I used AI to generate boilerplate code for Chrome extension message passing, Supabase real-time subscription setup, and React Native component structures, significantly accelerating initial development. I also used AI to assist in understanding and implementing complex APIs like Chrome's declarativeNetRequest and Supabase's real-time channels, translating documentation into working code. I also used AI to make the UI and the design schema. I learned that managing context is key to using AI effectively. It gets easier with more good code you have in your database.

## Why This Project is Interesting to You

This project is interesting to me because it a real world application of what we used in class. The application is also something I'm very interested in and that I'm using myself. The internet is becoming a more distracted place and it's cool to build something that helps people stay focused. It's also unique as I don't know of any other projects that tackle this specifically.

## Key Learnings from the Project

1. **Real-Time Sync Requires Careful Conflict Resolution**: When multiple devices can modify the same state (like starting/stopping blocking sessions), you need robust conflict resolution strategies. I learned to implement "last write wins" with proper timestamps, handle race conditions where one device starts a session while another stops it, and use Supabase's real-time subscriptions to immediately propagate changes while preventing infinite sync loops.

2. **Chrome Extension State Management is Complex**: Unlike web apps, Chrome extensions have multiple execution contexts (popup, background service worker, content scripts) that don't share memory. I learned to use `chrome.storage.local` for persistence, `chrome.runtime.sendMessage` for communication, and handle the asynchronous nature of all extension APIs. The service worker lifecycle (it can be terminated and restarted) required careful state restoration logic.

3. **Cross-Platform Authentication Consistency**: Maintaining authenticated sessions across Chrome extension, mobile app, and web app using Supabase Auth required understanding token refresh mechanisms, handling session expiration gracefully, and ensuring that authentication state changes in one platform are reflected in others. I implemented session persistence in Chrome storage and proper token refresh logic to handle long-running extension sessions.

4. **Scheduled Blocking Requires Robust Background Processing**: Implementing scheduled blocking sessions that automatically start at specified times required using Chrome's `alarms` API, handling timezone conversions, checking schedules every minute, and ensuring the extension remains functional even when the browser is closed. This taught me about Chrome extension lifecycle management and background task scheduling.

## Technical Architecture & System Design

### Authentication

- **Supabase Auth**: All platforms use Supabase authentication with email/password
- **Session Management**: Sessions are stored locally (Chrome storage for extension, AsyncStorage for mobile) and automatically refreshed
- **Row Level Security (RLS)**: Database tables use RLS policies ensuring users can only access their own data
- **Token Refresh**: Automatic token refresh handles long-running sessions without requiring re-authentication

### Real-Time Synchronization

- **Supabase Realtime Channels**: Each platform subscribes to PostgreSQL change streams filtered by `user_id`
- **Event-Driven Updates**: INSERT, UPDATE, and DELETE events on `blocking_sessions` table trigger immediate UI updates
- **Conflict Prevention**: Sync flags prevent infinite loops when local changes trigger Supabase updates that would trigger local updates
- **Offline Support**: Local state persists in Chrome storage, allowing blocking to work offline; sync occurs when connection is restored

### Performance Characteristics

- **Efficient Blocking**: Uses Chrome's `declarativeNetRequest` API which operates at the browser's network layer, providing near-instantaneous blocking without JavaScript overhead
- **Minimal Network Usage**: Real-time subscriptions use WebSocket connections that only send deltas when data changes
- **Lazy Loading**: Modes and schedules are loaded on-demand when users navigate to those views
- **Background Processing**: Schedule checking runs every minute via Chrome alarms, with minimal resource usage

### Scaling Characteristics

- **Supabase Backend**: Leverages Supabase's managed PostgreSQL and real-time infrastructure, which scales automatically
- **Stateless Extension**: Chrome extension service worker is stateless, allowing it to scale with Chrome's architecture
- **Database Indexing**: Proper indexes on `user_id` and `is_active` columns ensure fast queries even with many users
- **Horizontal Scaling**: Each platform can scale independently; the shared Supabase backend handles coordination

### Concurrency

- **Multi-Device Support**: Multiple devices can view the same blocking session simultaneously through real-time subscriptions
- **Session Management**: Only one active blocking session per user is allowed; starting a new session automatically deactivates any existing session
- **Atomic Updates**: Supabase transactions ensure that session state changes are atomic, preventing race conditions
- **Optimistic UI Updates**: UI updates optimistically while waiting for Supabase confirmation, with rollback on failure

### Failover Strategy

- **Local-First Architecture**: Blocking rules are stored locally in Chrome storage, so blocking continues to work even if Supabase is unavailable
- **Graceful Degradation**: If real-time sync fails, the extension falls back to periodic polling
- **Error Recovery**: Failed Supabase operations are logged but don't break local functionality; retry logic handles transient network issues
- **Session Restoration**: On extension restart, active sessions are restored from both local storage and Supabase to ensure consistency

### Database Schema

- **blocking_sessions**: Stores active and historical blocking sessions with mode information, timestamps, and active status
- **schedules**: Stores recurring blocking schedules with time, days of week, and associated mode
- **RLS Policies**: All tables have RLS enabled with policies ensuring users can only access their own records
- **Automatic Timestamps**: Triggers automatically update `updated_at` timestamps on record changes

## Teams Post

[Teams Post Link](<https://teams.microsoft.com/l/message/19:ac4bc382e82e4ef6a3b61989d55cf4b8@thread.tacv2/1764633098505?tenantId=c6fc6e9b-51fb-48a8-b779-9ee564b40413&groupId=89222c8a-2991-4873-8d7d-10b1cacaebf4&parentMessageId=1764633098505&teamName=CS%20452%20001%20(Fall%202025)&channelName=Report%20-%20Project%20Pitch&createdTime=1764633098505>)


---

## Work Log

| Date     | Work                    | Hours  |
| -------- | ----------------------- | ------ |
| 10/27/25 | Initial ideation        | 2      |
| 10/30/25 | Talking to customers    | 1      |
| 10/31/25 | Talking to customers    | 2      |
| 11/1/25  | Initial design and code | 4      |
| 11/4/25  | Talking to customers    | 1      |
| 11/7/25  | More code               | 5      |
| 11/8/25  | Talking to customers    | 0.5    |
| 11/11/25 | Ditch current, ideate   | 1      |
| 11/12/25 | Pitch, plan, work       | 4      |
| 11/14/25 | Supabase, mobile app    | 5      |
| 11/17/25 | NFC reader research     | 1      |
| 11/21/25 | Supabase realtime       | 2.5    |
| 11/22/25 | Web app                 | 2      |
| 11/24/25 | Extension               | 1      |
| 11/27/25 | Code                    | 3      |
| 11/28/25 | Code                    | 3      |
| 11/29/25 | Code                    | 1      |
| 11/29/25 | Final touches           | 1      |
|          | **Total**               | **39** |


