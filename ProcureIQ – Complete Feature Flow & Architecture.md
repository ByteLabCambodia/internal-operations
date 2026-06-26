# ProcureIQ – Complete Feature Flow & Architecture

## Table of Contents
1. [System Overview](#system-overview)
2. [Authentication & User Flow](#authentication--user-flow)
3. [Dashboard Flow](#dashboard-flow)
4. [Procurement Module Flow](#procurement-module-flow)
5. [Inventory Module Flow](#inventory-module-flow)
6. [Accounting Module Flow](#accounting-module-flow)
7. [Reports Module Flow](#reports-module-flow)
8. [Admin Panel Flow](#admin-panel-flow)
9. [Telegram Mini App Flow](#telegram-mini-app-flow)
10. [Theme & Styling Flow](#theme--styling-flow)
11. [Data Flow & Relationships](#data-flow--relationships)
12. [Key Business Rules](#key-business-rules)
13. [Integration Points](#integration-points-ready-for-supabase)

---

## System Overview

ProcureIQ is an enterprise procurement, inventory, and accounting management system with four user roles and comprehensive workflows across three main modules.

**Core Modules:**
- **Procurement** — Purchase Requests and Purchase Orders
- **Inventory** — Items, Categories, Stock Requests, Claims
- **Accounting** — Transactions, Journal Entries, Income, Exchange Rates

**Supporting Modules:**
- **Dashboard** — KPI cards, charts, activity feed
- **Reports** — Exportable summaries and analytics
- **Admin** — User management, audit logs, settings
- **Telegram Mini App** — Mobile-optimized experience

---

## Authentication & User Flow

### Login Flow

1. User visits the application
2. Clicks "Continue with Manus OAuth" button
3. Redirected to Manus OAuth provider
4. User authenticates with credentials
5. OAuth callback returns user info (openId, email, name)
6. System creates/updates user record in database
7. Session cookie is set (HTTP-only, secure)
8. User redirected to dashboard based on role

### User Roles & Permissions

#### Employee
- Can create Purchase Requests
- Can create Stock Requests
- Can view own requests
- Can view Dashboard (read-only)
- Cannot approve or manage others' requests

#### Manager
- All Employee permissions
- Can approve/reject Purchase Requests
- Can create Purchase Orders
- Can manage Items & Categories
- Can approve/reject Stock Requests
- Can approve/reject Inventory Claims
- Can view all requests
- Cannot access Accounting module

#### Finance
- Can view all Procurement data (read-only)
- Can create Transactions
- Can create Journal Entries
- Can create Income Entries
- Can manage Exchange Rates
- Can view all Accounting data
- Cannot approve PRs or manage inventory

#### Admin
- Full access to all modules
- Can manage users and assign roles
- Can view audit logs
- Can configure system settings
- Can manage all data

### Role-Based Navigation

The sidebar dynamically shows menu items based on user role:
- **Employee**: Dashboard, Purchase Requests, Stock Requests, Reports
- **Manager**: All of above + Purchase Orders, Items, Categories, Claims
- **Finance**: Dashboard, Transactions, Journal Entries, Income, Exchange Rates, Reports
- **Admin**: All modules + Users, Audit Logs, Settings

---

## Dashboard Flow

### KPI Cards Display

The dashboard shows five key performance indicators:

#### 1. Pending Purchase Requests
- **Query**: Count PRs where status = "pending"
- **Display**: Large number with icon
- **Action**: Click to view pending PRs list
- **Trend**: Shows count change vs previous week

#### 2. Pending Payments
- **Query**: Count POs where paymentStatus ≠ "paid"
- **Display**: Large number with icon
- **Action**: Click to view unpaid POs
- **Trend**: Shows count change vs previous week

#### 3. Inventory Value
- **Query**: Sum of (items.stockQty × items.unitCost) for all active items
- **Display**: Currency amount (USD)
- **Action**: Click to view inventory breakdown
- **Trend**: Shows percentage change vs previous month

#### 4. Monthly Expense
- **Query**: Sum of transactions where type = "expense" and transactionDate in current month
- **Display**: Currency amount (USD)
- **Action**: Click to view expense breakdown
- **Trend**: Shows percentage change vs previous month (↑ red if increased, ↓ green if decreased)

#### 5. Cash Balance
- **Query**: Sum of (income - expense) transactions
- **Display**: Currency amount (USD)
- **Action**: Click to view cash flow details
- **Trend**: Shows percentage change vs previous month

### Charts Generation

#### Monthly Expenses Chart (Bar Chart)
- **Type**: Recharts BarChart
- **Data**: Last 6 months of expense transactions
- **X-Axis**: Month names (Jan, Feb, Mar, Apr, May, Jun)
- **Y-Axis**: Total expenses in USD
- **Interaction**: Hover shows exact amount, click to drill down
- **Update**: Recalculates when new transactions added

#### Cash Flow Trend (Line Chart)
- **Type**: Recharts ComposedChart with two lines
- **Green Line**: Total income by month
- **Red Line**: Total expense by month
- **Data**: Last 6 months
- **Interaction**: Hover shows both values, legend toggles lines
- **Update**: Real-time as transactions recorded

#### Expenses by Category (Donut Chart)
- **Type**: Recharts PieChart
- **Data**: Transactions grouped by category
- **Segments**: Each category as a colored segment
- **Legend**: Shows category names and percentages
- **Interaction**: Click segment to filter transactions
- **Update**: Recalculates when transactions changed

#### Spending by Department (Horizontal Bar Chart)
- **Type**: Recharts BarChart (layout="vertical")
- **Data**: Transactions grouped by department
- **Y-Axis**: Department names
- **X-Axis**: Total spending in USD
- **Interaction**: Hover shows exact amount
- **Update**: Recalculates when transactions changed

### Activity Feed

The activity feed shows recent events in chronological order:

**Event Types:**
1. **PR Submitted** — Employee created new PR
   - Icon: Clipboard
   - Message: "{Employee} submitted PR-{number}"
   - Timestamp: Creation time

2. **PR Approved** — Manager approved PR
   - Icon: Check circle
   - Message: "{Manager} approved PR-{number}"
   - Timestamp: Approval time

3. **PR Rejected** — Manager rejected PR
   - Icon: X circle
   - Message: "{Manager} rejected PR-{number}"
   - Timestamp: Rejection time

4. **PO Created** — Manager created PO
   - Icon: Shopping cart
   - Message: "{Manager} created PO-{number}"
   - Timestamp: Creation time

5. **Payment Recorded** — Finance recorded payment
   - Icon: Credit card
   - Message: "{Finance} recorded payment for PO-{number}"
   - Timestamp: Payment time

6. **Claim Approved** — Manager approved claim
   - Icon: Package
   - Message: "{Manager} approved claim CLM-{number}"
   - Timestamp: Approval time

7. **Stock Fulfilled** — Manager fulfilled stock request
   - Icon: Warehouse
   - Message: "{Manager} fulfilled SR-{number}"
   - Timestamp: Fulfillment time

**Feed Features:**
- Shows last 10 events
- Filters by date range
- Filters by event type
- Search by user or PR/PO/Claim number

### Notifications Panel

The notifications panel shows active alerts:

#### Low Stock Alerts
- **Trigger**: When item.stockQty < item.reorderPoint
- **Display**: Yellow warning badge
- **Message**: "{Item name} is below reorder point ({current} pcs remaining)"
- **Action**: Click to view item or create stock request
- **Dismiss**: Mark as read or create PR

#### Pending Approvals
- **Trigger**: When PRs/Claims awaiting manager action
- **Display**: Blue info badge
- **Message**: "{Count} items awaiting your approval"
- **Action**: Click to view approval list
- **Update**: Real-time as approvals completed

#### System Alerts
- **Trigger**: On errors, warnings, or important events
- **Display**: Red error badge or orange warning badge
- **Message**: Specific error or warning message
- **Action**: Click for details
- **Dismiss**: Auto-dismiss after 5 seconds or manual close

---

## Procurement Module Flow

### Purchase Request (PR) Creation

#### Step 1: Open PR Form
1. Employee clicks "New Purchase Request" button
2. Form dialog opens with fields:
   - Department (required, dropdown)
   - Project (optional, text)
   - Currency (required, dropdown: USD, EUR, KHR, CNY, THB)
   - Exchange Rate (auto-filled from current rates, editable)
   - Notes (optional, textarea)

#### Step 2: Add Line Items
1. Employee clicks "Add Item" button
2. Line item form appears with fields:
   - Item Name (required, text)
   - Description (optional, textarea)
   - Quantity (required, number)
   - Unit Price (required, decimal)
   - Unit Type (required, dropdown: pcs, box, kg, etc.)

3. System auto-calculates:
   - Total Price = Quantity × Unit Price
   - Display updates in real-time

4. Employee can:
   - Add multiple items (click "Add Item" again)
   - Edit item (click pencil icon)
   - Delete item (click trash icon)
   - Reorder items (drag and drop)

#### Step 3: Review & Submit
1. Employee reviews:
   - All items and quantities
   - Total amount (sum of all line items)
   - Currency and exchange rate
   - Department and project

2. Employee clicks "Submit PR" button
3. System validates:
   - At least one line item
   - All required fields filled
   - Quantities and prices are positive

4. On validation success:
   - PR record created in database
   - PR number generated (PR-{timestamp})
   - Status set to "pending"
   - Exchange rate locked (cannot change)
   - Created timestamp recorded
   - Requester ID recorded

5. On validation error:
   - Error message displayed
   - User corrects and resubmits

#### Step 4: Notification
1. System sends notification to all managers
2. Notification includes:
   - PR number
   - Requester name
   - Department
   - Total amount
   - Link to view PR

### PR Approval Workflow

#### Manager Views PR List
1. Manager clicks "Purchase Requests" in sidebar
2. List displays all PRs with filters:
   - Status filter: All, Pending, Approved, Rejected, Converted
   - Search by PR number, requester, department
   - Sort by date, amount, status

3. Each row shows:
   - PR number (clickable)
   - Requester name
   - Department
   - Total amount
   - Status badge (color-coded)
   - Created date
   - Action buttons (View, Approve, Reject)

#### Manager Reviews PR Details
1. Manager clicks PR number or "View" button
2. Detail page shows:
   - Header with PR number, status badge, requester info
   - Department and project
   - Currency and exchange rate
   - Line items table:
     - Item name, description, quantity, unit price, total price
   - Total amount (sum of line items)
   - Notes section
   - Approval history (if previously approved/rejected)
   - Action buttons: Approve, Reject

#### Manager Approves PR
1. Manager clicks "Approve" button
2. Optional approval notes dialog appears
3. Manager can add notes and clicks "Confirm Approve"
4. System updates:
   - PR status = "approved"
   - approvedById = current manager ID
   - approvedAt = current timestamp
   - Saves to database

5. Notifications sent:
   - To requester: "Your PR-{number} has been approved"
   - To all managers: "{Manager} approved PR-{number}"

6. PR now available for conversion to PO

#### Manager Rejects PR
1. Manager clicks "Reject" button
2. Rejection reason dialog appears (required field)
3. Manager enters reason and clicks "Confirm Reject"
4. System updates:
   - PR status = "rejected"
   - rejectedById = current manager ID
   - rejectedAt = current timestamp
   - rejectionReason = entered reason
   - Saves to database

5. Notifications sent:
   - To requester: "Your PR-{number} has been rejected: {reason}"
   - To all managers: "{Manager} rejected PR-{number}"

6. PR cannot be converted to PO

### Purchase Order (PO) Creation

#### Option 1: Convert from Approved PR
1. Manager views approved PR
2. Manager clicks "Convert to PO" button
3. PO form pre-fills with:
   - PR items and quantities
   - PR total amount
   - PR currency and exchange rate
   - Linked PR ID

#### Option 2: Create Standalone PO
1. Manager clicks "New Purchase Order" button
2. PO form opens with empty fields

#### PO Form Fields
- Supplier Name (required, text)
- Currency (required, dropdown)
- Exchange Rate (auto-filled, editable)
- Notes (optional, textarea)
- Line items:
  - Item name (required)
  - Description (optional)
  - Quantity Ordered (required)
  - Unit Price (required)
  - Unit Type (required)
  - Link to Inventory Item (optional, for tracking)

#### Manager Submits PO
1. Manager reviews all fields
2. Manager clicks "Create PO" button
3. System validates:
   - Supplier name provided
   - At least one line item
   - All quantities and prices positive

4. On success:
   - PO record created
   - PO number generated (PO-{timestamp})
   - paymentStatus = "unpaid"
   - claimStatus = "pending"
   - createdById = manager ID
   - createdAt = current timestamp
   - If converted from PR: PR status updated to "converted"

5. Notifications sent:
   - To finance: "New PO-{number} created, awaiting payment"
   - To all managers: "{Manager} created PO-{number}"

### PO Payment Tracking

#### Finance Views PO List
1. Finance clicks "Purchase Orders" in sidebar
2. List displays all POs with filters:
   - Payment status: All, Unpaid, Partial, Paid
   - Claim status: All, Pending, Partial, Completed
   - Search by PO number, supplier
   - Sort by date, amount, status

3. Each row shows:
   - PO number (clickable)
   - Supplier name
   - Total amount
   - Payment status badge (red=unpaid, yellow=partial, green=paid)
   - Claim status badge
   - Created date
   - Action buttons

#### Finance Updates Payment Status
1. Finance clicks PO number or "View" button
2. Detail page shows:
   - Header with PO number, supplier, status badges
   - Line items table with quantities
   - Total amount
   - Current payment status
   - Payment section with:
     - Status dropdown (unpaid, partial, paid)
     - Receipt upload field
     - Payment notes
     - Update button

3. Finance selects new status:
   - **Unpaid** → **Partial**: Partial payment made
   - **Partial** → **Paid**: Full payment completed
   - Can also go backwards if needed

4. Finance can upload receipt:
   - Click "Upload Receipt" button
   - Select image or PDF file
   - System stores file in S3
   - Records file URL and key

5. Finance clicks "Update Payment" button
6. System updates:
   - paymentStatus = selected status
   - receiptUrl = uploaded file URL (if provided)
   - receiptKey = uploaded file key (if provided)
   - updatedAt = current timestamp
   - Saves to database

7. Notifications sent:
   - To managers: "Payment recorded for PO-{number}: {status}"
   - To admin: "PO-{number} payment status updated"

---

## Inventory Module Flow

### Item Management

#### View Items List
1. Manager clicks "Items" in sidebar
2. List displays all active items with columns:
   - Item name (clickable)
   - SKU
   - Category
   - Current Stock Qty
   - Reorder Point
   - Stock Status (green if ≥ reorder point, red if below)
   - Unit Cost
   - Currency
   - Actions (Edit, Deactivate)

3. Filters available:
   - Category dropdown
   - Search by name or SKU
   - Show inactive items toggle

4. Sorting available:
   - By name, SKU, category, stock qty, reorder point

#### Create Item
1. Manager clicks "New Item" button
2. Form dialog opens with fields:
   - Item Name (required, text)
   - SKU (optional, text)
   - Category (required, dropdown)
   - Unit Type (required, dropdown: pcs, box, kg, etc.)
   - Current Stock Qty (required, number, default=0)
   - Reorder Point (required, number, default=0)
   - Unit Cost (required, decimal, default=0)
   - Currency (required, dropdown, default=USD)
   - Description (optional, textarea)

3. Manager clicks "Create Item" button
4. System validates:
   - Item name provided
   - Category selected
   - Stock qty and reorder point are non-negative

5. On success:
   - Item record created
   - ID auto-generated
   - isActive = true
   - createdAt = current timestamp
   - Item appears in list

6. On error:
   - Validation error message displayed
   - Manager corrects and resubmits

#### Edit Item
1. Manager clicks item name or "Edit" button
2. Detail page shows all item fields
3. Manager can modify:
   - Item name, SKU, category
   - Unit type, stock qty, reorder point
   - Unit cost, currency, description
   - isActive toggle

4. Manager clicks "Save Changes" button
5. System validates and updates:
   - All fields updated
   - updatedAt = current timestamp
   - Changes saved to database

6. If stock qty changed:
   - System logs change in audit trail
   - Notification sent to managers

#### Deactivate Item
1. Manager clicks item
2. Manager toggles "Active" switch to OFF
3. System updates:
   - isActive = false
   - Item hidden from normal list (but visible with "Show inactive" toggle)
   - Cannot be used in new PRs or POs

---

## Category Management

#### View Categories
1. Manager clicks "Categories" in sidebar
2. List displays all categories with columns:
   - Category name (clickable)
   - Item count (number of items in category)
   - Description
   - Actions (Edit, Delete)

#### Create Category
1. Manager clicks "New Category" button
2. Form dialog opens with fields:
   - Category Name (required, text)
   - Description (optional, textarea)

3. Manager clicks "Create Category" button
4. System validates and creates:
   - Category record created
   - ID auto-generated
   - createdAt = current timestamp

5. Category appears in list and item category dropdown

#### Edit Category
1. Manager clicks category name or "Edit" button
2. Detail page shows category fields
3. Manager can modify:
   - Category name
   - Description

4. Manager clicks "Save Changes" button
5. System updates and saves to database

---

## Stock Request Flow

### Employee Creates Stock Request

#### Step 1: Open Stock Request Form
1. Employee clicks "New Stock Request" button
2. Form dialog opens with fields:
   - Item (required, searchable dropdown)
   - Quantity (required, number)
   - Priority (required, dropdown: Low, Medium, High, Urgent)
   - Department (optional, text)
   - Notes (optional, textarea)

#### Step 2: Select Item
1. Employee clicks Item dropdown
2. Dropdown shows all active items:
   - Item name
   - Current stock qty
   - Reorder point
   - Stock status indicator

3. Employee selects item
4. Form shows:
   - Item name
   - Current stock qty
   - Unit type

#### Step 3: Enter Quantity & Priority
1. Employee enters quantity needed
2. Employee selects priority:
   - Low: Non-urgent, can wait
   - Medium: Normal priority
   - High: Needed soon
   - Urgent: Needed immediately

3. Employee can add notes/justification

#### Step 4: Submit Request
1. Employee clicks "Submit Request" button
2. System validates:
   - Item selected
   - Quantity is positive
   - Priority selected

3. On success:
   - Stock request record created
   - Request number generated (SR-{timestamp})
   - Status = "pending"
   - requesterId = employee ID
   - createdAt = current timestamp
   - Saved to database

4. Notifications sent:
   - To managers: "New stock request SR-{number} from {Employee}"
   - To employee: "Stock request submitted successfully"

### Stock Request Approval

#### Manager Views Pending Requests
1. Manager clicks "Stock Requests" in sidebar
2. List displays all requests with filters:
   - Status: All, Pending, Approved, Rejected, Fulfilled
   - Priority: All, Low, Medium, High, Urgent
   - Search by request number, item, requester

3. Each row shows:
   - Request number
   - Item name
   - Quantity requested
   - Priority badge (color-coded)
   - Requester name
   - Status badge
   - Created date
   - Action buttons: View, Approve, Reject, Fulfill

#### Manager Approves Request
1. Manager clicks request number or "View" button
2. Detail page shows:
   - Request number, item, quantity, priority
   - Current stock level
   - Requester and department
   - Notes
   - Action buttons

3. Manager clicks "Approve" button
4. System updates:
   - Status = "approved"
   - approvedById = manager ID
   - approvedAt = current timestamp
   - Saved to database

5. Notifications sent:
   - To employee: "Your stock request SR-{number} has been approved"
   - To managers: "{Manager} approved SR-{number}"

#### Manager Fulfills Request
1. Manager clicks "Fulfill" button
2. Fulfillment dialog appears with:
   - Quantity to fulfill (pre-filled with requested qty)
   - Fulfillment notes (optional)
   - Confirm button

3. Manager can modify quantity if partial fulfillment
4. Manager clicks "Confirm Fulfill" button
5. System updates:
   - Status = "fulfilled"
   - item.stockQty -= quantity (inventory decremented)
   - fulfilledAt = current timestamp
   - Saved to database

6. Notifications sent:
   - To employee: "Your stock request SR-{number} has been fulfilled"
   - To managers: "Stock request SR-{number} fulfilled"

#### Manager Rejects Request
1. Manager clicks "Reject" button
2. Rejection reason dialog appears (required)
3. Manager enters reason and clicks "Confirm Reject"
4. System updates:
   - Status = "rejected"
   - rejectionReason = entered reason
   - Saved to database

5. Notifications sent:
   - To employee: "Your stock request SR-{number} has been rejected: {reason}"

---

## Inventory Claims Flow

### Employee Creates Claim

#### Step 1: Open Claim Form
1. Employee clicks "New Claim" button
2. Form dialog opens with fields:
   - Purchase Order (required, searchable dropdown)
   - Receiving Notes (optional, textarea)

#### Step 2: Select PO
1. Employee clicks PO dropdown
2. Dropdown shows all open POs:
   - PO number
   - Supplier name
   - Total amount
   - Items in PO

3. Employee selects PO
4. Form shows:
   - PO number, supplier, total amount
   - Line items table with:
     - Item name, qty ordered, qty already claimed, remaining qty

#### Step 3: Specify Arrived Quantities
1. For each line item, employee enters:
   - Quantity Arrived (required, number)
   - Item Notes (optional, textarea)

2. Employee can claim:
   - Full quantity (all items)
   - Partial quantity (some items or partial qty)
   - Multiple claims for same PO (receive in batches)

#### Step 4: Submit Claim
1. Employee clicks "Submit Claim" button
2. System validates:
   - PO selected
   - At least one item with qty > 0
   - Qty arrived ≤ qty remaining

3. On success:
   - Claim record created
   - Claim number generated (CLM-{timestamp})
   - Status = "pending"
   - claimedById = employee ID
   - createdAt = current timestamp
   - Claim items created for each line item
   - Saved to database

4. Notifications sent:
   - To managers: "New inventory claim CLM-{number} awaiting approval"
   - To employee: "Claim submitted successfully"

### Claim Approval

#### Manager Views Pending Claims
1. Manager clicks "Claims" in sidebar
2. List displays all claims with filters:
   - Status: All, Pending, Approved, Rejected
   - Search by claim number, PO number, supplier

3. Each row shows:
   - Claim number
   - PO number and supplier
   - Items count
   - Claimed by (employee name)
   - Status badge
   - Created date
   - Progress bar (% of items claimed)
   - Action buttons: View, Approve, Reject

#### Manager Reviews Claim
1. Manager clicks claim number or "View" button
2. Detail page shows:
   - Claim number, PO reference, supplier
   - Claimed by (employee name)
   - Receiving notes
   - Line items table:
     - Item name, qty ordered, qty arrived, qty remaining
     - Item notes
   - Status badge
   - Action buttons: Approve, Reject

#### Manager Approves Claim
1. Manager clicks "Approve" button
2. Approval confirmation dialog appears
3. Manager can add approval notes and clicks "Confirm Approve"
4. System updates:
   - Claim status = "approved"
   - approvedById = manager ID
   - approvedAt = current timestamp
   - For each claimed item:
     - item.stockQty += qtyArrived (inventory increased)
     - poItem.qtyClaimed += qtyArrived
   - If all items fully claimed:
     - PO claimStatus = "completed"
   - Saved to database

5. Notifications sent:
   - To employee: "Your claim CLM-{number} has been approved"
   - To managers: "{Manager} approved claim CLM-{number}"
   - To finance: "Inventory updated for PO-{number}"

#### Manager Rejects Claim
1. Manager clicks "Reject" button
2. Rejection reason dialog appears (required)
3. Manager enters reason and clicks "Confirm Reject"
4. System updates:
   - Claim status = "rejected"
   - rejectionReason = entered reason
   - Saved to database
   - NO inventory changes made

5. Notifications sent:
   - To employee: "Your claim CLM-{number} has been rejected: {reason}"

---

## Accounting Module Flow

### Transaction Recording

#### Finance Creates Transaction
1. Finance clicks "New Transaction" button
2. Form dialog opens with fields:
   - Type (required, dropdown: Expense, Income, Transfer, Adjustment)
   - Amount (required, decimal)
   - Currency (required, dropdown: USD, EUR, KHR, CNY, THB)
   - Exchange Rate (auto-filled from current rates, editable)
   - Department (optional, text)
   - Project (optional, text)
   - Category (optional, text)
   - Description (optional, textarea)
   - Transaction Date (required, date picker, default=today)
   - Link to PO (optional, dropdown)

#### Finance Fills Form
1. Finance selects transaction type
2. Finance enters amount (e.g., 1500.50)
3. Finance selects currency (e.g., KHR)
4. System auto-fills exchange rate from latest rates
5. Finance can override exchange rate if needed
6. Finance enters department, project, category
7. Finance adds description
8. Finance selects transaction date
9. Finance can optionally link to PO

#### System Auto-Calculates
- amountUsd = amount × exchangeRate
- Example: 1500.50 KHR × 0.00024 = 0.36 USD

#### Finance Submits Transaction
1. Finance clicks "Create Transaction" button
2. System validates:
   - Type selected
   - Amount is positive
   - Currency selected
   - Transaction date provided

3. On success:
   - Transaction record created
   - Reference number generated
   - type, amount, currency, exchangeRate, amountUsd recorded
   - recordedById = finance ID
   - transactionDate = selected date
   - createdAt = current timestamp
   - Saved to database

4. Notifications sent:
   - To admin: "New transaction recorded: {Type} {Amount} {Currency}"

#### Finance Views Transactions
1. Finance clicks "Transactions" in sidebar
2. List displays all transactions with columns:
   - Reference number
   - Type (with icon: expense, income, transfer, adjustment)
   - Amount and currency
   - USD equivalent
   - Department
   - Category
   - Date
   - Recorded by

3. Filters available:
   - Type filter
   - Currency filter
   - Department filter
   - Date range
   - Search by reference or description

4. Sorting available:
   - By date, amount, type, department

---

### Journal Entry Recording

#### Finance Creates Journal Entry
1. Finance clicks "New Journal Entry" button
2. Form dialog opens with fields:
   - Reference Number (required, text)
   - Entry Date (required, date picker)
   - Debit Account (required, text/dropdown)
   - Credit Account (required, text/dropdown)
   - Amount (required, decimal)
   - Currency (required, dropdown)
   - Exchange Rate (auto-filled, editable)
   - Description (optional, textarea)
   - Link to PO (optional, dropdown)

#### Finance Fills Form
1. Finance enters reference number (e.g., "JE-2024-001")
2. Finance selects entry date
3. Finance selects debit account (e.g., "Expense - Office Supplies")
4. Finance selects credit account (e.g., "Cash")
5. Finance enters amount
6. Finance selects currency
7. System auto-fills exchange rate
8. Finance adds description
9. Finance can link to PO

#### System Validates
- Debit account ≠ Credit account (cannot debit and credit same account)
- Amount is positive
- Both accounts exist (or can be created)

#### Finance Submits Entry
1. Finance clicks "Create Journal Entry" button
2. System validates all fields
3. On success:
   - Journal entry record created
   - reference, date, debitAccount, creditAccount, amount recorded
   - currency, exchangeRate, originalAmount recorded
   - createdById = finance ID
   - createdAt = current timestamp
   - Saved to database

4. Notifications sent:
   - To admin: "New journal entry created: {Reference}"

#### Finance Views Journal Entries
1. Finance clicks "Journal Entries" in sidebar
2. List displays all entries with columns:
   - Reference number
   - Date
   - Debit Account
   - Credit Account
   - Amount
   - Currency
   - Created by

3. Filters available:
   - Date range
   - Account name search
   - Currency filter

---

### Income Entry Recording

#### Finance Creates Income Entry
1. Finance clicks "New Income Entry" button
2. Form dialog opens with fields:
   - Reference Number (required, text)
   - Income Source (required, text: customer, grant, interest, etc.)
   - Amount (required, decimal)
   - Currency (required, dropdown)
   - Exchange Rate (auto-filled, editable)
   - Department (optional, text)
   - Project (optional, text)
   - Description (optional, textarea)
   - Income Date (required, date picker)

#### Finance Fills Form
1. Finance enters reference number
2. Finance enters income source (e.g., "Customer ABC")
3. Finance enters amount
4. Finance selects currency
5. System auto-fills exchange rate
6. Finance enters department and project
7. Finance adds description
8. Finance selects income date

#### System Auto-Calculates
- amountUsd = amount × exchangeRate

#### Finance Submits Entry
1. Finance clicks "Create Income Entry" button
2. System validates all fields
3. On success:
   - Income entry record created
   - reference, source, amount, currency, exchangeRate, amountUsd recorded
   - department, project, description recorded
   - recordedById = finance ID
   - incomeDate = selected date
   - createdAt = current timestamp
   - Saved to database

4. Notifications sent:
   - To admin: "New income recorded: {Source} {Amount} {Currency}"

#### Finance Views Income Entries
1. Finance clicks "Income Entries" in sidebar
2. List displays all entries with columns:
   - Reference number
   - Source
   - Amount and currency
   - USD equivalent
   - Department
   - Date
   - Recorded by

3. Filters available:
   - Source filter
   - Currency filter
   - Department filter
   - Date range

---

### Exchange Rate Management

#### Finance Views Current Rates
1. Finance clicks "Exchange Rates" in sidebar
2. List displays current rates with columns:
   - Base Currency (USD)
   - Target Currency (KHR, CNY, THB, EUR)
   - Current Rate
   - Effective Date
   - Last Updated By
   - Last Updated Date
   - Action buttons: Edit, History

#### Finance Updates Exchange Rate
1. Finance clicks "Edit" button for a rate
2. Edit dialog opens with fields:
   - Base Currency (read-only: USD)
   - Target Currency (read-only: e.g., KHR)
   - New Rate (required, decimal)
   - Effective Date (required, date picker)

3. Finance enters new rate (e.g., 0.000245)
4. Finance selects effective date
5. Finance clicks "Update Rate" button
6. System validates:
   - Rate is positive
   - Effective date is provided

7. On success:
   - Exchange rate record created/updated
   - rate = new rate
   - effectiveDate = selected date
   - updatedById = finance ID
   - updatedAt = current timestamp
   - Saved to database

8. Notifications sent:
   - To all users: "Exchange rate updated: 1 USD = {Rate} {Currency}"

#### Finance Views Rate History
1. Finance clicks "History" button for a rate
2. History page shows:
   - All previous rates for this currency pair
   - Date changed, rate value, changed by
   - Sorted by date (newest first)

#### Rate Application
- New rates apply to transactions created AFTER effective date
- Historical transactions keep their original exchange rates
- Users can manually override rate for specific transactions

---

## Reports Module Flow

### Report Generation

#### User Selects Report Type
1. User clicks "Reports" in sidebar
2. Report selection page shows available reports:
   - Profit & Loss (P&L)
   - Cash Flow
   - Expenses by Category
   - Budget vs Actual
   - Currency Summary
   - Transaction History

3. User clicks report type to generate

#### Report Parameters
1. Report configuration page shows:
   - Date Range (required, date picker: from/to)
   - Department Filter (optional, dropdown)
   - Category Filter (optional, dropdown)
   - Currency Filter (optional, dropdown)
   - Export Format (optional, dropdown: PDF, CSV)

2. User selects parameters
3. User clicks "Generate Report" button

#### System Generates Report

**Profit & Loss Report:**
- Total Income (sum of income entries)
- Total Expenses (sum of expense transactions)
- Net Profit/Loss (income - expenses)
- Breakdown by category
- Breakdown by department
- Charts and tables

**Cash Flow Report:**
- Opening Balance
- Total Income
- Total Expenses
- Closing Balance
- Monthly breakdown
- Line chart showing trend

**Expenses by Category:**
- Total expenses by category
- Percentage of total
- Pie chart visualization
- Top 5 categories

**Budget vs Actual:**
- Budgeted amounts (if configured)
- Actual spending
- Variance (budget - actual)
- Variance percentage
- Bar chart comparison

**Currency Summary:**
- Transactions by currency
- Amount in original currency
- USD equivalent
- Exchange rate used
- Table format

**Transaction History:**
- Complete list of all transactions
- Filters applied
- Date range
- All transaction details
- Sortable columns

### Report Display

1. Report displays on screen with:
   - Title and date range
   - Summary metrics (key numbers)
   - Charts (if applicable)
   - Detailed tables
   - Filters applied

2. User can:
   - View full page report
   - Export to PDF
   - Export to CSV
   - Print report
   - Share report (email link)

### Export Options

#### CSV Export
1. User clicks "Export to CSV" button
2. System prepares data:
   - Formats as comma-separated values
   - Includes headers
   - Includes all rows and columns
   - Includes metadata (date range, filters)

3. File downloads to user's computer
4. File name: "Report_{ReportType}_{Date}.csv"

#### PDF Export
1. User clicks "Export to PDF" button
2. System generates PDF:
   - Includes report title
   - Includes all charts
   - Includes all tables
   - Includes metadata
   - Formatted for printing

3. File downloads to user's computer
4. File name: "Report_{ReportType}_{Date}.pdf"

---

## Admin Panel Flow

### User Management

#### View Users List
1. Admin clicks "Users" in sidebar
2. List displays all users with columns:
   - Name
   - Email
   - Role (color-coded badge)
   - Department
   - Last Sign-in
   - Joined Date
   - Status (Active/Inactive)
   - Actions (Edit, Deactivate)

3. Filters available:
   - Role filter
   - Department filter
   - Status filter (Active/Inactive)
   - Search by name or email

4. Sorting available:
   - By name, role, department, joined date, last sign-in

#### Edit User
1. Admin clicks user name or "Edit" button
2. Edit dialog opens with fields:
   - Name (read-only)
   - Email (read-only)
   - Role (dropdown: Employee, Manager, Finance, Admin)
   - Department (text)
   - Telegram ID (text)
   - Status (toggle: Active/Inactive)

3. Admin can modify:
   - Role (change permissions)
   - Department (assign to department)
   - Telegram ID (for Mini App access)
   - Status (activate/deactivate)

4. Admin clicks "Save Changes" button
5. System updates:
   - User record updated
   - updatedAt = current timestamp
   - Changes saved to database
   - Audit log entry created

6. Notifications sent:
   - To user: "Your role has been changed to {NewRole}"
   - To admin: "User {Name} role updated to {NewRole}"

#### Deactivate User
1. Admin clicks user
2. Admin toggles "Active" switch to OFF
3. System updates:
   - isActive = false
   - User cannot login
   - User hidden from active users list
   - All sessions invalidated

4. Notifications sent:
   - To user: "Your account has been deactivated"
   - To admin: "User {Name} deactivated"

### Audit Logs

#### View Audit Logs
1. Admin clicks "Audit Logs" in sidebar
2. List displays all audit entries with columns:
   - User (who made the change)
   - Action (what was done)
   - Entity (what was changed)
   - Entity ID
   - Old Values (previous state)
   - New Values (new state)
   - IP Address (where from)
   - Timestamp (when)

3. Filters available:
   - User filter
   - Entity type filter (PR, PO, Item, etc.)
   - Action filter (create, update, approve, etc.)
   - Date range
   - Search by entity ID

4. Sorting available:
   - By timestamp (newest first)
   - By user, entity, action

#### View Audit Details
1. Admin clicks audit log entry
2. Detail page shows:
   - User information
   - Action performed
   - Entity details
   - Old values (formatted)
   - New values (formatted)
   - Comparison view (side-by-side)
   - IP address and location
   - Exact timestamp

#### Audit Trail Use Cases
- Track who approved a PR
- See what fields were changed in an item
- Monitor payment status changes
- Track user role changes
- Verify compliance and audit requirements

### Settings

#### General Settings
1. Admin clicks "Settings" in sidebar
2. Admin clicks "General" tab
3. Admin can configure:
   - Company Name (text)
   - Default Currency (dropdown: USD, EUR, KHR, CNY, THB)
   - Timezone (dropdown)

4. Admin clicks "Save Changes" button
5. System updates:
   - Settings saved to database
   - Applied globally to all users
   - Notifications sent to all users

#### Notification Settings
1. Admin clicks "Notifications" tab
2. Admin can enable/disable:
   - Email Notifications (toggle)
   - Slack Notifications (toggle)
   - Low Stock Alerts (toggle)
   - Approval Reminders (toggle)
   - Payment Reminders (toggle)

3. Admin can configure:
   - Email recipients
   - Slack webhook URL
   - Alert thresholds
   - Reminder frequency

4. Admin clicks "Save Changes" button
5. System updates settings

#### Security Settings
1. Admin clicks "Security" tab
2. Admin can manage:
   - Active Sessions (list of logged-in users)
   - Two-Factor Authentication (enable/disable)
   - API Keys (create, revoke)
   - Session Timeout (minutes)
   - Password Policy (requirements)

3. Admin can:
   - View active sessions
   - Force logout users
   - Revoke API keys
   - Reset user passwords

#### Appearance Settings
1. Admin clicks "Appearance" tab
2. Admin can configure:
   - Dark Mode (toggle)
   - Color Scheme (dropdown)
   - Logo Upload
   - Favicon Upload

3. Admin clicks "Save Changes" button
4. System updates:
   - Settings applied globally
   - All users see new appearance

---

## Telegram Mini App Flow

### Mini App Initialization

#### User Opens Bot
1. User opens Telegram
2. User finds ProcureIQ bot
3. User clicks "Open App" button
4. Telegram WebView opens Mini App

#### System Detects User
1. Mini App loads
2. Telegram SDK detects user ID
3. System queries database for user with telegramId = Telegram user ID
4. If found: User auto-logged in
5. If not found: User prompted to link account

#### Account Linking
1. User clicks "Link Account" button
2. Login page appears
3. User clicks "Continue with Manus OAuth"
4. OAuth flow completes
5. System links telegramId to user account
6. User redirected to Mini App dashboard

### Bottom Navigation

Mini App has 5 tabs at bottom:
- **Home** (house icon) — Dashboard
- **Procure** (shopping cart icon) — Purchase Requests
- **Inventory** (box icon) — Stock Requests
- **Finance** (dollar icon) — Transactions
- **Profile** (user icon) — Settings

### Home Screen

#### Dashboard Summary
1. Shows KPI cards (mobile-optimized, compact):
   - Pending PRs (count)
   - Unpaid POs (count)
   - Inventory Value (amount)
   - Cash Balance (amount)

2. Each card shows:
   - Icon
   - Label
   - Large number
   - Trend indicator (if applicable)

3. Cards are tappable (link to detail page)

#### Quick Actions
1. Shows 3 action buttons:
   - "New PR" — Create purchase request
   - "New Stock Request" — Create stock request
   - "New Transaction" — Record transaction

2. Buttons are large and easy to tap

#### Recent Activity
1. Shows last 5 events:
   - Event icon
   - Event description
   - Timestamp
   - Tappable (link to detail)

2. Swipe down to refresh

### Procurement Screen

#### PR List (Mobile View)
1. Shows all PRs as cards:
   - PR number (large, bold)
   - Requester name
   - Department
   - Total amount
   - Status badge (color-coded)
   - Date

2. Cards are tappable (open detail view)

3. Swipe left to reveal actions:
   - Approve button (green)
   - Reject button (red)

4. Filters available:
   - Status filter (swipe through)
   - Search by PR number

#### PR Detail View
1. Shows full PR information:
   - PR number, requester, department
   - Total amount, currency, exchange rate
   - Line items (scrollable table)
   - Notes
   - Approval history

2. If status = "pending":
   - Approve button
   - Reject button (with reason field)

3. If status = "approved":
   - "Convert to PO" button

### Inventory Screen

#### Stock Requests List
1. Shows all stock requests as cards:
   - Request number
   - Item name
   - Quantity requested
   - Priority badge (color-coded)
   - Status badge
   - Date

2. Cards are tappable (open detail view)

3. Swipe left to reveal actions:
   - Approve button
   - Reject button
   - Fulfill button

4. Filters available:
   - Status filter
   - Priority filter

#### Stock Request Detail
1. Shows full request information:
   - Request number, item, quantity
   - Current stock level
   - Requester, department
   - Priority, status
   - Notes

2. If status = "pending":
   - Approve button
   - Reject button (with reason field)
   - Fulfill button (with qty field)

### Finance Screen

#### Transactions List
1. Shows recent transactions:
   - Type icon (expense, income, transfer, adjustment)
   - Amount and currency
   - Category
   - Date
   - Status

2. Cards are tappable (open detail view)

3. Filters available:
   - Type filter
   - Currency filter

#### Exchange Rates
1. Shows current rates:
   - USD → KHR, CNY, THB, EUR
   - Current rate
   - Last updated date

2. Swipe to refresh rates

### Profile Screen

#### User Information
1. Shows:
   - User avatar (initials)
   - User name
   - User role (badge)
   - User email
   - Department

#### Settings
1. Dark Mode Toggle
   - Toggle between light/dark theme
   - Persists to localStorage

2. Notification Preferences
   - Toggle notifications on/off
   - Select notification types

3. Logout Button
   - Clears session
   - Redirects to login

---

## Theme & Styling Flow

### Theme Toggle

#### Light Mode
1. User clicks sun icon in header
2. Theme changes to "light"
3. CSS variables update:
   - Background: White (#ffffff)
   - Text: Dark gray (#1f2937)
   - Cards: Light gray (#f9fafb)
   - Borders: Light gray (#e5e7eb)

4. All components re-render with light colors
5. Theme saved to localStorage
6. Persists across sessions

#### Dark Mode
1. User clicks moon icon in header
2. Theme changes to "dark"
3. CSS variables update:
   - Background: Dark gray (#111827)
   - Text: Light gray (#f3f4f6)
   - Cards: Darker gray (#1f2937)
   - Borders: Dark gray (#374151)

4. All components re-render with dark colors
5. Theme saved to localStorage
6. Persists across sessions

### Color System (OKLCH)

#### Primary Colors
- **Blue** (#2563eb) — Buttons, links, active states, primary actions
- **Green** (#10b981) — Approved, fulfilled, paid, success states
- **Yellow** (#f59e0b) — Low stock, pending, warning states
- **Red** (#ef4444) — Rejected, errors, danger states
- **Gray** (#6b7280) — Disabled, secondary text, muted states

#### Status Badges
- **Pending** — Yellow background, dark text
- **Approved** — Green background, white text
- **Rejected** — Red background, white text
- **Converted** — Blue background, white text
- **Fulfilled** — Green background, white text
- **Unpaid** — Red background, white text
- **Partial** — Yellow background, dark text
- **Paid** — Green background, white text

### Component Styling

#### Buttons
- **Primary** — Blue background, white text, rounded corners
- **Secondary** — Gray background, dark text
- **Outline** — Transparent background, colored border, colored text
- **Ghost** — No background, colored text, hover effect
- **Disabled** — Gray background, light text, cursor disabled

#### Cards
- **Elevated** — White background (light) / dark gray (dark), soft shadow
- **Bordered** — Transparent background, light border
- **Flat** — Light gray background (light) / darker gray (dark)

#### Badges
- **Status** — Color-coded background, white text, rounded
- **Priority** — Color-coded background, white text, rounded
- **Role** — Color-coded background, white text, rounded

#### Tables
- **Header** — Light gray background (light) / dark gray (dark)
- **Rows** — Alternating white/light gray (light) / dark gray/darker gray (dark)
- **Hover** — Slightly darker background on hover
- **Selected** — Light blue background (light) / dark blue (dark)

#### Forms
- **Input Fields** — White background (light) / dark gray (dark), light border
- **Focus** — Blue border, blue shadow
- **Error** — Red border, red text
- **Labels** — Dark text (light) / light text (dark)

#### Dialogs
- **Overlay** — Semi-transparent black (40% opacity)
- **Dialog** — White background (light) / dark gray (dark)
- **Title** — Large, bold text
- **Content** — Normal text, proper spacing
- **Buttons** — Primary and secondary buttons at bottom

---

## Data Flow & Relationships

### User Creates PR

```
User (Employee)
    ↓
Clicks "New Purchase Request"
    ↓
Opens PR Form
    ↓
Fills in: Department, Project, Currency, Notes
    ↓
Adds Line Items: Item Name, Qty, Unit Price
    ↓
Clicks "Submit PR"
    ↓
System Validates:
  - At least one line item
  - All required fields filled
  - Quantities and prices are positive
    ↓
Creates PR Record:
  - prNumber = PR-{timestamp}
  - status = "pending"
  - requesterId = user.id
  - createdAt = now
  - Exchange rate LOCKED
    ↓
Creates PR Line Items:
  - For each item: prId, itemName, qty, unitPrice, totalPrice
    ↓
Sends Notifications:
  - To all managers: "New PR from {Employee}"
    ↓
Redirects to PR Detail Page
```

### PR Approval Workflow

```
Manager Views PR List
    ↓
Filters by Status = "pending"
    ↓
Clicks PR to View Details
    ↓
Reviews:
  - Requester and department
  - Line items and total amount
  - Notes and justification
    ↓
Manager Decides:
  
  APPROVE PATH:
    ↓
    Clicks "Approve" Button
    ↓
    System Updates:
      - status = "approved"
      - approvedById = manager.id
      - approvedAt = now
    ↓
    Sends Notifications:
      - To employee: "PR approved"
      - To managers: "{Manager} approved PR"
    ↓
    PR Available for Conversion to PO
  
  REJECT PATH:
    ↓
    Clicks "Reject" Button
    ↓
    Enters Rejection Reason (required)
    ↓
    System Updates:
      - status = "rejected"
      - rejectedById = manager.id
      - rejectedAt = now
      - rejectionReason = reason
    ↓
    Sends Notifications:
      - To employee: "PR rejected: {reason}"
      - To managers: "{Manager} rejected PR"
    ↓
    PR Cannot Be Converted
```

### PR to PO Conversion

```
Manager Views Approved PR
    ↓
Clicks "Convert to PO" Button
    ↓
PO Form Opens (Pre-filled):
  - PR items and quantities
  - PR total amount
  - PR currency and exchange rate
  - Linked PR ID
    ↓
Manager Adds:
  - Supplier Name
  - Optional notes
  - Can modify quantities/prices
    ↓
Clicks "Create PO" Button
    ↓
System Creates PO Record:
  - poNumber = PO-{timestamp}
  - prId = PR.id (linked)
  - paymentStatus = "unpaid"
  - claimStatus = "pending"
  - createdById = manager.id
  - createdAt = now
    ↓
Creates PO Line Items:
  - For each item: poId, itemName, qtyOrdered, unitPrice, totalPrice
    ↓
Updates PR:
  - status = "converted"
    ↓
Sends Notifications:
  - To finance: "New PO created, awaiting payment"
  - To managers: "{Manager} created PO"
    ↓
Redirects to PO Detail Page
```

### Goods Receipt & Claim

```
Goods Arrive at Warehouse
    ↓
Employee Receives Goods
    ↓
Clicks "New Claim" Button
    ↓
Selects PO (from dropdown)
    ↓
For Each Line Item:
  - Enters Quantity Arrived
  - Adds Receiving Notes (optional)
    ↓
Clicks "Submit Claim" Button
    ↓
System Creates Claim Record:
  - claimNumber = CLM-{timestamp}
  - poId = PO.id
  - status = "pending"
  - claimedById = employee.id
  - createdAt = now
    ↓
Creates Claim Items:
  - For each item: claimId, poItemId, qtyArrived, notes
    ↓
Sends Notifications:
  - To managers: "New claim awaiting approval"
    ↓
Manager Reviews Claim
    ↓
Manager Decides:
  
  APPROVE PATH:
    ↓
    Clicks "Approve" Button
    ↓
    System Updates:
      - Claim status = "approved"
      - approvedById = manager.id
      - approvedAt = now
    ↓
    For Each Claimed Item:
      - item.stockQty += qtyArrived (INVENTORY INCREASED)
      - poItem.qtyClaimed += qtyArrived
    ↓
    If All Items Fully Claimed:
      - PO.claimStatus = "completed"
    ↓
    Sends Notifications:
      - To employee: "Claim approved"
      - To managers: "{Manager} approved claim"
      - To finance: "Inventory updated"
  
  REJECT PATH:
    ↓
    Clicks "Reject" Button
    ↓
    Enters Rejection Reason
    ↓
    System Updates:
      - Claim status = "rejected"
      - rejectionReason = reason
    ↓
    NO INVENTORY CHANGES
    ↓
    Sends Notifications:
      - To employee: "Claim rejected: {reason}"
```

### Payment Recording

```
Finance Receives Invoice
    ↓
Clicks "Purchase Orders" in Sidebar
    ↓
Finds PO in List
    ↓
Clicks PO to View Details
    ↓
Scrolls to Payment Section
    ↓
Clicks "Update Payment Status" Button
    ↓
Selects New Status:
  - unpaid → partial (partial payment)
  - partial → paid (full payment)
    ↓
Optionally Uploads Receipt:
  - Clicks "Upload Receipt" Button
  - Selects image/PDF file
  - System Stores in S3
  - Records URL and Key
    ↓
Clicks "Update Payment" Button
    ↓
System Updates:
  - paymentStatus = new status
  - receiptUrl = file URL (if uploaded)
  - receiptKey = file key (if uploaded)
  - updatedAt = now
    ↓
Sends Notifications:
  - To managers: "Payment recorded for PO"
  - To admin: "PO payment status updated"
    ↓
Finance Confirms Payment Recorded
```

---

## Key Business Rules

### Purchase Requests
1. **Approval Required** — PRs must be approved by manager before conversion to PO
2. **Exchange Rate Locking** — PR exchange rate is locked at creation time and cannot be changed
3. **Unique PR Number** — Each PR gets unique number (PR-{timestamp})
4. **Status Workflow** — pending → approved/rejected → converted (optional)
5. **Requester Tracking** — System records who submitted PR
6. **Approval History** — System tracks all approval/rejection actions

### Purchase Orders
1. **Linked to PR** — PO can be linked to approved PR (optional)
2. **Supplier Required** — PO must have supplier name
3. **Payment Tracking** — PO tracks payment status (unpaid, partial, paid)
4. **Claim Tracking** — PO tracks claim status (pending, partial, completed)
5. **Receipt Storage** — Payment receipts stored in S3 with URL and key
6. **Unique PO Number** — Each PO gets unique number (PO-{timestamp})

### Inventory Claims
1. **PO Required** — Claim must be linked to a PO
2. **Quantity Validation** — Qty arrived cannot exceed qty ordered
3. **Partial Claims** — Can claim partial quantities (receive in batches)
4. **Inventory Update** — Approved claims automatically update inventory
5. **Manager Approval** — Claims must be approved by manager
6. **Unique Claim Number** — Each claim gets unique number (CLM-{timestamp})

### Stock Requests
1. **Item Required** — Stock request must specify which item
2. **Quantity Required** — Must specify quantity needed
3. **Priority Levels** — Low, Medium, High, Urgent
4. **Manager Approval** — Requests must be approved by manager
5. **Fulfillment** — Manager can approve and fulfill in one action
6. **Inventory Decrement** — Fulfillment decreases item stock qty
7. **Unique Request Number** — Each request gets unique number (SR-{timestamp})

### Accounting Transactions
1. **Type Required** — Must specify transaction type (expense, income, transfer, adjustment)
2. **Multi-Currency** — All amounts tracked in original currency + USD
3. **Exchange Rate** — Auto-filled from current rates, can be overridden
4. **USD Conversion** — amountUsd = amount × exchangeRate
5. **Category Optional** — Can categorize transactions for reporting
6. **Department Optional** — Can assign to department for tracking
7. **PO Linking** — Can link to PO for traceability

### Journal Entries
1. **Double-Entry** — Every entry has debit and credit account
2. **Debit ≠ Credit** — Cannot debit and credit same account
3. **Amount Required** — Must be positive
4. **Currency Support** — Multi-currency with exchange rates
5. **Reference Number** — Unique reference for tracking
6. **Description Optional** — Can add notes

### Exchange Rates
1. **Base Currency** — USD is always the base
2. **Target Currencies** — KHR, CNY, THB, EUR
3. **Rate Updates** — Finance can update rates anytime
4. **Effective Date** — New rates apply to future transactions
5. **Historical Rates** — Old transactions keep original rates
6. **Manual Override** — Users can override rate for specific transactions

### Audit Logging
1. **Complete Tracking** — Every action logged
2. **User Tracking** — Records who made the change
3. **Change Tracking** — Records old values and new values
4. **Timestamp** — Records exact time of change
5. **IP Tracking** — Records IP address of user
6. **Entity Tracking** — Records what entity was changed
7. **Immutable** — Audit logs cannot be deleted or modified

### User Roles
1. **Employee** — Lowest permission level, can create requests only
2. **Manager** — Can approve requests and manage inventory
3. **Finance** — Can record accounting transactions
4. **Admin** — Highest permission level, full access
5. **Role-Based Navigation** — UI shows only accessible features
6. **Role-Based API** — Backend enforces role permissions
7. **Role Changes** — Admin can change user roles anytime

---

## Integration Points (Ready for Supabase)

When you connect to Supabase, these tables will sync:

### Core Tables

#### Users Table
- `id` — Primary key
- `openId` — Manus OAuth ID (unique)
- `name` — User name
- `email` — User email
- `role` — enum: employee, manager, finance, admin
- `department` — Department assignment
- `telegramId` — Telegram user ID (for Mini App)
- `isActive` — Account status
- `createdAt`, `updatedAt`, `lastSignedIn` — Timestamps

#### Categories Table
- `id` — Primary key
- `name` — Category name
- `description` — Category description
- `createdAt`, `updatedAt` — Timestamps

#### Items Table
- `id` — Primary key
- `name` — Item name
- `sku` — Stock keeping unit
- `categoryId` — Foreign key to categories
- `unit` — Unit type (pcs, box, kg, etc.)
- `stockQty` — Current stock quantity
- `reorderPoint` — Low stock threshold
- `unitCost` — Cost per unit
- `currency` — Currency of unit cost
- `description` — Item description
- `isActive` — Item status
- `createdAt`, `updatedAt` — Timestamps

### Procurement Tables

#### Purchase Requests Table
- `id` — Primary key
- `prNumber` — Unique PR number (PR-{timestamp})
- `requesterId` — Foreign key to users
- `department` — Department
- `project` — Project name
- `currency` — Transaction currency
- `totalAmount` — Total amount
- `lockedExchangeRate` — Exchange rate (locked)
- `status` — enum: pending, approved, rejected, converted
- `notes` — PR notes
- `approvedById`, `approvedAt` — Approval tracking
- `rejectedById`, `rejectedAt`, `rejectionReason` — Rejection tracking
- `createdAt`, `updatedAt` — Timestamps

#### Purchase Request Items Table
- `id` — Primary key
- `prId` — Foreign key to purchase_requests
- `itemName` — Item name
- `description` — Item description
- `quantity` — Quantity requested
- `unitPrice` — Price per unit
- `unit` — Unit type
- `totalPrice` — Total price for line item

#### Purchase Orders Table
- `id` — Primary key
- `poNumber` — Unique PO number (PO-{timestamp})
- `prId` — Foreign key to purchase_requests (optional)
- `supplier` — Supplier name
- `currency` — Transaction currency
- `totalAmount` — Total amount
- `exchangeRate` — Exchange rate
- `paymentStatus` — enum: unpaid, partial, paid
- `claimStatus` — enum: pending, partial, completed
- `receiptUrl` — Receipt file URL
- `receiptKey` — Receipt file key
- `notes` — PO notes
- `createdById` — Foreign key to users
- `createdAt`, `updatedAt` — Timestamps

#### PO Items Table
- `id` — Primary key
- `poId` — Foreign key to purchase_orders
- `itemName` — Item name
- `description` — Item description
- `qtyOrdered` — Quantity ordered
- `qtyClaimed` — Quantity claimed/received
- `unitPrice` — Price per unit
- `unit` — Unit type
- `totalPrice` — Total price for line item
- `linkedItemId` — Foreign key to items (optional)

### Inventory Tables

#### Stock Requests Table
- `id` — Primary key
- `requestNumber` — Unique request number (SR-{timestamp})
- `requesterId` — Foreign key to users
- `itemId` — Foreign key to items
- `department` — Department
- `quantity` — Quantity requested
- `priority` — enum: low, medium, high, urgent
- `status` — enum: pending, approved, rejected, fulfilled
- `notes` — Request notes
- `approvedById`, `approvedAt` — Approval tracking
- `fulfilledAt` — Fulfillment timestamp
- `createdAt`, `updatedAt` — Timestamps

#### Inventory Claims Table
- `id` — Primary key
- `claimNumber` — Unique claim number (CLM-{timestamp})
- `poId` — Foreign key to purchase_orders
- `claimedById` — Foreign key to users
- `status` — enum: pending, approved, rejected
- `notes` — Claim notes
- `approvedById`, `approvedAt` — Approval tracking
- `createdAt`, `updatedAt` — Timestamps

#### Claim Items Table
- `id` — Primary key
- `claimId` — Foreign key to inventory_claims
- `poItemId` — Foreign key to po_items
- `qtyArrived` — Quantity arrived
- `notes` — Item notes

### Accounting Tables

#### Transactions Table
- `id` — Primary key
- `reference` — Reference number
- `type` — enum: expense, income, transfer, adjustment
- `amount` — Amount in original currency
- `currency` — Currency
- `exchangeRate` — Exchange rate to USD
- `amountUsd` — Amount in USD
- `department` — Department
- `project` — Project
- `category` — Category
- `description` — Description
- `poId` — Foreign key to purchase_orders (optional)
- `recordedById` — Foreign key to users
- `transactionDate` — Transaction date
- `createdAt`, `updatedAt` — Timestamps

#### Journal Entries Table
- `id` — Primary key
- `reference` — Reference number
- `date` — Entry date
- `debitAccount` — Debit account name
- `creditAccount` — Credit account name
- `amount` — Amount
- `currency` — Currency
- `exchangeRate` — Exchange rate to USD
- `originalAmount` — Original amount
- `description` — Description
- `poId` — Foreign key to purchase_orders (optional)
- `createdById` — Foreign key to users
- `createdAt`, `updatedAt` — Timestamps

#### Income Entries Table
- `id` — Primary key
- `reference` — Reference number
- `source` — Income source
- `amount` — Amount in original currency
- `currency` — Currency
- `exchangeRate` — Exchange rate to USD
- `amountUsd` — Amount in USD
- `department` — Department
- `project` — Project
- `description` — Description
- `incomeDate` — Income date
- `recordedById` — Foreign key to users
- `createdAt`, `updatedAt` — Timestamps

#### Exchange Rates Table
- `id` — Primary key
- `baseCurrency` — Base currency (USD)
- `targetCurrency` — Target currency
- `rate` — Exchange rate
- `effectiveDate` — Date rate becomes effective
- `updatedById` — Foreign key to users
- `createdAt`, `updatedAt` — Timestamps

### Admin Tables

#### Audit Logs Table
- `id` — Primary key (bigint)
- `userId` — Foreign key to users
- `action` — Action performed (create, update, approve, etc.)
- `entity` — Entity type (PR, PO, Item, etc.)
- `entityId` — Entity ID
- `oldValues` — JSON of old values
- `newValues` — JSON of new values
- `ipAddress` — IP address of user
- `createdAt` — Timestamp

---

## Summary

ProcureIQ is a complete enterprise system with:
- **4 User Roles** with hierarchical permissions
- **3 Main Modules** (Procurement, Inventory, Accounting)
- **15 Database Tables** with proper relationships
- **28 Core Features** across all modules
- **Multi-Currency Support** with exchange rates
- **Complete Audit Trail** for compliance
- **Mobile Experience** via Telegram Mini App
- **Dark/Light Theme** support
- **Role-Based Access Control** at UI and API level

All UI is built and ready to connect to your Supabase database. Simply set up your Supabase project, create these tables, and wire up the API endpoints to the frontend components.
