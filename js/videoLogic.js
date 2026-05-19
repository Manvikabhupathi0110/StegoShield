const MARKER = new TextEncoder().encode("STEGO_V1"); // Unique marker to find data

        function previewFile(type) {
            const input = document.getElementById(`${type}Input`);
            if (type === 'cover' && input.files[0]) {
                const preview = document.getElementById('coverPreview');
                preview.src = URL.createObjectURL(input.files[0]);
                preview.classList.remove('hidden');
                document.getElementById('coverPlaceholder').classList.add('hidden');
            } else if (input.files[0]) {
                document.getElementById('secretName').innerText = input.files[0].name;
            }
        }

        async function encryptData(rawData, password) {
            const encoder = new TextEncoder();
            const salt = window.crypto.getRandomValues(new Uint8Array(16));
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            const passwordKey = await window.crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveKey"]);
            const aesKey = await window.crypto.subtle.deriveKey(
                { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
                passwordKey, { name: "AES-GCM", length: 256 }, false, ["encrypt"]
            );
            const encrypted = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, rawData);
            const combined = new Uint8Array(16 + 12 + encrypted.byteLength);
            combined.set(salt, 0); combined.set(iv, 16); combined.set(new Uint8Array(encrypted), 28);
            return combined;
        }

        async function processEmbedding() {
            const videoFile = document.getElementById('coverInput').files[0];
            const secretFile = document.getElementById('secretInput').files[0];
            const password = document.getElementById('stegoPass').value;
            const status = document.getElementById('status');

            if (!videoFile || !secretFile || !password) return alert("Fill all fields!");

            status.innerHTML = "🔒 <span class='animate-pulse'>Processing Video Steganography...</span>";
            
            try {
                const encryptedData = await encryptData(await secretFile.arrayBuffer(), password);
                const videoBuffer = await videoFile.arrayBuffer();

                // Build Final Blob: [Video Data] + [MARKER] + [Filename Length] + [Filename] + [Encrypted Data]
                const nameBytes = new TextEncoder().encode(secretFile.name);
                const nameLen = new Uint8Array(1); nameLen[0] = nameBytes.length;

                const finalBlob = new Blob([videoBuffer, MARKER, nameLen, nameBytes, encryptedData], { type: videoFile.type });
                
                const link = document.createElement('a');
                link.download = `stego_${videoFile.name}`;
                link.href = URL.createObjectURL(finalBlob);
                link.click();

                status.innerHTML = "<span class='text-teal-400'>✅ Video Ready! Data appended to end of file.</span>";
            } catch (e) {
                status.innerText = "❌ Error: " + e.message;
            }
        }
