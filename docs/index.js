let moduleVolumeRootFile = import("./VolumeRootFile.js");

moduleVolumeRootFile.then(console.log, console.error);

/*
(c) 2022 Scot Watson  All Rights Reserved
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

let filesystemAPI = ('showOpenFilePicker' in window && 'showDirectoryPicker' in window);
let cryptoAPI = ('crypto' in self);

let width;
let height;
const arrRootEntries = [];
const mapFileKeys = new Map();

class EncryptedVolume {
  constructor(hdlFolder, bufferKey) {
    function getRootFile() {
      return hdlFolder.getFileHandle("root.encrypt", {create: false});
    }
    function readRootFile(bufferKey) {
      const fileRoot = fileHandleRoot.getFile();
      const blobRootFile = readEncryptFile(bufferKey, fileRoot.arrayBuffer());
      const bufferContents = blobRootFile.arrayBuffer();
      const streamContents = new DataReadableStream(bufferContents);
      arrRootEntries.clear();
      while (!streamContents.atEnd()) {
        try {
          const record = {};
          try {
            record.dateValue = streamContents.getBigInt64(true);
            record.numType = streamContents.getUint16(true);
            const numLength = streamContents.getUint16(true);
            record.bufferData = streamContents.getBuffer(numLength);
          } catch (error) {
            switch (error.type) {
              case "RangeError":
                throw new Error("Unexpected end of record", { cause: error });
              default:
                throw new Error("Unexpected error", { cause: error });
            }
          }
          record.dateTimestamp = new Date(record.dateValue);
          if (record.dateTimestamp.toValue() === NaN) {
            throw new Error("Invalid date");
          }
          record.objData = interpretData(record.numType, record.bufferData);
          delete record.dateValue;
          delete record.bufferData;
          Object.freeze(record);
          arrRootEntries.push(record);
        } catch (error) {
          console.error(error);
        }
      }
      function interpretData(numType, bufferData) {
        const objRet = {};
        const viewData = new DataView(bufferData);
        switch (numType) {
          case 0x1CD8:  // Remove file
            if (bufferData.byteLength !== 4) {
              throw new Error("Invalid record length");
            }
            objRet.numFileID = viewData.getUint32(0, true)
            return objRet;
          case 0x4BD8:  // New file (& key)
            if (bufferData.byteLength !== 36) {
              throw new Error("Invalid record length");
            }
            objRet.numFileID = viewData.getUint32(0, true)
            objRet.bufferKey = bufferData.slice(4, 36);
            return objRet;
          default:
            throw new Error("Unrecognized type");
        }
      }
    }
  }
}

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

// Allows an ArrayBuffer to be accessed as a readable stream
class DataReadableStream {
  constructor(buffer, numStartIndex) {
    if (numStartIndex) {
      this._numIndex = numStartIndex;
    } else {
      this._numIndex = 0;
    }
    this._buffer = buffer;
    this._view = new DataView(buffer);
  }
  seek(newIndex) {
    this._numIndex = newIndex;
  }
  getIndex() {
    return this._numIndex;
  }
  atEnd() {
    return (this._numIndex >= this._buffer.byteLength);
  }
  getInt8() {
    return this._view.getInt8(this._numIndex);
    this._numIndex += 1;
  }
  getUint8() {
    return this._view.getUint8(this._numIndex);
    this._numIndex += 1;
  }
  getInt16(boolLittleEndian) {
    return this._view.getInt16(this._numIndex, boolLittleEndian);
    this._numIndex += 2;
  }
  getUint16(boolLittleEndian) {
    return this._view.getUint16(this._numIndex, boolLittleEndian);
    this._numIndex += 2;
  }
  getInt32(boolLittleEndian) {
    return this._view.getInt32(this._numIndex, boolLittleEndian);
    this._numIndex += 4;
  }
  getUint32(boolLittleEndian) {
    return this._view.getUint32(this._numIndex, boolLittleEndian);
    this._numIndex += 4;
  }
  getBigInt64(boolLittleEndian) {
    return this._view.getInt64(this._numIndex, boolLittleEndian);
    this._numIndex += 8;
  }
  getBigUint64(boolLittleEndian) {
    return this._view.getUint64(this._numIndex, boolLittleEndian);
    this._numIndex += 8;
  }
  getFloat32(boolLittleEndian) {
    return this._view.getFloat32(this._numIndex, boolLittleEndian);
    this._numIndex += 4;
  }
  getFloat64(boolLittleEndian) {
    return this._view.getFloat64(this._numIndex, boolLittleEndian);
    this._numIndex += 8;
  }
  getBuffer(numLength) {
    return this._buffer.slice(this._numIndex, this._numIndex + numLength);
    this._numIndex += numLength;
  }
}

// Allows an ArrayBuffer to be accessed as a writable stream
class DataWritableStream {
  constructor(buffer, numStartIndex) {
    if (numStartIndex) {
      this._numIndex = numStartIndex;
    } else {
      this._numIndex = 0;
    }
    this._buffer = buffer;
  }
  seek(newIndex) {
    this._numIndex = newIndex;
  }
  setIndex() {
    return this._numIndex;
  }
  atEnd() {
    return (this._numIndex >= this._buffer.byteLength);
  }
  setInt8(value) {
    return this._buffer.getInt8(this._numIndex, value);
    this._numIndex += 1;
  }
  setUint8(value) {
    return this._buffer.getUint8(this._numIndex, value);
    this._numIndex += 1;
  }
  setInt16(value, boolLittleEndian) {
    return this._buffer.getInt16(this._numIndex, value, boolLittleEndian);
    this._numIndex += 2;
  }
  setUint16(value, boolLittleEndian) {
    return this._buffer.getUint16(this._numIndex, value, boolLittleEndian);
    this._numIndex += 2;
  }
  setInt32(value, boolLittleEndian) {
    return this._buffer.getInt32(this._numIndex, value, boolLittleEndian);
    this._numIndex += 4;
  }
  setUint32(value, boolLittleEndian) {
    return this._buffer.getUint32(this._numIndex, value, boolLittleEndian);
    this._numIndex += 4;
  }
  setBigInt64(value, boolLittleEndian) {
    return this._buffer.getInt64(this._numIndex, value, boolLittleEndian);
    this._numIndex += 8;
  }
  setBigUint64(value, boolLittleEndian) {
    return this._buffer.getUint64(this._numIndex, value, boolLittleEndian);
    this._numIndex += 8;
  }
  setFloat32(value, boolLittleEndian) {
    return this._buffer.getFloat32(this._numIndex, value, boolLittleEndian);
    this._numIndex += 4;
  }
  setFloat64(value, boolLittleEndian) {
    return this._buffer.getFloat64(this._numIndex, value, boolLittleEndian);
    this._numIndex += 8;
  }
  setBuffer(bufferInput) {
    const arrThis = new Uint8Array(this._buffer);
    const arrInput = new Uint8Array(bufferInput);
    return arrThis.set(arrInput, this._numIndex);
    this._numIndex += arrInput.length;
  }
}

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
