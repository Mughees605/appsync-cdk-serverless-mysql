"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const createPost_1 = require("./createPost");
exports.handler = async (event) => {
    console.log(event);
    switch (event.field) {
        case 'createPost':
            return await createPost_1.default(event.arguments.post);
        default:
            return null;
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDZDQUFzQztBQUd0QyxPQUFPLENBQUMsT0FBTyxHQUFHLEtBQUssRUFBRSxLQUFtQixFQUFFLEVBQUU7SUFDNUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQTtJQUNsQixRQUFRLEtBQUssQ0FBQyxLQUFLLEVBQUU7UUFDakIsS0FBSyxZQUFZO1lBQ2IsT0FBTyxNQUFNLG9CQUFVLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNsRDtZQUNJLE9BQU8sSUFBSSxDQUFDO0tBQ25CO0FBQ0wsQ0FBQyxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGNyZWF0ZVBvc3QgZnJvbSAnLi9jcmVhdGVQb3N0JztcbmltcG9ydCB7IEFwcFN5bmNFdmVudCB9IGZyb20gXCIuL3R5cGVzL1wiXG5cbmV4cG9ydHMuaGFuZGxlciA9IGFzeW5jIChldmVudDogQXBwU3luY0V2ZW50KSA9PiB7XG4gICAgY29uc29sZS5sb2coZXZlbnQpXG4gICAgc3dpdGNoIChldmVudC5maWVsZCkge1xuICAgICAgICBjYXNlICdjcmVhdGVQb3N0JzpcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCBjcmVhdGVQb3N0KGV2ZW50LmFyZ3VtZW50cy5wb3N0KTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn0iXX0=