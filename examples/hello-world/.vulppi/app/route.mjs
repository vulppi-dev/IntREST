// app/route.ts
async function GET(ctx) {
  return {
    status: 200,
    body: "Hello World!"
  };
}
export {
  GET
};
