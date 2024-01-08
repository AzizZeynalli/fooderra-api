const blogsRouter = require("express").Router();
const Blog = require("../models/blog");
const User = require("../models/user");
const multer = require("multer");
const jwt = require("jsonwebtoken");

const upload = multer();

blogsRouter.get("/", async (request, response) => {
  const blogs = await Blog.find({}).populate("user", { username: 1, email: 1 });
  response.json(blogs);
});

blogsRouter.post("/", upload.single("image"), async (request, response) => {
  const body = request.body;
  const token = request.headers.token;

  const { email } = jwt.verify(token, process.env.SECRET);
  const user = await User.findOne({ email });

  if (!(token && user)) {
    return response.status(401).json({ error: "token invalid" });
  }
  const blog = new Blog({
    title: body.title,
    content: body.content,
    likes: body.likes || 0,
    image: request.file.buffer.toString("base64"),
    user: user._id,
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
  const blog = await Blog.findById(request.params.id);
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
  upload.single("image"),
  async (request, response, next) => {
    try {
      const body = request.body;
      const newBlog = {
        id: body.id,
        title: body.title,
        content: body.content,
        likes: body.likes || 0,
        image: request.file ? request.file.path : body.image, // if a new image file is uploaded, use it, otherwise keep the old image
      };
      if (newBlog.url && newBlog.title) {
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

module.exports = blogsRouter;
