/**
 * @typedef {import("../../puzzle-api").PuzzleConfig}
 */
const config = {
  name: "dummy",
  description: "This is just a test config for my import function",
  author: "Tristan Isham",
  routes: [
    {
      path: "/",
      method: "GET",
      handler: (req, res) => {
        res.send("Success!");
      },
    },
  ],
};

export default config;
