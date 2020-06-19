/** Reservation for Lunchly */

const moment = require("moment");

const db = require("../db");

const Customer = require("./customer");


/** A reservation for a party */

class Reservation {
  constructor({ id, customerId, numGuests, startAt, notes }) {
    this.id = id;
    this.customerId = customerId;
    this.numGuests = numGuests;
    this.startAt = startAt;
    this.notes = notes;
  }

  /** formatter for startAt */

  getformattedStartAt() {
    return moment(this.startAt).format('MMMM Do YYYY, h:mm a');
  }

  /** given a customer id, find their reservations. */

  static async getReservationsForCustomer(customerId) {
    const results = await db.query(
      `SELECT id, 
           customer_id AS "customerId", 
           num_guests AS "numGuests", 
           start_at AS "startAt", 
           notes AS "notes"
         FROM reservations 
         WHERE customer_id = $1`,
      [customerId]
    );

    return results.rows.map(row => new Reservation(row));
  }

  static async getTopTenByReservations() {
    const results = await db.query(
      `SELECT customers.id, 
            first_name AS "firstName",  
            last_name AS "lastName", 
            phone, 
            customers.notes
      FROM reservations
      JOIN customers
      ON customers.id = reservations.customer_id
      GROUP BY customers.id
      ORDER BY COUNT(customers.id) DESC
      LIMIT 10`);

    return results.rows;
  }

  async save() {
    if (this.id === undefined) { //this instance doesn't exist yet
      let result = await db.query(`
      INSERT INTO reservations (customer_id, num_guests, start_at, notes)
      VALUES ($1, $2, $3, $4)
      RETURNING id`,
        [this.customerId, this.numGuests, this.startAt, this.notes]);
      this.id = result.rows[0].id;
    }
    else { //instance exists
      await db.query(
        `UPDATE reservations 
         SET customer_id=$1, num_guest=$2, start_at=$3, notes=$4
         WHERE id=$5`,
        [this.customerId, this.numGuests, this.startAt, this.notes, this.id]
      );
    }
  }
}


module.exports = Reservation;
