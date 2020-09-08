# opus

[![Tags](https://img.shields.io/github/release/denosaurs/opus)](https://github.com/denosaurs/opus/releases)
[![CI Status](https://img.shields.io/github/workflow/status/denosaurs/opus/check)](https://github.com/denosaurs/opus/actions)
[![License](https://img.shields.io/github/license/denosaurs/opus)](https://github.com/denosaurs/opus/blob/master/LICENSE)

```typescript
const SAMPLE_RATE = 48000;
const FRAME = 20;
const CHANNELS = 2;

await Opus.load();

// Optimize encoding for audio. Available applications are VOIP, AUDIO, and RESTRICTED_LOWDELAY
let encoder = new Opus(SAMPLE_RATE, CHANNELS, OpusApplication.AUDIO);

let frameSize = SAMPLE_RATE * FRAME / 1000;

// Get PCM data from somewhere and encode it into opus
let pcmData = new Uint8Array();
let encodedPacket = encoder.encode(pcmData, frameSize);

// Decode the opus packet back into PCM
let decodedPacket = encoder.decode(encodedPacket);
console.log(decodedPacket);

// Delete the encoder when finished with it (Emscripten does not automatically call C++ object destructors)
encoder.delete();
```

## Maintainers

- Filippo Rossi ([@qu4k](https://github.com/qu4k))

## Other

### Related

- [opusscript](https://github.com/abalabahaha/opusscript) - nodejs bindings for libopus 1.3.1, ported with emscripten

### Contribution

Pull request, issues and feedback are very welcome. Code style is formatted with `deno fmt` and commit messages are done following Conventional Commits spec.

### Licence

Copyright 2020-present, the denosaurs team. All rights reserved. MIT license.
