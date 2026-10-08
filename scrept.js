
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


/* Type Hash Animation */

function typeHash(hash) {

    hashOutput.classList.remove("glitch");
    hashOutput.classList.remove("generating");

    /*
        Force browser to restart the animation
    */
    void hashOutput.offsetWidth;

    hashOutput.classList.add("glitch");
    hashOutput.classList.add("generating");

    hashOutput.textContent = "";

    let index = 0;

    const speed = 18;

    const typing = setInterval(() => {

        hashOutput.textContent += hash[index];

        index++;

        if (index >= hash.length) {

            clearInterval(typing);

            hashOutput.classList.remove("generating");

            setTimeout(() => {
                hashOutput.classList.remove("glitch");
            }, 250);

        }

    }, speed);
}


/* Generate Hash */

generateBtn.addEventListener("click", function () {

    const input =
        inputText.value;

    message.textContent = "";


    if (input.length === 0) {

        hashOutput.textContent =
            "Please enter some text first.";

        hashOutput.classList.remove("glitch");
        hashOutput.classList.remove("generating");

        message.textContent =
            "Enter text to generate a hash.";

        return;
    }


    const hash =
        simpleHash(input);


    typeHash(hash);


    message.textContent =
        "Hash generated successfully.";

});


/* Copy */

copyBtn.addEventListener("click", async function () {

    const hash =
        hashOutput.textContent.trim();


    if (
        !hash ||
        hash === "Your hash will appear here..." ||
        hash === "Please enter some text first."
    ) {
        return;
    }


    try {

        await navigator.clipboard.writeText(hash);

        copyBtn.textContent = "Copied!";

        message.textContent =
            "Hash copied to clipboard.";

        setTimeout(() => {

            copyBtn.textContent = "Copy";

        }, 1500);

    } catch (error) {

        message.textContent =
            "Could not copy the hash.";

    }

});

