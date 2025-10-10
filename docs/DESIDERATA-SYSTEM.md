# Desiderata Request System

## Overview

The desiderata (preferred dates) request system manages employee scheduling preferences with complex date calculations, public holiday adjustments, and priority-based selection limits.

## Core Definitions

### Day Classifications

- **Working Days**: Monday through Thursday
- **Weekend Days**: Friday through Sunday

### Period Types

Periods can have different statuses:
- `open-desiderata`: Period is open for desiderata requests
- `open-holiday`: Period is open only for holiday requests
- `closed`: Period is closed for all requests

## Implementation Steps

### STEP 1: Calculate Base Availability

For each scheduling period, the system counts:
- **Available Working Days**: Count of Monday-Thursday within the period
- **Available Weekend Days**: Count of Friday-Sunday within the period

Example:
```
Period: Jan 1 - Jan 31, 2025
Raw Working Days: 18 (Mon-Thu)
Raw Weekend Days: 13 (Fri-Sun)
```

### STEP 2: Apply Public Holiday Adjustments

Public holidays affect availability based on which day they fall on:

| Holiday Day | Working Days Adjustment | Weekend Days Adjustment |
|-------------|------------------------|-------------------------|
| Monday      | -1                     | -1                     |
| Tuesday     | -2                     | -1                     |
| Wednesday   | -1                     | -1                     |
| Thursday    | -2                     | -1                     |
| Friday      | 0                      | -1                     |
| Saturday    | 0                      | -1                     |
| Sunday      | 0                      | -1                     |

**Example Calculation**:
```
Period: Jan 1 - Jan 31, 2025
Raw Working Days: 18
Raw Weekend Days: 13

Public Holidays:
- Jan 6 (Monday): -1 working, -1 weekend
- Jan 21 (Tuesday): -2 working, -1 weekend

Final Available Working Days: 18 - 1 - 2 = 15
Final Available Weekend Days: 13 - 1 - 1 = 11
```

### STEP 3: Mandatory Weekend Selection Rules

#### Weekend Start Rule

**IF** period begins on Friday **OR** the Thursday immediately before the period is a public holiday
**THEN** the entire weekend period (Friday-Sunday) must be selected as a unit

```typescript
// Example: Period starts on Friday, Jan 3
// User MUST select Jan 3, 4, 5 together (cannot select just Friday)
```

#### Weekend End Rule

**IF** period ends on Sunday **OR** the Monday immediately after is a public holiday **OR** the Tuesday immediately after is a public holiday
**THEN** the entire extended period through that holiday must be selected as a unit

```typescript
// Example 1: Period ends on Sunday, Jan 5
// User MUST select the full Friday-Sunday weekend

// Example 2: Period ends on Thursday, Jan 9, and Monday Jan 13 is a holiday
// User MUST extend selection to include Monday Jan 13
```

#### Working Day Rule

Working days not affected by weekend rules can be selected individually or as continuous date ranges.

### STEP 4: User Interface - Draggable Availability Panel

The system displays a draggable panel showing:

```
┌─────────────────────────────────┐
│ 📅 Available Days               │
│ Period: Jan 1 - Jan 31, 2025    │
│ Priority: 2                      │
├─────────────────────────────────┤
│ 🕐 Working Days:     8 / 15      │
│ ████████░░░░░░░ 53%             │
│ Remaining: 7                     │
├─────────────────────────────────┤
│ 📅 Weekend Days:     4 / 11      │
│ ███████░░░░░░░░ 36%             │
│ Remaining: 7                     │
├─────────────────────────────────┤
│ Total Available: 26 days         │
│ Public Holidays: 2               │
└─────────────────────────────────┘
```

The panel:
- Is draggable anywhere on screen
- Updates in real-time as selections are made
- Shows progress bars with color coding:
  - Green (0-59%): Safe
  - Yellow (60-79%): Approaching limit
  - Orange (80-99%): Near limit
  - Red (100%+): Limit exceeded

### STEP 5: Selection Limits (Base)

Maximum selections are calculated as:
- **Maximum working days** = floor(Available Working Days ÷ 2)
- **Maximum weekend days** = floor(Available Weekend Days ÷ 2)

Example:
```
Available Working Days: 15
Maximum Selectable: floor(15 ÷ 2) = 7 working days

Available Weekend Days: 11
Maximum Selectable: floor(11 ÷ 2) = 5 weekend days
```

### STEP 6: Priority-Based Restrictions

The system implements a two-tier priority system:

#### Priority 1 (Highest Priority)
- **Maximum working days** = floor(Available Working Days ÷ 4)
- **Maximum weekend days** = floor(Available Weekend Days ÷ 4)

#### Priority 2+ (Lower Priorities)
- **Maximum working days** = floor(Available Working Days ÷ 2)
- **Maximum weekend days** = floor(Available Weekend Days ÷ 2)

**Example Comparison**:
```
Available: 16 working days, 12 weekend days

Priority 1 User:
- Max working: floor(16 ÷ 4) = 4 days
- Max weekend: floor(12 ÷ 4) = 3 days

Priority 2 User:
- Max working: floor(16 ÷ 2) = 8 days
- Max weekend: floor(12 ÷ 2) = 6 days
```

## Validation & Error Handling

### Real-Time Validation

The system validates selections immediately:

1. **Exceeding Working Days Limit**
   ```
   Error: "Working days limit exceeded: 9/8 days"
   ```

2. **Exceeding Weekend Days Limit**
   ```
   Error: "Weekend days limit exceeded: 7/6 days"
   ```

3. **Mandatory Weekend Violation**
   ```
   Error: "Period starts on Friday - entire weekend must be selected"
   ```

4. **Approaching Limit Warnings**
   ```
   Warning: "Working days limit reached"
   ```

### Auto-Extension

When users select dates that trigger mandatory weekend rules, the system:
1. Automatically extends the selection
2. Shows a notification explaining why
3. Updates the availability panel
4. Validates against limits

```typescript
// User clicks Friday, Jan 3
// System auto-extends to Sunday, Jan 5
// Toast: "Selection extended due to mandatory weekend rules"
```

## Technical Implementation

### Core Functions

```typescript
// Calculate availability with holiday adjustments
calculatePeriodAvailability(period, holidays): DesiderataAvailability

// Calculate limits based on priority
calculatePriorityLimits(availability, priority): PriorityLimits

// Validate a selection
validateSelection(startDate, endDate, period, holidays, priority): SelectionValidation

// Auto-extend for mandatory weekends
autoExtendForMandatoryWeekend(startDate, endDate, period, holidays)

// Check weekend rules
checkMandatoryWeekendStart(period, holidays): MandatoryWeekendExtension
checkMandatoryWeekendEnd(period, holidays): MandatoryWeekendExtension
```

### React Hook

```typescript
const desiderata = useDesiderataSelection({
  periods,
  holidays,
  userPriority: currentUser?.priority || 2,
});

// Usage
const validation = desiderata.validateNewSelection(startDate, endDate);
const extension = desiderata.applyMandatoryExtension(startDate, endDate);
```

## Test Cases

### Edge Case 1: Period Starting on Friday with Holidays

```
Scenario:
- Period: Dec 27, 2024 (Friday) - Jan 5, 2025 (Sunday)
- Public Holiday: Jan 1 (Wednesday)

Expected Behavior:
1. Period starts on Friday → Mandatory weekend selection (Dec 27-29)
2. Jan 1 holiday adjustments: -1 working day, -1 weekend day
3. User selecting Dec 27 auto-extends to Dec 29
```

### Edge Case 2: Maximum Period with Priority 1

```
Scenario:
- Period: 20 working days, 10 weekend days (30 total)
- User: Priority 1
- Public Holidays: 1 Tuesday (affects 2 working + 1 weekend)

Calculations:
- Available Working: 20 - 2 = 18
- Available Weekend: 10 - 1 = 9
- Max Working (P1): floor(18 ÷ 4) = 4
- Max Weekend (P1): floor(9 ÷ 4) = 2

Expected: User can select maximum 4 working days + 2 weekend days
```

### Edge Case 3: Boundary Monday/Tuesday Holiday

```
Scenario:
- Period ends: Thursday, Jan 9
- Monday, Jan 13: Public Holiday
- User selects: Jan 7-9

Expected Behavior:
1. System checks: Monday after period is holiday
2. Auto-extends selection to Jan 13
3. Recalculates day counts including extension
4. Validates against limits
```

### Edge Case 4: Minimum Period

```
Scenario:
- Period: Just 1 week (4 working days, 3 weekend days)
- Priority 2 user

Calculations:
- Max Working: floor(4 ÷ 2) = 2
- Max Weekend: floor(3 ÷ 2) = 1

Expected: User can select 2 working days + 1 weekend day maximum
```

## User Experience Flow

1. **User clicks date in desiderata period**
   - Availability panel appears
   - Shows current limits and usage

2. **User clicks second date to complete range**
   - System checks mandatory weekend rules
   - Auto-extends if needed (with notification)
   - Validates against priority limits
   - Shows errors if limits exceeded
   - Shows warnings if approaching limits

3. **Modal opens if valid**
   - User can create event
   - Panel remains visible showing updated usage

4. **Real-time feedback**
   - Progress bars update
   - Colors change based on usage percentage
   - Remaining days display updates

## Files Modified/Created

### New Files
- `src/utils/desiderataUtils.ts` - Core calculation functions
- `src/hooks/useDesiderataSelection.ts` - React hook for desiderata logic
- `src/components/calendar/DesiderataAvailabilityPanel.tsx` - Draggable UI panel

### Modified Files
- `src/components/Calendar.tsx` - Integrated desiderata logic
- `src/types/user.ts` - Added priority field
- `src/i18n/translations/*.ts` - Added translations

## Configuration

Users can be assigned different priorities in the system:
- Priority is stored in `User.priority` field
- Default priority: 2 (if not specified)
- Priority 1 users get more restrictive limits (÷4 instead of ÷2)

## Future Enhancements

1. **Saved Selections Tracking**: Currently uses empty array, should load from existing events
2. **Period-Specific Rules**: Allow different divisors per period
3. **Override Capabilities**: Admin override for mandatory rules
4. **Historical Analytics**: Track desiderata usage over time
5. **Conflict Resolution**: Handle overlapping requests between users
