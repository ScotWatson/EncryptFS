throw new Error("Module can not load - Scot Watson");

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
