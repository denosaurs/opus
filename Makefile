OPUS_DIRECTORY=./opus

EMCC_OPTS=-Wall -O3 -s ALLOW_MEMORY_GROWTH=1 --memory-init-file 0 -s ERROR_ON_UNDEFINED_SYMBOLS=0 -s NO_FILESYSTEM=1 -s EXPORTED_RUNTIME_METHODS="['setValue', 'getValue']" -s EXPORTED_FUNCTIONS="['_malloc', '_opus_strerror']" -s MODULARIZE=1

EMCC_NASM_OPTS=-s WASM=0
EMCC_WASM_OPTS=-s WASM=1 -s WASM_ASYNC_COMPILATION=0

all: init compile
autogen:
	cd $(OPUS_DIRECTORY); \
	./autogen.sh
configure:
	cd $(OPUS_DIRECTORY); \
	emconfigure ./configure --disable-extra-programs --disable-doc --disable-intrinsics
bind:
	cd $(OPUS_DIRECTORY); \
	emmake make; \
	rm a.wasm;
init: autogen configure bind
compile:
	rm -rf ./build; \
	mkdir -p ./build; \
	em++ ${EMCC_OPTS} ${EMCC_WASM_OPTS} --bind -o build/opusscript_native_wasm.js src/opusscript_encoder.cpp ${OPUS_DIRECTORY}/.libs/libopus.a; \
	cp -f ${OPUS_DIRECTORY}/COPYING build/COPYING.libopus;
