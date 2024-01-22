const bcrypt = require("bcryptjs");
const usersRouter = require("express").Router();
const User = require("../models/user");

usersRouter.get("/details", async (request, response) => {
  const user = request.user;
  const token = request.token;
  if (!(token && user)) {
    return response.status(401).json({ error: "token invalid" });
  }

  const populatedUser = await User.findById(user._id).populate("blogs", { id: 1, title: 1, content: 1, imageUrl :1, likes: 1, createdAt: 1 });

  response.json({
    username: populatedUser.username,
    email: populatedUser.email,
    likedRecipes: populatedUser.likedRecipes,
    blogs: populatedUser.blogs,
    likedBlogs: populatedUser.likedBlogs,
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
    blogs: [],
  });
  const savedUser = await user.save();
  response.status(201).json(savedUser);
});

usersRouter.get("/", async (request, response) => {
  const users = await User.find({}).populate("blogs", { title: 1, content: 1, imageUrl :1, likes: 1 });
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
    user.likedRecipes.unshift(meal);
}
  await user.save();
  const populatedUser = await User.findById(user._id).populate('blogs', { id: 1, title: 1, content: 1, imageUrl: 1, likes: 1, dateCreated: 1});

  response
    .status(200)
    .json({
      username: populatedUser.username,
      email: populatedUser.email,
      likedRecipes: populatedUser.likedRecipes,
      blogs: populatedUser.blogs,
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
  const populatedUser = await User.findById(user._id).populate('blogs', { id: 1, title: 1, content: 1, imageUrl: 1, likes: 1, dateCreated: 1});

  response
    .status(200)
    .json({
      username: populatedUser.username,
      email: populatedUser.email,
      likedRecipes: populatedUser.likedRecipes,
      blogs: populatedUser.blogs,
      token,
    });
});

usersRouter.patch("/resetpassword", async (request, response) => {
  const { password } = request.body;
  const user = request.user;
  const token = request.token;
  if (!(token && user)) {
    return response.status(401).json({ error: "token invalid" });
  }
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);
  user.passwordHash = passwordHash;
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
