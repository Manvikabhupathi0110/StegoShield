const MARKER = "STEGO_V1";

        function previewStego() {
            const input = document.getElementById('stegoInput');
            if (input.files[0]) {
                const preview = document.getElementById('uploadPreview');
                preview.src = URL.createObjectURL(input.files[0]);
                preview.classList.remove('hidden');
                document.getElementById('uploadPlaceholder').classList.add('hidden');
            }
        }

        async function decryptData(combinedData, password) {
            const encoder = new TextEncoder();
            const salt = combinedData.slice(0, 16);
            const iv = combinedData.slice(16, 28);
            const encryptedContent = combinedData.slice(28);
            const passwordKey = await window.crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveKey"]);
            const aesKey = await window.crypto.subtle.deriveKey(
                { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
                passwordKey, { name: "AES-GCM", length: 256 }, false, ["decrypt"]
            );
            return await window.crypto.subtle.decrypt({ name: "AES-GCM", iv }, aesKey, encryptedContent);
        }

        async function processExtraction() {
            const file = document.getElementById('stegoInput').files[0];
            const password = document.getElementById('stegoPass').value;
            const status = document.getElementById('status');
            if (!file || !password) return alert("Please select video and enter password.");

            status.innerHTML = "🔍 <span class='animate-pulse'>Scanning Video Data...</span>";

            try {
                const buffer = new Uint8Array(await file.arrayBuffer());
                const markerBytes = new TextEncoder().encode(MARKER);
                
                // Find marker index
                let index = -1;
                for (let i = buffer.length - markerBytes.length; i >= 0; i--) {
                    if (buffer[i] === markerBytes[0] && buffer.slice(i, i + markerBytes.length).every((v, k) => v === markerBytes[k])) {
                        index = i;
                        break;
                    }
                }

                if (index === -1) throw new Error("No hidden data found in this video.");

                let pos = index + markerBytes.length;
                const nameLen = buffer[pos]; pos++;
                const fileName = new TextDecoder().decode(buffer.slice(pos, pos + nameLen)); pos += nameLen;
                const encryptedData = buffer.slice(pos);

                const decrypted = await decryptData(encryptedData, password);
                const url = URL.createObjectURL(new Blob([decrypted]));

                document.getElementById('extractionMsg').innerHTML = `✅ <b>File Found:</b><br>${fileName}`;
                const btn = document.getElementById('downloadBtn');
                btn.classList.remove('hidden');
                btn.onclick = () => {
                    const a = document.createElement('a');
                    a.href = url; a.download = fileName; a.click();
                };
                status.innerHTML = "<span class='text-teal-400 font-bold'>Extraction Successful!</span>";
            } catch (e) {
                status.innerHTML = `<span class='text-red-400'>Error: ${e.message}</span>`;
            }
        }
