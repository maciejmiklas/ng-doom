/*
 * Copyright 2022 Maciej Miklas (MIT License)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:

 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import {ThingType} from "./wad-model"

export type ThingArray = { [member: string]: ThingType }

export const thingTypes: ThingArray = {
	1: {
		radius: 16,
		sprite: 'PLAY',
		label: 'Player 1 start'
	},
	2: {
		radius: 16,
		sprite: 'PLAY',
		label: 'Player 2 start'
	},
	3: {
		radius: 16,
		sprite: 'PLAY',
		label: 'Player 3 start'
	},
	4: {
		radius: 16,
		sprite: 'PLAY',
		label: 'Player 4 start'
	},
	5: {
		radius: 20,
		sprite: 'BKEY',
		label: 'Blue keycard',
	},
	6: {
		radius: 20,
		sprite: 'YKEY',
		label: 'Yellow keycard',
	},
	7: {
		radius: 128,
		sprite: 'SPID',
		label: 'Spider Mastermind'
	},
	8: {
		radius: 20,
		sprite: 'BPAK',
		label: 'Backpack',
	},
	9: {
		label: 'Former Human Sergeant',
		radius: 20,
		sprite: 'SPOS',
	},
	10: {
		radius: 16,
		sprite: 'PLAY',
		label: 'Bloody mess'
	},
	11: {
		radius: 20,
		label: 'Deathmatch start'
	},
	12: {
		radius: 16,
		sprite: 'PLAY',
		label: 'Bloody mess'
	},
	13: {
		radius: 20,
		sprite: 'RKEY',
		label: 'Red keycard',
	},
	14: {
		radius: 20,
		label: 'Teleport landing'
	},
	15: {
		radius: 16,
		sprite: 'PLAY',
		label: 'Dead player'
	},
	16: {
		radius: 40,
		sprite: 'CYBR',
		label: 'Cyberdemon',
	},
	17: {
		radius: 20,
		sprite: 'CELP',
		label: 'Cell charge pack',
	},
	18: {
		radius: 20,
		sprite: 'POSS',
		label: 'Dead former human'
	},
	19: {
		radius: 20,
		sprite: 'SPOS',
		label: 'Dead former sergeant'
	},
	20: {
		radius: 20,
		sprite: 'TROO',
		label: 'Dead imp'
	},
	21: {
		radius: 30,
		sprite: 'SARG',
		label: 'Dead demon'
	},
	22: {
		radius: 31,
		sprite: 'HEAD',
		label: 'Dead cacodemon'
	},
	23: {
		radius: 16,
		sprite: 'SKUL',
		label: 'Dead lost soul (invisible)'
	},
	24: {
		radius: 16,
		sprite: 'POL5',
		label: 'Pool of blood and flesh'
	},
	25: {
		radius: 16,
		sprite: 'POL1',
		label: 'Impaled human'
	},
	26: {
		radius: 16,
		sprite: 'POL6',
		label: 'Twitching impaled human'
	},
	27: {
		radius: 16,
		sprite: 'POL4',
		label: 'Skull on a pole'
	},
	28: {
		radius: 16,
		sprite: 'POL2',
		label: 'Five skulls "shish kebab"'
	},
	29: {
		radius: 16,
		sprite: 'POL3',
		label: 'Pile of skulls and candles'
	},
	30: {
		radius: 16,
		sprite: 'COL1',
		label: 'Tall green pillar'
	},
	31: {
		radius: 16,
		sprite: 'COL2',
		label: 'Short green pillar'
	},
	32: {
		radius: 16,
		sprite: 'COL3',
		label: 'Tall red pillar'
	},
	33: {
		radius: 16,
		sprite: 'COL4',
		label: 'Short red pillar'
	},
	34: {
		radius: 16,
		sprite: 'CAND',
		label: 'Candle',
	},
	35: {
		radius: 16,
		sprite: 'CBRA',
		label: 'Candelabra',
	},
	36: {
		radius: 16,
		sprite: 'COL5',
		label: 'Short green pillar with beating heart'
	},
	37: {
		radius: 16,
		sprite: 'COL6',
		label: 'Short red pillar with skull'
	},
	38: {
		radius: 20,
		sprite: 'RSKU',
		label: 'Red skull key',
	},
	39: {
		radius: 20,
		sprite: 'YSKU',
		label: 'Yellow skull key',
	},
	40: {
		radius: 20,
		sprite: 'BSKU',
		label: 'Blue skull key',
	},
	41: {
		radius: 16,
		sprite: 'CEYE',
		label: 'Evil eye'
	},
	42: {
		radius: 16,
		sprite: 'FSKU',
		label: 'Floating skull'
	},
	43: {
		radius: 16,
		sprite: 'TRE1',
		label: 'Burnt tree'
	},
	44: {
		radius: 16,
		sprite: 'TBLU',
		label: 'Tall blue firestick',

	},
	45: {
		radius: 16,
		sprite: 'TGRN',
		label: 'Tall green firestick',
	},
	46: {
		radius: 16,
		sprite: 'TRED',
		label: 'Tall red firestick',
	},
	47: {
		radius: 16,
		sprite: 'SMIT',
		label: 'Stalagmite'
	},
	48: {
		radius: 16,
		sprite: 'ELEC',
		label: 'Tall techno pillar'
	},
	49: {
		radius: 16,
		sprite: 'GOR1',
		label: 'Hanging victim, twitching'
	},
	50: {
		radius: 16,
		sprite: 'GOR2',
		label: 'Hanging victim, arms out'
	},
	51: {
		radius: 16,
		sprite: 'GOR3',
		label: 'Hanging victim, one - legged'
	},
	52: {
		radius: 16,
		sprite: 'GOR4',
		label: 'Hanging pair of legs'
	},
	53: {
		radius: 16,
		sprite: 'GOR5',
		label: 'Hanging leg'
	},
	54: {
		radius: 32,
		sprite: 'TRE2',
		label: 'Large brown tree'
	},
	55: {
		radius: 16,
		sprite: 'SMBT',
		label: 'Short blue firestick',
	},
	56: {
		radius: 16,
		sprite: 'SMGT',
		label: 'Short green firestick',
	},
	57: {
		radius: 16,
		sprite: 'SMRT',
		label: 'Short red firestick',
	},
	58: {
		radius: 30,
		sprite: 'SARG',
		label: 'Spectre',
	},
	59: {
		radius: 16,
		sprite: 'GOR2',
		label: 'Hanging victim, arms out'
	},
	60: {
		radius: 16,
		sprite: 'GOR4',
		label: 'Hanging pair of legs'
	},
	61: {
		radius: 16,
		sprite: 'GOR3',
		label: 'Hanging victim, one - legged'
	},
	62: {
		radius: 16,
		sprite: 'GOR5',
		label: 'Hanging leg'
	},
	63: {
		radius: 16,
		sprite: 'GOR1',
		label: 'Hanging victim, twitching'
	},
	64: {
		radius: 20,
		sprite: 'VILE',
		label: 'Arch-Vile'
	},
	65: {
		radius: 20,
		sprite: 'CPOS',
		label: 'Chaingunner'
	},
	66: {
		radius: 20,
		sprite: 'SKEL',
		label: 'Revenant'
	},
	67: {
		radius: 48,
		sprite: 'FATT',
		label: 'Mancubus'
	},
	68: {
		radius: 64,
		sprite: 'BSPI',
		label: 'Arachnotron'
	},
	69: {
		radius: 24,
		sprite: 'BOS2',
		label: 'Hell Knight'
	},
	70: {
		radius: 10,
		sprite: 'FCAN',
		label: 'Burning barrel',
	},
	71: {
		radius: 31,
		sprite: 'PAIN',
		label: 'Pain Elemental'
	},
	72: {
		radius: 16,
		sprite: 'KEEN',
		label: 'Commander Keen'
	},
	73: {
		radius: 16,
		sprite: 'HDB1',
		label: 'Hanging victim, guts removed'
	},
	74: {
		radius: 16,
		sprite: 'HDB2',
		label: 'Hanging victim, guts and brain removed'
	},
	75: {
		radius: 16,
		sprite: 'HDB3',
		label: 'Hanging torso, looking down'
	},
	76: {
		radius: 16,
		sprite: 'HDB4',
		label: 'Hanging torso, open skull'
	},
	77: {
		radius: 16,
		sprite: 'HDB5',
		label: 'Hanging torso, looking up'
	},
	78: {
		radius: 16,
		sprite: 'HDB6',
		label: 'Hanging torso, brain removed'
	},
	79: {
		radius: 16,
		sprite: 'POB1',
		label: 'Pool of blood'
	},
	80: {
		radius: 16,
		sprite: 'POB2',
		label: 'Pool of blood'
	},
	81: {
		radius: 16,
		sprite: 'BRS1',
		label: 'Pool of brains'
	},
	82: {
		radius: 20,
		sprite: 'SGN2',
		label: 'Super shotgun'
	},
	83: {
		radius: 20,
		sprite: 'MEGA',
		label: 'Megasphere',

	},
	84: {
		radius: 20,
		sprite: 'SSWV',
		label: 'Wolfenstein SS'
	},
	85: {
		radius: 16,
		sprite: 'TLMP',
		label: 'Tall techno floor lamp',

	},
	86: {
		radius: 16,
		sprite: 'TLP2',
		label: 'Short techno floor lamp',
	},
	87: {
		radius: 0,
		label: 'Spawn spot'
	},
	88: {
		radius: 16,
		sprite: 'BBRN',
		label: 'Boss Brain'
	},
	89: {
		radius: 20,
		label: 'Spawn shooter'
	},
	1001: {
		radius: 0,
		sprite: 'PUFF',
		label: 'Sparkle'
	},
	1002: {
		radius: 0,
		sprite: 'BLUD',
		label: 'Bleed'
	},
	1003: {
		radius: 0,
		sprite: 'BLUD',
		label: 'Bleed'
	},
	1004: {
		radius: 0,
		sprite: 'BLUD',
		label: 'Bleed'
	},
	1005: {
		radius: 0,
		sprite: 'BLUD',
		label: 'Bleed'
	},

	2001: {
		radius: 20,
		sprite: 'SHOT',
		label: 'Shotgun',
	},
	2002: {
		radius: 20,
		sprite: 'MGUN',
		label: 'Chaingun',
	},
	2003: {
		radius: 20,
		sprite: 'LAUN',
		label: 'Rocket launcher',
	},
	2004: {
		radius: 20,
		sprite: 'PLAS',
		label: 'Plasma rifle',
	},
	2005: {
		radius: 20,
		sprite: 'CSAW',
		label: 'Chainsaw',
	},
	2006: {
		radius: 20,
		sprite: 'BFUG',
		label: 'BFG 9000',
	},
	2007: {
		radius: 20,
		sprite: 'CLIP',
		label: 'Ammo clip',
	},
	2008: {
		radius: 20,
		sprite: 'SHEL',
		label: 'Shotgun shells',
	},
	2010: {
		radius: 20,
		sprite: 'ROCK',
		label: 'Rocket',
	},
	2011: {
		radius: 20,
		sprite: 'STIM',
		label: 'Stimpack',
	},
	2012: {
		radius: 20,
		sprite: 'MEDI',
		label: 'Medikit',
	},
	2013: {
		radius: 20,
		sprite: 'SOUL',
		label: 'Soul sphere',
	},
	2014: {
		radius: 20,
		sprite: 'BON1',
		label: 'Health potion',
	},
	2015: {
		radius: 20,
		sprite: 'BON2',
		label: 'Spiritual armor',
	},
	2018: {
		radius: 20,
		sprite: 'ARM1',
		label: 'Green armor',
	},
	2019: {
		radius: 20,
		sprite: 'ARM2',
		label: 'Blue armor',
	},
	2022: {
		radius: 20,
		sprite: 'PINV',
		label: 'Invulnerability',
	},
	2023: {
		radius: 20,
		sprite: 'PSTR',
		label: 'Berserk',
	},
	2024: {
		radius: 20,
		sprite: 'PINS',
		label: 'Invisibility',
	},
	2025: {
		radius: 20,
		sprite: 'SUIT',
		label: 'Radiation suit',
	},
	2026: {
		radius: 20,
		sprite: 'PMAP',
		label: 'Computer map',
	},
	2028: {
		radius: 16,
		sprite: 'COLU',
		label: 'Floor lamp',
	},
	2035: {
		radius: 10,
		sprite: 'BAR1',
		label: 'Barrel',
	},
	2045: {
		radius: 20,
		sprite: 'PVIS',
		label: 'PVIS',
	},
	2046: {
		radius: 20,
		sprite: 'BROK',
		label: 'Box of rockets',
	},
	2047: {
		radius: 20,
		sprite: 'CELL',
		label: 'Cell charge',
	},
	2048: {
		radius: 20,
		sprite: 'AMMO',
		label: 'Box of ammo',
	},
	2049: {
		radius: 20,
		sprite: 'SBOX',
		label: 'Box of shells',
	},
	3001: {
		label: 'Imp',
		radius: 20,
		sprite: 'TROO',
	},
	3002: {
		label: 'Demon',
		radius:
			30,
		sprite:
			'SARG',
	},
	3003: {
		radius: 24,
		sprite: 'BOSS',
		label: 'Baron of Hell',
	},
	3004: {
		label: 'Former Human Trooper',
		radius: 20,
		sprite: 'POSS',
	},
	3005: {
		radius: 31,
		sprite: 'HEAD',
		label: 'Cacodemon',
	},
	3006: {
		radius: 16,
		sprite: 'SKUL',
		label: 'Lost Soul',
	}
}
