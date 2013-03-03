/**
 * SMSDynaRec - An attempt to implement a dynamic recompiling emulator for SMS/GG ROMs.
 * Copyright (C) 2013 G. Cedric Marty (https://github.com/gmarty)
 * Based on JavaGear Copyright (c) 2002-2008 Chris White
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

'use strict';


// Constants
/**
 * Whether to activate dynamic recompilation of hot blocks.
 * @define {boolean}
 */
var ENABLE_DYNAREC = true;


/**
 * The occurrence threshold from which a block is considered hot enough to be jitted.
 * @define {number}
 */
var HOT_BLOCK_THRESHOLD = 1;


/**
 * All instructions that end a branch (JP, JR, CALL, RET and RST).
 */
var JPinst = [0xC2, 0xC3, 0xCA, 0xD2, 0xDA, 0xE2, 0xE9, 0xEA, 0xF2, 0xFA];

var JRinst = [0x10, 0x18, 0x20, 0x28, 0x30, 0x38];

var CALLinst = [0xC4, 0xCC, 0xCD, 0xD4, 0xDC, 0xE4, 0xEC, 0xF4, 0xFC];

var RETinst = [0xC0, 0xC8, 0xC9, 0xD0, 0xD8, 0xE0, 0xE8, 0xF0, 0xF8];

var DIinst = [0xF3];

var miscInst = [0xDD, 0xFD, 0xED, 0x76];

var endingInst = [].concat(JPinst, JRinst, CALLinst, RETinst, DIinst, miscInst);

// Side effect free opcodes.
var emptyInst = [0x00, 0x40, 0x49, 0x52, 0x5B, 0x64, 0x6D, 0x7F];


/**
 * Check if an instruction should end a branch.
 *
 * @param {number} opcode
 * @return {boolean} Whether the instruction is a branch ending or not.
 */
var isEndingInst = function(opcode) {
  return endingInst.indexOf(opcode) >= 0;
};


/**
 * Check if an opcode is empty.
 *
 * @param {number} opcode
 * @return {boolean} Whether the opcode is side effect free.
 */
var isEmptyInst = function(opcode) {
  return emptyInst.indexOf(opcode) >= 0;
};


/**
 * Get a hex from a decimal. Pad with 0 if necessary.
 *
 * @param {number} dec A decimal integer.
 * @return {string} A hex representation of the input.
 */
var toHex = function(dec) {
  var hex = (dec).toString(16);
  if (hex.length == 1) {
    hex = '0' + hex;
  }
  return '0x' + hex;
};


/**
 * Return an array mapping opcodes to instruction strings.
 * @return {Array.<string>}
 */
var buildOpcodeInsts = function() {
  var i = 0;
  var opCodeInsts = new Array(0xFF);

  for (; i <= 0xFF; i++) {
    opCodeInsts[i] = getOpCodeInst(i);
  }

  return opCodeInsts;
};


/**
 * Get the instructions associated to an `opcode` as a string.
 *
 * @param {number} opcode
 * @return {string}
 */
var getOpCodeInst = function(opcode) {
  // First let's build some generic glue code.
  var preinst = [];
  var inst = '';
  var postinst = [];
  var tstatesDecrementValue = OP_STATES[opcode];

  preinst.push('// opcode: ' + toHex(opcode));

  // Inline EI_inst optimization.
  if (Setup.ACCURATE_INTERRUPT_EMULATION) {
    preinst.push('if (this.interruptLine)' + '\n' +
        '  this.interrupt();                  // Check for interrupt');
  }

  preinst.push('this.pc++;');

  if (Setup.ACCURATE_INTERRUPT_EMULATION)
    preinst.push('this.EI_inst = false;');

  // Strip tstates decrement if possible.
  if (tstatesDecrementValue > 0) {
    preinst.push('this.tstates -= ' + tstatesDecrementValue + ';   // Decrement TStates');
  }

  if (Setup.REFRESH_EMULATION)
    preinst.push('this.incR();');

  // We get and clean the instructions.
  inst = opcodeToJS(opcode)
    .replace(/"use strict";/, '')
    .replace(/function \(\) {/, '')
    .replace(/}$/, '')
    .trim()
    .replace(/\r?\n|\r/g, '\n')
    .replace(/^\s+/gm, '');

  var ret = (preinst.join('\n') + '\n' + inst)
    .trim() + '\n' + postinst.join('\n')
    .trim();

  return ret;
};


/**
 * Return the JS code associated to an `opcode`.
 *
 * @param {number} opcode The input opcode.
 * @return {string} The JS code associated.
 */
var opcodeToJS = function(opcode) {
  var opcodeToInst = {
    0x00: function() {
      // NOP
    },
    0x01: function() {
      // LD BC,nn
      this.c = this.readMem(this.pc++);
      this.b = this.readMem(this.pc++);
    },
    0x02: function() {
      // LD (BC),A
      this.writeMem(this.getBC(), this.a);
    },
    0x03: function() {
      // INC BC
      this.incBC();
    },
    0x04: function() {
      // INC B
      this.b = this.inc8(this.b);
    },
    0x05: function() {
      // DEC B
      this.b = this.dec8(this.b);
    },
    0x06: function() {
      // LD B,n
      this.b = this.readMem(this.pc++);
    },
    0x07: function() {
      // RLCA
      this.rlca_a();
    },
    0x08: function() {
      // EX AF AF'
      this.exAF();
    },
    0x09: function() {
      // ADD HL,BC
      this.setHL(this.add16(this.getHL(), this.getBC()));
    },
    0x0A: function() {
      // LD A,(BC)
      this.a = this.readMem(this.getBC());
    },
    0x0B: function() {
      // DEC BC
      this.decBC();
    },
    0x0C: function() {
      // INC C
      this.c = this.inc8(this.c);
    },
    0x0D: function() {
      // DEC C
      this.c = this.dec8(this.c);
    },
    0x0E: function() {
      // LD C,n
      this.c = this.readMem(this.pc++);
    },
    0x0F: function() {
      // RRCA
      this.rrca_a();
    },
    0x10: function() {
      // DJNZ (PC+e)
      this.b = (this.b - 1) & 0xff;
      this.jr(this.b != 0);
    },
    0x11: function() {
      // LD DE,nn
      this.e = this.readMem(this.pc++);
      this.d = this.readMem(this.pc++);
    },
    0x12: function() {
      // LD (DE), A
      this.writeMem(this.getDE(), this.a);
    },
    0x13: function() {
      // INC DE
      this.incDE();
    },
    0x14: function() {
      // INC D
      this.d = this.inc8(this.d);
    },
    0x15: function() {
      // DEC D
      this.d = this.dec8(this.d);
    },
    0x16: function() {
      // LD D,n
      this.d = (this.readMem(this.pc++));
    },
    0x17: function() {
      // RLA
      this.rla_a();
    },
    0x18: function() {
      // JR (PC+e)
      this.pc += this.d_() + 1;
    },
    0x19: function() {
      // ADD HL,DE
      this.setHL(this.add16(this.getHL(), this.getDE()));
    },
    0x1A: function() {
      // LD A,(DE)
      this.a = this.readMem(this.getDE());
    },
    0x1B: function() {
      // DEC DE
      this.decDE();
    },
    0x1C: function() {
      // INC E
      this.e = this.inc8(this.e);
    },
    0x1D: function() {
      // DEC E
      this.e = this.dec8(this.e);
    },
    0x1E: function() {
      // LD E,N
      this.e = this.readMem(this.pc++);
    },
    0x1F: function() {
      // RRA
      this.rra_a();
    },
    0x20: function() {
      // JR NZ,(PC+e)
      this.jr(!((this.f & F_ZERO) != 0));
    },
    0x21: function() {
      // LD HL,nn
      this.l = this.readMem(this.pc++);
      this.h = this.readMem(this.pc++);
    },
    0x22: function() {
      // LD (nn),HL
      var location = this.readMemWord(this.pc);
      this.writeMem(location, this.l);
      this.writeMem(++location, this.h);
      this.pc += 2;
    },
    0x23: function() {
      // INC HL
      this.incHL();
    },
    0x24: function() {
      // INC H
      this.h = this.inc8(this.h);
    },
    0x25: function() {
      // DEC H
      this.h = this.dec8(this.h);
    },
    0x26: function() {
      // LD H,n
      this.h = this.readMem(this.pc++);
    },
    0x27: function() {
      // DAA
      this.daa();
    },
    0x28: function() {
      // JR Z,(PC+e)
      this.jr(((this.f & F_ZERO) != 0));
    },
    0x29: function() {
      // ADD HL,HL
      this.setHL(this.add16(this.getHL(), this.getHL()));
    },
    0x2A: function() {
      // LD HL,(nn)
      var location = this.readMemWord(this.pc);
      this.l = this.readMem(location);
      this.h = this.readMem(location + 1);
      this.pc += 2;
    },
    0x2B: function() {
      // DEC HL
      this.decHL();
    },
    0x2C: function() {
      // INC L
      this.l = this.inc8(this.l);
    },
    0x2D: function() {
      // DEC L
      this.l = this.dec8(this.l);
    },
    0x2E: function() {
      // LD L,n
      this.l = this.readMem(this.pc++);
    },
    0x2F: function() {
      // CPL
      this.cpl_a();
    },
    0x30: function() {
      // JR NC,(PC+e)
      this.jr(!((this.f & F_CARRY) != 0));
    },
    0x31: function() {
      // LD SP,nn
      this.sp = this.readMemWord(this.pc);
      this.pc += 2;
    },
    0x32: function() {
      // LD (nn),A
      this.writeMem(this.readMemWord(this.pc), this.a);
      this.pc += 2;
    },
    0x33: function() {
      // INC SP
      this.sp++;
    },
    0x34: function() {
      // INC (HL)
      this.incMem(this.getHL());
    },
    0x35: function() {
      // DEC (HL)
      this.decMem(this.getHL());
    },
    0x36: function() {
      // LD (HL),n
      this.writeMem(this.getHL(), this.readMem(this.pc++));
    },
    0x37: function() {
      // SCF
      this.f |= F_CARRY;
      this.f &= ~F_NEGATIVE;
      this.f &= ~F_HALFCARRY;
    },
    0x38: function() {
      // JR C,(PC+e)
      this.jr((this.f & F_CARRY) != 0);
    },
    0x39: function() {
      // ADD HL,SP
      this.setHL(this.add16(this.getHL(), this.sp));
    },
    0x3A: function() {
      // LD A,(nn)
      this.a = this.readMem(this.readMemWord(this.pc));
      this.pc += 2;
    },
    0x3B: function() {
      // DEC SP
      this.sp--;
    },
    0x3C: function() {
      // INC A
      this.a = this.inc8(this.a);
    },
    0x3D: function() {
      // DEC A
      this.a = this.dec8(this.a);
    },
    0x3E: function() {
      // LD A,n
      this.a = this.readMem(this.pc++);
    },
    0x3F: function() {
      // CCF
      this.ccf();
    },
    0x40: function() {
      // LD B,B
    },
    0x41: function() {
      // LD B,C
      this.b = this.c;
    },
    0x42: function() {
      // LD B,D
      this.b = this.d;
    },
    0x43: function() {
      // LD B,E
      this.b = this.e;
    },
    0x44: function() {
      // LD B,H
      this.b = this.h;
    },
    0x45: function() {
      // LD B,L
      this.b = this.l;
    },
    0x46: function() {
      // LD B,(HL)
      this.b = this.readMem(this.getHL());
    },
    0x47: function() {
      // LD B,A
      this.b = this.a;
    },
    0x48: function() {
      // LD C,B
      this.c = this.b;
    },
    0x49: function() {
      // LD C,C
    },
    0x4A: function() {
      // LD C,D
      this.c = this.d;
    },
    0x4B: function() {
      // LD C,E
      this.c = this.e;
    },
    0x4C: function() {
      // LD C,H
      this.c = this.h;
    },
    0x4D: function() {
      // LD C,L
      this.c = this.l;
    },
    0x4E: function() {
      // LD C,(HL)
      this.c = this.readMem(this.getHL());
    },
    0x4F: function() {
      // LD C,A
      this.c = this.a;
    },
    0x50: function() {
      // LD D,B
      this.d = this.b;
    },
    0x51: function() {
      // LD D,C
      this.d = this.c;
    },
    0x52: function() {
      // LD D,D
    },
    0x53: function() {
      // LD D,E
      this.d = this.e;
    },
    0x54: function() {
      // LD D,H
      this.d = this.h;
    },
    0x55: function() {
      // LD D,L
      this.d = this.l;
    },
    0x56: function() {
      // LD D,(HL)
      this.d = this.readMem(this.getHL());
    },
    0x57: function() {
      // LD D,A
      this.d = this.a;
    },
    0x58: function() {
      // LD E,B
      this.e = this.b;
    },
    0x59: function() {
      // LD E,C
      this.e = this.c;
    },
    0x5A: function() {
      // LD E,D
      this.e = this.d;
    },
    0x5B: function() {
      // LD E,E
    },
    0x5C: function() {
      // LD E,H
      this.e = this.h;
    },
    0x5D: function() {
      // LD E,L
      this.e = this.l;
    },
    0x5E: function() {
      // LD E,(HL)
      this.e = this.readMem(this.getHL());
    },
    0x5F: function() {
      // LD E,A
      this.e = this.a;
    },
    0x60: function() {
      // LD H,B
      this.h = this.b;
    },
    0x61: function() {
      // LD H,C
      this.h = this.c;
    },
    0x62: function() {
      // LD H,D
      this.h = this.d;
    },
    0x63: function() {
      // LD H,E
      this.h = this.e;
    },
    0x64: function() {
      // LD H,H
    },
    0x65: function() {
      // LD H,L
      this.h = this.l;
    },
    0x66: function() {
      // LD H,(HL)
      this.h = this.readMem(this.getHL());
    },
    0x67: function() {
      // LD H,A
      this.h = this.a;
    },
    0x68: function() {
      // LD L,B
      this.l = this.b;
    },
    0x69: function() {
      // LD L,C
      this.l = this.c;
    },
    0x6A: function() {
      // LD L,D
      this.l = this.d;
    },
    0x6B: function() {
      // LD L,E
      this.l = this.e;
    },
    0x6C: function() {
      // LD L,H
      this.l = this.h;
    },
    0x6D: function() {
      // LD L,L
    },
    0x6E: function() {
      // LD L,(HL)
      this.l = this.readMem(this.getHL());
    },
    0x6F: function() {
      // LD L,A
      this.l = this.a;
    },
    0x70: function() {
      // LD (HL),B
      this.writeMem(this.getHL(), this.b);
    },
    0x71: function() {
      // LD (HL),C
      this.writeMem(this.getHL(), this.c);
    },
    0x72: function() {
      // LD (HL),D
      this.writeMem(this.getHL(), this.d);
    },
    0x73: function() {
      // LD (HL),E
      this.writeMem(this.getHL(), this.e);
    },
    0x74: function() {
      // LD (HL),H
      this.writeMem(this.getHL(), this.h);
    },
    0x75: function() {
      // LD (HL),L
      this.writeMem(this.getHL(), this.l);
    },
    0x76: function() {
      // HALT
      if (HALT_SPEEDUP) this.tstates = 0;
      this.halt = true;
      this.pc--;
    },
    0x77: function() {
      // LD (HL),A
      this.writeMem(this.getHL(), this.a);
    },
    0x78: function() {
      // LD A,B
      this.a = this.b;
    },
    0x79: function() {
      // LD A,C
      this.a = this.c;
    },
    0x7A: function() {
      // LD A,D
      this.a = this.d;
    },
    0x7B: function() {
      // LD A,E
      this.a = this.e;
    },
    0x7C: function() {
      // LD A,H
      this.a = this.h;
    },
    0x7D: function() {
      // LD A,L
      this.a = this.l;
    },
    0x7E: function() {
      // LD A,(HL)
      this.a = this.readMem(this.getHL());
    },
    0x7F: function() {
      // LD A,A
    },
    0x80: function() {
      // ADD A,B
      this.add_a(this.b);
    },
    0x81: function() {
      // ADD A,C
      this.add_a(this.c);
    },
    0x82: function() {
      // ADD A,D
      this.add_a(this.d);
    },
    0x83: function() {
      // ADD A,E
      this.add_a(this.e);
    },
    0x84: function() {
      // ADD A,H
      this.add_a(this.h);
    },
    0x85: function() {
      // ADD A,L
      this.add_a(this.l);
    },
    0x86: function() {
      // ADD A,(HL)
      this.add_a(this.readMem(this.getHL()));
    },
    0x87: function() {
      // ADD A,A
      this.add_a(this.a);
    },
    0x88: function() {
      // ADC A,B
      this.adc_a(this.b);
    },
    0x89: function() {
      // ADC A,C
      this.adc_a(this.c);
    },
    0x8A: function() {
      // ADC A,D
      this.adc_a(this.d);
    },
    0x8B: function() {
      // ADC A,E
      this.adc_a(this.e);
    },
    0x8C: function() {
      // ADC A,H
      this.adc_a(this.h);
    },
    0x8D: function() {
      // ADC A,L
      this.adc_a(this.l);
    },
    0x8E: function() {
      // ADC A,(HL)
      this.adc_a(this.readMem(this.getHL()));
    },
    0x8F: function() {
      // ADC A,A
      this.adc_a(this.a);
    },
    0x90: function() {
      // SUB A,B
      this.sub_a(this.b);
    },
    0x91: function() {
      // SUB A,C
      this.sub_a(this.c);
    },
    0x92: function() {
      // SUB A,D
      this.sub_a(this.d);
    },
    0x93: function() {
      // SUB A,E
      this.sub_a(this.e);
    },
    0x94: function() {
      // SUB A,H
      this.sub_a(this.h);
    },
    0x95: function() {
      // SUB A,L
      this.sub_a(this.l);
    },
    0x96: function() {
      // SUB A,(HL)
      this.sub_a(this.readMem(this.getHL()));
    },
    0x97: function() {
      // SUB A,A
      this.sub_a(this.a);
    },
    0x98: function() {
      // SBC A,B
      this.sbc_a(this.b);
    },
    0x99: function() {
      // SBC A,C
      this.sbc_a(this.c);
    },
    0x9A: function() {
      // SBC A,D
      this.sbc_a(this.d);
    },
    0x9B: function() {
      // SBC A,E
      this.sbc_a(this.e);
    },
    0x9C: function() {
      // SBC A,H
      this.sbc_a(this.h);
    },
    0x9D: function() {
      // SBC A,L
      this.sbc_a(this.l);
    },
    0x9E: function() {
      // SBC A,(HL)
      this.sbc_a(this.readMem(this.getHL()));
    },
    0x9F: function() {
      // SBC A,A
      this.sbc_a(this.a);
    },
    0xA0: function() {
      // AND A,B
      this.f = this.SZP_TABLE[this.a &= this.b] | F_HALFCARRY;
    },
    0xA1: function() {
      // AND A,C
      this.f = this.SZP_TABLE[this.a &= this.c] | F_HALFCARRY;
    },
    0xA2: function() {
      // AND A,D
      this.f = this.SZP_TABLE[this.a &= this.d] | F_HALFCARRY;
    },
    0xA3: function() {
      // AND A,E
      this.f = this.SZP_TABLE[this.a &= this.e] | F_HALFCARRY;
    },
    0xA4: function() {
      // AND A,H
      this.f = this.SZP_TABLE[this.a &= this.h] | F_HALFCARRY;
    },
    0xA5: function() {
      // AND A,L
      this.f = this.SZP_TABLE[this.a &= this.l] | F_HALFCARRY;
    },
    0xA6: function() {
      // AND A,(HL)
      this.f = this.SZP_TABLE[this.a &= this.readMem(this.getHL())] | F_HALFCARRY;
    },
    0xA7: function() {
      // AND A,A
      this.f = this.SZP_TABLE[this.a] | F_HALFCARRY;
    },
    0xA8: function() {
      // XOR A,B
      this.f = this.SZP_TABLE[this.a ^= this.b];
    },
    0xA9: function() {
      // XOR A,C
      this.f = this.SZP_TABLE[this.a ^= this.c];
    },
    0xAA: function() {
      // XOR A,D
      this.f = this.SZP_TABLE[this.a ^= this.d];
    },
    0xAB: function() {
      // XOR A,E
      this.f = this.SZP_TABLE[this.a ^= this.e];
    },
    0xAC: function() {
      // XOR A,H
      this.f = this.SZP_TABLE[this.a ^= this.h];
    },
    0xAD: function() {
      // XOR A,L
      this.f = this.SZP_TABLE[this.a ^= this.l];
    },
    0xAE: function() {
      // XOR A,(HL)
      this.f = this.SZP_TABLE[this.a ^= this.readMem(this.getHL())];
    },
    0xAF: function() {
      // XOR A,A (=0)
      this.f = this.SZP_TABLE[this.a = 0];
    },
    0xB0: function() {
      // OR A,B
      this.f = this.SZP_TABLE[this.a |= this.b];
    },
    0xB1: function() {
      // OR A,C
      this.f = this.SZP_TABLE[this.a |= this.c];
    },
    0xB2: function() {
      // OR A,D
      this.f = this.SZP_TABLE[this.a |= this.d];
    },
    0xB3: function() {
      // OR A,E
      this.f = this.SZP_TABLE[this.a |= this.e];
    },
    0xB4: function() {
      // OR A,H
      this.f = this.SZP_TABLE[this.a |= this.h];
    },
    0xB5: function() {
      // OR A,L
      this.f = this.SZP_TABLE[this.a |= this.l];
    },
    0xB6: function() {
      // OR A,(HL)
      this.f = this.SZP_TABLE[this.a |= this.readMem(this.getHL())];
    },
    0xB7: function() {
      // OR A,A
      this.f = this.SZP_TABLE[this.a];
    },
    0xB8: function() {
      // CP A,B
      this.cp_a(this.b);
    },
    0xB9: function() {
      // CP A,C
      this.cp_a(this.c);
    },
    0xBA: function() {
      // CP A,D
      this.cp_a(this.d);
    },
    0xBB: function() {
      // CP A,E
      this.cp_a(this.e);
    },
    0xBC: function() {
      // CP A,H
      this.cp_a(this.h);
    },
    0xBD: function() {
      // CP A,L
      this.cp_a(this.l);
    },
    0xBE: function() {
      // CP A,(HL)
      this.cp_a(this.readMem(this.getHL()));
    },
    0xBF: function() {
      // CP A,A
      this.cp_a(this.a);
    },
    0xC0: function() {
      // RET NZ
      this.ret((this.f & F_ZERO) == 0);
    },
    0xC1: function() {
      // POP BC
      this.setBC(this.readMemWord(this.sp));
      this.sp += 2;
    },
    0xC2: function() {
      // JP NZ,(nn)
      this.jp((this.f & F_ZERO) == 0);
    },
    0xC3: function() {
      // JP (nn)
      this.pc = this.readMemWord(this.pc);
    },
    0xC4: function() {
      // CALL NZ (nn)
      this.call((this.f & F_ZERO) == 0);
    },
    0xC5: function() {
      // PUSH BC
      this.push2(this.b, this.c);
    },
    0xC6: function() {
      // ADD A,n
      this.add_a(this.readMem(this.pc++));
    },
    0xC7: function() {
      // RST 00H
      this.push1(this.pc);
      this.pc = 0x00;
    },
    0xC8: function() {
      // RET Z
      this.ret((this.f & F_ZERO) != 0);
    },
    0xC9: function() {
      // RET
      this.pc = this.readMemWord(this.sp);
      this.sp += 2;
    },
    0xCA: function() {
      // JP Z,(nn)
      this.jp((this.f & F_ZERO) != 0);
    },
    0xCB: function() {
      // CB Opcode
      this.doCB(this.readMem(this.pc++));
    },
    0xCC: function() {
      // CALL Z (nn)
      this.call((this.f & F_ZERO) != 0);
    },
    0xCD: function() {
      // CALL (nn)
      this.push1(this.pc + 2);
      this.pc = this.readMemWord(this.pc);
    },
    0xCE: function() {
      // ADC A,n
      this.adc_a(this.readMem(this.pc++));
    },
    0xCF: function() {
      // RST 08H
      this.push1(this.pc);
      this.pc = 0x08;
    },
    0xD0: function() {
      // RET NC
      this.ret((this.f & F_CARRY) == 0);
    },
    0xD1: function() {
      // POP DE
      this.setDE(this.readMemWord(this.sp));
      this.sp += 2;
    },
    0xD2: function() {
      // JP NC,(nn)
      this.jp((this.f & F_CARRY) == 0);
    },
    0xD3: function() {
      // OUT (n),A
      this.port.out(this.readMem(this.pc++), this.a);
    },
    0xD4: function() {
      // CALL NC (nn)
      this.call((this.f & F_CARRY) == 0);
    },
    0xD5: function() {
      // PUSH DE
      this.push2(this.d, this.e);
    },
    0xD6: function() {
      // SUB n
      this.sub_a(this.readMem(this.pc++));
    },
    0xD7: function() {
      // RST 10H
      this.push1(this.pc);
      this.pc = 0x10;
    },
    0xD8: function() {
      // RET C
      this.ret(((this.f & F_CARRY) != 0));
    },
    0xD9: function() {
      // EXX
      this.exBC();
      this.exDE();
      this.exHL();
    },
    0xDA: function() {
      // JP C,(nn)
      this.jp((this.f & F_CARRY) != 0);
    },
    0xDB: function() {
      // IN A,(n)
      this.a = this.port.in_(this.readMem(this.pc++));
    },
    0xDC: function() {
      // CALL C (nn)
      this.call((this.f & F_CARRY) != 0);
    },
    0xDD: function() {
      // DD Opcode
      this.doIndexOpIX(this.readMem(this.pc++));
    },
    0xDE: function() {
      // SBC A,n
      this.sbc_a(this.readMem(this.pc++));
    },
    0xDF: function() {
      // RST 18H
      this.push1(this.pc);
      this.pc = 0x18;
    },
    0xE0: function() {
      // RET PO
      this.ret((this.f & F_PARITY) == 0);
    },
    0xE1: function() {
      // POP HL
      this.setHL(this.readMemWord(this.sp));
      this.sp += 2;
    },
    0xE2: function() {
      // JP PO,(nn)
      this.jp((this.f & F_PARITY) == 0);
    },
    0xE3: function() {
      // EX (SP),HL
      var temp = this.h;
      this.h = this.readMem(this.sp + 1);
      this.writeMem(this.sp + 1, temp);
      temp = this.l;
      this.l = this.readMem(this.sp);
      this.writeMem(this.sp, temp);
    },
    0xE4: function() {
      // CALL PO (nn)
      this.call((this.f & F_PARITY) == 0);
    },
    0xE5: function() {
      // PUSH HL
      this.push2(this.h, this.l);
    },
    0xE6: function() {
      // AND (n)
      this.f = this.SZP_TABLE[this.a &= this.readMem(this.pc++)] | F_HALFCARRY;
    },
    0xE7: function() {
      // RST 20H
      this.push1(this.pc);
      this.pc = 0x20;
    },
    0xE8: function() {
      // RET PE
      this.ret((this.f & F_PARITY) != 0);
    },
    0xE9: function() {
      // JP (HL)
      this.pc = this.getHL();
    },
    0xEA: function() {
      // JP PE,(nn)
      this.jp((this.f & F_PARITY) != 0);
    },
    0xEB: function() {
      // EX DE,HL
      var temp = this.d;
      this.d = this.h;
      this.h = temp;
      temp = this.e;
      this.e = this.l;
      this.l = temp;
    },
    0xEC: function() {
      // CALL PE (nn)
      this.call((this.f & F_PARITY) != 0);
    },
    0xED: function() {
      // ED Opcode
      this.doED(this.readMem(this.pc));
    },
    0xEE: function() {
      // XOR n
      this.f = this.SZP_TABLE[this.a ^= this.readMem(this.pc++)];
    },
    0xEF: function() {
      // RST 28H
      this.push1(this.pc);
      this.pc = 0x28;
    },
    0xF0: function() {
      // RET P
      this.ret((this.f & F_SIGN) == 0);
    },
    0xF1: function() {
      // POP AF
      this.f = this.readMem(this.sp++);
      this.a = this.readMem(this.sp++);
    },
    0xF2: function() {
      // JP P,(nn)
      this.jp((this.f & F_SIGN) == 0);
    },
    0xF3: function() {
      // DI
      this.iff1 = this.iff2 = false;
      this.EI_inst = true;
    },
    0xF4: function() {
      // CALL P (nn)
      this.call((this.f & F_SIGN) == 0);
    },
    0xF5: function() {
      // PUSH AF
      this.push2(this.a, this.f);
    },
    0xF6: function() {
      // OR n
      this.f = this.SZP_TABLE[this.a |= this.readMem(this.pc++)];
    },
    0xF7: function() {
      // RST 30H
      this.push1(this.pc);
      this.pc = 0x30;
    },
    0xF8: function() {
      // RET M
      this.ret((this.f & F_SIGN) != 0);
    },
    0xF9: function() {
      // LD SP,HL
      this.sp = this.getHL();
    },
    0xFA: function() {
      // JP M,(nn)
      this.jp((this.f & F_SIGN) != 0);
    },
    0xFB: function() {
      // EI
      this.iff1 = this.iff2 = true;
      this.EI_inst = true;
    },
    0xFC: function() {
      // CALL M (nn)
      this.call((this.f & F_SIGN) != 0);
    },
    0xFD: function() {
      // FD Opcode
      this.doIndexOpIY(this.readMem(this.pc++));
    },
    0xFE: function() {
      // CP n
      this.cp_a(this.readMem(this.pc++));
    },
    0xFF: function() {
      // RST 38H
      this.push1(this.pc);
      this.pc = 0x38;
    }
  };
  return opcodeToInst[opcode].toString();
};


/**
 * Output the instruction associated to an opcode for debugging purposes
 *
 * @param {number} opcode
 * @return {string}
 */
function getOpCode(opcode) {
  switch (opcode) {
    case 0x00:
      return 'NOP';
      break;
    case 0x01:
      return 'LD BC,nn';
      break;
    case 0x02:
      return 'LD (BC),A';
      break;
    case 0x03:
      return 'INC BC';
      break;
    case 0x04:
      return 'INC B';
      break;
    case 0x05:
      return 'DEC B';
      break;
    case 0x06:
      return 'LD B,n';
      break;
    case 0x07:
      return 'RLCA';
      break;
    case 0x08:
      return 'EX AF AF\'';
      break;
    case 0x09:
      return 'ADD HL,BC';
      break;
    case 0x0A:
      return 'LD A,(BC)';
      break;
    case 0x0B:
      return 'DEC BC';
      break;
    case 0x0C:
      return 'INC C';
      break;
    case 0x0D:
      return 'DEC C';
      break;
    case 0x0E:
      return 'LD C,n';
      break;
    case 0x0F:
      return 'RRCA';
      break;
    case 0x10:
      return 'DJNZ (PC+e)';
      break;
    case 0x11:
      return 'LD DE,nn';
      break;
    case 0x12:
      return 'LD (DE), A';
      break;
    case 0x13:
      return 'INC DE';
      break;
    case 0x14:
      return 'INC D';
      break;
    case 0x15:
      return 'DEC D';
      break;
    case 0x16:
      return 'LD D,n';
      break;
    case 0x17:
      return 'RLA';
      break;
    case 0x18:
      return 'JR (PC+e)';
      break;
    case 0x19:
      return 'ADD HL,DE';
      break;
    case 0x1A:
      return 'LD A,(DE)';
      break;
    case 0x1B:
      return 'DEC DE';
      break;
    case 0x1C:
      return 'INC E';
      break;
    case 0x1D:
      return 'DEC E';
      break;
    case 0x1E:
      return 'LD E,N';
      break;
    case 0x1F:
      return 'RRA';
      break;
    case 0x20:
      return 'JR NZ,(PC+e)';
      break;
    case 0x21:
      return 'LD HL,nn';
      break;
    case 0x22:
      return 'LD (nn),HL';
      break;
    case 0x23:
      return 'INC HL';
      break;
    case 0x24:
      return 'INC H';
      break;
    case 0x25:
      return 'DEC H';
      break;
    case 0x26:
      return 'LD H,n';
      break;
    case 0x27:
      return 'DAA';
      break;
    case 0x28:
      return 'JR Z,(PC+e)';
      break;
    case 0x29:
      return 'ADD HL,HL';
      break;
    case 0x2A:
      return 'LD HL,(nn)';
      break;
    case 0x2B:
      return 'DEC HL';
      break;
    case 0x2C:
      return 'INC L';
      break;
    case 0x2D:
      return 'DEC L';
      break;
    case 0x2E:
      return 'LD L,n';
      break;
    case 0x2F:
      return 'CPL';
      break;
    case 0x30:
      return 'JR NC,(PC+e)';
      break;
    case 0x31:
      return 'LD SP,nn';
      break;
    case 0x32:
      return 'LD (nn),A';
      break;
    case 0x33:
      return 'INC SP';
      break;
    case 0x34:
      return 'INC (HL)';
      break;
    case 0x35:
      return 'DEC (HL)';
      break;
    case 0x36:
      return 'LD (HL),n';
      break;
    case 0x37:
      return 'SCF';
      break;
    case 0x38:
      return 'JR C,(PC+e)';
      break;
    case 0x39:
      return 'ADD HL,SP';
      break;
    case 0x3A:
      return 'LD A,(nn)';
      break;
    case 0x3B:
      return 'DEC SP';
      break;
    case 0x3C:
      return 'INC A';
      break;
    case 0x3D:
      return 'DEC A';
      break;
    case 0x3E:
      return 'LD A,n';
      break;
    case 0x3F:
      return 'CCF';
      break;
    case 0x40:
      return 'LD B,B';
      break;
    case 0x41:
      return 'LD B,C';
      break;
    case 0x42:
      return 'LD B,D';
      break;
    case 0x43:
      return 'LD B,E';
      break;
    case 0x44:
      return 'LD B,H';
      break;
    case 0x45:
      return 'LD B,L';
      break;
    case 0x46:
      return 'LD B,(HL)';
      break;
    case 0x47:
      return 'LD B,A';
      break;
    case 0x48:
      return 'LD C,B';
      break;
    case 0x49:
      return 'LD C,C';
      break;
    case 0x4A:
      return 'LD C,D';
      break;
    case 0x4B:
      return 'LD C,E';
      break;
    case 0x4C:
      return 'LD C,H';
      break;
    case 0x4D:
      return 'LD C,L';
      break;
    case 0x4E:
      return 'LD C,(HL)';
      break;
    case 0x4F:
      return 'LD C,A';
      break;
    case 0x50:
      return 'LD D,B';
      break;
    case 0x51:
      return 'LD D,C';
      break;
    case 0x52:
      return 'LD D,D';
      break;
    case 0x53:
      return 'LD D,E';
      break;
    case 0x54:
      return 'LD D,H';
      break;
    case 0x55:
      return 'LD D,L';
      break;
    case 0x56:
      return 'LD D,(HL)';
      break;
    case 0x57:
      return 'LD D,A';
      break;
    case 0x58:
      return 'LD E,B';
      break;
    case 0x59:
      return 'LD E,C';
      break;
    case 0x5A:
      return 'LD E,D';
      break;
    case 0x5B:
      return 'LD E,E';
      break;
    case 0x5C:
      return 'LD E,H';
      break;
    case 0x5D:
      return 'LD E,L';
      break;
    case 0x5E:
      return 'LD E,(HL)';
      break;
    case 0x5F:
      return 'LD E,A';
      break;
    case 0x60:
      return 'LD H,B';
      break;
    case 0x61:
      return 'LD H,C';
      break;
    case 0x62:
      return 'LD H,D';
      break;
    case 0x63:
      return 'LD H,E';
      break;
    case 0x64:
      return 'LD H,H';
      break;
    case 0x65:
      return 'LD H,L';
      break;
    case 0x66:
      return 'LD H,(HL)';
      break;
    case 0x67:
      return 'LD H,A';
      break;
    case 0x68:
      return 'LD L,B';
      break;
    case 0x69:
      return 'LD L,C';
      break;
    case 0x6A:
      return 'LD L,D';
      break;
    case 0x6B:
      return 'LD L,E';
      break;
    case 0x6C:
      return 'LD L,H';
      break;
    case 0x6D:
      return 'LD L,L';
      break;
    case 0x6E:
      return 'LD L,(HL)';
      break;
    case 0x6F:
      return 'LD L,A';
      break;
    case 0x70:
      return 'LD (HL),B';
      break;
    case 0x71:
      return 'LD (HL),C';
      break;
    case 0x72:
      return 'LD (HL),D';
      break;
    case 0x73:
      return 'LD (HL),E';
      break;
    case 0x74:
      return 'LD (HL),H';
      break;
    case 0x75:
      return 'LD (HL),L';
      break;
    case 0x76:
      return 'HALT';
      break;
    case 0x77:
      return 'LD (HL),A';
      break;
    case 0x78:
      return 'LD A,B';
      break;
    case 0x79:
      return 'LD A,C';
      break;
    case 0x7A:
      return 'LD A,D';
      break;
    case 0x7B:
      return 'LD A,E';
      break;
    case 0x7C:
      return 'LD A,H';
      break;
    case 0x7D:
      return 'LD A,L';
      break;
    case 0x7E:
      return 'LD A,(HL)';
      break;
    case 0x7F:
      return 'LD A,A';
      break;
    case 0x80:
      return 'ADD A,B';
      break;
    case 0x81:
      return 'ADD A,C';
      break;
    case 0x82:
      return 'ADD A,D';
      break;
    case 0x83:
      return 'ADD A,E';
      break;
    case 0x84:
      return 'ADD A,H';
      break;
    case 0x85:
      return 'ADD A,L';
      break;
    case 0x86:
      return 'ADD A,(HL)';
      break;
    case 0x87:
      return 'ADD A,A';
      break;
    case 0x88:
      return 'ADC A,B';
      break;
    case 0x89:
      return 'ADC A,C';
      break;
    case 0x8A:
      return 'ADC A,D';
      break;
    case 0x8B:
      return 'ADC A,E';
      break;
    case 0x8C:
      return 'ADC A,H';
      break;
    case 0x8D:
      return 'ADC A,L';
      break;
    case 0x8E:
      return 'ADC A,(HL)';
      break;
    case 0x8F:
      return 'ADC A,A';
      break;
    case 0x90:
      return 'SUB A,B';
      break;
    case 0x91:
      return 'SUB A,C';
      break;
    case 0x92:
      return 'SUB A,D';
      break;
    case 0x93:
      return 'SUB A,E';
      break;
    case 0x94:
      return 'SUB A,H';
      break;
    case 0x95:
      return 'SUB A,L';
      break;
    case 0x96:
      return 'SUB A,(HL)';
      break;
    case 0x97:
      return 'SUB A,A';
      break;
    case 0x98:
      return 'SBC A,B';
      break;
    case 0x99:
      return 'SBC A,C';
      break;
    case 0x9A:
      return 'SBC A,D';
      break;
    case 0x9B:
      return 'SBC A,E';
      break;
    case 0x9C:
      return 'SBC A,H';
      break;
    case 0x9D:
      return 'SBC A,L';
      break;
    case 0x9E:
      return 'SBC A,(HL)';
      break;
    case 0x9F:
      return 'SBC A,A';
      break;
    case 0xA0:
      return 'AND A,B';
      break;
    case 0xA1:
      return 'AND A,C';
      break;
    case 0xA2:
      return 'AND A,D';
      break;
    case 0xA3:
      return 'AND A,E';
      break;
    case 0xA4:
      return 'AND A,H';
      break;
    case 0xA5:
      return 'AND A,L';
      break;
    case 0xA6:
      return 'AND A,(HL)';
      break;
    case 0xA7:
      return 'AND A,A';
      break;
    case 0xA8:
      return 'XOR A,B';
      break;
    case 0xA9:
      return 'XOR A,C';
      break;
    case 0xAA:
      return 'XOR A,D';
      break;
    case 0xAB:
      return 'XOR A,E';
      break;
    case 0xAC:
      return 'XOR A,H';
      break;
    case 0xAD:
      return 'XOR A,L';
      break;
    case 0xAE:
      return 'XOR A,(HL)';
      break;
    case 0xAF:
      return 'XOR A,A (=0)';
      break;
    case 0xB0:
      return 'OR A,B';
      break;
    case 0xB1:
      return 'OR A,C';
      break;
    case 0xB2:
      return 'OR A,D';
      break;
    case 0xB3:
      return 'OR A,E';
      break;
    case 0xB4:
      return 'OR A,H';
      break;
    case 0xB5:
      return 'OR A,L';
      break;
    case 0xB6:
      return 'OR A,(HL)';
      break;
    case 0xB7:
      return 'OR A,A';
      break;
    case 0xB8:
      return 'CP A,B';
      break;
    case 0xB9:
      return 'CP A,C';
      break;
    case 0xBA:
      return 'CP A,D';
      break;
    case 0xBB:
      return 'CP A,E';
      break;
    case 0xBC:
      return 'CP A,H';
      break;
    case 0xBD:
      return 'CP A,L';
      break;
    case 0xBE:
      return 'CP A,(HL)';
      break;
    case 0xBF:
      return 'CP A,A';
      break;
    case 0xC0:
      return 'RET NZ';
      break;
    case 0xC1:
      return 'POP BC';
      break;
    case 0xC2:
      return 'JP NZ,(nn)';
      break;
    case 0xC3:
      return 'JP (nn)';
      break;
    case 0xC4:
      return 'CALL NZ (nn)';
      break;
    case 0xC5:
      return 'PUSH BC';
      break;
    case 0xC6:
      return 'ADD A,n';
      break;
    case 0xC7:
      return 'RST 00H';
      break;
    case 0xC8:
      return 'RET Z';
      break;
    case 0xC9:
      return 'RET';
      break;
    case 0xCA:
      return 'JP Z,(nn)';
      break;
    case 0xCB:
      return 'CB Opcode';
      break;
    case 0xCC:
      return 'CALL Z (nn)';
      break;
    case 0xCD:
      return 'CALL (nn)';
      break;
    case 0xCE:
      return 'ADC A,n';
      break;
    case 0xCF:
      return 'RST 08H';
      break;
    case 0xD0:
      return 'RET NC';
      break;
    case 0xD1:
      return 'POP DE';
      break;
    case 0xD2:
      return 'JP NC,(nn)';
      break;
    case 0xD3:
      return 'OUT (n),A';
      break;
    case 0xD4:
      return 'CALL NC (nn)';
      break;
    case 0xD5:
      return 'PUSH DE';
      break;
    case 0xD6:
      return 'SUB n';
      break;
    case 0xD7:
      return 'RST 10H';
      break;
    case 0xD8:
      return 'RET C';
      break;
    case 0xD9:
      return 'EXX';
      break;
    case 0xDA:
      return 'JP C,(nn)';
      break;
    case 0xDB:
      return 'IN A,(n)';
      break;
    case 0xDC:
      return 'CALL C (nn)';
      break;
    case 0xDD:
      return 'DD Opcode';
      break;
    case 0xDE:
      return 'SBC A,n';
      break;
    case 0xDF:
      return 'RST 18H';
      break;
    case 0xE0:
      return 'RET PO';
      break;
    case 0xE1:
      return 'POP HL';
      break;
    case 0xE2:
      return 'JP PO,(nn)';
      break;
    case 0xE3:
      return 'EX (SP),HL';
      break;
    case 0xE4:
      return 'CALL PO (nn)';
      break;
    case 0xE5:
      return 'PUSH HL';
      break;
    case 0xE6:
      return 'AND (n)';
      break;
    case 0xE7:
      return 'RST 20H';
      break;
    case 0xE8:
      return 'RET PE';
      break;
    case 0xE9:
      return 'JP (HL)';
      break;
    case 0xEA:
      return 'JP PE,(nn)';
      break;
    case 0xEB:
      return 'EX DE,HL';
      break;
    case 0xEC:
      return 'CALL PE (nn)';
      break;
    case 0xED:
      return 'ED Opcode';
      break;
    case 0xEE:
      return 'XOR n';
      break;
    case 0xEF:
      return 'RST 28H';
      break;
    case 0xF0:
      return 'RET P';
      break;
    case 0xF1:
      return 'POP AF';
      break;
    case 0xF2:
      return 'JP P,(nn)';
      break;
    case 0xF3:
      return 'DI';
      break;
    case 0xF4:
      return 'CALL P (nn)';
      break;
    case 0xF5:
      return 'PUSH AF';
      break;
    case 0xF6:
      return 'OR n';
      break;
    case 0xF7:
      return 'RST 30H';
      break;
    case 0xF8:
      return 'RET M';
      break;
    case 0xF9:
      return 'LD SP,HL';
      break;
    case 0xFA:
      return 'JP M,(nn)';
      break;
    case 0xFB:
      return 'EI';
      break;
    case 0xFC:
      return 'CALL M (nn)';
      break;
    case 0xFD:
      return 'FD Opcode';
      break;
    case 0xFE:
      return 'CP n';
      break;
    case 0xFF:
      return 'RST 38H';
      break;
  } // end switch

  return 'Unknown Opcode';
}
