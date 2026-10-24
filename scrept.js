"use strict";

const byId = function (id) { return document.getElementById(id); };

function setFeedback(id, text, isError) {
  const node = byId(id);
  if (!node) return;
  node.textContent = text || "";
  node.classList.toggle("error", Boolean(isError));
}

function setOutput(id, value, placeholder) {
  const node = byId(id);
  if (!node) return;
  const hasValue = value !== null && value !== undefined && String(value).length > 0;
  node.textContent = hasValue ? String(value) : (placeholder || "");
  node.classList.toggle("placeholder-value", !hasValue);
}

function charCount(value) {
  return Array.from(value).length;
}

function bindCounter(inputId, counterId) {
  const input = byId(inputId);
  const counter = byId(counterId);
  if (!input || !counter) return;
  const update = function () {
    const count = charCount(input.value);
    counter.textContent = count + (count === 1 ? " character" : " characters");
  };
  input.addEventListener("input", update);
  update();
}

let toastTimer = null;
function showToast(message, isError) {
  const toast = byId("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.toggle("toast-error", Boolean(isError));
  toast.classList.add("show");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    toast.classList.remove("show");
  }, 2600);
}

function bytesToHex(bytes) {
  let result = "";
  for (let i = 0; i < bytes.length; i += 1) {
    result += bytes[i].toString(16).padStart(2, "0");
  }
  return result;
}

function hexToBytes(hex) {
  const clean = String(hex || "").trim();
  if (clean.length % 2 !== 0 || !/^[0-9a-f]*$/i.test(clean)) {
    throw new Error("Invalid hexadecimal string.");
  }
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.slice(i, i + 2), 16);
  }
  return bytes;
}

function bytesToBase64(bytes) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const end = Math.min(offset + chunkSize, bytes.length);
    for (let i = offset; i < end; i += 1) {
      binary += String.fromCharCode(bytes[i]);
    }
  }
  return btoa(binary);
}

function base64ToBytes(base64) {
  const binary = atob(String(base64 || "").replace(/\s/g, ""));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function randomBytes(length) {
  const output = new Uint8Array(length);
  for (let offset = 0; offset < length; offset += 65536) {
    const chunk = output.subarray(offset, Math.min(offset + 65536, length));
    crypto.getRandomValues(chunk);
  }
  return output;
}

function concatBytes(first, second) {
  const result = new Uint8Array(first.length + second.length);
  result.set(first, 0);
  result.set(second, first.length);
  return result;
}

function constantTimeEqual(left, right) {
  const a = String(left);
  const b = String(right);
  let diff = a.length ^ b.length;
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i += 1) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

async function shaDigestHex(algorithm, text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest(algorithm, bytes);
  return bytesToHex(new Uint8Array(digest));
}

/* A small MD5 implementation is included for the classroom task only. */
function md5Hex(input) {
  const message = new TextEncoder().encode(input);
  const bitLength = message.length * 8;
  const paddedLength = Math.ceil((message.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(message);
  padded[message.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(paddedLength - 8, bitLength >>> 0, true);
  view.setUint32(paddedLength - 4, Math.floor(bitLength / 0x100000000) >>> 0, true);

  const shifts = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
  ];
  const constants = [];
  for (let i = 0; i < 64; i += 1) {
    constants.push(Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000) >>> 0);
  }

  let h0 = 0x67452301 | 0;
  let h1 = 0xefcdab89 | 0;
  let h2 = 0x98badcfe | 0;
  let h3 = 0x10325476 | 0;

  function rotateLeft(value, amount) {
    return (value << amount) | (value >>> (32 - amount));
  }
  function wordToLittleEndianHex(word) {
    return ((word       ) & 255).toString(16).padStart(2, "0") +
           ((word >>>  8) & 255).toString(16).padStart(2, "0") +
           ((word >>> 16) & 255).toString(16).padStart(2, "0") +
           ((word >>> 24) & 255).toString(16).padStart(2, "0");
  }

  for (let offset = 0; offset < paddedLength; offset += 64) {
    const words = new Int32Array(16);
    for (let j = 0; j < 16; j += 1) {
      words[j] = view.getInt32(offset + j * 4, true);
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;

    for (let i = 0; i < 64; i += 1) {
      let f;
      let g;
      if (i < 16) {
        f = (b & c) | ((~b) & d);
        g = i;
      } else if (i < 32) {
        f = (d & b) | ((~d) & c);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = b ^ c ^ d;
        g = (3 * i + 5) % 16;
      } else {
        f = c ^ (b | (~d));
        g = (7 * i) % 16;
      }
      const previousD = d;
      d = c;
      c = b;
      const sum = (a + f + (constants[i] | 0) + words[g]) | 0;
      b = (b + rotateLeft(sum, shifts[i])) | 0;
      a = previousD;
    }

    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
  }

  return wordToLittleEndianHex(h0) +
         wordToLittleEndianHex(h1) +
         wordToLittleEndianHex(h2) +
         wordToLittleEndianHex(h3);
}

async function copyText(text) {
  if (!text) {
    showToast("There is no result to copy yet.", true);
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    showToast("Copied to clipboard.");
  } catch (error) {
    const helper = document.createElement("textarea");
    helper.value = text;
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.appendChild(helper);
    helper.select();
    const copied = document.execCommand("copy");
    helper.remove();
    if (copied) showToast("Copied to clipboard.");
    else showToast("Copy was blocked by the browser.", true);
  }
}

document.querySelectorAll("[data-copy]").forEach(function (button) {
  button.addEventListener("click", function () {
    const target = byId(button.getAttribute("data-copy"));
    if (!target || target.classList.contains("placeholder-value")) {
      showToast("Generate a result before copying it.", true);
      return;
    }
    copyText(target.textContent);
  });
});

/* TASK 01 — Caesar cipher */
function caesarTransform(text, shift) {
  const normalizedShift = ((Number(shift) % 26) + 26) % 26;
  return Array.from(text).map(function (character) {
    const code = character.charCodeAt(0);
    if (code >= 65 && code <= 90) {
      return String.fromCharCode(((code - 65 + normalizedShift) % 26) + 65);
    }
    if (code >= 97 && code <= 122) {
      return String.fromCharCode(((code - 97 + normalizedShift) % 26) + 97);
    }
    return character;
  }).join("");
}

bindCounter("caesarInput", "caesarCount");
byId("caesarEncrypt").addEventListener("click", function () {
  const input = byId("caesarInput").value;
  const shift = Number(byId("caesarShift").value);
  if (!input.length) {
    setOutput("caesarOutput", "", "Enter a message to encrypt.");
    setFeedback("caesarFeedback", "Please enter a message first.", true);
    return;
  }
  setOutput("caesarOutput", caesarTransform(input, shift));
  setFeedback("caesarFeedback", "Encrypted with a shift of " + shift + ".", false);
});
byId("caesarDecrypt").addEventListener("click", function () {
  const input = byId("caesarInput").value;
  const shift = Number(byId("caesarShift").value);
  if (!input.length) {
    setOutput("caesarOutput", "", "Enter a message to decrypt.");
    setFeedback("caesarFeedback", "Please enter a message first.", true);
    return;
  }
  setOutput("caesarOutput", caesarTransform(input, -shift));
  setFeedback("caesarFeedback", "Decrypted using a shift of " + shift + ".", false);
});

/* TASK 02 — Caesar brute-force candidates */
byId("bruteRun").addEventListener("click", function () {
  const input = byId("bruteInput").value;
  const results = byId("bruteResults");
  results.replaceChildren();
  if (!input.length) {
    byId("bruteEmpty").classList.remove("brute-empty-hidden");
    setFeedback("caesarFeedback", "", false);
    showToast("Enter the encrypted message first.", true);
    return;
  }
  byId("bruteEmpty").classList.add("brute-empty-hidden");
  for (let shift = 1; shift <= 25; shift += 1) {
    const card = document.createElement("article");
    card.className = "brute-card";
    const top = document.createElement("div");
    top.className = "brute-card-top";
    const key = document.createElement("span");
    key.className = "brute-key";
    key.textContent = "KEY " + String(shift).padStart(2, "0") + " · SHIFT " + shift;
    const use = document.createElement("button");
    use.type = "button";
    use.textContent = "Use result ↗";
    const candidate = document.createElement("span");
    candidate.className = "brute-candidate";
    candidate.textContent = caesarTransform(input, -shift);
    use.addEventListener("click", function () {
      setOutput("caesarOutput", candidate.textContent);
      byId("caesarInput").value = candidate.textContent;
      byId("caesarCount").textContent = charCount(candidate.textContent) + " characters";
      setFeedback("caesarFeedback", "Candidate from brute-force key " + shift + " copied to the Caesar lab.", false);
      showToast("Candidate copied to the Caesar lab.");
    });
    top.append(key, use);
    card.append(top, candidate);
    results.appendChild(card);
  }
  showToast("Generated all 25 Caesar key possibilities.");
});

/* TASK 03 — MD5 and SHA digest lab */
bindCounter("hashInput", "hashCount");
const hashBitLengths = { "MD5": 128, "SHA-1": 160, "SHA-256": 256, "SHA-384": 384, "SHA-512": 512 };
byId("hashMethod").addEventListener("change", function () {
  const algorithm = byId("hashMethod").value;
  byId("hashMetaAlgorithm").textContent = algorithm;
  byId("hashMetaBits").textContent = hashBitLengths[algorithm] + " bits";
  byId("hashMetaLength").textContent = (hashBitLengths[algorithm] / 4) + " characters";
});
byId("hashGenerate").addEventListener("click", async function () {
  const input = byId("hashInput").value;
  const algorithm = byId("hashMethod").value;
  const button = byId("hashGenerate");
  if (!input.length) {
    setOutput("hashOutput", "", "Enter text to generate a hash.");
    setFeedback("hashFeedback", "Please enter text before generating a digest.", true);
    return;
  }
  button.disabled = true;
  button.textContent = "Calculating…";
  setFeedback("hashFeedback", "", false);
  try {
    let digest;
    if (algorithm === "MD5") {
      digest = md5Hex(input);
    } else {
      digest = await shaDigestHex(algorithm, input);
    }
    setOutput("hashOutput", digest);
    setFeedback("hashFeedback", "Digest generated. Identical input and algorithm produce the same digest.", false);
  } catch (error) {
    setFeedback("hashFeedback", "Hashing is unavailable in this browser context. Open the page using HTTPS or localhost.", true);
  } finally {
    button.disabled = false;
    button.innerHTML = "Generate hash <span aria-hidden=\"true\">→</span>";
  }
});

/* TASK 04 — One-Time Pad. Keys live only in this page's JavaScript object. */
const otpKeyStore = Object.create(null);
let lastOtpKeyId = "";
bindCounter("otpPlain", "otpCount");
byId("otpEncrypt").addEventListener("click", function () {
  try {
    const plaintext = byId("otpPlain").value;
    if (!plaintext.length) {
      setOutput("otpCiphertext", "", "Enter plaintext before encrypting.");
      setFeedback("otpFeedback", "Please enter a plaintext message first.", true);
      return;
    }
    const messageBytes = new TextEncoder().encode(plaintext);
    const pad = randomBytes(messageBytes.length);
    const cipher = new Uint8Array(messageBytes.length);
    for (let i = 0; i < messageBytes.length; i += 1) {
      cipher[i] = messageBytes[i] ^ pad[i];
    }
    let idBytes = randomBytes(4);
    let keyId = "otp-" + bytesToHex(idBytes);
    while (Object.prototype.hasOwnProperty.call(otpKeyStore, keyId)) {
      idBytes = randomBytes(4);
      keyId = "otp-" + bytesToHex(idBytes);
    }
    otpKeyStore[keyId] = {
      key: pad,
      byteLength: messageBytes.length,
      createdAt: new Date().toLocaleString(),
      encrypted: true
    };
    lastOtpKeyId = keyId;
    setOutput("otpCiphertext", bytesToBase64(cipher));
    byId("otpKeyId").textContent = keyId;
    byId("otpDecryptKeyId").value = keyId;
    byId("otpDecryptInput").value = bytesToBase64(cipher);
    byId("otpUseKeyId").disabled = false;
    setOutput("otpPlainResult", "");
    setFeedback("otpFeedback", "Encrypted " + messageBytes.length + " UTF-8 bytes. The random pad is stored under this key ID in memory.", false);
    showToast("One-time pad key generated and saved in memory.");
  } catch (error) {
    setFeedback("otpFeedback", "Secure random key generation failed in this browser context.", true);
  }
});
byId("otpUseKeyId").addEventListener("click", function () {
  if (!lastOtpKeyId || !otpKeyStore[lastOtpKeyId]) return;
  byId("otpDecryptKeyId").value = lastOtpKeyId;
  byId("otpDecryptInput").value = byId("otpCiphertext").textContent;
  byId("otpDecryptKeyId").focus();
  showToast("Latest key ID and ciphertext are ready for decryption.");
});
byId("otpDecrypt").addEventListener("click", function () {
  try {
    const keyId = byId("otpDecryptKeyId").value.trim();
    const ciphertextText = byId("otpDecryptInput").value.trim();
    if (!keyId || !ciphertextText) {
      setOutput("otpPlainResult", "", "Enter both a key ID and ciphertext.");
      setFeedback("otpFeedback", "A key ID and ciphertext are required to decrypt.", true);
      return;
    }
    const entry = otpKeyStore[keyId];
    if (!entry) {
      setOutput("otpPlainResult", "", "This key is not available in the current page session.");
      setFeedback("otpFeedback", "Key not found. It may be from another session or the page may have been refreshed.", true);
      return;
    }
    const cipher = base64ToBytes(ciphertextText);
    if (cipher.length !== entry.key.length) {
      setOutput("otpPlainResult", "", "Ciphertext length does not match this key.");
      setFeedback("otpFeedback", "Ciphertext length does not match the stored pad. Check the ciphertext and key ID.", true);
      return;
    }
    const plainBytes = new Uint8Array(cipher.length);
    for (let i = 0; i < cipher.length; i += 1) {
      plainBytes[i] = cipher[i] ^ entry.key[i];
    }
    const plaintext = new TextDecoder("utf-8", { fatal: true }).decode(plainBytes);
    setOutput("otpPlainResult", plaintext);
    setFeedback("otpFeedback", "Decryption successful using " + keyId + ".", false);
    showToast("Ciphertext decrypted successfully.");
  } catch (error) {
    setOutput("otpPlainResult", "", "Unable to decrypt this ciphertext.");
    setFeedback("otpFeedback", "Invalid Base64 data or the ciphertext is not valid UTF-8 for this key.", true);
  }
});

/* TASK 05 — Password accounts stored as objects, never as plaintext. */
const passwordUsers = Object.create(null);
let revealPasswordHashes = false;

async function makeSaltedPasswordHash(saltBytes, password) {
  const passwordBytes = new TextEncoder().encode(password);
  const combined = concatBytes(saltBytes, passwordBytes);
  const result = await crypto.subtle.digest("SHA-256", combined);
  return bytesToHex(new Uint8Array(result));
}

function renderUsers() {
  const tbody = byId("userRows");
  tbody.replaceChildren();
  const usernames = Object.keys(passwordUsers);
  byId("userCount").textContent = usernames.length + (usernames.length === 1 ? " account" : " accounts");
  if (usernames.length === 0) {
    const row = document.createElement("tr");
    row.className = "table-empty";
    const cell = document.createElement("td");
    cell.colSpan = 3;
    cell.textContent = "No accounts yet. Register one above to get started.";
    row.appendChild(cell);
    tbody.appendChild(row);
    return;
  }
  usernames.sort().forEach(function (key) {
    const user = passwordUsers[key];
    const row = document.createElement("tr");
    const nameCell = document.createElement("td");
    nameCell.textContent = user.username;
    const hashCell = document.createElement("td");
    hashCell.className = "hash-cell" + (revealPasswordHashes ? "" : " hidden-hash");
    hashCell.textContent = revealPasswordHashes ? user.hash : "••••••••••••••••••••••••••••••••";
    hashCell.title = revealPasswordHashes ? "Salted SHA-256 digest" : "Turn on Show hashes to reveal the stored digest";
    const dateCell = document.createElement("td");
    dateCell.textContent = user.createdAt;
    row.append(nameCell, hashCell, dateCell);
    tbody.appendChild(row);
  });
}
byId("revealHashes").addEventListener("change", function () {
  revealPasswordHashes = byId("revealHashes").checked;
  renderUsers();
});

byId("signupForm").addEventListener("submit", async function (event) {
  event.preventDefault();
  const username = byId("signupUsername").value.trim();
  const usernameKey = username.toLowerCase();
  const password = byId("signupPassword").value;
  setFeedback("signupFeedback", "", false);
  if (!username) {
    setFeedback("signupFeedback", "Please choose a username.", true);
    return;
  }
  if (password.length < 8) {
    setFeedback("signupFeedback", "Use at least 8 characters for this demo password.", true);
    return;
  }
  if (Object.prototype.hasOwnProperty.call(passwordUsers, usernameKey)) {
    setFeedback("signupFeedback", "That username already exists in this demo.", true);
    return;
  }
  try {
    const salt = randomBytes(16);
    const hash = await makeSaltedPasswordHash(salt, password);
    passwordUsers[usernameKey] = {
      username: username,
      salt: bytesToBase64(salt),
      hash: hash,
      createdAt: new Date().toLocaleString()
    };
    byId("signupPassword").value = "";
    renderUsers();
    setFeedback("signupFeedback", "Account created. Only the salted hash is stored in the in-memory object.", false);
    showToast("Account registered. Plaintext password was not stored.");
  } catch (error) {
    setFeedback("signupFeedback", "Secure hashing is unavailable. Open this page over HTTPS or localhost.", true);
  }
});

byId("loginForm").addEventListener("submit", async function (event) {
  event.preventDefault();
  const username = byId("loginUsername").value.trim();
  const password = byId("loginPassword").value;
  const user = passwordUsers[username.toLowerCase()];
  setFeedback("loginFeedback", "", false);
  if (!user) {
    setFeedback("loginFeedback", "Invalid username or password.", true);
    return;
  }
  try {
    const salt = base64ToBytes(user.salt);
    const submittedHash = await makeSaltedPasswordHash(salt, password);
    if (constantTimeEqual(submittedHash, user.hash)) {
      setFeedback("loginFeedback", "Login successful. Password hash matched.", false);
      showToast("Login verified successfully.");
    } else {
      setFeedback("loginFeedback", "Invalid username or password.", true);
    }
  } catch (error) {
    setFeedback("loginFeedback", "Could not verify this password in the current browser context.", true);
  }
});

/* TASK 06 — HMAC preview, send to an in-page outbox, and verify later. */
const sentMessages = [];
let currentMacPreview = null;
bindCounter("macMessage", "macCount");

function selectedMacState(text) {
  byId("macMetaState").textContent = text;
}

function invalidateMacPreview() {
  currentMacPreview = null;
  byId("macSendBtn").disabled = true;
  setOutput("macTagOutput", "", "Generate a tag to preview it here.");
  selectedMacState("Needs preview");
  setFeedback("macFeedback", "", false);
}
["macMessage", "macSecret", "macAlgorithm"].forEach(function (id) {
  byId(id).addEventListener("input", invalidateMacPreview);
  byId(id).addEventListener("change", invalidateMacPreview);
});

async function createMac(message, secret, algorithm) {
  const keyBytes = new TextEncoder().encode(secret);
  const imported = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: { name: algorithm } },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", imported, new TextEncoder().encode(message));
  return bytesToHex(new Uint8Array(signature));
}

byId("macAlgorithm").addEventListener("change", function () {
  const algorithm = byId("macAlgorithm").value;
  byId("macMetaAlgorithm").textContent = "HMAC-" + algorithm;
  byId("macMetaBits").textContent = (algorithm === "SHA-256" ? 256 : 512) + " bits";
});

byId("macPreviewBtn").addEventListener("click", async function () {
  const message = byId("macMessage").value;
  const secret = byId("macSecret").value;
  const algorithm = byId("macAlgorithm").value;
  if (!message.length) {
    setFeedback("macFeedback", "Enter the message before generating its tag.", true);
    invalidateMacPreview();
    return;
  }
  if (!secret.length) {
    setFeedback("macFeedback", "Enter a shared secret key before generating the tag.", true);
    invalidateMacPreview();
    return;
  }
  const button = byId("macPreviewBtn");
  button.disabled = true;
  button.textContent = "Generating tag…";
  try {
    const tag = await createMac(message, secret, algorithm);
    currentMacPreview = { message: message, secret: secret, algorithm: algorithm, tag: tag };
    setOutput("macTagOutput", tag);
    selectedMacState("Preview ready");
    byId("macSendBtn").disabled = false;
    setFeedback("macFeedback", "Tag generated. Review this tag before sending; changing the message, key, or algorithm invalidates the preview.", false);
    showToast("HMAC tag generated for preview.");
  } catch (error) {
    currentMacPreview = null;
    byId("macSendBtn").disabled = true;
    setFeedback("macFeedback", "HMAC is unavailable in this browser context. Use HTTPS or localhost.", true);
  } finally {
    button.disabled = false;
    button.innerHTML = "Generate &amp; preview tag <span aria-hidden=\"true\">→</span>";
  }
});

async function verifySentMessage(record) {
  const secret = byId("macSecret").value;
  if (!secret) {
    showToast("Enter the shared key used to generate the message tag.", true);
    return false;
  }
  try {
    const recalculated = await createMac(record.message, secret, record.algorithm);
    return constantTimeEqual(recalculated, record.tag);
  } catch (error) {
    return false;
  }
}

function renderSentMessages() {
  const list = byId("sentMessages");
  list.replaceChildren();
  byId("messageCount").textContent = sentMessages.length + (sentMessages.length === 1 ? " sent" : " sent");
  if (!sentMessages.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    const icon = document.createElement("span");
    icon.className = "empty-icon";
    icon.textContent = "↗";
    const message = document.createElement("span");
    message.textContent = "Nothing sent yet. Generate a tag, preview it, then send your message.";
    empty.append(icon, message);
    list.appendChild(empty);
    return;
  }
  sentMessages.slice().reverse().forEach(function (record) {
    const item = document.createElement("article");
    item.className = "sent-item";
    const header = document.createElement("div");
    header.className = "sent-item-header";
    const title = document.createElement("span");
    title.className = "sent-item-title";
    title.textContent = "Message " + String(record.number).padStart(2, "0") + " · " + record.algorithm;
    const state = document.createElement("span");
    state.className = "sent-state";
    state.textContent = record.verified === true ? "VERIFIED" : "SENT WITH MAC";
    header.append(title, state);
    const body = document.createElement("p");
    body.className = "sent-message";
    body.textContent = record.message;
    const tagLabel = document.createElement("div");
    tagLabel.className = "sent-tag-label";
    tagLabel.textContent = "ATTACHED MAC TAG";
    const tag = document.createElement("div");
    tag.className = "sent-tag";
    tag.textContent = record.tag;
    const foot = document.createElement("div");
    foot.className = "sent-item-foot";
    const time = document.createElement("span");
    time.textContent = record.createdAt;
    const verify = document.createElement("button");
    verify.type = "button";
    verify.className = "text-button";
    verify.textContent = "Verify with current key";
    verify.style.marginLeft = "0";
    verify.addEventListener("click", async function () {
      verify.disabled = true;
      verify.textContent = "Verifying…";
      const valid = await verifySentMessage(record);
      record.verified = valid;
      state.textContent = valid ? "VERIFIED" : "VERIFY FAILED";
      state.style.color = valid ? "#7bd9b4" : "#ff9baf";
      state.style.background = valid ? "rgba(96,214,173,.08)" : "rgba(255,130,155,.08)";
      verify.textContent = valid ? "Tag verified ✓" : "Try verify again";
      verify.disabled = false;
      if (valid) showToast("Message MAC verified.");
      else showToast("MAC did not match. Check the shared secret key.", true);
    });
    foot.append(time, verify);
    item.append(header, body, tagLabel, tag, foot);
    list.appendChild(item);
  });
}

byId("macSendBtn").addEventListener("click", function () {
  const message = byId("macMessage").value;
  const secret = byId("macSecret").value;
  const algorithm = byId("macAlgorithm").value;
  if (!currentMacPreview ||
      currentMacPreview.message !== message ||
      currentMacPreview.secret !== secret ||
      currentMacPreview.algorithm !== algorithm) {
    invalidateMacPreview();
    setFeedback("macFeedback", "Generate and review a fresh tag before sending this message.", true);
    return;
  }
  sentMessages.push({
    number: sentMessages.length + 1,
    message: currentMacPreview.message,
    tag: currentMacPreview.tag,
    algorithm: currentMacPreview.algorithm,
    createdAt: new Date().toLocaleString(),
    verified: false
  });
  renderSentMessages();
  currentMacPreview = null;
  byId("macSendBtn").disabled = true;
  selectedMacState("Sent");
  setFeedback("macFeedback", "Message added to the demo outbox with the exact tag you previewed.", false);
  showToast("Message added to the in-page outbox with its MAC tag.");
});

/* Initial state */
renderUsers();
renderSentMessages();
byId("hashMetaAlgorithm").textContent = byId("hashMethod").value;
byId("hashMetaBits").textContent = hashBitLengths[byId("hashMethod").value] + " bits";
byId("hashMetaLength").textContent = (hashBitLengths[byId("hashMethod").value] / 4) + " characters";
byId("macMetaAlgorithm").textContent = "HMAC-" + byId("macAlgorithm").value;
byId("macMetaBits").textContent = (byId("macAlgorithm").value === "SHA-256" ? 256 : 512) + " bits";
