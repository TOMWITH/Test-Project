const crypto = require("crypto");
const https = require("https");
const OSS_CONFIG = require("./oss-config");

const corsXml = `<CORSConfiguration>
  <CORSRule>
    <AllowedOrigin>*</AllowedOrigin>
    <AllowedMethod>GET</AllowedMethod>
    <AllowedMethod>POST</AllowedMethod>
    <AllowedMethod>PUT</AllowedMethod>
    <AllowedMethod>HEAD</AllowedMethod>
    <AllowedMethod>DELETE</AllowedMethod>
    <AllowedHeader>*</AllowedHeader>
    <ExposeHeader>ETag</ExposeHeader>
    <ExposeHeader>x-oss-request-id</ExposeHeader>
    <MaxAgeSeconds>3600</MaxAgeSeconds>
  </CORSRule>
</CORSConfiguration>`;

const contentType = "application/xml";
const date = new Date().toUTCString();
const resource = `/${OSS_CONFIG.bucket}/?cors`;
const stringToSign = `PUT\n\n${contentType}\n${date}\n${resource}`;
const signature = crypto
  .createHmac("sha1", OSS_CONFIG.accessKeySecret)
  .update(stringToSign)
  .digest("base64");

const options = {
  hostname: `${OSS_CONFIG.bucket}.${OSS_CONFIG.endpoint}`,
  path: "/?cors",
  method: "PUT",
  headers: {
    "Content-Type": contentType,
    Date: date,
    Authorization: `OSS ${OSS_CONFIG.accessKeyId}:${signature}`,
    "Content-Length": Buffer.byteLength(corsXml),
  },
};

const req = https.request(options, (res) => {
  let data = "";
  res.on("data", (c) => (data += c));
  res.on("end", () => {
    console.log("CORS config status:", res.statusCode);
    if (data) console.log(data);
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log("Bucket CORS 配置成功");
    }
  });
});
req.on("error", (e) => console.error("Error:", e.message));
req.write(corsXml);
req.end();
