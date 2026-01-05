# 🏗️ Locale Blueprint - Smelting Specification

> **SmelterOS must be capable of smelting and gilding this product.**

---

## Ingot Overview

| Property | Value |
|----------|-------|
| **Ingot Name** | Locale |
| **Version** | 1.0.0 |
| **Status** | In Development |
| **Phase** | Smelting |

**Description:** Locale is a location-aware productivity and social platform that helps users discover, connect, and collaborate with people and places in their vicinity.

---

## Required Resources

| Resource | Purpose |
|----------|---------|
| `ii-researcher` | Market research, competitor analysis, location data sourcing |
| `ii-agent` | Autonomous feature implementation, API integrations |
| `ii-thought` | UX decision-making, architecture planning |

---

## Infrastructure Requirements

### Firebase Configuration

```json
{
  "hosting": true,
  "firestore": true,
  "auth": true,
  "storage": true,
  "functions": true,
  "realtime": true
}
```

### Vertex AI Configuration

```json
{
  "models": ["gemini-pro", "text-embedding-004"],
  "endpoints": ["locale-recommendations", "locale-matching"],
  "embeddings": true
}
```

### Cloud Run Services

```json
{
  "services": ["locale-api", "locale-workers"],
  "regions": ["us-central1"],
  "minInstances": 1
}
```

---

## Data Models

### User

```typescript
interface LocaleUser {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  location: GeoPoint;
  locationHistory: LocationEntry[];
  preferences: UserPreferences;
  connections: string[]; // User IDs
  achievements: Achievement[];
  createdAt: Timestamp;
  lastActive: Timestamp;
}

interface UserPreferences {
  discoveryRadius: number; // meters
  notificationsEnabled: boolean;
  visibilityLevel: 'public' | 'friends' | 'private';
  interests: string[];
}

interface LocationEntry {
  location: GeoPoint;
  timestamp: Timestamp;
  placeName?: string;
  placeId?: string;
}
```

### Place

```typescript
interface Place {
  id: string;
  name: string;
  description: string;
  location: GeoPoint;
  category: PlaceCategory;
  rating: number;
  reviewCount: number;
  photos: string[];
  amenities: string[];
  hours: OperatingHours;
  checkIns: number;
  trending: boolean;
  createdBy?: string;
  createdAt: Timestamp;
}

type PlaceCategory = 
  | 'restaurant'
  | 'cafe'
  | 'bar'
  | 'park'
  | 'gym'
  | 'coworking'
  | 'event'
  | 'other';

interface OperatingHours {
  monday: TimeRange;
  tuesday: TimeRange;
  wednesday: TimeRange;
  thursday: TimeRange;
  friday: TimeRange;
  saturday: TimeRange;
  sunday: TimeRange;
}

interface TimeRange {
  open: string; // HH:MM
  close: string; // HH:MM
  closed: boolean;
}
```

### Event

```typescript
interface LocaleEvent {
  id: string;
  title: string;
  description: string;
  location: GeoPoint;
  place?: string; // Place ID
  startTime: Timestamp;
  endTime: Timestamp;
  host: string; // User ID
  attendees: string[];
  maxAttendees?: number;
  category: EventCategory;
  isPublic: boolean;
  createdAt: Timestamp;
}

type EventCategory =
  | 'social'
  | 'professional'
  | 'sports'
  | 'music'
  | 'food'
  | 'education'
  | 'other';
```

---

## API Endpoints

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/google` | POST | Sign in with Google |
| `/api/auth/refresh` | POST | Refresh access token |
| `/api/auth/logout` | POST | Sign out |

### Users

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/users/me` | GET | Get current user profile |
| `/api/users/me` | PATCH | Update profile |
| `/api/users/me/location` | PUT | Update location |
| `/api/users/:id` | GET | Get user by ID |
| `/api/users/nearby` | GET | Get nearby users |

### Places

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/places` | GET | List places (with filters) |
| `/api/places/:id` | GET | Get place details |
| `/api/places/nearby` | GET | Get nearby places |
| `/api/places/:id/checkin` | POST | Check in to place |
| `/api/places/trending` | GET | Get trending places |

### Events

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/events` | GET | List events |
| `/api/events` | POST | Create event |
| `/api/events/:id` | GET | Get event details |
| `/api/events/:id/join` | POST | Join event |
| `/api/events/:id/leave` | POST | Leave event |
| `/api/events/nearby` | GET | Get nearby events |

### Connections

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/connections` | GET | Get user connections |
| `/api/connections/request` | POST | Send connection request |
| `/api/connections/:id/accept` | POST | Accept request |
| `/api/connections/:id/decline` | POST | Decline request |

---

## Smelting Tasks

### Phase 1: Core Infrastructure

| Task ID | Name | Tool | Dependencies |
|---------|------|------|--------------|
| LOCALE-001 | Create Firestore collections | createFirestoreCollection | - |
| LOCALE-002 | Configure Firebase Auth | configureFirebaseAuth | - |
| LOCALE-003 | Create GCS buckets | provisionGCSBucket | - |
| LOCALE-004 | Deploy API service | deployCloudFunction | LOCALE-001 |

### Phase 2: Core Features

| Task ID | Name | Tool | Dependencies |
|---------|------|------|--------------|
| LOCALE-101 | Implement user location tracking | deployCloudFunction | LOCALE-004 |
| LOCALE-102 | Create geospatial queries | createFirestoreCollection | LOCALE-001 |
| LOCALE-103 | Build place discovery | deployCloudFunction | LOCALE-102 |
| LOCALE-104 | Implement check-in system | deployCloudFunction | LOCALE-103 |

### Phase 3: Social Features

| Task ID | Name | Tool | Dependencies |
|---------|------|------|--------------|
| LOCALE-201 | Build connection system | deployCloudFunction | LOCALE-104 |
| LOCALE-202 | Create event management | deployCloudFunction | LOCALE-201 |
| LOCALE-203 | Implement notifications | configurePubSub | LOCALE-202 |
| LOCALE-204 | Build chat system | deployCloudFunction | LOCALE-201 |

---

## Gilding Specification

### UI Framework

```json
{
  "framework": "react",
  "designSystem": "smelter-ui",
  "responsive": true,
  "accessibility": true
}
```

### Pages

| Page | Route | Components |
|------|-------|------------|
| Home | `/` | Map, NearbyList, QuickActions |
| Explore | `/explore` | PlaceGrid, Filters, SearchBar |
| Events | `/events` | EventList, EventCard, CreateButton |
| Profile | `/profile` | UserCard, Stats, Settings |
| Place Detail | `/place/:id` | PlaceHeader, Reviews, CheckInButton |
| Event Detail | `/event/:id` | EventHeader, Attendees, JoinButton |

### Brand Specification

```json
{
  "colors": {
    "primary": "#4F46E5",
    "secondary": "#10B981",
    "accent": "#F59E0B",
    "background": "#F3F4F6",
    "surface": "#FFFFFF",
    "text": "#1F2937",
    "textSecondary": "#6B7280"
  },
  "fonts": ["Inter", "SF Pro Display"],
  "borderRadius": "0.75rem",
  "shadows": true
}
```

---

## Deployment Configuration

### Environment Variables

```env
# Firebase
FIREBASE_PROJECT_ID=smelteros
FIREBASE_API_KEY=***
FIREBASE_AUTH_DOMAIN=smelteros.firebaseapp.com

# Vertex AI
VERTEX_PROJECT=smelteros
VERTEX_REGION=us-central1

# Maps
GOOGLE_MAPS_API_KEY=***

# Locale Specific
LOCALE_DEFAULT_RADIUS=5000
LOCALE_MAX_CONNECTIONS=500
LOCALE_EVENT_MAX_ATTENDEES=100
```

### Cloud Run Configuration

```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: locale-api
spec:
  template:
    spec:
      containers:
        - image: gcr.io/smelteros/locale-api
          resources:
            limits:
              memory: 512Mi
              cpu: "1"
          env:
            - name: NODE_ENV
              value: production
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| API Latency (p95) | < 200ms |
| Location Accuracy | < 50m |
| Nearby Query Time | < 500ms |
| User Onboarding Time | < 60s |
| Daily Active Users | TBD |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-03 | Initial blueprint |

---

*This Ingot specification is maintained by the SmelterOS Foundry. SmelterOS is the builder. Locale is the build.*
