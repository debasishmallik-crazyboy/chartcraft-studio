/**
 * QuickTime MOV Muxer for Browser-Side Transparent Video (.MOV) Export
 * Generates spec-compliant QuickTime movies with PNG codec ('png ') and 32-bit RGBA straight alpha.
 * 100% client-side, zero external dependencies, zero WebAssembly overhead.
 * Compatible with: Adobe Premiere Pro, Wondershare Filmora 14/15, DaVinci Resolve, Apple Final Cut Pro, After Effects.
 */
(function(window) {
  'use strict';

  function strToBytes(str) {
    const bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i);
    return bytes;
  }

  function concatUint8(arrays) {
    let total = 0;
    for (let i = 0; i < arrays.length; i++) total += arrays[i].byteLength;
    const out = new Uint8Array(total);
    let offset = 0;
    for (let i = 0; i < arrays.length; i++) {
      out.set(arrays[i], offset);
      offset += arrays[i].byteLength;
    }
    return out;
  }

  function makeAtom(type, ...children) {
    const payload = concatUint8(children);
    const header = new Uint8Array(8);
    const dv = new DataView(header.buffer);
    dv.setUint32(0, payload.byteLength + 8, false);
    header.set(strToBytes(type), 4);
    return concatUint8([header, payload]);
  }

  function makeFullAtom(type, version, flags, ...children) {
    const vf = new Uint8Array(4);
    vf[0] = version;
    vf[1] = (flags >> 16) & 0xFF;
    vf[2] = (flags >> 8) & 0xFF;
    vf[3] = flags & 0xFF;
    return makeAtom(type, vf, ...children);
  }

  function createQuickTimeMov(pngFrames, width, height, fps = 30) {
    if (!pngFrames || pngFrames.length === 0) {
      throw new Error('No PNG frames provided to MOV muxer');
    }

    const totalFrames = pngFrames.length;
    const timescale = 600;
    const frameDuration = Math.max(1, Math.round(timescale / fps));
    const totalDuration = totalFrames * frameDuration;

    // 1. ftyp atom
    const ftyp = makeAtom('ftyp', strToBytes('qt  '), new Uint8Array([0x00, 0x00, 0x02, 0x00]), strToBytes('qt  '));

    // 2. mdat atom (raw PNG frame payloads)
    const mdatData = concatUint8(pngFrames);
    const mdatHeader = new Uint8Array(8);
    const mdatDv = new DataView(mdatHeader.buffer);
    mdatDv.setUint32(0, mdatData.byteLength + 8, false);
    mdatHeader.set(strToBytes('mdat'), 4);
    const mdat = concatUint8([mdatHeader, mdatData]);

    // Calculate sample sizes & chunk offsets
    const frameSizes = new Uint32Array(totalFrames);
    const frameOffsets = new Uint32Array(totalFrames);
    let currentOffset = ftyp.byteLength + 8; // offset right after mdat 8-byte header
    for (let i = 0; i < totalFrames; i++) {
      frameSizes[i] = pngFrames[i].byteLength;
      frameOffsets[i] = currentOffset;
      currentOffset += frameSizes[i];
    }

    // 3. moov hierarchy
    // mvhd
    const mvhdBuf = new Uint8Array(96);
    const mvhdDv = new DataView(mvhdBuf.buffer);
    mvhdDv.setUint32(8, timescale, false);
    mvhdDv.setUint32(12, totalDuration, false);
    mvhdDv.setUint32(16, 0x00010000, false); // rate 1.0
    mvhdDv.setUint16(20, 0x0100, false);     // volume 1.0
    mvhdDv.setUint32(32, 0x00010000, false); // matrix
    mvhdDv.setUint32(48, 0x00010000, false);
    mvhdDv.setUint32(64, 0x40000000, false);
    mvhdDv.setUint32(92, 2, false);          // next track id = 2
    const mvhd = makeFullAtom('mvhd', 0, 0, mvhdBuf);

    // tkhd
    const tkhdBuf = new Uint8Array(80);
    const tkhdDv = new DataView(tkhdBuf.buffer);
    tkhdDv.setUint32(8, 1, false);           // track id = 1
    tkhdDv.setUint32(16, totalDuration, false);
    tkhdDv.setUint32(36, 0x00010000, false); // matrix
    tkhdDv.setUint32(52, 0x00010000, false);
    tkhdDv.setUint32(68, 0x40000000, false);
    tkhdDv.setUint32(72, width << 16, false); // fixed point width
    tkhdDv.setUint32(76, height << 16, false);// fixed point height
    const tkhd = makeFullAtom('tkhd', 0, 0x0000000F, tkhdBuf);

    // mdhd
    const mdhdBuf = new Uint8Array(20);
    const mdhdDv = new DataView(mdhdBuf.buffer);
    mdhdDv.setUint32(8, timescale, false);
    mdhdDv.setUint32(12, totalDuration, false);
    const mdhd = makeFullAtom('mdhd', 0, 0, mdhdBuf);

    // hdlr
    const hdlrBuf = new Uint8Array(24 + 13);
    hdlrBuf.set(strToBytes('mhlr'), 0);
    hdlrBuf.set(strToBytes('vide'), 4);
    hdlrBuf.set(strToBytes('appl'), 8);
    hdlrBuf[20] = 12; // length of string
    hdlrBuf.set(strToBytes('VideoHandler'), 21);
    const hdlr = makeFullAtom('hdlr', 0, 0, hdlrBuf);

    // vmhd
    const vmhd = makeFullAtom('vmhd', 0, 1, new Uint8Array(8));

    // dinf -> dref
    const urlAtom = makeFullAtom('url ', 0, 1);
    const drefCount = new Uint8Array(4);
    new DataView(drefCount.buffer).setUint32(0, 1, false);
    const dref = makeFullAtom('dref', 0, 0, drefCount, urlAtom);
    const dinf = makeAtom('dinf', dref);

    // stsd (Sample Description: PNG codec, 32-bit RGBA)
    const stsdEntry = new Uint8Array(86);
    const stsdDv = new DataView(stsdEntry.buffer);
    stsdDv.setUint32(0, 86, false);          // length of entry
    stsdEntry.set(strToBytes('png '), 4);    // QuickTime PNG fourcc
    stsdDv.setUint16(14, 1, false);          // data ref index
    stsdEntry.set(strToBytes('appl'), 20);   // vendor
    stsdDv.setUint32(28, 512, false);        // spatial quality
    stsdDv.setUint16(32, width, false);      // width
    stsdDv.setUint16(34, height, false);     // height
    stsdDv.setUint32(36, 0x00480000, false); // 72 dpi
    stsdDv.setUint32(40, 0x00480000, false);
    stsdDv.setUint16(48, 1, false);          // frame count
    stsdEntry[50] = 3;                       // compressor string length
    stsdEntry.set(strToBytes('PNG'), 51);
    stsdDv.setUint16(82, 32, false);         // 32-bit depth (Straight Alpha Channel!)
    stsdDv.setInt16(84, -1, false);          // color table id (-1 = default)
    const stsdCount = new Uint8Array(4);
    new DataView(stsdCount.buffer).setUint32(0, 1, false);
    const stsd = makeFullAtom('stsd', 0, 0, stsdCount, stsdEntry);

    // stts (Time-to-Sample)
    const sttsBuf = new Uint8Array(12);
    const sttsDv = new DataView(sttsBuf.buffer);
    sttsDv.setUint32(0, 1, false);
    sttsDv.setUint32(4, totalFrames, false);
    sttsDv.setUint32(8, frameDuration, false);
    const stts = makeFullAtom('stts', 0, 0, sttsBuf);

    // stsc (Sample-to-Chunk)
    const stscBuf = new Uint8Array(16);
    const stscDv = new DataView(stscBuf.buffer);
    stscDv.setUint32(0, 1, false);
    stscDv.setUint32(4, 1, false);
    stscDv.setUint32(8, 1, false);
    stscDv.setUint32(12, 1, false);
    const stsc = makeFullAtom('stsc', 0, 0, stscBuf);

    // stsz (Sample Sizes)
    const stszHdr = new Uint8Array(8);
    new DataView(stszHdr.buffer).setUint32(4, totalFrames, false);
    const stszEntries = new Uint8Array(totalFrames * 4);
    const stszDv = new DataView(stszEntries.buffer);
    for (let i = 0; i < totalFrames; i++) {
      stszDv.setUint32(i * 4, frameSizes[i], false);
    }
    const stsz = makeFullAtom('stsz', 0, 0, stszHdr, stszEntries);

    // stco (Chunk Offsets)
    const stcoHdr = new Uint8Array(4);
    new DataView(stcoHdr.buffer).setUint32(0, totalFrames, false);
    const stcoEntries = new Uint8Array(totalFrames * 4);
    const stcoDv = new DataView(stcoEntries.buffer);
    for (let i = 0; i < totalFrames; i++) {
      stcoDv.setUint32(i * 4, frameOffsets[i], false);
    }
    const stco = makeFullAtom('stco', 0, 0, stcoHdr, stcoEntries);

    // Assemble sample table and containers
    const stbl = makeAtom('stbl', stsd, stts, stsc, stsz, stco);
    const minf = makeAtom('minf', vmhd, dinf, stbl);
    const mdia = makeAtom('mdia', mdhd, hdlr, minf);
    const trak = makeAtom('trak', tkhd, mdia);
    const moov = makeAtom('moov', mvhd, trak);

    return concatUint8([ftyp, mdat, moov]);
  }

  window.QuickTimeMovBuilder = {
    createQuickTimeMov
  };

})(typeof window !== 'undefined' ? window : this);
