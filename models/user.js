/** User class for message.ly */
const db = require("../db")
const bcrypt = require("bcrypt")
const expressError = require("../expressError");
const { BCRYPT_WORK_FACTOR } = require("../config");
const { user } = require("../db");
const ExpressError = require("../expressError");


/** User of the site. */

class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({username, password, first_name, last_name, phone}) {
    let hashedPass = await bcrypt.hash(password, BCRYPT_WORK_FACTOR)
    const result = await db.query(
      `INSERT INTO users (
        username,
        password,
        first_name,
        last_name,
        phone,
        join_at,
        last_login_at)
        VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
        RETURNING username, password, first_name, last_name, phone`,
        [username, hashedPass, first_name, last_name, phone])
    
    return result.rows[0]
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) { 
    const result = await db.query(
      `SELECT password FROM users WHERE username = $1`,
      [username])
      let user = result.rows[0]
      console.log(user, "this is the user in the User authenticate method")
      return user && await bcrypt.compare(password, user.password)
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) { 
      const result = await db.query(
        `UPDATE users
          SET last_login_at = current_timestamp
          WHERE username = $1
          RETURNING username`,
          [username])
      
      if (!result.rows[0]) {
        throw new ExpressError(`No such user: ${username}`, 404)
      }
  }

  
  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() { 
      const results = await db.query(
        `SELECT username,
        first_name,
        last_name,
        phone
        FROM users
        ORDER BY username`)
      
      return result.rows
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
      const result = await db.query(
        `SELECT username,
              first_name,
              last_name,
              phone,
              join_at,
              last_login_at
        FROM users
        WHERE username = $1`,
        [username])

      if (!result.rows[0]) {
        throw new ExpressError(`No such username`)
      }

      return result.rows[0]
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) { }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) { }
}


module.exports = User;