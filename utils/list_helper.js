const lodash = require('lodash')

const dummy = (blogs) => {
    return 1
}

const totalLikes = (blogs) => {
    let total = 0
    blogs.forEach(blog => {
        total += blog.likes
    })
    return total
}

const favoriteBlog = (blogs) => {
    if(blogs.length === 0){
        return null
    }
    const favorite = blogs.reduce((prev, curr) => {
        if (curr.likes > prev.likes){
            return curr
        }else{
            return prev
        }
    })
    return {
        title: favorite.title,
        author: favorite.author,
        likes: favorite.likes
    }
}

const mostBlogs = (blogs) => {
    if(blogs.length === 0){
        return null
    }
    
    let selectedAuthor = ''

    let max = 0

    blogs.forEach(blog => {
        let count = lodash.countBy(blogs, 'author')[blog.author] || 0
        if(count > max){
            max = count
            selectedAuthor = blog.author
        }
    })

    return {
        author: selectedAuthor,
        blogs: max
    }

}

const mostLikes = (blogs) => {

    if(blogs.length === 0){
        return null
    }

    let selectedAuthor = ''
    
    let max = 0

    const groupedByAuthor = lodash.groupBy(blogs, 'author')

    for(const author in groupedByAuthor){
        let sum = 0
        groupedByAuthor[author].forEach(blog => {
            sum += blog.likes
        })
        if(sum > max){
            max = sum
            selectedAuthor = author
        }
    }
    
    
    return {
        author: selectedAuthor,
        likes: max
    }
}

module.exports = {
    dummy,
    totalLikes,
    favoriteBlog,
    mostBlogs,
    mostLikes
}