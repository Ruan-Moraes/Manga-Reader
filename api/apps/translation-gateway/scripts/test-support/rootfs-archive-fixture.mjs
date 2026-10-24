export function pax(key, value) {
  const payload = Buffer.concat([
    Buffer.from(" " + key + "="),
    Buffer.from(value),
    Buffer.from("\n"),
  ]);
  let size = payload.length + 1;
  while (size !== String(size).length + payload.length)
    size = String(size).length + payload.length;
  return Buffer.concat([Buffer.from(String(size)), payload]);
}
export function member(
  path,
  {
    type = "0",
    bytes = Buffer.from("data"),
    link = "",
    uid = 0,
    mode = 0o444,
    extended = [],
  } = {},
) {
  const header = Buffer.alloc(512);
  header.write(path, 0, 100);
  header.write(mode.toString(8).padStart(7, "0") + "\0", 100);
  header.write(uid.toString(8).padStart(7, "0") + "\0", 108);
  header.write("0000000\0", 116);
  header.write(bytes.length.toString(8).padStart(11, "0") + "\0", 124);
  header.write("00000000001\0", 136);
  header.fill(32, 148, 156);
  header.write(type, 156);
  header.write(link, 157, 100);
  header.write("ustar\0", 257);
  header.write("00", 263);
  const checksum = header.reduce((sum, byte) => sum + byte, 0);
  header.write(checksum.toString(8).padStart(6, "0") + "\0 ", 148);
  const raw = Buffer.concat([
    header,
    bytes,
    Buffer.alloc((512 - (bytes.length % 512)) % 512),
  ]);
  if (!extended.length) return raw;
  return Buffer.concat([
    member("PaxHeader", {
      type: "x",
      bytes: Buffer.concat(extended.map(([key, value]) => pax(key, value))),
    }),
    raw,
  ]);
}
export const archive = (members) =>
  Buffer.concat([...members, Buffer.alloc(1024)]);
