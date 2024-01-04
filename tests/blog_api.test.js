const mongoose = require('mongoose')
mongoose.set("bufferTimeoutMS", 40000)
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)
const Blog = require('../models/blog')
const helper = require('./test_helper')
const bcrypt = require('bcryptjs')
const User = require('../models/user')

beforeEach(async () => {
    await Blog.deleteMany({})
    const blogObjects = helper.initialBlogs.map(blog => new Blog(blog))
    const promiseArray = blogObjects.map(blog => blog.save())
    await Promise.all(promiseArray)
})

describe('getting all blogs', () => {

    test('blog posts are returned as json and the amount is correct', async () => {
        const response = await api
          .get('/api/blogs')
          .expect(200)
          .expect('Content-Type', /application\/json/)
        expect(response.body).toHaveLength(helper.initialBlogs.length);
    }, 100000)
    
    test('unique identifier is named id, not _id', async () => {
        const response = await api.get('/api/blogs')
        expect(response.body.some((blog) => blog.hasOwnProperty('id'))).toBeDefined()
    })
})

describe('addition of a new blog', () => {
    let token = null
    beforeAll(async () => {
      await User.deleteMany({})
      const passwordHash = await bcrypt.hash('sekret', 10)
      const user = new User({ username: 'root', passwordHash })
      await user.save()
      const response = await api
          .post('/api/login')
          .send(user)
      const token = response.body.token
    })

    test('new blog post is added successfully', async () => {
        const newPost = {
            title: 'fourth',
            author: 'Sahib',
            url: 'youtube.com',
            likes: 100
        }
        await api
          .post('/api/blogs')
          .send(newPost)
          .setHeader('Authorization', 'Bearer'+token)
          .expect(201)
          .expect('Content-Type', /application\/json/)
        const response = await api.get('/api/blogs')
        const titles = response.body.map(blog => blog.title)
        const blogsAtEnd = await helper.blogsInDb()
        expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)
        expect(titles).toContain(
            'fourth'
        )
    })

    if('creation of a new blog fails if the token is not provided', async () => {

    })

    test('if like number not given, then likes=0', async () => {
        const newPost = {
            title: 'fifth',
            author: 'Vali',
            url: 'telegram.com',
        }
        const createdBlog = await api
          .post('/api/blogs')
          .send(newPost)
          .expect(201)
        expect(createdBlog.body.likes).toBe(0)
    })

    test('if url or title is missing, status bad request', async() => {
        const newPost = {
            title:'',
            author: 'James',
            url: '',
        }
        await api
          .post('/api/blogs')
          .send(newPost)
          .expect(400)
    })
})

describe('deletion of a blog', () => {
    test('deletion status code 204 if valid id', async () => {
        const blogsAtStart = await helper.blogsInDb()
        const blogToDelete = blogsAtStart[0]
        await api
          .delete(`/api/blogs/${blogToDelete.id}`)
          .expect(204)
        const blogsAtEnd = await helper.blogsInDb()
        expect(blogsAtEnd).toHaveLength(blogsAtStart.length - 1)
        const blogTitles = blogsAtEnd.map(blog => blog.title)
        expect(blogTitles).not.toContain(blogToDelete.title)
    })
})

describe('update of a blog', () => {
    test('update successful if valid id', async () => {
        const blogsAtStart = await helper.blogsInDb()
        const blogToUpdate = blogsAtStart[0]
        const id = blogToUpdate.id
        const updatedBlog = {
            title:'first',
            author: 'Aziz',
            url: 'facebook.com',
            likes: 565,
        }
        await api
          .put(`/api/blogs/${id}`)
          .send(updatedBlog)
          .expect(200) 
        const find = await Blog.findById(id)
        expect(find.likes).toBe(565)
    })
})

describe('when there is initially one user in db', () => {
    beforeEach(async () => {
      await User.deleteMany({})
      const passwordHash = await bcrypt.hash('sekret', 10)
      const user = new User({ username: 'root', passwordHash })
      await user.save()
    })
  
    test('creation succeeds with a fresh username', async () => {
      const usersAtStart = await helper.usersInDb()
      
      const newUser = {
        username: 'mluukkai',
        name: 'Matti Luukkainen',
        password: 'salainen',
      }

      await api
        .post('/api/users')
        .send(newUser)
        .expect(201)
        .expect('Content-Type', /application\/json/)
  
      const usersAtEnd = await helper.usersInDb()
      expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)
  
      const usernames = usersAtEnd.map(u => u.username)
      expect(usernames).toContain(newUser.username)

    test('creation fails with proper statuscode and message if username already taken', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'root',
            name: 'Superuser',
            password: 'salainen',
        }

        const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        expect(result.body.error).toContain('expected `username` to be unique')

        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toEqual(usersAtStart)
    })

    test('creation fails with proper statuscode and message if username or password is less than 3 characters long', async () => {
      const usersAtStart = await helper.usersInDb()

      const newUser = {
        username: 'car',
        name: 'Shersy',
        password: 'shersy1998'
      }

      const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)
      
      expect(result.body.error).toContain('username and password length should be at least 3')

      const usersAtEnd = await helper.usersInDb()
      expect(usersAtEnd).toEqual(usersAtStart)
    })
  })
})

afterAll(async () => {
    await mongoose.connection.close()
})

// npm test -- tests/blog_api.test.js