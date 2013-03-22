/*
SMSDynaRec - An attempt to implement a dynamic recompiling emulator for SMS/GG ROMs
Copyright (C) 2013 G. Cedric Marty (https://github.com/gmarty)
Based on JavaGear Copyright (c) 2002-2008 Chris White

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
'use strict';var DEBUG = true;
var ACCURATE = false;
var LITTLE_ENDIAN = true;
var SUPPORT_DATAVIEW = !!(window["DataView"] && window["ArrayBuffer"]);
var SAMPLE_RATE = 44100;
var Setup = {DEBUG_TIMING:DEBUG, REFRESH_EMULATION:false, ACCURATE_INTERRUPT_EMULATION:ACCURATE, LIGHTGUN:false, VDP_SPRITE_COLLISIONS:ACCURATE, PAGE_SIZE:1024};
var frameTime = 17;
var fpsInterval = 500;
var CLOCK_NTSC = 3579545;
var CLOCK_PAL = 3546893;
function JSSMS(opts) {
  this.opts = {"ui":JSSMS.DummyUI, "swfPath":"lib/"};
  if(opts != undefined) {
    var key;
    for(key in this.opts) {
      if(opts[key] != undefined) {
        this.opts[key] = opts[key]
      }
    }
  }
  this.keyboard = new JSSMS.Keyboard(this);
  this.ui = new opts["ui"](this);
  this.vdp = new JSSMS.Vdp(this);
  this.psg = new JSSMS.SN76489(this);
  this.ports = new JSSMS.Ports(this);
  this.cpu = new JSSMS.Z80(this);
  this.ui.updateStatus("Ready to load a ROM.")
}
JSSMS.prototype = {isRunning:false, cyclesPerLine:0, no_of_scanlines:0, frameSkip:0, throttle:true, fps:0, frameskip_counter:0, pause_button:false, is_sms:true, is_gg:false, soundEnabled:true, audioBuffer:[], audioBufferOffset:0, samplesPerFrame:0, samplesPerLine:[], emuWidth:0, emuHeight:0, fpsFrameCount:0, z80Time:0, drawTime:0, z80TimeCounter:0, drawTimeCounter:0, frameCount:0, romData:"", romFileName:"", reset:function() {
  this.setVideoTiming(this.vdp.videoMode);
  this.frameCount = 0;
  this.frameskip_counter = this.frameSkip;
  this.keyboard.reset();
  this.ui.reset();
  this.vdp.reset();
  this.ports.reset();
  this.cpu.reset();
  this.cpu.resetMemory(null)
}, start:function() {
  var self = this;
  if(!this.isRunning) {
    this.isRunning = true
  }
  this.ui.requestAnimationFrame(this.frame.bind(this), this.ui.screen);
  this.resetFps();
  this.printFps();
  this.fpsInterval = setInterval(function() {
    self.printFps()
  }, fpsInterval)
}, stop:function() {
  clearInterval(this.fpsInterval);
  this.isRunning = false
}, frame:function() {
  if(this.isRunning) {
    if(!this.throttle) {
      if(this.emulateNextFrame()) {
        this.doRepaint()
      }
    }else {
      if(this.emulateNextFrame()) {
        this.doRepaint()
      }
    }
    this.fpsFrameCount++;
    this.ui.requestAnimationFrame(this.frame.bind(this), this.ui.screen)
  }
}, emulateNextFrame:function() {
  var startTime = 0;
  var lineno = 0;
  for(;lineno < this.no_of_scanlines;lineno++) {
    if(Setup.DEBUG_TIMING) {
      startTime = JSSMS.Utils.getTimestamp()
    }
    if(Setup.ACCURATE_INTERRUPT_EMULATION && lineno == 193) {
      this.cpu.run(this.cyclesPerLine, 8);
      this.vdp.setVBlankFlag();
      this.cpu.run(0, 0)
    }else {
      this.cpu.run(this.cyclesPerLine, 0)
    }
    if(Setup.DEBUG_TIMING) {
      this.z80TimeCounter += JSSMS.Utils.getTimestamp() - startTime
    }
    if(this.soundEnabled) {
      this.updateSound(lineno)
    }
    this.vdp.line = lineno;
    if(this.frameskip_counter == 0 && lineno < 192) {
      if(Setup.DEBUG_TIMING) {
        startTime = JSSMS.Utils.getTimestamp()
      }
      this.vdp.drawLine(lineno);
      if(Setup.DEBUG_TIMING) {
        this.drawTimeCounter += JSSMS.Utils.getTimestamp() - startTime
      }
    }
    this.vdp.interrupts(lineno)
  }
  if(this.soundEnabled) {
    this.audioOutput(this.audioBuffer)
  }
  if(Setup.DEBUG_TIMING && ++this.frameCount == 60) {
    this.z80Time = this.z80TimeCounter;
    this.drawTime = this.drawTimeCounter;
    this.z80TimeCounter = 0;
    this.drawTimeCounter = 0;
    this.frameCount = 0
  }
  if(this.pause_button) {
    this.cpu.nmi();
    this.pause_button = false
  }
  if(this.frameskip_counter-- == 0) {
    this.frameskip_counter = this.frameSkip;
    return true
  }
  return false
}, setSMS:function() {
  this.is_sms = true;
  this.is_gg = false;
  this.vdp.h_start = 0;
  this.vdp.h_end = 32;
  this.emuWidth = SMS_WIDTH;
  this.emuHeight = SMS_HEIGHT
}, setGG:function() {
  this.is_gg = true;
  this.is_sms = false;
  this.vdp.h_start = 5;
  this.vdp.h_end = 27;
  this.emuWidth = GG_WIDTH;
  this.emuHeight = GG_HEIGHT
}, setVideoTiming:function(mode) {
  var clockSpeedHz = 0, i, v;
  if(mode == NTSC || this.is_gg) {
    this.fps = 60;
    this.no_of_scanlines = SMS_Y_PIXELS_NTSC;
    clockSpeedHz = CLOCK_NTSC
  }else {
    if(mode == PAL) {
      this.fps = 50;
      this.no_of_scanlines = SMS_Y_PIXELS_PAL;
      clockSpeedHz = CLOCK_PAL
    }
  }
  this.cyclesPerLine = Math.round(clockSpeedHz / this.fps / this.no_of_scanlines + 1);
  this.vdp.videoMode = mode;
  if(this.soundEnabled) {
    this.psg.init(clockSpeedHz, SAMPLE_RATE);
    this.samplesPerFrame = Math.round(SAMPLE_RATE / this.fps);
    if(this.audioBuffer.length == 0 || this.audioBuffer.length != this.samplesPerFrame) {
      this.audioBuffer = new Array(this.samplesPerFrame)
    }
    if(this.samplesPerLine.length == 0 || this.samplesPerLine.length != this.no_of_scanlines) {
      this.samplesPerLine = new Array(this.no_of_scanlines);
      var fractional = 0;
      for(i = 0;i < this.no_of_scanlines;i++) {
        v = (this.samplesPerFrame << 16) / this.no_of_scanlines + fractional;
        fractional = v - (v >> 16 << 16);
        this.samplesPerLine[i] = v >> 16
      }
    }
  }
}, audioOutput:function(buffer) {
  this.ui.writeAudio(buffer)
}, doRepaint:function() {
  this.ui.writeFrame(this.vdp.display, [])
}, printFps:function() {
  var now = JSSMS.Utils.getTimestamp(), s = "Running";
  if(this.lastFpsTime) {
    s += ": " + (this.fpsFrameCount / ((now - this.lastFpsTime) / 1E3)).toFixed(2) + " (/ " + (1E3 / frameTime).toFixed(2) + ") FPS"
  }
  this.ui.updateStatus(s);
  this.fpsFrameCount = 0;
  this.lastFpsTime = now
}, resetFps:function() {
  this.lastFpsTime = null;
  this.fpsFrameCount = 0
}, updateSound:function(line) {
  if(line == 0) {
    this.audioBufferOffset = 0
  }
  var samplesToGenerate = this.samplesPerLine[line];
  this.audioBuffer = this.psg.update(this.audioBufferOffset, samplesToGenerate);
  this.audioBufferOffset += samplesToGenerate
}, readRomDirectly:function(data, fileName) {
  var pages;
  var mode = fileName.substr(-3).toLowerCase() == ".gg" ? 2 : 1;
  var size = data.length;
  if(mode == 1) {
    this.setSMS()
  }else {
    if(mode == 2) {
      this.setGG()
    }
  }
  if(size <= Setup.PAGE_SIZE) {
    return false
  }
  pages = this.loadROM(data, size);
  if(pages == null) {
    return false
  }
  this.cpu.resetMemory(pages);
  this.romData = data;
  this.romFileName = fileName;
  return true
}, loadROM:function(data, size) {
  if(size % 1024 != 0) {
    data = data.substr(512);
    size -= 512
  }
  var i, j;
  var number_of_pages = Math.round(size / Setup.PAGE_SIZE);
  var pages = new Array(number_of_pages);
  for(i = 0;i < number_of_pages;i++) {
    pages[i] = JSSMS.Utils.Array(Setup.PAGE_SIZE);
    if(SUPPORT_DATAVIEW) {
      for(j = 0;j < Setup.PAGE_SIZE;j++) {
        pages[i].setUint8(j, data.charCodeAt(i * Setup.PAGE_SIZE + j))
      }
    }else {
      for(j = 0;j < Setup.PAGE_SIZE;j++) {
        pages[i][j] = data.charCodeAt(i * Setup.PAGE_SIZE + j) & 255
      }
    }
  }
  return pages
}, reloadRom:function() {
  if(this.romData != "" && this.romFileName != "") {
    return this.readRomDirectly(this.romData, this.romFileName)
  }else {
    return false
  }
}};
JSSMS.Utils = {rndInt:function(range) {
  return Math.round(Math.random() * range)
}, Array:function() {
  if(SUPPORT_DATAVIEW) {
    return function(length) {
      if(!length) {
        length = 0
      }
      return new DataView(new ArrayBuffer(length))
    }
  }else {
    return Array
  }
}(), copyArrayElements:function() {
  if(SUPPORT_DATAVIEW) {
    return function(src, srcPos, dest, destPos, length) {
      while(length--) {
        dest.setInt8(destPos + length, src.getInt8(srcPos + length))
      }
    }
  }else {
    return function(src, srcPos, dest, destPos, length) {
      while(length--) {
        dest[destPos + length] = src[srcPos + length]
      }
    }
  }
}(), copyArray:function() {
  if(SUPPORT_DATAVIEW) {
    return function(src) {
      if(!src) {
        return JSSMS.Utils.Array()
      }
      var i, dest;
      i = src.byteLength;
      dest = new JSSMS.Utils.Array(i);
      while(i--) {
        dest.setInt8(i, src.getInt8(i))
      }
      return dest
    }
  }else {
    return function(src) {
      if(!src) {
        return JSSMS.Utils.Array()
      }
      var i, dest;
      i = src.length;
      dest = new JSSMS.Utils.Array(i);
      while(i--) {
        if(src[i] != undefined) {
          dest[i] = src[i]
        }
      }
      return dest
    }
  }
}(), writeMem:function() {
  if(SUPPORT_DATAVIEW) {
    return function(self, address, value) {
      if(DEBUG && (address >> 10 >= self.memWriteMap.length || !self.memWriteMap[address >> 10] || (address & 1023) >= self.memWriteMap[address >> 10].byteLength)) {
        console.error(address, address >> 10, address & 1023);
        debugger
      }
      self.memWriteMap[address >> 10].setInt8(address & 1023, value);
      if(address >= 65532) {
        self.page(address & 3, value)
      }
    }
  }else {
    return function(self, address, value) {
      self.memWriteMap[address >> 10][address & 1023] = value;
      if(address >= 65532) {
        self.page(address & 3, value)
      }
    }
  }
}(), readMem:function() {
  if(SUPPORT_DATAVIEW) {
    return function(array, address) {
      if(DEBUG && (address >> 10 >= array.length || !array[address >> 10] || (address & 1023) >= array[address >> 10].byteLength)) {
        console.error(address, address >> 10, address & 1023);
        debugger
      }
      return array[address >> 10].getUint8(address & 1023)
    }
  }else {
    return function(array, address) {
      return array[address >> 10][address & 1023] & 255
    }
  }
}(), readMemWord:function() {
  if(SUPPORT_DATAVIEW) {
    return function(array, address) {
      if(DEBUG && (address >> 10 >= array.length || !array[address >> 10] || (address & 1023) >= array[address >> 10].byteLength)) {
        console.error(address, address >> 10, address & 1023);
        debugger
      }
      if((address & 1023) < 1023) {
        return array[address >> 10].getUint16(address & 1023, LITTLE_ENDIAN)
      }else {
        return array[address >> 10].getUint8(address & 1023) | array[++address >> 10].getUint8(address & 1023) << 8
      }
    }
  }else {
    return function(array, address) {
      return array[address >> 10][address & 1023] & 255 | (array[++address >> 10][address & 1023] & 255) << 8
    }
  }
}(), getTimestamp:Date.now || function() {
  return(new Date).getTime()
}, getPrefix:function(arr, obj) {
  var prefix = false;
  if(obj == undefined) {
    obj = document
  }
  arr.some(function(prop) {
    if(prop in obj) {
      prefix = prop;
      return true
    }
    return false
  });
  return prefix
}, isIE:function() {
  return/msie/i.test(navigator.userAgent) && !/opera/i.test(navigator.userAgent)
}};
var ENABLE_DYNAREC = true;
var HOT_BLOCK_THRESHOLD = 1;
var JPinst = [194, 195, 202, 210, 218, 226, 233, 234, 242, 250];
var JRinst = [16, 24, 32, 40, 48, 56];
var CALLinst = [196, 204, 205, 212, 220, 228, 236, 244, 252];
var RETinst = [192, 200, 201, 208, 216, 224, 232, 240, 248];
var DIinst = [243];
var miscInst = [221, 253, 237, 118];
var endingInst = [].concat(JPinst, JRinst, CALLinst, RETinst, DIinst, miscInst);
var emptyInst = [0, 64, 73, 82, 91, 100, 109, 127];
var isEndingInst = function(opcode) {
  return endingInst.indexOf(opcode) >= 0
};
var isEmptyInst = function(opcode) {
  return emptyInst.indexOf(opcode) >= 0
};
var toHex = function(dec) {
  var hex = dec.toString(16);
  if(hex.length == 1) {
    hex = "0" + hex
  }
  return"0x" + hex
};
JSSMS.Z80DynaRec = function() {
};
JSSMS.Z80DynaRec.prototype = {init:function() {
  this.buildOpcodeInsts()
}, buildOpcodeInsts:function() {
  var i = 0;
  for(;i <= 255;i++) {
    this.opcodeInstructions[i] = this.getOpCodeInst(i)
  }
}, getOpCodeInst:function(opcode) {
  var preinst = [];
  var inst = "";
  var postinst = [];
  var tstatesDecrementValue = OP_STATES[opcode];
  if(DEBUG) {
    preinst.push("/* opcode: " + toHex(opcode) + "*/")
  }
  if(Setup.ACCURATE_INTERRUPT_EMULATION) {
    preinst.push(this.cleanFunction(this.dynarecPart1))
  }
  preinst.push(this.cleanFunction(this.dynarecPart2));
  if(Setup.ACCURATE_INTERRUPT_EMULATION) {
    preinst.push(this.cleanFunction(this.dynarecPart3))
  }
  if(tstatesDecrementValue > 0) {
    preinst.push(this.cleanFunction(this.dynarecPart4).replace("2", tstatesDecrementValue))
  }
  if(Setup.REFRESH_EMULATION) {
    preinst.push(this.cleanFunction(this.dynarecPart5))
  }
  inst = this.cleanFunction(this.opcodeToJS(opcode));
  var ret = (preinst.join("\n") + "\n" + inst).trim() + ";\n" + postinst.join("\n").trim();
  return ret;
  function toHex(dec) {
    var hex = dec.toString(16);
    if(hex.length == 1) {
      hex = "0" + hex
    }
    return"0x" + hex
  }
}, cleanFunction:function(func) {
  return func.toString().replace(/"use strict";/, "").replace(/function ?[^(]*\(\) ?{/, "").replace(/}$/, "").trim().replace(/\r?\n|\r/g, "\n").replace(/^\s+/gm, "")
}, dynarecPart1:function() {
  if(this.interruptLine) {
    this.interrupt()
  }
}, dynarecPart2:function() {
  this.pc++
}, dynarecPart3:function() {
  this.EI_inst = false
}, dynarecPart4:function() {
  this.tstates -= 2
}, dynarecPart5:function() {
  this.incR()
}, opcodeToJS:function(opcode) {
  var opcodeToInst = {"0":function() {
  }, 1:function() {
    this.c = this.readMem(this.pc++);
    this.b = this.readMem(this.pc++)
  }, 2:function() {
    this.writeMem(this.b << 8 | this.c, this.a)
  }, 3:function() {
    this.c = this.c + 1 & 255;
    if(this.c == 0) {
      this.b = this.b + 1 & 255
    }
  }, 4:function() {
    this.b = this.b + 1 & 255;
    this.f = this.f & F_CARRY | this.SZHV_INC_TABLE[this.b]
  }, 5:function() {
    this.b = this.b - 1 & 255;
    this.f = this.f & F_CARRY | this.SZHV_DEC_TABLE[this.b]
  }, 6:function() {
    this.b = this.readMem(this.pc++)
  }, 7:function() {
    var carry = this.a >> 7;
    this.a = this.a << 1 & 255 | carry;
    this.f = this.f & 236 | carry
  }, 8:function() {
    var temp = this.a;
    this.a = this.a2;
    this.a2 = temp;
    temp = this.f;
    this.f = this.f2;
    this.f2 = temp
  }, 9:function() {
    var reg = this.h << 8 | this.l;
    var value = this.b << 8 | this.c;
    var result = reg + value;
    this.f = this.f & 196 | (reg ^ result ^ value) >> 8 & 16 | result >> 16 & 1;
    var value1 = result & 65535;
    this.h = value1 >> 8;
    this.l = value1 & 255
  }, 10:function() {
    this.a = this.readMem(this.b << 8 | this.c)
  }, 11:function() {
    this.c = this.c - 1 & 255;
    if(this.c == 255) {
      this.b = this.b - 1 & 255
    }
  }, 12:function() {
    this.c = this.c + 1 & 255;
    this.f = this.f & F_CARRY | this.SZHV_INC_TABLE[this.c]
  }, 13:function() {
    this.c = this.c - 1 & 255;
    this.f = this.f & F_CARRY | this.SZHV_DEC_TABLE[this.c]
  }, 14:function() {
    this.c = this.readMem(this.pc++)
  }, 15:function() {
    var carry = this.a & 1;
    this.a = this.a >> 1 | carry << 7;
    this.f = this.f & 236 | carry
  }, 16:function() {
    this.b = this.b - 1 & 255;
    if(this.b != 0) {
      var d = this.d_() + 1;
      if(d >= 128) {
        d = d - 256
      }
      this.pc += d;
      this.tstates -= 5
    }else {
      this.pc++
    }
  }, 17:function() {
    this.e = this.readMem(this.pc++);
    this.d = this.readMem(this.pc++)
  }, 18:function() {
    this.writeMem(this.d << 8 | this.e, this.a)
  }, 19:function() {
    this.e = this.e + 1 & 255;
    if(this.e == 0) {
      this.d = this.d + 1 & 255
    }
  }, 20:function() {
    this.d = this.d + 1 & 255;
    this.f = this.f & F_CARRY | this.SZHV_INC_TABLE[this.d]
  }, 21:function() {
    this.d = this.d - 1 & 255;
    this.f = this.f & F_CARRY | this.SZHV_DEC_TABLE[this.d]
  }, 22:function() {
    this.d = this.readMem(this.pc++)
  }, 23:function() {
    var carry = this.a >> 7;
    this.a = (this.a << 1 | this.f & F_CARRY) & 255;
    this.f = this.f & 236 | carry
  }, 24:function() {
    this.pc += this.readMem(this.pc) + 1
  }, 25:function() {
    var result = (this.h << 8 | this.l) + (this.d << 8 | this.e);
    this.f = this.f & 196 | ((this.h << 8 | this.l) ^ result ^ (this.d << 8 | this.e)) >> 8 & 16 | result >> 16 & 1;
    this.h = (result & 65535) >> 8;
    this.l = result & 65535 & 255
  }, 26:function() {
    this.a = this.readMem(this.d << 8 | this.e)
  }, 27:function() {
    this.e = this.e - 1 & 255;
    if(this.e == 255) {
      this.d = this.d - 1 & 255
    }
  }, 28:function() {
    this.e = this.e + 1 & 255;
    this.f = this.f & F_CARRY | this.SZHV_INC_TABLE[this.e]
  }, 29:function() {
    this.e = this.e - 1 & 255;
    this.f = this.f & F_CARRY | this.SZHV_DEC_TABLE[this.e]
  }, 30:function() {
    this.e = this.readMem(this.pc++)
  }, 31:function() {
    var carry = this.a & 1;
    this.a = (this.a >> 1 | (this.f & F_CARRY) << 7) & 255;
    this.f = this.f & 236 | carry
  }, 32:function() {
    if(!((this.f & F_ZERO) != 0)) {
      var d = this.d_() + 1;
      if(d >= 128) {
        d = d - 256
      }
      this.pc += d;
      this.tstates -= 5
    }else {
      this.pc++
    }
  }, 33:function() {
    this.l = this.readMem(this.pc++);
    this.h = this.readMem(this.pc++)
  }, 34:function() {
    var location = this.readMemWord(this.pc);
    this.writeMem(location, this.l);
    this.writeMem(++location, this.h);
    this.pc += 2
  }, 35:function() {
    this.l = this.l + 1 & 255;
    if(this.l == 0) {
      this.h = this.h + 1 & 255
    }
  }, 36:function() {
    this.h = this.h + 1 & 255;
    this.f = this.f & F_CARRY | this.SZHV_INC_TABLE[this.h]
  }, 37:function() {
    this.h = this.h - 1 & 255;
    this.f = this.f & F_CARRY | this.SZHV_DEC_TABLE[this.h]
  }, 38:function() {
    this.h = this.readMem(this.pc++)
  }, 39:function() {
    var temp = this.DAA_TABLE[this.a | (this.f & F_CARRY) << 8 | (this.f & F_NEGATIVE) << 8 | (this.f & F_HALFCARRY) << 6];
    this.a = temp & 255;
    this.f = this.f & F_NEGATIVE | temp >> 8
  }, 40:function() {
    if((this.f & F_ZERO) != 0) {
      var d = this.d_() + 1;
      if(d >= 128) {
        d = d - 256
      }
      this.pc += d;
      this.tstates -= 5
    }else {
      this.pc++
    }
  }, 41:function() {
    var result = (this.h << 8 | this.l) + (this.h << 8 | this.l);
    this.f = this.f & 196 | ((this.h << 8 | this.l) ^ result ^ (this.h << 8 | this.l)) >> 8 & 16 | result >> 16 & 1;
    this.h = (result & 65535) >> 8;
    this.l = result & 65535 & 255
  }, 42:function() {
    var location = this.readMemWord(this.pc);
    this.l = this.readMem(location);
    this.h = this.readMem(location + 1);
    this.pc += 2
  }, 43:function() {
    this.l = this.l - 1 & 255;
    if(this.l == 255) {
      this.h = this.h - 1 & 255
    }
  }, 44:function() {
    this.l = this.l + 1 & 255;
    this.f = this.f & F_CARRY | this.SZHV_INC_TABLE[this.l]
  }, 45:function() {
    this.l = this.l - 1 & 255;
    this.f = this.f & F_CARRY | this.SZHV_DEC_TABLE[this.l]
  }, 46:function() {
    this.l = this.readMem(this.pc++)
  }, 47:function() {
    this.a ^= 255;
    this.f |= F_NEGATIVE | F_HALFCARRY
  }, 48:function() {
    if(!((this.f & F_CARRY) != 0)) {
      var d = this.d_() + 1;
      if(d >= 128) {
        d = d - 256
      }
      this.pc += d;
      this.tstates -= 5
    }else {
      this.pc++
    }
  }, 49:function() {
    this.sp = this.readMemWord(this.pc);
    this.pc += 2
  }, 50:function() {
    this.writeMem(this.readMemWord(this.pc), this.a);
    this.pc += 2
  }, 51:function() {
    this.sp++
  }, 52:function() {
    this.writeMem(this.h << 8 | this.l, this.inc8(this.readMem(this.h << 8 | this.l)))
  }, 53:function() {
    var offset = this.h << 8 | this.l;
    var value = this.readMem(offset);
    value = value - 1 & 255;
    this.f = this.f & F_CARRY | this.SZHV_DEC_TABLE[value];
    this.writeMem(offset, value)
  }, 54:function() {
    this.writeMem(this.h << 8 | this.l, this.readMem(this.pc++))
  }, 55:function() {
    this.f |= F_CARRY;
    this.f &= ~F_NEGATIVE;
    this.f &= ~F_HALFCARRY
  }, 56:function() {
    if((this.f & F_CARRY) != 0) {
      var d = this.d_() + 1;
      if(d >= 128) {
        d = d - 256
      }
      this.pc += d;
      this.tstates -= 5
    }else {
      this.pc++
    }
  }, 57:function() {
    var result = (this.h << 8 | this.l) + this.sp;
    this.f = this.f & 196 | ((this.h << 8 | this.l) ^ result ^ this.sp) >> 8 & 16 | result >> 16 & 1;
    this.h = (result & 65535) >> 8;
    this.l = result & 65535 & 255
  }, 58:function() {
    this.a = this.readMem(this.readMemWord(this.pc));
    this.pc += 2
  }, 59:function() {
    this.sp--
  }, 60:function() {
    this.a = this.a + 1 & 255;
    this.f = this.f & F_CARRY | this.SZHV_INC_TABLE[this.a]
  }, 61:function() {
    this.a = this.a - 1 & 255;
    this.f = this.f & F_CARRY | this.SZHV_DEC_TABLE[this.a]
  }, 62:function() {
    this.a = this.readMem(this.pc++)
  }, 63:function() {
    if((this.f & F_CARRY) != 0) {
      this.f &= ~F_CARRY;
      this.f |= F_HALFCARRY
    }else {
      this.f |= F_CARRY;
      this.f &= ~F_HALFCARRY
    }
    this.f &= ~F_NEGATIVE
  }, 64:function() {
  }, 65:function() {
    this.b = this.c
  }, 66:function() {
    this.b = this.d
  }, 67:function() {
    this.b = this.e
  }, 68:function() {
    this.b = this.h
  }, 69:function() {
    this.b = this.l
  }, 70:function() {
    this.b = this.readMem(this.h << 8 | this.l)
  }, 71:function() {
    this.b = this.a
  }, 72:function() {
    this.c = this.b
  }, 73:function() {
  }, 74:function() {
    this.c = this.d
  }, 75:function() {
    this.c = this.e
  }, 76:function() {
    this.c = this.h
  }, 77:function() {
    this.c = this.l
  }, 78:function() {
    this.c = this.readMem(this.h << 8 | this.l)
  }, 79:function() {
    this.c = this.a
  }, 80:function() {
    this.d = this.b
  }, 81:function() {
    this.d = this.c
  }, 82:function() {
  }, 83:function() {
    this.d = this.e
  }, 84:function() {
    this.d = this.h
  }, 85:function() {
    this.d = this.l
  }, 86:function() {
    this.d = this.readMem(this.h << 8 | this.l)
  }, 87:function() {
    this.d = this.a
  }, 88:function() {
    this.e = this.b
  }, 89:function() {
    this.e = this.c
  }, 90:function() {
    this.e = this.d
  }, 91:function() {
  }, 92:function() {
    this.e = this.h
  }, 93:function() {
    this.e = this.l
  }, 94:function() {
    this.e = this.readMem(this.h << 8 | this.l)
  }, 95:function() {
    this.e = this.a
  }, 96:function() {
    this.h = this.b
  }, 97:function() {
    this.h = this.c
  }, 98:function() {
    this.h = this.d
  }, 99:function() {
    this.h = this.e
  }, 100:function() {
  }, 101:function() {
    this.h = this.l
  }, 102:function() {
    this.h = this.readMem(this.h << 8 | this.l)
  }, 103:function() {
    this.h = this.a
  }, 104:function() {
    this.l = this.b
  }, 105:function() {
    this.l = this.c
  }, 106:function() {
    this.l = this.d
  }, 107:function() {
    this.l = this.e
  }, 108:function() {
    this.l = this.h
  }, 109:function() {
  }, 110:function() {
    this.l = this.readMem(this.h << 8 | this.l)
  }, 111:function() {
    this.l = this.a
  }, 112:function() {
    this.writeMem(this.h << 8 | this.l, this.b)
  }, 113:function() {
    this.writeMem(this.h << 8 | this.l, this.c)
  }, 114:function() {
    this.writeMem(this.h << 8 | this.l, this.d)
  }, 115:function() {
    this.writeMem(this.h << 8 | this.l, this.e)
  }, 116:function() {
    this.writeMem(this.h << 8 | this.l, this.h)
  }, 117:function() {
    this.writeMem(this.h << 8 | this.l, this.l)
  }, 118:function() {
    if(HALT_SPEEDUP) {
      return function() {
        this.tstates = 0;
        this.halt = true;
        this.pc--
      }
    }else {
      return function() {
        this.halt = true;
        this.pc--
      }
    }
  }(), 119:function() {
    this.writeMem(this.h << 8 | this.l, this.a)
  }, 120:function() {
    this.a = this.b
  }, 121:function() {
    this.a = this.c
  }, 122:function() {
    this.a = this.d
  }, 123:function() {
    this.a = this.e
  }, 124:function() {
    this.a = this.h
  }, 125:function() {
    this.a = this.l
  }, 126:function() {
    this.a = this.readMem(this.h << 8 | this.l)
  }, 127:function() {
  }, 128:function() {
    var temp = this.a + this.b & 255;
    this.f = this.SZHVC_ADD_TABLE[this.a << 8 | temp];
    this.a = temp
  }, 129:function() {
    var temp = this.a + this.c & 255;
    this.f = this.SZHVC_ADD_TABLE[this.a << 8 | temp];
    this.a = temp
  }, 130:function() {
    var temp = this.a + this.d & 255;
    this.f = this.SZHVC_ADD_TABLE[this.a << 8 | temp];
    this.a = temp
  }, 131:function() {
    var temp = this.a + this.e & 255;
    this.f = this.SZHVC_ADD_TABLE[this.a << 8 | temp];
    this.a = temp
  }, 132:function() {
    var temp = this.a + this.h & 255;
    this.f = this.SZHVC_ADD_TABLE[this.a << 8 | temp];
    this.a = temp
  }, 133:function() {
    var temp = this.a + this.l & 255;
    this.f = this.SZHVC_ADD_TABLE[this.a << 8 | temp];
    this.a = temp
  }, 134:function() {
    var temp = this.a + this.readMem(this.h << 8 | this.l) & 255;
    this.f = this.SZHVC_ADD_TABLE[this.a << 8 | temp];
    this.a = temp
  }, 135:function() {
    var temp = this.a + this.a & 255;
    this.f = this.SZHVC_ADD_TABLE[this.a << 8 | temp];
    this.a = temp
  }, 136:function() {
    var carry = this.f & F_CARRY;
    var temp = this.a + this.b + carry & 255;
    this.f = this.SZHVC_ADD_TABLE[carry << 16 | this.a << 8 | temp];
    this.a = temp
  }, 137:function() {
    var carry = this.f & F_CARRY;
    var temp = this.a + this.c + carry & 255;
    this.f = this.SZHVC_ADD_TABLE[carry << 16 | this.a << 8 | temp];
    this.a = temp
  }, 138:function() {
    var carry = this.f & F_CARRY;
    var temp = this.a + this.d + carry & 255;
    this.f = this.SZHVC_ADD_TABLE[carry << 16 | this.a << 8 | temp];
    this.a = temp
  }, 139:function() {
    var carry = this.f & F_CARRY;
    var temp = this.a + this.e + carry & 255;
    this.f = this.SZHVC_ADD_TABLE[carry << 16 | this.a << 8 | temp];
    this.a = temp
  }, 140:function() {
    var carry = this.f & F_CARRY;
    var temp = this.a + this.h + carry & 255;
    this.f = this.SZHVC_ADD_TABLE[carry << 16 | this.a << 8 | temp];
    this.a = temp
  }, 141:function() {
    var carry = this.f & F_CARRY;
    var temp = this.a + this.l + carry & 255;
    this.f = this.SZHVC_ADD_TABLE[carry << 16 | this.a << 8 | temp];
    this.a = temp
  }, 142:function() {
    var carry = this.f & F_CARRY;
    var temp = this.a + this.readMem(this.h << 8 | this.l) + carry & 255;
    this.f = this.SZHVC_ADD_TABLE[carry << 16 | this.a << 8 | temp];
    this.a = temp
  }, 143:function() {
    var carry = this.f & F_CARRY;
    var temp = this.a + this.a + carry & 255;
    this.f = this.SZHVC_ADD_TABLE[carry << 16 | this.a << 8 | temp];
    this.a = temp
  }, 144:function() {
    var temp = this.a - this.b & 255;
    this.f = this.SZHVC_SUB_TABLE[this.a << 8 | temp];
    this.a = temp
  }, 145:function() {
    var temp = this.a - this.c & 255;
    this.f = this.SZHVC_SUB_TABLE[this.a << 8 | temp];
    this.a = temp
  }, 146:function() {
    var temp = this.a - this.d & 255;
    this.f = this.SZHVC_SUB_TABLE[this.a << 8 | temp];
    this.a = temp
  }, 147:function() {
    var temp = this.a - this.e & 255;
    this.f = this.SZHVC_SUB_TABLE[this.a << 8 | temp];
    this.a = temp
  }, 148:function() {
    var temp = this.a - this.h & 255;
    this.f = this.SZHVC_SUB_TABLE[this.a << 8 | temp];
    this.a = temp
  }, 149:function() {
    var temp = this.a - this.l & 255;
    this.f = this.SZHVC_SUB_TABLE[this.a << 8 | temp];
    this.a = temp
  }, 150:function() {
    var temp = this.a - this.readMem(this.h << 8 | this.l) & 255;
    this.f = this.SZHVC_SUB_TABLE[this.a << 8 | temp];
    this.a = temp
  }, 151:function() {
    var temp = this.a - this.a & 255;
    this.f = this.SZHVC_SUB_TABLE[this.a << 8 | temp];
    this.a = temp
  }, 152:function() {
    var carry = this.f & F_CARRY;
    var temp = this.a - this.b - carry & 255;
    this.f = this.SZHVC_SUB_TABLE[carry << 16 | this.a << 8 | temp];
    this.a = temp
  }, 153:function() {
    var carry = this.f & F_CARRY;
    var temp = this.a - this.c - carry & 255;
    this.f = this.SZHVC_SUB_TABLE[carry << 16 | this.a << 8 | temp];
    this.a = temp
  }, 154:function() {
    var carry = this.f & F_CARRY;
    var temp = this.a - this.d - carry & 255;
    this.f = this.SZHVC_SUB_TABLE[carry << 16 | this.a << 8 | temp];
    this.a = temp
  }, 155:function() {
    var carry = this.f & F_CARRY;
    var temp = this.a - this.e - carry & 255;
    this.f = this.SZHVC_SUB_TABLE[carry << 16 | this.a << 8 | temp];
    this.a = temp
  }, 156:function() {
    var carry = this.f & F_CARRY;
    var temp = this.a - this.h - carry & 255;
    this.f = this.SZHVC_SUB_TABLE[carry << 16 | this.a << 8 | temp];
    this.a = temp
  }, 157:function() {
    var carry = this.f & F_CARRY;
    var temp = this.a - this.l - carry & 255;
    this.f = this.SZHVC_SUB_TABLE[carry << 16 | this.a << 8 | temp];
    this.a = temp
  }, 158:function() {
    var carry = this.f & F_CARRY;
    var temp = this.a - this.readMem(this.h << 8 | this.l) - carry & 255;
    this.f = this.SZHVC_SUB_TABLE[carry << 16 | this.a << 8 | temp];
    this.a = temp
  }, 159:function() {
    var carry = this.f & F_CARRY;
    var temp = this.a - this.a - carry & 255;
    this.f = this.SZHVC_SUB_TABLE[carry << 16 | this.a << 8 | temp];
    this.a = temp
  }, 160:function() {
    this.f = this.SZP_TABLE[this.a &= this.b] | F_HALFCARRY
  }, 161:function() {
    this.f = this.SZP_TABLE[this.a &= this.c] | F_HALFCARRY
  }, 162:function() {
    this.f = this.SZP_TABLE[this.a &= this.d] | F_HALFCARRY
  }, 163:function() {
    this.f = this.SZP_TABLE[this.a &= this.e] | F_HALFCARRY
  }, 164:function() {
    this.f = this.SZP_TABLE[this.a &= this.h] | F_HALFCARRY
  }, 165:function() {
    this.f = this.SZP_TABLE[this.a &= this.l] | F_HALFCARRY
  }, 166:function() {
    this.f = this.SZP_TABLE[this.a &= this.readMem(this.h << 8 | this.l)] | F_HALFCARRY
  }, 167:function() {
    this.f = this.SZP_TABLE[this.a] | F_HALFCARRY
  }, 168:function() {
    this.f = this.SZP_TABLE[this.a ^= this.b]
  }, 169:function() {
    this.f = this.SZP_TABLE[this.a ^= this.c]
  }, 170:function() {
    this.f = this.SZP_TABLE[this.a ^= this.d]
  }, 171:function() {
    this.f = this.SZP_TABLE[this.a ^= this.e]
  }, 172:function() {
    this.f = this.SZP_TABLE[this.a ^= this.h]
  }, 173:function() {
    this.f = this.SZP_TABLE[this.a ^= this.l]
  }, 174:function() {
    this.f = this.SZP_TABLE[this.a ^= this.readMem(this.h << 8 | this.l)]
  }, 175:function() {
    this.f = this.SZP_TABLE[this.a = 0]
  }, 176:function() {
    this.f = this.SZP_TABLE[this.a |= this.b]
  }, 177:function() {
    this.f = this.SZP_TABLE[this.a |= this.c]
  }, 178:function() {
    this.f = this.SZP_TABLE[this.a |= this.d]
  }, 179:function() {
    this.f = this.SZP_TABLE[this.a |= this.e]
  }, 180:function() {
    this.f = this.SZP_TABLE[this.a |= this.h]
  }, 181:function() {
    this.f = this.SZP_TABLE[this.a |= this.l]
  }, 182:function() {
    this.f = this.SZP_TABLE[this.a |= this.readMem(this.h << 8 | this.l)]
  }, 183:function() {
    this.f = this.SZP_TABLE[this.a]
  }, 184:function() {
    this.f = this.SZHVC_SUB_TABLE[this.a << 8 | this.a - this.b & 255]
  }, 185:function() {
    this.f = this.SZHVC_SUB_TABLE[this.a << 8 | this.a - this.c & 255]
  }, 186:function() {
    this.f = this.SZHVC_SUB_TABLE[this.a << 8 | this.a - this.d & 255]
  }, 187:function() {
    this.f = this.SZHVC_SUB_TABLE[this.a << 8 | this.a - this.e & 255]
  }, 188:function() {
    this.f = this.SZHVC_SUB_TABLE[this.a << 8 | this.a - this.h & 255]
  }, 189:function() {
    this.f = this.SZHVC_SUB_TABLE[this.a << 8 | this.a - this.l & 255]
  }, 190:function() {
    this.f = this.SZHVC_SUB_TABLE[this.a << 8 | this.a - this.readMem(this.h << 8 | this.l) & 255]
  }, 191:function() {
    this.f = this.SZHVC_SUB_TABLE[this.a << 8 | this.a - this.a & 255]
  }, 192:function() {
    if((this.f & F_ZERO) == 0) {
      this.pc = this.readMemWord(this.sp);
      this.sp += 2;
      this.tstates -= 6
    }
  }, 193:function() {
    this.setBC(this.readMemWord(this.sp));
    this.sp += 2
  }, 194:function() {
    if((this.f & F_ZERO) == 0) {
      this.pc = this.readMemWord(this.pc)
    }else {
      this.pc += 2
    }
  }, 195:function() {
    this.pc = this.readMemWord(this.pc)
  }, 196:function() {
    if((this.f & F_ZERO) == 0) {
      this.writeMem(--this.sp, this.pc + 2 >> 8);
      this.writeMem(--this.sp, this.pc + 2 & 255);
      this.pc = this.readMemWord(this.pc);
      this.tstates -= 7
    }else {
      this.pc += 2
    }
  }, 197:function() {
    this.writeMem(--this.sp, this.b);
    this.writeMem(--this.sp, this.c)
  }, 198:function() {
    var temp = this.a + this.readMem(this.pc++) & 255;
    this.f = this.SZHVC_ADD_TABLE[this.a << 8 | temp];
    this.a = temp
  }, 199:function() {
    this.writeMem(--this.sp, this.pc >> 8);
    this.writeMem(--this.sp, this.pc & 255);
    this.pc = 0
  }, 200:function() {
    if((this.f & F_ZERO) != 0) {
      this.pc = this.readMemWord(this.sp);
      this.sp += 2;
      this.tstates -= 6
    }
  }, 201:function() {
    this.pc = this.readMemWord(this.sp);
    this.sp += 2
  }, 202:function() {
    if((this.f & F_ZERO) != 0) {
      this.pc = this.readMemWord(this.pc)
    }else {
      this.pc += 2
    }
  }, 203:function() {
    this.doCB(this.readMem(this.pc++))
  }, 204:function() {
    if((this.f & F_ZERO) != 0) {
      this.writeMem(--this.sp, this.pc + 2 >> 8);
      this.writeMem(--this.sp, this.pc + 2 & 255);
      this.pc = this.readMemWord(this.pc);
      this.tstates -= 7
    }else {
      this.pc += 2
    }
  }, 205:function() {
    this.writeMem(--this.sp, this.pc + 2 >> 8);
    this.writeMem(--this.sp, this.pc + 2 & 255);
    this.pc = this.readMemWord(this.pc)
  }, 206:function() {
    var carry = this.f & F_CARRY;
    var temp = this.a + this.readMem(this.pc++) + carry & 255;
    this.f = this.SZHVC_ADD_TABLE[carry << 16 | this.a << 8 | temp];
    this.a = temp
  }, 207:function() {
    this.writeMem(--this.sp, this.pc >> 8);
    this.writeMem(--this.sp, this.pc & 255);
    this.pc = 8
  }, 208:function() {
    if((this.f & F_CARRY) == 0) {
      this.pc = this.readMemWord(this.sp);
      this.sp += 2;
      this.tstates -= 6
    }
  }, 209:function() {
    var value = this.readMemWord(this.sp);
    this.d = value >> 8;
    this.e = value & 255;
    this.sp += 2
  }, 210:function() {
    if((this.f & F_CARRY) == 0) {
      this.pc = this.readMemWord(this.pc)
    }else {
      this.pc += 2
    }
  }, 211:function() {
    this.port.out(this.readMem(this.pc++), this.a)
  }, 212:function() {
    if((this.f & F_CARRY) == 0) {
      this.writeMem(--this.sp, this.pc + 2 >> 8);
      this.writeMem(--this.sp, this.pc + 2 & 255);
      this.pc = this.readMemWord(this.pc);
      this.tstates -= 7
    }else {
      this.pc += 2
    }
  }, 213:function() {
    this.writeMem(--this.sp, this.d);
    this.writeMem(--this.sp, this.e)
  }, 214:function() {
    var temp = this.a - this.readMem(this.pc++) & 255;
    this.f = this.SZHVC_SUB_TABLE[this.a << 8 | temp];
    this.a = temp
  }, 215:function() {
    this.writeMem(--this.sp, this.pc >> 8);
    this.writeMem(--this.sp, this.pc & 255);
    this.pc = 16
  }, 216:function() {
    if((this.f & F_CARRY) != 0) {
      this.pc = this.readMemWord(this.sp);
      this.sp += 2;
      this.tstates -= 6
    }
  }, 217:function() {
    var temp = this.b;
    this.b = this.b2;
    this.b2 = temp;
    temp = this.c;
    this.c = this.c2;
    this.c2 = temp;
    temp = this.d;
    this.d = this.d2;
    this.d2 = temp;
    temp = this.e;
    this.e = this.e2;
    this.e2 = temp;
    temp = this.h;
    this.h = this.h2;
    this.h2 = temp;
    temp = this.l;
    this.l = this.l2;
    this.l2 = temp
  }, 218:function() {
    if((this.f & F_CARRY) != 0) {
      this.pc = this.readMemWord(this.pc)
    }else {
      this.pc += 2
    }
  }, 219:function() {
    this.a = this.port.in_(this.readMem(this.pc++))
  }, 220:function() {
    if((this.f & F_CARRY) != 0) {
      this.writeMem(--this.sp, this.pc + 2 >> 8);
      this.writeMem(--this.sp, this.pc + 2 & 255);
      this.pc = this.readMemWord(this.pc);
      this.tstates -= 7
    }else {
      this.pc += 2
    }
  }, 221:function() {
    this.doIndexOpIX(this.readMem(this.pc++))
  }, 222:function() {
    var carry = this.f & F_CARRY;
    var temp = this.a - this.readMem(this.pc++) - carry & 255;
    this.f = this.SZHVC_SUB_TABLE[carry << 16 | this.a << 8 | temp];
    this.a = temp
  }, 223:function() {
    this.writeMem(--this.sp, this.pc >> 8);
    this.writeMem(--this.sp, this.pc & 255);
    this.pc = 24
  }, 224:function() {
    if((this.f & F_PARITY) == 0) {
      this.pc = this.readMemWord(this.sp);
      this.sp += 2;
      this.tstates -= 6
    }
  }, 225:function() {
    var value = this.readMemWord(this.sp);
    this.h = value >> 8;
    this.l = value & 255;
    this.sp += 2
  }, 226:function() {
    if((this.f & F_PARITY) == 0) {
      this.pc = this.readMemWord(this.pc)
    }else {
      this.pc += 2
    }
  }, 227:function() {
    var temp = this.h;
    this.h = this.readMem(this.sp + 1);
    this.writeMem(this.sp + 1, temp);
    temp = this.l;
    this.l = this.readMem(this.sp);
    this.writeMem(this.sp, temp)
  }, 228:function() {
    if((this.f & F_PARITY) == 0) {
      this.writeMem(--this.sp, this.pc + 2 >> 8);
      this.writeMem(--this.sp, this.pc + 2 & 255);
      this.pc = this.readMemWord(this.pc);
      this.tstates -= 7
    }else {
      this.pc += 2
    }
  }, 229:function() {
    this.writeMem(--this.sp, this.h);
    this.writeMem(--this.sp, this.l)
  }, 230:function() {
    this.f = this.SZP_TABLE[this.a &= this.readMem(this.pc++)] | F_HALFCARRY
  }, 231:function() {
    this.writeMem(--this.sp, this.pc >> 8);
    this.writeMem(--this.sp, this.pc & 255);
    this.pc = 32
  }, 232:function() {
    if((this.f & F_PARITY) != 0) {
      this.pc = this.readMemWord(this.sp);
      this.sp += 2;
      this.tstates -= 6
    }
  }, 233:function() {
    this.pc = this.h << 8 | this.l
  }, 234:function() {
    if((this.f & F_PARITY) != 0) {
      this.pc = this.readMemWord(this.pc)
    }else {
      this.pc += 2
    }
  }, 235:function() {
    var temp = this.d;
    this.d = this.h;
    this.h = temp;
    temp = this.e;
    this.e = this.l;
    this.l = temp
  }, 236:function() {
    if((this.f & F_PARITY) != 0) {
      this.writeMem(--this.sp, this.pc + 2 >> 8);
      this.writeMem(--this.sp, this.pc + 2 & 255);
      this.pc = this.readMemWord(this.pc);
      this.tstates -= 7
    }else {
      this.pc += 2
    }
  }, 237:function() {
    this.doED(this.readMem(this.pc))
  }, 238:function() {
    this.f = this.SZP_TABLE[this.a ^= this.readMem(this.pc++)]
  }, 239:function() {
    this.writeMem(--this.sp, this.pc >> 8);
    this.writeMem(--this.sp, this.pc & 255);
    this.pc = 40
  }, 240:function() {
    if((this.f & F_SIGN) == 0) {
      this.pc = this.readMemWord(this.sp);
      this.sp += 2;
      this.tstates -= 6
    }
  }, 241:function() {
    this.f = this.readMem(this.sp++);
    this.a = this.readMem(this.sp++)
  }, 242:function() {
    if((this.f & F_SIGN) == 0) {
      this.pc = this.readMemWord(this.pc)
    }else {
      this.pc += 2
    }
  }, 243:function() {
    this.iff1 = this.iff2 = false;
    this.EI_inst = true
  }, 244:function() {
    if((this.f & F_SIGN) == 0) {
      this.writeMem(--this.sp, this.pc + 2 >> 8);
      this.writeMem(--this.sp, this.pc + 2 & 255);
      this.pc = this.readMemWord(this.pc);
      this.tstates -= 7
    }else {
      this.pc += 2
    }
  }, 245:function() {
    this.writeMem(--this.sp, this.a);
    this.writeMem(--this.sp, this.f)
  }, 246:function() {
    this.f = this.SZP_TABLE[this.a |= this.readMem(this.pc++)]
  }, 247:function() {
    this.writeMem(--this.sp, this.pc >> 8);
    this.writeMem(--this.sp, this.pc & 255);
    this.pc = 48
  }, 248:function() {
    if((this.f & F_SIGN) != 0) {
      this.pc = this.readMemWord(this.sp);
      this.sp += 2;
      this.tstates -= 6
    }
  }, 249:function() {
    this.sp = this.h << 8 | this.l
  }, 250:function() {
    if((this.f & F_SIGN) != 0) {
      this.pc = this.readMemWord(this.pc)
    }else {
      this.pc += 2
    }
  }, 251:function() {
    this.iff1 = this.iff2 = true;
    this.EI_inst = true
  }, 252:function() {
    if((this.f & F_SIGN) != 0) {
      this.writeMem(--this.sp, this.pc + 2 >> 8);
      this.writeMem(--this.sp, this.pc + 2 & 255);
      this.pc = this.readMemWord(this.pc);
      this.tstates -= 7
    }else {
      this.pc += 2
    }
  }, 253:function() {
    this.doIndexOpIY(this.readMem(this.pc++))
  }, 254:function() {
    this.f = this.SZHVC_SUB_TABLE[this.a << 8 | this.a - this.readMem(this.pc++) & 255]
  }, 255:function() {
    this.writeMem(--this.sp, this.pc >> 8);
    this.writeMem(--this.sp, this.pc & 255);
    this.pc = 56
  }};
  return opcodeToInst[opcode].toString()
}};
function getOpCode(opcode) {
  switch(opcode) {
    case 0:
      return"NOP";
      break;
    case 1:
      return"LD BC,nn";
      break;
    case 2:
      return"LD (BC),A";
      break;
    case 3:
      return"INC BC";
      break;
    case 4:
      return"INC B";
      break;
    case 5:
      return"DEC B";
      break;
    case 6:
      return"LD B,n";
      break;
    case 7:
      return"RLCA";
      break;
    case 8:
      return"EX AF AF'";
      break;
    case 9:
      return"ADD HL,BC";
      break;
    case 10:
      return"LD A,(BC)";
      break;
    case 11:
      return"DEC BC";
      break;
    case 12:
      return"INC C";
      break;
    case 13:
      return"DEC C";
      break;
    case 14:
      return"LD C,n";
      break;
    case 15:
      return"RRCA";
      break;
    case 16:
      return"DJNZ (PC+e)";
      break;
    case 17:
      return"LD DE,nn";
      break;
    case 18:
      return"LD (DE), A";
      break;
    case 19:
      return"INC DE";
      break;
    case 20:
      return"INC D";
      break;
    case 21:
      return"DEC D";
      break;
    case 22:
      return"LD D,n";
      break;
    case 23:
      return"RLA";
      break;
    case 24:
      return"JR (PC+e)";
      break;
    case 25:
      return"ADD HL,DE";
      break;
    case 26:
      return"LD A,(DE)";
      break;
    case 27:
      return"DEC DE";
      break;
    case 28:
      return"INC E";
      break;
    case 29:
      return"DEC E";
      break;
    case 30:
      return"LD E,N";
      break;
    case 31:
      return"RRA";
      break;
    case 32:
      return"JR NZ,(PC+e)";
      break;
    case 33:
      return"LD HL,nn";
      break;
    case 34:
      return"LD (nn),HL";
      break;
    case 35:
      return"INC HL";
      break;
    case 36:
      return"INC H";
      break;
    case 37:
      return"DEC H";
      break;
    case 38:
      return"LD H,n";
      break;
    case 39:
      return"DAA";
      break;
    case 40:
      return"JR Z,(PC+e)";
      break;
    case 41:
      return"ADD HL,HL";
      break;
    case 42:
      return"LD HL,(nn)";
      break;
    case 43:
      return"DEC HL";
      break;
    case 44:
      return"INC L";
      break;
    case 45:
      return"DEC L";
      break;
    case 46:
      return"LD L,n";
      break;
    case 47:
      return"CPL";
      break;
    case 48:
      return"JR NC,(PC+e)";
      break;
    case 49:
      return"LD SP,nn";
      break;
    case 50:
      return"LD (nn),A";
      break;
    case 51:
      return"INC SP";
      break;
    case 52:
      return"INC (HL)";
      break;
    case 53:
      return"DEC (HL)";
      break;
    case 54:
      return"LD (HL),n";
      break;
    case 55:
      return"SCF";
      break;
    case 56:
      return"JR C,(PC+e)";
      break;
    case 57:
      return"ADD HL,SP";
      break;
    case 58:
      return"LD A,(nn)";
      break;
    case 59:
      return"DEC SP";
      break;
    case 60:
      return"INC A";
      break;
    case 61:
      return"DEC A";
      break;
    case 62:
      return"LD A,n";
      break;
    case 63:
      return"CCF";
      break;
    case 64:
      return"LD B,B";
      break;
    case 65:
      return"LD B,C";
      break;
    case 66:
      return"LD B,D";
      break;
    case 67:
      return"LD B,E";
      break;
    case 68:
      return"LD B,H";
      break;
    case 69:
      return"LD B,L";
      break;
    case 70:
      return"LD B,(HL)";
      break;
    case 71:
      return"LD B,A";
      break;
    case 72:
      return"LD C,B";
      break;
    case 73:
      return"LD C,C";
      break;
    case 74:
      return"LD C,D";
      break;
    case 75:
      return"LD C,E";
      break;
    case 76:
      return"LD C,H";
      break;
    case 77:
      return"LD C,L";
      break;
    case 78:
      return"LD C,(HL)";
      break;
    case 79:
      return"LD C,A";
      break;
    case 80:
      return"LD D,B";
      break;
    case 81:
      return"LD D,C";
      break;
    case 82:
      return"LD D,D";
      break;
    case 83:
      return"LD D,E";
      break;
    case 84:
      return"LD D,H";
      break;
    case 85:
      return"LD D,L";
      break;
    case 86:
      return"LD D,(HL)";
      break;
    case 87:
      return"LD D,A";
      break;
    case 88:
      return"LD E,B";
      break;
    case 89:
      return"LD E,C";
      break;
    case 90:
      return"LD E,D";
      break;
    case 91:
      return"LD E,E";
      break;
    case 92:
      return"LD E,H";
      break;
    case 93:
      return"LD E,L";
      break;
    case 94:
      return"LD E,(HL)";
      break;
    case 95:
      return"LD E,A";
      break;
    case 96:
      return"LD H,B";
      break;
    case 97:
      return"LD H,C";
      break;
    case 98:
      return"LD H,D";
      break;
    case 99:
      return"LD H,E";
      break;
    case 100:
      return"LD H,H";
      break;
    case 101:
      return"LD H,L";
      break;
    case 102:
      return"LD H,(HL)";
      break;
    case 103:
      return"LD H,A";
      break;
    case 104:
      return"LD L,B";
      break;
    case 105:
      return"LD L,C";
      break;
    case 106:
      return"LD L,D";
      break;
    case 107:
      return"LD L,E";
      break;
    case 108:
      return"LD L,H";
      break;
    case 109:
      return"LD L,L";
      break;
    case 110:
      return"LD L,(HL)";
      break;
    case 111:
      return"LD L,A";
      break;
    case 112:
      return"LD (HL),B";
      break;
    case 113:
      return"LD (HL),C";
      break;
    case 114:
      return"LD (HL),D";
      break;
    case 115:
      return"LD (HL),E";
      break;
    case 116:
      return"LD (HL),H";
      break;
    case 117:
      return"LD (HL),L";
      break;
    case 118:
      return"HALT";
      break;
    case 119:
      return"LD (HL),A";
      break;
    case 120:
      return"LD A,B";
      break;
    case 121:
      return"LD A,C";
      break;
    case 122:
      return"LD A,D";
      break;
    case 123:
      return"LD A,E";
      break;
    case 124:
      return"LD A,H";
      break;
    case 125:
      return"LD A,L";
      break;
    case 126:
      return"LD A,(HL)";
      break;
    case 127:
      return"LD A,A";
      break;
    case 128:
      return"ADD A,B";
      break;
    case 129:
      return"ADD A,C";
      break;
    case 130:
      return"ADD A,D";
      break;
    case 131:
      return"ADD A,E";
      break;
    case 132:
      return"ADD A,H";
      break;
    case 133:
      return"ADD A,L";
      break;
    case 134:
      return"ADD A,(HL)";
      break;
    case 135:
      return"ADD A,A";
      break;
    case 136:
      return"ADC A,B";
      break;
    case 137:
      return"ADC A,C";
      break;
    case 138:
      return"ADC A,D";
      break;
    case 139:
      return"ADC A,E";
      break;
    case 140:
      return"ADC A,H";
      break;
    case 141:
      return"ADC A,L";
      break;
    case 142:
      return"ADC A,(HL)";
      break;
    case 143:
      return"ADC A,A";
      break;
    case 144:
      return"SUB A,B";
      break;
    case 145:
      return"SUB A,C";
      break;
    case 146:
      return"SUB A,D";
      break;
    case 147:
      return"SUB A,E";
      break;
    case 148:
      return"SUB A,H";
      break;
    case 149:
      return"SUB A,L";
      break;
    case 150:
      return"SUB A,(HL)";
      break;
    case 151:
      return"SUB A,A";
      break;
    case 152:
      return"SBC A,B";
      break;
    case 153:
      return"SBC A,C";
      break;
    case 154:
      return"SBC A,D";
      break;
    case 155:
      return"SBC A,E";
      break;
    case 156:
      return"SBC A,H";
      break;
    case 157:
      return"SBC A,L";
      break;
    case 158:
      return"SBC A,(HL)";
      break;
    case 159:
      return"SBC A,A";
      break;
    case 160:
      return"AND A,B";
      break;
    case 161:
      return"AND A,C";
      break;
    case 162:
      return"AND A,D";
      break;
    case 163:
      return"AND A,E";
      break;
    case 164:
      return"AND A,H";
      break;
    case 165:
      return"AND A,L";
      break;
    case 166:
      return"AND A,(HL)";
      break;
    case 167:
      return"AND A,A";
      break;
    case 168:
      return"XOR A,B";
      break;
    case 169:
      return"XOR A,C";
      break;
    case 170:
      return"XOR A,D";
      break;
    case 171:
      return"XOR A,E";
      break;
    case 172:
      return"XOR A,H";
      break;
    case 173:
      return"XOR A,L";
      break;
    case 174:
      return"XOR A,(HL)";
      break;
    case 175:
      return"XOR A,A (=0)";
      break;
    case 176:
      return"OR A,B";
      break;
    case 177:
      return"OR A,C";
      break;
    case 178:
      return"OR A,D";
      break;
    case 179:
      return"OR A,E";
      break;
    case 180:
      return"OR A,H";
      break;
    case 181:
      return"OR A,L";
      break;
    case 182:
      return"OR A,(HL)";
      break;
    case 183:
      return"OR A,A";
      break;
    case 184:
      return"CP A,B";
      break;
    case 185:
      return"CP A,C";
      break;
    case 186:
      return"CP A,D";
      break;
    case 187:
      return"CP A,E";
      break;
    case 188:
      return"CP A,H";
      break;
    case 189:
      return"CP A,L";
      break;
    case 190:
      return"CP A,(HL)";
      break;
    case 191:
      return"CP A,A";
      break;
    case 192:
      return"RET NZ";
      break;
    case 193:
      return"POP BC";
      break;
    case 194:
      return"JP NZ,(nn)";
      break;
    case 195:
      return"JP (nn)";
      break;
    case 196:
      return"CALL NZ (nn)";
      break;
    case 197:
      return"PUSH BC";
      break;
    case 198:
      return"ADD A,n";
      break;
    case 199:
      return"RST 00H";
      break;
    case 200:
      return"RET Z";
      break;
    case 201:
      return"RET";
      break;
    case 202:
      return"JP Z,(nn)";
      break;
    case 203:
      return"CB Opcode";
      break;
    case 204:
      return"CALL Z (nn)";
      break;
    case 205:
      return"CALL (nn)";
      break;
    case 206:
      return"ADC A,n";
      break;
    case 207:
      return"RST 08H";
      break;
    case 208:
      return"RET NC";
      break;
    case 209:
      return"POP DE";
      break;
    case 210:
      return"JP NC,(nn)";
      break;
    case 211:
      return"OUT (n),A";
      break;
    case 212:
      return"CALL NC (nn)";
      break;
    case 213:
      return"PUSH DE";
      break;
    case 214:
      return"SUB n";
      break;
    case 215:
      return"RST 10H";
      break;
    case 216:
      return"RET C";
      break;
    case 217:
      return"EXX";
      break;
    case 218:
      return"JP C,(nn)";
      break;
    case 219:
      return"IN A,(n)";
      break;
    case 220:
      return"CALL C (nn)";
      break;
    case 221:
      return"DD Opcode";
      break;
    case 222:
      return"SBC A,n";
      break;
    case 223:
      return"RST 18H";
      break;
    case 224:
      return"RET PO";
      break;
    case 225:
      return"POP HL";
      break;
    case 226:
      return"JP PO,(nn)";
      break;
    case 227:
      return"EX (SP),HL";
      break;
    case 228:
      return"CALL PO (nn)";
      break;
    case 229:
      return"PUSH HL";
      break;
    case 230:
      return"AND (n)";
      break;
    case 231:
      return"RST 20H";
      break;
    case 232:
      return"RET PE";
      break;
    case 233:
      return"JP (HL)";
      break;
    case 234:
      return"JP PE,(nn)";
      break;
    case 235:
      return"EX DE,HL";
      break;
    case 236:
      return"CALL PE (nn)";
      break;
    case 237:
      return"ED Opcode";
      break;
    case 238:
      return"XOR n";
      break;
    case 239:
      return"RST 28H";
      break;
    case 240:
      return"RET P";
      break;
    case 241:
      return"POP AF";
      break;
    case 242:
      return"JP P,(nn)";
      break;
    case 243:
      return"DI";
      break;
    case 244:
      return"CALL P (nn)";
      break;
    case 245:
      return"PUSH AF";
      break;
    case 246:
      return"OR n";
      break;
    case 247:
      return"RST 30H";
      break;
    case 248:
      return"RET M";
      break;
    case 249:
      return"LD SP,HL";
      break;
    case 250:
      return"JP M,(nn)";
      break;
    case 251:
      return"EI";
      break;
    case 252:
      return"CALL M (nn)";
      break;
    case 253:
      return"FD Opcode";
      break;
    case 254:
      return"CP n";
      break;
    case 255:
      return"RST 38H";
      break
  }
  return"Unknown Opcode"
}
;var HALT_SPEEDUP = true;
var F_CARRY = 1;
var F_NEGATIVE = 2;
var F_PARITY = 4;
var F_OVERFLOW = 4;
var F_BIT3 = 8;
var F_HALFCARRY = 16;
var F_BIT5 = 32;
var F_ZERO = 64;
var F_SIGN = 128;
var BIT_0 = 1;
var BIT_1 = 2;
var BIT_2 = 4;
var BIT_3 = 8;
var BIT_4 = 16;
var BIT_5 = 32;
var BIT_6 = 64;
var BIT_7 = 128;
var OP_STATES = [4, 10, 7, 6, 4, 4, 7, 4, 4, 11, 7, 6, 4, 4, 7, 4, 8, 10, 7, 6, 4, 4, 7, 4, 12, 11, 7, 6, 4, 4, 7, 4, 7, 10, 16, 6, 4, 4, 7, 4, 7, 11, 16, 6, 4, 4, 7, 4, 7, 10, 13, 6, 11, 11, 10, 4, 7, 11, 13, 6, 4, 4, 7, 4, 4, 4, 4, 4, 4, 4, 7, 4, 4, 4, 4, 4, 4, 4, 7, 4, 4, 4, 4, 4, 4, 4, 7, 4, 4, 4, 4, 4, 4, 4, 7, 4, 4, 4, 4, 4, 4, 4, 7, 4, 4, 4, 4, 4, 4, 4, 7, 4, 7, 7, 7, 7, 7, 7, 4, 7, 4, 4, 4, 4, 4, 4, 7, 4, 4, 4, 4, 4, 4, 4, 7, 4, 4, 4, 4, 4, 4, 4, 7, 4, 4, 4, 4, 4, 4, 4, 7, 4, 4, 4, 4, 4, 
4, 4, 7, 4, 4, 4, 4, 4, 4, 4, 7, 4, 4, 4, 4, 4, 4, 4, 7, 4, 4, 4, 4, 4, 4, 4, 7, 4, 4, 4, 4, 4, 4, 4, 7, 4, 5, 10, 10, 10, 10, 11, 7, 11, 5, 10, 10, 0, 10, 17, 7, 11, 5, 10, 10, 11, 10, 11, 7, 11, 5, 4, 10, 11, 10, 0, 7, 11, 5, 10, 10, 19, 10, 11, 7, 11, 5, 4, 10, 4, 10, 0, 7, 11, 5, 10, 10, 4, 10, 11, 7, 11, 5, 6, 10, 4, 10, 0, 7, 11];
var OP_CB_STATES = [8, 8, 8, 8, 8, 8, 15, 8, 8, 8, 8, 8, 8, 8, 15, 8, 8, 8, 8, 8, 8, 8, 15, 8, 8, 8, 8, 8, 8, 8, 15, 8, 8, 8, 8, 8, 8, 8, 15, 8, 8, 8, 8, 8, 8, 8, 15, 8, 8, 8, 8, 8, 8, 8, 15, 8, 8, 8, 8, 8, 8, 8, 15, 8, 8, 8, 8, 8, 8, 8, 12, 8, 8, 8, 8, 8, 8, 8, 12, 8, 8, 8, 8, 8, 8, 8, 12, 8, 8, 8, 8, 8, 8, 8, 12, 8, 8, 8, 8, 8, 8, 8, 12, 8, 8, 8, 8, 8, 8, 8, 12, 8, 8, 8, 8, 8, 8, 8, 12, 8, 8, 8, 8, 8, 8, 8, 12, 8, 8, 8, 8, 8, 8, 8, 15, 8, 8, 8, 8, 8, 8, 8, 15, 8, 8, 8, 8, 8, 8, 8, 15, 8, 8, 8, 
8, 8, 8, 8, 15, 8, 8, 8, 8, 8, 8, 8, 15, 8, 8, 8, 8, 8, 8, 8, 15, 8, 8, 8, 8, 8, 8, 8, 15, 8, 8, 8, 8, 8, 8, 8, 15, 8, 8, 8, 8, 8, 8, 8, 15, 8, 8, 8, 8, 8, 8, 8, 15, 8, 8, 8, 8, 8, 8, 8, 15, 8, 8, 8, 8, 8, 8, 8, 15, 8, 8, 8, 8, 8, 8, 8, 15, 8, 8, 8, 8, 8, 8, 8, 15, 8, 8, 8, 8, 8, 8, 8, 15, 8, 8, 8, 8, 8, 8, 8, 15, 8];
var OP_DD_STATES = [4, 4, 4, 4, 4, 4, 4, 4, 4, 15, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 15, 4, 4, 4, 4, 4, 4, 4, 14, 20, 10, 8, 8, 11, 4, 4, 15, 20, 10, 8, 8, 11, 4, 4, 4, 4, 4, 23, 23, 19, 4, 4, 15, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 8, 8, 19, 4, 4, 4, 4, 4, 8, 8, 19, 4, 4, 4, 4, 4, 8, 8, 19, 4, 4, 4, 4, 4, 8, 8, 19, 4, 8, 8, 8, 8, 8, 8, 19, 8, 8, 8, 8, 8, 8, 8, 19, 8, 19, 19, 19, 19, 19, 19, 4, 19, 4, 4, 4, 4, 8, 8, 19, 4, 4, 4, 4, 4, 8, 8, 19, 4, 4, 4, 4, 4, 8, 8, 19, 4, 4, 4, 4, 4, 8, 8, 19, 
4, 4, 4, 4, 4, 8, 8, 19, 4, 4, 4, 4, 4, 8, 8, 19, 4, 4, 4, 4, 4, 8, 8, 19, 4, 4, 4, 4, 4, 8, 8, 19, 4, 4, 4, 4, 4, 8, 8, 19, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 0, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 14, 4, 23, 4, 15, 4, 4, 4, 8, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 10, 4, 4, 4, 4, 4, 4];
var OP_INDEX_CB_STATES = [0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, 20, 0, 0, 0, 0, 0, 0, 0, 20, 0, 0, 0, 0, 0, 0, 0, 20, 0, 0, 0, 0, 0, 0, 0, 20, 0, 0, 0, 0, 0, 0, 0, 20, 0, 0, 0, 0, 0, 0, 0, 20, 0, 0, 0, 0, 0, 0, 0, 20, 0, 0, 0, 0, 0, 0, 0, 20, 0, 0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, 23, 0, 
0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, 23, 0];
var OP_ED_STATES = [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 12, 12, 15, 20, 8, 14, 8, 9, 12, 12, 15, 20, 8, 14, 8, 9, 12, 12, 15, 20, 8, 14, 8, 9, 12, 12, 15, 20, 8, 14, 8, 9, 12, 12, 15, 20, 8, 14, 8, 18, 12, 12, 15, 20, 8, 14, 8, 18, 8, 12, 15, 20, 8, 14, 8, 8, 12, 12, 15, 20, 8, 14, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 
8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 16, 16, 16, 16, 8, 8, 8, 8, 16, 16, 16, 16, 8, 8, 8, 8, 16, 16, 16, 16, 8, 8, 8, 8, 16, 16, 16, 16, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8];
JSSMS.Z80 = function(sms) {
  this.main = sms;
  this.port = sms.ports;
  this.pc = 0;
  this.sp = 0;
  this.im = 0;
  this.iff1 = false;
  this.iff2 = false;
  this.halt = false;
  this.EI_inst = false;
  this.interruptLine = false;
  this.interruptVector = 0;
  this.a = 0;
  this.a2 = 0;
  this.b = 0;
  this.c = 0;
  this.b2 = 0;
  this.c2 = 0;
  this.d = 0;
  this.e = 0;
  this.d2 = 0;
  this.e2 = 0;
  this.h = 0;
  this.l = 0;
  this.h2 = 0;
  this.l2 = 0;
  this.ixL = 0;
  this.ixH = 0;
  this.iyL = 0;
  this.iyH = 0;
  this.r = 0;
  this.i = 0;
  this.f = 0;
  this.f2 = 0;
  this.totalCycles = 0;
  this.tstates = 0;
  this.hitCounts = [];
  this.blocks = Object.create(null);
  this.entryPC = 0;
  this.prevOpcode = 0;
  this.blockInstructions = [];
  this.opcodeInstructions = new Array(255);
  this.rom = [];
  this.ram = new Array(8);
  this.sram = null;
  this.useSRAM = false;
  this.frameReg = new Array(4);
  this.number_of_pages = 0;
  this.memWriteMap = new Array(65);
  this.memReadMap = new Array(65);
  this.DAA_TABLE = new Array(2048);
  this.SZ_TABLE = new Array(256);
  this.SZP_TABLE = new Array(256);
  this.SZHV_INC_TABLE = new Array(256);
  this.SZHV_DEC_TABLE = new Array(256);
  this.SZHVC_ADD_TABLE = new Array(2 * 256 * 256);
  this.SZHVC_SUB_TABLE = new Array(2 * 256 * 256);
  this.SZ_BIT_TABLE = new Array(256);
  this.generateFlagTables();
  this.generateDAATable();
  this.generateMemory();
  this.writeMem = JSSMS.Utils.writeMem.bind(this, this);
  this.readMem = JSSMS.Utils.readMem.bind(this, this.memReadMap);
  this.readMemWord = JSSMS.Utils.readMemWord.bind(this, this.memReadMap);
  for(var method in JSSMS.Z80DynaRec.prototype) {
    this[method] = JSSMS.Z80DynaRec.prototype[method]
  }
  this.init()
};
JSSMS.Z80.prototype = {reset:function() {
  this.a = this.a2 = 0;
  this.b = this.c = this.b2 = this.c2 = 0;
  this.d = this.e = this.d2 = this.e2 = 0;
  this.h = this.l = this.h2 = this.l2 = 0;
  this.ixL = this.ixH = 0;
  this.iyL = this.iyH = 0;
  this.r = 0;
  this.i = 0;
  this.f = 0;
  this.f2 = 0;
  this.pc = 0;
  this.sp = 57328;
  this.tstates = 0;
  this.totalCycles = 0;
  this.im = 0;
  this.iff1 = false;
  this.iff2 = false;
  this.EI_inst = false;
  this.interruptVector = 0;
  this.halt = false;
  this.blocks = Object.create(null);
  this.entryPC = 0;
  this.prevOpcode = this.readMem(0);
  this.blockInstructions = [this.prevOpcode]
}, getOp:function() {
  var opcode = this.readMem(this.pc);
  var oplist = (opcode & 255).toString(16);
  switch(opcode) {
    case 203:
    ;
    case 237:
      opcode = this.readMem(this.pc + 1);
      oplist += " " + (opcode & 255).toString(16);
      break;
    case 221:
    ;
    case 253:
      opcode = this.readMem(this.pc + 1);
      oplist += " " + (opcode & 255).toString(16);
      if(opcode == 203) {
        opcode = this.readMem(this.pc + 3);
        oplist += " " + (opcode & 255).toString(16)
      }
      break;
    default:
      break
  }
  return oplist.toUpperCase()
}, getMnu:function() {
  var opcode = this.readMem(this.pc)
}, consoledebug:function() {
  console.log("----------------------------------------------------------------------------");
  console.log(this.pc.toString(16) + " 0x" + this.getOp() + " ");
  console.log("A: " + this.a.toString(16) + " BC: " + this.getBC().toString(16) + " DE: " + this.getDE().toString(16) + " HL: " + this.getHL().toString(16) + " IX: " + this.getIX().toString(16) + " IY: " + this.getIY().toString(16));
  this.exAF();
  this.exBC();
  this.exDE();
  this.exHL();
  console.log("A': " + this.a.toString(16) + " BC': " + this.getBC().toString(16) + " DE': " + this.getDE().toString(16) + " HL': " + this.getHL().toString(16) + " SP: " + this.sp.toString(16));
  this.exAF();
  this.exBC();
  this.exDE();
  this.exHL()
}, run:function(cycles, cyclesTo) {
  var self = this;
  var location = 0;
  var opcode = 0;
  var temp = 0;
  this.tstates += cycles;
  if(cycles != 0) {
    this.totalCycles = cycles
  }
  if(!Setup.ACCURATE_INTERRUPT_EMULATION) {
    if(this.interruptLine) {
      this.interrupt()
    }
  }
  while(this.tstates > cyclesTo) {
    if(ENABLE_DYNAREC && this.blocks[this.pc]) {
      this["tstates"] = this.tstates;
      this.blocks[this.pc].call(this, cyclesTo);
      this.entryPC = this.pc;
      this.blockInstructions = [];
      return
    }
    if(Setup.ACCURATE_INTERRUPT_EMULATION) {
      if(this.interruptLine) {
        this.interrupt()
      }
    }
    opcode = this.readMem(this.pc);
    if(isEndingInst(this.prevOpcode)) {
      this.hitCounts[this.entryPC]++;
      if(this.hitCounts[this.pc] >= HOT_BLOCK_THRESHOLD && this.blockInstructions.length) {
        var instructionsNumber = this.blockInstructions.length;
        var blockFunction = this.blockInstructions.map(function(opcode) {
          return self.opcodeInstructions[opcode]
        }).join("\n" + "if (!(this.tstates > cyclesTo)) return;" + "\n\n");
        if(DEBUG) {
          blockFunction = (new Function("return function block_" + toHex(this.entryPC) + "_" + instructionsNumber + "(cyclesTo) {\n" + blockFunction + "}"))()
        }else {
          blockFunction = new Function("cyclesTo", blockFunction)
        }
        this.blocks[this.entryPC] = blockFunction
      }
      this.entryPC = this.pc;
      this.blockInstructions = []
    }
    this.prevOpcode = opcode;
    this.blockInstructions.push(opcode);
    this.pc++;
    if(Setup.ACCURATE_INTERRUPT_EMULATION) {
      this.EI_inst = false
    }
    this.tstates -= OP_STATES[opcode];
    if(Setup.REFRESH_EMULATION) {
      this.incR()
    }
    switch(opcode) {
      case 0:
        break;
      case 1:
        this.c = this.readMem(this.pc++);
        this.b = this.readMem(this.pc++);
        break;
      case 2:
        this.writeMem(this.getBC(), this.a);
        break;
      case 3:
        this.incBC();
        break;
      case 4:
        this.b = this.inc8(this.b);
        break;
      case 5:
        this.b = this.dec8(this.b);
        break;
      case 6:
        this.b = this.readMem(this.pc++);
        break;
      case 7:
        this.rlca_a();
        break;
      case 8:
        this.exAF();
        break;
      case 9:
        this.setHL(this.add16(this.getHL(), this.getBC()));
        break;
      case 10:
        this.a = this.readMem(this.getBC());
        break;
      case 11:
        this.decBC();
        break;
      case 12:
        this.c = this.inc8(this.c);
        break;
      case 13:
        this.c = this.dec8(this.c);
        break;
      case 14:
        this.c = this.readMem(this.pc++);
        break;
      case 15:
        this.rrca_a();
        break;
      case 16:
        this.b = this.b - 1 & 255;
        this.jr(this.b != 0);
        break;
      case 17:
        this.e = this.readMem(this.pc++);
        this.d = this.readMem(this.pc++);
        break;
      case 18:
        this.writeMem(this.getDE(), this.a);
        break;
      case 19:
        this.incDE();
        break;
      case 20:
        this.d = this.inc8(this.d);
        break;
      case 21:
        this.d = this.dec8(this.d);
        break;
      case 22:
        this.d = this.readMem(this.pc++);
        break;
      case 23:
        this.rla_a();
        break;
      case 24:
        this.pc += this.d_() + 1;
        break;
      case 25:
        this.setHL(this.add16(this.getHL(), this.getDE()));
        break;
      case 26:
        this.a = this.readMem(this.getDE());
        break;
      case 27:
        this.decDE();
        break;
      case 28:
        this.e = this.inc8(this.e);
        break;
      case 29:
        this.e = this.dec8(this.e);
        break;
      case 30:
        this.e = this.readMem(this.pc++);
        break;
      case 31:
        this.rra_a();
        break;
      case 32:
        this.jr(!((this.f & F_ZERO) != 0));
        break;
      case 33:
        this.l = this.readMem(this.pc++);
        this.h = this.readMem(this.pc++);
        break;
      case 34:
        location = this.readMemWord(this.pc);
        this.writeMem(location, this.l);
        this.writeMem(++location, this.h);
        this.pc += 2;
        break;
      case 35:
        this.incHL();
        break;
      case 36:
        this.h = this.inc8(this.h);
        break;
      case 37:
        this.h = this.dec8(this.h);
        break;
      case 38:
        this.h = this.readMem(this.pc++);
        break;
      case 39:
        this.daa();
        break;
      case 40:
        this.jr((this.f & F_ZERO) != 0);
        break;
      case 41:
        this.setHL(this.add16(this.getHL(), this.getHL()));
        break;
      case 42:
        location = this.readMemWord(this.pc);
        this.l = this.readMem(location);
        this.h = this.readMem(location + 1);
        this.pc += 2;
        break;
      case 43:
        this.decHL();
        break;
      case 44:
        this.l = this.inc8(this.l);
        break;
      case 45:
        this.l = this.dec8(this.l);
        break;
      case 46:
        this.l = this.readMem(this.pc++);
        break;
      case 47:
        this.cpl_a();
        break;
      case 48:
        this.jr(!((this.f & F_CARRY) != 0));
        break;
      case 49:
        this.sp = this.readMemWord(this.pc);
        this.pc += 2;
        break;
      case 50:
        this.writeMem(this.readMemWord(this.pc), this.a);
        this.pc += 2;
        break;
      case 51:
        this.sp++;
        break;
      case 52:
        this.incMem(this.getHL());
        break;
      case 53:
        this.decMem(this.getHL());
        break;
      case 54:
        this.writeMem(this.getHL(), this.readMem(this.pc++));
        break;
      case 55:
        this.f |= F_CARRY;
        this.f &= ~F_NEGATIVE;
        this.f &= ~F_HALFCARRY;
        break;
      case 56:
        this.jr((this.f & F_CARRY) != 0);
        break;
      case 57:
        this.setHL(this.add16(this.getHL(), this.sp));
        break;
      case 58:
        this.a = this.readMem(this.readMemWord(this.pc));
        this.pc += 2;
        break;
      case 59:
        this.sp--;
        break;
      case 60:
        this.a = this.inc8(this.a);
        break;
      case 61:
        this.a = this.dec8(this.a);
        break;
      case 62:
        this.a = this.readMem(this.pc++);
        break;
      case 63:
        this.ccf();
        break;
      case 64:
        break;
      case 65:
        this.b = this.c;
        break;
      case 66:
        this.b = this.d;
        break;
      case 67:
        this.b = this.e;
        break;
      case 68:
        this.b = this.h;
        break;
      case 69:
        this.b = this.l;
        break;
      case 70:
        this.b = this.readMem(this.getHL());
        break;
      case 71:
        this.b = this.a;
        break;
      case 72:
        this.c = this.b;
        break;
      case 73:
        break;
      case 74:
        this.c = this.d;
        break;
      case 75:
        this.c = this.e;
        break;
      case 76:
        this.c = this.h;
        break;
      case 77:
        this.c = this.l;
        break;
      case 78:
        this.c = this.readMem(this.getHL());
        break;
      case 79:
        this.c = this.a;
        break;
      case 80:
        this.d = this.b;
        break;
      case 81:
        this.d = this.c;
        break;
      case 82:
        break;
      case 83:
        this.d = this.e;
        break;
      case 84:
        this.d = this.h;
        break;
      case 85:
        this.d = this.l;
        break;
      case 86:
        this.d = this.readMem(this.getHL());
        break;
      case 87:
        this.d = this.a;
        break;
      case 88:
        this.e = this.b;
        break;
      case 89:
        this.e = this.c;
        break;
      case 90:
        this.e = this.d;
        break;
      case 91:
        break;
      case 92:
        this.e = this.h;
        break;
      case 93:
        this.e = this.l;
        break;
      case 94:
        this.e = this.readMem(this.getHL());
        break;
      case 95:
        this.e = this.a;
        break;
      case 96:
        this.h = this.b;
        break;
      case 97:
        this.h = this.c;
        break;
      case 98:
        this.h = this.d;
        break;
      case 99:
        this.h = this.e;
        break;
      case 100:
        break;
      case 101:
        this.h = this.l;
        break;
      case 102:
        this.h = this.readMem(this.getHL());
        break;
      case 103:
        this.h = this.a;
        break;
      case 104:
        this.l = this.b;
        break;
      case 105:
        this.l = this.c;
        break;
      case 106:
        this.l = this.d;
        break;
      case 107:
        this.l = this.e;
        break;
      case 108:
        this.l = this.h;
        break;
      case 109:
        break;
      case 110:
        this.l = this.readMem(this.getHL());
        break;
      case 111:
        this.l = this.a;
        break;
      case 112:
        this.writeMem(this.getHL(), this.b);
        break;
      case 113:
        this.writeMem(this.getHL(), this.c);
        break;
      case 114:
        this.writeMem(this.getHL(), this.d);
        break;
      case 115:
        this.writeMem(this.getHL(), this.e);
        break;
      case 116:
        this.writeMem(this.getHL(), this.h);
        break;
      case 117:
        this.writeMem(this.getHL(), this.l);
        break;
      case 118:
        if(HALT_SPEEDUP) {
          this.tstates = 0
        }
        this.halt = true;
        this.pc--;
        break;
      case 119:
        this.writeMem(this.getHL(), this.a);
        break;
      case 120:
        this.a = this.b;
        break;
      case 121:
        this.a = this.c;
        break;
      case 122:
        this.a = this.d;
        break;
      case 123:
        this.a = this.e;
        break;
      case 124:
        this.a = this.h;
        break;
      case 125:
        this.a = this.l;
        break;
      case 126:
        this.a = this.readMem(this.getHL());
        break;
      case 127:
        break;
      case 128:
        this.add_a(this.b);
        break;
      case 129:
        this.add_a(this.c);
        break;
      case 130:
        this.add_a(this.d);
        break;
      case 131:
        this.add_a(this.e);
        break;
      case 132:
        this.add_a(this.h);
        break;
      case 133:
        this.add_a(this.l);
        break;
      case 134:
        this.add_a(this.readMem(this.getHL()));
        break;
      case 135:
        this.add_a(this.a);
        break;
      case 136:
        this.adc_a(this.b);
        break;
      case 137:
        this.adc_a(this.c);
        break;
      case 138:
        this.adc_a(this.d);
        break;
      case 139:
        this.adc_a(this.e);
        break;
      case 140:
        this.adc_a(this.h);
        break;
      case 141:
        this.adc_a(this.l);
        break;
      case 142:
        this.adc_a(this.readMem(this.getHL()));
        break;
      case 143:
        this.adc_a(this.a);
        break;
      case 144:
        this.sub_a(this.b);
        break;
      case 145:
        this.sub_a(this.c);
        break;
      case 146:
        this.sub_a(this.d);
        break;
      case 147:
        this.sub_a(this.e);
        break;
      case 148:
        this.sub_a(this.h);
        break;
      case 149:
        this.sub_a(this.l);
        break;
      case 150:
        this.sub_a(this.readMem(this.getHL()));
        break;
      case 151:
        this.sub_a(this.a);
        break;
      case 152:
        this.sbc_a(this.b);
        break;
      case 153:
        this.sbc_a(this.c);
        break;
      case 154:
        this.sbc_a(this.d);
        break;
      case 155:
        this.sbc_a(this.e);
        break;
      case 156:
        this.sbc_a(this.h);
        break;
      case 157:
        this.sbc_a(this.l);
        break;
      case 158:
        this.sbc_a(this.readMem(this.getHL()));
        break;
      case 159:
        this.sbc_a(this.a);
        break;
      case 160:
        this.f = this.SZP_TABLE[this.a &= this.b] | F_HALFCARRY;
        break;
      case 161:
        this.f = this.SZP_TABLE[this.a &= this.c] | F_HALFCARRY;
        break;
      case 162:
        this.f = this.SZP_TABLE[this.a &= this.d] | F_HALFCARRY;
        break;
      case 163:
        this.f = this.SZP_TABLE[this.a &= this.e] | F_HALFCARRY;
        break;
      case 164:
        this.f = this.SZP_TABLE[this.a &= this.h] | F_HALFCARRY;
        break;
      case 165:
        this.f = this.SZP_TABLE[this.a &= this.l] | F_HALFCARRY;
        break;
      case 166:
        this.f = this.SZP_TABLE[this.a &= this.readMem(this.getHL())] | F_HALFCARRY;
        break;
      case 167:
        this.f = this.SZP_TABLE[this.a] | F_HALFCARRY;
        break;
      case 168:
        this.f = this.SZP_TABLE[this.a ^= this.b];
        break;
      case 169:
        this.f = this.SZP_TABLE[this.a ^= this.c];
        break;
      case 170:
        this.f = this.SZP_TABLE[this.a ^= this.d];
        break;
      case 171:
        this.f = this.SZP_TABLE[this.a ^= this.e];
        break;
      case 172:
        this.f = this.SZP_TABLE[this.a ^= this.h];
        break;
      case 173:
        this.f = this.SZP_TABLE[this.a ^= this.l];
        break;
      case 174:
        this.f = this.SZP_TABLE[this.a ^= this.readMem(this.getHL())];
        break;
      case 175:
        this.f = this.SZP_TABLE[this.a = 0];
        break;
      case 176:
        this.f = this.SZP_TABLE[this.a |= this.b];
        break;
      case 177:
        this.f = this.SZP_TABLE[this.a |= this.c];
        break;
      case 178:
        this.f = this.SZP_TABLE[this.a |= this.d];
        break;
      case 179:
        this.f = this.SZP_TABLE[this.a |= this.e];
        break;
      case 180:
        this.f = this.SZP_TABLE[this.a |= this.h];
        break;
      case 181:
        this.f = this.SZP_TABLE[this.a |= this.l];
        break;
      case 182:
        this.f = this.SZP_TABLE[this.a |= this.readMem(this.getHL())];
        break;
      case 183:
        this.f = this.SZP_TABLE[this.a];
        break;
      case 184:
        this.cp_a(this.b);
        break;
      case 185:
        this.cp_a(this.c);
        break;
      case 186:
        this.cp_a(this.d);
        break;
      case 187:
        this.cp_a(this.e);
        break;
      case 188:
        this.cp_a(this.h);
        break;
      case 189:
        this.cp_a(this.l);
        break;
      case 190:
        this.cp_a(this.readMem(this.getHL()));
        break;
      case 191:
        this.cp_a(this.a);
        break;
      case 192:
        this.ret((this.f & F_ZERO) == 0);
        break;
      case 193:
        this.setBC(this.readMemWord(this.sp));
        this.sp += 2;
        break;
      case 194:
        this.jp((this.f & F_ZERO) == 0);
        break;
      case 195:
        this.pc = this.readMemWord(this.pc);
        break;
      case 196:
        this.call((this.f & F_ZERO) == 0);
        break;
      case 197:
        this.push2(this.b, this.c);
        break;
      case 198:
        this.add_a(this.readMem(this.pc++));
        break;
      case 199:
        this.push1(this.pc);
        this.pc = 0;
        break;
      case 200:
        this.ret((this.f & F_ZERO) != 0);
        break;
      case 201:
        this.pc = this.readMemWord(this.sp);
        this.sp += 2;
        break;
      case 202:
        this.jp((this.f & F_ZERO) != 0);
        break;
      case 203:
        this.doCB(this.readMem(this.pc++));
        break;
      case 204:
        this.call((this.f & F_ZERO) != 0);
        break;
      case 205:
        this.push1(this.pc + 2);
        this.pc = this.readMemWord(this.pc);
        break;
      case 206:
        this.adc_a(this.readMem(this.pc++));
        break;
      case 207:
        this.push1(this.pc);
        this.pc = 8;
        break;
      case 208:
        this.ret((this.f & F_CARRY) == 0);
        break;
      case 209:
        this.setDE(this.readMemWord(this.sp));
        this.sp += 2;
        break;
      case 210:
        this.jp((this.f & F_CARRY) == 0);
        break;
      case 211:
        this.port.out(this.readMem(this.pc++), this.a);
        break;
      case 212:
        this.call((this.f & F_CARRY) == 0);
        break;
      case 213:
        this.push2(this.d, this.e);
        break;
      case 214:
        this.sub_a(this.readMem(this.pc++));
        break;
      case 215:
        this.push1(this.pc);
        this.pc = 16;
        break;
      case 216:
        this.ret((this.f & F_CARRY) != 0);
        break;
      case 217:
        this.exBC();
        this.exDE();
        this.exHL();
        break;
      case 218:
        this.jp((this.f & F_CARRY) != 0);
        break;
      case 219:
        this.a = this.port.in_(this.readMem(this.pc++));
        break;
      case 220:
        this.call((this.f & F_CARRY) != 0);
        break;
      case 221:
        this.doIndexOpIX(this.readMem(this.pc++));
        break;
      case 222:
        this.sbc_a(this.readMem(this.pc++));
        break;
      case 223:
        this.push1(this.pc);
        this.pc = 24;
        break;
      case 224:
        this.ret((this.f & F_PARITY) == 0);
        break;
      case 225:
        this.setHL(this.readMemWord(this.sp));
        this.sp += 2;
        break;
      case 226:
        this.jp((this.f & F_PARITY) == 0);
        break;
      case 227:
        temp = this.h;
        this.h = this.readMem(this.sp + 1);
        this.writeMem(this.sp + 1, temp);
        temp = this.l;
        this.l = this.readMem(this.sp);
        this.writeMem(this.sp, temp);
        break;
      case 228:
        this.call((this.f & F_PARITY) == 0);
        break;
      case 229:
        this.push2(this.h, this.l);
        break;
      case 230:
        this.f = this.SZP_TABLE[this.a &= this.readMem(this.pc++)] | F_HALFCARRY;
        break;
      case 231:
        this.push1(this.pc);
        this.pc = 32;
        break;
      case 232:
        this.ret((this.f & F_PARITY) != 0);
        break;
      case 233:
        this.pc = this.getHL();
        break;
      case 234:
        this.jp((this.f & F_PARITY) != 0);
        break;
      case 235:
        temp = this.d;
        this.d = this.h;
        this.h = temp;
        temp = this.e;
        this.e = this.l;
        this.l = temp;
        break;
      case 236:
        this.call((this.f & F_PARITY) != 0);
        break;
      case 237:
        this.doED(this.readMem(this.pc));
        break;
      case 238:
        this.f = this.SZP_TABLE[this.a ^= this.readMem(this.pc++)];
        break;
      case 239:
        this.push1(this.pc);
        this.pc = 40;
        break;
      case 240:
        this.ret((this.f & F_SIGN) == 0);
        break;
      case 241:
        this.f = this.readMem(this.sp++);
        this.a = this.readMem(this.sp++);
        break;
      case 242:
        this.jp((this.f & F_SIGN) == 0);
        break;
      case 243:
        this.iff1 = this.iff2 = false;
        this.EI_inst = true;
        break;
      case 244:
        this.call((this.f & F_SIGN) == 0);
        break;
      case 245:
        this.push2(this.a, this.f);
        break;
      case 246:
        this.f = this.SZP_TABLE[this.a |= this.readMem(this.pc++)];
        break;
      case 247:
        this.push1(this.pc);
        this.pc = 48;
        break;
      case 248:
        this.ret((this.f & F_SIGN) != 0);
        break;
      case 249:
        this.sp = this.getHL();
        break;
      case 250:
        this.jp((this.f & F_SIGN) != 0);
        break;
      case 251:
        this.iff1 = this.iff2 = this.EI_inst = true;
        break;
      case 252:
        this.call((this.f & F_SIGN) != 0);
        break;
      case 253:
        this.doIndexOpIY(this.readMem(this.pc++));
        break;
      case 254:
        this.cp_a(this.readMem(this.pc++));
        break;
      case 255:
        this.push1(this.pc);
        this.pc = 56;
        break
    }
  }
}, getCycle:function() {
  return this.totalCycles - this.tstates
}, nmi:function() {
  this.iff2 = this.iff1;
  this.iff1 = false;
  if(Setup.REFRESH_EMULATION) {
    this.incR()
  }
  if(this.halt) {
    this.pc++;
    this.halt = false
  }
  this.push1(this.pc);
  this.pc = 102;
  this.tstates -= 11
}, interrupt:function() {
  if(!this.iff1 || Setup.ACCURATE_INTERRUPT_EMULATION && this.EI_inst) {
    return
  }
  if(this.halt) {
    this.pc++;
    this.halt = false
  }
  if(Setup.REFRESH_EMULATION) {
    this.incR()
  }
  this.iff1 = this.iff2 = false;
  this.interruptLine = false;
  this.push1(this.pc);
  if(this.im == 0) {
    this.pc = this.interruptVector == 0 || this.interruptVector == 255 ? 56 : this.interruptVector;
    this.tstates -= 13
  }else {
    if(this.im == 1) {
      this.pc = 56;
      this.tstates -= 13
    }else {
      this.pc = this.readMemWord((this.i << 8) + this.interruptVector);
      this.tstates -= 19
    }
  }
}, jp:function(condition) {
  if(condition) {
    this.pc = this.readMemWord(this.pc)
  }else {
    this.pc += 2
  }
}, jr:function(condition) {
  if(condition) {
    var d = this.d_() + 1;
    if(d >= 128) {
      d = d - 256
    }
    this.pc += d;
    this.tstates -= 5
  }else {
    this.pc++
  }
}, call:function(condition) {
  if(condition) {
    this.push1(this.pc + 2);
    this.pc = this.readMemWord(this.pc);
    this.tstates -= 7
  }else {
    this.pc += 2
  }
}, ret:function(condition) {
  if(condition) {
    this.pc = this.readMemWord(this.sp);
    this.sp += 2;
    this.tstates -= 6
  }
}, push1:function(value) {
  this.writeMem(--this.sp, value >> 8);
  this.writeMem(--this.sp, value & 255)
}, push2:function(value, l) {
  this.writeMem(--this.sp, value);
  this.writeMem(--this.sp, l)
}, incMem:function(offset) {
  this.writeMem(offset, this.inc8(this.readMem(offset)))
}, decMem:function(offset) {
  this.writeMem(offset, this.dec8(this.readMem(offset)))
}, ccf:function() {
  if((this.f & F_CARRY) != 0) {
    this.f &= ~F_CARRY;
    this.f |= F_HALFCARRY
  }else {
    this.f |= F_CARRY;
    this.f &= ~F_HALFCARRY
  }
  this.f &= ~F_NEGATIVE
}, daa:function() {
  var temp = this.DAA_TABLE[this.a | (this.f & F_CARRY) << 8 | (this.f & F_NEGATIVE) << 8 | (this.f & F_HALFCARRY) << 6];
  this.a = temp & 255;
  this.f = this.f & F_NEGATIVE | temp >> 8
}, doCB:function(opcode) {
  this.tstates -= OP_CB_STATES[opcode];
  if(Setup.REFRESH_EMULATION) {
    this.incR()
  }
  switch(opcode) {
    case 0:
      this.b = this.rlc(this.b);
      break;
    case 1:
      this.c = this.rlc(this.c);
      break;
    case 2:
      this.d = this.rlc(this.d);
      break;
    case 3:
      this.e = this.rlc(this.e);
      break;
    case 4:
      this.h = this.rlc(this.h);
      break;
    case 5:
      this.l = this.rlc(this.l);
      break;
    case 6:
      this.writeMem(this.getHL(), this.rlc(this.readMem(this.getHL())));
      break;
    case 7:
      this.a = this.rlc(this.a);
      break;
    case 8:
      this.b = this.rrc(this.b);
      break;
    case 9:
      this.c = this.rrc(this.c);
      break;
    case 10:
      this.d = this.rrc(this.d);
      break;
    case 11:
      this.e = this.rrc(this.e);
      break;
    case 12:
      this.h = this.rrc(this.h);
      break;
    case 13:
      this.l = this.rrc(this.l);
      break;
    case 14:
      this.writeMem(this.getHL(), this.rrc(this.readMem(this.getHL())));
      break;
    case 15:
      this.a = this.rrc(this.a);
      break;
    case 16:
      this.b = this.rl(this.b);
      break;
    case 17:
      this.c = this.rl(this.c);
      break;
    case 18:
      this.d = this.rl(this.d);
      break;
    case 19:
      this.e = this.rl(this.e);
      break;
    case 20:
      this.h = this.rl(this.h);
      break;
    case 21:
      this.l = this.rl(this.l);
      break;
    case 22:
      this.writeMem(this.getHL(), this.rl(this.readMem(this.getHL())));
      break;
    case 23:
      this.a = this.rl(this.a);
      break;
    case 24:
      this.b = this.rr(this.b);
      break;
    case 25:
      this.c = this.rr(this.c);
      break;
    case 26:
      this.d = this.rr(this.d);
      break;
    case 27:
      this.e = this.rr(this.e);
      break;
    case 28:
      this.h = this.rr(this.h);
      break;
    case 29:
      this.l = this.rr(this.l);
      break;
    case 30:
      this.writeMem(this.getHL(), this.rr(this.readMem(this.getHL())));
      break;
    case 31:
      this.a = this.rr(this.a);
      break;
    case 32:
      this.b = this.sla(this.b);
      break;
    case 33:
      this.c = this.sla(this.c);
      break;
    case 34:
      this.d = this.sla(this.d);
      break;
    case 35:
      this.e = this.sla(this.e);
      break;
    case 36:
      this.h = this.sla(this.h);
      break;
    case 37:
      this.l = this.sla(this.l);
      break;
    case 38:
      this.writeMem(this.getHL(), this.sla(this.readMem(this.getHL())));
      break;
    case 39:
      this.a = this.sla(this.a);
      break;
    case 40:
      this.b = this.sra(this.b);
      break;
    case 41:
      this.c = this.sra(this.c);
      break;
    case 42:
      this.d = this.sra(this.d);
      break;
    case 43:
      this.e = this.sra(this.e);
      break;
    case 44:
      this.h = this.sra(this.h);
      break;
    case 45:
      this.l = this.sra(this.l);
      break;
    case 46:
      this.writeMem(this.getHL(), this.sra(this.readMem(this.getHL())));
      break;
    case 47:
      this.a = this.sra(this.a);
      break;
    case 48:
      this.b = this.sll(this.b);
      break;
    case 49:
      this.c = this.sll(this.c);
      break;
    case 50:
      this.d = this.sll(this.d);
      break;
    case 51:
      this.e = this.sll(this.e);
      break;
    case 52:
      this.h = this.sll(this.h);
      break;
    case 53:
      this.l = this.sll(this.l);
      break;
    case 54:
      this.writeMem(this.getHL(), this.sll(this.readMem(this.getHL())));
      break;
    case 55:
      this.a = this.sll(this.a);
      break;
    case 56:
      this.b = this.srl(this.b);
      break;
    case 57:
      this.c = this.srl(this.c);
      break;
    case 58:
      this.d = this.srl(this.d);
      break;
    case 59:
      this.e = this.srl(this.e);
      break;
    case 60:
      this.h = this.srl(this.h);
      break;
    case 61:
      this.l = this.rl(this.l);
      break;
    case 62:
      this.writeMem(this.getHL(), this.srl(this.readMem(this.getHL())));
      break;
    case 63:
      this.a = this.srl(this.a);
      break;
    case 64:
      this.bit(this.b & BIT_0);
      break;
    case 65:
      this.bit(this.c & BIT_0);
      break;
    case 66:
      this.bit(this.d & BIT_0);
      break;
    case 67:
      this.bit(this.e & BIT_0);
      break;
    case 68:
      this.bit(this.h & BIT_0);
      break;
    case 69:
      this.bit(this.l & BIT_0);
      break;
    case 70:
      this.bit(this.readMem(this.getHL()) & BIT_0);
      break;
    case 71:
      this.bit(this.a & BIT_0);
      break;
    case 72:
      this.bit(this.b & BIT_1);
      break;
    case 73:
      this.bit(this.c & BIT_1);
      break;
    case 74:
      this.bit(this.d & BIT_1);
      break;
    case 75:
      this.bit(this.e & BIT_1);
      break;
    case 76:
      this.bit(this.h & BIT_1);
      break;
    case 77:
      this.bit(this.l & BIT_1);
      break;
    case 78:
      this.bit(this.readMem(this.getHL()) & BIT_1);
      break;
    case 79:
      this.bit(this.a & BIT_1);
      break;
    case 80:
      this.bit(this.b & BIT_2);
      break;
    case 81:
      this.bit(this.c & BIT_2);
      break;
    case 82:
      this.bit(this.d & BIT_2);
      break;
    case 83:
      this.bit(this.e & BIT_2);
      break;
    case 84:
      this.bit(this.h & BIT_2);
      break;
    case 85:
      this.bit(this.l & BIT_2);
      break;
    case 86:
      this.bit(this.readMem(this.getHL()) & BIT_2);
      break;
    case 87:
      this.bit(this.a & BIT_2);
      break;
    case 88:
      this.bit(this.b & BIT_3);
      break;
    case 89:
      this.bit(this.c & BIT_3);
      break;
    case 90:
      this.bit(this.d & BIT_3);
      break;
    case 91:
      this.bit(this.e & BIT_3);
      break;
    case 92:
      this.bit(this.h & BIT_3);
      break;
    case 93:
      this.bit(this.l & BIT_3);
      break;
    case 94:
      this.bit(this.readMem(this.getHL()) & BIT_3);
      break;
    case 95:
      this.bit(this.a & BIT_3);
      break;
    case 96:
      this.bit(this.b & BIT_4);
      break;
    case 97:
      this.bit(this.c & BIT_4);
      break;
    case 98:
      this.bit(this.d & BIT_4);
      break;
    case 99:
      this.bit(this.e & BIT_4);
      break;
    case 100:
      this.bit(this.h & BIT_4);
      break;
    case 101:
      this.bit(this.l & BIT_4);
      break;
    case 102:
      this.bit(this.readMem(this.getHL()) & BIT_4);
      break;
    case 103:
      this.bit(this.a & BIT_4);
      break;
    case 104:
      this.bit(this.b & BIT_5);
      break;
    case 105:
      this.bit(this.c & BIT_5);
      break;
    case 106:
      this.bit(this.d & BIT_5);
      break;
    case 107:
      this.bit(this.e & BIT_5);
      break;
    case 108:
      this.bit(this.h & BIT_5);
      break;
    case 109:
      this.bit(this.l & BIT_5);
      break;
    case 110:
      this.bit(this.readMem(this.getHL()) & BIT_5);
      break;
    case 111:
      this.bit(this.a & BIT_5);
      break;
    case 112:
      this.bit(this.b & BIT_6);
      break;
    case 113:
      this.bit(this.c & BIT_6);
      break;
    case 114:
      this.bit(this.d & BIT_6);
      break;
    case 115:
      this.bit(this.e & BIT_6);
      break;
    case 116:
      this.bit(this.h & BIT_6);
      break;
    case 117:
      this.bit(this.l & BIT_6);
      break;
    case 118:
      this.bit(this.readMem(this.getHL()) & BIT_6);
      break;
    case 119:
      this.bit(this.a & BIT_6);
      break;
    case 120:
      this.bit(this.b & BIT_7);
      break;
    case 121:
      this.bit(this.c & BIT_7);
      break;
    case 122:
      this.bit(this.d & BIT_7);
      break;
    case 123:
      this.bit(this.e & BIT_7);
      break;
    case 124:
      this.bit(this.h & BIT_7);
      break;
    case 125:
      this.bit(this.l & BIT_7);
      break;
    case 126:
      this.bit(this.readMem(this.getHL()) & BIT_7);
      break;
    case 127:
      this.bit(this.a & BIT_7);
      break;
    case 128:
      this.b &= ~BIT_0;
      break;
    case 129:
      this.c &= ~BIT_0;
      break;
    case 130:
      this.d &= ~BIT_0;
      break;
    case 131:
      this.e &= ~BIT_0;
      break;
    case 132:
      this.h &= ~BIT_0;
      break;
    case 133:
      this.l &= ~BIT_0;
      break;
    case 134:
      this.writeMem(this.getHL(), this.readMem(this.getHL()) & ~BIT_0);
      break;
    case 135:
      this.a &= ~BIT_0;
      break;
    case 136:
      this.b &= ~BIT_1;
      break;
    case 137:
      this.c &= ~BIT_1;
      break;
    case 138:
      this.d &= ~BIT_1;
      break;
    case 139:
      this.e &= ~BIT_1;
      break;
    case 140:
      this.h &= ~BIT_1;
      break;
    case 141:
      this.l &= ~BIT_1;
      break;
    case 142:
      this.writeMem(this.getHL(), this.readMem(this.getHL()) & ~BIT_1);
      break;
    case 143:
      this.a &= ~BIT_1;
      break;
    case 144:
      this.b &= ~BIT_2;
      break;
    case 145:
      this.c &= ~BIT_2;
      break;
    case 146:
      this.d &= ~BIT_2;
      break;
    case 147:
      this.e &= ~BIT_2;
      break;
    case 148:
      this.h &= ~BIT_2;
      break;
    case 149:
      this.l &= ~BIT_2;
      break;
    case 150:
      this.writeMem(this.getHL(), this.readMem(this.getHL()) & ~BIT_2);
      break;
    case 151:
      this.a &= ~BIT_2;
      break;
    case 152:
      this.b &= ~BIT_3;
      break;
    case 153:
      this.c &= ~BIT_3;
      break;
    case 154:
      this.d &= ~BIT_3;
      break;
    case 155:
      this.e &= ~BIT_3;
      break;
    case 156:
      this.h &= ~BIT_3;
      break;
    case 157:
      this.l &= ~BIT_3;
      break;
    case 158:
      this.writeMem(this.getHL(), this.readMem(this.getHL()) & ~BIT_3);
      break;
    case 159:
      this.a &= ~BIT_3;
      break;
    case 160:
      this.b &= ~BIT_4;
      break;
    case 161:
      this.c &= ~BIT_4;
      break;
    case 162:
      this.d &= ~BIT_4;
      break;
    case 163:
      this.e &= ~BIT_4;
      break;
    case 164:
      this.h &= ~BIT_4;
      break;
    case 165:
      this.l &= ~BIT_4;
      break;
    case 166:
      this.writeMem(this.getHL(), this.readMem(this.getHL()) & ~BIT_4);
      break;
    case 167:
      this.a &= ~BIT_4;
      break;
    case 168:
      this.b &= ~BIT_5;
      break;
    case 169:
      this.c &= ~BIT_5;
      break;
    case 170:
      this.d &= ~BIT_5;
      break;
    case 171:
      this.e &= ~BIT_5;
      break;
    case 172:
      this.h &= ~BIT_5;
      break;
    case 173:
      this.l &= ~BIT_5;
      break;
    case 174:
      this.writeMem(this.getHL(), this.readMem(this.getHL()) & ~BIT_5);
      break;
    case 175:
      this.a &= ~BIT_5;
      break;
    case 176:
      this.b &= ~BIT_6;
      break;
    case 177:
      this.c &= ~BIT_6;
      break;
    case 178:
      this.d &= ~BIT_6;
      break;
    case 179:
      this.e &= ~BIT_6;
      break;
    case 180:
      this.h &= ~BIT_6;
      break;
    case 181:
      this.l &= ~BIT_6;
      break;
    case 182:
      this.writeMem(this.getHL(), this.readMem(this.getHL()) & ~BIT_6);
      break;
    case 183:
      this.a &= ~BIT_6;
      break;
    case 184:
      this.b &= ~BIT_7;
      break;
    case 185:
      this.c &= ~BIT_7;
      break;
    case 186:
      this.d &= ~BIT_7;
      break;
    case 187:
      this.e &= ~BIT_7;
      break;
    case 188:
      this.h &= ~BIT_7;
      break;
    case 189:
      this.l &= ~BIT_7;
      break;
    case 190:
      this.writeMem(this.getHL(), this.readMem(this.getHL()) & ~BIT_7);
      break;
    case 191:
      this.a &= ~BIT_7;
      break;
    case 192:
      this.b |= BIT_0;
      break;
    case 193:
      this.c |= BIT_0;
      break;
    case 194:
      this.d |= BIT_0;
      break;
    case 195:
      this.e |= BIT_0;
      break;
    case 196:
      this.h |= BIT_0;
      break;
    case 197:
      this.l |= BIT_0;
      break;
    case 198:
      this.writeMem(this.getHL(), this.readMem(this.getHL()) | BIT_0);
      break;
    case 199:
      this.a |= BIT_0;
      break;
    case 200:
      this.b |= BIT_1;
      break;
    case 201:
      this.c |= BIT_1;
      break;
    case 202:
      this.d |= BIT_1;
      break;
    case 203:
      this.e |= BIT_1;
      break;
    case 204:
      this.h |= BIT_1;
      break;
    case 205:
      this.l |= BIT_1;
      break;
    case 206:
      this.writeMem(this.getHL(), this.readMem(this.getHL()) | BIT_1);
      break;
    case 207:
      this.a |= BIT_1;
      break;
    case 208:
      this.b |= BIT_2;
      break;
    case 209:
      this.c |= BIT_2;
      break;
    case 210:
      this.d |= BIT_2;
      break;
    case 211:
      this.e |= BIT_2;
      break;
    case 212:
      this.h |= BIT_2;
      break;
    case 213:
      this.l |= BIT_2;
      break;
    case 214:
      this.writeMem(this.getHL(), this.readMem(this.getHL()) | BIT_2);
      break;
    case 215:
      this.a |= BIT_2;
      break;
    case 216:
      this.b |= BIT_3;
      break;
    case 217:
      this.c |= BIT_3;
      break;
    case 218:
      this.d |= BIT_3;
      break;
    case 219:
      this.e |= BIT_3;
      break;
    case 220:
      this.h |= BIT_3;
      break;
    case 221:
      this.l |= BIT_3;
      break;
    case 222:
      this.writeMem(this.getHL(), this.readMem(this.getHL()) | BIT_3);
      break;
    case 223:
      this.a |= BIT_3;
      break;
    case 224:
      this.b |= BIT_4;
      break;
    case 225:
      this.c |= BIT_4;
      break;
    case 226:
      this.d |= BIT_4;
      break;
    case 227:
      this.e |= BIT_4;
      break;
    case 228:
      this.h |= BIT_4;
      break;
    case 229:
      this.l |= BIT_4;
      break;
    case 230:
      this.writeMem(this.getHL(), this.readMem(this.getHL()) | BIT_4);
      break;
    case 231:
      this.a |= BIT_4;
      break;
    case 232:
      this.b |= BIT_5;
      break;
    case 233:
      this.c |= BIT_5;
      break;
    case 234:
      this.d |= BIT_5;
      break;
    case 235:
      this.e |= BIT_5;
      break;
    case 236:
      this.h |= BIT_5;
      break;
    case 237:
      this.l |= BIT_5;
      break;
    case 238:
      this.writeMem(this.getHL(), this.readMem(this.getHL()) | BIT_5);
      break;
    case 239:
      this.a |= BIT_5;
      break;
    case 240:
      this.b |= BIT_6;
      break;
    case 241:
      this.c |= BIT_6;
      break;
    case 242:
      this.d |= BIT_6;
      break;
    case 243:
      this.e |= BIT_6;
      break;
    case 244:
      this.h |= BIT_6;
      break;
    case 245:
      this.l |= BIT_6;
      break;
    case 246:
      this.writeMem(this.getHL(), this.readMem(this.getHL()) | BIT_6);
      break;
    case 247:
      this.a |= BIT_6;
      break;
    case 248:
      this.b |= BIT_7;
      break;
    case 249:
      this.c |= BIT_7;
      break;
    case 250:
      this.d |= BIT_7;
      break;
    case 251:
      this.e |= BIT_7;
      break;
    case 252:
      this.h |= BIT_7;
      break;
    case 253:
      this.l |= BIT_7;
      break;
    case 254:
      this.writeMem(this.getHL(), this.readMem(this.getHL()) | BIT_7);
      break;
    case 255:
      this.a |= BIT_7;
      break;
    default:
      if(DEBUG) {
        console.log("Unimplemented CB Opcode: " + opcode.toString(16))
      }
      break
  }
}, rlc:function(value) {
  var carry = (value & 128) >> 7;
  value = (value << 1 | value >> 7) & 255;
  this.f = carry | this.SZP_TABLE[value];
  return value
}, rrc:function(value) {
  var carry = value & 1;
  value = (value >> 1 | value << 7) & 255;
  this.f = carry | this.SZP_TABLE[value];
  return value
}, rl:function(value) {
  var carry = (value & 128) >> 7;
  value = (value << 1 | this.f & F_CARRY) & 255;
  this.f = carry | this.SZP_TABLE[value];
  return value
}, rr:function(value) {
  var carry = value & 1;
  value = (value >> 1 | this.f << 7) & 255;
  this.f = carry | this.SZP_TABLE[value];
  return value
}, sla:function(value) {
  var carry = (value & 128) >> 7;
  value = value << 1 & 255;
  this.f = carry | this.SZP_TABLE[value];
  return value
}, sll:function(value) {
  var carry = (value & 128) >> 7;
  value = (value << 1 | 1) & 255;
  this.f = carry | this.SZP_TABLE[value];
  return value
}, sra:function(value) {
  var carry = value & 1;
  value = value >> 1 | value & 128;
  this.f = carry | this.SZP_TABLE[value];
  return value
}, srl:function(value) {
  var carry = value & 1;
  value = value >> 1 & 255;
  this.f = carry | this.SZP_TABLE[value];
  return value
}, bit:function(mask) {
  this.f = this.f & F_CARRY | this.SZ_BIT_TABLE[mask]
}, doIndexOpIX:function(opcode) {
  var location = 0;
  var temp = 0;
  this.tstates -= OP_DD_STATES[opcode];
  if(Setup.REFRESH_EMULATION) {
    this.incR()
  }
  switch(opcode) {
    case 9:
      this.setIX(this.add16(this.getIX(), this.getBC()));
      break;
    case 25:
      this.setIX(this.add16(this.getIX(), this.getDE()));
      break;
    case 33:
      this.setIX(this.readMemWord(this.pc));
      this.pc += 2;
      break;
    case 34:
      location = this.readMemWord(this.pc);
      this.writeMem(location++, this.ixL);
      this.writeMem(location, this.ixH);
      this.pc += 2;
      break;
    case 35:
      this.incIX();
      break;
    case 36:
      this.ixH = this.inc8(this.ixH);
      break;
    case 37:
      this.ixH = this.dec8(this.ixH);
      break;
    case 38:
      this.ixH = this.readMem(this.pc++);
      break;
    case 41:
      this.setIX(this.add16(this.getIX(), this.getIX()));
      break;
    case 42:
      location = this.readMemWord(this.pc);
      this.ixL = this.readMem(location);
      this.ixH = this.readMem(++location);
      this.pc += 2;
      break;
    case 43:
      this.decIX();
      break;
    case 44:
      this.ixL = this.inc8(this.ixL);
      break;
    case 45:
      this.ixL = this.dec8(this.ixL);
      break;
    case 46:
      this.ixL = this.readMem(this.pc++);
      break;
    case 52:
      this.incMem(this.getIX() + this.d_());
      this.pc++;
      break;
    case 53:
      this.decMem(this.getIX() + this.d_());
      this.pc++;
      break;
    case 54:
      this.writeMem(this.getIX() + this.d_(), this.readMem(++this.pc));
      this.pc++;
      break;
    case 57:
      this.setIX(this.add16(this.getIX(), this.sp));
      break;
    case 68:
      this.b = this.ixH;
      break;
    case 69:
      this.b = this.ixL;
      break;
    case 70:
      this.b = this.readMem(this.getIX() + this.d_());
      this.pc++;
      break;
    case 76:
      this.c = this.ixH;
      break;
    case 77:
      this.c = this.ixL;
      break;
    case 78:
      this.c = this.readMem(this.getIX() + this.d_());
      this.pc++;
      break;
    case 84:
      this.d = this.ixH;
      break;
    case 85:
      this.d = this.ixL;
      break;
    case 86:
      this.d = this.readMem(this.getIX() + this.d_());
      this.pc++;
      break;
    case 92:
      this.e = this.ixH;
      break;
    case 93:
      this.e = this.ixL;
      break;
    case 94:
      this.e = this.readMem(this.getIX() + this.d_());
      this.pc++;
      break;
    case 96:
      this.ixH = this.b;
      break;
    case 97:
      this.ixH = this.c;
      break;
    case 98:
      this.ixH = this.d;
      break;
    case 99:
      this.ixH = this.e;
      break;
    case 100:
      break;
    case 101:
      this.ixH = this.ixL;
      break;
    case 102:
      this.h = this.readMem(this.getIX() + this.d_());
      this.pc++;
      break;
    case 103:
      this.ixH = this.a;
      break;
    case 104:
      this.ixL = this.b;
      break;
    case 105:
      this.ixL = this.c;
      break;
    case 106:
      this.ixL = this.d;
      break;
    case 107:
      this.ixL = this.e;
      break;
    case 108:
      this.ixL = this.ixH;
      break;
    case 109:
      break;
    case 110:
      this.l = this.readMem(this.getIX() + this.d_());
      this.pc++;
      break;
    case 111:
      this.ixL = this.a;
      break;
    case 112:
      this.writeMem(this.getIX() + this.d_(), this.b);
      this.pc++;
      break;
    case 113:
      this.writeMem(this.getIX() + this.d_(), this.c);
      this.pc++;
      break;
    case 114:
      this.writeMem(this.getIX() + this.d_(), this.d);
      this.pc++;
      break;
    case 115:
      this.writeMem(this.getIX() + this.d_(), this.e);
      this.pc++;
      break;
    case 116:
      this.writeMem(this.getIX() + this.d_(), this.h);
      this.pc++;
      break;
    case 117:
      this.writeMem(this.getIX() + this.d_(), this.l);
      this.pc++;
      break;
    case 119:
      this.writeMem(this.getIX() + this.d_(), this.a);
      this.pc++;
      break;
    case 124:
      this.a = this.ixH;
      break;
    case 125:
      this.a = this.ixL;
      break;
    case 126:
      this.a = this.readMem(this.getIX() + this.d_());
      this.pc++;
      break;
    case 132:
      this.add_a(this.ixH);
      break;
    case 133:
      this.add_a(this.ixL);
      break;
    case 134:
      this.add_a(this.readMem(this.getIX() + this.d_()));
      this.pc++;
      break;
    case 140:
      this.adc_a(this.ixH);
      break;
    case 141:
      this.adc_a(this.ixL);
      break;
    case 142:
      this.adc_a(this.readMem(this.getIX() + this.d_()));
      this.pc++;
      break;
    case 148:
      this.sub_a(this.ixH);
      break;
    case 149:
      this.sub_a(this.ixL);
      break;
    case 150:
      this.sub_a(this.readMem(this.getIX() + this.d_()));
      this.pc++;
      break;
    case 156:
      this.sbc_a(this.ixH);
      break;
    case 157:
      this.sbc_a(this.ixL);
      break;
    case 158:
      this.sbc_a(this.readMem(this.getIX() + this.d_()));
      this.pc++;
      break;
    case 164:
      this.f = this.SZP_TABLE[this.a &= this.ixH] | F_HALFCARRY;
      break;
    case 165:
      this.f = this.SZP_TABLE[this.a &= this.ixL] | F_HALFCARRY;
      break;
    case 166:
      this.f = this.SZP_TABLE[this.a &= this.readMem(this.getIX() + this.d_())] | F_HALFCARRY;
      this.pc++;
      break;
    case 172:
      this.f = this.SZP_TABLE[this.a ^= this.ixH];
      break;
    case 173:
      this.f = this.SZP_TABLE[this.a ^= this.ixL];
      break;
    case 174:
      this.f = this.SZP_TABLE[this.a ^= this.readMem(this.getIX() + this.d_())];
      this.pc++;
      break;
    case 180:
      this.f = this.SZP_TABLE[this.a |= this.ixH];
      break;
    case 181:
      this.f = this.SZP_TABLE[this.a |= this.ixL];
      break;
    case 182:
      this.f = this.SZP_TABLE[this.a |= this.readMem(this.getIX() + this.d_())];
      this.pc++;
      break;
    case 188:
      this.cp_a(this.ixH);
      break;
    case 189:
      this.cp_a(this.ixL);
      break;
    case 190:
      this.cp_a(this.readMem(this.getIX() + this.d_()));
      this.pc++;
      break;
    case 203:
      this.doIndexCB(this.getIX());
      break;
    case 225:
      this.setIX(this.readMemWord(this.sp));
      this.sp += 2;
      break;
    case 227:
      temp = this.getIX();
      this.setIX(this.readMemWord(this.sp));
      this.writeMem(this.sp, temp & 255);
      this.writeMem(this.sp + 1, temp >> 8);
      break;
    case 229:
      this.push2(this.ixH, this.ixL);
      break;
    case 233:
      this.pc = this.getIX();
      break;
    case 249:
      this.sp = this.getIX();
      break;
    default:
      this.pc--;
      break
  }
}, doIndexOpIY:function(opcode) {
  var location;
  var temp;
  this.tstates -= OP_DD_STATES[opcode];
  if(Setup.REFRESH_EMULATION) {
    this.incR()
  }
  switch(opcode) {
    case 9:
      this.setIY(this.add16(this.getIY(), this.getBC()));
      break;
    case 25:
      this.setIY(this.add16(this.getIY(), this.getDE()));
      break;
    case 33:
      this.setIY(this.readMemWord(this.pc));
      this.pc += 2;
      break;
    case 34:
      location = this.readMemWord(this.pc);
      this.writeMem(location++, this.iyL);
      this.writeMem(location, this.iyH);
      this.pc += 2;
      break;
    case 35:
      this.incIY();
      break;
    case 36:
      this.iyH = this.inc8(this.iyH);
      break;
    case 37:
      this.iyH = this.dec8(this.iyH);
      break;
    case 38:
      this.iyH = this.readMem(this.pc++);
      break;
    case 41:
      this.setIY(this.add16(this.getIY(), this.getIY()));
      break;
    case 42:
      location = this.readMemWord(this.pc);
      this.iyL = this.readMem(location);
      this.iyH = this.readMem(++location);
      this.pc += 2;
      break;
    case 43:
      this.decIY();
      break;
    case 44:
      this.iyL = this.inc8(this.iyL);
      break;
    case 45:
      this.iyL = this.dec8(this.iyL);
      break;
    case 46:
      this.iyL = this.readMem(this.pc++);
      break;
    case 52:
      this.incMem(this.getIY() + this.d_());
      this.pc++;
      break;
    case 53:
      this.decMem(this.getIY() + this.d_());
      this.pc++;
      break;
    case 54:
      this.writeMem(this.getIY() + this.d_(), this.readMem(++this.pc));
      this.pc++;
      break;
    case 57:
      this.setIY(this.add16(this.getIY(), this.sp));
      break;
    case 68:
      this.b = this.iyH;
      break;
    case 69:
      this.b = this.iyL;
      break;
    case 70:
      this.b = this.readMem(this.getIY() + this.d_());
      this.pc++;
      break;
    case 76:
      this.c = this.iyH;
      break;
    case 77:
      this.c = this.iyL;
      break;
    case 78:
      this.c = this.readMem(this.getIY() + this.d_());
      this.pc++;
      break;
    case 84:
      this.d = this.iyH;
      break;
    case 85:
      this.d = this.iyL;
      break;
    case 86:
      this.d = this.readMem(this.getIY() + this.d_());
      this.pc++;
      break;
    case 92:
      this.e = this.iyH;
      break;
    case 93:
      this.e = this.iyL;
      break;
    case 94:
      this.e = this.readMem(this.getIY() + this.d_());
      this.pc++;
      break;
    case 96:
      this.iyH = this.b;
      break;
    case 97:
      this.iyH = this.c;
      break;
    case 98:
      this.iyH = this.d;
      break;
    case 99:
      this.iyH = this.e;
      break;
    case 100:
      break;
    case 101:
      this.iyH = this.iyL;
      break;
    case 102:
      this.h = this.readMem(this.getIY() + this.d_());
      this.pc++;
      break;
    case 103:
      this.iyH = this.a;
      break;
    case 104:
      this.iyL = this.b;
      break;
    case 105:
      this.iyL = this.c;
      break;
    case 106:
      this.iyL = this.d;
      break;
    case 107:
      this.iyL = this.e;
      break;
    case 108:
      this.iyL = this.iyH;
      break;
    case 109:
      break;
    case 110:
      this.l = this.readMem(this.getIY() + this.d_());
      this.pc++;
      break;
    case 111:
      this.iyL = this.a;
      break;
    case 112:
      this.writeMem(this.getIY() + this.d_(), this.b);
      this.pc++;
      break;
    case 113:
      this.writeMem(this.getIY() + this.d_(), this.c);
      this.pc++;
      break;
    case 114:
      this.writeMem(this.getIY() + this.d_(), this.d);
      this.pc++;
      break;
    case 115:
      this.writeMem(this.getIY() + this.d_(), this.e);
      this.pc++;
      break;
    case 116:
      this.writeMem(this.getIY() + this.d_(), this.h);
      this.pc++;
      break;
    case 117:
      this.writeMem(this.getIY() + this.d_(), this.l);
      this.pc++;
      break;
    case 119:
      this.writeMem(this.getIY() + this.d_(), this.a);
      this.pc++;
      break;
    case 124:
      this.a = this.iyH;
      break;
    case 125:
      this.a = this.iyL;
      break;
    case 126:
      this.a = this.readMem(this.getIY() + this.d_());
      this.pc++;
      break;
    case 132:
      this.add_a(this.iyH);
      break;
    case 133:
      this.add_a(this.iyL);
      break;
    case 134:
      this.add_a(this.readMem(this.getIY() + this.d_()));
      this.pc++;
      break;
    case 140:
      this.adc_a(this.iyH);
      break;
    case 141:
      this.adc_a(this.iyL);
      break;
    case 142:
      this.adc_a(this.readMem(this.getIY() + this.d_()));
      this.pc++;
      break;
    case 148:
      this.sub_a(this.iyH);
      break;
    case 149:
      this.sub_a(this.iyL);
      break;
    case 150:
      this.sub_a(this.readMem(this.getIY() + this.d_()));
      this.pc++;
      break;
    case 156:
      this.sbc_a(this.iyH);
      break;
    case 157:
      this.sbc_a(this.iyL);
      break;
    case 158:
      this.sbc_a(this.readMem(this.getIY() + this.d_()));
      this.pc++;
      break;
    case 164:
      this.f = this.SZP_TABLE[this.a &= this.iyH] | F_HALFCARRY;
      break;
    case 165:
      this.f = this.SZP_TABLE[this.a &= this.iyL] | F_HALFCARRY;
      break;
    case 166:
      this.f = this.SZP_TABLE[this.a &= this.readMem(this.getIY() + this.d_())] | F_HALFCARRY;
      this.pc++;
      break;
    case 172:
      this.f = this.SZP_TABLE[this.a ^= this.iyH];
      break;
    case 173:
      this.f = this.SZP_TABLE[this.a ^= this.iyL];
      break;
    case 174:
      this.f = this.SZP_TABLE[this.a ^= this.readMem(this.getIY() + this.d_())];
      this.pc++;
      break;
    case 180:
      this.f = this.SZP_TABLE[this.a |= this.iyH];
      break;
    case 181:
      this.f = this.SZP_TABLE[this.a |= this.iyL];
      break;
    case 182:
      this.f = this.SZP_TABLE[this.a |= this.readMem(this.getIY() + this.d_())];
      this.pc++;
      break;
    case 188:
      this.cp_a(this.iyH);
      break;
    case 189:
      this.cp_a(this.iyL);
      break;
    case 190:
      this.cp_a(this.readMem(this.getIY() + this.d_()));
      this.pc++;
      break;
    case 203:
      this.doIndexCB(this.getIY());
      break;
    case 225:
      this.setIY(this.readMemWord(this.sp));
      this.sp += 2;
      break;
    case 227:
      temp = this.getIY();
      this.setIY(this.readMemWord(this.sp));
      this.writeMem(this.sp, temp & 255);
      this.writeMem(this.sp + 1, temp >> 8);
      break;
    case 229:
      this.push2(this.iyH, this.iyL);
      break;
    case 233:
      this.pc = this.getIY();
      break;
    case 249:
      this.sp = this.getIY();
      break;
    default:
      this.pc--;
      break
  }
}, doIndexCB:function(index) {
  var location = index + this.d_() & 65535;
  var opcode = this.readMem(++this.pc);
  this.tstates -= OP_INDEX_CB_STATES[opcode];
  switch(opcode) {
    case 6:
      this.writeMem(location, this.rlc(this.readMem(location)));
      break;
    case 14:
      this.writeMem(location, this.rrc(this.readMem(location)));
      break;
    case 22:
      this.writeMem(location, this.rl(this.readMem(location)));
      break;
    case 30:
      this.writeMem(location, this.rr(this.readMem(location)));
      break;
    case 38:
      this.writeMem(location, this.sla(this.readMem(location)));
      break;
    case 46:
      this.writeMem(location, this.sra(this.readMem(location)));
      break;
    case 54:
      this.writeMem(location, this.sll(this.readMem(location)));
      break;
    case 62:
      this.writeMem(location, this.srl(this.readMem(location)));
      break;
    case 70:
      this.bit(this.readMem(location) & BIT_0);
      break;
    case 78:
      this.bit(this.readMem(location) & BIT_1);
      break;
    case 86:
      this.bit(this.readMem(location) & BIT_2);
      break;
    case 94:
      this.bit(this.readMem(location) & BIT_3);
      break;
    case 102:
      this.bit(this.readMem(location) & BIT_4);
      break;
    case 110:
      this.bit(this.readMem(location) & BIT_5);
      break;
    case 118:
      this.bit(this.readMem(location) & BIT_6);
      break;
    case 126:
      this.bit(this.readMem(location) & BIT_7);
      break;
    case 134:
      this.writeMem(location, this.readMem(location) & ~BIT_0);
      break;
    case 142:
      this.writeMem(location, this.readMem(location) & ~BIT_1);
      break;
    case 150:
      this.writeMem(location, this.readMem(location) & ~BIT_2);
      break;
    case 158:
      this.writeMem(location, this.readMem(location) & ~BIT_3);
      break;
    case 166:
      this.writeMem(location, this.readMem(location) & ~BIT_4);
      break;
    case 174:
      this.writeMem(location, this.readMem(location) & ~BIT_5);
      break;
    case 182:
      this.writeMem(location, this.readMem(location) & ~BIT_6);
      break;
    case 190:
      this.writeMem(location, this.readMem(location) & ~BIT_7);
      break;
    case 198:
      this.writeMem(location, this.readMem(location) | BIT_0);
      break;
    case 206:
      this.writeMem(location, this.readMem(location) | BIT_1);
      break;
    case 214:
      this.writeMem(location, this.readMem(location) | BIT_2);
      break;
    case 222:
      this.writeMem(location, this.readMem(location) | BIT_3);
      break;
    case 230:
      this.writeMem(location, this.readMem(location) | BIT_4);
      break;
    case 238:
      this.writeMem(location, this.readMem(location) | BIT_5);
      break;
    case 246:
      this.writeMem(location, this.readMem(location) | BIT_6);
      break;
    case 254:
      this.writeMem(location, this.readMem(location) | BIT_7);
      break;
    default:
      if(DEBUG) {
        console.log("Unimplemented DDCB or FDCB Opcode: " + (opcode & 255).toString(16))
      }
      break
  }
  this.pc++
}, doED:function(opcode) {
  var temp = 0;
  var location = 0;
  var hlmem = 0;
  this.tstates -= OP_ED_STATES[opcode];
  if(Setup.REFRESH_EMULATION) {
    this.incR()
  }
  switch(opcode) {
    case 64:
      this.b = this.port.in_(this.c);
      this.f = this.f & F_CARRY | this.SZP_TABLE[this.b];
      this.pc++;
      break;
    case 65:
      this.port.out(this.c, this.b);
      this.pc++;
      break;
    case 66:
      this.sbc16(this.getBC());
      this.pc++;
      break;
    case 67:
      location = this.readMemWord(this.pc + 1);
      this.writeMem(location++, this.c);
      this.writeMem(location, this.b);
      this.pc += 3;
      break;
    case 68:
    ;
    case 76:
    ;
    case 84:
    ;
    case 92:
    ;
    case 100:
    ;
    case 108:
    ;
    case 116:
    ;
    case 124:
      temp = this.a;
      this.a = 0;
      this.sub_a(temp);
      this.pc++;
      break;
    case 69:
    ;
    case 77:
    ;
    case 85:
    ;
    case 93:
    ;
    case 101:
    ;
    case 109:
    ;
    case 117:
    ;
    case 125:
      this.pc = this.readMemWord(this.sp);
      this.sp += 2;
      this.iff1 = this.iff2;
      break;
    case 70:
    ;
    case 78:
    ;
    case 102:
    ;
    case 110:
      this.im = 0;
      this.pc++;
      break;
    case 71:
      this.i = this.a;
      this.pc++;
      break;
    case 72:
      this.c = this.port.in_(this.c);
      this.f = this.f & F_CARRY | this.SZP_TABLE[this.c];
      this.pc++;
      break;
    case 73:
      this.port.out(this.c, this.c);
      this.pc++;
      break;
    case 74:
      this.adc16(this.getBC());
      this.pc++;
      break;
    case 75:
      location = this.readMemWord(this.pc + 1);
      this.c = this.readMem(location++);
      this.b = this.readMem(location);
      this.pc += 3;
      break;
    case 79:
      this.r = this.a;
      this.pc++;
      break;
    case 80:
      this.d = this.port.in_(this.c);
      this.f = this.f & F_CARRY | this.SZP_TABLE[this.d];
      this.pc++;
      break;
    case 81:
      this.port.out(this.c, this.d);
      this.pc++;
      break;
    case 82:
      this.sbc16(this.getDE());
      this.pc++;
      break;
    case 83:
      location = this.readMemWord(this.pc + 1);
      this.writeMem(location++, this.e);
      this.writeMem(location, this.d);
      this.pc += 3;
      break;
    case 86:
    ;
    case 118:
      this.im = 1;
      this.pc++;
      break;
    case 87:
      this.a = this.i;
      this.f = this.f & F_CARRY | this.SZ_TABLE[this.a] | (this.iff2 ? F_PARITY : 0);
      this.pc++;
      break;
    case 88:
      this.e = this.port.in_(this.c);
      this.f = this.f & F_CARRY | this.SZP_TABLE[this.e];
      this.pc++;
      break;
    case 89:
      this.port.out(this.c, this.e);
      this.pc++;
      break;
    case 90:
      this.adc16(this.getDE());
      this.pc++;
      break;
    case 91:
      location = this.readMemWord(this.pc + 1);
      this.e = this.readMem(location++);
      this.d = this.readMem(location);
      this.pc += 3;
      break;
    case 95:
      this.a = Setup.REFRESH_EMULATION ? this.r : JSSMS.Utils.rndInt(255);
      this.f = this.f & F_CARRY | this.SZ_TABLE[this.a] | (this.iff2 ? F_PARITY : 0);
      this.pc++;
      break;
    case 96:
      this.h = this.port.in_(this.c);
      this.f = this.f & F_CARRY | this.SZP_TABLE[this.h];
      this.pc++;
      break;
    case 97:
      this.port.out(this.c, this.h);
      this.pc++;
      break;
    case 98:
      this.sbc16(this.getHL());
      this.pc++;
      break;
    case 99:
      location = this.readMemWord(this.pc + 1);
      this.writeMem(location++, this.l);
      this.writeMem(location, this.h);
      this.pc += 3;
      break;
    case 103:
      location = this.getHL();
      hlmem = this.readMem(location);
      this.writeMem(location, hlmem >> 4 | (this.a & 15) << 4);
      this.a = this.a & 240 | hlmem & 15;
      this.f = this.f & F_CARRY | this.SZP_TABLE[this.a];
      this.pc++;
      break;
    case 104:
      this.l = this.port.in_(this.c);
      this.f = this.f & F_CARRY | this.SZP_TABLE[this.l];
      this.pc++;
      break;
    case 105:
      this.port.out(this.c, this.l);
      this.pc++;
      break;
    case 106:
      this.adc16(this.getHL());
      this.pc++;
      break;
    case 107:
      location = this.readMemWord(this.pc + 1);
      this.l = this.readMem(location++);
      this.h = this.readMem(location);
      this.pc += 3;
      break;
    case 111:
      location = this.getHL();
      hlmem = this.readMem(location);
      this.writeMem(location, (hlmem & 15) << 4 | this.a & 15);
      this.a = this.a & 240 | hlmem >> 4;
      this.f = this.f & F_CARRY | this.SZP_TABLE[this.a];
      this.pc++;
      break;
    case 113:
      this.port.out(this.c, 0);
      this.pc++;
      break;
    case 114:
      this.sbc16(this.sp);
      this.pc++;
      break;
    case 115:
      location = this.readMemWord(this.pc + 1);
      this.writeMem(location++, this.sp & 255);
      this.writeMem(location, this.sp >> 8);
      this.pc += 3;
      break;
    case 120:
      this.a = this.port.in_(this.c);
      this.f = this.f & F_CARRY | this.SZP_TABLE[this.a];
      this.pc++;
      break;
    case 121:
      this.port.out(this.c, this.a);
      this.pc++;
      break;
    case 122:
      this.adc16(this.sp);
      this.pc++;
      break;
    case 123:
      this.sp = this.readMemWord(this.readMemWord(this.pc + 1));
      this.pc += 3;
      break;
    case 160:
      this.writeMem(this.getDE(), this.readMem(this.getHL()));
      this.incDE();
      this.incHL();
      this.decBC();
      this.f = this.f & 193 | (this.getBC() != 0 ? F_PARITY : 0);
      this.pc++;
      break;
    case 161:
      temp = this.f & F_CARRY | F_NEGATIVE;
      this.cp_a(this.readMem(this.getHL()));
      this.incHL();
      this.decBC();
      temp |= this.getBC() == 0 ? 0 : F_PARITY;
      this.f = this.f & 248 | temp;
      this.pc++;
      break;
    case 162:
      temp = this.port.in_(this.c);
      this.writeMem(this.getHL(), temp);
      this.b = this.dec8(this.b);
      this.incHL();
      if((temp & 128) == 128) {
        this.f |= F_NEGATIVE
      }else {
        this.f &= ~F_NEGATIVE
      }
      this.pc++;
      break;
    case 163:
      temp = this.readMem(this.getHL());
      this.port.out(this.c, temp);
      this.incHL();
      this.b = this.dec8(this.b);
      if(this.l + temp > 255) {
        this.f |= F_CARRY;
        this.f |= F_HALFCARRY
      }else {
        this.f &= ~F_CARRY;
        this.f &= ~F_HALFCARRY
      }
      if((temp & 128) == 128) {
        this.f |= F_NEGATIVE
      }else {
        this.f &= ~F_NEGATIVE
      }
      this.pc++;
      break;
    case 168:
      this.writeMem(this.getDE(), this.readMem(this.getHL()));
      this.decDE();
      this.decHL();
      this.decBC();
      this.f = this.f & 193 | (this.getBC() != 0 ? F_PARITY : 0);
      this.pc++;
      break;
    case 169:
      temp = this.f & F_CARRY | F_NEGATIVE;
      this.cp_a(this.readMem(this.getHL()));
      this.decHL();
      this.decBC();
      temp |= this.getBC() == 0 ? 0 : F_PARITY;
      this.f = this.f & 248 | temp;
      this.pc++;
      break;
    case 170:
      temp = this.port.in_(this.c);
      this.writeMem(this.getHL(), temp);
      this.b = this.dec8(this.b);
      this.decHL();
      if((temp & 128) != 0) {
        this.f |= F_NEGATIVE
      }else {
        this.f &= ~F_NEGATIVE
      }
      this.pc++;
      break;
    case 171:
      temp = this.readMem(this.getHL());
      this.port.out(this.c, temp);
      this.decHL();
      this.b = this.dec8(this.b);
      if(this.l + temp > 255) {
        this.f |= F_CARRY;
        this.f |= F_HALFCARRY
      }else {
        this.f &= ~F_CARRY;
        this.f &= ~F_HALFCARRY
      }
      if((temp & 128) == 128) {
        this.f |= F_NEGATIVE
      }else {
        this.f &= ~F_NEGATIVE
      }
      this.pc++;
      break;
    case 176:
      this.writeMem(this.getDE(), this.readMem(this.getHL()));
      this.incDE();
      this.incHL();
      this.decBC();
      if(this.getBC() != 0) {
        this.f |= F_PARITY;
        this.tstates -= 5;
        this.pc--
      }else {
        this.f &= ~F_PARITY;
        this.pc++
      }
      this.f &= ~F_NEGATIVE;
      this.f &= ~F_HALFCARRY;
      break;
    case 177:
      temp = this.f & F_CARRY | F_NEGATIVE;
      this.cp_a(this.readMem(this.getHL()));
      this.incHL();
      this.decBC();
      temp |= this.getBC() == 0 ? 0 : F_PARITY;
      if((temp & F_PARITY) != 0 && (this.f & F_ZERO) == 0) {
        this.tstates -= 5;
        this.pc--
      }else {
        this.pc++
      }
      this.f = this.f & 248 | temp;
      break;
    case 178:
      temp = this.port.in_(this.c);
      this.writeMem(this.getHL(), temp);
      this.b = this.dec8(this.b);
      this.incHL();
      if(this.b != 0) {
        this.tstates -= 5;
        this.pc--
      }else {
        this.pc++
      }
      if((temp & 128) == 128) {
        this.f |= F_NEGATIVE
      }else {
        this.f &= ~F_NEGATIVE
      }
      break;
    case 179:
      temp = this.readMem(this.getHL());
      this.port.out(this.c, temp);
      this.b = this.dec8(this.b);
      this.incHL();
      if(this.b != 0) {
        this.tstates -= 5;
        this.pc--
      }else {
        this.pc++
      }
      if(this.l + temp > 255) {
        this.f |= F_CARRY;
        this.f |= F_HALFCARRY
      }else {
        this.f &= ~F_CARRY;
        this.f &= ~F_HALFCARRY
      }
      if((temp & 128) != 0) {
        this.f |= F_NEGATIVE
      }else {
        this.f &= ~F_NEGATIVE
      }
      break;
    case 184:
      this.writeMem(this.getDE(), this.readMem(this.getHL()));
      this.decDE();
      this.decHL();
      this.decBC();
      if(this.getBC() != 0) {
        this.f |= F_PARITY;
        this.tstates -= 5;
        this.pc--
      }else {
        this.f &= ~F_PARITY;
        this.pc++
      }
      this.f &= ~F_NEGATIVE;
      this.f &= ~F_HALFCARRY;
      break;
    case 185:
      temp = this.f & F_CARRY | F_NEGATIVE;
      this.cp_a(this.readMem(this.getHL()));
      this.decHL();
      this.decBC();
      temp |= this.getBC() == 0 ? 0 : F_PARITY;
      if((temp & F_PARITY) != 0 && (this.f & F_ZERO) == 0) {
        this.tstates -= 5;
        this.pc--
      }else {
        this.pc++
      }
      this.f = this.f & 248 | temp;
      break;
    case 186:
      temp = this.port.in_(this.c);
      this.writeMem(this.getHL(), temp);
      this.b = this.dec8(this.b);
      this.decHL();
      if(this.b != 0) {
        this.tstates -= 5;
        this.pc--
      }else {
        this.pc++
      }
      if((temp & 128) != 0) {
        this.f |= F_NEGATIVE
      }else {
        this.f &= ~F_NEGATIVE
      }
      break;
    case 187:
      temp = this.readMem(this.getHL());
      this.port.out(this.c, temp);
      this.b = this.dec8(this.b);
      this.decHL();
      if(this.b != 0) {
        this.tstates -= 5;
        this.pc--
      }else {
        this.pc++
      }
      if(this.l + temp > 255) {
        this.f |= F_CARRY;
        this.f |= F_HALFCARRY
      }else {
        this.f &= ~F_CARRY;
        this.f &= ~F_HALFCARRY
      }
      if((temp & 128) != 0) {
        this.f |= F_NEGATIVE
      }else {
        this.f &= ~F_NEGATIVE
      }
      break;
    default:
      if(DEBUG) {
        console.log("Unimplemented ED Opcode: " + opcode.toString(16))
      }
      this.pc++;
      break
  }
}, generateDAATable:function() {
  var i, c, h, n;
  i = 256;
  while(i--) {
    for(c = 0;c <= 1;c++) {
      for(h = 0;h <= 1;h++) {
        for(n = 0;n <= 1;n++) {
          this.DAA_TABLE[c << 8 | n << 9 | h << 10 | i] = this.getDAAResult(i, c | n << 1 | h << 4)
        }
      }
    }
  }
  this.a = this.f = 0
}, getDAAResult:function(value, flags) {
  this.a = value;
  this.f = flags;
  var a_copy = this.a;
  var correction = 0;
  var carry = flags & F_CARRY;
  var carry_copy = carry;
  if((flags & F_HALFCARRY) != 0 || (a_copy & 15) > 9) {
    correction |= 6
  }
  if(carry == 1 || a_copy > 159 || a_copy > 143 && (a_copy & 15) > 9) {
    correction |= 96;
    carry_copy = 1
  }
  if(a_copy > 153) {
    carry_copy = 1
  }
  if((flags & F_NEGATIVE) != 0) {
    this.sub_a(correction)
  }else {
    this.add_a(correction)
  }
  flags = this.f & 254 | carry_copy;
  if(this.getParity(this.a)) {
    flags = flags & 251 | F_PARITY
  }else {
    flags = flags & 251
  }
  return this.a | flags << 8
}, add_a:function(value) {
  var temp = this.a + value & 255;
  this.f = this.SZHVC_ADD_TABLE[this.a << 8 | temp];
  this.a = temp
}, adc_a:function(value) {
  var carry = this.f & F_CARRY;
  var temp = this.a + value + carry & 255;
  this.f = this.SZHVC_ADD_TABLE[carry << 16 | this.a << 8 | temp];
  this.a = temp
}, sub_a:function(value) {
  var temp = this.a - value & 255;
  this.f = this.SZHVC_SUB_TABLE[this.a << 8 | temp];
  this.a = temp
}, sbc_a:function(value) {
  var carry = this.f & F_CARRY;
  var temp = this.a - value - carry & 255;
  this.f = this.SZHVC_SUB_TABLE[carry << 16 | this.a << 8 | temp];
  this.a = temp
}, cp_a:function(value) {
  this.f = this.SZHVC_SUB_TABLE[this.a << 8 | this.a - value & 255]
}, cpl_a:function() {
  this.a ^= 255;
  this.f |= F_NEGATIVE | F_HALFCARRY
}, rra_a:function() {
  var carry = this.a & 1;
  this.a = (this.a >> 1 | (this.f & F_CARRY) << 7) & 255;
  this.f = this.f & 236 | carry
}, rla_a:function() {
  var carry = this.a >> 7;
  this.a = (this.a << 1 | this.f & F_CARRY) & 255;
  this.f = this.f & 236 | carry
}, rlca_a:function() {
  var carry = this.a >> 7;
  this.a = this.a << 1 & 255 | carry;
  this.f = this.f & 236 | carry
}, rrca_a:function() {
  var carry = this.a & 1;
  this.a = this.a >> 1 | carry << 7;
  this.f = this.f & 236 | carry
}, getBC:function() {
  return this.b << 8 | this.c
}, getDE:function() {
  return this.d << 8 | this.e
}, getHL:function() {
  return this.h << 8 | this.l
}, getIX:function() {
  return this.ixH << 8 | this.ixL
}, getIY:function() {
  return this.iyH << 8 | this.iyL
}, setBC:function(value) {
  this.b = value >> 8;
  this.c = value & 255
}, setDE:function(value) {
  this.d = value >> 8;
  this.e = value & 255
}, setHL:function(value) {
  this.h = value >> 8;
  this.l = value & 255
}, setIX:function(value) {
  this.ixH = value >> 8;
  this.ixL = value & 255
}, setIY:function(value) {
  this.iyH = value >> 8;
  this.iyL = value & 255
}, incBC:function() {
  this.c = this.c + 1 & 255;
  if(this.c == 0) {
    this.b = this.b + 1 & 255
  }
}, incDE:function() {
  this.e = this.e + 1 & 255;
  if(this.e == 0) {
    this.d = this.d + 1 & 255
  }
}, incHL:function() {
  this.l = this.l + 1 & 255;
  if(this.l == 0) {
    this.h = this.h + 1 & 255
  }
}, incIX:function() {
  this.ixL = this.ixL + 1 & 255;
  if(this.ixL == 0) {
    this.ixH = this.ixH + 1 & 255
  }
}, incIY:function() {
  this.iyL = this.iyL + 1 & 255;
  if(this.iyL == 0) {
    this.iyH = this.iyH + 1 & 255
  }
}, decBC:function() {
  this.c = this.c - 1 & 255;
  if(this.c == 255) {
    this.b = this.b - 1 & 255
  }
}, decDE:function() {
  this.e = this.e - 1 & 255;
  if(this.e == 255) {
    this.d = this.d - 1 & 255
  }
}, decHL:function() {
  this.l = this.l - 1 & 255;
  if(this.l == 255) {
    this.h = this.h - 1 & 255
  }
}, decIX:function() {
  this.ixL = this.ixL - 1 & 255;
  if(this.ixL == 255) {
    this.ixH = this.ixH - 1 & 255
  }
}, decIY:function() {
  this.iyL = this.iyL - 1 & 255;
  if(this.iyL == 255) {
    this.iyH = this.iyH - 1 & 255
  }
}, inc8:function(value) {
  value = value + 1 & 255;
  this.f = this.f & F_CARRY | this.SZHV_INC_TABLE[value];
  return value
}, dec8:function(value) {
  value = value - 1 & 255;
  this.f = this.f & F_CARRY | this.SZHV_DEC_TABLE[value];
  return value
}, exAF:function() {
  var temp = this.a;
  this.a = this.a2;
  this.a2 = temp;
  temp = this.f;
  this.f = this.f2;
  this.f2 = temp
}, exBC:function() {
  var temp = this.b;
  this.b = this.b2;
  this.b2 = temp;
  temp = this.c;
  this.c = this.c2;
  this.c2 = temp
}, exDE:function() {
  var temp = this.d;
  this.d = this.d2;
  this.d2 = temp;
  temp = this.e;
  this.e = this.e2;
  this.e2 = temp
}, exHL:function() {
  var temp = this.h;
  this.h = this.h2;
  this.h2 = temp;
  temp = this.l;
  this.l = this.l2;
  this.l2 = temp
}, add16:function(reg, value) {
  var result = reg + value;
  this.f = this.f & 196 | (reg ^ result ^ value) >> 8 & 16 | result >> 16 & 1;
  return result & 65535
}, adc16:function(value) {
  var hl = this.h << 8 | this.l;
  var result = hl + value + (this.f & F_CARRY);
  this.f = (hl ^ result ^ value) >> 8 & 16 | result >> 16 & 1 | result >> 8 & 128 | ((result & 65535) != 0 ? 0 : 64) | ((value ^ hl ^ 32768) & (value ^ result) & 32768) >> 13;
  this.h = result >> 8 & 255;
  this.l = result & 255
}, sbc16:function(value) {
  var hl = this.h << 8 | this.l;
  var result = hl - value - (this.f & F_CARRY);
  this.f = (hl ^ result ^ value) >> 8 & 16 | 2 | result >> 16 & 1 | result >> 8 & 128 | ((result & 65535) != 0 ? 0 : 64) | ((value ^ hl) & (hl ^ result) & 32768) >> 13;
  this.h = result >> 8 & 255;
  this.l = result & 255
}, incR:function() {
  this.r = this.r & 128 | this.r + 1 & 127
}, generateFlagTables:function() {
  var i, sf, zf, yf, xf, pf;
  var padd, padc, psub, psbc;
  var val, oldval, newval;
  for(i = 0;i < 256;i++) {
    sf = (i & 128) != 0 ? F_SIGN : 0;
    zf = i == 0 ? F_ZERO : 0;
    yf = i & 32;
    xf = i & 8;
    pf = this.getParity(i) ? F_PARITY : 0;
    this.SZ_TABLE[i] = sf | zf | yf | xf;
    this.SZP_TABLE[i] = sf | zf | yf | xf | pf;
    this.SZHV_INC_TABLE[i] = sf | zf | yf | xf;
    this.SZHV_INC_TABLE[i] |= i == 128 ? F_OVERFLOW : 0;
    this.SZHV_INC_TABLE[i] |= (i & 15) == 0 ? F_HALFCARRY : 0;
    this.SZHV_DEC_TABLE[i] = sf | zf | yf | xf | F_NEGATIVE;
    this.SZHV_DEC_TABLE[i] |= i == 127 ? F_OVERFLOW : 0;
    this.SZHV_DEC_TABLE[i] |= (i & 15) == 15 ? F_HALFCARRY : 0;
    this.SZ_BIT_TABLE[i] = i != 0 ? i & 128 : F_ZERO | F_PARITY;
    this.SZ_BIT_TABLE[i] |= yf | xf | F_HALFCARRY
  }
  padd = 0 * 256;
  padc = 256 * 256;
  psub = 0 * 256;
  psbc = 256 * 256;
  for(oldval = 0;oldval < 256;oldval++) {
    for(newval = 0;newval < 256;newval++) {
      val = newval - oldval;
      if(newval != 0) {
        if((newval & 128) != 0) {
          this.SZHVC_ADD_TABLE[padd] = F_SIGN
        }else {
          this.SZHVC_ADD_TABLE[padd] = 0
        }
      }else {
        this.SZHVC_ADD_TABLE[padd] = F_ZERO
      }
      this.SZHVC_ADD_TABLE[padd] |= newval & (F_BIT5 | F_BIT3);
      if((newval & 15) < (oldval & 15)) {
        this.SZHVC_ADD_TABLE[padd] |= F_HALFCARRY
      }
      if(newval < oldval) {
        this.SZHVC_ADD_TABLE[padd] |= F_CARRY
      }
      if(((val ^ oldval ^ 128) & (val ^ newval) & 128) != 0) {
        this.SZHVC_ADD_TABLE[padd] |= F_OVERFLOW
      }
      padd++;
      val = newval - oldval - 1;
      if(newval != 0) {
        if((newval & 128) != 0) {
          this.SZHVC_ADD_TABLE[padc] = F_SIGN
        }else {
          this.SZHVC_ADD_TABLE[padc] = 0
        }
      }else {
        this.SZHVC_ADD_TABLE[padc] = F_ZERO
      }
      this.SZHVC_ADD_TABLE[padc] |= newval & (F_BIT5 | F_BIT3);
      if((newval & 15) <= (oldval & 15)) {
        this.SZHVC_ADD_TABLE[padc] |= F_HALFCARRY
      }
      if(newval <= oldval) {
        this.SZHVC_ADD_TABLE[padc] |= F_CARRY
      }
      if(((val ^ oldval ^ 128) & (val ^ newval) & 128) != 0) {
        this.SZHVC_ADD_TABLE[padc] |= F_OVERFLOW
      }
      padc++;
      val = oldval - newval;
      if(newval != 0) {
        if((newval & 128) != 0) {
          this.SZHVC_SUB_TABLE[psub] = F_NEGATIVE | F_SIGN
        }else {
          this.SZHVC_SUB_TABLE[psub] = F_NEGATIVE
        }
      }else {
        this.SZHVC_SUB_TABLE[psub] = F_NEGATIVE | F_ZERO
      }
      this.SZHVC_SUB_TABLE[psub] |= newval & (F_BIT5 | F_BIT3);
      if((newval & 15) > (oldval & 15)) {
        this.SZHVC_SUB_TABLE[psub] |= F_HALFCARRY
      }
      if(newval > oldval) {
        this.SZHVC_SUB_TABLE[psub] |= F_CARRY
      }
      if(((val ^ oldval) & (oldval ^ newval) & 128) != 0) {
        this.SZHVC_SUB_TABLE[psub] |= F_OVERFLOW
      }
      psub++;
      val = oldval - newval - 1;
      if(newval != 0) {
        if((newval & 128) != 0) {
          this.SZHVC_SUB_TABLE[psbc] = F_NEGATIVE | F_SIGN
        }else {
          this.SZHVC_SUB_TABLE[psbc] = F_NEGATIVE
        }
      }else {
        this.SZHVC_SUB_TABLE[psbc] = F_NEGATIVE | F_ZERO
      }
      this.SZHVC_SUB_TABLE[psbc] |= newval & (F_BIT5 | F_BIT3);
      if((newval & 15) >= (oldval & 15)) {
        this.SZHVC_SUB_TABLE[psbc] |= F_HALFCARRY
      }
      if(newval >= oldval) {
        this.SZHVC_SUB_TABLE[psbc] |= F_CARRY
      }
      if(((val ^ oldval) & (oldval ^ newval) & 128) != 0) {
        this.SZHVC_SUB_TABLE[psbc] |= F_OVERFLOW
      }
      psbc++
    }
  }
}, getParity:function(value) {
  var parity = true;
  var j;
  for(j = 0;j < 8;j++) {
    if((value & 1 << j) != 0) {
      parity = !parity
    }
  }
  return parity
}, getDummyWrite:function() {
  return JSSMS.Utils.Array(Setup.PAGE_SIZE)
}, generateMemory:function() {
  for(var i = 0;i < 65;i++) {
    this.memReadMap[i] = JSSMS.Utils.Array(Setup.PAGE_SIZE);
    this.memWriteMap[i] = JSSMS.Utils.Array(Setup.PAGE_SIZE)
  }
  for(i = 0;i < 8;i++) {
    this.ram[i] = JSSMS.Utils.Array(Setup.PAGE_SIZE)
  }
  if(this.sram == null) {
    this.sram = JSSMS.Utils.Array(32);
    this.useSRAM = false
  }
  this.memReadMap[64] = this.getDummyWrite();
  this.memWriteMap[64] = this.getDummyWrite();
  this.number_of_pages = 2
}, resetMemory:function(p) {
  if(p != null) {
    this.rom = p
  }
  this.frameReg[0] = 0;
  this.frameReg[1] = 0;
  this.frameReg[2] = 1;
  this.frameReg[3] = 0;
  if(this.rom != null) {
    this.number_of_pages = this.rom.length / 16;
    this.setDefaultMemoryMapping()
  }else {
    this.number_of_pages = 0
  }
  this.hitCounts = new Array(this.number_of_pages * Setup.PAGE_SIZE);
  for(var i = 0;i < this.number_of_pages * Setup.PAGE_SIZE;i++) {
    this.hitCounts[i] = 0
  }
}, setDefaultMemoryMapping:function() {
  for(var i = 0;i < 48;i++) {
    this.memReadMap[i] = JSSMS.Utils.copyArray(this.rom[i & 31]);
    this.memWriteMap[i] = this.getDummyWrite()
  }
  for(i = 48;i < 64;i++) {
    this.memReadMap[i] = this.ram[i & 7];
    this.memWriteMap[i] = this.ram[i & 7]
  }
}, d_:function() {
  return this.readMem(this.pc)
}, page:function(address, value) {
  var p, i, offset;
  this.frameReg[address] = value;
  switch(address) {
    case 0:
      if((value & 8) != 0) {
        offset = (value & 4) << 2;
        for(i = 32;i < 48;i++) {
          this.memReadMap[i] = JSSMS.Utils.copyArray(this.sram[offset]);
          this.memWriteMap[i] = JSSMS.Utils.copyArray(this.sram[offset]);
          offset++
        }
        this.useSRAM = true
      }else {
        p = this.frameReg[3] % this.number_of_pages << 4;
        for(i = 32;i < 48;i++) {
          this.memReadMap[i] = JSSMS.Utils.copyArray(this.rom[p++]);
          this.memWriteMap[i] = this.getDummyWrite()
        }
      }
      break;
    case 1:
      p = (value % this.number_of_pages << 4) + 1;
      for(i = 1;i < 16;i++) {
        this.memReadMap[i] = JSSMS.Utils.copyArray(this.rom[p++])
      }
      break;
    case 2:
      p = value % this.number_of_pages << 4;
      for(i = 16;i < 32;i++) {
        this.memReadMap[i] = JSSMS.Utils.copyArray(this.rom[p++])
      }
      break;
    case 3:
      if((this.frameReg[0] & 8) == 0) {
        p = value % this.number_of_pages << 4;
        for(i = 32;i < 48;i++) {
          this.memReadMap[i] = JSSMS.Utils.copyArray(this.rom[p++])
        }
      }
      break
  }
}, hasUsedSRAM:function() {
  return this.useSRAM
}, setSRAM:function(bytes) {
  var length = bytes.length / Setup.PAGE_SIZE;
  var i;
  for(i = 0;i < length;i++) {
    JSSMS.Utils.copyArrayElements(bytes, i * Setup.PAGE_SIZE, this.sram[i], 0, Setup.PAGE_SIZE)
  }
}, setStateMem:function(state) {
  this.frameReg = state;
  this.setDefaultMemoryMapping();
  this.page(3, this.frameReg[3]);
  this.page(2, this.frameReg[2]);
  this.page(1, this.frameReg[1]);
  this.page(0, this.frameReg[0])
}, getState:function() {
  var STATE_LENGTH = 8;
  var state = new Array(STATE_LENGTH);
  state[0] = this.pc | this.sp << 16;
  state[1] = (this.iff1 ? 1 : 0) | (this.iff2 ? 2 : 0) | (this.halt ? 4 : 0) | (this.EI_inst ? 8 : 0) | (this.interruptLine ? 16 : 0);
  state[2] = this.a | this.a2 << 8 | this.f << 16 | this.f2 << 24;
  state[3] = this.getBC() | this.getDE() << 16;
  state[4] = this.getHL() | this.r << 16 | this.i << 24;
  state[5] = this.getIX() | this.getIY() << 16;
  this.exBC();
  this.exDE();
  this.exHL();
  state[6] = this.getBC() | this.getDE() << 16;
  state[7] = this.getHL() | this.im << 16 | this.interruptVector << 24;
  this.exBC();
  this.exDE();
  this.exHL();
  return state
}, setState:function(state) {
  var temp = state[0];
  this.pc = temp & 65535;
  this.sp = temp >> 16 & 65535;
  temp = state[1];
  this.iff1 = (temp & 1) != 0;
  this.iff2 = (temp & 2) != 0;
  this.halt = (temp & 4) != 0;
  this.EI_inst = (temp & 8) != 0;
  this.interruptLine = (temp & 16) != 0;
  temp = state[2];
  this.a = temp & 255;
  this.a2 = temp >> 8 & 255;
  this.f = temp >> 16 & 255;
  this.f2 = temp >> 24 & 255;
  temp = state[3];
  this.setBC(temp & 65535);
  this.setDE(temp >> 16 & 65535);
  temp = state[4];
  this.setHL(temp & 65535);
  this.r = temp >> 16 & 255;
  this.i = temp >> 24 & 255;
  temp = state[5];
  this.setIX(temp & 65535);
  this.setIY(temp >> 16 & 65535);
  this.exBC();
  this.exDE();
  this.exHL();
  temp = state[6];
  this.setBC(temp & 65535);
  this.setDE(temp >> 16 & 65535);
  temp = state[7];
  this.setHL(temp & 65535);
  this.im = temp >> 16 & 255;
  this.interruptVector = temp >> 24 & 255;
  this.exBC();
  this.exDE();
  this.exHL()
}};
var KEY_UP = 1;
var KEY_DOWN = 2;
var KEY_LEFT = 4;
var KEY_RIGHT = 8;
var KEY_FIRE1 = 16;
var KEY_FIRE2 = 32;
var KEY_START = 64;
JSSMS.Keyboard = function(sms) {
  this.main = sms;
  this.controller1 = 0;
  this.controller2 = 0;
  this.ggstart = 0;
  this.lightgunX = 0;
  this.lightgunY = 0;
  this.lightgunClick = false;
  this.lightgunEnabled = false
};
JSSMS.Keyboard.prototype = {reset:function() {
  this.controller1 = 255;
  this.controller2 = 255;
  this.ggstart = 255;
  if(Setup.LIGHTGUN) {
    this.lightgunClick = false
  }
  this.pause_button = false
}, keydown:function(evt) {
  switch(evt.keyCode) {
    case 38:
      this.controller1 &= ~KEY_UP;
      break;
    case 40:
      this.controller1 &= ~KEY_DOWN;
      break;
    case 37:
      this.controller1 &= ~KEY_LEFT;
      break;
    case 39:
      this.controller1 &= ~KEY_RIGHT;
      break;
    case 88:
      this.controller1 &= ~KEY_FIRE1;
      break;
    case 90:
      this.controller1 &= ~KEY_FIRE2;
      break;
    case 13:
      if(this.main.is_sms) {
        this.main.pause_button = true
      }else {
        this.ggstart &= ~128
      }
      break;
    case 104:
      this.controller2 &= ~KEY_UP;
      break;
    case 98:
      this.controller2 &= ~KEY_DOWN;
      break;
    case 100:
      this.controller2 &= ~KEY_LEFT;
      break;
    case 102:
      this.controller2 &= ~KEY_RIGHT;
      break;
    case 103:
      this.controller2 &= ~KEY_FIRE1;
      break;
    case 105:
      this.controller2 &= ~KEY_FIRE2;
      break;
    case 97:
      this.controller2 &= ~KEY_START;
      break;
    default:
      return
  }
  evt.preventDefault()
}, keyup:function(evt) {
  switch(evt.keyCode) {
    case 38:
      this.controller1 |= KEY_UP;
      break;
    case 40:
      this.controller1 |= KEY_DOWN;
      break;
    case 37:
      this.controller1 |= KEY_LEFT;
      break;
    case 39:
      this.controller1 |= KEY_RIGHT;
      break;
    case 88:
      this.controller1 |= KEY_FIRE1;
      break;
    case 90:
      this.controller1 |= KEY_FIRE2;
      break;
    case 13:
      if(!this.main.is_sms) {
        this.ggstart |= 128
      }
      break;
    case 104:
      this.controller2 |= KEY_UP;
      break;
    case 98:
      this.controller2 |= KEY_DOWN;
      break;
    case 100:
      this.controller2 |= KEY_LEFT;
      break;
    case 102:
      this.controller2 |= KEY_RIGHT;
      break;
    case 103:
      this.controller2 |= KEY_FIRE1;
      break;
    case 105:
      this.controller2 |= KEY_FIRE2;
      break;
    case 97:
      this.controller2 |= KEY_START;
      break;
    default:
      return
  }
  evt.preventDefault()
}};
var SCALE = 8;
var NO_ANTIALIAS = Number.MIN_VALUE;
var SHIFT_RESET = 32768;
var FEEDBACK_PATTERN = 9;
var PSG_VOLUME = [25, 20, 16, 13, 10, 8, 6, 5, 4, 3, 3, 2, 2, 1, 1, 0];
var HI_BOUNDARY = 127;
var LO_BOUNDARY = -128;
JSSMS.SN76489 = function(sms) {
  this.main = sms;
  this.clock = 0;
  this.clockFrac = 0;
  this.reg = new Array(8);
  this.regLatch = 0;
  this.freqCounter = new Array(4);
  this.freqPolarity = new Array(4);
  this.freqPos = new Array(3);
  this.noiseFreq = 16;
  this.noiseShiftReg = SHIFT_RESET;
  this.outputChannel = new Array(4)
};
JSSMS.SN76489.prototype = {init:function(clockSpeed, sampleRate) {
  this.clock = (clockSpeed << SCALE) / 16 / sampleRate;
  this.clockFrac = 0;
  this.regLatch = 0;
  this.noiseFreq = 16;
  this.noiseShiftReg = SHIFT_RESET;
  for(var i = 0;i < 4;i++) {
    this.reg[i << 1] = 1;
    this.reg[(i << 1) + 1] = 15;
    this.freqCounter[i] = 0;
    this.freqPolarity[i] = 1;
    if(i != 3) {
      this.freqPos[i] = NO_ANTIALIAS
    }
  }
}, write:function(value) {
  if((value & 128) != 0) {
    this.regLatch = value >> 4 & 7;
    this.reg[this.regLatch] = this.reg[this.regLatch] & 1008 | value & 15
  }else {
    if(this.regLatch == 0 || this.regLatch == 2 || this.regLatch == 4) {
      this.reg[this.regLatch] = this.reg[this.regLatch] & 15 | (value & 63) << 4
    }else {
      this.reg[this.regLatch] = value & 15
    }
  }
  switch(this.regLatch) {
    case 0:
    ;
    case 2:
    ;
    case 4:
      if(this.reg[this.regLatch] == 0) {
        this.reg[this.regLatch] = 1
      }
      break;
    case 6:
      this.noiseFreq = 16 << (this.reg[6] & 3);
      this.noiseShiftReg = SHIFT_RESET;
      break
  }
}, update:function(offset, samplesToGenerate) {
  var buffer = [];
  var sample = 0;
  var i = 0;
  for(;sample < samplesToGenerate;sample++) {
    for(i = 0;i < 3;i++) {
      if(this.freqPos[i] != NO_ANTIALIAS) {
        this.outputChannel[i] = PSG_VOLUME[this.reg[(i << 1) + 1]] * this.freqPos[i] >> SCALE
      }else {
        this.outputChannel[i] = PSG_VOLUME[this.reg[(i << 1) + 1]] * this.freqPolarity[i]
      }
    }
    this.outputChannel[3] = PSG_VOLUME[this.reg[7]] * (this.noiseShiftReg & 1) << 1;
    var output = this.outputChannel[0] + this.outputChannel[1] + this.outputChannel[2] + this.outputChannel[3];
    if(output > HI_BOUNDARY) {
      output = HI_BOUNDARY
    }else {
      if(output < LO_BOUNDARY) {
        output = LO_BOUNDARY
      }
    }
    buffer[offset + sample] = output;
    this.clockFrac += this.clock;
    var clockCycles = this.clockFrac >> SCALE;
    var clockCyclesScaled = clockCycles << SCALE;
    this.clockFrac -= clockCyclesScaled;
    this.freqCounter[0] -= clockCycles;
    this.freqCounter[1] -= clockCycles;
    this.freqCounter[2] -= clockCycles;
    if(this.noiseFreq == 128) {
      this.freqCounter[3] = this.freqCounter[2]
    }else {
      this.freqCounter[3] -= clockCycles
    }
    for(i = 0;i < 3;i++) {
      var counter = this.freqCounter[i];
      if(counter <= 0) {
        var tone = this.reg[i << 1];
        if(tone > 6) {
          this.freqPos[i] = (clockCyclesScaled - this.clockFrac + (2 << SCALE) * counter << SCALE) * this.freqPolarity[i] / (clockCyclesScaled + this.clockFrac);
          this.freqPolarity[i] = -this.freqPolarity[i]
        }else {
          this.freqPolarity[i] = 1;
          this.freqPos[i] = NO_ANTIALIAS
        }
        this.freqCounter[i] += tone * (clockCycles / tone + 1)
      }else {
        this.freqPos[i] = NO_ANTIALIAS
      }
    }
    if(this.freqCounter[3] <= 0) {
      this.freqPolarity[3] = -this.freqPolarity[3];
      if(this.noiseFreq != 128) {
        this.freqCounter[3] += this.noiseFreq * (clockCycles / this.noiseFreq + 1)
      }
      if(this.freqPolarity[3] == 1) {
        var feedback = 0;
        if((this.reg[6] & 4) != 0) {
          feedback = (this.noiseShiftReg & FEEDBACK_PATTERN) != 0 && (this.noiseShiftReg & FEEDBACK_PATTERN ^ FEEDBACK_PATTERN) != 0 ? 1 : 0
        }else {
          feedback = this.noiseShiftReg & 1
        }
        this.noiseShiftReg = this.noiseShiftReg >> 1 | feedback << 15
      }
    }
  }
  return buffer
}};
var NTSC = 0;
var PAL = 1;
var SMS_X_PIXELS = 342;
var SMS_Y_PIXELS_NTSC = 262;
var SMS_Y_PIXELS_PAL = 313;
var SMS_WIDTH = 256;
var SMS_HEIGHT = 192;
var GG_WIDTH = 160;
var GG_HEIGHT = 144;
var GG_X_OFFSET = 48;
var GG_Y_OFFSET = 24;
var STATUS_VINT = 128;
var STATUS_OVERFLOW = 64;
var STATUS_COLLISION = 32;
var STATUS_HINT = 4;
var BGT_LENGTH = 32 * 28 * 2;
var SPRITES_PER_LINE = 8;
var SPRITE_COUNT = 0;
var SPRITE_X = 1;
var SPRITE_Y = 2;
var SPRITE_N = 3;
var TOTAL_TILES = 512;
var TILE_SIZE = 8;
JSSMS.Vdp = function(sms) {
  this.main = sms;
  var i;
  this.videoMode = NTSC;
  this.VRAM = new Array(16384);
  this.CRAM = new Array(32 * 3);
  for(i = 0;i < 32 * 3;i++) {
    this.CRAM[i] = 255
  }
  this.vdpreg = new Array(16);
  this.status = 0;
  this.firstByte = false;
  this.commandByte = 0;
  this.location = 0;
  this.operation = 0;
  this.readBuffer = 0;
  this.line = 0;
  this.counter = 0;
  this.bgPriority = new Array(SMS_WIDTH);
  if(Setup.VDP_SPRITE_COLLISIONS) {
    this.spriteCol = new Array(SMS_WIDTH)
  }
  this.bgt = 0;
  this.vScrollLatch = 0;
  this.display = sms.ui.canvasImageData.data;
  this.main_JAVA = new Array(64);
  this.GG_JAVA1 = new Array(256);
  this.GG_JAVA2 = new Array(16);
  this.isPalConverted = false;
  this.h_start = 0;
  this.h_end = 0;
  this.sat = 0;
  this.isSatDirty = false;
  this.lineSprites = new Array(SMS_HEIGHT);
  for(i = 0;i < SMS_HEIGHT;i++) {
    this.lineSprites[i] = new Array(1 + 3 * SPRITES_PER_LINE)
  }
  this.tiles = new Array(TOTAL_TILES);
  this.isTileDirty = new Array(TOTAL_TILES);
  this.minDirty = 0;
  this.maxDirty = 0;
  this.createCachedImages()
};
JSSMS.Vdp.prototype = {reset:function() {
  var i;
  this.isPalConverted = false;
  this.generateConvertedPals();
  this.firstByte = true;
  this.location = 0;
  this.counter = 0;
  this.status = 0;
  this.operation = 0;
  for(i = 0;i < 16;i++) {
    this.vdpreg[i] = 0
  }
  this.vdpreg[2] = 14;
  this.vdpreg[5] = 126;
  this.vScrollLatch = 0;
  this.main.cpu.interruptLine = false;
  this.isSatDirty = true;
  this.minDirty = TOTAL_TILES;
  this.maxDirty = -1;
  for(i = 0;i < 16384;i++) {
    this.VRAM[i] = 0
  }
  for(i = 0;i < SMS_WIDTH * SMS_HEIGHT * 4;i = i + 4) {
    this.display[i] = 0;
    this.display[i + 1] = 0;
    this.display[i + 2] = 0;
    this.display[i + 3] = 255
  }
}, forceFullRedraw:function() {
  this.bgt = (this.vdpreg[2] & 15 & ~1) << 10;
  this.minDirty = 0;
  this.maxDirty = TOTAL_TILES - 1;
  for(var i = 0, l = this.isTileDirty.length;i < l;i++) {
    this.isTileDirty[i] = true
  }
  this.sat = (this.vdpreg[5] & ~1 & ~128) << 7;
  this.isSatDirty = true
}, getVCount:function() {
  if(this.videoMode == NTSC) {
    if(this.line > 218) {
      return this.line - 6
    }
  }else {
    if(this.line > 242) {
      return this.line - 57
    }
  }
  return this.line
}, controlRead:function() {
  this.firstByte = true;
  var statuscopy = this.status;
  this.status = 0;
  this.main.cpu.interruptLine = false;
  return statuscopy
}, controlWrite:function(value) {
  if(this.firstByte) {
    this.firstByte = false;
    this.commandByte = value;
    this.location = this.location & 16128 | value
  }else {
    this.firstByte = true;
    this.operation = value >> 6 & 3;
    this.location = this.commandByte | value << 8;
    if(this.operation == 0) {
      this.readBuffer = this.VRAM[this.location++ & 16383] & 255
    }else {
      if(this.operation == 2) {
        var reg = value & 15;
        switch(reg) {
          case 0:
            if(Setup.ACCURATE_INTERRUPT_EMULATION && (this.status & STATUS_HINT) != 0) {
              this.main.cpu.interruptLine = (this.commandByte & 16) != 0
            }
            break;
          case 1:
            if((this.status & STATUS_VINT) != 0 && (this.commandByte & 32) != 0) {
              this.main.cpu.interruptLine = true
            }
            if((this.commandByte & 3) != (this.vdpreg[reg] & 3)) {
              this.isSatDirty = true
            }
            break;
          case 2:
            this.bgt = (this.commandByte & 15 & ~1) << 10;
            break;
          case 5:
            var old = this.sat;
            this.sat = (this.commandByte & ~1 & ~128) << 7;
            if(old != this.sat) {
              this.isSatDirty = true;
              DEBUG && console.log("New address written to SAT: " + old + " -> " + this.sat)
            }
            break
        }
        this.vdpreg[reg] = this.commandByte
      }
    }
  }
}, dataRead:function() {
  this.firstByte = true;
  var value = this.readBuffer;
  this.readBuffer = this.VRAM[this.location++ & 16383] & 255;
  return value
}, dataWrite:function(value) {
  var temp = 0;
  this.firstByte = true;
  switch(this.operation) {
    case 0:
    ;
    case 1:
    ;
    case 2:
      var address = this.location & 16383;
      if(value != (this.VRAM[address] & 255)) {
        if(address >= this.sat && address < this.sat + 64) {
          this.isSatDirty = true
        }else {
          if(address >= this.sat + 128 && address < this.sat + 256) {
            this.isSatDirty = true
          }else {
            var tileIndex = address >> 5;
            this.isTileDirty[tileIndex] = true;
            if(tileIndex < this.minDirty) {
              this.minDirty = tileIndex
            }
            if(tileIndex > this.maxDirty) {
              this.maxDirty = tileIndex
            }
          }
        }
        this.VRAM[address] = value
      }
      break;
    case 3:
      if(this.main.is_sms) {
        temp = (this.location & 31) * 3;
        this.CRAM[temp] = this.main_JAVA[value & 63] & 255;
        this.CRAM[temp + 1] = this.main_JAVA[value & 63] >> 8 & 255;
        this.CRAM[temp + 2] = this.main_JAVA[value & 63] >> 16 & 255
      }else {
        if(this.main.is_gg) {
          temp = ((this.location & 63) >> 1) * 3;
          if((this.location & 1) == 0) {
            this.CRAM[temp] = this.GG_JAVA1[value] & 255;
            this.CRAM[temp + 1] = this.GG_JAVA1[value] >> 8 & 255
          }else {
            this.CRAM[temp + 2] = this.GG_JAVA2[value & 15] >> 16 & 255
          }
        }
      }
      break
  }
  if(ACCURATE) {
    this.readBuffer = value
  }
  this.location++
}, interrupts:function(lineno) {
  if(lineno <= 192) {
    if(!Setup.ACCURATE_INTERRUPT_EMULATION && lineno == 192) {
      this.status |= STATUS_VINT
    }
    if(this.counter == 0) {
      this.counter = this.vdpreg[10];
      this.status |= STATUS_HINT
    }else {
      this.counter--
    }
    if((this.status & STATUS_HINT) != 0 && (this.vdpreg[0] & 16) != 0) {
      this.main.cpu.interruptLine = true
    }
  }else {
    this.counter = this.vdpreg[10];
    if((this.status & STATUS_VINT) != 0 && (this.vdpreg[1] & 32) != 0 && lineno < 224) {
      this.main.cpu.interruptLine = true
    }
    if(ACCURATE && lineno == this.main.no_of_scanlines - 1) {
      this.vScrollLatch = this.vdpreg[9]
    }
  }
}, setVBlankFlag:function() {
  this.status |= STATUS_VINT
}, drawLine:function(lineno) {
  var i = 0;
  var temp = 0;
  var temp2 = 0;
  if(this.main.is_gg) {
    if(lineno < GG_Y_OFFSET || lineno >= GG_Y_OFFSET + GG_HEIGHT) {
      return
    }
  }
  if(Setup.VDP_SPRITE_COLLISIONS) {
    i = SMS_WIDTH;
    while(i--) {
      this.spriteCol[i] = false
    }
  }
  if((this.vdpreg[1] & 64) != 0) {
    if(this.maxDirty != -1) {
      this.decodeTiles()
    }
    this.drawBg(lineno);
    if(this.isSatDirty) {
      this.decodeSat()
    }
    if(this.lineSprites[lineno][SPRITE_COUNT] != 0) {
      this.drawSprite(lineno)
    }
    if(this.main.is_sms && (this.vdpreg[0] & 32) != 0) {
      var location = lineno << 8;
      if(16 + (this.vdpreg[7] & 15) > 32) {
        debugger
      }
      if(location > SMS_WIDTH * SMS_HEIGHT) {
        debugger
      }
      temp = location * 4;
      temp2 = (16 + (this.vdpreg[7] & 15)) * 3;
      for(i = 0;i < 8;i++) {
        this.display[temp + i] = this.CRAM[temp2];
        this.display[temp + i + 1] = this.CRAM[temp2];
        this.display[temp + i + 2] = this.CRAM[temp2]
      }
    }
  }else {
    this.drawBGColour(lineno)
  }
}, drawBg:function(lineno) {
  var pixX = 0;
  var colour = 0;
  var temp = 0;
  var temp2 = 0;
  var hscroll = this.vdpreg[8];
  var vscroll = ACCURATE ? this.vScrollLatch : this.vdpreg[9];
  if(lineno < 16 && (this.vdpreg[0] & 64) != 0) {
    hscroll = 0
  }
  var lock = this.vdpreg[0] & 128;
  var tile_column = 32 - (hscroll >> 3) + this.h_start;
  var tile_row = lineno + vscroll >> 3;
  if(tile_row > 27) {
    tile_row -= 28
  }
  var tile_y = (lineno + (vscroll & 7) & 7) << 3;
  var row_precal = lineno << 8;
  for(var tx = this.h_start;tx < this.h_end;tx++) {
    var tile_props = this.bgt + ((tile_column & 31) << 1) + (tile_row << 6);
    var secondbyte = this.VRAM[tile_props + 1];
    var pal = (secondbyte & 8) << 1;
    var sx = (tx << 3) + (hscroll & 7);
    var pixY = (secondbyte & 4) == 0 ? tile_y : (7 << 3) - tile_y;
    var tile = this.tiles[(this.VRAM[tile_props] & 255) + ((secondbyte & 1) << 8)];
    if((secondbyte & 2) == 0) {
      for(pixX = 0;pixX < 8 && sx < SMS_WIDTH;pixX++, sx++) {
        colour = tile[pixX + pixY];
        temp = (sx + row_precal) * 4;
        temp2 = (colour + pal) * 3;
        this.bgPriority[sx] = (secondbyte & 16) != 0 && colour != 0;
        this.display[temp] = this.CRAM[temp2];
        this.display[temp + 1] = this.CRAM[temp2 + 1];
        this.display[temp + 2] = this.CRAM[temp2 + 2]
      }
    }else {
      for(pixX = 7;pixX >= 0 && sx < SMS_WIDTH;pixX--, sx++) {
        colour = tile[pixX + pixY];
        temp = (sx + row_precal) * 4;
        temp2 = (colour + pal) * 3;
        this.bgPriority[sx] = (secondbyte & 16) != 0 && colour != 0;
        this.display[temp] = this.CRAM[temp2];
        this.display[temp + 1] = this.CRAM[temp2 + 1];
        this.display[temp + 2] = this.CRAM[temp2 + 2]
      }
    }
    tile_column++;
    if(lock != 0 && tx == 23) {
      tile_row = lineno >> 3;
      tile_y = (lineno & 7) << 3
    }
  }
}, drawSprite:function(lineno) {
  var colour = 0;
  var temp = 0;
  var temp2 = 0;
  var sprites = this.lineSprites[lineno];
  var count = Math.min(SPRITES_PER_LINE, sprites[SPRITE_COUNT]);
  var zoomed = this.vdpreg[1] & 1;
  var row_precal = lineno << 8;
  var off = count * 3;
  var i = count;
  while(i--) {
    var n = sprites[off--] | (this.vdpreg[6] & 4) << 6;
    var y = sprites[off--];
    var x = sprites[off--] - (this.vdpreg[0] & 8);
    var tileRow = lineno - y >> zoomed;
    if((this.vdpreg[1] & 2) != 0) {
      n &= ~1
    }
    var tile = this.tiles[n + ((tileRow & 8) >> 3)];
    var pix = 0;
    if(x < 0) {
      pix = -x;
      x = 0
    }
    var offset = pix + ((tileRow & 7) << 3);
    if(zoomed == 0) {
      for(;pix < 8 && x < SMS_WIDTH;pix++, x++) {
        colour = tile[offset++];
        if(colour != 0 && !this.bgPriority[x]) {
          temp = (x + row_precal) * 4;
          temp2 = (colour + 16) * 3;
          this.display[temp] = this.CRAM[temp2];
          this.display[temp + 1] = this.CRAM[temp2 + 1];
          this.display[temp + 2] = this.CRAM[temp2 + 2];
          if(Setup.VDP_SPRITE_COLLISIONS) {
            if(!this.spriteCol[x]) {
              this.spriteCol[x] = true
            }else {
              this.status |= STATUS_COLLISION
            }
          }
        }
      }
    }else {
      for(;pix < 8 && x < SMS_WIDTH;pix++, x += 2) {
        colour = tile[offset++];
        if(colour != 0 && !this.bgPriority[x]) {
          temp = (x + row_precal) * 4;
          temp2 = (colour + 16) * 3;
          this.display[temp] = this.CRAM[temp2];
          this.display[temp + 1] = this.CRAM[temp2 + 1];
          this.display[temp + 2] = this.CRAM[temp2 + 2];
          if(Setup.VDP_SPRITE_COLLISIONS) {
            if(!this.spriteCol[x]) {
              this.spriteCol[x] = true
            }else {
              this.status |= STATUS_COLLISION
            }
          }
        }
        if(colour != 0 && !this.bgPriority[x + 1]) {
          temp = (x + row_precal + 1) * 4;
          temp2 = (colour + 16) * 3;
          this.display[temp] = this.CRAM[temp2];
          this.display[temp + 1] = this.CRAM[temp2 + 1];
          this.display[temp + 2] = this.CRAM[temp2 + 2];
          if(Setup.VDP_SPRITE_COLLISIONS) {
            if(!this.spriteCol[x + 1]) {
              this.spriteCol[x + 1] = true
            }else {
              this.status |= STATUS_COLLISION
            }
          }
        }
      }
    }
  }
  if(sprites[SPRITE_COUNT] >= SPRITES_PER_LINE) {
    this.status |= STATUS_OVERFLOW
  }
}, drawBGColour:function(lineno) {
  var row_precal = lineno << 8;
  var temp = 0;
  var temp2 = (16 + (this.vdpreg[7] & 15)) * 3;
  var i = 0;
  for(;i < SMS_WIDTH * 4;i++) {
    temp = row_precal * 4;
    this.display[temp] = this.CRAM[temp2];
    this.display[temp + 1] = this.CRAM[temp2 + 1];
    this.display[temp + 2] = this.CRAM[temp2 + 2];
    row_precal++
  }
}, generateConvertedPals:function() {
  var i;
  var r, g, b;
  if(this.main.is_sms && !this.isPalConverted) {
    for(i = 0;i < 64;i++) {
      r = i & 3;
      g = i >> 2 & 3;
      b = i >> 4 & 3;
      this.main_JAVA[i] = r * 85 | g * 85 << 8 | b * 85 << 16;
      this.isPalConverted = true
    }
  }else {
    if(this.main.is_gg && !this.isPalConverted) {
      for(i = 0;i < 256;i++) {
        g = i & 15;
        b = i >> 4 & 15;
        this.GG_JAVA1[i] = b << 12 | b << 8 | g << 4 | g
      }
      for(i = 0;i < 16;i++) {
        this.GG_JAVA2[i] = i << 20
      }
      this.isPalConverted = true
    }
  }
}, createCachedImages:function() {
  for(var i = 0;i < TOTAL_TILES;i++) {
    this.tiles[i] = new Array(TILE_SIZE * TILE_SIZE)
  }
}, decodeTiles:function() {
  DEBUG && console.log("[" + this.line + "]" + " min dirty:" + this.minDirty + " max: " + this.maxDirty);
  for(var i = this.minDirty;i <= this.maxDirty;i++) {
    if(!this.isTileDirty[i]) {
      continue
    }
    this.isTileDirty[i] = false;
    DEBUG && console.log("tile " + i + " is dirty");
    var tile = this.tiles[i];
    var pixel_index = 0;
    var address = i << 5;
    for(var y = 0;y < TILE_SIZE;y++) {
      var address0 = this.VRAM[address++];
      var address1 = this.VRAM[address++];
      var address2 = this.VRAM[address++];
      var address3 = this.VRAM[address++];
      for(var bit = 128;bit != 0;bit >>= 1) {
        var colour = 0;
        if((address0 & bit) != 0) {
          colour |= 1
        }
        if((address1 & bit) != 0) {
          colour |= 2
        }
        if((address2 & bit) != 0) {
          colour |= 4
        }
        if((address3 & bit) != 0) {
          colour |= 8
        }
        tile[pixel_index++] = colour
      }
    }
  }
  this.minDirty = TOTAL_TILES;
  this.maxDirty = -1
}, decodeSat:function() {
  this.isSatDirty = false;
  for(var i = 0;i < this.lineSprites.length;i++) {
    this.lineSprites[i][SPRITE_COUNT] = 0
  }
  var height = (this.vdpreg[1] & 2) == 0 ? 8 : 16;
  if((this.vdpreg[1] & 1) == 1) {
    height <<= 1
  }
  for(var spriteno = 0;spriteno < 64;spriteno++) {
    var y = this.VRAM[this.sat + spriteno] & 255;
    if(y == 208) {
      return
    }
    y++;
    if(y > 240) {
      y -= 256
    }
    for(var lineno = 0;lineno < SMS_HEIGHT;lineno++) {
      if(lineno >= y && lineno - y < height) {
        var sprites = this.lineSprites[lineno];
        if(sprites[SPRITE_COUNT] < SPRITES_PER_LINE) {
          var off = sprites[SPRITE_COUNT] * 3 + SPRITE_X;
          var address = this.sat + (spriteno << 1) + 128;
          sprites[off++] = this.VRAM[address++] & 255;
          sprites[off++] = y;
          sprites[off++] = this.VRAM[address] & 255;
          sprites[SPRITE_COUNT]++
        }
      }
    }
  }
}, getState:function() {
  var state = new Array(3 + 16 + 32);
  state[0] = this.videoMode | this.status << 8 | (this.firstByte ? 1 << 16 : 0) | this.commandByte << 24;
  state[1] = this.location | this.operation << 16 | this.readBuffer << 24;
  state[2] = this.counter | this.vScrollLatch << 8 | this.line << 16;
  JSSMS.Utils.copyArrayElements(this.vdpreg, 0, state, 3, 16);
  JSSMS.Utils.copyArrayElements(this.CRAM, 0, state, 3 + 16, 32 * 3);
  return state
}, setState:function(state) {
  var temp = state[0];
  this.videoMode = temp & 255;
  this.status = temp >> 8 & 255;
  this.firstByte = (temp >> 16 & 255) != 0;
  this.commandByte = temp >> 24 & 255;
  temp = state[1];
  this.location = temp & 65535;
  this.operation = temp >> 16 & 255;
  this.readBuffer = temp >> 24 & 255;
  temp = state[2];
  this.counter = temp & 255;
  this.vScrollLatch = temp >> 8 & 255;
  this.line = temp >> 16 & 65535;
  JSSMS.Utils.copyArrayElements(state, 3, this.vdpreg, 0, 16);
  JSSMS.Utils.copyArrayElements(state, 3 + 16, this.CRAM, 0, 32 * 3);
  this.forceFullRedraw()
}};
JSSMS.DummyUI = function(sms) {
  this.main = sms;
  this.enable = function() {
  };
  this.updateStatus = function() {
  };
  this.writeAudio = function() {
  };
  this.writeFrame = function() {
  }
};
if(typeof $ != "undefined") {
  $.fn.JSSMSUI = function(roms) {
    var parent = this;
    var UI = function(sms) {
      this.main = sms;
      if(Object.prototype.toString.call(window["operamini"]) == "[object OperaMini]") {
        $(parent).html('<div class="alert alert-error"><strong>Oh no!</strong> Your browser can\'t run this emulator. Try the latest version of Firefox, Google Chrome, Opera or Safari!</div>');
        return
      }
      var self = this;
      var root = $("<div></div>");
      var controls = $('<div class="controls"></div>');
      var fullscreenSupport = JSSMS.Utils.getPrefix(["fullscreenEnabled", "mozFullScreenEnabled", "webkitCancelFullScreen"]);
      var requestAnimationFramePrefix = JSSMS.Utils.getPrefix(["requestAnimationFrame", "msRequestAnimationFrame", "mozRequestAnimationFrame", "webkitRequestAnimationFrame", "oRequestAnimationFrame"], window);
      var i;
      if(requestAnimationFramePrefix) {
        this.requestAnimationFrame = window[requestAnimationFramePrefix].bind(window)
      }else {
        var lastTime = 0;
        this.requestAnimationFrame = function(callback) {
          var currTime = JSSMS.Utils.getTimestamp();
          var timeToCall = Math.max(0, 16 - (currTime - lastTime));
          window.setTimeout(function() {
            callback(currTime + timeToCall)
          }, timeToCall);
          lastTime = currTime + timeToCall
        }
      }
      this.zoomed = false;
      this.hiddenPrefix = JSSMS.Utils.getPrefix(["hidden", "mozHidden", "webkitHidden", "msHidden"]);
      this.screen = $("<canvas width=" + SMS_WIDTH + " height=" + SMS_HEIGHT + ' class="screen"></canvas>');
      this.canvasContext = this.screen[0].getContext("2d");
      if(!this.canvasContext.getImageData) {
        $(parent).html('<div class="alert alert-error"><strong>Oh no!</strong> Your browser doesn\'t support writing pixels directly to the <code>&lt;canvas&gt;</code> tag. Try the latest version of Firefox, Google Chrome, Opera or Safari!</div>');
        return
      }
      this.canvasImageData = this.canvasContext.getImageData(0, 0, SMS_WIDTH, SMS_HEIGHT);
      this.romContainer = $("<div></div>");
      this.romSelect = $("<select></select>");
      this.romSelect.change(function() {
        self.loadROM()
      });
      this.buttons = {start:$('<input type="button" value="Stop" class="btn" disabled="disabled">'), restart:$('<input type="button" value="Restart" class="btn" disabled="disabled">'), sound:$('<input type="button" value="Enable sound" class="btn" disabled="disabled">'), zoom:$('<input type="button" value="Zoom in" class="btn hidden-phone">')};
      this.buttons.start.click(function() {
        if(!self.main.isRunning) {
          self.main.start();
          self.buttons.start.attr("value", "Stop")
        }else {
          self.main.stop();
          self.updateStatus("Paused");
          self.buttons.start.attr("value", "Start")
        }
      });
      this.buttons.restart.click(function() {
        if(!self.main.reloadRom()) {
          $(this).attr("disabled", "disabled");
          return
        }
        self.main.reset();
        self.main.vdp.forceFullRedraw();
        self.main.start()
      });
      this.buttons.sound.click(function() {
      });
      this.buttons.zoom.click(function() {
        if(self.zoomed) {
          self.screen.animate({width:SMS_WIDTH + "px", height:SMS_HEIGHT + "px"}, function() {
            $(this).removeAttr("style")
          });
          self.buttons.zoom.attr("value", "Zoom in")
        }else {
          self.screen.animate({width:SMS_WIDTH * 2 + "px", height:SMS_HEIGHT * 2 + "px"});
          self.buttons.zoom.attr("value", "Zoom out")
        }
        self.zoomed = !self.zoomed
      });
      if(fullscreenSupport) {
        this.buttons.fullsreen = $('<input type="button" value="Go fullscreen" class="btn">').click(function() {
          var screen = self.screen[0];
          if(screen.requestFullscreen) {
            screen.requestFullscreen()
          }else {
            if(screen.mozRequestFullScreen) {
              screen.mozRequestFullScreen()
            }else {
              screen.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT)
            }
          }
        })
      }
      for(i in this.buttons) {
        if(this.buttons.hasOwnProperty(i)) {
          this.buttons[i].appendTo(controls)
        }
      }
      this.log = $('<div id="status"></div>');
      this.screen.appendTo(root);
      this.romContainer.appendTo(root);
      controls.appendTo(root);
      this.log.appendTo(root);
      root.appendTo($(parent));
      if(roms != undefined) {
        this.setRoms(roms)
      }
      $(document).bind("keydown", function(evt) {
        self.main.keyboard.keydown(evt)
      }).bind("keyup", function(evt) {
        self.main.keyboard.keyup(evt)
      })
    };
    UI.prototype = {reset:function() {
      this.screen[0].width = SMS_WIDTH;
      this.screen[0].height = SMS_HEIGHT;
      this.log.text("")
    }, setRoms:function(roms) {
      var groupName, optgroup, length, i, count = 0;
      this.romSelect.children().remove();
      $("<option>Select a ROM...</option>").appendTo(this.romSelect);
      for(groupName in roms) {
        if(roms.hasOwnProperty(groupName)) {
          optgroup = $("<optgroup></optgroup>").attr("label", groupName);
          length = roms[groupName].length;
          i = 0;
          for(;i < length;i++) {
            $("<option>" + roms[groupName][i][0] + "</option>").attr("value", roms[groupName][i][1]).appendTo(optgroup)
          }
          optgroup.appendTo(this.romSelect)
        }
        count++
      }
      if(count) {
        this.romSelect.appendTo(this.romContainer)
      }
    }, loadROM:function() {
      var self = this;
      this.updateStatus("Downloading...");
      $.ajax({url:escape(this.romSelect.val()), xhr:function() {
        var xhr = $.ajaxSettings.xhr();
        if(xhr.overrideMimeType != undefined) {
          xhr.overrideMimeType("text/plain; charset=x-user-defined")
        }
        self.xhr = xhr;
        return xhr
      }, complete:function(xhr, status) {
        var data;
        if(status == "error") {
          self.updateStatus("The selected rom could not be loaded.");
          return
        }
        data = xhr.responseText;
        self.main.readRomDirectly(data, self.romSelect.val());
        self.main.reset();
        self.main.vdp.forceFullRedraw();
        self.main.start();
        self.enable();
        self.buttons.start.removeAttr("disabled")
      }})
    }, enable:function() {
      this.buttons.restart.removeAttr("disabled");
      if(this.main.soundEnabled) {
        this.buttons.sound.attr("value", "Disable sound")
      }else {
        this.buttons.sound.attr("value", "Enable sound")
      }
    }, updateStatus:function(s) {
      this.log.text(s)
    }, writeAudio:function(buffer) {
    }, writeFrame:function(buffer, prevBuffer) {
      if(this.hiddenPrefix && document[this.hiddenPrefix]) {
        return
      }
      this.canvasContext.putImageData(this.canvasImageData, 0, 0)
    }};
    return UI
  }
}
;var IO_TR_DIRECTION = 0;
var IO_TH_DIRECTION = 1;
var IO_TR_OUTPUT = 2;
var IO_TH_OUTPUT = 3;
var IO_TH_INPUT = 4;
var PORT_A = 0;
var PORT_B = 5;
JSSMS.Ports = function(sms) {
  this.main = sms;
  this.vdp = sms.vdp;
  this.psg = sms.psg;
  this.keyboard = sms.keyboard;
  this.europe = 64;
  this.hCounter = 0;
  this.ioPorts = []
};
JSSMS.Ports.prototype = {reset:function() {
  if(Setup.LIGHTGUN) {
    this.ioPorts = new Array(10);
    this.ioPorts[PORT_A + IO_TH_INPUT] = 1;
    this.ioPorts[PORT_B + IO_TH_INPUT] = 1
  }else {
    this.ioPorts = new Array(2)
  }
}, out:function(port, value) {
  if(this.main.is_gg && port < 7) {
    return
  }
  switch(port & 193) {
    case 1:
      if(Setup.LIGHTGUN) {
        this.oldTH = this.getTH(PORT_A) != 0 || this.getTH(PORT_B) != 0;
        this.writePort(PORT_A, value);
        this.writePort(PORT_B, value >> 2);
        if(!this.oldTH && (this.getTH(PORT_A) != 0 || this.getTH(PORT_B) != 0)) {
          this.hCounter = this.getHCount()
        }
      }else {
        this.ioPorts[0] = (value & 32) << 1;
        this.ioPorts[1] = value & 128;
        if(this.europe == 0) {
          this.ioPorts[0] = ~this.ioPorts[0];
          this.ioPorts[1] = ~this.ioPorts[1]
        }
      }
      break;
    case 128:
      this.vdp.dataWrite(value);
      break;
    case 129:
      this.vdp.controlWrite(value);
      break;
    case 64:
    ;
    case 65:
      if(this.main.soundEnabled) {
        this.psg.write(value)
      }
      break
  }
}, in_:function(port) {
  if(this.main.is_gg && port < 7) {
    switch(port) {
      case 0:
        return this.keyboard.ggstart & 191 | this.europe;
      case 1:
      ;
      case 2:
      ;
      case 3:
      ;
      case 4:
      ;
      case 5:
        return 0;
      case 6:
        return 255
    }
  }
  switch(port & 193) {
    case 64:
      return this.vdp.getVCount();
    case 65:
      return this.hCounter;
    case 128:
      return this.vdp.dataRead();
    case 129:
      return this.vdp.controlRead();
    case 192:
      return this.keyboard.controller1;
    case 193:
      if(Setup.LIGHTGUN) {
        if(this.keyboard.lightgunClick) {
          this.lightPhaserSync()
        }
        return this.keyboard.controller2 & 63 | (this.getTH(PORT_A) != 0 ? 64 : 0) | (this.getTH(PORT_B) != 0 ? 128 : 0)
      }else {
        return this.keyboard.controller2 & 63 | this.ioPorts[0] | this.ioPorts[1]
      }
  }
  return 255
}, writePort:function(index, value) {
  this.ioPorts[index + IO_TR_DIRECTION] = value & 1;
  this.ioPorts[index + IO_TH_DIRECTION] = value & 2;
  this.ioPorts[index + IO_TR_OUTPUT] = value & 16;
  this.ioPorts[index + IO_TH_OUTPUT] = this.europe == 0 ? ~value & 32 : value & 32
}, getTH:function(index) {
  return this.ioPorts[index + IO_TH_DIRECTION] == 0 ? this.ioPorts[index + IO_TH_OUTPUT] : this.ioPorts[index + IO_TH_INPUT]
}, setTH:function(index, on) {
  this.ioPorts[index + IO_TH_DIRECTION] = 1;
  this.ioPorts[index + IO_TH_INPUT] = on ? 1 : 0
}, getHCount:function() {
  var pixels = Math.round(this.main.cpu.getCycle() * SMS_X_PIXELS / this.main.cyclesPerLine);
  var v = pixels - 8 >> 1;
  if(v > 147) {
    v += 233 - 148
  }
  return v & 255
}, X_RANGE:48, Y_RANGE:4, lightPhaserSync:function() {
  var oldTH = this.getTH(PORT_A);
  var hc = this.getHCount();
  var dx = this.keyboard.lightgunX - (hc << 1);
  var dy = this.keyboard.lightgunY - this.vdp.line;
  if(dy > -this.Y_RANGE && dy < this.Y_RANGE && dx > -this.X_RANGE && dx < this.X_RANGE) {
    this.setTH(PORT_A, false);
    if(oldTH != this.getTH(PORT_A)) {
      this.hCounter = 20 + (this.keyboard.lightgunX >> 1)
    }
  }else {
    this.setTH(PORT_A, true);
    if(oldTH != this.getTH(PORT_A)) {
      this.hCounter = hc
    }
  }
}, setDomestic:function(value) {
  this.europe = value ? 64 : 0
}, isDomestic:function() {
  return this.europe != 0
}};

