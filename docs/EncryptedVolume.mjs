export class EncryptedVolume {
  constructor(hdlFolder, bufferKey) {
    this._arrRootEntries = [];
    function getRootFile() {
      return hdlFolder.getFileHandle("root.encrypt", {create: false});
    }
    function readRootFile(bufferKey) {
      const fileRoot = fileHandleRoot.getFile();
      const blobRootFile = readEncryptFile(bufferKey, fileRoot.arrayBuffer());
      const bufferContents = blobRootFile.arrayBuffer();
      const streamContents = new DataReadableStream(bufferContents);
      this._arrRootEntries.clear();
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
          this._arrRootEntries.push(record);
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
