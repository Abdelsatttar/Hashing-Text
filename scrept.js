function rotateLeft(value, bits) {

    return (
        (value << bits) |
        (value >>> (32 - bits))
    ) >>> 0;

}


function simpleHash(input) {

    let hash1 = 2166136261 >>> 0;
    let hash2 = 0xABCDEF01 >>> 0;
    let hash3 = 0x12345678 >>> 0;
    let hash4 = 0x87654321 >>> 0;


    for (let i = 0; i < input.length; i++) {

        const c = input.charCodeAt(i);


        // Hash 1

        hash1 ^= c;

        hash1 =
            Math.imul(hash1, 16777619) >>> 0;


        // Hash 2

        hash2 ^= hash1;

        hash2 =
            rotateLeft(hash2, 5);

        hash2 =
            Math.imul(hash2, 31) >>> 0;


        // Hash 3

        hash3 =
            (hash3 + (hash2 ^ c)) >>> 0;

        hash3 =
            rotateLeft(hash3, 7);


        // Hash 4

        hash4 ^=
            (hash3 + hash1) >>> 0;

        hash4 =
            rotateLeft(hash4, 11);
    }


    return (
        toHex(hash1) +
        toHex(hash2) +
        toHex(hash3) +
        toHex(hash4)
    );
}


function toHex(value) {

    return value
        .toString(16)
        .padStart(8, "0")
        .toUpperCase();

}


/* Elements */

const inputText =
    document.getElementById("inputText");

const generateBtn =
    document.getElementById("generateBtn");

const hashOutput =
    document.getElementById("hashOutput");

const copyBtn =
    document.getElementById("copyBtn");

const charCount =
    document.getElementById("charCount");

const message =
    document.getElementById("message");


/* Character counter */

inputText.addEventListener("input", function () {

    const count = inputText.value.length;

    charCount.textContent =
        `${count} characters`;

});


/* Generate Hash */

generateBtn.addEventListener("click", function () {

    const input =
        inputText.value;


    if (input.length === 0) {

        hashOutput.textContent =
            "Please enter some text first.";

        return;
    }


    const hash =
        simpleHash(input);


    hashOutput.textContent =
        hash;


    message.textContent =
        "Hash generated successfully.";

});


/* Copy */

copyBtn.addEventListener("click", async function () {

    const hash =
        hashOutput.textContent;


    if (
        !hash ||
        hash === "Your hash will appear here..."
    ) {
        return;
    }


    await navigator.clipboard.writeText(hash);


    message.textContent =
        "Hash copied to clipboard.";

});