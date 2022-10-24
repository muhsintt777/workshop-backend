const User = require('../models/User')
const Note = require('../models/Note')
const asyncHandler = require('express-async-handler')
const bcrypt = require('bcrypt')
const { findById } = require('../models/User')

const getAllUsers = asyncHandler(
    async (req, res) => {
        const users = await User.find().select('-password').lean()
        if (!users?.length) {
            return res.status(400).json({ message: 'users not found' })
        }
        res.json(users)
    }
)


const createNewUser = asyncHandler(
    async (req, res) => {
        const { username, password, roles } = req.body

        //confirm data
        if (!username || !password || !Array.isArray(roles) || !roles.length) {
            return res.status(400).json({ message: 'All fields are required' })
        }

        //check for dublicate
        const dublicate = await User.findOne({username}).lean().exec()
        if (dublicate) {
            return res.status(409).json({ message: 'dublicate user'})
        }

        //hash password
        const hashedPwd = await bcrypt.hash(password, 10) //10 salt rounds

        //create and store new user
        const userObject = { username, "password": hashedPwd, roles }
        const user = await User.create(userObject)
        if (user) {
            res.status(201).json({ message: `new user ${username} created` })
        } else {
            res.status(400).json({ message: 'invalid user data recieved'})
        }
    }
)


const updateUser = asyncHandler(
    async (req, res) => {

        const { id,username, roles, active, password } = req.body

        //confirm data
        if (!id || !username || !Array.isArray(roles) || !roles.length || typeof active !== Boolean) {
            return res.status(400).json({ message: 'All fields are required' })
        }

        const user = await User.findById(id).exec()
        if (!user) {
            return res.status(400).json({ message: 'user not found' })
        }

        //check for dublicate
        const dublicate = await User.findOne({ username }).lean().exec()
        if (dublicate && dublicate?._id.toString() !== id) {
            return res.status(409).json({ message: 'dublicate username' })
        }

        //down mehtod only work on existing datas
        user.username = username
        user.roles = roles
        user.active = active

        if (password) {
            //hash password
            user.password = await bcrypt.hash(password, 10) //salt round 10
        }

        const updatedUser = await user.save()

        res.json({ message: `${updatedUser.username} updated`})

    }
)


const deleteUser = asyncHandler(
    async (req, res) => {

        const { id } = req.body

        if (!id) {
            return res.status(400).json({ message: 'user ID required'})
        }

        const notes = await Note.findOne({ user: id }).lean().exec()
        if (notes?.length) {
            return res.status(400).json({ message: 'user has assigned notes' })
        }

        const user = await findById(id).exec()
        if (!user) {
            return res.status(400).json({ message: 'user not found'})
        }

        const result = await user.deleteOne()

        const reply = `Username ${result.username} with ID ${result._id} deleted`

        res.json(reply)

    }
)

module.exports = {
    getAllUsers,
    createNewUser,
    updateUser,
    deleteUser
}