'use client'

import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, Target, Zap, Flame, Droplets, Wind, Mountain, Eye, LucideIcon, ExternalLink, Sparkles, Swords, Shield } from 'lucide-react';

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
  icon: LucideIcon;
  color: string;
  bg: string;
  gradient: string;
}

type ElementType = 'fire' | 'water' | 'wind' | 'earth' | 'void';

const DoomCasterDemo = () => {
  const [currentDemo, setCurrentDemo] = useState('advertisement');
  const [gameState, setGameState] = useState({
    player1Spells: 5,
    player2Spells: 5,
    spellRowCards: 5,
    stage1Cards: 3,
    stage2Cards: 2,
    stage3Cards: 0,
    artifactCards: 0,
    worldEndRevealed: false,
    difficulty: 'acolyte'
  });
  const [animationState, setAnimationState] = useState('');
  const [turnCounter, setTurnCounter] = useState(1);
  const [selectedSpell, setSelectedSpell] = useState<DemoSpell | null>(null);
  const [selectedArea, setSelectedArea] = useState<DemoArea | null>(null);
  const [modifiers, setModifiers] = useState<string[]>([]);
  const [victorySequence, setVictorySequence] = useState({
    spell1: null as DemoSpell | null,
    spell2: null as DemoSpell | null,
    spell3: null as DemoSpell | null,
    totalDamage: 0,
    targetArea: null as DemoArea | null,
    step: 0
  });

  // Element configuration
  const elements: Record<ElementType, ElementConfig> = {
    fire: { icon: Flame, color: 'text-red-500', bg: 'bg-red-900/50', gradient: 'from-red-800 to-orange-800' },
    water: { icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-900/50', gradient: 'from-blue-800 to-cyan-800' },
    wind: { icon: Wind, color: 'text-green-500', bg: 'bg-green-900/50', gradient: 'from-green-800 to-emerald-800' },
    earth: { icon: Mountain, color: 'text-yellow-600', bg: 'bg-yellow-900/50', gradient: 'from-yellow-800 to-orange-800' },
    void: { icon: Eye, color: 'text-purple-500', bg: 'bg-purple-900/50', gradient: 'from-purple-800 to-violet-800' }
  };

  // Real spell data from CSV
  const spells: DemoSpell[] = [
    { name: 'Conjure Fire', element: 'fire', attack: 5, ability: 'None', modifier: '+3 ATK' },
    { name: 'Shape Water', element: 'water', attack: 0, ability: 'Fuse', modifier: '+3 ATK' },
    { name: 'Gather Wind', element: 'wind', attack: 3, ability: 'Combo [Fire] or [Water] or [Earth] = +1 ATK, +1 Spell Cast', modifier: '+2 ATK' },
    { name: 'Raise Earth', element: 'earth', attack: 4, ability: 'Scout Area Card', modifier: '+2 ATK' },
    { name: 'Unleash Void', element: 'void', attack: 0, ability: 'Refresh Spell Row + Banish', modifier: '+3 ATK' },
    { name: 'Wrath of Midas', element: 'earth', attack: 4, ability: 'Shift Area Card', modifier: '+3 ATK' },
    { name: 'Fireball', element: 'fire', attack: 4, ability: 'Combo [Fire] = +3 ATK', modifier: '+3 ATK' },
    { name: 'Tsunami', element: 'water', attack: 4, ability: 'Refresh Spell Row', modifier: 'Re-Fuse' },
    { name: 'Earthquake', element: 'earth', attack: 4, ability: 'Refresh Area Card', modifier: '+4 ATK to [Earth] Spell' },
    { name: 'Lightning Storm', element: 'wind', attack: 4, ability: 'Combo [Water] and [Earth] = +6 ATK', modifier: 'Instant Combo' }
  ];

  // Real area data from CSV
  const areas: DemoArea[] = [
    { name: 'Towering Fortress', immunity: 'None', defense: 40, ability: 'Immobile', modifier: '+5 ATK' },
    { name: 'Charred Ruins', immunity: 'Fire', defense: 15, ability: 'None', modifier: '+2 ATK, Make [Fire]' },
    { name: 'Sunken Citadel', immunity: 'Water', defense: 15, ability: 'None', modifier: '+2 ATK, Make [Water]' },
    { name: 'Mining Fields', immunity: 'Earth', defense: 20, ability: 'None', modifier: '+2 ATK, Make [Earth]' },
    { name: 'Sky Temple', immunity: 'Wind', defense: 10, ability: 'None', modifier: '+2 ATK, Make [Wind]' },
    { name: 'Cursed Lands', immunity: 'Void', defense: 10, ability: 'Cursed', modifier: '-3 ATK' },
    { name: 'Mirage Barrier', immunity: 'Fire, Water, Earth, Wind', defense: 15, ability: 'Consume Spell (x3)', modifier: '+2 ATK then x2 ATK' },
    { name: 'Rainbow Falls', immunity: 'Fire, Water, Earth, Wind', defense: 20, ability: 'None', modifier: 'x2 ATK' }
  ];

  // Card component with enhanced animations
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
    modifier = false,
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
    modifier?: boolean;
    casting?: boolean;
    exploding?: boolean;
    onClick?: () => void;
  }) => {
    const elementKey = element as ElementType;
    const isValidElement = element && Object.keys(elements).includes(element);
    const elementConfig = isValidElement ? elements[elementKey] : { 
      icon: null, 
      color: 'text-gray-400', 
      bg: 'bg-gray-900/50', 
      gradient: 'from-gray-800 to-gray-900' 
    };
    const IconComponent = elementConfig.icon;
    
    return (
      <div 
        className={`
          relative bg-gradient-to-br ${elementConfig.gradient}
          border-2 ${glowing ? 'border-yellow-400 shadow-lg shadow-yellow-400/50' : 'border-gray-600'}
          rounded-lg p-3 text-center transition-all duration-300 cursor-pointer
          ${destroyed ? 'opacity-20 scale-75 rotate-12' : ''}
          ${modifier ? 'transform rotate-180' : ''}
          ${casting ? 'spell-casting scale-110' : ''}
          ${exploding ? 'area-exploding' : ''}
          ${onClick ? 'hover:scale-105 hover:shadow-lg' : ''}
          min-h-[100px] flex flex-col justify-center
          ${glowing ? 'animate-pulse' : ''}
        `}
        onClick={onClick}
      >
        {faceDown ? (
          <div className="text-gray-400 text-xs">
            <div className="w-full h-8 bg-gray-700 rounded mb-1"></div>
            <div className="text-[10px]">Hidden</div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center mb-2">
              {IconComponent && <IconComponent className={elementConfig.color} size={20} />}
            </div>
            <div className="text-xs text-gray-200 font-medium mb-1">{label}</div>
            {attack > 0 && (
              <div className="text-xs text-yellow-400 font-bold">{attack} ATK</div>
            )}
            {defense > 0 && (
              <div className="text-xs text-cyan-400 font-bold">{defense} DEF</div>
            )}
            {ability && ability !== 'None' && (
              <div className="text-[8px] text-green-400 mt-1 truncate">{ability.split(' ')[0]}</div>
            )}
            {modifier && (
              <div className="absolute top-1 right-1 text-[8px] text-yellow-400">MOD</div>
            )}
            {casting && (
              <div className="absolute inset-0 bg-yellow-400/20 rounded-lg flex items-center justify-center">
                <Sparkles className="text-yellow-300 animate-spin" size={24} />
              </div>
            )}
            {exploding && (
              <div className="absolute inset-0 bg-red-500/30 rounded-lg flex items-center justify-center">
                <div className="text-red-300 font-bold text-lg">💥</div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const triggerAnimation = (type: string, duration = 2000) => {
    setAnimationState(type);
    setTimeout(() => setAnimationState(''), duration);
  };

  const demoAdvertisement = () => {
    setCurrentDemo('advertisement');
    setSelectedSpell(null);
    setSelectedArea(null);
    setModifiers([]);
    triggerAnimation('epic-intro', 4000);
    
    // Epic showcase sequence
    setTimeout(() => {
      setSelectedSpell(spells[6]); // Fireball
      triggerAnimation('spell-showcase');
    }, 1000);
    
    setTimeout(() => {
      setSelectedArea(areas[1]); // Charred Ruins
      triggerAnimation('area-showcase');
    }, 2500);
    
    setTimeout(() => {
      triggerAnimation('victory-tease');
    }, 4000);
  };

  const demoGameplay = () => {
    setCurrentDemo('gameplay');
    setTurnCounter(1);
    setSelectedSpell(spells[0]);
    triggerAnimation('spell-cast');
    
    setTimeout(() => {
      setSelectedArea(areas[1]);
      triggerAnimation('area-attack');
      setGameState(prev => ({ ...prev, stage1Cards: 2 }));
    }, 2000);
    
    setTimeout(() => {
      setModifiers([areas[1].modifier]);
      triggerAnimation('modifier-gained');
    }, 3500);
  };

  const demoVictory = () => {
    setCurrentDemo('victory');
    
    // Set up victory sequence - 3 spells that can defeat Rainbow Falls (20 defense, immune to all elements except Void)
    const targetArea = areas[7]; // Rainbow Falls - 20 defense, immune to Fire/Water/Earth/Wind
    const spell1 = spells[4]; // Unleash Void - 0 attack but pierces immunity
    const spell2 = spells[6]; // Fireball - 4 attack (blocked by immunity)
    const spell3 = spells[4]; // Another Unleash Void
    
    setVictorySequence({
      spell1,
      spell2, 
      spell3,
      totalDamage: 0,
      targetArea,
      step: 0
    });
    
    triggerAnimation('victory-setup');
    
    // Sequence the victory animation
    setTimeout(() => {
      setVictorySequence(prev => ({ ...prev, step: 1 }));
      triggerAnimation('cast-spell-1');
    }, 1000);
    
    setTimeout(() => {
      setVictorySequence(prev => ({ ...prev, step: 2, totalDamage: 7 })); // Void pierces immunity
      triggerAnimation('cast-spell-2');
    }, 2500);
    
    setTimeout(() => {
      setVictorySequence(prev => ({ ...prev, step: 3 }));
      triggerAnimation('immunity-block');
    }, 4000);
    
    setTimeout(() => {
      setVictorySequence(prev => ({ ...prev, step: 4, totalDamage: 14 })); // Another 7 void damage
      triggerAnimation('cast-spell-3');
    }, 5500);
    
    setTimeout(() => {
      setVictorySequence(prev => ({ ...prev, step: 5, totalDamage: 21 }));
      triggerAnimation('area-defeated');
      setGameState(prev => ({ ...prev, worldEndRevealed: true }));
    }, 7000);
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
      stage2Cards: prev.difficulty === 'acolyte' ? 4 : 2,
      stage3Cards: prev.difficulty === 'acolyte' ? 4 : 0,
      artifactCards: prev.difficulty === 'acolyte' ? 2 : 0
    }));
  };

  const resetDemo = () => {
    setCurrentDemo('advertisement');
    setTurnCounter(1);
    setAnimationState('');
    setSelectedSpell(null);
    setSelectedArea(null);
    setModifiers([]);
    setVictorySequence({
      spell1: null,
      spell2: null,
      spell3: null,
      totalDamage: 0,
      targetArea: null,
      step: 0
    });
    setGameState(prev => ({ ...prev, worldEndRevealed: false }));
    demoAdvertisement();
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white rounded-xl shadow-2xl">
      <style jsx>{`
        @keyframes spell-casting {
          0% { transform: scale(1) rotate(0deg); box-shadow: 0 0 0 rgba(255, 215, 0, 0); }
          25% { transform: scale(1.1) rotate(5deg); box-shadow: 0 0 20px rgba(255, 215, 0, 0.5); }
          50% { transform: scale(1.2) rotate(-5deg); box-shadow: 0 0 40px rgba(255, 215, 0, 0.8); }
          75% { transform: scale(1.1) rotate(5deg); box-shadow: 0 0 60px rgba(255, 215, 0, 1); }
          100% { transform: scale(1) rotate(0deg); box-shadow: 0 0 80px rgba(255, 215, 0, 0.6); }
        }
        @keyframes area-exploding {
          0% { transform: scale(1); }
          25% { transform: scale(1.1); background: linear-gradient(45deg, #ff6b35, #f7931e); }
          50% { transform: scale(0.9); filter: brightness(1.5); }
          75% { transform: scale(1.05); }
          100% { transform: scale(0.8) rotate(10deg); opacity: 0.3; }
        }
        @keyframes epic-intro {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.1); opacity: 1; filter: brightness(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes victory-pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 rgba(34, 197, 94, 0); }
          50% { transform: scale(1.05); box-shadow: 0 0 30px rgba(34, 197, 94, 0.8); }
          100% { transform: scale(1); box-shadow: 0 0 0 rgba(34, 197, 94, 0); }
        }
        @keyframes damage-counter {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          50% { transform: translateY(-20px) scale(1.3); opacity: 1; color: #fbbf24; }
          100% { transform: translateY(-40px) scale(1); opacity: 0; }
        }
        .spell-casting { animation: spell-casting 1s ease-in-out infinite; }
        .area-exploding { animation: area-exploding 0.8s ease-out; }
        .epic-intro { animation: epic-intro 2s ease-out; }
        .victory-pulse { animation: victory-pulse 1s ease-in-out infinite; }
        .damage-counter { animation: damage-counter 1s ease-out; }
      `}</style>

      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
          DoomCaster: The Ultimate Card Battle
        </h1>
        <div className="flex justify-center items-center gap-4 mb-4">
          <span className="text-gray-300">Experience Mode:</span>
          <button
            onClick={toggleDifficulty}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              gameState.difficulty === 'acolyte' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {gameState.difficulty === 'acolyte' ? 'Casual Mode' : 'Pro Mode'}
          </button>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <button
          onClick={demoAdvertisement}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
        >
          <Sparkles size={16} />
          Epic Trailer
        </button>
        <button
          onClick={demoGameplay}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
        >
          <Target size={16} />
          Live Action
        </button>
        <button
          onClick={demoVictory}
          className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
        >
          <Zap size={16} />
          Victory Rush
        </button>
        <button
          onClick={demoAbilities}
          className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
        >
          <Swords size={16} />
          Power Moves
        </button>
      </div>

      {/* Game Board */}
      <div className="bg-black/30 rounded-lg p-6 min-h-[600px]">
        
        {/* World End Card */}
        <div className="text-center mb-6">
          <div className="inline-block">
            <CardPlaceholder 
              type="world" 
              label="World End" 
              faceDown={!gameState.worldEndRevealed}
              glowing={gameState.worldEndRevealed}
              casting={gameState.worldEndRevealed && animationState === 'area-defeated'}
            />
          </div>
          <div className="text-sm text-gray-400 mt-1">Ultimate Victory Card</div>
        </div>

        {/* Area Zone */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-center mb-4 text-purple-400">Battlefield</h3>
          
          {/* Stage 1 */}
          <div className="mb-4">
            <div className="text-center text-sm text-gray-400 mb-2">Combat Zone</div>
            <div className="flex justify-center gap-2">
              {currentDemo === 'victory' && victorySequence.targetArea ? (
                <CardPlaceholder 
                  type="area" 
                  label={victorySequence.targetArea.name}
                  element={victorySequence.targetArea.immunity?.toLowerCase() || 'none'}
                  defense={victorySequence.targetArea.defense}
                  ability={victorySequence.targetArea.ability}
                  exploding={animationState === 'area-defeated'}
                  destroyed={victorySequence.step >= 5}
                />
              ) : (
                [...Array(gameState.stage1Cards)].map((_, i) => (
                  <CardPlaceholder 
                    key={`stage1-${i}`} 
                    type="area" 
                    label={areas[i]?.name || `Area ${i+1}`}
                    element={areas[i]?.immunity?.toLowerCase() || 'none'}
                    defense={areas[i]?.defense || 0}
                    ability={areas[i]?.ability || ''}
                    glowing={animationState === 'area-showcase' && selectedArea?.name === areas[i]?.name}
                    exploding={animationState === 'area-attack' && i === 1}
                    onClick={() => setSelectedArea(areas[i])}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Victory Sequence Display */}
        {currentDemo === 'victory' && (
          <div className="mb-8 bg-gray-800/50 rounded-lg p-6">
            <h3 className="text-xl font-bold text-center mb-4 text-yellow-400">Epic Victory Sequence!</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {[victorySequence.spell1, victorySequence.spell2, victorySequence.spell3].map((spell, i) => (
                <div key={i} className="text-center">
                  <div className="text-sm text-gray-400 mb-2">Cast {i + 1}</div>
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
                  <div className="mt-2 text-xs">
                    {i === 0 && victorySequence.step > 1 && <span className="text-green-400">+7 DMG (Void pierces!)</span>}
                    {i === 1 && victorySequence.step > 2 && <span className="text-red-400">BLOCKED (Immunity!)</span>}
                    {i === 2 && victorySequence.step > 3 && <span className="text-green-400">+7 DMG (Void pierces!)</span>}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold mb-2">
                Total Damage: <span className="text-yellow-400">{victorySequence.totalDamage}</span> / 20
              </div>
              {victorySequence.step >= 5 && (
                <div className="text-4xl font-bold text-green-400 victory-pulse">
                  🏆 VICTORY ACHIEVED! 🏆
                </div>
              )}
            </div>
          </div>
        )}

        {/* Spell Row */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-center mb-4 text-purple-400">Arsenal</h3>
          <div className="flex justify-center gap-2">
            {spells.slice(0, 5).map((spell, i) => (
              <CardPlaceholder 
                key={`spell-row-${i}`} 
                type="spell" 
                label={spell.name}
                element={spell.element}
                attack={spell.attack}
                ability={spell.ability}
                glowing={animationState === 'spell-showcase' && selectedSpell?.name === spell.name}
                casting={animationState === 'spell-cast' && i === 0}
                onClick={() => setSelectedSpell(spell)}
              />
            ))}
          </div>
        </div>

        {/* Demo Content */}
        <div className="mt-8 bg-gray-800/50 rounded-lg p-6">
          {currentDemo === 'advertisement' && (
            <div className={`text-center space-y-6 ${animationState === 'epic-intro' ? 'epic-intro' : ''}`}>
              <div className="text-6xl mb-4">⚡</div>
              <h2 className="text-3xl font-bold text-purple-400">Master the Elements. Conquer the Realms.</h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Command devastating spells, exploit elemental weaknesses, and chain powerful combos in the ultimate strategic card battle!
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
                        <p className="text-gray-200">Devastating {selectedSpell.element} magic</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-yellow-400">{selectedSpell.attack} POWER</div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-3 gap-6 mt-8">
                <div className="bg-red-900/30 p-6 rounded-lg">
                  <div className="text-3xl mb-2">🔥</div>
                  <h3 className="font-bold text-red-400">Elemental Mastery</h3>
                  <p className="text-sm text-gray-400">Fire, Water, Wind, Earth, and mysterious Void magic</p>
                </div>
                <div className="bg-blue-900/30 p-6 rounded-lg">
                  <div className="text-3xl mb-2">⚔️</div>
                  <h3 className="font-bold text-blue-400">Strategic Combat</h3>
                  <p className="text-sm text-gray-400">Plan your attacks and exploit enemy weaknesses</p>
                </div>
                <div className="bg-purple-900/30 p-6 rounded-lg">
                  <div className="text-3xl mb-2">🎯</div>
                  <h3 className="font-bold text-purple-400">Epic Victories</h3>
                  <p className="text-sm text-gray-400">Destroy mighty fortresses and claim ultimate power</p>
                </div>
              </div>
            </div>
          )}

          {currentDemo === 'gameplay' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center text-purple-400">Live Battle Action!</h2>
              
              {selectedSpell && (
                <div className="flex justify-center">
                  <div className={`bg-gradient-to-br ${elements[selectedSpell.element as ElementType]?.gradient} p-6 rounded-xl ${animationState === 'spell-cast' ? 'spell-casting' : ''}`}>
                    <div className="flex items-center gap-3 mb-4">
                      {elements[selectedSpell.element as ElementType]?.icon && 
                        React.createElement(elements[selectedSpell.element as ElementType].icon, { 
                          className: elements[selectedSpell.element as ElementType].color, 
                          size: 32 
                        })
                      }
                      <div>
                        <h3 className="text-xl font-bold">{selectedSpell.name}</h3>
                        <p className="text-gray-200 text-sm">Unleashing {selectedSpell.element} power!</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-400">{selectedSpell.attack} DAMAGE</div>
                    </div>
                  </div>
                </div>
              )}

              {selectedArea && modifiers.length > 0 && (
                <div className={`text-center ${animationState === 'modifier-gained' ? 'damage-counter' : ''}`}>
                  <div className="bg-green-800/30 p-4 rounded-lg inline-block">
                    <h3 className="font-bold text-green-400">Critical Hit!</h3>
                    <p className="text-gray-300">Gained power: {modifiers[0]}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="bg-blue-800/30 p-3 rounded">
                  <h3 className="font-bold text-blue-400">1. Channel Magic</h3>
                  <p className="text-gray-300">Cast up to 3 devastating spells</p>
                </div>
                <div className="bg-green-800/30 p-3 rounded">
                  <h3 className="font-bold text-green-400">2. Strike Targets</h3>
                  <p className="text-gray-300">Destroy enemy strongholds</p>
                </div>
                <div className="bg-purple-800/30 p-3 rounded">
                  <h3 className="font-bold text-purple-400">3. Claim Victory</h3>
                  <p className="text-gray-300">Grow stronger with each win</p>
                </div>
              </div>
            </div>
          )}

          {currentDemo === 'victory' && (
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-purple-400">The Path to Glory</h2>
              <p className="text-gray-300">
                Watch as strategic spell selection overcomes powerful defenses and immunity barriers!
              </p>
              
              {victorySequence.step >= 5 && (
                <div className="bg-yellow-800/30 p-6 rounded border-2 border-yellow-400 victory-pulse">
                  <h3 className="font-bold text-yellow-400 text-2xl mb-2">🏆 LEGENDARY VICTORY! 🏆</h3>
                  <p className="text-gray-300">The fortress falls! You are the ultimate DoomCaster!</p>
                  <div className="mt-4 text-lg">
                    <span className="text-green-400">Rainbow Falls</span> destroyed by strategic void magic!
                  </div>
                </div>
              )}
            </div>
          )}

          {currentDemo === 'abilities' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center text-purple-400">Devastating Abilities</h2>
              <div className="grid grid-cols-2 gap-6">
                <div className={`bg-red-900/30 p-4 rounded-lg ${animationState === 'abilities-showcase' ? 'epic-intro' : ''}`}>
                  <h3 className="font-bold text-red-400 mb-2 flex items-center gap-2">
                    <Flame size={20} />
                    Combo Mastery
                  </h3>
                  <p className="text-sm text-gray-300">Chain elements together for devastating bonus damage and extra spell casts!</p>
                  <div className="mt-2 text-xs text-yellow-400">Example: Fireball + Fire element = +3 ATK bonus</div>
                </div>
                
                <div className={`bg-blue-900/30 p-4 rounded-lg ${animationState === 'abilities-showcase' ? 'epic-intro' : ''}`}>
                  <h3 className="font-bold text-blue-400 mb-2 flex items-center gap-2">
                    <Droplets size={20} />
                    Fuse Power
                  </h3>
                  <p className="text-sm text-gray-300">Sacrifice spells to permanently enhance others, creating unstoppable weapons!</p>
                  <div className="mt-2 text-xs text-yellow-400">Build the ultimate spell through strategic fusion</div>
                </div>
                
                <div className={`bg-green-900/30 p-4 rounded-lg ${animationState === 'abilities-showcase' ? 'epic-intro' : ''}`}>
                  <h3 className="font-bold text-green-400 mb-2 flex items-center gap-2">
                    <Wind size={20} />
                    Scout Tactics
                  </h3>
                  <p className="text-sm text-gray-300">Reveal hidden area information to plan the perfect attack strategy!</p>
                  <div className="mt-2 text-xs text-yellow-400">Knowledge is power in the heat of battle</div>
                </div>
                
                <div className={`bg-purple-900/30 p-4 rounded-lg ${animationState === 'abilities-showcase' ? 'epic-intro' : ''}`}>
                  <h3 className="font-bold text-purple-400 mb-2 flex items-center gap-2">
                    <Eye size={20} />
                    Void Mastery
                  </h3>
                  <p className="text-sm text-gray-300">Pierce through any immunity with mysterious void magic that ignores all defenses!</p>
                  <div className="mt-2 text-xs text-yellow-400">The ultimate trump card against any foe</div>
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
          Replay Demo
        </button>
        <button
          onClick={() => window.open('https://github.com/your-repo/doomcaster', '_blank')}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center gap-2 font-bold"
        >
          <ExternalLink size={20} />
          Check Out Cards & Rules
        </button>
      </div>

      {/* Epic Footer */}
      <div className="mt-8 text-center text-sm text-gray-400 bg-black/20 rounded-lg p-4">
        <p className="text-lg font-bold text-purple-400 mb-2">🎮 DoomCaster: Strategic Spell Combat 🎮</p>
        <p>2 Players • 20-40 minutes • Ages 13+ • Master the elements and conquer all realms!</p>
      </div>
    </div>
  );
};

export default DoomCasterDemo; 