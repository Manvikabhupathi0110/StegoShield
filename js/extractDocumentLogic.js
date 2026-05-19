const MARKER = "STEGO_SHIELD_V1"; // Ensure this matches document.html

        function updateFileLabel() {
            const input = document.getElementById('stegoInput');
            const display = document.getElementById('fileNameDisplay');
            const placeholder = document.getElementById('uploadPlaceholder');
            if (input.files[0]) {
                display.innerText = "📄 " + input.files[0].name;
                display.classList.remove('hidden');
                placeholder.classList.add('hidden');
            }
        }

        // REQUIRED DECRYPT FUNCTION
        async function decryptData(combinedData, password) {
            const encoder = new TextEncoder();
            const salt = combinedData.slice(0, 16);
            const iv = combinedData.slice(16, 28);
            const encryptedContent = combinedData.slice(28);

            const passwordKey = await window.crypto.subtle.importKey(
                "raw", encoder.encode(password), "PBKDF2", false, ["deriveKey"]
            );

            const aesKey = await window.crypto.subtle.deriveKey(
                { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
                passwordKey, { name: "AES-GCM", length: 256 }, false, ["decrypt"]
            );

            return await window.crypto.subtle.decrypt({ name: "AES-GCM", iv }, aesKey, encryptedContent);
        }

        async function processExtraction() {
            const fileInput = document.getElementById('stegoInput');
            const password = document.getElementById('stegoPass').value;
            const status = document.getElementById('status');
            const extractBtn = document.getElementById('extractBtn');

            if (!fileInput.files[0] || !password) {
                alert("Please select a file and enter the password!");
                return;
            }

            status.innerHTML = "🔍 <span class='animate-pulse text-teal-400'>Scanning binary structure...</span>";
            extractBtn.disabled = true;

            try {
                const arrayBuffer = await fileInput.files[0].arrayBuffer();
                const fullBuf = new Uint8Array(arrayBuffer);
                const markerBytes = new TextEncoder().encode(MARKER);
                
                // 1. Locate the Marker
                let index = -1;
                for (let i = fullBuf.length - markerBytes.length; i >= 0; i--) {
                    let match = true;
                    for (let j = 0; j < markerBytes.length; j++) {
                        if (fullBuf[i + j] !== markerBytes[j]) { match = false; break; }
                    }
                    if (match) { index = i; break; }
                }

                if (index === -1) throw new Error("No hidden data found in this file.");

                // 2. Parse the Header
                const headerStart = index + markerBytes.length;
                const view = new DataView(arrayBuffer, headerStart, 5);
                const nameLen = view.getUint8(0);
                const dataLen = view.getUint32(1);

                // 3. Extract Filename and Payload
                const nameStart = headerStart + 5;
                const nameEnd = nameStart + nameLen;
                const fileName = new TextDecoder().decode(fullBuf.slice(nameStart, nameEnd));

                const dataStart = nameEnd;
                const encryptedPart = fullBuf.slice(dataStart, dataStart + dataLen);

                // 4. Decrypt
                const decrypted = await decryptData(encryptedPart, password);
                const blob = new Blob([decrypted]);
                const url = URL.createObjectURL(blob);
                
                document.getElementById('extractionMsg').innerHTML = `✅ Found: <b>${fileName}</b>`;
                const downloadBtn = document.getElementById('downloadBtn');
                downloadBtn.classList.remove('hidden');
                downloadBtn.onclick = () => {
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = fileName; // Restores original name/extension
                    a.click();
                };

                status.innerHTML = "<span class='text-teal-400 font-bold'>Extraction Successful!</span>";
            } catch (err) {
                console.error(err);
                status.innerHTML = `<span class='text-red-400'>❌ ERROR: ${err.message}</span>`;
            } finally {
                extractBtn.disabled = false;
            }
        }
