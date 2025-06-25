'use client'

import React, { useState } from 'react';
import { Play, RotateCcw, Target, Zap, Flame, Droplets, Wind, Mountain, Eye, LucideIcon } from 'lucide-react';

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
  const [currentDemo, setCurrentDemo] = useState('setup');
  const [gameState, setGameState] = useState({
    player1Spells: 5,
    player2Spells: 5,
    spellRowCards: 5,
    stage1Cards: 3, // Acolyte: 3 cards, Archmage: 4 cards
    stage2Cards: 2, // Acolyte: 2 cards, Archmage: 4 cards  
    stage3Cards: 0, // Archmage only: 4 cards
    artifactCards: 0, // Archmage only: 2 artifacts
    worldEndRevealed: false,
    difficulty: 'acolyte'
  });
  const [animationState, setAnimationState] = useState('');
  const [turnCounter, setTurnCounter] = useState(1);
  const [selectedSpell, setSelectedSpell] = useState<DemoSpell | null>(null);
  const [selectedArea, setSelectedArea] = useState<DemoArea | null>(null);
  const [modifiers, setModifiers] = useState<string[]>([]);

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
    { name: 'Tsunami', element: 'water', attack: 4, ability: 'Refresh Spell Row', modifier: 'Re-Fuse' }
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

  // Card component with element styling
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
          ${destroyed ? 'opacity-50 rotate-2' : ''}
          ${modifier ? 'transform rotate-180' : ''}
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
          </>
        )}
      </div>
    );
  };

  const triggerAnimation = (type: string) => {
    setAnimationState(type);
    setTimeout(() => setAnimationState(''), 2000);
  };

  const demoSetup = () => {
    setCurrentDemo('setup');
    setSelectedSpell(null);
    setSelectedArea(null);
    setModifiers([]);
    setGameState({
      player1Spells: 5,
      player2Spells: 5,
      spellRowCards: 5,
      stage1Cards: gameState.difficulty === 'acolyte' ? 3 : 4,
      stage2Cards: gameState.difficulty === 'acolyte' ? 2 : 4,
      stage3Cards: gameState.difficulty === 'acolyte' ? 0 : 4,
      artifactCards: gameState.difficulty === 'acolyte' ? 0 : 2,
      worldEndRevealed: false,
      difficulty: gameState.difficulty
    });
    triggerAnimation('setup-highlight');
  };

  const demoGameplay = () => {
    setCurrentDemo('gameplay');
    setTurnCounter(1);
    setSelectedSpell(spells[0]); // Conjure Fire
    triggerAnimation('spell-cast');
    
    // Simulate turn progression
    setTimeout(() => {
      setSelectedArea(areas[1]); // Charred Ruins
      triggerAnimation('area-attack');
      setGameState(prev => ({ ...prev, stage1Cards: 2 })); // Area destroyed
    }, 2000);
    
    setTimeout(() => {
      setModifiers([areas[1].modifier]);
      triggerAnimation('modifier-gained');
    }, 3500);
  };

  const demoProgression = () => {
    setCurrentDemo('progression');
    triggerAnimation('stage-progress');
    
    // Show stage 1 completion
    setTimeout(() => {
      setGameState(prev => ({ ...prev, stage1Cards: 0 }));
    }, 1000);
    
    // Show stage 2 reveal
    setTimeout(() => {
      triggerAnimation('stage2-reveal');
    }, 2000);
    
    // Final stage completion
    setTimeout(() => {
      setGameState(prev => ({ 
        ...prev, 
        stage2Cards: 0, 
        worldEndRevealed: true 
      }));
      triggerAnimation('victory');
    }, 3500);
  };

  const demoElements = () => {
    setCurrentDemo('elements');
    triggerAnimation('elemental');
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
    setCurrentDemo('setup');
    setTurnCounter(1);
    setAnimationState('');
    setSelectedSpell(null);
    setSelectedArea(null);
    setModifiers([]);
    demoSetup();
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white rounded-xl shadow-2xl">
      <style jsx>{`
        @keyframes spell-cast {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); box-shadow: 0 0 20px #8b5cf6; }
          100% { transform: scale(1); }
        }
        @keyframes area-attack {
          0% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
          100% { transform: translateX(0); }
        }
        @keyframes elemental {
          0% { opacity: 0.5; }
          50% { opacity: 1; transform: scale(1.05); }
          100% { opacity: 0.5; }
        }
        @keyframes modifier-gained {
          0% { transform: translateY(10px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .spell-cast { animation: spell-cast 0.8s ease-in-out; }
        .area-attack { animation: area-attack 0.6s ease-in-out; }
        .elemental { animation: elemental 1s ease-in-out infinite; }
        .modifier-gained { animation: modifier-gained 0.5s ease-out; }
      `}</style>

      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
          DoomCaster Game Flow
        </h1>
        <div className="flex justify-center items-center gap-4 mb-4">
          <span className="text-gray-300">Difficulty:</span>
          <button
            onClick={toggleDifficulty}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              gameState.difficulty === 'acolyte' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {gameState.difficulty === 'acolyte' ? 'Acolyte (Easy)' : 'Archmage (Hard)'}
          </button>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <button
          onClick={demoSetup}
          className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
        >
          <Play size={16} />
          Setup
        </button>
        <button
          onClick={demoGameplay}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
        >
          <Target size={16} />
          Gameplay
        </button>
        <button
          onClick={demoProgression}
          className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
        >
          <Zap size={16} />
          Victory
        </button>
        <button
          onClick={demoElements}
          className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
        >
          <RotateCcw size={16} />
          Elements
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
              glowing={gameState.worldEndRevealed && animationState === 'victory'}
            />
          </div>
          <div className="text-sm text-gray-400 mt-1">World End Card (F)</div>
        </div>

        {/* Area Zone */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-center mb-4 text-purple-400">Area Zone</h3>
          
          {/* Stage 3 (Archmage only) */}
          {gameState.stage3Cards > 0 && (
            <div className="mb-4">
              <div className="text-center text-sm text-gray-400 mb-2">Stage 3 (D3) - Final Challenge</div>
              <div className="flex justify-center gap-2">
                {[...Array(gameState.stage3Cards)].map((_, i) => (
                  <CardPlaceholder 
                    key={`stage3-${i}`} 
                    type="area" 
                    label={areas[6 + i]?.name || `Area ${i+1}`}
                    element={areas[6 + i]?.immunity?.toLowerCase() || 'none'}
                    defense={areas[6 + i]?.defense || 0}
                    ability={areas[6 + i]?.ability || ''}
                    faceDown={true}
                    glowing={animationState === 'stage-progress'}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Stage 2 */}
          <div className="mb-4">
            <div className="text-center text-sm text-gray-400 mb-2">
              Stage 2 (D2) - {gameState.difficulty === 'acolyte' ? 'Final Stage' : 'Artifact Stage'}
            </div>
            <div className="flex justify-center gap-2">
              {[...Array(gameState.stage2Cards)].map((_, i) => (
                <CardPlaceholder 
                  key={`stage2-${i}`} 
                  type="area" 
                  label={areas[3 + i]?.name || `Area ${i+1}`}
                  element={areas[3 + i]?.immunity?.toLowerCase().split(',')[0]?.trim() || 'none'}
                  defense={areas[3 + i]?.defense || 0}
                  ability={areas[3 + i]?.ability || ''}
                  faceDown={true}
                  glowing={animationState === 'stage2-reveal'}
                />
              ))}
            </div>
          </div>

          {/* Stage 1 */}
          <div className="mb-4">
            <div className="text-center text-sm text-gray-400 mb-2">Stage 1 (D1) - Starting Areas</div>
            <div className="flex justify-center gap-2">
              {[...Array(gameState.stage1Cards)].map((_, i) => (
                <CardPlaceholder 
                  key={`stage1-${i}`} 
                  type="area" 
                  label={areas[i]?.name || `Area ${i+1}`}
                  element={areas[i]?.immunity?.toLowerCase() || 'none'}
                  defense={areas[i]?.defense || 0}
                  ability={areas[i]?.ability || ''}
                  glowing={animationState === 'area-attack' && i === 1}
                  destroyed={animationState === 'area-attack' && i === 1}
                  onClick={() => setSelectedArea(areas[i])}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Spell Row */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-center mb-4 text-purple-400">Spell Row (C)</h3>
          <div className="flex justify-center gap-2">
            {spells.slice(0, gameState.spellRowCards).map((spell, i) => (
              <CardPlaceholder 
                key={`spell-row-${i}`} 
                type="spell" 
                label={spell.name}
                element={spell.element}
                attack={spell.attack}
                ability={spell.ability}
                glowing={animationState === 'spell-cast' && i === 0}
                onClick={() => setSelectedSpell(spell)}
              />
            ))}
          </div>
        </div>

        {/* Players */}
        <div className="grid grid-cols-2 gap-8">
          {/* Player 1 */}
          <div>
            <h3 className="text-lg font-bold text-center mb-4 text-green-400">Player 1 Spellbook (E)</h3>
            <div className="grid grid-cols-5 gap-2">
              {spells.slice(0, gameState.player1Spells).map((spell, i) => (
                <CardPlaceholder 
                  key={`p1-spell-${i}`} 
                  type="spell" 
                  label={spell.name}
                  element={spell.element}
                  attack={spell.attack}
                  ability={spell.ability}
                  glowing={animationState === 'turn-start' && i === 0}
                  onClick={() => setSelectedSpell(spell)}
                />
              ))}
            </div>
          </div>

          {/* Player 2 */}
          <div>
            <h3 className="text-lg font-bold text-center mb-4 text-red-400">Player 2 Spellbook (E)</h3>
            <div className="grid grid-cols-5 gap-2">
              {spells.slice(0, gameState.player2Spells).map((spell, i) => (
                <CardPlaceholder 
                  key={`p2-spell-${i}`} 
                  type="spell" 
                  label={spell.name}
                  element={spell.element}
                  attack={spell.attack}
                  ability={spell.ability}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Demo Content */}
        <div className="mt-8 bg-gray-800/50 rounded-lg p-6">
          {currentDemo === 'setup' && (
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-purple-400">Game Setup</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div>
                  <h3 className="font-bold text-green-400 mb-2">Acolyte Difficulty (20 min)</h3>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• 3 Stage 1 Area Cards</li>
                    <li>• 2 Stage 2 Area Cards (Final)</li>
                    <li>• 5 Spell Row Cards</li>
                    <li>• No Artifacts</li>
                    <li>• Focus on basic mechanics</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold text-red-400 mb-2">Archmage Difficulty (30-40 min)</h3>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• 4 Stage 1 Area Cards</li>
                    <li>• 4 Stage 2 Area Cards + 2 Artifacts</li>
                    <li>• 4 Stage 3 Area Cards (Final)</li>
                    <li>• 5 Spell Row Cards</li>
                    <li>• Advanced tactics & artifacts</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {currentDemo === 'gameplay' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center text-purple-400">Turn {turnCounter} - Gameplay Flow</h2>
              
              {selectedSpell && (
                <div className="flex justify-center">
                  <div className={`bg-gradient-to-br ${elements[selectedSpell.element as ElementType]?.gradient} p-6 rounded-xl ${animationState === 'spell-cast' ? 'spell-cast' : ''}`}>
                    <div className="flex items-center gap-3 mb-4">
                      {elements[selectedSpell.element as ElementType]?.icon && 
                        React.createElement(elements[selectedSpell.element as ElementType].icon, { 
                          className: elements[selectedSpell.element as ElementType].color, 
                          size: 32 
                        })
                      }
                      <div>
                        <h3 className="text-xl font-bold">{selectedSpell.name}</h3>
                        <p className="text-gray-200 text-sm">{selectedSpell.element} spell</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-400">{selectedSpell.attack} ATK</div>
                      <div className="text-xs text-gray-300 mt-2">{selectedSpell.ability}</div>
                    </div>
                  </div>
                </div>
              )}

              {selectedArea && modifiers.length > 0 && (
                <div className={`text-center ${animationState === 'modifier-gained' ? 'modifier-gained' : ''}`}>
                  <div className="bg-green-800/30 p-4 rounded-lg inline-block">
                    <h3 className="font-bold text-green-400">Area Defeated!</h3>
                    <p className="text-gray-300">Gained modifier: {modifiers[0]}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="bg-blue-800/30 p-3 rounded">
                  <h3 className="font-bold text-blue-400">1. Cast Spells</h3>
                  <p className="text-gray-300">Up to 3 spells per turn</p>
                </div>
                <div className="bg-green-800/30 p-3 rounded">
                  <h3 className="font-bold text-green-400">2. Attack Areas</h3>
                  <p className="text-gray-300">Target area zones</p>
                </div>
                <div className="bg-purple-800/30 p-3 rounded">
                  <h3 className="font-bold text-purple-400">3. End Turn</h3>
                  <p className="text-gray-300">Refresh spell row</p>
                </div>
              </div>
            </div>
          )}

          {currentDemo === 'progression' && (
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-purple-400">Stage Progression</h2>
              <div className="space-y-2">
                <div className="bg-green-800/30 p-3 rounded">
                  <h3 className="font-bold text-green-400">Stage 1: Individual Targets</h3>
                  <p className="text-sm text-gray-300">Attack areas one at a time</p>
                </div>
                <div className="bg-yellow-800/30 p-3 rounded">
                  <h3 className="font-bold text-yellow-400">Stage 2: Combined Defense</h3>
                  <p className="text-sm text-gray-300">Must defeat all areas together</p>
                </div>
                {gameState.difficulty === 'archmage' && (
                  <div className="bg-red-800/30 p-3 rounded">
                    <h3 className="font-bold text-red-400">Stage 3: Final Challenge</h3>
                    <p className="text-sm text-gray-300">Ultimate test - all 4 areas at once</p>
                  </div>
                )}
              </div>
              {gameState.worldEndRevealed && (
                <div className="bg-yellow-800/30 p-4 rounded border-2 border-yellow-400">
                  <h3 className="font-bold text-yellow-400 text-xl">🏆 VICTORY!</h3>
                  <p className="text-gray-300">World End Card revealed - You are the ultimate DoomCaster!</p>
                </div>
              )}
            </div>
          )}

          {currentDemo === 'elements' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center text-purple-400">Elemental System</h2>
              <div className="grid grid-cols-5 gap-4">
                {Object.entries(elements).map(([element, data]) => {
                  const IconComponent = data.icon;
                  return (
                    <div key={element} className={`${data.bg} p-4 rounded-lg text-center ${animationState === 'elemental' ? 'elemental' : ''}`}>
                      <IconComponent className={`${data.color} mx-auto mb-2`} size={32} />
                      <h3 className={`font-bold ${data.color} capitalize`}>{element}</h3>
                      <div className="text-xs text-gray-400 mt-1">
                        {element === 'fire' && 'Burning'}
                        {element === 'water' && 'Fuse'}
                        {element === 'wind' && 'Swift'}
                        {element === 'earth' && 'Sturdy'}
                        {element === 'void' && 'Pierce'}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <h3 className="font-bold text-purple-400 mb-2">Featured Spells</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {spells.slice(0, 6).map((spell, i) => {
                    const element = elements[spell.element as ElementType];
                    const IconComponent = element?.icon;
                    return (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        {IconComponent && <IconComponent className={element.color} size={16} />}
                        <span className="font-medium">{spell.name}</span>
                        <span className="text-gray-400">({spell.attack} ATK)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reset Button */}
      <div className="text-center mt-6">
        <button
          onClick={resetDemo}
          className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors duration-200"
        >
          Reset Demo
        </button>
      </div>

      {/* Game Legend */}
      <div className="mt-6 bg-gray-800/50 rounded-lg p-4">
        <h3 className="font-bold text-purple-400 mb-2 text-center">Card Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-300">
          <div>A = Area Card Deck</div>
          <div>B = Spell Card Deck</div>
          <div>C = Spell Row</div>
          <div>D1/D2/D3 = Area Stages</div>
          <div>E = Player Spellbooks</div>
          <div>F = World End Card</div>
          <div>A1/B1 = Discard Piles</div>
          <div>MOD = Modifier Cards</div>
        </div>
      </div>
    </div>
  );
};

export default DoomCasterDemo; 