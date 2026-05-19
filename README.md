
## **🛡️ StegoShield: The Core Problem & Team Architecture**

### 1. The Critical Problem (Why We Built This)

In modern cybersecurity, encryption alone is a dead giveaway. If a journalist in a restricted regime, an intelligence officer, or a corporate whistleblower sends an AES-encrypted file, the file looks like a massive block of unreadable gibberish. To a network censor or an adversary monitoring traffic, **unreadable traffic is an immediate red flag.** The message might not be decrypted, but the sender is instantly targeted, intercepted, or blocked.

Furthermore, existing open-source tools are incredibly rigid. If you try to hide a file, you lose its original name, its file extension gets corrupted, or the file size blows up so much that it triggers anomaly detection algorithms.

### 2. Our StegoShield Solution & Innovations

Our team built **StegoShield** to achieve **Deniable Plausibility**. By combining industry-standard cryptography with advanced steganography, we created a two-layer security bunker.

* **The Double-Layer Fortress:** First, data is mathematically crushed using authenticated **AES-GCM 256-bit** encryption driven by a high-entropy key derived via **PBKDF2**. Even if an adversary extracts the data, they face an unbreakable wall of math.
* **Universal Media Carrier Architecture:** Most stego tools only hide text inside images. We designed StegoShield to treat media files as generic binary byte streams. You can hide a compressed `.zip` file inside a `.wav` audio track, or a secret `.docx` file inside an `.mp4` video.
* **The Metadata Restoration Protocol:** We engineered a custom binary header mapping system. By injecting the file name and size metrics directly into the byte stream before the payload, our extractor can completely reconstruct the hidden file with its **exact original name and file extension**.



## 📂 Structural Files Significance: Overview

### 1) `home.html` (The Technical Manual & Manifesto)

This isn't just a landing page; it’s the gateway that proves the engineering validity of our project. We designed it using a modern, immersive UI featuring a responsive Bento Grid layout. Its core responsibility is **transparent documentation**. It breaks down the math behind our LSB substitution and the file-structure mechanics of EOF appending. In security software, secrecy lies in the *key*, not the *algorithm*. `home.html` builds immediate trust by showing the user exactly how their data is being guarded.

### 2) `index.html` (The State-Driven Workspace Hub)

This file acts as the primary router and core control center for our application. Instead of hardcoding chaotic links between pages, we engineered a **State-Driven UI Framework**. The workspace cards are locked down completely using CSS `pointer-events-none` until the user actively commits to a mode (`Embed` or `Extract`). Once a mode state is captured by our underlying architecture, the UI dynamically updates its styling and computes the correct destination paths for the sub-modules. This prevents state conflicts and guarantees a flawless user experience.

### 3) `global.css` (The Unified UI Skin & Architecture)

To eliminate code redundancy and strictly follow the **DRY (Don't Repeat Yourself)** development principle, we stripped out messy inline styling and unified the design language into `global.css`. It features a custom Glassmorphic design engine utilizing sophisticated background blurs, interactive micro-transitions (like back buttons that slide dynamically on hover), and fluid color gradients. By handling accessibility concerns globally via relative scaling (`REM` units), it keeps our standalone HTML structures light, semantic, and incredibly clean.

## 🖼️ Module 1: Image Steganography

### 1. High-Level Core Logic

Imagine you have a giant mosaic wall made up of millions of tiny colored tiles called pixels. Each individual tile is colored by mixing three primary lights together: **Red, Green, and Blue (RGB)**. In computer language, the brightness of each light is controlled by an 8-digit combination of 1s and 0s (for example: `11010111`).

The absolute last digit in that 8-digit combination is called the **Least Significant Bit (LSB)**. It has the smallest possible impact on the color—representing just 1 part out of 256. If we flip that last digit from a `1` to a `0`, the shade of the color changes by an amount so incredibly microscopic that the human eye cannot physically see it.

Our application takes your secret file, converts it into a continuous stream of 1s and 0s, and meticulously swaps out the last digit of the Red, Green, and Blue values of the image's pixels with the bits of your secret. To anyone looking at the image, it looks completely original. But hidden inside the microscopic color shades lies your completely intact secret data.


### 2. Engineering Architecture & System Logic

To move past basic steganography and create a highly secure, robust enterprise-grade tool, our team designed a system that relies on four core architectural pillars:

#### **A. The Dual-Layer Cryptographic Fortress**

Data is never hidden raw. If an adversary suspects steganography and runs statistical analysis tools (like Chi-Square attacks) to dump the raw bits, they will find nothing but complete randomness.

* **Key Stretching:** We use a Password-Based Key Derivation Function (**PBKDF2**) with a SHA-256 hashing algorithm running for **100,000 iterations** combined with a unique, cryptographically random 16-byte Salt. This makes brute-forcing computationally impossible.
* **Authenticated Encryption:** The data is encrypted using **AES-GCM (Galois/Counter Mode) 256-bit**. Unlike standard ciphers, GCM provides **authenticated encryption**. It appends an internal authentication tag. During extraction, if even a single pixel has been modified, cropped, or compressed, the cipher detects that the integrity has been violated and halts extraction, protecting against data tampering.

#### **B. The Custom Binary Packet Header Protocol**

Standard open-source stego tools make a critical mistake: they only hide raw text string data, meaning you lose the file name and the file extension becomes corrupted. We solved this by engineering a custom **Binary Packet Header** that precedes the encrypted payload:

$$\text{[Filename Length (1 Byte)]} \rightarrow \text{[Filename Bytes (Variable)]} \rightarrow \text{[Payload Length (4 Bytes)]} \rightarrow \text{[Encrypted Payload]}$$

1. **Byte 0 (1 Byte):** Tells the system exactly how long the filename is (supporting up to 255 characters).
2. **Next Block (Variable):** Stores the raw text-encoded filename and extension (e.g., `project_blueprint.docx`).
3. **Next Block (4 Bytes / 32-bit Integer):** Explicitly states the exact size of the encrypted payload. This allows the extraction engine to slice the bit stream precisely when the data ends, preventing the retrieval of trailing image "garbage bytes."

#### **C. Pre-flight Capacity Allocation Verification**

Before a single cryptographic calculation occurs, the system runs an automated check to protect memory. It analyzes the pixel dimensions of the cover image. Because modifying the Alpha (Transparency) channel in a web environment causes noticeable visual artifacts and "shimmering" on a page, our team limits injection strictly to the Red, Green, and Blue channels. The available bit budget is calculated precisely:

$$\text{Available Bits} = \left(\frac{\text{Total Pixel Array Length}}{4}\right) \times 3$$

If the required bit size of our binary packet header exceeds this bit ceiling, the engine breaks execution and throws an automated warning, ensuring your cover image is never corrupted by data overflow.

#### **D. The Asymmetric Injection & Extraction Assembly Line**

* **Embedding:** The application sets up an automated indexing loop. It isolates an RGB channel byte, clears its lowest bit to zero using a bitwise mask, extracts a single bit from the binary packet, and marries them using bitwise operations. It then serializes this data stream into an uncompressed, lossless container.
* **Extraction (Binary Archaeology):** The extraction tool acts as a scanner. It reads the uncompressed container, pulls only the absolute lowest bit of the RGB bytes, and queues them into a massive bit array. It reads the first 8 bits to compute the filename length, parses the next bytes to decode the string identity, reads the next 32 bits via a Data View to isolate the payload boundary, and feeds the isolated payload directly into the Web Crypto engine for decryption.


### 3. Tech Stack

We selected a highly specific **Vanilla Web Stack** to ensure maximum performance and absolute security.

| Technology Component | Operational Reality | Architectural "Why" (The Engineering Reason) |
| --- | --- | --- |
| **HTML5 Canvas API** | Handles raw physical pixel loading and rendering. Allows our scripts to call `getImageData()` to extract an uncompressed, raw 8-bit clamped array matrix representing every pixel channel. | **Lossless Data Manipulation:** Standard web images are heavily compressed. The Canvas API allows us to work with raw bytes in RAM and export the final image as a **lossless PNG** data stream, ensuring the hidden bits are never mangled or dropped by compression algorithms. |
| **Web Crypto API (`window.crypto.subtle`)** | Handles native, low-level cryptographic functions directly in the browser environment (PBKDF2 key generation, AES-GCM cipher encryption/decryption). | **Hardware Acceleration & Security:** Running cryptography via standard JavaScript libraries is slow and vulnerable to memory inspection. The Web Crypto API runs compiled, hardware-accelerated code directly inside the browser's protected memory sandbox, ensuring the encryption keys never leak. |
| **JavaScript TypedArrays (`Uint8Array`, `DataView`)** | Manages direct, low-level binary allocation in memory. `Uint8Array` handles byte structures sequentially, while `DataView` provides precise access to raw byte buffers regardless of computer architecture. | **Memory Precision:** Standard JS arrays are high-level and slow. To manipulate raw bits and construct custom packet headers down to the individual byte, we need typed binary structures that can read and write memory values with microscopic accuracy. |
| **Client-Side Browser Environment** | Eliminates back-end network operations entirely. All operations occur strictly in the local client's active RAM. | **Zero-Trust & Absolute Privacy:** Traditional tools upload data to servers, which exposes files to interceptors or database leaks. By keeping all processing local, our team achieved a **Zero-Server footprint**. Your secret files and cover images never travel across the internet unencrypted, ensuring total data sovereignty. |

## 🎬 Module 2: Video Steganography (Structural Domain)


One structural decision stands out as exceptionally smart: **scanning backwards** from the end of the file (`buffer.length - markerBytes.length` down to `0`) to locate the custom signature block. Since the payload is attached to the very end of massive video files, scanning from the bottom up rather than the top down ensures the operation completes almost instantly. This completely avoids browser thread locks and performance lag.


### 1. High-Level Core Logic

Imagine you are buying a long chapter book at a store. When you read to the final sentence on the final page, the author writes a definitive closing phrase like, *"The End."* After that phrase, there are a few blank pages left over by the publisher before the back cover. If you took a pencil and wrote a secret note on those blank pages, the actual story remains completely untouched. Anyone reading the book wouldn't notice anything different because they stop reading as soon as they hit the words *"The End."*

Videos work the exact same way on a computer. Video files (like `.mp4` or `.webm`) contain an internal mathematical tag called an **EOF (End-of-File) marker**. When a media player like VLC or Chrome opens a video, it reads the data stream, hits that EOF marker, and immediately stops reading, displaying the video frames perfectly.

Our application takes a secret file, encrypts it, attaches a unique signature token called `STEGO_V1`, and pastes this entire block **immediately after** the video's EOF marker. The video continues to play flawlessly without a single frame of glitching, but it is secretly carrying our hidden vault in its structural shadow.


### 2. Engineering Architecture & System Logic

To bypass the limitations of pixel-hiding in large media files, our team moved away from spatial steganography and built an immutable **Structural Binary Appending Engine**.

#### **A. Defeating the Lossy Compression Problem**

Traditional pixel-based steganography (like LSB) fails completely inside video formats. Modern video compression codecs (H.264, H.265, VP9) use highly aggressive, lossy optimization math. They continuously drop and blend color data across frames to shrink file sizes. If we tried to hide bits in video pixels, the compression algorithm would wipe them out entirely, corrupting the secret. By appending data structurally to the file architecture instead of the frames, **our payload becomes 100% immune to video compression algorithms and video transcoders.**

#### **B. The Appended Packet Assembly Pattern**

When a user targets a video container, our engine treats the entire asset as a raw binary array. We structure the trailing binary stream using a precise, sequential mapping sequence:

$$\text{[Raw Video Stream Data]} \rightarrow \text{[STEGO\_V1 Signature Token]} \rightarrow \text{[Filename Length (1 Byte)]} \rightarrow \text{[Filename String]} \rightarrow \text{[Encrypted Data Block]}$$

* **The Signature Anchor:** We inject a unique, hardcoded structural string `STEGO_V1` directly against the raw video data boundary. This acts as our cryptographic lighthouse.
* **The Dynamic Metadata Block:** Following the anchor, we commit exactly 1 byte to hold the length of the filename, immediately followed by the text-encoded filename itself.
* **The Cipher Block Payload:** The remainder of the file houses our high-entropy **AES-GCM 256-bit** encrypted payload. Because we append this at the absolute structural end, the video container remains perfectly valid and completely uncorrupted.

#### **C. Reverse-Scan Binary Extraction Archaeology**

To recover the secret, the extraction program does not scan the video from byte 0 forward—doing so with a 500MB video would instantly crash the browser's main execution thread. Instead, we engineered a high-performance **Reverse-Scan Loop**:

```javascript
for (let i = buffer.length - markerBytes.length; i >= 0; i--)

```

1. **The Backward Scan:** The parser initializes an array search at the absolute end of the file buffer and steps backward.
2. **Signature Matching:** It looks for a sequence matching our signature bytes (`STEGO_V1`). Once found, it locks onto that precise index position.
3. **Offset Demultiplexing:** The extraction engine shifts its pointer forward to parse our metadata bytes. It extracts the string name, isolates the boundaries of the encrypted block, and passes the isolated segment to the decryption engine.


### 3. Tech Stack

We selected a low-level, high-efficiency binary manipulation stack to build this architecture.

| Technology Component | Operational Reality | Architectural "Why" (The Engineering Reason) |
| --- | --- | --- |
| **JavaScript `Blob` Construction Engine** | Merges multiple independent memory streams into a single composite object. | **Zero-Copy File Stitching:** Instead of loading entire videos into active memory strings (which would instantly trigger browser out-of-memory crashes), the `Blob` constructor handles the merging at the browser kernel level. It quickly strings together our binary blocks into a unified file structure with no rendering cost. |
| **`ArrayBuffer` & `Uint8Array` Parsers** | Converts the file inputs into an array of uncompressed 8-bit unsigned integers. | **Byte-Level Precision:** To locate the exact byte index of our structural signature marker and split the streams correctly, we need direct, raw pointer access to the file's binary architecture. |
| **Native browser `TextEncoder` & `TextDecoder**` | Translates standard string values (like the signature string and filenames) into raw binary arrays and back. | **Cross-Platform Compatibility:** Characters are read differently across various operating systems. By forcing explicit text encoding into a standardized byte map, we guarantee that files hidden on a Mac can be extracted flawlessly on Windows or Linux with no string parsing errors. |

## 🎵 Module 3: Audio Steganography (Temporal/Amplitude Domain)


Our team has executed a brilliant architectural optimization here: **a hybrid processing strategy**.

1. During **embedding**, we utilize the browser's high-level **Web Audio API** (`AudioContext`) to perfectly decode any compressed input format (like an `.mp3`) into raw PCM float channels. We then programmatically construct a bit-perfect, standard 44-byte WAV container from scratch.
2. During **extraction**, to ensure near-zero latency, we bypass the Web Audio API overhead entirely. We read the file stream directly as a low-level binary array, skipping the first 44 bytes to harvest raw bits directly from the 16-bit PCM soundwave buffer.



### 1. High-Level Core Logic 

Imagine you are listening to someone speak in a normal voice. In the background, there is an incredibly quiet cricket chirping, or someone making a tiny whisper so faint it sits completely below the threshold of what your ears can hear. The sound wave is still physically moving through the room, but your brain blocks out the microscopic adjustments because the main speaker's volume completely overpowers them.

Digital audio works exactly like this. When you listen to a CD-quality `.wav` audio track, the computer reads thousands of tiny numerical sound values every second, called amplitude samples. Each sample is a number that goes all the way up to 65,536 levels of volume.

Our application takes a secret file, encrypts it, and converts it into a long line of binary 1s and 0s. Then, we look at the sound waves of the host audio file and swap out the very last digit (the **Least Significant Bit**) of those volume levels with the bits of our secret. This creates a minute acoustic change of just 1 out of 65,536—essentially placing your secret data inside the imperceptible "whispers" of the audio track. The song plays flawlessly with zero audible noise, yet it carries your completely intact file.


### 2. Engineering Architecture & System Logic

To achieve bit-perfect acoustic hiding directly within client-side browser execution loops, our team engineered an advanced **PCM Signal Amplitude Modulation Layer**.

#### **A. Universal Input Decoding to Linear 16-Bit PCM**

Different audio files store acoustic data using different mathematical configurations. To make our application robust, our embedding engine uses an **Asymmetric Transcoding Framework**:

1. **The Audio Context Sandbox:** We pass the user's uploaded container file into an instance of the `AudioContext` API. The browser automatically processes and normalizes the format (even if it's a lossy `.mp3` or `.ogg`) and unpacks it into an uncompressed float matrix ranging from `-1.0` to `1.0`.
2. **Bit-Perfect Rescaling:** We run a mapping calculation loop across the float values, clipping them strictly between `-1` and `1` to prevent acoustic blowout. We then map them into a signed 16-bit array (`Int16Array`):

$$\text{Positive Signals} \rightarrow \text{Sample} \times \text{0x7FFF (32767)}$$


$$\text{Negative Signals} \rightarrow \text{Sample} \times \text{0x8000 (-32768)}$$



#### **B. The Custom RIFF/WAVE Container Assembly**

Because the browser does not natively export modified audio arrays back out into raw audio files, our team built a custom byte-level **RIFF/WAVE Encoder** function (`createWavBlob`). It programmatically builds the industry-standard 44-byte binary header required by computer file managers from scratch:

* **Bytes 0–3:** Write the signature ASCII string `RIFF`.
* **Bytes 22–23:** Set to `1` to signal uncompressed, raw PCM data.
* **Bytes 24–27:** Inject the runtime sample rate matching the original cover asset (e.g., `44100 Hz`).
* **Bytes 34–35:** Set to `16` to lock the bit-depth configuration.
* **Bytes 44+:** Sequentially write our modified 16-bit sample chunks behind the structural `data` tag.

#### **C. Low-Overhead Direct Binary Demultiplexing**

```javascript
const intData = new Int16Array(arrayBuffer, 44);

```

During extraction, passing large files back into the `AudioContext` would cause massive rendering delays and potentially alter the bits due to browser-specific audio spatialization algorithms. Our team designed a faster path: we read the audio file purely as a raw `ArrayBuffer` and instantiate an `Int16Array` view with a strict 44-byte offset. This instantly skips the WAV file header and exposes the underlying 16-bit sound samples directly as integers in RAM. The loop then runs at bare-metal speeds, checking `intData[bitIdx] & 1` to pluck out the secret bit architecture instantly.


### 3. Tech Stack

Our team paired real-time digital signal processing (DSP) mechanics with native browser APIs.

| Technology Component | Operational Reality | Architectural "Why" (The Engineering Reason) |
| --- | --- | --- |
| **Web Audio API (`AudioContext`)** | Decodes compiled, multi-channel user audio assets down to single-channel uncompressed floating-point data streams (`getChannelData`). | **Universal Format Ingestion:** Building independent decoders for `.mp3`, `.wav`, and `.flac` would make our codebase huge. By offloading this task to the browser's optimized audio subsystem, we can ingest any consumer audio format instantly. |
| **JavaScript `Int16Array` Buffer** | Allocates an uncompressed block of memory containing signed 16-bit integers, representing traditional Pulse Code Modulation (PCM) waveforms. | **Signal Congruency:** Floating-point structures contain chaotic sub-decimal variants that are altered by rounding algorithms. Forcing data mapping into integer boundaries guarantees that the lowest bit stays completely stable between embedding and extraction. |
| **Manual Header serialization (`DataView`)** | Places precise 8-bit, 16-bit, and 32-bit big/little-endian data flags into specific index locations. | **File System Compliance:** Without an explicit 44-byte structural header specifying sample rates and audio channels, the resulting file would be recognized as corrupt raw data rather than a playable audio asset. |

## 📄 Module 4: Document Steganography (Structural/Universal Domain)

This module represents the operational peak of our application. While the previous modules were tailored to specific media parameters (like image pixel arrays or audio waveform integers), we architected this component as a **Universal Binary Stream Container**. It handles files—whether a `.pdf`, `.docx`, `.html`, or even an executable—purely as low-level binary streams, using **EOF (End-of-File) Cloaking**.


### 1. High-Level Core Logic

Imagine you are writing a letter on a piece of paper, and at the bottom, you write a clear final line saying, *"Sincerely, Alex."* Anyone reading the letter stops right there. If you were to tape a secret microcard onto the back of that paper or write notes in invisible ink below your signature, the letter remains fully readable. The postman delivers it, and the recipient reads the main text without ever realizing there's extra data attached below the signature block.

Digital documents on a computer operate under a similar rule. Files like PDFs, Word Documents (`.docx`), or web pages (`.html`) are embedded with structural tags that declare where the file ends. When software like Adobe Acrobat or Microsoft Word opens a document, its data rendering engine scans down the byte map until it encounters this **End-of-File (EOF) marker**. The software instantly stops reading and displays the document perfectly, completely ignoring any code trailing behind that marker.

Our application takes advantage of this design. It encrypts a secret file, tags it with a specialized identifier token (`STEGO_SHIELD_V1`), and appends this entire payload structure **directly behind** the native EOF marker of the carrier document. The original document remains fully functional, completely editable, and passes standard visual inspections while hiding a secure file system in its background bytes.


### 2. Engineering Architecture & System Logic (In-Depth)

To achieve file-agnostic compatibility, our team bypassed specific media rendering pipelines and engineered a direct **Binary Stream Injection Layer**.

#### **A. The Structural Agnostic Principle**

Unlike our LSB image and audio configurations, which require parsing explicit color grids or acoustic frequencies, this module operates at the byte layer. This gives our application immense flexibility: it can accept any document format as a carrier. It opens the file's raw byte array buffer, preserves the original host structure entirely, and uses a custom metadata block to isolate our modifications.

#### **B. Low-Level Custom Header Serialization**

When a user executes the cloaking engine, we construct a sequential, bit-accurate binary packet layout:

$$\text{[Host Document Bytes]} \rightarrow \text{[STEGO\_SHIELD\_V1 Anchor Token]} \rightarrow \text{[Header (5 Bytes)]} \rightarrow \text{[Original Filename]} \rightarrow \text{[Encrypted Payload]}$$

To ensure this packet can be parsed dynamically during extraction without corrupting raw data, we allocated a fixed **5-Byte Binary Header** using a JavaScript `DataView`:

* **Byte 0 (1 Byte):** Stores an unsigned 8-bit integer (`setUint8`) indicating the exact length of the filename string.
* **Bytes 1–4 (4 Bytes):** Stores a 32-bit unsigned integer (`setUint32`) that explicitly records the total length of the encrypted payload.

```javascript
headerView.setUint8(0, nameBytes.length);
headerView.setUint32(1, encrypted.length);

```

By placing this explicit size mapping *before* the variable filename strings and encryption payloads, the extraction engine can calculate byte offsets exactly, ensuring flawless extraction.

#### **C. Bottom-Up Pointer Demultiplexing**

```javascript
for (let i = fullBuf.length - markerBytes.length; i >= 0; i--)

```

During extraction, scanning a massive, multi-page corporate PDF file from byte 0 forward would severely hurt performance. Our team designed a **Bottom-Up Linear Search Loop**. The extraction module reads the target asset backwards from the absolute end of the file buffer to find our specific anchor token (`STEGO_SHIELD_V1`).

Once matched, it reads the 5-byte header at that index to extract the filename length and payload boundaries. The engine then slices out the exact encrypted block, isolates it from the surrounding file padding, and feeds it directly into the AES-GCM engine for decryption.


### 3. Detailed Technical Stack & "The Why" Behind It

Our team paired low-level binary buffer allocation tools with client-side browser storage engines to secure data.

| Technology Component | Operational Reality | Architectural "Why" (The Engineering Reason) |
| --- | --- | --- |
| **`ArrayBuffer` & `Uint8Array` Views** | Converts document uploads into raw, low-level binary data sheets. | **Bare-Metal Speed:** Standard JavaScript strings struggle with binary data, often corrupting special characters. Working with raw array buffers lets us manipulate files at the byte layer with high accuracy. |
| **`DataView` Binary Marshalling** | Handles direct byte injection into standard ArrayBuffers without being affected by computer CPU architectures. | **Cross-Platform Safety:** Different computer chips read multi-byte integers in different orders (Big-Endian vs. Little-Endian). `DataView` allows us to enforce standard byte orderings, ensuring files hidden on an ARM phone can be decrypted on an Intel PC. |
| **`Blob` Memory Pipeline** | Assembles and groups data fragments into a single downloadable file object. | **Zero-Leak Processing:** By stream-stitching the blocks in memory, we bypass local server storage entirely. The decrypted or cloaked file exists purely in local browser RAM, maintaining absolute privacy. |

## Conclusion 
1. **Core Backbone:** `home.html`, `index.html`, and `global.css` form a clean, consistent design framework built around a **State-Driven Workspace Hub**.
2. **Spatial Module (Images):** Uses the HTML5 Canvas API to hide payloads inside the **Least Significant Bits (LSB)** of RGB channels.
3. **Temporal Module (Audio):** Uses digital signal processing to modify the LSBs of raw **16-bit PCM soundwave arrays**.
4. **Structural Modules (Video & Documents):** Bypasses compression issues completely by injecting encrypted data and custom packet headers directly **after file EOF boundaries**.

Every module is cleanly decoupled, highly performant, and functions entirely client-side for zero-trust security.
