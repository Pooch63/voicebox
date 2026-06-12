# UI Comparison: Caregiver Mode vs Simple Mode

## Dashboard (Home Page)

### Caregiver Mode
```
┌────────────────────────────────────────────┐
│  Good morning                    [M] [U] ⚙ │
│  Ready for a great day?                    │
│                                            │
│  ┌─────────────┐  ┌─────────────┐        │
│  │ 💬          │  │ ❤️          │        │
│  │ AI Assistant│  │ Therapy     │        │
│  │             │  │ Practice    │        │
│  │ Practice... │  │ Continue... │        │
│  └─────────────┘  └─────────────┘        │
│                                            │
│              [🔔 Simulate Caregiver Ping] │
└────────────────────────────────────────────┘
M = Mode Toggle, U = User Menu
```

### Simple Mode
```
┌────────────────────────────────────────────┐
│                                       [M]  │
│                                            │
│         ┌──────────────────┐              │
│         │                  │              │
│         │    💬 (huge)     │              │
│         │      Talk        │              │
│         │                  │              │
│         └──────────────────┘              │
│                                            │
│         ┌──────────────────┐              │
│         │                  │              │
│         │    ❤️ (huge)     │              │
│         │    Practice      │              │
│         │                  │              │
│         └──────────────────┘              │
│                                            │
│         [🔔 Call Help (bigger)]           │
└────────────────────────────────────────────┘
```

## Therapy Session

### Caregiver Mode
```
┌───────┬────────────────────────────────────┐
│ Words │ Say                                │
│ Done: │                                    │
│       │         [Icon: Apple]              │
│ ✓ Hi  │                                    │
│ ✓ Yes │         Apple                      │
│       │       (size: 8xl)                  │
│       │                                    │
│       │    [Listening Animation]           │
│ [End] │                                    │
│       │ Excellent!                         │
│       │ Score: 85%                         │
│       │ Clarity: 90% Speed: 80%            │
│       │ Heard: "apple"                     │
└───────┴────────────────────────────────────┘
```

### Simple Mode
```
┌────────────────────────────────────────────┐
│ ← (big back arrow)                         │
│                                            │
│           Say                              │
│                                            │
│      [Icon: Apple (bigger)]                │
│                                            │
│          Apple                             │
│        (size: 9xl)                         │
│                                            │
│   [Listening Animation]                    │
│                                            │
│        ✓ Good!                             │
│       (size: 6xl)                          │
│                                            │
└────────────────────────────────────────────┘
(No sidebar, no detailed scores)
```

## Conversation Session

### Caregiver Mode
```
┌────────────────────────────────────────────┐
│                         [Settings] ⚙       │
│                                            │
│        [Setup Screen with options]         │
│        - How to answer (Tap/Type)          │
│        - Choice settings                   │
│        - Language preference               │
│                                            │
│  [Listening Indicator]                     │
│  [Question Display]                        │
│  [Response Buttons]                        │
│  [Type Response - on-screen keyboard]     │
│                                            │
└────────────────────────────────────────────┘
```

### Simple Mode
```
┌────────────────────────────────────────────┐
│ ← (back arrow)                             │
│                                            │
│  (Auto-starts with default settings)       │
│                                            │
│  [Listening Indicator]                     │
│  [Question Display]                        │
│  [Response Buttons]                        │
│                                            │
│  (No type response option)                 │
│                                            │
└────────────────────────────────────────────┘
```

## Key Visual Differences

| Feature | Caregiver Mode | Simple Mode |
|---------|---------------|-------------|
| **Button Size** | Normal cards | Large squares (aspect-square) |
| **Icons** | 32px | 120px |
| **Text Size** | 2xl-4xl | 5xl-9xl |
| **Descriptions** | Full sentences | Single words |
| **Colors** | Subtle gradients | Bold solid colors |
| **Layout** | Grid with info | Vertical stack, centered |
| **Back Navigation** | Settings button | Large arrow button |
| **Details** | Scores, stats | Minimal feedback |
| **Setup Screens** | Multi-step config | Auto-start |

## Design Philosophy

### Simple Mode Priorities:
1. **Large Touch Targets**: Easy to tap, even with motor difficulties
2. **High Contrast**: Clear visual distinction between elements
3. **Minimal Text**: Just what's essential
4. **Consistent Layout**: Same positions, easy to remember
5. **Immediate Action**: No confirmation dialogs
6. **Clear Feedback**: Simple ✓ or try again messages

### Caregiver Mode Priorities:
1. **Information Density**: Show all available data
2. **Configuration**: Full control over settings
3. **Analytics**: Detailed scoring and progress
4. **Flexibility**: Multiple input methods
5. **Professional UI**: Standard interface conventions
