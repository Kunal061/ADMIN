# Pagination Feature - Users Section

## Overview
Added pagination to the Users Management page to display 15 users per page for better performance and usability.

## Features Implemented

### 1. **Pagination Controls**
- Shows 15 users per page
- Previous/Next navigation buttons
- Page number buttons with smart display logic
- Current page highlighting
- Disabled state for first/last page navigation

### 2. **Smart Page Display**
The pagination shows:
- First page
- Last page
- Current page
- One page before and after current page
- Ellipsis (...) for skipped pages

Example: `1 ... 4 5 6 ... 15` (when on page 5)

### 3. **Pagination Info**
Displays text showing:
```
Showing 1 to 15 of 30 users
Showing 16 to 30 of 30 users
```

### 4. **Auto-Reset**
- Pagination resets to page 1 when search query changes
- Ensures users don't end up on empty pages after filtering

### 5. **Responsive Design**
- Matches the existing design system (teal color: #06B3C4)
- Hover effects on page buttons
- Disabled button states
- Clean border separation

## Technical Details

### State Variables
```typescript
const [currentPage, setCurrentPage] = useState(1);
const ITEMS_PER_PAGE = 15;
```

### Pagination Logic
```typescript
const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
const endIndex = startIndex + ITEMS_PER_PAGE;
const paginatedUsers = filtered.slice(startIndex, endIndex);
```

### Navigation Icons
- `ChevronLeft` - Previous page
- `ChevronRight` - Next page

## UI Components

### Pagination Bar Location
Located at the bottom of the users table, separated by a border:
- Left side: Info text
- Right side: Navigation controls

### Button States
1. **Active page**: Teal background (#06B3C4), white text, bold
2. **Inactive pages**: Gray background, gray text
3. **Disabled nav buttons**: 50% opacity, not clickable

## User Experience

### Workflow
1. User loads page → Shows first 15 users
2. Click page number → Jumps to that page
3. Click Next → Goes to next 15 users
4. Search for users → Automatically resets to page 1
5. Pagination only shows if more than 15 users exist

### Edge Cases Handled
- ✅ Less than 15 users → No pagination shown
- ✅ Exactly 15 users → No pagination shown
- ✅ 16+ users → Pagination appears
- ✅ Search results < 15 → No pagination
- ✅ Changing search → Resets to page 1
- ✅ Last page with fewer items → Shows correct count

## Testing Checklist
- [x] Pagination appears when > 15 users
- [x] Page navigation works correctly
- [x] First/last buttons disable appropriately
- [x] Page numbers highlight correctly
- [x] Search resets pagination
- [x] User count displays correctly
- [x] Edit/Delete work on all pages
- [x] Responsive on mobile

## Future Enhancements
- Add "Jump to page" input field
- Add "Show X per page" dropdown (10, 15, 25, 50)
- Remember last page in localStorage
- Keyboard navigation (arrows keys)
- URL parameter for page number
