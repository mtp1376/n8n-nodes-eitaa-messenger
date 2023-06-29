import { TLDeserialization } from "./tl_utils.js";


function parseResponse(data) {
  const res = [];
  var deserializer = new TLDeserialization(new Uint8Array(data), { mtproto: true })
  const g = deserializer.fetchObject("", "INPUT");
  res.push(g);
  if (g.packed_data) {
    var deserializerx = new TLDeserialization(new Uint8Array(g.packed_data), { mtproto: true })
    res.push(deserializerx.fetchObject("", "INPUT"));
  }
  return res;
}

function range(size, startAt = 0) {
  return [...Array(size).keys()].map(i => i + startAt);
}

export { parseResponse, range };
