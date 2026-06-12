# Heartbeat System Documentation

## Overview

The voicebox application now includes a client-side "heartbeat" system that periodically pings stroke patients with alternating prompts:
- **Hunger checks**: "Are you hungry?"
- **Therapy prompts**: Random words from a customizable word list

This is a pure frontend system - no server-side cron jobs required!

## How It Works

### Client-Side Heartbeat (`useHeartbeat` hook)

The heartbeat system runs entirely in the patient's browser using JavaScript timers:

1. **Timer System**: Checks every 10 seconds if it's time for a prompt
2. **Alternating Prompts**: Automatically alternates between hunger checks and therapy prompts
3. **Therapy Words**: Loads from the active word list (set by caregiver) or uses defaults
4. **Configurable Interval**: Default is 2 minutes (adjustable in code)

### Key Components

**`hooks/useHeartbeat.ts`**
- Core heartbeat logic
- Manages timing and prompt generation
- Loads therapy words from API
- Alternates between prompt types

**`components/HeartbeatPrompt.tsx`**
- Full-screen overlay that appears when a prompt triggers
- Includes microphone recording
- Shows therapy word icons
- Provides audio transcription and therapy scoring

### Integration

**Patient View (`app/page.tsx`)**
```tsx
const [heartbeatEnabled, setHeartbeatEnabled] = useState(false);

// Auto-enable in victim mode
if (mode === 'victim') {
  setHeartbeatEnabled(true);
}

useHeartbeat({
  enabled: heartbeatEnabled,
  intervalMinutes: 2, // Adjust this value
  onPrompt: (prompt) => {
    setCurrentHeartbeatPrompt(prompt);
  }
});
```

## Configuration

### Adjust Heartbeat Interval

Edit `app/page.tsx`:
```tsx
useHeartbeat({
  enabled: heartbeatEnabled,
  intervalMinutes: 60, // Change to desired minutes
  onPrompt: (prompt) => {
    setCurrentHeartbeatPrompt(prompt);
  }
});
```

Common intervals:
- Testing: 1-2 minutes
- Frequent: 30 minutes
- Standard: 60 minutes (hourly)
- Relaxed: 120 minutes (every 2 hours)

### Default Therapy Words

Default words are defined in `hooks/useHeartbeat.ts`:
```tsx
const [therapyWords, setTherapyWords] = useState<string[]>([
  'Apple', 'Water', 'Hello', 'Yes', 'No', 'Please', 'Thank you', 'Help', 'Good', 'Food'
]);
```

These are used if no custom word list is set by the caregiver.

## Caregiver Features

### Managing Therapy Words

Caregivers can customize therapy words via the dashboard:

1. Go to **Caregiver Dashboard** > **Therapy Words** tab
2. Select a patient
3. Enter comma-separated words (e.g., "Apple, Water, Hello, Yes, No")
4. Click "Save Therapy Words"

The active word list will automatically be used by the heartbeat system.

### Sending Manual Therapy Prompts

Caregivers can also send therapy prompts on-demand:

1. Go to **Therapy Words** tab
2. Select a patient
3. Click **"Send Therapy Prompt Now"**
4. A random word from the active list is sent to the patient
5. Patient receives a notification with the therapy word

This creates a notification that the patient can respond to immediately.

## Patient Experience

### Automatic Prompts

When a heartbeat prompt triggers:

1. A full-screen overlay appears
2. For **hunger checks**: Shows "Are you hungry?" with a food emoji
3. For **therapy prompts**: Shows the word and an icon to help visualize it
4. Patient taps the microphone to respond
5. System records audio (auto-stops after 10 seconds)
6. For therapy: Speech is scored for clarity
7. For hunger: Response is transcribed
8. Feedback is shown, then overlay auto-dismisses

### Dismissing Prompts

Patients can:
- Click "Skip" to dismiss without responding
- Click the X button in the top right
- Complete the prompt to auto-dismiss after feedback

## Database Tables

The system uses these tables for caregiver-managed features:

### `therapy_word_lists`
```sql
- id: UUID
- patient_id: UUID
- caregiver_id: UUID
- words: TEXT[] (array of therapy words)
- is_active: BOOLEAN
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

Only one list per patient should be `is_active: true` at a time.

### `therapy_sessions` (optional tracking)
```sql
- session_id: UUID
- patient_id: UUID
- word_list_id: UUID
- target_word: TEXT
- transcribed_text: TEXT
- score_data: JSONB
- completed: BOOLEAN
- triggered_by: TEXT ('manual' | 'scheduled_ping' | 'caregiver_request')
- created_at: TIMESTAMP
- completed_at: TIMESTAMP
```

## API Endpoints

### Therapy Words Management

**GET `/api/therapy-words?patientId={id}`**
- Fetches all word lists for a patient
- Returns active and inactive lists

**POST `/api/therapy-words`**
- Creates a new word list
- Automatically deactivates other lists if `isActive: true`

**PATCH `/api/therapy-words`**
- Updates an existing word list
- Can change words or active status

### Therapy Scoring

**POST `/api/therapy-score`**
- Accepts audio file and target word
- Returns clarity, speed, correctness scores
- Used by heartbeat prompts and therapy page

## Advantages of Client-Side Heartbeat

✅ **No server infrastructure needed**
- No cron jobs or scheduled tasks
- No worker processes
- Zero backend complexity

✅ **Instant activation**
- Starts as soon as patient opens the app
- No deployment or configuration required

✅ **Reliable**
- Runs in patient's browser
- Not affected by server downtime
- No missed pings due to server issues

✅ **Adjustable per patient**
- Can be customized in code or made configurable per user
- Easy to test with short intervals

## Limitations

⚠️ **Requires app to be open**
- Only works when patient has the app open in their browser
- No pings when app is closed
- Consider push notifications for background pings (future enhancement)

⚠️ **Timer accuracy**
- JavaScript timers can drift slightly over time
- Not suitable for precise medical timing requirements
- Good enough for general check-ins

## Future Enhancements

### Possible Improvements

1. **Web Push Notifications**
   - Send prompts even when app is closed
   - Requires service worker and push notification setup

2. **Time-Based Scheduling**
   - Only ping during waking hours (e.g., 8 AM - 10 PM)
   - Skip nighttime hours

3. **Response History**
   - Track how often patient responds vs. skips
   - Show caregiver response rates

4. **Customizable Prompts**
   - Let caregivers write custom questions
   - Add more prompt types beyond hunger/therapy

5. **Smart Timing**
   - Reduce frequency if patient is actively using the app
   - Increase frequency during inactive periods

## Troubleshooting

### Prompts Not Appearing

1. Check that victim mode is enabled (or `heartbeatEnabled` is true)
2. Verify the interval isn't too long (set to 1-2 minutes for testing)
3. Check browser console for errors
4. Ensure patient has active session

### Therapy Words Not Loading

1. Check that caregiver has created a word list
2. Verify word list is marked `is_active: true`
3. Check network tab for API errors
4. Falls back to default words if none found

### Audio Not Recording

1. Check microphone permissions in browser
2. Verify HTTPS (microphone requires secure context)
3. Test with browser's built-in mic test
4. Check browser console for errors

## Testing

### Quick Test

1. Open app in victim mode
2. Set `intervalMinutes: 0.5` (30 seconds) in code
3. Wait for first prompt
4. Respond and verify scoring/transcription works
5. Wait for next prompt and verify it alternates

### Production Testing

1. Set realistic interval (e.g., 60 minutes)
2. Test with real patients
3. Monitor response rates
4. Adjust interval based on feedback

