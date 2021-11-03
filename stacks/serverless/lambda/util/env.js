"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnvVar = void 0;
function getEnvVar(name, defaultValue) {
    var _a;
    const res = (_a = process.env[name]) !== null && _a !== void 0 ? _a : defaultValue;
    if (typeof res === 'undefined') {
        throw new Error(`Environment variable '${name}' is not defined`);
    }
    return res;
}
exports.getEnvVar = getEnvVar;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW52LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZW52LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQVVBLFNBQWdCLFNBQVMsQ0FBQyxJQUE4QixFQUFFLFlBQXFCOztJQUM5RSxNQUFNLEdBQUcsU0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxtQ0FBSSxZQUFZLENBQUM7SUFDOUMsSUFBSSxPQUFPLEdBQUcsS0FBSyxXQUFXLEVBQUU7UUFDL0IsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsSUFBSSxrQkFBa0IsQ0FBQyxDQUFDO0tBQ2pFO0lBQ0QsT0FBTyxHQUFHLENBQUM7QUFDWixDQUFDO0FBTkQsOEJBTUMiLCJzb3VyY2VzQ29udGVudCI6WyJ0eXBlIEVudlZhck5hbWUgPVxuXHR8ICdEQl9IT1NUJ1xuXHR8ICdEQl9VU0VSJ1xuXHR8ICdEQl9QQVNTV09SRCdcblx0fCAnREJfUE9SVCdcblx0fCAnREJfTkFNRSdcblx0fCAnREJfU0VDUkVUJ1xuXG50eXBlIEVudkZsYWdOYW1lID0gbmV2ZXI7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRFbnZWYXIobmFtZTogRW52VmFyTmFtZSB8IEVudkZsYWdOYW1lLCBkZWZhdWx0VmFsdWU/OiBzdHJpbmcpOiBzdHJpbmcge1xuXHRjb25zdCByZXMgPSBwcm9jZXNzLmVudltuYW1lXSA/PyBkZWZhdWx0VmFsdWU7XG5cdGlmICh0eXBlb2YgcmVzID09PSAndW5kZWZpbmVkJykge1xuXHRcdHRocm93IG5ldyBFcnJvcihgRW52aXJvbm1lbnQgdmFyaWFibGUgJyR7bmFtZX0nIGlzIG5vdCBkZWZpbmVkYCk7XG5cdH1cblx0cmV0dXJuIHJlcztcbn0iXX0=