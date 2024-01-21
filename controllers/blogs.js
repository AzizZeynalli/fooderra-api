const blogsRouter = require("express").Router();
const Blog = require("../models/blog");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const blog = require("../models/blog");

blogsRouter.get("/", async (request, response) => {
  const blogs = await Blog.find({}).populate("user", { username: 1, email: 1 });
  response.json(blogs);
});

blogsRouter.post("/", async (request, response) => {
  const body = request.body
  const user = request.user
  const token = request.token
  if(!(token && user)){
    return response.status(401).json({ error: 'token invalid' })
  }
  const blog = new Blog({
    title: body.title,
    content: body.content,
    likes: body.likes || 0,
    imageUrl: body.imageUrl,
    user: user._id,
    dateCreated: new Date(),
  });
  if (blog.title) {
    const savedBlog = await blog.save();
    await savedBlog.populate("user");
    user.blogs = user.blogs.concat(savedBlog._id);
    await user.save();
    response.status(201).json(savedBlog);
  } else {
    response.status(400).end();
  }
});

blogsRouter.get("/:id", async (request, response, next) => {
  const blog = await Blog.findById(request.params.id).populate("user", { username: 1, email: 1, avatar: 1 }).populate("whoLiked", { username: 1, avatar: 1 });;
  if (blog) {
    response.json(blog);
  } else {
    response.status(404).end();
  }
});

blogsRouter.delete("/:id", async (request, response, next) => {
  const user = request.user;
  const token = request.token;
  if (!(token && user)) {
    return response.status(401).json({ error: "token invalid" });
  }
  const blog = await Blog.findById(request.params.id);
  if (blog.user.toString() === user.id.toString()) {
    await Blog.findByIdAndRemove(request.params.id);
    response.status(204).end();
  } else {
    response
      .status(401)
      .json({ error: "lack of valid authentication credentials" });
  }
});

blogsRouter.delete("/", async (request, response, next) => {
  await Blog.deleteMany({});
  response.status(204).end();
});

blogsRouter.put(
  "/:id",
  async (request, response, next) => {
    try {
      const body = request.body;
      const newBlog = {
        id: body.id,
        title: body.title,
        content: body.content,
        likes: body.likes || 0,
        imageUrl: body.imageUrl 
      };
      if (newBlog.title) {
        const updatedBlog = await Blog.findByIdAndUpdate(
          request.params.id,
          newBlog,
          { new: true }
        ).populate("user", { username: 1, email: 1 });
        response.status(200).json(updatedBlog);
      } else {
        response.status(400).end();
      }
    } catch (exception) {
      next(exception);
    }
  }
);

blogsRouter.patch("/:id/like", async (request, response, next) => {
  try {
    const blog = await Blog.findById(request.params.id);
    const user = request.user;
    if (!user) {
      return response.status(401).json({ error: "token invalid" });
    }
    if (blog && !blog.whoLiked.includes(user.id)) {
      blog.likes += 1;
      blog.whoLiked = [...blog.whoLiked, user.id];
      await blog.save();
      response.status(200).json(blog);
    } else {
      response.status(404).end();
    }
  } catch (exception) {
    next(exception);
  }
});

blogsRouter.patch("/:id/removelike", async (request, response, next) => {
  try {
    const blog = await Blog.findById(request.params.id);
    const user = request.user;
    if (!user) {
      response.status(401).json({ error: "token invalid" });
    }
    if (blog && blog.whoLiked.includes(user.id)) {
      blog.likes -= 1;
      blog.whoLiked = blog.whoLiked.filter((id) => id !== user.id);
      await blog.save();
      response.status(200).json(blog);
    } else {
      response.status(404).end();
    }
  } catch (exception) {
    next(exception);
  }
});

module.exports = blogsRouter;
