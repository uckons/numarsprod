# Fix Timer and Order List Issues - Testing Guide

## Overview
This document provides a comprehensive testing guide for the timer and order list fixes implemented in this PR.

## Changes Summary

### Backend Changes
1. **timer.service.js** - Fixed `stopTimer` function
   - Now saves therapist_name and room_name to order_items when timer stops
   - Checks if all timers are finished for an order
   - Updates order status to DRAFT when all timers complete
   - Added warning log for skipped updates on PAID orders

2. **order.controller.js** - Fixed `getKasirOrders` query
   - Includes therapist_name and room_name from order_items
   - Removed dependency on timers table for therapist/room data

3. **Database Migration** 
   - Added migration 003_add_therapist_room_to_order_items.sql
   - Adds columns: therapist_name, room_name, service_name, subtotal to order_items

### Frontend Changes
1. **TimeCard.vue**
   - Fixed extend endpoint from `/timers/extend/{id}` to `/timers/{id}/extend`
   - Display time shows "SELESAI" when timer reaches zero

2. **KasirDashboard.vue**
   - Fixed `stopTimer` with proper error handling and Swal notifications
   - Fixed `syncTimers` to properly assign timer data
   - Fixed `updateCountdown` to show notification when timer completes
   - Removed duplicate functions (handleExtend, confirmExtend, extendTimer)

3. **KasirOrders.vue** - Already correctly displays therapist and room from items

## Testing Checklist

### Prerequisites
1. Ensure PostgreSQL is running
2. Run database migrations:
   ```bash
   cd database
   node run-migrations.js
   ```
3. Start backend server:
   ```bash
   cd backend
   npm start
   ```
4. Start frontend dev server:
   ```bash
   cd frontend
   npm run dev
   ```

### Test Cases

#### 1. Manual Stop Timer
**Steps:**
1. Login as kasir/cashier
2. Navigate to Kasir Dashboard
3. Click "Start" on any empty timer slot
4. Select service, therapist, and room
5. Wait for timer to start running
6. Click "Stop" button on the running timer

**Expected Results:**
- Success notification appears: "Timer berhasil dihentikan dan masuk ke order list"
- Timer slot becomes empty
- Navigate to "Daftar Order" and verify:
  - Order appears with status "DRAFT"
  - Therapist name is displayed correctly
  - Room name is displayed correctly
  - Service name and quantity are correct

**Failure Case:**
- If timer not found, error dialog shows: "Timer tidak ditemukan"
- If API fails, error dialog shows with specific error message

#### 2. Automatic Timer Completion
**Steps:**
1. Start a timer with a very short duration (e.g., 2 minutes)
2. Wait for countdown to reach 00:00:00
3. Observe the notification

**Expected Results:**
- When timer reaches zero, notification appears with:
  - Title: "⏰ Timer Selesai"
  - Shows therapist name and service name
  - Message: "Timer telah selesai dan masuk ke order list"
- Timer automatically syncs and slot becomes empty
- Order appears in "Daftar Order" as DRAFT

#### 3. Extend Timer
**Steps:**
1. Start a timer
2. While timer is running, click "Extend" button
3. Confirm the extend action

**Expected Results:**
- Confirmation dialog appears
- After confirming:
  - Success notification: "Waktu berhasil ditambahkan"
  - Timer duration increases
  - Order quantity increases in order_items
- If extend fails, error dialog shows with error message

#### 4. Order List Display
**Steps:**
1. Create multiple orders with timers
2. Stop some timers manually
3. Let some timers complete automatically
4. Navigate to "Daftar Order"

**Expected Results:**
- All orders display correctly with:
  - Service name and quantity
  - Therapist name (not "-" if assigned)
  - Room name (not "-" if assigned)
  - Correct total amount
  - Status badge (DRAFT or PAID)
- Orders without therapist/room show "-" in respective columns

#### 5. Multiple Timers for Same Order
**Steps:**
1. Create an order with multiple services
2. Start timers for different services in the same order
3. Stop one timer manually
4. Verify order status is still "ACTIVE" or not "DRAFT"
5. Stop all remaining timers
6. Verify order status changes to "DRAFT"

**Expected Results:**
- Order status only changes to DRAFT when ALL timers are finished
- Each timer stop saves therapist and room to respective order_items

#### 6. Checkout from Order List
**Steps:**
1. Create a DRAFT order (timer completed)
2. Go to "Daftar Order"
3. Click "PAY" button on the DRAFT order
4. Complete checkout process

**Expected Results:**
- Redirects to POS checkout page with order pre-loaded
- After payment, order status changes to "PAID"
- Order displays with green "PAID" badge

### Edge Cases to Test

1. **Timer without therapist/room**: Start timer without selecting therapist or room
   - Should still save to order_items with NULL values
   - Order list should show "-" for empty fields

2. **Network failure during stop**: Disconnect network, try to stop timer
   - Should show error notification
   - Timer state should remain unchanged

3. **Multiple rapid clicks on Stop**: Click Stop button multiple times quickly
   - Should only process once
   - Should not cause duplicate requests

4. **Timer already finished**: Try to stop a timer that already finished
   - Should handle gracefully with appropriate message

## Database Verification

After testing, verify database state:

```sql
-- Check order_items have therapist and room names
SELECT 
  oi.id,
  oi.order_id,
  oi.service_name,
  oi.therapist_name,
  oi.room_name,
  oi.qty,
  oi.subtotal
FROM order_items oi
ORDER BY oi.id DESC
LIMIT 10;

-- Check orders status after timer completion
SELECT 
  o.id,
  o.status,
  o.total,
  COUNT(t.id) as timer_count,
  COUNT(CASE WHEN t.status = 'RUNNING' THEN 1 END) as running_timers
FROM orders o
LEFT JOIN timers t ON t.order_id = o.id
GROUP BY o.id
ORDER BY o.created_at DESC
LIMIT 10;
```

## Known Limitations

1. Order list refreshes every 30 seconds - timer completion may not show immediately
2. Timer countdown updates every 1 second - may have slight delay
3. Extend timer adds full service duration - cannot customize extend amount

## Troubleshooting

### Issue: Therapist/Room names not showing in order list
**Solution:** 
- Check database columns exist: `SELECT * FROM order_items LIMIT 1;`
- Run migrations if columns missing: `node database/run-migrations.js`

### Issue: Timer won't stop
**Solution:**
- Check backend logs for errors
- Verify timer exists in database: `SELECT * FROM timers WHERE status = 'RUNNING';`
- Check network connectivity

### Issue: Order status not changing to DRAFT
**Solution:**
- Verify all timers are finished: `SELECT * FROM timers WHERE order_id = X;`
- Check order is not already PAID
- Review backend logs for warnings

## Security Summary

All changes have been scanned with CodeQL and no security vulnerabilities were found.

## Conclusion

All critical timer and order list issues have been addressed:
- ✅ Stop timer saves therapist and room data
- ✅ Order list displays therapist and room names
- ✅ Timer completion notifications work correctly
- ✅ Extend timer uses correct endpoint
- ✅ Order status updates to DRAFT when all timers finish
