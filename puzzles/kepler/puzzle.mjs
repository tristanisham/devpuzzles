/**
 * @typedef {import("../../puzzle-api").PuzzleConfig}
 */
const config = {
  name: "Kepler",
  description: "Help a transgalactic spaceshit get back to his journey",
  author: "Tristan Isham",
  routes: [
    {
      path: "/",
      method: "GET",
      handler: (req, res) => {

        res.render("kepler/prompt");
      },
    },
  ],
};

export default config;
