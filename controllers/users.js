const bcrypt = require("bcryptjs");
const usersRouter = require("express").Router();
const User = require("../models/user");

usersRouter.get("/details", async (request, response) => {
  const user = request.user;
  const token = request.token;
  if (!(token && user)) {
    return response.status(401).json({ error: "token invalid" });
  }
  response.json({
    username: user.username,
    email: user.email,
    likedRecipes: user.likedRecipes,
    blogs: user.blogs,
    token,
  });
});

usersRouter.post("/", async (request, response) => {
  const { username, email, password } = request.body;
  if (!(username && password)) {
    return response
      .status(400)
      .json({ error: "both username and password required" });
  }
  if (username.length < 3 || password.length < 3) {
    return response
      .status(400)
      .json({ error: "username and password length should be at least 3" });
  }
  const userInDb = await User.findOne({ username });
  if (userInDb) {
    console.log(userInDb);
    return response
      .status(400)
      .json({ error: "expected `username` to be unique" });
  }
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);
  const user = new User({
    username,
    email,
    passwordHash,
    likedRecipes: [],
  });
  const savedUser = await user.save();
  response.status(201).json(savedUser);
});

usersRouter.get("/", async (request, response) => {
  const users = await User.find({}).populate("blogs", { title: 1, likes: 1 });
  response.json(users);
});

usersRouter.delete("/", async (request, response) => {
  await User.deleteMany({});
  response.status(204).end();
});

usersRouter.patch("/like", async (request, response) => {
  const { meal } = request.body;
  const user = request.user;
  const token = request.token;
  if (!(token && user)) {
    return response.status(401).json({ error: "token invalid" });
  }
  if (user.likedRecipes.length === 0) {
    user.likedRecipes.push(meal);
  } else if (!user.likedRecipes.some((likedRecipe) => likedRecipe.idMeal === meal.mealId)) {
    user.likedRecipes = [...user.likedRecipes, meal];
  }

  await user.save();
  response
    .status(200)
    .json({
      username: user.username,
      email: user.email,
      likedRecipes: user.likedRecipes,
      token,
    });
});

usersRouter.patch("/removelike", async (request, response) => {
  const { mealId } = request.body;
  const user = request.user;
  const token = request.token;
  if (!(token && user)) {
    return response.status(401).json({ error: "token invalid" });
  }
  if (user.likedRecipes.some((recipe) => recipe.idMeal === mealId)) {
    user.likedRecipes = user.likedRecipes.filter((recipe) => recipe.idMeal !== mealId);
  }
  await user.save();
  response
    .status(200)
    .json({
      username: user.username,
      email: user.email,
      likedRecipes: user.likedRecipes,
      token,
    });
});

module.exports = usersRouter;
