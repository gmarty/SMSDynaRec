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
'use strict';var $JSCompiler_alias_VOID$$ = void 0, $JSCompiler_alias_TRUE$$ = !0, $JSCompiler_alias_NULL$$ = null, $JSCompiler_alias_FALSE$$ = !1;
function $JSCompiler_emptyFn$$() {
  return function() {
  }
}
var $SUPPORT_DATAVIEW$$ = !(!window.DataView || !window.ArrayBuffer);
function $JSSMS$$($opts$$) {
  this.$opts$ = {ui:$JSSMS$DummyUI$$, swfPath:"lib/"};
  if($opts$$ != $JSCompiler_alias_VOID$$) {
    for(var $key$$16$$ in this.$opts$) {
      $opts$$[$key$$16$$] != $JSCompiler_alias_VOID$$ && (this.$opts$[$key$$16$$] = $opts$$[$key$$16$$])
    }
  }
  this.$keyboard$ = new $JSSMS$Keyboard$$(this);
  this.$ui$ = new $opts$$.ui(this);
  this.$vdp$ = new $JSSMS$Vdp$$(this);
  this.$psg$ = new $JSSMS$SN76489$$(this);
  this.ports = new $JSSMS$Ports$$(this);
  this.$cpu$ = new $JSSMS$Z80$$(this);
  this.$ui$.updateStatus("Ready to load a ROM.")
}
$JSSMS$$.prototype = {$isRunning$:$JSCompiler_alias_FALSE$$, $cyclesPerLine$:0, $no_of_scanlines$:0, $frameSkip$:0, $fps$:0, $frameskip_counter$:0, $pause_button$:$JSCompiler_alias_FALSE$$, $is_sms$:$JSCompiler_alias_TRUE$$, $is_gg$:$JSCompiler_alias_FALSE$$, $soundEnabled$:$JSCompiler_alias_TRUE$$, $audioBuffer$:[], $audioBufferOffset$:0, $samplesPerFrame$:0, $samplesPerLine$:[], $emuWidth$:0, $emuHeight$:0, $fpsFrameCount$:0, $z80Time$:0, $drawTime$:0, $z80TimeCounter$:0, $drawTimeCounter$:0, $frameCount$:0, 
$romData$:"", $romFileName$:"", reset:function $$JSSMS$$$$reset$() {
  var $i$$inline_14_mode$$inline_12$$ = this.$vdp$.$videoMode$, $clockSpeedHz$$inline_13_v$$inline_15$$ = 0;
  0 == $i$$inline_14_mode$$inline_12$$ || this.$is_gg$ ? (this.$fps$ = 60, this.$no_of_scanlines$ = 262, $clockSpeedHz$$inline_13_v$$inline_15$$ = 3579545) : 1 == $i$$inline_14_mode$$inline_12$$ && (this.$fps$ = 50, this.$no_of_scanlines$ = 313, $clockSpeedHz$$inline_13_v$$inline_15$$ = 3546893);
  this.$cyclesPerLine$ = Math.round($clockSpeedHz$$inline_13_v$$inline_15$$ / this.$fps$ / this.$no_of_scanlines$ + 1);
  this.$vdp$.$videoMode$ = $i$$inline_14_mode$$inline_12$$;
  if(this.$soundEnabled$) {
    this.$psg$.$init$($clockSpeedHz$$inline_13_v$$inline_15$$, 44100);
    this.$samplesPerFrame$ = Math.round(44100 / this.$fps$);
    if(0 == this.$audioBuffer$.length || this.$audioBuffer$.length != this.$samplesPerFrame$) {
      this.$audioBuffer$ = Array(this.$samplesPerFrame$)
    }
    if(0 == this.$samplesPerLine$.length || this.$samplesPerLine$.length != this.$no_of_scanlines$) {
      this.$samplesPerLine$ = Array(this.$no_of_scanlines$);
      for(var $fractional$$inline_16$$ = 0, $i$$inline_14_mode$$inline_12$$ = 0;$i$$inline_14_mode$$inline_12$$ < this.$no_of_scanlines$;$i$$inline_14_mode$$inline_12$$++) {
        $clockSpeedHz$$inline_13_v$$inline_15$$ = (this.$samplesPerFrame$ << 16) / this.$no_of_scanlines$ + $fractional$$inline_16$$, $fractional$$inline_16$$ = $clockSpeedHz$$inline_13_v$$inline_15$$ - ($clockSpeedHz$$inline_13_v$$inline_15$$ >> 16 << 16), this.$samplesPerLine$[$i$$inline_14_mode$$inline_12$$] = $clockSpeedHz$$inline_13_v$$inline_15$$ >> 16
      }
    }
  }
  this.$frameCount$ = 0;
  this.$frameskip_counter$ = this.$frameSkip$;
  this.$keyboard$.reset();
  this.$ui$.reset();
  this.$vdp$.reset();
  this.ports.reset();
  this.$cpu$.reset();
  $JSCompiler_StaticMethods_resetMemory$$(this.$cpu$, $JSCompiler_alias_NULL$$)
}, start:function $$JSSMS$$$$start$() {
  var $self$$1$$ = this;
  this.$isRunning$ || (this.$isRunning$ = $JSCompiler_alias_TRUE$$);
  this.$ui$.requestAnimationFrame(this.frame.bind(this), this.$ui$.screen);
  this.$lastFpsTime$ = $JSCompiler_alias_NULL$$;
  this.$fpsFrameCount$ = 0;
  $JSCompiler_StaticMethods_printFps$$(this);
  this.$fpsInterval$ = setInterval(function() {
    $JSCompiler_StaticMethods_printFps$$($self$$1$$)
  }, 500)
}, stop:function $$JSSMS$$$$stop$() {
  clearInterval(this.$fpsInterval$);
  this.$isRunning$ = $JSCompiler_alias_FALSE$$
}, frame:function $$JSSMS$$$$frame$() {
  if(this.$isRunning$) {
    var $JSCompiler_StaticMethods_nmi$self$$inline_160_JSCompiler_inline_result$$5_lineno$$inline_22$$;
    var $JSCompiler_StaticMethods_interrupts$self$$inline_157_line$$inline_147_samplesToGenerate$$inline_148_startTime$$inline_21$$ = 0;
    for($JSCompiler_StaticMethods_nmi$self$$inline_160_JSCompiler_inline_result$$5_lineno$$inline_22$$ = 0;$JSCompiler_StaticMethods_nmi$self$$inline_160_JSCompiler_inline_result$$5_lineno$$inline_22$$ < this.$no_of_scanlines$;$JSCompiler_StaticMethods_nmi$self$$inline_160_JSCompiler_inline_result$$5_lineno$$inline_22$$++) {
      $JSCompiler_StaticMethods_interrupts$self$$inline_157_line$$inline_147_samplesToGenerate$$inline_148_startTime$$inline_21$$ = $JSSMS$Utils$getTimestamp$$();
      $JSCompiler_StaticMethods_run$$(this.$cpu$, this.$cyclesPerLine$);
      this.$z80TimeCounter$ += $JSSMS$Utils$getTimestamp$$() - $JSCompiler_StaticMethods_interrupts$self$$inline_157_line$$inline_147_samplesToGenerate$$inline_148_startTime$$inline_21$$;
      this.$soundEnabled$ && ($JSCompiler_StaticMethods_interrupts$self$$inline_157_line$$inline_147_samplesToGenerate$$inline_148_startTime$$inline_21$$ = $JSCompiler_StaticMethods_nmi$self$$inline_160_JSCompiler_inline_result$$5_lineno$$inline_22$$, 0 == $JSCompiler_StaticMethods_interrupts$self$$inline_157_line$$inline_147_samplesToGenerate$$inline_148_startTime$$inline_21$$ && (this.$audioBufferOffset$ = 0), $JSCompiler_StaticMethods_interrupts$self$$inline_157_line$$inline_147_samplesToGenerate$$inline_148_startTime$$inline_21$$ = 
      this.$samplesPerLine$[$JSCompiler_StaticMethods_interrupts$self$$inline_157_line$$inline_147_samplesToGenerate$$inline_148_startTime$$inline_21$$], this.$audioBuffer$ = this.$psg$.update(this.$audioBufferOffset$, $JSCompiler_StaticMethods_interrupts$self$$inline_157_line$$inline_147_samplesToGenerate$$inline_148_startTime$$inline_21$$), this.$audioBufferOffset$ += $JSCompiler_StaticMethods_interrupts$self$$inline_157_line$$inline_147_samplesToGenerate$$inline_148_startTime$$inline_21$$);
      this.$vdp$.$line$ = $JSCompiler_StaticMethods_nmi$self$$inline_160_JSCompiler_inline_result$$5_lineno$$inline_22$$;
      if(0 == this.$frameskip_counter$ && 192 > $JSCompiler_StaticMethods_nmi$self$$inline_160_JSCompiler_inline_result$$5_lineno$$inline_22$$) {
        var $JSCompiler_StaticMethods_interrupts$self$$inline_157_line$$inline_147_samplesToGenerate$$inline_148_startTime$$inline_21$$ = $JSSMS$Utils$getTimestamp$$(), $JSCompiler_StaticMethods_drawBGColour$self$$inline_242_JSCompiler_StaticMethods_drawLine$self$$inline_150_lineno$$inline_158$$ = this.$vdp$, $lineno$$inline_151_location$$inline_155_row_precal$$inline_244$$ = $JSCompiler_StaticMethods_nmi$self$$inline_160_JSCompiler_inline_result$$5_lineno$$inline_22$$, $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$ = 
        0, $height$$inline_215_i$$inline_180_i$$inline_214_lineno$$inline_193_lineno$$inline_224_temp$$inline_153_temp2$$inline_246$$ = 0, $hscroll$$inline_198_i$$inline_247_spriteno$$inline_216_sprites$$inline_228_temp2$$inline_154_tile$$inline_181$$ = 0;
        if(!$JSCompiler_StaticMethods_drawBGColour$self$$inline_242_JSCompiler_StaticMethods_drawLine$self$$inline_150_lineno$$inline_158$$.$main$.$is_gg$ || !(24 > $lineno$$inline_151_location$$inline_155_row_precal$$inline_244$$ || 168 <= $lineno$$inline_151_location$$inline_155_row_precal$$inline_244$$)) {
          if(0 != ($JSCompiler_StaticMethods_drawBGColour$self$$inline_242_JSCompiler_StaticMethods_drawLine$self$$inline_150_lineno$$inline_158$$.$vdpreg$[1] & 64)) {
            if(-1 != $JSCompiler_StaticMethods_drawBGColour$self$$inline_242_JSCompiler_StaticMethods_drawLine$self$$inline_150_lineno$$inline_158$$.$maxDirty$) {
              $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$ = $JSCompiler_StaticMethods_drawBGColour$self$$inline_242_JSCompiler_StaticMethods_drawLine$self$$inline_150_lineno$$inline_158$$;
              console.log("[" + $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$line$ + "] min dirty:" + $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$minDirty$ + 
              " max: " + $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$maxDirty$);
              for($height$$inline_215_i$$inline_180_i$$inline_214_lineno$$inline_193_lineno$$inline_224_temp$$inline_153_temp2$$inline_246$$ = $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$minDirty$;$height$$inline_215_i$$inline_180_i$$inline_214_lineno$$inline_193_lineno$$inline_224_temp$$inline_153_temp2$$inline_246$$ <= 
              $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$maxDirty$;$height$$inline_215_i$$inline_180_i$$inline_214_lineno$$inline_193_lineno$$inline_224_temp$$inline_153_temp2$$inline_246$$++) {
                if($JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$isTileDirty$[$height$$inline_215_i$$inline_180_i$$inline_214_lineno$$inline_193_lineno$$inline_224_temp$$inline_153_temp2$$inline_246$$]) {
                  $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$isTileDirty$[$height$$inline_215_i$$inline_180_i$$inline_214_lineno$$inline_193_lineno$$inline_224_temp$$inline_153_temp2$$inline_246$$] = $JSCompiler_alias_FALSE$$;
                  console.log("tile " + $height$$inline_215_i$$inline_180_i$$inline_214_lineno$$inline_193_lineno$$inline_224_temp$$inline_153_temp2$$inline_246$$ + " is dirty");
                  for(var $hscroll$$inline_198_i$$inline_247_spriteno$$inline_216_sprites$$inline_228_temp2$$inline_154_tile$$inline_181$$ = $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$tiles$[$height$$inline_215_i$$inline_180_i$$inline_214_lineno$$inline_193_lineno$$inline_224_temp$$inline_153_temp2$$inline_246$$], 
                  $lock$$inline_200_pixel_index$$inline_182_y$$inline_217_zoomed$$inline_230$$ = 0, $address$$inline_183_lineno$$inline_218_row_precal$$inline_231_tile_column$$inline_201$$ = $height$$inline_215_i$$inline_180_i$$inline_214_lineno$$inline_193_lineno$$inline_224_temp$$inline_153_temp2$$inline_246$$ << 5, $off$$inline_232_sprites$$inline_219_tile_row$$inline_202_y$$inline_184$$ = 0;8 > $off$$inline_232_sprites$$inline_219_tile_row$$inline_202_y$$inline_184$$;$off$$inline_232_sprites$$inline_219_tile_row$$inline_202_y$$inline_184$$++) {
                    for(var $address0$$inline_185_count$$inline_229_i$$inline_233_off$$inline_220_tile_y$$inline_203_vscroll$$inline_199$$ = $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$VRAM$[$address$$inline_183_lineno$$inline_218_row_precal$$inline_231_tile_column$$inline_201$$++], $address$$inline_221_address1$$inline_186_row_precal$$inline_204_x$$inline_236$$ = 
                    $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$VRAM$[$address$$inline_183_lineno$$inline_218_row_precal$$inline_231_tile_column$$inline_201$$++], $address2$$inline_187_n$$inline_234_tile$$inline_238_tx$$inline_205$$ = $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$VRAM$[$address$$inline_183_lineno$$inline_218_row_precal$$inline_231_tile_column$$inline_201$$++], 
                    $address3$$inline_188_pix$$inline_239_secondbyte$$inline_207_y$$inline_235$$ = $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$VRAM$[$address$$inline_183_lineno$$inline_218_row_precal$$inline_231_tile_column$$inline_201$$++], $bit$$inline_189_colour$$inline_225_pal$$inline_208_tileRow$$inline_237$$ = 
                    128;0 != $bit$$inline_189_colour$$inline_225_pal$$inline_208_tileRow$$inline_237$$;$bit$$inline_189_colour$$inline_225_pal$$inline_208_tileRow$$inline_237$$ >>= 1) {
                      var $colour$$inline_190_sx$$inline_209_temp$$inline_226$$ = 0;
                      0 != ($address0$$inline_185_count$$inline_229_i$$inline_233_off$$inline_220_tile_y$$inline_203_vscroll$$inline_199$$ & $bit$$inline_189_colour$$inline_225_pal$$inline_208_tileRow$$inline_237$$) && ($colour$$inline_190_sx$$inline_209_temp$$inline_226$$ |= 1);
                      0 != ($address$$inline_221_address1$$inline_186_row_precal$$inline_204_x$$inline_236$$ & $bit$$inline_189_colour$$inline_225_pal$$inline_208_tileRow$$inline_237$$) && ($colour$$inline_190_sx$$inline_209_temp$$inline_226$$ |= 2);
                      0 != ($address2$$inline_187_n$$inline_234_tile$$inline_238_tx$$inline_205$$ & $bit$$inline_189_colour$$inline_225_pal$$inline_208_tileRow$$inline_237$$) && ($colour$$inline_190_sx$$inline_209_temp$$inline_226$$ |= 4);
                      0 != ($address3$$inline_188_pix$$inline_239_secondbyte$$inline_207_y$$inline_235$$ & $bit$$inline_189_colour$$inline_225_pal$$inline_208_tileRow$$inline_237$$) && ($colour$$inline_190_sx$$inline_209_temp$$inline_226$$ |= 8);
                      $hscroll$$inline_198_i$$inline_247_spriteno$$inline_216_sprites$$inline_228_temp2$$inline_154_tile$$inline_181$$[$lock$$inline_200_pixel_index$$inline_182_y$$inline_217_zoomed$$inline_230$$++] = $colour$$inline_190_sx$$inline_209_temp$$inline_226$$
                    }
                  }
                }
              }
              $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$minDirty$ = 512;
              $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$maxDirty$ = -1
            }
            var $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$ = $JSCompiler_StaticMethods_drawBGColour$self$$inline_242_JSCompiler_StaticMethods_drawLine$self$$inline_150_lineno$$inline_158$$, $height$$inline_215_i$$inline_180_i$$inline_214_lineno$$inline_193_lineno$$inline_224_temp$$inline_153_temp2$$inline_246$$ = 
            $lineno$$inline_151_location$$inline_155_row_precal$$inline_244$$, $offset$$inline_240_pixX$$inline_194_tile_props$$inline_206$$ = 0, $colour$$inline_195$$ = 0, $temp$$inline_196$$ = 0, $temp2$$inline_197$$ = 0, $hscroll$$inline_198_i$$inline_247_spriteno$$inline_216_sprites$$inline_228_temp2$$inline_154_tile$$inline_181$$ = $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$vdpreg$[8], 
            $address0$$inline_185_count$$inline_229_i$$inline_233_off$$inline_220_tile_y$$inline_203_vscroll$$inline_199$$ = $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$vdpreg$[9];
            16 > $height$$inline_215_i$$inline_180_i$$inline_214_lineno$$inline_193_lineno$$inline_224_temp$$inline_153_temp2$$inline_246$$ && 0 != ($JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$vdpreg$[0] & 64) && ($hscroll$$inline_198_i$$inline_247_spriteno$$inline_216_sprites$$inline_228_temp2$$inline_154_tile$$inline_181$$ = 
            0);
            $lock$$inline_200_pixel_index$$inline_182_y$$inline_217_zoomed$$inline_230$$ = $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$vdpreg$[0] & 128;
            $address$$inline_183_lineno$$inline_218_row_precal$$inline_231_tile_column$$inline_201$$ = 32 - ($hscroll$$inline_198_i$$inline_247_spriteno$$inline_216_sprites$$inline_228_temp2$$inline_154_tile$$inline_181$$ >> 3) + $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$h_start$;
            $off$$inline_232_sprites$$inline_219_tile_row$$inline_202_y$$inline_184$$ = $height$$inline_215_i$$inline_180_i$$inline_214_lineno$$inline_193_lineno$$inline_224_temp$$inline_153_temp2$$inline_246$$ + $address0$$inline_185_count$$inline_229_i$$inline_233_off$$inline_220_tile_y$$inline_203_vscroll$$inline_199$$ >> 3;
            27 < $off$$inline_232_sprites$$inline_219_tile_row$$inline_202_y$$inline_184$$ && ($off$$inline_232_sprites$$inline_219_tile_row$$inline_202_y$$inline_184$$ -= 28);
            $address0$$inline_185_count$$inline_229_i$$inline_233_off$$inline_220_tile_y$$inline_203_vscroll$$inline_199$$ = ($height$$inline_215_i$$inline_180_i$$inline_214_lineno$$inline_193_lineno$$inline_224_temp$$inline_153_temp2$$inline_246$$ + ($address0$$inline_185_count$$inline_229_i$$inline_233_off$$inline_220_tile_y$$inline_203_vscroll$$inline_199$$ & 7) & 7) << 3;
            $address$$inline_221_address1$$inline_186_row_precal$$inline_204_x$$inline_236$$ = $height$$inline_215_i$$inline_180_i$$inline_214_lineno$$inline_193_lineno$$inline_224_temp$$inline_153_temp2$$inline_246$$ << 8;
            for($address2$$inline_187_n$$inline_234_tile$$inline_238_tx$$inline_205$$ = $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$h_start$;$address2$$inline_187_n$$inline_234_tile$$inline_238_tx$$inline_205$$ < $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$h_end$;$address2$$inline_187_n$$inline_234_tile$$inline_238_tx$$inline_205$$++) {
              var $offset$$inline_240_pixX$$inline_194_tile_props$$inline_206$$ = $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$bgt$ + (($address$$inline_183_lineno$$inline_218_row_precal$$inline_231_tile_column$$inline_201$$ & 31) << 1) + ($off$$inline_232_sprites$$inline_219_tile_row$$inline_202_y$$inline_184$$ << 
              6), $address3$$inline_188_pix$$inline_239_secondbyte$$inline_207_y$$inline_235$$ = $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$VRAM$[$offset$$inline_240_pixX$$inline_194_tile_props$$inline_206$$ + 1], $bit$$inline_189_colour$$inline_225_pal$$inline_208_tileRow$$inline_237$$ = ($address3$$inline_188_pix$$inline_239_secondbyte$$inline_207_y$$inline_235$$ & 
              8) << 1, $colour$$inline_190_sx$$inline_209_temp$$inline_226$$ = ($address2$$inline_187_n$$inline_234_tile$$inline_238_tx$$inline_205$$ << 3) + ($hscroll$$inline_198_i$$inline_247_spriteno$$inline_216_sprites$$inline_228_temp2$$inline_154_tile$$inline_181$$ & 7), $pixY$$inline_210_temp2$$inline_227$$ = 0 == ($address3$$inline_188_pix$$inline_239_secondbyte$$inline_207_y$$inline_235$$ & 4) ? $address0$$inline_185_count$$inline_229_i$$inline_233_off$$inline_220_tile_y$$inline_203_vscroll$$inline_199$$ : 
              56 - $address0$$inline_185_count$$inline_229_i$$inline_233_off$$inline_220_tile_y$$inline_203_vscroll$$inline_199$$, $tile$$inline_211$$ = $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$tiles$[($JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$VRAM$[$offset$$inline_240_pixX$$inline_194_tile_props$$inline_206$$] & 
              255) + (($address3$$inline_188_pix$$inline_239_secondbyte$$inline_207_y$$inline_235$$ & 1) << 8)];
              if(0 == ($address3$$inline_188_pix$$inline_239_secondbyte$$inline_207_y$$inline_235$$ & 2)) {
                for($offset$$inline_240_pixX$$inline_194_tile_props$$inline_206$$ = 0;8 > $offset$$inline_240_pixX$$inline_194_tile_props$$inline_206$$ && 256 > $colour$$inline_190_sx$$inline_209_temp$$inline_226$$;$offset$$inline_240_pixX$$inline_194_tile_props$$inline_206$$++, $colour$$inline_190_sx$$inline_209_temp$$inline_226$$++) {
                  $colour$$inline_195$$ = $tile$$inline_211$$[$offset$$inline_240_pixX$$inline_194_tile_props$$inline_206$$ + $pixY$$inline_210_temp2$$inline_227$$], $temp$$inline_196$$ = 4 * ($colour$$inline_190_sx$$inline_209_temp$$inline_226$$ + $address$$inline_221_address1$$inline_186_row_precal$$inline_204_x$$inline_236$$), $temp2$$inline_197$$ = 3 * ($colour$$inline_195$$ + $bit$$inline_189_colour$$inline_225_pal$$inline_208_tileRow$$inline_237$$), $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$bgPriority$[$colour$$inline_190_sx$$inline_209_temp$$inline_226$$] = 
                  0 != ($address3$$inline_188_pix$$inline_239_secondbyte$$inline_207_y$$inline_235$$ & 16) && 0 != $colour$$inline_195$$, $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.display[$temp$$inline_196$$] = $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$CRAM$[$temp2$$inline_197$$], 
                  $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.display[$temp$$inline_196$$ + 1] = $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$CRAM$[$temp2$$inline_197$$ + 
                  1], $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.display[$temp$$inline_196$$ + 2] = $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$CRAM$[$temp2$$inline_197$$ + 
                  2]
                }
              }else {
                for($offset$$inline_240_pixX$$inline_194_tile_props$$inline_206$$ = 7;0 <= $offset$$inline_240_pixX$$inline_194_tile_props$$inline_206$$ && 256 > $colour$$inline_190_sx$$inline_209_temp$$inline_226$$;$offset$$inline_240_pixX$$inline_194_tile_props$$inline_206$$--, $colour$$inline_190_sx$$inline_209_temp$$inline_226$$++) {
                  $colour$$inline_195$$ = $tile$$inline_211$$[$offset$$inline_240_pixX$$inline_194_tile_props$$inline_206$$ + $pixY$$inline_210_temp2$$inline_227$$], $temp$$inline_196$$ = 4 * ($colour$$inline_190_sx$$inline_209_temp$$inline_226$$ + $address$$inline_221_address1$$inline_186_row_precal$$inline_204_x$$inline_236$$), $temp2$$inline_197$$ = 3 * ($colour$$inline_195$$ + $bit$$inline_189_colour$$inline_225_pal$$inline_208_tileRow$$inline_237$$), $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$bgPriority$[$colour$$inline_190_sx$$inline_209_temp$$inline_226$$] = 
                  0 != ($address3$$inline_188_pix$$inline_239_secondbyte$$inline_207_y$$inline_235$$ & 16) && 0 != $colour$$inline_195$$, $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.display[$temp$$inline_196$$] = $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$CRAM$[$temp2$$inline_197$$], 
                  $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.display[$temp$$inline_196$$ + 1] = $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$CRAM$[$temp2$$inline_197$$ + 
                  1], $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.display[$temp$$inline_196$$ + 2] = $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$CRAM$[$temp2$$inline_197$$ + 
                  2]
                }
              }
              $address$$inline_183_lineno$$inline_218_row_precal$$inline_231_tile_column$$inline_201$$++;
              0 != $lock$$inline_200_pixel_index$$inline_182_y$$inline_217_zoomed$$inline_230$$ && 23 == $address2$$inline_187_n$$inline_234_tile$$inline_238_tx$$inline_205$$ && ($off$$inline_232_sprites$$inline_219_tile_row$$inline_202_y$$inline_184$$ = $height$$inline_215_i$$inline_180_i$$inline_214_lineno$$inline_193_lineno$$inline_224_temp$$inline_153_temp2$$inline_246$$ >> 3, $address0$$inline_185_count$$inline_229_i$$inline_233_off$$inline_220_tile_y$$inline_203_vscroll$$inline_199$$ = ($height$$inline_215_i$$inline_180_i$$inline_214_lineno$$inline_193_lineno$$inline_224_temp$$inline_153_temp2$$inline_246$$ & 
              7) << 3)
            }
            if($JSCompiler_StaticMethods_drawBGColour$self$$inline_242_JSCompiler_StaticMethods_drawLine$self$$inline_150_lineno$$inline_158$$.$isSatDirty$) {
              $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$ = $JSCompiler_StaticMethods_drawBGColour$self$$inline_242_JSCompiler_StaticMethods_drawLine$self$$inline_150_lineno$$inline_158$$;
              $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$isSatDirty$ = $JSCompiler_alias_FALSE$$;
              for($height$$inline_215_i$$inline_180_i$$inline_214_lineno$$inline_193_lineno$$inline_224_temp$$inline_153_temp2$$inline_246$$ = 0;$height$$inline_215_i$$inline_180_i$$inline_214_lineno$$inline_193_lineno$$inline_224_temp$$inline_153_temp2$$inline_246$$ < $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$lineSprites$.length;$height$$inline_215_i$$inline_180_i$$inline_214_lineno$$inline_193_lineno$$inline_224_temp$$inline_153_temp2$$inline_246$$++) {
                $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$lineSprites$[$height$$inline_215_i$$inline_180_i$$inline_214_lineno$$inline_193_lineno$$inline_224_temp$$inline_153_temp2$$inline_246$$][0] = 0
              }
              $height$$inline_215_i$$inline_180_i$$inline_214_lineno$$inline_193_lineno$$inline_224_temp$$inline_153_temp2$$inline_246$$ = 0 == ($JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$vdpreg$[1] & 2) ? 8 : 16;
              1 == ($JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$vdpreg$[1] & 1) && ($height$$inline_215_i$$inline_180_i$$inline_214_lineno$$inline_193_lineno$$inline_224_temp$$inline_153_temp2$$inline_246$$ <<= 1);
              for($hscroll$$inline_198_i$$inline_247_spriteno$$inline_216_sprites$$inline_228_temp2$$inline_154_tile$$inline_181$$ = 0;64 > $hscroll$$inline_198_i$$inline_247_spriteno$$inline_216_sprites$$inline_228_temp2$$inline_154_tile$$inline_181$$;$hscroll$$inline_198_i$$inline_247_spriteno$$inline_216_sprites$$inline_228_temp2$$inline_154_tile$$inline_181$$++) {
                $lock$$inline_200_pixel_index$$inline_182_y$$inline_217_zoomed$$inline_230$$ = $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$VRAM$[$JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$sat$ + 
                $hscroll$$inline_198_i$$inline_247_spriteno$$inline_216_sprites$$inline_228_temp2$$inline_154_tile$$inline_181$$] & 255;
                if(208 == $lock$$inline_200_pixel_index$$inline_182_y$$inline_217_zoomed$$inline_230$$) {
                  break
                }
                $lock$$inline_200_pixel_index$$inline_182_y$$inline_217_zoomed$$inline_230$$++;
                240 < $lock$$inline_200_pixel_index$$inline_182_y$$inline_217_zoomed$$inline_230$$ && ($lock$$inline_200_pixel_index$$inline_182_y$$inline_217_zoomed$$inline_230$$ -= 256);
                for($address$$inline_183_lineno$$inline_218_row_precal$$inline_231_tile_column$$inline_201$$ = 0;192 > $address$$inline_183_lineno$$inline_218_row_precal$$inline_231_tile_column$$inline_201$$;$address$$inline_183_lineno$$inline_218_row_precal$$inline_231_tile_column$$inline_201$$++) {
                  $address$$inline_183_lineno$$inline_218_row_precal$$inline_231_tile_column$$inline_201$$ >= $lock$$inline_200_pixel_index$$inline_182_y$$inline_217_zoomed$$inline_230$$ && $address$$inline_183_lineno$$inline_218_row_precal$$inline_231_tile_column$$inline_201$$ - $lock$$inline_200_pixel_index$$inline_182_y$$inline_217_zoomed$$inline_230$$ < $height$$inline_215_i$$inline_180_i$$inline_214_lineno$$inline_193_lineno$$inline_224_temp$$inline_153_temp2$$inline_246$$ && ($off$$inline_232_sprites$$inline_219_tile_row$$inline_202_y$$inline_184$$ = 
                  $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$lineSprites$[$address$$inline_183_lineno$$inline_218_row_precal$$inline_231_tile_column$$inline_201$$], 8 > $off$$inline_232_sprites$$inline_219_tile_row$$inline_202_y$$inline_184$$[0] && ($address0$$inline_185_count$$inline_229_i$$inline_233_off$$inline_220_tile_y$$inline_203_vscroll$$inline_199$$ = 
                  3 * $off$$inline_232_sprites$$inline_219_tile_row$$inline_202_y$$inline_184$$[0] + 1, $address$$inline_221_address1$$inline_186_row_precal$$inline_204_x$$inline_236$$ = $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$sat$ + ($hscroll$$inline_198_i$$inline_247_spriteno$$inline_216_sprites$$inline_228_temp2$$inline_154_tile$$inline_181$$ << 
                  1) + 128, $off$$inline_232_sprites$$inline_219_tile_row$$inline_202_y$$inline_184$$[$address0$$inline_185_count$$inline_229_i$$inline_233_off$$inline_220_tile_y$$inline_203_vscroll$$inline_199$$++] = $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$VRAM$[$address$$inline_221_address1$$inline_186_row_precal$$inline_204_x$$inline_236$$++] & 
                  255, $off$$inline_232_sprites$$inline_219_tile_row$$inline_202_y$$inline_184$$[$address0$$inline_185_count$$inline_229_i$$inline_233_off$$inline_220_tile_y$$inline_203_vscroll$$inline_199$$++] = $lock$$inline_200_pixel_index$$inline_182_y$$inline_217_zoomed$$inline_230$$, $off$$inline_232_sprites$$inline_219_tile_row$$inline_202_y$$inline_184$$[$address0$$inline_185_count$$inline_229_i$$inline_233_off$$inline_220_tile_y$$inline_203_vscroll$$inline_199$$++] = $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$VRAM$[$address$$inline_221_address1$$inline_186_row_precal$$inline_204_x$$inline_236$$] & 
                  255, $off$$inline_232_sprites$$inline_219_tile_row$$inline_202_y$$inline_184$$[0]++))
                }
              }
            }
            if(0 != $JSCompiler_StaticMethods_drawBGColour$self$$inline_242_JSCompiler_StaticMethods_drawLine$self$$inline_150_lineno$$inline_158$$.$lineSprites$[$lineno$$inline_151_location$$inline_155_row_precal$$inline_244$$][0]) {
              $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$ = $JSCompiler_StaticMethods_drawBGColour$self$$inline_242_JSCompiler_StaticMethods_drawLine$self$$inline_150_lineno$$inline_158$$;
              $height$$inline_215_i$$inline_180_i$$inline_214_lineno$$inline_193_lineno$$inline_224_temp$$inline_153_temp2$$inline_246$$ = $lineno$$inline_151_location$$inline_155_row_precal$$inline_244$$;
              $pixY$$inline_210_temp2$$inline_227$$ = $colour$$inline_190_sx$$inline_209_temp$$inline_226$$ = $bit$$inline_189_colour$$inline_225_pal$$inline_208_tileRow$$inline_237$$ = 0;
              $hscroll$$inline_198_i$$inline_247_spriteno$$inline_216_sprites$$inline_228_temp2$$inline_154_tile$$inline_181$$ = $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$lineSprites$[$height$$inline_215_i$$inline_180_i$$inline_214_lineno$$inline_193_lineno$$inline_224_temp$$inline_153_temp2$$inline_246$$];
              $address0$$inline_185_count$$inline_229_i$$inline_233_off$$inline_220_tile_y$$inline_203_vscroll$$inline_199$$ = Math.min(8, $hscroll$$inline_198_i$$inline_247_spriteno$$inline_216_sprites$$inline_228_temp2$$inline_154_tile$$inline_181$$[0]);
              $lock$$inline_200_pixel_index$$inline_182_y$$inline_217_zoomed$$inline_230$$ = $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$vdpreg$[1] & 1;
              $address$$inline_183_lineno$$inline_218_row_precal$$inline_231_tile_column$$inline_201$$ = $height$$inline_215_i$$inline_180_i$$inline_214_lineno$$inline_193_lineno$$inline_224_temp$$inline_153_temp2$$inline_246$$ << 8;
              for($off$$inline_232_sprites$$inline_219_tile_row$$inline_202_y$$inline_184$$ = 3 * $address0$$inline_185_count$$inline_229_i$$inline_233_off$$inline_220_tile_y$$inline_203_vscroll$$inline_199$$;$address0$$inline_185_count$$inline_229_i$$inline_233_off$$inline_220_tile_y$$inline_203_vscroll$$inline_199$$--;) {
                if($address2$$inline_187_n$$inline_234_tile$$inline_238_tx$$inline_205$$ = $hscroll$$inline_198_i$$inline_247_spriteno$$inline_216_sprites$$inline_228_temp2$$inline_154_tile$$inline_181$$[$off$$inline_232_sprites$$inline_219_tile_row$$inline_202_y$$inline_184$$--] | ($JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$vdpreg$[6] & 
                4) << 6, $address3$$inline_188_pix$$inline_239_secondbyte$$inline_207_y$$inline_235$$ = $hscroll$$inline_198_i$$inline_247_spriteno$$inline_216_sprites$$inline_228_temp2$$inline_154_tile$$inline_181$$[$off$$inline_232_sprites$$inline_219_tile_row$$inline_202_y$$inline_184$$--], $address$$inline_221_address1$$inline_186_row_precal$$inline_204_x$$inline_236$$ = $hscroll$$inline_198_i$$inline_247_spriteno$$inline_216_sprites$$inline_228_temp2$$inline_154_tile$$inline_181$$[$off$$inline_232_sprites$$inline_219_tile_row$$inline_202_y$$inline_184$$--] - 
                ($JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$vdpreg$[0] & 8), $bit$$inline_189_colour$$inline_225_pal$$inline_208_tileRow$$inline_237$$ = $height$$inline_215_i$$inline_180_i$$inline_214_lineno$$inline_193_lineno$$inline_224_temp$$inline_153_temp2$$inline_246$$ - $address3$$inline_188_pix$$inline_239_secondbyte$$inline_207_y$$inline_235$$ >> 
                $lock$$inline_200_pixel_index$$inline_182_y$$inline_217_zoomed$$inline_230$$, 0 != ($JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$vdpreg$[1] & 2) && ($address2$$inline_187_n$$inline_234_tile$$inline_238_tx$$inline_205$$ &= -2), $address2$$inline_187_n$$inline_234_tile$$inline_238_tx$$inline_205$$ = 
                $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$tiles$[$address2$$inline_187_n$$inline_234_tile$$inline_238_tx$$inline_205$$ + (($bit$$inline_189_colour$$inline_225_pal$$inline_208_tileRow$$inline_237$$ & 8) >> 3)], $address3$$inline_188_pix$$inline_239_secondbyte$$inline_207_y$$inline_235$$ = 
                0, 0 > $address$$inline_221_address1$$inline_186_row_precal$$inline_204_x$$inline_236$$ && ($address3$$inline_188_pix$$inline_239_secondbyte$$inline_207_y$$inline_235$$ = -$address$$inline_221_address1$$inline_186_row_precal$$inline_204_x$$inline_236$$, $address$$inline_221_address1$$inline_186_row_precal$$inline_204_x$$inline_236$$ = 0), $offset$$inline_240_pixX$$inline_194_tile_props$$inline_206$$ = $address3$$inline_188_pix$$inline_239_secondbyte$$inline_207_y$$inline_235$$ + (($bit$$inline_189_colour$$inline_225_pal$$inline_208_tileRow$$inline_237$$ & 
                7) << 3), 0 == $lock$$inline_200_pixel_index$$inline_182_y$$inline_217_zoomed$$inline_230$$) {
                  for(;8 > $address3$$inline_188_pix$$inline_239_secondbyte$$inline_207_y$$inline_235$$ && 256 > $address$$inline_221_address1$$inline_186_row_precal$$inline_204_x$$inline_236$$;$address3$$inline_188_pix$$inline_239_secondbyte$$inline_207_y$$inline_235$$++, $address$$inline_221_address1$$inline_186_row_precal$$inline_204_x$$inline_236$$++) {
                    $bit$$inline_189_colour$$inline_225_pal$$inline_208_tileRow$$inline_237$$ = $address2$$inline_187_n$$inline_234_tile$$inline_238_tx$$inline_205$$[$offset$$inline_240_pixX$$inline_194_tile_props$$inline_206$$++], 0 != $bit$$inline_189_colour$$inline_225_pal$$inline_208_tileRow$$inline_237$$ && !$JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$bgPriority$[$address$$inline_221_address1$$inline_186_row_precal$$inline_204_x$$inline_236$$] && 
                    ($colour$$inline_190_sx$$inline_209_temp$$inline_226$$ = 4 * ($address$$inline_221_address1$$inline_186_row_precal$$inline_204_x$$inline_236$$ + $address$$inline_183_lineno$$inline_218_row_precal$$inline_231_tile_column$$inline_201$$), $pixY$$inline_210_temp2$$inline_227$$ = 3 * ($bit$$inline_189_colour$$inline_225_pal$$inline_208_tileRow$$inline_237$$ + 16), $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.display[$colour$$inline_190_sx$$inline_209_temp$$inline_226$$] = 
                    $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$CRAM$[$pixY$$inline_210_temp2$$inline_227$$], $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.display[$colour$$inline_190_sx$$inline_209_temp$$inline_226$$ + 
                    1] = $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$CRAM$[$pixY$$inline_210_temp2$$inline_227$$ + 1], $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.display[$colour$$inline_190_sx$$inline_209_temp$$inline_226$$ + 
                    2] = $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$CRAM$[$pixY$$inline_210_temp2$$inline_227$$ + 2])
                  }
                }else {
                  for(;8 > $address3$$inline_188_pix$$inline_239_secondbyte$$inline_207_y$$inline_235$$ && 256 > $address$$inline_221_address1$$inline_186_row_precal$$inline_204_x$$inline_236$$;$address3$$inline_188_pix$$inline_239_secondbyte$$inline_207_y$$inline_235$$++, $address$$inline_221_address1$$inline_186_row_precal$$inline_204_x$$inline_236$$ += 2) {
                    $bit$$inline_189_colour$$inline_225_pal$$inline_208_tileRow$$inline_237$$ = $address2$$inline_187_n$$inline_234_tile$$inline_238_tx$$inline_205$$[$offset$$inline_240_pixX$$inline_194_tile_props$$inline_206$$++], 0 != $bit$$inline_189_colour$$inline_225_pal$$inline_208_tileRow$$inline_237$$ && !$JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$bgPriority$[$address$$inline_221_address1$$inline_186_row_precal$$inline_204_x$$inline_236$$] && 
                    ($colour$$inline_190_sx$$inline_209_temp$$inline_226$$ = 4 * ($address$$inline_221_address1$$inline_186_row_precal$$inline_204_x$$inline_236$$ + $address$$inline_183_lineno$$inline_218_row_precal$$inline_231_tile_column$$inline_201$$), $pixY$$inline_210_temp2$$inline_227$$ = 3 * ($bit$$inline_189_colour$$inline_225_pal$$inline_208_tileRow$$inline_237$$ + 16), $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.display[$colour$$inline_190_sx$$inline_209_temp$$inline_226$$] = 
                    $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$CRAM$[$pixY$$inline_210_temp2$$inline_227$$], $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.display[$colour$$inline_190_sx$$inline_209_temp$$inline_226$$ + 
                    1] = $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$CRAM$[$pixY$$inline_210_temp2$$inline_227$$ + 1], $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.display[$colour$$inline_190_sx$$inline_209_temp$$inline_226$$ + 
                    2] = $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$CRAM$[$pixY$$inline_210_temp2$$inline_227$$ + 2]), 0 != $bit$$inline_189_colour$$inline_225_pal$$inline_208_tileRow$$inline_237$$ && !$JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$bgPriority$[$address$$inline_221_address1$$inline_186_row_precal$$inline_204_x$$inline_236$$ + 
                    1] && ($colour$$inline_190_sx$$inline_209_temp$$inline_226$$ = 4 * ($address$$inline_221_address1$$inline_186_row_precal$$inline_204_x$$inline_236$$ + $address$$inline_183_lineno$$inline_218_row_precal$$inline_231_tile_column$$inline_201$$ + 1), $pixY$$inline_210_temp2$$inline_227$$ = 3 * ($bit$$inline_189_colour$$inline_225_pal$$inline_208_tileRow$$inline_237$$ + 16), $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.display[$colour$$inline_190_sx$$inline_209_temp$$inline_226$$] = 
                    $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$CRAM$[$pixY$$inline_210_temp2$$inline_227$$], $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.display[$colour$$inline_190_sx$$inline_209_temp$$inline_226$$ + 
                    1] = $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$CRAM$[$pixY$$inline_210_temp2$$inline_227$$ + 1], $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.display[$colour$$inline_190_sx$$inline_209_temp$$inline_226$$ + 
                    2] = $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.$CRAM$[$pixY$$inline_210_temp2$$inline_227$$ + 2])
                  }
                }
              }
              8 <= $hscroll$$inline_198_i$$inline_247_spriteno$$inline_216_sprites$$inline_228_temp2$$inline_154_tile$$inline_181$$[0] && ($JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$.status |= 64)
            }
            if($JSCompiler_StaticMethods_drawBGColour$self$$inline_242_JSCompiler_StaticMethods_drawLine$self$$inline_150_lineno$$inline_158$$.$main$.$is_sms$ && 0 != ($JSCompiler_StaticMethods_drawBGColour$self$$inline_242_JSCompiler_StaticMethods_drawLine$self$$inline_150_lineno$$inline_158$$.$vdpreg$[0] & 32)) {
              $lineno$$inline_151_location$$inline_155_row_precal$$inline_244$$ <<= 8;
              if(32 < 16 + ($JSCompiler_StaticMethods_drawBGColour$self$$inline_242_JSCompiler_StaticMethods_drawLine$self$$inline_150_lineno$$inline_158$$.$vdpreg$[7] & 15)) {
                debugger
              }
              if(49152 < $lineno$$inline_151_location$$inline_155_row_precal$$inline_244$$) {
                debugger
              }
              $height$$inline_215_i$$inline_180_i$$inline_214_lineno$$inline_193_lineno$$inline_224_temp$$inline_153_temp2$$inline_246$$ = 4 * $lineno$$inline_151_location$$inline_155_row_precal$$inline_244$$;
              $hscroll$$inline_198_i$$inline_247_spriteno$$inline_216_sprites$$inline_228_temp2$$inline_154_tile$$inline_181$$ = 3 * (16 + ($JSCompiler_StaticMethods_drawBGColour$self$$inline_242_JSCompiler_StaticMethods_drawLine$self$$inline_150_lineno$$inline_158$$.$vdpreg$[7] & 15));
              for($JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$ = 0;8 > $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$;$JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$++) {
                $JSCompiler_StaticMethods_drawBGColour$self$$inline_242_JSCompiler_StaticMethods_drawLine$self$$inline_150_lineno$$inline_158$$.display[$height$$inline_215_i$$inline_180_i$$inline_214_lineno$$inline_193_lineno$$inline_224_temp$$inline_153_temp2$$inline_246$$ + $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$] = 
                $JSCompiler_StaticMethods_drawBGColour$self$$inline_242_JSCompiler_StaticMethods_drawLine$self$$inline_150_lineno$$inline_158$$.$CRAM$[$hscroll$$inline_198_i$$inline_247_spriteno$$inline_216_sprites$$inline_228_temp2$$inline_154_tile$$inline_181$$], $JSCompiler_StaticMethods_drawBGColour$self$$inline_242_JSCompiler_StaticMethods_drawLine$self$$inline_150_lineno$$inline_158$$.display[$height$$inline_215_i$$inline_180_i$$inline_214_lineno$$inline_193_lineno$$inline_224_temp$$inline_153_temp2$$inline_246$$ + 
                $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$ + 1] = $JSCompiler_StaticMethods_drawBGColour$self$$inline_242_JSCompiler_StaticMethods_drawLine$self$$inline_150_lineno$$inline_158$$.$CRAM$[$hscroll$$inline_198_i$$inline_247_spriteno$$inline_216_sprites$$inline_228_temp2$$inline_154_tile$$inline_181$$], 
                $JSCompiler_StaticMethods_drawBGColour$self$$inline_242_JSCompiler_StaticMethods_drawLine$self$$inline_150_lineno$$inline_158$$.display[$height$$inline_215_i$$inline_180_i$$inline_214_lineno$$inline_193_lineno$$inline_224_temp$$inline_153_temp2$$inline_246$$ + $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$ + 
                2] = $JSCompiler_StaticMethods_drawBGColour$self$$inline_242_JSCompiler_StaticMethods_drawLine$self$$inline_150_lineno$$inline_158$$.$CRAM$[$hscroll$$inline_198_i$$inline_247_spriteno$$inline_216_sprites$$inline_228_temp2$$inline_154_tile$$inline_181$$]
              }
            }
          }else {
            $lineno$$inline_151_location$$inline_155_row_precal$$inline_244$$ <<= 8;
            $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$ = 0;
            $height$$inline_215_i$$inline_180_i$$inline_214_lineno$$inline_193_lineno$$inline_224_temp$$inline_153_temp2$$inline_246$$ = 3 * (16 + ($JSCompiler_StaticMethods_drawBGColour$self$$inline_242_JSCompiler_StaticMethods_drawLine$self$$inline_150_lineno$$inline_158$$.$vdpreg$[7] & 15));
            for($hscroll$$inline_198_i$$inline_247_spriteno$$inline_216_sprites$$inline_228_temp2$$inline_154_tile$$inline_181$$ = 0;1024 > $hscroll$$inline_198_i$$inline_247_spriteno$$inline_216_sprites$$inline_228_temp2$$inline_154_tile$$inline_181$$;$hscroll$$inline_198_i$$inline_247_spriteno$$inline_216_sprites$$inline_228_temp2$$inline_154_tile$$inline_181$$++) {
              $JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$ = 4 * $lineno$$inline_151_location$$inline_155_row_precal$$inline_244$$, $JSCompiler_StaticMethods_drawBGColour$self$$inline_242_JSCompiler_StaticMethods_drawLine$self$$inline_150_lineno$$inline_158$$.display[$JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$] = 
              $JSCompiler_StaticMethods_drawBGColour$self$$inline_242_JSCompiler_StaticMethods_drawLine$self$$inline_150_lineno$$inline_158$$.$CRAM$[$height$$inline_215_i$$inline_180_i$$inline_214_lineno$$inline_193_lineno$$inline_224_temp$$inline_153_temp2$$inline_246$$], $JSCompiler_StaticMethods_drawBGColour$self$$inline_242_JSCompiler_StaticMethods_drawLine$self$$inline_150_lineno$$inline_158$$.display[$JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$ + 
              1] = $JSCompiler_StaticMethods_drawBGColour$self$$inline_242_JSCompiler_StaticMethods_drawLine$self$$inline_150_lineno$$inline_158$$.$CRAM$[$height$$inline_215_i$$inline_180_i$$inline_214_lineno$$inline_193_lineno$$inline_224_temp$$inline_153_temp2$$inline_246$$ + 1], $JSCompiler_StaticMethods_drawBGColour$self$$inline_242_JSCompiler_StaticMethods_drawLine$self$$inline_150_lineno$$inline_158$$.display[$JSCompiler_StaticMethods_decodeSat$self$$inline_213_JSCompiler_StaticMethods_decodeTiles$self$$inline_179_JSCompiler_StaticMethods_drawBg$self$$inline_192_JSCompiler_StaticMethods_drawSprite$self$$inline_223_i$$inline_152_temp$$inline_245$$ + 
              2] = $JSCompiler_StaticMethods_drawBGColour$self$$inline_242_JSCompiler_StaticMethods_drawLine$self$$inline_150_lineno$$inline_158$$.$CRAM$[$height$$inline_215_i$$inline_180_i$$inline_214_lineno$$inline_193_lineno$$inline_224_temp$$inline_153_temp2$$inline_246$$ + 2], $lineno$$inline_151_location$$inline_155_row_precal$$inline_244$$++
            }
          }
        }
        this.$drawTimeCounter$ += $JSSMS$Utils$getTimestamp$$() - $JSCompiler_StaticMethods_interrupts$self$$inline_157_line$$inline_147_samplesToGenerate$$inline_148_startTime$$inline_21$$
      }
      $JSCompiler_StaticMethods_interrupts$self$$inline_157_line$$inline_147_samplesToGenerate$$inline_148_startTime$$inline_21$$ = this.$vdp$;
      $JSCompiler_StaticMethods_drawBGColour$self$$inline_242_JSCompiler_StaticMethods_drawLine$self$$inline_150_lineno$$inline_158$$ = $JSCompiler_StaticMethods_nmi$self$$inline_160_JSCompiler_inline_result$$5_lineno$$inline_22$$;
      192 >= $JSCompiler_StaticMethods_drawBGColour$self$$inline_242_JSCompiler_StaticMethods_drawLine$self$$inline_150_lineno$$inline_158$$ ? (192 == $JSCompiler_StaticMethods_drawBGColour$self$$inline_242_JSCompiler_StaticMethods_drawLine$self$$inline_150_lineno$$inline_158$$ && ($JSCompiler_StaticMethods_interrupts$self$$inline_157_line$$inline_147_samplesToGenerate$$inline_148_startTime$$inline_21$$.status |= 128), 0 == $JSCompiler_StaticMethods_interrupts$self$$inline_157_line$$inline_147_samplesToGenerate$$inline_148_startTime$$inline_21$$.$counter$ ? 
      ($JSCompiler_StaticMethods_interrupts$self$$inline_157_line$$inline_147_samplesToGenerate$$inline_148_startTime$$inline_21$$.$counter$ = $JSCompiler_StaticMethods_interrupts$self$$inline_157_line$$inline_147_samplesToGenerate$$inline_148_startTime$$inline_21$$.$vdpreg$[10], $JSCompiler_StaticMethods_interrupts$self$$inline_157_line$$inline_147_samplesToGenerate$$inline_148_startTime$$inline_21$$.status |= 4) : $JSCompiler_StaticMethods_interrupts$self$$inline_157_line$$inline_147_samplesToGenerate$$inline_148_startTime$$inline_21$$.$counter$--, 
      0 != ($JSCompiler_StaticMethods_interrupts$self$$inline_157_line$$inline_147_samplesToGenerate$$inline_148_startTime$$inline_21$$.status & 4) && 0 != ($JSCompiler_StaticMethods_interrupts$self$$inline_157_line$$inline_147_samplesToGenerate$$inline_148_startTime$$inline_21$$.$vdpreg$[0] & 16) && ($JSCompiler_StaticMethods_interrupts$self$$inline_157_line$$inline_147_samplesToGenerate$$inline_148_startTime$$inline_21$$.$main$.$cpu$.$interruptLine$ = $JSCompiler_alias_TRUE$$)) : ($JSCompiler_StaticMethods_interrupts$self$$inline_157_line$$inline_147_samplesToGenerate$$inline_148_startTime$$inline_21$$.$counter$ = 
      $JSCompiler_StaticMethods_interrupts$self$$inline_157_line$$inline_147_samplesToGenerate$$inline_148_startTime$$inline_21$$.$vdpreg$[10], 0 != ($JSCompiler_StaticMethods_interrupts$self$$inline_157_line$$inline_147_samplesToGenerate$$inline_148_startTime$$inline_21$$.status & 128) && (0 != ($JSCompiler_StaticMethods_interrupts$self$$inline_157_line$$inline_147_samplesToGenerate$$inline_148_startTime$$inline_21$$.$vdpreg$[1] & 32) && 224 > $JSCompiler_StaticMethods_drawBGColour$self$$inline_242_JSCompiler_StaticMethods_drawLine$self$$inline_150_lineno$$inline_158$$) && 
      ($JSCompiler_StaticMethods_interrupts$self$$inline_157_line$$inline_147_samplesToGenerate$$inline_148_startTime$$inline_21$$.$main$.$cpu$.$interruptLine$ = $JSCompiler_alias_TRUE$$))
    }
    60 == ++this.$frameCount$ && (this.$z80Time$ = this.$z80TimeCounter$, this.$drawTime$ = this.$drawTimeCounter$, this.$frameCount$ = this.$drawTimeCounter$ = this.$z80TimeCounter$ = 0);
    this.$pause_button$ && ($JSCompiler_StaticMethods_nmi$self$$inline_160_JSCompiler_inline_result$$5_lineno$$inline_22$$ = this.$cpu$, $JSCompiler_StaticMethods_nmi$self$$inline_160_JSCompiler_inline_result$$5_lineno$$inline_22$$.$iff2$ = $JSCompiler_StaticMethods_nmi$self$$inline_160_JSCompiler_inline_result$$5_lineno$$inline_22$$.$iff1$, $JSCompiler_StaticMethods_nmi$self$$inline_160_JSCompiler_inline_result$$5_lineno$$inline_22$$.$iff1$ = $JSCompiler_alias_FALSE$$, $JSCompiler_StaticMethods_nmi$self$$inline_160_JSCompiler_inline_result$$5_lineno$$inline_22$$.$halt$ && 
    ($JSCompiler_StaticMethods_nmi$self$$inline_160_JSCompiler_inline_result$$5_lineno$$inline_22$$.$pc$++, $JSCompiler_StaticMethods_nmi$self$$inline_160_JSCompiler_inline_result$$5_lineno$$inline_22$$.$halt$ = $JSCompiler_alias_FALSE$$), $JSCompiler_StaticMethods_push1$$($JSCompiler_StaticMethods_nmi$self$$inline_160_JSCompiler_inline_result$$5_lineno$$inline_22$$, $JSCompiler_StaticMethods_nmi$self$$inline_160_JSCompiler_inline_result$$5_lineno$$inline_22$$.$pc$), $JSCompiler_StaticMethods_nmi$self$$inline_160_JSCompiler_inline_result$$5_lineno$$inline_22$$.$pc$ = 
    102, $JSCompiler_StaticMethods_nmi$self$$inline_160_JSCompiler_inline_result$$5_lineno$$inline_22$$.$tstates$ -= 11, this.$pause_button$ = $JSCompiler_alias_FALSE$$);
    0 == this.$frameskip_counter$-- ? (this.$frameskip_counter$ = this.$frameSkip$, $JSCompiler_StaticMethods_nmi$self$$inline_160_JSCompiler_inline_result$$5_lineno$$inline_22$$ = $JSCompiler_alias_TRUE$$) : $JSCompiler_StaticMethods_nmi$self$$inline_160_JSCompiler_inline_result$$5_lineno$$inline_22$$ = $JSCompiler_alias_FALSE$$;
    $JSCompiler_StaticMethods_nmi$self$$inline_160_JSCompiler_inline_result$$5_lineno$$inline_22$$ && this.$ui$.$writeFrame$(this.$vdp$.display, []);
    this.$fpsFrameCount$++;
    this.$ui$.requestAnimationFrame(this.frame.bind(this), this.$ui$.screen)
  }
}, $loadROM$:function $$JSSMS$$$$$loadROM$$($data$$31$$, $size$$11$$) {
  0 != $size$$11$$ % 1024 && ($data$$31$$ = $data$$31$$.substr(512), $size$$11$$ -= 512);
  var $i$$3$$, $j$$, $number_of_pages$$ = Math.round($size$$11$$ / 1024), $pages$$1$$ = Array($number_of_pages$$);
  for($i$$3$$ = 0;$i$$3$$ < $number_of_pages$$;$i$$3$$++) {
    if($pages$$1$$[$i$$3$$] = $JSSMS$Utils$Array$$(1024), $SUPPORT_DATAVIEW$$) {
      for($j$$ = 0;1024 > $j$$;$j$$++) {
        $pages$$1$$[$i$$3$$].setUint8($j$$, $data$$31$$.charCodeAt(1024 * $i$$3$$ + $j$$))
      }
    }else {
      for($j$$ = 0;1024 > $j$$;$j$$++) {
        $pages$$1$$[$i$$3$$][$j$$] = $data$$31$$.charCodeAt(1024 * $i$$3$$ + $j$$) & 255
      }
    }
  }
  return $pages$$1$$
}};
function $JSCompiler_StaticMethods_readRomDirectly$$($JSCompiler_StaticMethods_readRomDirectly$self$$, $data$$30$$, $fileName$$) {
  var $mode$$9_pages$$;
  $mode$$9_pages$$ = ".gg" == $fileName$$.substr(-3).toLowerCase() ? 2 : 1;
  var $size$$10$$ = $data$$30$$.length;
  1 == $mode$$9_pages$$ ? ($JSCompiler_StaticMethods_readRomDirectly$self$$.$is_sms$ = $JSCompiler_alias_TRUE$$, $JSCompiler_StaticMethods_readRomDirectly$self$$.$is_gg$ = $JSCompiler_alias_FALSE$$, $JSCompiler_StaticMethods_readRomDirectly$self$$.$vdp$.$h_start$ = 0, $JSCompiler_StaticMethods_readRomDirectly$self$$.$vdp$.$h_end$ = 32, $JSCompiler_StaticMethods_readRomDirectly$self$$.$emuWidth$ = 256, $JSCompiler_StaticMethods_readRomDirectly$self$$.$emuHeight$ = 192) : 2 == $mode$$9_pages$$ && ($JSCompiler_StaticMethods_readRomDirectly$self$$.$is_gg$ = 
  $JSCompiler_alias_TRUE$$, $JSCompiler_StaticMethods_readRomDirectly$self$$.$is_sms$ = $JSCompiler_alias_FALSE$$, $JSCompiler_StaticMethods_readRomDirectly$self$$.$vdp$.$h_start$ = 5, $JSCompiler_StaticMethods_readRomDirectly$self$$.$vdp$.$h_end$ = 27, $JSCompiler_StaticMethods_readRomDirectly$self$$.$emuWidth$ = 160, $JSCompiler_StaticMethods_readRomDirectly$self$$.$emuHeight$ = 144);
  if(1024 >= $size$$10$$) {
    return $JSCompiler_alias_FALSE$$
  }
  $mode$$9_pages$$ = $JSCompiler_StaticMethods_readRomDirectly$self$$.$loadROM$($data$$30$$, $size$$10$$);
  if($mode$$9_pages$$ == $JSCompiler_alias_NULL$$) {
    return $JSCompiler_alias_FALSE$$
  }
  $JSCompiler_StaticMethods_resetMemory$$($JSCompiler_StaticMethods_readRomDirectly$self$$.$cpu$, $mode$$9_pages$$);
  $JSCompiler_StaticMethods_readRomDirectly$self$$.$romData$ = $data$$30$$;
  $JSCompiler_StaticMethods_readRomDirectly$self$$.$romFileName$ = $fileName$$;
  return $JSCompiler_alias_TRUE$$
}
function $JSCompiler_StaticMethods_printFps$$($JSCompiler_StaticMethods_printFps$self$$) {
  var $now$$ = $JSSMS$Utils$getTimestamp$$(), $s$$2$$ = "Running";
  $JSCompiler_StaticMethods_printFps$self$$.$lastFpsTime$ && ($s$$2$$ += ": " + ($JSCompiler_StaticMethods_printFps$self$$.$fpsFrameCount$ / (($now$$ - $JSCompiler_StaticMethods_printFps$self$$.$lastFpsTime$) / 1E3)).toFixed(2) + " (/ " + (1E3 / 17).toFixed(2) + ") FPS");
  $JSCompiler_StaticMethods_printFps$self$$.$ui$.updateStatus($s$$2$$);
  $JSCompiler_StaticMethods_printFps$self$$.$fpsFrameCount$ = 0;
  $JSCompiler_StaticMethods_printFps$self$$.$lastFpsTime$ = $now$$
}
;var $JSSMS$Utils$Array$$ = $SUPPORT_DATAVIEW$$ ? function($length$$12$$) {
  $length$$12$$ || ($length$$12$$ = 0);
  return new DataView(new ArrayBuffer($length$$12$$))
} : Array, $JSSMS$Utils$copyArray$$ = $SUPPORT_DATAVIEW$$ ? function($src$$3$$) {
  if(!$src$$3$$) {
    return $JSSMS$Utils$Array$$()
  }
  var $i$$4$$, $dest$$2$$;
  $i$$4$$ = $src$$3$$.byteLength;
  for($dest$$2$$ = new $JSSMS$Utils$Array$$($i$$4$$);$i$$4$$--;) {
    $dest$$2$$.setInt8($i$$4$$, $src$$3$$.getInt8($i$$4$$))
  }
  return $dest$$2$$
} : function($src$$4$$) {
  if(!$src$$4$$) {
    return $JSSMS$Utils$Array$$()
  }
  var $i$$5$$, $dest$$3$$;
  $i$$5$$ = $src$$4$$.length;
  for($dest$$3$$ = new $JSSMS$Utils$Array$$($i$$5$$);$i$$5$$--;) {
    $src$$4$$[$i$$5$$] != $JSCompiler_alias_VOID$$ && ($dest$$3$$[$i$$5$$] = $src$$4$$[$i$$5$$])
  }
  return $dest$$3$$
}, $JSSMS$Utils$writeMem$$ = $SUPPORT_DATAVIEW$$ ? function($self$$2$$, $address$$, $value$$48$$) {
  if($address$$ >> 10 >= $self$$2$$.$memWriteMap$.length || !$self$$2$$.$memWriteMap$[$address$$ >> 10] || ($address$$ & 1023) >= $self$$2$$.$memWriteMap$[$address$$ >> 10].byteLength) {
    console.error($address$$, $address$$ >> 10, $address$$ & 1023);
    debugger
  }
  $self$$2$$.$memWriteMap$[$address$$ >> 10].setInt8($address$$ & 1023, $value$$48$$);
  65532 <= $address$$ && $self$$2$$.page($address$$ & 3, $value$$48$$)
} : function($self$$3$$, $address$$1$$, $value$$49$$) {
  $self$$3$$.$memWriteMap$[$address$$1$$ >> 10][$address$$1$$ & 1023] = $value$$49$$;
  65532 <= $address$$1$$ && $self$$3$$.page($address$$1$$ & 3, $value$$49$$)
}, $JSSMS$Utils$readMem$$ = $SUPPORT_DATAVIEW$$ ? function($array$$9$$, $address$$2$$) {
  if($address$$2$$ >> 10 >= $array$$9$$.length || !$array$$9$$[$address$$2$$ >> 10] || ($address$$2$$ & 1023) >= $array$$9$$[$address$$2$$ >> 10].byteLength) {
    console.error($address$$2$$, $address$$2$$ >> 10, $address$$2$$ & 1023);
    debugger
  }
  return $array$$9$$[$address$$2$$ >> 10].getUint8($address$$2$$ & 1023)
} : function($array$$10$$, $address$$3$$) {
  return $array$$10$$[$address$$3$$ >> 10][$address$$3$$ & 1023] & 255
}, $JSSMS$Utils$readMemWord$$ = $SUPPORT_DATAVIEW$$ ? function($array$$11$$, $address$$4$$) {
  if($address$$4$$ >> 10 >= $array$$11$$.length || !$array$$11$$[$address$$4$$ >> 10] || ($address$$4$$ & 1023) >= $array$$11$$[$address$$4$$ >> 10].byteLength) {
    console.error($address$$4$$, $address$$4$$ >> 10, $address$$4$$ & 1023);
    debugger
  }
  return 1023 > ($address$$4$$ & 1023) ? $array$$11$$[$address$$4$$ >> 10].getUint16($address$$4$$ & 1023, $JSCompiler_alias_TRUE$$) : $array$$11$$[$address$$4$$ >> 10].getUint8($address$$4$$ & 1023) | $array$$11$$[++$address$$4$$ >> 10].getUint8($address$$4$$ & 1023) << 8
} : function($array$$12$$, $address$$5$$) {
  return $array$$12$$[$address$$5$$ >> 10][$address$$5$$ & 1023] & 255 | ($array$$12$$[++$address$$5$$ >> 10][$address$$5$$ & 1023] & 255) << 8
}, $JSSMS$Utils$getTimestamp$$ = Date.now || function() {
  return(new Date).getTime()
};
function $JSSMS$Utils$getPrefix$$($arr$$16$$, $obj$$35$$) {
  var $prefix$$2$$ = $JSCompiler_alias_FALSE$$;
  $obj$$35$$ == $JSCompiler_alias_VOID$$ && ($obj$$35$$ = document);
  $arr$$16$$.some(function($prop$$4$$) {
    return $prop$$4$$ in $obj$$35$$ ? ($prefix$$2$$ = $prop$$4$$, $JSCompiler_alias_TRUE$$) : $JSCompiler_alias_FALSE$$
  });
  return $prefix$$2$$
}
;var $endingInst$$ = [].concat([194, 195, 202, 210, 218, 226, 233, 234, 242, 250], [16, 24, 32, 40, 48, 56], [196, 204, 205, 212, 220, 228, 236, 244, 252], [192, 200, 201, 208, 216, 224, 232, 240, 248], [243], [221, 253, 237, 118]);
function $JSSMS$Z80DynaRec$$() {
}
$JSSMS$Z80DynaRec$$.prototype = {$init$:function $$JSSMS$Z80DynaRec$$$$$init$$() {
  for(var $i$$inline_31$$ = 0;255 >= $i$$inline_31$$;$i$$inline_31$$++) {
    this.$opcodeInstructions$[$i$$inline_31$$] = $JSCompiler_StaticMethods_getOpCodeInst$$(this, $i$$inline_31$$)
  }
}, $dynarecPart2$:function $$JSSMS$Z80DynaRec$$$$$dynarecPart2$$() {
  this.$pc$++
}, $dynarecPart4$:function $$JSSMS$Z80DynaRec$$$$$dynarecPart4$$() {
  this.$tstates$ -= 2
}};
function $JSCompiler_StaticMethods_cleanFunction$$($func$$3$$) {
  return $func$$3$$.toString().replace(/"use strict";/, "").replace(/function ?[^(]*\(\) ?{/, "").replace(/}$/, "").trim().replace(/\r?\n|\r/g, "\n").replace(/^\s+/gm, "")
}
function $JSCompiler_StaticMethods_getOpCodeInst$$($JSCompiler_StaticMethods_getOpCodeInst$self$$, $opcode$$2$$) {
  var $preinst$$ = [], $inst_tstatesDecrementValue$$ = "", $inst_tstatesDecrementValue$$ = $OP_STATES$$[$opcode$$2$$], $hex$$inline_34$$ = $opcode$$2$$.toString(16);
  1 == $hex$$inline_34$$.length && ($hex$$inline_34$$ = "0" + $hex$$inline_34$$);
  $preinst$$.push("/* opcode: 0x" + $hex$$inline_34$$ + "*/");
  $preinst$$.push($JSCompiler_StaticMethods_cleanFunction$$($JSCompiler_StaticMethods_getOpCodeInst$self$$.$dynarecPart2$));
  0 < $inst_tstatesDecrementValue$$ && $preinst$$.push($JSCompiler_StaticMethods_cleanFunction$$($JSCompiler_StaticMethods_getOpCodeInst$self$$.$dynarecPart4$).replace("2", $inst_tstatesDecrementValue$$));
  $inst_tstatesDecrementValue$$ = $JSCompiler_StaticMethods_cleanFunction$$({"0":$JSCompiler_emptyFn$$(), 1:function() {
    this.$c$ = this.$readMem$(this.$pc$++);
    this.$b$ = this.$readMem$(this.$pc$++)
  }, 2:function() {
    this.$writeMem$(this.$b$ << 8 | this.$c$, this.$a$)
  }, 3:function() {
    this.$c$ = this.$c$ + 1 & 255;
    0 == this.$c$ && (this.$b$ = this.$b$ + 1 & 255)
  }, 4:function() {
    this.$b$ = this.$b$ + 1 & 255;
    this.$f$ = this.$f$ & 1 | this.$SZHV_INC_TABLE$[this.$b$]
  }, 5:function() {
    this.$b$ = this.$b$ - 1 & 255;
    this.$f$ = this.$f$ & 1 | this.$SZHV_DEC_TABLE$[this.$b$]
  }, 6:function() {
    this.$b$ = this.$readMem$(this.$pc$++)
  }, 7:function() {
    var $carry$$ = this.$a$ >> 7;
    this.$a$ = this.$a$ << 1 & 255 | $carry$$;
    this.$f$ = this.$f$ & 236 | $carry$$
  }, 8:function() {
    var $temp$$ = this.$a$;
    this.$a$ = this.$a2$;
    this.$a2$ = $temp$$;
    $temp$$ = this.$f$;
    this.$f$ = this.$f2$;
    this.$f2$ = $temp$$
  }, 9:function() {
    var $reg_value1$$6$$ = this.$h$ << 8 | this.$l$, $value$$50$$ = this.$b$ << 8 | this.$c$, $result$$ = $reg_value1$$6$$ + $value$$50$$;
    this.$f$ = this.$f$ & 196 | ($reg_value1$$6$$ ^ $result$$ ^ $value$$50$$) >> 8 & 16 | $result$$ >> 16 & 1;
    $reg_value1$$6$$ = $result$$ & 65535;
    this.$h$ = $reg_value1$$6$$ >> 8;
    this.$l$ = $reg_value1$$6$$ & 255
  }, 10:function() {
    this.$a$ = this.$readMem$(this.$b$ << 8 | this.$c$)
  }, 11:function() {
    this.$c$ = this.$c$ - 1 & 255;
    255 == this.$c$ && (this.$b$ = this.$b$ - 1 & 255)
  }, 12:function() {
    this.$c$ = this.$c$ + 1 & 255;
    this.$f$ = this.$f$ & 1 | this.$SZHV_INC_TABLE$[this.$c$]
  }, 13:function() {
    this.$c$ = this.$c$ - 1 & 255;
    this.$f$ = this.$f$ & 1 | this.$SZHV_DEC_TABLE$[this.$c$]
  }, 14:function() {
    this.$c$ = this.$readMem$(this.$pc$++)
  }, 15:function() {
    var $carry$$1$$ = this.$a$ & 1;
    this.$a$ = this.$a$ >> 1 | $carry$$1$$ << 7;
    this.$f$ = this.$f$ & 236 | $carry$$1$$
  }, 16:function() {
    this.$b$ = this.$b$ - 1 & 255;
    if(0 != this.$b$) {
      var $d$$ = $JSCompiler_StaticMethods_d_$$(this) + 1;
      128 <= $d$$ && ($d$$ -= 256);
      this.$pc$ += $d$$;
      this.$tstates$ -= 5
    }else {
      this.$pc$++
    }
  }, 17:function() {
    this.$e$ = this.$readMem$(this.$pc$++);
    this.$d$ = this.$readMem$(this.$pc$++)
  }, 18:function() {
    this.$writeMem$(this.$d$ << 8 | this.$e$, this.$a$)
  }, 19:function() {
    this.$e$ = this.$e$ + 1 & 255;
    0 == this.$e$ && (this.$d$ = this.$d$ + 1 & 255)
  }, 20:function() {
    this.$d$ = this.$d$ + 1 & 255;
    this.$f$ = this.$f$ & 1 | this.$SZHV_INC_TABLE$[this.$d$]
  }, 21:function() {
    this.$d$ = this.$d$ - 1 & 255;
    this.$f$ = this.$f$ & 1 | this.$SZHV_DEC_TABLE$[this.$d$]
  }, 22:function() {
    this.$d$ = this.$readMem$(this.$pc$++)
  }, 23:function() {
    var $carry$$2$$ = this.$a$ >> 7;
    this.$a$ = (this.$a$ << 1 | this.$f$ & 1) & 255;
    this.$f$ = this.$f$ & 236 | $carry$$2$$
  }, 24:function() {
    this.$pc$ += this.$readMem$(this.$pc$) + 1
  }, 25:function() {
    var $result$$1$$ = (this.$h$ << 8 | this.$l$) + (this.$d$ << 8 | this.$e$);
    this.$f$ = this.$f$ & 196 | ((this.$h$ << 8 | this.$l$) ^ $result$$1$$ ^ (this.$d$ << 8 | this.$e$)) >> 8 & 16 | $result$$1$$ >> 16 & 1;
    this.$h$ = ($result$$1$$ & 65535) >> 8;
    this.$l$ = $result$$1$$ & 255
  }, 26:function() {
    this.$a$ = this.$readMem$(this.$d$ << 8 | this.$e$)
  }, 27:function() {
    this.$e$ = this.$e$ - 1 & 255;
    255 == this.$e$ && (this.$d$ = this.$d$ - 1 & 255)
  }, 28:function() {
    this.$e$ = this.$e$ + 1 & 255;
    this.$f$ = this.$f$ & 1 | this.$SZHV_INC_TABLE$[this.$e$]
  }, 29:function() {
    this.$e$ = this.$e$ - 1 & 255;
    this.$f$ = this.$f$ & 1 | this.$SZHV_DEC_TABLE$[this.$e$]
  }, 30:function() {
    this.$e$ = this.$readMem$(this.$pc$++)
  }, 31:function() {
    var $carry$$3$$ = this.$a$ & 1;
    this.$a$ = (this.$a$ >> 1 | (this.$f$ & 1) << 7) & 255;
    this.$f$ = this.$f$ & 236 | $carry$$3$$
  }, 32:function() {
    if(0 == (this.$f$ & 64)) {
      var $d$$1$$ = $JSCompiler_StaticMethods_d_$$(this) + 1;
      128 <= $d$$1$$ && ($d$$1$$ -= 256);
      this.$pc$ += $d$$1$$;
      this.$tstates$ -= 5
    }else {
      this.$pc$++
    }
  }, 33:function() {
    this.$l$ = this.$readMem$(this.$pc$++);
    this.$h$ = this.$readMem$(this.$pc$++)
  }, 34:function() {
    var $location$$21$$ = this.$readMemWord$(this.$pc$);
    this.$writeMem$($location$$21$$, this.$l$);
    this.$writeMem$(++$location$$21$$, this.$h$);
    this.$pc$ += 2
  }, 35:function() {
    this.$l$ = this.$l$ + 1 & 255;
    0 == this.$l$ && (this.$h$ = this.$h$ + 1 & 255)
  }, 36:function() {
    this.$h$ = this.$h$ + 1 & 255;
    this.$f$ = this.$f$ & 1 | this.$SZHV_INC_TABLE$[this.$h$]
  }, 37:function() {
    this.$h$ = this.$h$ - 1 & 255;
    this.$f$ = this.$f$ & 1 | this.$SZHV_DEC_TABLE$[this.$h$]
  }, 38:function() {
    this.$h$ = this.$readMem$(this.$pc$++)
  }, 39:function() {
    var $temp$$1$$ = this.$DAA_TABLE$[this.$a$ | (this.$f$ & 1) << 8 | (this.$f$ & 2) << 8 | (this.$f$ & 16) << 6];
    this.$a$ = $temp$$1$$ & 255;
    this.$f$ = this.$f$ & 2 | $temp$$1$$ >> 8
  }, 40:function() {
    if(0 != (this.$f$ & 64)) {
      var $d$$2$$ = $JSCompiler_StaticMethods_d_$$(this) + 1;
      128 <= $d$$2$$ && ($d$$2$$ -= 256);
      this.$pc$ += $d$$2$$;
      this.$tstates$ -= 5
    }else {
      this.$pc$++
    }
  }, 41:function() {
    var $result$$2$$ = (this.$h$ << 8 | this.$l$) + (this.$h$ << 8 | this.$l$);
    this.$f$ = this.$f$ & 196 | ((this.$h$ << 8 | this.$l$) ^ $result$$2$$ ^ (this.$h$ << 8 | this.$l$)) >> 8 & 16 | $result$$2$$ >> 16 & 1;
    this.$h$ = ($result$$2$$ & 65535) >> 8;
    this.$l$ = $result$$2$$ & 255
  }, 42:function() {
    var $location$$22$$ = this.$readMemWord$(this.$pc$);
    this.$l$ = this.$readMem$($location$$22$$);
    this.$h$ = this.$readMem$($location$$22$$ + 1);
    this.$pc$ += 2
  }, 43:function() {
    this.$l$ = this.$l$ - 1 & 255;
    255 == this.$l$ && (this.$h$ = this.$h$ - 1 & 255)
  }, 44:function() {
    this.$l$ = this.$l$ + 1 & 255;
    this.$f$ = this.$f$ & 1 | this.$SZHV_INC_TABLE$[this.$l$]
  }, 45:function() {
    this.$l$ = this.$l$ - 1 & 255;
    this.$f$ = this.$f$ & 1 | this.$SZHV_DEC_TABLE$[this.$l$]
  }, 46:function() {
    this.$l$ = this.$readMem$(this.$pc$++)
  }, 47:function() {
    this.$a$ ^= 255;
    this.$f$ |= 18
  }, 48:function() {
    if(0 == (this.$f$ & 1)) {
      var $d$$3$$ = $JSCompiler_StaticMethods_d_$$(this) + 1;
      128 <= $d$$3$$ && ($d$$3$$ -= 256);
      this.$pc$ += $d$$3$$;
      this.$tstates$ -= 5
    }else {
      this.$pc$++
    }
  }, 49:function() {
    this.$sp$ = this.$readMemWord$(this.$pc$);
    this.$pc$ += 2
  }, 50:function() {
    this.$writeMem$(this.$readMemWord$(this.$pc$), this.$a$);
    this.$pc$ += 2
  }, 51:function() {
    this.$sp$++
  }, 52:function() {
    this.$writeMem$(this.$h$ << 8 | this.$l$, $JSCompiler_StaticMethods_inc8$$(this, this.$readMem$(this.$h$ << 8 | this.$l$)))
  }, 53:function() {
    var $offset$$14$$ = this.$h$ << 8 | this.$l$, $value$$51$$ = this.$readMem$($offset$$14$$), $value$$51$$ = $value$$51$$ - 1 & 255;
    this.$f$ = this.$f$ & 1 | this.$SZHV_DEC_TABLE$[$value$$51$$];
    this.$writeMem$($offset$$14$$, $value$$51$$)
  }, 54:function() {
    this.$writeMem$(this.$h$ << 8 | this.$l$, this.$readMem$(this.$pc$++))
  }, 55:function() {
    this.$f$ |= 1;
    this.$f$ &= -3;
    this.$f$ &= -17
  }, 56:function() {
    if(0 != (this.$f$ & 1)) {
      var $d$$4$$ = $JSCompiler_StaticMethods_d_$$(this) + 1;
      128 <= $d$$4$$ && ($d$$4$$ -= 256);
      this.$pc$ += $d$$4$$;
      this.$tstates$ -= 5
    }else {
      this.$pc$++
    }
  }, 57:function() {
    var $result$$3$$ = (this.$h$ << 8 | this.$l$) + this.$sp$;
    this.$f$ = this.$f$ & 196 | ((this.$h$ << 8 | this.$l$) ^ $result$$3$$ ^ this.$sp$) >> 8 & 16 | $result$$3$$ >> 16 & 1;
    this.$h$ = ($result$$3$$ & 65535) >> 8;
    this.$l$ = $result$$3$$ & 255
  }, 58:function() {
    this.$a$ = this.$readMem$(this.$readMemWord$(this.$pc$));
    this.$pc$ += 2
  }, 59:function() {
    this.$sp$--
  }, 60:function() {
    this.$a$ = this.$a$ + 1 & 255;
    this.$f$ = this.$f$ & 1 | this.$SZHV_INC_TABLE$[this.$a$]
  }, 61:function() {
    this.$a$ = this.$a$ - 1 & 255;
    this.$f$ = this.$f$ & 1 | this.$SZHV_DEC_TABLE$[this.$a$]
  }, 62:function() {
    this.$a$ = this.$readMem$(this.$pc$++)
  }, 63:function() {
    0 != (this.$f$ & 1) ? (this.$f$ &= -2, this.$f$ |= 16) : (this.$f$ |= 1, this.$f$ &= -17);
    this.$f$ &= -3
  }, 64:$JSCompiler_emptyFn$$(), 65:function() {
    this.$b$ = this.$c$
  }, 66:function() {
    this.$b$ = this.$d$
  }, 67:function() {
    this.$b$ = this.$e$
  }, 68:function() {
    this.$b$ = this.$h$
  }, 69:function() {
    this.$b$ = this.$l$
  }, 70:function() {
    this.$b$ = this.$readMem$(this.$h$ << 8 | this.$l$)
  }, 71:function() {
    this.$b$ = this.$a$
  }, 72:function() {
    this.$c$ = this.$b$
  }, 73:$JSCompiler_emptyFn$$(), 74:function() {
    this.$c$ = this.$d$
  }, 75:function() {
    this.$c$ = this.$e$
  }, 76:function() {
    this.$c$ = this.$h$
  }, 77:function() {
    this.$c$ = this.$l$
  }, 78:function() {
    this.$c$ = this.$readMem$(this.$h$ << 8 | this.$l$)
  }, 79:function() {
    this.$c$ = this.$a$
  }, 80:function() {
    this.$d$ = this.$b$
  }, 81:function() {
    this.$d$ = this.$c$
  }, 82:$JSCompiler_emptyFn$$(), 83:function() {
    this.$d$ = this.$e$
  }, 84:function() {
    this.$d$ = this.$h$
  }, 85:function() {
    this.$d$ = this.$l$
  }, 86:function() {
    this.$d$ = this.$readMem$(this.$h$ << 8 | this.$l$)
  }, 87:function() {
    this.$d$ = this.$a$
  }, 88:function() {
    this.$e$ = this.$b$
  }, 89:function() {
    this.$e$ = this.$c$
  }, 90:function() {
    this.$e$ = this.$d$
  }, 91:$JSCompiler_emptyFn$$(), 92:function() {
    this.$e$ = this.$h$
  }, 93:function() {
    this.$e$ = this.$l$
  }, 94:function() {
    this.$e$ = this.$readMem$(this.$h$ << 8 | this.$l$)
  }, 95:function() {
    this.$e$ = this.$a$
  }, 96:function() {
    this.$h$ = this.$b$
  }, 97:function() {
    this.$h$ = this.$c$
  }, 98:function() {
    this.$h$ = this.$d$
  }, 99:function() {
    this.$h$ = this.$e$
  }, 100:$JSCompiler_emptyFn$$(), 101:function() {
    this.$h$ = this.$l$
  }, 102:function() {
    this.$h$ = this.$readMem$(this.$h$ << 8 | this.$l$)
  }, 103:function() {
    this.$h$ = this.$a$
  }, 104:function() {
    this.$l$ = this.$b$
  }, 105:function() {
    this.$l$ = this.$c$
  }, 106:function() {
    this.$l$ = this.$d$
  }, 107:function() {
    this.$l$ = this.$e$
  }, 108:function() {
    this.$l$ = this.$h$
  }, 109:$JSCompiler_emptyFn$$(), 110:function() {
    this.$l$ = this.$readMem$(this.$h$ << 8 | this.$l$)
  }, 111:function() {
    this.$l$ = this.$a$
  }, 112:function() {
    this.$writeMem$(this.$h$ << 8 | this.$l$, this.$b$)
  }, 113:function() {
    this.$writeMem$(this.$h$ << 8 | this.$l$, this.$c$)
  }, 114:function() {
    this.$writeMem$(this.$h$ << 8 | this.$l$, this.$d$)
  }, 115:function() {
    this.$writeMem$(this.$h$ << 8 | this.$l$, this.$e$)
  }, 116:function() {
    this.$writeMem$(this.$h$ << 8 | this.$l$, this.$h$)
  }, 117:function() {
    this.$writeMem$(this.$h$ << 8 | this.$l$, this.$l$)
  }, 118:function() {
    this.$tstates$ = 0;
    this.$halt$ = $JSCompiler_alias_TRUE$$;
    this.$pc$--
  }, 119:function() {
    this.$writeMem$(this.$h$ << 8 | this.$l$, this.$a$)
  }, 120:function() {
    this.$a$ = this.$b$
  }, 121:function() {
    this.$a$ = this.$c$
  }, 122:function() {
    this.$a$ = this.$d$
  }, 123:function() {
    this.$a$ = this.$e$
  }, 124:function() {
    this.$a$ = this.$h$
  }, 125:function() {
    this.$a$ = this.$l$
  }, 126:function() {
    this.$a$ = this.$readMem$(this.$h$ << 8 | this.$l$)
  }, 127:$JSCompiler_emptyFn$$(), 128:function() {
    var $temp$$2$$ = this.$a$ + this.$b$ & 255;
    this.$f$ = this.$SZHVC_ADD_TABLE$[this.$a$ << 8 | $temp$$2$$];
    this.$a$ = $temp$$2$$
  }, 129:function() {
    var $temp$$3$$ = this.$a$ + this.$c$ & 255;
    this.$f$ = this.$SZHVC_ADD_TABLE$[this.$a$ << 8 | $temp$$3$$];
    this.$a$ = $temp$$3$$
  }, 130:function() {
    var $temp$$4$$ = this.$a$ + this.$d$ & 255;
    this.$f$ = this.$SZHVC_ADD_TABLE$[this.$a$ << 8 | $temp$$4$$];
    this.$a$ = $temp$$4$$
  }, 131:function() {
    var $temp$$5$$ = this.$a$ + this.$e$ & 255;
    this.$f$ = this.$SZHVC_ADD_TABLE$[this.$a$ << 8 | $temp$$5$$];
    this.$a$ = $temp$$5$$
  }, 132:function() {
    var $temp$$6$$ = this.$a$ + this.$h$ & 255;
    this.$f$ = this.$SZHVC_ADD_TABLE$[this.$a$ << 8 | $temp$$6$$];
    this.$a$ = $temp$$6$$
  }, 133:function() {
    var $temp$$7$$ = this.$a$ + this.$l$ & 255;
    this.$f$ = this.$SZHVC_ADD_TABLE$[this.$a$ << 8 | $temp$$7$$];
    this.$a$ = $temp$$7$$
  }, 134:function() {
    var $temp$$8$$ = this.$a$ + this.$readMem$(this.$h$ << 8 | this.$l$) & 255;
    this.$f$ = this.$SZHVC_ADD_TABLE$[this.$a$ << 8 | $temp$$8$$];
    this.$a$ = $temp$$8$$
  }, 135:function() {
    var $temp$$9$$ = this.$a$ + this.$a$ & 255;
    this.$f$ = this.$SZHVC_ADD_TABLE$[this.$a$ << 8 | $temp$$9$$];
    this.$a$ = $temp$$9$$
  }, 136:function() {
    var $carry$$4$$ = this.$f$ & 1, $temp$$10$$ = this.$a$ + this.$b$ + $carry$$4$$ & 255;
    this.$f$ = this.$SZHVC_ADD_TABLE$[$carry$$4$$ << 16 | this.$a$ << 8 | $temp$$10$$];
    this.$a$ = $temp$$10$$
  }, 137:function() {
    var $carry$$5$$ = this.$f$ & 1, $temp$$11$$ = this.$a$ + this.$c$ + $carry$$5$$ & 255;
    this.$f$ = this.$SZHVC_ADD_TABLE$[$carry$$5$$ << 16 | this.$a$ << 8 | $temp$$11$$];
    this.$a$ = $temp$$11$$
  }, 138:function() {
    var $carry$$6$$ = this.$f$ & 1, $temp$$12$$ = this.$a$ + this.$d$ + $carry$$6$$ & 255;
    this.$f$ = this.$SZHVC_ADD_TABLE$[$carry$$6$$ << 16 | this.$a$ << 8 | $temp$$12$$];
    this.$a$ = $temp$$12$$
  }, 139:function() {
    var $carry$$7$$ = this.$f$ & 1, $temp$$13$$ = this.$a$ + this.$e$ + $carry$$7$$ & 255;
    this.$f$ = this.$SZHVC_ADD_TABLE$[$carry$$7$$ << 16 | this.$a$ << 8 | $temp$$13$$];
    this.$a$ = $temp$$13$$
  }, 140:function() {
    var $carry$$8$$ = this.$f$ & 1, $temp$$14$$ = this.$a$ + this.$h$ + $carry$$8$$ & 255;
    this.$f$ = this.$SZHVC_ADD_TABLE$[$carry$$8$$ << 16 | this.$a$ << 8 | $temp$$14$$];
    this.$a$ = $temp$$14$$
  }, 141:function() {
    var $carry$$9$$ = this.$f$ & 1, $temp$$15$$ = this.$a$ + this.$l$ + $carry$$9$$ & 255;
    this.$f$ = this.$SZHVC_ADD_TABLE$[$carry$$9$$ << 16 | this.$a$ << 8 | $temp$$15$$];
    this.$a$ = $temp$$15$$
  }, 142:function() {
    var $carry$$10$$ = this.$f$ & 1, $temp$$16$$ = this.$a$ + this.$readMem$(this.$h$ << 8 | this.$l$) + $carry$$10$$ & 255;
    this.$f$ = this.$SZHVC_ADD_TABLE$[$carry$$10$$ << 16 | this.$a$ << 8 | $temp$$16$$];
    this.$a$ = $temp$$16$$
  }, 143:function() {
    var $carry$$11$$ = this.$f$ & 1, $temp$$17$$ = this.$a$ + this.$a$ + $carry$$11$$ & 255;
    this.$f$ = this.$SZHVC_ADD_TABLE$[$carry$$11$$ << 16 | this.$a$ << 8 | $temp$$17$$];
    this.$a$ = $temp$$17$$
  }, 144:function() {
    var $temp$$18$$ = this.$a$ - this.$b$ & 255;
    this.$f$ = this.$SZHVC_SUB_TABLE$[this.$a$ << 8 | $temp$$18$$];
    this.$a$ = $temp$$18$$
  }, 145:function() {
    var $temp$$19$$ = this.$a$ - this.$c$ & 255;
    this.$f$ = this.$SZHVC_SUB_TABLE$[this.$a$ << 8 | $temp$$19$$];
    this.$a$ = $temp$$19$$
  }, 146:function() {
    var $temp$$20$$ = this.$a$ - this.$d$ & 255;
    this.$f$ = this.$SZHVC_SUB_TABLE$[this.$a$ << 8 | $temp$$20$$];
    this.$a$ = $temp$$20$$
  }, 147:function() {
    var $temp$$21$$ = this.$a$ - this.$e$ & 255;
    this.$f$ = this.$SZHVC_SUB_TABLE$[this.$a$ << 8 | $temp$$21$$];
    this.$a$ = $temp$$21$$
  }, 148:function() {
    var $temp$$22$$ = this.$a$ - this.$h$ & 255;
    this.$f$ = this.$SZHVC_SUB_TABLE$[this.$a$ << 8 | $temp$$22$$];
    this.$a$ = $temp$$22$$
  }, 149:function() {
    var $temp$$23$$ = this.$a$ - this.$l$ & 255;
    this.$f$ = this.$SZHVC_SUB_TABLE$[this.$a$ << 8 | $temp$$23$$];
    this.$a$ = $temp$$23$$
  }, 150:function() {
    var $temp$$24$$ = this.$a$ - this.$readMem$(this.$h$ << 8 | this.$l$) & 255;
    this.$f$ = this.$SZHVC_SUB_TABLE$[this.$a$ << 8 | $temp$$24$$];
    this.$a$ = $temp$$24$$
  }, 151:function() {
    var $temp$$25$$ = this.$a$ - this.$a$ & 255;
    this.$f$ = this.$SZHVC_SUB_TABLE$[this.$a$ << 8 | $temp$$25$$];
    this.$a$ = $temp$$25$$
  }, 152:function() {
    var $carry$$12$$ = this.$f$ & 1, $temp$$26$$ = this.$a$ - this.$b$ - $carry$$12$$ & 255;
    this.$f$ = this.$SZHVC_SUB_TABLE$[$carry$$12$$ << 16 | this.$a$ << 8 | $temp$$26$$];
    this.$a$ = $temp$$26$$
  }, 153:function() {
    var $carry$$13$$ = this.$f$ & 1, $temp$$27$$ = this.$a$ - this.$c$ - $carry$$13$$ & 255;
    this.$f$ = this.$SZHVC_SUB_TABLE$[$carry$$13$$ << 16 | this.$a$ << 8 | $temp$$27$$];
    this.$a$ = $temp$$27$$
  }, 154:function() {
    var $carry$$14$$ = this.$f$ & 1, $temp$$28$$ = this.$a$ - this.$d$ - $carry$$14$$ & 255;
    this.$f$ = this.$SZHVC_SUB_TABLE$[$carry$$14$$ << 16 | this.$a$ << 8 | $temp$$28$$];
    this.$a$ = $temp$$28$$
  }, 155:function() {
    var $carry$$15$$ = this.$f$ & 1, $temp$$29$$ = this.$a$ - this.$e$ - $carry$$15$$ & 255;
    this.$f$ = this.$SZHVC_SUB_TABLE$[$carry$$15$$ << 16 | this.$a$ << 8 | $temp$$29$$];
    this.$a$ = $temp$$29$$
  }, 156:function() {
    var $carry$$16$$ = this.$f$ & 1, $temp$$30$$ = this.$a$ - this.$h$ - $carry$$16$$ & 255;
    this.$f$ = this.$SZHVC_SUB_TABLE$[$carry$$16$$ << 16 | this.$a$ << 8 | $temp$$30$$];
    this.$a$ = $temp$$30$$
  }, 157:function() {
    var $carry$$17$$ = this.$f$ & 1, $temp$$31$$ = this.$a$ - this.$l$ - $carry$$17$$ & 255;
    this.$f$ = this.$SZHVC_SUB_TABLE$[$carry$$17$$ << 16 | this.$a$ << 8 | $temp$$31$$];
    this.$a$ = $temp$$31$$
  }, 158:function() {
    var $carry$$18$$ = this.$f$ & 1, $temp$$32$$ = this.$a$ - this.$readMem$(this.$h$ << 8 | this.$l$) - $carry$$18$$ & 255;
    this.$f$ = this.$SZHVC_SUB_TABLE$[$carry$$18$$ << 16 | this.$a$ << 8 | $temp$$32$$];
    this.$a$ = $temp$$32$$
  }, 159:function() {
    var $carry$$19$$ = this.$f$ & 1, $temp$$33$$ = this.$a$ - this.$a$ - $carry$$19$$ & 255;
    this.$f$ = this.$SZHVC_SUB_TABLE$[$carry$$19$$ << 16 | this.$a$ << 8 | $temp$$33$$];
    this.$a$ = $temp$$33$$
  }, 160:function() {
    this.$f$ = this.$SZP_TABLE$[this.$a$ &= this.$b$] | 16
  }, 161:function() {
    this.$f$ = this.$SZP_TABLE$[this.$a$ &= this.$c$] | 16
  }, 162:function() {
    this.$f$ = this.$SZP_TABLE$[this.$a$ &= this.$d$] | 16
  }, 163:function() {
    this.$f$ = this.$SZP_TABLE$[this.$a$ &= this.$e$] | 16
  }, 164:function() {
    this.$f$ = this.$SZP_TABLE$[this.$a$ &= this.$h$] | 16
  }, 165:function() {
    this.$f$ = this.$SZP_TABLE$[this.$a$ &= this.$l$] | 16
  }, 166:function() {
    this.$f$ = this.$SZP_TABLE$[this.$a$ &= this.$readMem$(this.$h$ << 8 | this.$l$)] | 16
  }, 167:function() {
    this.$f$ = this.$SZP_TABLE$[this.$a$] | 16
  }, 168:function() {
    this.$f$ = this.$SZP_TABLE$[this.$a$ ^= this.$b$]
  }, 169:function() {
    this.$f$ = this.$SZP_TABLE$[this.$a$ ^= this.$c$]
  }, 170:function() {
    this.$f$ = this.$SZP_TABLE$[this.$a$ ^= this.$d$]
  }, 171:function() {
    this.$f$ = this.$SZP_TABLE$[this.$a$ ^= this.$e$]
  }, 172:function() {
    this.$f$ = this.$SZP_TABLE$[this.$a$ ^= this.$h$]
  }, 173:function() {
    this.$f$ = this.$SZP_TABLE$[this.$a$ ^= this.$l$]
  }, 174:function() {
    this.$f$ = this.$SZP_TABLE$[this.$a$ ^= this.$readMem$(this.$h$ << 8 | this.$l$)]
  }, 175:function() {
    this.$f$ = this.$SZP_TABLE$[this.$a$ = 0]
  }, 176:function() {
    this.$f$ = this.$SZP_TABLE$[this.$a$ |= this.$b$]
  }, 177:function() {
    this.$f$ = this.$SZP_TABLE$[this.$a$ |= this.$c$]
  }, 178:function() {
    this.$f$ = this.$SZP_TABLE$[this.$a$ |= this.$d$]
  }, 179:function() {
    this.$f$ = this.$SZP_TABLE$[this.$a$ |= this.$e$]
  }, 180:function() {
    this.$f$ = this.$SZP_TABLE$[this.$a$ |= this.$h$]
  }, 181:function() {
    this.$f$ = this.$SZP_TABLE$[this.$a$ |= this.$l$]
  }, 182:function() {
    this.$f$ = this.$SZP_TABLE$[this.$a$ |= this.$readMem$(this.$h$ << 8 | this.$l$)]
  }, 183:function() {
    this.$f$ = this.$SZP_TABLE$[this.$a$]
  }, 184:function() {
    this.$f$ = this.$SZHVC_SUB_TABLE$[this.$a$ << 8 | this.$a$ - this.$b$ & 255]
  }, 185:function() {
    this.$f$ = this.$SZHVC_SUB_TABLE$[this.$a$ << 8 | this.$a$ - this.$c$ & 255]
  }, 186:function() {
    this.$f$ = this.$SZHVC_SUB_TABLE$[this.$a$ << 8 | this.$a$ - this.$d$ & 255]
  }, 187:function() {
    this.$f$ = this.$SZHVC_SUB_TABLE$[this.$a$ << 8 | this.$a$ - this.$e$ & 255]
  }, 188:function() {
    this.$f$ = this.$SZHVC_SUB_TABLE$[this.$a$ << 8 | this.$a$ - this.$h$ & 255]
  }, 189:function() {
    this.$f$ = this.$SZHVC_SUB_TABLE$[this.$a$ << 8 | this.$a$ - this.$l$ & 255]
  }, 190:function() {
    this.$f$ = this.$SZHVC_SUB_TABLE$[this.$a$ << 8 | this.$a$ - this.$readMem$(this.$h$ << 8 | this.$l$) & 255]
  }, 191:function() {
    this.$f$ = this.$SZHVC_SUB_TABLE$[this.$a$ << 8 | this.$a$ - this.$a$ & 255]
  }, 192:function() {
    0 == (this.$f$ & 64) && (this.$pc$ = this.$readMemWord$(this.$sp$), this.$sp$ += 2, this.$tstates$ -= 6)
  }, 193:function() {
    var $value$$inline_163$$ = this.$readMemWord$(this.$sp$);
    this.$b$ = $value$$inline_163$$ >> 8;
    this.$c$ = $value$$inline_163$$ & 255;
    this.$sp$ += 2
  }, 194:function() {
    this.$pc$ = 0 == (this.$f$ & 64) ? this.$readMemWord$(this.$pc$) : this.$pc$ + 2
  }, 195:function() {
    this.$pc$ = this.$readMemWord$(this.$pc$)
  }, 196:function() {
    0 == (this.$f$ & 64) ? (this.$writeMem$(--this.$sp$, this.$pc$ + 2 >> 8), this.$writeMem$(--this.$sp$, this.$pc$ + 2 & 255), this.$pc$ = this.$readMemWord$(this.$pc$), this.$tstates$ -= 7) : this.$pc$ += 2
  }, 197:function() {
    this.$writeMem$(--this.$sp$, this.$b$);
    this.$writeMem$(--this.$sp$, this.$c$)
  }, 198:function() {
    var $temp$$34$$ = this.$a$ + this.$readMem$(this.$pc$++) & 255;
    this.$f$ = this.$SZHVC_ADD_TABLE$[this.$a$ << 8 | $temp$$34$$];
    this.$a$ = $temp$$34$$
  }, 199:function() {
    this.$writeMem$(--this.$sp$, this.$pc$ >> 8);
    this.$writeMem$(--this.$sp$, this.$pc$ & 255);
    this.$pc$ = 0
  }, 200:function() {
    0 != (this.$f$ & 64) && (this.$pc$ = this.$readMemWord$(this.$sp$), this.$sp$ += 2, this.$tstates$ -= 6)
  }, 201:function() {
    this.$pc$ = this.$readMemWord$(this.$sp$);
    this.$sp$ += 2
  }, 202:function() {
    this.$pc$ = 0 != (this.$f$ & 64) ? this.$readMemWord$(this.$pc$) : this.$pc$ + 2
  }, 203:function() {
    $JSCompiler_StaticMethods_doCB$$(this, this.$readMem$(this.$pc$++))
  }, 204:function() {
    0 != (this.$f$ & 64) ? (this.$writeMem$(--this.$sp$, this.$pc$ + 2 >> 8), this.$writeMem$(--this.$sp$, this.$pc$ + 2 & 255), this.$pc$ = this.$readMemWord$(this.$pc$), this.$tstates$ -= 7) : this.$pc$ += 2
  }, 205:function() {
    this.$writeMem$(--this.$sp$, this.$pc$ + 2 >> 8);
    this.$writeMem$(--this.$sp$, this.$pc$ + 2 & 255);
    this.$pc$ = this.$readMemWord$(this.$pc$)
  }, 206:function() {
    var $carry$$20$$ = this.$f$ & 1, $temp$$35$$ = this.$a$ + this.$readMem$(this.$pc$++) + $carry$$20$$ & 255;
    this.$f$ = this.$SZHVC_ADD_TABLE$[$carry$$20$$ << 16 | this.$a$ << 8 | $temp$$35$$];
    this.$a$ = $temp$$35$$
  }, 207:function() {
    this.$writeMem$(--this.$sp$, this.$pc$ >> 8);
    this.$writeMem$(--this.$sp$, this.$pc$ & 255);
    this.$pc$ = 8
  }, 208:function() {
    0 == (this.$f$ & 1) && (this.$pc$ = this.$readMemWord$(this.$sp$), this.$sp$ += 2, this.$tstates$ -= 6)
  }, 209:function() {
    var $value$$52$$ = this.$readMemWord$(this.$sp$);
    this.$d$ = $value$$52$$ >> 8;
    this.$e$ = $value$$52$$ & 255;
    this.$sp$ += 2
  }, 210:function() {
    this.$pc$ = 0 == (this.$f$ & 1) ? this.$readMemWord$(this.$pc$) : this.$pc$ + 2
  }, 211:function() {
    $JSCompiler_StaticMethods_out$$(this.port, this.$readMem$(this.$pc$++), this.$a$)
  }, 212:function() {
    0 == (this.$f$ & 1) ? (this.$writeMem$(--this.$sp$, this.$pc$ + 2 >> 8), this.$writeMem$(--this.$sp$, this.$pc$ + 2 & 255), this.$pc$ = this.$readMemWord$(this.$pc$), this.$tstates$ -= 7) : this.$pc$ += 2
  }, 213:function() {
    this.$writeMem$(--this.$sp$, this.$d$);
    this.$writeMem$(--this.$sp$, this.$e$)
  }, 214:function() {
    var $temp$$36$$ = this.$a$ - this.$readMem$(this.$pc$++) & 255;
    this.$f$ = this.$SZHVC_SUB_TABLE$[this.$a$ << 8 | $temp$$36$$];
    this.$a$ = $temp$$36$$
  }, 215:function() {
    this.$writeMem$(--this.$sp$, this.$pc$ >> 8);
    this.$writeMem$(--this.$sp$, this.$pc$ & 255);
    this.$pc$ = 16
  }, 216:function() {
    0 != (this.$f$ & 1) && (this.$pc$ = this.$readMemWord$(this.$sp$), this.$sp$ += 2, this.$tstates$ -= 6)
  }, 217:function() {
    var $temp$$37$$ = this.$b$;
    this.$b$ = this.$b2$;
    this.$b2$ = $temp$$37$$;
    $temp$$37$$ = this.$c$;
    this.$c$ = this.$c2$;
    this.$c2$ = $temp$$37$$;
    $temp$$37$$ = this.$d$;
    this.$d$ = this.$d2$;
    this.$d2$ = $temp$$37$$;
    $temp$$37$$ = this.$e$;
    this.$e$ = this.$e2$;
    this.$e2$ = $temp$$37$$;
    $temp$$37$$ = this.$h$;
    this.$h$ = this.$h2$;
    this.$h2$ = $temp$$37$$;
    $temp$$37$$ = this.$l$;
    this.$l$ = this.$l2$;
    this.$l2$ = $temp$$37$$
  }, 218:function() {
    this.$pc$ = 0 != (this.$f$ & 1) ? this.$readMemWord$(this.$pc$) : this.$pc$ + 2
  }, 219:function() {
    this.$a$ = $JSCompiler_StaticMethods_in_$$(this.port, this.$readMem$(this.$pc$++))
  }, 220:function() {
    0 != (this.$f$ & 1) ? (this.$writeMem$(--this.$sp$, this.$pc$ + 2 >> 8), this.$writeMem$(--this.$sp$, this.$pc$ + 2 & 255), this.$pc$ = this.$readMemWord$(this.$pc$), this.$tstates$ -= 7) : this.$pc$ += 2
  }, 221:function() {
    $JSCompiler_StaticMethods_doIndexOpIX$$(this, this.$readMem$(this.$pc$++))
  }, 222:function() {
    var $carry$$21$$ = this.$f$ & 1, $temp$$38$$ = this.$a$ - this.$readMem$(this.$pc$++) - $carry$$21$$ & 255;
    this.$f$ = this.$SZHVC_SUB_TABLE$[$carry$$21$$ << 16 | this.$a$ << 8 | $temp$$38$$];
    this.$a$ = $temp$$38$$
  }, 223:function() {
    this.$writeMem$(--this.$sp$, this.$pc$ >> 8);
    this.$writeMem$(--this.$sp$, this.$pc$ & 255);
    this.$pc$ = 24
  }, 224:function() {
    0 == (this.$f$ & 4) && (this.$pc$ = this.$readMemWord$(this.$sp$), this.$sp$ += 2, this.$tstates$ -= 6)
  }, 225:function() {
    var $value$$53$$ = this.$readMemWord$(this.$sp$);
    this.$h$ = $value$$53$$ >> 8;
    this.$l$ = $value$$53$$ & 255;
    this.$sp$ += 2
  }, 226:function() {
    this.$pc$ = 0 == (this.$f$ & 4) ? this.$readMemWord$(this.$pc$) : this.$pc$ + 2
  }, 227:function() {
    var $temp$$39$$ = this.$h$;
    this.$h$ = this.$readMem$(this.$sp$ + 1);
    this.$writeMem$(this.$sp$ + 1, $temp$$39$$);
    $temp$$39$$ = this.$l$;
    this.$l$ = this.$readMem$(this.$sp$);
    this.$writeMem$(this.$sp$, $temp$$39$$)
  }, 228:function() {
    0 == (this.$f$ & 4) ? (this.$writeMem$(--this.$sp$, this.$pc$ + 2 >> 8), this.$writeMem$(--this.$sp$, this.$pc$ + 2 & 255), this.$pc$ = this.$readMemWord$(this.$pc$), this.$tstates$ -= 7) : this.$pc$ += 2
  }, 229:function() {
    this.$writeMem$(--this.$sp$, this.$h$);
    this.$writeMem$(--this.$sp$, this.$l$)
  }, 230:function() {
    this.$f$ = this.$SZP_TABLE$[this.$a$ &= this.$readMem$(this.$pc$++)] | 16
  }, 231:function() {
    this.$writeMem$(--this.$sp$, this.$pc$ >> 8);
    this.$writeMem$(--this.$sp$, this.$pc$ & 255);
    this.$pc$ = 32
  }, 232:function() {
    0 != (this.$f$ & 4) && (this.$pc$ = this.$readMemWord$(this.$sp$), this.$sp$ += 2, this.$tstates$ -= 6)
  }, 233:function() {
    this.$pc$ = this.$h$ << 8 | this.$l$
  }, 234:function() {
    this.$pc$ = 0 != (this.$f$ & 4) ? this.$readMemWord$(this.$pc$) : this.$pc$ + 2
  }, 235:function() {
    var $temp$$40$$ = this.$d$;
    this.$d$ = this.$h$;
    this.$h$ = $temp$$40$$;
    $temp$$40$$ = this.$e$;
    this.$e$ = this.$l$;
    this.$l$ = $temp$$40$$
  }, 236:function() {
    0 != (this.$f$ & 4) ? (this.$writeMem$(--this.$sp$, this.$pc$ + 2 >> 8), this.$writeMem$(--this.$sp$, this.$pc$ + 2 & 255), this.$pc$ = this.$readMemWord$(this.$pc$), this.$tstates$ -= 7) : this.$pc$ += 2
  }, 237:function() {
    $JSCompiler_StaticMethods_doED$$(this, this.$readMem$(this.$pc$))
  }, 238:function() {
    this.$f$ = this.$SZP_TABLE$[this.$a$ ^= this.$readMem$(this.$pc$++)]
  }, 239:function() {
    this.$writeMem$(--this.$sp$, this.$pc$ >> 8);
    this.$writeMem$(--this.$sp$, this.$pc$ & 255);
    this.$pc$ = 40
  }, 240:function() {
    0 == (this.$f$ & 128) && (this.$pc$ = this.$readMemWord$(this.$sp$), this.$sp$ += 2, this.$tstates$ -= 6)
  }, 241:function() {
    this.$f$ = this.$readMem$(this.$sp$++);
    this.$a$ = this.$readMem$(this.$sp$++)
  }, 242:function() {
    this.$pc$ = 0 == (this.$f$ & 128) ? this.$readMemWord$(this.$pc$) : this.$pc$ + 2
  }, 243:function() {
    this.$iff1$ = this.$iff2$ = $JSCompiler_alias_FALSE$$;
    this.$EI_inst$ = $JSCompiler_alias_TRUE$$
  }, 244:function() {
    0 == (this.$f$ & 128) ? (this.$writeMem$(--this.$sp$, this.$pc$ + 2 >> 8), this.$writeMem$(--this.$sp$, this.$pc$ + 2 & 255), this.$pc$ = this.$readMemWord$(this.$pc$), this.$tstates$ -= 7) : this.$pc$ += 2
  }, 245:function() {
    this.$writeMem$(--this.$sp$, this.$a$);
    this.$writeMem$(--this.$sp$, this.$f$)
  }, 246:function() {
    this.$f$ = this.$SZP_TABLE$[this.$a$ |= this.$readMem$(this.$pc$++)]
  }, 247:function() {
    this.$writeMem$(--this.$sp$, this.$pc$ >> 8);
    this.$writeMem$(--this.$sp$, this.$pc$ & 255);
    this.$pc$ = 48
  }, 248:function() {
    0 != (this.$f$ & 128) && (this.$pc$ = this.$readMemWord$(this.$sp$), this.$sp$ += 2, this.$tstates$ -= 6)
  }, 249:function() {
    this.$sp$ = this.$h$ << 8 | this.$l$
  }, 250:function() {
    this.$pc$ = 0 != (this.$f$ & 128) ? this.$readMemWord$(this.$pc$) : this.$pc$ + 2
  }, 251:function() {
    this.$EI_inst$ = this.$iff1$ = this.$iff2$ = $JSCompiler_alias_TRUE$$
  }, 252:function() {
    0 != (this.$f$ & 128) ? (this.$writeMem$(--this.$sp$, this.$pc$ + 2 >> 8), this.$writeMem$(--this.$sp$, this.$pc$ + 2 & 255), this.$pc$ = this.$readMemWord$(this.$pc$), this.$tstates$ -= 7) : this.$pc$ += 2
  }, 253:function() {
    $JSCompiler_StaticMethods_doIndexOpIY$$(this, this.$readMem$(this.$pc$++))
  }, 254:function() {
    this.$f$ = this.$SZHVC_SUB_TABLE$[this.$a$ << 8 | this.$a$ - this.$readMem$(this.$pc$++) & 255]
  }, 255:function() {
    this.$writeMem$(--this.$sp$, this.$pc$ >> 8);
    this.$writeMem$(--this.$sp$, this.$pc$ & 255);
    this.$pc$ = 56
  }}[$opcode$$2$$].toString());
  return($preinst$$.join("\n") + "\n" + $inst_tstatesDecrementValue$$).trim() + ";\n" + "".trim()
}
;var $OP_STATES$$ = [4, 10, 7, 6, 4, 4, 7, 4, 4, 11, 7, 6, 4, 4, 7, 4, 8, 10, 7, 6, 4, 4, 7, 4, 12, 11, 7, 6, 4, 4, 7, 4, 7, 10, 16, 6, 4, 4, 7, 4, 7, 11, 16, 6, 4, 4, 7, 4, 7, 10, 13, 6, 11, 11, 10, 4, 7, 11, 13, 6, 4, 4, 7, 4, 4, 4, 4, 4, 4, 4, 7, 4, 4, 4, 4, 4, 4, 4, 7, 4, 4, 4, 4, 4, 4, 4, 7, 4, 4, 4, 4, 4, 4, 4, 7, 4, 4, 4, 4, 4, 4, 4, 7, 4, 4, 4, 4, 4, 4, 4, 7, 4, 7, 7, 7, 7, 7, 7, 4, 7, 4, 4, 4, 4, 4, 4, 7, 4, 4, 4, 4, 4, 4, 4, 7, 4, 4, 4, 4, 4, 4, 4, 7, 4, 4, 4, 4, 4, 4, 4, 7, 4, 4, 4, 4, 
4, 4, 4, 7, 4, 4, 4, 4, 4, 4, 4, 7, 4, 4, 4, 4, 4, 4, 4, 7, 4, 4, 4, 4, 4, 4, 4, 7, 4, 4, 4, 4, 4, 4, 4, 7, 4, 5, 10, 10, 10, 10, 11, 7, 11, 5, 10, 10, 0, 10, 17, 7, 11, 5, 10, 10, 11, 10, 11, 7, 11, 5, 4, 10, 11, 10, 0, 7, 11, 5, 10, 10, 19, 10, 11, 7, 11, 5, 4, 10, 4, 10, 0, 7, 11, 5, 10, 10, 4, 10, 11, 7, 11, 5, 6, 10, 4, 10, 0, 7, 11], $OP_CB_STATES$$ = [8, 8, 8, 8, 8, 8, 15, 8, 8, 8, 8, 8, 8, 8, 15, 8, 8, 8, 8, 8, 8, 8, 15, 8, 8, 8, 8, 8, 8, 8, 15, 8, 8, 8, 8, 8, 8, 8, 15, 8, 8, 8, 8, 8, 8, 
8, 15, 8, 8, 8, 8, 8, 8, 8, 15, 8, 8, 8, 8, 8, 8, 8, 15, 8, 8, 8, 8, 8, 8, 8, 12, 8, 8, 8, 8, 8, 8, 8, 12, 8, 8, 8, 8, 8, 8, 8, 12, 8, 8, 8, 8, 8, 8, 8, 12, 8, 8, 8, 8, 8, 8, 8, 12, 8, 8, 8, 8, 8, 8, 8, 12, 8, 8, 8, 8, 8, 8, 8, 12, 8, 8, 8, 8, 8, 8, 8, 12, 8, 8, 8, 8, 8, 8, 8, 15, 8, 8, 8, 8, 8, 8, 8, 15, 8, 8, 8, 8, 8, 8, 8, 15, 8, 8, 8, 8, 8, 8, 8, 15, 8, 8, 8, 8, 8, 8, 8, 15, 8, 8, 8, 8, 8, 8, 8, 15, 8, 8, 8, 8, 8, 8, 8, 15, 8, 8, 8, 8, 8, 8, 8, 15, 8, 8, 8, 8, 8, 8, 8, 15, 8, 8, 8, 8, 8, 8, 8, 
15, 8, 8, 8, 8, 8, 8, 8, 15, 8, 8, 8, 8, 8, 8, 8, 15, 8, 8, 8, 8, 8, 8, 8, 15, 8, 8, 8, 8, 8, 8, 8, 15, 8, 8, 8, 8, 8, 8, 8, 15, 8, 8, 8, 8, 8, 8, 8, 15, 8], $OP_DD_STATES$$ = [4, 4, 4, 4, 4, 4, 4, 4, 4, 15, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 15, 4, 4, 4, 4, 4, 4, 4, 14, 20, 10, 8, 8, 11, 4, 4, 15, 20, 10, 8, 8, 11, 4, 4, 4, 4, 4, 23, 23, 19, 4, 4, 15, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 8, 8, 19, 4, 4, 4, 4, 4, 8, 8, 19, 4, 4, 4, 4, 4, 8, 8, 19, 4, 4, 4, 4, 4, 8, 8, 19, 4, 8, 8, 8, 8, 8, 8, 
19, 8, 8, 8, 8, 8, 8, 8, 19, 8, 19, 19, 19, 19, 19, 19, 4, 19, 4, 4, 4, 4, 8, 8, 19, 4, 4, 4, 4, 4, 8, 8, 19, 4, 4, 4, 4, 4, 8, 8, 19, 4, 4, 4, 4, 4, 8, 8, 19, 4, 4, 4, 4, 4, 8, 8, 19, 4, 4, 4, 4, 4, 8, 8, 19, 4, 4, 4, 4, 4, 8, 8, 19, 4, 4, 4, 4, 4, 8, 8, 19, 4, 4, 4, 4, 4, 8, 8, 19, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 0, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 14, 4, 23, 4, 15, 4, 4, 4, 8, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 10, 4, 4, 4, 4, 4, 4], $OP_INDEX_CB_STATES$$ = 
[0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, 20, 0, 0, 0, 0, 0, 0, 0, 20, 0, 0, 0, 0, 0, 0, 0, 20, 0, 0, 0, 0, 0, 0, 0, 20, 0, 0, 0, 0, 0, 0, 0, 20, 0, 0, 0, 0, 0, 0, 0, 20, 0, 0, 0, 0, 0, 0, 0, 20, 0, 0, 0, 0, 0, 0, 0, 20, 0, 0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, 23, 0, 
0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, 23, 0], $OP_ED_STATES$$ = [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 
8, 8, 8, 12, 12, 15, 20, 8, 14, 8, 9, 12, 12, 15, 20, 8, 14, 8, 9, 12, 12, 15, 20, 8, 14, 8, 9, 12, 12, 15, 20, 8, 14, 8, 9, 12, 12, 15, 20, 8, 14, 8, 18, 12, 12, 15, 20, 8, 14, 8, 18, 8, 12, 15, 20, 8, 14, 8, 8, 12, 12, 15, 20, 8, 14, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 16, 16, 16, 16, 8, 8, 8, 8, 16, 16, 16, 16, 8, 8, 8, 8, 16, 16, 16, 16, 8, 8, 8, 8, 16, 16, 16, 16, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 
8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8];
function $JSSMS$Z80$$($i$$inline_37_i$$inline_52_i$$inline_58_padd$$inline_43_sms$$) {
  this.$main$ = $i$$inline_37_i$$inline_52_i$$inline_58_padd$$inline_43_sms$$;
  this.port = $i$$inline_37_i$$inline_52_i$$inline_58_padd$$inline_43_sms$$.ports;
  this.$im$ = this.$sp$ = this.$pc$ = 0;
  this.$interruptLine$ = this.$EI_inst$ = this.$halt$ = this.$iff2$ = this.$iff1$ = $JSCompiler_alias_FALSE$$;
  this.$tstates$ = this.$totalCycles$ = this.$f2$ = this.$f$ = this.$i$ = this.$r$ = this.$iyH$ = this.$iyL$ = this.$ixH$ = this.$ixL$ = this.$l2$ = this.$h2$ = this.$l$ = this.$h$ = this.$e2$ = this.$d2$ = this.$e$ = this.$d$ = this.$c2$ = this.$b2$ = this.$c$ = this.$b$ = this.$a2$ = this.$a$ = this.$interruptVector$ = 0;
  this.$hitCounts$ = [];
  this.$blocks$ = Object.create($JSCompiler_alias_NULL$$);
  this.$prevOpcode$ = this.$entryPC$ = 0;
  this.$blockInstructions$ = [];
  this.$opcodeInstructions$ = Array(255);
  this.$rom$ = [];
  this.$ram$ = Array(8);
  this.$sram$ = $JSCompiler_alias_NULL$$;
  this.$useSRAM$ = $JSCompiler_alias_FALSE$$;
  this.$frameReg$ = Array(4);
  this.$number_of_pages$ = 0;
  this.$memWriteMap$ = Array(65);
  this.$memReadMap$ = Array(65);
  this.$DAA_TABLE$ = Array(2048);
  this.$SZ_TABLE$ = Array(256);
  this.$SZP_TABLE$ = Array(256);
  this.$SZHV_INC_TABLE$ = Array(256);
  this.$SZHV_DEC_TABLE$ = Array(256);
  this.$SZHVC_ADD_TABLE$ = Array(131072);
  this.$SZHVC_SUB_TABLE$ = Array(131072);
  this.$SZ_BIT_TABLE$ = Array(256);
  var $c$$inline_53_padc$$inline_44_sf$$inline_38$$, $h$$inline_54_psub$$inline_45_zf$$inline_39$$, $n$$inline_55_psbc$$inline_46_yf$$inline_40$$, $JSCompiler_temp_const$$144_val$$inline_47_xf$$inline_41$$, $JSCompiler_temp_const$$143_oldval$$inline_48_pf$$inline_42$$, $flags$$inline_167_newval$$inline_49$$;
  for($i$$inline_37_i$$inline_52_i$$inline_58_padd$$inline_43_sms$$ = 0;256 > $i$$inline_37_i$$inline_52_i$$inline_58_padd$$inline_43_sms$$;$i$$inline_37_i$$inline_52_i$$inline_58_padd$$inline_43_sms$$++) {
    $c$$inline_53_padc$$inline_44_sf$$inline_38$$ = 0 != ($i$$inline_37_i$$inline_52_i$$inline_58_padd$$inline_43_sms$$ & 128) ? 128 : 0, $h$$inline_54_psub$$inline_45_zf$$inline_39$$ = 0 == $i$$inline_37_i$$inline_52_i$$inline_58_padd$$inline_43_sms$$ ? 64 : 0, $n$$inline_55_psbc$$inline_46_yf$$inline_40$$ = $i$$inline_37_i$$inline_52_i$$inline_58_padd$$inline_43_sms$$ & 32, $JSCompiler_temp_const$$144_val$$inline_47_xf$$inline_41$$ = $i$$inline_37_i$$inline_52_i$$inline_58_padd$$inline_43_sms$$ & 
    8, $JSCompiler_temp_const$$143_oldval$$inline_48_pf$$inline_42$$ = $JSCompiler_StaticMethods_getParity$$($i$$inline_37_i$$inline_52_i$$inline_58_padd$$inline_43_sms$$) ? 4 : 0, this.$SZ_TABLE$[$i$$inline_37_i$$inline_52_i$$inline_58_padd$$inline_43_sms$$] = $c$$inline_53_padc$$inline_44_sf$$inline_38$$ | $h$$inline_54_psub$$inline_45_zf$$inline_39$$ | $n$$inline_55_psbc$$inline_46_yf$$inline_40$$ | $JSCompiler_temp_const$$144_val$$inline_47_xf$$inline_41$$, this.$SZP_TABLE$[$i$$inline_37_i$$inline_52_i$$inline_58_padd$$inline_43_sms$$] = 
    $c$$inline_53_padc$$inline_44_sf$$inline_38$$ | $h$$inline_54_psub$$inline_45_zf$$inline_39$$ | $n$$inline_55_psbc$$inline_46_yf$$inline_40$$ | $JSCompiler_temp_const$$144_val$$inline_47_xf$$inline_41$$ | $JSCompiler_temp_const$$143_oldval$$inline_48_pf$$inline_42$$, this.$SZHV_INC_TABLE$[$i$$inline_37_i$$inline_52_i$$inline_58_padd$$inline_43_sms$$] = $c$$inline_53_padc$$inline_44_sf$$inline_38$$ | $h$$inline_54_psub$$inline_45_zf$$inline_39$$ | $n$$inline_55_psbc$$inline_46_yf$$inline_40$$ | 
    $JSCompiler_temp_const$$144_val$$inline_47_xf$$inline_41$$, this.$SZHV_INC_TABLE$[$i$$inline_37_i$$inline_52_i$$inline_58_padd$$inline_43_sms$$] |= 128 == $i$$inline_37_i$$inline_52_i$$inline_58_padd$$inline_43_sms$$ ? 4 : 0, this.$SZHV_INC_TABLE$[$i$$inline_37_i$$inline_52_i$$inline_58_padd$$inline_43_sms$$] |= 0 == ($i$$inline_37_i$$inline_52_i$$inline_58_padd$$inline_43_sms$$ & 15) ? 16 : 0, this.$SZHV_DEC_TABLE$[$i$$inline_37_i$$inline_52_i$$inline_58_padd$$inline_43_sms$$] = $c$$inline_53_padc$$inline_44_sf$$inline_38$$ | 
    $h$$inline_54_psub$$inline_45_zf$$inline_39$$ | $n$$inline_55_psbc$$inline_46_yf$$inline_40$$ | $JSCompiler_temp_const$$144_val$$inline_47_xf$$inline_41$$ | 2, this.$SZHV_DEC_TABLE$[$i$$inline_37_i$$inline_52_i$$inline_58_padd$$inline_43_sms$$] |= 127 == $i$$inline_37_i$$inline_52_i$$inline_58_padd$$inline_43_sms$$ ? 4 : 0, this.$SZHV_DEC_TABLE$[$i$$inline_37_i$$inline_52_i$$inline_58_padd$$inline_43_sms$$] |= 15 == ($i$$inline_37_i$$inline_52_i$$inline_58_padd$$inline_43_sms$$ & 15) ? 16 : 0, 
    this.$SZ_BIT_TABLE$[$i$$inline_37_i$$inline_52_i$$inline_58_padd$$inline_43_sms$$] = 0 != $i$$inline_37_i$$inline_52_i$$inline_58_padd$$inline_43_sms$$ ? $i$$inline_37_i$$inline_52_i$$inline_58_padd$$inline_43_sms$$ & 128 : 68, this.$SZ_BIT_TABLE$[$i$$inline_37_i$$inline_52_i$$inline_58_padd$$inline_43_sms$$] |= $n$$inline_55_psbc$$inline_46_yf$$inline_40$$ | $JSCompiler_temp_const$$144_val$$inline_47_xf$$inline_41$$ | 16
  }
  $i$$inline_37_i$$inline_52_i$$inline_58_padd$$inline_43_sms$$ = 0;
  $c$$inline_53_padc$$inline_44_sf$$inline_38$$ = 65536;
  $h$$inline_54_psub$$inline_45_zf$$inline_39$$ = 0;
  $n$$inline_55_psbc$$inline_46_yf$$inline_40$$ = 65536;
  for($JSCompiler_temp_const$$143_oldval$$inline_48_pf$$inline_42$$ = 0;256 > $JSCompiler_temp_const$$143_oldval$$inline_48_pf$$inline_42$$;$JSCompiler_temp_const$$143_oldval$$inline_48_pf$$inline_42$$++) {
    for($flags$$inline_167_newval$$inline_49$$ = 0;256 > $flags$$inline_167_newval$$inline_49$$;$flags$$inline_167_newval$$inline_49$$++) {
      $JSCompiler_temp_const$$144_val$$inline_47_xf$$inline_41$$ = $flags$$inline_167_newval$$inline_49$$ - $JSCompiler_temp_const$$143_oldval$$inline_48_pf$$inline_42$$, this.$SZHVC_ADD_TABLE$[$i$$inline_37_i$$inline_52_i$$inline_58_padd$$inline_43_sms$$] = 0 != $flags$$inline_167_newval$$inline_49$$ ? 0 != ($flags$$inline_167_newval$$inline_49$$ & 128) ? 128 : 0 : 64, this.$SZHVC_ADD_TABLE$[$i$$inline_37_i$$inline_52_i$$inline_58_padd$$inline_43_sms$$] |= $flags$$inline_167_newval$$inline_49$$ & 
      40, ($flags$$inline_167_newval$$inline_49$$ & 15) < ($JSCompiler_temp_const$$143_oldval$$inline_48_pf$$inline_42$$ & 15) && (this.$SZHVC_ADD_TABLE$[$i$$inline_37_i$$inline_52_i$$inline_58_padd$$inline_43_sms$$] |= 16), $flags$$inline_167_newval$$inline_49$$ < $JSCompiler_temp_const$$143_oldval$$inline_48_pf$$inline_42$$ && (this.$SZHVC_ADD_TABLE$[$i$$inline_37_i$$inline_52_i$$inline_58_padd$$inline_43_sms$$] |= 1), 0 != (($JSCompiler_temp_const$$144_val$$inline_47_xf$$inline_41$$ ^ $JSCompiler_temp_const$$143_oldval$$inline_48_pf$$inline_42$$ ^ 
      128) & ($JSCompiler_temp_const$$144_val$$inline_47_xf$$inline_41$$ ^ $flags$$inline_167_newval$$inline_49$$) & 128) && (this.$SZHVC_ADD_TABLE$[$i$$inline_37_i$$inline_52_i$$inline_58_padd$$inline_43_sms$$] |= 4), $i$$inline_37_i$$inline_52_i$$inline_58_padd$$inline_43_sms$$++, $JSCompiler_temp_const$$144_val$$inline_47_xf$$inline_41$$ = $flags$$inline_167_newval$$inline_49$$ - $JSCompiler_temp_const$$143_oldval$$inline_48_pf$$inline_42$$ - 1, this.$SZHVC_ADD_TABLE$[$c$$inline_53_padc$$inline_44_sf$$inline_38$$] = 
      0 != $flags$$inline_167_newval$$inline_49$$ ? 0 != ($flags$$inline_167_newval$$inline_49$$ & 128) ? 128 : 0 : 64, this.$SZHVC_ADD_TABLE$[$c$$inline_53_padc$$inline_44_sf$$inline_38$$] |= $flags$$inline_167_newval$$inline_49$$ & 40, ($flags$$inline_167_newval$$inline_49$$ & 15) <= ($JSCompiler_temp_const$$143_oldval$$inline_48_pf$$inline_42$$ & 15) && (this.$SZHVC_ADD_TABLE$[$c$$inline_53_padc$$inline_44_sf$$inline_38$$] |= 16), $flags$$inline_167_newval$$inline_49$$ <= $JSCompiler_temp_const$$143_oldval$$inline_48_pf$$inline_42$$ && 
      (this.$SZHVC_ADD_TABLE$[$c$$inline_53_padc$$inline_44_sf$$inline_38$$] |= 1), 0 != (($JSCompiler_temp_const$$144_val$$inline_47_xf$$inline_41$$ ^ $JSCompiler_temp_const$$143_oldval$$inline_48_pf$$inline_42$$ ^ 128) & ($JSCompiler_temp_const$$144_val$$inline_47_xf$$inline_41$$ ^ $flags$$inline_167_newval$$inline_49$$) & 128) && (this.$SZHVC_ADD_TABLE$[$c$$inline_53_padc$$inline_44_sf$$inline_38$$] |= 4), $c$$inline_53_padc$$inline_44_sf$$inline_38$$++, $JSCompiler_temp_const$$144_val$$inline_47_xf$$inline_41$$ = 
      $JSCompiler_temp_const$$143_oldval$$inline_48_pf$$inline_42$$ - $flags$$inline_167_newval$$inline_49$$, this.$SZHVC_SUB_TABLE$[$h$$inline_54_psub$$inline_45_zf$$inline_39$$] = 0 != $flags$$inline_167_newval$$inline_49$$ ? 0 != ($flags$$inline_167_newval$$inline_49$$ & 128) ? 130 : 2 : 66, this.$SZHVC_SUB_TABLE$[$h$$inline_54_psub$$inline_45_zf$$inline_39$$] |= $flags$$inline_167_newval$$inline_49$$ & 40, ($flags$$inline_167_newval$$inline_49$$ & 15) > ($JSCompiler_temp_const$$143_oldval$$inline_48_pf$$inline_42$$ & 
      15) && (this.$SZHVC_SUB_TABLE$[$h$$inline_54_psub$$inline_45_zf$$inline_39$$] |= 16), $flags$$inline_167_newval$$inline_49$$ > $JSCompiler_temp_const$$143_oldval$$inline_48_pf$$inline_42$$ && (this.$SZHVC_SUB_TABLE$[$h$$inline_54_psub$$inline_45_zf$$inline_39$$] |= 1), 0 != (($JSCompiler_temp_const$$144_val$$inline_47_xf$$inline_41$$ ^ $JSCompiler_temp_const$$143_oldval$$inline_48_pf$$inline_42$$) & ($JSCompiler_temp_const$$143_oldval$$inline_48_pf$$inline_42$$ ^ $flags$$inline_167_newval$$inline_49$$) & 
      128) && (this.$SZHVC_SUB_TABLE$[$h$$inline_54_psub$$inline_45_zf$$inline_39$$] |= 4), $h$$inline_54_psub$$inline_45_zf$$inline_39$$++, $JSCompiler_temp_const$$144_val$$inline_47_xf$$inline_41$$ = $JSCompiler_temp_const$$143_oldval$$inline_48_pf$$inline_42$$ - $flags$$inline_167_newval$$inline_49$$ - 1, this.$SZHVC_SUB_TABLE$[$n$$inline_55_psbc$$inline_46_yf$$inline_40$$] = 0 != $flags$$inline_167_newval$$inline_49$$ ? 0 != ($flags$$inline_167_newval$$inline_49$$ & 128) ? 130 : 2 : 66, this.$SZHVC_SUB_TABLE$[$n$$inline_55_psbc$$inline_46_yf$$inline_40$$] |= 
      $flags$$inline_167_newval$$inline_49$$ & 40, ($flags$$inline_167_newval$$inline_49$$ & 15) >= ($JSCompiler_temp_const$$143_oldval$$inline_48_pf$$inline_42$$ & 15) && (this.$SZHVC_SUB_TABLE$[$n$$inline_55_psbc$$inline_46_yf$$inline_40$$] |= 16), $flags$$inline_167_newval$$inline_49$$ >= $JSCompiler_temp_const$$143_oldval$$inline_48_pf$$inline_42$$ && (this.$SZHVC_SUB_TABLE$[$n$$inline_55_psbc$$inline_46_yf$$inline_40$$] |= 1), 0 != (($JSCompiler_temp_const$$144_val$$inline_47_xf$$inline_41$$ ^ 
      $JSCompiler_temp_const$$143_oldval$$inline_48_pf$$inline_42$$) & ($JSCompiler_temp_const$$143_oldval$$inline_48_pf$$inline_42$$ ^ $flags$$inline_167_newval$$inline_49$$) & 128) && (this.$SZHVC_SUB_TABLE$[$n$$inline_55_psbc$$inline_46_yf$$inline_40$$] |= 4), $n$$inline_55_psbc$$inline_46_yf$$inline_40$$++
    }
  }
  for($i$$inline_37_i$$inline_52_i$$inline_58_padd$$inline_43_sms$$ = 256;$i$$inline_37_i$$inline_52_i$$inline_58_padd$$inline_43_sms$$--;) {
    for($c$$inline_53_padc$$inline_44_sf$$inline_38$$ = 0;1 >= $c$$inline_53_padc$$inline_44_sf$$inline_38$$;$c$$inline_53_padc$$inline_44_sf$$inline_38$$++) {
      for($h$$inline_54_psub$$inline_45_zf$$inline_39$$ = 0;1 >= $h$$inline_54_psub$$inline_45_zf$$inline_39$$;$h$$inline_54_psub$$inline_45_zf$$inline_39$$++) {
        for($n$$inline_55_psbc$$inline_46_yf$$inline_40$$ = 0;1 >= $n$$inline_55_psbc$$inline_46_yf$$inline_40$$;$n$$inline_55_psbc$$inline_46_yf$$inline_40$$++) {
          $JSCompiler_temp_const$$144_val$$inline_47_xf$$inline_41$$ = this.$DAA_TABLE$;
          $JSCompiler_temp_const$$143_oldval$$inline_48_pf$$inline_42$$ = $c$$inline_53_padc$$inline_44_sf$$inline_38$$ << 8 | $n$$inline_55_psbc$$inline_46_yf$$inline_40$$ << 9 | $h$$inline_54_psub$$inline_45_zf$$inline_39$$ << 10 | $i$$inline_37_i$$inline_52_i$$inline_58_padd$$inline_43_sms$$;
          $flags$$inline_167_newval$$inline_49$$ = $c$$inline_53_padc$$inline_44_sf$$inline_38$$ | $n$$inline_55_psbc$$inline_46_yf$$inline_40$$ << 1 | $h$$inline_54_psub$$inline_45_zf$$inline_39$$ << 4;
          this.$a$ = $i$$inline_37_i$$inline_52_i$$inline_58_padd$$inline_43_sms$$;
          this.$f$ = $flags$$inline_167_newval$$inline_49$$;
          var $a_copy$$inline_168$$ = this.$a$, $correction$$inline_169$$ = 0, $carry$$inline_170$$ = $flags$$inline_167_newval$$inline_49$$ & 1, $carry_copy$$inline_171$$ = $carry$$inline_170$$;
          if(0 != ($flags$$inline_167_newval$$inline_49$$ & 16) || 9 < ($a_copy$$inline_168$$ & 15)) {
            $correction$$inline_169$$ |= 6
          }
          if(1 == $carry$$inline_170$$ || 159 < $a_copy$$inline_168$$ || 143 < $a_copy$$inline_168$$ && 9 < ($a_copy$$inline_168$$ & 15)) {
            $correction$$inline_169$$ |= 96, $carry_copy$$inline_171$$ = 1
          }
          153 < $a_copy$$inline_168$$ && ($carry_copy$$inline_171$$ = 1);
          0 != ($flags$$inline_167_newval$$inline_49$$ & 2) ? $JSCompiler_StaticMethods_sub_a$$(this, $correction$$inline_169$$) : $JSCompiler_StaticMethods_add_a$$(this, $correction$$inline_169$$);
          $flags$$inline_167_newval$$inline_49$$ = this.$f$ & 254 | $carry_copy$$inline_171$$;
          $flags$$inline_167_newval$$inline_49$$ = $JSCompiler_StaticMethods_getParity$$(this.$a$) ? $flags$$inline_167_newval$$inline_49$$ & 251 | 4 : $flags$$inline_167_newval$$inline_49$$ & 251;
          $JSCompiler_temp_const$$144_val$$inline_47_xf$$inline_41$$[$JSCompiler_temp_const$$143_oldval$$inline_48_pf$$inline_42$$] = this.$a$ | $flags$$inline_167_newval$$inline_49$$ << 8
        }
      }
    }
  }
  for($i$$inline_37_i$$inline_52_i$$inline_58_padd$$inline_43_sms$$ = this.$a$ = this.$f$ = 0;65 > $i$$inline_37_i$$inline_52_i$$inline_58_padd$$inline_43_sms$$;$i$$inline_37_i$$inline_52_i$$inline_58_padd$$inline_43_sms$$++) {
    this.$memReadMap$[$i$$inline_37_i$$inline_52_i$$inline_58_padd$$inline_43_sms$$] = $JSSMS$Utils$Array$$(1024), this.$memWriteMap$[$i$$inline_37_i$$inline_52_i$$inline_58_padd$$inline_43_sms$$] = $JSSMS$Utils$Array$$(1024)
  }
  for($i$$inline_37_i$$inline_52_i$$inline_58_padd$$inline_43_sms$$ = 0;8 > $i$$inline_37_i$$inline_52_i$$inline_58_padd$$inline_43_sms$$;$i$$inline_37_i$$inline_52_i$$inline_58_padd$$inline_43_sms$$++) {
    this.$ram$[$i$$inline_37_i$$inline_52_i$$inline_58_padd$$inline_43_sms$$] = $JSSMS$Utils$Array$$(1024)
  }
  this.$sram$ == $JSCompiler_alias_NULL$$ && (this.$sram$ = $JSSMS$Utils$Array$$(32), this.$useSRAM$ = $JSCompiler_alias_FALSE$$);
  this.$memReadMap$[64] = $JSSMS$Utils$Array$$(1024);
  this.$memWriteMap$[64] = $JSSMS$Utils$Array$$(1024);
  this.$number_of_pages$ = 2;
  this.$writeMem$ = $JSSMS$Utils$writeMem$$.bind(this, this);
  this.$readMem$ = $JSSMS$Utils$readMem$$.bind(this, this.$memReadMap$);
  this.$readMemWord$ = $JSSMS$Utils$readMemWord$$.bind(this, this.$memReadMap$);
  for(var $method$$2$$ in $JSSMS$Z80DynaRec$$.prototype) {
    this[$method$$2$$] = $JSSMS$Z80DynaRec$$.prototype[$method$$2$$]
  }
  this.$init$()
}
$JSSMS$Z80$$.prototype = {reset:function $$JSSMS$Z80$$$$reset$() {
  this.$pc$ = this.$f2$ = this.$f$ = this.$i$ = this.$r$ = this.$iyL$ = this.$iyH$ = this.$ixL$ = this.$ixH$ = this.$h$ = this.$l$ = this.$h2$ = this.$l2$ = this.$d$ = this.$e$ = this.$d2$ = this.$e2$ = this.$b$ = this.$c$ = this.$b2$ = this.$c2$ = this.$a$ = this.$a2$ = 0;
  this.$sp$ = 57328;
  this.$im$ = this.$totalCycles$ = this.$tstates$ = 0;
  this.$EI_inst$ = this.$iff2$ = this.$iff1$ = $JSCompiler_alias_FALSE$$;
  this.$interruptVector$ = 0;
  this.$halt$ = $JSCompiler_alias_FALSE$$;
  this.$blocks$ = Object.create($JSCompiler_alias_NULL$$);
  this.$entryPC$ = 0;
  this.$prevOpcode$ = this.$readMem$(0);
  this.$blockInstructions$ = [this.$prevOpcode$]
}, call:function $$JSSMS$Z80$$$$call$($condition$$3$$) {
  $condition$$3$$ ? ($JSCompiler_StaticMethods_push1$$(this, this.$pc$ + 2), this.$pc$ = this.$readMemWord$(this.$pc$), this.$tstates$ -= 7) : this.$pc$ += 2
}, page:function $$JSSMS$Z80$$$$page$($address$$6$$, $value$$81$$) {
  var $offset$$17_p$$1$$, $i$$12$$;
  this.$frameReg$[$address$$6$$] = $value$$81$$;
  switch($address$$6$$) {
    case 0:
      if(0 != ($value$$81$$ & 8)) {
        $offset$$17_p$$1$$ = ($value$$81$$ & 4) << 2;
        for($i$$12$$ = 32;48 > $i$$12$$;$i$$12$$++) {
          this.$memReadMap$[$i$$12$$] = $JSSMS$Utils$copyArray$$(this.$sram$[$offset$$17_p$$1$$]), this.$memWriteMap$[$i$$12$$] = $JSSMS$Utils$copyArray$$(this.$sram$[$offset$$17_p$$1$$]), $offset$$17_p$$1$$++
        }
        this.$useSRAM$ = $JSCompiler_alias_TRUE$$
      }else {
        $offset$$17_p$$1$$ = this.$frameReg$[3] % this.$number_of_pages$ << 4;
        for($i$$12$$ = 32;48 > $i$$12$$;$i$$12$$++) {
          this.$memReadMap$[$i$$12$$] = $JSSMS$Utils$copyArray$$(this.$rom$[$offset$$17_p$$1$$++]), this.$memWriteMap$[$i$$12$$] = $JSSMS$Utils$Array$$(1024)
        }
      }
      break;
    case 1:
      $offset$$17_p$$1$$ = ($value$$81$$ % this.$number_of_pages$ << 4) + 1;
      for($i$$12$$ = 1;16 > $i$$12$$;$i$$12$$++) {
        this.$memReadMap$[$i$$12$$] = $JSSMS$Utils$copyArray$$(this.$rom$[$offset$$17_p$$1$$++])
      }
      break;
    case 2:
      $offset$$17_p$$1$$ = $value$$81$$ % this.$number_of_pages$ << 4;
      for($i$$12$$ = 16;32 > $i$$12$$;$i$$12$$++) {
        this.$memReadMap$[$i$$12$$] = $JSSMS$Utils$copyArray$$(this.$rom$[$offset$$17_p$$1$$++])
      }
      break;
    case 3:
      if(0 == (this.$frameReg$[0] & 8)) {
        $offset$$17_p$$1$$ = $value$$81$$ % this.$number_of_pages$ << 4;
        for($i$$12$$ = 32;48 > $i$$12$$;$i$$12$$++) {
          this.$memReadMap$[$i$$12$$] = $JSSMS$Utils$copyArray$$(this.$rom$[$offset$$17_p$$1$$++])
        }
      }
  }
}};
function $JSCompiler_StaticMethods_d_$$($JSCompiler_StaticMethods_d_$self$$) {
  return $JSCompiler_StaticMethods_d_$self$$.$readMem$($JSCompiler_StaticMethods_d_$self$$.$pc$)
}
function $JSCompiler_StaticMethods_resetMemory$$($JSCompiler_StaticMethods_resetMemory$self$$, $p$$) {
  $p$$ != $JSCompiler_alias_NULL$$ && ($JSCompiler_StaticMethods_resetMemory$self$$.$rom$ = $p$$);
  $JSCompiler_StaticMethods_resetMemory$self$$.$frameReg$[0] = 0;
  $JSCompiler_StaticMethods_resetMemory$self$$.$frameReg$[1] = 0;
  $JSCompiler_StaticMethods_resetMemory$self$$.$frameReg$[2] = 1;
  $JSCompiler_StaticMethods_resetMemory$self$$.$frameReg$[3] = 0;
  if($JSCompiler_StaticMethods_resetMemory$self$$.$rom$ != $JSCompiler_alias_NULL$$) {
    $JSCompiler_StaticMethods_resetMemory$self$$.$number_of_pages$ = $JSCompiler_StaticMethods_resetMemory$self$$.$rom$.length / 16;
    for(var $i$$10_i$$inline_61$$ = 0;48 > $i$$10_i$$inline_61$$;$i$$10_i$$inline_61$$++) {
      $JSCompiler_StaticMethods_resetMemory$self$$.$memReadMap$[$i$$10_i$$inline_61$$] = $JSSMS$Utils$copyArray$$($JSCompiler_StaticMethods_resetMemory$self$$.$rom$[$i$$10_i$$inline_61$$ & 31]), $JSCompiler_StaticMethods_resetMemory$self$$.$memWriteMap$[$i$$10_i$$inline_61$$] = $JSSMS$Utils$Array$$(1024)
    }
    for($i$$10_i$$inline_61$$ = 48;64 > $i$$10_i$$inline_61$$;$i$$10_i$$inline_61$$++) {
      $JSCompiler_StaticMethods_resetMemory$self$$.$memReadMap$[$i$$10_i$$inline_61$$] = $JSCompiler_StaticMethods_resetMemory$self$$.$ram$[$i$$10_i$$inline_61$$ & 7], $JSCompiler_StaticMethods_resetMemory$self$$.$memWriteMap$[$i$$10_i$$inline_61$$] = $JSCompiler_StaticMethods_resetMemory$self$$.$ram$[$i$$10_i$$inline_61$$ & 7]
    }
  }else {
    $JSCompiler_StaticMethods_resetMemory$self$$.$number_of_pages$ = 0
  }
  $JSCompiler_StaticMethods_resetMemory$self$$.$hitCounts$ = Array(1024 * $JSCompiler_StaticMethods_resetMemory$self$$.$number_of_pages$);
  for($i$$10_i$$inline_61$$ = 0;$i$$10_i$$inline_61$$ < 1024 * $JSCompiler_StaticMethods_resetMemory$self$$.$number_of_pages$;$i$$10_i$$inline_61$$++) {
    $JSCompiler_StaticMethods_resetMemory$self$$.$hitCounts$[$i$$10_i$$inline_61$$] = 0
  }
}
function $JSCompiler_StaticMethods_getParity$$($value$$80$$) {
  var $parity$$ = $JSCompiler_alias_TRUE$$, $j$$1$$;
  for($j$$1$$ = 0;8 > $j$$1$$;$j$$1$$++) {
    0 != ($value$$80$$ & 1 << $j$$1$$) && ($parity$$ = !$parity$$)
  }
  return $parity$$
}
function $JSCompiler_StaticMethods_sbc16$$($JSCompiler_StaticMethods_sbc16$self$$, $value$$79$$) {
  var $hl$$1$$ = $JSCompiler_StaticMethods_sbc16$self$$.$h$ << 8 | $JSCompiler_StaticMethods_sbc16$self$$.$l$, $result$$6$$ = $hl$$1$$ - $value$$79$$ - ($JSCompiler_StaticMethods_sbc16$self$$.$f$ & 1);
  $JSCompiler_StaticMethods_sbc16$self$$.$f$ = ($hl$$1$$ ^ $result$$6$$ ^ $value$$79$$) >> 8 & 16 | 2 | $result$$6$$ >> 16 & 1 | $result$$6$$ >> 8 & 128 | (0 != ($result$$6$$ & 65535) ? 0 : 64) | (($value$$79$$ ^ $hl$$1$$) & ($hl$$1$$ ^ $result$$6$$) & 32768) >> 13;
  $JSCompiler_StaticMethods_sbc16$self$$.$h$ = $result$$6$$ >> 8 & 255;
  $JSCompiler_StaticMethods_sbc16$self$$.$l$ = $result$$6$$ & 255
}
function $JSCompiler_StaticMethods_adc16$$($JSCompiler_StaticMethods_adc16$self$$, $value$$78$$) {
  var $hl$$ = $JSCompiler_StaticMethods_adc16$self$$.$h$ << 8 | $JSCompiler_StaticMethods_adc16$self$$.$l$, $result$$5$$ = $hl$$ + $value$$78$$ + ($JSCompiler_StaticMethods_adc16$self$$.$f$ & 1);
  $JSCompiler_StaticMethods_adc16$self$$.$f$ = ($hl$$ ^ $result$$5$$ ^ $value$$78$$) >> 8 & 16 | $result$$5$$ >> 16 & 1 | $result$$5$$ >> 8 & 128 | (0 != ($result$$5$$ & 65535) ? 0 : 64) | (($value$$78$$ ^ $hl$$ ^ 32768) & ($value$$78$$ ^ $result$$5$$) & 32768) >> 13;
  $JSCompiler_StaticMethods_adc16$self$$.$h$ = $result$$5$$ >> 8 & 255;
  $JSCompiler_StaticMethods_adc16$self$$.$l$ = $result$$5$$ & 255
}
function $JSCompiler_StaticMethods_add16$$($JSCompiler_StaticMethods_add16$self$$, $reg$$1$$, $value$$77$$) {
  var $result$$4$$ = $reg$$1$$ + $value$$77$$;
  $JSCompiler_StaticMethods_add16$self$$.$f$ = $JSCompiler_StaticMethods_add16$self$$.$f$ & 196 | ($reg$$1$$ ^ $result$$4$$ ^ $value$$77$$) >> 8 & 16 | $result$$4$$ >> 16 & 1;
  return $result$$4$$ & 65535
}
function $JSCompiler_StaticMethods_dec8$$($JSCompiler_StaticMethods_dec8$self$$, $value$$76$$) {
  $value$$76$$ = $value$$76$$ - 1 & 255;
  $JSCompiler_StaticMethods_dec8$self$$.$f$ = $JSCompiler_StaticMethods_dec8$self$$.$f$ & 1 | $JSCompiler_StaticMethods_dec8$self$$.$SZHV_DEC_TABLE$[$value$$76$$];
  return $value$$76$$
}
function $JSCompiler_StaticMethods_inc8$$($JSCompiler_StaticMethods_inc8$self$$, $value$$75$$) {
  $value$$75$$ = $value$$75$$ + 1 & 255;
  $JSCompiler_StaticMethods_inc8$self$$.$f$ = $JSCompiler_StaticMethods_inc8$self$$.$f$ & 1 | $JSCompiler_StaticMethods_inc8$self$$.$SZHV_INC_TABLE$[$value$$75$$];
  return $value$$75$$
}
function $JSCompiler_StaticMethods_decHL$$($JSCompiler_StaticMethods_decHL$self$$) {
  $JSCompiler_StaticMethods_decHL$self$$.$l$ = $JSCompiler_StaticMethods_decHL$self$$.$l$ - 1 & 255;
  255 == $JSCompiler_StaticMethods_decHL$self$$.$l$ && ($JSCompiler_StaticMethods_decHL$self$$.$h$ = $JSCompiler_StaticMethods_decHL$self$$.$h$ - 1 & 255)
}
function $JSCompiler_StaticMethods_decDE$$($JSCompiler_StaticMethods_decDE$self$$) {
  $JSCompiler_StaticMethods_decDE$self$$.$e$ = $JSCompiler_StaticMethods_decDE$self$$.$e$ - 1 & 255;
  255 == $JSCompiler_StaticMethods_decDE$self$$.$e$ && ($JSCompiler_StaticMethods_decDE$self$$.$d$ = $JSCompiler_StaticMethods_decDE$self$$.$d$ - 1 & 255)
}
function $JSCompiler_StaticMethods_decBC$$($JSCompiler_StaticMethods_decBC$self$$) {
  $JSCompiler_StaticMethods_decBC$self$$.$c$ = $JSCompiler_StaticMethods_decBC$self$$.$c$ - 1 & 255;
  255 == $JSCompiler_StaticMethods_decBC$self$$.$c$ && ($JSCompiler_StaticMethods_decBC$self$$.$b$ = $JSCompiler_StaticMethods_decBC$self$$.$b$ - 1 & 255)
}
function $JSCompiler_StaticMethods_incHL$$($JSCompiler_StaticMethods_incHL$self$$) {
  $JSCompiler_StaticMethods_incHL$self$$.$l$ = $JSCompiler_StaticMethods_incHL$self$$.$l$ + 1 & 255;
  0 == $JSCompiler_StaticMethods_incHL$self$$.$l$ && ($JSCompiler_StaticMethods_incHL$self$$.$h$ = $JSCompiler_StaticMethods_incHL$self$$.$h$ + 1 & 255)
}
function $JSCompiler_StaticMethods_incDE$$($JSCompiler_StaticMethods_incDE$self$$) {
  $JSCompiler_StaticMethods_incDE$self$$.$e$ = $JSCompiler_StaticMethods_incDE$self$$.$e$ + 1 & 255;
  0 == $JSCompiler_StaticMethods_incDE$self$$.$e$ && ($JSCompiler_StaticMethods_incDE$self$$.$d$ = $JSCompiler_StaticMethods_incDE$self$$.$d$ + 1 & 255)
}
function $JSCompiler_StaticMethods_setIY$$($JSCompiler_StaticMethods_setIY$self$$, $value$$74$$) {
  $JSCompiler_StaticMethods_setIY$self$$.$iyH$ = $value$$74$$ >> 8;
  $JSCompiler_StaticMethods_setIY$self$$.$iyL$ = $value$$74$$ & 255
}
function $JSCompiler_StaticMethods_setIX$$($JSCompiler_StaticMethods_setIX$self$$, $value$$73$$) {
  $JSCompiler_StaticMethods_setIX$self$$.$ixH$ = $value$$73$$ >> 8;
  $JSCompiler_StaticMethods_setIX$self$$.$ixL$ = $value$$73$$ & 255
}
function $JSCompiler_StaticMethods_setHL$$($JSCompiler_StaticMethods_setHL$self$$, $value$$72$$) {
  $JSCompiler_StaticMethods_setHL$self$$.$h$ = $value$$72$$ >> 8;
  $JSCompiler_StaticMethods_setHL$self$$.$l$ = $value$$72$$ & 255
}
function $JSCompiler_StaticMethods_getIY$$($JSCompiler_StaticMethods_getIY$self$$) {
  return $JSCompiler_StaticMethods_getIY$self$$.$iyH$ << 8 | $JSCompiler_StaticMethods_getIY$self$$.$iyL$
}
function $JSCompiler_StaticMethods_getIX$$($JSCompiler_StaticMethods_getIX$self$$) {
  return $JSCompiler_StaticMethods_getIX$self$$.$ixH$ << 8 | $JSCompiler_StaticMethods_getIX$self$$.$ixL$
}
function $JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_getHL$self$$) {
  return $JSCompiler_StaticMethods_getHL$self$$.$h$ << 8 | $JSCompiler_StaticMethods_getHL$self$$.$l$
}
function $JSCompiler_StaticMethods_getDE$$($JSCompiler_StaticMethods_getDE$self$$) {
  return $JSCompiler_StaticMethods_getDE$self$$.$d$ << 8 | $JSCompiler_StaticMethods_getDE$self$$.$e$
}
function $JSCompiler_StaticMethods_getBC$$($JSCompiler_StaticMethods_getBC$self$$) {
  return $JSCompiler_StaticMethods_getBC$self$$.$b$ << 8 | $JSCompiler_StaticMethods_getBC$self$$.$c$
}
function $JSCompiler_StaticMethods_cp_a$$($JSCompiler_StaticMethods_cp_a$self$$, $value$$69$$) {
  $JSCompiler_StaticMethods_cp_a$self$$.$f$ = $JSCompiler_StaticMethods_cp_a$self$$.$SZHVC_SUB_TABLE$[$JSCompiler_StaticMethods_cp_a$self$$.$a$ << 8 | $JSCompiler_StaticMethods_cp_a$self$$.$a$ - $value$$69$$ & 255]
}
function $JSCompiler_StaticMethods_sbc_a$$($JSCompiler_StaticMethods_sbc_a$self$$, $value$$68$$) {
  var $carry$$32$$ = $JSCompiler_StaticMethods_sbc_a$self$$.$f$ & 1, $temp$$49$$ = $JSCompiler_StaticMethods_sbc_a$self$$.$a$ - $value$$68$$ - $carry$$32$$ & 255;
  $JSCompiler_StaticMethods_sbc_a$self$$.$f$ = $JSCompiler_StaticMethods_sbc_a$self$$.$SZHVC_SUB_TABLE$[$carry$$32$$ << 16 | $JSCompiler_StaticMethods_sbc_a$self$$.$a$ << 8 | $temp$$49$$];
  $JSCompiler_StaticMethods_sbc_a$self$$.$a$ = $temp$$49$$
}
function $JSCompiler_StaticMethods_sub_a$$($JSCompiler_StaticMethods_sub_a$self$$, $value$$67$$) {
  var $temp$$48$$ = $JSCompiler_StaticMethods_sub_a$self$$.$a$ - $value$$67$$ & 255;
  $JSCompiler_StaticMethods_sub_a$self$$.$f$ = $JSCompiler_StaticMethods_sub_a$self$$.$SZHVC_SUB_TABLE$[$JSCompiler_StaticMethods_sub_a$self$$.$a$ << 8 | $temp$$48$$];
  $JSCompiler_StaticMethods_sub_a$self$$.$a$ = $temp$$48$$
}
function $JSCompiler_StaticMethods_adc_a$$($JSCompiler_StaticMethods_adc_a$self$$, $value$$66$$) {
  var $carry$$31$$ = $JSCompiler_StaticMethods_adc_a$self$$.$f$ & 1, $temp$$47$$ = $JSCompiler_StaticMethods_adc_a$self$$.$a$ + $value$$66$$ + $carry$$31$$ & 255;
  $JSCompiler_StaticMethods_adc_a$self$$.$f$ = $JSCompiler_StaticMethods_adc_a$self$$.$SZHVC_ADD_TABLE$[$carry$$31$$ << 16 | $JSCompiler_StaticMethods_adc_a$self$$.$a$ << 8 | $temp$$47$$];
  $JSCompiler_StaticMethods_adc_a$self$$.$a$ = $temp$$47$$
}
function $JSCompiler_StaticMethods_add_a$$($JSCompiler_StaticMethods_add_a$self$$, $value$$65$$) {
  var $temp$$46$$ = $JSCompiler_StaticMethods_add_a$self$$.$a$ + $value$$65$$ & 255;
  $JSCompiler_StaticMethods_add_a$self$$.$f$ = $JSCompiler_StaticMethods_add_a$self$$.$SZHVC_ADD_TABLE$[$JSCompiler_StaticMethods_add_a$self$$.$a$ << 8 | $temp$$46$$];
  $JSCompiler_StaticMethods_add_a$self$$.$a$ = $temp$$46$$
}
function $JSCompiler_StaticMethods_doED$$($JSCompiler_StaticMethods_doED$self$$, $opcode$$13$$) {
  var $location$$27_temp$$45$$ = 0, $hlmem$$ = $location$$27_temp$$45$$ = 0;
  $JSCompiler_StaticMethods_doED$self$$.$tstates$ -= $OP_ED_STATES$$[$opcode$$13$$];
  switch($opcode$$13$$) {
    case 64:
      $JSCompiler_StaticMethods_doED$self$$.$b$ = $JSCompiler_StaticMethods_in_$$($JSCompiler_StaticMethods_doED$self$$.port, $JSCompiler_StaticMethods_doED$self$$.$c$);
      $JSCompiler_StaticMethods_doED$self$$.$f$ = $JSCompiler_StaticMethods_doED$self$$.$f$ & 1 | $JSCompiler_StaticMethods_doED$self$$.$SZP_TABLE$[$JSCompiler_StaticMethods_doED$self$$.$b$];
      $JSCompiler_StaticMethods_doED$self$$.$pc$++;
      break;
    case 65:
      $JSCompiler_StaticMethods_out$$($JSCompiler_StaticMethods_doED$self$$.port, $JSCompiler_StaticMethods_doED$self$$.$c$, $JSCompiler_StaticMethods_doED$self$$.$b$);
      $JSCompiler_StaticMethods_doED$self$$.$pc$++;
      break;
    case 66:
      $JSCompiler_StaticMethods_sbc16$$($JSCompiler_StaticMethods_doED$self$$, $JSCompiler_StaticMethods_getBC$$($JSCompiler_StaticMethods_doED$self$$));
      $JSCompiler_StaticMethods_doED$self$$.$pc$++;
      break;
    case 67:
      $location$$27_temp$$45$$ = $JSCompiler_StaticMethods_doED$self$$.$readMemWord$($JSCompiler_StaticMethods_doED$self$$.$pc$ + 1);
      $JSCompiler_StaticMethods_doED$self$$.$writeMem$($location$$27_temp$$45$$++, $JSCompiler_StaticMethods_doED$self$$.$c$);
      $JSCompiler_StaticMethods_doED$self$$.$writeMem$($location$$27_temp$$45$$, $JSCompiler_StaticMethods_doED$self$$.$b$);
      $JSCompiler_StaticMethods_doED$self$$.$pc$ += 3;
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
      $location$$27_temp$$45$$ = $JSCompiler_StaticMethods_doED$self$$.$a$;
      $JSCompiler_StaticMethods_doED$self$$.$a$ = 0;
      $JSCompiler_StaticMethods_sub_a$$($JSCompiler_StaticMethods_doED$self$$, $location$$27_temp$$45$$);
      $JSCompiler_StaticMethods_doED$self$$.$pc$++;
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
      $JSCompiler_StaticMethods_doED$self$$.$pc$ = $JSCompiler_StaticMethods_doED$self$$.$readMemWord$($JSCompiler_StaticMethods_doED$self$$.$sp$);
      $JSCompiler_StaticMethods_doED$self$$.$sp$ += 2;
      $JSCompiler_StaticMethods_doED$self$$.$iff1$ = $JSCompiler_StaticMethods_doED$self$$.$iff2$;
      break;
    case 70:
    ;
    case 78:
    ;
    case 102:
    ;
    case 110:
      $JSCompiler_StaticMethods_doED$self$$.$im$ = 0;
      $JSCompiler_StaticMethods_doED$self$$.$pc$++;
      break;
    case 71:
      $JSCompiler_StaticMethods_doED$self$$.$i$ = $JSCompiler_StaticMethods_doED$self$$.$a$;
      $JSCompiler_StaticMethods_doED$self$$.$pc$++;
      break;
    case 72:
      $JSCompiler_StaticMethods_doED$self$$.$c$ = $JSCompiler_StaticMethods_in_$$($JSCompiler_StaticMethods_doED$self$$.port, $JSCompiler_StaticMethods_doED$self$$.$c$);
      $JSCompiler_StaticMethods_doED$self$$.$f$ = $JSCompiler_StaticMethods_doED$self$$.$f$ & 1 | $JSCompiler_StaticMethods_doED$self$$.$SZP_TABLE$[$JSCompiler_StaticMethods_doED$self$$.$c$];
      $JSCompiler_StaticMethods_doED$self$$.$pc$++;
      break;
    case 73:
      $JSCompiler_StaticMethods_out$$($JSCompiler_StaticMethods_doED$self$$.port, $JSCompiler_StaticMethods_doED$self$$.$c$, $JSCompiler_StaticMethods_doED$self$$.$c$);
      $JSCompiler_StaticMethods_doED$self$$.$pc$++;
      break;
    case 74:
      $JSCompiler_StaticMethods_adc16$$($JSCompiler_StaticMethods_doED$self$$, $JSCompiler_StaticMethods_getBC$$($JSCompiler_StaticMethods_doED$self$$));
      $JSCompiler_StaticMethods_doED$self$$.$pc$++;
      break;
    case 75:
      $location$$27_temp$$45$$ = $JSCompiler_StaticMethods_doED$self$$.$readMemWord$($JSCompiler_StaticMethods_doED$self$$.$pc$ + 1);
      $JSCompiler_StaticMethods_doED$self$$.$c$ = $JSCompiler_StaticMethods_doED$self$$.$readMem$($location$$27_temp$$45$$++);
      $JSCompiler_StaticMethods_doED$self$$.$b$ = $JSCompiler_StaticMethods_doED$self$$.$readMem$($location$$27_temp$$45$$);
      $JSCompiler_StaticMethods_doED$self$$.$pc$ += 3;
      break;
    case 79:
      $JSCompiler_StaticMethods_doED$self$$.$r$ = $JSCompiler_StaticMethods_doED$self$$.$a$;
      $JSCompiler_StaticMethods_doED$self$$.$pc$++;
      break;
    case 80:
      $JSCompiler_StaticMethods_doED$self$$.$d$ = $JSCompiler_StaticMethods_in_$$($JSCompiler_StaticMethods_doED$self$$.port, $JSCompiler_StaticMethods_doED$self$$.$c$);
      $JSCompiler_StaticMethods_doED$self$$.$f$ = $JSCompiler_StaticMethods_doED$self$$.$f$ & 1 | $JSCompiler_StaticMethods_doED$self$$.$SZP_TABLE$[$JSCompiler_StaticMethods_doED$self$$.$d$];
      $JSCompiler_StaticMethods_doED$self$$.$pc$++;
      break;
    case 81:
      $JSCompiler_StaticMethods_out$$($JSCompiler_StaticMethods_doED$self$$.port, $JSCompiler_StaticMethods_doED$self$$.$c$, $JSCompiler_StaticMethods_doED$self$$.$d$);
      $JSCompiler_StaticMethods_doED$self$$.$pc$++;
      break;
    case 82:
      $JSCompiler_StaticMethods_sbc16$$($JSCompiler_StaticMethods_doED$self$$, $JSCompiler_StaticMethods_getDE$$($JSCompiler_StaticMethods_doED$self$$));
      $JSCompiler_StaticMethods_doED$self$$.$pc$++;
      break;
    case 83:
      $location$$27_temp$$45$$ = $JSCompiler_StaticMethods_doED$self$$.$readMemWord$($JSCompiler_StaticMethods_doED$self$$.$pc$ + 1);
      $JSCompiler_StaticMethods_doED$self$$.$writeMem$($location$$27_temp$$45$$++, $JSCompiler_StaticMethods_doED$self$$.$e$);
      $JSCompiler_StaticMethods_doED$self$$.$writeMem$($location$$27_temp$$45$$, $JSCompiler_StaticMethods_doED$self$$.$d$);
      $JSCompiler_StaticMethods_doED$self$$.$pc$ += 3;
      break;
    case 86:
    ;
    case 118:
      $JSCompiler_StaticMethods_doED$self$$.$im$ = 1;
      $JSCompiler_StaticMethods_doED$self$$.$pc$++;
      break;
    case 87:
      $JSCompiler_StaticMethods_doED$self$$.$a$ = $JSCompiler_StaticMethods_doED$self$$.$i$;
      $JSCompiler_StaticMethods_doED$self$$.$f$ = $JSCompiler_StaticMethods_doED$self$$.$f$ & 1 | $JSCompiler_StaticMethods_doED$self$$.$SZ_TABLE$[$JSCompiler_StaticMethods_doED$self$$.$a$] | ($JSCompiler_StaticMethods_doED$self$$.$iff2$ ? 4 : 0);
      $JSCompiler_StaticMethods_doED$self$$.$pc$++;
      break;
    case 88:
      $JSCompiler_StaticMethods_doED$self$$.$e$ = $JSCompiler_StaticMethods_in_$$($JSCompiler_StaticMethods_doED$self$$.port, $JSCompiler_StaticMethods_doED$self$$.$c$);
      $JSCompiler_StaticMethods_doED$self$$.$f$ = $JSCompiler_StaticMethods_doED$self$$.$f$ & 1 | $JSCompiler_StaticMethods_doED$self$$.$SZP_TABLE$[$JSCompiler_StaticMethods_doED$self$$.$e$];
      $JSCompiler_StaticMethods_doED$self$$.$pc$++;
      break;
    case 89:
      $JSCompiler_StaticMethods_out$$($JSCompiler_StaticMethods_doED$self$$.port, $JSCompiler_StaticMethods_doED$self$$.$c$, $JSCompiler_StaticMethods_doED$self$$.$e$);
      $JSCompiler_StaticMethods_doED$self$$.$pc$++;
      break;
    case 90:
      $JSCompiler_StaticMethods_adc16$$($JSCompiler_StaticMethods_doED$self$$, $JSCompiler_StaticMethods_getDE$$($JSCompiler_StaticMethods_doED$self$$));
      $JSCompiler_StaticMethods_doED$self$$.$pc$++;
      break;
    case 91:
      $location$$27_temp$$45$$ = $JSCompiler_StaticMethods_doED$self$$.$readMemWord$($JSCompiler_StaticMethods_doED$self$$.$pc$ + 1);
      $JSCompiler_StaticMethods_doED$self$$.$e$ = $JSCompiler_StaticMethods_doED$self$$.$readMem$($location$$27_temp$$45$$++);
      $JSCompiler_StaticMethods_doED$self$$.$d$ = $JSCompiler_StaticMethods_doED$self$$.$readMem$($location$$27_temp$$45$$);
      $JSCompiler_StaticMethods_doED$self$$.$pc$ += 3;
      break;
    case 95:
      $JSCompiler_StaticMethods_doED$self$$.$a$ = Math.round(255 * Math.random());
      $JSCompiler_StaticMethods_doED$self$$.$f$ = $JSCompiler_StaticMethods_doED$self$$.$f$ & 1 | $JSCompiler_StaticMethods_doED$self$$.$SZ_TABLE$[$JSCompiler_StaticMethods_doED$self$$.$a$] | ($JSCompiler_StaticMethods_doED$self$$.$iff2$ ? 4 : 0);
      $JSCompiler_StaticMethods_doED$self$$.$pc$++;
      break;
    case 96:
      $JSCompiler_StaticMethods_doED$self$$.$h$ = $JSCompiler_StaticMethods_in_$$($JSCompiler_StaticMethods_doED$self$$.port, $JSCompiler_StaticMethods_doED$self$$.$c$);
      $JSCompiler_StaticMethods_doED$self$$.$f$ = $JSCompiler_StaticMethods_doED$self$$.$f$ & 1 | $JSCompiler_StaticMethods_doED$self$$.$SZP_TABLE$[$JSCompiler_StaticMethods_doED$self$$.$h$];
      $JSCompiler_StaticMethods_doED$self$$.$pc$++;
      break;
    case 97:
      $JSCompiler_StaticMethods_out$$($JSCompiler_StaticMethods_doED$self$$.port, $JSCompiler_StaticMethods_doED$self$$.$c$, $JSCompiler_StaticMethods_doED$self$$.$h$);
      $JSCompiler_StaticMethods_doED$self$$.$pc$++;
      break;
    case 98:
      $JSCompiler_StaticMethods_sbc16$$($JSCompiler_StaticMethods_doED$self$$, $JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doED$self$$));
      $JSCompiler_StaticMethods_doED$self$$.$pc$++;
      break;
    case 99:
      $location$$27_temp$$45$$ = $JSCompiler_StaticMethods_doED$self$$.$readMemWord$($JSCompiler_StaticMethods_doED$self$$.$pc$ + 1);
      $JSCompiler_StaticMethods_doED$self$$.$writeMem$($location$$27_temp$$45$$++, $JSCompiler_StaticMethods_doED$self$$.$l$);
      $JSCompiler_StaticMethods_doED$self$$.$writeMem$($location$$27_temp$$45$$, $JSCompiler_StaticMethods_doED$self$$.$h$);
      $JSCompiler_StaticMethods_doED$self$$.$pc$ += 3;
      break;
    case 103:
      $location$$27_temp$$45$$ = $JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doED$self$$);
      $hlmem$$ = $JSCompiler_StaticMethods_doED$self$$.$readMem$($location$$27_temp$$45$$);
      $JSCompiler_StaticMethods_doED$self$$.$writeMem$($location$$27_temp$$45$$, $hlmem$$ >> 4 | ($JSCompiler_StaticMethods_doED$self$$.$a$ & 15) << 4);
      $JSCompiler_StaticMethods_doED$self$$.$a$ = $JSCompiler_StaticMethods_doED$self$$.$a$ & 240 | $hlmem$$ & 15;
      $JSCompiler_StaticMethods_doED$self$$.$f$ = $JSCompiler_StaticMethods_doED$self$$.$f$ & 1 | $JSCompiler_StaticMethods_doED$self$$.$SZP_TABLE$[$JSCompiler_StaticMethods_doED$self$$.$a$];
      $JSCompiler_StaticMethods_doED$self$$.$pc$++;
      break;
    case 104:
      $JSCompiler_StaticMethods_doED$self$$.$l$ = $JSCompiler_StaticMethods_in_$$($JSCompiler_StaticMethods_doED$self$$.port, $JSCompiler_StaticMethods_doED$self$$.$c$);
      $JSCompiler_StaticMethods_doED$self$$.$f$ = $JSCompiler_StaticMethods_doED$self$$.$f$ & 1 | $JSCompiler_StaticMethods_doED$self$$.$SZP_TABLE$[$JSCompiler_StaticMethods_doED$self$$.$l$];
      $JSCompiler_StaticMethods_doED$self$$.$pc$++;
      break;
    case 105:
      $JSCompiler_StaticMethods_out$$($JSCompiler_StaticMethods_doED$self$$.port, $JSCompiler_StaticMethods_doED$self$$.$c$, $JSCompiler_StaticMethods_doED$self$$.$l$);
      $JSCompiler_StaticMethods_doED$self$$.$pc$++;
      break;
    case 106:
      $JSCompiler_StaticMethods_adc16$$($JSCompiler_StaticMethods_doED$self$$, $JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doED$self$$));
      $JSCompiler_StaticMethods_doED$self$$.$pc$++;
      break;
    case 107:
      $location$$27_temp$$45$$ = $JSCompiler_StaticMethods_doED$self$$.$readMemWord$($JSCompiler_StaticMethods_doED$self$$.$pc$ + 1);
      $JSCompiler_StaticMethods_doED$self$$.$l$ = $JSCompiler_StaticMethods_doED$self$$.$readMem$($location$$27_temp$$45$$++);
      $JSCompiler_StaticMethods_doED$self$$.$h$ = $JSCompiler_StaticMethods_doED$self$$.$readMem$($location$$27_temp$$45$$);
      $JSCompiler_StaticMethods_doED$self$$.$pc$ += 3;
      break;
    case 111:
      $location$$27_temp$$45$$ = $JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doED$self$$);
      $hlmem$$ = $JSCompiler_StaticMethods_doED$self$$.$readMem$($location$$27_temp$$45$$);
      $JSCompiler_StaticMethods_doED$self$$.$writeMem$($location$$27_temp$$45$$, ($hlmem$$ & 15) << 4 | $JSCompiler_StaticMethods_doED$self$$.$a$ & 15);
      $JSCompiler_StaticMethods_doED$self$$.$a$ = $JSCompiler_StaticMethods_doED$self$$.$a$ & 240 | $hlmem$$ >> 4;
      $JSCompiler_StaticMethods_doED$self$$.$f$ = $JSCompiler_StaticMethods_doED$self$$.$f$ & 1 | $JSCompiler_StaticMethods_doED$self$$.$SZP_TABLE$[$JSCompiler_StaticMethods_doED$self$$.$a$];
      $JSCompiler_StaticMethods_doED$self$$.$pc$++;
      break;
    case 113:
      $JSCompiler_StaticMethods_out$$($JSCompiler_StaticMethods_doED$self$$.port, $JSCompiler_StaticMethods_doED$self$$.$c$, 0);
      $JSCompiler_StaticMethods_doED$self$$.$pc$++;
      break;
    case 114:
      $JSCompiler_StaticMethods_sbc16$$($JSCompiler_StaticMethods_doED$self$$, $JSCompiler_StaticMethods_doED$self$$.$sp$);
      $JSCompiler_StaticMethods_doED$self$$.$pc$++;
      break;
    case 115:
      $location$$27_temp$$45$$ = $JSCompiler_StaticMethods_doED$self$$.$readMemWord$($JSCompiler_StaticMethods_doED$self$$.$pc$ + 1);
      $JSCompiler_StaticMethods_doED$self$$.$writeMem$($location$$27_temp$$45$$++, $JSCompiler_StaticMethods_doED$self$$.$sp$ & 255);
      $JSCompiler_StaticMethods_doED$self$$.$writeMem$($location$$27_temp$$45$$, $JSCompiler_StaticMethods_doED$self$$.$sp$ >> 8);
      $JSCompiler_StaticMethods_doED$self$$.$pc$ += 3;
      break;
    case 120:
      $JSCompiler_StaticMethods_doED$self$$.$a$ = $JSCompiler_StaticMethods_in_$$($JSCompiler_StaticMethods_doED$self$$.port, $JSCompiler_StaticMethods_doED$self$$.$c$);
      $JSCompiler_StaticMethods_doED$self$$.$f$ = $JSCompiler_StaticMethods_doED$self$$.$f$ & 1 | $JSCompiler_StaticMethods_doED$self$$.$SZP_TABLE$[$JSCompiler_StaticMethods_doED$self$$.$a$];
      $JSCompiler_StaticMethods_doED$self$$.$pc$++;
      break;
    case 121:
      $JSCompiler_StaticMethods_out$$($JSCompiler_StaticMethods_doED$self$$.port, $JSCompiler_StaticMethods_doED$self$$.$c$, $JSCompiler_StaticMethods_doED$self$$.$a$);
      $JSCompiler_StaticMethods_doED$self$$.$pc$++;
      break;
    case 122:
      $JSCompiler_StaticMethods_adc16$$($JSCompiler_StaticMethods_doED$self$$, $JSCompiler_StaticMethods_doED$self$$.$sp$);
      $JSCompiler_StaticMethods_doED$self$$.$pc$++;
      break;
    case 123:
      $JSCompiler_StaticMethods_doED$self$$.$sp$ = $JSCompiler_StaticMethods_doED$self$$.$readMemWord$($JSCompiler_StaticMethods_doED$self$$.$readMemWord$($JSCompiler_StaticMethods_doED$self$$.$pc$ + 1));
      $JSCompiler_StaticMethods_doED$self$$.$pc$ += 3;
      break;
    case 160:
      $JSCompiler_StaticMethods_doED$self$$.$writeMem$($JSCompiler_StaticMethods_getDE$$($JSCompiler_StaticMethods_doED$self$$), $JSCompiler_StaticMethods_doED$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doED$self$$)));
      $JSCompiler_StaticMethods_incDE$$($JSCompiler_StaticMethods_doED$self$$);
      $JSCompiler_StaticMethods_incHL$$($JSCompiler_StaticMethods_doED$self$$);
      $JSCompiler_StaticMethods_decBC$$($JSCompiler_StaticMethods_doED$self$$);
      $JSCompiler_StaticMethods_doED$self$$.$f$ = $JSCompiler_StaticMethods_doED$self$$.$f$ & 193 | (0 != $JSCompiler_StaticMethods_getBC$$($JSCompiler_StaticMethods_doED$self$$) ? 4 : 0);
      $JSCompiler_StaticMethods_doED$self$$.$pc$++;
      break;
    case 161:
      $location$$27_temp$$45$$ = $JSCompiler_StaticMethods_doED$self$$.$f$ & 1 | 2;
      $JSCompiler_StaticMethods_cp_a$$($JSCompiler_StaticMethods_doED$self$$, $JSCompiler_StaticMethods_doED$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doED$self$$)));
      $JSCompiler_StaticMethods_incHL$$($JSCompiler_StaticMethods_doED$self$$);
      $JSCompiler_StaticMethods_decBC$$($JSCompiler_StaticMethods_doED$self$$);
      $location$$27_temp$$45$$ |= 0 == $JSCompiler_StaticMethods_getBC$$($JSCompiler_StaticMethods_doED$self$$) ? 0 : 4;
      $JSCompiler_StaticMethods_doED$self$$.$f$ = $JSCompiler_StaticMethods_doED$self$$.$f$ & 248 | $location$$27_temp$$45$$;
      $JSCompiler_StaticMethods_doED$self$$.$pc$++;
      break;
    case 162:
      $location$$27_temp$$45$$ = $JSCompiler_StaticMethods_in_$$($JSCompiler_StaticMethods_doED$self$$.port, $JSCompiler_StaticMethods_doED$self$$.$c$);
      $JSCompiler_StaticMethods_doED$self$$.$writeMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doED$self$$), $location$$27_temp$$45$$);
      $JSCompiler_StaticMethods_doED$self$$.$b$ = $JSCompiler_StaticMethods_dec8$$($JSCompiler_StaticMethods_doED$self$$, $JSCompiler_StaticMethods_doED$self$$.$b$);
      $JSCompiler_StaticMethods_incHL$$($JSCompiler_StaticMethods_doED$self$$);
      $JSCompiler_StaticMethods_doED$self$$.$f$ = 128 == ($location$$27_temp$$45$$ & 128) ? $JSCompiler_StaticMethods_doED$self$$.$f$ | 2 : $JSCompiler_StaticMethods_doED$self$$.$f$ & -3;
      $JSCompiler_StaticMethods_doED$self$$.$pc$++;
      break;
    case 163:
      $location$$27_temp$$45$$ = $JSCompiler_StaticMethods_doED$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doED$self$$));
      $JSCompiler_StaticMethods_out$$($JSCompiler_StaticMethods_doED$self$$.port, $JSCompiler_StaticMethods_doED$self$$.$c$, $location$$27_temp$$45$$);
      $JSCompiler_StaticMethods_incHL$$($JSCompiler_StaticMethods_doED$self$$);
      $JSCompiler_StaticMethods_doED$self$$.$b$ = $JSCompiler_StaticMethods_dec8$$($JSCompiler_StaticMethods_doED$self$$, $JSCompiler_StaticMethods_doED$self$$.$b$);
      255 < $JSCompiler_StaticMethods_doED$self$$.$l$ + $location$$27_temp$$45$$ ? ($JSCompiler_StaticMethods_doED$self$$.$f$ |= 1, $JSCompiler_StaticMethods_doED$self$$.$f$ |= 16) : ($JSCompiler_StaticMethods_doED$self$$.$f$ &= -2, $JSCompiler_StaticMethods_doED$self$$.$f$ &= -17);
      $JSCompiler_StaticMethods_doED$self$$.$f$ = 128 == ($location$$27_temp$$45$$ & 128) ? $JSCompiler_StaticMethods_doED$self$$.$f$ | 2 : $JSCompiler_StaticMethods_doED$self$$.$f$ & -3;
      $JSCompiler_StaticMethods_doED$self$$.$pc$++;
      break;
    case 168:
      $JSCompiler_StaticMethods_doED$self$$.$writeMem$($JSCompiler_StaticMethods_getDE$$($JSCompiler_StaticMethods_doED$self$$), $JSCompiler_StaticMethods_doED$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doED$self$$)));
      $JSCompiler_StaticMethods_decDE$$($JSCompiler_StaticMethods_doED$self$$);
      $JSCompiler_StaticMethods_decHL$$($JSCompiler_StaticMethods_doED$self$$);
      $JSCompiler_StaticMethods_decBC$$($JSCompiler_StaticMethods_doED$self$$);
      $JSCompiler_StaticMethods_doED$self$$.$f$ = $JSCompiler_StaticMethods_doED$self$$.$f$ & 193 | (0 != $JSCompiler_StaticMethods_getBC$$($JSCompiler_StaticMethods_doED$self$$) ? 4 : 0);
      $JSCompiler_StaticMethods_doED$self$$.$pc$++;
      break;
    case 169:
      $location$$27_temp$$45$$ = $JSCompiler_StaticMethods_doED$self$$.$f$ & 1 | 2;
      $JSCompiler_StaticMethods_cp_a$$($JSCompiler_StaticMethods_doED$self$$, $JSCompiler_StaticMethods_doED$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doED$self$$)));
      $JSCompiler_StaticMethods_decHL$$($JSCompiler_StaticMethods_doED$self$$);
      $JSCompiler_StaticMethods_decBC$$($JSCompiler_StaticMethods_doED$self$$);
      $location$$27_temp$$45$$ |= 0 == $JSCompiler_StaticMethods_getBC$$($JSCompiler_StaticMethods_doED$self$$) ? 0 : 4;
      $JSCompiler_StaticMethods_doED$self$$.$f$ = $JSCompiler_StaticMethods_doED$self$$.$f$ & 248 | $location$$27_temp$$45$$;
      $JSCompiler_StaticMethods_doED$self$$.$pc$++;
      break;
    case 170:
      $location$$27_temp$$45$$ = $JSCompiler_StaticMethods_in_$$($JSCompiler_StaticMethods_doED$self$$.port, $JSCompiler_StaticMethods_doED$self$$.$c$);
      $JSCompiler_StaticMethods_doED$self$$.$writeMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doED$self$$), $location$$27_temp$$45$$);
      $JSCompiler_StaticMethods_doED$self$$.$b$ = $JSCompiler_StaticMethods_dec8$$($JSCompiler_StaticMethods_doED$self$$, $JSCompiler_StaticMethods_doED$self$$.$b$);
      $JSCompiler_StaticMethods_decHL$$($JSCompiler_StaticMethods_doED$self$$);
      $JSCompiler_StaticMethods_doED$self$$.$f$ = 0 != ($location$$27_temp$$45$$ & 128) ? $JSCompiler_StaticMethods_doED$self$$.$f$ | 2 : $JSCompiler_StaticMethods_doED$self$$.$f$ & -3;
      $JSCompiler_StaticMethods_doED$self$$.$pc$++;
      break;
    case 171:
      $location$$27_temp$$45$$ = $JSCompiler_StaticMethods_doED$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doED$self$$));
      $JSCompiler_StaticMethods_out$$($JSCompiler_StaticMethods_doED$self$$.port, $JSCompiler_StaticMethods_doED$self$$.$c$, $location$$27_temp$$45$$);
      $JSCompiler_StaticMethods_decHL$$($JSCompiler_StaticMethods_doED$self$$);
      $JSCompiler_StaticMethods_doED$self$$.$b$ = $JSCompiler_StaticMethods_dec8$$($JSCompiler_StaticMethods_doED$self$$, $JSCompiler_StaticMethods_doED$self$$.$b$);
      255 < $JSCompiler_StaticMethods_doED$self$$.$l$ + $location$$27_temp$$45$$ ? ($JSCompiler_StaticMethods_doED$self$$.$f$ |= 1, $JSCompiler_StaticMethods_doED$self$$.$f$ |= 16) : ($JSCompiler_StaticMethods_doED$self$$.$f$ &= -2, $JSCompiler_StaticMethods_doED$self$$.$f$ &= -17);
      $JSCompiler_StaticMethods_doED$self$$.$f$ = 128 == ($location$$27_temp$$45$$ & 128) ? $JSCompiler_StaticMethods_doED$self$$.$f$ | 2 : $JSCompiler_StaticMethods_doED$self$$.$f$ & -3;
      $JSCompiler_StaticMethods_doED$self$$.$pc$++;
      break;
    case 176:
      $JSCompiler_StaticMethods_doED$self$$.$writeMem$($JSCompiler_StaticMethods_getDE$$($JSCompiler_StaticMethods_doED$self$$), $JSCompiler_StaticMethods_doED$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doED$self$$)));
      $JSCompiler_StaticMethods_incDE$$($JSCompiler_StaticMethods_doED$self$$);
      $JSCompiler_StaticMethods_incHL$$($JSCompiler_StaticMethods_doED$self$$);
      $JSCompiler_StaticMethods_decBC$$($JSCompiler_StaticMethods_doED$self$$);
      0 != $JSCompiler_StaticMethods_getBC$$($JSCompiler_StaticMethods_doED$self$$) ? ($JSCompiler_StaticMethods_doED$self$$.$f$ |= 4, $JSCompiler_StaticMethods_doED$self$$.$tstates$ -= 5, $JSCompiler_StaticMethods_doED$self$$.$pc$--) : ($JSCompiler_StaticMethods_doED$self$$.$f$ &= -5, $JSCompiler_StaticMethods_doED$self$$.$pc$++);
      $JSCompiler_StaticMethods_doED$self$$.$f$ &= -3;
      $JSCompiler_StaticMethods_doED$self$$.$f$ &= -17;
      break;
    case 177:
      $location$$27_temp$$45$$ = $JSCompiler_StaticMethods_doED$self$$.$f$ & 1 | 2;
      $JSCompiler_StaticMethods_cp_a$$($JSCompiler_StaticMethods_doED$self$$, $JSCompiler_StaticMethods_doED$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doED$self$$)));
      $JSCompiler_StaticMethods_incHL$$($JSCompiler_StaticMethods_doED$self$$);
      $JSCompiler_StaticMethods_decBC$$($JSCompiler_StaticMethods_doED$self$$);
      $location$$27_temp$$45$$ |= 0 == $JSCompiler_StaticMethods_getBC$$($JSCompiler_StaticMethods_doED$self$$) ? 0 : 4;
      0 != ($location$$27_temp$$45$$ & 4) && 0 == ($JSCompiler_StaticMethods_doED$self$$.$f$ & 64) ? ($JSCompiler_StaticMethods_doED$self$$.$tstates$ -= 5, $JSCompiler_StaticMethods_doED$self$$.$pc$--) : $JSCompiler_StaticMethods_doED$self$$.$pc$++;
      $JSCompiler_StaticMethods_doED$self$$.$f$ = $JSCompiler_StaticMethods_doED$self$$.$f$ & 248 | $location$$27_temp$$45$$;
      break;
    case 178:
      $location$$27_temp$$45$$ = $JSCompiler_StaticMethods_in_$$($JSCompiler_StaticMethods_doED$self$$.port, $JSCompiler_StaticMethods_doED$self$$.$c$);
      $JSCompiler_StaticMethods_doED$self$$.$writeMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doED$self$$), $location$$27_temp$$45$$);
      $JSCompiler_StaticMethods_doED$self$$.$b$ = $JSCompiler_StaticMethods_dec8$$($JSCompiler_StaticMethods_doED$self$$, $JSCompiler_StaticMethods_doED$self$$.$b$);
      $JSCompiler_StaticMethods_incHL$$($JSCompiler_StaticMethods_doED$self$$);
      0 != $JSCompiler_StaticMethods_doED$self$$.$b$ ? ($JSCompiler_StaticMethods_doED$self$$.$tstates$ -= 5, $JSCompiler_StaticMethods_doED$self$$.$pc$--) : $JSCompiler_StaticMethods_doED$self$$.$pc$++;
      $JSCompiler_StaticMethods_doED$self$$.$f$ = 128 == ($location$$27_temp$$45$$ & 128) ? $JSCompiler_StaticMethods_doED$self$$.$f$ | 2 : $JSCompiler_StaticMethods_doED$self$$.$f$ & -3;
      break;
    case 179:
      $location$$27_temp$$45$$ = $JSCompiler_StaticMethods_doED$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doED$self$$));
      $JSCompiler_StaticMethods_out$$($JSCompiler_StaticMethods_doED$self$$.port, $JSCompiler_StaticMethods_doED$self$$.$c$, $location$$27_temp$$45$$);
      $JSCompiler_StaticMethods_doED$self$$.$b$ = $JSCompiler_StaticMethods_dec8$$($JSCompiler_StaticMethods_doED$self$$, $JSCompiler_StaticMethods_doED$self$$.$b$);
      $JSCompiler_StaticMethods_incHL$$($JSCompiler_StaticMethods_doED$self$$);
      0 != $JSCompiler_StaticMethods_doED$self$$.$b$ ? ($JSCompiler_StaticMethods_doED$self$$.$tstates$ -= 5, $JSCompiler_StaticMethods_doED$self$$.$pc$--) : $JSCompiler_StaticMethods_doED$self$$.$pc$++;
      255 < $JSCompiler_StaticMethods_doED$self$$.$l$ + $location$$27_temp$$45$$ ? ($JSCompiler_StaticMethods_doED$self$$.$f$ |= 1, $JSCompiler_StaticMethods_doED$self$$.$f$ |= 16) : ($JSCompiler_StaticMethods_doED$self$$.$f$ &= -2, $JSCompiler_StaticMethods_doED$self$$.$f$ &= -17);
      $JSCompiler_StaticMethods_doED$self$$.$f$ = 0 != ($location$$27_temp$$45$$ & 128) ? $JSCompiler_StaticMethods_doED$self$$.$f$ | 2 : $JSCompiler_StaticMethods_doED$self$$.$f$ & -3;
      break;
    case 184:
      $JSCompiler_StaticMethods_doED$self$$.$writeMem$($JSCompiler_StaticMethods_getDE$$($JSCompiler_StaticMethods_doED$self$$), $JSCompiler_StaticMethods_doED$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doED$self$$)));
      $JSCompiler_StaticMethods_decDE$$($JSCompiler_StaticMethods_doED$self$$);
      $JSCompiler_StaticMethods_decHL$$($JSCompiler_StaticMethods_doED$self$$);
      $JSCompiler_StaticMethods_decBC$$($JSCompiler_StaticMethods_doED$self$$);
      0 != $JSCompiler_StaticMethods_getBC$$($JSCompiler_StaticMethods_doED$self$$) ? ($JSCompiler_StaticMethods_doED$self$$.$f$ |= 4, $JSCompiler_StaticMethods_doED$self$$.$tstates$ -= 5, $JSCompiler_StaticMethods_doED$self$$.$pc$--) : ($JSCompiler_StaticMethods_doED$self$$.$f$ &= -5, $JSCompiler_StaticMethods_doED$self$$.$pc$++);
      $JSCompiler_StaticMethods_doED$self$$.$f$ &= -3;
      $JSCompiler_StaticMethods_doED$self$$.$f$ &= -17;
      break;
    case 185:
      $location$$27_temp$$45$$ = $JSCompiler_StaticMethods_doED$self$$.$f$ & 1 | 2;
      $JSCompiler_StaticMethods_cp_a$$($JSCompiler_StaticMethods_doED$self$$, $JSCompiler_StaticMethods_doED$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doED$self$$)));
      $JSCompiler_StaticMethods_decHL$$($JSCompiler_StaticMethods_doED$self$$);
      $JSCompiler_StaticMethods_decBC$$($JSCompiler_StaticMethods_doED$self$$);
      $location$$27_temp$$45$$ |= 0 == $JSCompiler_StaticMethods_getBC$$($JSCompiler_StaticMethods_doED$self$$) ? 0 : 4;
      0 != ($location$$27_temp$$45$$ & 4) && 0 == ($JSCompiler_StaticMethods_doED$self$$.$f$ & 64) ? ($JSCompiler_StaticMethods_doED$self$$.$tstates$ -= 5, $JSCompiler_StaticMethods_doED$self$$.$pc$--) : $JSCompiler_StaticMethods_doED$self$$.$pc$++;
      $JSCompiler_StaticMethods_doED$self$$.$f$ = $JSCompiler_StaticMethods_doED$self$$.$f$ & 248 | $location$$27_temp$$45$$;
      break;
    case 186:
      $location$$27_temp$$45$$ = $JSCompiler_StaticMethods_in_$$($JSCompiler_StaticMethods_doED$self$$.port, $JSCompiler_StaticMethods_doED$self$$.$c$);
      $JSCompiler_StaticMethods_doED$self$$.$writeMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doED$self$$), $location$$27_temp$$45$$);
      $JSCompiler_StaticMethods_doED$self$$.$b$ = $JSCompiler_StaticMethods_dec8$$($JSCompiler_StaticMethods_doED$self$$, $JSCompiler_StaticMethods_doED$self$$.$b$);
      $JSCompiler_StaticMethods_decHL$$($JSCompiler_StaticMethods_doED$self$$);
      0 != $JSCompiler_StaticMethods_doED$self$$.$b$ ? ($JSCompiler_StaticMethods_doED$self$$.$tstates$ -= 5, $JSCompiler_StaticMethods_doED$self$$.$pc$--) : $JSCompiler_StaticMethods_doED$self$$.$pc$++;
      $JSCompiler_StaticMethods_doED$self$$.$f$ = 0 != ($location$$27_temp$$45$$ & 128) ? $JSCompiler_StaticMethods_doED$self$$.$f$ | 2 : $JSCompiler_StaticMethods_doED$self$$.$f$ & -3;
      break;
    case 187:
      $location$$27_temp$$45$$ = $JSCompiler_StaticMethods_doED$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doED$self$$));
      $JSCompiler_StaticMethods_out$$($JSCompiler_StaticMethods_doED$self$$.port, $JSCompiler_StaticMethods_doED$self$$.$c$, $location$$27_temp$$45$$);
      $JSCompiler_StaticMethods_doED$self$$.$b$ = $JSCompiler_StaticMethods_dec8$$($JSCompiler_StaticMethods_doED$self$$, $JSCompiler_StaticMethods_doED$self$$.$b$);
      $JSCompiler_StaticMethods_decHL$$($JSCompiler_StaticMethods_doED$self$$);
      0 != $JSCompiler_StaticMethods_doED$self$$.$b$ ? ($JSCompiler_StaticMethods_doED$self$$.$tstates$ -= 5, $JSCompiler_StaticMethods_doED$self$$.$pc$--) : $JSCompiler_StaticMethods_doED$self$$.$pc$++;
      255 < $JSCompiler_StaticMethods_doED$self$$.$l$ + $location$$27_temp$$45$$ ? ($JSCompiler_StaticMethods_doED$self$$.$f$ |= 1, $JSCompiler_StaticMethods_doED$self$$.$f$ |= 16) : ($JSCompiler_StaticMethods_doED$self$$.$f$ &= -2, $JSCompiler_StaticMethods_doED$self$$.$f$ &= -17);
      $JSCompiler_StaticMethods_doED$self$$.$f$ = 0 != ($location$$27_temp$$45$$ & 128) ? $JSCompiler_StaticMethods_doED$self$$.$f$ | 2 : $JSCompiler_StaticMethods_doED$self$$.$f$ & -3;
      break;
    default:
      console.log("Unimplemented ED Opcode: " + $opcode$$13$$.toString(16)), $JSCompiler_StaticMethods_doED$self$$.$pc$++
  }
}
function $JSCompiler_StaticMethods_doIndexCB$$($JSCompiler_StaticMethods_doIndexCB$self$$, $index$$45$$) {
  var $location$$26$$ = $index$$45$$ + $JSCompiler_StaticMethods_d_$$($JSCompiler_StaticMethods_doIndexCB$self$$) & 65535, $opcode$$12$$ = $JSCompiler_StaticMethods_doIndexCB$self$$.$readMem$(++$JSCompiler_StaticMethods_doIndexCB$self$$.$pc$);
  $JSCompiler_StaticMethods_doIndexCB$self$$.$tstates$ -= $OP_INDEX_CB_STATES$$[$opcode$$12$$];
  switch($opcode$$12$$) {
    case 6:
      $JSCompiler_StaticMethods_doIndexCB$self$$.$writeMem$($location$$26$$, $JSCompiler_StaticMethods_rlc$$($JSCompiler_StaticMethods_doIndexCB$self$$, $JSCompiler_StaticMethods_doIndexCB$self$$.$readMem$($location$$26$$)));
      break;
    case 14:
      $JSCompiler_StaticMethods_doIndexCB$self$$.$writeMem$($location$$26$$, $JSCompiler_StaticMethods_rrc$$($JSCompiler_StaticMethods_doIndexCB$self$$, $JSCompiler_StaticMethods_doIndexCB$self$$.$readMem$($location$$26$$)));
      break;
    case 22:
      $JSCompiler_StaticMethods_doIndexCB$self$$.$writeMem$($location$$26$$, $JSCompiler_StaticMethods_rl$$($JSCompiler_StaticMethods_doIndexCB$self$$, $JSCompiler_StaticMethods_doIndexCB$self$$.$readMem$($location$$26$$)));
      break;
    case 30:
      $JSCompiler_StaticMethods_doIndexCB$self$$.$writeMem$($location$$26$$, $JSCompiler_StaticMethods_rr$$($JSCompiler_StaticMethods_doIndexCB$self$$, $JSCompiler_StaticMethods_doIndexCB$self$$.$readMem$($location$$26$$)));
      break;
    case 38:
      $JSCompiler_StaticMethods_doIndexCB$self$$.$writeMem$($location$$26$$, $JSCompiler_StaticMethods_sla$$($JSCompiler_StaticMethods_doIndexCB$self$$, $JSCompiler_StaticMethods_doIndexCB$self$$.$readMem$($location$$26$$)));
      break;
    case 46:
      $JSCompiler_StaticMethods_doIndexCB$self$$.$writeMem$($location$$26$$, $JSCompiler_StaticMethods_sra$$($JSCompiler_StaticMethods_doIndexCB$self$$, $JSCompiler_StaticMethods_doIndexCB$self$$.$readMem$($location$$26$$)));
      break;
    case 54:
      $JSCompiler_StaticMethods_doIndexCB$self$$.$writeMem$($location$$26$$, $JSCompiler_StaticMethods_sll$$($JSCompiler_StaticMethods_doIndexCB$self$$, $JSCompiler_StaticMethods_doIndexCB$self$$.$readMem$($location$$26$$)));
      break;
    case 62:
      $JSCompiler_StaticMethods_doIndexCB$self$$.$writeMem$($location$$26$$, $JSCompiler_StaticMethods_srl$$($JSCompiler_StaticMethods_doIndexCB$self$$, $JSCompiler_StaticMethods_doIndexCB$self$$.$readMem$($location$$26$$)));
      break;
    case 70:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doIndexCB$self$$, $JSCompiler_StaticMethods_doIndexCB$self$$.$readMem$($location$$26$$) & 1);
      break;
    case 78:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doIndexCB$self$$, $JSCompiler_StaticMethods_doIndexCB$self$$.$readMem$($location$$26$$) & 2);
      break;
    case 86:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doIndexCB$self$$, $JSCompiler_StaticMethods_doIndexCB$self$$.$readMem$($location$$26$$) & 4);
      break;
    case 94:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doIndexCB$self$$, $JSCompiler_StaticMethods_doIndexCB$self$$.$readMem$($location$$26$$) & 8);
      break;
    case 102:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doIndexCB$self$$, $JSCompiler_StaticMethods_doIndexCB$self$$.$readMem$($location$$26$$) & 16);
      break;
    case 110:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doIndexCB$self$$, $JSCompiler_StaticMethods_doIndexCB$self$$.$readMem$($location$$26$$) & 32);
      break;
    case 118:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doIndexCB$self$$, $JSCompiler_StaticMethods_doIndexCB$self$$.$readMem$($location$$26$$) & 64);
      break;
    case 126:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doIndexCB$self$$, $JSCompiler_StaticMethods_doIndexCB$self$$.$readMem$($location$$26$$) & 128);
      break;
    case 134:
      $JSCompiler_StaticMethods_doIndexCB$self$$.$writeMem$($location$$26$$, $JSCompiler_StaticMethods_doIndexCB$self$$.$readMem$($location$$26$$) & -2);
      break;
    case 142:
      $JSCompiler_StaticMethods_doIndexCB$self$$.$writeMem$($location$$26$$, $JSCompiler_StaticMethods_doIndexCB$self$$.$readMem$($location$$26$$) & -3);
      break;
    case 150:
      $JSCompiler_StaticMethods_doIndexCB$self$$.$writeMem$($location$$26$$, $JSCompiler_StaticMethods_doIndexCB$self$$.$readMem$($location$$26$$) & -5);
      break;
    case 158:
      $JSCompiler_StaticMethods_doIndexCB$self$$.$writeMem$($location$$26$$, $JSCompiler_StaticMethods_doIndexCB$self$$.$readMem$($location$$26$$) & -9);
      break;
    case 166:
      $JSCompiler_StaticMethods_doIndexCB$self$$.$writeMem$($location$$26$$, $JSCompiler_StaticMethods_doIndexCB$self$$.$readMem$($location$$26$$) & -17);
      break;
    case 174:
      $JSCompiler_StaticMethods_doIndexCB$self$$.$writeMem$($location$$26$$, $JSCompiler_StaticMethods_doIndexCB$self$$.$readMem$($location$$26$$) & -33);
      break;
    case 182:
      $JSCompiler_StaticMethods_doIndexCB$self$$.$writeMem$($location$$26$$, $JSCompiler_StaticMethods_doIndexCB$self$$.$readMem$($location$$26$$) & -65);
      break;
    case 190:
      $JSCompiler_StaticMethods_doIndexCB$self$$.$writeMem$($location$$26$$, $JSCompiler_StaticMethods_doIndexCB$self$$.$readMem$($location$$26$$) & -129);
      break;
    case 198:
      $JSCompiler_StaticMethods_doIndexCB$self$$.$writeMem$($location$$26$$, $JSCompiler_StaticMethods_doIndexCB$self$$.$readMem$($location$$26$$) | 1);
      break;
    case 206:
      $JSCompiler_StaticMethods_doIndexCB$self$$.$writeMem$($location$$26$$, $JSCompiler_StaticMethods_doIndexCB$self$$.$readMem$($location$$26$$) | 2);
      break;
    case 214:
      $JSCompiler_StaticMethods_doIndexCB$self$$.$writeMem$($location$$26$$, $JSCompiler_StaticMethods_doIndexCB$self$$.$readMem$($location$$26$$) | 4);
      break;
    case 222:
      $JSCompiler_StaticMethods_doIndexCB$self$$.$writeMem$($location$$26$$, $JSCompiler_StaticMethods_doIndexCB$self$$.$readMem$($location$$26$$) | 8);
      break;
    case 230:
      $JSCompiler_StaticMethods_doIndexCB$self$$.$writeMem$($location$$26$$, $JSCompiler_StaticMethods_doIndexCB$self$$.$readMem$($location$$26$$) | 16);
      break;
    case 238:
      $JSCompiler_StaticMethods_doIndexCB$self$$.$writeMem$($location$$26$$, $JSCompiler_StaticMethods_doIndexCB$self$$.$readMem$($location$$26$$) | 32);
      break;
    case 246:
      $JSCompiler_StaticMethods_doIndexCB$self$$.$writeMem$($location$$26$$, $JSCompiler_StaticMethods_doIndexCB$self$$.$readMem$($location$$26$$) | 64);
      break;
    case 254:
      $JSCompiler_StaticMethods_doIndexCB$self$$.$writeMem$($location$$26$$, $JSCompiler_StaticMethods_doIndexCB$self$$.$readMem$($location$$26$$) | 128);
      break;
    default:
      console.log("Unimplemented DDCB or FDCB Opcode: " + ($opcode$$12$$ & 255).toString(16))
  }
  $JSCompiler_StaticMethods_doIndexCB$self$$.$pc$++
}
function $JSCompiler_StaticMethods_doIndexOpIY$$($JSCompiler_StaticMethods_doIndexOpIY$self$$, $opcode$$11$$) {
  var $location$$25_temp$$44$$;
  $JSCompiler_StaticMethods_doIndexOpIY$self$$.$tstates$ -= $OP_DD_STATES$$[$opcode$$11$$];
  switch($opcode$$11$$) {
    case 9:
      $JSCompiler_StaticMethods_setIY$$($JSCompiler_StaticMethods_doIndexOpIY$self$$, $JSCompiler_StaticMethods_add16$$($JSCompiler_StaticMethods_doIndexOpIY$self$$, $JSCompiler_StaticMethods_getIY$$($JSCompiler_StaticMethods_doIndexOpIY$self$$), $JSCompiler_StaticMethods_getBC$$($JSCompiler_StaticMethods_doIndexOpIY$self$$)));
      break;
    case 25:
      $JSCompiler_StaticMethods_setIY$$($JSCompiler_StaticMethods_doIndexOpIY$self$$, $JSCompiler_StaticMethods_add16$$($JSCompiler_StaticMethods_doIndexOpIY$self$$, $JSCompiler_StaticMethods_getIY$$($JSCompiler_StaticMethods_doIndexOpIY$self$$), $JSCompiler_StaticMethods_getDE$$($JSCompiler_StaticMethods_doIndexOpIY$self$$)));
      break;
    case 33:
      $JSCompiler_StaticMethods_setIY$$($JSCompiler_StaticMethods_doIndexOpIY$self$$, $JSCompiler_StaticMethods_doIndexOpIY$self$$.$readMemWord$($JSCompiler_StaticMethods_doIndexOpIY$self$$.$pc$));
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$pc$ += 2;
      break;
    case 34:
      $location$$25_temp$$44$$ = $JSCompiler_StaticMethods_doIndexOpIY$self$$.$readMemWord$($JSCompiler_StaticMethods_doIndexOpIY$self$$.$pc$);
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$writeMem$($location$$25_temp$$44$$++, $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyL$);
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$writeMem$($location$$25_temp$$44$$, $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyH$);
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$pc$ += 2;
      break;
    case 35:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyL$ = $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyL$ + 1 & 255;
      0 == $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyL$ && ($JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyH$ = $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyH$ + 1 & 255);
      break;
    case 36:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyH$ = $JSCompiler_StaticMethods_inc8$$($JSCompiler_StaticMethods_doIndexOpIY$self$$, $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyH$);
      break;
    case 37:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyH$ = $JSCompiler_StaticMethods_dec8$$($JSCompiler_StaticMethods_doIndexOpIY$self$$, $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyH$);
      break;
    case 38:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyH$ = $JSCompiler_StaticMethods_doIndexOpIY$self$$.$readMem$($JSCompiler_StaticMethods_doIndexOpIY$self$$.$pc$++);
      break;
    case 41:
      $JSCompiler_StaticMethods_setIY$$($JSCompiler_StaticMethods_doIndexOpIY$self$$, $JSCompiler_StaticMethods_add16$$($JSCompiler_StaticMethods_doIndexOpIY$self$$, $JSCompiler_StaticMethods_getIY$$($JSCompiler_StaticMethods_doIndexOpIY$self$$), $JSCompiler_StaticMethods_getIY$$($JSCompiler_StaticMethods_doIndexOpIY$self$$)));
      break;
    case 42:
      $location$$25_temp$$44$$ = $JSCompiler_StaticMethods_doIndexOpIY$self$$.$readMemWord$($JSCompiler_StaticMethods_doIndexOpIY$self$$.$pc$);
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyL$ = $JSCompiler_StaticMethods_doIndexOpIY$self$$.$readMem$($location$$25_temp$$44$$);
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyH$ = $JSCompiler_StaticMethods_doIndexOpIY$self$$.$readMem$(++$location$$25_temp$$44$$);
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$pc$ += 2;
      break;
    case 43:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyL$ = $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyL$ - 1 & 255;
      255 == $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyL$ && ($JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyH$ = $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyH$ - 1 & 255);
      break;
    case 44:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyL$ = $JSCompiler_StaticMethods_inc8$$($JSCompiler_StaticMethods_doIndexOpIY$self$$, $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyL$);
      break;
    case 45:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyL$ = $JSCompiler_StaticMethods_dec8$$($JSCompiler_StaticMethods_doIndexOpIY$self$$, $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyL$);
      break;
    case 46:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyL$ = $JSCompiler_StaticMethods_doIndexOpIY$self$$.$readMem$($JSCompiler_StaticMethods_doIndexOpIY$self$$.$pc$++);
      break;
    case 52:
      $JSCompiler_StaticMethods_incMem$$($JSCompiler_StaticMethods_doIndexOpIY$self$$, $JSCompiler_StaticMethods_getIY$$($JSCompiler_StaticMethods_doIndexOpIY$self$$) + $JSCompiler_StaticMethods_d_$$($JSCompiler_StaticMethods_doIndexOpIY$self$$));
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$pc$++;
      break;
    case 53:
      $JSCompiler_StaticMethods_decMem$$($JSCompiler_StaticMethods_doIndexOpIY$self$$, $JSCompiler_StaticMethods_getIY$$($JSCompiler_StaticMethods_doIndexOpIY$self$$) + $JSCompiler_StaticMethods_d_$$($JSCompiler_StaticMethods_doIndexOpIY$self$$));
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$pc$++;
      break;
    case 54:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$writeMem$($JSCompiler_StaticMethods_getIY$$($JSCompiler_StaticMethods_doIndexOpIY$self$$) + $JSCompiler_StaticMethods_d_$$($JSCompiler_StaticMethods_doIndexOpIY$self$$), $JSCompiler_StaticMethods_doIndexOpIY$self$$.$readMem$(++$JSCompiler_StaticMethods_doIndexOpIY$self$$.$pc$));
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$pc$++;
      break;
    case 57:
      $JSCompiler_StaticMethods_setIY$$($JSCompiler_StaticMethods_doIndexOpIY$self$$, $JSCompiler_StaticMethods_add16$$($JSCompiler_StaticMethods_doIndexOpIY$self$$, $JSCompiler_StaticMethods_getIY$$($JSCompiler_StaticMethods_doIndexOpIY$self$$), $JSCompiler_StaticMethods_doIndexOpIY$self$$.$sp$));
      break;
    case 68:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$b$ = $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyH$;
      break;
    case 69:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$b$ = $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyL$;
      break;
    case 70:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$b$ = $JSCompiler_StaticMethods_doIndexOpIY$self$$.$readMem$($JSCompiler_StaticMethods_getIY$$($JSCompiler_StaticMethods_doIndexOpIY$self$$) + $JSCompiler_StaticMethods_d_$$($JSCompiler_StaticMethods_doIndexOpIY$self$$));
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$pc$++;
      break;
    case 76:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$c$ = $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyH$;
      break;
    case 77:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$c$ = $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyL$;
      break;
    case 78:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$c$ = $JSCompiler_StaticMethods_doIndexOpIY$self$$.$readMem$($JSCompiler_StaticMethods_getIY$$($JSCompiler_StaticMethods_doIndexOpIY$self$$) + $JSCompiler_StaticMethods_d_$$($JSCompiler_StaticMethods_doIndexOpIY$self$$));
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$pc$++;
      break;
    case 84:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$d$ = $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyH$;
      break;
    case 85:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$d$ = $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyL$;
      break;
    case 86:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$d$ = $JSCompiler_StaticMethods_doIndexOpIY$self$$.$readMem$($JSCompiler_StaticMethods_getIY$$($JSCompiler_StaticMethods_doIndexOpIY$self$$) + $JSCompiler_StaticMethods_d_$$($JSCompiler_StaticMethods_doIndexOpIY$self$$));
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$pc$++;
      break;
    case 92:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$e$ = $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyH$;
      break;
    case 93:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$e$ = $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyL$;
      break;
    case 94:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$e$ = $JSCompiler_StaticMethods_doIndexOpIY$self$$.$readMem$($JSCompiler_StaticMethods_getIY$$($JSCompiler_StaticMethods_doIndexOpIY$self$$) + $JSCompiler_StaticMethods_d_$$($JSCompiler_StaticMethods_doIndexOpIY$self$$));
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$pc$++;
      break;
    case 96:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyH$ = $JSCompiler_StaticMethods_doIndexOpIY$self$$.$b$;
      break;
    case 97:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyH$ = $JSCompiler_StaticMethods_doIndexOpIY$self$$.$c$;
      break;
    case 98:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyH$ = $JSCompiler_StaticMethods_doIndexOpIY$self$$.$d$;
      break;
    case 99:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyH$ = $JSCompiler_StaticMethods_doIndexOpIY$self$$.$e$;
      break;
    case 100:
      break;
    case 101:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyH$ = $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyL$;
      break;
    case 102:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$h$ = $JSCompiler_StaticMethods_doIndexOpIY$self$$.$readMem$($JSCompiler_StaticMethods_getIY$$($JSCompiler_StaticMethods_doIndexOpIY$self$$) + $JSCompiler_StaticMethods_d_$$($JSCompiler_StaticMethods_doIndexOpIY$self$$));
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$pc$++;
      break;
    case 103:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyH$ = $JSCompiler_StaticMethods_doIndexOpIY$self$$.$a$;
      break;
    case 104:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyL$ = $JSCompiler_StaticMethods_doIndexOpIY$self$$.$b$;
      break;
    case 105:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyL$ = $JSCompiler_StaticMethods_doIndexOpIY$self$$.$c$;
      break;
    case 106:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyL$ = $JSCompiler_StaticMethods_doIndexOpIY$self$$.$d$;
      break;
    case 107:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyL$ = $JSCompiler_StaticMethods_doIndexOpIY$self$$.$e$;
      break;
    case 108:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyL$ = $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyH$;
      break;
    case 109:
      break;
    case 110:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$l$ = $JSCompiler_StaticMethods_doIndexOpIY$self$$.$readMem$($JSCompiler_StaticMethods_getIY$$($JSCompiler_StaticMethods_doIndexOpIY$self$$) + $JSCompiler_StaticMethods_d_$$($JSCompiler_StaticMethods_doIndexOpIY$self$$));
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$pc$++;
      break;
    case 111:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyL$ = $JSCompiler_StaticMethods_doIndexOpIY$self$$.$a$;
      break;
    case 112:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$writeMem$($JSCompiler_StaticMethods_getIY$$($JSCompiler_StaticMethods_doIndexOpIY$self$$) + $JSCompiler_StaticMethods_d_$$($JSCompiler_StaticMethods_doIndexOpIY$self$$), $JSCompiler_StaticMethods_doIndexOpIY$self$$.$b$);
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$pc$++;
      break;
    case 113:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$writeMem$($JSCompiler_StaticMethods_getIY$$($JSCompiler_StaticMethods_doIndexOpIY$self$$) + $JSCompiler_StaticMethods_d_$$($JSCompiler_StaticMethods_doIndexOpIY$self$$), $JSCompiler_StaticMethods_doIndexOpIY$self$$.$c$);
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$pc$++;
      break;
    case 114:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$writeMem$($JSCompiler_StaticMethods_getIY$$($JSCompiler_StaticMethods_doIndexOpIY$self$$) + $JSCompiler_StaticMethods_d_$$($JSCompiler_StaticMethods_doIndexOpIY$self$$), $JSCompiler_StaticMethods_doIndexOpIY$self$$.$d$);
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$pc$++;
      break;
    case 115:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$writeMem$($JSCompiler_StaticMethods_getIY$$($JSCompiler_StaticMethods_doIndexOpIY$self$$) + $JSCompiler_StaticMethods_d_$$($JSCompiler_StaticMethods_doIndexOpIY$self$$), $JSCompiler_StaticMethods_doIndexOpIY$self$$.$e$);
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$pc$++;
      break;
    case 116:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$writeMem$($JSCompiler_StaticMethods_getIY$$($JSCompiler_StaticMethods_doIndexOpIY$self$$) + $JSCompiler_StaticMethods_d_$$($JSCompiler_StaticMethods_doIndexOpIY$self$$), $JSCompiler_StaticMethods_doIndexOpIY$self$$.$h$);
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$pc$++;
      break;
    case 117:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$writeMem$($JSCompiler_StaticMethods_getIY$$($JSCompiler_StaticMethods_doIndexOpIY$self$$) + $JSCompiler_StaticMethods_d_$$($JSCompiler_StaticMethods_doIndexOpIY$self$$), $JSCompiler_StaticMethods_doIndexOpIY$self$$.$l$);
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$pc$++;
      break;
    case 119:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$writeMem$($JSCompiler_StaticMethods_getIY$$($JSCompiler_StaticMethods_doIndexOpIY$self$$) + $JSCompiler_StaticMethods_d_$$($JSCompiler_StaticMethods_doIndexOpIY$self$$), $JSCompiler_StaticMethods_doIndexOpIY$self$$.$a$);
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$pc$++;
      break;
    case 124:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$a$ = $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyH$;
      break;
    case 125:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$a$ = $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyL$;
      break;
    case 126:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$a$ = $JSCompiler_StaticMethods_doIndexOpIY$self$$.$readMem$($JSCompiler_StaticMethods_getIY$$($JSCompiler_StaticMethods_doIndexOpIY$self$$) + $JSCompiler_StaticMethods_d_$$($JSCompiler_StaticMethods_doIndexOpIY$self$$));
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$pc$++;
      break;
    case 132:
      $JSCompiler_StaticMethods_add_a$$($JSCompiler_StaticMethods_doIndexOpIY$self$$, $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyH$);
      break;
    case 133:
      $JSCompiler_StaticMethods_add_a$$($JSCompiler_StaticMethods_doIndexOpIY$self$$, $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyL$);
      break;
    case 134:
      $JSCompiler_StaticMethods_add_a$$($JSCompiler_StaticMethods_doIndexOpIY$self$$, $JSCompiler_StaticMethods_doIndexOpIY$self$$.$readMem$($JSCompiler_StaticMethods_getIY$$($JSCompiler_StaticMethods_doIndexOpIY$self$$) + $JSCompiler_StaticMethods_d_$$($JSCompiler_StaticMethods_doIndexOpIY$self$$)));
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$pc$++;
      break;
    case 140:
      $JSCompiler_StaticMethods_adc_a$$($JSCompiler_StaticMethods_doIndexOpIY$self$$, $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyH$);
      break;
    case 141:
      $JSCompiler_StaticMethods_adc_a$$($JSCompiler_StaticMethods_doIndexOpIY$self$$, $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyL$);
      break;
    case 142:
      $JSCompiler_StaticMethods_adc_a$$($JSCompiler_StaticMethods_doIndexOpIY$self$$, $JSCompiler_StaticMethods_doIndexOpIY$self$$.$readMem$($JSCompiler_StaticMethods_getIY$$($JSCompiler_StaticMethods_doIndexOpIY$self$$) + $JSCompiler_StaticMethods_d_$$($JSCompiler_StaticMethods_doIndexOpIY$self$$)));
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$pc$++;
      break;
    case 148:
      $JSCompiler_StaticMethods_sub_a$$($JSCompiler_StaticMethods_doIndexOpIY$self$$, $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyH$);
      break;
    case 149:
      $JSCompiler_StaticMethods_sub_a$$($JSCompiler_StaticMethods_doIndexOpIY$self$$, $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyL$);
      break;
    case 150:
      $JSCompiler_StaticMethods_sub_a$$($JSCompiler_StaticMethods_doIndexOpIY$self$$, $JSCompiler_StaticMethods_doIndexOpIY$self$$.$readMem$($JSCompiler_StaticMethods_getIY$$($JSCompiler_StaticMethods_doIndexOpIY$self$$) + $JSCompiler_StaticMethods_d_$$($JSCompiler_StaticMethods_doIndexOpIY$self$$)));
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$pc$++;
      break;
    case 156:
      $JSCompiler_StaticMethods_sbc_a$$($JSCompiler_StaticMethods_doIndexOpIY$self$$, $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyH$);
      break;
    case 157:
      $JSCompiler_StaticMethods_sbc_a$$($JSCompiler_StaticMethods_doIndexOpIY$self$$, $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyL$);
      break;
    case 158:
      $JSCompiler_StaticMethods_sbc_a$$($JSCompiler_StaticMethods_doIndexOpIY$self$$, $JSCompiler_StaticMethods_doIndexOpIY$self$$.$readMem$($JSCompiler_StaticMethods_getIY$$($JSCompiler_StaticMethods_doIndexOpIY$self$$) + $JSCompiler_StaticMethods_d_$$($JSCompiler_StaticMethods_doIndexOpIY$self$$)));
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$pc$++;
      break;
    case 164:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$f$ = $JSCompiler_StaticMethods_doIndexOpIY$self$$.$SZP_TABLE$[$JSCompiler_StaticMethods_doIndexOpIY$self$$.$a$ &= $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyH$] | 16;
      break;
    case 165:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$f$ = $JSCompiler_StaticMethods_doIndexOpIY$self$$.$SZP_TABLE$[$JSCompiler_StaticMethods_doIndexOpIY$self$$.$a$ &= $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyL$] | 16;
      break;
    case 166:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$f$ = $JSCompiler_StaticMethods_doIndexOpIY$self$$.$SZP_TABLE$[$JSCompiler_StaticMethods_doIndexOpIY$self$$.$a$ &= $JSCompiler_StaticMethods_doIndexOpIY$self$$.$readMem$($JSCompiler_StaticMethods_getIY$$($JSCompiler_StaticMethods_doIndexOpIY$self$$) + $JSCompiler_StaticMethods_d_$$($JSCompiler_StaticMethods_doIndexOpIY$self$$))] | 16;
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$pc$++;
      break;
    case 172:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$f$ = $JSCompiler_StaticMethods_doIndexOpIY$self$$.$SZP_TABLE$[$JSCompiler_StaticMethods_doIndexOpIY$self$$.$a$ ^= $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyH$];
      break;
    case 173:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$f$ = $JSCompiler_StaticMethods_doIndexOpIY$self$$.$SZP_TABLE$[$JSCompiler_StaticMethods_doIndexOpIY$self$$.$a$ ^= $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyL$];
      break;
    case 174:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$f$ = $JSCompiler_StaticMethods_doIndexOpIY$self$$.$SZP_TABLE$[$JSCompiler_StaticMethods_doIndexOpIY$self$$.$a$ ^= $JSCompiler_StaticMethods_doIndexOpIY$self$$.$readMem$($JSCompiler_StaticMethods_getIY$$($JSCompiler_StaticMethods_doIndexOpIY$self$$) + $JSCompiler_StaticMethods_d_$$($JSCompiler_StaticMethods_doIndexOpIY$self$$))];
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$pc$++;
      break;
    case 180:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$f$ = $JSCompiler_StaticMethods_doIndexOpIY$self$$.$SZP_TABLE$[$JSCompiler_StaticMethods_doIndexOpIY$self$$.$a$ |= $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyH$];
      break;
    case 181:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$f$ = $JSCompiler_StaticMethods_doIndexOpIY$self$$.$SZP_TABLE$[$JSCompiler_StaticMethods_doIndexOpIY$self$$.$a$ |= $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyL$];
      break;
    case 182:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$f$ = $JSCompiler_StaticMethods_doIndexOpIY$self$$.$SZP_TABLE$[$JSCompiler_StaticMethods_doIndexOpIY$self$$.$a$ |= $JSCompiler_StaticMethods_doIndexOpIY$self$$.$readMem$($JSCompiler_StaticMethods_getIY$$($JSCompiler_StaticMethods_doIndexOpIY$self$$) + $JSCompiler_StaticMethods_d_$$($JSCompiler_StaticMethods_doIndexOpIY$self$$))];
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$pc$++;
      break;
    case 188:
      $JSCompiler_StaticMethods_cp_a$$($JSCompiler_StaticMethods_doIndexOpIY$self$$, $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyH$);
      break;
    case 189:
      $JSCompiler_StaticMethods_cp_a$$($JSCompiler_StaticMethods_doIndexOpIY$self$$, $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyL$);
      break;
    case 190:
      $JSCompiler_StaticMethods_cp_a$$($JSCompiler_StaticMethods_doIndexOpIY$self$$, $JSCompiler_StaticMethods_doIndexOpIY$self$$.$readMem$($JSCompiler_StaticMethods_getIY$$($JSCompiler_StaticMethods_doIndexOpIY$self$$) + $JSCompiler_StaticMethods_d_$$($JSCompiler_StaticMethods_doIndexOpIY$self$$)));
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$pc$++;
      break;
    case 203:
      $JSCompiler_StaticMethods_doIndexCB$$($JSCompiler_StaticMethods_doIndexOpIY$self$$, $JSCompiler_StaticMethods_getIY$$($JSCompiler_StaticMethods_doIndexOpIY$self$$));
      break;
    case 225:
      $JSCompiler_StaticMethods_setIY$$($JSCompiler_StaticMethods_doIndexOpIY$self$$, $JSCompiler_StaticMethods_doIndexOpIY$self$$.$readMemWord$($JSCompiler_StaticMethods_doIndexOpIY$self$$.$sp$));
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$sp$ += 2;
      break;
    case 227:
      $location$$25_temp$$44$$ = $JSCompiler_StaticMethods_getIY$$($JSCompiler_StaticMethods_doIndexOpIY$self$$);
      $JSCompiler_StaticMethods_setIY$$($JSCompiler_StaticMethods_doIndexOpIY$self$$, $JSCompiler_StaticMethods_doIndexOpIY$self$$.$readMemWord$($JSCompiler_StaticMethods_doIndexOpIY$self$$.$sp$));
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$writeMem$($JSCompiler_StaticMethods_doIndexOpIY$self$$.$sp$, $location$$25_temp$$44$$ & 255);
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$writeMem$($JSCompiler_StaticMethods_doIndexOpIY$self$$.$sp$ + 1, $location$$25_temp$$44$$ >> 8);
      break;
    case 229:
      $JSCompiler_StaticMethods_push2$$($JSCompiler_StaticMethods_doIndexOpIY$self$$, $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyH$, $JSCompiler_StaticMethods_doIndexOpIY$self$$.$iyL$);
      break;
    case 233:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$pc$ = $JSCompiler_StaticMethods_getIY$$($JSCompiler_StaticMethods_doIndexOpIY$self$$);
      break;
    case 249:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$sp$ = $JSCompiler_StaticMethods_getIY$$($JSCompiler_StaticMethods_doIndexOpIY$self$$);
      break;
    default:
      $JSCompiler_StaticMethods_doIndexOpIY$self$$.$pc$--
  }
}
function $JSCompiler_StaticMethods_doIndexOpIX$$($JSCompiler_StaticMethods_doIndexOpIX$self$$, $opcode$$10$$) {
  var $location$$24_temp$$43$$ = 0, $location$$24_temp$$43$$ = 0;
  $JSCompiler_StaticMethods_doIndexOpIX$self$$.$tstates$ -= $OP_DD_STATES$$[$opcode$$10$$];
  switch($opcode$$10$$) {
    case 9:
      $JSCompiler_StaticMethods_setIX$$($JSCompiler_StaticMethods_doIndexOpIX$self$$, $JSCompiler_StaticMethods_add16$$($JSCompiler_StaticMethods_doIndexOpIX$self$$, $JSCompiler_StaticMethods_getIX$$($JSCompiler_StaticMethods_doIndexOpIX$self$$), $JSCompiler_StaticMethods_getBC$$($JSCompiler_StaticMethods_doIndexOpIX$self$$)));
      break;
    case 25:
      $JSCompiler_StaticMethods_setIX$$($JSCompiler_StaticMethods_doIndexOpIX$self$$, $JSCompiler_StaticMethods_add16$$($JSCompiler_StaticMethods_doIndexOpIX$self$$, $JSCompiler_StaticMethods_getIX$$($JSCompiler_StaticMethods_doIndexOpIX$self$$), $JSCompiler_StaticMethods_getDE$$($JSCompiler_StaticMethods_doIndexOpIX$self$$)));
      break;
    case 33:
      $JSCompiler_StaticMethods_setIX$$($JSCompiler_StaticMethods_doIndexOpIX$self$$, $JSCompiler_StaticMethods_doIndexOpIX$self$$.$readMemWord$($JSCompiler_StaticMethods_doIndexOpIX$self$$.$pc$));
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$pc$ += 2;
      break;
    case 34:
      $location$$24_temp$$43$$ = $JSCompiler_StaticMethods_doIndexOpIX$self$$.$readMemWord$($JSCompiler_StaticMethods_doIndexOpIX$self$$.$pc$);
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$writeMem$($location$$24_temp$$43$$++, $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixL$);
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$writeMem$($location$$24_temp$$43$$, $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixH$);
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$pc$ += 2;
      break;
    case 35:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixL$ = $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixL$ + 1 & 255;
      0 == $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixL$ && ($JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixH$ = $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixH$ + 1 & 255);
      break;
    case 36:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixH$ = $JSCompiler_StaticMethods_inc8$$($JSCompiler_StaticMethods_doIndexOpIX$self$$, $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixH$);
      break;
    case 37:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixH$ = $JSCompiler_StaticMethods_dec8$$($JSCompiler_StaticMethods_doIndexOpIX$self$$, $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixH$);
      break;
    case 38:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixH$ = $JSCompiler_StaticMethods_doIndexOpIX$self$$.$readMem$($JSCompiler_StaticMethods_doIndexOpIX$self$$.$pc$++);
      break;
    case 41:
      $JSCompiler_StaticMethods_setIX$$($JSCompiler_StaticMethods_doIndexOpIX$self$$, $JSCompiler_StaticMethods_add16$$($JSCompiler_StaticMethods_doIndexOpIX$self$$, $JSCompiler_StaticMethods_getIX$$($JSCompiler_StaticMethods_doIndexOpIX$self$$), $JSCompiler_StaticMethods_getIX$$($JSCompiler_StaticMethods_doIndexOpIX$self$$)));
      break;
    case 42:
      $location$$24_temp$$43$$ = $JSCompiler_StaticMethods_doIndexOpIX$self$$.$readMemWord$($JSCompiler_StaticMethods_doIndexOpIX$self$$.$pc$);
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixL$ = $JSCompiler_StaticMethods_doIndexOpIX$self$$.$readMem$($location$$24_temp$$43$$);
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixH$ = $JSCompiler_StaticMethods_doIndexOpIX$self$$.$readMem$(++$location$$24_temp$$43$$);
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$pc$ += 2;
      break;
    case 43:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixL$ = $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixL$ - 1 & 255;
      255 == $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixL$ && ($JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixH$ = $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixH$ - 1 & 255);
      break;
    case 44:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixL$ = $JSCompiler_StaticMethods_inc8$$($JSCompiler_StaticMethods_doIndexOpIX$self$$, $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixL$);
      break;
    case 45:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixL$ = $JSCompiler_StaticMethods_dec8$$($JSCompiler_StaticMethods_doIndexOpIX$self$$, $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixL$);
      break;
    case 46:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixL$ = $JSCompiler_StaticMethods_doIndexOpIX$self$$.$readMem$($JSCompiler_StaticMethods_doIndexOpIX$self$$.$pc$++);
      break;
    case 52:
      $JSCompiler_StaticMethods_incMem$$($JSCompiler_StaticMethods_doIndexOpIX$self$$, $JSCompiler_StaticMethods_getIX$$($JSCompiler_StaticMethods_doIndexOpIX$self$$) + $JSCompiler_StaticMethods_d_$$($JSCompiler_StaticMethods_doIndexOpIX$self$$));
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$pc$++;
      break;
    case 53:
      $JSCompiler_StaticMethods_decMem$$($JSCompiler_StaticMethods_doIndexOpIX$self$$, $JSCompiler_StaticMethods_getIX$$($JSCompiler_StaticMethods_doIndexOpIX$self$$) + $JSCompiler_StaticMethods_d_$$($JSCompiler_StaticMethods_doIndexOpIX$self$$));
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$pc$++;
      break;
    case 54:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$writeMem$($JSCompiler_StaticMethods_getIX$$($JSCompiler_StaticMethods_doIndexOpIX$self$$) + $JSCompiler_StaticMethods_d_$$($JSCompiler_StaticMethods_doIndexOpIX$self$$), $JSCompiler_StaticMethods_doIndexOpIX$self$$.$readMem$(++$JSCompiler_StaticMethods_doIndexOpIX$self$$.$pc$));
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$pc$++;
      break;
    case 57:
      $JSCompiler_StaticMethods_setIX$$($JSCompiler_StaticMethods_doIndexOpIX$self$$, $JSCompiler_StaticMethods_add16$$($JSCompiler_StaticMethods_doIndexOpIX$self$$, $JSCompiler_StaticMethods_getIX$$($JSCompiler_StaticMethods_doIndexOpIX$self$$), $JSCompiler_StaticMethods_doIndexOpIX$self$$.$sp$));
      break;
    case 68:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$b$ = $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixH$;
      break;
    case 69:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$b$ = $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixL$;
      break;
    case 70:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$b$ = $JSCompiler_StaticMethods_doIndexOpIX$self$$.$readMem$($JSCompiler_StaticMethods_getIX$$($JSCompiler_StaticMethods_doIndexOpIX$self$$) + $JSCompiler_StaticMethods_d_$$($JSCompiler_StaticMethods_doIndexOpIX$self$$));
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$pc$++;
      break;
    case 76:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$c$ = $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixH$;
      break;
    case 77:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$c$ = $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixL$;
      break;
    case 78:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$c$ = $JSCompiler_StaticMethods_doIndexOpIX$self$$.$readMem$($JSCompiler_StaticMethods_getIX$$($JSCompiler_StaticMethods_doIndexOpIX$self$$) + $JSCompiler_StaticMethods_d_$$($JSCompiler_StaticMethods_doIndexOpIX$self$$));
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$pc$++;
      break;
    case 84:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$d$ = $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixH$;
      break;
    case 85:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$d$ = $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixL$;
      break;
    case 86:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$d$ = $JSCompiler_StaticMethods_doIndexOpIX$self$$.$readMem$($JSCompiler_StaticMethods_getIX$$($JSCompiler_StaticMethods_doIndexOpIX$self$$) + $JSCompiler_StaticMethods_d_$$($JSCompiler_StaticMethods_doIndexOpIX$self$$));
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$pc$++;
      break;
    case 92:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$e$ = $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixH$;
      break;
    case 93:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$e$ = $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixL$;
      break;
    case 94:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$e$ = $JSCompiler_StaticMethods_doIndexOpIX$self$$.$readMem$($JSCompiler_StaticMethods_getIX$$($JSCompiler_StaticMethods_doIndexOpIX$self$$) + $JSCompiler_StaticMethods_d_$$($JSCompiler_StaticMethods_doIndexOpIX$self$$));
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$pc$++;
      break;
    case 96:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixH$ = $JSCompiler_StaticMethods_doIndexOpIX$self$$.$b$;
      break;
    case 97:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixH$ = $JSCompiler_StaticMethods_doIndexOpIX$self$$.$c$;
      break;
    case 98:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixH$ = $JSCompiler_StaticMethods_doIndexOpIX$self$$.$d$;
      break;
    case 99:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixH$ = $JSCompiler_StaticMethods_doIndexOpIX$self$$.$e$;
      break;
    case 100:
      break;
    case 101:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixH$ = $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixL$;
      break;
    case 102:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$h$ = $JSCompiler_StaticMethods_doIndexOpIX$self$$.$readMem$($JSCompiler_StaticMethods_getIX$$($JSCompiler_StaticMethods_doIndexOpIX$self$$) + $JSCompiler_StaticMethods_d_$$($JSCompiler_StaticMethods_doIndexOpIX$self$$));
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$pc$++;
      break;
    case 103:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixH$ = $JSCompiler_StaticMethods_doIndexOpIX$self$$.$a$;
      break;
    case 104:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixL$ = $JSCompiler_StaticMethods_doIndexOpIX$self$$.$b$;
      break;
    case 105:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixL$ = $JSCompiler_StaticMethods_doIndexOpIX$self$$.$c$;
      break;
    case 106:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixL$ = $JSCompiler_StaticMethods_doIndexOpIX$self$$.$d$;
      break;
    case 107:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixL$ = $JSCompiler_StaticMethods_doIndexOpIX$self$$.$e$;
      break;
    case 108:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixL$ = $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixH$;
      break;
    case 109:
      break;
    case 110:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$l$ = $JSCompiler_StaticMethods_doIndexOpIX$self$$.$readMem$($JSCompiler_StaticMethods_getIX$$($JSCompiler_StaticMethods_doIndexOpIX$self$$) + $JSCompiler_StaticMethods_d_$$($JSCompiler_StaticMethods_doIndexOpIX$self$$));
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$pc$++;
      break;
    case 111:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixL$ = $JSCompiler_StaticMethods_doIndexOpIX$self$$.$a$;
      break;
    case 112:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$writeMem$($JSCompiler_StaticMethods_getIX$$($JSCompiler_StaticMethods_doIndexOpIX$self$$) + $JSCompiler_StaticMethods_d_$$($JSCompiler_StaticMethods_doIndexOpIX$self$$), $JSCompiler_StaticMethods_doIndexOpIX$self$$.$b$);
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$pc$++;
      break;
    case 113:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$writeMem$($JSCompiler_StaticMethods_getIX$$($JSCompiler_StaticMethods_doIndexOpIX$self$$) + $JSCompiler_StaticMethods_d_$$($JSCompiler_StaticMethods_doIndexOpIX$self$$), $JSCompiler_StaticMethods_doIndexOpIX$self$$.$c$);
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$pc$++;
      break;
    case 114:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$writeMem$($JSCompiler_StaticMethods_getIX$$($JSCompiler_StaticMethods_doIndexOpIX$self$$) + $JSCompiler_StaticMethods_d_$$($JSCompiler_StaticMethods_doIndexOpIX$self$$), $JSCompiler_StaticMethods_doIndexOpIX$self$$.$d$);
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$pc$++;
      break;
    case 115:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$writeMem$($JSCompiler_StaticMethods_getIX$$($JSCompiler_StaticMethods_doIndexOpIX$self$$) + $JSCompiler_StaticMethods_d_$$($JSCompiler_StaticMethods_doIndexOpIX$self$$), $JSCompiler_StaticMethods_doIndexOpIX$self$$.$e$);
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$pc$++;
      break;
    case 116:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$writeMem$($JSCompiler_StaticMethods_getIX$$($JSCompiler_StaticMethods_doIndexOpIX$self$$) + $JSCompiler_StaticMethods_d_$$($JSCompiler_StaticMethods_doIndexOpIX$self$$), $JSCompiler_StaticMethods_doIndexOpIX$self$$.$h$);
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$pc$++;
      break;
    case 117:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$writeMem$($JSCompiler_StaticMethods_getIX$$($JSCompiler_StaticMethods_doIndexOpIX$self$$) + $JSCompiler_StaticMethods_d_$$($JSCompiler_StaticMethods_doIndexOpIX$self$$), $JSCompiler_StaticMethods_doIndexOpIX$self$$.$l$);
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$pc$++;
      break;
    case 119:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$writeMem$($JSCompiler_StaticMethods_getIX$$($JSCompiler_StaticMethods_doIndexOpIX$self$$) + $JSCompiler_StaticMethods_d_$$($JSCompiler_StaticMethods_doIndexOpIX$self$$), $JSCompiler_StaticMethods_doIndexOpIX$self$$.$a$);
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$pc$++;
      break;
    case 124:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$a$ = $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixH$;
      break;
    case 125:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$a$ = $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixL$;
      break;
    case 126:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$a$ = $JSCompiler_StaticMethods_doIndexOpIX$self$$.$readMem$($JSCompiler_StaticMethods_getIX$$($JSCompiler_StaticMethods_doIndexOpIX$self$$) + $JSCompiler_StaticMethods_d_$$($JSCompiler_StaticMethods_doIndexOpIX$self$$));
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$pc$++;
      break;
    case 132:
      $JSCompiler_StaticMethods_add_a$$($JSCompiler_StaticMethods_doIndexOpIX$self$$, $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixH$);
      break;
    case 133:
      $JSCompiler_StaticMethods_add_a$$($JSCompiler_StaticMethods_doIndexOpIX$self$$, $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixL$);
      break;
    case 134:
      $JSCompiler_StaticMethods_add_a$$($JSCompiler_StaticMethods_doIndexOpIX$self$$, $JSCompiler_StaticMethods_doIndexOpIX$self$$.$readMem$($JSCompiler_StaticMethods_getIX$$($JSCompiler_StaticMethods_doIndexOpIX$self$$) + $JSCompiler_StaticMethods_d_$$($JSCompiler_StaticMethods_doIndexOpIX$self$$)));
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$pc$++;
      break;
    case 140:
      $JSCompiler_StaticMethods_adc_a$$($JSCompiler_StaticMethods_doIndexOpIX$self$$, $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixH$);
      break;
    case 141:
      $JSCompiler_StaticMethods_adc_a$$($JSCompiler_StaticMethods_doIndexOpIX$self$$, $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixL$);
      break;
    case 142:
      $JSCompiler_StaticMethods_adc_a$$($JSCompiler_StaticMethods_doIndexOpIX$self$$, $JSCompiler_StaticMethods_doIndexOpIX$self$$.$readMem$($JSCompiler_StaticMethods_getIX$$($JSCompiler_StaticMethods_doIndexOpIX$self$$) + $JSCompiler_StaticMethods_d_$$($JSCompiler_StaticMethods_doIndexOpIX$self$$)));
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$pc$++;
      break;
    case 148:
      $JSCompiler_StaticMethods_sub_a$$($JSCompiler_StaticMethods_doIndexOpIX$self$$, $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixH$);
      break;
    case 149:
      $JSCompiler_StaticMethods_sub_a$$($JSCompiler_StaticMethods_doIndexOpIX$self$$, $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixL$);
      break;
    case 150:
      $JSCompiler_StaticMethods_sub_a$$($JSCompiler_StaticMethods_doIndexOpIX$self$$, $JSCompiler_StaticMethods_doIndexOpIX$self$$.$readMem$($JSCompiler_StaticMethods_getIX$$($JSCompiler_StaticMethods_doIndexOpIX$self$$) + $JSCompiler_StaticMethods_d_$$($JSCompiler_StaticMethods_doIndexOpIX$self$$)));
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$pc$++;
      break;
    case 156:
      $JSCompiler_StaticMethods_sbc_a$$($JSCompiler_StaticMethods_doIndexOpIX$self$$, $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixH$);
      break;
    case 157:
      $JSCompiler_StaticMethods_sbc_a$$($JSCompiler_StaticMethods_doIndexOpIX$self$$, $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixL$);
      break;
    case 158:
      $JSCompiler_StaticMethods_sbc_a$$($JSCompiler_StaticMethods_doIndexOpIX$self$$, $JSCompiler_StaticMethods_doIndexOpIX$self$$.$readMem$($JSCompiler_StaticMethods_getIX$$($JSCompiler_StaticMethods_doIndexOpIX$self$$) + $JSCompiler_StaticMethods_d_$$($JSCompiler_StaticMethods_doIndexOpIX$self$$)));
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$pc$++;
      break;
    case 164:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$f$ = $JSCompiler_StaticMethods_doIndexOpIX$self$$.$SZP_TABLE$[$JSCompiler_StaticMethods_doIndexOpIX$self$$.$a$ &= $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixH$] | 16;
      break;
    case 165:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$f$ = $JSCompiler_StaticMethods_doIndexOpIX$self$$.$SZP_TABLE$[$JSCompiler_StaticMethods_doIndexOpIX$self$$.$a$ &= $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixL$] | 16;
      break;
    case 166:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$f$ = $JSCompiler_StaticMethods_doIndexOpIX$self$$.$SZP_TABLE$[$JSCompiler_StaticMethods_doIndexOpIX$self$$.$a$ &= $JSCompiler_StaticMethods_doIndexOpIX$self$$.$readMem$($JSCompiler_StaticMethods_getIX$$($JSCompiler_StaticMethods_doIndexOpIX$self$$) + $JSCompiler_StaticMethods_d_$$($JSCompiler_StaticMethods_doIndexOpIX$self$$))] | 16;
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$pc$++;
      break;
    case 172:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$f$ = $JSCompiler_StaticMethods_doIndexOpIX$self$$.$SZP_TABLE$[$JSCompiler_StaticMethods_doIndexOpIX$self$$.$a$ ^= $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixH$];
      break;
    case 173:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$f$ = $JSCompiler_StaticMethods_doIndexOpIX$self$$.$SZP_TABLE$[$JSCompiler_StaticMethods_doIndexOpIX$self$$.$a$ ^= $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixL$];
      break;
    case 174:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$f$ = $JSCompiler_StaticMethods_doIndexOpIX$self$$.$SZP_TABLE$[$JSCompiler_StaticMethods_doIndexOpIX$self$$.$a$ ^= $JSCompiler_StaticMethods_doIndexOpIX$self$$.$readMem$($JSCompiler_StaticMethods_getIX$$($JSCompiler_StaticMethods_doIndexOpIX$self$$) + $JSCompiler_StaticMethods_d_$$($JSCompiler_StaticMethods_doIndexOpIX$self$$))];
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$pc$++;
      break;
    case 180:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$f$ = $JSCompiler_StaticMethods_doIndexOpIX$self$$.$SZP_TABLE$[$JSCompiler_StaticMethods_doIndexOpIX$self$$.$a$ |= $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixH$];
      break;
    case 181:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$f$ = $JSCompiler_StaticMethods_doIndexOpIX$self$$.$SZP_TABLE$[$JSCompiler_StaticMethods_doIndexOpIX$self$$.$a$ |= $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixL$];
      break;
    case 182:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$f$ = $JSCompiler_StaticMethods_doIndexOpIX$self$$.$SZP_TABLE$[$JSCompiler_StaticMethods_doIndexOpIX$self$$.$a$ |= $JSCompiler_StaticMethods_doIndexOpIX$self$$.$readMem$($JSCompiler_StaticMethods_getIX$$($JSCompiler_StaticMethods_doIndexOpIX$self$$) + $JSCompiler_StaticMethods_d_$$($JSCompiler_StaticMethods_doIndexOpIX$self$$))];
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$pc$++;
      break;
    case 188:
      $JSCompiler_StaticMethods_cp_a$$($JSCompiler_StaticMethods_doIndexOpIX$self$$, $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixH$);
      break;
    case 189:
      $JSCompiler_StaticMethods_cp_a$$($JSCompiler_StaticMethods_doIndexOpIX$self$$, $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixL$);
      break;
    case 190:
      $JSCompiler_StaticMethods_cp_a$$($JSCompiler_StaticMethods_doIndexOpIX$self$$, $JSCompiler_StaticMethods_doIndexOpIX$self$$.$readMem$($JSCompiler_StaticMethods_getIX$$($JSCompiler_StaticMethods_doIndexOpIX$self$$) + $JSCompiler_StaticMethods_d_$$($JSCompiler_StaticMethods_doIndexOpIX$self$$)));
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$pc$++;
      break;
    case 203:
      $JSCompiler_StaticMethods_doIndexCB$$($JSCompiler_StaticMethods_doIndexOpIX$self$$, $JSCompiler_StaticMethods_getIX$$($JSCompiler_StaticMethods_doIndexOpIX$self$$));
      break;
    case 225:
      $JSCompiler_StaticMethods_setIX$$($JSCompiler_StaticMethods_doIndexOpIX$self$$, $JSCompiler_StaticMethods_doIndexOpIX$self$$.$readMemWord$($JSCompiler_StaticMethods_doIndexOpIX$self$$.$sp$));
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$sp$ += 2;
      break;
    case 227:
      $location$$24_temp$$43$$ = $JSCompiler_StaticMethods_getIX$$($JSCompiler_StaticMethods_doIndexOpIX$self$$);
      $JSCompiler_StaticMethods_setIX$$($JSCompiler_StaticMethods_doIndexOpIX$self$$, $JSCompiler_StaticMethods_doIndexOpIX$self$$.$readMemWord$($JSCompiler_StaticMethods_doIndexOpIX$self$$.$sp$));
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$writeMem$($JSCompiler_StaticMethods_doIndexOpIX$self$$.$sp$, $location$$24_temp$$43$$ & 255);
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$writeMem$($JSCompiler_StaticMethods_doIndexOpIX$self$$.$sp$ + 1, $location$$24_temp$$43$$ >> 8);
      break;
    case 229:
      $JSCompiler_StaticMethods_push2$$($JSCompiler_StaticMethods_doIndexOpIX$self$$, $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixH$, $JSCompiler_StaticMethods_doIndexOpIX$self$$.$ixL$);
      break;
    case 233:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$pc$ = $JSCompiler_StaticMethods_getIX$$($JSCompiler_StaticMethods_doIndexOpIX$self$$);
      break;
    case 249:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$sp$ = $JSCompiler_StaticMethods_getIX$$($JSCompiler_StaticMethods_doIndexOpIX$self$$);
      break;
    default:
      $JSCompiler_StaticMethods_doIndexOpIX$self$$.$pc$--
  }
}
function $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_bit$self$$, $mask$$5$$) {
  $JSCompiler_StaticMethods_bit$self$$.$f$ = $JSCompiler_StaticMethods_bit$self$$.$f$ & 1 | $JSCompiler_StaticMethods_bit$self$$.$SZ_BIT_TABLE$[$mask$$5$$]
}
function $JSCompiler_StaticMethods_srl$$($JSCompiler_StaticMethods_srl$self$$, $value$$63$$) {
  var $carry$$29$$ = $value$$63$$ & 1;
  $value$$63$$ = $value$$63$$ >> 1 & 255;
  $JSCompiler_StaticMethods_srl$self$$.$f$ = $carry$$29$$ | $JSCompiler_StaticMethods_srl$self$$.$SZP_TABLE$[$value$$63$$];
  return $value$$63$$
}
function $JSCompiler_StaticMethods_sra$$($JSCompiler_StaticMethods_sra$self$$, $value$$62$$) {
  var $carry$$28$$ = $value$$62$$ & 1;
  $value$$62$$ = $value$$62$$ >> 1 | $value$$62$$ & 128;
  $JSCompiler_StaticMethods_sra$self$$.$f$ = $carry$$28$$ | $JSCompiler_StaticMethods_sra$self$$.$SZP_TABLE$[$value$$62$$];
  return $value$$62$$
}
function $JSCompiler_StaticMethods_sll$$($JSCompiler_StaticMethods_sll$self$$, $value$$61$$) {
  var $carry$$27$$ = ($value$$61$$ & 128) >> 7;
  $value$$61$$ = ($value$$61$$ << 1 | 1) & 255;
  $JSCompiler_StaticMethods_sll$self$$.$f$ = $carry$$27$$ | $JSCompiler_StaticMethods_sll$self$$.$SZP_TABLE$[$value$$61$$];
  return $value$$61$$
}
function $JSCompiler_StaticMethods_sla$$($JSCompiler_StaticMethods_sla$self$$, $value$$60$$) {
  var $carry$$26$$ = ($value$$60$$ & 128) >> 7;
  $value$$60$$ = $value$$60$$ << 1 & 255;
  $JSCompiler_StaticMethods_sla$self$$.$f$ = $carry$$26$$ | $JSCompiler_StaticMethods_sla$self$$.$SZP_TABLE$[$value$$60$$];
  return $value$$60$$
}
function $JSCompiler_StaticMethods_rr$$($JSCompiler_StaticMethods_rr$self$$, $value$$59$$) {
  var $carry$$25$$ = $value$$59$$ & 1;
  $value$$59$$ = ($value$$59$$ >> 1 | $JSCompiler_StaticMethods_rr$self$$.$f$ << 7) & 255;
  $JSCompiler_StaticMethods_rr$self$$.$f$ = $carry$$25$$ | $JSCompiler_StaticMethods_rr$self$$.$SZP_TABLE$[$value$$59$$];
  return $value$$59$$
}
function $JSCompiler_StaticMethods_rl$$($JSCompiler_StaticMethods_rl$self$$, $value$$58$$) {
  var $carry$$24$$ = ($value$$58$$ & 128) >> 7;
  $value$$58$$ = ($value$$58$$ << 1 | $JSCompiler_StaticMethods_rl$self$$.$f$ & 1) & 255;
  $JSCompiler_StaticMethods_rl$self$$.$f$ = $carry$$24$$ | $JSCompiler_StaticMethods_rl$self$$.$SZP_TABLE$[$value$$58$$];
  return $value$$58$$
}
function $JSCompiler_StaticMethods_rrc$$($JSCompiler_StaticMethods_rrc$self$$, $value$$57$$) {
  var $carry$$23$$ = $value$$57$$ & 1;
  $value$$57$$ = ($value$$57$$ >> 1 | $value$$57$$ << 7) & 255;
  $JSCompiler_StaticMethods_rrc$self$$.$f$ = $carry$$23$$ | $JSCompiler_StaticMethods_rrc$self$$.$SZP_TABLE$[$value$$57$$];
  return $value$$57$$
}
function $JSCompiler_StaticMethods_rlc$$($JSCompiler_StaticMethods_rlc$self$$, $value$$56$$) {
  var $carry$$22$$ = ($value$$56$$ & 128) >> 7;
  $value$$56$$ = ($value$$56$$ << 1 | $value$$56$$ >> 7) & 255;
  $JSCompiler_StaticMethods_rlc$self$$.$f$ = $carry$$22$$ | $JSCompiler_StaticMethods_rlc$self$$.$SZP_TABLE$[$value$$56$$];
  return $value$$56$$
}
function $JSCompiler_StaticMethods_doCB$$($JSCompiler_StaticMethods_doCB$self$$, $opcode$$9$$) {
  $JSCompiler_StaticMethods_doCB$self$$.$tstates$ -= $OP_CB_STATES$$[$opcode$$9$$];
  switch($opcode$$9$$) {
    case 0:
      $JSCompiler_StaticMethods_doCB$self$$.$b$ = $JSCompiler_StaticMethods_rlc$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$b$);
      break;
    case 1:
      $JSCompiler_StaticMethods_doCB$self$$.$c$ = $JSCompiler_StaticMethods_rlc$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$c$);
      break;
    case 2:
      $JSCompiler_StaticMethods_doCB$self$$.$d$ = $JSCompiler_StaticMethods_rlc$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$d$);
      break;
    case 3:
      $JSCompiler_StaticMethods_doCB$self$$.$e$ = $JSCompiler_StaticMethods_rlc$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$e$);
      break;
    case 4:
      $JSCompiler_StaticMethods_doCB$self$$.$h$ = $JSCompiler_StaticMethods_rlc$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$h$);
      break;
    case 5:
      $JSCompiler_StaticMethods_doCB$self$$.$l$ = $JSCompiler_StaticMethods_rlc$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$l$);
      break;
    case 6:
      $JSCompiler_StaticMethods_doCB$self$$.$writeMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$), $JSCompiler_StaticMethods_rlc$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$))));
      break;
    case 7:
      $JSCompiler_StaticMethods_doCB$self$$.$a$ = $JSCompiler_StaticMethods_rlc$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$a$);
      break;
    case 8:
      $JSCompiler_StaticMethods_doCB$self$$.$b$ = $JSCompiler_StaticMethods_rrc$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$b$);
      break;
    case 9:
      $JSCompiler_StaticMethods_doCB$self$$.$c$ = $JSCompiler_StaticMethods_rrc$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$c$);
      break;
    case 10:
      $JSCompiler_StaticMethods_doCB$self$$.$d$ = $JSCompiler_StaticMethods_rrc$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$d$);
      break;
    case 11:
      $JSCompiler_StaticMethods_doCB$self$$.$e$ = $JSCompiler_StaticMethods_rrc$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$e$);
      break;
    case 12:
      $JSCompiler_StaticMethods_doCB$self$$.$h$ = $JSCompiler_StaticMethods_rrc$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$h$);
      break;
    case 13:
      $JSCompiler_StaticMethods_doCB$self$$.$l$ = $JSCompiler_StaticMethods_rrc$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$l$);
      break;
    case 14:
      $JSCompiler_StaticMethods_doCB$self$$.$writeMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$), $JSCompiler_StaticMethods_rrc$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$))));
      break;
    case 15:
      $JSCompiler_StaticMethods_doCB$self$$.$a$ = $JSCompiler_StaticMethods_rrc$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$a$);
      break;
    case 16:
      $JSCompiler_StaticMethods_doCB$self$$.$b$ = $JSCompiler_StaticMethods_rl$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$b$);
      break;
    case 17:
      $JSCompiler_StaticMethods_doCB$self$$.$c$ = $JSCompiler_StaticMethods_rl$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$c$);
      break;
    case 18:
      $JSCompiler_StaticMethods_doCB$self$$.$d$ = $JSCompiler_StaticMethods_rl$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$d$);
      break;
    case 19:
      $JSCompiler_StaticMethods_doCB$self$$.$e$ = $JSCompiler_StaticMethods_rl$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$e$);
      break;
    case 20:
      $JSCompiler_StaticMethods_doCB$self$$.$h$ = $JSCompiler_StaticMethods_rl$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$h$);
      break;
    case 21:
      $JSCompiler_StaticMethods_doCB$self$$.$l$ = $JSCompiler_StaticMethods_rl$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$l$);
      break;
    case 22:
      $JSCompiler_StaticMethods_doCB$self$$.$writeMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$), $JSCompiler_StaticMethods_rl$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$))));
      break;
    case 23:
      $JSCompiler_StaticMethods_doCB$self$$.$a$ = $JSCompiler_StaticMethods_rl$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$a$);
      break;
    case 24:
      $JSCompiler_StaticMethods_doCB$self$$.$b$ = $JSCompiler_StaticMethods_rr$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$b$);
      break;
    case 25:
      $JSCompiler_StaticMethods_doCB$self$$.$c$ = $JSCompiler_StaticMethods_rr$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$c$);
      break;
    case 26:
      $JSCompiler_StaticMethods_doCB$self$$.$d$ = $JSCompiler_StaticMethods_rr$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$d$);
      break;
    case 27:
      $JSCompiler_StaticMethods_doCB$self$$.$e$ = $JSCompiler_StaticMethods_rr$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$e$);
      break;
    case 28:
      $JSCompiler_StaticMethods_doCB$self$$.$h$ = $JSCompiler_StaticMethods_rr$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$h$);
      break;
    case 29:
      $JSCompiler_StaticMethods_doCB$self$$.$l$ = $JSCompiler_StaticMethods_rr$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$l$);
      break;
    case 30:
      $JSCompiler_StaticMethods_doCB$self$$.$writeMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$), $JSCompiler_StaticMethods_rr$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$))));
      break;
    case 31:
      $JSCompiler_StaticMethods_doCB$self$$.$a$ = $JSCompiler_StaticMethods_rr$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$a$);
      break;
    case 32:
      $JSCompiler_StaticMethods_doCB$self$$.$b$ = $JSCompiler_StaticMethods_sla$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$b$);
      break;
    case 33:
      $JSCompiler_StaticMethods_doCB$self$$.$c$ = $JSCompiler_StaticMethods_sla$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$c$);
      break;
    case 34:
      $JSCompiler_StaticMethods_doCB$self$$.$d$ = $JSCompiler_StaticMethods_sla$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$d$);
      break;
    case 35:
      $JSCompiler_StaticMethods_doCB$self$$.$e$ = $JSCompiler_StaticMethods_sla$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$e$);
      break;
    case 36:
      $JSCompiler_StaticMethods_doCB$self$$.$h$ = $JSCompiler_StaticMethods_sla$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$h$);
      break;
    case 37:
      $JSCompiler_StaticMethods_doCB$self$$.$l$ = $JSCompiler_StaticMethods_sla$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$l$);
      break;
    case 38:
      $JSCompiler_StaticMethods_doCB$self$$.$writeMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$), $JSCompiler_StaticMethods_sla$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$))));
      break;
    case 39:
      $JSCompiler_StaticMethods_doCB$self$$.$a$ = $JSCompiler_StaticMethods_sla$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$a$);
      break;
    case 40:
      $JSCompiler_StaticMethods_doCB$self$$.$b$ = $JSCompiler_StaticMethods_sra$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$b$);
      break;
    case 41:
      $JSCompiler_StaticMethods_doCB$self$$.$c$ = $JSCompiler_StaticMethods_sra$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$c$);
      break;
    case 42:
      $JSCompiler_StaticMethods_doCB$self$$.$d$ = $JSCompiler_StaticMethods_sra$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$d$);
      break;
    case 43:
      $JSCompiler_StaticMethods_doCB$self$$.$e$ = $JSCompiler_StaticMethods_sra$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$e$);
      break;
    case 44:
      $JSCompiler_StaticMethods_doCB$self$$.$h$ = $JSCompiler_StaticMethods_sra$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$h$);
      break;
    case 45:
      $JSCompiler_StaticMethods_doCB$self$$.$l$ = $JSCompiler_StaticMethods_sra$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$l$);
      break;
    case 46:
      $JSCompiler_StaticMethods_doCB$self$$.$writeMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$), $JSCompiler_StaticMethods_sra$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$))));
      break;
    case 47:
      $JSCompiler_StaticMethods_doCB$self$$.$a$ = $JSCompiler_StaticMethods_sra$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$a$);
      break;
    case 48:
      $JSCompiler_StaticMethods_doCB$self$$.$b$ = $JSCompiler_StaticMethods_sll$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$b$);
      break;
    case 49:
      $JSCompiler_StaticMethods_doCB$self$$.$c$ = $JSCompiler_StaticMethods_sll$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$c$);
      break;
    case 50:
      $JSCompiler_StaticMethods_doCB$self$$.$d$ = $JSCompiler_StaticMethods_sll$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$d$);
      break;
    case 51:
      $JSCompiler_StaticMethods_doCB$self$$.$e$ = $JSCompiler_StaticMethods_sll$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$e$);
      break;
    case 52:
      $JSCompiler_StaticMethods_doCB$self$$.$h$ = $JSCompiler_StaticMethods_sll$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$h$);
      break;
    case 53:
      $JSCompiler_StaticMethods_doCB$self$$.$l$ = $JSCompiler_StaticMethods_sll$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$l$);
      break;
    case 54:
      $JSCompiler_StaticMethods_doCB$self$$.$writeMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$), $JSCompiler_StaticMethods_sll$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$))));
      break;
    case 55:
      $JSCompiler_StaticMethods_doCB$self$$.$a$ = $JSCompiler_StaticMethods_sll$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$a$);
      break;
    case 56:
      $JSCompiler_StaticMethods_doCB$self$$.$b$ = $JSCompiler_StaticMethods_srl$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$b$);
      break;
    case 57:
      $JSCompiler_StaticMethods_doCB$self$$.$c$ = $JSCompiler_StaticMethods_srl$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$c$);
      break;
    case 58:
      $JSCompiler_StaticMethods_doCB$self$$.$d$ = $JSCompiler_StaticMethods_srl$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$d$);
      break;
    case 59:
      $JSCompiler_StaticMethods_doCB$self$$.$e$ = $JSCompiler_StaticMethods_srl$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$e$);
      break;
    case 60:
      $JSCompiler_StaticMethods_doCB$self$$.$h$ = $JSCompiler_StaticMethods_srl$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$h$);
      break;
    case 61:
      $JSCompiler_StaticMethods_doCB$self$$.$l$ = $JSCompiler_StaticMethods_rl$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$l$);
      break;
    case 62:
      $JSCompiler_StaticMethods_doCB$self$$.$writeMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$), $JSCompiler_StaticMethods_srl$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$))));
      break;
    case 63:
      $JSCompiler_StaticMethods_doCB$self$$.$a$ = $JSCompiler_StaticMethods_srl$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$a$);
      break;
    case 64:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$b$ & 1);
      break;
    case 65:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$c$ & 1);
      break;
    case 66:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$d$ & 1);
      break;
    case 67:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$e$ & 1);
      break;
    case 68:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$h$ & 1);
      break;
    case 69:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$l$ & 1);
      break;
    case 70:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$)) & 1);
      break;
    case 71:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$a$ & 1);
      break;
    case 72:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$b$ & 2);
      break;
    case 73:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$c$ & 2);
      break;
    case 74:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$d$ & 2);
      break;
    case 75:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$e$ & 2);
      break;
    case 76:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$h$ & 2);
      break;
    case 77:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$l$ & 2);
      break;
    case 78:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$)) & 2);
      break;
    case 79:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$a$ & 2);
      break;
    case 80:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$b$ & 4);
      break;
    case 81:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$c$ & 4);
      break;
    case 82:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$d$ & 4);
      break;
    case 83:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$e$ & 4);
      break;
    case 84:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$h$ & 4);
      break;
    case 85:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$l$ & 4);
      break;
    case 86:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$)) & 4);
      break;
    case 87:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$a$ & 4);
      break;
    case 88:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$b$ & 8);
      break;
    case 89:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$c$ & 8);
      break;
    case 90:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$d$ & 8);
      break;
    case 91:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$e$ & 8);
      break;
    case 92:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$h$ & 8);
      break;
    case 93:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$l$ & 8);
      break;
    case 94:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$)) & 8);
      break;
    case 95:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$a$ & 8);
      break;
    case 96:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$b$ & 16);
      break;
    case 97:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$c$ & 16);
      break;
    case 98:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$d$ & 16);
      break;
    case 99:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$e$ & 16);
      break;
    case 100:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$h$ & 16);
      break;
    case 101:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$l$ & 16);
      break;
    case 102:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$)) & 16);
      break;
    case 103:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$a$ & 16);
      break;
    case 104:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$b$ & 32);
      break;
    case 105:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$c$ & 32);
      break;
    case 106:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$d$ & 32);
      break;
    case 107:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$e$ & 32);
      break;
    case 108:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$h$ & 32);
      break;
    case 109:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$l$ & 32);
      break;
    case 110:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$)) & 32);
      break;
    case 111:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$a$ & 32);
      break;
    case 112:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$b$ & 64);
      break;
    case 113:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$c$ & 64);
      break;
    case 114:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$d$ & 64);
      break;
    case 115:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$e$ & 64);
      break;
    case 116:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$h$ & 64);
      break;
    case 117:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$l$ & 64);
      break;
    case 118:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$)) & 64);
      break;
    case 119:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$a$ & 64);
      break;
    case 120:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$b$ & 128);
      break;
    case 121:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$c$ & 128);
      break;
    case 122:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$d$ & 128);
      break;
    case 123:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$e$ & 128);
      break;
    case 124:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$h$ & 128);
      break;
    case 125:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$l$ & 128);
      break;
    case 126:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$)) & 128);
      break;
    case 127:
      $JSCompiler_StaticMethods_bit$$($JSCompiler_StaticMethods_doCB$self$$, $JSCompiler_StaticMethods_doCB$self$$.$a$ & 128);
      break;
    case 128:
      $JSCompiler_StaticMethods_doCB$self$$.$b$ &= -2;
      break;
    case 129:
      $JSCompiler_StaticMethods_doCB$self$$.$c$ &= -2;
      break;
    case 130:
      $JSCompiler_StaticMethods_doCB$self$$.$d$ &= -2;
      break;
    case 131:
      $JSCompiler_StaticMethods_doCB$self$$.$e$ &= -2;
      break;
    case 132:
      $JSCompiler_StaticMethods_doCB$self$$.$h$ &= -2;
      break;
    case 133:
      $JSCompiler_StaticMethods_doCB$self$$.$l$ &= -2;
      break;
    case 134:
      $JSCompiler_StaticMethods_doCB$self$$.$writeMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$), $JSCompiler_StaticMethods_doCB$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$)) & -2);
      break;
    case 135:
      $JSCompiler_StaticMethods_doCB$self$$.$a$ &= -2;
      break;
    case 136:
      $JSCompiler_StaticMethods_doCB$self$$.$b$ &= -3;
      break;
    case 137:
      $JSCompiler_StaticMethods_doCB$self$$.$c$ &= -3;
      break;
    case 138:
      $JSCompiler_StaticMethods_doCB$self$$.$d$ &= -3;
      break;
    case 139:
      $JSCompiler_StaticMethods_doCB$self$$.$e$ &= -3;
      break;
    case 140:
      $JSCompiler_StaticMethods_doCB$self$$.$h$ &= -3;
      break;
    case 141:
      $JSCompiler_StaticMethods_doCB$self$$.$l$ &= -3;
      break;
    case 142:
      $JSCompiler_StaticMethods_doCB$self$$.$writeMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$), $JSCompiler_StaticMethods_doCB$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$)) & -3);
      break;
    case 143:
      $JSCompiler_StaticMethods_doCB$self$$.$a$ &= -3;
      break;
    case 144:
      $JSCompiler_StaticMethods_doCB$self$$.$b$ &= -5;
      break;
    case 145:
      $JSCompiler_StaticMethods_doCB$self$$.$c$ &= -5;
      break;
    case 146:
      $JSCompiler_StaticMethods_doCB$self$$.$d$ &= -5;
      break;
    case 147:
      $JSCompiler_StaticMethods_doCB$self$$.$e$ &= -5;
      break;
    case 148:
      $JSCompiler_StaticMethods_doCB$self$$.$h$ &= -5;
      break;
    case 149:
      $JSCompiler_StaticMethods_doCB$self$$.$l$ &= -5;
      break;
    case 150:
      $JSCompiler_StaticMethods_doCB$self$$.$writeMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$), $JSCompiler_StaticMethods_doCB$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$)) & -5);
      break;
    case 151:
      $JSCompiler_StaticMethods_doCB$self$$.$a$ &= -5;
      break;
    case 152:
      $JSCompiler_StaticMethods_doCB$self$$.$b$ &= -9;
      break;
    case 153:
      $JSCompiler_StaticMethods_doCB$self$$.$c$ &= -9;
      break;
    case 154:
      $JSCompiler_StaticMethods_doCB$self$$.$d$ &= -9;
      break;
    case 155:
      $JSCompiler_StaticMethods_doCB$self$$.$e$ &= -9;
      break;
    case 156:
      $JSCompiler_StaticMethods_doCB$self$$.$h$ &= -9;
      break;
    case 157:
      $JSCompiler_StaticMethods_doCB$self$$.$l$ &= -9;
      break;
    case 158:
      $JSCompiler_StaticMethods_doCB$self$$.$writeMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$), $JSCompiler_StaticMethods_doCB$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$)) & -9);
      break;
    case 159:
      $JSCompiler_StaticMethods_doCB$self$$.$a$ &= -9;
      break;
    case 160:
      $JSCompiler_StaticMethods_doCB$self$$.$b$ &= -17;
      break;
    case 161:
      $JSCompiler_StaticMethods_doCB$self$$.$c$ &= -17;
      break;
    case 162:
      $JSCompiler_StaticMethods_doCB$self$$.$d$ &= -17;
      break;
    case 163:
      $JSCompiler_StaticMethods_doCB$self$$.$e$ &= -17;
      break;
    case 164:
      $JSCompiler_StaticMethods_doCB$self$$.$h$ &= -17;
      break;
    case 165:
      $JSCompiler_StaticMethods_doCB$self$$.$l$ &= -17;
      break;
    case 166:
      $JSCompiler_StaticMethods_doCB$self$$.$writeMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$), $JSCompiler_StaticMethods_doCB$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$)) & -17);
      break;
    case 167:
      $JSCompiler_StaticMethods_doCB$self$$.$a$ &= -17;
      break;
    case 168:
      $JSCompiler_StaticMethods_doCB$self$$.$b$ &= -33;
      break;
    case 169:
      $JSCompiler_StaticMethods_doCB$self$$.$c$ &= -33;
      break;
    case 170:
      $JSCompiler_StaticMethods_doCB$self$$.$d$ &= -33;
      break;
    case 171:
      $JSCompiler_StaticMethods_doCB$self$$.$e$ &= -33;
      break;
    case 172:
      $JSCompiler_StaticMethods_doCB$self$$.$h$ &= -33;
      break;
    case 173:
      $JSCompiler_StaticMethods_doCB$self$$.$l$ &= -33;
      break;
    case 174:
      $JSCompiler_StaticMethods_doCB$self$$.$writeMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$), $JSCompiler_StaticMethods_doCB$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$)) & -33);
      break;
    case 175:
      $JSCompiler_StaticMethods_doCB$self$$.$a$ &= -33;
      break;
    case 176:
      $JSCompiler_StaticMethods_doCB$self$$.$b$ &= -65;
      break;
    case 177:
      $JSCompiler_StaticMethods_doCB$self$$.$c$ &= -65;
      break;
    case 178:
      $JSCompiler_StaticMethods_doCB$self$$.$d$ &= -65;
      break;
    case 179:
      $JSCompiler_StaticMethods_doCB$self$$.$e$ &= -65;
      break;
    case 180:
      $JSCompiler_StaticMethods_doCB$self$$.$h$ &= -65;
      break;
    case 181:
      $JSCompiler_StaticMethods_doCB$self$$.$l$ &= -65;
      break;
    case 182:
      $JSCompiler_StaticMethods_doCB$self$$.$writeMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$), $JSCompiler_StaticMethods_doCB$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$)) & -65);
      break;
    case 183:
      $JSCompiler_StaticMethods_doCB$self$$.$a$ &= -65;
      break;
    case 184:
      $JSCompiler_StaticMethods_doCB$self$$.$b$ &= -129;
      break;
    case 185:
      $JSCompiler_StaticMethods_doCB$self$$.$c$ &= -129;
      break;
    case 186:
      $JSCompiler_StaticMethods_doCB$self$$.$d$ &= -129;
      break;
    case 187:
      $JSCompiler_StaticMethods_doCB$self$$.$e$ &= -129;
      break;
    case 188:
      $JSCompiler_StaticMethods_doCB$self$$.$h$ &= -129;
      break;
    case 189:
      $JSCompiler_StaticMethods_doCB$self$$.$l$ &= -129;
      break;
    case 190:
      $JSCompiler_StaticMethods_doCB$self$$.$writeMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$), $JSCompiler_StaticMethods_doCB$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$)) & -129);
      break;
    case 191:
      $JSCompiler_StaticMethods_doCB$self$$.$a$ &= -129;
      break;
    case 192:
      $JSCompiler_StaticMethods_doCB$self$$.$b$ |= 1;
      break;
    case 193:
      $JSCompiler_StaticMethods_doCB$self$$.$c$ |= 1;
      break;
    case 194:
      $JSCompiler_StaticMethods_doCB$self$$.$d$ |= 1;
      break;
    case 195:
      $JSCompiler_StaticMethods_doCB$self$$.$e$ |= 1;
      break;
    case 196:
      $JSCompiler_StaticMethods_doCB$self$$.$h$ |= 1;
      break;
    case 197:
      $JSCompiler_StaticMethods_doCB$self$$.$l$ |= 1;
      break;
    case 198:
      $JSCompiler_StaticMethods_doCB$self$$.$writeMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$), $JSCompiler_StaticMethods_doCB$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$)) | 1);
      break;
    case 199:
      $JSCompiler_StaticMethods_doCB$self$$.$a$ |= 1;
      break;
    case 200:
      $JSCompiler_StaticMethods_doCB$self$$.$b$ |= 2;
      break;
    case 201:
      $JSCompiler_StaticMethods_doCB$self$$.$c$ |= 2;
      break;
    case 202:
      $JSCompiler_StaticMethods_doCB$self$$.$d$ |= 2;
      break;
    case 203:
      $JSCompiler_StaticMethods_doCB$self$$.$e$ |= 2;
      break;
    case 204:
      $JSCompiler_StaticMethods_doCB$self$$.$h$ |= 2;
      break;
    case 205:
      $JSCompiler_StaticMethods_doCB$self$$.$l$ |= 2;
      break;
    case 206:
      $JSCompiler_StaticMethods_doCB$self$$.$writeMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$), $JSCompiler_StaticMethods_doCB$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$)) | 2);
      break;
    case 207:
      $JSCompiler_StaticMethods_doCB$self$$.$a$ |= 2;
      break;
    case 208:
      $JSCompiler_StaticMethods_doCB$self$$.$b$ |= 4;
      break;
    case 209:
      $JSCompiler_StaticMethods_doCB$self$$.$c$ |= 4;
      break;
    case 210:
      $JSCompiler_StaticMethods_doCB$self$$.$d$ |= 4;
      break;
    case 211:
      $JSCompiler_StaticMethods_doCB$self$$.$e$ |= 4;
      break;
    case 212:
      $JSCompiler_StaticMethods_doCB$self$$.$h$ |= 4;
      break;
    case 213:
      $JSCompiler_StaticMethods_doCB$self$$.$l$ |= 4;
      break;
    case 214:
      $JSCompiler_StaticMethods_doCB$self$$.$writeMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$), $JSCompiler_StaticMethods_doCB$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$)) | 4);
      break;
    case 215:
      $JSCompiler_StaticMethods_doCB$self$$.$a$ |= 4;
      break;
    case 216:
      $JSCompiler_StaticMethods_doCB$self$$.$b$ |= 8;
      break;
    case 217:
      $JSCompiler_StaticMethods_doCB$self$$.$c$ |= 8;
      break;
    case 218:
      $JSCompiler_StaticMethods_doCB$self$$.$d$ |= 8;
      break;
    case 219:
      $JSCompiler_StaticMethods_doCB$self$$.$e$ |= 8;
      break;
    case 220:
      $JSCompiler_StaticMethods_doCB$self$$.$h$ |= 8;
      break;
    case 221:
      $JSCompiler_StaticMethods_doCB$self$$.$l$ |= 8;
      break;
    case 222:
      $JSCompiler_StaticMethods_doCB$self$$.$writeMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$), $JSCompiler_StaticMethods_doCB$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$)) | 8);
      break;
    case 223:
      $JSCompiler_StaticMethods_doCB$self$$.$a$ |= 8;
      break;
    case 224:
      $JSCompiler_StaticMethods_doCB$self$$.$b$ |= 16;
      break;
    case 225:
      $JSCompiler_StaticMethods_doCB$self$$.$c$ |= 16;
      break;
    case 226:
      $JSCompiler_StaticMethods_doCB$self$$.$d$ |= 16;
      break;
    case 227:
      $JSCompiler_StaticMethods_doCB$self$$.$e$ |= 16;
      break;
    case 228:
      $JSCompiler_StaticMethods_doCB$self$$.$h$ |= 16;
      break;
    case 229:
      $JSCompiler_StaticMethods_doCB$self$$.$l$ |= 16;
      break;
    case 230:
      $JSCompiler_StaticMethods_doCB$self$$.$writeMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$), $JSCompiler_StaticMethods_doCB$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$)) | 16);
      break;
    case 231:
      $JSCompiler_StaticMethods_doCB$self$$.$a$ |= 16;
      break;
    case 232:
      $JSCompiler_StaticMethods_doCB$self$$.$b$ |= 32;
      break;
    case 233:
      $JSCompiler_StaticMethods_doCB$self$$.$c$ |= 32;
      break;
    case 234:
      $JSCompiler_StaticMethods_doCB$self$$.$d$ |= 32;
      break;
    case 235:
      $JSCompiler_StaticMethods_doCB$self$$.$e$ |= 32;
      break;
    case 236:
      $JSCompiler_StaticMethods_doCB$self$$.$h$ |= 32;
      break;
    case 237:
      $JSCompiler_StaticMethods_doCB$self$$.$l$ |= 32;
      break;
    case 238:
      $JSCompiler_StaticMethods_doCB$self$$.$writeMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$), $JSCompiler_StaticMethods_doCB$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$)) | 32);
      break;
    case 239:
      $JSCompiler_StaticMethods_doCB$self$$.$a$ |= 32;
      break;
    case 240:
      $JSCompiler_StaticMethods_doCB$self$$.$b$ |= 64;
      break;
    case 241:
      $JSCompiler_StaticMethods_doCB$self$$.$c$ |= 64;
      break;
    case 242:
      $JSCompiler_StaticMethods_doCB$self$$.$d$ |= 64;
      break;
    case 243:
      $JSCompiler_StaticMethods_doCB$self$$.$e$ |= 64;
      break;
    case 244:
      $JSCompiler_StaticMethods_doCB$self$$.$h$ |= 64;
      break;
    case 245:
      $JSCompiler_StaticMethods_doCB$self$$.$l$ |= 64;
      break;
    case 246:
      $JSCompiler_StaticMethods_doCB$self$$.$writeMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$), $JSCompiler_StaticMethods_doCB$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$)) | 64);
      break;
    case 247:
      $JSCompiler_StaticMethods_doCB$self$$.$a$ |= 64;
      break;
    case 248:
      $JSCompiler_StaticMethods_doCB$self$$.$b$ |= 128;
      break;
    case 249:
      $JSCompiler_StaticMethods_doCB$self$$.$c$ |= 128;
      break;
    case 250:
      $JSCompiler_StaticMethods_doCB$self$$.$d$ |= 128;
      break;
    case 251:
      $JSCompiler_StaticMethods_doCB$self$$.$e$ |= 128;
      break;
    case 252:
      $JSCompiler_StaticMethods_doCB$self$$.$h$ |= 128;
      break;
    case 253:
      $JSCompiler_StaticMethods_doCB$self$$.$l$ |= 128;
      break;
    case 254:
      $JSCompiler_StaticMethods_doCB$self$$.$writeMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$), $JSCompiler_StaticMethods_doCB$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_doCB$self$$)) | 128);
      break;
    case 255:
      $JSCompiler_StaticMethods_doCB$self$$.$a$ |= 128;
      break;
    default:
      console.log("Unimplemented CB Opcode: " + $opcode$$9$$.toString(16))
  }
}
function $JSCompiler_StaticMethods_decMem$$($JSCompiler_StaticMethods_decMem$self$$, $offset$$16$$) {
  $JSCompiler_StaticMethods_decMem$self$$.$writeMem$($offset$$16$$, $JSCompiler_StaticMethods_dec8$$($JSCompiler_StaticMethods_decMem$self$$, $JSCompiler_StaticMethods_decMem$self$$.$readMem$($offset$$16$$)))
}
function $JSCompiler_StaticMethods_incMem$$($JSCompiler_StaticMethods_incMem$self$$, $offset$$15$$) {
  $JSCompiler_StaticMethods_incMem$self$$.$writeMem$($offset$$15$$, $JSCompiler_StaticMethods_inc8$$($JSCompiler_StaticMethods_incMem$self$$, $JSCompiler_StaticMethods_incMem$self$$.$readMem$($offset$$15$$)))
}
function $JSCompiler_StaticMethods_push2$$($JSCompiler_StaticMethods_push2$self$$, $value$$55$$, $l$$) {
  $JSCompiler_StaticMethods_push2$self$$.$writeMem$(--$JSCompiler_StaticMethods_push2$self$$.$sp$, $value$$55$$);
  $JSCompiler_StaticMethods_push2$self$$.$writeMem$(--$JSCompiler_StaticMethods_push2$self$$.$sp$, $l$$)
}
function $JSCompiler_StaticMethods_push1$$($JSCompiler_StaticMethods_push1$self$$, $value$$54$$) {
  $JSCompiler_StaticMethods_push1$self$$.$writeMem$(--$JSCompiler_StaticMethods_push1$self$$.$sp$, $value$$54$$ >> 8);
  $JSCompiler_StaticMethods_push1$self$$.$writeMem$(--$JSCompiler_StaticMethods_push1$self$$.$sp$, $value$$54$$ & 255)
}
function $JSCompiler_StaticMethods_ret$$($JSCompiler_StaticMethods_ret$self$$, $condition$$4$$) {
  $condition$$4$$ && ($JSCompiler_StaticMethods_ret$self$$.$pc$ = $JSCompiler_StaticMethods_ret$self$$.$readMemWord$($JSCompiler_StaticMethods_ret$self$$.$sp$), $JSCompiler_StaticMethods_ret$self$$.$sp$ += 2, $JSCompiler_StaticMethods_ret$self$$.$tstates$ -= 6)
}
function $JSCompiler_StaticMethods_jr$$($JSCompiler_StaticMethods_jr$self$$, $condition$$2$$) {
  if($condition$$2$$) {
    var $d$$5$$ = $JSCompiler_StaticMethods_d_$$($JSCompiler_StaticMethods_jr$self$$) + 1;
    128 <= $d$$5$$ && ($d$$5$$ -= 256);
    $JSCompiler_StaticMethods_jr$self$$.$pc$ += $d$$5$$;
    $JSCompiler_StaticMethods_jr$self$$.$tstates$ -= 5
  }else {
    $JSCompiler_StaticMethods_jr$self$$.$pc$++
  }
}
function $JSCompiler_StaticMethods_jp$$($JSCompiler_StaticMethods_jp$self$$, $condition$$1$$) {
  $JSCompiler_StaticMethods_jp$self$$.$pc$ = $condition$$1$$ ? $JSCompiler_StaticMethods_jp$self$$.$readMemWord$($JSCompiler_StaticMethods_jp$self$$.$pc$) : $JSCompiler_StaticMethods_jp$self$$.$pc$ + 2
}
function $JSCompiler_StaticMethods_run$$($JSCompiler_StaticMethods_run$self$$, $cycles$$) {
  var $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$ = 
  0, $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$ = 
  $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$ = 
  0;
  $JSCompiler_StaticMethods_run$self$$.$tstates$ += $cycles$$;
  0 != $cycles$$ && ($JSCompiler_StaticMethods_run$self$$.$totalCycles$ = $cycles$$);
  $JSCompiler_StaticMethods_run$self$$.$interruptLine$ && $JSCompiler_StaticMethods_run$self$$.$iff1$ && ($JSCompiler_StaticMethods_run$self$$.$halt$ && ($JSCompiler_StaticMethods_run$self$$.$pc$++, $JSCompiler_StaticMethods_run$self$$.$halt$ = $JSCompiler_alias_FALSE$$), $JSCompiler_StaticMethods_run$self$$.$iff1$ = $JSCompiler_StaticMethods_run$self$$.$iff2$ = $JSCompiler_alias_FALSE$$, $JSCompiler_StaticMethods_run$self$$.$interruptLine$ = $JSCompiler_alias_FALSE$$, $JSCompiler_StaticMethods_push1$$($JSCompiler_StaticMethods_run$self$$, 
  $JSCompiler_StaticMethods_run$self$$.$pc$), 0 == $JSCompiler_StaticMethods_run$self$$.$im$ ? ($JSCompiler_StaticMethods_run$self$$.$pc$ = 0 == $JSCompiler_StaticMethods_run$self$$.$interruptVector$ || 255 == $JSCompiler_StaticMethods_run$self$$.$interruptVector$ ? 56 : $JSCompiler_StaticMethods_run$self$$.$interruptVector$, $JSCompiler_StaticMethods_run$self$$.$tstates$ -= 13) : 1 == $JSCompiler_StaticMethods_run$self$$.$im$ ? ($JSCompiler_StaticMethods_run$self$$.$pc$ = 56, $JSCompiler_StaticMethods_run$self$$.$tstates$ -= 
  13) : ($JSCompiler_StaticMethods_run$self$$.$pc$ = $JSCompiler_StaticMethods_run$self$$.$readMemWord$(($JSCompiler_StaticMethods_run$self$$.$i$ << 8) + $JSCompiler_StaticMethods_run$self$$.$interruptVector$), $JSCompiler_StaticMethods_run$self$$.$tstates$ -= 19));
  for(;0 < $JSCompiler_StaticMethods_run$self$$.$tstates$;) {
    if($JSCompiler_StaticMethods_run$self$$.$blocks$[$JSCompiler_StaticMethods_run$self$$.$pc$]) {
      $JSCompiler_StaticMethods_run$self$$.tstates = $JSCompiler_StaticMethods_run$self$$.$tstates$;
      $JSCompiler_StaticMethods_run$self$$.$blocks$[$JSCompiler_StaticMethods_run$self$$.$pc$].call($JSCompiler_StaticMethods_run$self$$, 0);
      $JSCompiler_StaticMethods_run$self$$.$entryPC$ = $JSCompiler_StaticMethods_run$self$$.$pc$;
      $JSCompiler_StaticMethods_run$self$$.$blockInstructions$ = [];
      break
    }
    $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$ = 
    $JSCompiler_StaticMethods_run$self$$.$readMem$($JSCompiler_StaticMethods_run$self$$.$pc$);
    if(0 <= $endingInst$$.indexOf($JSCompiler_StaticMethods_run$self$$.$prevOpcode$)) {
      $JSCompiler_StaticMethods_run$self$$.$hitCounts$[$JSCompiler_StaticMethods_run$self$$.$entryPC$]++;
      if(1 <= $JSCompiler_StaticMethods_run$self$$.$hitCounts$[$JSCompiler_StaticMethods_run$self$$.$pc$] && $JSCompiler_StaticMethods_run$self$$.$blockInstructions$.length) {
        var $carry$$inline_81_carry$$inline_87_carry$$inline_90_carry$$inline_93_instructionsNumber_temp$$inline_106_temp$$inline_109_temp$$inline_112_temp$$inline_84_temp$$inline_96_value$$inline_103_value$$inline_174$$ = $JSCompiler_StaticMethods_run$self$$.$blockInstructions$.length, $blockFunction$$ = $JSCompiler_StaticMethods_run$self$$.$blockInstructions$.map(function($opcode$$8$$) {
          return $JSCompiler_StaticMethods_run$self$$.$opcodeInstructions$[$opcode$$8$$]
        }).join("\nif (!(this.tstates > cyclesTo)) return;\n\n"), $hex$$inline_76$$ = $JSCompiler_StaticMethods_run$self$$.$entryPC$.toString(16);
        1 == $hex$$inline_76$$.length && ($hex$$inline_76$$ = "0" + $hex$$inline_76$$);
        $blockFunction$$ = (new Function("return function block_0x" + $hex$$inline_76$$ + "_" + $carry$$inline_81_carry$$inline_87_carry$$inline_90_carry$$inline_93_instructionsNumber_temp$$inline_106_temp$$inline_109_temp$$inline_112_temp$$inline_84_temp$$inline_96_value$$inline_103_value$$inline_174$$ + "(cyclesTo) {\n" + $blockFunction$$ + "}"))();
        $JSCompiler_StaticMethods_run$self$$.$blocks$[$JSCompiler_StaticMethods_run$self$$.$entryPC$] = $blockFunction$$
      }
      $JSCompiler_StaticMethods_run$self$$.$entryPC$ = $JSCompiler_StaticMethods_run$self$$.$pc$;
      $JSCompiler_StaticMethods_run$self$$.$blockInstructions$ = []
    }
    $JSCompiler_StaticMethods_run$self$$.$prevOpcode$ = $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$;
    $JSCompiler_StaticMethods_run$self$$.$blockInstructions$.push($JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$);
    $JSCompiler_StaticMethods_run$self$$.$pc$++;
    $JSCompiler_StaticMethods_run$self$$.$tstates$ -= $OP_STATES$$[$JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$];
    switch($JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$) {
      case 1:
        $JSCompiler_StaticMethods_run$self$$.$c$ = $JSCompiler_StaticMethods_run$self$$.$readMem$($JSCompiler_StaticMethods_run$self$$.$pc$++);
        $JSCompiler_StaticMethods_run$self$$.$b$ = $JSCompiler_StaticMethods_run$self$$.$readMem$($JSCompiler_StaticMethods_run$self$$.$pc$++);
        break;
      case 2:
        $JSCompiler_StaticMethods_run$self$$.$writeMem$($JSCompiler_StaticMethods_getBC$$($JSCompiler_StaticMethods_run$self$$), $JSCompiler_StaticMethods_run$self$$.$a$);
        break;
      case 3:
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$ = 
        $JSCompiler_StaticMethods_run$self$$;
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$c$ = 
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$c$ + 
        1 & 255;
        0 == $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$c$ && 
        ($JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$b$ = 
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$b$ + 
        1 & 255);
        break;
      case 4:
        $JSCompiler_StaticMethods_run$self$$.$b$ = $JSCompiler_StaticMethods_inc8$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$b$);
        break;
      case 5:
        $JSCompiler_StaticMethods_run$self$$.$b$ = $JSCompiler_StaticMethods_dec8$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$b$);
        break;
      case 6:
        $JSCompiler_StaticMethods_run$self$$.$b$ = $JSCompiler_StaticMethods_run$self$$.$readMem$($JSCompiler_StaticMethods_run$self$$.$pc$++);
        break;
      case 7:
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$ = 
        $JSCompiler_StaticMethods_run$self$$;
        $carry$$inline_81_carry$$inline_87_carry$$inline_90_carry$$inline_93_instructionsNumber_temp$$inline_106_temp$$inline_109_temp$$inline_112_temp$$inline_84_temp$$inline_96_value$$inline_103_value$$inline_174$$ = $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$a$ >> 
        7;
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$a$ = 
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$a$ << 
        1 & 255 | $carry$$inline_81_carry$$inline_87_carry$$inline_90_carry$$inline_93_instructionsNumber_temp$$inline_106_temp$$inline_109_temp$$inline_112_temp$$inline_84_temp$$inline_96_value$$inline_103_value$$inline_174$$;
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$f$ = 
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$f$ & 
        236 | $carry$$inline_81_carry$$inline_87_carry$$inline_90_carry$$inline_93_instructionsNumber_temp$$inline_106_temp$$inline_109_temp$$inline_112_temp$$inline_84_temp$$inline_96_value$$inline_103_value$$inline_174$$;
        break;
      case 8:
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$ = 
        $JSCompiler_StaticMethods_run$self$$;
        $carry$$inline_81_carry$$inline_87_carry$$inline_90_carry$$inline_93_instructionsNumber_temp$$inline_106_temp$$inline_109_temp$$inline_112_temp$$inline_84_temp$$inline_96_value$$inline_103_value$$inline_174$$ = $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$a$;
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$a$ = 
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$a2$;
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$a2$ = 
        $carry$$inline_81_carry$$inline_87_carry$$inline_90_carry$$inline_93_instructionsNumber_temp$$inline_106_temp$$inline_109_temp$$inline_112_temp$$inline_84_temp$$inline_96_value$$inline_103_value$$inline_174$$;
        $carry$$inline_81_carry$$inline_87_carry$$inline_90_carry$$inline_93_instructionsNumber_temp$$inline_106_temp$$inline_109_temp$$inline_112_temp$$inline_84_temp$$inline_96_value$$inline_103_value$$inline_174$$ = $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$f$;
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$f$ = 
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$f2$;
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$f2$ = 
        $carry$$inline_81_carry$$inline_87_carry$$inline_90_carry$$inline_93_instructionsNumber_temp$$inline_106_temp$$inline_109_temp$$inline_112_temp$$inline_84_temp$$inline_96_value$$inline_103_value$$inline_174$$;
        break;
      case 9:
        $JSCompiler_StaticMethods_setHL$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_add16$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_run$self$$), $JSCompiler_StaticMethods_getBC$$($JSCompiler_StaticMethods_run$self$$)));
        break;
      case 10:
        $JSCompiler_StaticMethods_run$self$$.$a$ = $JSCompiler_StaticMethods_run$self$$.$readMem$($JSCompiler_StaticMethods_getBC$$($JSCompiler_StaticMethods_run$self$$));
        break;
      case 11:
        $JSCompiler_StaticMethods_decBC$$($JSCompiler_StaticMethods_run$self$$);
        break;
      case 12:
        $JSCompiler_StaticMethods_run$self$$.$c$ = $JSCompiler_StaticMethods_inc8$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$c$);
        break;
      case 13:
        $JSCompiler_StaticMethods_run$self$$.$c$ = $JSCompiler_StaticMethods_dec8$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$c$);
        break;
      case 14:
        $JSCompiler_StaticMethods_run$self$$.$c$ = $JSCompiler_StaticMethods_run$self$$.$readMem$($JSCompiler_StaticMethods_run$self$$.$pc$++);
        break;
      case 15:
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$ = 
        $JSCompiler_StaticMethods_run$self$$;
        $carry$$inline_81_carry$$inline_87_carry$$inline_90_carry$$inline_93_instructionsNumber_temp$$inline_106_temp$$inline_109_temp$$inline_112_temp$$inline_84_temp$$inline_96_value$$inline_103_value$$inline_174$$ = $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$a$ & 
        1;
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$a$ = 
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$a$ >> 
        1 | $carry$$inline_81_carry$$inline_87_carry$$inline_90_carry$$inline_93_instructionsNumber_temp$$inline_106_temp$$inline_109_temp$$inline_112_temp$$inline_84_temp$$inline_96_value$$inline_103_value$$inline_174$$ << 7;
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$f$ = 
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$f$ & 
        236 | $carry$$inline_81_carry$$inline_87_carry$$inline_90_carry$$inline_93_instructionsNumber_temp$$inline_106_temp$$inline_109_temp$$inline_112_temp$$inline_84_temp$$inline_96_value$$inline_103_value$$inline_174$$;
        break;
      case 16:
        $JSCompiler_StaticMethods_run$self$$.$b$ = $JSCompiler_StaticMethods_run$self$$.$b$ - 1 & 255;
        $JSCompiler_StaticMethods_jr$$($JSCompiler_StaticMethods_run$self$$, 0 != $JSCompiler_StaticMethods_run$self$$.$b$);
        break;
      case 17:
        $JSCompiler_StaticMethods_run$self$$.$e$ = $JSCompiler_StaticMethods_run$self$$.$readMem$($JSCompiler_StaticMethods_run$self$$.$pc$++);
        $JSCompiler_StaticMethods_run$self$$.$d$ = $JSCompiler_StaticMethods_run$self$$.$readMem$($JSCompiler_StaticMethods_run$self$$.$pc$++);
        break;
      case 18:
        $JSCompiler_StaticMethods_run$self$$.$writeMem$($JSCompiler_StaticMethods_getDE$$($JSCompiler_StaticMethods_run$self$$), $JSCompiler_StaticMethods_run$self$$.$a$);
        break;
      case 19:
        $JSCompiler_StaticMethods_incDE$$($JSCompiler_StaticMethods_run$self$$);
        break;
      case 20:
        $JSCompiler_StaticMethods_run$self$$.$d$ = $JSCompiler_StaticMethods_inc8$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$d$);
        break;
      case 21:
        $JSCompiler_StaticMethods_run$self$$.$d$ = $JSCompiler_StaticMethods_dec8$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$d$);
        break;
      case 22:
        $JSCompiler_StaticMethods_run$self$$.$d$ = $JSCompiler_StaticMethods_run$self$$.$readMem$($JSCompiler_StaticMethods_run$self$$.$pc$++);
        break;
      case 23:
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$ = 
        $JSCompiler_StaticMethods_run$self$$;
        $carry$$inline_81_carry$$inline_87_carry$$inline_90_carry$$inline_93_instructionsNumber_temp$$inline_106_temp$$inline_109_temp$$inline_112_temp$$inline_84_temp$$inline_96_value$$inline_103_value$$inline_174$$ = $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$a$ >> 
        7;
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$a$ = 
        ($JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$a$ << 
        1 | $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$f$ & 
        1) & 255;
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$f$ = 
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$f$ & 
        236 | $carry$$inline_81_carry$$inline_87_carry$$inline_90_carry$$inline_93_instructionsNumber_temp$$inline_106_temp$$inline_109_temp$$inline_112_temp$$inline_84_temp$$inline_96_value$$inline_103_value$$inline_174$$;
        break;
      case 24:
        $JSCompiler_StaticMethods_run$self$$.$pc$ += $JSCompiler_StaticMethods_d_$$($JSCompiler_StaticMethods_run$self$$) + 1;
        break;
      case 25:
        $JSCompiler_StaticMethods_setHL$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_add16$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_run$self$$), $JSCompiler_StaticMethods_getDE$$($JSCompiler_StaticMethods_run$self$$)));
        break;
      case 26:
        $JSCompiler_StaticMethods_run$self$$.$a$ = $JSCompiler_StaticMethods_run$self$$.$readMem$($JSCompiler_StaticMethods_getDE$$($JSCompiler_StaticMethods_run$self$$));
        break;
      case 27:
        $JSCompiler_StaticMethods_decDE$$($JSCompiler_StaticMethods_run$self$$);
        break;
      case 28:
        $JSCompiler_StaticMethods_run$self$$.$e$ = $JSCompiler_StaticMethods_inc8$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$e$);
        break;
      case 29:
        $JSCompiler_StaticMethods_run$self$$.$e$ = $JSCompiler_StaticMethods_dec8$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$e$);
        break;
      case 30:
        $JSCompiler_StaticMethods_run$self$$.$e$ = $JSCompiler_StaticMethods_run$self$$.$readMem$($JSCompiler_StaticMethods_run$self$$.$pc$++);
        break;
      case 31:
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$ = 
        $JSCompiler_StaticMethods_run$self$$;
        $carry$$inline_81_carry$$inline_87_carry$$inline_90_carry$$inline_93_instructionsNumber_temp$$inline_106_temp$$inline_109_temp$$inline_112_temp$$inline_84_temp$$inline_96_value$$inline_103_value$$inline_174$$ = $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$a$ & 
        1;
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$a$ = 
        ($JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$a$ >> 
        1 | ($JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$f$ & 
        1) << 7) & 255;
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$f$ = 
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$f$ & 
        236 | $carry$$inline_81_carry$$inline_87_carry$$inline_90_carry$$inline_93_instructionsNumber_temp$$inline_106_temp$$inline_109_temp$$inline_112_temp$$inline_84_temp$$inline_96_value$$inline_103_value$$inline_174$$;
        break;
      case 32:
        $JSCompiler_StaticMethods_jr$$($JSCompiler_StaticMethods_run$self$$, 0 == ($JSCompiler_StaticMethods_run$self$$.$f$ & 64));
        break;
      case 33:
        $JSCompiler_StaticMethods_run$self$$.$l$ = $JSCompiler_StaticMethods_run$self$$.$readMem$($JSCompiler_StaticMethods_run$self$$.$pc$++);
        $JSCompiler_StaticMethods_run$self$$.$h$ = $JSCompiler_StaticMethods_run$self$$.$readMem$($JSCompiler_StaticMethods_run$self$$.$pc$++);
        break;
      case 34:
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$ = 
        $JSCompiler_StaticMethods_run$self$$.$readMemWord$($JSCompiler_StaticMethods_run$self$$.$pc$);
        $JSCompiler_StaticMethods_run$self$$.$writeMem$($JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$, 
        $JSCompiler_StaticMethods_run$self$$.$l$);
        $JSCompiler_StaticMethods_run$self$$.$writeMem$(++$JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$, 
        $JSCompiler_StaticMethods_run$self$$.$h$);
        $JSCompiler_StaticMethods_run$self$$.$pc$ += 2;
        break;
      case 35:
        $JSCompiler_StaticMethods_incHL$$($JSCompiler_StaticMethods_run$self$$);
        break;
      case 36:
        $JSCompiler_StaticMethods_run$self$$.$h$ = $JSCompiler_StaticMethods_inc8$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$h$);
        break;
      case 37:
        $JSCompiler_StaticMethods_run$self$$.$h$ = $JSCompiler_StaticMethods_dec8$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$h$);
        break;
      case 38:
        $JSCompiler_StaticMethods_run$self$$.$h$ = $JSCompiler_StaticMethods_run$self$$.$readMem$($JSCompiler_StaticMethods_run$self$$.$pc$++);
        break;
      case 39:
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$ = 
        $JSCompiler_StaticMethods_run$self$$;
        $carry$$inline_81_carry$$inline_87_carry$$inline_90_carry$$inline_93_instructionsNumber_temp$$inline_106_temp$$inline_109_temp$$inline_112_temp$$inline_84_temp$$inline_96_value$$inline_103_value$$inline_174$$ = $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$DAA_TABLE$[$JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$a$ | 
        ($JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$f$ & 
        1) << 8 | ($JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$f$ & 
        2) << 8 | ($JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$f$ & 
        16) << 6];
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$a$ = 
        $carry$$inline_81_carry$$inline_87_carry$$inline_90_carry$$inline_93_instructionsNumber_temp$$inline_106_temp$$inline_109_temp$$inline_112_temp$$inline_84_temp$$inline_96_value$$inline_103_value$$inline_174$$ & 255;
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$f$ = 
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$f$ & 
        2 | $carry$$inline_81_carry$$inline_87_carry$$inline_90_carry$$inline_93_instructionsNumber_temp$$inline_106_temp$$inline_109_temp$$inline_112_temp$$inline_84_temp$$inline_96_value$$inline_103_value$$inline_174$$ >> 8;
        break;
      case 40:
        $JSCompiler_StaticMethods_jr$$($JSCompiler_StaticMethods_run$self$$, 0 != ($JSCompiler_StaticMethods_run$self$$.$f$ & 64));
        break;
      case 41:
        $JSCompiler_StaticMethods_setHL$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_add16$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_run$self$$), $JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_run$self$$)));
        break;
      case 42:
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$ = 
        $JSCompiler_StaticMethods_run$self$$.$readMemWord$($JSCompiler_StaticMethods_run$self$$.$pc$);
        $JSCompiler_StaticMethods_run$self$$.$l$ = $JSCompiler_StaticMethods_run$self$$.$readMem$($JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$);
        $JSCompiler_StaticMethods_run$self$$.$h$ = $JSCompiler_StaticMethods_run$self$$.$readMem$($JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$ + 
        1);
        $JSCompiler_StaticMethods_run$self$$.$pc$ += 2;
        break;
      case 43:
        $JSCompiler_StaticMethods_decHL$$($JSCompiler_StaticMethods_run$self$$);
        break;
      case 44:
        $JSCompiler_StaticMethods_run$self$$.$l$ = $JSCompiler_StaticMethods_inc8$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$l$);
        break;
      case 45:
        $JSCompiler_StaticMethods_run$self$$.$l$ = $JSCompiler_StaticMethods_dec8$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$l$);
        break;
      case 46:
        $JSCompiler_StaticMethods_run$self$$.$l$ = $JSCompiler_StaticMethods_run$self$$.$readMem$($JSCompiler_StaticMethods_run$self$$.$pc$++);
        break;
      case 47:
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$ = 
        $JSCompiler_StaticMethods_run$self$$;
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$a$ ^= 
        255;
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$f$ |= 
        18;
        break;
      case 48:
        $JSCompiler_StaticMethods_jr$$($JSCompiler_StaticMethods_run$self$$, 0 == ($JSCompiler_StaticMethods_run$self$$.$f$ & 1));
        break;
      case 49:
        $JSCompiler_StaticMethods_run$self$$.$sp$ = $JSCompiler_StaticMethods_run$self$$.$readMemWord$($JSCompiler_StaticMethods_run$self$$.$pc$);
        $JSCompiler_StaticMethods_run$self$$.$pc$ += 2;
        break;
      case 50:
        $JSCompiler_StaticMethods_run$self$$.$writeMem$($JSCompiler_StaticMethods_run$self$$.$readMemWord$($JSCompiler_StaticMethods_run$self$$.$pc$), $JSCompiler_StaticMethods_run$self$$.$a$);
        $JSCompiler_StaticMethods_run$self$$.$pc$ += 2;
        break;
      case 51:
        $JSCompiler_StaticMethods_run$self$$.$sp$++;
        break;
      case 52:
        $JSCompiler_StaticMethods_incMem$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_run$self$$));
        break;
      case 53:
        $JSCompiler_StaticMethods_decMem$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_run$self$$));
        break;
      case 54:
        $JSCompiler_StaticMethods_run$self$$.$writeMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_run$self$$), $JSCompiler_StaticMethods_run$self$$.$readMem$($JSCompiler_StaticMethods_run$self$$.$pc$++));
        break;
      case 55:
        $JSCompiler_StaticMethods_run$self$$.$f$ |= 1;
        $JSCompiler_StaticMethods_run$self$$.$f$ &= -3;
        $JSCompiler_StaticMethods_run$self$$.$f$ &= -17;
        break;
      case 56:
        $JSCompiler_StaticMethods_jr$$($JSCompiler_StaticMethods_run$self$$, 0 != ($JSCompiler_StaticMethods_run$self$$.$f$ & 1));
        break;
      case 57:
        $JSCompiler_StaticMethods_setHL$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_add16$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_run$self$$), $JSCompiler_StaticMethods_run$self$$.$sp$));
        break;
      case 58:
        $JSCompiler_StaticMethods_run$self$$.$a$ = $JSCompiler_StaticMethods_run$self$$.$readMem$($JSCompiler_StaticMethods_run$self$$.$readMemWord$($JSCompiler_StaticMethods_run$self$$.$pc$));
        $JSCompiler_StaticMethods_run$self$$.$pc$ += 2;
        break;
      case 59:
        $JSCompiler_StaticMethods_run$self$$.$sp$--;
        break;
      case 60:
        $JSCompiler_StaticMethods_run$self$$.$a$ = $JSCompiler_StaticMethods_inc8$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$a$);
        break;
      case 61:
        $JSCompiler_StaticMethods_run$self$$.$a$ = $JSCompiler_StaticMethods_dec8$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$a$);
        break;
      case 62:
        $JSCompiler_StaticMethods_run$self$$.$a$ = $JSCompiler_StaticMethods_run$self$$.$readMem$($JSCompiler_StaticMethods_run$self$$.$pc$++);
        break;
      case 63:
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$ = 
        $JSCompiler_StaticMethods_run$self$$;
        0 != ($JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$f$ & 
        1) ? ($JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$f$ &= 
        -2, $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$f$ |= 
        16) : ($JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$f$ |= 
        1, $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$f$ &= 
        -17);
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$f$ &= 
        -3;
        break;
      case 65:
        $JSCompiler_StaticMethods_run$self$$.$b$ = $JSCompiler_StaticMethods_run$self$$.$c$;
        break;
      case 66:
        $JSCompiler_StaticMethods_run$self$$.$b$ = $JSCompiler_StaticMethods_run$self$$.$d$;
        break;
      case 67:
        $JSCompiler_StaticMethods_run$self$$.$b$ = $JSCompiler_StaticMethods_run$self$$.$e$;
        break;
      case 68:
        $JSCompiler_StaticMethods_run$self$$.$b$ = $JSCompiler_StaticMethods_run$self$$.$h$;
        break;
      case 69:
        $JSCompiler_StaticMethods_run$self$$.$b$ = $JSCompiler_StaticMethods_run$self$$.$l$;
        break;
      case 70:
        $JSCompiler_StaticMethods_run$self$$.$b$ = $JSCompiler_StaticMethods_run$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_run$self$$));
        break;
      case 71:
        $JSCompiler_StaticMethods_run$self$$.$b$ = $JSCompiler_StaticMethods_run$self$$.$a$;
        break;
      case 72:
        $JSCompiler_StaticMethods_run$self$$.$c$ = $JSCompiler_StaticMethods_run$self$$.$b$;
        break;
      case 74:
        $JSCompiler_StaticMethods_run$self$$.$c$ = $JSCompiler_StaticMethods_run$self$$.$d$;
        break;
      case 75:
        $JSCompiler_StaticMethods_run$self$$.$c$ = $JSCompiler_StaticMethods_run$self$$.$e$;
        break;
      case 76:
        $JSCompiler_StaticMethods_run$self$$.$c$ = $JSCompiler_StaticMethods_run$self$$.$h$;
        break;
      case 77:
        $JSCompiler_StaticMethods_run$self$$.$c$ = $JSCompiler_StaticMethods_run$self$$.$l$;
        break;
      case 78:
        $JSCompiler_StaticMethods_run$self$$.$c$ = $JSCompiler_StaticMethods_run$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_run$self$$));
        break;
      case 79:
        $JSCompiler_StaticMethods_run$self$$.$c$ = $JSCompiler_StaticMethods_run$self$$.$a$;
        break;
      case 80:
        $JSCompiler_StaticMethods_run$self$$.$d$ = $JSCompiler_StaticMethods_run$self$$.$b$;
        break;
      case 81:
        $JSCompiler_StaticMethods_run$self$$.$d$ = $JSCompiler_StaticMethods_run$self$$.$c$;
        break;
      case 83:
        $JSCompiler_StaticMethods_run$self$$.$d$ = $JSCompiler_StaticMethods_run$self$$.$e$;
        break;
      case 84:
        $JSCompiler_StaticMethods_run$self$$.$d$ = $JSCompiler_StaticMethods_run$self$$.$h$;
        break;
      case 85:
        $JSCompiler_StaticMethods_run$self$$.$d$ = $JSCompiler_StaticMethods_run$self$$.$l$;
        break;
      case 86:
        $JSCompiler_StaticMethods_run$self$$.$d$ = $JSCompiler_StaticMethods_run$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_run$self$$));
        break;
      case 87:
        $JSCompiler_StaticMethods_run$self$$.$d$ = $JSCompiler_StaticMethods_run$self$$.$a$;
        break;
      case 88:
        $JSCompiler_StaticMethods_run$self$$.$e$ = $JSCompiler_StaticMethods_run$self$$.$b$;
        break;
      case 89:
        $JSCompiler_StaticMethods_run$self$$.$e$ = $JSCompiler_StaticMethods_run$self$$.$c$;
        break;
      case 90:
        $JSCompiler_StaticMethods_run$self$$.$e$ = $JSCompiler_StaticMethods_run$self$$.$d$;
        break;
      case 92:
        $JSCompiler_StaticMethods_run$self$$.$e$ = $JSCompiler_StaticMethods_run$self$$.$h$;
        break;
      case 93:
        $JSCompiler_StaticMethods_run$self$$.$e$ = $JSCompiler_StaticMethods_run$self$$.$l$;
        break;
      case 94:
        $JSCompiler_StaticMethods_run$self$$.$e$ = $JSCompiler_StaticMethods_run$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_run$self$$));
        break;
      case 95:
        $JSCompiler_StaticMethods_run$self$$.$e$ = $JSCompiler_StaticMethods_run$self$$.$a$;
        break;
      case 96:
        $JSCompiler_StaticMethods_run$self$$.$h$ = $JSCompiler_StaticMethods_run$self$$.$b$;
        break;
      case 97:
        $JSCompiler_StaticMethods_run$self$$.$h$ = $JSCompiler_StaticMethods_run$self$$.$c$;
        break;
      case 98:
        $JSCompiler_StaticMethods_run$self$$.$h$ = $JSCompiler_StaticMethods_run$self$$.$d$;
        break;
      case 99:
        $JSCompiler_StaticMethods_run$self$$.$h$ = $JSCompiler_StaticMethods_run$self$$.$e$;
        break;
      case 101:
        $JSCompiler_StaticMethods_run$self$$.$h$ = $JSCompiler_StaticMethods_run$self$$.$l$;
        break;
      case 102:
        $JSCompiler_StaticMethods_run$self$$.$h$ = $JSCompiler_StaticMethods_run$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_run$self$$));
        break;
      case 103:
        $JSCompiler_StaticMethods_run$self$$.$h$ = $JSCompiler_StaticMethods_run$self$$.$a$;
        break;
      case 104:
        $JSCompiler_StaticMethods_run$self$$.$l$ = $JSCompiler_StaticMethods_run$self$$.$b$;
        break;
      case 105:
        $JSCompiler_StaticMethods_run$self$$.$l$ = $JSCompiler_StaticMethods_run$self$$.$c$;
        break;
      case 106:
        $JSCompiler_StaticMethods_run$self$$.$l$ = $JSCompiler_StaticMethods_run$self$$.$d$;
        break;
      case 107:
        $JSCompiler_StaticMethods_run$self$$.$l$ = $JSCompiler_StaticMethods_run$self$$.$e$;
        break;
      case 108:
        $JSCompiler_StaticMethods_run$self$$.$l$ = $JSCompiler_StaticMethods_run$self$$.$h$;
        break;
      case 110:
        $JSCompiler_StaticMethods_run$self$$.$l$ = $JSCompiler_StaticMethods_run$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_run$self$$));
        break;
      case 111:
        $JSCompiler_StaticMethods_run$self$$.$l$ = $JSCompiler_StaticMethods_run$self$$.$a$;
        break;
      case 112:
        $JSCompiler_StaticMethods_run$self$$.$writeMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_run$self$$), $JSCompiler_StaticMethods_run$self$$.$b$);
        break;
      case 113:
        $JSCompiler_StaticMethods_run$self$$.$writeMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_run$self$$), $JSCompiler_StaticMethods_run$self$$.$c$);
        break;
      case 114:
        $JSCompiler_StaticMethods_run$self$$.$writeMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_run$self$$), $JSCompiler_StaticMethods_run$self$$.$d$);
        break;
      case 115:
        $JSCompiler_StaticMethods_run$self$$.$writeMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_run$self$$), $JSCompiler_StaticMethods_run$self$$.$e$);
        break;
      case 116:
        $JSCompiler_StaticMethods_run$self$$.$writeMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_run$self$$), $JSCompiler_StaticMethods_run$self$$.$h$);
        break;
      case 117:
        $JSCompiler_StaticMethods_run$self$$.$writeMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_run$self$$), $JSCompiler_StaticMethods_run$self$$.$l$);
        break;
      case 118:
        $JSCompiler_StaticMethods_run$self$$.$tstates$ = 0;
        $JSCompiler_StaticMethods_run$self$$.$halt$ = $JSCompiler_alias_TRUE$$;
        $JSCompiler_StaticMethods_run$self$$.$pc$--;
        break;
      case 119:
        $JSCompiler_StaticMethods_run$self$$.$writeMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_run$self$$), $JSCompiler_StaticMethods_run$self$$.$a$);
        break;
      case 120:
        $JSCompiler_StaticMethods_run$self$$.$a$ = $JSCompiler_StaticMethods_run$self$$.$b$;
        break;
      case 121:
        $JSCompiler_StaticMethods_run$self$$.$a$ = $JSCompiler_StaticMethods_run$self$$.$c$;
        break;
      case 122:
        $JSCompiler_StaticMethods_run$self$$.$a$ = $JSCompiler_StaticMethods_run$self$$.$d$;
        break;
      case 123:
        $JSCompiler_StaticMethods_run$self$$.$a$ = $JSCompiler_StaticMethods_run$self$$.$e$;
        break;
      case 124:
        $JSCompiler_StaticMethods_run$self$$.$a$ = $JSCompiler_StaticMethods_run$self$$.$h$;
        break;
      case 125:
        $JSCompiler_StaticMethods_run$self$$.$a$ = $JSCompiler_StaticMethods_run$self$$.$l$;
        break;
      case 126:
        $JSCompiler_StaticMethods_run$self$$.$a$ = $JSCompiler_StaticMethods_run$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_run$self$$));
        break;
      case 128:
        $JSCompiler_StaticMethods_add_a$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$b$);
        break;
      case 129:
        $JSCompiler_StaticMethods_add_a$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$c$);
        break;
      case 130:
        $JSCompiler_StaticMethods_add_a$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$d$);
        break;
      case 131:
        $JSCompiler_StaticMethods_add_a$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$e$);
        break;
      case 132:
        $JSCompiler_StaticMethods_add_a$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$h$);
        break;
      case 133:
        $JSCompiler_StaticMethods_add_a$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$l$);
        break;
      case 134:
        $JSCompiler_StaticMethods_add_a$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_run$self$$)));
        break;
      case 135:
        $JSCompiler_StaticMethods_add_a$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$a$);
        break;
      case 136:
        $JSCompiler_StaticMethods_adc_a$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$b$);
        break;
      case 137:
        $JSCompiler_StaticMethods_adc_a$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$c$);
        break;
      case 138:
        $JSCompiler_StaticMethods_adc_a$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$d$);
        break;
      case 139:
        $JSCompiler_StaticMethods_adc_a$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$e$);
        break;
      case 140:
        $JSCompiler_StaticMethods_adc_a$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$h$);
        break;
      case 141:
        $JSCompiler_StaticMethods_adc_a$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$l$);
        break;
      case 142:
        $JSCompiler_StaticMethods_adc_a$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_run$self$$)));
        break;
      case 143:
        $JSCompiler_StaticMethods_adc_a$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$a$);
        break;
      case 144:
        $JSCompiler_StaticMethods_sub_a$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$b$);
        break;
      case 145:
        $JSCompiler_StaticMethods_sub_a$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$c$);
        break;
      case 146:
        $JSCompiler_StaticMethods_sub_a$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$d$);
        break;
      case 147:
        $JSCompiler_StaticMethods_sub_a$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$e$);
        break;
      case 148:
        $JSCompiler_StaticMethods_sub_a$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$h$);
        break;
      case 149:
        $JSCompiler_StaticMethods_sub_a$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$l$);
        break;
      case 150:
        $JSCompiler_StaticMethods_sub_a$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_run$self$$)));
        break;
      case 151:
        $JSCompiler_StaticMethods_sub_a$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$a$);
        break;
      case 152:
        $JSCompiler_StaticMethods_sbc_a$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$b$);
        break;
      case 153:
        $JSCompiler_StaticMethods_sbc_a$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$c$);
        break;
      case 154:
        $JSCompiler_StaticMethods_sbc_a$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$d$);
        break;
      case 155:
        $JSCompiler_StaticMethods_sbc_a$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$e$);
        break;
      case 156:
        $JSCompiler_StaticMethods_sbc_a$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$h$);
        break;
      case 157:
        $JSCompiler_StaticMethods_sbc_a$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$l$);
        break;
      case 158:
        $JSCompiler_StaticMethods_sbc_a$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_run$self$$)));
        break;
      case 159:
        $JSCompiler_StaticMethods_sbc_a$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$a$);
        break;
      case 160:
        $JSCompiler_StaticMethods_run$self$$.$f$ = $JSCompiler_StaticMethods_run$self$$.$SZP_TABLE$[$JSCompiler_StaticMethods_run$self$$.$a$ &= $JSCompiler_StaticMethods_run$self$$.$b$] | 16;
        break;
      case 161:
        $JSCompiler_StaticMethods_run$self$$.$f$ = $JSCompiler_StaticMethods_run$self$$.$SZP_TABLE$[$JSCompiler_StaticMethods_run$self$$.$a$ &= $JSCompiler_StaticMethods_run$self$$.$c$] | 16;
        break;
      case 162:
        $JSCompiler_StaticMethods_run$self$$.$f$ = $JSCompiler_StaticMethods_run$self$$.$SZP_TABLE$[$JSCompiler_StaticMethods_run$self$$.$a$ &= $JSCompiler_StaticMethods_run$self$$.$d$] | 16;
        break;
      case 163:
        $JSCompiler_StaticMethods_run$self$$.$f$ = $JSCompiler_StaticMethods_run$self$$.$SZP_TABLE$[$JSCompiler_StaticMethods_run$self$$.$a$ &= $JSCompiler_StaticMethods_run$self$$.$e$] | 16;
        break;
      case 164:
        $JSCompiler_StaticMethods_run$self$$.$f$ = $JSCompiler_StaticMethods_run$self$$.$SZP_TABLE$[$JSCompiler_StaticMethods_run$self$$.$a$ &= $JSCompiler_StaticMethods_run$self$$.$h$] | 16;
        break;
      case 165:
        $JSCompiler_StaticMethods_run$self$$.$f$ = $JSCompiler_StaticMethods_run$self$$.$SZP_TABLE$[$JSCompiler_StaticMethods_run$self$$.$a$ &= $JSCompiler_StaticMethods_run$self$$.$l$] | 16;
        break;
      case 166:
        $JSCompiler_StaticMethods_run$self$$.$f$ = $JSCompiler_StaticMethods_run$self$$.$SZP_TABLE$[$JSCompiler_StaticMethods_run$self$$.$a$ &= $JSCompiler_StaticMethods_run$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_run$self$$))] | 16;
        break;
      case 167:
        $JSCompiler_StaticMethods_run$self$$.$f$ = $JSCompiler_StaticMethods_run$self$$.$SZP_TABLE$[$JSCompiler_StaticMethods_run$self$$.$a$] | 16;
        break;
      case 168:
        $JSCompiler_StaticMethods_run$self$$.$f$ = $JSCompiler_StaticMethods_run$self$$.$SZP_TABLE$[$JSCompiler_StaticMethods_run$self$$.$a$ ^= $JSCompiler_StaticMethods_run$self$$.$b$];
        break;
      case 169:
        $JSCompiler_StaticMethods_run$self$$.$f$ = $JSCompiler_StaticMethods_run$self$$.$SZP_TABLE$[$JSCompiler_StaticMethods_run$self$$.$a$ ^= $JSCompiler_StaticMethods_run$self$$.$c$];
        break;
      case 170:
        $JSCompiler_StaticMethods_run$self$$.$f$ = $JSCompiler_StaticMethods_run$self$$.$SZP_TABLE$[$JSCompiler_StaticMethods_run$self$$.$a$ ^= $JSCompiler_StaticMethods_run$self$$.$d$];
        break;
      case 171:
        $JSCompiler_StaticMethods_run$self$$.$f$ = $JSCompiler_StaticMethods_run$self$$.$SZP_TABLE$[$JSCompiler_StaticMethods_run$self$$.$a$ ^= $JSCompiler_StaticMethods_run$self$$.$e$];
        break;
      case 172:
        $JSCompiler_StaticMethods_run$self$$.$f$ = $JSCompiler_StaticMethods_run$self$$.$SZP_TABLE$[$JSCompiler_StaticMethods_run$self$$.$a$ ^= $JSCompiler_StaticMethods_run$self$$.$h$];
        break;
      case 173:
        $JSCompiler_StaticMethods_run$self$$.$f$ = $JSCompiler_StaticMethods_run$self$$.$SZP_TABLE$[$JSCompiler_StaticMethods_run$self$$.$a$ ^= $JSCompiler_StaticMethods_run$self$$.$l$];
        break;
      case 174:
        $JSCompiler_StaticMethods_run$self$$.$f$ = $JSCompiler_StaticMethods_run$self$$.$SZP_TABLE$[$JSCompiler_StaticMethods_run$self$$.$a$ ^= $JSCompiler_StaticMethods_run$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_run$self$$))];
        break;
      case 175:
        $JSCompiler_StaticMethods_run$self$$.$f$ = $JSCompiler_StaticMethods_run$self$$.$SZP_TABLE$[$JSCompiler_StaticMethods_run$self$$.$a$ = 0];
        break;
      case 176:
        $JSCompiler_StaticMethods_run$self$$.$f$ = $JSCompiler_StaticMethods_run$self$$.$SZP_TABLE$[$JSCompiler_StaticMethods_run$self$$.$a$ |= $JSCompiler_StaticMethods_run$self$$.$b$];
        break;
      case 177:
        $JSCompiler_StaticMethods_run$self$$.$f$ = $JSCompiler_StaticMethods_run$self$$.$SZP_TABLE$[$JSCompiler_StaticMethods_run$self$$.$a$ |= $JSCompiler_StaticMethods_run$self$$.$c$];
        break;
      case 178:
        $JSCompiler_StaticMethods_run$self$$.$f$ = $JSCompiler_StaticMethods_run$self$$.$SZP_TABLE$[$JSCompiler_StaticMethods_run$self$$.$a$ |= $JSCompiler_StaticMethods_run$self$$.$d$];
        break;
      case 179:
        $JSCompiler_StaticMethods_run$self$$.$f$ = $JSCompiler_StaticMethods_run$self$$.$SZP_TABLE$[$JSCompiler_StaticMethods_run$self$$.$a$ |= $JSCompiler_StaticMethods_run$self$$.$e$];
        break;
      case 180:
        $JSCompiler_StaticMethods_run$self$$.$f$ = $JSCompiler_StaticMethods_run$self$$.$SZP_TABLE$[$JSCompiler_StaticMethods_run$self$$.$a$ |= $JSCompiler_StaticMethods_run$self$$.$h$];
        break;
      case 181:
        $JSCompiler_StaticMethods_run$self$$.$f$ = $JSCompiler_StaticMethods_run$self$$.$SZP_TABLE$[$JSCompiler_StaticMethods_run$self$$.$a$ |= $JSCompiler_StaticMethods_run$self$$.$l$];
        break;
      case 182:
        $JSCompiler_StaticMethods_run$self$$.$f$ = $JSCompiler_StaticMethods_run$self$$.$SZP_TABLE$[$JSCompiler_StaticMethods_run$self$$.$a$ |= $JSCompiler_StaticMethods_run$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_run$self$$))];
        break;
      case 183:
        $JSCompiler_StaticMethods_run$self$$.$f$ = $JSCompiler_StaticMethods_run$self$$.$SZP_TABLE$[$JSCompiler_StaticMethods_run$self$$.$a$];
        break;
      case 184:
        $JSCompiler_StaticMethods_cp_a$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$b$);
        break;
      case 185:
        $JSCompiler_StaticMethods_cp_a$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$c$);
        break;
      case 186:
        $JSCompiler_StaticMethods_cp_a$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$d$);
        break;
      case 187:
        $JSCompiler_StaticMethods_cp_a$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$e$);
        break;
      case 188:
        $JSCompiler_StaticMethods_cp_a$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$h$);
        break;
      case 189:
        $JSCompiler_StaticMethods_cp_a$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$l$);
        break;
      case 190:
        $JSCompiler_StaticMethods_cp_a$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$readMem$($JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_run$self$$)));
        break;
      case 191:
        $JSCompiler_StaticMethods_cp_a$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$a$);
        break;
      case 192:
        $JSCompiler_StaticMethods_ret$$($JSCompiler_StaticMethods_run$self$$, 0 == ($JSCompiler_StaticMethods_run$self$$.$f$ & 64));
        break;
      case 193:
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$ = 
        $JSCompiler_StaticMethods_run$self$$;
        $carry$$inline_81_carry$$inline_87_carry$$inline_90_carry$$inline_93_instructionsNumber_temp$$inline_106_temp$$inline_109_temp$$inline_112_temp$$inline_84_temp$$inline_96_value$$inline_103_value$$inline_174$$ = $JSCompiler_StaticMethods_run$self$$.$readMemWord$($JSCompiler_StaticMethods_run$self$$.$sp$);
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$b$ = 
        $carry$$inline_81_carry$$inline_87_carry$$inline_90_carry$$inline_93_instructionsNumber_temp$$inline_106_temp$$inline_109_temp$$inline_112_temp$$inline_84_temp$$inline_96_value$$inline_103_value$$inline_174$$ >> 8;
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$c$ = 
        $carry$$inline_81_carry$$inline_87_carry$$inline_90_carry$$inline_93_instructionsNumber_temp$$inline_106_temp$$inline_109_temp$$inline_112_temp$$inline_84_temp$$inline_96_value$$inline_103_value$$inline_174$$ & 255;
        $JSCompiler_StaticMethods_run$self$$.$sp$ += 2;
        break;
      case 194:
        $JSCompiler_StaticMethods_jp$$($JSCompiler_StaticMethods_run$self$$, 0 == ($JSCompiler_StaticMethods_run$self$$.$f$ & 64));
        break;
      case 195:
        $JSCompiler_StaticMethods_run$self$$.$pc$ = $JSCompiler_StaticMethods_run$self$$.$readMemWord$($JSCompiler_StaticMethods_run$self$$.$pc$);
        break;
      case 196:
        $JSCompiler_StaticMethods_run$self$$.call(0 == ($JSCompiler_StaticMethods_run$self$$.$f$ & 64));
        break;
      case 197:
        $JSCompiler_StaticMethods_push2$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$b$, $JSCompiler_StaticMethods_run$self$$.$c$);
        break;
      case 198:
        $JSCompiler_StaticMethods_add_a$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$readMem$($JSCompiler_StaticMethods_run$self$$.$pc$++));
        break;
      case 199:
        $JSCompiler_StaticMethods_push1$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$pc$);
        $JSCompiler_StaticMethods_run$self$$.$pc$ = 0;
        break;
      case 200:
        $JSCompiler_StaticMethods_ret$$($JSCompiler_StaticMethods_run$self$$, 0 != ($JSCompiler_StaticMethods_run$self$$.$f$ & 64));
        break;
      case 201:
        $JSCompiler_StaticMethods_run$self$$.$pc$ = $JSCompiler_StaticMethods_run$self$$.$readMemWord$($JSCompiler_StaticMethods_run$self$$.$sp$);
        $JSCompiler_StaticMethods_run$self$$.$sp$ += 2;
        break;
      case 202:
        $JSCompiler_StaticMethods_jp$$($JSCompiler_StaticMethods_run$self$$, 0 != ($JSCompiler_StaticMethods_run$self$$.$f$ & 64));
        break;
      case 203:
        $JSCompiler_StaticMethods_doCB$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$readMem$($JSCompiler_StaticMethods_run$self$$.$pc$++));
        break;
      case 204:
        $JSCompiler_StaticMethods_run$self$$.call(0 != ($JSCompiler_StaticMethods_run$self$$.$f$ & 64));
        break;
      case 205:
        $JSCompiler_StaticMethods_push1$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$pc$ + 2);
        $JSCompiler_StaticMethods_run$self$$.$pc$ = $JSCompiler_StaticMethods_run$self$$.$readMemWord$($JSCompiler_StaticMethods_run$self$$.$pc$);
        break;
      case 206:
        $JSCompiler_StaticMethods_adc_a$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$readMem$($JSCompiler_StaticMethods_run$self$$.$pc$++));
        break;
      case 207:
        $JSCompiler_StaticMethods_push1$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$pc$);
        $JSCompiler_StaticMethods_run$self$$.$pc$ = 8;
        break;
      case 208:
        $JSCompiler_StaticMethods_ret$$($JSCompiler_StaticMethods_run$self$$, 0 == ($JSCompiler_StaticMethods_run$self$$.$f$ & 1));
        break;
      case 209:
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$ = 
        $JSCompiler_StaticMethods_run$self$$;
        $carry$$inline_81_carry$$inline_87_carry$$inline_90_carry$$inline_93_instructionsNumber_temp$$inline_106_temp$$inline_109_temp$$inline_112_temp$$inline_84_temp$$inline_96_value$$inline_103_value$$inline_174$$ = $JSCompiler_StaticMethods_run$self$$.$readMemWord$($JSCompiler_StaticMethods_run$self$$.$sp$);
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$d$ = 
        $carry$$inline_81_carry$$inline_87_carry$$inline_90_carry$$inline_93_instructionsNumber_temp$$inline_106_temp$$inline_109_temp$$inline_112_temp$$inline_84_temp$$inline_96_value$$inline_103_value$$inline_174$$ >> 8;
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$e$ = 
        $carry$$inline_81_carry$$inline_87_carry$$inline_90_carry$$inline_93_instructionsNumber_temp$$inline_106_temp$$inline_109_temp$$inline_112_temp$$inline_84_temp$$inline_96_value$$inline_103_value$$inline_174$$ & 255;
        $JSCompiler_StaticMethods_run$self$$.$sp$ += 2;
        break;
      case 210:
        $JSCompiler_StaticMethods_jp$$($JSCompiler_StaticMethods_run$self$$, 0 == ($JSCompiler_StaticMethods_run$self$$.$f$ & 1));
        break;
      case 211:
        $JSCompiler_StaticMethods_out$$($JSCompiler_StaticMethods_run$self$$.port, $JSCompiler_StaticMethods_run$self$$.$readMem$($JSCompiler_StaticMethods_run$self$$.$pc$++), $JSCompiler_StaticMethods_run$self$$.$a$);
        break;
      case 212:
        $JSCompiler_StaticMethods_run$self$$.call(0 == ($JSCompiler_StaticMethods_run$self$$.$f$ & 1));
        break;
      case 213:
        $JSCompiler_StaticMethods_push2$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$d$, $JSCompiler_StaticMethods_run$self$$.$e$);
        break;
      case 214:
        $JSCompiler_StaticMethods_sub_a$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$readMem$($JSCompiler_StaticMethods_run$self$$.$pc$++));
        break;
      case 215:
        $JSCompiler_StaticMethods_push1$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$pc$);
        $JSCompiler_StaticMethods_run$self$$.$pc$ = 16;
        break;
      case 216:
        $JSCompiler_StaticMethods_ret$$($JSCompiler_StaticMethods_run$self$$, 0 != ($JSCompiler_StaticMethods_run$self$$.$f$ & 1));
        break;
      case 217:
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$ = 
        $JSCompiler_StaticMethods_run$self$$;
        $carry$$inline_81_carry$$inline_87_carry$$inline_90_carry$$inline_93_instructionsNumber_temp$$inline_106_temp$$inline_109_temp$$inline_112_temp$$inline_84_temp$$inline_96_value$$inline_103_value$$inline_174$$ = $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$b$;
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$b$ = 
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$b2$;
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$b2$ = 
        $carry$$inline_81_carry$$inline_87_carry$$inline_90_carry$$inline_93_instructionsNumber_temp$$inline_106_temp$$inline_109_temp$$inline_112_temp$$inline_84_temp$$inline_96_value$$inline_103_value$$inline_174$$;
        $carry$$inline_81_carry$$inline_87_carry$$inline_90_carry$$inline_93_instructionsNumber_temp$$inline_106_temp$$inline_109_temp$$inline_112_temp$$inline_84_temp$$inline_96_value$$inline_103_value$$inline_174$$ = $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$c$;
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$c$ = 
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$c2$;
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$c2$ = 
        $carry$$inline_81_carry$$inline_87_carry$$inline_90_carry$$inline_93_instructionsNumber_temp$$inline_106_temp$$inline_109_temp$$inline_112_temp$$inline_84_temp$$inline_96_value$$inline_103_value$$inline_174$$;
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$ = 
        $JSCompiler_StaticMethods_run$self$$;
        $carry$$inline_81_carry$$inline_87_carry$$inline_90_carry$$inline_93_instructionsNumber_temp$$inline_106_temp$$inline_109_temp$$inline_112_temp$$inline_84_temp$$inline_96_value$$inline_103_value$$inline_174$$ = $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$d$;
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$d$ = 
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$d2$;
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$d2$ = 
        $carry$$inline_81_carry$$inline_87_carry$$inline_90_carry$$inline_93_instructionsNumber_temp$$inline_106_temp$$inline_109_temp$$inline_112_temp$$inline_84_temp$$inline_96_value$$inline_103_value$$inline_174$$;
        $carry$$inline_81_carry$$inline_87_carry$$inline_90_carry$$inline_93_instructionsNumber_temp$$inline_106_temp$$inline_109_temp$$inline_112_temp$$inline_84_temp$$inline_96_value$$inline_103_value$$inline_174$$ = $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$e$;
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$e$ = 
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$e2$;
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$e2$ = 
        $carry$$inline_81_carry$$inline_87_carry$$inline_90_carry$$inline_93_instructionsNumber_temp$$inline_106_temp$$inline_109_temp$$inline_112_temp$$inline_84_temp$$inline_96_value$$inline_103_value$$inline_174$$;
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$ = 
        $JSCompiler_StaticMethods_run$self$$;
        $carry$$inline_81_carry$$inline_87_carry$$inline_90_carry$$inline_93_instructionsNumber_temp$$inline_106_temp$$inline_109_temp$$inline_112_temp$$inline_84_temp$$inline_96_value$$inline_103_value$$inline_174$$ = $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$h$;
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$h$ = 
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$h2$;
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$h2$ = 
        $carry$$inline_81_carry$$inline_87_carry$$inline_90_carry$$inline_93_instructionsNumber_temp$$inline_106_temp$$inline_109_temp$$inline_112_temp$$inline_84_temp$$inline_96_value$$inline_103_value$$inline_174$$;
        $carry$$inline_81_carry$$inline_87_carry$$inline_90_carry$$inline_93_instructionsNumber_temp$$inline_106_temp$$inline_109_temp$$inline_112_temp$$inline_84_temp$$inline_96_value$$inline_103_value$$inline_174$$ = $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$l$;
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$l$ = 
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$l2$;
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$.$l2$ = 
        $carry$$inline_81_carry$$inline_87_carry$$inline_90_carry$$inline_93_instructionsNumber_temp$$inline_106_temp$$inline_109_temp$$inline_112_temp$$inline_84_temp$$inline_96_value$$inline_103_value$$inline_174$$;
        break;
      case 218:
        $JSCompiler_StaticMethods_jp$$($JSCompiler_StaticMethods_run$self$$, 0 != ($JSCompiler_StaticMethods_run$self$$.$f$ & 1));
        break;
      case 219:
        $JSCompiler_StaticMethods_run$self$$.$a$ = $JSCompiler_StaticMethods_in_$$($JSCompiler_StaticMethods_run$self$$.port, $JSCompiler_StaticMethods_run$self$$.$readMem$($JSCompiler_StaticMethods_run$self$$.$pc$++));
        break;
      case 220:
        $JSCompiler_StaticMethods_run$self$$.call(0 != ($JSCompiler_StaticMethods_run$self$$.$f$ & 1));
        break;
      case 221:
        $JSCompiler_StaticMethods_doIndexOpIX$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$readMem$($JSCompiler_StaticMethods_run$self$$.$pc$++));
        break;
      case 222:
        $JSCompiler_StaticMethods_sbc_a$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$readMem$($JSCompiler_StaticMethods_run$self$$.$pc$++));
        break;
      case 223:
        $JSCompiler_StaticMethods_push1$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$pc$);
        $JSCompiler_StaticMethods_run$self$$.$pc$ = 24;
        break;
      case 224:
        $JSCompiler_StaticMethods_ret$$($JSCompiler_StaticMethods_run$self$$, 0 == ($JSCompiler_StaticMethods_run$self$$.$f$ & 4));
        break;
      case 225:
        $JSCompiler_StaticMethods_setHL$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$readMemWord$($JSCompiler_StaticMethods_run$self$$.$sp$));
        $JSCompiler_StaticMethods_run$self$$.$sp$ += 2;
        break;
      case 226:
        $JSCompiler_StaticMethods_jp$$($JSCompiler_StaticMethods_run$self$$, 0 == ($JSCompiler_StaticMethods_run$self$$.$f$ & 4));
        break;
      case 227:
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$ = 
        $JSCompiler_StaticMethods_run$self$$.$h$;
        $JSCompiler_StaticMethods_run$self$$.$h$ = $JSCompiler_StaticMethods_run$self$$.$readMem$($JSCompiler_StaticMethods_run$self$$.$sp$ + 1);
        $JSCompiler_StaticMethods_run$self$$.$writeMem$($JSCompiler_StaticMethods_run$self$$.$sp$ + 1, $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$);
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$ = 
        $JSCompiler_StaticMethods_run$self$$.$l$;
        $JSCompiler_StaticMethods_run$self$$.$l$ = $JSCompiler_StaticMethods_run$self$$.$readMem$($JSCompiler_StaticMethods_run$self$$.$sp$);
        $JSCompiler_StaticMethods_run$self$$.$writeMem$($JSCompiler_StaticMethods_run$self$$.$sp$, $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$);
        break;
      case 228:
        $JSCompiler_StaticMethods_run$self$$.call(0 == ($JSCompiler_StaticMethods_run$self$$.$f$ & 4));
        break;
      case 229:
        $JSCompiler_StaticMethods_push2$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$h$, $JSCompiler_StaticMethods_run$self$$.$l$);
        break;
      case 230:
        $JSCompiler_StaticMethods_run$self$$.$f$ = $JSCompiler_StaticMethods_run$self$$.$SZP_TABLE$[$JSCompiler_StaticMethods_run$self$$.$a$ &= $JSCompiler_StaticMethods_run$self$$.$readMem$($JSCompiler_StaticMethods_run$self$$.$pc$++)] | 16;
        break;
      case 231:
        $JSCompiler_StaticMethods_push1$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$pc$);
        $JSCompiler_StaticMethods_run$self$$.$pc$ = 32;
        break;
      case 232:
        $JSCompiler_StaticMethods_ret$$($JSCompiler_StaticMethods_run$self$$, 0 != ($JSCompiler_StaticMethods_run$self$$.$f$ & 4));
        break;
      case 233:
        $JSCompiler_StaticMethods_run$self$$.$pc$ = $JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_run$self$$);
        break;
      case 234:
        $JSCompiler_StaticMethods_jp$$($JSCompiler_StaticMethods_run$self$$, 0 != ($JSCompiler_StaticMethods_run$self$$.$f$ & 4));
        break;
      case 235:
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$ = 
        $JSCompiler_StaticMethods_run$self$$.$d$;
        $JSCompiler_StaticMethods_run$self$$.$d$ = $JSCompiler_StaticMethods_run$self$$.$h$;
        $JSCompiler_StaticMethods_run$self$$.$h$ = $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$;
        $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$ = 
        $JSCompiler_StaticMethods_run$self$$.$e$;
        $JSCompiler_StaticMethods_run$self$$.$e$ = $JSCompiler_StaticMethods_run$self$$.$l$;
        $JSCompiler_StaticMethods_run$self$$.$l$ = $JSCompiler_StaticMethods_ccf$self$$inline_100_JSCompiler_StaticMethods_cpl_a$self$$inline_98_JSCompiler_StaticMethods_daa$self$$inline_95_JSCompiler_StaticMethods_exAF$self$$inline_83_JSCompiler_StaticMethods_exBC$self$$inline_105_JSCompiler_StaticMethods_exDE$self$$inline_108_JSCompiler_StaticMethods_exHL$self$$inline_111_JSCompiler_StaticMethods_incBC$self$$inline_78_JSCompiler_StaticMethods_rla_a$self$$inline_89_JSCompiler_StaticMethods_rlca_a$self$$inline_80_JSCompiler_StaticMethods_rra_a$self$$inline_92_JSCompiler_StaticMethods_rrca_a$self$$inline_86_JSCompiler_StaticMethods_setBC$self$$inline_173_JSCompiler_StaticMethods_setDE$self$$inline_102_location$$23_opcode$$7_temp$$41$$;
        break;
      case 236:
        $JSCompiler_StaticMethods_run$self$$.call(0 != ($JSCompiler_StaticMethods_run$self$$.$f$ & 4));
        break;
      case 237:
        $JSCompiler_StaticMethods_doED$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$readMem$($JSCompiler_StaticMethods_run$self$$.$pc$));
        break;
      case 238:
        $JSCompiler_StaticMethods_run$self$$.$f$ = $JSCompiler_StaticMethods_run$self$$.$SZP_TABLE$[$JSCompiler_StaticMethods_run$self$$.$a$ ^= $JSCompiler_StaticMethods_run$self$$.$readMem$($JSCompiler_StaticMethods_run$self$$.$pc$++)];
        break;
      case 239:
        $JSCompiler_StaticMethods_push1$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$pc$);
        $JSCompiler_StaticMethods_run$self$$.$pc$ = 40;
        break;
      case 240:
        $JSCompiler_StaticMethods_ret$$($JSCompiler_StaticMethods_run$self$$, 0 == ($JSCompiler_StaticMethods_run$self$$.$f$ & 128));
        break;
      case 241:
        $JSCompiler_StaticMethods_run$self$$.$f$ = $JSCompiler_StaticMethods_run$self$$.$readMem$($JSCompiler_StaticMethods_run$self$$.$sp$++);
        $JSCompiler_StaticMethods_run$self$$.$a$ = $JSCompiler_StaticMethods_run$self$$.$readMem$($JSCompiler_StaticMethods_run$self$$.$sp$++);
        break;
      case 242:
        $JSCompiler_StaticMethods_jp$$($JSCompiler_StaticMethods_run$self$$, 0 == ($JSCompiler_StaticMethods_run$self$$.$f$ & 128));
        break;
      case 243:
        $JSCompiler_StaticMethods_run$self$$.$iff1$ = $JSCompiler_StaticMethods_run$self$$.$iff2$ = $JSCompiler_alias_FALSE$$;
        $JSCompiler_StaticMethods_run$self$$.$EI_inst$ = $JSCompiler_alias_TRUE$$;
        break;
      case 244:
        $JSCompiler_StaticMethods_run$self$$.call(0 == ($JSCompiler_StaticMethods_run$self$$.$f$ & 128));
        break;
      case 245:
        $JSCompiler_StaticMethods_push2$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$a$, $JSCompiler_StaticMethods_run$self$$.$f$);
        break;
      case 246:
        $JSCompiler_StaticMethods_run$self$$.$f$ = $JSCompiler_StaticMethods_run$self$$.$SZP_TABLE$[$JSCompiler_StaticMethods_run$self$$.$a$ |= $JSCompiler_StaticMethods_run$self$$.$readMem$($JSCompiler_StaticMethods_run$self$$.$pc$++)];
        break;
      case 247:
        $JSCompiler_StaticMethods_push1$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$pc$);
        $JSCompiler_StaticMethods_run$self$$.$pc$ = 48;
        break;
      case 248:
        $JSCompiler_StaticMethods_ret$$($JSCompiler_StaticMethods_run$self$$, 0 != ($JSCompiler_StaticMethods_run$self$$.$f$ & 128));
        break;
      case 249:
        $JSCompiler_StaticMethods_run$self$$.$sp$ = $JSCompiler_StaticMethods_getHL$$($JSCompiler_StaticMethods_run$self$$);
        break;
      case 250:
        $JSCompiler_StaticMethods_jp$$($JSCompiler_StaticMethods_run$self$$, 0 != ($JSCompiler_StaticMethods_run$self$$.$f$ & 128));
        break;
      case 251:
        $JSCompiler_StaticMethods_run$self$$.$iff1$ = $JSCompiler_StaticMethods_run$self$$.$iff2$ = $JSCompiler_StaticMethods_run$self$$.$EI_inst$ = $JSCompiler_alias_TRUE$$;
        break;
      case 252:
        $JSCompiler_StaticMethods_run$self$$.call(0 != ($JSCompiler_StaticMethods_run$self$$.$f$ & 128));
        break;
      case 253:
        $JSCompiler_StaticMethods_doIndexOpIY$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$readMem$($JSCompiler_StaticMethods_run$self$$.$pc$++));
        break;
      case 254:
        $JSCompiler_StaticMethods_cp_a$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$readMem$($JSCompiler_StaticMethods_run$self$$.$pc$++));
        break;
      case 255:
        $JSCompiler_StaticMethods_push1$$($JSCompiler_StaticMethods_run$self$$, $JSCompiler_StaticMethods_run$self$$.$pc$), $JSCompiler_StaticMethods_run$self$$.$pc$ = 56
    }
  }
}
;function $JSSMS$Keyboard$$($sms$$1$$) {
  this.$main$ = $sms$$1$$;
  this.$lightgunY$ = this.$lightgunX$ = this.$ggstart$ = this.$controller2$ = this.$controller1$ = 0;
  this.$lightgunEnabled$ = this.$lightgunClick$ = $JSCompiler_alias_FALSE$$
}
$JSSMS$Keyboard$$.prototype = {reset:function $$JSSMS$Keyboard$$$$reset$() {
  this.$ggstart$ = this.$controller2$ = this.$controller1$ = 255;
  this.$pause_button$ = $JSCompiler_alias_FALSE$$
}, keydown:function $$JSSMS$Keyboard$$$$keydown$($evt$$16$$) {
  switch($evt$$16$$.keyCode) {
    case 38:
      this.$controller1$ &= -2;
      break;
    case 40:
      this.$controller1$ &= -3;
      break;
    case 37:
      this.$controller1$ &= -5;
      break;
    case 39:
      this.$controller1$ &= -9;
      break;
    case 88:
      this.$controller1$ &= -17;
      break;
    case 90:
      this.$controller1$ &= -33;
      break;
    case 13:
      this.$main$.$is_sms$ ? this.$main$.$pause_button$ = $JSCompiler_alias_TRUE$$ : this.$ggstart$ &= -129;
      break;
    case 104:
      this.$controller2$ &= -2;
      break;
    case 98:
      this.$controller2$ &= -3;
      break;
    case 100:
      this.$controller2$ &= -5;
      break;
    case 102:
      this.$controller2$ &= -9;
      break;
    case 103:
      this.$controller2$ &= -17;
      break;
    case 105:
      this.$controller2$ &= -33;
      break;
    case 97:
      this.$controller2$ &= -65;
      break;
    default:
      return
  }
  $evt$$16$$.preventDefault()
}, keyup:function $$JSSMS$Keyboard$$$$keyup$($evt$$17$$) {
  switch($evt$$17$$.keyCode) {
    case 38:
      this.$controller1$ |= 1;
      break;
    case 40:
      this.$controller1$ |= 2;
      break;
    case 37:
      this.$controller1$ |= 4;
      break;
    case 39:
      this.$controller1$ |= 8;
      break;
    case 88:
      this.$controller1$ |= 16;
      break;
    case 90:
      this.$controller1$ |= 32;
      break;
    case 13:
      this.$main$.$is_sms$ || (this.$ggstart$ |= 128);
      break;
    case 104:
      this.$controller2$ |= 1;
      break;
    case 98:
      this.$controller2$ |= 2;
      break;
    case 100:
      this.$controller2$ |= 4;
      break;
    case 102:
      this.$controller2$ |= 8;
      break;
    case 103:
      this.$controller2$ |= 16;
      break;
    case 105:
      this.$controller2$ |= 32;
      break;
    case 97:
      this.$controller2$ |= 64;
      break;
    default:
      return
  }
  $evt$$17$$.preventDefault()
}};
var $NO_ANTIALIAS$$ = Number.MIN_VALUE, $PSG_VOLUME$$ = [25, 20, 16, 13, 10, 8, 6, 5, 4, 3, 3, 2, 2, 1, 1, 0];
function $JSSMS$SN76489$$($sms$$2$$) {
  this.$main$ = $sms$$2$$;
  this.$clockFrac$ = this.$clock$ = 0;
  this.$reg$ = Array(8);
  this.$regLatch$ = 0;
  this.$freqCounter$ = Array(4);
  this.$freqPolarity$ = Array(4);
  this.$freqPos$ = Array(3);
  this.$noiseFreq$ = 16;
  this.$noiseShiftReg$ = 32768;
  this.$outputChannel$ = Array(4)
}
$JSSMS$SN76489$$.prototype = {$init$:function $$JSSMS$SN76489$$$$$init$$($clockSpeed$$, $sampleRate$$) {
  this.$clock$ = ($clockSpeed$$ << 8) / 16 / $sampleRate$$;
  this.$regLatch$ = this.$clockFrac$ = 0;
  this.$noiseFreq$ = 16;
  this.$noiseShiftReg$ = 32768;
  for(var $i$$14$$ = 0;4 > $i$$14$$;$i$$14$$++) {
    this.$reg$[$i$$14$$ << 1] = 1, this.$reg$[($i$$14$$ << 1) + 1] = 15, this.$freqCounter$[$i$$14$$] = 0, this.$freqPolarity$[$i$$14$$] = 1, 3 != $i$$14$$ && (this.$freqPos$[$i$$14$$] = $NO_ANTIALIAS$$)
  }
}, write:function $$JSSMS$SN76489$$$$write$($value$$82$$) {
  0 != ($value$$82$$ & 128) ? (this.$regLatch$ = $value$$82$$ >> 4 & 7, this.$reg$[this.$regLatch$] = this.$reg$[this.$regLatch$] & 1008 | $value$$82$$ & 15) : this.$reg$[this.$regLatch$] = 0 == this.$regLatch$ || 2 == this.$regLatch$ || 4 == this.$regLatch$ ? this.$reg$[this.$regLatch$] & 15 | ($value$$82$$ & 63) << 4 : $value$$82$$ & 15;
  switch(this.$regLatch$) {
    case 0:
    ;
    case 2:
    ;
    case 4:
      0 == this.$reg$[this.$regLatch$] && (this.$reg$[this.$regLatch$] = 1);
      break;
    case 6:
      this.$noiseFreq$ = 16 << (this.$reg$[6] & 3), this.$noiseShiftReg$ = 32768
  }
}, update:function $$JSSMS$SN76489$$$$update$($offset$$18$$, $samplesToGenerate$$1$$) {
  for(var $buffer$$9$$ = [], $sample$$ = 0, $feedback_i$$15_output$$ = 0;$sample$$ < $samplesToGenerate$$1$$;$sample$$++) {
    for($feedback_i$$15_output$$ = 0;3 > $feedback_i$$15_output$$;$feedback_i$$15_output$$++) {
      this.$outputChannel$[$feedback_i$$15_output$$] = this.$freqPos$[$feedback_i$$15_output$$] != $NO_ANTIALIAS$$ ? $PSG_VOLUME$$[this.$reg$[($feedback_i$$15_output$$ << 1) + 1]] * this.$freqPos$[$feedback_i$$15_output$$] >> 8 : $PSG_VOLUME$$[this.$reg$[($feedback_i$$15_output$$ << 1) + 1]] * this.$freqPolarity$[$feedback_i$$15_output$$]
    }
    this.$outputChannel$[3] = $PSG_VOLUME$$[this.$reg$[7]] * (this.$noiseShiftReg$ & 1) << 1;
    $feedback_i$$15_output$$ = this.$outputChannel$[0] + this.$outputChannel$[1] + this.$outputChannel$[2] + this.$outputChannel$[3];
    127 < $feedback_i$$15_output$$ ? $feedback_i$$15_output$$ = 127 : -128 > $feedback_i$$15_output$$ && ($feedback_i$$15_output$$ = -128);
    $buffer$$9$$[$offset$$18$$ + $sample$$] = $feedback_i$$15_output$$;
    this.$clockFrac$ += this.$clock$;
    var $clockCycles$$ = this.$clockFrac$ >> 8, $clockCyclesScaled$$ = $clockCycles$$ << 8;
    this.$clockFrac$ -= $clockCyclesScaled$$;
    this.$freqCounter$[0] -= $clockCycles$$;
    this.$freqCounter$[1] -= $clockCycles$$;
    this.$freqCounter$[2] -= $clockCycles$$;
    this.$freqCounter$[3] = 128 == this.$noiseFreq$ ? this.$freqCounter$[2] : this.$freqCounter$[3] - $clockCycles$$;
    for($feedback_i$$15_output$$ = 0;3 > $feedback_i$$15_output$$;$feedback_i$$15_output$$++) {
      var $counter$$ = this.$freqCounter$[$feedback_i$$15_output$$];
      if(0 >= $counter$$) {
        var $tone$$ = this.$reg$[$feedback_i$$15_output$$ << 1];
        6 < $tone$$ ? (this.$freqPos$[$feedback_i$$15_output$$] = ($clockCyclesScaled$$ - this.$clockFrac$ + 512 * $counter$$ << 8) * this.$freqPolarity$[$feedback_i$$15_output$$] / ($clockCyclesScaled$$ + this.$clockFrac$), this.$freqPolarity$[$feedback_i$$15_output$$] = -this.$freqPolarity$[$feedback_i$$15_output$$]) : (this.$freqPolarity$[$feedback_i$$15_output$$] = 1, this.$freqPos$[$feedback_i$$15_output$$] = $NO_ANTIALIAS$$);
        this.$freqCounter$[$feedback_i$$15_output$$] += $tone$$ * ($clockCycles$$ / $tone$$ + 1)
      }else {
        this.$freqPos$[$feedback_i$$15_output$$] = $NO_ANTIALIAS$$
      }
    }
    0 >= this.$freqCounter$[3] && (this.$freqPolarity$[3] = -this.$freqPolarity$[3], 128 != this.$noiseFreq$ && (this.$freqCounter$[3] += this.$noiseFreq$ * ($clockCycles$$ / this.$noiseFreq$ + 1)), 1 == this.$freqPolarity$[3] && ($feedback_i$$15_output$$ = 0, $feedback_i$$15_output$$ = 0 != (this.$reg$[6] & 4) ? 0 != (this.$noiseShiftReg$ & 9) && 0 != (this.$noiseShiftReg$ & 9 ^ 9) ? 1 : 0 : this.$noiseShiftReg$ & 1, this.$noiseShiftReg$ = this.$noiseShiftReg$ >> 1 | $feedback_i$$15_output$$ << 
    15))
  }
  return $buffer$$9$$
}};
function $JSSMS$Vdp$$($i$$inline_115_sms$$3$$) {
  this.$main$ = $i$$inline_115_sms$$3$$;
  var $i$$16$$;
  this.$videoMode$ = 0;
  this.$VRAM$ = Array(16384);
  this.$CRAM$ = Array(96);
  for($i$$16$$ = 0;96 > $i$$16$$;$i$$16$$++) {
    this.$CRAM$[$i$$16$$] = 255
  }
  this.$vdpreg$ = Array(16);
  this.status = 0;
  this.$firstByte$ = $JSCompiler_alias_FALSE$$;
  this.$counter$ = this.$line$ = this.$readBuffer$ = this.$operation$ = this.location = this.$commandByte$ = 0;
  this.$bgPriority$ = Array(256);
  this.$vScrollLatch$ = this.$bgt$ = 0;
  this.display = $i$$inline_115_sms$$3$$.$ui$.$canvasImageData$.data;
  this.$main_JAVA$ = Array(64);
  this.$GG_JAVA1$ = Array(256);
  this.$GG_JAVA2$ = Array(16);
  this.$isPalConverted$ = $JSCompiler_alias_FALSE$$;
  this.$sat$ = this.$h_end$ = this.$h_start$ = 0;
  this.$isSatDirty$ = $JSCompiler_alias_FALSE$$;
  this.$lineSprites$ = Array(192);
  for($i$$16$$ = 0;192 > $i$$16$$;$i$$16$$++) {
    this.$lineSprites$[$i$$16$$] = Array(25)
  }
  this.$tiles$ = Array(512);
  this.$isTileDirty$ = Array(512);
  for($i$$inline_115_sms$$3$$ = this.$maxDirty$ = this.$minDirty$ = 0;512 > $i$$inline_115_sms$$3$$;$i$$inline_115_sms$$3$$++) {
    this.$tiles$[$i$$inline_115_sms$$3$$] = Array(64)
  }
}
$JSSMS$Vdp$$.prototype = {reset:function $$JSSMS$Vdp$$$$reset$() {
  var $i$$17_i$$inline_118$$;
  this.$isPalConverted$ = $JSCompiler_alias_FALSE$$;
  var $r$$inline_119$$, $g$$inline_120$$, $b$$inline_121$$;
  if(this.$main$.$is_sms$ && !this.$isPalConverted$) {
    for($i$$17_i$$inline_118$$ = 0;64 > $i$$17_i$$inline_118$$;$i$$17_i$$inline_118$$++) {
      $r$$inline_119$$ = $i$$17_i$$inline_118$$ & 3, $g$$inline_120$$ = $i$$17_i$$inline_118$$ >> 2 & 3, $b$$inline_121$$ = $i$$17_i$$inline_118$$ >> 4 & 3, this.$main_JAVA$[$i$$17_i$$inline_118$$] = 85 * $r$$inline_119$$ | 85 * $g$$inline_120$$ << 8 | 85 * $b$$inline_121$$ << 16, this.$isPalConverted$ = $JSCompiler_alias_TRUE$$
    }
  }else {
    if(this.$main$.$is_gg$ && !this.$isPalConverted$) {
      for($i$$17_i$$inline_118$$ = 0;256 > $i$$17_i$$inline_118$$;$i$$17_i$$inline_118$$++) {
        $g$$inline_120$$ = $i$$17_i$$inline_118$$ & 15, $b$$inline_121$$ = $i$$17_i$$inline_118$$ >> 4 & 15, this.$GG_JAVA1$[$i$$17_i$$inline_118$$] = $b$$inline_121$$ << 12 | $b$$inline_121$$ << 8 | $g$$inline_120$$ << 4 | $g$$inline_120$$
      }
      for($i$$17_i$$inline_118$$ = 0;16 > $i$$17_i$$inline_118$$;$i$$17_i$$inline_118$$++) {
        this.$GG_JAVA2$[$i$$17_i$$inline_118$$] = $i$$17_i$$inline_118$$ << 20
      }
      this.$isPalConverted$ = $JSCompiler_alias_TRUE$$
    }
  }
  this.$firstByte$ = $JSCompiler_alias_TRUE$$;
  for($i$$17_i$$inline_118$$ = this.$operation$ = this.status = this.$counter$ = this.location = 0;16 > $i$$17_i$$inline_118$$;$i$$17_i$$inline_118$$++) {
    this.$vdpreg$[$i$$17_i$$inline_118$$] = 0
  }
  this.$vdpreg$[2] = 14;
  this.$vdpreg$[5] = 126;
  this.$vScrollLatch$ = 0;
  this.$main$.$cpu$.$interruptLine$ = $JSCompiler_alias_FALSE$$;
  this.$isSatDirty$ = $JSCompiler_alias_TRUE$$;
  this.$minDirty$ = 512;
  this.$maxDirty$ = -1;
  for($i$$17_i$$inline_118$$ = 0;16384 > $i$$17_i$$inline_118$$;$i$$17_i$$inline_118$$++) {
    this.$VRAM$[$i$$17_i$$inline_118$$] = 0
  }
  for($i$$17_i$$inline_118$$ = 0;196608 > $i$$17_i$$inline_118$$;$i$$17_i$$inline_118$$ += 4) {
    this.display[$i$$17_i$$inline_118$$] = 0, this.display[$i$$17_i$$inline_118$$ + 1] = 0, this.display[$i$$17_i$$inline_118$$ + 2] = 0, this.display[$i$$17_i$$inline_118$$ + 3] = 255
  }
}};
function $JSCompiler_StaticMethods_forceFullRedraw$$($JSCompiler_StaticMethods_forceFullRedraw$self$$) {
  $JSCompiler_StaticMethods_forceFullRedraw$self$$.$bgt$ = ($JSCompiler_StaticMethods_forceFullRedraw$self$$.$vdpreg$[2] & 14) << 10;
  $JSCompiler_StaticMethods_forceFullRedraw$self$$.$minDirty$ = 0;
  $JSCompiler_StaticMethods_forceFullRedraw$self$$.$maxDirty$ = 511;
  for(var $i$$18$$ = 0, $l$$1$$ = $JSCompiler_StaticMethods_forceFullRedraw$self$$.$isTileDirty$.length;$i$$18$$ < $l$$1$$;$i$$18$$++) {
    $JSCompiler_StaticMethods_forceFullRedraw$self$$.$isTileDirty$[$i$$18$$] = $JSCompiler_alias_TRUE$$
  }
  $JSCompiler_StaticMethods_forceFullRedraw$self$$.$sat$ = ($JSCompiler_StaticMethods_forceFullRedraw$self$$.$vdpreg$[5] & -130) << 7;
  $JSCompiler_StaticMethods_forceFullRedraw$self$$.$isSatDirty$ = $JSCompiler_alias_TRUE$$
}
;function $JSSMS$DummyUI$$($sms$$4$$) {
  this.$main$ = $sms$$4$$;
  this.enable = $JSCompiler_emptyFn$$();
  this.updateStatus = $JSCompiler_emptyFn$$();
  this.$writeAudio$ = $JSCompiler_emptyFn$$();
  this.$writeFrame$ = $JSCompiler_emptyFn$$()
}
"undefined" != typeof $ && ($.fn.$JSSMSUI$ = function $$$fn$$JSSMSUI$$($roms$$) {
  function $UI$$($root_sms$$5$$) {
    this.$main$ = $root_sms$$5$$;
    if("[object OperaMini]" == Object.prototype.toString.call(window.operamini)) {
      $($parent$$2$$).html('<div class="alert alert-error"><strong>Oh no!</strong> Your browser can\'t run this emulator. Try the latest version of Firefox, Google Chrome, Opera or Safari!</div>')
    }else {
      var $self$$5$$ = this;
      $root_sms$$5$$ = $("<div></div>");
      var $controls$$ = $('<div class="controls"></div>'), $fullscreenSupport$$ = $JSSMS$Utils$getPrefix$$(["fullscreenEnabled", "mozFullScreenEnabled", "webkitCancelFullScreen"]), $requestAnimationFramePrefix$$ = $JSSMS$Utils$getPrefix$$(["requestAnimationFrame", "msRequestAnimationFrame", "mozRequestAnimationFrame", "webkitRequestAnimationFrame", "oRequestAnimationFrame"], window), $i$$26$$;
      if($requestAnimationFramePrefix$$) {
        this.requestAnimationFrame = window[$requestAnimationFramePrefix$$].bind(window)
      }else {
        var $lastTime$$ = 0;
        this.requestAnimationFrame = function $this$requestAnimationFrame$($callback$$52$$) {
          var $currTime$$ = $JSSMS$Utils$getTimestamp$$(), $timeToCall$$ = Math.max(0, 16 - ($currTime$$ - $lastTime$$));
          window.setTimeout(function() {
            $callback$$52$$($currTime$$ + $timeToCall$$)
          }, $timeToCall$$);
          $lastTime$$ = $currTime$$ + $timeToCall$$
        }
      }
      this.$zoomed$ = $JSCompiler_alias_FALSE$$;
      this.$hiddenPrefix$ = $JSSMS$Utils$getPrefix$$(["hidden", "mozHidden", "webkitHidden", "msHidden"]);
      this.screen = $('<canvas width=256 height=192 class="screen"></canvas>');
      this.$canvasContext$ = this.screen[0].getContext("2d");
      if(this.$canvasContext$.getImageData) {
        this.$canvasImageData$ = this.$canvasContext$.getImageData(0, 0, 256, 192);
        this.$romContainer$ = $("<div></div>");
        this.$romSelect$ = $("<select></select>");
        this.$romSelect$.change(function() {
          $self$$5$$.$loadROM$()
        });
        this.$buttons$ = {start:$('<input type="button" value="Stop" class="btn" disabled="disabled">'), $restart$:$('<input type="button" value="Restart" class="btn" disabled="disabled">'), $sound$:$('<input type="button" value="Enable sound" class="btn" disabled="disabled">'), zoom:$('<input type="button" value="Zoom in" class="btn hidden-phone">')};
        this.$buttons$.start.click(function() {
          $self$$5$$.$main$.$isRunning$ ? ($self$$5$$.$main$.stop(), $self$$5$$.updateStatus("Paused"), $self$$5$$.$buttons$.start.attr("value", "Start")) : ($self$$5$$.$main$.start(), $self$$5$$.$buttons$.start.attr("value", "Stop"))
        });
        this.$buttons$.$restart$.click(function() {
          "" != $self$$5$$.$main$.$romData$ && "" != $self$$5$$.$main$.$romFileName$ && $JSCompiler_StaticMethods_readRomDirectly$$($self$$5$$.$main$, $self$$5$$.$main$.$romData$, $self$$5$$.$main$.$romFileName$) ? ($self$$5$$.$main$.reset(), $JSCompiler_StaticMethods_forceFullRedraw$$($self$$5$$.$main$.$vdp$), $self$$5$$.$main$.start()) : $(this).attr("disabled", "disabled")
        });
        this.$buttons$.$sound$.click($JSCompiler_emptyFn$$());
        this.$buttons$.zoom.click(function() {
          $self$$5$$.$zoomed$ ? ($self$$5$$.screen.animate({width:"256px", height:"192px"}, function() {
            $(this).removeAttr("style")
          }), $self$$5$$.$buttons$.zoom.attr("value", "Zoom in")) : ($self$$5$$.screen.animate({width:"512px", height:"384px"}), $self$$5$$.$buttons$.zoom.attr("value", "Zoom out"));
          $self$$5$$.$zoomed$ = !$self$$5$$.$zoomed$
        });
        $fullscreenSupport$$ && (this.$buttons$.$fullsreen$ = $('<input type="button" value="Go fullscreen" class="btn">').click(function() {
          var $screen$$1$$ = $self$$5$$.screen[0];
          $screen$$1$$.requestFullscreen ? $screen$$1$$.requestFullscreen() : $screen$$1$$.mozRequestFullScreen ? $screen$$1$$.mozRequestFullScreen() : $screen$$1$$.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT)
        }));
        for($i$$26$$ in this.$buttons$) {
          this.$buttons$.hasOwnProperty($i$$26$$) && this.$buttons$[$i$$26$$].appendTo($controls$$)
        }
        this.log = $('<div id="status"></div>');
        this.screen.appendTo($root_sms$$5$$);
        this.$romContainer$.appendTo($root_sms$$5$$);
        $controls$$.appendTo($root_sms$$5$$);
        this.log.appendTo($root_sms$$5$$);
        $root_sms$$5$$.appendTo($($parent$$2$$));
        $roms$$ != $JSCompiler_alias_VOID$$ && this.$setRoms$($roms$$);
        $(document).bind("keydown", function($evt$$18$$) {
          $self$$5$$.$main$.$keyboard$.keydown($evt$$18$$)
        }).bind("keyup", function($evt$$19$$) {
          $self$$5$$.$main$.$keyboard$.keyup($evt$$19$$)
        })
      }else {
        $($parent$$2$$).html('<div class="alert alert-error"><strong>Oh no!</strong> Your browser doesn\'t support writing pixels directly to the <code>&lt;canvas&gt;</code> tag. Try the latest version of Firefox, Google Chrome, Opera or Safari!</div>')
      }
    }
  }
  var $parent$$2$$ = this;
  $UI$$.prototype = {reset:function $$UI$$$$reset$() {
    this.screen[0].width = 256;
    this.screen[0].height = 192;
    this.log.text("")
  }, $setRoms$:function $$UI$$$$$setRoms$$($roms$$1$$) {
    var $groupName$$, $optgroup$$, $length$$16$$, $i$$27$$, $count$$7$$ = 0;
    this.$romSelect$.children().remove();
    $("<option>Select a ROM...</option>").appendTo(this.$romSelect$);
    for($groupName$$ in $roms$$1$$) {
      if($roms$$1$$.hasOwnProperty($groupName$$)) {
        $optgroup$$ = $("<optgroup></optgroup>").attr("label", $groupName$$);
        $length$$16$$ = $roms$$1$$[$groupName$$].length;
        for($i$$27$$ = 0;$i$$27$$ < $length$$16$$;$i$$27$$++) {
          $("<option>" + $roms$$1$$[$groupName$$][$i$$27$$][0] + "</option>").attr("value", $roms$$1$$[$groupName$$][$i$$27$$][1]).appendTo($optgroup$$)
        }
        $optgroup$$.appendTo(this.$romSelect$)
      }
      $count$$7$$++
    }
    $count$$7$$ && this.$romSelect$.appendTo(this.$romContainer$)
  }, $loadROM$:function $$UI$$$$$loadROM$$() {
    var $self$$6$$ = this;
    this.updateStatus("Downloading...");
    $.ajax({url:escape(this.$romSelect$.val()), xhr:function() {
      var $xhr$$ = $.ajaxSettings.xhr();
      $xhr$$.overrideMimeType != $JSCompiler_alias_VOID$$ && $xhr$$.overrideMimeType("text/plain; charset=x-user-defined");
      return $self$$6$$.xhr = $xhr$$
    }, complete:function($xhr$$1$$, $status$$) {
      var $data$$32$$;
      "error" == $status$$ ? $self$$6$$.updateStatus("The selected rom could not be loaded.") : ($data$$32$$ = $xhr$$1$$.responseText, $JSCompiler_StaticMethods_readRomDirectly$$($self$$6$$.$main$, $data$$32$$, $self$$6$$.$romSelect$.val()), $self$$6$$.$main$.reset(), $JSCompiler_StaticMethods_forceFullRedraw$$($self$$6$$.$main$.$vdp$), $self$$6$$.$main$.start(), $self$$6$$.enable(), $self$$6$$.$buttons$.start.removeAttr("disabled"))
    }})
  }, enable:function $$UI$$$$enable$() {
    this.$buttons$.$restart$.removeAttr("disabled");
    this.$main$.$soundEnabled$ ? this.$buttons$.$sound$.attr("value", "Disable sound") : this.$buttons$.$sound$.attr("value", "Enable sound")
  }, updateStatus:function $$UI$$$$updateStatus$($s$$3$$) {
    this.log.text($s$$3$$)
  }, $writeAudio$:$JSCompiler_emptyFn$$(), $writeFrame$:function $$UI$$$$$writeFrame$$() {
    (!this.$hiddenPrefix$ || !document[this.$hiddenPrefix$]) && this.$canvasContext$.putImageData(this.$canvasImageData$, 0, 0)
  }};
  return $UI$$
});
function $JSSMS$Ports$$($sms$$6$$) {
  this.$main$ = $sms$$6$$;
  this.$vdp$ = $sms$$6$$.$vdp$;
  this.$psg$ = $sms$$6$$.$psg$;
  this.$keyboard$ = $sms$$6$$.$keyboard$;
  this.$europe$ = 64;
  this.$hCounter$ = 0;
  this.$ioPorts$ = []
}
$JSSMS$Ports$$.prototype = {reset:function $$JSSMS$Ports$$$$reset$() {
  this.$ioPorts$ = Array(2)
}};
function $JSCompiler_StaticMethods_in_$$($JSCompiler_StaticMethods_in_$self$$, $port$$1$$) {
  if($JSCompiler_StaticMethods_in_$self$$.$main$.$is_gg$ && 7 > $port$$1$$) {
    switch($port$$1$$) {
      case 0:
        return $JSCompiler_StaticMethods_in_$self$$.$keyboard$.$ggstart$ & 191 | $JSCompiler_StaticMethods_in_$self$$.$europe$;
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
  switch($port$$1$$ & 193) {
    case 64:
      var $JSCompiler_StaticMethods_controlRead$self$$inline_128_JSCompiler_StaticMethods_dataRead$self$$inline_125_JSCompiler_StaticMethods_getVCount$self$$inline_123_JSCompiler_inline_result$$4$$;
      a: {
        $JSCompiler_StaticMethods_controlRead$self$$inline_128_JSCompiler_StaticMethods_dataRead$self$$inline_125_JSCompiler_StaticMethods_getVCount$self$$inline_123_JSCompiler_inline_result$$4$$ = $JSCompiler_StaticMethods_in_$self$$.$vdp$;
        if(0 == $JSCompiler_StaticMethods_controlRead$self$$inline_128_JSCompiler_StaticMethods_dataRead$self$$inline_125_JSCompiler_StaticMethods_getVCount$self$$inline_123_JSCompiler_inline_result$$4$$.$videoMode$) {
          if(218 < $JSCompiler_StaticMethods_controlRead$self$$inline_128_JSCompiler_StaticMethods_dataRead$self$$inline_125_JSCompiler_StaticMethods_getVCount$self$$inline_123_JSCompiler_inline_result$$4$$.$line$) {
            $JSCompiler_StaticMethods_controlRead$self$$inline_128_JSCompiler_StaticMethods_dataRead$self$$inline_125_JSCompiler_StaticMethods_getVCount$self$$inline_123_JSCompiler_inline_result$$4$$ = $JSCompiler_StaticMethods_controlRead$self$$inline_128_JSCompiler_StaticMethods_dataRead$self$$inline_125_JSCompiler_StaticMethods_getVCount$self$$inline_123_JSCompiler_inline_result$$4$$.$line$ - 6;
            break a
          }
        }else {
          if(242 < $JSCompiler_StaticMethods_controlRead$self$$inline_128_JSCompiler_StaticMethods_dataRead$self$$inline_125_JSCompiler_StaticMethods_getVCount$self$$inline_123_JSCompiler_inline_result$$4$$.$line$) {
            $JSCompiler_StaticMethods_controlRead$self$$inline_128_JSCompiler_StaticMethods_dataRead$self$$inline_125_JSCompiler_StaticMethods_getVCount$self$$inline_123_JSCompiler_inline_result$$4$$ = $JSCompiler_StaticMethods_controlRead$self$$inline_128_JSCompiler_StaticMethods_dataRead$self$$inline_125_JSCompiler_StaticMethods_getVCount$self$$inline_123_JSCompiler_inline_result$$4$$.$line$ - 57;
            break a
          }
        }
        $JSCompiler_StaticMethods_controlRead$self$$inline_128_JSCompiler_StaticMethods_dataRead$self$$inline_125_JSCompiler_StaticMethods_getVCount$self$$inline_123_JSCompiler_inline_result$$4$$ = $JSCompiler_StaticMethods_controlRead$self$$inline_128_JSCompiler_StaticMethods_dataRead$self$$inline_125_JSCompiler_StaticMethods_getVCount$self$$inline_123_JSCompiler_inline_result$$4$$.$line$
      }
      return $JSCompiler_StaticMethods_controlRead$self$$inline_128_JSCompiler_StaticMethods_dataRead$self$$inline_125_JSCompiler_StaticMethods_getVCount$self$$inline_123_JSCompiler_inline_result$$4$$;
    case 65:
      return $JSCompiler_StaticMethods_in_$self$$.$hCounter$;
    case 128:
      $JSCompiler_StaticMethods_controlRead$self$$inline_128_JSCompiler_StaticMethods_dataRead$self$$inline_125_JSCompiler_StaticMethods_getVCount$self$$inline_123_JSCompiler_inline_result$$4$$ = $JSCompiler_StaticMethods_in_$self$$.$vdp$;
      $JSCompiler_StaticMethods_controlRead$self$$inline_128_JSCompiler_StaticMethods_dataRead$self$$inline_125_JSCompiler_StaticMethods_getVCount$self$$inline_123_JSCompiler_inline_result$$4$$.$firstByte$ = $JSCompiler_alias_TRUE$$;
      var $statuscopy$$inline_129_value$$inline_126$$ = $JSCompiler_StaticMethods_controlRead$self$$inline_128_JSCompiler_StaticMethods_dataRead$self$$inline_125_JSCompiler_StaticMethods_getVCount$self$$inline_123_JSCompiler_inline_result$$4$$.$readBuffer$;
      $JSCompiler_StaticMethods_controlRead$self$$inline_128_JSCompiler_StaticMethods_dataRead$self$$inline_125_JSCompiler_StaticMethods_getVCount$self$$inline_123_JSCompiler_inline_result$$4$$.$readBuffer$ = $JSCompiler_StaticMethods_controlRead$self$$inline_128_JSCompiler_StaticMethods_dataRead$self$$inline_125_JSCompiler_StaticMethods_getVCount$self$$inline_123_JSCompiler_inline_result$$4$$.$VRAM$[$JSCompiler_StaticMethods_controlRead$self$$inline_128_JSCompiler_StaticMethods_dataRead$self$$inline_125_JSCompiler_StaticMethods_getVCount$self$$inline_123_JSCompiler_inline_result$$4$$.location++ & 
      16383] & 255;
      return $statuscopy$$inline_129_value$$inline_126$$;
    case 129:
      return $JSCompiler_StaticMethods_controlRead$self$$inline_128_JSCompiler_StaticMethods_dataRead$self$$inline_125_JSCompiler_StaticMethods_getVCount$self$$inline_123_JSCompiler_inline_result$$4$$ = $JSCompiler_StaticMethods_in_$self$$.$vdp$, $JSCompiler_StaticMethods_controlRead$self$$inline_128_JSCompiler_StaticMethods_dataRead$self$$inline_125_JSCompiler_StaticMethods_getVCount$self$$inline_123_JSCompiler_inline_result$$4$$.$firstByte$ = $JSCompiler_alias_TRUE$$, $statuscopy$$inline_129_value$$inline_126$$ = 
      $JSCompiler_StaticMethods_controlRead$self$$inline_128_JSCompiler_StaticMethods_dataRead$self$$inline_125_JSCompiler_StaticMethods_getVCount$self$$inline_123_JSCompiler_inline_result$$4$$.status, $JSCompiler_StaticMethods_controlRead$self$$inline_128_JSCompiler_StaticMethods_dataRead$self$$inline_125_JSCompiler_StaticMethods_getVCount$self$$inline_123_JSCompiler_inline_result$$4$$.status = 0, $JSCompiler_StaticMethods_controlRead$self$$inline_128_JSCompiler_StaticMethods_dataRead$self$$inline_125_JSCompiler_StaticMethods_getVCount$self$$inline_123_JSCompiler_inline_result$$4$$.$main$.$cpu$.$interruptLine$ = 
      $JSCompiler_alias_FALSE$$, $statuscopy$$inline_129_value$$inline_126$$;
    case 192:
      return $JSCompiler_StaticMethods_in_$self$$.$keyboard$.$controller1$;
    case 193:
      return $JSCompiler_StaticMethods_in_$self$$.$keyboard$.$controller2$ & 63 | $JSCompiler_StaticMethods_in_$self$$.$ioPorts$[0] | $JSCompiler_StaticMethods_in_$self$$.$ioPorts$[1]
  }
  return 255
}
function $JSCompiler_StaticMethods_out$$($JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$, $address$$inline_134_old$$inline_140_port_temp$$inline_133$$, $reg$$inline_139_value$$86$$) {
  if(!($JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$main$.$is_gg$ && 7 > $address$$inline_134_old$$inline_140_port_temp$$inline_133$$)) {
    switch($address$$inline_134_old$$inline_140_port_temp$$inline_133$$ & 193) {
      case 1:
        $JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$ioPorts$[0] = ($reg$$inline_139_value$$86$$ & 32) << 1;
        $JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$ioPorts$[1] = $reg$$inline_139_value$$86$$ & 128;
        0 == $JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$europe$ && ($JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$ioPorts$[0] = ~$JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$ioPorts$[0], $JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$ioPorts$[1] = 
        ~$JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$ioPorts$[1]);
        break;
      case 128:
        $JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$ = $JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$vdp$;
        $address$$inline_134_old$$inline_140_port_temp$$inline_133$$ = 0;
        $JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$firstByte$ = $JSCompiler_alias_TRUE$$;
        switch($JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$operation$) {
          case 0:
          ;
          case 1:
          ;
          case 2:
            $address$$inline_134_old$$inline_140_port_temp$$inline_133$$ = $JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.location & 16383;
            if($reg$$inline_139_value$$86$$ != ($JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$VRAM$[$address$$inline_134_old$$inline_140_port_temp$$inline_133$$] & 255)) {
              if($address$$inline_134_old$$inline_140_port_temp$$inline_133$$ >= $JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$sat$ && $address$$inline_134_old$$inline_140_port_temp$$inline_133$$ < $JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$sat$ + 64) {
                $JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$isSatDirty$ = $JSCompiler_alias_TRUE$$
              }else {
                if($address$$inline_134_old$$inline_140_port_temp$$inline_133$$ >= $JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$sat$ + 128 && $address$$inline_134_old$$inline_140_port_temp$$inline_133$$ < $JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$sat$ + 256) {
                  $JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$isSatDirty$ = $JSCompiler_alias_TRUE$$
                }else {
                  var $tileIndex$$inline_135$$ = $address$$inline_134_old$$inline_140_port_temp$$inline_133$$ >> 5;
                  $JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$isTileDirty$[$tileIndex$$inline_135$$] = $JSCompiler_alias_TRUE$$;
                  $tileIndex$$inline_135$$ < $JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$minDirty$ && ($JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$minDirty$ = $tileIndex$$inline_135$$);
                  $tileIndex$$inline_135$$ > $JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$maxDirty$ && ($JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$maxDirty$ = $tileIndex$$inline_135$$)
                }
              }
              $JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$VRAM$[$address$$inline_134_old$$inline_140_port_temp$$inline_133$$] = $reg$$inline_139_value$$86$$
            }
            break;
          case 3:
            $JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$main$.$is_sms$ ? ($address$$inline_134_old$$inline_140_port_temp$$inline_133$$ = 3 * ($JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.location & 31), $JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$CRAM$[$address$$inline_134_old$$inline_140_port_temp$$inline_133$$] = 
            $JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$main_JAVA$[$reg$$inline_139_value$$86$$ & 63] & 255, $JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$CRAM$[$address$$inline_134_old$$inline_140_port_temp$$inline_133$$ + 1] = $JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$main_JAVA$[$reg$$inline_139_value$$86$$ & 
            63] >> 8 & 255, $JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$CRAM$[$address$$inline_134_old$$inline_140_port_temp$$inline_133$$ + 2] = $JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$main_JAVA$[$reg$$inline_139_value$$86$$ & 63] >> 16 & 255) : $JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$main$.$is_gg$ && 
            ($address$$inline_134_old$$inline_140_port_temp$$inline_133$$ = 3 * (($JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.location & 63) >> 1), 0 == ($JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.location & 1) ? ($JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$CRAM$[$address$$inline_134_old$$inline_140_port_temp$$inline_133$$] = 
            $JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$GG_JAVA1$[$reg$$inline_139_value$$86$$] & 255, $JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$CRAM$[$address$$inline_134_old$$inline_140_port_temp$$inline_133$$ + 1] = $JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$GG_JAVA1$[$reg$$inline_139_value$$86$$] >> 
            8 & 255) : $JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$CRAM$[$address$$inline_134_old$$inline_140_port_temp$$inline_133$$ + 2] = $JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$GG_JAVA2$[$reg$$inline_139_value$$86$$ & 15] >> 16 & 255)
        }
        $JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.location++;
        break;
      case 129:
        $JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$ = $JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$vdp$;
        if($JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$firstByte$) {
          $JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$firstByte$ = $JSCompiler_alias_FALSE$$, $JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$commandByte$ = $reg$$inline_139_value$$86$$, $JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.location = 
          $JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.location & 16128 | $reg$$inline_139_value$$86$$
        }else {
          if($JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$firstByte$ = $JSCompiler_alias_TRUE$$, $JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$operation$ = $reg$$inline_139_value$$86$$ >> 6 & 3, $JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.location = 
          $JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$commandByte$ | $reg$$inline_139_value$$86$$ << 8, 0 == $JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$operation$) {
            $JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$readBuffer$ = $JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$VRAM$[$JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.location++ & 16383] & 255
          }else {
            if(2 == $JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$operation$) {
              $reg$$inline_139_value$$86$$ &= 15;
              switch($reg$$inline_139_value$$86$$) {
                case 1:
                  0 != ($JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.status & 128) && 0 != ($JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$commandByte$ & 32) && ($JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$main$.$cpu$.$interruptLine$ = 
                  $JSCompiler_alias_TRUE$$);
                  ($JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$commandByte$ & 3) != ($JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$vdpreg$[$reg$$inline_139_value$$86$$] & 3) && ($JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$isSatDirty$ = 
                  $JSCompiler_alias_TRUE$$);
                  break;
                case 2:
                  $JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$bgt$ = ($JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$commandByte$ & 14) << 10;
                  break;
                case 5:
                  $address$$inline_134_old$$inline_140_port_temp$$inline_133$$ = $JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$sat$, $JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$sat$ = ($JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$commandByte$ & 
                  -130) << 7, $address$$inline_134_old$$inline_140_port_temp$$inline_133$$ != $JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$sat$ && ($JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$isSatDirty$ = $JSCompiler_alias_TRUE$$, console.log("New address written to SAT: " + $address$$inline_134_old$$inline_140_port_temp$$inline_133$$ + 
                  " -> " + $JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$sat$))
              }
              $JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$vdpreg$[$reg$$inline_139_value$$86$$] = $JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$commandByte$
            }
          }
        }
        break;
      case 64:
      ;
      case 65:
        $JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$main$.$soundEnabled$ && $JSCompiler_StaticMethods_controlWrite$self$$inline_137_JSCompiler_StaticMethods_dataWrite$self$$inline_131_JSCompiler_StaticMethods_out$self$$.$psg$.write($reg$$inline_139_value$$86$$)
    }
  }
}
;window.JSSMS = $JSSMS$$;
jQuery.fn.JSSMSUI = jQuery.fn.$JSSMSUI$;

