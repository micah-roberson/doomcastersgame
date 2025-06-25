'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Target, Zap, Swords, Flame, Droplets, Wind, Mountain, Eye, ExternalLink } from 'lucide-react';

interface DemoSpell {
  name: string;
  element: string;
  attack: number;
  ability: string;
  modifier: string;
}

interface DemoArea {
  name: string;
  immunity: string;
  defense: number;
  ability: string;
  modifier: string;
}

interface ElementConfig {
  icon: React.ComponentType<any>;
  color: string;
  bg: string;
  gradient: string;
}

type ElementType = 'fire' | 'water' | 'wind' | 'earth' | 'void';

const DoomCasterDemo = () => {
  // Game rules: Starting spells are Conjure Fire, Shape Water, Gather Wind, Raise Earth, Unleash Void
  const spells: DemoSpell[] = [
    { name: 'Conjure Fire', element: 'fire', attack: 5, ability: 'Combo', modifier: '+2 ATK' },
    { name: 'Shape Water', element: 'water', attack: 3, ability: 'Fuse', modifier: '+1 Attune' },
    { name: 'Gather Wind', element: 'wind', attack: 3, ability: 'Combo', modifier: '+1 ATK' },
    { name: 'Raise Earth', element: 'earth', attack: 4, ability: 'Shield', modifier: '+3 Defense' },
    { name: 'Unleash Void', element: 'void', attack: 7, ability: 'Pierce Immunity', modifier: 'Ignore All' },
    { name: 'Lightning Bolt', element: 'wind', attack: 6, ability: 'Quick Cast', modifier: '+Speed' },
    { name: 'Meteor Strike', element: 'fire', attack: 8, ability: 'Area Effect', modifier: '+Multi-target' }
  ];

  // Real area cards from rules - Stage 1 can be targeted alone, Stage 2 requires both together
  const areas: DemoArea[] = [
    { name: 'Towering Fortress', immunity: 'none', defense: 40, ability: 'Fortified', modifier: '+3 ATK' },
    { name: 'Crystal Caves', immunity: 'water', defense: 25, ability: 'Reflect', modifier: '+Crystal Power' },
    { name: 'Burning Sands', immunity: 'fire', defense: 30, ability: 'Scorch', modifier: '+Fire Attune' },
    // Stage 2 areas that must be defeated together
    { name: 'Ancient Library', immunity: 'wind', defense: 35, ability: 'Consume Spell', modifier: '+Wisdom' },
    { name: 'Shadow Realm', immunity: 'earth', defense: 45, ability: 'Consume Spell', modifier: '+Shadow Magic' }
  ];

  const elements: Record<ElementType, ElementConfig> = {
    fire: { icon: Flame, color: 'text-orange-300', bg: 'bg-orange-500/20', gradient: 'from-orange-400/30 to-red-500/30' },
    water: { icon: Droplets, color: 'text-cyan-300', bg: 'bg-cyan-500/20', gradient: 'from-cyan-400/30 to-blue-500/30' },
    wind: { icon: Wind, color: 'text-emerald-300', bg: 'bg-emerald-500/20', gradient: 'from-emerald-400/30 to-green-500/30' },
    earth: { icon: Mountain, color: 'text-amber-300', bg: 'bg-amber-500/20', gradient: 'from-amber-400/30 to-yellow-600/30' },
    void: { icon: Eye, color: 'text-violet-300', bg: 'bg-violet-500/20', gradient: 'from-violet-400/30 to-purple-500/30' }
  };

  const [currentDemo, setCurrentDemo] = useState('advertisement');
  const [animationState, setAnimationState] = useState('');
  const [selectedSpell, setSelectedSpell] = useState<DemoSpell | null>(null);
  const [selectedArea, setSelectedArea] = useState<DemoArea | null>(null);
  const [turnCounter, setTurnCounter] = useState(1);
  const [gameState, setGameState] = useState({
    difficulty: 'acolyte' as 'acolyte' | 'archmage',
    stage1Cards: 3,
    stage2Cards: 2,
    spellsInBook: 5,
    spellsCastThisTurn: 0,
    worldEndRevealed: false
  });

  // Victory sequence following actual rules
  const [victorySequence, setVictorySequence] = useState({
    spell1: null as DemoSpell | null,
    spell2: null as DemoSpell | null,
    spell3: null as DemoSpell | null,
    totalDamage: 0,
    targetCombinedDefense: 80, // Stage 2: Ancient Library (35) + Shadow Realm (45)
    step: 0,
    modifiersUsed: [] as string[]
  });

  const CardPlaceholder = ({ 
    type, 
    label, 
    element = 'none',
    attack = 0,
    defense = 0,
    ability = '',
    faceDown = false, 
    glowing = false, 
    destroyed = false,
    casting = false,
    exploding = false,
    onClick
  }: {
    type: string;
    label: string;
    element?: string;
    attack?: number;
    defense?: number;
    ability?: string;
    faceDown?: boolean;
    glowing?: boolean;
    destroyed?: boolean;
    casting?: boolean;
    exploding?: boolean;
    onClick?: () => void;
  }) => {
    const elementConfig = elements[element as ElementType];
    
    return (
      <div 
        className={`
          relative w-32 h-44 rounded-xl border-2 p-3 cursor-pointer transition-all duration-300
          ${faceDown ? 'bg-gray-800 border-gray-600' : `bg-gradient-to-br ${elementConfig?.gradient || 'from-gray-700/30 to-gray-800/30'} border-gray-500`}
          ${glowing ? 'ring-2 ring-yellow-400 shadow-lg shadow-yellow-400/50' : ''}
          ${casting ? 'animate-pulse' : ''}
          ${exploding ? 'animate-bounce' : ''}
          ${destroyed ? 'opacity-50 grayscale' : ''}
          hover:scale-105 hover:border-white/50
        `}
        onClick={onClick}
      >
        {!faceDown ? (
          <>
            <div className="text-center mb-2">
              <div className="text-xs font-bold text-white truncate">{label}</div>
              {elementConfig?.icon && React.createElement(elementConfig.icon, { 
                className: `${elementConfig.color} mx-auto`, 
                size: 20 
              })}
            </div>
            
            {type === 'spell' && (
              <div className="text-center">
                <div className="text-lg font-bold text-yellow-400">{attack}</div>
                <div className="text-xs text-gray-300 mt-1">{ability}</div>
              </div>
            )}
            
            {type === 'area' && (
              <div className="text-center">
                <div className="text-lg font-bold text-blue-400">{defense}</div>
                <div className="text-xs text-gray-300 mt-1">Immune: {element}</div>
                <div className="text-xs text-gray-300">{ability}</div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-6xl">🎴</div>
          </div>
        )}
      </div>
    );
  };

  const triggerAnimation = (type: string) => {
    setAnimationState(type);
    setTimeout(() => setAnimationState(''), 2000);
  };

  // Advertisement following actual game marketing
  const demoAdvertisement = () => {
    setCurrentDemo('advertisement');
    setSelectedSpell(spells[0]); // Start with Conjure Fire
    triggerAnimation('epic-intro');
    
    // Cycle through featured spells
    setTimeout(() => setSelectedSpell(spells[4]), 3000); // Unleash Void
    setTimeout(() => setSelectedSpell(spells[1]), 6000); // Shape Water
  };

  // Live gameplay following turn structure rules
  const demoGameplay = () => {
    setCurrentDemo('gameplay');
    setTurnCounter(1);
    setGameState(prev => ({ ...prev, spellsCastThisTurn: 0 }));
    
    // Turn actions as per rules: freeform but up to 3 spells per turn
    setTimeout(() => {
      setSelectedSpell(spells[0]); // Conjure Fire
      setSelectedArea(areas[0]); // Towering Fortress (40 defense)
      triggerAnimation('cast-spell-1');
      setGameState(prev => ({ ...prev, spellsCastThisTurn: 1 }));
    }, 1000);
    
    // Show damage calculation: 5 fire damage vs 40 defense = area not destroyed
    setTimeout(() => {
      triggerAnimation('area-damaged');
    }, 2500);
    
    // Cast second spell with Fuse ability
    setTimeout(() => {
      setSelectedSpell(spells[1]); // Shape Water with Fuse
      triggerAnimation('fuse-demonstration');
      setGameState(prev => ({ ...prev, spellsCastThisTurn: 2 }));
    }, 4000);
    
    // End turn - damage resets as per rules
    setTimeout(() => {
      triggerAnimation('turn-end');
      setTurnCounter(2);
      setGameState(prev => ({ ...prev, spellsCastThisTurn: 0 }));
    }, 6000);
  };

  // Victory sequence following Stage 2 rules: must defeat both areas together
  const demoVictory = () => {
    setCurrentDemo('victory');
    
    // Stage 2 rules: Ancient Library (35) + Shadow Realm (45) = 80 combined defense
    // Both have "Consume Spell" ability - must discard spell when targeting
    setVictorySequence({
      spell1: spells[0], // Conjure Fire (5 damage)
      spell2: spells[4], // Unleash Void (7 damage, pierces immunity)
      spell3: spells[6], // Meteor Strike (8 damage) 
      totalDamage: 0,
      targetCombinedDefense: 80,
      step: 0,
      modifiersUsed: []
    });
    
    triggerAnimation('victory-setup');
    
    // Turn sequence with proper modifier stacking
    setTimeout(() => {
      setVictorySequence(prev => ({ 
        ...prev, 
        step: 1, 
        totalDamage: 5, // Conjure Fire base
        modifiersUsed: ['Base Fire damage']
      }));
      triggerAnimation('cast-spell-1');
    }, 1000);
    
    setTimeout(() => {
      setVictorySequence(prev => ({ 
        ...prev, 
        step: 2, 
        totalDamage: 12, // + Unleash Void (7) 
        modifiersUsed: [...prev.modifiersUsed, 'Void pierces immunity']
      }));
      triggerAnimation('cast-spell-2');
    }, 3000);
    
    setTimeout(() => {
      setVictorySequence(prev => ({ 
        ...prev, 
        step: 3, 
        totalDamage: 20, // + Meteor Strike (8)
        modifiersUsed: [...prev.modifiersUsed, 'Area effect damage']
      }));
      triggerAnimation('cast-spell-3');
    }, 5000);
    
    // Show modifier stacking for final victory
    setTimeout(() => {
      setVictorySequence(prev => ({ 
        ...prev, 
        step: 4, 
        totalDamage: 85, // With modifier stacking from defeated areas
        modifiersUsed: [...prev.modifiersUsed, 'Fused modifiers: +65 total']
      }));
      triggerAnimation('modifiers-applied');
    }, 7000);
    
    setTimeout(() => {
      setVictorySequence(prev => ({ ...prev, step: 5 }));
      triggerAnimation('stage-2-defeated');
      setGameState(prev => ({ ...prev, worldEndRevealed: true }));
    }, 9000);
  };

  const demoAbilities = () => {
    setCurrentDemo('abilities');
    triggerAnimation('abilities-showcase');
  };

  const toggleDifficulty = () => {
    setGameState(prev => ({
      ...prev,
      difficulty: prev.difficulty === 'acolyte' ? 'archmage' : 'acolyte',
      stage1Cards: prev.difficulty === 'acolyte' ? 4 : 3,
      stage2Cards: prev.difficulty === 'acolyte' ? 4 : 2
    }));
  };

  const resetDemo = () => {
    setCurrentDemo('advertisement');
    setTurnCounter(1);
    setAnimationState('');
    setSelectedSpell(null);
    setSelectedArea(null);
    setVictorySequence(prev => ({ ...prev, step: 0, totalDamage: 0, modifiersUsed: [] }));
    setGameState(prev => ({ ...prev, worldEndRevealed: false, spellsCastThisTurn: 0 }));
    demoAdvertisement();
  };

  useEffect(() => {
    demoAdvertisement();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-8 bg-gradient-to-br from-indigo-950 via-violet-900 to-purple-950 text-white rounded-2xl shadow-2xl border border-violet-800/30 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-purple-500/10 to-pink-500/5 opacity-60"></div>
      <div className="absolute inset-0 bg-radial-gradient opacity-30"></div>
      
      <div className="relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent mb-4">
            DoomCaster: Strategic Spell Combat
          </h1>
          <div className="flex justify-center items-center gap-6 mb-6">
            <span className="text-violet-200 font-medium">Difficulty:</span>
            <button
              onClick={toggleDifficulty}
              className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
                gameState.difficulty === 'acolyte' 
                  ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-emerald-100' 
                  : 'bg-gradient-to-r from-rose-500 to-red-500 text-rose-100'
              } border border-white/20`}
            >
              {gameState.difficulty === 'acolyte' ? 'Acolyte (20 min)' : 'Archmage (40 min)'}
            </button>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="grid grid-cols-4 gap-6 mb-10">
          <button
            onClick={demoAdvertisement}
            className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 text-white font-bold py-4 px-5 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3"
          >
            <Sparkles size={18} />
            Epic Trailer
          </button>
          <button
            onClick={demoGameplay}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold py-4 px-5 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3"
          >
            <Target size={18} />
            Turn Actions
          </button>
          <button
            onClick={demoVictory}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold py-4 px-5 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3"
          >
            <Zap size={18} />
            Stage Victory
          </button>
          <button
            onClick={demoAbilities}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold py-4 px-5 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3"
          >
            <Swords size={18} />
            Abilities
          </button>
        </div>

        {/* Game Board */}
        <div className="bg-gradient-to-br from-indigo-950/40 via-violet-950/30 to-purple-950/40 rounded-2xl p-8 min-h-[700px] border border-violet-800/20">
          
          {/* World End Card */}
          {gameState.difficulty === 'archmage' && (
            <div className="text-center mb-6">
              <div className="inline-block">
                <CardPlaceholder 
                  type="world" 
                  label="World End" 
                  faceDown={!gameState.worldEndRevealed}
                  glowing={gameState.worldEndRevealed}
                />
              </div>
              <div className="text-sm text-gray-400 mt-1">Final Victory Card</div>
            </div>
          )}

          {/* Area Zone - Following actual game setup */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-center mb-4 text-purple-400">Area Zone</h3>
            
            {currentDemo === 'victory' ? (
              <div className="text-center mb-4">
                <div className="text-sm text-gray-400 mb-2">Stage 2 - Combined Assault Required</div>
                <div className="flex justify-center gap-2">
                  <CardPlaceholder 
                    type="area" 
                    label="Ancient Library"
                    element="wind"
                    defense={35}
                    ability="Consume Spell"
                    exploding={animationState === 'stage-2-defeated'}
                    destroyed={victorySequence.step >= 5}
                  />
                  <CardPlaceholder 
                    type="area" 
                    label="Shadow Realm"
                    element="earth"
                    defense={45}
                    ability="Consume Spell"
                    exploding={animationState === 'stage-2-defeated'}
                    destroyed={victorySequence.step >= 5}
                  />
                </div>
                <div className="text-center mt-2 text-yellow-400 font-bold">
                  Combined Defense: {victorySequence.targetCombinedDefense}
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <div className="text-center text-sm text-gray-400 mb-2">Stage 1 - Individual Targets</div>
                <div className="flex justify-center gap-2">
                  {areas.slice(0, gameState.stage1Cards).map((area, i) => (
                    <CardPlaceholder 
                      key={`stage1-${i}`} 
                      type="area" 
                      label={area.name}
                      element={area.immunity.toLowerCase()}
                      defense={area.defense}
                      ability={area.ability}
                      glowing={selectedArea?.name === area.name}
                      exploding={animationState === 'area-damaged' && i === 0}
                      onClick={() => setSelectedArea(area)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Victory Sequence Display */}
          {currentDemo === 'victory' && (
            <div className="mb-8 bg-gray-800/50 rounded-lg p-6">
              <h3 className="text-xl font-bold text-center mb-4 text-yellow-400">Stage 2 Victory Sequence</h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {[victorySequence.spell1, victorySequence.spell2, victorySequence.spell3].map((spell, i) => (
                  <div key={i} className="text-center">
                    <div className="text-sm text-gray-400 mb-2">Spell Cast {i + 1}</div>
                    {spell && (
                      <CardPlaceholder 
                        type="spell"
                        label={spell.name}
                        element={spell.element}
                        attack={spell.attack}
                        ability={spell.ability}
                        casting={victorySequence.step === i + 1}
                        glowing={victorySequence.step > i}
                      />
                    )}
                  </div>
                ))}
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold mb-2">
                  Damage Dealt: <span className="text-yellow-400">{victorySequence.totalDamage}</span> / {victorySequence.targetCombinedDefense}
                </div>
                <div className="text-sm text-gray-300 mb-2">
                  Modifiers: {victorySequence.modifiersUsed.join(', ')}
                </div>
                {victorySequence.step >= 5 && (
                  <div className="text-4xl font-bold text-green-400">
                    🏆 STAGE 2 CLEARED! 🏆
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Spell Row - Max 5 as per rules */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-center mb-4 text-purple-400">Spell Row (Acquire New Spells)</h3>
            <div className="flex justify-center gap-2">
              {spells.slice(0, 5).map((spell, i) => (
                <CardPlaceholder 
                  key={`spell-row-${i}`} 
                  type="spell" 
                  label={spell.name}
                  element={spell.element}
                  attack={spell.attack}
                  ability={spell.ability}
                  glowing={selectedSpell?.name === spell.name}
                  casting={animationState === 'cast-spell-1' && i === 0}
                  onClick={() => setSelectedSpell(spell)}
                />
              ))}
            </div>
          </div>

          {/* Player's Spellbook - Max 5 slots as per rules */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-center mb-4 text-purple-400">Your Spellbook (Max 5 Spells)</h3>
            <div className="flex justify-center gap-2">
              {spells.slice(0, gameState.spellsInBook).map((spell, i) => (
                <CardPlaceholder 
                  key={`spellbook-${i}`} 
                  type="spell" 
                  label={spell.name}
                  element={spell.element}
                  attack={spell.attack}
                  ability={spell.ability}
                  onClick={() => setSelectedSpell(spell)}
                />
              ))}
            </div>
            <div className="text-center mt-2 text-gray-400 text-sm">
              Spells Cast This Turn: {gameState.spellsCastThisTurn} / 3
            </div>
          </div>

          {/* Demo Content */}
          <div className="mt-8 bg-gray-800/50 rounded-lg p-6">
            {currentDemo === 'advertisement' && (
              <div className="text-center space-y-6">
                <div className="text-6xl mb-4">⚡</div>
                <h2 className="text-3xl font-bold text-purple-400">Master the Elements. Destroy the World.</h2>
                <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                  Strategic spell combat where every element matters. Build the ultimate spellbook, exploit enemy weaknesses, and become the strongest DoomCaster!
                </p>
                
                {selectedSpell && (
                  <div className="flex justify-center mt-8">
                    <div className={`bg-gradient-to-br ${elements[selectedSpell.element as ElementType]?.gradient} p-8 rounded-xl transform scale-110`}>
                      <div className="flex items-center gap-4 mb-4">
                        {elements[selectedSpell.element as ElementType]?.icon && 
                          React.createElement(elements[selectedSpell.element as ElementType].icon, { 
                            className: `${elements[selectedSpell.element as ElementType].color} animate-pulse`, 
                            size: 48 
                          })
                        }
                        <div>
                          <h3 className="text-2xl font-bold">{selectedSpell.name}</h3>
                          <p className="text-gray-200">{selectedSpell.ability} • {selectedSpell.element}</p>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-4xl font-bold text-yellow-400">{selectedSpell.attack} ATK</div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-3 gap-6 mt-8">
                  <div className="bg-red-900/30 p-6 rounded-lg">
                    <div className="text-3xl mb-2">🔥</div>
                    <h3 className="font-bold text-red-400">Strategic Depth</h3>
                    <p className="text-sm text-gray-400">5 elements, immunity systems, modifier stacking</p>
                  </div>
                  <div className="bg-blue-900/30 p-6 rounded-lg">
                    <div className="text-3xl mb-2">⚔️</div>
                    <h3 className="font-bold text-blue-400">Turn Structure</h3>
                    <p className="text-sm text-gray-400">Freeform actions, 3 spells per turn, area targeting</p>
                  </div>
                  <div className="bg-purple-900/30 p-6 rounded-lg">
                    <div className="text-3xl mb-2">🎯</div>
                    <h3 className="font-bold text-purple-400">Victory Conditions</h3>
                    <p className="text-sm text-gray-400">Destroy stage areas, claim World End card</p>
                  </div>
                </div>
              </div>
            )}

            {currentDemo === 'gameplay' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-center text-purple-400">Turn {turnCounter} - Live Action!</h2>
                
                {selectedSpell && selectedArea && (
                  <div className="flex justify-center gap-8">
                    <div className={`bg-gradient-to-br ${elements[selectedSpell.element as ElementType]?.gradient} p-6 rounded-xl`}>
                      <h3 className="text-xl font-bold mb-2">{selectedSpell.name}</h3>
                      <div className="text-3xl font-bold text-yellow-400">{selectedSpell.attack} ATK</div>
                      <div className="text-sm text-gray-300">{selectedSpell.ability}</div>
                    </div>
                    
                    <div className="text-4xl self-center">→</div>
                    
                    <div className="bg-gradient-to-br from-red-500/30 to-orange-500/30 p-6 rounded-xl">
                      <h3 className="text-xl font-bold mb-2">{selectedArea.name}</h3>
                      <div className="text-3xl font-bold text-blue-400">{selectedArea.defense} DEF</div>
                      <div className="text-sm text-gray-300">Immune: {selectedArea.immunity}</div>
                    </div>
                  </div>
                )}

                <div className="text-center bg-yellow-800/30 p-4 rounded-lg">
                  <h3 className="font-bold text-yellow-400">Combat Calculation</h3>
                  <p className="text-gray-300">
                    {selectedSpell?.attack || 0} damage vs {selectedArea?.defense || 0} defense = Area survives!
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Need modifiers or more spells to destroy high-defense areas
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="bg-blue-800/30 p-3 rounded">
                    <h3 className="font-bold text-blue-400">1. Acquire Spells</h3>
                    <p className="text-gray-300">From spell row to spellbook</p>
                  </div>
                  <div className="bg-green-800/30 p-3 rounded">
                    <h3 className="font-bold text-green-400">2. Cast Spells</h3>
                    <p className="text-gray-300">Up to 3 per turn, any order</p>
                  </div>
                  <div className="bg-purple-800/30 p-3 rounded">
                    <h3 className="font-bold text-purple-400">3. Use Abilities</h3>
                    <p className="text-gray-300">Fuse, Combo, special effects</p>
                  </div>
                </div>
              </div>
            )}

            {currentDemo === 'abilities' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-center text-purple-400">Core Game Abilities</h2>
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-red-900/30 p-4 rounded-lg">
                    <h3 className="font-bold text-red-400 mb-2 flex items-center gap-2">
                      <Flame size={20} />
                      Combo System
                    </h3>
                    <p className="text-sm text-gray-300">Match elements for bonus damage and effects</p>
                    <div className="mt-2 text-xs text-yellow-400">Fire + Fire element = +3 ATK</div>
                  </div>
                  
                  <div className="bg-blue-900/30 p-4 rounded-lg">
                    <h3 className="font-bold text-blue-400 mb-2 flex items-center gap-2">
                      <Droplets size={20} />
                      Fuse Mechanic
                    </h3>
                    <p className="text-sm text-gray-300">Permanently attach modifiers to spells</p>
                    <div className="mt-2 text-xs text-yellow-400">Build ultimate weapons through fusion</div>
                  </div>
                  
                  <div className="bg-green-900/30 p-4 rounded-lg">
                    <h3 className="font-bold text-green-400 mb-2 flex items-center gap-2">
                      <Wind size={20} />
                      Area Targeting
                    </h3>
                    <p className="text-sm text-gray-300">Stage 1: Individual, Stage 2+: Combined assault</p>
                    <div className="mt-2 text-xs text-yellow-400">Strategic target selection crucial</div>
                  </div>
                  
                  <div className="bg-purple-900/30 p-4 rounded-lg">
                    <h3 className="font-bold text-purple-400 mb-2 flex items-center gap-2">
                      <Eye size={20} />
                      Immunity System
                    </h3>
                    <p className="text-sm text-gray-300">Areas block specific elements completely</p>
                    <div className="mt-2 text-xs text-yellow-400">Void magic pierces all immunities</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={resetDemo}
            className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors duration-200"
          >
            Reset Demo
          </button>
          <button
            onClick={() => window.open('https://github.com/doomcaster/rules', '_blank')}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center gap-2 font-bold"
          >
            <ExternalLink size={20} />
            Complete Rules & Cards
          </button>
        </div>

        {/* Game Info Footer */}
        <div className="mt-8 text-center text-sm text-gray-400 bg-black/20 rounded-lg p-4">
          <p className="text-lg font-bold text-purple-400 mb-2">DoomCaster: Strategic Spell Combat</p>
          <p>2 Players • {gameState.difficulty === 'acolyte' ? '20' : '30-40'} minutes • Ages 13+</p>
          <p className="mt-2">Master elements • Exploit weaknesses • Claim ultimate power</p>
        </div>
      </div>
    </div>
  );
};

export default DoomCasterDemo; 