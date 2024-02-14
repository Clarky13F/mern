const { User, Book } = require('../models');
const { signToken } = require('../utils/auth');
const { Mongoose } = require('mongoose');

const resolvers = {
    Query: {
        me: async (parent, args, context) => {
            if (context.user) {
                const userData = await User.findOne({ _id: context.user._id })
                    .select('-__v -password')
                    .populate('savedBooks');

                return userData;
            }
            throw new Error('Not logged in');
        },
    },

    Mutation: {
        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });

            if (!user) {
                throw new Error('Invalid email or password');
            }

            const correctPw = await user.isCorrectPassword(password);

            if (!correctPw) {
                throw new Error('Invalid email or password');
            }

            const token = signToken(user);
            return { token, user };
        },

        addUser: async (parent, { username, email, password }) => {
            const user = await User.create({ username, email, password });
            const token = signToken(user);

            return { token, user };
        },

        saveBook: async (parent, { bookData }, context) => {
            if (context.user) {
                const updatedUser = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $addToSet: { savedBooks: bookData } },
                    { new: true }
                ).populate('savedBooks');

                return updatedUser;
            }
            throw new Error('You need to be logged in to perform this action');
        },

        removeBook: async (parent, { bookId }, context) => {
            if (context.user) {
                console.log(context.user._id)
                const articleId = Mongoose.Types.ObjectId(context.user._id);

                const result = await User.findByIdAndRemove (
                    { _id: articleId, 'savedBooks.bookId': bookId },
                    { projection: { _id: 0, savedBooks: 1 }, new: true }
                );

                if (!result) {
                    throw new Error('Book not found in user\'s savedBooks');
                }

                // const updatedUser = await User.findOneAndUpdate(
                //     { _id: context.user._id },
                //     { $pull: { savedBooks: { bookId } } },
                //     { new: true, upsert: false }
                // ).populate('savedBooks');
                //console.log(updatedUser.savedBooks.length);
                return context.user;
            }
            throw new Error('You need to be logged in to perform this action');
        },
    },

    User: {
        bookCount: (parent) => parent.savedBooks.length,
    },

    Book: {
        bookId: (parent) => parent.id,
    },
};

module.exports = resolvers;