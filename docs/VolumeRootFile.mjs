/*
(c) 2022 Scot Watson  All Rights Reserved
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

// Creates the on-disk representation of a record
export function createRecord(numRecordType, objData) {
  switch (numRecordType) {
    case 0x60BA:  // Add File / Change File Key
      {
        // 12 byte header
        // 4 byte file ID
        // 32 byte key
        const bufferRecord = new ArrayBuffer(48);
        const viewRecord = new DataView(bufferRecord);
        writeHeader(viewRecord, 36);
        viewRecord.setUint32(12, objData.numFileId, true);
        viewRecord.set(16, objData.bufferKey);
        return bufferRecord;
      }
    case 0xE4B7:  // Remove File
      {
        // 12 byte header
        // 4 byte file ID
        const bufferRecord = new ArrayBuffer(16);
        const viewRecord = new DataView(bufferRecord);
        writeHeader(viewRecord, 4);
        viewRecord.setUint32(12, objData.numFileId, true);
        return bufferRecord;
      }
    default:
      throw new Error("");
  }
  function writeHeader(viewRecord, numRecordDataLength) {
    viewRecord.setBigInt64(Date.now(), 0);
    viewRecord.setUint16(numRecordType, 8);
    viewRecord.setUint16(numRecordDataLength, 10);
  }
}

// Incrementally adds record to existing root.encrypt file
// handleRootFile: (FileSystemFileHandle)
// bufferRootKey: (ArrayBuffer, length = 32)
// numRecordType: (Number)
// objData: (Object)
export function addRecordToRootFile(handleRootFile, bufferRootKey, numRecordType, objData) {
  return appendFile_AES256_CBC(createRecord(handleRootFile, bufferRootKey, numRecordType, objData));
}

export function appendFile_AES256_CBC(handleFile, bufferKey, bufferDataToAppend) {
  const promiseGetFile = handleFile.getFile();
  const promiseGetStream = handleFile.createWritable();
  const promiseAppendHelper = promiseGetFile
    .then(function (file) {
      return appendHelper_AES256_CBC(file, bufferKey, bufferDataToAppend);
    });
  const promiseWriteBlocks = Promise.all( [ promiseAppendHelper, promiseGetStream] )
    .then(function ( [ objAppendData, stream ] ) {
      return writeLastBlocks(objAppendData, stream);
    });
  return promiseWriteBlocks;
  function writeLastBlocks(bufferAppendData, streamWritable) {
    streamWritable.seek(bufferAppendData.pos);
    streamWritable.write(bufferAppendData.data);
  }
}

export function appendHelper_AES256_CBC(blob, bufferKey, bufferDataToAppend) {
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
    const promiseIV = file.slice(numIvStart, numLastBlockStart).arrayBuffer();
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
