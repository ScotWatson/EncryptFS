/*
(c) 2022 Scot Watson  All Rights Reserved
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

// Allows an ArrayBuffer to be accessed as a readable stream
export class DataReadableStream {
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
export class DataWritableStream {
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
