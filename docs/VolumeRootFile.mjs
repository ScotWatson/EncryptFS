/*
(c) 2022 Scot Watson  All Rights Reserved
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

// Creates the on-disk representation of a record
export function createRecord(numRecordType, objData) {
  switch (numRecordType) {
    case 0x0000:
      break;
    default:
      break;
  }
}

// Incrementally adds record 
// handleRootFile: (FileSystemFileHandle)
// bufferRootKey: (ArrayBuffer, length = 32)
// bufferRecord: (ArrayBuffer)
export function addRecordToRootFile(handleRootFile, bufferRootKey, bufferRecord) {
}
export function appendFile_AES256_CBC(handleFile, bufferKey, bufferDataToAppend) {
  const promiseGetFile = handleFile.getFile();
  const promiseGetStream = handleFile.createWritable();
  promiseGetFile
    .then(function (file) {
      return append_AES256_CBC(file, bufferKey, bufferDataToAppend);
    });
  Promise.all( [ promiseEncryptSlices, promiseGetStream] )
    .then(function ( [  ] ) {
      return writeLastBlocks();
    });
  function writeLastBlocks(bufferCurrentData, streamWritable) {
    streamWritable.seek();
    streamWritable.write(bufferCurrentData);
  }
}
export function append_AES256_CBC(blob, bufferKey, bufferDataToAppend) {
  const numLen = blob.length;
  if (len < 0x20) {
    return Promise.reject(new Error("File too short"));
  }
  const numIvStart = numLen - 0x20;
  const numLastBlockStart = numLen - 0x10;
  const promiseGetFileSlices = promiseGetFile.then(getFileSlices);
  const promiseDecryptSlices = promiseGetFileSlices
    .then(function ( [ bufferIv, bufferLastBlock ] ) {
      return decrypt_AES256_CBC(bufferLastBlock, bufferKey, bufferIv);
    });
  const promiseAddData = promiseDecryptSlices.then(addData);
  const promiseEncryptSlices = Promise.all( [ promiseAddData, promiseGetFileSlices ] )
    .then(function ( [ bufferNewData, [ bufferIv, bufferLastBlock ] ] ) {
      return encrypt_AES256_CBC(bufferLastBlocks, bufferKey, bufferIv);
    });
  const promiseWrapData = promiseEncryptSlices.then(function (bufferNewFileData) {
    return {
      pos: numLastBlockStart,
      data: bufferNewFileData,
    };
  });
  return promiseWrapData;
  function getFileSlices(file) {
    const promiseIV = file.slice(numIvStart, numIvStart + 0x10).arrayBuffer();
    const promiseLastBlock = file.slice(numLastBlockStart, numLen).arrayBuffer();
    return Promise.all( [ promiseIV, promiseLastBlock ] );
  }
  function addData( bufferCurrentData ) {
    const bufferNewData = new ArrayBuffer();
    bufferNewData.set(bufferCurrentData);
    bufferNewData.set(bufferDataToAppend, bufferCurrentData.byteLength);
    return bufferNewData;
  }
}

export class VolumeRootFile {
  // Represents a volume root file
  // blobFile: (Blob, optional) 
  constructor(blobFile) {
    this._records = [];
  }
  // Adds a record to the file
  // numType: 
  // objData: 
  // Returns: (ArrayBuffer) The record as it will appear in the file
  addRecord(numType, objData) {
  }
  // Remove unnecessary records from the file
  purge() {
  }
  // Creates a Blob with the current records
  // Returns: (Blob) Entire file containing all records
  save() {
  }
}
