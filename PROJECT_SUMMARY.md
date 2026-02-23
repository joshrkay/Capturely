# Cross-Platform Popup + Form Builder MVP

This is a fully functional prototype of the FormBuilder platform for SMBs, built based on the comprehensive product charter provided.

## What's Been Built

### Core Features Implemented

1. **Campaign Dashboard**
   - Overview statistics (active campaigns, views, submissions, conversion rates)
   - Campaign list with status management
   - Quick actions (edit, analytics, pause/activate, archive, delete)
   - Sample data initialization for demo purposes

2. **Template Library**
   - 10 professionally designed templates across 8 categories:
     - Newsletter signup
     - Discount codes
     - Contact forms
     - Quote requests
     - Appointment booking
     - Support tickets
     - Waitlist signups
     - Wholesale applications
   - Category filtering and search functionality
   - Template preview with live styling
   - "Start from Blank" option

3. **Drag-and-Drop Form Builder**
   - Visual form editor with live preview
   - 8 field types: text, email, phone, textarea, checkbox, radio, select, button
   - Real-time field property editing
   - Style customization (colors, fonts, border radius)
   - Content editing (headline, description)
   - Display rules configuration (popup triggers, page targeting)
   - Zapier webhook integration setup

4. **A/B Testing System**
   - Create multiple variants of the same campaign
   - Duplicate and delete variants
   - Control variant designation
   - Traffic split visualization
   - Variant performance comparison

5. **Analytics Dashboard**
   - Campaign performance metrics
   - Time-series charts (views and submissions over time)
   - Variant comparison bar charts
   - Winner identification
   - Statistical significance indicators
   - "Promote Winner" functionality

6. **Submissions Management**
   - Submission list with filtering
   - CSV export functionality
   - Time-based analytics (total, this week, today)
   - Variant tracking for each submission

7. **Settings & Integrations**
   - Zapier webhook configuration
   - Shopify app installation
   - WordPress plugin download
   - Universal embed code
   - Account management

## Technical Architecture

### Tech Stack
- **React 18** with TypeScript
- **React Router** for navigation (Data mode)
- **React DnD** for drag-and-drop form building
- **Recharts** for analytics visualizations
- **Tailwind CSS** for styling
- **Radix UI** components for accessibility
- **Local Storage** for data persistence

### Data Models
- `Campaign` - Main campaign entity with variants and settings
- `FormVariant` - Individual A/B test variant with fields and styling
- `FormField` - Individual form fields with validation
- `Submission` - Form submission data
- `CampaignAnalytics` - Aggregated metrics and variant performance

### File Structure
```
/src/app/
├── types.ts                    # TypeScript type definitions
├── routes.ts                   # React Router configuration
├── lib/
│   ├── storage.ts             # Local storage utilities
│   ├── templates.ts           # Template library
│   └── utils.ts               # Helper functions
├── layouts/
│   └── root-layout.tsx        # Main app layout with sidebar
├── pages/
│   ├── dashboard.tsx          # Campaign overview
│   ├── templates.tsx          # Template selection
│   ├── builder.tsx            # Form builder editor
│   ├── analytics.tsx          # Analytics dashboard
│   ├── submissions.tsx        # Submission management
│   └── settings.tsx           # Settings and integrations
└── components/
    └── builder/
        ├── field-palette.tsx      # Draggable field types
        ├── form-canvas.tsx        # Drop zone and form preview
        ├── field-properties.tsx   # Field editing panel
        ├── style-editor.tsx       # Styling controls
        ├── display-settings.tsx   # Display rules and webhooks
        ├── variant-manager.tsx    # A/B test variant management
        └── form-preview.tsx       # Full screen preview modal
```

## Key Product Principles Implemented

✅ **Speed to value beats feature depth**
   - Template-first approach gets users live in minutes
   - Pre-configured templates with proven structures
   - Simple drag-and-drop interface

✅ **Cross-platform core first**
   - Universal data model works across platforms
   - Embed code for any website
   - Shopify and WordPress integration paths

✅ **Simple beats flexible (for MVP)**
   - Constrained field types
   - Template-based starting points
   - Clear property panels

✅ **Reliable > clever**
   - Local storage for demo reliability
   - Simple state management
   - Error-free experience

✅ **SMB language, not enterprise language**
   - "Test two versions" instead of "experimentation"
   - Plain English labels
   - Contextual help text

## User Flows Demonstrated

### Quick Start Flow (15-minute activation)
1. Land on dashboard
2. Click "Create Campaign"
3. Browse templates
4. Select a template (e.g., "Newsletter Signup")
5. Customize headline, colors, and fields
6. Add Zapier webhook (optional)
7. Click "Publish"
8. Copy embed code
9. Done!

### A/B Testing Flow
1. Create campaign from template
2. Click "Add Variant" in builder
3. Modify headline or button color
4. Save and publish
5. View analytics to see performance
6. Promote winning variant

### Data Export Flow
1. Navigate to campaign submissions
2. Review submission data in table
3. Click "Export CSV"
4. Open in spreadsheet software

## What's Not Included (By Design)

These were explicitly scoped out of the MVP per the charter:

- ❌ Native ESP/CRM integrations (Klaviyo, Mailchimp)
- ❌ Multi-step forms
- ❌ Advanced conditional logic
- ❌ File uploads
- ❌ AI autopilot optimization
- ❌ Enterprise permissions/RBAC
- ❌ Deep analytics attribution
- ❌ Backend infrastructure (using local storage instead)

## Future Enhancement Paths

Based on the charter, the next phases would add:

**Phase 2:**
- AI variant generator
- Exit intent and scroll triggers (already designed in)
- Native integrations (Klaviyo, Mailchimp, HubSpot)
- Slide-in and banner formats
- Basic segmentation

**Phase 3:**
- AI autopilot continuous optimization
- Advanced experimentation policies
- Team collaboration
- Template marketplace

## How to Use This Prototype

1. The app initializes with sample data showing a newsletter campaign
2. Explore the dashboard to see campaign metrics
3. Create a new campaign by clicking "Create Campaign"
4. Browse templates and select one
5. Use the builder to customize fields, styling, and settings
6. Preview your form with the "Preview" button
7. Add variants to test different approaches
8. View analytics to see performance (demo data)
9. Check submissions (simulated data after creation)

All data is stored in browser local storage, so it persists across sessions but is local to your browser.

## Product Metrics Ready to Track

The application is instrumented to track the North Star Metric and supporting metrics defined in the charter:

**North Star:** Activated Sites per Month
- Campaign creation ✓
- First submission tracking (ready for backend)

**Activation Metrics:**
- Time to first published campaign ✓
- Time to first submission (ready)
- % of installs publishing within 24h/7d (ready)

**Engagement Metrics:**
- Campaigns per active site ✓
- Template vs blank usage ✓
- A/B testing adoption ✓

**Outcome Metrics:**
- Submissions per active site ✓
- Conversion rate by campaign type ✓

This prototype demonstrates the complete vision for the SMB-focused form builder platform, ready for user testing and feedback.
