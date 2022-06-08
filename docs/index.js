/*
(c) 2022 Scot Watson  All Rights Reserved
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

let moduleVolumeRootFile = import("./VolumeRootFile.mjs");

moduleVolumeRootFile.then(function (module) {
  console.log(Object.getOwnPropertyNames(module));
}, console.error);

let moduleEncryptedVolume = import("./EncryptedVolume.mjs");

moduleEncryptedVolume.then(function (module) {
  console.log(Object.getOwnPropertyNames(module));
}, console.error);


let filesystemAPI = ('showOpenFilePicker' in window && 'showDirectoryPicker' in window);
let cryptoAPI = ('crypto' in self);

let width;
let height;
const arrRootEntries = [];
const mapFileKeys = new Map();

window.addEventListener("load", function () {
  if (filesystemAPI) {
    if (cryptoAPI) {
      document.body.style.backgroundColor = "black";
      document.body.style.color = "white";
      const btnMount = document.createElement("button");
      btnMount.innerHTML = "Mount Volume";
      document.body.appendChild(btnMount);
      btnMount.addEventListener("click", function (evt) {
        function storeVolumeFolder(hdlFolder) {
          hdlVolumeFolder = hdlFolder;
        }
        function getVolumeKey() {
          return promptForString("Enter the volume password:", "").then(hash_SHA256);
        }
        const promiseGetVolumeFolder = window.showDirectoryPicker().then(storeVolumeFolder, handleGetVolumeFolderError);
        const promiseGetVolumeKey = promiseGetVolumeFolder.then(getVolumeKey).catch(handleGetVolumeKeyError);
        const promiseGetRootFile = promiseGetVolumeKey.then(getRootFile).then(readRootFile, handleGetRootFileError);
        const promiseReadRootFile = promiseGetRootFile.then();
        function handleGetVolumeFolderError(error) {
          switch (error.type) {
            case "Error":
              throw new Error("User permission is required to access volume", { cause: error });
            default:
              throw new Error("Unexpected error", { cause: error });
          }
        }
        function handleGetVolumeKeyError(error) {
          switch (error.type) {
            case "Error":
              throw new Error("Volume password is required to access volume", { cause: error });
            default:
              throw new Error("Unexpected error", { cause: error });
          }
        }
        function handleGetRootFileError(error) {
          switch (error.name) {
            case "NotFoundError":
              return hdlVolumeFolder.getFileHandle("root.encrypt", {create: true}).then(newRootFile);
            default:
              throw new Error("Unexpected error", { cause: error });
          }
          function newRootFile(fileHandleRoot) {
            writableRoot = fileHandleRoot.createWritable();
            const contents = new ArrayBuffer(16);
            contents[0] = 0x20;
            contents[1] = 0x47;
            contents[2] = 0x7D;
            contents[3] = 0x46;
            const newVolumePassword = promptForString("No root file found.  Enter new volume password:", "").then(hash_SHA256);
            const encryptedContents = writeEncryptFile(bufferKey, bufferData);
            writableRoot.write(encryptedContents);
          }
        }
      });
    } else {
      let textMsg = document.createTextNode("Crypto API is not supported.");
      document.body.appendChild(textMsg);
    }
  } else {
    let textMsg = document.createTextNode("File System Access API is not supported.");
    document.body.appendChild(textMsg);
  }
});


// If user clicks OK, promise resolves to the value entered by the user
// If user clicks Cancel, promise rejects
// strPrompt: (String) The prompt given to the user
// strDefault: (String) The default response
// Returns : (Promise, resolving to String)
function promptForString(strPrompt, strDefault) {
  return new Promise(function (resolve, reject) {
    const strResponse = window.prompt(strPrompt, strDefault);
    if (strResponse === null) {
      resolve(strResponse);
    } else {
      reject(new Error("User declined to respond."));
    }
  });
}

// If not entered, prompts the user for the master password
// If entered, returns the previously entered value
// Returns : (Promise, resolving to ArrayBuffer)
function getMasterKey() {
  return promptForString("Enter the master password:", "").then(hash_SHA256(masterPassword));
}

// Produces random data of the requested size
// numBytes: (Number) Size of buffer of random values in bytes
// Return: (ArrayBuffer) Random values
function randomData(numBytes) {
  let retVal = new Uint8Array(numBytes);
  self.crypto.getRandomValues(retVal);
  return retVal.buffer;
}

// Hashes the given message
// Using SHA-256
// message: (Uint8Array) data to be hashed
// Returns: (Promise, resolving to ArrayBuffer)
function hash_SHA256(message) {
  return window.crypto.subtle.digest("SHA-256", message);
}

// Creates a blob of the original file contents
// bufferKey: (ArrayBuffer) key to decrypt the file
// bufferData: (ArrayBuffer) contents of the encrypt file
// Returns: (Blob) decrypted contents
function readEncryptFile(bufferKey, bufferData) {
  const arrayHeaderBlock = new Uint8Array(bufferData, 0x10);
  const valid = (headerBlock[0] === 0x9F) && (headerBlock[1] === 0x22) && (headerBlock[2] === 0xDB) && (headerBlock[3] === 0x5C);
  if (!valid) {
    throw new Error("Invalid format");
  }
  const arrayIV = new Uint8Array(bufferData, 0x10, 0x10);
  const arrayContent = new Uint8Array(bufferData, 0x20);
  const arrayKey = new Uint8Array(bufferKey);
  return new Blob([ decrypt_AES256_CBC(arrayKey, arrayContent, arrayIV) ]);
}

// Creates a blob to be saved as a *.encrypt file
// bufferKey: (ArrayBuffer) key to decrypt the file
// bufferData: (ArrayBuffer) contents of the encrypt file
// Returns: (Blob) decrypted contents
function writeEncryptFile(bufferKey, bufferData) {
  const arrayHeaderBlock = new Uint8Array(0x10);
  headerBlock[0] = 0x9F;
  headerBlock[1] = 0x22;
  headerBlock[2] = 0xDB;
  headerBlock[3] = 0x5C;
  const arrayContent = new Uint8Array(bufferData, 0x20);
  const arrayKey = new Uint8Array(bufferKey);
  const objEncrypt = encrypt_AES256_CBC(arrayKey, arrayContent);
  return new Blob([ arrayHeaderBlock, objEncrypt.iv, objEncrypt.ciphertext ]);
}

// Encrypts the given plaintext with the given key using the given iv, if provided
// Using AES-256 block cipher in CBC mode
// Padded with PKCS#7, (RFC2315 Section 10.3, step 2)
// Uint8Array is used, instead of ArrayBuffer, to allow a portion of a buffer to be used
// plaintext: (Uint8Array) plain (unencrypted) contents
// key: (Uint8Array) key to use to encrypt contents
// iv: (Uint8Array, optional) initialization vector
// Returns : (Promise, resolving to Object, containing members iv and ciphertext)
//   iv: (Uint8Array) initialization vector
//   ciphertext: (ArrayBuffer) encrypted contents
function encrypt_AES256_CBC(plaintext, key, iv) {
  let retVal = {};
  if (!iv) {
    retVal.iv = new Uint8Array(randomData(16));
  }
  return window.crypto.subtle.importKey("raw", key, "AES-CBC", false, [ "encrypt", "decrypt" ]).then(function (myImportedKey) {
    let myAesCbcParams = {name: "AES-CBC", iv: retVal.iv};
    return window.crypto.subtle.encrypt(myAesCbcParams, myImportedKey, plaintext);
  }).then(function (ciphertext) {
    retVal.ciphertext = ciphertext;
    return retVal;
  });
}

// Decrypts the given ciphertext with the given key
// Using AES-256 block cipher in CBC mode
// Assumes padding of PKCS#7, (RFC2315 Section 10.3, step 2)
// Uint8Array is used, instead of ArrayBuffer, to allow a portion of a buffer to be used
// ciphertext: (Uint8Array) encrypted contents
// key: (Uint8Array) key to decrypt the contents
// iv: (Uint8Array) initialization vector
// Returns : (Promise, resolving to ArrayBuffer) plain (unencrypted) contents
function decrypt_AES256_CBC(ciphertext, key, iv) {
  return window.crypto.subtle.importKey("raw", key, "AES-CBC", false, [ "encrypt", "decrypt" ]).then(function (myImportedKey) {
    let myAesCbcParams = {name: "AES-CBC", iv: iv};
    return window.crypto.subtle.decrypt(myAesCbcParams, myImportedKey, ciphertext);
  });
}
