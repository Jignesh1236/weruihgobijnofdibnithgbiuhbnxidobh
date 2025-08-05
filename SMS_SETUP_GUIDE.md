# SMS Setup Guide - SANTMEGH Computer Education

## Current Status
आपका SMS system ready है, लेकिन real SMS भेजने के लिए SMS provider का API key चाहिए।

## SMS Providers Options (Indian Services)

### 1. MSG91 (Recommended for India)
**Website:** https://msg91.com/
**Cost:** ₹0.15-0.25 per SMS
**Setup:**
```bash
SMS_PROVIDER=msg91
MSG91_API_KEY=your_api_key_here
MSG91_SENDER_ID=your_sender_id
```

### 2. Fast2SMS (Popular & Cheap)
**Website:** https://www.fast2sms.com/
**Cost:** ₹0.10-0.20 per SMS
**Setup:**
```bash
SMS_PROVIDER=fast2sms
FAST2SMS_API_KEY=your_api_key_here
```

### 3. TextLocal (Reliable)
**Website:** https://www.textlocal.in/
**Cost:** ₹0.15-0.30 per SMS
**Setup:**
```bash
SMS_PROVIDER=textlocal
TEXTLOCAL_API_KEY=your_api_key_here
TEXTLOCAL_SENDER=your_sender_name
```

### 4. Twilio (International)
**Website:** https://www.twilio.com/
**Cost:** $0.02-0.05 per SMS
**Setup:**
```bash
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_number
```

## How to Setup

### Step 1: Choose SMS Provider
1. Visit any provider website above
2. Sign up and verify your account
3. Get API credentials from dashboard

### Step 2: Add Environment Variables
In Replit, go to "Secrets" tab and add:
```
SMS_PROVIDER=msg91
MSG91_API_KEY=your_actual_api_key
MSG91_SENDER_ID=SANTME
```

### Step 3: Test SMS
1. Go to Fees Management page
2. Click "Send Reminder" on any student
3. Check if real SMS is sent to mobile

## Current Features Working
✓ Individual SMS reminders
✓ Bulk SMS reminders  
✓ Professional message template
✓ Error handling and fallback
✓ Console logging for testing

## बिना API Key के भी System Ready है
- सभी SMS features working हैं
- Console में SMS logs show हो रहे हैं
- API key add करते ही real SMS चलना शुरू हो जाएगा

## Recommendation
**MSG91** or **Fast2SMS** best है Indian education institutes के लिए:
- Cheap rates
- Good delivery
- Easy setup
- DND compliance