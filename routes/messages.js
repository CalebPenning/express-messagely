const Router = require("express").Router
const db = require("../db")
const Message = require("../models/message")
const { ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth")
const ExpressError = require("../expressError")

const router = new Router()

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/

router.get("/:id", ensureLoggedIn, async (req, res, next) => {
    try {
        const message = await Message.get(req.params.id)

        if (req.user.username !== message.from_user && req.user.username !== message.to_user) {
            throw new ExpressError(
                `You can only access this message if you are associated with it.`, 400
            )
        }

        if (!message) {
            throw new ExpressError(`Message with id of ${req.params.id} does not exist.`, 404)
        }

        return res.json({ message })
    }

    catch(e) {

    }
})


/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post('/', ensureLoggedIn, async (req, res, next) => {
    try {
        const fromUser = req.user.username
        const { toUser, body } = req.body

        const message = await Message.create(fromUser, toUser, body)

        if (message) return res.json({ message })
    }

    catch(e) {
        return next(e)
    }
})


/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

router.post("/:id/read", ensureLoggedIn, async (req, res, next) => {
    try {
        const message = await Message.get(req.params.id)

        if (message.to_user.username !== req.user.username) {
            throw new ExpressError("Only the user the message is intended for can mark the message as read.", 400)
        }

        Message.markRead(req.params.id)
    }

    catch(e) {
        return next(e)
    }
})

module.exports = router