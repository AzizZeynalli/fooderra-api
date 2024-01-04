const bcrypt = require('bcryptjs')
const usersRouter = require('express').Router()
const User = require('../models/user')

usersRouter.post('/', async (request, response) => {
    const { username, name, password } = request.body
    if(!(username && password)){
        return response.status(400).json({ error: "both username and password required" })
    }
    if(username.length < 3 || password.length < 3){
        return response.status(400).json({ error: "username and password length should be at least 3" })
    }
    const userInDb = await User.findOne({ username })
    if(userInDb){
        console.log(userInDb)
        return response.status(400).json({ error: "expected `username` to be unique" })
    }
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)
    const user = new User({
        username,
        name,
        passwordHash
    })
    const savedUser = await user.save()
    response.status(201).json(savedUser)
})

usersRouter.get('/', async (request, response) => {
    const users = await User.find({}).populate('blogs', { title: 1, author: 1, url: 1, likes: 1 })
    response.json(users)
})

usersRouter.delete('/', async (request, response) => {
    await User.deleteMany({})
    response.status(204).end()
})

module.exports = usersRouter