# Periodic Ping System Setup Guide

This guide will help you set up the periodic ping system for stroke patients.

## Database Migration

1. Run the SQL migration to create the required tables:
   ```bash
   # Connect to your Supabase database and run:
   psql -h [your-supabase-host] -U postgres -d postgres -f supabase-migration-periodic-pings.sql
   ```

   Or use the Supabase Dashboard:
   - Go to SQL Editor in your Supabase project
   - Copy and paste the contents of `supabase-migration-periodic-pings.sql`
   - Click "Run"

## Environment Variables

Add the following to your `.env` file:

```bash
# Cron Secret (generate a random string)
CRON_SECRET=your-secret-key-here-change-this

# Supabase Service Role Key (for server-side operations)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-from-supabase
```

To get your `SUPABASE_SERVICE_ROLE_KEY`:
1. Go to Supabase Dashboard
2. Navigate to Settings > API
3. Copy the "service_role" key (keep this secret!)

## Cron Job Setup

### Option 1: Vercel Cron (Recommended for Production)

The `vercel.json` file is already configured to run the ping processor every 5 minutes.

To enable:
1. Deploy to Vercel
2. The cron job will automatically run
3. Set the `CRON_SECRET` environment variable in Vercel dashboard

### Option 2: External Cron Service

If not using Vercel, you can use any cron service (e.g., cron-job.org, EasyCron):

1. Set up a cron job to call your endpoint every 5-15 minutes:
   ```
   https://your-domain.com/api/process-pings
   ```

2. Add the `Authorization` header with your CRON_SECRET:
   ```
   Authorization: Bearer your-secret-key-here
   ```

### Option 3: Local Development

For testing locally, you can manually trigger the ping processor:

```bash
curl -X GET http://localhost:3000/api/process-pings \
  -H "Authorization: Bearer your-secret-key-here"
```

## How to Use

### For Caregivers:

1. **Set Up Therapy Words**:
   - Go to the Caregiver Dashboard
   - Click the "Therapy Words" tab
   - Select a patient
   - Enter comma-separated words (e.g., "Apple, Water, Hello, Yes, No")
   - Click "Save Therapy Words"

2. **Create Ping Schedules**:
   - Go to the "Schedules" tab in the Caregiver Dashboard
   - Select a patient
   - Choose ping type:
     - **Hunger Check**: Asks "Are you hungry?"
     - **Therapy Prompt**: Randomly selects a word from the therapy list
     - **Wellness Check**: Asks "How are you feeling?"
   - Set frequency in minutes (minimum 15)
   - Click "Create Schedule"

3. **Manage Schedules**:
   - View all active schedules
   - Pause/Resume schedules as needed
   - Delete schedules that are no longer needed

### For Patients:

1. **Check-In Page**:
   - Patients will receive notifications when pings are sent
   - Navigate to `/check-in` to see pending check-ins
   - Tap "Start" to record their response
   - For therapy prompts, they'll see the target word and an icon
   - For hunger/wellness checks, they can respond with voice

2. **Voice Responses**:
   - The system automatically records for up to 10 seconds
   - Patients can stop early by tapping "Stop"
   - Therapy responses are scored automatically
   - Hunger/wellness responses are transcribed

## Testing

1. **Create a Test Schedule**:
   - As a caregiver, create a schedule with a short frequency (e.g., 15 minutes)
   - Wait for the cron job to run (every 5 minutes)

2. **Check Notifications**:
   - You should see a notification in the Caregiver Dashboard
   - The patient will see a pending check-in at `/check-in`

3. **Verify Responses**:
   - Patient responds to the ping
   - Caregiver can see the notification is completed
   - Check the database to verify `ping_responses` table has the data

## Database Tables

The system creates these tables:

- `therapy_word_lists`: Custom word lists for each patient
- `therapy_sessions`: History of therapy practice sessions
- `patient_ping_schedule`: Configured ping schedules
- `ping_responses`: Patient responses to pings

## API Endpoints

- `GET /api/therapy-words?patientId=...` - Get therapy word lists
- `POST /api/therapy-words` - Create a new word list
- `PATCH /api/therapy-words` - Update a word list
- `GET /api/ping-schedule?patientId=...` - Get ping schedules
- `POST /api/ping-schedule` - Create a new schedule
- `PATCH /api/ping-schedule` - Update a schedule
- `DELETE /api/ping-schedule?scheduleId=...` - Delete a schedule
- `GET /api/process-pings` - Process pending pings (called by cron)

## Troubleshooting

### Pings Not Being Sent

1. Check that the cron job is running (check Vercel logs or your cron service)
2. Verify `CRON_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` are set correctly
3. Check that schedules are marked as `active: true`
4. Verify the `next_ping_at` timestamp is in the past

### Notifications Not Showing

1. Check that the patient has linked caregivers in `patient_caregivers` table
2. Verify real-time subscriptions are enabled in Supabase
3. Check browser console for errors

### Therapy Words Not Working

1. Ensure a word list is marked as `is_active: true`
2. Verify the word list has at least one word
3. Check that the caregiver is linked to the patient

## Future Enhancements

- SMS/Email notifications when pings are sent
- Analytics dashboard showing response rates and therapy progress
- Customizable ping messages
- Time-based schedules (e.g., only during certain hours)
- Reminder escalation if patient doesn't respond
