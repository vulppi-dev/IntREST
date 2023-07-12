// app/video/route.ts
import { createReadStream } from "fs";
async function GET(ctx) {
  const stream = createReadStream("assets/video.mp4");
  return {
    status: 200,
    body: stream,
    headers: {
      "Content-Type": "video/mp4"
    }
  };
}
export {
  GET
};
