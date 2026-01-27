---
name: smelteros-ui-patterns
description: UI design patterns and component templates for SmelterOS. Use this when building new pages, layouts, or interactive components.
---

# SmelterOS UI Patterns

Reference guide for implementing consistent UI patterns across SmelterOS applications.

---

## 🏗️ Page Layout Templates

### Standard Page Layout

```tsx
"use client"

export default function PageName() {
  return (
    <div className="min-h-screen bg-[#181311] text-white font-display">
      {/* Background Layer */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-foundry-grid opacity-30" />
      </div>

      {/* Content Layer */}
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-[#3a2c27] bg-[#181311]/90 backdrop-blur-md">
          {/* Navigation content */}
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-8">
          {/* Page content */}
        </main>
      </div>
    </div>
  )
}
```

### Hero Landing Layout

```tsx
"use client"

export default function LandingPage() {
  return (
    <div className="relative min-h-screen w-full flex flex-col">
      {/* Full-screen Background */}
      <div className="fixed inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url("/assets/magma-bg.jpg")' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f0c08] via-[#0f0c08]/90 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0c08] via-transparent to-[#0f0c08]/50" />
      </div>

      {/* Floating Header */}
      <header className="fixed top-0 left-0 right-0 z-50 p-4">
        <div className="glass-panel rounded-xl px-6 py-4 max-w-[1440px] mx-auto">
          {/* Navigation */}
        </div>
      </header>

      {/* Hero Content */}
      <main className="relative z-10 flex flex-grow items-center pt-24 pb-12">
        <div className="container mx-auto px-6 max-w-[1440px]">
          {/* Hero text and CTA */}
        </div>
      </main>
    </div>
  )
}
```

### Dashboard Layout (3-Column)

```tsx
"use client"

export default function DashboardPage() {
  return (
    <div className="h-screen flex flex-col bg-[#181311] text-white">
      {/* Top Nav */}
      <header className="shrink-0 border-b border-[#3a2c27] bg-[#181311]/90 backdrop-blur-md">
        {/* Navigation */}
      </header>

      {/* 3-Column Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-64 bg-[#181311]/95 border-r border-[#3a2c27] overflow-y-auto">
          {/* Navigation menu */}
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Dashboard content */}
        </main>

        {/* Right Panel (Optional) */}
        <aside className="w-80 bg-[#1e1614] border-l border-[#3a2c27] overflow-y-auto">
          {/* Activity feed, details, etc. */}
        </aside>
      </div>
    </div>
  )
}
```

---

## 🎨 Glass Panel System

### Standard Glass Panel

```css
.glass-panel {
  background: rgba(24, 20, 17, 0.4);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
```

### Tailwind Implementation

```tsx
<div className="bg-[#181311]/40 backdrop-blur-xl border border-white/10 rounded-xl p-6">
  {/* Content */}
</div>
```

### Elevated Glass Panel

```tsx
<div className="bg-[#1e1614]/60 backdrop-blur-md border border-[#3a2c27] rounded-xl shadow-2xl p-6">
  {/* Important content */}
</div>
```

---

## 🔘 Button Patterns

### Primary Action (Forge Button)

```tsx
<button className="
  group relative flex items-center justify-center gap-3
  px-8 py-4 bg-[#f94706] hover:bg-[#ff9010]
  text-[#0f0c08] font-bold text-base tracking-wide
  rounded-lg transition-all duration-300
  shadow-[0_0_20px_rgba(249,71,6,0.3)]
">
  <span className="material-symbols-outlined">local_fire_department</span>
  <span>Enter the Foundry</span>
</button>
```

### Secondary Action (Glass Button)

```tsx
<button className="
  group flex items-center justify-center gap-3
  px-8 py-4 bg-transparent hover:bg-white/10
  text-white font-bold text-base tracking-wide
  rounded-lg transition-all
  border border-white/20 backdrop-blur-sm
">
  <span className="material-symbols-outlined text-[#f94706]">smart_toy</span>
  <span>Consult ACHEEVY</span>
</button>
```

### Icon Button

```tsx
<button className="
  size-10 flex items-center justify-center
  rounded-lg bg-[#f94706]/20 text-[#f94706]
  border border-[#f94706]/30
  hover:bg-[#f94706]/30 transition-colors
">
  <span className="material-symbols-outlined text-xl">science</span>
</button>
```

---

## 🃏 Card Patterns

### Module Card (Selectable)

```tsx
<div className="
  group relative flex flex-col
  bg-[#23140f] border border-[#3a2c27] rounded-xl
  overflow-hidden hover:border-[#f94706] transition-all cursor-pointer
">
  {/* Image */}
  <div 
    className="h-40 bg-cover bg-center"
    style={{ backgroundImage: "url('/module-image.jpg')" }}
  />
  
  {/* Content */}
  <div className="p-5">
    <h3 className="text-white font-semibold text-lg">Module Name</h3>
    <p className="text-[#8e7870] text-sm mt-1">Module description here.</p>
  </div>
</div>
```

### Selected Card State

```tsx
<div className="
  relative flex flex-col
  bg-[#23140f] border-2 border-cyan-400 rounded-xl
  overflow-hidden cursor-pointer
  shadow-[0_0_15px_rgba(34,211,238,0.4)]
  transform scale-[1.02]
">
  {/* Content */}
  <div className="p-5 bg-gradient-to-b from-[#23140f] to-[#1a2332]">
    <div className="flex justify-between items-start">
      <h3 className="text-cyan-400 font-bold text-lg">Selected Module</h3>
      <span className="material-symbols-outlined text-cyan-400">check_circle</span>
    </div>
  </div>
</div>
```

### System Status Card

```tsx
<div className="p-4 rounded-lg bg-[#23140f] border border-[#3a2c27]">
  <p className="text-xs text-[#8e7870] uppercase font-bold mb-3">System Status</p>
  
  {/* Progress Bar */}
  <div className="space-y-3">
    <div>
      <div className="flex justify-between text-xs text-white mb-1">
        <span>CPU Load</span>
        <span className="text-[#f94706]">34%</span>
      </div>
      <div className="w-full bg-[#3a2c27] h-1 rounded-full">
        <div className="bg-[#f94706] h-1 rounded-full" style={{ width: '34%' }} />
      </div>
    </div>
    
    <div>
      <div className="flex justify-between text-xs text-white mb-1">
        <span>Memory</span>
        <span className="text-cyan-500">62%</span>
      </div>
      <div className="w-full bg-[#3a2c27] h-1 rounded-full">
        <div className="bg-cyan-500 h-1 rounded-full" style={{ width: '62%' }} />
      </div>
    </div>
  </div>
</div>
```

---

## 📊 Form Patterns

### Input Field

```tsx
<label className="flex flex-col">
  <span className="text-white text-sm font-medium pb-2">Agent Name</span>
  <input
    type="text"
    className="
      w-full rounded-lg text-white
      border border-[#55413a] bg-[#271e1b]
      h-12 px-4
      focus:ring-1 focus:ring-[#f94706] outline-none
      placeholder:text-[#8e7870]
    "
    placeholder="Enter agent name..."
  />
</label>
```

### Select Dropdown

```tsx
<label className="flex flex-col">
  <span className="text-white text-sm font-medium pb-2">Role</span>
  <select className="
    w-full rounded-lg text-white
    border border-[#55413a] bg-[#271e1b]
    h-12 px-4
    focus:ring-1 focus:ring-[#f94706] outline-none
  ">
    <option>Data Processing</option>
    <option>Network Security</option>
  </select>
</label>
```

### Range Slider

```tsx
<div className="bg-[#271e1b] rounded-lg p-5 border border-[#3a2c27]">
  <div className="flex justify-between items-center mb-4">
    <span className="text-white font-medium">CPU Cores</span>
    <span className="text-[#f94706] font-bold font-mono bg-[#f94706]/10 px-2 py-1 rounded">
      4 Cores
    </span>
  </div>
  <input
    type="range"
    min="1"
    max="16"
    className="w-full h-2 bg-[#3a2c27] rounded-lg appearance-none cursor-pointer"
  />
</div>
```

---

## 🎭 Status Indicators

### Online Status Badge

```tsx
<span className="text-xs text-green-500 flex items-center gap-1">
  <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
  Online
</span>
```

### System Status Badge

```tsx
<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#f94706]/30 bg-[#f94706]/10">
  <span className="flex h-2 w-2 rounded-full bg-[#f94706] animate-pulse" />
  <span className="text-xs font-bold uppercase tracking-wider text-[#f94706]">
    System Online v2.4
  </span>
</div>
```

### Validation Check

```tsx
<div className="flex items-center gap-3 p-3 rounded bg-[#271e1b] border border-[#3a2c27]">
  <div className="size-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
    <span className="material-symbols-outlined text-lg">check</span>
  </div>
  <div className="flex flex-col">
    <span className="text-white text-sm">API Validated</span>
    <span className="text-[#bba39b] text-xs">Connection successful</span>
  </div>
</div>
```

---

## ⏳ Loading States

### Skeleton Card

```tsx
<div className="animate-pulse">
  <div className="h-40 bg-[#3a2c27] rounded-t-xl" />
  <div className="p-5 bg-[#23140f] rounded-b-xl space-y-3">
    <div className="h-5 bg-[#3a2c27] rounded w-3/4" />
    <div className="h-4 bg-[#3a2c27] rounded w-full" />
  </div>
</div>
```

### Spinner

```tsx
<div className="flex items-center justify-center p-8">
  <div className="size-8 border-2 border-[#f94706] border-t-transparent rounded-full animate-spin" />
</div>
```

---

## 🎯 When to Use This Skill

1. **Building new pages** — Start with a layout template
2. **Creating components** — Use the component patterns as a base
3. **Implementing forms** — Follow the form patterns
4. **Adding interactivity** — Reference button and card states
5. **Status displays** — Use the status indicator patterns
