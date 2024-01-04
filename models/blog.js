const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const model = mongoose.model;

const blogSchema = new Schema({
    title: String,
    author: String,
    url: String,
    likes: Number,
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
})

blogSchema.set('toJSON', {
    transform: (document, returnedObject) => {
      returnedObject.id = returnedObject._id.toString()
      delete returnedObject._id
      delete returnedObject.__v
    }
})

module.exports =  model('Blog', blogSchema)