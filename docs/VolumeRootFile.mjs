/*
(c) 2022 Scot Watson  All Rights Reserved
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

// Incrementally adds record 
// handleRootFile: (FileSystemFileHandle)
// bufferRootKey: (ArrayBuffer, length = 32)
// bufferFileId: (ArrayBuffer, length = 4)
// buferFileKey: (ArrayBuffer, length = 32)
export function addRecordToRootFile(handleRootFile, bufferRootKey, bufferFileId, bufferFileKey) {
  const bufferNewRecord = new ArrayBuffer();
  const promiseGetRootFile = handleRootFile.getFile();
  promiseGetRootFile.then(getFileSlices).then(decryptLastBlock);
  function getFileSlices(file) {
    const len = file.length;
    if (len < 0x20) {
      throw new Error("File too short");
    }
    const promiseIV = file.slice(len - 0x20, len - 0x10).arrayBuffer();
    const promiseLastBlock = file.slice(len - 0x10, len).arrayBuffer();
    return Promise.all( [ promiseIV, promiseLastBlock ] );
  }
  function decryptLastBlock( [ bufferIv, bufferLastBlock ] ) {
    return decrypt_AES256_CBC(bufferLastBlock, bufferRootKey, bufferIv);
  }
  function addData( bufferCurrentData ) {
    const bufferNewData = new ArrayBuffer();
    bufferNewData.set(bufferCurrentData);
    bufferNewData.set(bufferNewRecord);
  }
  function encryptLastBlocks( bufferLastBlocks ) {
    return decrypt_AES256_CBC(bufferLastBlock, bufferRootKey, bufferIv);
  }
  function writeLastBlocks() {
  }
  bufferRootKey;
  bufferFileId;
  bufferFileKey;
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
