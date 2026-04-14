import index from "../../index.html";

const server = Bun.serve({
  port: Number(process.env.PORT ?? 5173),
  development: true,
  routes: {
    "/": index,
  },
  fetch() {
    return new Response("Not found", { status: 404 });
  },
});

console.log(`Residue dev server: http://localhost:${server.port}`);
