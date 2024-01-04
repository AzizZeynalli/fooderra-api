const Blog = require('../models/blog')
const User = require('../models/user')

const initialBlogs = [
    {
        title: 'first',
        author: 'Aziz',
        url: 'facebook.com',
        likes: 12,
    },
    {
        title: 'second',
        author: 'Said',
        url: 'instagram.com',
        likes: 40,

    },
    {
        title: 'third',
        author: 'Vaqif',
        url: 'linkedin.com',
        likes: 23,
    },
]

const blogsInDb = async () => {
    const blogs = await Blog.find({})
    return blogs.map(blog => blog.toJSON())
}

const usersInDb = async () => {
    const users = await User.find({})
    return users.map(user => user.toJSON())
}

module.exports = {
    initialBlogs, blogsInDb, usersInDb
}