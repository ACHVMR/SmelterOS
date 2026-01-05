# 🏆 AchieveMor Blueprint - Smelting Specification

> **SmelterOS must be capable of smelting and gilding this product.**

---

## Ingot Overview

| Property | Value |
|----------|-------|
| **Ingot Name** | AchieveMor |
| **Version** | 1.0.0 |
| **Status** | Blueprint Phase |
| **Phase** | Pre-Smelting |

**Description:** AchieveMor is a gamification and achievement tracking system that transforms goals into engaging quests, tracks progress, and celebrates milestones with rewards and social recognition.

---

## Required Resources

| Resource | Purpose |
|----------|---------|
| `ii-agent` | Goal tracking automation |
| `ii-researcher` | Best practices for gamification |
| `CoT-Lab-Demo` | Achievement logic reasoning |

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
  "models": ["gemini-pro"],
  "endpoints": ["achievemor-recommendations"],
  "embeddings": false
}
```

---

## Data Models

### User Profile

```typescript
interface AchieveMorUser {
  id: string;
  displayName: string;
  avatar: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  achievements: UserAchievement[];
  quests: string[];
  badges: string[];
  streaks: Streak[];
  stats: UserStats;
  preferences: UserPreferences;
  createdAt: Timestamp;
}

interface UserStats {
  totalAchievements: number;
  totalXP: number;
  questsCompleted: number;
  longestStreak: number;
  currentStreak: number;
}

interface UserPreferences {
  notifications: boolean;
  publicProfile: boolean;
  shareAchievements: boolean;
  dailyReminders: boolean;
  reminderTime: string;
}
```

### Achievement

```typescript
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  tier: AchievementTier;
  xpReward: number;
  requirements: Requirement[];
  unlockedBy: number; // count of users
  createdAt: Timestamp;
}

type AchievementCategory = 
  | 'fitness'
  | 'learning'
  | 'productivity'
  | 'social'
  | 'creativity'
  | 'wellness'
  | 'special';

type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'legendary';

interface Requirement {
  type: 'count' | 'streak' | 'milestone' | 'challenge';
  target: number;
  metric: string;
}

interface UserAchievement {
  achievementId: string;
  unlockedAt: Timestamp;
  progress?: number;
}
```

### Quest

```typescript
interface Quest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  difficulty: Difficulty;
  xpReward: number;
  objectives: Objective[];
  timeLimit?: number; // hours
  repeatInterval?: string; // 'daily' | 'weekly' | 'monthly'
  category: AchievementCategory;
  createdAt: Timestamp;
}

type QuestType = 'main' | 'side' | 'daily' | 'weekly' | 'challenge';
type Difficulty = 'easy' | 'medium' | 'hard' | 'epic' | 'legendary';

interface Objective {
  id: string;
  description: string;
  target: number;
  current: number;
  completed: boolean;
}
```

### Streak

```typescript
interface Streak {
  id: string;
  name: string;
  category: AchievementCategory;
  currentCount: number;
  longestCount: number;
  lastActivityAt: Timestamp;
  startedAt: Timestamp;
}
```

### Badge

```typescript
interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: Rarity;
  conditions: string[];
  awardedTo: number;
}

type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
```

---

## API Endpoints

### Users

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/users/me` | GET | Get current user profile |
| `/api/users/me` | PATCH | Update profile |
| `/api/users/:id` | GET | Get user by ID |
| `/api/users/leaderboard` | GET | Get leaderboard |

### Achievements

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/achievements` | GET | List achievements |
| `/api/achievements/:id` | GET | Get achievement details |
| `/api/achievements/unlock` | POST | Unlock achievement |
| `/api/achievements/progress` | POST | Update progress |

### Quests

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/quests` | GET | List available quests |
| `/api/quests/active` | GET | Get active quests |
| `/api/quests/:id/start` | POST | Start quest |
| `/api/quests/:id/progress` | POST | Update quest progress |
| `/api/quests/:id/complete` | POST | Complete quest |

### Streaks

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/streaks` | GET | Get user streaks |
| `/api/streaks/:id/checkin` | POST | Check in for streak |

---

## Smelting Tasks

### Phase 1: Core Infrastructure

| Task ID | Name | Tool | Dependencies |
|---------|------|------|--------------|
| ACH-001 | Create Firestore collections | createFirestoreCollection | - |
| ACH-002 | Configure Firebase Auth | configureFirebaseAuth | - |
| ACH-003 | Create GCS bucket for assets | provisionGCSBucket | - |
| ACH-004 | Deploy core API | deployCloudFunction | ACH-001 |

### Phase 2: Achievement System

| Task ID | Name | Tool | Dependencies |
|---------|------|------|--------------|
| ACH-101 | Build achievement registry | deployCloudFunction | ACH-004 |
| ACH-102 | Create progress tracker | deployCloudFunction | ACH-101 |
| ACH-103 | Implement unlock logic | deployCloudFunction | ACH-102 |
| ACH-104 | Build notification system | configurePubSub | ACH-103 |

### Phase 3: Quest System

| Task ID | Name | Tool | Dependencies |
|---------|------|------|--------------|
| ACH-201 | Build quest engine | deployCloudFunction | ACH-104 |
| ACH-202 | Create objective tracker | deployCloudFunction | ACH-201 |
| ACH-203 | Implement rewards | deployCloudFunction | ACH-202 |
| ACH-204 | Build streak system | deployCloudFunction | ACH-203 |

---

## Gilding Specification

### UI Framework

```json
{
  "framework": "react",
  "designSystem": "smelter-ui",
  "responsive": true,
  "accessibility": true,
  "animations": true
}
```

### Pages

| Page | Route | Components |
|------|-------|------------|
| Dashboard | `/` | ProgressRing, ActiveQuests, RecentAchievements |
| Achievements | `/achievements` | AchievementGrid, Filters, Stats |
| Quests | `/quests` | QuestBoard, QuestCard, StartButton |
| Profile | `/profile` | UserCard, Badges, Stats, Streaks |
| Leaderboard | `/leaderboard` | RankTable, Filters |

### Brand Specification

```json
{
  "colors": {
    "primary": "#7C3AED",
    "secondary": "#EC4899",
    "gold": "#F59E0B",
    "silver": "#9CA3AF",
    "bronze": "#D97706",
    "xp": "#22D3EE",
    "background": "#0F0F1A",
    "surface": "#1A1A2E",
    "text": "#FFFFFF"
  },
  "fonts": ["Poppins", "Inter"],
  "borderRadius": "1rem",
  "theme": "dark",
  "animations": {
    "levelUp": "confetti",
    "achievement": "glow",
    "streak": "pulse"
  }
}
```

---

## XP & Leveling System

### XP Requirements

| Level | Total XP Required | XP for Next Level |
|-------|-------------------|-------------------|
| 1 | 0 | 100 |
| 2 | 100 | 150 |
| 3 | 250 | 225 |
| 4 | 475 | 340 |
| 5 | 815 | 510 |
| ... | Formula: `sum(100 * 1.5^(n-1))` | `100 * 1.5^(n-1)` |

### Achievement Tiers XP

| Tier | XP Reward |
|------|-----------|
| Bronze | 50 |
| Silver | 150 |
| Gold | 400 |
| Platinum | 1000 |
| Legendary | 2500 |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Daily Active Users | TBD |
| Achievement Unlock Rate | > 70% |
| Quest Completion Rate | > 60% |
| Average Session Duration | > 5 min |
| Streak Retention | > 50% 7-day |

---

*This Ingot specification is maintained by the SmelterOS Foundry. SmelterOS is the builder. AchieveMor is the build.*
