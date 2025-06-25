'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Target, Zap, Swords, Flame, Droplets, Wind, Mountain, Eye, ExternalLink } from 'lucide-react';

interface DemoSpell {
  name: string;
  element: string;
  attack: number;
  ability: string;
}

interface DemoArea {
  name: string;
  immunity: string;
  defense: number;
  ability: string;
}

type ElementType = 'fire' | 'water' | 'wind' | 'earth' | 'void';

const DoomCasterDemo = () => {
  // Starting spells following actual game rules
  const spells: DemoSpell[] = [
    { name: 'Conjure Fire', element: 'fire', attack: 5, ability: 'Combo' },
    { name: 'Shape Water', element: 'water', attack: 3, ability: 'Fuse' },
    { name: 'Gather Wind', element: 'wind', attack: 3, ability: 'Combo' },
    { name: 'Raise Earth', element: 'earth', attack: 4, ability: 'Shield' },
    { name: 'Unleash Void', element: 'void', attack: 7, ability: 'Pierce Immunity' }
  ];

  // Area cards from rules
  const areas: DemoArea[] = [
    { name: 'Towering Fortress', immunity: 'none', defense: 40, ability: 'Fortified' },
    { name: 'Crystal Caves', immunity: 'water', defense: 25, ability: 'Reflect' },
    { name: 'Ancient Library', immunity: 'wind', defense: 35, ability: 'Consume Spell' },
    { name: 'Shadow Realm', immunity: 'earth', defense: 45, ability: 'Consume Spell' }
  ];

  const elements = {
    fire: { icon: Flame, color: 'text-orange-300' },
    water: { icon: Droplets, color: 'text-cyan-300' },
    wind: { icon: Wind, color: 'text-emerald-300' },
    earth: { icon: Mountain, color: 'text-amber-300' },
    void: { icon: Eye, color: 'text-violet-300' }
  };

  const [currentDemo, setCurrentDemo] = useState('advertisement');
  const [selectedSpell, setSelectedSpell] = useState<DemoSpell | null>(null);
  const [selectedArea, setSelectedArea] = useState<DemoArea | null>(null);
  const [gameState, setGameState] = useState({
    difficulty: 'acolyte' as 'acolyte' | 'archmage',
    spellsCastThisTurn: 0,
    worldEndRevealed: false
  });

  const [victorySequence, setVictorySequence] = useState({
    totalDamage: 0,
    targetDefense: 80, // Combined Stage 2 defense
    step: 0
  });

  const CardPlaceholder = ({ 
    type, 
    label, 
    element = 'none',
    attack = 0,
    defense = 0,
    ability = '',
    glowing = false,
    onClick
  }: {
    type: string;
    label: string;
    element?: string;
    attack?: number;
    defense?: number;
    ability?: string;
    glowing?: boolean;
    onClick?: () => void;
  }) => {
    const elementData = elements[element as ElementType];
    
    return (
      <div 
        className={`w-32 h-44 rounded-xl border-2 p-3 cursor-pointer transition-all duration-300 bg-gradient-to-br from-gray-700 to-gray-800 ${
          glowing ? 'border-yellow-400 shadow-lg shadow-yellow-400/50' : 'border-gray-500'
        } hover:scale-105`}
        onClick={onClick}
      >
        <div className="text-center">
          <div className="text-xs font-bold text-white mb-2">{label}</div>
          {elementData?.icon && React.createElement(elementData.icon, { 
            className: `${elementData.color} mx-auto mb-2`, 
            size: 20 
          })}
          
          {type === 'spell' && (
            <div>
              <div className="text-lg font-bold text-yellow-400">{attack}</div>
              <div className="text-xs text-gray-300">{ability}</div>
            </div>
          )}
          
          {type === 'area' && (
            <div>
              <div className="text-lg font-bold text-blue-400">{defense}</div>
              <div className="text-xs text-gray-300">Immune: {element}</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const demoAdvertisement = () => {
    setCurrentDemo('advertisement');
    setSelectedSpell(spells[0]);
  };

  const demoGameplay = () => {
    setCurrentDemo('gameplay');
    setSelectedSpell(spells[0]);
    setSelectedArea(areas[0]);
  };

  const demoVictory = () => {
    setCurrentDemo('victory');
    setVictorySequence({ totalDamage: 0, targetDefense: 80, step: 0 });
    
    // Simulate victory sequence
    setTimeout(() => setVictorySequence(prev => ({ ...prev, step: 1, totalDamage: 20 })), 1000);
    setTimeout(() => setVictorySequence(prev => ({ ...prev, step: 2, totalDamage: 45 })), 2000);
    setTimeout(() => setVictorySequence(prev => ({ ...prev, step: 3, totalDamage: 85 })), 3000);
    setTimeout(() => {
      setVictorySequence(prev => ({ ...prev, step: 4 }));
      setGameState(prev => ({ ...prev, worldEndRevealed: true }));
    }, 4000);
  };

  const demoAbilities = () => {
    setCurrentDemo('abilities');
  };

  const toggleDifficulty = () => {
    setGameState(prev => ({
      ...prev,
      difficulty: prev.difficulty === 'acolyte' ? 'archmage' : 'acolyte'
    }));
  };

  useEffect(() => {
    demoAdvertisement();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-8 bg-gradient-to-br from-indigo-950 via-violet-900 to-purple-950 text-white rounded-2xl shadow-2xl">
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
              }`}
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
        <div className="bg-gradient-to-br from-indigo-950/40 via-violet-950/30 to-purple-950/40 rounded-2xl p-8 min-h-[700px]">
          
          {/* World End Card */}
          {gameState.difficulty === 'archmage' && (
            <div className="text-center mb-6">
              <CardPlaceholder 
                type="world" 
                label="World End" 
                glowing={gameState.worldEndRevealed}
              />
              <div className="text-sm text-gray-400 mt-1">Final Victory Card</div>
            </div>
          )}

          {/* Area Zone */}
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
                  />
                  <CardPlaceholder 
                    type="area" 
                    label="Shadow Realm"
                    element="earth"
                    defense={45}
                    ability="Consume Spell"
                  />
                </div>
                <div className="text-center mt-2 text-yellow-400 font-bold">
                  Combined Defense: {victorySequence.targetDefense}
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <div className="text-center text-sm text-gray-400 mb-2">Stage 1 - Individual Targets</div>
                <div className="flex justify-center gap-2">
                  {areas.slice(0, 3).map((area, i) => (
                    <CardPlaceholder 
                      key={i} 
                      type="area" 
                      label={area.name}
                      element={area.immunity}
                      defense={area.defense}
                      ability={area.ability}
                      glowing={selectedArea?.name === area.name}
                      onClick={() => setSelectedArea(area)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Victory Display */}
          {currentDemo === 'victory' && (
            <div className="mb-8 bg-gray-800/50 rounded-lg p-6">
              <h3 className="text-xl font-bold text-center mb-4 text-yellow-400">Stage 2 Victory Sequence</h3>
              <div className="text-center">
                <div className="text-2xl font-bold mb-2">
                  Damage Dealt: <span className="text-yellow-400">{victorySequence.totalDamage}</span> / {victorySequence.targetDefense}
                </div>
                {victorySequence.step >= 4 && (
                  <div className="text-4xl font-bold text-green-400">
                    🏆 STAGE 2 CLEARED! 🏆
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Spell Row */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-center mb-4 text-purple-400">Spell Row</h3>
            <div className="flex justify-center gap-2">
              {spells.map((spell, i) => (
                <CardPlaceholder 
                  key={i} 
                  type="spell" 
                  label={spell.name}
                  element={spell.element}
                  attack={spell.attack}
                  ability={spell.ability}
                  glowing={selectedSpell?.name === spell.name}
                  onClick={() => setSelectedSpell(spell)}
                />
              ))}
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
                    <div className="bg-gradient-to-br from-orange-400/30 to-red-500/30 p-8 rounded-xl transform scale-110">
                      <div className="flex items-center gap-4 mb-4">
                        <Flame className="text-orange-300 animate-pulse" size={48} />
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
              </div>
            )}

            {currentDemo === 'gameplay' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-center text-purple-400">Turn Actions Demo</h2>
                
                {selectedSpell && selectedArea && (
                  <div className="flex justify-center gap-8">
                    <div className="bg-gradient-to-br from-orange-400/30 to-red-500/30 p-6 rounded-xl">
                      <h3 className="text-xl font-bold mb-2">{selectedSpell.name}</h3>
                      <div className="text-3xl font-bold text-yellow-400">{selectedSpell.attack} ATK</div>
                      <div className="text-sm text-gray-300">{selectedSpell.ability}</div>
                    </div>
                    
                    <div className="text-4xl self-center">→</div>
                    
                    <div className="bg-gradient-to-br from-blue-500/30 to-purple-500/30 p-6 rounded-xl">
                      <h3 className="text-xl font-bold mb-2">{selectedArea.name}</h3>
                      <div className="text-3xl font-bold text-blue-400">{selectedArea.defense} DEF</div>
                      <div className="text-sm text-gray-300">Immune: {selectedArea.immunity}</div>
                    </div>
                  </div>
                )}

                <div className="text-center bg-yellow-800/30 p-4 rounded-lg">
                  <h3 className="font-bold text-yellow-400">Combat Calculation</h3>
                  <p className="text-gray-300">
                    Following game rules: Up to 3 spells per turn, freeform actions, modifier stacking
                  </p>
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
                  </div>
                  
                  <div className="bg-blue-900/30 p-4 rounded-lg">
                    <h3 className="font-bold text-blue-400 mb-2 flex items-center gap-2">
                      <Droplets size={20} />
                      Fuse Mechanic
                    </h3>
                    <p className="text-sm text-gray-300">Permanently attach modifiers to spells</p>
                  </div>
                  
                  <div className="bg-green-900/30 p-4 rounded-lg">
                    <h3 className="font-bold text-green-400 mb-2 flex items-center gap-2">
                      <Wind size={20} />
                      Area Targeting
                    </h3>
                    <p className="text-sm text-gray-300">Stage 1: Individual, Stage 2+: Combined assault</p>
                  </div>
                  
                  <div className="bg-purple-900/30 p-4 rounded-lg">
                    <h3 className="font-bold text-purple-400 mb-2 flex items-center gap-2">
                      <Eye size={20} />
                      Immunity System
                    </h3>
                    <p className="text-sm text-gray-300">Areas block specific elements completely</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-6">
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