import _opus from "./pack/opuswasm.js";

let opus: any = null;

/** Opus application type */
export enum OpusApplication {
  /** Voice Over IP */
  VOIP = 2048,
  /** Audio */
  AUDIO = 2049,
  /** Restricted Low-Delay */
  RESTRICTED_LOWDELAY = 2051,
}
export enum OpusError {
  "OK" = 0,
  "Bad argument" = -1,
  "Buffer too small" = -2,
  "Internal error" = -3,
  "Invalid packet" = -4,
  "Unimplemented" = -5,
  "Invalid state" = -6,
  "Memory allocation fail" = -7,
}
/** Valid audio sampling rates */
export const VALID_SAMPLING_RATES = [8000, 12000, 16000, 24000, 48000];
/** Maximum bytes in a frame */
export const MAX_FRAME_SIZE = 2880;
/** Maximum bytes in a packet */
export const MAX_PACKET_SIZE = 3828;

export class Opus {
  samplingRate: number;
  channels: number;
  application: OpusApplication;
  handler: any;

  inPCMLength: number;
  inPCMPointer: number;
  inPCM: Uint16Array;

  outPCMLength: number;
  outPCMPointer: number;
  outPCM: Uint16Array;

  inOpusPointer: number;
  inOpus: Uint8Array;

  outOpusPointer: number;
  outOpus: Uint8Array;

  /** Loads opus wasm instance */
  static async load() {
    if (!opus) {
      opus = await _opus;
    }
  }

  /** Create a new Opus en/decoder */
  constructor(
    samplingRate: number,
    channels?: number,
    application?: OpusApplication
  ) {
    if (!opus) {
      throw new Error(
        "Opus.load() needs to be called before interacting with the Opus class"
      );
    }

    if (!~VALID_SAMPLING_RATES.indexOf(samplingRate)) {
      throw new RangeError(`${samplingRate} is an invalid sampling rate.`);
    }

    this.samplingRate = samplingRate;
    this.channels = channels || 1;
    this.application = application || OpusApplication.AUDIO;

    let handler = null;
    handler = opus;
    this.handler = new handler.OpusScriptHandler(
      this.samplingRate,
      this.channels,
      this.application
    );

    this.inPCMLength = MAX_FRAME_SIZE * this.channels * 2;
    this.inPCMPointer = handler._malloc(this.inPCMLength);
    this.inPCM = handler.HEAPU16.subarray(
      this.inPCMPointer,
      this.inPCMPointer + this.inPCMLength
    );

    this.inOpusPointer = handler._malloc(MAX_PACKET_SIZE);
    this.inOpus = handler.HEAPU8.subarray(
      this.inOpusPointer,
      this.inOpusPointer + MAX_PACKET_SIZE
    );

    this.outOpusPointer = handler._malloc(MAX_PACKET_SIZE);
    this.outOpus = handler.HEAPU8.subarray(
      this.outOpusPointer,
      this.outOpusPointer + MAX_PACKET_SIZE
    );

    this.outPCMLength = MAX_FRAME_SIZE * this.channels * 2;
    this.outPCMPointer = handler._malloc(this.outPCMLength);
    this.outPCM = handler.HEAPU16.subarray(
      this.outPCMPointer,
      this.outPCMPointer + this.outPCMLength
    );
  }

  /** Encode a buffer into Opus */
  encode(buffer: Uint8Array, frameSize: number): Uint8Array {
    this.inPCM.set(buffer);

    let len = this.handler._encode(
      this.inPCM.byteOffset,
      buffer.length,
      this.outOpusPointer,
      frameSize
    );
    if (len < 0) {
      throw new Error("Encode error: " + OpusError[len]);
    }

    return this.outOpus.subarray(0, len);
  }

  /** Decode an opus buffer */
  decode(buffer: Uint8Array): Uint16Array {
    this.inOpus.set(buffer);

    let len: number = this.handler._decode(
      this.inOpusPointer,
      buffer.length,
      this.outPCM.byteOffset
    );
    if (len < 0) {
      throw new Error("Decode error: " + OpusError[len]);
    }

    return this.outPCM.subarray(0, len * this.channels * 2);
  }

  encoderCTL(ctl: number, arg: number): void {
    let len = this.handler._encoder_ctl(ctl, arg);
    if (len < 0) {
      throw new Error("Encoder CTL error: " + OpusError[len]);
    }
  }

  decoderCTL(ctl: number, arg: number): void {
    let len = this.handler._decoder_ctl(ctl, arg);
    if (len < 0) {
      throw new Error("Decoder CTL error: " + OpusError[len]);
    }
  }

  /** Delete the opus object */
  delete(): void {
    let handler = opus;
    handler.OpusScriptHandler.destroy_handler(this.handler);
    handler._free(this.inPCMPointer);
    handler._free(this.inOpusPointer);
    handler._free(this.outOpusPointer);
    handler._free(this.outPCMPointer);
  }
}
