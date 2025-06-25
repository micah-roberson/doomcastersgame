# DoomCaster - Strategic Card Game

A strategic card game built with React, Next.js, and TypeScript where you cast spells, fuse abilities, and defeat areas to become the ultimate DoomCaster!

## 🎮 Game Features

- **Strategic Spell Casting**: Cast up to 3 spells per turn with unique abilities
- **Element System**: Fire, Water, Wind, Earth, and Void elements with special interactions
- **Fusion Mechanics**: Combine spells to create powerful modifiers
- **Area Combat**: Defeat areas with different immunities and abilities
- **Combo System**: Chain elements for bonus damage
- **Real-time Game Log**: Track all your actions and game state

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd doomcaster-game
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🎯 How to Play

### Basic Rules
- **Objective**: Defeat all areas in the Area Zone
- **Turn Limit**: Cast up to 3 spells per turn
- **Spellbook**: Hold up to 5 spells at once
- **Elements**: Each spell has an element that affects gameplay

### Game Mechanics

#### Spell Abilities
- **Fuse (x)**: Attach this spell to another as a modifier
- **Combo: Element**: Get +3 damage if you've played the required element(s)
- **Banish**: Remove the spell from the game after casting
- **Attune [Element]**: Change the spell's element when cast
- **Add (x) To [Element]**: Bonus damage when attacking with that element
- **Refresh Spell Row**: Replace all spells in the spell row

#### Area Abilities
- **Consume Spell (x)**: Requires discarding x additional spells to attack
- **Immobile**: Special defensive ability
- **Immunity**: Areas are immune to damage from their element

### Strategy Tips
1. Use Shape Water's Fuse ability to combine spells
2. Play elements strategically for combo bonuses
3. Watch area immunities - don't waste spells!
4. Crystal Caverns requires sacrificing spells
5. Banished spells are gone forever
6. Attune can change spell elements mid-combat

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Deployment**: Vercel

## 📦 Build & Deploy

### Build for Production
```bash
npm run build
# or
yarn build
```

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Vercel will automatically detect Next.js and deploy

Or deploy manually:
```bash
npm install -g vercel
vercel
```

## 🎨 Customization

### Adding New Spells
Edit the `gameState` in `components/DoomCasterDemo.tsx`:

```typescript
{
  id: Date.now(),
  name: 'Your Spell Name',
  element: 'fire', // fire, water, wind, earth, void
  attack: 5,
  ability: 'Your ability description'
}
```

### Adding New Areas
```typescript
{
  id: Date.now(),
  name: 'Your Area Name',
  defense: 10,
  immunity: 'fire', // optional
  ability: 'Your area ability' // optional
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🎮 Game Credits

- **Game Design**: DoomCaster Team
- **Development**: Built with React & Next.js
- **Icons**: Lucide React
- **Styling**: Tailwind CSS

---

**Ready to become the ultimate DoomCaster?** 🧙‍♂️⚡ 